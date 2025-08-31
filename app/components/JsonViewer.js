'use client'

import { useState, useEffect } from 'react'
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
  const [showToast, setShowToast] = useState(false)
  const [toastPosition, setToastPosition] = useState({ x: 0, y: 0 })

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

  // JSON 복사 기능 (토스트 메시지 포함)
  const copyToClipboard = async (event) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2))
      setCopySuccess(true)
      
      // 토스트 위치 설정
      const rect = event.currentTarget.getBoundingClientRect()
      setToastPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      })
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

  // 새 탭에서 JSON 뷰어 열기
  const openInNewTab = () => {
    const jsonViewerHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>JSON Viewer</title>
  <style>
    body { font-family: monospace; padding: 20px; background: #f5f5f5; }
    .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
    .controls { display: flex; gap: 10px; }
    .button { padding: 8px 16px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px; font-size: 14px; }
    .button:hover { background: #f0f0f0; }
    .button img { width: 16px; height: 16px; vertical-align: middle; }
    .json-content { white-space: pre-wrap; font-size: 14px; line-height: 1.5; }
    .key { color: #d73a49; }
    .string { color: #032f62; }
    .number { color: #005cc5; }
    .boolean { color: #e36209; }
    .null { color: #6f42c1; }
    .bracket { color: #666; cursor: pointer; user-select: none; }
    .toggle { color: #0969da; font-weight: bold; margin: 0 5px; }
    .collapsed { display: none; }
    .item-count { color: #999; font-size: 12px; margin-left: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>JSON Viewer</h2>
      <div class="controls">
        <button class="button" onclick="expandAll()" title="펼쳐보기">
          <img src="/plus.png" alt="Expand"> 모두 펼치기
        </button>
        <button class="button" onclick="collapseAll()" title="접어두기">
          <img src="/minus.png" alt="Collapse"> 모두 접기
        </button>
        <button class="button" onclick="copyJSON()" title="내용 복사하기">
          <img src="/copy.png" alt="Copy"> 복사
        </button>
      </div>
    </div>
    <div class="json-content" id="json-content"></div>
  </div>
  <script>
    const jsonData = ${JSON.stringify(jsonData, null, 2)};
    
    function renderJSON(data, container, level = 0) {
      container.innerHTML = formatJSON(data, '', level);
      addToggleListeners();
    }
    
    function formatJSON(data, path, level) {
      if (data === null) return '<span class="null">null</span>';
      if (typeof data === 'boolean') return '<span class="boolean">' + data + '</span>';
      if (typeof data === 'number') return '<span class="number">' + data + '</span>';
      if (typeof data === 'string') return '<span class="string">"' + escapeHtml(data) + '"</span>';
      
      if (Array.isArray(data)) {
        if (data.length === 0) return '[]';
        let html = '<span class="bracket" data-path="' + path + '">[<span class="toggle">−</span></span>';
        html += '<div class="content" data-path="' + path + '">';
        data.forEach((item, index) => {
          html += '<div style="margin-left: 20px;">' + index + ': ' + formatJSON(item, path + '[' + index + ']', level + 1);
          if (index < data.length - 1) html += ',';
          html += '</div>';
        });
        html += '</div><span class="bracket">]</span>';
        return html;
      }
      
      if (typeof data === 'object') {
        const keys = Object.keys(data);
        if (keys.length === 0) return '{}';
        let html = '<span class="bracket" data-path="' + path + '">{<span class="toggle">−</span></span>';
        html += '<div class="content" data-path="' + path + '">';
        keys.forEach((key, index) => {
          const keyPath = path ? path + '.' + key : key;
          html += '<div style="margin-left: 20px;"><span class="key">"' + key + '"</span>: ' + formatJSON(data[key], keyPath, level + 1);
          if (index < keys.length - 1) html += ',';
          html += '</div>';
        });
        html += '</div><span class="bracket">}</span>';
        return html;
      }
      
      return String(data);
    }
    
    function escapeHtml(text) {
      const map = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'};
      return text.replace(/[&<>"']/g, m => map[m]);
    }
    
    function addToggleListeners() {
      document.querySelectorAll('.bracket[data-path]').forEach(bracket => {
        bracket.addEventListener('click', function() {
          const path = this.getAttribute('data-path');
          const content = document.querySelector('.content[data-path="' + path + '"]');
          const toggle = this.querySelector('.toggle');
          if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            toggle.textContent = '−';
          } else {
            content.classList.add('collapsed');
            toggle.textContent = '+';
          }
        });
      });
    }
    
    function expandAll() {
      document.querySelectorAll('.content').forEach(content => {
        content.classList.remove('collapsed');
      });
      document.querySelectorAll('.toggle').forEach(toggle => {
        toggle.textContent = '−';
      });
    }
    
    function collapseAll() {
      document.querySelectorAll('.content').forEach(content => {
        content.classList.add('collapsed');
      });
      document.querySelectorAll('.toggle').forEach(toggle => {
        toggle.textContent = '+';
      });
    }
    
    function copyJSON() {
      navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2)).then(() => {
        alert('내용이 복사되었습니다!');
      });
    }
    
    // 초기 렌더링
    renderJSON(jsonData, document.getElementById('json-content'));
  </script>
</body>
</html>`;
    
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(jsonViewerHTML)
      newWindow.document.close()
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
      {/* 안내 문구 추가 */}
      <div className={styles.notice}>
        <small>이미지 처리는 Demo에서 구현되지 않아 임의 처리됩니다</small>
      </div>

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
            onClick={openInNewTab}
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

      {/* JSON 내용 - 단순 출력 */}
      <div className={styles.jsonContent}>
        <div className={styles.jsonWrapper}>
          <pre className={styles.jsonPre}>
            {JSON.stringify(jsonData, null, 2)}
          </pre>
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

