export async function GET() {
  return Response.json({ 
    message: '250830 POC API가 정상적으로 작동합니다!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
}

export async function POST(request) {
  const data = await request.json()
  
  return Response.json({ 
    message: 'POST 요청을 받았습니다',
    receivedData: data,
    timestamp: new Date().toISOString()
  })
}
