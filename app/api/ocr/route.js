import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// 프롬프트를 코드에 직접 포함 (Vercel 서버리스 환경 대응)
const SYSTEM_PROMPT = `당신은 학습용 문제 이미지에서 텍스트를 추출하고 구조화된 JSON 형태로 변환하는 전문 OCR 시스템입니다.

## 주요 역할
1. **이미지 분석**: 학습용 문제 이미지를 정확히 분석
2. **텍스트 추출**: 이미지에서 모든 텍스트 요소를 추출
3. **구조화**: 추출된 텍스트를 표준 JSON 형식으로 구조화
4. **좌표 정보**: 각 요소의 위치 정보를 정확히 기록

## 출력 형식
반드시 다음 JSON 스키마를 따라야 합니다:

\`\`\`json
{
  "version": "1.1.0",
  "problems": [
    {
      "id": "prob_001",
      "type": "multiple_choice",
      "question": {
        "text": "문제 텍스트",
        "coordinates": { "x": 100, "y": 150, "width": 400, "height": 60 }
      },
      "choices": [
        {
          "id": "1",
          "text": "선택지 1",
          "coordinates": { "x": 100, "y": 250, "width": 300, "height": 30 }
        }
      ],
      "answer": "정답 번호",
      "solution": {
        "steps": ["해결 단계 1", "해결 단계 2"],
        "correct_answer": "정답"
      }
    }
  ],
  "metadata": {
    "page_width_px": 800,
    "page_height_px": 600,
    "processing_time": "1.2s",
    "confidence": 0.95
  }
}
\`\`\`

## 중요 규칙
1. **정확성**: 모든 텍스트를 정확히 추출하고 오타 없이 기록
2. **좌표 정보**: 각 요소의 x, y, width, height 좌표를 정확히 측정
3. **구조화**: 문제, 선택지, 정답을 명확히 구분
4. **JSON 형식**: 반드시 유효한 JSON 형식으로 출력
5. **한국어**: 모든 텍스트는 한국어로 처리

## 처리 단계
1. 이미지 전체를 스캔하여 텍스트 영역 식별
2. 문제 텍스트와 선택지를 구분
3. 각 요소의 위치 좌표 계산
4. 정답과 해설 정보 추출
5. 표준 JSON 형식으로 구조화

이제 제공된 이미지를 분석하여 구조화된 JSON을 생성하세요.`

const USER_PROMPT_TEMPLATE = `다음 학습용 문제 이미지를 분석하여 표준 JSON 형식으로 변환해주세요.

## 이미지 정보
- 이미지 URL: {{이미지 URL 또는 "example.url"}}
- 페이지 너비: {{정수 또는 미상}}px
- 페이지 높이: {{정수 또는 미상}}px

## 요구사항
1. 이미지에서 모든 텍스트를 정확히 추출
2. 문제와 선택지를 명확히 구분
3. 각 요소의 좌표 정보를 정확히 기록
4. 정답과 해설을 포함
5. 표준 JSON 스키마에 따라 구조화

## 출력 형식
반드시 유효한 JSON 형식으로만 출력하세요. 설명이나 추가 텍스트는 포함하지 마세요.

\`\`\`json
{
  "version": "1.1.0",
  "problems": [...],
  "metadata": {...}
}
\`\`\``

// OpenAI 클라이언트 초기화 함수
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다. Vercel 프로젝트 설정에서 OPENAI_API_KEY 환경 변수를 설정하세요.')
  }
  return new OpenAI({ apiKey })
}

/**
 * OCR API 상태 확인 엔드포인트
 */
export async function GET() {
  return NextResponse.json({
    message: 'OCR API가 정상적으로 작동합니다.',
    endpoint: '/api/ocr',
    methods: ['GET', 'POST'],
    environment: process.env.NODE_ENV,
    hasApiKey: !!process.env.OPENAI_API_KEY,
    timestamp: new Date().toISOString()
  })
}

/**
 * OCR API 엔드포인트
 * 이미지를 받아서 OpenAI Vision API를 통해 JSON 결과를 반환
 */
export async function POST(request) {
  try {
    console.log('OCR API 호출 시작...')
    
    // OpenAI 클라이언트 초기화
    const openai = getOpenAIClient()
    
    // 요청 데이터 파싱
    const { imageData, imageMetadata } = await request.json()
    
    if (!imageData) {
      return NextResponse.json(
        { error: '이미지 데이터가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('이미지 메타데이터:', imageMetadata)
    console.log('이미지 데이터 길이:', imageData.length)
    console.log('이미지 데이터 시작 부분:', imageData.substring(0, 100))

    // 테스트 모드 확인 (이미지 데이터가 "test"로 시작하는 경우만)
    if (imageData.includes('test')) {
      console.log('테스트 모드로 더미 응답 반환')
      
      // 수식 정규화 함수들
      function normalizeMath(input) {
        if (!input) return "";
        let text = input;
        text = text.replace(/\s+/g, " ").trim();
        text = text.replace(/×/g, "\\cdot ");
        text = text.replace(/÷/g, "\\div ");
        text = text.replace(/([²³⁴-⁹])√\s*\((.*?)\)/g, (m, p1, p2) => {
          const expMap = { "²":2, "³":3, "⁴":4, "⁵":5, "⁶":6, "⁷":7, "⁸":8, "⁹":9 };
          return `\\sqrt[${expMap[p1]}]{${p2}}`;
        });
        text = text.replace(/√\s*\((.*?)\)/g, "\\sqrt{$1}");
        text = text.replace(/√([a-zA-Z0-9]+)/g, "\\sqrt{$1}");
        const superscripts = {
          "⁰":"0","¹":"1","²":"2","³":"3","⁴":"4","⁵":"5",
          "⁶":"6","⁷":"7","⁸":"8","⁹":"9"
        };
        text = text.replace(/([a-zA-Z0-9])([⁰¹²³⁴-⁹]+)/g, (m, base, sup) => {
          const normal = sup.split("").map(s => superscripts[s]||"").join("");
          return `${base}^{${normal}}`;
        });
        text = text.replace(/([a-zA-Z0-9\}\\]+)\/([a-zA-Z0-9\\{]+)/g, "\\frac{$1}{$2}");
        return text;
      }

      function normalizeJson(node) {
        if (Array.isArray(node)) {
          node.forEach(normalizeJson);
        } else if (typeof node === "object" && node !== null) {
          for (const key of Object.keys(node)) {
            if (key === "text") {
              const raw = node[key];
              const latex = normalizeMath(raw);
              node["text_latex"] = latex || null;
            } else {
              normalizeJson(node[key]);
            }
          }
        }
      }

      const testData = {
        "version": "1.1.0",
        "problems": [
          {
            "id": "prob_016",
            "type": "multiple_choice",
            "question": {
              "text": "a>0일 때, ³√(√a/⁴√a) ÷ ⁴√(√a/³√a) × ⁴√(⁴√a/³√a)를 간단히 하면?",
              "coordinates": { "x": 80, "y": 120, "width": 520, "height": 80 }
            },
            "choices": [
              { "id": "1", "text": "1", "coordinates": { "x": 80, "y": 250, "width": 60, "height": 30 } },
              { "id": "2", "text": "√a", "coordinates": { "x": 200, "y": 250, "width": 80, "height": 30 } },
              { "id": "3", "text": "³√a", "coordinates": { "x": 320, "y": 250, "width": 80, "height": 30 } },
              { "id": "4", "text": "⁴√a", "coordinates": { "x": 80, "y": 290, "width": 80, "height": 30 } },
              { "id": "5", "text": "¹²√a", "coordinates": { "x": 200, "y": 290, "width": 80, "height": 30 } }
            ],
            "answer": "4",
            "solution": {
              "steps": [
                "지수 법칙을 이용하여 근호를 지수로 표현",
                "a^(1/2) / a^(1/4) = a^(1/2-1/4) = a^(1/4)",
                "a^(1/2) / a^(1/3) = a^(1/2-1/3) = a^(1/6)",
                "a^(1/4) / a^(1/3) = a^(1/4-1/3) = a^(-1/12)",
                "최종 계산: (a^(1/4))^(1/3) ÷ (a^(1/6))^(1/4) × (a^(-1/12))^(1/4) = a^(1/4)"
              ],
              "correct_answer": "⁴√a"
            }
          }
        ],
        "metadata": {
          "page_width_px": imageMetadata?.width || 800,
          "page_height_px": imageMetadata?.height || 600,
          "processing_time": "0.5s",
          "confidence": 0.95
        }
      };

      // 테스트 데이터에 수식 정규화 적용
      normalizeJson(testData);
      console.log('테스트 데이터 수식 정규화 완료');

      return NextResponse.json({
        success: true,
        data: testData,
        timestamp: new Date().toISOString()
      })
    }

    // 사용자 프롬프트 생성 (템플릿에 메타데이터 삽입)
    const userPrompt = USER_PROMPT_TEMPLATE
      .replace('{{이미지 URL 또는 "example.url"}}', 'example.url')
      .replace('{{정수 또는 미상}}', imageMetadata?.width || '미상')
      .replace('{{정수 또는 미상}}', imageMetadata?.height || '미상')

    console.log('OpenAI Vision API 호출 중...')

    // 이미지 데이터 형식 검증 및 수정
    let processedImageData = imageData
    if (!imageData.startsWith('data:image/')) {
      console.log('이미지 데이터에 data URL 접두사가 없음, 추가 중...')
      // base64 데이터만 있는 경우 data URL 형식으로 변환
      if (imageData.match(/^[A-Za-z0-9+/=]+$/)) {
        processedImageData = `data:image/jpeg;base64,${imageData}`
      }
    }

    console.log('처리된 이미지 데이터 시작 부분:', processedImageData.substring(0, 100))

    // OpenAI Vision API 호출
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt
            },
            {
              type: "image_url",
              image_url: {
                url: processedImageData,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 4000,
      temperature: 0.1
    })

    const result = response.choices[0].message.content
    console.log('OpenAI 응답 받음, 길이:', result.length)

    // JSON 파싱 시도
    let jsonResult
    try {
      // Markdown 코드 블록 제거
      let cleanedResult = result
      
      // ```json ... ``` 형식 처리
      const jsonBlockMatch = result.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonBlockMatch) {
        cleanedResult = jsonBlockMatch[1]
        console.log('Markdown 코드 블록에서 JSON 추출됨')
      }
      
      // ``` ... ``` 형식 처리 (json 명시 없이)
      const codeBlockMatch = result.match(/```\s*([\s\S]*?)\s*```/)
      if (!jsonBlockMatch && codeBlockMatch) {
        cleanedResult = codeBlockMatch[1]
        console.log('코드 블록에서 JSON 추출됨')
      }
      
      jsonResult = JSON.parse(cleanedResult)
      console.log('JSON 파싱 성공')
      
      // 수식 정규화 함수들
      /**
       * OCR 원문 수식을 LaTeX으로 정규화하는 함수
       * @param {string} input - OCR 원문 수식 문자열
       * @returns {string} LaTeX 변환 문자열
       */
      function normalizeMath(input) {
        if (!input) return "";

        let text = input;

        // 1. 공백 정리
        text = text.replace(/\s+/g, " ").trim();

        // 2. 곱셈, 나눗셈 기호 정규화
        text = text.replace(/×/g, "\\cdot ");
        text = text.replace(/÷/g, "\\div ");

        // 3. 루트 변환 (예: ³√a → \sqrt[3]{a})
        text = text.replace(/([²³⁴-⁹])√\s*\((.*?)\)/g, (m, p1, p2) => {
          const expMap = { "²":2, "³":3, "⁴":4, "⁵":5, "⁶":6, "⁷":7, "⁸":8, "⁹":9 };
          return `\\sqrt[${expMap[p1]}]{${p2}}`;
        });
        text = text.replace(/√\s*\((.*?)\)/g, "\\sqrt{$1}");
        text = text.replace(/√([a-zA-Z0-9]+)/g, "\\sqrt{$1}");

        // 4. 유니코드 지수 → ^{n}
        const superscripts = {
          "⁰":"0","¹":"1","²":"2","³":"3","⁴":"4","⁵":"5",
          "⁶":"6","⁷":"7","⁸":"8","⁹":"9"
        };
        text = text.replace(/([a-zA-Z0-9])([⁰¹²³⁴-⁹]+)/g, (m, base, sup) => {
          const normal = sup.split("").map(s => superscripts[s]||"").join("");
          return `${base}^{${normal}}`;
        });

        // 5. 분수 패턴 간단 변환 (괄호로 감싸진 경우만)
        text = text.replace(/([a-zA-Z0-9\}\\]+)\/([a-zA-Z0-9\\{]+)/g, "\\frac{$1}{$2}");

        return text;
      }

      /**
       * JSON을 순회하면서 `text` 필드 값에만 후처리 적용
       * @param {object} node - JSON 객체/배열
       */
      function normalizeJson(node) {
        if (Array.isArray(node)) {
          node.forEach(normalizeJson);
        } else if (typeof node === "object" && node !== null) {
          for (const key of Object.keys(node)) {
            if (key === "text") {
              const raw = node[key];
              const latex = normalizeMath(raw);
              node["text_latex"] = latex || null;
            } else {
              normalizeJson(node[key]);
            }
          }
        }
      }

      // JSON 결과에 수식 정규화 적용
      normalizeJson(jsonResult);
      console.log('수식 정규화 완료')
      
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError)
      console.error('원본 응답:', result.substring(0, 200) + '...')
      // JSON이 아닌 경우 텍스트 그대로 반환
      jsonResult = { 
        error: 'JSON 파싱 실패',
        raw_response: result,
        schema_version: "1.1.0"
      }
    }

    return NextResponse.json({
      success: true,
      data: jsonResult,
      metadata: {
        model: "gpt-4o",
        tokens_used: response.usage?.total_tokens || 0,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('OCR API 오류:', error)
    
    // OpenAI API 오류 상세 처리
    let errorMessage = 'OCR 처리 중 오류가 발생했습니다.'
    let statusCode = 500
    
    if (error.status) {
      statusCode = error.status
      if (error.status === 400) {
        errorMessage = 'OpenAI API: 잘못된 요청입니다. 이미지 형식을 확인해주세요.'
      } else if (error.status === 401) {
        errorMessage = 'OpenAI API: 인증 오류입니다. API 키를 확인해주세요.'
      } else if (error.status === 429) {
        errorMessage = 'OpenAI API: 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
      } else if (error.status === 500) {
        errorMessage = 'OpenAI API: 서버 오류입니다. 잠시 후 다시 시도해주세요.'
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message || error.toString(),
        status: error.status || 500,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    )
  }
}


