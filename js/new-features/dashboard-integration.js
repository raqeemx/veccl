/**
 * ========================================
 * 🔗 Dashboard Integration - تكامل لوحة التحكم
 * ========================================
 * 
 * ربط جميع الميزات الجديدة مع لوحة التحكم
 * 
 * الإصدار 1.0
 */

// ===== Wait for DOM to be ready =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard Integration Loading...');
    
    // Initialize after a short delay to ensure Firebase is ready
    setTimeout(initializeNewFeatures, 1000);
});

// ===== Initialize All New Features =====
function initializeNewFeatures() {
    console.log('Initializing new features...');
    
    // Initialize Roles on Auth Change
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user && window.NFRoles) {
                NFRoles.initOnAuthChange(user);
            }
        });
    }
    
    // Add additional sidebar menu items
    addNewSidebarItems();
    
    // Add warehouse filter to top
    addWarehouseFilter();
    
    // Update vehicles grid to show warehouse info
    enhanceVehicleCards();
    
    // Initialize enhanced stats
    if (window.NFStats) {
        // Override the updateStats function
        const originalUpdateStats = window.updateStats || function() {};
        window.updateStats = function() {
            originalUpdateStats();
            if (typeof vehicles !== 'undefined' && NFStats.renderDashboard) {
                NFStats.renderDashboard(vehicles, 'nf-enhanced-stats');
            }
        };
    }
    
    // Log initialization
    if (window.NFAuditLog) {
        NFAuditLog.log('user_login', { page: 'dashboard' });
    }
    
    console.log('New features initialized successfully');
}

// ===== Add New Sidebar Items =====
function addNewSidebarItems() {
    const sidebarMenu = document.querySelector('.sidebar-menu');
    if (!sidebarMenu) return;
    
    // Find the position after "Vehicles" item
    const existingItems = sidebarMenu.querySelectorAll('.menu-item');
    let insertAfter = existingItems[1]; // After vehicles
    
    // New menu items HTML
    const newItemsHTML = `
        <div class="menu-item" onclick="openWarehousesModal()">
            <i class="fas fa-warehouse"></i>
            <span>المستودعات</span>
        </div>
        <div class="menu-item" onclick="openInventoryCampaignsModal()">
            <i class="fas fa-clipboard-list"></i>
            <span>حملات الجرد</span>
        </div>
        <div class="menu-item" onclick="openUsersModal()" data-permission="manage_users">
            <i class="fas fa-users-cog"></i>
            <span>الصلاحيات</span>
        </div>
        <div class="menu-item" onclick="openAuditLogModal()">
            <i class="fas fa-history"></i>
            <span>سجل التغييرات</span>
        </div>
        <div class="menu-item" onclick="openQRScannerModal()">
            <i class="fas fa-qrcode"></i>
            <span>مسح QR</span>
        </div>
        <div class="menu-item" onclick="openReportsModal()">
            <i class="fas fa-file-pdf"></i>
            <span>التقارير</span>
        </div>
    `;
    
    // Insert new items
    if (insertAfter) {
        insertAfter.insertAdjacentHTML('afterend', newItemsHTML);
    }
    
    // Apply permissions to hide restricted items
    if (window.NFRoles) {
        setTimeout(() => NFRoles.applyPermissionsToUI(), 500);
    }
}

// ===== Add Warehouse Filter =====
function addWarehouseFilter() {
    const filtersContainer = document.getElementById('nf-filters-container');
    if (!filtersContainer || !window.NFWarehouse) return;
    
    // Add warehouse filter to existing filters
    const warehouseFilter = NFWarehouse.createWarehouseFilter();
    filtersContainer.insertAdjacentHTML('beforeend', warehouseFilter);
    
    // Listen for filter changes
    document.addEventListener('warehouseFilterChanged', function(e) {
        const warehouseId = e.detail.warehouseId;
        filterVehiclesByWarehouse(warehouseId);
    });
}

// ===== Filter Vehicles by Warehouse =====
function filterVehiclesByWarehouse(warehouseId) {
    if (typeof vehicles === 'undefined') return;
    
    const grid = document.getElementById('vehiclesGrid');
    if (!grid) return;
    
    // Get filtered vehicles
    let filtered = vehicles;
    if (warehouseId) {
        if (warehouseId === 'unassigned') {
            filtered = vehicles.filter(v => !v.warehouseId);
        } else {
            filtered = vehicles.filter(v => v.warehouseId === warehouseId);
        }
    }
    
    // Re-render with filtered vehicles
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-filter"></i>
                <h3>لا توجد مركبات</h3>
                <p>لا توجد مركبات في هذا الموقع</p>
            </div>
        `;
    } else {
        // Use the original render function but with filtered data
        if (typeof renderVehiclesCustom === 'function') {
            renderVehiclesCustom(filtered);
        } else {
            // Temporarily replace vehicles and render
            const originalVehicles = vehicles;
            vehicles = filtered;
            if (typeof renderVehicles === 'function') {
                renderVehicles();
            }
            vehicles = originalVehicles;
        }
    }
}

// ===== Enhance Vehicle Cards =====
function enhanceVehicleCards() {
    // Override renderVehicles to add warehouse info
    const originalRenderVehicles = window.renderVehicles;
    
    window.renderVehicles = function() {
        // Call original
        if (originalRenderVehicles) {
            originalRenderVehicles();
        }
        
        // Add warehouse badges to cards
        const cards = document.querySelectorAll('.vehicle-card');
        cards.forEach((card, index) => {
            if (typeof vehicles !== 'undefined' && vehicles[index]) {
                const vehicle = vehicles[index];
                addWarehouseBadge(card, vehicle);
                addQRButton(card, vehicle);
            }
        });
    };
}

// ===== Add Warehouse Badge to Card =====
function addWarehouseBadge(card, vehicle) {
    if (!window.NFWarehouse) return;
    
    const warehouse = NFWarehouse.getWarehouseById(vehicle.warehouseId);
    const header = card.querySelector('.vehicle-header');
    
    if (header) {
        const existingBadge = header.querySelector('.warehouse-badge');
        if (existingBadge) existingBadge.remove();
        
        const badge = document.createElement('div');
        badge.className = 'warehouse-badge';
        badge.style.cssText = 'font-size: 0.75rem; color: #667eea; margin-top: 5px;';
        badge.innerHTML = `<i class="fas fa-warehouse"></i> ${warehouse?.name || 'غير مخصص'}`;
        
        const titleDiv = header.querySelector('div');
        if (titleDiv) {
            titleDiv.appendChild(badge);
        }
    }
}

// ===== Add QR Button to Card =====
function addQRButton(card, vehicle) {
    const actionsDiv = card.querySelector('.vehicle-actions');
    if (!actionsDiv) return;
    
    // Check if already added
    if (actionsDiv.querySelector('.btn-qr')) return;
    
    const qrButton = document.createElement('button');
    qrButton.className = 'btn-view btn-qr';
    qrButton.innerHTML = '<i class="fas fa-qrcode"></i>';
    qrButton.title = 'رمز QR';
    qrButton.onclick = function(e) {
        e.stopPropagation();
        showVehicleQR(vehicle);
    };
    
    actionsDiv.insertBefore(qrButton, actionsDiv.firstChild);
}

// ===== Show Vehicle QR =====
async function showVehicleQR(vehicle) {
    if (!window.NFQRCode) return;
    
    const html = `
        <div id="qrCodeDisplay" style="text-align: center; padding: 20px;">
            <p>جاري إنشاء رمز QR...</p>
        </div>
    `;
    
    showCustomModal(html, 'رمز QR للمركبة');
    
    setTimeout(async () => {
        await NFQRCode.createQRCodeElement(vehicle, 'qrCodeDisplay');
    }, 100);
}

// ===== Modal Functions =====

// Warehouses Modal
function openWarehousesModal() {
    if (!window.NFWarehouse) {
        showNotification('ميزة المستودعات غير متاحة', 'warning');
        return;
    }
    
    const content = NFWarehouse.createWarehousesModalContent();
    showCustomModal(content, 'إدارة المستودعات والمواقع');
}

// Inventory Campaigns Modal
function openInventoryCampaignsModal() {
    if (!window.NFInventory) {
        showNotification('ميزة حملات الجرد غير متاحة', 'warning');
        return;
    }
    
    const content = `
        <div class="inventory-modal-content">
            <div class="inventory-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h4><i class="fas fa-clipboard-list"></i> حملات الجرد الدوري</h4>
                <button class="btn btn-primary" onclick="NFInventory.showCreateForm()">
                    <i class="fas fa-plus"></i> إنشاء حملة جديدة
                </button>
            </div>
            <div id="campaignFormContainer" style="display: none;"></div>
            <div id="campaignsListContainer">
                ${NFInventory.createCampaignsListHTML()}
            </div>
        </div>
    `;
    
    showCustomModal(content, 'حملات الجرد');
}

// Users/Roles Modal
function openUsersModal() {
    if (!window.NFRoles) {
        showNotification('ميزة إدارة الصلاحيات غير متاحة', 'warning');
        return;
    }
    
    if (!NFRoles.hasPermission('manage_users')) {
        showNotification('ليس لديك صلاحية لإدارة المستخدمين', 'error');
        return;
    }
    
    const content = NFRoles.createUsersModalContent();
    showCustomModal(content, 'إدارة المستخدمين والصلاحيات');
}

// Audit Log Modal
function openAuditLogModal() {
    if (!window.NFAuditLog) {
        showNotification('ميزة سجل التغييرات غير متاحة', 'warning');
        return;
    }
    
    const content = NFAuditLog.createAuditLogPanelHTML();
    showCustomModal(content, 'سجل التغييرات');
}

// QR Scanner Modal
function openQRScannerModal() {
    if (!window.NFQRCode) {
        showNotification('ميزة مسح QR غير متاحة', 'warning');
        return;
    }
    
    NFQRCode.openScanner(function(vehicle) {
        console.log('Vehicle found:', vehicle);
        if (vehicle && vehicle.id && typeof viewVehicle === 'function') {
            NFQRCode.closeScannerModal();
            viewVehicle(vehicle.id);
        }
    });
}

// Reports Modal
function openReportsModal() {
    const content = `
        <div class="reports-modal-content">
            <h4><i class="fas fa-file-pdf"></i> تصدير التقارير</h4>
            <div class="reports-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px;">
                <button class="btn btn-outline report-btn" onclick="exportFullInventoryReport()">
                    <i class="fas fa-list"></i>
                    <span>تقرير الجرد الشامل</span>
                </button>
                <button class="btn btn-outline report-btn" onclick="exportWarehouseReport()">
                    <i class="fas fa-warehouse"></i>
                    <span>تقرير المستودعات</span>
                </button>
                <button class="btn btn-outline report-btn" onclick="exportAllToExcel()">
                    <i class="fas fa-file-excel"></i>
                    <span>تصدير Excel</span>
                </button>
                <button class="btn btn-outline report-btn" onclick="exportToJSON()">
                    <i class="fas fa-file-code"></i>
                    <span>تصدير JSON</span>
                </button>
                <button class="btn btn-outline report-btn" onclick="printBatchQRCodes()">
                    <i class="fas fa-qrcode"></i>
                    <span>طباعة رموز QR</span>
                </button>
            </div>
        </div>
    `;
    
    showCustomModal(content, 'التقارير والتصدير');
}

// ===== Report Export Functions =====
function exportFullInventoryReport() {
    if (window.NFReports && typeof vehicles !== 'undefined') {
        NFReports.exportInventoryReport(vehicles);
        closeCustomModal();
    }
}

function exportWarehouseReport() {
    if (window.NFReports) {
        NFReports.exportWarehouseReport('all');
        closeCustomModal();
    }
}

function printBatchQRCodes() {
    if (window.NFQRCode && typeof vehicles !== 'undefined') {
        NFQRCode.printBatchQRCodes(vehicles);
        closeCustomModal();
    }
}

// ===== Custom Modal Functions =====
let customModalElement = null;

function showCustomModal(content, title = '') {
    // Remove existing modal if any
    closeCustomModal();
    
    const modalHTML = `
        <div class="modal show" id="customModal" style="display: flex;">
            <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="btn-close" onclick="closeCustomModal()">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        </div>
    `;
    
    const container = document.createElement('div');
    container.innerHTML = modalHTML;
    customModalElement = container.firstElementChild;
    document.body.appendChild(customModalElement);
    
    // Close on background click
    customModalElement.addEventListener('click', function(e) {
        if (e.target === customModalElement) {
            closeCustomModal();
        }
    });
}

function closeCustomModal() {
    if (customModalElement) {
        customModalElement.remove();
        customModalElement = null;
    }
    
    const modal = document.getElementById('customModal');
    if (modal) {
        modal.remove();
    }
}

// Also make these available for edit role modal
window.closeEditRoleModal = closeCustomModal;
window.closeTransferModal = closeCustomModal;

// ===== Vehicle Warehouse Update =====
function updateVehicleWarehouse(vehicleId, warehouseId) {
    if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
        const uid = firebase.auth().currentUser.uid;
        firebase.firestore().collection('users').doc(uid)
            .collection('vehicles').doc(vehicleId)
            .update({ 
                warehouseId: warehouseId,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                // Log to audit
                if (window.NFAuditLog) {
                    NFAuditLog.log('vehicle_transferred', { vehicleId, warehouseId });
                }
            })
            .catch(error => {
                console.error('Error updating warehouse:', error);
            });
    }
}

// ===== Get Vehicles Function (for other modules) =====
window.getVehicles = function() {
    return typeof vehicles !== 'undefined' ? vehicles : [];
};

// ===== Make functions globally available =====
window.showCustomModal = showCustomModal;
window.closeCustomModal = closeCustomModal;
window.openWarehousesModal = openWarehousesModal;
window.openInventoryCampaignsModal = openInventoryCampaignsModal;
window.openUsersModal = openUsersModal;
window.openAuditLogModal = openAuditLogModal;
window.openQRScannerModal = openQRScannerModal;
window.openReportsModal = openReportsModal;
window.updateVehicleWarehouse = updateVehicleWarehouse;
window.showVehicleQR = showVehicleQR;

console.log('Dashboard Integration module loaded');
