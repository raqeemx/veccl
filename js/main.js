/**
 * نموذج تقييم مركبة مستردّة - النسخة المتقدمة
 * Repossessed Vehicle Evaluation Form - Advanced Version
 * 
 * Features:
 * - Dark Mode with persistence
 * - Multi-vehicle management
 * - Auto-save with status indicator
 * - Advanced validation
 * - Export to PDF, Excel, JSON
 * - Image upload with validation
 */

// ===== Global Variables =====
let currentVehicleId = null;
let autoSaveTimer = null;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const AUTO_SAVE_INTERVAL = 2000; // 2 seconds
const DATA_EXPIRY_HOURS = 24;

// ===== Initialize on Page Load =====
document.addEventListener('DOMContentLoaded', function() {
    initializeDarkMode();
    initializeForm();
    setupEventListeners();
    loadVehicleList();
    updateVehicleCount();
});

// ===== Dark Mode =====
function initializeDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.documentElement.classList.add('dark');
    }
}

function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
    showNotification(isDark ? 'تم تفعيل الوضع الليلي 🌙' : 'تم تفعيل الوضع النهاري ☀️', 'info');
}

// ===== Form Initialization =====
function initializeForm() {
    generateFormNumber();
    setDefaultDate();
    
    // Check for auto-saved data
    const autoSavedData = localStorage.getItem('autoSaveData');
    if (autoSavedData) {
        const data = JSON.parse(autoSavedData);
        const savedTime = new Date(data.savedAt);
        const now = new Date();
        const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
        
        if (hoursDiff < DATA_EXPIRY_HOURS) {
            if (confirm('يوجد بيانات غير محفوظة. هل تريد استعادتها؟\nThere is unsaved data. Would you like to restore it?')) {
                loadFormData(data);
                currentVehicleId = data.vehicleId || null;
            } else {
                localStorage.removeItem('autoSaveData');
            }
        } else {
            localStorage.removeItem('autoSaveData');
        }
    }
}

function generateFormNumber() {
    const formNumberInput = document.getElementById('formNumber');
    if (formNumberInput && !formNumberInput.value) {
        const year = new Date().getFullYear();
        const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        formNumberInput.value = `VE-${year}-${randomNum}`;
    }
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    const evaluationDateInput = document.getElementById('evaluationDate');
    const repoDateInput = document.getElementById('repoDate');
    
    if (evaluationDateInput && !evaluationDateInput.value) {
        evaluationDateInput.value = today;
    }
    if (repoDateInput && !repoDateInput.value) {
        repoDateInput.value = today;
    }
}

// ===== Event Listeners =====
function setupEventListeners() {
    const form = document.getElementById('vehicleEvaluationForm');
    
    // Auto-save on input
    form.addEventListener('input', () => {
        clearTimeout(autoSaveTimer);
        updateSaveStatus('saving');
        autoSaveTimer = setTimeout(autoSave, AUTO_SAVE_INTERVAL);
    });
    
    form.addEventListener('change', () => {
        clearTimeout(autoSaveTimer);
        updateSaveStatus('saving');
        autoSaveTimer = setTimeout(autoSave, AUTO_SAVE_INTERVAL);
    });
    
    // VIN validation
    const vinInput = document.getElementById('vin');
    if (vinInput) {
        vinInput.addEventListener('input', function() {
            this.value = this.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
        });
    }
    
    // Real-time validation for required fields
    const requiredInputs = form.querySelectorAll('[required]');
    requiredInputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
            if (input.classList.contains('error')) {
                validateField(input);
            }
        });
    });
    
    // Setup drag and drop for photos
    for (let i = 1; i <= 3; i++) {
        const dropzone = document.getElementById(`dropzone${i}`);
        if (dropzone) {
            dropzone.addEventListener('dragover', handleDragOver);
            dropzone.addEventListener('dragleave', handleDragLeave);
            dropzone.addEventListener('drop', (e) => handleDrop(e, i));
        }
    }
}

// ===== Auto Save =====
function autoSave() {
    const formData = collectFormData();
    formData.vehicleId = currentVehicleId;
    formData.savedAt = new Date().toISOString();
    localStorage.setItem('autoSaveData', JSON.stringify(formData));
    updateSaveStatus('saved');
}

function updateSaveStatus(status) {
    const saveStatus = document.getElementById('saveStatus');
    if (!saveStatus) return;
    
    if (status === 'saving') {
        saveStatus.innerHTML = `
            <i class="fas fa-circle-notch fa-spin text-yellow-500 text-[8px]"></i>
            <span>جاري الحفظ...</span>
        `;
    } else if (status === 'saved') {
        saveStatus.innerHTML = `
            <i class="fas fa-circle text-green-500 text-[8px]"></i>
            <span>محفوظ</span>
        `;
    }
}

// ===== Validation =====
function validateField(input) {
    const formGroup = input.closest('.form-group');
    const errorMessage = formGroup?.querySelector('.error-message');
    
    if (!input.value.trim()) {
        input.classList.add('error');
        formGroup?.classList.add('has-error');
        if (errorMessage) {
            errorMessage.textContent = 'هذا الحقل مطلوب';
        }
        return false;
    } else {
        input.classList.remove('error');
        formGroup?.classList.remove('has-error');
        return true;
    }
}

function validateForm(showErrors = true) {
    const requiredFields = document.querySelectorAll('#vehicleEvaluationForm [required]');
    let isValid = true;
    let firstError = null;
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
            if (!firstError) firstError = field;
        }
    });
    
    if (!isValid && showErrors) {
        firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
    }
    
    return isValid;
}

// ===== Photo Handling =====
function handlePhotoUpload(input, index) {
    const file = input.files[0];
    if (!file) return;
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
        showNotification('حجم الصورة يجب أن يكون أقل من 5MB', 'error');
        input.value = '';
        return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('يرجى اختيار ملف صورة صحيح', 'error');
        input.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById(`preview${index}`);
        const dropzone = document.getElementById(`dropzone${index}`);
        const removeBtn = document.getElementById(`removeBtn${index}`);
        
        preview.innerHTML = `<img src="${e.target.result}" alt="صورة ${index}" class="w-full h-full object-cover">`;
        dropzone.classList.add('has-image');
        removeBtn.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function removePhoto(index) {
    const input = document.getElementById(`photo${index}`);
    const preview = document.getElementById(`preview${index}`);
    const dropzone = document.getElementById(`dropzone${index}`);
    const removeBtn = document.getElementById(`removeBtn${index}`);
    
    input.value = '';
    preview.innerHTML = `
        <i class="fas fa-camera text-4xl text-gray-400 dark:text-gray-500 mb-2"></i>
        <span class="text-sm text-gray-500">اضغط أو اسحب صورة</span>
        <span class="text-xs text-gray-400 mt-1">الحد الأقصى: 5MB</span>
    `;
    dropzone.classList.remove('has-image');
    removeBtn.classList.add('hidden');
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('border-primary-500', 'bg-primary-50');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary-500', 'bg-primary-50');
}

function handleDrop(e, index) {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary-500', 'bg-primary-50');
    
    const file = e.dataTransfer.files[0];
    if (file) {
        const input = document.getElementById(`photo${index}`);
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        handlePhotoUpload(input, index);
    }
}

// ===== Data Collection =====
function collectFormData() {
    const form = document.getElementById('vehicleEvaluationForm');
    const formData = new FormData(form);
    const data = {};
    
    formData.forEach((value, key) => {
        if (value instanceof File) return;
        if (data[key]) {
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    });
    
    data.formNumber = document.getElementById('formNumber').value;
    return data;
}

function loadFormData(data) {
    const form = document.getElementById('vehicleEvaluationForm');
    
    Object.keys(data).forEach(key => {
        if (key === 'formNumber') {
            document.getElementById('formNumber').value = data[key];
            return;
        }
        
        const element = form.elements[key];
        if (!element) return;
        
        if (element.type === 'checkbox') {
            const checkboxes = form.querySelectorAll(`input[name="${key}"]`);
            const values = Array.isArray(data[key]) ? data[key] : [data[key]];
            checkboxes.forEach(cb => {
                cb.checked = values.includes(cb.value);
            });
        } else if (element.type === 'radio' || (element.length && element[0]?.type === 'radio')) {
            const radios = form.querySelectorAll(`input[name="${key}"]`);
            radios.forEach(radio => {
                radio.checked = radio.value === data[key];
            });
        } else if (element.type !== 'file') {
            element.value = data[key];
        }
    });
}

// ===== Vehicle Management =====
function getVehicles() {
    const vehicles = localStorage.getItem('vehicles');
    return vehicles ? JSON.parse(vehicles) : [];
}

function saveVehicles(vehicles) {
    localStorage.setItem('vehicles', JSON.stringify(vehicles));
}

function saveVehicle() {
    if (!validateForm()) return;
    
    const vehicles = getVehicles();
    const data = collectFormData();
    data.savedAt = new Date().toISOString();
    
    if (currentVehicleId) {
        // Update existing
        const index = vehicles.findIndex(v => v.id === currentVehicleId);
        if (index !== -1) {
            data.id = currentVehicleId;
            vehicles[index] = data;
            showNotification('تم تحديث بيانات المركبة بنجاح ✅', 'success');
        }
    } else {
        // Create new
        data.id = Date.now().toString();
        currentVehicleId = data.id;
        vehicles.push(data);
        showNotification('تم حفظ المركبة بنجاح ✅', 'success');
    }
    
    saveVehicles(vehicles);
    localStorage.removeItem('autoSaveData');
    loadVehicleList();
    updateVehicleCount();
}

function loadVehicle(id) {
    const vehicles = getVehicles();
    const vehicle = vehicles.find(v => v.id === id);
    
    if (vehicle) {
        resetForm(false);
        loadFormData(vehicle);
        currentVehicleId = id;
        toggleVehicleList();
        showNotification('تم تحميل بيانات المركبة', 'info');
    }
}

function deleteVehicle(id, event) {
    event.stopPropagation();
    
    if (!confirm('هل أنت متأكد من حذف هذه المركبة؟')) return;
    
    let vehicles = getVehicles();
    vehicles = vehicles.filter(v => v.id !== id);
    saveVehicles(vehicles);
    
    if (currentVehicleId === id) {
        currentVehicleId = null;
        resetForm(false);
    }
    
    loadVehicleList();
    updateVehicleCount();
    showNotification('تم حذف المركبة', 'info');
}

function newVehicle() {
    currentVehicleId = null;
    resetForm(false);
    generateFormNumber();
    setDefaultDate();
    toggleVehicleList();
    showNotification('نموذج جديد جاهز', 'info');
}

function loadVehicleList() {
    const container = document.getElementById('vehicleListContainer');
    const vehicles = getVehicles();
    
    if (vehicles.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-car text-4xl mb-3 opacity-50"></i>
                <p>لا توجد مركبات محفوظة</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = vehicles.map(v => `
        <div class="vehicle-item ${v.id === currentVehicleId ? 'active' : ''}" onclick="loadVehicle('${v.id}')">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <div class="font-semibold text-gray-800 dark:text-gray-200">${v.make || ''} ${v.model || ''} ${v.year || ''}</div>
                    <div class="text-xs text-gray-500">${v.customerName || 'بدون اسم'}</div>
                    <div class="text-xs text-gray-400 mt-1">${v.formNumber || ''}</div>
                </div>
                <button onclick="deleteVehicle('${v.id}', event)" class="text-red-500 hover:text-red-700 p-2">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function updateVehicleCount() {
    const count = getVehicles().length;
    document.getElementById('vehicleCount').textContent = `${count} مركبة محفوظة`;
}

function toggleVehicleList() {
    const panel = document.getElementById('vehicleListPanel');
    const overlay = document.getElementById('vehicleListOverlay');
    
    panel.classList.toggle('translate-x-full');
    overlay.classList.toggle('hidden');
}

// ===== Export Functions =====
function exportToExcel() {
    if (!validateForm(false)) {
        if (!confirm('بعض الحقول فارغة. متابعة؟')) return;
    }
    
    showLoading('جاري إنشاء ملف Excel...');
    
    try {
        const data = collectExcelData();
        const wb = XLSX.utils.book_new();
        
        // Main sheet
        const wsData = createExcelData(data);
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [{ wch: 25 }, { wch: 35 }, { wch: 10 }, { wch: 40 }];
        XLSX.utils.book_append_sheet(wb, ws, 'Vehicle Evaluation');
        
        // Summary sheet
        const summaryData = createSummaryData(data);
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        wsSummary['!cols'] = [{ wch: 20 }, { wch: 40 }];
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
        
        const formNumber = document.getElementById('formNumber').value || 'form';
        const date = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `Vehicle_Evaluation_${formNumber}_${date}.xlsx`);
        
        hideLoading();
        showNotification('تم تصدير Excel بنجاح! 📊', 'success');
    } catch (error) {
        console.error('Excel Export Error:', error);
        hideLoading();
        showNotification('حدث خطأ أثناء التصدير', 'error');
    }
}

function exportAllToExcel() {
    const vehicles = getVehicles();
    if (vehicles.length === 0) {
        showNotification('لا توجد مركبات للتصدير', 'warning');
        return;
    }
    
    showLoading('جاري تصدير جميع المركبات...');
    
    try {
        const wb = XLSX.utils.book_new();
        
        // Create summary sheet with all vehicles
        const allData = [
            ['REPOSSESSED VEHICLES REPORT'],
            [`Generated: ${new Date().toLocaleString()}`],
            [`Total Vehicles: ${vehicles.length}`],
            [''],
            ['Form Number', 'Customer', 'Make', 'Model', 'Year', 'VIN', 'Market Value', 'Rating', 'Recommendation', 'Date']
        ];
        
        vehicles.forEach(v => {
            allData.push([
                v.formNumber || '',
                v.customerName || '',
                v.make || '',
                v.model || '',
                v.year || '',
                v.vin || '',
                v.marketValue || '',
                getRatingText(v.overallRating),
                getRecommendationText(v.recommendation),
                v.evaluationDate || ''
            ]);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(allData);
        ws['!cols'] = [
            { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 6 },
            { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 12 }
        ];
        XLSX.utils.book_append_sheet(wb, ws, 'All Vehicles');
        
        const date = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `All_Vehicles_${date}.xlsx`);
        
        hideLoading();
        showNotification(`تم تصدير ${vehicles.length} مركبة بنجاح! 📊`, 'success');
    } catch (error) {
        console.error('Export All Error:', error);
        hideLoading();
        showNotification('حدث خطأ أثناء التصدير', 'error');
    }
}

async function exportToPDF() {
    if (!validateForm(false)) {
        if (!confirm('بعض الحقول فارغة. متابعة؟')) return;
    }
    
    showLoading('جاري إنشاء ملف PDF...');
    
    try {
        const { jsPDF } = window.jspdf;
        const data = collectExcelData();
        const formNumber = document.getElementById('formNumber').value || 'form';
        const date = new Date().toISOString().split('T')[0];
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        let y = margin;
        
        // Header
        pdf.setFillColor(26, 95, 122);
        pdf.rect(0, 0, pageWidth, 25, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('REPOSSESSED VEHICLE EVALUATION REPORT', pageWidth / 2, 12, { align: 'center' });
        pdf.setFontSize(10);
        pdf.text(`Form: ${formNumber} | Date: ${date}`, pageWidth / 2, 20, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
        y = 35;
        
        // Helper functions
        const addSection = (title) => {
            if (y > pageHeight - 30) { pdf.addPage(); y = margin; }
            y += 5;
            pdf.setFillColor(26, 95, 122);
            pdf.rect(margin, y - 5, pageWidth - 2 * margin, 8, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'bold');
            pdf.text(title, margin + 3, y);
            pdf.setTextColor(0, 0, 0);
            y += 10;
        };
        
        const addRow = (label, value) => {
            if (y > pageHeight - 15) { pdf.addPage(); y = margin; }
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.text(label + ':', margin, y);
            pdf.setFont('helvetica', 'normal');
            const valueText = String(value || 'N/A');
            pdf.text(valueText, margin + 55, y);
            y += 6;
        };
        
        // Content sections
        addSection('BASIC INFORMATION');
        addRow('Contract Number', data['Contract Number']);
        addRow('Customer Name', data['Customer Name']);
        addRow('Vehicle', `${data['Year']} ${data['Vehicle Make']} ${data['Vehicle Model']}`);
        addRow('VIN', data['VIN']);
        addRow('Plate Number', data['Plate Number']);
        addRow('Odometer', data['Odometer (km)'] ? `${data['Odometer (km)']} km` : 'N/A');
        addRow('Color', data['Color']);
        addRow('Fuel Type', data['Fuel Type']);
        addRow('Repo Date', data['Repo Date']);
        addRow('Repo Location', data['Repo Location']);
        
        addSection('TECHNICAL EVALUATION');
        addRow('Body Condition', data['Body Condition']);
        addRow('Tires Condition', data['Tires Condition']);
        addRow('Lights Condition', data['Lights Condition']);
        addRow('Seats Condition', data['Seats Condition']);
        addRow('Glass Condition', data['Glass Condition']);
        
        addSection('DAMAGE ASSESSMENT');
        addRow('Damages Found', data['Damages Found']);
        if (data['Damage Details']) addRow('Details', data['Damage Details']);
        
        addSection('ACCESSORIES');
        addRow('Items Present', data['Accessories Present']);
        addRow('Keys Count', data['Number of Keys']);
        
        addSection('VALUATION & ASSESSMENT');
        addRow('Market Value', data['Estimated Market Value (SAR)'] ? `${data['Estimated Market Value (SAR)']} SAR` : 'N/A');
        addRow('Overall Rating', data['Overall Rating']);
        addRow('Recommendation', data['Recommendation']);
        if (data['Additional Notes']) addRow('Notes', data['Additional Notes']);
        
        addSection('EVALUATOR');
        addRow('Name', data['Evaluator Name']);
        addRow('ID', data['Evaluator ID']);
        addRow('Date', data['Evaluation Date']);
        
        // Footer
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setTextColor(128, 128, 128);
            pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
        }
        
        pdf.save(`Vehicle_Evaluation_${formNumber}_${date}.pdf`);
        hideLoading();
        showNotification('تم تصدير PDF بنجاح! 📄', 'success');
    } catch (error) {
        console.error('PDF Export Error:', error);
        hideLoading();
        showNotification('حدث خطأ أثناء التصدير', 'error');
    }
}

function exportToJSON() {
    const data = collectFormData();
    data.exportedAt = new Date().toISOString();
    
    const formNumber = document.getElementById('formNumber').value || 'form';
    const date = new Date().toISOString().split('T')[0];
    const fileName = `Vehicle_Evaluation_${formNumber}_${date}.json`;
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('تم تصدير JSON بنجاح! 💾', 'success');
}

// ===== Excel Data Helpers =====
function collectExcelData() {
    const form = document.getElementById('vehicleEvaluationForm');
    const formNumber = document.getElementById('formNumber').value;
    
    const getRadioValue = (name) => {
        const selected = form.querySelector(`input[name="${name}"]:checked`);
        return selected ? selected.value : '';
    };
    
    const getCheckboxValues = (name) => {
        const checked = form.querySelectorAll(`input[name="${name}"]:checked`);
        return Array.from(checked).map(cb => cb.value);
    };
    
    return {
        'Form Number': formNumber,
        'Contract Number': form.elements['contractNo']?.value || '',
        'Customer Name': form.elements['customerName']?.value || '',
        'Vehicle Make': form.elements['make']?.value || '',
        'Vehicle Model': form.elements['model']?.value || '',
        'Year': form.elements['year']?.value || '',
        'Plate Number': form.elements['plateNo']?.value || '',
        'VIN': form.elements['vin']?.value || '',
        'Odometer (km)': form.elements['odometer']?.value || '',
        'Color': form.elements['color']?.value || '',
        'Repo Date': form.elements['repoDate']?.value || '',
        'Repo Location': form.elements['repoLocation']?.value || '',
        'Fuel Type': getFuelTypeText(form.elements['fuelType']?.value),
        'Body Condition': getRatingText(getRadioValue('body')),
        'Body Notes': form.elements['bodyNotes']?.value || '',
        'Tires Condition': getRatingText(getRadioValue('tires')),
        'Tires Notes': form.elements['tiresNotes']?.value || '',
        'Lights Condition': getRatingText(getRadioValue('lights')),
        'Lights Notes': form.elements['lightsNotes']?.value || '',
        'Seats Condition': getRatingText(getRadioValue('seats')),
        'Seats Notes': form.elements['seatsNotes']?.value || '',
        'Glass Condition': getRatingText(getRadioValue('glass')),
        'Glass Notes': form.elements['glassNotes']?.value || '',
        'Damages Found': getCheckboxValues('damages').map(getDamageText).join(', ') || 'None',
        'Damage Details': form.elements['damageDetails']?.value || '',
        'Accessories Present': getCheckboxValues('accessories').map(getAccessoryText).join(', ') || 'None',
        'Number of Keys': form.elements['keysCount']?.value || '',
        'Estimated Market Value (SAR)': form.elements['marketValue']?.value || '',
        'Overall Rating': getRatingText(getRadioValue('overallRating')),
        'Recommendation': getRecommendationText(getRadioValue('recommendation')),
        'Additional Notes': form.elements['additionalNotes']?.value || '',
        'Evaluator Name': form.elements['evaluatorName']?.value || '',
        'Evaluator ID': form.elements['evaluatorId']?.value || '',
        'Evaluation Date': form.elements['evaluationDate']?.value || ''
    };
}

function createExcelData(data) {
    return [
        ['REPOSSESSED VEHICLE EVALUATION REPORT'],
        [''],
        ['=== BASIC INFORMATION ==='],
        ['Form Number', data['Form Number']],
        ['Contract Number', data['Contract Number']],
        ['Customer Name', data['Customer Name']],
        ['Vehicle Make', data['Vehicle Make']],
        ['Vehicle Model', data['Vehicle Model']],
        ['Year', data['Year']],
        ['Plate Number', data['Plate Number']],
        ['VIN', data['VIN']],
        ['Odometer (km)', data['Odometer (km)']],
        ['Color', data['Color']],
        ['Fuel Type', data['Fuel Type']],
        ['Repo Date', data['Repo Date']],
        ['Repo Location', data['Repo Location']],
        [''],
        ['=== TECHNICAL EVALUATION ==='],
        ['Body Condition', data['Body Condition'], 'Notes:', data['Body Notes']],
        ['Tires Condition', data['Tires Condition'], 'Notes:', data['Tires Notes']],
        ['Lights Condition', data['Lights Condition'], 'Notes:', data['Lights Notes']],
        ['Seats Condition', data['Seats Condition'], 'Notes:', data['Seats Notes']],
        ['Glass Condition', data['Glass Condition'], 'Notes:', data['Glass Notes']],
        [''],
        ['=== DAMAGE ASSESSMENT ==='],
        ['Damages Found', data['Damages Found']],
        ['Damage Details', data['Damage Details']],
        [''],
        ['=== ACCESSORIES ==='],
        ['Accessories Present', data['Accessories Present']],
        ['Number of Keys', data['Number of Keys']],
        [''],
        ['=== VALUATION ==='],
        ['Estimated Market Value (SAR)', data['Estimated Market Value (SAR)']],
        [''],
        ['=== OVERALL ASSESSMENT ==='],
        ['Overall Rating', data['Overall Rating']],
        ['Recommendation', data['Recommendation']],
        ['Additional Notes', data['Additional Notes']],
        [''],
        ['=== EVALUATOR ==='],
        ['Evaluator Name', data['Evaluator Name']],
        ['Evaluator ID', data['Evaluator ID']],
        ['Evaluation Date', data['Evaluation Date']],
        [''],
        ['Report Generated:', new Date().toLocaleString()]
    ];
}

function createSummaryData(data) {
    return [
        ['Field', 'Value'],
        ['Form Number', data['Form Number']],
        ['Customer', data['Customer Name']],
        ['Vehicle', `${data['Year']} ${data['Vehicle Make']} ${data['Vehicle Model']}`],
        ['VIN', data['VIN']],
        ['Market Value', data['Estimated Market Value (SAR)']],
        ['Overall Rating', data['Overall Rating']],
        ['Recommendation', data['Recommendation']],
        ['Evaluation Date', data['Evaluation Date']],
        ['Evaluator', data['Evaluator Name']]
    ];
}

// ===== Text Converters =====
function getRatingText(value) {
    const map = { 'excellent': 'Excellent', 'good': 'Good', 'fair': 'Fair', 'poor': 'Poor' };
    return map[value] || value || 'N/A';
}

function getRecommendationText(value) {
    const map = { 'sell_as_is': 'Sell As-Is', 'repair_sell': 'Repair & Sell', 'auction': 'Auction', 'scrap': 'Scrap' };
    return map[value] || value || 'N/A';
}

function getFuelTypeText(value) {
    const map = { 'petrol': 'Petrol', 'diesel': 'Diesel', 'hybrid': 'Hybrid', 'electric': 'Electric' };
    return map[value] || value || 'N/A';
}

function getDamageText(value) {
    const map = {
        'scratches': 'Scratches', 'dents': 'Dents', 'rust': 'Rust',
        'cracked_glass': 'Cracked Glass', 'missing_parts': 'Missing Parts', 'accident_damage': 'Accident Damage'
    };
    return map[value] || value;
}

function getAccessoryText(value) {
    const map = {
        'spare_tire': 'Spare Tire', 'jack': 'Jack', 'tools': 'Tool Kit',
        'first_aid': 'First Aid Kit', 'fire_extinguisher': 'Fire Extinguisher',
        'manual': "Owner's Manual", 'keys': 'Keys', 'registration': 'Registration'
    };
    return map[value] || value;
}

// ===== Utility Functions =====
function printForm() {
    window.print();
}

function confirmReset() {
    if (confirm('هل أنت متأكد من مسح جميع البيانات؟\nAre you sure you want to clear all data?')) {
        resetForm(true);
    }
}

function resetForm(showMessage = true) {
    document.getElementById('vehicleEvaluationForm').reset();
    currentVehicleId = null;
    localStorage.removeItem('autoSaveData');
    
    // Clear photos
    for (let i = 1; i <= 3; i++) {
        removePhoto(i);
    }
    
    // Clear validation errors
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
    
    generateFormNumber();
    setDefaultDate();
    
    if (showMessage) {
        showNotification('تم مسح النموذج', 'info');
    }
}

function showLoading(text = 'جاري المعالجة...') {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}
