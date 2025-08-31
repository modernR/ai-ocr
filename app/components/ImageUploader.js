'use client'

import { useState, useRef, useCallback } from 'react'
import styles from './ImageUploader.module.css'

/**
 * 이미지 업로드 컴포넌트
 * - 파일 업로드 (드래그 앤 드롭 지원)
 * - 클립보드 이미지 붙여넣기 기능
 * - 이미지 미리보기 및 삭제 기능
 * - 이미지 크기 계산 (page_width_px, page_height_px)
 * - 한 번에 하나의 이미지만 처리
 */
export default function ImageUploader({ 
  uploadedImage, 
  onImageUpload, 
  onMetadataChange, 
  disabled = false 
}) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const fileInputRef = useRef(null)

  // 이미지 파일 유효성 검사
  const validateImageFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    if (!validTypes.includes(file.type)) {
      alert('지원되는 이미지 형식: JPG, PNG, GIF, WebP')
      return false
    }
    
    if (file.size > maxSize) {
      alert('이미지 크기는 10MB 이하여야 합니다.')
      return false
    }
    
    return true
  }

  // 이미지 메타데이터 추출 함수
  const extractImageMetadata = (file) => {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        const metadata = {
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: file.size,
          type: file.type,
          name: file.name
        }
        
        URL.revokeObjectURL(url) // 메모리 정리
        resolve(metadata)
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve({ width: 0, height: 0, size: file.size, type: file.type, name: file.name })
      }
      
      img.src = url
    })
  }

  // 이미지 압축 함수
  const compressImage = async (file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      const objectUrl = URL.createObjectURL(file)
      
      img.onload = () => {
        // 메모리 누수 방지를 위해 Object URL 해제
        URL.revokeObjectURL(objectUrl)
        
        // 원본 크기
        let { width, height } = img
        
        // 최대 크기를 초과하는 경우 비율을 유지하며 축소
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.floor(width * ratio)
          height = Math.floor(height * ratio)
        }
        
        canvas.width = width
        canvas.height = height
        
        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height)
        
        // 압축된 이미지를 Blob으로 변환
        canvas.toBlob(resolve, 'image/jpeg', quality)
      }
      
      img.onerror = () => {
        // 오류 시에도 Object URL 해제
        URL.revokeObjectURL(objectUrl)
        resolve(null)
      }
      
      img.src = objectUrl
    })
  }

  // 이미지 처리 공통 함수
  const processImage = useCallback(async (file) => {
    if (!validateImageFile(file)) return
    
    setIsLoading(true)
    setLoadingStep('이미지 검증 중...')
    
    try {
      // 이미지 압축 (2MB 이상인 경우만)
      let processedFile = file
      if (file.size > 2 * 1024 * 1024) { // 2MB
        setLoadingStep('이미지 압축 중...')
        console.log('이미지 압축 중...', file.size, 'bytes')
        const compressedBlob = await compressImage(file)
        
        if (compressedBlob) {
          processedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' })
          console.log('압축 완료:', processedFile.size, 'bytes')
        } else {
          console.warn('이미지 압축 실패, 원본 사용')
        }
      }
      
      setLoadingStep('메타데이터 추출 중...')
      // 이미지 메타데이터 추출
      const metadata = await extractImageMetadata(processedFile)
      
      setLoadingStep('이미지 변환 중...')
      // 이미지를 Base64로 변환
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = {
          file: processedFile,
          dataUrl: e.target.result,
          metadata: metadata
        }
        
        onImageUpload(imageData)
        onMetadataChange({ width: metadata.width, height: metadata.height })
        setIsLoading(false)
      }
      
      reader.onerror = () => {
        alert('이미지 읽기 중 오류가 발생했습니다.')
        setIsLoading(false)
      }
      
      reader.readAsDataURL(file)
      
    } catch (error) {
      console.error('이미지 처리 중 오류:', error)
      alert('이미지 처리 중 오류가 발생했습니다.')
      setIsLoading(false)
    }
  }, [compressImage, extractImageMetadata, onImageUpload, onMetadataChange, setLoadingStep, validateImageFile])

  // 파일 선택 핸들러
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      processImage(file)
    }
  }

  // 드래그 앤 드롭 핸들러
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled) return
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      processImage(files[0])
    }
  }, [disabled, processImage])

  // 클립보드 붙여넣기 핸들러
  const handlePaste = useCallback((e) => {
    if (disabled) return
    
    const items = e.clipboardData?.items
    if (!items) return
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          processImage(file)
        }
        break
      }
    }
  }, [disabled, processImage])

  // 이미지 삭제 핸들러
  const handleRemoveImage = () => {
    onImageUpload(null)
    onMetadataChange({ width: 0, height: 0 })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 업로드 영역 클릭 핸들러
  const handleUploadAreaClick = () => {
    if (!disabled && !uploadedImage) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className={styles.container}>
      {!uploadedImage ? (
        // 업로드 영역
        <div
          className={`${styles.uploadArea} ${isDragOver ? styles.dragOver : ''} ${disabled ? styles.disabled : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handlePaste}
          onClick={handleUploadAreaClick}
          tabIndex={0}
          role="button"
          aria-label="이미지 업로드 영역"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className={styles.hiddenInput}
            disabled={disabled}
          />
          
          {isLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>{loadingStep || '이미지 처리 중...'}</p>
            </div>
          ) : (
            <div className={styles.uploadContent}>
              <img src="/img_upload.png" alt="Upload" className={styles.uploadIcon} />
              <p>
                문제 이미지를 업로드하거나<br />
                캡쳐해서 붙여 넣으세요!
              </p>
            </div>
          )}
        </div>
      ) : (
        // 이미지 미리보기
        <div className={styles.previewArea}>
          <div className={styles.imageContainer}>
            <img
              src={uploadedImage.dataUrl}
              alt="업로드된 이미지"
              className={styles.previewImage}
            />
            <button
              onClick={handleRemoveImage}
              className={styles.removeButton}
              disabled={disabled}
              aria-label="이미지 삭제"
            >
              ✕
            </button>
          </div>
          
          <div className={styles.imageInfo}>
            <h4>이미지 정보</h4>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>파일명:</span>
                <span className={styles.infoValue}>{uploadedImage.metadata.name}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>크기:</span>
                <span className={styles.infoValue}>
                  {uploadedImage.metadata.width} × {uploadedImage.metadata.height}px
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>용량:</span>
                <span className={styles.infoValue}>
                  {(uploadedImage.metadata.size / 1024 / 1024).toFixed(2)}MB
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>형식:</span>
                <span className={styles.infoValue}>{uploadedImage.metadata.type}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
