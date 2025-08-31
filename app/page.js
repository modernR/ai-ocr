'use client'

import { useState } from 'react'
import styles from './page.module.css'
import ImageUploader from './components/ImageUploader'
import JsonViewer from './components/JsonViewer'
import HtmlRenderer from './components/HtmlRenderer'
import ControlPanel from './components/ControlPanel'

export default function Home() {
  // 전역 상태 관리
  const [uploadedImage, setUploadedImage] = useState(null)
  const [imageMetadata, setImageMetadata] = useState({ width: 0, height: 0 })
  const [jsonResult, setJsonResult] = useState(null)
  const [htmlResult, setHtmlResult] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasProcessed, setHasProcessed] = useState(false)
  const [currentStep, setCurrentStep] = useState('upload') // 'upload', 'processing', 'json', 'html'

  // 전체 초기화 함수
  const handleReset = () => {
    setUploadedImage(null)
    setImageMetadata({ width: 0, height: 0 })
    setJsonResult(null)
    setHtmlResult(null)
    setIsProcessing(false)
    setHasProcessed(false)
    setCurrentStep('upload')
  }

  // OCR 처리 함수
  const handleProcess = async () => {
    if (!uploadedImage) {
      alert('이미지를 먼저 업로드해주세요.')
      return
    }

    if (hasProcessed) {
      alert('Demo에서는 1회만 호출됩니다')
      return
    }

    setIsProcessing(true)
    setCurrentStep('processing')
    
    try {
      console.log('OCR 처리 시작...')
      
      // 이미지를 base64로 변환
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = uploadedImage
      })
      
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      
      // OCR API 호출
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60초 타임아웃
      
      try {
        const response = await fetch('/api/ocr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData,
            imageMetadata: {
              width: img.width,
              height: img.height,
              size: imageMetadata?.size,
              type: imageMetadata?.type
            }
          }),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`API 호출 실패 (${response.status}): ${errorText}`)
        }
        
        const result = await response.json()
        
        if (result.success && result.data) {
          setJsonResult(result.data)
          setCurrentStep('json')
          setHasProcessed(true)
        } else {
          throw new Error(result.error || 'OCR 처리 결과가 올바르지 않습니다.')
        }
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          throw new Error('요청 시간이 초과되었습니다. 다시 시도해주세요.')
        }
        throw fetchError
      }
      
    } catch (error) {
      console.error('OCR 처리 중 오류:', error)
      alert(`처리 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // HTML 렌더링 함수
  const handleRenderHtml = async () => {
    if (!jsonResult) return
    
    setIsProcessing(true)
    
    try {
      console.log('HTML 렌더링 시작...')
      
      // HTML 렌더링 API 호출
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30초 타임아웃
      
      try {
        const response = await fetch('/api/render', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonData: jsonResult
          }),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`API 호출 실패 (${response.status}): ${errorText}`)
        }
        
        const result = await response.json()
        
        if (result.success && result.html) {
          setHtmlResult(result.html)
          setCurrentStep('html')
        } else {
          throw new Error(result.error || 'HTML 렌더링 결과가 올바르지 않습니다.')
        }
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          throw new Error('요청 시간이 초과되었습니다. 다시 시도해주세요.')
        }
        throw fetchError
      }
      
    } catch (error) {
      console.error('HTML 렌더링 중 오류:', error)
      alert(`HTML 렌더링 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>AI OCR Demo</h1>
            <button 
              onClick={handleReset}
              className={styles.refreshButton}
              title="새로고침"
            >
              <img src="/reset2.png" alt="Reset" className={styles.refreshIcon} />
            </button>
          </div>
          <img src="/logo.png" alt="Logo" className={styles.logo} />
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className={styles.main}>
        <div className={styles.workspace}>
          {/* 좌측: 이미지 업로드 영역 */}
          <div className={styles.leftColumn}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.stepNumber}>1</span>
                문제 이미지 업로드
              </h2>
              <ImageUploader
                uploadedImage={uploadedImage}
                onImageUpload={setUploadedImage}
                onMetadataChange={setImageMetadata}
                disabled={isProcessing}
              />
              {/* 1->2 Send 버튼 */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  handleProcess()
                }}
                disabled={!uploadedImage || isProcessing || hasProcessed}
                className={styles.sendButton}
                title={hasProcessed ? 'Demo에서는 1회만 호출됩니다' : 'OCR 분석 시작'}
              >
                <img src="/send_btn.png" alt="Send" className={styles.sendButtonIcon} />
              </button>
            </div>
          </div>

          {/* 중앙: JSON 결과 영역 */}
          <div className={styles.middleColumn}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.stepNumber}>2</span>
                AI OCR 결과 JSON 확인
              </h2>
              <JsonViewer
                jsonData={jsonResult}
                isLoading={isProcessing && currentStep === 'processing'}
              />
              {/* 2->3 Send 버튼 */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  handleRenderHtml()
                }}
                disabled={!jsonResult || isProcessing}
                className={styles.sendButton}
                title="HTML 렌더링"
              >
                <img src="/send_btn.png" alt="Send" className={styles.sendButtonIcon} />
              </button>
            </div>
          </div>

          {/* 우측: HTML 렌더링 결과 영역 */}
          <div className={styles.rightColumn}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.stepNumber}>3</span>
                JSON을 HTML로 미리보기
              </h2>
              <HtmlRenderer
                htmlContent={htmlResult}
                isLoading={isProcessing && currentStep === 'html'}
              />
            </div>
          </div>
        </div>
      </main>


    </div>
  )
}
