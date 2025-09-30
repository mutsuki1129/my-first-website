// 檔案設定：請確保您的 CSV 檔案命名為 data.csv
const CSV_FILE = 'data.csv';
// 儲存解析後的數據
let MONSTER_DROPS = [];
// CSV 檔案的欄位名稱 (必須與您的 CSV 檔案標題行一致)
const HEADERS = ['怪物名稱', '等級', '生命值', '基礎經驗值', '掉落物品'];

// --- 數據載入與解析 ---

async function loadCSV() {
    try {
        const response = await fetch(CSV_FILE);
        // 檢查 HTTP 響應是否成功
        if (!response.ok) {
            throw new Error(`無法載入檔案 ${CSV_FILE}。請檢查檔案名稱及路徑。`);
        }
        const text = await response.text();
        parseCSV(text);
        console.log(`數據載入成功，共 ${MONSTER_DROPS.length} 筆記錄。`);
        // 顯示載入成功的提示
        document.querySelector('#monster-results').innerHTML = `<p style="color: green;">數據載入成功！請開始查詢。</p>`;
    } catch (error) {
        console.error("載入 CSV 檔案時發生錯誤:", error);
        document.querySelector('#monster-results').innerHTML = `<p style="color: red;">錯誤: 無法載入數據，請確認 <strong>${CSV_FILE}</strong> 檔案是否存在且編碼為 **UTF-8**。</p>`;
    }
}

/**
 * 將 CSV 純文字轉換為物件陣列
 * 假設 CSV 數據格式為：怪物名稱,等級,生命值,基礎經驗值,掉落物品
 * @param {string} csvText - CSV 文件的原始文字內容
 */
function parseCSV(csvText) {
    // 移除檔案開頭可能有的 BOM 標記，並將所有行分割
    const lines = csvText.trim().replace(/^\uFEFF/, '').split('\n');
    // 跳過標題行，因為我們假設 HEADERS 已經定義
    lines.shift(); 
    
    MONSTER_DROPS = lines.map(line => {
        // 使用逗號作為分隔符，如果您的 CSV 使用了其他分隔符，請在此處修改
        const values = line.split(','); 
        if (values.length !== HEADERS.length) {
            // 由於您的 CSV 已經被整理為長格式，我們假設每一行都有5個欄位
            return null;
        }
        
        const record = {};
        HEADERS.forEach((header, i) => {
            // 移除可能有的引號並去除空白
            record[header] = values[i].trim().replace(/"/g, '');
        });
        return record;
    }).filter(record => record !== null); // 移除解析錯誤的行
}

// --- 查詢功能函式 ---

/**
 * 依怪物名稱查詢：顯示怪物的詳細數據與所有掉落物
 */
function searchMonster() {
    const query = document.getElementById('monster-input').value.trim().toLowerCase();
    const resultsDiv = document.getElementById('monster-results');
    resultsDiv.innerHTML = '';

    if (query.length < 1) {
        resultsDiv.innerHTML = '<p>請輸入至少一個字查詢怪物名稱。</p>';
        return;
    }

    // 1. 篩選出所有符合查詢的記錄 (使用 includes 進行部分匹配)
    const filteredDrops = MONSTER_DROPS.filter(item => 
        item['怪物名稱'].toLowerCase().includes(query)
    );

    if (filteredDrops.length === 0) {
        resultsDiv.innerHTML = `<p>找不到包含 "${query}" 的怪物。</p>`;
        return;
    }

    // 2. 提取不重複的怪物清單
    const monsterNames = [...new Set(filteredDrops.map(item => item['怪物名稱']))];

    // 3. 逐一處理每個怪物
    monsterNames.forEach(monsterName => {
        // 找到該怪物的所有掉落記錄
        const dropsForMonster = filteredDrops.filter(item => item['怪物名稱'] === monsterName);
        // 提取怪物的基礎資料 (從第一筆記錄中取，因為基礎資料都一樣)
        const monsterInfo = dropsForMonster[0];
        const uniqueDrops = [...new Set(dropsForMonster.map(item => item['掉落物品']))];

        // 4. 渲染結果到 HTML
        const resultHTML = `
            <h3>${monsterName}</h3>
            <table>
                <tr><th>等級</th><td>${monsterInfo['等級']}</td></tr>
                <tr><th>生命值</th><td>${monsterInfo['生命值']}</td></tr>
                <tr><th>基礎經驗值</th><td>${monsterInfo['基礎經驗值']}</td></tr>
            </table>
            <h4>掉落物品 (${uniqueDrops.length} 種)</h4>
            <ul>
                ${uniqueDrops.map(drop => `<li>${drop}</li>`).join('')}
            </ul>
        `;
        resultsDiv.innerHTML += resultHTML;
    });
}

/**
 * 依掉落物品名稱查詢：顯示會掉落該物品的所有怪物清單
 */
function searchDrop() {
    const query = document.getElementById('drop-input').value.trim().toLowerCase();
    const resultsDiv = document.getElementById('drop-results');
    resultsDiv.innerHTML = '';

    if (query.length < 1) {
        resultsDiv.innerHTML = '<p>請輸入至少一個字查詢掉落物品名稱。</p>';
        return;
    }

    // 1. 篩選出所有掉落物包含查詢字串的記錄
    const filteredRecords = MONSTER_DROPS.filter(item => 
        item['掉落物品'].toLowerCase().includes(query)
    );

    if (filteredRecords.length === 0) {
        resultsDiv.innerHTML = `<p>找不到會掉落包含 "${query}" 的物品。</p>`;
        return;
    }

    // 2. 提取不重複的怪物清單，並保留其統計數據
    const monsterMap = new Map();
    filteredRecords.forEach(record => {
        const name = record['怪物名稱'];
        if (!monsterMap.has(name)) {
            // 儲存怪物基礎資料
            monsterMap.set(name, {
                '等級': record['等級'],
                '生命值': record['生命值'],
                '基礎經驗值': record['基礎經驗值'],
                '掉落物品': record['掉落物品'] // 儲存匹配的掉落物名稱
            });
        }
    });

    // 3. 渲染結果表格
    let tableHTML = `
        <h3>會掉落包含 "${query}" 物品的怪物清單 (${monsterMap.size} 種)</h3>
        <table>
            <thead>
                <tr>
                    <th>怪物名稱</th>
                    <th>等級</th>
                    <th>生命值</th>
                    <th>基礎經驗值</th>
                    <th>匹配物品</th>
                </tr>
            </thead>
            <tbody>
    `;

    monsterMap.forEach((info, name) => {
        tableHTML += `
            <tr>
                <td>${name}</td>
                <td>${info['等級']}</td>
                <td>${info['生命值']}</td>
                <td>${info['基礎經驗值']}</td>
                <td>${info['掉落物品']}</td>
            </tr>
        `;
    });

    tableHTML += '</tbody></table>';
    resultsDiv.innerHTML = tableHTML;
}

// --- 初始化與事件綁定 ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. 載入 CSV 數據
    loadCSV();

    // 2. 綁定輸入框事件 (使用 input 事件實現即時查詢)
    document.getElementById('monster-input').addEventListener('input', searchMonster);
    document.getElementById('drop-input').addEventListener('input', searchDrop);
});