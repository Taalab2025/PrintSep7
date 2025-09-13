/* ========================================
   Egypt Printing Marketplace - Main JavaScript
   ======================================== */

// Global namespace
const PrintHub = {
    // Configuration
    config: {
        apiUrl: '/api',
        defaultLang: 'en',
        currency: 'EGP',
        dateFormat: 'DD/MM/YYYY',
        uploadMaxSize: 50 * 1024 * 1024, // 50MB
        allowedFileTypes: ['pdf', 'png', 'jpg', 'jpeg', 'ai', 'psd', 'svg'],
        animationDuration: 300
    },

    // Current state
    state: {
        currentLang: localStorage.getItem('language') || 'en',
        user: null,
        cart: [],
        filters: {},
        currentModal: null
    },

    // Initialize application
    init() {
        this.initLanguage();
        this.initEventListeners();
        this.initComponents();
        this.initTooltips();
        this.initLazyLoading();
        this.checkAuthentication();
        console.log('PrintHub Marketplace Initialized');
    },

    // Language Management
    initLanguage() {
        const lang = this.state.currentLang;
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.body.classList.toggle('ar', lang === 'ar');
        this.loadTranslations(lang);
    },

    switchLanguage(lang) {
        this.state.currentLang = lang;
        localStorage.setItem('language', lang);
        this.initLanguage();
        this.updateUILanguage();
    },

    loadTranslations(lang) {
        // In production, this would load from a JSON file
        const translations = {
            en: {
                welcome: 'Welcome to PrintHub Egypt',
                search: 'Search for printing services...',
                getQuote: 'Get Quote',
                compareQuotes: 'Compare Quotes',
                signIn: 'Sign In',
                signUp: 'Sign Up',
                dashboard: 'Dashboard',
                services: 'Services',
                vendors: 'Vendors',
                about: 'About Us',
                contact: 'Contact',
                cart: 'Cart',
                logout: 'Logout'
            },
            ar: {
                welcome: 'مرحباً بك في مركز الطباعة مصر',
                search: 'ابحث عن خدمات الطباعة...',
                getQuote: 'احصل على عرض سعر',
                compareQuotes: 'قارن العروض',
                signIn: 'تسجيل الدخول',
                signUp: 'إنشاء حساب',
                dashboard: 'لوحة التحكم',
                services: 'الخدمات',
                vendors: 'الموردون',
                about: 'من نحن',
                contact: 'اتصل بنا',
                cart: 'السلة',
                logout: 'تسجيل الخروج'
            }
        };
        this.translations = translations[lang];
    },

    translate(key) {
        return this.translations[key] || key;
    },

    updateUILanguage() {
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            element.textContent = this.translate(key);
        });

        document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
            const key = element.getAttribute('data-translate-placeholder');
            element.placeholder = this.translate(key);
        });
    },

    // Event Listeners
    initEventListeners() {
        // Language Switcher
        document.querySelectorAll('.language-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                const lang = option.getAttribute('data-lang');
                this.switchLanguage(lang);
            });
        });

        // Mobile Menu Toggle
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const navbarMenu = document.querySelector('.navbar-menu');

        if (mobileMenuToggle && navbarMenu) {
            mobileMenuToggle.addEventListener('click', () => {
                navbarMenu.classList.toggle('active');
                mobileMenuToggle.classList.toggle('active');
            });
        }

        // Search Functionality
        const searchForm = document.querySelector('.search-form');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSearch();
            });
        }

        // Filter Change Events
        document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.applyFilters();
            });
        });

        // Tab Switching
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(tab);
            });
        });

        // Modal Triggers
        document.querySelectorAll('[data-modal]').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const modalId = trigger.getAttribute('data-modal');
                this.openModal(modalId);
            });
        });

        // Modal Close
        document.querySelectorAll('.modal-close, .modal-backdrop').forEach(closer => {
            closer.addEventListener('click', () => {
                this.closeModal();
            });
        });

        // Form Validation
        document.querySelectorAll('form[data-validate]').forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                }
            });
        });

        // File Upload
        document.querySelectorAll('.file-upload').forEach(uploader => {
            this.initFileUpload(uploader);
        });

        // Sidebar Toggle (Dashboard)
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');

        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }

        // Quote Selection
        document.querySelectorAll('.quote-select-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const quoteId = btn.getAttribute('data-quote-id');
                this.selectQuote(quoteId);
            });
        });

        // Service Card Clicks
        document.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const serviceId = card.getAttribute('data-service-id');
                    window.location.href = `/service-detail.html?id=${serviceId}`;
                }
            });
        });

        // Add to Cart
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const serviceId = btn.getAttribute('data-service-id');
                this.addToCart(serviceId);
            });
        });

        // Quantity Controls
        document.querySelectorAll('.quantity-control').forEach(control => {
            const decreaseBtn = control.querySelector('.quantity-decrease');
            const increaseBtn = control.querySelector('.quantity-increase');
            const input = control.querySelector('.quantity-input');

            if (decreaseBtn) {
                decreaseBtn.addEventListener('click', () => {
                    const currentValue = parseInt(input.value) || 1;
                    if (currentValue > 1) {
                        input.value = currentValue - 1;
                        this.updatePrice();
                    }
                });
            }

            if (increaseBtn) {
                increaseBtn.addEventListener('click', () => {
                    const currentValue = parseInt(input.value) || 1;
                    input.value = currentValue + 1;
                    this.updatePrice();
                });
            }
        });

        // Rating Stars
        document.querySelectorAll('.rating-input').forEach(rating => {
            const stars = rating.querySelectorAll('.star-input');
            stars.forEach((star, index) => {
                star.addEventListener('click', () => {
                    this.setRating(rating, index + 1);
                });
                star.addEventListener('mouseenter', () => {
                    this.previewRating(rating, index + 1);
                });
            });
            rating.addEventListener('mouseleave', () => {
                this.resetRatingPreview(rating);
            });
        });

        // Print Quote
        document.querySelectorAll('.print-quote').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.print();
            });
        });

        // Smooth Scroll
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    },

    // Component Initialization
    initComponents() {
        // Initialize tooltips
        this.initTooltips();

        // Initialize date pickers
        this.initDatePickers();

        // Initialize charts (if on dashboard)
        if (document.querySelector('.chart-container')) {
            this.initCharts();
        }

        // Initialize countdown timers
        this.initCountdowns();

        // Initialize image galleries
        this.initGalleries();
    },

    // Search Functionality
    handleSearch() {
        const searchInput = document.querySelector('.search-input');
        const searchQuery = searchInput.value.trim();

        if (searchQuery.length < 2) {
            this.showNotification('Please enter at least 2 characters', 'warning');
            return;
        }

        // Show loading state
        this.showLoader();

        // Simulate API call
        setTimeout(() => {
            window.location.href = `/services.html?search=${encodeURIComponent(searchQuery)}`;
        }, 500);
    },

    // Filter Management
    applyFilters() {
        const filters = {};

        // Collect all active filters
        document.querySelectorAll('.filter-checkbox:checked').forEach(checkbox => {
            const filterType = checkbox.getAttribute('data-filter-type');
            const filterValue = checkbox.value;

            if (!filters[filterType]) {
                filters[filterType] = [];
            }
            filters[filterType].push(filterValue);
        });

        // Price range
        const minPrice = document.querySelector('#min-price');
        const maxPrice = document.querySelector('#max-price');
        if (minPrice && maxPrice) {
            filters.priceRange = {
                min: minPrice.value || 0,
                max: maxPrice.value || 999999
            };
        }

        this.state.filters = filters;
        this.filterServices();
    },

    filterServices() {
        const services = document.querySelectorAll('.service-card');
        let visibleCount = 0;

        services.forEach(service => {
            let shouldShow = true;

            // Check category filter
            if (this.state.filters.category && this.state.filters.category.length > 0) {
                const serviceCategory = service.getAttribute('data-category');
                if (!this.state.filters.category.includes(serviceCategory)) {
                    shouldShow = false;
                }
            }

            // Check vendor filter
            if (this.state.filters.vendor && this.state.filters.vendor.length > 0) {
                const serviceVendor = service.getAttribute('data-vendor');
                if (!this.state.filters.vendor.includes(serviceVendor)) {
                    shouldShow = false;
                }
            }

            // Check price range
            if (this.state.filters.priceRange) {
                const servicePrice = parseFloat(service.getAttribute('data-price'));
                if (servicePrice < this.state.filters.priceRange.min ||
                    servicePrice > this.state.filters.priceRange.max) {
                    shouldShow = false;
                }
            }

            // Show/hide service
            if (shouldShow) {
                service.style.display = '';
                visibleCount++;
            } else {
                service.style.display = 'none';
            }
        });

        // Update results count
        const resultsCount = document.querySelector('.results-count');
        if (resultsCount) {
            resultsCount.textContent = `${visibleCount} services found`;
        }

        // Show no results message if needed
        const noResults = document.querySelector('.no-results');
        if (noResults) {
            noResults.style.display = visibleCount === 0 ? 'block' : 'none';
        }
    },

    // Tab Management
    switchTab(tab) {
        const tabGroup = tab.closest('.tabs');
        const targetId = tab.getAttribute('data-tab');

        // Update active tab
        tabGroup.querySelectorAll('.tab-item').forEach(t => {
            t.classList.remove('active');
        });
        tab.classList.add('active');

        // Update active panel
        tabGroup.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        const targetPanel = document.querySelector(`#${targetId}`);
        if (targetPanel) {
            targetPanel.classList.add('active');
        }
    },

    // Modal Management
    openModal(modalId) {
        const modal = document.querySelector(`#${modalId}`);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.state.currentModal = modal;
        }
    },

    closeModal() {
        if (this.state.currentModal) {
            this.state.currentModal.classList.remove('active');
            document.body.style.overflow = '';
            this.state.currentModal = null;
        }
    },

    // Form Validation
    validateForm(form) {
        let isValid = true;
        const errors = [];

        // Clear previous errors
        form.querySelectorAll('.form-error').forEach(error => {
            error.textContent = '';
        });
        form.querySelectorAll('.form-control').forEach(input => {
            input.classList.remove('error');
        });

        // Validate required fields
        form.querySelectorAll('[required]').forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('error');
                const errorElement = field.parentElement.querySelector('.form-error');
                if (errorElement) {
                    errorElement.textContent = 'This field is required';
                }
                errors.push(`${field.name || 'Field'} is required`);
            }
        });

        // Validate email fields
        form.querySelectorAll('[type="email"]').forEach(field => {
            if (field.value && !this.isValidEmail(field.value)) {
                isValid = false;
                field.classList.add('error');
                const errorElement = field.parentElement.querySelector('.form-error');
                if (errorElement) {
                    errorElement.textContent = 'Please enter a valid email address';
                }
                errors.push('Invalid email address');
            }
        });

        // Validate phone fields
        form.querySelectorAll('[type="tel"]').forEach(field => {
            if (field.value && !this.isValidPhone(field.value)) {
                isValid = false;
                field.classList.add('error');
                const errorElement = field.parentElement.querySelector('.form-error');
                if (errorElement) {
                    errorElement.textContent = 'Please enter a valid phone number';
                }
                errors.push('Invalid phone number');
            }
        });

        // Validate password match
        const password = form.querySelector('[name="password"]');
        const confirmPassword = form.querySelector('[name="confirm_password"]');
        if (password && confirmPassword && password.value !== confirmPassword.value) {
            isValid = false;
            confirmPassword.classList.add('error');
            const errorElement = confirmPassword.parentElement.querySelector('.form-error');
            if (errorElement) {
                errorElement.textContent = 'Passwords do not match';
            }
            errors.push('Passwords do not match');
        }

        // Show notification if form is invalid
        if (!isValid && errors.length > 0) {
            this.showNotification('Please fix the following errors:\n' + errors.join('\n'), 'error');
        }

        return isValid;
    },

    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    isValidPhone(phone) {
        const re = /^[\d\s\-\+\(\)]+$/;
        return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
    },

    // File Upload Management
    initFileUpload(uploader) {
        const input = uploader.querySelector('.file-upload-input');
        const fileList = uploader.querySelector('.file-list');

        // Click to upload
        uploader.addEventListener('click', (e) => {
            if (e.target === uploader || e.target.classList.contains('file-upload-icon')) {
                input.click();
            }
        });

        // File selection
        input.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files, fileList);
        });

        // Drag and drop
        uploader.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploader.classList.add('dragging');
        });

        uploader.addEventListener('dragleave', () => {
            uploader.classList.remove('dragging');
        });

        uploader.addEventListener('drop', (e) => {
            e.preventDefault();
            uploader.classList.remove('dragging');
            this.handleFileSelect(e.dataTransfer.files, fileList);
        });
    },

    handleFileSelect(files, fileList) {
        Array.from(files).forEach(file => {
            // Validate file
            if (!this.validateFile(file)) {
                return;
            }

            // Add to list
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span class="file-name">${file.name}</span>
                <span class="file-size">${this.formatFileSize(file.size)}</span>
                <button class="file-remove" data-file="${file.name}">×</button>
            `;

            fileList.appendChild(fileItem);

            // Remove file handler
            fileItem.querySelector('.file-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                fileItem.remove();
            });
        });
    },

    validateFile(file) {
        // Check file size
        if (file.size > this.config.uploadMaxSize) {
            this.showNotification(`File ${file.name} is too large. Maximum size is 50MB.`, 'error');
            return false;
        }

        // Check file type
        const extension = file.name.split('.').pop().toLowerCase();
        if (!this.config.allowedFileTypes.includes(extension)) {
            this.showNotification(`File type .${extension} is not allowed.`, 'error');
            return false;
        }

        return true;
    },

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },

    // Cart Management
    addToCart(serviceId) {
        // Get service details (in production, this would be from API)
        const service = {
            id: serviceId,
            name: 'Business Cards',
            price: 250,
            quantity: 1,
            vendor: 'PrintPro Egypt'
        };

        // Add to cart
        this.state.cart.push(service);
        this.updateCartUI();
        this.showNotification('Added to cart successfully!', 'success');
    },

    updateCartUI() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = this.state.cart.length;
        }
    },

    // Quote Management
    selectQuote(quoteId) {
        // Show confirmation modal
        if (confirm('Are you sure you want to select this quote?')) {
            this.showLoader();
            // Simulate API call
            setTimeout(() => {
                this.hideLoader();
                this.showNotification('Quote selected successfully! Redirecting to checkout...', 'success');
                setTimeout(() => {
                    window.location.href = `/checkout.html?quote=${quoteId}`;
                }, 2000);
            }, 1000);
        }
    },

    // Rating System
    setRating(ratingElement, value) {
        ratingElement.setAttribute('data-rating', value);
        this.updateRatingDisplay(ratingElement, value);
    },

    previewRating(ratingElement, value) {
        this.updateRatingDisplay(ratingElement, value);
    },

    resetRatingPreview(ratingElement) {
        const currentRating = parseInt(ratingElement.getAttribute('data-rating')) || 0;
        this.updateRatingDisplay(ratingElement, currentRating);
    },

    updateRatingDisplay(ratingElement, value) {
        const stars = ratingElement.querySelectorAll('.star-input');
        stars.forEach((star, index) => {
            star.classList.toggle('filled', index < value);
        });
    },

    // Price Calculation
    updatePrice() {
        const quantity = parseInt(document.querySelector('.quantity-input')?.value) || 1;
        const basePrice = parseFloat(document.querySelector('.base-price')?.getAttribute('data-price')) || 0;
        const totalPrice = quantity * basePrice;

        const totalElement = document.querySelector('.total-price');
        if (totalElement) {
            totalElement.textContent = this.formatCurrency(totalPrice);
        }
    },

    formatCurrency(amount) {
        return new Intl.NumberFormat(this.state.currentLang === 'ar' ? 'ar-EG' : 'en-EG', {
            style: 'currency',
            currency: 'EGP'
        }).format(amount);
    },

    // Authentication
    checkAuthentication() {
        // Check if user is logged in (in production, this would check session/token)
        const userToken = localStorage.getItem('userToken');
        if (userToken) {
            this.state.user = {
                id: 1,
                name: 'Ahmed Hassan',
                email: 'ahmed@example.com',
                role: 'customer'
            };
            this.updateAuthUI();
        }
    },

    updateAuthUI() {
        const authLinks = document.querySelector('.auth-links');
        const userMenu = document.querySelector('.user-menu');

        if (this.state.user) {
            if (authLinks) authLinks.style.display = 'none';
            if (userMenu) userMenu.style.display = 'flex';
        } else {
            if (authLinks) authLinks.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
        }
    },

    login(email, password) {
        // Simulate login API call
        this.showLoader();
        setTimeout(() => {
            this.hideLoader();
            localStorage.setItem('userToken', 'fake-token-123');
            this.checkAuthentication();
            this.showNotification('Login successful!', 'success');
            window.location.href = '/dashboard.html';
        }, 1000);
    },

    logout() {
        localStorage.removeItem('userToken');
        this.state.user = null;
        this.updateAuthUI();
        this.showNotification('Logged out successfully', 'info');
        window.location.href = '/';
    },

    // Tooltips
    initTooltips() {
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = element.getAttribute('data-tooltip');

            element.addEventListener('mouseenter', () => {
                document.body.appendChild(tooltip);
                const rect = element.getBoundingClientRect();
                tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
                tooltip.style.left = rect.left + (rect.width - tooltip.offsetWidth) / 2 + 'px';
                tooltip.classList.add('visible');
            });

            element.addEventListener('mouseleave', () => {
                tooltip.classList.remove('visible');
                setTimeout(() => tooltip.remove(), 300);
            });
        });
    },

    // Date Pickers
    initDatePickers() {
        document.querySelectorAll('.date-picker').forEach(input => {
            // In production, use a proper date picker library
            input.type = 'date';
            input.min = new Date().toISOString().split('T')[0];
        });
    },

    // Charts (for dashboard)
    initCharts() {
        // This would use Chart.js or similar library in production
        console.log('Charts initialized');
    },

    // Countdown Timers
    initCountdowns() {
        document.querySelectorAll('.countdown').forEach(countdown => {
            const endTime = new Date(countdown.getAttribute('data-end')).getTime();

            const updateCountdown = () => {
                const now = new Date().getTime();
                const distance = endTime - now;

                if (distance < 0) {
                    countdown.textContent = 'Expired';
                    return;
                }

                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

                countdown.textContent = `${days}d ${hours}h ${minutes}m`;
            };

            updateCountdown();
            setInterval(updateCountdown, 60000);
        });
    },

    // Image Galleries
    initGalleries() {
        document.querySelectorAll('.gallery-thumb').forEach(thumb => {
            thumb.addEventListener('click', () => {
                const mainImage = document.querySelector('.gallery-main');
                if (mainImage) {
                    mainImage.src = thumb.getAttribute('data-full');
                }
            });
        });
    },

    // Lazy Loading
    initLazyLoading() {
        const lazyImages = document.querySelectorAll('img[data-src]');

        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.getAttribute('data-src');
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                });
            });

            lazyImages.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for older browsers
            lazyImages.forEach(img => {
                img.src = img.getAttribute('data-src');
                img.removeAttribute('data-src');
            });
        }
    },

    // Notifications
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto hide after 5 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 5000);

        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    },

    // Loader
    showLoader() {
        const loader = document.createElement('div');
        loader.className = 'loader-overlay';
        loader.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(loader);
    },

    hideLoader() {
        const loader = document.querySelector('.loader-overlay');
        if (loader) {
            loader.remove();
        }
    },

    // Utility Functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    },

    setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;
        document.cookie = `${name}=${value};${expires};path=/`;
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    PrintHub.init();
});

// Export for use in other modules
window.PrintHub = PrintHub;
