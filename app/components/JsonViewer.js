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
export default function JsonViewer({ jsonData, isLoading, uploadedImage }) {
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

  // 새 탭에서 JSON 뷰어 열기
  const openInNewTab = () => {
    const jsonViewerHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>JSON Viewer</title>
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
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
    .title-section { display: flex; align-items: center; gap: 15px; }
    .mode-buttons { display: flex; gap: 8px; }
    .mode-button { 
      padding: 8px 16px; 
      border: 1px solid #ddd; 
      background: white; 
      cursor: pointer; 
      border-radius: 4px; 
      font-size: 14px;
      transition: all 0.2s ease;
    }
    .mode-button.active { 
      background: #667eea; 
      color: white; 
      border-color: #667eea; 
    }
    .mode-button:hover { 
      background: #f0f0f0; 
      transform: translateY(-1px); 
    }
    .mode-button.active:hover { 
      background: #5a67d8; 
    }
    .quo-button { 
      padding: 6px; 
      border: 1px solid #ddd; 
      background: white; 
      cursor: pointer; 
      border-radius: 4px; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      transition: all 0.2s ease;
    }
    .quo-button:hover { background: #f0f0f0; transform: translateY(-1px); }
    .quo-button img { width: 20px; height: 20px; }
    .controls { display: flex; gap: 10px; }
    .button { padding: 8px 16px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px; font-size: 14px; }
    .button:hover { background: #f0f0f0; }
    .button img { width: 16px; height: 16px; vertical-align: middle; }
    
    /* 모드별 콘텐츠 영역 */
    .mode-content { display: none; }
    .mode-content.active { display: block; }
    
    /* Format 모드 스타일 */
    .format-container {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 20px;
    }
    .format-cell {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      padding: 12px;
      border-radius: 6px;
      background: white;
      border: 1px solid #e9ecef;
    }
    .format-cell.question { border-left: 4px solid #3182ce; }
    .format-cell.example { border-left: 4px solid #38a169; }
    .format-cell.choice { border-left: 4px solid #e53e3e; }
    .format-label {
      font-weight: 600;
      min-width: 120px;
      margin-right: 16px;
      color: #2d3748;
    }
    .format-input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #cbd5e0;
      border-radius: 4px;
      font-size: 14px;
      background: #f7fafc;
    }
    .format-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    /* Overlay 모드 스타일 */
    .overlay-container {
      position: relative;
      display: inline-block;
      max-width: 100%;
    }
    .overlay-image {
      max-width: 100%;
      height: auto;
      display: block;
    }
    .overlay-canvas {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
    }
    .overlay-box {
      position: absolute;
      border: 2px solid #e53e3e;
      background: rgba(229, 62, 62, 0.1);
    }
    .overlay-box::before {
      content: attr(data-label);
      position: absolute;
      top: -25px;
      left: -2px;
      background: #e53e3e;
      color: white;
      padding: 2px 6px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 3px;
      white-space: nowrap;
      z-index: 10;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }
    
    /* JSON 모드 스타일 */
    .json-content { white-space: pre-wrap; font-size: 14px; line-height: 1.5; font-family: 'Monaco', 'Menlo', 'Consolas', monospace; }
    .key { color: #d73a49; }
    .string { color: #032f62; }
    .number { color: #005cc5; }
    .boolean { color: #e36209; }
    .null { color: #6f42c1; }
    .bracket { color: #666; cursor: pointer; user-select: none; }
    .toggle { color: #0969da; font-weight: bold; margin: 0 5px; }
    .collapsed { display: none; }
    .item-count { color: #999; font-size: 12px; margin-left: 5px; }
    
    /* 모달 스타일 */
    .modal { 
      display: none; 
      position: fixed; 
      z-index: 1000; 
      left: 0; 
      top: 0; 
      width: 100%; 
      height: 100%; 
      background-color: rgba(0,0,0,0.5); 
      animation: fadeIn 0.3s ease;
    }
    .modal-content { 
      background-color: white; 
      margin: 5% auto; 
      padding: 0; 
      border-radius: 8px; 
      width: 90%; 
      max-width: 800px; 
      max-height: 80vh; 
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease;
    }
    .modal-header { 
      padding: 20px; 
      border-bottom: 1px solid #eee; 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      background: #f8f9fa;
      border-radius: 8px 8px 0 0;
    }
    .modal-header h3 { margin: 0; color: #333; }
    .close { 
      color: #aaa; 
      font-size: 28px; 
      font-weight: bold; 
      cursor: pointer; 
      background: none; 
      border: none;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .close:hover { color: #000; }
    .modal-body { 
      padding: 20px; 
      max-height: 60vh; 
      overflow-y: auto; 
    }
    .standard-json { 
      background: #f8f9fa; 
      border: 1px solid #e9ecef; 
      border-radius: 4px; 
      padding: 15px; 
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace; 
      font-size: 13px; 
      line-height: 1.5; 
      white-space: pre-wrap;
      color: #333;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideIn {
      from { transform: translateY(-50px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title-section">
        <h2>JSON Viewer</h2>
        <div class="mode-buttons">
          <button class="mode-button active" onclick="switchMode('format')">Format</button>
          <button class="mode-button" onclick="switchMode('json')">JSON</button>
          <button class="mode-button" onclick="switchMode('overlay')">Overlay</button>
        </div>
        <button class="quo-button" onclick="showStandardFormat()" title="표준 포맷 보기">
          <img src="/quo.png" alt="Standard Format">
        </button>
      </div>
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
    
    <!-- Format 모드 -->
    <div id="format-content" class="mode-content active">
      <div class="format-container" id="format-container">
        <!-- Format 모드 내용이 여기에 동적으로 생성됩니다 -->
      </div>
    </div>
    
    <!-- JSON 모드 -->
    <div id="json-content" class="mode-content">
      <div class="json-content" id="json-display"></div>
    </div>
    
    <!-- Overlay 모드 -->
    <div id="overlay-content" class="mode-content">
      <div class="overlay-container" id="overlay-container">
        <!-- Overlay 모드 내용이 여기에 동적으로 생성됩니다 -->
      </div>
    </div>
  </div>

  <!-- 표준 포맷 모달 -->
  <div id="standardModal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>표준 JSON 포맷 (v1.1.0)</h3>
        <button class="close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="standard-json" id="standard-format"></div>
      </div>
    </div>
  </div>

  <script>
    const jsonData = ${JSON.stringify(jsonData, null, 2)};
    const uploadedImageData = ${JSON.stringify(uploadedImage, null, 2)};
    let currentMode = 'format';
    
    // 모드 전환 함수
    function switchMode(mode) {
      // 버튼 상태 업데이트
      document.querySelectorAll('.mode-button').forEach(btn => {
        btn.classList.remove('active');
      });
      event.target.classList.add('active');
      
      // 콘텐츠 상태 업데이트
      document.querySelectorAll('.mode-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(mode + '-content').classList.add('active');
      
      currentMode = mode;
      
      // 모드별 초기화
      switch(mode) {
        case 'format':
          renderFormatMode();
          break;
        case 'json':
          renderJSONMode();
          break;
        case 'overlay':
          renderOverlayMode();
          break;
      }
    }
    
    // Format 모드 렌더링
    function renderFormatMode() {
      const container = document.getElementById('format-container');
      container.innerHTML = '';
      
      // JSON 데이터를 파싱하여 format 셀 생성
      const formatData = parseJSONToFormat(jsonData);
      
      formatData.forEach(item => {
        const cell = document.createElement('div');
        cell.className = \`format-cell \${item.type}\`;
        
        const label = document.createElement('div');
        label.className = 'format-label';
        label.textContent = item.label;
        
        const input = document.createElement('input');
        input.className = 'format-input';
        input.type = 'text';
        input.value = item.value;
        input.readOnly = true;
        
        cell.appendChild(label);
        cell.appendChild(input);
        container.appendChild(cell);
      });
    }
    
    // JSON을 Format 모드용 데이터로 변환 (개선된 버전)
    function parseJSONToFormat(data) {
      const formatData = [];
      const allItems = [];
      
      // 모든 항목을 수집하고 order 정보를 포함
      
      // 발문 처리 - 질의문 배열에서 추출
      if (data.발문 && data.발문.질의문 && Array.isArray(data.발문.질의문)) {
        data.발문.질의문.forEach((item, index) => {
          if (item && typeof item === 'object') {
            allItems.push({
              ...item,
              category: '발문',
              categoryIndex: index + 1
            });
          }
        });
      }
      
      // 제시문 처리
      if (data.제시문 && Array.isArray(data.제시문)) {
        data.제시문.forEach((item, index) => {
          if (item && typeof item === 'object') {
            allItems.push({
              ...item,
              category: '제시문',
              categoryIndex: index + 1
            });
          }
        });
      }
      
      // 보기 처리
      if (data.보기 && Array.isArray(data.보기)) {
        data.보기.forEach((item, index) => {
          if (item && typeof item === 'object') {
            allItems.push({
              ...item,
              category: '보기',
              categoryIndex: index + 1,
              displayLabel: item.label || \`\${index + 1}\`
            });
          }
        });
      }
      
      // 선택지 처리
      if (data.선택지 && data.선택지.items && Array.isArray(data.선택지.items)) {
        data.선택지.items.forEach((item, index) => {
          if (item && typeof item === 'object') {
            allItems.push({
              ...item,
              category: '선택지',
              categoryIndex: item.choice_id || (index + 1)
            });
          }
        });
      }
      
      // order 기준으로 정렬
      allItems.sort((a, b) => {
        const orderA = a.order || 999;
        const orderB = b.order || 999;
        return orderA - orderB;
      });
      
      // 정렬된 항목들을 처리
      allItems.forEach(item => {
        const categoryLabel = item.category;
        const index = item.categoryIndex;
        
        // 텍스트 처리
        const text = item.text || item.text_latex || item.text_raw || '';
        
        // 타입별 스타일 결정
        let itemType = 'question';
        if (categoryLabel === '보기' || categoryLabel === '제시문') {
          itemType = 'example';
        } else if (categoryLabel === '선택지') {
          itemType = 'choice';
        }
        
        // 메인 항목 추가
        if (item.type === '이미지') {
          // 이미지 타입 처리
          if (item.bbox) {
            const bboxInfo = \`[좌표] x: \${item.bbox.x}, y: \${item.bbox.y}, w: \${item.bbox.w}, h: \${item.bbox.h}\`;
            formatData.push({
              type: itemType,
              label: \`\${categoryLabel} \${index} (이미지)\`,
              value: bboxInfo,
              order: item.order
            });
          }
          
          // inside_image_text 처리
          if (item.image && item.image.inside_image_text && Array.isArray(item.image.inside_image_text)) {
            item.image.inside_image_text.forEach((textItem, textIndex) => {
              if (textItem && textItem.text) {
                formatData.push({
                  type: itemType,
                  label: \`  └ 텍스트 \${textIndex + 1}\`,
                  value: textItem.text,
                  order: item.order + 0.001 * (textIndex + 1) // 하위 순서 보장
                });
              }
            });
          }
          
          // 이미지 URL 정보 추가
          if (item.image && item.image.url && item.image.url !== 'example.url') {
            formatData.push({
              type: itemType,
              label: \`  └ 이미지 URL\`,
              value: item.image.url,
              order: item.order + 0.999
            });
          }
        } else if (text) {
          // 텍스트 타입 처리
          let label = \`\${categoryLabel}\`;
          if (categoryLabel === '보기' && item.displayLabel) {
            label = \`\${categoryLabel} \${item.displayLabel}\`;
          } else if (index !== undefined) {
            label = \`\${categoryLabel} \${index}\`;
          }
          
          formatData.push({
            type: itemType,
            label: label,
            value: text,
            order: item.order
          });
        }
        
        // 추가 이미지가 있는 경우 처리
        if (item.image && item.image.url && item.type !== '이미지') {
          formatData.push({
            type: itemType,
            label: \`  └ 이미지\`,
            value: item.image.url,
            order: item.order + 0.001
          });
        }
      });
      
      // 추가 필드들 처리 (order 없음)
      const additionalFields = ['문제번호', '문항번호', '메타'];
      additionalFields.forEach(field => {
        if (data[field]) {
          let fieldValue = '';
          if (typeof data[field] === 'object') {
            fieldValue = JSON.stringify(data[field]);
          } else {
            fieldValue = String(data[field]);
          }
          formatData.push({
            type: 'question',
            label: field,
            value: fieldValue,
            order: -1 // 맨 앞에 표시
          });
        }
      });
      
      // 최종 정렬 (order 우선, 같으면 label 순)
      formatData.sort((a, b) => {
        const orderA = a.order || 999;
        const orderB = b.order || 999;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        // order가 같으면 label로 정렬
        return a.label.localeCompare(b.label);
      });
      
      return formatData;
    }
    
    // JSON 모드 렌더링
    function renderJSONMode() {
      const container = document.getElementById('json-display');
      container.innerHTML = formatJSON(jsonData, '', 0);
      addToggleListeners();
    }
    
    // Overlay 모드 렌더링 (개선된 버전)
    function renderOverlayMode() {
      const container = document.getElementById('overlay-container');
      container.innerHTML = '';
      
      // 업로드된 이미지 사용
      let imageUrl = '';
      if (uploadedImageData) {
        if (typeof uploadedImageData === 'string') {
          imageUrl = uploadedImageData;
        } else if (uploadedImageData.dataUrl) {
          imageUrl = uploadedImageData.dataUrl;
        } else if (uploadedImageData.url) {
          imageUrl = uploadedImageData.url;
        }
      }
      
      if (imageUrl) {
        const img = document.createElement('img');
        img.className = 'overlay-image';
        img.src = imageUrl;
        img.onload = function() {
          drawOverlayBoxes(container, img);
        };
        img.onerror = function() {
          container.innerHTML = '<p>이미지를 로드할 수 없습니다.</p>';
        };
        container.appendChild(img);
      } else {
        container.innerHTML = '<p>업로드된 이미지가 없습니다.</p>';
      }
    }
    
    // 오버레이 박스 그리기 (개선된 버전)
    function drawOverlayBoxes(container, img) {
      const canvas = document.createElement('canvas');
      canvas.className = 'overlay-canvas';
      canvas.width = img.offsetWidth;
      canvas.height = img.offsetHeight;
      container.appendChild(canvas);
      
      const ctx = canvas.getContext('2d');
      
      // 모든 bbox 좌표를 찾아서 박스 그리기
      const boxes = findBoundingBoxes(jsonData);
      
      console.log('Found bbox boxes:', boxes);
      console.log('Image dimensions:', img.offsetWidth, 'x', img.offsetHeight);
      
      // 제시문 데이터 디버깅
      if (jsonData.제시문 && jsonData.제시문[0]) {
        console.log('제시문 데이터:', jsonData.제시문[0]);
        console.log('제시문 type:', jsonData.제시문[0].type);
        console.log('제시문 bbox:', jsonData.제시문[0].bbox);
      }
      
      if (boxes.length === 0) {
        const noBoxesMsg = document.createElement('p');
        noBoxesMsg.textContent = 'bbox 좌표를 찾을 수 없습니다.';
        noBoxesMsg.style.color = 'red';
        noBoxesMsg.style.fontWeight = 'bold';
        container.appendChild(noBoxesMsg);
        return;
      }
      
      boxes.forEach((box, index) => {
        const div = document.createElement('div');
        div.className = 'overlay-box';
        
        let left, top, width, height;
        
        if (box.useNormalized) {
          // 정규화된 좌표를 픽셀 좌표로 변환
          left = box.x * img.offsetWidth;
          top = box.y * img.offsetHeight;
          width = box.width * img.offsetWidth;
          height = box.height * img.offsetHeight;
        } else {
          // 이미 픽셀 좌표인 경우 이미지 크기 비율로 조정
          const scaleX = img.offsetWidth / img.naturalWidth;
          const scaleY = img.offsetHeight / img.naturalHeight;
          left = box.x * scaleX;
          top = box.y * scaleY;
          width = box.width * scaleX;
          height = box.height * scaleY;
        }
        
        div.style.left = left + 'px';
        div.style.top = top + 'px';
        div.style.width = width + 'px';
        div.style.height = height + 'px';
        div.setAttribute('data-label', box.label);
        div.title = box.text; // 툴팁으로 텍스트 표시
        
        console.log(\`Box \${index}: \${box.label} at (\${left}, \${top}) size \${width}x\${height} [normalized: \${box.useNormalized}]\`);
        
        container.appendChild(div);
      });
    }
    
    // JSON에서 bbox 좌표 찾기 (개선된 버전)
    function findBoundingBoxes(data) {
      const boxes = [];
      
      console.log('findBoundingBoxes 시작, 데이터:', data);
      
      function traverse(obj, path = '') {
        if (obj && typeof obj === 'object') {
          Object.keys(obj).forEach(key => {
            const currentPath = path ? \`\${path}.\${key}\` : key;
            
            // bbox가 있는 객체 찾기
            if (obj[key] && typeof obj[key] === 'object' && obj[key].bbox) {
              const text = obj[key].text || obj[key].text_latex || obj[key].text_raw || '';
              // 제시문의 경우 type이 '이미지'인 경우도 처리
              const isImageType = obj[key].type === '이미지';
              
              console.log(\`키: \${key}, text: \${text}, type: \${obj[key].type}, isImageType: \${isImageType}\`);
              
              if (text || isImageType) {
                const bbox = obj[key].bbox;
                // 픽셀 좌표 우선 사용, 없으면 정규화된 좌표 사용
                let x, y, width, height;
                let useNormalized = false;
                
                if (bbox.x !== undefined && bbox.y !== undefined) {
                  // 픽셀 좌표가 있는 경우
                  x = bbox.x;
                  y = bbox.y;
                  width = bbox.w || bbox.width || 0;
                  height = bbox.h || bbox.height || 0;
                } else if (bbox.x_norm !== undefined && bbox.y_norm !== undefined) {
                  // 정규화된 좌표만 있는 경우
                  x = bbox.x_norm;
                  y = bbox.y_norm;
                  width = bbox.w_norm || 0;
                  height = bbox.h_norm || 0;
                  useNormalized = true;
                } else {
                  // 좌표가 없는 경우
                  x = 0;
                  y = 0;
                  width = 0;
                  height = 0;
                }
                
                // 제시문 이미지의 경우 특별한 라벨 사용
                let label = key;
                let displayText = text;
                if (isImageType && obj[key].id) {
                  label = '제시문';
                  displayText = '이미지 영역';
                }
                
                boxes.push({
                  x: x,
                  y: y,
                  width: width,
                  height: height,
                  label: label,
                  text: displayText || text,
                  useNormalized: useNormalized
                });
              }
            }
            
            // 배열 내의 객체들도 탐색
            if (Array.isArray(obj[key])) {
              obj[key].forEach((item, index) => {
                if (item && typeof item === 'object') {
                  // 배열 내 객체에 bbox가 있는 경우
                  if (item.bbox) {
                    const text = item.text || item.text_latex || item.text_raw || '';
                    const isImageType = item.type === '이미지';
                    
                    console.log(\`배열 키: \${key}[\${index}], text: \${text}, type: \${item.type}, isImageType: \${isImageType}\`);
                    
                    if (text || isImageType) {
                      const bbox = item.bbox;
                      let x, y, width, height;
                      let useNormalized = false;
                      
                      if (bbox.x !== undefined && bbox.y !== undefined) {
                        // 픽셀 좌표가 있는 경우
                        x = bbox.x;
                        y = bbox.y;
                        width = bbox.w || bbox.width || 0;
                        height = bbox.h || bbox.height || 0;
                      } else if (bbox.x_norm !== undefined && bbox.y_norm !== undefined) {
                        // 정규화된 좌표만 있는 경우
                        x = bbox.x_norm;
                        y = bbox.y_norm;
                        width = bbox.w_norm || 0;
                        height = bbox.h_norm || 0;
                        useNormalized = true;
                      } else {
                        // 좌표가 없는 경우
                        x = 0;
                        y = 0;
                        width = 0;
                        height = 0;
                      }
                      
                      // 제시문 이미지의 경우 특별한 라벨 사용
                      let label = \`\${key}_\${index}\`;
                      let displayText = text;
                      if (isImageType && item.id) {
                        label = '제시문';
                        displayText = '이미지 영역';
                      }
                      
                      boxes.push({
                        x: x,
                        y: y,
                        width: width,
                        height: height,
                        label: label,
                        text: displayText || text,
                        useNormalized: useNormalized
                      });
                    }
                  }
                  
                  // 배열 내 객체의 하위 구조도 탐색
                  traverse(item, \`\${currentPath}[\${index}]\`);
                }
              });
            }
            
            // 일반 객체도 계속 탐색
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
              traverse(obj[key], currentPath);
            }
          });
        }
      }
      
      traverse(data);
      return boxes;
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
    
    // 표준 포맷 모달 표시
    async function showStandardFormat() {
      try {
        const response = await fetch('/std_format.json');
        const standardFormat = await response.json();
        
        document.getElementById('standard-format').textContent = JSON.stringify(standardFormat, null, 2);
        document.getElementById('standardModal').style.display = 'block';
      } catch (error) {
        console.error('표준 포맷 로드 오류:', error);
        alert('표준 포맷을 불러올 수 없습니다.');
      }
    }
    
    // 모달 닫기
    function closeModal() {
      document.getElementById('standardModal').style.display = 'none';
    }
    
    // 모달 외부 클릭 시 닫기
    window.onclick = function(event) {
      const modal = document.getElementById('standardModal');
      if (event.target === modal) {
        closeModal();
      }
    }
    
    // 초기 렌더링 (Format 모드가 기본)
    renderFormatMode();
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

