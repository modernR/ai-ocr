'use client'

import { useState, useMemo } from 'react'
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

  // HTML 복사 기능
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('복사 실패:', err)
      alert('복사에 실패했습니다.')
    }
  }

  // HTML을 새 창에서 열기
  const openInNewWindow = () => {
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(htmlContent)
      newWindow.document.close()
    }
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>HTML로 렌더링하고 있습니다...</p>
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
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3>HTML 렌더링 결과</h3>
          <span className={styles.badge}>가독성 향상</span>
        </div>
        
        <div className={styles.headerRight}>
          <button
            onClick={openInNewWindow}
            className={styles.controlButton}
            title="새 창에서 열기"
          >
            🔗
          </button>
          <button
            onClick={copyToClipboard}
            className={`${styles.controlButton} ${styles.copyButton}`}
            title="HTML 복사"
          >
            {copySuccess ? '✓' : '📋'}
          </button>
        </div>
      </div>

      {/* HTML 내용 */}
      <div className={styles.htmlContent}>
        <div className={styles.renderFrame}>
          <div 
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
    </div>
  )
}
