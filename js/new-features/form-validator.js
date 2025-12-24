/**
 * ========================================
 * ✅ Advanced Form Validator - التحقق المتقدم
 * ========================================
 * 
 * نظام تحقق متقدم من صحة الحقول
 * 
 * ⚠️ لا يعدل أي JavaScript موجود - إضافة فقط!
 */

// ===== Namespace to avoid conflicts =====
window.NFValidator = (function() {
    'use strict';
    
    // ===== Default Messages =====
    const MESSAGES = {
        required: 'هذا الحقل مطلوب',
        email: 'يرجى إدخال بريد إلكتروني صحيح',
        minlength: 'يجب إدخال {0} أحرف على الأقل',
        maxlength: 'يجب أن لا يتجاوز {0} حرف',
        min: 'القيمة يجب أن تكون {0} على الأقل',
        max: 'القيمة يجب أن لا تتجاوز {0}',
        pattern: 'الصيغة غير صحيحة',
        match: 'القيم غير متطابقة',
        phone: 'يرجى إدخال رقم هاتف صحيح',
        vin: 'رقم الشاصي يجب أن يكون 17 حرف',
        numeric: 'يجب إدخال أرقام فقط',
        alpha: 'يجب إدخال أحرف فقط',
        alphanumeric: 'يجب إدخال أحرف وأرقام فقط',
        password: 'كلمة المرور ضعيفة. يجب أن تحتوي على حروف وأرقام'
    };
    
    // ===== Validation Rules =====
    const RULES = {
        required: (value) => value.trim().length > 0,
        
        email: (value) => {
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return value.length === 0 || regex.test(value);
        },
        
        minlength: (value, min) => value.length >= parseInt(min),
        
        maxlength: (value, max) => value.length <= parseInt(max),
        
        min: (value, min) => parseFloat(value) >= parseFloat(min),
        
        max: (value, max) => parseFloat(value) <= parseFloat(max),
        
        pattern: (value, pattern) => {
            const regex = new RegExp(pattern);
            return value.length === 0 || regex.test(value);
        },
        
        phone: (value) => {
            const regex = /^[\d\s\-\+\(\)]+$/;
            return value.length === 0 || (regex.test(value) && value.replace(/\D/g, '').length >= 9);
        },
        
        vin: (value) => {
            // VIN should be 17 characters, alphanumeric (no I, O, Q)
            const regex = /^[A-HJ-NPR-Z0-9]{17}$/i;
            return value.length === 0 || regex.test(value);
        },
        
        numeric: (value) => {
            return value.length === 0 || /^\d+$/.test(value);
        },
        
        alpha: (value) => {
            return value.length === 0 || /^[a-zA-Z\u0600-\u06FF\s]+$/.test(value);
        },
        
        alphanumeric: (value) => {
            return value.length === 0 || /^[a-zA-Z0-9\u0600-\u06FF\s]+$/.test(value);
        },
        
        password: (value) => {
            // At least one letter and one number
            return value.length === 0 || (/[a-zA-Z]/.test(value) && /\d/.test(value));
        }
    };
    
    // ===== Validator Class =====
    class FormValidator {
        constructor(formSelector, options = {}) {
            this.form = typeof formSelector === 'string' 
                ? document.querySelector(formSelector) 
                : formSelector;
            
            if (!this.form) {
                console.error('NFValidator: Form not found');
                return;
            }
            
            this.options = {
                realTime: true,
                scrollToError: true,
                showErrorMessages: true,
                showSuccessState: true,
                ...options
            };
            
            this.errors = [];
            this.init();
        }
        
        init() {
            this.addRequiredMarkers();
            
            if (this.options.realTime) {
                this.setupRealTimeValidation();
            }
            
            // Prevent form submission if invalid
            this.form.addEventListener('submit', (e) => {
                if (!this.validateAll()) {
                    e.preventDefault();
                }
            });
        }
        
        // Add * to required fields
        addRequiredMarkers() {
            this.form.querySelectorAll('[required]').forEach(input => {
                const label = input.closest('.form-group')?.querySelector('label');
                if (label && !label.classList.contains('nf-required')) {
                    label.classList.add('nf-required');
                }
            });
        }
        
        // Setup real-time validation
        setupRealTimeValidation() {
            this.form.querySelectorAll('input, textarea, select').forEach(input => {
                input.addEventListener('blur', () => this.validateInput(input));
                input.addEventListener('input', () => {
                    // Only validate on input if already has error
                    if (input.classList.contains('nf-input-invalid')) {
                        this.validateInput(input);
                    }
                });
            });
        }
        
        // Validate single input
        validateInput(input) {
            const value = input.value;
            let isValid = true;
            let errorMessage = '';
            
            // Check required
            if (input.hasAttribute('required')) {
                if (!RULES.required(value)) {
                    isValid = false;
                    errorMessage = input.dataset.errorRequired || MESSAGES.required;
                }
            }
            
            // Check other validations only if has value
            if (isValid && value.length > 0) {
                // Email
                if (input.type === 'email' && !RULES.email(value)) {
                    isValid = false;
                    errorMessage = input.dataset.errorEmail || MESSAGES.email;
                }
                
                // Min length
                if (input.minLength > 0 && !RULES.minlength(value, input.minLength)) {
                    isValid = false;
                    errorMessage = input.dataset.errorMinlength || 
                        MESSAGES.minlength.replace('{0}', input.minLength);
                }
                
                // Max length
                if (input.maxLength > 0 && input.maxLength < 524288 && 
                    !RULES.maxlength(value, input.maxLength)) {
                    isValid = false;
                    errorMessage = input.dataset.errorMaxlength || 
                        MESSAGES.maxlength.replace('{0}', input.maxLength);
                }
                
                // Min value
                if (input.min && !RULES.min(value, input.min)) {
                    isValid = false;
                    errorMessage = input.dataset.errorMin || 
                        MESSAGES.min.replace('{0}', input.min);
                }
                
                // Max value
                if (input.max && !RULES.max(value, input.max)) {
                    isValid = false;
                    errorMessage = input.dataset.errorMax || 
                        MESSAGES.max.replace('{0}', input.max);
                }
                
                // Pattern
                if (input.pattern && !RULES.pattern(value, input.pattern)) {
                    isValid = false;
                    errorMessage = input.dataset.errorPattern || MESSAGES.pattern;
                }
                
                // Custom validations via data attributes
                if (input.dataset.validateVin && !RULES.vin(value)) {
                    isValid = false;
                    errorMessage = MESSAGES.vin;
                }
                
                if (input.dataset.validatePhone && !RULES.phone(value)) {
                    isValid = false;
                    errorMessage = MESSAGES.phone;
                }
                
                if (input.dataset.validateNumeric && !RULES.numeric(value)) {
                    isValid = false;
                    errorMessage = MESSAGES.numeric;
                }
                
                // Match another field
                if (input.dataset.match) {
                    const matchInput = document.getElementById(input.dataset.match);
                    if (matchInput && value !== matchInput.value) {
                        isValid = false;
                        errorMessage = input.dataset.errorMatch || MESSAGES.match;
                    }
                }
            }
            
            // Update UI
            this.updateInputState(input, isValid, errorMessage);
            
            return isValid;
        }
        
        // Update input visual state
        updateInputState(input, isValid, errorMessage) {
            const formGroup = input.closest('.form-group') || input.parentElement;
            
            // Remove previous states
            input.classList.remove('nf-input-valid', 'nf-input-invalid');
            formGroup.classList.remove('nf-has-error', 'nf-has-success');
            
            // Get or create error message element
            let errorEl = formGroup.querySelector('.nf-error-message');
            if (!errorEl && this.options.showErrorMessages) {
                errorEl = document.createElement('div');
                errorEl.className = 'nf-error-message';
                errorEl.innerHTML = '<i class="fas fa-exclamation-circle"></i><span></span>';
                formGroup.appendChild(errorEl);
            }
            
            if (isValid) {
                if (input.value.length > 0 && this.options.showSuccessState) {
                    input.classList.add('nf-input-valid');
                    formGroup.classList.add('nf-has-success');
                }
                if (errorEl) {
                    errorEl.classList.remove('nf-show');
                }
            } else {
                input.classList.add('nf-input-invalid');
                formGroup.classList.add('nf-has-error');
                if (errorEl) {
                    errorEl.querySelector('span').textContent = errorMessage;
                    errorEl.classList.add('nf-show');
                }
            }
        }
        
        // Validate all inputs
        validateAll() {
            this.errors = [];
            let firstError = null;
            let allValid = true;
            
            this.form.querySelectorAll('input, textarea, select').forEach(input => {
                if (!this.validateInput(input)) {
                    allValid = false;
                    if (!firstError) {
                        firstError = input;
                    }
                    this.errors.push({
                        input: input,
                        name: input.name || input.id
                    });
                }
            });
            
            // Scroll to first error
            if (!allValid && this.options.scrollToError && firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.focus();
            }
            
            // Show notification
            if (!allValid && window.NFNotify) {
                NFNotify.error('يرجى تصحيح الأخطاء في النموذج');
            }
            
            return allValid;
        }
        
        // Get errors
        getErrors() {
            return this.errors;
        }
        
        // Reset form validation state
        reset() {
            this.errors = [];
            this.form.querySelectorAll('.nf-input-valid, .nf-input-invalid').forEach(input => {
                input.classList.remove('nf-input-valid', 'nf-input-invalid');
            });
            this.form.querySelectorAll('.nf-has-error, .nf-has-success').forEach(group => {
                group.classList.remove('nf-has-error', 'nf-has-success');
            });
            this.form.querySelectorAll('.nf-error-message').forEach(el => {
                el.classList.remove('nf-show');
            });
        }
    }
    
    // ===== Calculate Password Strength =====
    function passwordStrength(password) {
        let strength = 0;
        
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        
        return Math.min(strength, 4);
    }
    
    console.log('✅ NFValidator initialized');
    
    // ===== Public API =====
    return {
        FormValidator: FormValidator,
        RULES: RULES,
        MESSAGES: MESSAGES,
        passwordStrength: passwordStrength
    };
    
})();
