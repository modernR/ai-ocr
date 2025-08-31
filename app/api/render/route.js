import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// HTML 렌더링 시스템 프롬프트를 코드에 직접 포함 (Vercel 서버리스 환경 대응)
const HTML_RENDER_SYSTEM_PROMPT = `잘 너는 **표준 JSON(v1.1.0)** 문제 객체를 입력받아 **단일 HTML 문서**를 생성하는 렌더러다.

## 주요 역할
1. **JSON 파싱**: 표준 JSON 문제 객체를 정확히 파싱
2. **HTML 생성**: 문제, 선택지, 정답을 포함한 완전한 HTML 문서 생성
3. **수식 렌더링**: 수학 기호, 첨자, 근호를 정확히 표시
4. **스타일링**: 읽기 쉽고 전문적인 CSS 스타일 적용
5. **반응형**: 다양한 화면 크기에 대응하는 반응형 디자인

## 수학 기호 처리 규칙 (매우 중요!)
수학 기호와 수식을 정확히 렌더링하기 위해 다음 규칙을 반드시 따르세요:

### 1. 근호 (Root) 처리
- ³√ → [sup]3[/sup]√ 또는 ∛
- ⁴√ → [sup]4[/sup]√ 또는 ∜
- √ → √ (제곱근)

### 2. 첨자 (Subscript/Superscript) 처리
- ³ → [sup]3[/sup]
- ⁴ → [sup]4[/sup]
- ₁ → [sub]1[/sub]
- ₂ → [sub]2[/sub]
- ₃ → [sub]3[/sub]
- ₄ → [sub]4[/sub]

### 3. 분수 처리
- a/b → [span style="display: inline-block; vertical-align: middle; text-align: center; line-height: 1.2;"][span style="border-bottom: 1px solid; padding-bottom: 2px;"]a[/span][br][span style="font-size: 0.8em;"]b[/span][/span]

### 4. 수학 연산자
- ÷ → &divide;
- × → &times;
- ± → &plusmn;
- ≠ → &ne;
- ≤ → &le;
- ≥ → &ge;

## 출력 형식
반드시 완전한 HTML 문서를 생성해야 합니다:

\`\`\`html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>문제 분석 결과</title>
    <!-- MathJax CDN 추가 -->
    <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <script>
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                displayMath: [['$$', '$$'], ['\\[', '\\]']]
            },
            svg: {
                fontCache: 'global'
            }
        };
    </script>
    <style>
        /* 2번 영역 확장화면 레이아웃에 맞춘 CSS 스타일 */
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; 
            margin: 0; 
            padding: 0; 
            background: #fafafa; 
            line-height: 1.6;
            color: #2d3748;
        }
        .container { 
            width: 100%; 
            background: white; 
            border-radius: 12px; 
            border: 1px solid #e2e8f0; 
            overflow: hidden; 
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); 
            position: relative; 
        }
        .content { 
            padding: 0.5rem; 
            background: #fafafa; 
        }
        .renderFrame { 
            padding: 0.5rem; 
            background: white; 
            margin: 0.5rem; 
            border-radius: 8px; 
            border: 1px solid #e2e8f0; 
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); 
        }
        .renderedHtml { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; 
            line-height: 1.6; 
            color: #2d3748; 
        }
        .problem { 
            background: #f8f9fa; 
            border-left: 4px solid #007bff; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 5px; 
        }
        .question { 
            font-size: 18px; 
            font-weight: 600; 
            color: #333; 
            margin-bottom: 15px; 
            line-height: 1.6; 
        }
        .question sup, .question sub { 
            font-size: 0.7em; 
        }
        .choices { 
            list-style: none; 
            padding: 0; 
        }
        .choice { 
            background: white; 
            margin: 8px 0; 
            padding: 12px; 
            border-radius: 5px; 
            border: 1px solid #e9ecef; 
            transition: all 0.3s ease; 
            line-height: 1.5; 
        }
        .choice:hover { 
            box-shadow: 0 2px 5px rgba(0,0,0,0.1); 
        }
        .choice.correct { 
            background: #d4edda; 
            border-color: #28a745; 
        }
        .choice.correct::after { 
            content: " ✅"; 
            color: #28a745; 
            font-weight: bold; 
        }
        .answer { 
            background: #d1ecf1; 
            border: 1px solid #bee5eb; 
            padding: 15px; 
            border-radius: 5px; 
            margin: 20px 0; 
        }
        .metadata { 
            background: #e2e3e5; 
            padding: 15px; 
            border-radius: 5px; 
            margin-top: 20px; 
            font-size: 14px; 
        }
        .solution { 
            background: #fff3cd; 
            border: 1px solid #ffeaa7; 
            padding: 15px; 
            border-radius: 5px; 
            margin: 20px 0; 
        }
        .step { 
            margin: 5px 0; 
            padding: 5px 0; 
            line-height: 1.5; 
        }
        /* 수학 기호 스타일 */
        .math-symbol { 
            font-family: 'Times New Roman', serif; 
        }
        .fraction { 
            display: inline-block; 
            vertical-align: middle; 
            text-align: center; 
            line-height: 1.2; 
        }
        .fraction-numerator { 
            border-bottom: 1px solid; 
            padding-bottom: 2px; 
        }
        .fraction-denominator { 
            font-size: 0.8em; 
        }
        /* 렌더링된 HTML 내부 요소 스타일 */
        .renderedHtml h1,
        .renderedHtml h2,
        .renderedHtml h3,
        .renderedHtml h4,
        .renderedHtml h5,
        .renderedHtml h6 {
            margin: 1rem 0 0.5rem 0;
            color: #2d3748;
            font-weight: 600;
        }
        .renderedHtml h1 { font-size: 1.8rem; }
        .renderedHtml h2 { font-size: 1.5rem; }
        .renderedHtml h3 { font-size: 1.3rem; }
        .renderedHtml h4 { font-size: 1.1rem; }
        .renderedHtml p {
            margin: 0.75rem 0;
            line-height: 1.6;
        }
        .renderedHtml ul,
        .renderedHtml ol {
            margin: 0.75rem 0;
            padding-left: 1.5rem;
        }
        .renderedHtml li {
            margin: 0.25rem 0;
        }
        .renderedHtml table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            overflow: hidden;
        }
        .renderedHtml th,
        .renderedHtml td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }
        .renderedHtml th {
            background: #f7fafc;
            font-weight: 600;
            color: #4a5568;
        }
        .renderedHtml tr:last-child td {
            border-bottom: none;
        }
        .renderedHtml code {
            background: #f7fafc;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.9em;
            color: #e53e3e;
        }
        .renderedHtml pre {
            background: #f7fafc;
            padding: 1rem;
            border-radius: 6px;
            overflow-x: auto;
            margin: 1rem 0;
            border: 1px solid #e2e8f0;
        }
        .renderedHtml pre code {
            background: none;
            padding: 0;
            color: #2d3748;
        }
        .renderedHtml blockquote {
            border-left: 4px solid #667eea;
            padding-left: 1rem;
            margin: 1rem 0;
            color: #4a5568;
            font-style: italic;
        }
        .renderedHtml img {
            max-width: 100%;
            height: auto;
            border-radius: 6px;
            margin: 0.5rem 0;
        }
        .renderedHtml a {
            color: #667eea;
            text-decoration: none;
        }
        .renderedHtml a:hover {
            text-decoration: underline;
        }
        @media (max-width: 768px) { 
            .content { padding: 0.75rem; } 
            .question { font-size: 16px; } 
            .renderFrame { 
                margin: 0.75rem; 
                padding: 1rem; 
            }
            .renderedHtml h1 { font-size: 1.5rem; }
            .renderedHtml h2 { font-size: 1.3rem; }
            .renderedHtml h3 { font-size: 1.1rem; }
            .renderedHtml h4 { font-size: 1rem; }
        }
        @media (max-width: 480px) {
            .renderFrame { 
                margin: 0.5rem; 
                padding: 0.75rem; 
            }
            .renderedHtml { 
                font-size: 0.9rem; 
            }
            .renderedHtml table {
                font-size: 0.8rem;
            }
            .renderedHtml th,
            .renderedHtml td {
                padding: 0.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="content">
            <div class="renderFrame">
                <div class="renderedHtml">
                    <!-- 문제 내용이 여기에 렌더링됨 -->
                </div>
            </div>
        </div>
    </div>
</body>
</html>
\`\`\`

## 중요 규칙
1. **완전한 HTML**: DOCTYPE, html, head, body 태그를 모두 포함
2. **한국어 지원**: lang="ko" 속성과 UTF-8 인코딩 설정
3. **수식 처리**: 수학 기호와 첨자를 HTML 엔티티나 적절한 태그로 변환
4. **반응형 디자인**: viewport 메타 태그와 미디어 쿼리 포함
5. **접근성**: 시맨틱 HTML과 적절한 색상 대비
6. **정답 표시**: 정답 선택지는 시각적으로 구분 (배경색, 체크마크)
7. **메타데이터**: 이미지 크기, 처리 시간, 신뢰도 정보 표시
8. **해설 포함**: solution 정보가 있다면 단계별로 표시

## 수식 변환 예시
입력: "a>0일 때, ³√(√a/⁴√a) ÷ ⁴√(√a/³√a) × ⁴√(⁴√a/³√a)를 간단히 하면?"
출력: "a>0일 때, [sup]3[/sup]√(√a/[sup]4[/sup]√a) ÷ [sup]4[/sup]√(√a/[sup]3[/sup]√a) × [sup]4[/sup]√([sup]4[/sup]√a/[sup]3[/sup]√a)를 간단히 하면?"

## 처리 단계
1. JSON 데이터에서 문제 정보 추출
2. 수학 기호와 첨자를 적절한 HTML 태그로 변환
3. 문제 텍스트와 선택지를 HTML로 변환
4. 정답 선택지에 특별한 스타일 적용
5. 메타데이터 정보를 하단에 표시
6. 해설 정보가 있다면 단계별로 표시
7. 완전한 HTML 문서 생성

이제 제공된 JSON 문제 객체를 전문적인 HTML 문서로 렌더링하세요. 수학 기호가 포함된 경우 반드시 위의 변환 규칙을 적용하세요.`

// OpenAI 클라이언트 초기화 함수
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다. Vercel 프로젝트 설정에서 OPENAI_API_KEY 환경 변수를 설정하세요.')
  }
  return new OpenAI({ apiKey })
}

/**
 * HTML 렌더링 API 상태 확인 엔드포인트
 */
export async function GET() {
  return NextResponse.json({
    message: 'HTML 렌더링 API가 정상적으로 작동합니다.',
    endpoint: '/api/render',
    methods: ['GET', 'POST'],
    environment: process.env.NODE_ENV,
    hasApiKey: !!process.env.OPENAI_API_KEY,
    timestamp: new Date().toISOString()
  })
}

/**
 * HTML 렌더링 API 엔드포인트
 * JSON 결과를 받아서 OpenAI API를 통해 HTML로 렌더링
 */
export async function POST(request) {
  try {
    console.log('HTML 렌더링 API 호출 시작...')
    
    // OpenAI 클라이언트 초기화
    const openai = getOpenAIClient()
    
    // 요청 데이터 파싱
    const { jsonData } = await request.json()
    
    if (!jsonData) {
      return NextResponse.json(
        { error: 'JSON 데이터가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('JSON 데이터 크기:', JSON.stringify(jsonData).length, '문자')



    // JSON을 문자열로 변환하여 사용자 메시지로 전송
    const jsonString = JSON.stringify(jsonData, null, 2)

    console.log('OpenAI API 호출 중 (HTML 렌더링)...')

    // OpenAI API 호출
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: HTML_RENDER_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `다음 표준 JSON(v1.1.0) 문제 객체를 HTML로 렌더링해줘:\n\n${jsonString}`
        }
      ],
      max_tokens: 4000,
      temperature: 0.1
    })

    const htmlResult = response.choices[0].message.content
    console.log('HTML 렌더링 완료, 길이:', htmlResult.length)

    // HTML 결과 검증 및 정리
    let cleanHtml = htmlResult.trim()
    
    // 코드 블록 마크다운이 있다면 제거
    if (cleanHtml.startsWith('```html')) {
      cleanHtml = cleanHtml.replace(/^```html\s*/, '').replace(/\s*```$/, '')
    } else if (cleanHtml.startsWith('```')) {
      cleanHtml = cleanHtml.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    return NextResponse.json({
      success: true,
      html: cleanHtml,
      metadata: {
        model: "gpt-4.1",
        tokens_used: response.usage?.total_tokens || 0,
        timestamp: new Date().toISOString(),
        input_size: jsonString.length
      }
    })

  } catch (error) {
    console.error('HTML 렌더링 API 오류:', error)
    
    return NextResponse.json(
      { 
        error: 'HTML 렌더링 중 오류가 발생했습니다.',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}


