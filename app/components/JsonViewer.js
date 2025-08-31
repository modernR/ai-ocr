'use client'

import { useState } from 'react'
import styles from './JsonViewer.module.css'

/**
 * JSON 뷰어 컴포넌트
 * - json.parser.online.fr 스타일의 JSON 표시
 * - 접기/펼치기 기능
 * - 구문 하이라이팅
 * - 복사 기능
 * - 로딩 상태 표시
 */
export default function JsonViewer({ jsonData, isLoading }) {
  const [expandedKeys, setExpandedKeys] = useState(new Set())
  const [copySuccess, setCopySuccess] = useState(false)

  // 키 확장/축소 토글
  const toggleExpand = (keyPath) => {
    const newExpanded = new Set(expandedKeys)
    if (newExpanded.has(keyPath)) {
      newExpanded.delete(keyPath)
    } else {
      newExpanded.add(keyPath)
    }
    setExpandedKeys(newExpanded)
  }

  // 전체 확장/축소
  const toggleExpandAll = (expand) => {
    if (expand) {
      const allKeys = getAllKeys(jsonData)
      setExpandedKeys(new Set(allKeys))
    } else {
      setExpandedKeys(new Set())
    }
  }

  // 모든 키 경로 추출
  const getAllKeys = (obj, prefix = '') => {
    const keys = []
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        const keyPath = prefix ? `${prefix}.${key}` : key
        keys.push(keyPath)
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          keys.push(...getAllKeys(obj[key], keyPath))
        }
      })
    }
    return keys
  }

  // JSON 복사 기능
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2))
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('복사 실패:', err)
      alert('복사에 실패했습니다.')
    }
  }

  // JSON 값 렌더링
  const renderValue = (value, keyPath = '', depth = 0) => {
    if (value === null) {
      return <span className={styles.null}>null</span>
    }
    
    if (typeof value === 'boolean') {
      return <span className={styles.boolean}>{value.toString()}</span>
    }
    
    if (typeof value === 'number') {
      return <span className={styles.number}>{value}</span>
    }
    
    if (typeof value === 'string') {
      return <span className={styles.string}>&quot;{value}&quot;</span>
    }
    
    if (Array.isArray(value)) {
      return renderArray(value, keyPath, depth)
    }
    
    if (typeof value === 'object') {
      return renderObject(value, keyPath, depth)
    }
    
    return <span>{String(value)}</span>
  }

  // 배열 렌더링
  const renderArray = (array, keyPath, depth) => {
    const isExpanded = expandedKeys.has(keyPath)
    const isEmpty = array.length === 0

    return (
      <div className={styles.arrayContainer}>
        <span 
          className={styles.bracket}
          onClick={() => !isEmpty && toggleExpand(keyPath)}
          style={{ cursor: isEmpty ? 'default' : 'pointer' }}
        >
          [
          {!isEmpty && (
            <span className={styles.toggleIcon}>
              {isExpanded ? '−' : '+'}
            </span>
          )}
          {isEmpty && <span className={styles.emptyIndicator}>empty</span>}
        </span>
        
        {!isEmpty && isExpanded && (
          <div className={styles.arrayItems} style={{ marginLeft: `${(depth + 1) * 20}px` }}>
            {array.map((item, index) => (
              <div key={index} className={styles.arrayItem}>
                <span className={styles.arrayIndex}>{index}:</span>
                {renderValue(item, `${keyPath}[${index}]`, depth + 1)}
                {index < array.length - 1 && <span className={styles.comma}>,</span>}
              </div>
            ))}
          </div>
        )}
        
        <span className={styles.bracket}>]</span>
        {!isEmpty && !isExpanded && (
          <span className={styles.itemCount}> {array.length} items</span>
        )}
      </div>
    )
  }

  // 객체 렌더링
  const renderObject = (obj, keyPath, depth) => {
    const keys = Object.keys(obj)
    const isExpanded = expandedKeys.has(keyPath)
    const isEmpty = keys.length === 0

    return (
      <div className={styles.objectContainer}>
        <span 
          className={styles.bracket}
          onClick={() => !isEmpty && toggleExpand(keyPath)}
          style={{ cursor: isEmpty ? 'default' : 'pointer' }}
        >
          {'{'} 
          {!isEmpty && (
            <span className={styles.toggleIcon}>
              {isExpanded ? '−' : '+'}
            </span>
          )}
          {isEmpty && <span className={styles.emptyIndicator}>empty</span>}
        </span>
        
        {!isEmpty && isExpanded && (
          <div className={styles.objectItems} style={{ marginLeft: `${(depth + 1) * 20}px` }}>
            {keys.map((key, index) => (
              <div key={key} className={styles.objectItem}>
                <span className={styles.key}>&quot;{key}&quot;</span>
                <span className={styles.colon}>:</span>
                {renderValue(obj[key], keyPath ? `${keyPath}.${key}` : key, depth + 1)}
                {index < keys.length - 1 && <span className={styles.comma}>,</span>}
              </div>
            ))}
          </div>
        )}
        
        <span className={styles.bracket}>{'}'}</span>
        {!isEmpty && !isExpanded && (
          <span className={styles.itemCount}> {keys.length} keys</span>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>AI가 이미지를 분석하고 있습니다...</p>
          <div className={styles.loadingSteps}>
            <div className={styles.step}>📷 이미지 전처리</div>
            <div className={styles.step}>🤖 AI 모델 분석</div>
            <div className={styles.step}>📝 JSON 구조화</div>
          </div>
        </div>
      </div>
    )
  }

  if (!jsonData) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <img src="/ai_ocr_back_image.png" alt="AI OCR" className={styles.emptyIcon} />
          <p>AI OCR Demo결과가<br />JSON형식으로 표현됩니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3>JSON 분석 결과</h3>
          <span className={styles.schemaVersion}>
            Schema v{jsonData.schema_version || '1.1.0'}
          </span>
        </div>
        
        <div className={styles.headerRight}>
          <button
            onClick={() => toggleExpandAll(true)}
            className={styles.controlButton}
            title="모두 펼치기"
          >
            ⊞
          </button>
          <button
            onClick={() => toggleExpandAll(false)}
            className={styles.controlButton}
            title="모두 접기"
          >
            ⊟
          </button>
          <button
            onClick={copyToClipboard}
            className={`${styles.controlButton} ${styles.copyButton}`}
            title="JSON 복사"
          >
            {copySuccess ? '✓' : '📋'}
          </button>
        </div>
      </div>

      {/* JSON 내용 */}
      <div className={styles.jsonContent}>
        <div className={styles.jsonWrapper}>
          {renderValue(jsonData, '', 0)}
        </div>
      </div>

      {/* 푸터 정보 */}
      <div className={styles.footer}>
        <div className={styles.stats}>
          <span>문항번호: {jsonData.문항번호 || 'N/A'}</span>
          <span>문항유형: {jsonData.메타?.문항유형 || 'N/A'}</span>
          <span>크기: {JSON.stringify(jsonData).length} bytes</span>
        </div>
      </div>
    </div>
  )
}
