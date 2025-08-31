# AI OCR POC 프로젝트

OpenAI GPT-4 Vision API를 활용한 AI 기반 OCR(Optical Character Recognition) 웹 애플리케이션입니다.

## 📋 프로젝트 개요

학습용 문제 이미지를 AI로 분석하여 구조화된 JSON 데이터로 변환하고, 이를 HTML로 렌더링하는 POC 애플리케이션입니다.

## 🚀 시작하기

### 필요 조건

- Node.js (v18 이상)
- npm 또는 yarn
- OpenAI API 키

### 설치

```bash
# 의존성 설치
npm install

# OpenAI API 키 설정
# keys/api_key.txt 파일에 API 키 저장
echo "your_openai_api_key_here" > keys/api_key.txt
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

- **Frontend**: React 19, Next.js 15 (App Router)
- **AI/ML**: OpenAI GPT-4 Vision API
- **Styling**: CSS Modules, Global CSS
- **Security**: DOMPurify (XSS 방지)
- **Performance**: 이미지 자동 압축, Canvas API
- **Linting**: ESLint
- **Package Manager**: npm

## 📝 사용 가능한 스크립트

- `npm run dev` - 개발 서버 실행
- `npm run build` - 프로덕션 빌드
- `npm run start` - 프로덕션 서버 실행
- `npm run lint` - 코드 린팅

## 🚀 주요 기능

### 📸 이미지 처리
- **드래그 앤 드롭**: 이미지 파일 업로드
- **클립보드 붙여넣기**: 스크린샷 직접 붙여넣기
- **자동 압축**: 2MB 이상 이미지 자동 최적화
- **메타데이터 추출**: 이미지 크기, 용량, 형식 정보

### 🤖 AI OCR 분석
- **OpenAI GPT-4o**: 최신 Vision API 활용
- **구조화된 추출**: JSON v1.1.0 표준 스키마
- **다양한 문항 유형**: 4지선다, 5지선다, 단답형, 서술형 등
- **좌표 정보**: 텍스트 및 이미지 위치 정보 포함

### 🎨 결과 표시
- **JSON 뷰어**: 접기/펼치기, 구문 하이라이팅, 복사 기능
- **HTML 렌더링**: JSON을 시각적 HTML로 변환
- **XSS 방지**: DOMPurify를 통한 안전한 렌더링
- **반응형 디자인**: 모바일/태블릿/데스크톱 최적화

### ⚡ 성능 최적화
- **이미지 압축**: Canvas 기반 리사이징 (1920x1080, 80% 품질)
- **단계별 로딩**: 처리 과정 실시간 표시
- **에러 처리**: 타임아웃, 재시도, 상세 오류 메시지
- **메모리 관리**: Object URL 자동 해제

## 🌐 Vercel 배포 (GitHub 연동)

### 1. GitHub 리포지토리 준비
```bash
# 변경사항 커밋 및 푸시
git add .
git commit -m "Deploy AI OCR POC to production"
git push origin main
```

### 2. Vercel 프로젝트 생성
1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. **"New Project"** 클릭
3. GitHub 리포지토리 선택 및 Import
4. 프로젝트 설정:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build` (기본값)
   - **Output Directory**: `.next` (기본값)

### 3. 환경 변수 설정 (⚠️ 중요)
Vercel 프로젝트 설정에서 Environment Variables 추가:

```
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=production
```

**환경 변수 설정 방법:**
1. Vercel 프로젝트 대시보드 → Settings → Environment Variables
2. **Name**: `OPENAI_API_KEY`
3. **Value**: `sk-proj-...` (OpenAI API 키)
4. **Environment**: Production, Preview, Development 모두 선택
5. **Save** 클릭

### 4. 자동 배포
- `main` 브랜치에 푸시할 때마다 자동 배포
- Pull Request 생성 시 Preview 배포 자동 생성
- 배포 상태는 Vercel 대시보드에서 확인 가능

### 5. 배포 확인사항
- ✅ **빌드 성공**: Next.js 빌드 오류 없음
- ✅ **환경 변수**: OpenAI API 키 정상 설정
- ✅ **API 엔드포인트**: `/api/ocr`, `/api/render` 정상 작동
- ✅ **정적 파일**: 이미지 리소스 정상 로드
- ✅ **함수 타임아웃**: OCR 60초, 렌더링 30초 설정

### 🚨 배포 시 주의사항
- **API 키 보안**: 환경 변수로만 설정, 코드에 하드코딩 금지
- **함수 제한**: Vercel Hobby 플랜은 10초 제한 (Pro 플랜 권장)
- **이미지 크기**: 대용량 이미지는 자동 압축되지만 업로드 제한 확인
- **API 사용량**: OpenAI API 사용량 모니터링 필요

## 🔧 API 엔드포인트

- **POST /api/ocr**: 이미지를 JSON으로 변환
- **POST /api/render**: JSON을 HTML로 렌더링
- **GET /api/ocr**: OCR API 상태 확인
- **GET /api/render**: 렌더링 API 상태 확인

## 🚨 Vercel 배포 오류 해결

### 문제: "OCR 처리 중 오류가 발생했습니다" 오류

**원인:**
1. **환경 변수 미설정**: `OPENAI_API_KEY` 환경 변수가 Vercel에 설정되지 않음
2. **파일 시스템 접근 제한**: Vercel 서버리스 환경에서 로컬 파일 읽기 불가
3. **API 키 인증 실패**: 잘못된 API 키 또는 만료된 키

**해결 방법:**

#### 1. 환경 변수 확인 및 설정
```bash
# Vercel CLI로 환경 변수 확인
vercel env ls

# 환경 변수 설정
vercel env add OPENAI_API_KEY
```

#### 2. Vercel 대시보드에서 환경 변수 설정
1. Vercel 프로젝트 → Settings → Environment Variables
2. **Name**: `OPENAI_API_KEY`
3. **Value**: OpenAI API 키 입력
4. **Environment**: Production, Preview, Development 모두 선택
5. **Save** 후 재배포

#### 3. API 상태 확인
```bash
# OCR API 상태 확인
curl https://your-vercel-app.vercel.app/api/ocr

# 렌더링 API 상태 확인
curl https://your-vercel-app.vercel.app/api/render
```

#### 4. 로그 확인
Vercel 대시보드 → Functions → API 엔드포인트 → Logs에서 상세 오류 확인

### 일반적인 오류 코드 및 해결책

| 오류 코드 | 원인 | 해결책 |
|-----------|------|--------|
| 401 | API 키 인증 실패 | OpenAI API 키 재생성 및 환경 변수 업데이트 |
| 429 | 요청 한도 초과 | OpenAI 사용량 확인 또는 요청 간격 조정 |
| 500 | 서버 내부 오류 | 환경 변수 설정 확인 및 재배포 |
| 413 | 요청 크기 초과 | 이미지 크기 압축 또는 Vercel Pro 플랜 사용 |

### 디버깅 팁
1. **브라우저 개발자 도구**: Network 탭에서 API 응답 확인
2. **Vercel 로그**: Functions 로그에서 서버 오류 확인
3. **환경 변수 테스트**: API 상태 확인 엔드포인트 활용
4. **로컬 테스트**: `npm run dev`로 로컬에서 먼저 테스트

## 📊 프로젝트 상태

- ✅ **Phase 1**: 기본 UI 구조 및 이미지 처리
- ✅ **Phase 2**: OpenAI API 연동
- ✅ **Phase 3**: 결과 표시 및 UI 개선
- ✅ **Phase 4**: 성능 최적화 (부분 완료)
- ✅ **Phase 5**: 테스트 및 버그 수정
- 🔄 **Phase 6**: Vercel 배포 오류 해결 (진행 중)

## 📄 라이선스

ISC
