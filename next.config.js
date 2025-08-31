/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: [],
  },
  // 기존 imgs 폴더의 이미지들을 사용하기 위한 설정
  async rewrites() {
    return [
      {
        source: '/imgs/:path*',
        destination: '/imgs/:path*',
      },
    ]
  },
}

module.exports = nextConfig
