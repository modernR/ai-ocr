import './globals.css'

export const metadata = {
  title: '250830 POC 프로젝트',
  description: 'React와 Next.js로 구성된 POC 프로젝트입니다.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
