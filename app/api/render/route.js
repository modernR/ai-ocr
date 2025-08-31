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

// HTML 렌더링 시스템 프롬프트 로드 함수
function loadHtmlRenderPrompt() {
  try {
    return fs.readFileSync(path.join(process.cwd(), 'prompt/html_render_system_prompt.txt'), 'utf8')
  } catch (error) {
    console.error('HTML 렌더링 프롬프트 파일 로드 실패:', error)
    throw new Error('HTML 렌더링 프롬프트 파일을 찾을 수 없습니다.')
  }
}

/**
 * HTML 렌더링 API 상태 확인 엔드포인트
 */
export async function GET() {
  return NextResponse.json({
    message: 'HTML 렌더링 API가 정상적으로 작동합니다.',
    endpoint: '/api/render',
    methods: ['GET', 'POST'],
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
    
    // OpenAI 클라이언트와 프롬프트 로드
    const openai = getOpenAIClient()
    const htmlRenderSystemPrompt = loadHtmlRenderPrompt()
    
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
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: htmlRenderSystemPrompt
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

/**
 * GET 요청 처리 (API 상태 확인용)
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/render',
    description: 'JSON을 HTML로 렌더링하는 서비스',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
}
