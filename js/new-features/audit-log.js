/**
 * ========================================
 * 📝 Audit Log System - سجل التعديلات والمراجعة
 * ========================================
 * 
 * تسجيل جميع التغييرات في النظام
 * تتبع من قام بالتعديل ومتى وماذا كان التغيير
 * 
 * الإصدار 1.0
 */

// ===== Namespace to avoid conflicts =====
window.NFAuditLog = (function() {
    'use strict';
    
    // ===== Constants =====
    const STORAGE_KEY = 'nf_audit_log';
    const MAX_ENTRIES = 1000; // Keep last 1000 entries
    
    // ===== Action Types =====
    const ACTION_TYPES = {
        // Vehicle Actions
        vehicle_created: { name: 'إنشاء مركبة', icon: 'fa-plus-circle', color: '#16a34a' },
        vehicle_updated: { name: 'تعديل مركبة', icon: 'fa-edit', color: '#2563eb' },
        vehicle_deleted: { name: 'حذف مركبة', icon: 'fa-trash', color: '#dc2626' },
        vehicle_transferred: { name: 'نقل مركبة', icon: 'fa-exchange-alt', color: '#7c3aed' },
        
        // Warehouse Actions
        warehouse_created: { name: 'إنشاء مستودع', icon: 'fa-plus-circle', color: '#16a34a' },
        warehouse_updated: { name: 'تعديل مستودع', icon: 'fa-edit', color: '#2563eb' },
        warehouse_deleted: { name: 'حذف مستودع', icon: 'fa-trash', color: '#dc2626' },
        
        // User Actions
        user_login: { name: 'تسجيل دخول', icon: 'fa-sign-in-alt', color: '#16a34a' },
        user_logout: { name: 'تسجيل خروج', icon: 'fa-sign-out-alt', color: '#6b7280' },
        role_assigned: { name: 'تعيين صلاحية', icon: 'fa-user-shield', color: '#7c3aed' },
        
        // Inventory Actions
        campaign_created: { name: 'إنشاء حملة جرد', icon: 'fa-clipboard-list', color: '#16a34a' },
        campaign_started: { name: 'بدء حملة جرد', icon: 'fa-play', color: '#2563eb' },
        campaign_completed: { name: 'إنهاء حملة جرد', icon: 'fa-flag-checkered', color: '#f59e0b' },
        campaign_approved: { name: 'موافقة على الجرد', icon: 'fa-check-double', color: '#059669' },
        inventory_recorded: { name: 'تسجيل جرد', icon: 'fa-clipboard-check', color: '#2563eb' },
        
        // Data Actions
        data_exported: { name: 'تصدير بيانات', icon: 'fa-download', color: '#6b7280' },
        data_imported: { name: 'استيراد بيانات', icon: 'fa-upload', color: '#6b7280' },
        bulk_delete: { name: 'حذف جماعي', icon: 'fa-trash-alt', color: '#dc2626' },
        
        // System Actions
        settings_changed: { name: 'تغيير الإعدادات', icon: 'fa-cog', color: '#6b7280' },
        backup_created: { name: 'إنشاء نسخة احتياطية', icon: 'fa-database', color: '#16a34a' }
    };
    
    // ===== Get Audit Log =====
    function getLog() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }
    
    // ===== Save Audit Log =====
    function saveLog(log) {
        // Keep only last MAX_ENTRIES
        if (log.length > MAX_ENTRIES) {
            log = log.slice(0, MAX_ENTRIES);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
        
        // Sync to Firestore
        syncToFirestore(log);
    }
    
    // ===== Sync to Firestore =====
    async function syncToFirestore(log) {
        if (typeof firebase !== 'undefined' && firebase.firestore && firebase.auth().currentUser) {
            try {
                const uid = firebase.auth().currentUser.uid;
                await firebase.firestore().collection('users').doc(uid)
                    .collection('audit_log').doc('recent').set({
                        entries: log.slice(0, 100), // Only sync last 100
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
            } catch (error) {
                console.warn('Could not sync audit log to Firestore:', error);
            }
        }
    }
    
    // ===== Log Action =====
    function log(action, details = {}, notes = '') {
        const logEntries = getLog();
        
        const entry = {
            id: 'LOG' + Date.now(),
            action: action,
            actionName: ACTION_TYPES[action]?.name || action,
            details: details,
            notes: notes,
            user: {
                uid: firebase?.auth()?.currentUser?.uid || 'anonymous',
                name: firebase?.auth()?.currentUser?.displayName || 'مجهول',
                email: firebase?.auth()?.currentUser?.email || ''
            },
            timestamp: new Date().toISOString(),
            ip: '', // Would need backend for real IP
            userAgent: navigator.userAgent
        };
        
        logEntries.unshift(entry);
        saveLog(logEntries);
        
        return entry;
    }
    
    // ===== Log Vehicle Change =====
    function logVehicleChange(action, vehicleId, oldData, newData, notes = '') {
        const changes = [];
        
        if (oldData && newData) {
            // Compare and find changes
            Object.keys(newData).forEach(key => {
                if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
                    changes.push({
                        field: key,
                        oldValue: oldData[key],
                        newValue: newData[key]
                    });
                }
            });
        }
        
        return log(action, {
            vehicleId: vehicleId,
            changes: changes,
            snapshot: newData || oldData
        }, notes);
    }
    
    // ===== Get Log by Action =====
    function getLogByAction(action) {
        const logEntries = getLog();
        return logEntries.filter(e => e.action === action);
    }
    
    // ===== Get Log by User =====
    function getLogByUser(userId) {
        const logEntries = getLog();
        return logEntries.filter(e => e.user.uid === userId);
    }
    
    // ===== Get Log by Date Range =====
    function getLogByDateRange(startDate, endDate) {
        const logEntries = getLog();
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return logEntries.filter(e => {
            const date = new Date(e.timestamp);
            return date >= start && date <= end;
        });
    }
    
    // ===== Get Log for Vehicle =====
    function getVehicleHistory(vehicleId) {
        const logEntries = getLog();
        return logEntries.filter(e => e.details?.vehicleId === vehicleId);
    }
    
    // ===== Clear Old Logs =====
    function clearOldLogs(daysToKeep = 90) {
        const logEntries = getLog();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        
        const filtered = logEntries.filter(e => new Date(e.timestamp) > cutoffDate);
        saveLog(filtered);
        
        return logEntries.length - filtered.length; // Return number of deleted entries
    }
    
    // ===== Create Log Entry HTML =====
    function createLogEntryHTML(entry) {
        const actionConfig = ACTION_TYPES[entry.action] || { 
            name: entry.action, 
            icon: 'fa-info-circle', 
            color: '#6b7280' 
        };
        
        const date = new Date(entry.timestamp);
        const formattedDate = date.toLocaleDateString('ar-SA');
        const formattedTime = date.toLocaleTimeString('ar-SA');
        
        return `
            <div class="audit-log-entry" data-id="${entry.id}">
                <div class="entry-icon" style="background: ${actionConfig.color}20; color: ${actionConfig.color}">
                    <i class="fas ${actionConfig.icon}"></i>
                </div>
                <div class="entry-content">
                    <div class="entry-header">
                        <span class="entry-action">${actionConfig.name}</span>
                        <span class="entry-time">${formattedDate} ${formattedTime}</span>
                    </div>
                    <div class="entry-user">
                        <i class="fas fa-user"></i> ${entry.user.name || entry.user.email}
                    </div>
                    ${entry.details?.vehicleId ? `
                        <div class="entry-target">
                            <i class="fas fa-car"></i> المركبة: ${entry.details.vehicleId}
                        </div>
                    ` : ''}
                    ${entry.notes ? `<div class="entry-notes">${entry.notes}</div>` : ''}
                    ${entry.details?.changes?.length > 0 ? `
                        <div class="entry-changes">
                            <small>التغييرات:</small>
                            <ul>
                                ${entry.details.changes.map(c => `
                                    <li><strong>${c.field}:</strong> ${c.oldValue || 'فارغ'} → ${c.newValue || 'فارغ'}</li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    // ===== Create Audit Log Panel HTML =====
    function createAuditLogPanelHTML(filters = {}) {
        let logEntries = getLog();
        
        // Apply filters
        if (filters.action) {
            logEntries = logEntries.filter(e => e.action === filters.action);
        }
        if (filters.user) {
            logEntries = logEntries.filter(e => e.user.uid === filters.user);
        }
        if (filters.startDate) {
            logEntries = logEntries.filter(e => new Date(e.timestamp) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            logEntries = logEntries.filter(e => new Date(e.timestamp) <= new Date(filters.endDate));
        }
        
        // Limit display
        const displayLimit = filters.limit || 100;
        logEntries = logEntries.slice(0, displayLimit);
        
        let html = `
            <div class="audit-log-panel">
                <div class="audit-log-header">
                    <h4><i class="fas fa-history"></i> سجل التغييرات</h4>
                    <div class="audit-log-filters">
                        <select id="auditActionFilter" onchange="NFAuditLog.applyFilters()">
                            <option value="">كل الإجراءات</option>
        `;
        
        Object.entries(ACTION_TYPES).forEach(([key, config]) => {
            html += `<option value="${key}" ${filters.action === key ? 'selected' : ''}>${config.name}</option>`;
        });
        
        html += `
                        </select>
                        <input type="date" id="auditStartDate" value="${filters.startDate || ''}" onchange="NFAuditLog.applyFilters()">
                        <input type="date" id="auditEndDate" value="${filters.endDate || ''}" onchange="NFAuditLog.applyFilters()">
                        <button class="btn btn-sm btn-outline" onclick="NFAuditLog.exportLog()">
                            <i class="fas fa-download"></i> تصدير
                        </button>
                    </div>
                </div>
                
                <div class="audit-log-entries" id="auditLogEntries">
        `;
        
        if (logEntries.length === 0) {
            html += `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>لا توجد سجلات</p>
                </div>
            `;
        } else {
            logEntries.forEach(entry => {
                html += createLogEntryHTML(entry);
            });
        }
        
        html += `
                </div>
                
                <div class="audit-log-footer">
                    <span>إجمالي السجلات: ${getLog().length}</span>
                    <span>معروض: ${logEntries.length}</span>
                </div>
            </div>
        `;
        
        return html;
    }
    
    // ===== Apply Filters =====
    function applyFilters() {
        const action = document.getElementById('auditActionFilter')?.value || '';
        const startDate = document.getElementById('auditStartDate')?.value || '';
        const endDate = document.getElementById('auditEndDate')?.value || '';
        
        const container = document.getElementById('auditLogEntries');
        if (container) {
            let logEntries = getLog();
            
            if (action) logEntries = logEntries.filter(e => e.action === action);
            if (startDate) logEntries = logEntries.filter(e => new Date(e.timestamp) >= new Date(startDate));
            if (endDate) logEntries = logEntries.filter(e => new Date(e.timestamp) <= new Date(endDate));
            
            logEntries = logEntries.slice(0, 100);
            
            if (logEntries.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-history"></i>
                        <p>لا توجد سجلات</p>
                    </div>
                `;
            } else {
                container.innerHTML = logEntries.map(entry => createLogEntryHTML(entry)).join('');
            }
        }
    }
    
    // ===== Export Log =====
    function exportLog() {
        const logEntries = getLog();
        const blob = new Blob([JSON.stringify(logEntries, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_log_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (window.NFNotify) {
            NFNotify.show({ message: 'تم تصدير سجل التغييرات', type: 'success' });
        }
    }
    
    // ===== Return Public API =====
    return {
        ACTION_TYPES,
        getLog,
        log,
        logVehicleChange,
        getLogByAction,
        getLogByUser,
        getLogByDateRange,
        getVehicleHistory,
        clearOldLogs,
        createLogEntryHTML,
        createAuditLogPanelHTML,
        applyFilters,
        exportLog
    };
})();
