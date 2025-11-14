// Firebase 配置檔案範本
// Firebase Configuration Template
// 
// 使用說明：
// 1. 複製此檔案並重新命名為 firebase-config.js
// 2. 將下方的佔位符號替換為您的實際 Firebase 專案資訊
// 3. firebase-config.js 已加入 .gitignore，不會被推送到 Git
//
// Instructions:
// 1. Copy this file and rename it to firebase-config.js
// 2. Replace the placeholders below with your actual Firebase project information
// 3. firebase-config.js is included in .gitignore and won't be pushed to Git

const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// 匯出配置供其他檔案使用
// Export configuration for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfig;
}
