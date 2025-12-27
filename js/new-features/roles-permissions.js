/**
 * ========================================
 * 🔐 Roles & Permissions System - نظام الصلاحيات والأدوار
 * ========================================
 * 
 * أربعة أدوار:
 * - admin: مدير النظام (كامل الصلاحيات)
 * - warehouse_manager: مدير المستودع (إدارة موقع واحد)
 * - inventory_staff: موظف الجرد (إضافة وتعديل فقط)
 * - viewer: مراقب (عرض فقط)
 * 
 * الإصدار 2.0 - مع إدارة المستخدمين
 */

// ===== Namespace to avoid conflicts =====
window.NFRoles = (function() {
    'use strict';
    
    // ===== Constants =====
    const STORAGE_KEY = 'nf_users_roles';
    const CURRENT_USER_ROLE_KEY = 'nf_current_user_role';
    
    // ===== Role Definitions =====
    const ROLES = {
        admin: {
            id: 'admin',
            name: 'مدير النظام',
            nameEn: 'System Admin',
            color: '#dc2626',
            icon: 'fa-shield-alt',
            permissions: [
                'view_all_vehicles',
                'add_vehicle',
                'edit_vehicle',
                'delete_vehicle',
                'view_all_warehouses',
                'add_warehouse',
                'edit_warehouse',
                'delete_warehouse',
                'transfer_vehicle',
                'view_all_reports',
                'export_reports',
                'manage_users',
                'manage_roles',
                'view_audit_log',
                'manage_inventory_campaigns',
                'approve_inventory',
                'delete_all_data',
                'system_settings'
            ]
        },
        warehouse_manager: {
            id: 'warehouse_manager',
            name: 'مدير المستودع',
            nameEn: 'Warehouse Manager',
            color: '#2563eb',
            icon: 'fa-warehouse',
            permissions: [
                'view_own_warehouse_vehicles',
                'add_vehicle',
                'edit_vehicle',
                'view_own_warehouse',
                'transfer_vehicle',
                'view_own_reports',
                'export_reports',
                'manage_inventory_campaigns',
                'view_audit_log'
            ]
        },
        inventory_staff: {
            id: 'inventory_staff',
            name: 'موظف الجرد',
            nameEn: 'Inventory Staff',
            color: '#16a34a',
            icon: 'fa-clipboard-list',
            permissions: [
                'view_all_vehicles',
                'add_vehicle',
                'edit_vehicle',
                'view_all_warehouses',
                'view_own_reports',
                'conduct_inventory'
            ]
        },
        viewer: {
            id: 'viewer',
            name: 'مراقب',
            nameEn: 'Viewer',
            color: '#6b7280',
            icon: 'fa-eye',
            permissions: [
                'view_all_vehicles',
                'view_all_warehouses',
                'view_own_reports'
            ]
        }
    };
    
    // ===== Permission Descriptions =====
    const PERMISSION_DESCRIPTIONS = {
        view_all_vehicles: 'عرض جميع المركبات',
        view_own_warehouse_vehicles: 'عرض مركبات المستودع فقط',
        add_vehicle: 'إضافة مركبة',
        edit_vehicle: 'تعديل مركبة',
        delete_vehicle: 'حذف مركبة',
        view_all_warehouses: 'عرض جميع المستودعات',
        view_own_warehouse: 'عرض المستودع الخاص',
        add_warehouse: 'إضافة مستودع',
        edit_warehouse: 'تعديل مستودع',
        delete_warehouse: 'حذف مستودع',
        transfer_vehicle: 'نقل مركبة',
        view_all_reports: 'عرض جميع التقارير',
        view_own_reports: 'عرض التقارير الخاصة',
        export_reports: 'تصدير التقارير',
        manage_users: 'إدارة المستخدمين',
        manage_roles: 'إدارة الأدوار',
        view_audit_log: 'عرض سجل التغييرات',
        manage_inventory_campaigns: 'إدارة حملات الجرد',
        conduct_inventory: 'إجراء الجرد',
        approve_inventory: 'الموافقة على الجرد',
        delete_all_data: 'حذف جميع البيانات',
        system_settings: 'إعدادات النظام'
    };
    
    // ===== Get User Roles Data =====
    function getUsersRoles() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    }
    
    // ===== Save Users Roles =====
    function saveUsersRoles(rolesData) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rolesData));
        syncToFirestore(rolesData);
    }
    
    // ===== Sync to Firestore =====
    async function syncToFirestore(rolesData) {
        if (typeof firebase !== 'undefined' && firebase.firestore && firebase.auth().currentUser) {
            try {
                const uid = firebase.auth().currentUser.uid;
                const currentRole = getCurrentUserRole();
                if (currentRole === 'admin') {
                    await firebase.firestore().collection('system').doc('roles').set({
                        users: rolesData,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            } catch (error) {
                console.warn('Could not sync roles to Firestore:', error);
            }
        }
    }
    
    // ===== Get Current User Role =====
    function getCurrentUserRole() {
        const cachedRole = localStorage.getItem(CURRENT_USER_ROLE_KEY);
        if (cachedRole) return cachedRole;
        
        if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
            const uid = firebase.auth().currentUser.uid;
            const usersRoles = getUsersRoles();
            return usersRoles[uid]?.role || 'viewer';
        }
        
        return 'admin';
    }
    
    // ===== Set Current User Role =====
    function setCurrentUserRole(role) {
        localStorage.setItem(CURRENT_USER_ROLE_KEY, role);
        
        if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
            const uid = firebase.auth().currentUser.uid;
            const usersRoles = getUsersRoles();
            usersRoles[uid] = {
                role: role,
                email: firebase.auth().currentUser.email,
                name: firebase.auth().currentUser.displayName,
                assignedAt: new Date().toISOString()
            };
            saveUsersRoles(usersRoles);
        }
    }
    
    // ===== Check Permission =====
    function hasPermission(permission) {
        const role = getCurrentUserRole();
        const roleConfig = ROLES[role];
        return roleConfig?.permissions?.includes(permission) || false;
    }
    
    // ===== Check Multiple Permissions (any) =====
    function hasAnyPermission(permissions) {
        return permissions.some(p => hasPermission(p));
    }
    
    // ===== Check Multiple Permissions (all) =====
    function hasAllPermissions(permissions) {
        return permissions.every(p => hasPermission(p));
    }
    
    // ===== Get Role Info =====
    function getRoleInfo(roleId) {
        return ROLES[roleId] || null;
    }
    
    // ===== Get All Roles =====
    function getAllRoles() {
        return ROLES;
    }
    
    // ===== Get Permission Description =====
    function getPermissionDescription(permission) {
        return PERMISSION_DESCRIPTIONS[permission] || permission;
    }
    
    // ===== Assign Role to User =====
    function assignRole(userId, role, assignedWarehouse = null) {
        const usersRoles = getUsersRoles();
        const existingUser = usersRoles[userId] || {};
        
        usersRoles[userId] = {
            ...existingUser,
            role: role,
            assignedWarehouse: assignedWarehouse,
            assignedAt: new Date().toISOString(),
            assignedBy: firebase?.auth()?.currentUser?.displayName || 'النظام'
        };
        saveUsersRoles(usersRoles);
        
        if (window.NFAuditLog) {
            NFAuditLog.log('role_assigned', {
                userId: userId,
                newRole: role,
                assignedWarehouse: assignedWarehouse
            });
        }
        
        return true;
    }
    
    // ===== Add New User =====
    function addUser(userData) {
        if (!hasPermission('manage_users')) {
            console.warn('No permission to manage users');
            return false;
        }
        
        const usersRoles = getUsersRoles();
        const newUserId = 'USER_' + Date.now();
        
        usersRoles[newUserId] = {
            id: newUserId,
            email: userData.email,
            name: userData.name,
            phone: userData.phone || '',
            role: userData.role || 'viewer',
            assignedWarehouse: userData.assignedWarehouse || null,
            isManualUser: true, // علامة للمستخدمين المضافين يدوياً
            createdAt: new Date().toISOString(),
            createdBy: firebase?.auth()?.currentUser?.displayName || 'النظام',
            status: 'active'
        };
        
        saveUsersRoles(usersRoles);
        
        if (window.NFAuditLog) {
            NFAuditLog.log('user_added', {
                userId: newUserId,
                email: userData.email,
                role: userData.role
            });
        }
        
        return newUserId;
    }
    
    // ===== Delete User =====
    function deleteUser(userId) {
        if (!hasPermission('manage_users')) {
            console.warn('No permission to manage users');
            return false;
        }
        
        // لا يمكن حذف المستخدم الحالي
        if (firebase?.auth()?.currentUser?.uid === userId) {
            if (window.showNotification) {
                showNotification('لا يمكنك حذف حسابك الخاص', 'error');
            }
            return false;
        }
        
        const usersRoles = getUsersRoles();
        const deletedUser = usersRoles[userId];
        
        if (!deletedUser) {
            return false;
        }
        
        delete usersRoles[userId];
        saveUsersRoles(usersRoles);
        
        if (window.NFAuditLog) {
            NFAuditLog.log('user_deleted', {
                userId: userId,
                email: deletedUser.email
            });
        }
        
        return true;
    }
    
    // ===== Update User =====
    function updateUser(userId, updates) {
        if (!hasPermission('manage_users')) {
            console.warn('No permission to manage users');
            return false;
        }
        
        const usersRoles = getUsersRoles();
        
        if (!usersRoles[userId]) {
            return false;
        }
        
        usersRoles[userId] = {
            ...usersRoles[userId],
            ...updates,
            updatedAt: new Date().toISOString(),
            updatedBy: firebase?.auth()?.currentUser?.displayName || 'النظام'
        };
        
        saveUsersRoles(usersRoles);
        
        if (window.NFAuditLog) {
            NFAuditLog.log('user_updated', {
                userId: userId,
                updates: Object.keys(updates)
            });
        }
        
        return true;
    }
    
    // ===== Get User's Assigned Warehouse =====
    function getUserAssignedWarehouse(userId) {
        const usersRoles = getUsersRoles();
        return usersRoles[userId]?.assignedWarehouse || null;
    }
    
    // ===== Create Role Badge HTML =====
    function createRoleBadge(roleId) {
        const role = ROLES[roleId];
        if (!role) return '';
        
        return `
            <span class="role-badge" style="background: ${role.color}; color: white; padding: 3px 10px; border-radius: 12px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 5px;">
                <i class="fas ${role.icon}"></i> ${role.name}
            </span>
        `;
    }
    
    // ===== Create Role Selector HTML =====
    function createRoleSelector(selectedRole = '', selectId = 'userRole') {
        let html = `<select class="form-input role-selector" id="${selectId}" name="role">`;
        
        Object.values(ROLES).forEach(role => {
            html += `<option value="${role.id}" ${role.id === selectedRole ? 'selected' : ''}>${role.name} (${role.nameEn})</option>`;
        });
        
        html += '</select>';
        return html;
    }
    
    // ===== Create Users Management Modal Content =====
    function createUsersModalContent() {
        const usersRoles = getUsersRoles();
        const warehouses = window.NFWarehouse ? NFWarehouse.getWarehouses() : [];
        
        let warehouseOptions = '<option value="">-- لا يوجد --</option>';
        warehouses.forEach(w => {
            warehouseOptions += `<option value="${w.id}">${w.name}</option>`;
        });
        
        let html = `
            <div class="users-management" style="max-height: 70vh; overflow-y: auto;">
                <!-- قسم إضافة مستخدم جديد -->
                <div class="add-user-section" style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                    <h4 style="margin-bottom: 15px; color: #1f2937;">
                        <i class="fas fa-user-plus" style="color: #16a34a;"></i> إضافة مستخدم جديد
                    </h4>
                    <form id="addUserForm" onsubmit="NFRoles.handleAddUser(event)">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div class="form-group">
                                <label>الاسم *</label>
                                <input type="text" class="form-input" name="name" required placeholder="اسم المستخدم">
                            </div>
                            <div class="form-group">
                                <label>البريد الإلكتروني *</label>
                                <input type="email" class="form-input" name="email" required placeholder="email@example.com">
                            </div>
                            <div class="form-group">
                                <label>رقم الهاتف</label>
                                <input type="tel" class="form-input" name="phone" placeholder="05xxxxxxxx">
                            </div>
                            <div class="form-group">
                                <label>الدور *</label>
                                ${createRoleSelector('viewer', 'newUserRole')}
                            </div>
                            <div class="form-group">
                                <label>المستودع المخصص</label>
                                <select class="form-input" name="assignedWarehouse">
                                    ${warehouseOptions}
                                </select>
                            </div>
                            <div class="form-group" style="display: flex; align-items: flex-end;">
                                <button type="submit" class="btn btn-success" style="width: 100%;">
                                    <i class="fas fa-plus"></i> إضافة المستخدم
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
                
                <!-- الأدوار المتاحة -->
                <div class="roles-legend" style="background: #f0f9ff; padding: 15px; border-radius: 12px; margin-bottom: 20px;">
                    <h5 style="margin-bottom: 10px;"><i class="fas fa-key"></i> الأدوار المتاحة:</h5>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
        `;
        
        Object.values(ROLES).forEach(role => {
            html += `
                <div style="display: flex; align-items: center; gap: 8px; padding: 5px 12px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <i class="fas ${role.icon}" style="color: ${role.color}"></i>
                    <span>${role.name}</span>
                    <small style="color: #94a3b8;">(${role.permissions.length} صلاحية)</small>
                </div>
            `;
        });
        
        html += `
                    </div>
                </div>
                
                <!-- قائمة المستخدمين -->
                <div class="users-list">
                    <h5 style="margin-bottom: 15px;"><i class="fas fa-users"></i> المستخدمون المسجلون (${Object.keys(usersRoles).length})</h5>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                            <thead>
                                <tr style="background: #f1f5f9;">
                                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">المستخدم</th>
                                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">الدور</th>
                                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">المستودع</th>
                                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">تاريخ الإضافة</th>
                                    <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
        `;
        
        const currentUid = firebase?.auth()?.currentUser?.uid;
        
        Object.entries(usersRoles).forEach(([uid, userData]) => {
            const isCurrentUser = uid === currentUid;
            const warehouseName = userData.assignedWarehouse && window.NFWarehouse 
                ? NFWarehouse.getWarehouseById(userData.assignedWarehouse)?.name || userData.assignedWarehouse
                : '-';
            
            html += `
                <tr style="border-bottom: 1px solid #e5e7eb; ${isCurrentUser ? 'background: #fef9c3;' : ''}">
                    <td style="padding: 12px;">
                        <div style="display: flex; flex-direction: column;">
                            <strong>${userData.name || 'غير معروف'}</strong>
                            <small style="color: #64748b;">${userData.email || uid}</small>
                            ${userData.phone ? `<small style="color: #64748b;"><i class="fas fa-phone"></i> ${userData.phone}</small>` : ''}
                            ${isCurrentUser ? '<span style="font-size: 0.7rem; color: #d97706;">(أنت)</span>' : ''}
                        </div>
                    </td>
                    <td style="padding: 12px;">${createRoleBadge(userData.role)}</td>
                    <td style="padding: 12px;">${warehouseName}</td>
                    <td style="padding: 12px;">${userData.assignedAt ? new Date(userData.assignedAt).toLocaleDateString('ar-SA') : '-'}</td>
                    <td style="padding: 12px; text-align: center;">
                        <div style="display: flex; gap: 5px; justify-content: center;">
                            <button class="btn btn-sm" style="background: #3b82f6; color: white; padding: 5px 10px; border-radius: 6px; border: none; cursor: pointer;" 
                                onclick="NFRoles.showEditUserModal('${uid}')" title="تعديل">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${!isCurrentUser ? `
                                <button class="btn btn-sm" style="background: #ef4444; color: white; padding: 5px 10px; border-radius: 6px; border: none; cursor: pointer;" 
                                    onclick="NFRoles.confirmDeleteUser('${uid}')" title="حذف">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        });
        
        if (Object.keys(usersRoles).length === 0) {
            html += `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 30px; color: #94a3b8;">
                        <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 10px;"></i>
                        <p>لا يوجد مستخدمون مسجلون بعد</p>
                    </td>
                </tr>
            `;
        }
        
        html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        return html;
    }
    
    // ===== Handle Add User =====
    function handleAddUser(event) {
        event.preventDefault();
        const form = event.target;
        
        const userData = {
            name: form.querySelector('[name="name"]').value.trim(),
            email: form.querySelector('[name="email"]').value.trim(),
            phone: form.querySelector('[name="phone"]').value.trim(),
            role: form.querySelector('[name="role"]').value,
            assignedWarehouse: form.querySelector('[name="assignedWarehouse"]').value || null
        };
        
        if (!userData.name || !userData.email) {
            if (window.showNotification) {
                showNotification('يرجى ملء الحقول المطلوبة', 'warning');
            }
            return;
        }
        
        const newUserId = addUser(userData);
        
        if (newUserId) {
            if (window.showNotification) {
                showNotification('تم إضافة المستخدم بنجاح', 'success');
            }
            form.reset();
            
            // تحديث القائمة
            refreshUsersModal();
        } else {
            if (window.showNotification) {
                showNotification('حدث خطأ أثناء إضافة المستخدم', 'error');
            }
        }
    }
    
    // ===== Show Edit User Modal =====
    function showEditUserModal(userId) {
        const usersRoles = getUsersRoles();
        const userData = usersRoles[userId];
        
        if (!userData) return;
        
        const warehouses = window.NFWarehouse ? NFWarehouse.getWarehouses() : [];
        
        let warehouseOptions = '<option value="">-- لا يوجد --</option>';
        warehouses.forEach(w => {
            warehouseOptions += `<option value="${w.id}" ${userData.assignedWarehouse === w.id ? 'selected' : ''}>${w.name}</option>`;
        });
        
        const html = `
            <div class="edit-user-form" style="padding: 10px;">
                <h5 style="margin-bottom: 20px;">تعديل بيانات المستخدم</h5>
                <form id="editUserForm" onsubmit="NFRoles.handleEditUser(event, '${userId}')">
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label>الاسم</label>
                        <input type="text" class="form-input" name="name" value="${userData.name || ''}" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label>البريد الإلكتروني</label>
                        <input type="email" class="form-input" name="email" value="${userData.email || ''}" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label>رقم الهاتف</label>
                        <input type="tel" class="form-input" name="phone" value="${userData.phone || ''}">
                    </div>
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label>الدور</label>
                        ${createRoleSelector(userData.role, 'editUserRole')}
                    </div>
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label>المستودع المخصص</label>
                        <select class="form-input" name="assignedWarehouse">
                            ${warehouseOptions}
                        </select>
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                        <button type="button" class="btn btn-outline" onclick="closeCustomModal()">إلغاء</button>
                        <button type="submit" class="btn btn-primary">حفظ التغييرات</button>
                    </div>
                </form>
            </div>
        `;
        
        if (typeof showCustomModal === 'function') {
            showCustomModal(html, 'تعديل المستخدم');
        }
    }
    
    // ===== Handle Edit User =====
    function handleEditUser(event, userId) {
        event.preventDefault();
        const form = event.target;
        
        const updates = {
            name: form.querySelector('[name="name"]').value.trim(),
            email: form.querySelector('[name="email"]').value.trim(),
            phone: form.querySelector('[name="phone"]').value.trim(),
            role: form.querySelector('[name="role"]').value,
            assignedWarehouse: form.querySelector('[name="assignedWarehouse"]').value || null
        };
        
        if (updateUser(userId, updates)) {
            if (window.showNotification) {
                showNotification('تم تحديث بيانات المستخدم بنجاح', 'success');
            }
            if (typeof closeCustomModal === 'function') {
                closeCustomModal();
            }
            // إعادة فتح نافذة إدارة المستخدمين
            setTimeout(() => {
                if (typeof openUsersModal === 'function') {
                    openUsersModal();
                }
            }, 300);
        }
    }
    
    // ===== Confirm Delete User =====
    function confirmDeleteUser(userId) {
        const usersRoles = getUsersRoles();
        const userData = usersRoles[userId];
        
        if (!userData) return;
        
        const html = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #f59e0b; margin-bottom: 15px;"></i>
                <h4 style="margin-bottom: 10px;">تأكيد حذف المستخدم</h4>
                <p style="color: #64748b; margin-bottom: 20px;">
                    هل أنت متأكد من حذف المستخدم <strong>${userData.name || userData.email}</strong>؟
                    <br>
                    <small>لا يمكن التراجع عن هذا الإجراء.</small>
                </p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button class="btn btn-outline" onclick="closeCustomModal()">إلغاء</button>
                    <button class="btn btn-danger" onclick="NFRoles.executeDeleteUser('${userId}')">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        `;
        
        if (typeof showCustomModal === 'function') {
            showCustomModal(html, 'تأكيد الحذف');
        }
    }
    
    // ===== Execute Delete User =====
    function executeDeleteUser(userId) {
        if (deleteUser(userId)) {
            if (window.showNotification) {
                showNotification('تم حذف المستخدم بنجاح', 'success');
            }
            if (typeof closeCustomModal === 'function') {
                closeCustomModal();
            }
            // إعادة فتح نافذة إدارة المستخدمين
            setTimeout(() => {
                if (typeof openUsersModal === 'function') {
                    openUsersModal();
                }
            }, 300);
        }
    }
    
    // ===== Refresh Users Modal =====
    function refreshUsersModal() {
        const modalBody = document.querySelector('#customModal .modal-body');
        if (modalBody) {
            modalBody.innerHTML = createUsersModalContent();
        }
    }
    
    // ===== Apply Permissions to UI =====
    function applyPermissionsToUI() {
        document.querySelectorAll('[data-permission]').forEach(el => {
            const requiredPermission = el.dataset.permission;
            if (!hasPermission(requiredPermission)) {
                el.style.display = 'none';
            }
        });
        
        document.querySelectorAll('[data-permission-disable]').forEach(el => {
            const requiredPermission = el.dataset.permissionDisable;
            if (!hasPermission(requiredPermission)) {
                el.disabled = true;
                el.style.opacity = '0.5';
                el.title = 'ليس لديك صلاحية لهذا الإجراء';
            }
        });
        
        const roleContainer = document.getElementById('currentRoleBadge');
        if (roleContainer) {
            roleContainer.innerHTML = createRoleBadge(getCurrentUserRole());
        }
    }
    
    // ===== Initialize on Auth Change =====
    function initOnAuthChange(user) {
        if (user) {
            const usersRoles = getUsersRoles();
            if (!usersRoles[user.uid]) {
                const role = Object.keys(usersRoles).length === 0 ? 'admin' : 'viewer';
                usersRoles[user.uid] = {
                    role: role,
                    email: user.email,
                    name: user.displayName,
                    assignedAt: new Date().toISOString()
                };
                saveUsersRoles(usersRoles);
            }
            
            setCurrentUserRole(usersRoles[user.uid].role);
            setTimeout(applyPermissionsToUI, 500);
        }
    }
    
    // ===== Return Public API =====
    return {
        ROLES,
        PERMISSION_DESCRIPTIONS,
        getCurrentUserRole,
        setCurrentUserRole,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        getRoleInfo,
        getAllRoles,
        getPermissionDescription,
        assignRole,
        addUser,
        deleteUser,
        updateUser,
        getUserAssignedWarehouse,
        createRoleBadge,
        createRoleSelector,
        createUsersModalContent,
        showEditUserModal,
        handleAddUser,
        handleEditUser,
        confirmDeleteUser,
        executeDeleteUser,
        refreshUsersModal,
        applyPermissionsToUI,
        initOnAuthChange,
        getUsersRoles,
        saveUsersRoles
    };
})();

console.log('🔐 NFRoles v2.0 initialized - User Management System');
