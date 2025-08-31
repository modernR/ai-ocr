'use client'

import styles from './ControlPanel.module.css'

/**
 * 컨트롤 패널 컴포넌트
 * - Send 버튼 (OCR 처리 트리거)
 * - HTML 렌더링 버튼
 * - 초기화 버튼 (전체 상태 리셋)
 * - 1회 호출 제한 로직 처리
 * - 진행 상태에 따른 버튼 활성화/비활성화
 */
export default function ControlPanel({
  onProcess,
  onRenderHtml,
  onReset,
  isProcessing,
  hasImage,
  hasJsonResult,
  hasProcessed,
  currentStep
}) {
  
  // 버튼 상태 계산
  const canProcess = hasImage && !isProcessing && !hasProcessed
  const canRenderHtml = hasJsonResult && !isProcessing && currentStep !== 'html'
  const canReset = hasImage || hasJsonResult || hasProcessed

  // 진행 상태 메시지
  const getStatusMessage = () => {
    if (isProcessing) {
      switch (currentStep) {
        case 'processing':
          return '🔄 AI가 이미지를 분석하고 있습니다...'
        case 'html':
          return '🔄 HTML로 렌더링하고 있습니다...'
        default:
          return '🔄 처리 중...'
      }
    }
    
    if (hasProcessed && !hasJsonResult) {
      return '❌ 처리 중 오류가 발생했습니다'
    }
    
    if (hasJsonResult && currentStep === 'json') {
      return '✅ JSON 분석이 완료되었습니다'
    }
    
    if (hasJsonResult && currentStep === 'html') {
      return '✅ HTML 렌더링이 완료되었습니다'
    }
    
    if (!hasImage) {
      return '📤 이미지를 업로드해주세요'
    }
    
    if (hasImage && !hasProcessed) {
      return '🚀 분석을 시작할 준비가 되었습니다'
    }
    
    return ''
  }

  // 진행률 계산
  const getProgress = () => {
    if (!hasImage) return 0
    if (hasImage && !hasJsonResult) return 33
    if (hasJsonResult && currentStep === 'json') return 66
    if (currentStep === 'html') return 100
    return 0
  }

  return (
    <div className={styles.container}>
      {/* 상태 표시 */}
      <div className={styles.statusSection}>
        <div className={styles.statusMessage}>
          {getStatusMessage()}
        </div>
        
        {/* 진행률 바 */}
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${getProgress()}%` }}
            />
          </div>
          <span className={styles.progressText}>{getProgress()}%</span>
        </div>
      </div>

      {/* 컨트롤 버튼들 */}
      <div className={styles.buttonGroup}>
        {/* Send 버튼 */}
        <button
          onClick={onProcess}
          disabled={!canProcess}
          className={`${styles.button} ${styles.primaryButton} ${!canProcess ? styles.disabled : ''}`}
          title={hasProcessed ? 'Demo에서는 1회만 호출됩니다' : 'OCR 분석 시작'}
        >
          <img src="/send_btn.png" alt="" className={styles.buttonIcon} />
          {isProcessing && currentStep === 'processing' ? (
            <>
              <span className={styles.spinner}></span>
              분석 중...
            </>
          ) : (
            'Send'
          )}
        </button>

        {/* HTML 렌더링 버튼 */}
        <button
          onClick={onRenderHtml}
          disabled={!canRenderHtml}
          className={`${styles.button} ${styles.secondaryButton} ${!canRenderHtml ? styles.disabled : ''}`}
          title="JSON 결과를 HTML로 렌더링"
        >
          <span className={styles.buttonIcon}>🎨</span>
          {isProcessing && currentStep === 'html' ? (
            <>
              <span className={styles.spinner}></span>
              렌더링 중...
            </>
          ) : (
            'HTML 렌더링'
          )}
        </button>

        {/* 초기화 버튼 */}
        <button
          onClick={onReset}
          disabled={!canReset || isProcessing}
          className={`${styles.button} ${styles.resetButton} ${(!canReset || isProcessing) ? styles.disabled : ''}`}
          title="전체 초기화"
        >
          <span className={styles.buttonIcon}>🔄</span>
          초기화
        </button>
      </div>

      {/* 도움말 텍스트 */}
      <div className={styles.helpText}>
        {!hasImage && (
          <p>💡 이미지를 업로드한 후 Send 버튼을 클릭하세요</p>
        )}
        {hasImage && !hasProcessed && (
          <p>💡 Send 버튼을 클릭하여 AI 분석을 시작하세요</p>
        )}
        {hasProcessed && !hasJsonResult && (
          <p>⚠️ Demo 버전에서는 1회만 호출할 수 있습니다. 초기화 후 다시 시도하세요.</p>
        )}
        {hasJsonResult && currentStep === 'json' && (
          <p>💡 HTML 렌더링 버튼을 클릭하여 더 나은 가독성으로 확인하세요</p>
        )}
        {currentStep === 'html' && (
          <p>✨ 모든 처리가 완료되었습니다!</p>
        )}
      </div>

      {/* 기능 설명 */}
      <div className={styles.featureInfo}>
        <h4>주요 기능</h4>
        <ul>
          <li><strong>Send:</strong> OpenAI GPT-4 Vision으로 이미지 분석</li>
          <li><strong>HTML 렌더링:</strong> JSON 결과를 읽기 쉬운 HTML로 변환</li>
          <li><strong>초기화:</strong> 모든 데이터 삭제 및 새로운 분석 준비</li>
        </ul>
        <div className={styles.limitation}>
          <small>⚠️ Demo 버전에서는 Send 기능을 1회만 사용할 수 있습니다.</small>
        </div>
      </div>
    </div>
  )
}
