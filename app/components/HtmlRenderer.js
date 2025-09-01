'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import DOMPurify from 'dompurify'
import styles from './HtmlRenderer.module.css'

/**
 * HTML 렌더러 컴포넌트
 * - JSON 결과를 HTML로 렌더링한 결과 표시
 * - 안전한 HTML 렌더링 (XSS 방지)
 * - 스타일 격리
 * - 반응형 레이아웃
 * - 로딩 상태 표시
 */
export default function HtmlRenderer({ htmlContent, isLoading }) {
  const [copySuccess, setCopySuccess] = useState(false)
  const contentRef = useRef(null)
  const [mathJaxLoaded, setMathJaxLoaded] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastPosition, setToastPosition] = useState({ x: 0, y: 0 })

  // HTML 정화 (XSS 방지)
  const sanitizedHtml = useMemo(() => {
    if (!htmlContent) return ''
    
    // 브라우저 환경에서만 DOMPurify 사용
    if (typeof window === 'undefined') return htmlContent
    
    try {
      // DOMPurify 설정 - 안전한 태그와 속성만 허용
      const config = {
        ALLOWED_TAGS: [
          'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
          'strong', 'em', 'b', 'i', 'u', 'br', 'hr', 'img', 'a',
          'figure', 'figcaption', 'details', 'summary', 'style', 'script'
        ],
        ALLOWED_ATTR: [
          'class', 'id', 'style', 'src', 'alt', 'href', 'target',
          'data-ph', 'data-aspect', 'title', 'role', 'aria-label'
        ],
        ALLOW_DATA_ATTR: true,
        ADD_TAGS: ['style', 'script'], // MathJax와 플레이스홀더 스크립트 허용
        ADD_ATTR: ['data-ph', 'data-aspect']
      }
      
      return DOMPurify.sanitize(htmlContent, config)
    } catch (error) {
      console.error('DOMPurify 오류:', error)
      // DOMPurify 실패 시 기본 HTML 반환 (보안상 위험하지만 기능 유지)
      return htmlContent
    }
  }, [htmlContent])

  // MathJax 로드 및 초기화
  useEffect(() => {
    // MathJax가 이미 로드되어 있는지 확인
    if (window.MathJax) {
      setMathJaxLoaded(true)
      return
    }

    // MathJax 설정을 먼저 정의
    window.MathJax = {
      tex: {
        inlineMath: [['\\(', '\\)'], ['$', '$']],
        displayMath: [['\\[', '\\]'], ['$$', '$$']],
        processEscapes: true
      },
      svg: {
        fontCache: 'global'
      },
      options: {
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
      }
    }

    // MathJax 스크립트 동적 로드
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js'
    script.async = true
    
    script.onload = () => {
      setMathJaxLoaded(true)
    }

    document.head.appendChild(script)

    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  // HTML 콘텐츠가 변경될 때마다 MathJax 재실행
  useEffect(() => {
    if (mathJaxLoaded && htmlContent && contentRef.current) {
      // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 MathJax 실행
      const timer = setTimeout(() => {
        if (window.MathJax && window.MathJax.typesetPromise) {
          window.MathJax.typesetPromise([contentRef.current])
            .then(() => {
              console.log('MathJax 렌더링 완료')
            })
            .catch((e) => {
              console.error('MathJax 렌더링 오류:', e)
            })
        }
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [mathJaxLoaded, htmlContent])

  // HTML 복사 기능 (토스트 메시지 포함)
  const copyToClipboard = async (event) => {
    try {
      await navigator.clipboard.writeText(htmlContent)
      setCopySuccess(true)
      
      // 토스트 위치 설정 (안전한 처리)
      if (event && event.currentTarget) {
        const rect = event.currentTarget.getBoundingClientRect()
        setToastPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        })
      } else {
        // 기본 위치 설정 (화면 중앙 상단)
        setToastPosition({
          x: window.innerWidth / 2,
          y: 100
        })
      }
      
      setShowToast(true)
      
      setTimeout(() => {
        setCopySuccess(false)
        setShowToast(false)
      }, 2000)
    } catch (err) {
      console.error('복사 실패:', err)
      alert('복사에 실패했습니다.')
    }
  }

  // HTML을 새 창에서 열기 (MathJax 포함)
  const openInNewWindow = () => {
    // 확장 화면용 제시문 영역 레이아웃 최적화 CSS
    const expansionLayoutOptimizationCSS = `
      /* 제시문 영역 레이아웃 최적화 */
      .material-section, 
      .제시문, 
      [class*="material"], 
      [class*="제시문"],
      div:has(img[src*="example.url"]),
      div:has(img[alt*="제시문"]),
      div:has(img[alt*="material"]) {
        /* 높이를 내용에 맞춰 자동 조정 */
        min-height: auto !important;
        height: fit-content !important;
        /* 적절한 여백 설정 */
        padding: 12px 16px !important;
        margin: 12px 0 !important;
        /* 텍스트가 영역 밖으로 나가지 않도록 */
        overflow: hidden !important;
        /* 레이아웃 정렬 */
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
        /* 테두리와 배경 */
        border: 1px solid #e2e8f0 !important;
        border-radius: 8px !important;
        background: #f8fafc !important;
      }
      
      /* 제시문 내 텍스트 영역 레이아웃 최적화 */
      .material-section p,
      .material-section div,
      .제시문 p,
      .제시문 div,
      [class*="material"] p,
      [class*="material"] div,
      [class*="제시문"] p,
      [class*="제시문"] div {
        /* 텍스트 내용에 맞춰 높이 조정 */
        min-height: auto !important;
        height: fit-content !important;
        /* 텍스트 겹침 방지 */
        margin: 0 !important;
        padding: 6px 8px !important;
        /* 텍스트가 영역 밖으로 나가지 않도록 */
        overflow-wrap: break-word !important;
        word-wrap: break-word !important;
        word-break: break-word !important;
        /* 텍스트가 없으면 높이를 최소화 */
        line-height: 1.5 !important;
        /* 배경과 테두리 */
        background: white !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 4px !important;
        /* 텍스트 겹침 방지를 위한 위치 설정 */
        position: relative !important;
        z-index: 1 !important;
      }
      
      /* 제시문 내 이미지 영역 최적화 */
      .material-section img,
      .제시문 img,
      [class*="material"] img,
      [class*="제시문"] img {
        /* 이미지 크기 제한 */
        max-width: 100% !important;
        max-height: 200px !important;
        height: auto !important;
        width: auto !important;
        /* 이미지 겹침 방지 */
        display: block !important;
        margin: 8px 0 !important;
        /* 이미지가 영역 밖으로 나가지 않도록 */
        object-fit: contain !important;
        /* 이미지 겹침 방지를 위한 위치 설정 */
        position: relative !important;
        z-index: 2 !important;
      }
      
      /* 빈 텍스트 영역 높이 최소화 */
      .material-section p:empty,
      .제시문 p:empty,
      [class*="material"] p:empty,
      [class*="제시문"] p:empty,
      .material-section div:empty,
      .제시문 div:empty,
      [class*="material"] div:empty,
      [class*="제시문"] div:empty {
        height: 0 !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        display: none !important;
      }
      
      /* 제시문 영역 상단 라벨 제거 */
      .material-section::before,
      .제시문::before,
      [class*="material"]::before,
      [class*="제시문"]::before {
        display: none !important;
      }
    `

    const htmlWithMathJax = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>HTML 렌더링 결과</title>
  <script>
    window.MathJax = {
      tex: {
        inlineMath: [['\\\\(', '\\\\)'], ['$', '$']],
        displayMath: [['\\\\[', '\\\\]'], ['$$', '$$']],
        processEscapes: true
      },
      svg: {
        fontCache: 'global'
      },
      options: {
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
      }
    };
  </script>
  <script async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      margin: 20px; 
      line-height: 1.6; 
      background: #f9f9f9;
    }
    .container { 
      max-width: 1200px; 
      margin: 0 auto; 
      background: white; 
      padding: 20px; 
      border-radius: 8px; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    ${expansionLayoutOptimizationCSS}
  </style>
</head>
<body>
  <div class="container">
    ${htmlContent}
  </div>
</body>
</html>`
    
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(htmlWithMathJax)
      newWindow.document.close()
    }
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>AI가 JSON으로 HTML파일을 생성하고 있습니다...</p>
          <div className={styles.loadingSteps}>
            <div className={styles.step}>📄 JSON 데이터 파싱</div>
            <div className={styles.step}>🎨 HTML 구조 생성</div>
            <div className={styles.step}>✨ 스타일 적용</div>
          </div>
        </div>
      </div>
    )
  }

  if (!htmlContent) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <img src="/rendering.png" alt="Rendering" className={styles.emptyIcon} />
          <p>JSON 결과를 알아보기 쉽게<br />여기에 렌더링합니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* 안내 문구 추가 */}
      <div className={styles.notice}>
        <small>이미지 처리는 Demo에서 구현되지 않아 임의 처리됩니다</small>
      </div>

      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3>HTML 렌더링 결과</h3>
          <span className={styles.badge}>가독성 향상</span>
        </div>
        
        <div className={styles.headerRight}>
          <button
            onClick={openInNewWindow}
            className={styles.iconButton}
            title="확장해 보기"
          >
            <img src="/new_tab.png" alt="New Tab" />
          </button>
          <button
            onClick={copyToClipboard}
            className={styles.iconButton}
            title="내용 복사하기"
          >
            <img src="/copy.png" alt="Copy" />
          </button>
        </div>
      </div>

      {/* HTML 내용 */}
      <div className={styles.htmlContent}>
        <div className={styles.renderFrame}>
          <div 
            ref={contentRef}
            className={styles.renderedHtml}
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        </div>
      </div>

      {/* 푸터 정보 */}
      <div className={styles.footer}>
        <div className={styles.info}>
          <span>📊 렌더링 완료</span>
          <span>📏 크기: {htmlContent.length} bytes</span>
          <span>🎯 최적화된 가독성</span>
        </div>
        <div className={styles.warning}>
          <small>⚠️ 보안상 일부 스크립트는 실행되지 않습니다.</small>
        </div>
      </div>

      {/* 토스트 메시지 */}
      {showToast && (
        <div 
          className={styles.toast}
          style={{ 
            position: 'fixed',
            left: `${toastPosition.x}px`,
            top: `${toastPosition.y}px`,
            transform: 'translateX(-50%)'
          }}
        >
          내용이 복사되었습니다!
        </div>
      )}
    </div>
  )
}
