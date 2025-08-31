import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

// OpenAI 클라이언트 초기화 함수
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    // 로컬 개발 환경에서만 파일에서 읽기
    try {
      const fileKey = fs.readFileSync(path.join(process.cwd(), 'keys/api_key.txt'), 'utf8').trim()
      return new OpenAI({ apiKey: fileKey })
    } catch (error) {
      throw new Error('OpenAI API 키가 설정되지 않았습니다. 환경 변수 OPENAI_API_KEY를 설정하거나 keys/api_key.txt 파일을 생성하세요.')
    }
  }
  return new OpenAI({ apiKey })
}

// 프롬프트 로드 함수
function loadPrompts() {
  try {
    const systemPrompt = fs.readFileSync(path.join(process.cwd(), 'prompt/system_prompt.txt'), 'utf8')
    const userPromptTemplate = fs.readFileSync(path.join(process.cwd(), 'prompt/user_prompt_template.txt'), 'utf8')
    return { systemPrompt, userPromptTemplate }
  } catch (error) {
    console.error('프롬프트 파일 로드 실패:', error)
    throw new Error('프롬프트 파일을 찾을 수 없습니다.')
  }
}

/**
 * OCR API 엔드포인트
 * 이미지를 받아서 OpenAI Vision API를 통해 JSON 결과를 반환
 */
export async function POST(request) {
  try {
    console.log('OCR API 호출 시작...')
    
    // OpenAI 클라이언트와 프롬프트 로드
    const openai = getOpenAIClient()
    const { systemPrompt, userPromptTemplate } = loadPrompts()
    
    // 요청 데이터 파싱
    const { imageData, imageMetadata } = await request.json()
    
    if (!imageData) {
      return NextResponse.json(
        { error: '이미지 데이터가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('이미지 메타데이터:', imageMetadata)

    // 사용자 프롬프트 생성 (템플릿에 메타데이터 삽입)
    const userPrompt = userPromptTemplate
      .replace('{{이미지 URL 또는 "example.url"}}', 'example.url')
      .replace('{{정수 또는 미상}}', imageMetadata?.width || '미상')
      .replace('{{정수 또는 미상}}', imageMetadata?.height || '미상')

    console.log('OpenAI Vision API 호출 중...')

    // OpenAI Vision API 호출
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
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
                url: imageData,
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
      jsonResult = JSON.parse(result)
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError)
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
    
    return NextResponse.json(
      { 
        error: 'OCR 처리 중 오류가 발생했습니다.',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * GET 요청 처리 (API 상태 확인용)
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/ocr',
    description: 'OpenAI Vision API를 통한 OCR 서비스',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
}
