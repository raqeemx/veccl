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
 * الإصدار 1.0
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
        // Sync to Firestore if available
        syncToFirestore(rolesData);
    }
    
    // ===== Sync to Firestore =====
    async function syncToFirestore(rolesData) {
        if (typeof firebase !== 'undefined' && firebase.firestore && firebase.auth().currentUser) {
            try {
                const uid = firebase.auth().currentUser.uid;
                // Only admins can sync roles data
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
        // First check localStorage for cached role
        const cachedRole = localStorage.getItem(CURRENT_USER_ROLE_KEY);
        if (cachedRole) return cachedRole;
        
        // If user is logged in, check their assigned role
        if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
            const uid = firebase.auth().currentUser.uid;
            const usersRoles = getUsersRoles();
            return usersRoles[uid]?.role || 'viewer'; // Default to viewer
        }
        
        // Default for first user (admin)
        return 'admin';
    }
    
    // ===== Set Current User Role =====
    function setCurrentUserRole(role) {
        localStorage.setItem(CURRENT_USER_ROLE_KEY, role);
        
        // Also save to user roles data
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
        if (!hasPermission('manage_roles')) {
            console.warn('No permission to manage roles');
            return false;
        }
        
        const usersRoles = getUsersRoles();
        usersRoles[userId] = {
            role: role,
            assignedWarehouse: assignedWarehouse,
            assignedAt: new Date().toISOString(),
            assignedBy: firebase?.auth()?.currentUser?.uid || 'system'
        };
        saveUsersRoles(usersRoles);
        
        // Log to audit
        if (window.NFAuditLog) {
            NFAuditLog.log('role_assigned', {
                userId: userId,
                newRole: role,
                assignedWarehouse: assignedWarehouse
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
            <span class="role-badge" style="background: ${role.color}; color: white; padding: 3px 10px; border-radius: 12px; font-size: 0.8rem;">
                <i class="fas ${role.icon}"></i> ${role.name}
            </span>
        `;
    }
    
    // ===== Create Role Selector HTML =====
    function createRoleSelector(selectedRole = '') {
        let html = '<select class="form-input role-selector" id="userRole">';
        
        Object.values(ROLES).forEach(role => {
            html += `<option value="${role.id}" ${role.id === selectedRole ? 'selected' : ''}>${role.name} (${role.nameEn})</option>`;
        });
        
        html += '</select>';
        return html;
    }
    
    // ===== Create Users Management Modal Content =====
    function createUsersModalContent() {
        const usersRoles = getUsersRoles();
        
        let html = `
            <div class="users-management">
                <h4><i class="fas fa-users-cog"></i> إدارة المستخدمين والصلاحيات</h4>
                
                <div class="roles-legend">
                    <h5>الأدوار المتاحة:</h5>
                    <div class="roles-list">
        `;
        
        Object.values(ROLES).forEach(role => {
            html += `
                <div class="role-item">
                    <i class="fas ${role.icon}" style="color: ${role.color}"></i>
                    <span>${role.name}</span>
                    <small>(${role.permissions.length} صلاحية)</small>
                </div>
            `;
        });
        
        html += `
                    </div>
                </div>
                
                <div class="users-list">
                    <h5>المستخدمون المسجلون:</h5>
                    <table class="users-table">
                        <thead>
                            <tr>
                                <th>المستخدم</th>
                                <th>الدور الحالي</th>
                                <th>المستودع المخصص</th>
                                <th>تاريخ التعيين</th>
                                <th>إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        Object.entries(usersRoles).forEach(([uid, userData]) => {
            const role = ROLES[userData.role] || ROLES.viewer;
            html += `
                <tr>
                    <td>
                        <strong>${userData.name || 'غير معروف'}</strong><br>
                        <small>${userData.email || uid}</small>
                    </td>
                    <td>${createRoleBadge(userData.role)}</td>
                    <td>${userData.assignedWarehouse || '-'}</td>
                    <td>${userData.assignedAt ? new Date(userData.assignedAt).toLocaleDateString('ar-SA') : '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline" onclick="NFRoles.showEditUserRole('${uid}')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        if (Object.keys(usersRoles).length === 0) {
            html += `
                <tr>
                    <td colspan="5" style="text-align: center; color: #94a3b8;">
                        لا يوجد مستخدمون مسجلون بعد
                    </td>
                </tr>
            `;
        }
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        return html;
    }
    
    // ===== Show Edit User Role Modal =====
    function showEditUserRole(userId) {
        const usersRoles = getUsersRoles();
        const userData = usersRoles[userId];
        const warehouses = window.NFWarehouse ? NFWarehouse.getWarehouses() : [];
        
        let warehouseOptions = '<option value="">-- لا يوجد --</option>';
        warehouses.forEach(w => {
            warehouseOptions += `<option value="${w.id}" ${userData?.assignedWarehouse === w.id ? 'selected' : ''}>${w.name}</option>`;
        });
        
        const html = `
            <div class="edit-user-role-form">
                <h5>تعديل صلاحيات المستخدم</h5>
                <p><strong>${userData?.name || userId}</strong></p>
                <form onsubmit="NFRoles.handleEditUserRole(event, '${userId}')">
                    <div class="form-group">
                        <label>الدور</label>
                        ${createRoleSelector(userData?.role)}
                    </div>
                    <div class="form-group">
                        <label>المستودع المخصص (لمدير المستودع)</label>
                        <select class="form-input" name="assignedWarehouse">
                            ${warehouseOptions}
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" onclick="closeEditRoleModal()">إلغاء</button>
                        <button type="submit" class="btn btn-primary">حفظ</button>
                    </div>
                </form>
            </div>
        `;
        
        // Show in modal
        if (typeof showCustomModal === 'function') {
            showCustomModal(html, 'تعديل الصلاحيات');
        }
    }
    
    // ===== Handle Edit User Role =====
    function handleEditUserRole(event, userId) {
        event.preventDefault();
        const form = event.target;
        const role = form.querySelector('#userRole').value;
        const warehouse = form.querySelector('[name="assignedWarehouse"]').value;
        
        assignRole(userId, role, warehouse || null);
        
        if (window.NFNotify) {
            NFNotify.show({ message: 'تم تحديث صلاحيات المستخدم', type: 'success' });
        }
        
        if (typeof closeEditRoleModal === 'function') {
            closeEditRoleModal();
        }
    }
    
    // ===== Check UI Elements Based on Permissions =====
    function applyPermissionsToUI() {
        // Hide/show elements based on permissions
        document.querySelectorAll('[data-permission]').forEach(el => {
            const requiredPermission = el.dataset.permission;
            if (!hasPermission(requiredPermission)) {
                el.style.display = 'none';
            }
        });
        
        // Disable elements without permission
        document.querySelectorAll('[data-permission-disable]').forEach(el => {
            const requiredPermission = el.dataset.permissionDisable;
            if (!hasPermission(requiredPermission)) {
                el.disabled = true;
                el.style.opacity = '0.5';
                el.title = 'ليس لديك صلاحية لهذا الإجراء';
            }
        });
        
        // Show current role badge in header
        const roleContainer = document.getElementById('currentRoleBadge');
        if (roleContainer) {
            roleContainer.innerHTML = createRoleBadge(getCurrentUserRole());
        }
    }
    
    // ===== Initialize on Auth Change =====
    function initOnAuthChange(user) {
        if (user) {
            // Check if user has role, if not assign default
            const usersRoles = getUsersRoles();
            if (!usersRoles[user.uid]) {
                // First user gets admin role, others get viewer
                const role = Object.keys(usersRoles).length === 0 ? 'admin' : 'viewer';
                usersRoles[user.uid] = {
                    role: role,
                    email: user.email,
                    name: user.displayName,
                    assignedAt: new Date().toISOString()
                };
                saveUsersRoles(usersRoles);
            }
            
            // Cache current role
            setCurrentUserRole(usersRoles[user.uid].role);
            
            // Apply permissions to UI
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
        getUserAssignedWarehouse,
        createRoleBadge,
        createRoleSelector,
        createUsersModalContent,
        showEditUserRole,
        handleEditUserRole,
        applyPermissionsToUI,
        initOnAuthChange,
        getUsersRoles,
        saveUsersRoles
    };
})();
