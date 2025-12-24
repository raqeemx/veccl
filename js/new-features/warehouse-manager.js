/**
 * ========================================
 * 🏭 Warehouse & Location Manager - نظام إدارة المستودعات والمواقع
 * ========================================
 * 
 * إدارة المواقع المتعددة والمستودعات
 * تتبع حركة المركبات بين المواقع
 * 
 * الإصدار 1.0
 */

// ===== Namespace to avoid conflicts =====
window.NFWarehouse = (function() {
    'use strict';
    
    // ===== Constants =====
    const STORAGE_KEY = 'nf_warehouses';
    const TRANSFER_LOG_KEY = 'nf_transfer_log';
    
    // ===== Default Warehouses =====
    const DEFAULT_WAREHOUSES = [
        {
            id: 'WH001',
            name: 'المستودع الرئيسي',
            code: 'MAIN',
            address: 'الرياض - حي الصناعية',
            city: 'الرياض',
            manager: 'أحمد محمد',
            phone: '0501234567',
            capacity: 100,
            isActive: true,
            createdAt: new Date().toISOString()
        },
        {
            id: 'WH002',
            name: 'مستودع جدة',
            code: 'JED',
            address: 'جدة - حي الخالدية',
            city: 'جدة',
            manager: 'خالد علي',
            phone: '0507654321',
            capacity: 50,
            isActive: true,
            createdAt: new Date().toISOString()
        }
    ];
    
    // ===== Get Warehouses =====
    function getWarehouses() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            // Initialize with default warehouses
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WAREHOUSES));
            return DEFAULT_WAREHOUSES;
        }
        return JSON.parse(stored);
    }
    
    // ===== Save Warehouses =====
    function saveWarehouses(warehouses) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(warehouses));
        // Sync to Firestore if available
        syncToFirestore(warehouses);
    }
    
    // ===== Sync to Firestore =====
    async function syncToFirestore(warehouses) {
        if (typeof firebase !== 'undefined' && firebase.firestore && firebase.auth().currentUser) {
            try {
                const uid = firebase.auth().currentUser.uid;
                await firebase.firestore().collection('users').doc(uid)
                    .collection('warehouses').doc('data').set({
                        warehouses: warehouses,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
            } catch (error) {
                console.warn('Could not sync warehouses to Firestore:', error);
            }
        }
    }
    
    // ===== Add Warehouse =====
    function addWarehouse(warehouse) {
        const warehouses = getWarehouses();
        warehouse.id = 'WH' + Date.now().toString().slice(-6);
        warehouse.createdAt = new Date().toISOString();
        warehouse.isActive = true;
        warehouses.push(warehouse);
        saveWarehouses(warehouses);
        return warehouse;
    }
    
    // ===== Update Warehouse =====
    function updateWarehouse(id, updates) {
        const warehouses = getWarehouses();
        const index = warehouses.findIndex(w => w.id === id);
        if (index !== -1) {
            warehouses[index] = { ...warehouses[index], ...updates, updatedAt: new Date().toISOString() };
            saveWarehouses(warehouses);
            return warehouses[index];
        }
        return null;
    }
    
    // ===== Delete Warehouse =====
    function deleteWarehouse(id) {
        let warehouses = getWarehouses();
        warehouses = warehouses.filter(w => w.id !== id);
        saveWarehouses(warehouses);
    }
    
    // ===== Get Warehouse by ID =====
    function getWarehouseById(id) {
        const warehouses = getWarehouses();
        return warehouses.find(w => w.id === id);
    }
    
    // ===== Get Transfer Log =====
    function getTransferLog() {
        const stored = localStorage.getItem(TRANSFER_LOG_KEY);
        return stored ? JSON.parse(stored) : [];
    }
    
    // ===== Save Transfer Log =====
    function saveTransferLog(log) {
        localStorage.setItem(TRANSFER_LOG_KEY, JSON.stringify(log));
    }
    
    // ===== Log Transfer =====
    function logTransfer(vehicleId, fromWarehouse, toWarehouse, notes, transferredBy) {
        const log = getTransferLog();
        const transfer = {
            id: 'TR' + Date.now(),
            vehicleId: vehicleId,
            fromWarehouseId: fromWarehouse,
            toWarehouseId: toWarehouse,
            fromWarehouseName: getWarehouseById(fromWarehouse)?.name || 'غير محدد',
            toWarehouseName: getWarehouseById(toWarehouse)?.name || 'غير محدد',
            notes: notes,
            transferredBy: transferredBy,
            transferredAt: new Date().toISOString()
        };
        log.unshift(transfer);
        saveTransferLog(log);
        return transfer;
    }
    
    // ===== Get Vehicle Transfers =====
    function getVehicleTransfers(vehicleId) {
        const log = getTransferLog();
        return log.filter(t => t.vehicleId === vehicleId);
    }
    
    // ===== Get Vehicles by Warehouse =====
    function getVehiclesByWarehouse(warehouseId, vehicles) {
        return vehicles.filter(v => v.warehouseId === warehouseId);
    }
    
    // ===== Count Vehicles by Warehouse =====
    function countVehiclesByWarehouse(vehicles) {
        const counts = {};
        const warehouses = getWarehouses();
        
        warehouses.forEach(w => {
            counts[w.id] = {
                warehouse: w,
                count: 0,
                totalValue: 0
            };
        });
        
        // Count unassigned
        counts['unassigned'] = {
            warehouse: { id: 'unassigned', name: 'غير مخصص', code: 'N/A' },
            count: 0,
            totalValue: 0
        };
        
        vehicles.forEach(v => {
            const whId = v.warehouseId || 'unassigned';
            if (counts[whId]) {
                counts[whId].count++;
                counts[whId].totalValue += parseFloat(v.marketValue) || 0;
            } else {
                counts['unassigned'].count++;
                counts['unassigned'].totalValue += parseFloat(v.marketValue) || 0;
            }
        });
        
        return counts;
    }
    
    // ===== Generate Warehouse Stats =====
    function generateWarehouseStats(vehicles) {
        const warehouses = getWarehouses();
        const stats = [];
        
        warehouses.forEach(warehouse => {
            const warehouseVehicles = vehicles.filter(v => v.warehouseId === warehouse.id);
            const totalValue = warehouseVehicles.reduce((sum, v) => sum + (parseFloat(v.marketValue) || 0), 0);
            
            stats.push({
                warehouse: warehouse,
                vehicleCount: warehouseVehicles.length,
                totalValue: totalValue,
                capacityUsed: (warehouseVehicles.length / warehouse.capacity) * 100,
                vehicles: warehouseVehicles
            });
        });
        
        return stats;
    }
    
    // ===== Create Warehouse Selector HTML =====
    function createWarehouseSelector(selectedId = '', includeUnassigned = true) {
        const warehouses = getWarehouses();
        let html = '<select class="form-input warehouse-selector" id="warehouseId">';
        
        if (includeUnassigned) {
            html += '<option value="">-- اختر الموقع --</option>';
        }
        
        warehouses.filter(w => w.isActive).forEach(w => {
            html += `<option value="${w.id}" ${w.id === selectedId ? 'selected' : ''}>${w.name} (${w.code})</option>`;
        });
        
        html += '</select>';
        return html;
    }
    
    // ===== Create Warehouse Filter =====
    function createWarehouseFilter() {
        const warehouses = getWarehouses();
        let html = `
            <div class="nf-warehouse-filter">
                <label><i class="fas fa-warehouse"></i> فلترة حسب الموقع</label>
                <select class="form-input" id="warehouseFilter" onchange="NFWarehouse.handleFilterChange(this.value)">
                    <option value="">جميع المواقع</option>
        `;
        
        warehouses.forEach(w => {
            html += `<option value="${w.id}">${w.name} (${w.code})</option>`;
        });
        
        html += `
                    <option value="unassigned">غير مخصص</option>
                </select>
            </div>
        `;
        return html;
    }
    
    // ===== Handle Filter Change =====
    function handleFilterChange(warehouseId) {
        // Dispatch custom event for filtering
        const event = new CustomEvent('warehouseFilterChanged', { detail: { warehouseId } });
        document.dispatchEvent(event);
    }
    
    // ===== Create Warehouses Management Modal Content =====
    function createWarehousesModalContent() {
        const warehouses = getWarehouses();
        
        let html = `
            <div class="warehouses-list">
                <div class="warehouses-header">
                    <h4><i class="fas fa-warehouse"></i> إدارة المستودعات والمواقع</h4>
                    <button class="btn btn-primary btn-sm" onclick="NFWarehouse.showAddWarehouseForm()">
                        <i class="fas fa-plus"></i> إضافة موقع
                    </button>
                </div>
                
                <div id="warehouseFormContainer" style="display: none;"></div>
                
                <div class="warehouses-grid" id="warehousesGrid">
        `;
        
        warehouses.forEach(w => {
            html += `
                <div class="warehouse-card ${w.isActive ? '' : 'inactive'}">
                    <div class="warehouse-card-header">
                        <div class="warehouse-code">${w.code}</div>
                        <span class="warehouse-status ${w.isActive ? 'active' : 'inactive'}">
                            ${w.isActive ? 'نشط' : 'غير نشط'}
                        </span>
                    </div>
                    <h5>${w.name}</h5>
                    <p class="warehouse-address"><i class="fas fa-map-marker-alt"></i> ${w.address}</p>
                    <p class="warehouse-manager"><i class="fas fa-user"></i> ${w.manager}</p>
                    <p class="warehouse-phone"><i class="fas fa-phone"></i> ${w.phone}</p>
                    <p class="warehouse-capacity"><i class="fas fa-boxes"></i> السعة: ${w.capacity} مركبة</p>
                    <div class="warehouse-actions">
                        <button class="btn btn-sm btn-outline" onclick="NFWarehouse.editWarehouse('${w.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="NFWarehouse.confirmDeleteWarehouse('${w.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }
    
    // ===== Show Add Warehouse Form =====
    function showAddWarehouseForm(warehouseId = null) {
        const container = document.getElementById('warehouseFormContainer');
        const warehouse = warehouseId ? getWarehouseById(warehouseId) : null;
        
        container.innerHTML = `
            <div class="warehouse-form">
                <h5>${warehouse ? 'تعديل الموقع' : 'إضافة موقع جديد'}</h5>
                <form id="warehouseForm" onsubmit="NFWarehouse.handleWarehouseSubmit(event, '${warehouseId || ''}')">
                    <div class="form-row">
                        <div class="form-group">
                            <label>اسم الموقع *</label>
                            <input type="text" class="form-input" name="name" value="${warehouse?.name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>الرمز *</label>
                            <input type="text" class="form-input" name="code" value="${warehouse?.code || ''}" required maxlength="5">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>المدينة *</label>
                            <input type="text" class="form-input" name="city" value="${warehouse?.city || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>السعة (عدد المركبات)</label>
                            <input type="number" class="form-input" name="capacity" value="${warehouse?.capacity || 50}" min="1">
                        </div>
                    </div>
                    <div class="form-group full-width">
                        <label>العنوان التفصيلي</label>
                        <input type="text" class="form-input" name="address" value="${warehouse?.address || ''}">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>المسؤول</label>
                            <input type="text" class="form-input" name="manager" value="${warehouse?.manager || ''}">
                        </div>
                        <div class="form-group">
                            <label>رقم الهاتف</label>
                            <input type="tel" class="form-input" name="phone" value="${warehouse?.phone || ''}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="isActive" ${warehouse?.isActive !== false ? 'checked' : ''}> 
                            الموقع نشط
                        </label>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" onclick="NFWarehouse.hideWarehouseForm()">إلغاء</button>
                        <button type="submit" class="btn btn-primary">${warehouse ? 'تحديث' : 'إضافة'}</button>
                    </div>
                </form>
            </div>
        `;
        
        container.style.display = 'block';
    }
    
    // ===== Hide Warehouse Form =====
    function hideWarehouseForm() {
        const container = document.getElementById('warehouseFormContainer');
        if (container) {
            container.style.display = 'none';
            container.innerHTML = '';
        }
    }
    
    // ===== Handle Warehouse Submit =====
    function handleWarehouseSubmit(event, warehouseId) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        const warehouseData = {
            name: formData.get('name'),
            code: formData.get('code').toUpperCase(),
            city: formData.get('city'),
            address: formData.get('address'),
            manager: formData.get('manager'),
            phone: formData.get('phone'),
            capacity: parseInt(formData.get('capacity')) || 50,
            isActive: formData.get('isActive') === 'on'
        };
        
        if (warehouseId) {
            updateWarehouse(warehouseId, warehouseData);
            if (window.NFNotify) {
                NFNotify.show({ message: 'تم تحديث الموقع بنجاح', type: 'success' });
            }
        } else {
            addWarehouse(warehouseData);
            if (window.NFNotify) {
                NFNotify.show({ message: 'تم إضافة الموقع بنجاح', type: 'success' });
            }
        }
        
        // Refresh the list
        refreshWarehousesList();
        hideWarehouseForm();
    }
    
    // ===== Edit Warehouse =====
    function editWarehouse(id) {
        showAddWarehouseForm(id);
    }
    
    // ===== Confirm Delete Warehouse =====
    function confirmDeleteWarehouse(id) {
        const warehouse = getWarehouseById(id);
        if (confirm(`هل أنت متأكد من حذف الموقع "${warehouse?.name}"؟`)) {
            deleteWarehouse(id);
            refreshWarehousesList();
            if (window.NFNotify) {
                NFNotify.show({ message: 'تم حذف الموقع', type: 'info' });
            }
        }
    }
    
    // ===== Refresh Warehouses List =====
    function refreshWarehousesList() {
        const grid = document.getElementById('warehousesGrid');
        if (grid) {
            const content = createWarehousesModalContent();
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            const newGrid = tempDiv.querySelector('.warehouses-grid');
            grid.innerHTML = newGrid.innerHTML;
        }
    }
    
    // ===== Create Transfer Modal Content =====
    function createTransferModalContent(vehicleId, currentWarehouseId) {
        const warehouses = getWarehouses();
        const currentWarehouse = getWarehouseById(currentWarehouseId);
        
        let html = `
            <div class="transfer-form">
                <h5><i class="fas fa-exchange-alt"></i> نقل المركبة إلى موقع آخر</h5>
                <p class="transfer-current">
                    الموقع الحالي: <strong>${currentWarehouse?.name || 'غير محدد'}</strong>
                </p>
                <form id="transferForm" onsubmit="NFWarehouse.handleTransferSubmit(event, '${vehicleId}', '${currentWarehouseId}')">
                    <div class="form-group">
                        <label>الموقع الجديد *</label>
                        <select class="form-input" name="toWarehouse" required>
                            <option value="">-- اختر الموقع --</option>
        `;
        
        warehouses.filter(w => w.isActive && w.id !== currentWarehouseId).forEach(w => {
            html += `<option value="${w.id}">${w.name} (${w.code})</option>`;
        });
        
        html += `
                        </select>
                    </div>
                    <div class="form-group">
                        <label>ملاحظات النقل</label>
                        <textarea class="form-input form-textarea" name="notes" placeholder="سبب النقل أو ملاحظات أخرى..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" onclick="closeTransferModal()">إلغاء</button>
                        <button type="submit" class="btn btn-primary"><i class="fas fa-exchange-alt"></i> نقل</button>
                    </div>
                </form>
            </div>
        `;
        
        return html;
    }
    
    // ===== Handle Transfer Submit =====
    function handleTransferSubmit(event, vehicleId, fromWarehouseId) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        const toWarehouseId = formData.get('toWarehouse');
        const notes = formData.get('notes');
        
        // Update vehicle warehouse
        if (typeof updateVehicleWarehouse === 'function') {
            updateVehicleWarehouse(vehicleId, toWarehouseId);
        }
        
        // Log transfer
        const user = firebase?.auth()?.currentUser;
        logTransfer(vehicleId, fromWarehouseId, toWarehouseId, notes, user?.displayName || 'Unknown');
        
        // Close modal and refresh
        if (typeof closeTransferModal === 'function') {
            closeTransferModal();
        }
        
        if (window.NFNotify) {
            NFNotify.show({ message: 'تم نقل المركبة بنجاح', type: 'success' });
        }
        
        // Refresh vehicles list
        if (typeof loadVehicles === 'function') {
            loadVehicles();
        }
    }
    
    // ===== Return Public API =====
    return {
        getWarehouses,
        saveWarehouses,
        addWarehouse,
        updateWarehouse,
        deleteWarehouse,
        getWarehouseById,
        getTransferLog,
        logTransfer,
        getVehicleTransfers,
        getVehiclesByWarehouse,
        countVehiclesByWarehouse,
        generateWarehouseStats,
        createWarehouseSelector,
        createWarehouseFilter,
        handleFilterChange,
        createWarehousesModalContent,
        showAddWarehouseForm,
        hideWarehouseForm,
        handleWarehouseSubmit,
        editWarehouse,
        confirmDeleteWarehouse,
        refreshWarehousesList,
        createTransferModalContent,
        handleTransferSubmit
    };
})();
