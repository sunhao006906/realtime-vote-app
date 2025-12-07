// server.js

// 1. 引入必要的模組
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path'); // <-- 只有一個 'path' 宣告

// 2. 初始化 Express 應用程式和 HTTP 伺服器
const app = express();
const server = http.createServer(app);
// 建立 Socket.IO 實例，並將其連接到 HTTP 伺服器
const io = socketIo(server); 

// 3. 初始投票資料和投票紀錄
let votes = {
    optionA: 0, // 選項一的票數
    optionB: 0  // 選項二的票數
};
let voteHistory = {}; // 記錄誰投了票: { '朋友名字': 'optionA' }

// 4. 設定靜態檔案路徑：讓伺服器可以提供前端 HTML 檔案
// 'public' 資料夾將會包含我們的 HTML、CSS 和 JavaScript
app.use(express.static('public')); 

// 處理根路徑請求，返回 index.html
app.get('/', (req, res) => {
    // 確保使用絕對路徑
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 5. 處理 Socket.IO 連線事件 (當有人連線時)
io.on('connection', (socket) => {

    // 儲存使用者名字，以便在重設訊息中顯示
    socket.on('set_username', (username) => {
        socket.username = username; 
    });
        
    console.log('一個Gay進來了。'); // 修正：使用中性用語

    // 【新增】監聽 'reset_votes' 事件
    socket.on('投了_votes', () => {
        // 重設投票資料
        votes = {
            optionA: 0,
            optionB: 0
        };
        voteHistory = {}; // 清空投票紀錄

        console.log('--- 投票結果已被重設 ---');

        // 將最新的 (零票) 投票結果廣播給所有連線中的使用者
        io.emit('update_votes', votes);
        
        // 廣播一條聊天訊息通知所有人
        io.emit('chat_message', `🚨 系統：投票結果已被 ${socket.username || '匿名使用者'} 重設！`);
    });
    
    // 傳送當前的投票結果給這個新的連線
    socket.emit('current_votes', votes); 

    // 監聽 'submit_vote' 事件 (當使用者按下投票按鈕時)
    socket.on('submit_vote', (data) => {
        const { username, choice } = data; // 取得朋友的名字和選擇
        
        // 處理邏輯：如果該使用者投過票，先將舊票減去
        if (voteHistory[username]) {
            votes[voteHistory[username]]--;
        }

        // 增加新的票數
        votes[choice]++;
        // 更新投票紀錄
        voteHistory[username] = choice;

        console.log(`[投票] ${username} 投了 ${choice}。最新票數: 左=${votes.optionA}, 右=${votes.optionB}`);

        // 將最新的投票結果廣播給所有連線中的使用者 (即時更新)
        io.emit('update_votes', votes);
        
        // 廣播一條聊天訊息
        io.emit('chat_message', `🎉 ${username} 投給了 ${choice === 'optionA' ? '左' : '右'}！`);
    });

    socket.on('disconnect', () => {
        console.log('一個Gay跑了。'); 
    });
});

// 6. 啟動伺服器
// 【修正】使用環境變數 PORT，適應 Render 部署
const PORT = process.env.PORT || 3000; 
server.listen(PORT, () => {
    console.log(`伺服器運行在 Port: ${PORT}`);
});