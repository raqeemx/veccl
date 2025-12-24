/**
 * ========================================
 * 🔥 Firebase Configuration File
 * ========================================
 * 
 * هذا الملف يحتوي على إعدادات Firebase
 * يجب استبدال القيم أدناه بقيم مشروعك الخاص
 * 
 * This file contains Firebase configuration
 * Replace the values below with your own project values
 */

const firebaseConfig = {
  apiKey: "AIzaSyA7B27LIH9FPZAsMKr5lvm2AIa3ZkZNOUo",
  authDomain: "vec-login-58dea.firebaseapp.com",
  projectId: "vec-login-58dea",
  storageBucket: "vec-login-58dea.firebasestorage.app",
  messagingSenderId: "651347381212",
  appId: "1:651347381212:web:dc7eba2bbf69532e13dd19",
  measurementId: "G-P9Q2KBSNQH"
};

/**
 * ========================================
 * كيفية الحصول على هذه القيم
 * How to get these values
 * ========================================
 * 
 * 1. اذهب إلى https://console.firebase.google.com/
 *    Go to https://console.firebase.google.com/
 * 
 * 2. أنشئ مشروع جديد أو اختر مشروع موجود
 *    Create a new project or select an existing one
 * 
 * 3. اذهب إلى إعدادات المشروع (Project Settings)
 *    Go to Project Settings
 * 
 * 4. في قسم "Your apps"، انقر على أيقونة الويب (</>)
 *    In "Your apps" section, click on web icon (</>)
 * 
 * 5. سجل تطبيقك واحصل على القيم
 *    Register your app and get the values
 */

// تصدير الإعدادات للاستخدام في ملفات أخرى
// Export configuration for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfig;
}
