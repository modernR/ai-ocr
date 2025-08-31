# 250830 POC 프로젝트

React와 Next.js를 사용한 POC(Proof of Concept) 프로젝트입니다.

## 🚀 시작하기

### 필요 조건

- Node.js (v16 이상)
- npm 또는 yarn

### 설치

```bash
# 의존성 설치
npm install
```

### 개발 서버 실행

```bash
# 개발 서버 시작 (포트 3000)
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

### 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# 코드 린팅
npm run lint
```

## 📁 프로젝트 구조

```
250830_poc/
├── app/
│   ├── api/           # API Routes
│   ├── globals.css    # 전역 스타일
│   ├── layout.js      # 루트 레이아웃
│   ├── page.js        # 홈페이지
│   └── page.module.css # 페이지별 스타일
├── public/            # 정적 파일
├── imgs/              # 이미지 파일
├── keys/              # API 키 파일
├── prd/               # 프로덕션 관련 파일
├── prompt/            # 프롬프트 관련 파일
├── next.config.js     # Next.js 설정
├── .eslintrc.json     # ESLint 설정
└── package.json       # 프로젝트 설정
```

## 🛠 기술 스택

- **Frontend**: React 19, Next.js 15
- **Framework**: Next.js (App Router)
- **Styling**: CSS Modules, Global CSS
- **Linting**: ESLint
- **Package Manager**: npm

## 📝 사용 가능한 스크립트

- `npm run dev` - 개발 서버 실행
- `npm run build` - 프로덕션 빌드
- `npm run start` - 프로덕션 서버 실행
- `npm run lint` - 코드 린팅

## 🚀 주요 기능

- **App Router**: Next.js 13+ 최신 라우팅 시스템
- **API Routes**: `/app/api` 디렉토리의 서버리스 함수
- **CSS Modules**: 컴포넌트별 스타일 격리
- **SEO 최적화**: 메타데이터 및 서버 사이드 렌더링
- **Hot Reload**: 개발 중 실시간 코드 변경 반영

## 🎯 다음 단계

1. 필요한 추가 라이브러리 설치
2. 컴포넌트 개발
3. API 연동
4. 스타일링 개선

## 📄 라이선스

ISC
