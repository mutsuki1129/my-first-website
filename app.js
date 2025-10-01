// 修正後的標頭名稱
const HEADERS = ['怪物名稱', '等級', '生命值', '基礎經驗', '掉落物品'];
let MONSTER_DROPS_RAW = []; 
let MONSTER_DROPS_MERGED = []; 

// *** 修正: 元素參考回單一搜尋框 ***
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput'); // <--- 重新定義為單一搜尋框
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

// --- loadData, mergeMonsterDrops, renderTable 保持不變 ---

async function loadData() {
    const CSV_FILE = 'data.csv';
    // ... [CSV 檔案載入和解析邏輯，將結果存入 MONSTER_DROPS_RAW] ...
    try {
        dataStatus.textContent = "數據載入中...";
        const response = await fetch(CSV_FILE);
        
        if (!response.ok) {
            dataStatus.textContent = `錯誤: 無法載入數據 (${response.status} ${response.statusText})。`;
            return;
        }
        
        const csvText = await response.text();
        const normalizedText = csvText.trim().replace(/^\uFEFF/, '');
        const lines = normalizedText.split(/\r?\n/);
        
        if (lines.length <= 1) {
            dataStatus.textContent = "數據載入成功，共 0 筆記錄。";
            return;
        }

        const actualHeaders = lines[0].split(',').map(h => h.trim());
        
        if (actualHeaders.length !== HEADERS.length) {
             dataStatus.textContent = `錯誤: 欄位數不匹配！預期 ${HEADERS.length} 欄位，實際找到 ${actualHeaders.length} 欄位。`;
             return;
        }
        
        MONSTER_DROPS_RAW = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = line.split(',').map(v => v.trim()); 
            
            if (values.length === actualHeaders.length) {
                const row = {};
                actualHeaders.forEach((header, index) => {
                    row[header] = values[index];
                });
                MONSTER_DROPS_RAW.push(row);
            }
        }
        
        // 數據合併步驟
        MONSTER_DROPS_MERGED = mergeMonsterDrops(MONSTER_DROPS_RAW);
        
        dataStatus.textContent = `數據載入成功，共 ${MONSTER_DROPS_MERGED.length} 筆怪物記錄。`;
        
        renderTable(MONSTER_DROPS_MERGED);
        initializeControls(); 
        
    } catch (error) {
        dataStatus.textContent = "發生致命錯誤，請檢查瀏覽器 Console。";
        console.error("An error occurred during data loading or parsing:", error);
    }
}

function mergeMonsterDrops(rawDrops) {
    const mergedData = new Map();
    // ... [數據合併邏輯] ...
    rawDrops.forEach(item => {
        const monsterName = item['怪物名稱'];
        
        if (!mergedData.has(monsterName)) {
            mergedData.set(monsterName, {
                '怪物名稱': monsterName,
                '等級': item['等級'],
                '生命值': item['生命值'],
                '基礎經驗': item['基礎經驗'],
                '掉落物品': []
            });
        }
        
        const dropItem = item['掉落物品'].trim();
        if (dropItem) {
            mergedData.get(monsterName)['掉落物品'].push(dropItem);
        }
    });

    return Array.from(mergedData.values());
}

function renderTable(data) {
    tableBody.innerHTML = ''; 
    // ... [表格渲染邏輯] ...
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
        row.insertCell().textContent = item['基礎經驗']; 
        
        const dropCell = row.insertCell();
        dropCell.innerHTML = item['掉落物品'].join('<br>'); 
    });
}

// --- 修正: 初始化控制項 (綁定單一搜尋框) ---
function initializeControls() {
    // *** 修正: 僅綁定單一搜尋框 ***
    searchInput.addEventListener('input', applyFilters);

    levelFilterControls.innerHTML = LEVEL_RANGES.map((range) => `
        <label>
            <input type="checkbox" data-min="${range.min}" data-max="${range.max}" checked>
            ${range.label}
        </label>
    `).join('');

    levelFilterControls.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });

    applyFilters(); 
}

// --- 修正: 合併所有篩選邏輯 (單一搜尋 + 等級) ---
function applyFilters() {
    // 1. 取得單一輸入框的值
    const query = searchInput.value.toLowerCase().trim();
    
    // 2. 取得所有選中的等級區間
    const selectedRanges = Array.from(levelFilterControls.querySelectorAll('input:checked')).map(cb => ({
        min: parseInt(cb.dataset.min),
        max: parseInt(cb.dataset.max)
    }));
    
    let filtered = MONSTER_DROPS_MERGED; 
    
    // 3. 步驟一：等級區間過濾
    if (selectedRanges.length > 0) {
        filtered = filtered.filter(item => {
            const level = parseInt(item['等級']);
            if (isNaN(level)) return false; 
            
            return selectedRanges.some(range => {
                return level >= range.min && level <= range.max;
            });
        });
    }

    // 4. 步驟二：單一文字搜尋過濾
    if (query.length > 0) {
        filtered = filtered.filter(item => {
            // 檢查怪物名稱 OR 掉落物品列表
            const monsterMatch = item['怪物名稱'].toLowerCase().includes(query);
            
            const dropMatch = item['掉落物品'].some(dropItem => 
                dropItem.toLowerCase().includes(query)
            );
            
            return monsterMatch || dropMatch;
        });
    }

    renderTable(filtered);
    dataStatus.textContent = `找到 ${filtered.length} 筆記錄。`;
}

// --- 初始化 ---
document.addEventListener('DOMContentLoaded', loadData);
