/**
 * ========================================
 * 🔔 Enhanced Notifications - إشعارات محسنة
 * ========================================
 * 
 * نظام إشعارات متقدم مع أنماط جميلة
 * 
 * ⚠️ لا يعدل أي JavaScript موجود - إضافة فقط!
 */

// ===== Namespace to avoid conflicts =====
window.NFNotify = (function() {
    'use strict';
    
    // ===== Constants =====
    const CONTAINER_ID = 'nf-notification-container';
    const DEFAULT_DURATION = 4000;
    const MAX_NOTIFICATIONS = 5;
    
    // ===== Icons Map =====
    const ICONS = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    // ===== Titles Map =====
    const TITLES = {
        success: 'نجاح!',
        error: 'خطأ!',
        warning: 'تحذير!',
        info: 'معلومة'
    };
    
    // ===== Get or Create Container =====
    function getContainer() {
        let container = document.getElementById(CONTAINER_ID);
        if (!container) {
            container = document.createElement('div');
            container.id = CONTAINER_ID;
            container.className = 'nf-notification-container';
            document.body.appendChild(container);
        }
        return container;
    }
    
    // ===== Show Notification =====
    function show(options) {
        const {
            message,
            title = null,
            type = 'info',
            duration = DEFAULT_DURATION,
            showProgress = true,
            onClick = null
        } = typeof options === 'string' ? { message: options } : options;
        
        const container = getContainer();
        
        // Limit notifications
        while (container.children.length >= MAX_NOTIFICATIONS) {
            removeNotification(container.firstChild);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `nf-notification nf-${type}`;
        
        // Add click handler
        if (onClick) {
            notification.style.cursor = 'pointer';
            notification.onclick = () => {
                onClick();
                removeNotification(notification);
            };
        }
        
        notification.innerHTML = `
            <div class="nf-notification-icon">
                <i class="fas ${ICONS[type] || ICONS.info}"></i>
            </div>
            <div class="nf-notification-content">
                <span class="nf-notification-title">${title || TITLES[type] || TITLES.info}</span>
                <span class="nf-notification-message">${message}</span>
            </div>
            <button class="nf-notification-close" aria-label="إغلاق">
                <i class="fas fa-times"></i>
            </button>
            ${showProgress && duration > 0 ? `
                <div class="nf-notification-progress">
                    <div class="nf-notification-progress-bar" style="transition: width ${duration}ms linear; width: 100%;"></div>
                </div>
            ` : ''}
        `;
        
        // Add close handler
        const closeBtn = notification.querySelector('.nf-notification-close');
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            removeNotification(notification);
        };
        
        // Add to container
        container.appendChild(notification);
        
        // Start progress animation
        if (showProgress && duration > 0) {
            const progressBar = notification.querySelector('.nf-notification-progress-bar');
            requestAnimationFrame(() => {
                progressBar.style.width = '0%';
            });
        }
        
        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                removeNotification(notification);
            }, duration);
        }
        
        // Play sound (optional - uncomment if needed)
        // playSound(type);
        
        return notification;
    }
    
    // ===== Remove Notification =====
    function removeNotification(notification) {
        if (!notification || !notification.parentNode) return;
        
        notification.classList.add('nf-removing');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
    
    // ===== Shorthand Methods =====
    function success(message, options = {}) {
        return show({ message, type: 'success', ...options });
    }
    
    function error(message, options = {}) {
        return show({ message, type: 'error', ...options });
    }
    
    function warning(message, options = {}) {
        return show({ message, type: 'warning', ...options });
    }
    
    function info(message, options = {}) {
        return show({ message, type: 'info', ...options });
    }
    
    // ===== Clear All Notifications =====
    function clearAll() {
        const container = document.getElementById(CONTAINER_ID);
        if (container) {
            Array.from(container.children).forEach(removeNotification);
        }
    }
    
    // ===== Play Sound (Optional) =====
    function playSound(type) {
        // Uncomment and add sound files if needed
        // const sounds = {
        //     success: '/sounds/success.mp3',
        //     error: '/sounds/error.mp3',
        //     warning: '/sounds/warning.mp3',
        //     info: '/sounds/info.mp3'
        // };
        // const audio = new Audio(sounds[type] || sounds.info);
        // audio.volume = 0.3;
        // audio.play().catch(() => {}); // Ignore errors
    }
    
    // ===== Initialize on Load =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', getContainer);
    } else {
        getContainer();
    }
    
    console.log('🔔 NFNotify initialized');
    
    // ===== Public API =====
    return {
        show: show,
        success: success,
        error: error,
        warning: warning,
        info: info,
        clearAll: clearAll
    };
    
})();

// ===== Legacy Compatibility =====
// This allows existing code to use notify.success() etc.
window.notify = window.NFNotify;
