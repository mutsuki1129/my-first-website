// 確保這五個欄位名稱與您的 data.csv 標題行完全一致
const HEADERS = ['怪物名稱', '等級', '生命值', '基礎經驗值', '掉落物品'];
let MONSTER_DROPS = []; // 儲存所有解析後的數據
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const dataStatus = document.getElementById('dataStatus');

// --- 核心 CSV 解析函式 (已優化) ---
async function loadData() {
    const CSV_FILE = 'data.csv';

    try {
        dataStatus.textContent = "數據載入中...";
        const response = await fetch(CSV_FILE);
        
        if (!response.ok) {
            dataStatus.textContent = `錯誤: 無法載入數據 (${response.status} ${response.statusText})。請檢查檔案路徑。`;
            console.error(`Error loading CSV: ${response.status} ${response.statusText}`);
            return;
        }

        const csvText = await response.text();
        
        // 1. 清理：處理 UTF-8 BOM 和換行符號
        const normalizedText = csvText.trim().replace(/^\uFEFF/, '');
        const lines = normalizedText.split(/\r?\n/);
        
        if (lines.length <= 1) {
            dataStatus.textContent = "數據載入成功，共 0 筆記錄 (檔案可能為空)。";
            return;
        }

        const actualHeaders = lines[0].split(',').map(h => h.trim());
        
        if (actualHeaders.length !== HEADERS.length) {
             dataStatus.textContent = `錯誤: 欄位數不匹配！預期 ${HEADERS.length} 欄位，實際找到 ${actualHeaders.length} 欄位。`;
             console.error("Header mismatch! Expected:", HEADERS, "Found:", actualHeaders);
             return;
        }
        
        // 2. 解析資料行
        MONSTER_DROPS = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // 【關鍵優化】確保每個值在分割後都去除空格
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
        
        // 3. 完成載入
        dataStatus.textContent = `數據載入成功，共 ${MONSTER_DROPS.length} 筆記錄。`;
        
        // 初始渲染表格
        renderTable(MONSTER_DROPS);
        
    } catch (error) {
        dataStatus.textContent = "發生致命錯誤，請檢查 Console。";
        console.error("An error occurred during data loading or parsing:", error);
    }
}

// --- 表格渲染函式 ---
function renderTable(data) {
    tableBody.innerHTML = ''; // 清空舊內容
    
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
        // 依序插入 5 個欄位
        row.insertCell().textContent = item['怪物名稱'];
        row.insertCell().textContent = item['等級'];
        row.insertCell().textContent = item['生命值'];
        row.insertCell().textContent = item['基礎經驗值'];
        row.insertCell().textContent = item['掉落物品'];
    });
}

// --- 篩選/搜尋函式 ---
function filterData() {
    const query = searchInput.value.toLowerCase().trim();
    
    // 如果查詢字串為空，顯示所有數據
    if (query.length === 0) {
        renderTable(MONSTER_DROPS);
        dataStatus.textContent = `數據載入成功，共 ${MONSTER_DROPS.length} 筆記錄。`;
        return;
    }

    // 篩選邏輯：檢查怪物名稱或掉落物品是否包含查詢字串
    const filtered = MONSTER_DROPS.filter(item => {
        const monsterMatch = item['怪物名稱'].toLowerCase().includes(query);
        const dropMatch = item['掉落物品'].toLowerCase().includes(query);
        return monsterMatch || dropMatch;
    });

    renderTable(filtered);
    dataStatus.textContent = `找到 ${filtered.length} 筆符合「${query}」的記錄。`;
}

// --- 初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    loadData(); // 載入數據
    searchInput.addEventListener('input', filterData); // 綁定搜尋事件
});
