// 創建ICS文件的函數
function createICSFile(events) {
  // ICS文件頭部
  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//114年四技二專統測重要時程//CN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:114年四技二專統測重要時程
X-WR-TIMEZONE:Asia/Taipei
BEGIN:VTIMEZONE
TZID:Asia/Taipei
X-LIC-LOCATION:Asia/Taipei
BEGIN:STANDARD
TZOFFSETFROM:+0800
TZOFFSETTO:+0800
TZNAME:CST
DTSTART:19700101T000000
END:STANDARD
END:VTIMEZONE
`;

  // 為每個事件添加VEVENT區塊
  events.forEach(event => {
    // 解析台灣日期格式 (113/12/16 或 113/12/16-20)
    let startDate = parseROCDate(event.date);
    let endDate = parseROCDateEnd(event.date);
    
    // 生成唯一ID
    const uid = generateUID();
    
    // 添加事件
    icsContent += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatDateForICS(new Date())}
DTSTART;VALUE=DATE:${formatDateForICS(startDate)}
DTEND;VALUE=DATE:${formatDateForICS(endDate)}
SUMMARY:${event.category + ' - ' + event.event}
DESCRIPTION:${event.category + ' - ' + event.description}
STATUS:CONFIRMED
TRANSP:TRANSPARENT
END:VEVENT
`;
  });

  // ICS文件結尾
  icsContent += 'END:VCALENDAR';
  
  return icsContent;
}

// 解析中華民國日期格式 (例如 113/12/16)
function parseROCDate(dateStr) {
  // 處理類似 113/12/16-20 的日期範圍，僅取開始日期
  if (dateStr.includes('-')) {
    dateStr = dateStr.split('-')[0];
  }
  
  // 分解日期部分
  const parts = dateStr.split('/');
  if (parts.length >= 3) {
    // 轉換民國年為西元年
    const year = parseInt(parts[0]) + 1911;
    const month = parseInt(parts[1]) - 1; // JavaScript月份從0開始
    const day = parseInt(parts[2]);
    
    return new Date(year, month, day);
  }
  
  // 預設返回當前日期
  return new Date();
}

// 解析中華民國日期範圍的結束日期 (例如 113/12/16-20)
function parseROCDateEnd(dateStr) {
  if (dateStr.includes('-')) {
    const startDateParts = dateStr.split('-')[0].split('/');
    const endDay = dateStr.split('-')[1];
    
    // 轉換民國年為西元年
    const year = parseInt(startDateParts[0]) + 1911;
    const month = parseInt(startDateParts[1]) - 1; // JavaScript月份從0開始
    const day = parseInt(endDay);
    
    // 如果有結束日期，則使用它
    return new Date(year, month, day);
  }
  
  // 如果沒有結束日期，則使用開始日期並增加一天
  const date = parseROCDate(dateStr);
  date.setDate(date.getDate() + 1);
  return date;
}

// 格式化日期為ICS格式 (YYYYMMDD)
function formatDateForICS(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}${month}${day}`;
}

// 生成唯一ID
function generateUID() {
  return 'techexam114-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// 從頁面中收集事件數據
function collectEventsFromPage() {
  const events = [];
  
  // 獲取所有頁籤
  const tabs = document.querySelectorAll('.tab-content');
  
  // 循環每個頁籤
  tabs.forEach(tab => {
    // 獲取類別名稱
    const category = tab.querySelector('h2').textContent;
    // 獲取類別描述
    const description = tab.querySelector('.description h3').textContent;
    
    // 獲取該頁籤中的所有時間軸項目
    const timelineItems = tab.querySelectorAll('.timeline-item');
    
    // 循環每個時間軸項目
    timelineItems.forEach(item => {
      // 獲取日期和事件
      const date = item.querySelector('.timeline-date').textContent;
      const event = item.querySelector('.timeline-event').textContent;
      
      // 添加到事件數組
      events.push({
        category,
        description,
        date,
        event
      });
    });
  });
  
  return events;
}

// 觸發下載ICS文件
function downloadICS(events) {
  // 創建ICS內容
  const icsContent = createICSFile(events);
  
  // 創建Blob對象
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  
  // 創建下載鏈接
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = '114年四技二專統測重要時程.ics';
  
  // 觸發點擊
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 導出所有事件
function exportAllEvents() {
  const events = collectEventsFromPage();
  downloadICS(events);
}

// 導出特定頁籤的事件
function exportTabEvents(tabId) {
  const allEvents = collectEventsFromPage();
  const tabCategory = document.querySelector(`#${tabId} h2`).textContent;
  
  // 過濾特定頁籤的事件
  const tabEvents = allEvents.filter(event => event.category === tabCategory);
  
  downloadICS(tabEvents);
}

// 為每個頁籤添加導出按鈕
function addExportButtons() {
  // 添加全部導出按鈕
  const tabHeader = document.querySelector('.tab-header');
  const exportAllButton = document.createElement('button');
  exportAllButton.className = 'export-button export-all';
  exportAllButton.innerHTML = '匯出全部事件';
  exportAllButton.onclick = exportAllEvents;
  
  tabHeader.parentNode.insertBefore(exportAllButton, tabHeader.nextSibling);
  
  // 為每個頁籤添加導出按鈕
  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => {
    const tabId = tab.id;
    const exportTabButton = document.createElement('button');
    exportTabButton.className = 'export-button';
    exportTabButton.innerHTML = '匯出此類事件';
    exportTabButton.onclick = () => exportTabEvents(tabId);
    
    // 插入到頁籤標題下方
    const title = tab.querySelector('h2');
    title.parentNode.insertBefore(exportTabButton, title.nextSibling);
  });
}

// 頁面加載後添加導出按鈕
window.addEventListener('DOMContentLoaded', addExportButtons); 