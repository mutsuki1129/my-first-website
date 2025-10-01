// 確保這五個欄位名稱與您的 data.csv 標題行完全一致
const HEADERS = ['怪物名稱', '等級', '生命值', '基礎經驗值', '掉落物品'];
let MONSTER_DROPS = []; 
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const dataStatus = document.getElementById('dataStatus');
const levelFilterControls = document.getElementById('levelFilterControls');

// 定義等級區間
const LEVEL_RANGES = [
    { label: 'Lv. 1-10', min: 1, max: 10 },
    { label: 'Lv. 11-20', min: 11, max: 20 },
    { label: 'Lv. 21-30', min: 21, max: 30 },
    { label: 'Lv. 31-40', min: 31, max: 40 },
    { label: 'Lv. 41-50', min: 41, max: 50 },
    { label: 'Lv. 51-60', min: 51, max: 60 },
    { label: 'Lv. 61-70', min: 61, max: 70 },
    { label: 'Lv. 71-80', min: 71, max: 80 },
    { label: 'Lv. 81+', min: 81, max: 999 },
];

// --- 核心 CSV 解析函式 ---
async function loadData() {
    const CSV_FILE = 'data.csv';

    try {
        dataStatus.textContent = "數據載入中...";
        const response = await fetch(CSV_FILE);
        
        if (!response.ok) {
            dataStatus.textContent = `錯誤: 無法載入數據 (${response.status} ${response.statusText})。請檢查檔案路徑。`;
            return;
        }

        const csvText = await response.text();
        const normalizedText = csvText.trim().replace(/^\uFEFF/, '');
        const lines = normalizedText.split(/\r?\n/);
        
        if (lines.length <= 1) {
            dataStatus.textContent = "數據載入成功，共 0 筆記錄 (檔案可能為空)。";
            return;
        }

        const actualHeaders = lines[0].split(',').map(h => h.trim());
        
        if (actualHeaders.length !== HEADERS.length) {
             dataStatus.textContent = `錯誤: 欄位數不匹配！預期 ${HEADERS.length} 欄位，實際找到 ${actualHeaders.length} 欄位。`;
             return;
        }
        
        MONSTER_DROPS = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = line.split(',').map(v => v.trim()); 
            
            if (values.length === actualHeaders.length) {
                const row = {};
                actualHeaders.forEach((header, index) => {
                    row[header] = values[index];
                });
                MONSTER_DROPS.push(row);
            } else {
                console.warn(`Skipping line ${i + 1}: Expected ${HEADERS.length} columns, found ${values.length}. Line:`, line);
            }
        }
        
        dataStatus.textContent = `數據載入成功，共 ${MONSTER_DROPS.length} 筆記錄。`;
        
        // 初始渲染表格和控制項
        renderTable(MONSTER_DROPS);
        initializeControls(); 
        
    } catch (error) {
        dataStatus.textContent = "發生致命錯誤，請檢查瀏覽器 Console。";
        console.error("An error occurred during data loading or parsing:", error);
    }
}

// --- 表格渲染函式 (保持不變) ---
function renderTable(data) {
    tableBody.innerHTML = ''; 
    
    if (data.length === 0) {
        const row = tableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = HEADERS.length;
        cell.textContent = "查無資料。";
        cell.style.textAlign = 'center';
        return;
    }

    data.forEach(item => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = item['怪物名稱'];
        row.insertCell().textContent = item['等級'];
        row.insertCell().textContent = item['生命值'];
        row.insertCell().textContent = item['基礎經驗值'];
        row.insertCell().textContent = item['掉落物品'];
    });
}

// --- 新增：初始化控制項 (生成勾選框) ---
function initializeControls() {
    // 綁定搜尋事件
    searchInput.addEventListener('input', applyFilters);

    // 生成等級區間篩選器 HTML
    levelFilterControls.innerHTML = LEVEL_RANGES.map((range) => `
        <label>
            <input type="checkbox" data-min="${range.min}" data-max="${range.max}" checked>
            ${range.label}
        </label>
    `).join('');

    // 綁定勾選事件，任何勾選框狀態改變都觸發過濾
    levelFilterControls.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });

    // 初始載入時，套用所有預設的篩選器
    applyFilters(); 
}

// --- 修正：合併所有篩選邏輯 ---
function applyFilters() {
    const query = searchInput.value.toLowerCase().trim();
    
    // 1. 取得所有選中的等級區間
    const selectedRanges = Array.from(levelFilterControls.querySelectorAll('input:checked')).map(cb => ({
        min: parseInt(cb.dataset.min),
        max: parseInt(cb.dataset.max)
    }));
    
    let filtered = MONSTER_DROPS;
    
    // 2. 等級區間過濾 (如果沒有任何區間被選中，則不執行等級過濾，顯示所有數據)
    if (selectedRanges.length > 0) {
        filtered = filtered.filter(item => {
            const level = parseInt(item['等級']);
            if (isNaN(level)) return false; // 過濾掉等級無效的資料
            
            return selectedRanges.some(range => {
                return level >= range.min && level <= range.max;
            });
        });
    }


    // 3. 文字搜尋過濾
    if (query.length > 0) {
        filtered = filtered.filter(item => {
            const monsterMatch = item['怪物名稱'].toLowerCase().includes(query);
            const dropMatch = item['掉落物品'].toLowerCase().includes(query);
            return monsterMatch || dropMatch;
        });
    }

    renderTable(filtered);
    dataStatus.textContent = `找到 ${filtered.length} 筆記錄。`;
}

// --- 初始化 ---
document.addEventListener('DOMContentLoaded', loadData);
