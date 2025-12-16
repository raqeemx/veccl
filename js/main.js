/**
 * Ù†Ù…ÙˆØ°Ø¬ ØªÙ‚ÙŠÙŠÙ… Ù…Ø±ÙƒØ¨Ø© Ù…Ø³ØªØ±Ø¯Ù‘Ø©
 * Repossessed Vehicle Evaluation Form
 * JavaScript Functions
 */

// ===== Initialize on Page Load =====
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
    setDefaultDate();
    generateFormNumber();
});

/**
 * Initialize form with default values
 */
function initializeForm() {
    // Check if there's saved data in localStorage
    const savedData = localStorage.getItem('vehicleEvaluationForm');
    if (savedData) {
        const shouldRestore = confirm('ÙŠÙˆØ¬Ø¯ Ù†Ù…ÙˆØ°Ø¬ Ù…Ø­ÙÙˆØ¸ Ù…Ø³Ø¨Ù‚Ø§Ù‹. Ù‡Ù„ ØªØ±ÙŠØ¯ Ø§Ø³ØªØ¹Ø§Ø¯ØªÙ‡ØŸ\nThere is a previously saved form. Would you like to restore it?');
        if (shouldRestore) {
            loadFormData(JSON.parse(savedData));
        }
    }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // VIN validation
    const vinInput = document.getElementById('vin');
    if (vinInput) {
        vinInput.addEventListener('input', function(e) {
            this.value = this.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
        });
    }
    
    // Auto-save functionality
    const form = document.getElementById('vehicleEvaluationForm');
    if (form) {
        form.addEventListener('change', autoSave);
        form.addEventListener('input', debounce(autoSave, 2000));
    }
    
    // Form reset handler
    form.addEventListener('reset', function(e) {
        setTimeout(() => {
            localStorage.removeItem('vehicleEvaluationForm');
            generateFormNumber();
            setDefaultDate();
            // Clear photo previews
            for (let i = 1; i <= 3; i++) {
                removeImage(`photo${i}`, `preview${i}`);
            }
            showNotification('ØªÙ… Ù…Ø³Ø­ Ø§Ù„Ù†Ù…ÙˆØ°Ø¬ Ø¨Ù†Ø¬Ø§Ø­ / Form cleared successfully', 'info');
        }, 100);
    });
}

/**
 * Set default date to today
 */
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
 * Print the form
 */
function printForm() {
    // Validate required fields before printing
    if (!validateForm(false)) {
        const proceed = confirm('Ø¨Ø¹Ø¶ Ø§Ù„Ø­Ù‚ÙˆÙ„ ÙØ§Ø±ØºØ©. Ù‡Ù„ ØªØ±ÙŠØ¯ Ø§Ù„Ø·Ø¨Ø§Ø¹Ø© Ø¹Ù„Ù‰ Ø£ÙŠ Ø­Ø§Ù„ØŸ\nSome fields are empty. Do you want to print anyway?');
        if (!proceed) return;
    }
    
    window.print();
}

/**
 * Save form data
 */
function saveForm() {
    if (!validateForm(true)) {
        return;
    }
    
    const formData = collectFormData();
    localStorage.setItem('vehicleEvaluationForm', JSON.stringify(formData));
    
    // Show success message
    showNotification('ØªÙ… Ø­ÙØ¸ Ø§Ù„Ù†Ù…ÙˆØ°Ø¬ Ø¨Ù†Ø¬Ø§Ø­! / Form saved successfully!', 'success');
    
    // Optionally download as JSON
    const downloadOption = confirm('Ù‡Ù„ ØªØ±ÙŠØ¯ ØªØ­Ù…ÙŠÙ„ Ù†Ø³Ø®Ø© Ù…Ù† Ø§Ù„Ù†Ù…ÙˆØ°Ø¬ØŸ\nWould you like to download a copy of the form?');
    if (downloadOption) {
        downloadFormData(formData);
    }
}

/**
 * Collect all form data
 */
function collectFormData() {
    const form = document.getElementById('vehicleEvaluationForm');
    const formData = new FormData(form);
    const data = {};
    
    // Get all input values
    formData.forEach((value, key) => {
        // Skip file inputs
        if (value instanceof File) return;
        
        if (data[key]) {
            // Handle multiple values (like checkboxes)
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    });
    
    // Add form number
    data.formNumber = document.getElementById('formNumber').value;
    
    // Add timestamp
    data.savedAt = new Date().toISOString();
    
    return data;
}

/**
 * Load form data from saved object
 */
function loadFormData(data) {
    const form = document.getElementById('vehicleEvaluationForm');
    
    Object.keys(data).forEach(key => {
        const element = form.elements[key];
        if (!element) {
            // Handle special cases like formNumber
            if (key === 'formNumber') {
                document.getElementById('formNumber').value = data[key];
            }
            return;
        }
        
        if (element.type === 'checkbox') {
            // Handle checkboxes
            const checkboxes = form.querySelectorAll(`input[name="${key}"]`);
            const values = Array.isArray(data[key]) ? data[key] : [data[key]];
            checkboxes.forEach(cb => {
                cb.checked = values.includes(cb.value);
            });
        } else if (element.type === 'radio') {
            // Handle radio buttons
            const radios = form.querySelectorAll(`input[name="${key}"]`);
            radios.forEach(radio => {
                radio.checked = radio.value === data[key];
            });
        } else if (element.length && element[0].type === 'radio') {
            // Handle radio button NodeList
            Array.from(element).forEach(radio => {
                radio.checked = radio.value === data[key];
            });
        } else if (element.type !== 'file') {
            element.value = data[key];
        }
    });
    
    showNotification('ØªÙ… Ø§Ø³ØªØ¹Ø§Ø¯Ø© Ø§Ù„Ù†Ù…ÙˆØ°Ø¬ Ø¨Ù†Ø¬Ø§Ø­ / Form restored successfully', 'success');
}

/**
 * Download form data as JSON file
 */
function downloadFormData(data) {
    const fileName = `vehicle-evaluation-${data.formNumber || 'form'}-${new Date().toISOString().split('T')[0]}.json`;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Validate form fields
 */
function validateForm(showErrors) {
    const requiredFields = [
        { id: 'contractNo', name: 'Ø±Ù‚Ù… Ø§Ù„Ø¹Ù‚Ø¯ / Contract No.' },
        { id: 'customerName', name: 'Ø§Ø³Ù… Ø§Ù„Ø¹Ù…ÙŠÙ„ / Customer Name' },
        { id: 'make', name: 'Ù†ÙˆØ¹ Ø§Ù„Ù…Ø±ÙƒØ¨Ø© / Make' },
        { id: 'model', name: 'Ø§Ù„Ù…ÙˆØ¯ÙŠÙ„ / Model' },
        { id: 'year', name: 'Ø³Ù†Ø© Ø§Ù„ØµÙ†Ø¹ / Year' },
        { id: 'vin', name: 'Ø±Ù‚Ù… Ø§Ù„Ù‡ÙŠÙƒÙ„ / VIN' }
    ];
    
    let isValid = true;
    const missingFields = [];
    
    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (!element || !element.value.trim()) {
            isValid = false;
            missingFields.push(field.name);
            if (element && showErrors) {
                element.classList.add('error');
                element.style.borderColor = '#dc3545';
            }
        } else {
            if (element) {
                element.classList.remove('error');
                element.style.borderColor = '';
            }
        }
    });
    
    if (!isValid && showErrors) {
        showNotification(
            `ÙŠØ±Ø¬Ù‰ Ù…Ù„Ø¡ Ø§Ù„Ø­Ù‚ÙˆÙ„ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©:\n${missingFields.join('\n')}\n\nPlease fill in the required fields.`,
            'error'
        );
    }
    
    return isValid;
}

/**
 * Auto-save form data
 */
function autoSave() {
    const formData = collectFormData();
    localStorage.setItem('vehicleEvaluationForm', JSON.stringify(formData));
    console.log('Form auto-saved at:', new Date().toLocaleTimeString());
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message.replace(/\n/g, '<br>')}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 15px 25px;
        border-radius: 8px;
        background: ${getNotificationColor(type)};
        color: #fff;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 15px;
        max-width: 90%;
        animation: slideDown 0.3s ease;
    `;
    
    // Add animation keyframes
    if (!document.getElementById('notificationStyles')) {
        const style = document.createElement('style');
        style.id = 'notificationStyles';
        style.textContent = `
            @keyframes slideDown {
                from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .notification-close {
                background: none;
                border: none;
                color: #fff;
                cursor: pointer;
                padding: 5px;
                opacity: 0.8;
            }
            .notification-close:hover {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideDown 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

/**
 * Get notification icon based on type
 */
function getNotificationIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

/**
 * Get notification color based on type
 */
function getNotificationColor(type) {
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    return colors[type] || colors.info;
}

/**
 * Debounce function for performance
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
 * Preview image when selected
 */
function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    const removeBtn = document.getElementById('removeBtn' + previewId.charAt(previewId.length - 1));
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="ØµÙˆØ±Ø© Ø§Ù„Ù…Ø±ÙƒØ¨Ø©">`;
            if (removeBtn) {
                removeBtn.style.display = 'inline-block';
            }
        };
        
        reader.readAsDataURL(input.files[0]);
    }
}

/**
 * Remove image from preview
 */
function removeImage(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const removeBtn = document.getElementById('removeBtn' + previewId.charAt(previewId.length - 1));
    
    if (input) {
        input.value = '';
    }
    
    if (preview) {
        preview.innerHTML = `
            <i class="fas fa-camera"></i>
            <span>Ø§Ø¶ØºØ· Ù„Ø¥Ø¶Ø§ÙØ© ØµÙˆØ±Ø©</span>
        `;
    }
    
    if (removeBtn) {
        removeBtn.style.display = 'none';
    }
}

/**
 * Show loading overlay
 */
function showLoadingOverlay(message) {
    const overlay = document.createElement('div');
    overlay.className = 'pdf-loading-overlay';
    overlay.id = 'pdfLoadingOverlay';
    overlay.innerHTML = `
        <i class="fas fa-spinner"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(overlay);
}

/**
 * Hide loading overlay
 */
function hideLoadingOverlay() {
    const overlay = document.getElementById('pdfLoadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

/**
 * Get rating text in English
 */
function getRatingText(value) {
    const ratings = {
        'excellent': 'Excellent',
        'good': 'Good',
        'poor': 'Poor',
        'fair': 'Fair'
    };
    return ratings[value] || value || 'N/A';
}

/**
 * Get recommendation text in English
 */
function getRecommendationText(value) {
    const recommendations = {
        'sell_as_is': 'Sell As-Is',
        'repair_sell': 'Repair & Sell',
        'auction': 'Auction',
        'scrap': 'Scrap'
    };
    return recommendations[value] || value || 'N/A';
}

/**
 * Get fuel type text in English
 */
function getFuelTypeText(value) {
    const fuelTypes = {
        'petrol': 'Petrol',
        'diesel': 'Diesel',
        'hybrid': 'Hybrid',
        'electric': 'Electric'
    };
    return fuelTypes[value] || value || 'N/A';
}

/**
 * Get damage text in English
 */
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

/**
 * Get accessory text in English
 */
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

/**
 * Collect form data for Excel export (English format)
 */
function collectExcelData() {
    const form = document.getElementById('vehicleEvaluationForm');
    const formNumber = document.getElementById('formNumber').value;
    
    // Get selected radio button value
    const getRadioValue = (name) => {
        const selected = form.querySelector(`input[name="${name}"]:checked`);
        return selected ? selected.value : '';
    };
    
    // Get all checked checkboxes values
    const getCheckboxValues = (name) => {
        const checked = form.querySelectorAll(`input[name="${name}"]:checked`);
        return Array.from(checked).map(cb => cb.value);
    };
    
    // Basic Information
    const basicInfo = {
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
        'Fuel Type': getFuelTypeText(form.elements['fuelType']?.value)
    };
    
    // Technical Evaluation
    const technicalEval = {
        'Body Condition': getRatingText(getRadioValue('body')),
        'Body Notes': form.elements['bodyNotes']?.value || '',
        'Tires Condition': getRatingText(getRadioValue('tires')),
        'Tires Notes': form.elements['tiresNotes']?.value || '',
        'Lights Condition': getRatingText(getRadioValue('lights')),
        'Lights Notes': form.elements['lightsNotes']?.value || '',
        'Seats Condition': getRatingText(getRadioValue('seats')),
        'Seats Notes': form.elements['seatsNotes']?.value || '',
        'Glass Condition': getRatingText(getRadioValue('glass')),
        'Glass Notes': form.elements['glassNotes']?.value || ''
    };
    
    // Damage Assessment
    const damages = getCheckboxValues('damages');
    const damageAssessment = {
        'Damages Found': damages.map(d => getDamageText(d)).join(', ') || 'None',
        'Damage Details': form.elements['damageDetails']?.value || ''
    };
    
    // Accessories
    const accessories = getCheckboxValues('accessories');
    const accessoriesInfo = {
        'Accessories Present': accessories.map(a => getAccessoryText(a)).join(', ') || 'None',
        'Number of Keys': form.elements['keysCount']?.value || ''
    };
    
    // Financial Valuation
    const financialInfo = {
        'Estimated Market Value (SAR)': form.elements['marketValue']?.value || ''
    };
    
    // Overall Assessment
    const overallAssessment = {
        'Overall Rating': getRatingText(getRadioValue('overallRating')),
        'Recommendation': getRecommendationText(getRadioValue('recommendation')),
        'Additional Notes': form.elements['additionalNotes']?.value || ''
    };
    
    // Evaluator Info
    const evaluatorInfo = {
        'Evaluator Name': form.elements['evaluatorName']?.value || '',
        'Evaluator ID': form.elements['evaluatorId']?.value || '',
        'Evaluation Date': form.elements['evaluationDate']?.value || ''
    };
    
    return {
        ...basicInfo,
        ...technicalEval,
        ...damageAssessment,
        ...accessoriesInfo,
        ...financialInfo,
        ...overallAssessment,
        ...evaluatorInfo
    };
}

/**
 * Export form data to Excel
 */
function exportToExcel() {
    // Validate form first
    if (!validateForm(false)) {
        const proceed = confirm('Ø¨Ø¹Ø¶ Ø§Ù„Ø­Ù‚ÙˆÙ„ ÙØ§Ø±ØºØ©. Ù‡Ù„ ØªØ±ÙŠØ¯ Ø§Ù„ØªØµØ¯ÙŠØ± Ø¹Ù„Ù‰ Ø£ÙŠ Ø­Ø§Ù„ØŸ\nSome fields are empty. Do you want to export anyway?');
        if (!proceed) return;
    }
    
    showLoadingOverlay('Ø¬Ø§Ø±ÙŠ Ø¥Ù†Ø´Ø§Ø¡ Ù…Ù„Ù Excel... / Creating Excel file...');
    
    try {
        const data = collectExcelData();
        const formNumber = document.getElementById('formNumber').value || 'form';
        const date = new Date().toISOString().split('T')[0];
        
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        
        // Convert data to array format for better Excel structure
        const wsData = [
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
            ['Repo Date', data['Repo Date']],
            ['Repo Location', data['Repo Location']],
            ['Fuel Type', data['Fuel Type']],
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
            ['=== FINANCIAL VALUATION ==='],
            ['Estimated Market Value (SAR)', data['Estimated Market Value (SAR)']],
            [''],
            ['=== OVERALL ASSESSMENT ==='],
            ['Overall Rating', data['Overall Rating']],
            ['Recommendation', data['Recommendation']],
            ['Additional Notes', data['Additional Notes']],
            [''],
            ['=== EVALUATOR INFORMATION ==='],
            ['Evaluator Name', data['Evaluator Name']],
            ['Evaluator ID', data['Evaluator ID']],
            ['Evaluation Date', data['Evaluation Date']],
            [''],
            ['Report Generated:', new Date().toLocaleString()]
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Set column widths
        ws['!cols'] = [
            { wch: 25 },  // Column A
            { wch: 30 },  // Column B
            { wch: 10 },  // Column C
            { wch: 40 }   // Column D
        ];
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Vehicle Evaluation');
        
        // Also create a summary sheet with just key data
        const summaryData = [
            ['Field', 'Value'],
            ['Form Number', data['Form Number']],
            ['Contract Number', data['Contract Number']],
            ['Customer Name', data['Customer Name']],
            ['Vehicle', `${data['Year']} ${data['Vehicle Make']} ${data['Vehicle Model']}`],
            ['VIN', data['VIN']],
            ['Plate Number', data['Plate Number']],
            ['Odometer', data['Odometer (km)']],
            ['Market Value (SAR)', data['Estimated Market Value (SAR)']],
            ['Overall Rating', data['Overall Rating']],
            ['Recommendation', data['Recommendation']],
            ['Evaluation Date', data['Evaluation Date']],
            ['Evaluator', data['Evaluator Name']]
        ];
        
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        wsSummary['!cols'] = [{ wch: 20 }, { wch: 40 }];
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
        
        // Generate filename and save
        const fileName = `Vehicle_Evaluation_${formNumber}_${date}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        hideLoadingOverlay();
        showNotification('ØªÙ… ØªØµØ¯ÙŠØ± Ù…Ù„Ù Excel Ø¨Ù†Ø¬Ø§Ø­! / Excel file exported successfully!', 'success');
        
    } catch (error) {
        console.error('Excel Export Error:', error);
        hideLoadingOverlay();
        showNotification('Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø¥Ù†Ø´Ø§Ø¡ Ù…Ù„Ù Excel.\nAn error occurred while creating Excel file.', 'error');
    }
}

/**
 * Export form to high-quality PDF with selectable text
 */
async function exportToPDF() {
    // Validate form first
    if (!validateForm(false)) {
        const proceed = confirm('Ø¨Ø¹Ø¶ Ø§Ù„Ø­Ù‚ÙˆÙ„ ÙØ§Ø±ØºØ©. Ù‡Ù„ ØªØ±ÙŠØ¯ Ø§Ù„ØªØµØ¯ÙŠØ± Ø¹Ù„Ù‰ Ø£ÙŠ Ø­Ø§Ù„ØŸ\nSome fields are empty. Do you want to export anyway?');
        if (!proceed) return;
    }
    
    showLoadingOverlay('Ø¬Ø§Ø±ÙŠ Ø¥Ù†Ø´Ø§Ø¡ Ù…Ù„Ù PDF... / Creating PDF...');
    
    try {
        const { jsPDF } = window.jspdf;
        const data = collectExcelData();
        const formNumber = document.getElementById('formNumber').value || 'form';
        const date = new Date().toISOString().split('T')[0];
        
        // Create PDF document (A4 size)
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        let y = margin;
        
        // Helper function to add text with line wrapping
        const addText = (text, x, fontSize = 10, style = 'normal', maxWidth = pageWidth - 2 * margin) => {
            pdf.setFontSize(fontSize);
            pdf.setFont('helvetica', style);
            
            const lines = pdf.splitTextToSize(text, maxWidth);
            lines.forEach(line => {
                if (y > pageHeight - margin) {
                    pdf.addPage();
                    y = margin;
                }
                pdf.text(line, x, y);
                y += fontSize * 0.5;
            });
        };
        
        // Helper function to add a row
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
        
        // Helper function to add section header
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
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Form: ${formNumber} | Date: ${date}`, pageWidth / 2, 20, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
        y = 35;
        
        // Basic Information Section
        addSectionHeader('BASIC INFORMATION');
        addRow('Contract Number', data['Contract Number']);
        addRow('Customer Name', data['Customer Name']);
        addRow('Vehicle Make', data['Vehicle Make']);
        addRow('Vehicle Model', data['Vehicle Model']);
        addRow('Year', data['Year']);
        addRow('Plate Number', data['Plate Number']);
        addRow('VIN', data['VIN']);
        addRow('Odometer', data['Odometer (km)'] ? `${data['Odometer (km)']} km` : 'N/A');
        addRow('Color', data['Color']);
        addRow('Repo Date', data['Repo Date']);
        addRow('Repo Location', data['Repo Location']);
        addRow('Fuel Type', data['Fuel Type']);
        
        // Technical Evaluation Section
        addSectionHeader('TECHNICAL EVALUATION');
        addRow('Body Condition', data['Body Condition']);
        if (data['Body Notes']) addRow('  Notes', data['Body Notes']);
        addRow('Tires Condition', data['Tires Condition']);
        if (data['Tires Notes']) addRow('  Notes', data['Tires Notes']);
        addRow('Lights Condition', data['Lights Condition']);
        if (data['Lights Notes']) addRow('  Notes', data['Lights Notes']);
        addRow('Seats Condition', data['Seats Condition']);
        if (data['Seats Notes']) addRow('  Notes', data['Seats Notes']);
        addRow('Glass Condition', data['Glass Condition']);
        if (data['Glass Notes']) addRow('  Notes', data['Glass Notes']);
        
        // Damage Assessment Section
        addSectionHeader('DAMAGE ASSESSMENT');
        addRow('Damages Found', data['Damages Found']);
        if (data['Damage Details']) addRow('Details', data['Damage Details']);
        
        // Accessories Section
        addSectionHeader('ACCESSORIES & EQUIPMENT');
        addRow('Items Present', data['Accessories Present']);
        addRow('Number of Keys', data['Number of Keys']);
        
        // Financial Valuation Section
        addSectionHeader('FINANCIAL VALUATION');
        addRow('Est. Market Value', data['Estimated Market Value (SAR)'] ? `${data['Estimated Market Value (SAR)']} SAR` : 'N/A');
        
        // Overall Assessment Section
        addSectionHeader('OVERALL ASSESSMENT');
        addRow('Overall Rating', data['Overall Rating']);
        addRow('Recommendation', data['Recommendation']);
        if (data['Additional Notes']) addRow('Additional Notes', data['Additional Notes']);
        
        // Evaluator Information Section
        addSectionHeader('EVALUATOR INFORMATION');
        addRow('Evaluator Name', data['Evaluator Name']);
        addRow('Evaluator ID', data['Evaluator ID']);
        addRow('Evaluation Date', data['Evaluation Date']);
        
        // Add images if available
        const photoInputs = ['photo1', 'photo2', 'photo3'];
        const hasPhotos = photoInputs.some(id => {
            const input = document.getElementById(id);
            return input && input.files && input.files[0];
        });
        
        if (hasPhotos) {
            pdf.addPage();
            y = margin;
            addSectionHeader('VEHICLE PHOTOS');
            
            let photoX = margin;
            let photoCount = 0;
            const photoWidth = (pageWidth - 3 * margin) / 2;
            const photoHeight = 60;
            
            for (const inputId of photoInputs) {
                const input = document.getElementById(inputId);
                if (input && input.files && input.files[0]) {
                    const imgData = await readFileAsDataURL(input.files[0]);
                    
                    if (photoCount > 0 && photoCount % 2 === 0) {
                        y += photoHeight + 10;
                        photoX = margin;
                    }
                    
                    if (y + photoHeight > pageHeight - margin) {
                        pdf.addPage();
                        y = margin;
                        photoX = margin;
                    }
                    
                    pdf.addImage(imgData, 'JPEG', photoX, y, photoWidth, photoHeight);
                    photoX += photoWidth + margin;
                    photoCount++;
                }
            }
        }
        
        // Footer on last page
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
        
        hideLoadingOverlay();
        showNotification('ØªÙ… ØªØµØ¯ÙŠØ± Ù…Ù„Ù PDF Ø¨Ù†Ø¬Ø§Ø­! / PDF exported successfully!', 'success');
        
    } catch (error) {
        console.error('PDF Export Error:', error);
        hideLoadingOverlay();
        showNotification('Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø¥Ù†Ø´Ø§Ø¡ PDF.\nAn error occurred while creating PDF.', 'error');
    }
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

/**
 * Clear saved data from localStorage
 */
function clearSavedData() {
    const confirmDelete = window.confirm('Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø­Ø°Ù Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø­ÙÙˆØ¸Ø©ØŸ\nAre you sure you want to delete saved data?');
    if (confirmDelete) {
        localStorage.removeItem('vehicleEvaluationForm');
        showNotification('ØªÙ… Ø­Ø°Ù Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø­ÙÙˆØ¸Ø© / Saved data deleted', 'info');
    }
}