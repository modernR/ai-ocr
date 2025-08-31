import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// HTML 렌더링 시스템 프롬프트를 코드에 직접 포함 (Vercel 서버리스 환경 대응)
const HTML_RENDER_SYSTEM_PROMPT = `중요한 문제이니 주의깊게 살펴보고 처리해줘

너는 **표준 JSON(v1.1.0)** 문제 객체를 입력받아 **단일 HTML 문서**를 생성하는 렌더러다.
출력은 **설명 없이 오직 HTML**만. 외부 의존성은 MathJax CDN만 허용.

[렌더링 규칙]

A. 레이아웃/스타일
- 폭 960px 컨테이너, 모바일 100% 폭. 시스템 폰트.
- 최상위 영역 색상: 발문 #EAF4FF, 제시문 #F1FAEE, 선택지 #FFF7E1
- JSON의 보조정보는 HTML로 변환하지 않고 제외함
- order가 없는 정보도 변환하지 않고 제외함
- 각 섹션은 라운드(12px)+얇은 테두리(#e5e7eb)+섹션 제목.
- 상단에 문항번호/문항유형/정답요구개수 배지, 원본 페이지 링크.

B. 정렬/순서
- 모든 배열은 order 오름차순으로 렌더.

C. 텍스트/수식
- 내용은 원문 유지. 수식은 MathJax로 렌더.
- text 관련 항목은 "text_latex"에 값이 있으면 해당 필드를 사용, 그렇지 않으면 "text"를 사용함 
  (오직 1개만 사용하며, text_latex가 우선)

D. 이미지/플레이스홀더 (중요)
- 이미지 URL이 **"example.url" 또는 "example.url/..."** 인 경우:
  1) 실제 이미지를 불러오지 말고 **회색 점선 테두리 박스(.img-placeholder)**로 플레이스홀더 렌더.
  2) 박스 중앙에 **"아직 이미지 저장 처리는 구현되지 않아 빈영역을 표시합니다"** 텍스트 출력.
  3) 반드시 이 플레이스홀더를 **\`<figure data-ph="true" ...>\`** 안에 넣고, (선택) \`data-aspect="w/h"\`를 부여.
- 실제 URL이면 \`<img>\`로 출력. \`inside_image_text[]\`는 이미지 위 절대배치(%)로 오버레이.

E. 표
- table.cells[].content[]를 HTML \`<table>\`로 변환. 혼합 콘텐츠 허용(텍스트/이미지/플레이스홀더).

F. 보기/선택지
- 보기 라벨(ㄱ/ㄴ/ㄷ…) 굵게. 이미지형 보기에도 동일 규칙.
- 선택지.header[]는 선택지 카드 상단 회색 보더 박스에 표시.
- 선택지.items[]는 카드 그리드(모바일 1열, 데스크톱 auto-fill 180px).
- maps_to가 있으면 카드 하단 "구성: …" 표기.

G. 정답/추정정답/해설/힌트
- 정답.choice_id가 있으면 해당 카드 초록 보더 + 배지 "정답".
- 정답이 없고 추정_정답.choice_id가 있으면 해당 카드 점선 보더 + 배지 "추정 정답", 아래에 근거 노트.
- 힌트[] 섹션 별도 렌더(텍스트/이미지/플레이스홀더 지원).
- 해설: 요약, 단계풀이(번호 목록), 정답근거, 오답피드백(선택지별), 관련개념 배지.

H. 비정규_추출
- 존재=true면 "비정규 추출" 섹션을 접기/펼치기(details)로 제공. 각 항목에 종류/텍스트/좌표/신뢰도/비고.

I. 플레이스홀더 세로 자동 축소(공백 제거) — **공통 스크립트/스타일을 HTML에 반드시 포함**
- CSS (기본 폭 유지, 세로는 JS가 계산):
  <style>
    .img-placeholder{
      display:flex;align-items:center;justify-content:center;
      width:100%;min-height:80px;
      border:2px dashed #9ca3af;border-radius:8px;color:#6b7280;
      background:#fafafa;padding:12px;text-align:center;font-size:12px
    }
  </style>
- JS (문서 하단에 포함):
  <script>
  (function(){
    function pct(v){return Math.max(0,Math.min(100,parseFloat(String(v).replace('%',''))||0));}
    function fitPH(){
      document.querySelectorAll('figure[data-ph="true"]').forEach(fig=>{
        const ph=fig.querySelector('.img-placeholder'); if(!ph) return;
        const overlays=fig.querySelectorAll('.overlay-text');
        const w=fig.clientWidth||ph.clientWidth||0;
        let maxBottom=0;
        overlays.forEach(el=>{
          const top=pct(el.style.top), h=pct(el.style.height);
          maxBottom=Math.max(maxBottom, top+h);
        });
        let hpx;
        if(maxBottom>0){
          // 오버레이 하단까지만 + 여백 16px, 과도한 높이 방지
          hpx=Math.max(60, Math.min(w*(maxBottom/100), w*0.95))+16;
        }else{
          // 오버레이 없으면 data-aspect="w/h" 또는 기본 3:2
          const asp=fig.dataset.aspect||'3/2';
          const [aw,ah]=asp.split('/').map(Number);
          const ratio=(aw>0&&ah>0)?(ah/aw):(2/3);
          hpx=w*ratio;
        }
        ph.style.height=\`\${Math.round(hpx)}px\`;
        fig.style.height='auto';
      });
    }
    window.addEventListener('load',fitPH);
    window.addEventListener('resize',()=>{clearTimeout(window.__phT);window.__phT=setTimeout(fitPH,80);});
  })();
  </script>

J. 코드 품질
- HTML5 한 파일 완결(<style>, <script> 내장). 주석 최소화, 불필요한 인라인 스타일 금지.
- 클래스 예시: .section--stem, .section--material, .section--choices, .img-placeholder, .choice-card, .overlay-text, .note 등.

**출력은 HTML 문자열만 포함한다.**`

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
    
    // 호출 시마다 완전 초기화
    console.log('=== HTML 렌더링 API 초기화 시작 ===')
    
    // OpenAI 클라이언트 초기화 (매 호출마다 새로 생성)
    const openai = getOpenAIClient()
    console.log('OpenAI 클라이언트 초기화 완료')
    
    // 요청 데이터 파싱
    const { jsonData } = await request.json()
    
    if (!jsonData) {
      return NextResponse.json(
        { error: 'JSON 데이터가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('JSON 데이터 크기:', JSON.stringify(jsonData).length, '문자')



    // JSON을 문자열로 변환하여 사용자 메시지로 전송 - 매 호출마다 새로 생성
    const jsonString = JSON.stringify(jsonData, null, 2)
    console.log('JSON 문자열 변환 완료')

    console.log('OpenAI API 호출 중 (HTML 렌더링)...')

    // OpenAI API 호출 - 매 호출마다 새로운 메시지 배열 생성
    const messages = [
      {
        role: "system",
        content: HTML_RENDER_SYSTEM_PROMPT
      },
      {
        role: "user",
        content: `다음 표준 JSON(v1.1.0) 문제 객체를 HTML로 렌더링해줘:\n\n${jsonString}`
      }
    ]

    console.log('메시지 배열 생성 완료 (시스템 + 사용자 메시지)')
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
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
        model: "gpt-4o",
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


