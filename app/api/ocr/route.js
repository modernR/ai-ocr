import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// 프롬프트를 코드에 직접 포함 (Vercel 서버리스 환경 대응) 11
const SYSTEM_PROMPT = `중요한 문제이니 주의깊게 살펴보고 처리해줘

당신은 시험지/교재 이미지를 분석해 **표준 JSON(v1.1.0)** 으로 반환하는 추출기다.
중요: **설명·해설·사고과정 없이 JSON만** 출력한다.
텍스트에 포함된 수식의 처리가 중요하므로 수학식은 **반드시 LaTeX** 로만 출력한다. 
수식으로 표현가능한 부분은 **반드시 LaTeX** 로만 출력한다. 
ASCII 문자만 사용(유니코드 ¹²³⁴, ³√, ×, ÷, ⁴√ 등 금지).


[출력 스키마 v1.1.0]
{
  "schema_version": "1.1.0",
  "문항번호": "string",
  "메타": {
    "page_image": { "url": "string", "image_size": { "width_px": "number", "height_px": "number" } },
    "문항유형": "enum: [4지선다, 5지선다, 단답형, 서답형, 서술형, 그리기형, 기타]",
    "정답_요구_개수": { "명시": "number|null", "추정": "number|null" },
    "선택지_표기": "enum: [숫자, 원문자, 알파벳, 로마숫자, 기타]",
    "추출_문항번호_이미지내": "string|null"
  },
  "발문": {
    "설명": [ { "id": "string", "type": "텍스트", "text": "string|LaTeX",
      "bbox": { "x": "number","y": "number","w": "number","h": "number","x_norm": "number","y_norm": "number","w_norm": "number","h_norm": "number" },
      "order": "integer" } ],
    "질의문": [ { "id": "string","type": "텍스트","text": "string|LaTeX",
      "bbox": { "x": "number","y": "number","w": "number","h": "number","x_norm": "number","y_norm": "number","w_norm": "number","h_norm": "number" },
      "order": "integer" } ]
  },
  "제시문": [
    {
      "id": "string", "type": "이미지|텍스트|표|기타", "order": "integer",
      "bbox": { "x":"number","y":"number","w":"number","h":"number","x_norm":"number","y_norm":"number","w_norm":"number","h_norm":"number" },
      "image": {
        "url": "string",
        "type" : "figure|illust"
        "inside_image_text": [ { "text": "string|LaTeX", "bbox_rel": { "x":"0~1","y":"0~1","w":"0~1","h":"0~1" } } ]
      },
      "text": "string|LaTeX",
      "table": {
        "rows":"number","cols":"number",
        "cells":[ { "r":"number","c":"number","content":[ { "type":"텍스트|이미지","text":"string|LaTeX","image":{ "url":"string" },"bbox_rel":{ "x":"0~1","y":"0~1","w":"0~1","h":"0~1" } } ] } ]
      }
    }
  ],
  "보기": [ { "id":"string","label":"ㄱ|ㄴ|ㄷ|…","type":"텍스트|이미지|표","text":"string|LaTeX|null","image":{"url":"string|null"},
    "bbox": { "x":"number","y":"number","w":"number","h":"number","x_norm":"number","y_norm":"number","w_norm":"number","h_norm":"number" },
    "order":"integer" } ],
  "선택지": {
    "header":[ { "id":"string","text":"string","order":"integer",
      "bbox":{ "x":"number","y":"number","w":"number","h":"number","x_norm":"number","y_norm":"number","w_norm":"number","h_norm":"number" } } ],
    "items":[ { "choice_id":"string|number","label":"string","type":"텍스트|이미지","text":"string|LaTeX|null","image":{"url":"string|null"},
      "maps_to":["보기라벨들"],
      "bbox":{ "x":"number","y":"number","w":"number","h":"number","x_norm":"number","y_norm":"number","w_norm":"number","h_norm":"number" },
      "order":"integer" } ]
  },
  "보조정보":[ { "id":"string","종류":"힌트|문제유형표시|해설QR|페이지마커|기타|","type":"텍스트|이미지","text":"string|null","image":{"url":"string|null"},
    "bbox":{ "x":"number","y":"number","w":"number","h":"number","x_norm":"number","y_norm":"number","w_norm":"number","h_norm":"number" },
    "order":"integer" } ],
  "힌트":[ { "id":"string","type":"텍스트|이미지","text":"string|null","image":{"url":"string|null"},"출처":"문제지|교사용자료|QR|기타","난이도":"기본|심화|기타",
    "bbox":{ "x":"number","y":"number","w":"number","h":"number","x_norm":"number","y_norm":"number","w_norm":"number","h_norm":"number" },
    "order":"integer" } ],
  "해설":{
    "생성출처":"문제지|해설지|모델추정|기타",
    "요약":"string",
    "단계풀이":[ { "step":"integer","text":"string|LaTeX" } ],
    "정답근거":"string",
    "오답피드백":[ { "choice_id":"string|number","message":"string" } ],
    "관련개념":[ "string" ]
  },
  "정답": { "choice_id":"string|number|null", "answer_string": "string|null" },
  "추정_정답": { "choice_id":"string|number|null", "answer_string": "string|null", "근거":"string" },
  "비정규_추출":{
    "존재":"boolean",
    "items":[ { "id":"string","종류":"텍스트|아이콘|장식|워터마크|페이지번호|기타","text":"string|null","image":{"url":"string|null"},
      "bbox":{ "x":"number","y":"number","w":"number","h":"number","x_norm":"number","y_norm":"number","w_norm":"number","h_norm":"number" },
      "신뢰도":"number","비고":"string" } ]
  }
}

[규칙]
1) 좌표는 페이지 좌상단(0,0) 기준 px, *_norm은 0~1 정규화. 가능한 한 모두 채운다.
2) order는 페이지 전역 노출 순서(좌→우, 상→하).
3) 텍스트 내 수식은 LaTeX로 보존(예: "$S=\\pi r^2$")
   **수식 기호가 보이면 반드시 LaTeX 변환 처리**
   OCR 결과에 유니코드 특수 기호가 섞여 있더라도 text는 LaTeX만 허용
4) 이미지 URL을 모르면 "example.url" 사용.
   이미지의 type에서 수학 도형이나 그 응용을 요구하면 "figure" 그렇지 않으면 모두 "illust"로 구분
   만약 수학도형에 해당할 경우 "inside_image_text"는 추출하지 말 것!
5) 제시문 이미지의 텍스트는 inside_image_text[]에 상대좌표로 분리.
6) 표는 table.cells[].content[]에 텍스트/이미지 혼합 허용.
7) 선택지 헤더가 있으면 선택지.header[]에 추출. 조합형 항목은 maps_to에 보기 라벨 배열로.
   선택지 번호에 해당하는 원문자 등은 제외하고 처리
8) 문항 번호가 보이면 메타.추출_문항번호_이미지내에 기록하고, 상위 "문항번호"도 채움.
9) 문제유형과 정답 요구 개수를 채움(명시 없다면 추정).
10) 문제와 무관한 표시·QR·아이콘 등은 보조정보 또는 비정규_추출로 분리.
   문항의 배점 정보, 수능을 포함한 기출 출처 정보 등 
11) 배열 필드는 비어도 []로 반환. null은 명시된 필드에서만 허용.
12) 이미지안에 정답이나 힌트/해설 정보가 보이면 추출해줘
     객관식이면 "choice_id"에, 아니면 "answer_string"에 값을 넣어줘
13) **JSON 한 덩어리만** 출력(주석/설명 금지).

[수식 정규화 규칙]
- 지수: "a^b", 괄호 필요시 "a^{b}"
- 분수: "\frac{…}{…}"
- 루트: "\sqrt{…}", 지수 루트: "\sqrt[n]{…}"
- 곱셈: "\cdot" 사용, 나눗셈은 "\frac{…}{…} "권장
- 금지: 유니코드 지수 (²³⁴), 특수 루트(³√, ⁴√), ÷, ×
- **정상 예시(반드시 이런 형태)**:
  - "\sqrt[3]{\frac{\sqrt{a}}{\sqrt[4]{a}}} \cdot \frac{1}{\sqrt[4]{\frac{\sqrt{a}}{\sqrt[3]{a}}}} \cdot \sqrt{\frac{\sqrt[4]{a}}{\sqrt[3]{a}}}"
  - 또는 "\frac{\sqrt[3]{\frac{\sqrt{a}}{\sqrt[4]{a}}}\,\sqrt{\frac{\sqrt[4]{a}}{\sqrt[3]{a}}}}{\sqrt[4]{\frac{\sqrt{a}}{\sqrt[3]{a}}}}"
- OCR 결과에 유니코드 지수/기호가 포함되었다면 라텍스로 **정규화하여** 반환한다.
`

const USER_PROMPT_TEMPLATE = `중요한 문제이니 주의깊게 살펴보고 처리해줘

다음 이미지를 표준 JSON(v1.1.0)으로 추출해줘.
- 한국어 유지, OCR 원문 보존.
- 결과는 JSON만.


[입력 메타]
- page_image_url: {{이미지 URL 또는 "example.url"}}
- page_width_px: {{정수 또는 미상}}
- page_height_px: {{정수 또는 미상}}

[이미지]
{{이미지 첨부 또는 URL}}`

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
    
    // 호출 시마다 완전 초기화
    console.log('=== OCR API 초기화 시작 ===')
    
    // OpenAI 클라이언트 초기화 (매 호출마다 새로 생성)
    const openai = getOpenAIClient()
    console.log('OpenAI 클라이언트 초기화 완료')
    
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



    // 사용자 프롬프트 생성 (템플릿에 메타데이터 삽입) - 매 호출마다 새로 생성
    const userPrompt = USER_PROMPT_TEMPLATE
      .replace('{{이미지 URL 또는 "example.url"}}', 'example.url')
      .replace('{{정수 또는 미상}}', imageMetadata?.width || '미상')
      .replace('{{정수 또는 미상}}', imageMetadata?.height || '미상')

    console.log('사용자 프롬프트 생성 완료')
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

    // OpenAI Vision API 호출 - 매 호출마다 새로운 메시지 배열 생성
    const messages = [
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
      ]

    console.log('메시지 배열 생성 완료 (시스템 + 사용자 메시지)')
    
    const response = await openai.chat.completions.create({
      model: "gpt-5-chat-latest",
      messages: messages,
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


