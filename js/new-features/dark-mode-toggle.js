/**
 * ========================================
 * 🌙 Dark Mode Toggle - نظام الوضع الليلي
 * ========================================
 * 
 * هذا الملف يتحكم في تبديل الوضع الليلي
 * يحفظ التفضيل في localStorage
 * 
 * ⚠️ لا يعدل أي JavaScript موجود - إضافة فقط!
 */

// ===== Namespace to avoid conflicts =====
window.NFDarkMode = (function() {
    'use strict';
    
    // ===== Constants =====
    const STORAGE_KEY = 'nf-dark-mode';
    const DARK_CLASS = 'dark';
    
    // ===== Initialize Dark Mode =====
    function init() {
        // Check saved preference
        const savedMode = localStorage.getItem(STORAGE_KEY);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Apply dark mode if saved or system prefers
        if (savedMode === 'true' || (savedMode === null && prefersDark)) {
            document.documentElement.classList.add(DARK_CLASS);
        }
        
        // Create toggle button if not exists
        createToggleButton();
        
        // Listen for system preference changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (localStorage.getItem(STORAGE_KEY) === null) {
                if (e.matches) {
                    document.documentElement.classList.add(DARK_CLASS);
                } else {
                    document.documentElement.classList.remove(DARK_CLASS);
                }
                updateButtonIcon();
            }
        });
        
        console.log('🌙 NFDarkMode initialized');
    }
    
    // ===== Create Toggle Button =====
    function createToggleButton() {
        // Check if button already exists
        if (document.getElementById('nf-dark-mode-btn')) return;
        
        const button = document.createElement('button');
        button.id = 'nf-dark-mode-btn';
        button.className = 'nf-dark-mode-toggle';
        button.setAttribute('title', 'تبديل الوضع الليلي / Toggle Dark Mode');
        button.setAttribute('aria-label', 'Toggle dark mode');
        button.onclick = toggle;
        
        updateButtonIcon(button);
        
        document.body.appendChild(button);
    }
    
    // ===== Update Button Icon =====
    function updateButtonIcon(btn) {
        const button = btn || document.getElementById('nf-dark-mode-btn');
        if (!button) return;
        
        const isDark = document.documentElement.classList.contains(DARK_CLASS);
        button.innerHTML = isDark 
            ? '<i class="fas fa-sun"></i>' 
            : '<i class="fas fa-moon"></i>';
    }
    
    // ===== Toggle Dark Mode =====
    function toggle() {
        const isDark = document.documentElement.classList.toggle(DARK_CLASS);
        localStorage.setItem(STORAGE_KEY, isDark.toString());
        updateButtonIcon();
        
        // Show notification if available
        if (window.NFNotify) {
            NFNotify.show({
                message: isDark ? 'تم تفعيل الوضع الليلي 🌙' : 'تم تفعيل الوضع النهاري ☀️',
                type: 'info',
                duration: 2000
            });
        }
        
        // Dispatch custom event for other scripts
        window.dispatchEvent(new CustomEvent('nf-dark-mode-change', { 
            detail: { isDark } 
        }));
        
        return isDark;
    }
    
    // ===== Check if Dark Mode is Active =====
    function isDarkMode() {
        return document.documentElement.classList.contains(DARK_CLASS);
    }
    
    // ===== Enable Dark Mode =====
    function enable() {
        if (!isDarkMode()) {
            toggle();
        }
    }
    
    // ===== Disable Dark Mode =====
    function disable() {
        if (isDarkMode()) {
            toggle();
        }
    }
    
    // ===== Auto Initialize on DOM Ready =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already loaded
        init();
    }
    
    // ===== Public API =====
    return {
        init: init,
        toggle: toggle,
        isDarkMode: isDarkMode,
        enable: enable,
        disable: disable
    };
    
})();
