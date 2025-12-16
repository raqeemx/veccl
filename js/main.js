/**
 * Enhanced Vehicle Evaluation Form
 * Main JavaScript File
 * Version: 2.0
 */

// ===== Global Variables =====
let autoSaveTimer = null;
let notificationQueue = [];

// ===== Initialize on Page Load =====
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
    setDefaultDates();
    generateFormNumber();
    loadThemePreference();
    checkSavedData();
    initializeValidation();
});

// ===== Initialization Functions =====

/**
 * Initialize form with default settings
 */
function initializeForm() {
    console.log('🚀 Initializing Enhanced Vehicle Evaluation Form...');
    
    // Check browser compatibility
    if (!window.localStorage) {
        showNotification('المتصفح لا يدعم الحفظ التلقائي | Browser does not support auto-save', 'warning');
    }
    
    // Initialize form state
    window.formState = {
        isDirty: false,
        lastSaved: null,
        photos: {
            photo1: null,
            photo2: null,
            photo3: null
        }
    };
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    const form = document.getElementById('vehicleEvaluationForm');
    
    // Form change events for auto-save
    if (form) {
        form.addEventListener('change', handleFormChange);
        form.addEventListener('input', debounce(handleFormChange, 2000));
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            saveForm();
        });
    }
    
    // VIN validation
    const vinInput = document.getElementById('vin');
    if (vinInput) {
        vinInput.addEventListener('input', function(e) {
            this.value = this.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
            validateField(this);
        });
    }
    
    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }
    
    // Keys checkbox handler
    const keysCheckbox = document.querySelector('input[name="accessories"][value="keys"]');
    if (keysCheckbox) {
        keysCheckbox.addEventListener('change', toggleKeysCount);
    }
    
    // Real-time validation for required fields
    const requiredFields = document.querySelectorAll('input[data-required="true"]');
    requiredFields.forEach(field => {
        field.addEventListener('blur', function() {
            validateField(this);
        });
        field.addEventListener('input', function() {
            if (this.value.trim()) {
                clearFieldError(this);
            }
        });
    });
    
    // Photo size validation
    ['photo1', 'photo2', 'photo3'].forEach((photoId, index) => {
        const input = document.getElementById(photoId);
        if (input) {
            input.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file && file.size > 5 * 1024 * 1024) {
                    showNotification('حجم الصورة كبير جداً (أقصى حد 5MB) | File too large (max 5MB)', 'error');
                    this.value = '';
                    return;
                }
                previewImage(this, 'preview' + (index + 1));
            });
        }
    });
    
    // Prevent accidental page close
    window.addEventListener('beforeunload', function(e) {
        if (window.formState.isDirty) {
            e.preventDefault();
            e.returnValue = 'لديك تغييرات غير محفوظة. هل تريد المغادرة؟ | You have unsaved changes. Leave anyway?';
            return e.returnValue;
        }
    });
}

/**
 * Initialize field validation
 */
function initializeValidation() {
    const requiredFields = document.querySelectorAll('input[data-required="true"]');
    requiredFields.forEach(field => {
        const errorSpan = field.parentElement.querySelector('.error-message');
        if (!errorSpan) {
            const span = document.createElement('span');
            span.className = 'error-message';
            field.parentElement.appendChild(span);
        }
    });
}

// ===== Dark Mode Functions =====

/**
 * Toggle dark mode
 */
function toggleDarkMode() {
    const body = document.body;
    const isDark = body.classList.toggle('dark-mode');
    
    // Update icon
    const icon = document.querySelector('#darkModeToggle i');
    if (icon) {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    // Save preference
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
    
    showNotification(
        isDark ? 'تم تفعيل الوضع الليلي | Dark mode enabled' : 'تم تفعيل الوضع النهاري | Light mode enabled',
        'info'
    );
}

/**
 * Load theme preference
 */
function loadThemePreference() {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'enabled') {
        document.body.classList.add('dark-mode');
        const icon = document.querySelector('#darkModeToggle i');
        if (icon) icon.className = 'fas fa-sun';
    }
}

// ===== Form Functions =====

/**
 * Generate unique form number
 */
function generateFormNumber() {
    const formNumberInput = document.getElementById('formNumber');
    if (formNumberInput && !formNumberInput.value) {
        const year = new Date().getFullYear();
        const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        formNumberInput.value = `VE-${year}-${randomNum}`;
    }
}

/**
 * Set default dates
 */
function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    const repoDate = document.getElementById('repoDate');
    const evaluationDate = document.getElementById('evaluationDate');
    
    if (repoDate && !repoDate.value) repoDate.value = today;
    if (evaluationDate && !evaluationDate.value) evaluationDate.value = today;
}

/**
 * Handle form changes for auto-save
 */
function handleFormChange() {
    window.formState.isDirty = true;
    
    // Debounced auto-save
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        autoSaveForm();
    }, 2000);
}

/**
 * Auto-save form data
 */
function autoSaveForm() {
    const formData = collectFormData();
    
    if (formData.contractNo || formData.customerName || formData.vin) {
        localStorage.setItem('vehicleEvalForm', JSON.stringify(formData));
        window.formState.lastSaved = new Date();
        showAutoSaveStatus('محفوظ تلقائياً | Auto-saved');
        console.log('✅ Auto-saved at:', new Date().toLocaleTimeString());
    }
}

/**
 * Show auto-save status
 */
function showAutoSaveStatus(message) {
    const statusElement = document.getElementById('autoSaveStatus');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.style.display = 'block';
        
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 2000);
    }
}

/**
 * Check for saved data on load
 */
function checkSavedData() {
    const savedData = localStorage.getItem('vehicleEvalForm');
    
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            const savedTime = new Date(data.savedAt);
            const now = new Date();
            const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
            
            // Only restore if saved within last 24 hours
            if (hoursDiff < 24) {
                if (confirm('يوجد نموذج محفوظ. هل تريد استعادته؟\nFound saved form. Restore it?')) {
                    loadFormData(data);
                    showNotification('تم استعادة البيانات بنجاح | Data restored successfully', 'success');
                }
            } else {
                // Clear old data
                localStorage.removeItem('vehicleEvalForm');
            }
        } catch (e) {
            console.error('Error loading saved data:', e);
            showNotification('فشل تحميل البيانات المحفوظة | Failed to load saved data', 'error');
        }
    }
}

// ===== Data Management Functions =====

/**
 * Collect all form data
 */
function collectFormData() {
    const form = document.getElementById('vehicleEvaluationForm');
    const formData = new FormData(form);
    const data = {
        formNumber: document.getElementById('formNumber').value,
        savedAt: new Date().toISOString()
    };
    
    // Get all input values
    formData.forEach((value, key) => {
        if (value instanceof File) return; // Skip file inputs
        
        if (data[key]) {
            // Handle multiple values (checkboxes)
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    });
    
    // Save photo previews
    data.photos = {};
    ['photo1', 'photo2', 'photo3'].forEach(photoId => {
        const preview = document.getElementById('preview' + photoId.charAt(photoId.length - 1));
        const img = preview?.querySelector('img');
        if (img) {
            data.photos[photoId] = img.src;
        }
    });
    
    return data;
}

/**
 * Load form data from saved object
 */
function loadFormData(data) {
    const form = document.getElementById('vehicleEvaluationForm');
    
    // Load form number
    if (data.formNumber) {
        document.getElementById('formNumber').value = data.formNumber;
    }
    
    // Load all fields
    Object.keys(data).forEach(key => {
        if (key === 'savedAt' || key === 'photos' || key === 'formNumber') return;
        
        const element = form.elements[key];
        if (!element) return;
        
        if (element.type === 'checkbox') {
            const checkboxes = form.querySelectorAll(`input[name="${key}"]`);
            const values = Array.isArray(data[key]) ? data[key] : [data[key]];
            checkboxes.forEach(cb => {
                cb.checked = values.includes(cb.value);
            });
        } else if (element.type === 'radio') {
            const radios = form.querySelectorAll(`input[name="${key}"]`);
            radios.forEach(radio => {
                radio.checked = radio.value === data[key];
            });
        } else if (element.length && element[0].type === 'radio') {
            Array.from(element).forEach(radio => {
                radio.checked = radio.value === data[key];
            });
        } else if (element.type !== 'file') {
            element.value = data[key];
        }
    });
    
    // Load photos
    if (data.photos) {
        Object.keys(data.photos).forEach(photoId => {
            const previewId = 'preview' + photoId.charAt(photoId.length - 1);
            const preview = document.getElementById(previewId);
            if (preview && data.photos[photoId]) {
                preview.innerHTML = `<img src="${data.photos[photoId]}" alt="Vehicle Photo">`;
                const removeBtn = document.getElementById('removeBtn' + photoId.charAt(photoId.length - 1));
                if (removeBtn) removeBtn.style.display = 'inline-block';
            }
        });
    }
    
    // Check if keys checkbox should show count
    const keysCheckbox = document.querySelector('input[name="accessories"][value="keys"]');
    if (keysCheckbox && keysCheckbox.checked) {
        document.getElementById('keysCountContainer').style.display = 'block';
    }
    
    window.formState.isDirty = false;
}

// ===== Validation Functions =====

/**
 * Validate entire form
 */
function validateForm(showErrors = true) {
    const requiredFields = document.querySelectorAll('input[data-required="true"]');
    let isValid = true;
    const errors = [];
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            const label = field.parentElement.querySelector('label')?.textContent || field.name;
            errors.push(label);
            
            if (showErrors) {
                markFieldAsError(field);
            }
        } else {
            clearFieldError(field);
        }
    });
    
    // VIN validation
    const vinField = document.getElementById('vin');
    if (vinField && vinField.value && vinField.value.length !== 17) {
        isValid = false;
        errors.push('VIN must be 17 characters');
        if (showErrors) {
            markFieldAsError(vinField, 'VIN يجب أن يكون 17 حرف | VIN must be 17 characters');
        }
    }
    
    if (!isValid && showErrors) {
        showNotification(
            `يرجى ملء الحقول المطلوبة (${errors.length}) | Please fill required fields (${errors.length})`,
            'error'
        );
    }
    
    return isValid;
}

/**
 * Validate single field
 */
function validateField(field) {
    if (field.hasAttribute('data-required') && !field.value.trim()) {
        markFieldAsError(field);
        return false;
    } else if (field.id === 'vin' && field.value && field.value.length !== 17) {
        markFieldAsError(field, 'VIN يجب أن يكون 17 حرف | VIN must be 17 characters');
        return false;
    } else {
        clearFieldError(field);
        return true;
    }
}

/**
 * Mark field as having error
 */
function markFieldAsError(field, message = '') {
    field.classList.add('error');
    const errorSpan = field.parentElement.querySelector('.error-message');
    if (errorSpan) {
        errorSpan.textContent = message || 'هذا الحقل مطلوب | This field is required';
    }
}

/**
 * Clear field error
 */
function clearFieldError(field) {
    field.classList.remove('error');
    const errorSpan = field.parentElement.querySelector('.error-message');
    if (errorSpan) {
        errorSpan.textContent = '';
    }
}

// ===== Photo Management Functions =====

/**
 * Preview image when selected
 */
function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    const removeBtn = document.getElementById('removeBtn' + previewId.charAt(previewId.length - 1));
    
    if (input.files && input.files[0]) {
        const file = input.files[0];
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('حجم الصورة كبير جداً (أقصى حد 5MB) | File too large (max 5MB)', 'error');
            input.value = '';
            return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showNotification('يرجى اختيار ملف صورة | Please select an image file', 'error');
            input.value = '';
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Vehicle Photo">`;
            if (removeBtn) {
                removeBtn.style.display = 'inline-block';
            }
            window.formState.isDirty = true;
        };
        
        reader.onerror = function() {
            showNotification('فشل تحميل الصورة | Failed to load image', 'error');
        };
        
        reader.readAsDataURL(file);
    }
}

/**
 * Remove image from preview
 */
function removeImage(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const removeBtn = document.getElementById('removeBtn' + previewId.charAt(previewId.length - 1));
    
    if (input) input.value = '';
    
    if (preview) {
        preview.innerHTML = `
            <i class="fas fa-camera"></i>
            <span>اضغط لإضافة صورة<br><small>Max 5MB</small></span>
        `;
    }
    
    if (removeBtn) removeBtn.style.display = 'none';
    
    window.formState.isDirty = true;
}

// ===== Form Action Functions =====

/**
 * Save form data
 */
function saveForm() {
    if (!validateForm(true)) {
        return;
    }
    
    const formData = collectFormData();
    localStorage.setItem('vehicleEvalForm', JSON.stringify(formData));
    window.formState.isDirty = false;
    window.formState.lastSaved = new Date();
    
    showNotification('تم حفظ النموذج بنجاح! | Form saved successfully!', 'success');
    
    // Offer to download JSON
    setTimeout(() => {
        if (confirm('هل تريد تحميل نسخة احتياطية (JSON)؟\nDownload backup copy (JSON)?')) {
            downloadFormData(formData);
        }
    }, 500);
}

/**
 * Print form
 */
function printForm() {
    if (!validateForm(false)) {
        if (!confirm('بعض الحقول فارغة. هل تريد الطباعة على أي حال؟\nSome fields are empty. Print anyway?')) {
            return;
        }
    }
    
    window.print();
}

/**
 * Reset form
 */
function handleReset() {
    if (!confirm('هل أنت متأكد من مسح النموذج؟ سيتم حذف جميع البيانات.\nAre you sure? All data will be cleared.')) {
        return false;
    }
    
    // Clear localStorage
    localStorage.removeItem('vehicleEvalForm');
    
    // Clear photos
    ['photo1', 'photo2', 'photo3'].forEach((photoId, index) => {
        removeImage(photoId, 'preview' + (index + 1));
    });
    
    // Reset form
    document.getElementById('vehicleEvaluationForm').reset();
    
    // Regenerate form number and dates
    setTimeout(() => {
        generateFormNumber();
        setDefaultDates();
        window.formState.isDirty = false;
        showNotification('تم مسح النموذج | Form cleared', 'info');
    }, 100);
    
    return false;
}

// ===== Export Functions =====

/**
 * Export to PDF
 */
async function exportToPDF() {
    if (!validateForm(false)) {
        if (!confirm('بعض الحقول فارغة. هل تريد التصدير على أي حال؟\nSome fields empty. Export anyway?')) {
            return;
        }
    }
    
    showLoading('جاري إنشاء PDF... | Creating PDF...');
    
    try {
        const { jsPDF } = window.jspdf;
        const data = collectFormData();
        const formNumber = data.formNumber || 'form';
        const date = new Date().toISOString().split('T')[0];
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        let y = margin;
        
        // Helper functions
        const addRow = (label, value, labelWidth = 60) => {
            if (y > pageHeight - margin - 10) {
                pdf.addPage();
                y = margin;
            }
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.text(label + ':', margin, y);
            pdf.setFont('helvetica', 'normal');
            
            const valueText = String(value || 'N/A');
            const valueLines = pdf.splitTextToSize(valueText, pageWidth - margin - labelWidth - 10);
            valueLines.forEach((line, index) => {
                if (index === 0) {
                    pdf.text(line, margin + labelWidth, y);
                } else {
                    y += 5;
                    if (y > pageHeight - margin) {
                        pdf.addPage();
                        y = margin;
                    }
                    pdf.text(line, margin + labelWidth, y);
                }
            });
            y += 7;
        };
        
        const addSectionHeader = (title) => {
            if (y > pageHeight - margin - 20) {
                pdf.addPage();
                y = margin;
            }
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
        
        // Title
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
        
        // Basic Information
        addSectionHeader('BASIC INFORMATION');
        addRow('Contract Number', data.contractNo);
        addRow('Customer Name', data.customerName);
        addRow('Vehicle Make', data.make);
        addRow('Vehicle Model', data.model);
        addRow('Year', data.year);
        addRow('VIN', data.vin);
        addRow('Plate Number', data.plateNo);
        addRow('Odometer', data.odometer ? `${data.odometer} km` : 'N/A');
        addRow('Color', data.color);
        addRow('Fuel Type', getFuelTypeText(data.fuelType));
        addRow('Repo Date', data.repoDate);
        addRow('Repo Location', data.repoLocation);
        
        // Technical Evaluation
        addSectionHeader('TECHNICAL EVALUATION');
        ['body', 'tires', 'lights', 'seats', 'glass'].forEach(item => {
            const rating = data[item] || 'N/A';
            const notes = data[item + 'Notes'];
            addRow(getItemName(item), getRatingText(rating));
            if (notes) addRow('  Notes', notes);
        });
        
        // Damage Assessment
        addSectionHeader('DAMAGE ASSESSMENT');
        const damages = Array.isArray(data.damages) ? data.damages : (data.damages ? [data.damages] : []);
        addRow('Damages Found', damages.length > 0 ? damages.map(d => getDamageText(d)).join(', ') : 'None');
        if (data.damageDetails) addRow('Details', data.damageDetails);
        
        // Accessories
        addSectionHeader('ACCESSORIES & EQUIPMENT');
        const accessories = Array.isArray(data.accessories) ? data.accessories : (data.accessories ? [data.accessories] : []);
        addRow('Items Present', accessories.length > 0 ? accessories.map(a => getAccessoryText(a)).join(', ') : 'None');
        if (data.keysCount) addRow('Number of Keys', data.keysCount);
        
        // Financial Valuation
        addSectionHeader('FINANCIAL VALUATION');
        addRow('Market Value', data.marketValue ? `${data.marketValue} SAR` : 'N/A');
        
        // Overall Assessment
        addSectionHeader('OVERALL ASSESSMENT');
        addRow('Overall Rating', getRatingText(data.overallRating));
        addRow('Recommendation', getRecommendationText(data.recommendation));
        if (data.additionalNotes) addRow('Additional Notes', data.additionalNotes);
        
        // Evaluator Info
        addSectionHeader('EVALUATOR INFORMATION');
        addRow('Evaluator Name', data.evaluatorName);
        addRow('Employee ID', data.evaluatorId);
        addRow('Evaluation Date', data.evaluationDate);
        
        // Add images if available
        const hasPhotos = ['photo1', 'photo2', 'photo3'].some(id => {
            const input = document.getElementById(id);
            return input && input.files && input.files[0];
        });
        
        if (hasPhotos || data.photos) {
            pdf.addPage();
            y = margin;
            addSectionHeader('VEHICLE PHOTOS');
            
            let photoX = margin;
            let photoCount = 0;
            const photoWidth = (pageWidth - 3 * margin) / 2;
            const photoHeight = 60;
            
            for (let i = 1; i <= 3; i++) {
                const photoData = data.photos?.[`photo${i}`];
                if (photoData) {
                    if (photoCount > 0 && photoCount % 2 === 0) {
                        y += photoHeight + 10;
                        photoX = margin;
                    }
                    
                    if (y + photoHeight > pageHeight - margin) {
                        pdf.addPage();
                        y = margin;
                        photoX = margin;
                    }
                    
                    try {
                        pdf.addImage(photoData, 'JPEG', photoX, y, photoWidth, photoHeight);
                        photoX += photoWidth + margin;
                        photoCount++;
                    } catch (e) {
                        console.error('Error adding image:', e);
                    }
                }
            }
        }
        
        // Footer on all pages
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setTextColor(128, 128, 128);
            pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
            pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
        }
        
        // Save PDF
        const fileName = `Vehicle_Evaluation_${formNumber}_${date}.pdf`;
        pdf.save(fileName);
        
        hideLoading();
        showNotification('تم تصدير PDF بنجاح! | PDF exported successfully!', 'success');
        
    } catch (error) {
        console.error('PDF Export Error:', error);
        hideLoading();
        showNotification('حدث خطأ أثناء إنشاء PDF | Error creating PDF', 'error');
    }
}

/**
 * Export to Excel
 */
function exportToExcel() {
    if (!validateForm(false)) {
        if (!confirm('بعض الحقول فارغة. هل تريد التصدير على أي حال؟\nSome fields empty. Export anyway?')) {
            return;
        }
    }
    
    showLoading('جاري إنشاء Excel... | Creating Excel...');
    
    try {
        const data = collectFormData();
        const formNumber = data.formNumber || 'form';
        const date = new Date().toISOString().split('T')[0];
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // Prepare data array
        const wsData = [
            ['REPOSSESSED VEHICLE EVALUATION REPORT'],
            [''],
            ['=== BASIC INFORMATION ==='],
            ['Form Number', data.formNumber],
            ['Contract Number', data.contractNo],
            ['Customer Name', data.customerName],
            ['Vehicle Make', data.make],
            ['Vehicle Model', data.model],
            ['Year', data.year],
            ['Plate Number', data.plateNo],
            ['VIN', data.vin],
            ['Odometer (km)', data.odometer],
            ['Color', data.color],
            ['Repo Date', data.repoDate],
            ['Repo Location', data.repoLocation],
            ['Fuel Type', getFuelTypeText(data.fuelType)],
            [''],
            ['=== TECHNICAL EVALUATION ==='],
            ['Body Condition', getRatingText(data.body), 'Notes:', data.bodyNotes || ''],
            ['Tires Condition', getRatingText(data.tires), 'Notes:', data.tiresNotes || ''],
            ['Lights Condition', getRatingText(data.lights), 'Notes:', data.lightsNotes || ''],
            ['Seats Condition', getRatingText(data.seats), 'Notes:', data.seatsNotes || ''],
            ['Glass Condition', getRatingText(data.glass), 'Notes:', data.glassNotes || ''],
            [''],
            ['=== DAMAGE ASSESSMENT ==='],
            ['Damages Found', getDamagesText(data)],
            ['Damage Details', data.damageDetails || ''],
            [''],
            ['=== ACCESSORIES ==='],
            ['Accessories Present', getAccessoriesText(data)],
            ['Number of Keys', data.keysCount || ''],
            [''],
            ['=== FINANCIAL VALUATION ==='],
            ['Estimated Market Value (SAR)', data.marketValue || ''],
            [''],
            ['=== OVERALL ASSESSMENT ==='],
            ['Overall Rating', getRatingText(data.overallRating)],
            ['Recommendation', getRecommendationText(data.recommendation)],
            ['Additional Notes', data.additionalNotes || ''],
            [''],
            ['=== EVALUATOR INFORMATION ==='],
            ['Evaluator Name', data.evaluatorName || ''],
            ['Employee ID', data.evaluatorId || ''],
            ['Evaluation Date', data.evaluationDate || ''],
            [''],
            ['Report Generated:', new Date().toLocaleString()]
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Set column widths
        ws['!cols'] = [
            { wch: 25 },
            { wch: 30 },
            { wch: 10 },
            { wch: 40 }
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, 'Vehicle Evaluation');
        
        // Summary sheet
        const summaryData = [
            ['Field', 'Value'],
            ['Form Number', data.formNumber],
            ['Contract Number', data.contractNo],
            ['Customer Name', data.customerName],
            ['Vehicle', `${data.year} ${data.make} ${data.model}`],
            ['VIN', data.vin],
            ['Market Value (SAR)', data.marketValue],
            ['Overall Rating', getRatingText(data.overallRating)],
            ['Recommendation', getRecommendationText(data.recommendation)],
            ['Evaluation Date', data.evaluationDate]
        ];
        
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        wsSummary['!cols'] = [{ wch: 20 }, { wch: 40 }];
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
        
        const fileName = `Vehicle_Evaluation_${formNumber}_${date}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        hideLoading();
        showNotification('تم تصدير Excel بنجاح! | Excel exported successfully!', 'success');
        
    } catch (error) {
        console.error('Excel Export Error:', error);
        hideLoading();
        showNotification('حدث خطأ أثناء إنشاء Excel | Error creating Excel', 'error');
    }
}

/**
 * Export to JSON
 */
function exportToJSON() {
    const data = collectFormData();
    const formNumber = data.formNumber || 'form';
    const date = new Date().toISOString().split('T')[0];
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `Vehicle_Evaluation_${formNumber}_${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('تم تنزيل JSON بنجاح! | JSON downloaded successfully!', 'success');
}

/**
 * Import from JSON
 */
function importFromJSON(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            loadFormData(data);
            showNotification('تم استيراد البيانات بنجاح! | Data imported successfully!', 'success');
        } catch (error) {
            console.error('Import Error:', error);
            showNotification('ملف غير صالح | Invalid file', 'error');
        }
    };
    reader.readAsText(file);
}

// ===== Helper Functions =====

/**
 * Show loading overlay
 */
function showLoading(message) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' :
                 type === 'error' ? 'fa-exclamation-circle' :
                 type === 'warning' ? 'fa-exclamation-triangle' :
                 'fa-info-circle';
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
        <button class="close-btn" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideDown 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Toggle keys count field
 */
function toggleKeysCount() {
    const keysCheckbox = document.querySelector('input[name="accessories"][value="keys"]');
    const keysCountContainer = document.getElementById('keysCountContainer');
    
    if (keysCheckbox && keysCountContainer) {
        keysCountContainer.style.display = keysCheckbox.checked ? 'block' : 'none';
    }
}

// ===== Text Translation Functions =====

function getRatingText(value) {
    const ratings = {
        'excellent': 'Excellent',
        'good': 'Good',
        'fair': 'Fair',
        'poor': 'Poor'
    };
    return ratings[value] || value || 'N/A';
}

function getRecommendationText(value) {
    const recommendations = {
        'sell_as_is': 'Sell As-Is',
        'repair_sell': 'Repair & Sell',
        'auction': 'Auction',
        'scrap': 'Scrap'
    };
    return recommendations[value] || value || 'N/A';
}

function getFuelTypeText(value) {
    const fuelTypes = {
        'petrol': 'Petrol',
        'diesel': 'Diesel',
        'hybrid': 'Hybrid',
        'electric': 'Electric'
    };
    return fuelTypes[value] || value || 'N/A';
}

function getItemName(item) {
    const items = {
        'body': 'Body Condition',
        'tires': 'Tires Condition',
        'lights': 'Lights Condition',
        'seats': 'Seats Condition',
        'glass': 'Glass Condition'
    };
    return items[item] || item;
}

function getDamageText(value) {
    const damages = {
        'scratches': 'Scratches',
        'dents': 'Dents',
        'rust': 'Rust',
        'cracked_glass': 'Cracked Glass',
        'missing_parts': 'Missing Parts',
        'accident_damage': 'Accident Damage'
    };
    return damages[value] || value;
}

function getAccessoryText(value) {
    const accessories = {
        'spare_tire': 'Spare Tire',
        'jack': 'Jack',
        'tools': 'Tool Kit',
        'first_aid': 'First Aid Kit',
        'fire_extinguisher': 'Fire Extinguisher',
        'manual': "Owner's Manual",
        'keys': 'Keys',
        'registration': 'Registration'
    };
    return accessories[value] || value;
}

function getDamagesText(data) {
    const damages = Array.isArray(data.damages) ? data.damages : (data.damages ? [data.damages] : []);
    return damages.length > 0 ? damages.map(d => getDamageText(d)).join(', ') : 'None';
}

function getAccessoriesText(data) {
    const accessories = Array.isArray(data.accessories) ? data.accessories : (data.accessories ? [data.accessories] : []);
    return accessories.length > 0 ? accessories.map(a => getAccessoryText(a)).join(', ') : 'None';
}

/**
 * Read file as Data URL
 */
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
}

// ===== Console greeting =====
console.log('%c🚗 Vehicle Evaluation System v2.0', 'font-size: 20px; color: #667eea; font-weight: bold;');
console.log('%cEnhanced with: Auto-save • Dark Mode • Advanced Export', 'color: #10b981;');
console.log('%cDeveloped with ❤️ in Saudi Arabia', 'color: #ef4444;');