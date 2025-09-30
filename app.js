// 確保這五個欄位名稱與您的 data.csv 標題行完全一致
const HEADERS = ['怪物名稱', '等級', '生命值', '基礎經驗值', '掉落物品'];
let MONSTER_DROPS = [];

// 這是修正後的資料載入與解析函式
async function loadData() {
    const CSV_FILE = 'data.csv';

    try {
        const response = await fetch(CSV_FILE);
        
        // 檢查 HTTP 狀態碼，雖然您已經確認 200 OK，但保留檢查是好習慣
        if (!response.ok) {
            console.error(`Error loading CSV: ${response.status} ${response.statusText}`);
            return;
        }

        const csvText = await response.text();
        
        // 核心修正：使用正規表達式來處理 \r\n 換行，並移除開頭的 UTF-8 BOM 字符
        const normalizedText = csvText.trim().replace(/^\uFEFF/, '');
        
        const lines = normalizedText.split(/\r?\n/);
        
        // 確認有資料行 (至少標題行)
        if (lines.length <= 1) {
            console.warn("CSV file is empty or only contains headers.");
            return;
        }

        const actualHeaders = lines[0].split(',').map(h => h.trim());
        
        if (actualHeaders.length !== HEADERS.length) {
             console.error("Header mismatch! Expected 5 columns, found:", actualHeaders.length);
             return;
        }
        
        MONSTER_DROPS = []; // 清空舊資料
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // 由於您的資料看起來沒有被雙引號包住的逗號，我們繼續使用簡單的 split
            const values = line.split(',');
            
            if (values.length === actualHeaders.length) {
                const row = {};
                // 將值根據標題索引賦予給物件
                actualHeaders.forEach((header, index) => {
                    row[header] = values[index].trim();
                });
                MONSTER_DROPS.push(row);
            } else {
                // 如果某一行欄位數不對，印出該行並跳過
                console.warn(`Skipping malformed line ${i + 1}: Expected ${HEADERS.length} columns, found ${values.length}. Line content:`, line);
            }
        }
        
        // 檢查資料是否成功載入
        console.log(`Data loaded successfully. Total entries: ${MONSTER_DROPS.length}`);
        
        // 載入成功後，重新渲染表格和事件監聽器
        renderTable(MONSTER_DROPS);
        document.getElementById('searchInput').addEventListener('input', filterData);
        
    } catch (error) {
        console.error("An error occurred during data loading or parsing:", error);
    }
}
