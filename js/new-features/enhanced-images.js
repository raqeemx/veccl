/**
 * ========================================
 * 📸 Enhanced Images System - نظام الصور المحسّن
 * ========================================
 * 
 * رفع صور متعددة مع تصنيفات
 * دعم رفع ملفات PDF
 * ضغط الصور تلقائياً
 * 
 * الإصدار 1.0
 */

// ===== Namespace to avoid conflicts =====
window.NFImages = (function() {
    'use strict';
    
    // ===== Constants =====
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB per image
    const MAX_IMAGES = 20; // Maximum 20 images per vehicle
    const MAX_PDF_SIZE = 20 * 1024 * 1024; // 20MB for PDF
    const COMPRESSION_QUALITY = 0.7;
    const MAX_WIDTH = 1920;
    const MAX_HEIGHT = 1080;
    
    // ===== Image Categories =====
    const IMAGE_CATEGORIES = {
        exterior_front: { name: 'الواجهة الأمامية', nameEn: 'Front Exterior', icon: 'fa-car' },
        exterior_back: { name: 'الواجهة الخلفية', nameEn: 'Rear Exterior', icon: 'fa-car' },
        exterior_left: { name: 'الجانب الأيسر', nameEn: 'Left Side', icon: 'fa-car-side' },
        exterior_right: { name: 'الجانب الأيمن', nameEn: 'Right Side', icon: 'fa-car-side' },
        interior_front: { name: 'المقاعد الأمامية', nameEn: 'Front Interior', icon: 'fa-couch' },
        interior_back: { name: 'المقاعد الخلفية', nameEn: 'Rear Interior', icon: 'fa-couch' },
        dashboard: { name: 'لوحة القيادة', nameEn: 'Dashboard', icon: 'fa-tachometer-alt' },
        engine: { name: 'المحرك', nameEn: 'Engine', icon: 'fa-cog' },
        trunk: { name: 'الشنطة', nameEn: 'Trunk', icon: 'fa-box' },
        tires: { name: 'الإطارات', nameEn: 'Tires', icon: 'fa-circle' },
        damage: { name: 'صور الأضرار', nameEn: 'Damage Photos', icon: 'fa-exclamation-triangle' },
        documents: { name: 'المستندات', nameEn: 'Documents', icon: 'fa-file-alt' },
        other: { name: 'أخرى', nameEn: 'Other', icon: 'fa-image' }
    };
    
    // ===== Compress Image =====
    function compressImage(file, maxWidth = MAX_WIDTH, maxHeight = MAX_HEIGHT, quality = COMPRESSION_QUALITY) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    let width = img.width;
                    let height = img.height;
                    
                    // Calculate new dimensions
                    if (width > maxWidth) {
                        height = Math.round(height * maxWidth / width);
                        width = maxWidth;
                    }
                    if (height > maxHeight) {
                        width = Math.round(width * maxHeight / height);
                        height = maxHeight;
                    }
                    
                    // Create canvas and compress
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve({
                                    blob: blob,
                                    dataUrl: canvas.toDataURL('image/jpeg', quality),
                                    width: width,
                                    height: height,
                                    originalSize: file.size,
                                    compressedSize: blob.size
                                });
                            } else {
                                reject(new Error('Compression failed'));
                            }
                        },
                        'image/jpeg',
                        quality
                    );
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    // ===== Validate Image File =====
    function validateImageFile(file) {
        const errors = [];
        
        // Check file type
        if (!file.type.startsWith('image/')) {
            errors.push('الملف ليس صورة صالحة');
        }
        
        // Check file size
        if (file.size > MAX_IMAGE_SIZE) {
            errors.push(`حجم الصورة كبير جداً (الحد الأقصى: ${MAX_IMAGE_SIZE / 1024 / 1024}MB)`);
        }
        
        return errors;
    }
    
    // ===== Validate PDF File =====
    function validatePDFFile(file) {
        const errors = [];
        
        // Check file type
        if (file.type !== 'application/pdf') {
            errors.push('الملف ليس PDF صالح');
        }
        
        // Check file size
        if (file.size > MAX_PDF_SIZE) {
            errors.push(`حجم الملف كبير جداً (الحد الأقصى: ${MAX_PDF_SIZE / 1024 / 1024}MB)`);
        }
        
        return errors;
    }
    
    // ===== Process Image Upload =====
    async function processImageUpload(file, category = 'other') {
        const errors = validateImageFile(file);
        if (errors.length > 0) {
            return { success: false, errors };
        }
        
        try {
            const compressed = await compressImage(file);
            
            return {
                success: true,
                data: {
                    id: 'IMG' + Date.now() + Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    type: 'image',
                    category: category,
                    categoryName: IMAGE_CATEGORIES[category]?.name || category,
                    dataUrl: compressed.dataUrl,
                    originalSize: compressed.originalSize,
                    compressedSize: compressed.compressedSize,
                    width: compressed.width,
                    height: compressed.height,
                    uploadedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            return { success: false, errors: ['فشل في معالجة الصورة'] };
        }
    }
    
    // ===== Process PDF Upload =====
    function processPDFUpload(file, category = 'documents') {
        return new Promise((resolve) => {
            const errors = validatePDFFile(file);
            if (errors.length > 0) {
                resolve({ success: false, errors });
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                resolve({
                    success: true,
                    data: {
                        id: 'PDF' + Date.now() + Math.random().toString(36).substr(2, 9),
                        name: file.name,
                        type: 'pdf',
                        category: category,
                        categoryName: IMAGE_CATEGORIES[category]?.name || 'مستند',
                        dataUrl: e.target.result,
                        size: file.size,
                        uploadedAt: new Date().toISOString()
                    }
                });
            };
            reader.onerror = () => resolve({ success: false, errors: ['فشل في قراءة الملف'] });
            reader.readAsDataURL(file);
        });
    }
    
    // ===== Process Multiple Files =====
    async function processMultipleFiles(files, defaultCategory = 'other') {
        const results = {
            success: [],
            failed: []
        };
        
        for (const file of files) {
            if (file.type === 'application/pdf') {
                const result = await processPDFUpload(file, 'documents');
                if (result.success) {
                    results.success.push(result.data);
                } else {
                    results.failed.push({ file: file.name, errors: result.errors });
                }
            } else if (file.type.startsWith('image/')) {
                const result = await processImageUpload(file, defaultCategory);
                if (result.success) {
                    results.success.push(result.data);
                } else {
                    results.failed.push({ file: file.name, errors: result.errors });
                }
            } else {
                results.failed.push({ file: file.name, errors: ['نوع ملف غير مدعوم'] });
            }
        }
        
        return results;
    }
    
    // ===== Create Image Upload Section HTML =====
    function createImageUploadSection(existingImages = []) {
        let categoriesHTML = '';
        Object.entries(IMAGE_CATEGORIES).forEach(([key, config]) => {
            categoriesHTML += `<option value="${key}">${config.name}</option>`;
        });
        
        return `
            <div class="nf-image-upload-section">
                <div class="upload-header">
                    <h5><i class="fas fa-images"></i> صور ومستندات المركبة</h5>
                    <span class="image-count">${existingImages.length}/${MAX_IMAGES} صورة</span>
                </div>
                
                <div class="category-selector">
                    <label>تصنيف الصور:</label>
                    <select id="imageCategory" class="form-input">
                        ${categoriesHTML}
                    </select>
                </div>
                
                <div class="upload-area" id="dropZone" onclick="document.getElementById('multiImageInput').click()">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>اضغط أو اسحب الصور هنا</p>
                    <span>يمكن رفع صور (JPG, PNG) وملفات PDF</span>
                    <span>الحد الأقصى: ${MAX_IMAGE_SIZE / 1024 / 1024}MB للصور، ${MAX_PDF_SIZE / 1024 / 1024}MB لـ PDF</span>
                </div>
                
                <input type="file" id="multiImageInput" accept="image/*,application/pdf" multiple style="display: none;" 
                       onchange="NFImages.handleFileSelect(this.files)">
                
                <div class="images-by-category" id="imagesByCategory">
                    ${createImagesByCategoryHTML(existingImages)}
                </div>
            </div>
        `;
    }
    
    // ===== Create Images by Category HTML =====
    function createImagesByCategoryHTML(images) {
        if (!images || images.length === 0) {
            return '<p class="no-images">لا توجد صور بعد</p>';
        }
        
        // Group by category
        const grouped = {};
        images.forEach(img => {
            const cat = img.category || 'other';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(img);
        });
        
        let html = '';
        Object.entries(grouped).forEach(([category, categoryImages]) => {
            const catConfig = IMAGE_CATEGORIES[category] || { name: category, icon: 'fa-image' };
            
            html += `
                <div class="category-group">
                    <h6><i class="fas ${catConfig.icon}"></i> ${catConfig.name} (${categoryImages.length})</h6>
                    <div class="images-grid">
            `;
            
            categoryImages.forEach(img => {
                if (img.type === 'pdf') {
                    html += `
                        <div class="image-item pdf" data-id="${img.id}">
                            <div class="pdf-icon"><i class="fas fa-file-pdf"></i></div>
                            <span class="file-name">${img.name}</span>
                            <div class="image-actions">
                                <button class="btn-icon" onclick="NFImages.viewPDF('${img.id}')" title="عرض">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn-icon danger" onclick="NFImages.removeImage('${img.id}')" title="حذف">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="image-item" data-id="${img.id}">
                            <img src="${img.dataUrl}" alt="${img.name}" onclick="NFImages.viewImage('${img.id}')">
                            <div class="image-actions">
                                <button class="btn-icon" onclick="NFImages.viewImage('${img.id}')" title="تكبير">
                                    <i class="fas fa-search-plus"></i>
                                </button>
                                <button class="btn-icon danger" onclick="NFImages.removeImage('${img.id}')" title="حذف">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        return html;
    }
    
    // ===== Handle File Select =====
    async function handleFileSelect(files) {
        const category = document.getElementById('imageCategory')?.value || 'other';
        
        // Check limit
        const currentImages = window._vehicleImages || [];
        if (currentImages.length + files.length > MAX_IMAGES) {
            if (window.NFNotify) {
                NFNotify.show({ message: `لا يمكن رفع أكثر من ${MAX_IMAGES} صورة`, type: 'warning' });
            }
            return;
        }
        
        // Show loading
        if (window.NFNotify) {
            NFNotify.show({ message: 'جاري معالجة الملفات...', type: 'info' });
        }
        
        const results = await processMultipleFiles(Array.from(files), category);
        
        // Add successful uploads
        if (results.success.length > 0) {
            window._vehicleImages = [...currentImages, ...results.success];
            refreshImagesDisplay();
            
            if (window.NFNotify) {
                NFNotify.show({ message: `تم رفع ${results.success.length} ملف بنجاح`, type: 'success' });
            }
        }
        
        // Show errors
        if (results.failed.length > 0) {
            results.failed.forEach(fail => {
                if (window.NFNotify) {
                    NFNotify.show({ message: `فشل رفع ${fail.file}: ${fail.errors.join(', ')}`, type: 'error' });
                }
            });
        }
    }
    
    // ===== Refresh Images Display =====
    function refreshImagesDisplay() {
        const container = document.getElementById('imagesByCategory');
        const countSpan = document.querySelector('.image-count');
        
        if (container) {
            container.innerHTML = createImagesByCategoryHTML(window._vehicleImages || []);
        }
        
        if (countSpan) {
            countSpan.textContent = `${(window._vehicleImages || []).length}/${MAX_IMAGES} صورة`;
        }
    }
    
    // ===== View Image =====
    function viewImage(imageId) {
        const images = window._vehicleImages || [];
        const image = images.find(img => img.id === imageId);
        
        if (!image) return;
        
        // Create lightbox
        const lightbox = document.createElement('div');
        lightbox.className = 'nf-lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-content">
                <button class="lightbox-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
                <img src="${image.dataUrl}" alt="${image.name}">
                <div class="lightbox-info">
                    <span>${image.categoryName || image.category}</span>
                    <span>${image.name}</span>
                </div>
            </div>
        `;
        
        lightbox.onclick = function(e) {
            if (e.target === lightbox) lightbox.remove();
        };
        
        document.body.appendChild(lightbox);
    }
    
    // ===== View PDF =====
    function viewPDF(pdfId) {
        const images = window._vehicleImages || [];
        const pdf = images.find(img => img.id === pdfId);
        
        if (!pdf) return;
        
        // Open PDF in new window
        const win = window.open('', '_blank');
        win.document.write(`
            <html>
            <head><title>${pdf.name}</title></head>
            <body style="margin:0; padding:0;">
                <embed src="${pdf.dataUrl}" type="application/pdf" width="100%" height="100%">
            </body>
            </html>
        `);
    }
    
    // ===== Remove Image =====
    function removeImage(imageId) {
        if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) return;
        
        window._vehicleImages = (window._vehicleImages || []).filter(img => img.id !== imageId);
        refreshImagesDisplay();
        
        if (window.NFNotify) {
            NFNotify.show({ message: 'تم حذف الملف', type: 'info' });
        }
    }
    
    // ===== Get All Images =====
    function getAllImages() {
        return window._vehicleImages || [];
    }
    
    // ===== Set Images =====
    function setImages(images) {
        window._vehicleImages = images || [];
        refreshImagesDisplay();
    }
    
    // ===== Clear Images =====
    function clearImages() {
        window._vehicleImages = [];
        refreshImagesDisplay();
    }
    
    // ===== Initialize Drag and Drop =====
    function initDragAndDrop() {
        const dropZone = document.getElementById('dropZone');
        if (!dropZone) return;
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            handleFileSelect(e.dataTransfer.files);
        });
    }
    
    // ===== Return Public API =====
    return {
        IMAGE_CATEGORIES,
        MAX_IMAGES,
        compressImage,
        validateImageFile,
        validatePDFFile,
        processImageUpload,
        processPDFUpload,
        processMultipleFiles,
        createImageUploadSection,
        createImagesByCategoryHTML,
        handleFileSelect,
        refreshImagesDisplay,
        viewImage,
        viewPDF,
        removeImage,
        getAllImages,
        setImages,
        clearImages,
        initDragAndDrop
    };
})();
