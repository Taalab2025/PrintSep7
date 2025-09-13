/* ========================================
   Reusable UI Components
   ======================================== */

// Breadcrumb Component
const Breadcrumb = {
    // Generate breadcrumb HTML
    generate(items) {
        if (!items || items.length === 0) return '';
        
        const breadcrumbHTML = `
            <div class="breadcrumb">
                <div class="container">
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb-nav">
                            ${items.map((item, index) => `
                                <li class="breadcrumb-item ${index === items.length - 1 ? 'active' : ''}">
                                    ${index === items.length - 1 
                                        ? `<span>${item.text}</span>`
                                        : `<a href="${item.url}">${item.text}</a>`
                                    }
                                </li>
                            `).join('')}
                        </ol>
                    </nav>
                </div>
            </div>
        `;
        
        return breadcrumbHTML;
    },

    // Insert breadcrumb into page
    insert(items, targetSelector = '.page-header') {
        const target = document.querySelector(targetSelector);
        if (target) {
            target.insertAdjacentHTML('afterbegin', this.generate(items));
        }
    },

    // Auto-generate breadcrumb based on URL
    autoGenerate() {
        const path = window.location.pathname;
        const segments = path.split('/').filter(segment => segment);
        
        const items = [{ text: 'Home', url: '/' }];
        
        let currentPath = '';
        segments.forEach((segment, index) => {
            currentPath += '/' + segment;
            
            // Convert segment to readable text
            let text = segment.replace(/[-_]/g, ' ')
                             .replace(/\.html$/, '')
                             .split(' ')
                             .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                             .join(' ');
            
            // Special cases for common pages
            const pageNames = {
                'admin': 'Admin Dashboard',
                'customer': 'Customer Dashboard',
                'vendor': 'Vendor Dashboard',
                'quote-request': 'Request Quote',
                'quote-comparison': 'Compare Quotes',
                'service-detail': 'Service Details',
                'vendor-profile': 'Vendor Profile'
            };
            
            if (pageNames[segment]) {
                text = pageNames[segment];
            }
            
            items.push({
                text: text,
                url: index === segments.length - 1 ? null : currentPath + '.html'
            });
        });
        
        return items;
    }
};

// Modal Component
const Modal = {
    // Current open modal
    currentModal: null,

    // Open modal
    open(modalId, options = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        this.currentModal = modal;
        modal.classList.add('show');
        document.body.classList.add('modal-open');

        // Focus management
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.close(modalId);
            }
        });

        // Close on escape key
        document.addEventListener('keydown', this.handleEscape.bind(this));
    },

    // Close modal
    close(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
        this.currentModal = null;

        document.removeEventListener('keydown', this.handleEscape.bind(this));
    },

    // Handle escape key
    handleEscape(e) {
        if (e.key === 'Escape' && this.currentModal) {
            this.close(this.currentModal.id);
        }
    }
};

// Toast Notifications
const Toast = {
    // Show toast notification
    show(message, type = 'info', duration = 5000) {
        const toast = this.create(message, type);
        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto remove
        setTimeout(() => {
            this.remove(toast);
        }, duration);

        return toast;
    },

    // Create toast element
    create(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = this.getIcon(type);
        
        toast.innerHTML = `
            <div class="toast-content">
                <i class="${icon}"></i>
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="Toast.remove(this.closest('.toast'))">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        return toast;
    },

    // Get icon for toast type
    getIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    },

    // Remove toast
    remove(toast) {
        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
};

// Loading Spinner
const Loading = {
    // Show loading spinner
    show(target = 'body', message = 'Loading...') {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;

        const loading = document.createElement('div');
        loading.className = 'loading-overlay';
        loading.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-message">${message}</div>
            </div>
        `;

        element.style.position = 'relative';
        element.appendChild(loading);

        return loading;
    },

    // Hide loading spinner
    hide(target = 'body') {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;

        const loading = element.querySelector('.loading-overlay');
        if (loading) {
            loading.remove();
        }
    }
};

// Form Validation
const FormValidator = {
    // Validate form
    validate(form) {
        const errors = [];
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');

        inputs.forEach(input => {
            const error = this.validateField(input);
            if (error) {
                errors.push(error);
                this.showFieldError(input, error);
            } else {
                this.clearFieldError(input);
            }
        });

        return errors;
    },

    // Validate individual field
    validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        const name = field.name;

        // Required field check
        if (field.hasAttribute('required') && !value) {
            return `${this.getFieldLabel(field)} is required`;
        }

        if (!value) return null; // Skip other validations if field is empty and not required

        return this.validateFieldType(field, value, type, name);
    },

    // Validate field by type
    validateFieldType(field, value, type, name) {
        // Email validation
        if (type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return 'Please enter a valid email address';
            }
        }

        // Phone validation
        if (type === 'tel') {
            const phoneRegex = /^[\d\s\-+()]+$/;
            if (!phoneRegex.test(value)) {
                return 'Please enter a valid phone number';
            }
        }

        // Password validation
        if (type === 'password') {
            if (value.length < 8) {
                return 'Password must be at least 8 characters long';
            }
        }

        // Confirm password validation
        if (name === 'confirm_password') {
            const password = field.form.querySelector('input[name="password"]');
            if (password && value !== password.value) {
                return 'Passwords do not match';
            }
        }

        return null;
    },

    // Get field label
    getFieldLabel(field) {
        const label = field.form.querySelector(`label[for="${field.id}"]`);
        if (label) {
            return label.textContent.replace('*', '').trim();
        }
        return field.placeholder || field.name;
    },

    // Show field error
    showFieldError(field, error) {
        this.clearFieldError(field);
        
        field.classList.add('error');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = error;
        
        field.parentNode.appendChild(errorElement);
    },

    // Clear field error
    clearFieldError(field) {
        field.classList.remove('error');
        
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }
};

// Data Table Component
const DataTable = {
    // Initialize data table
    init(tableSelector, options = {}) {
        const table = document.querySelector(tableSelector);
        if (!table) return;

        const config = {
            sortable: true,
            searchable: true,
            pagination: true,
            pageSize: 10,
            ...options
        };

        this.setupTable(table, config);
    },

    // Setup table functionality
    setupTable(table, config) {
        if (config.searchable) {
            this.addSearch(table);
        }

        if (config.sortable) {
            this.addSorting(table);
        }

        if (config.pagination) {
            this.addPagination(table, config.pageSize);
        }
    },

    // Add search functionality
    addSearch(table) {
        const searchInput = document.createElement('input');
        searchInput.type = 'search';
        searchInput.placeholder = 'Search...';
        searchInput.className = 'table-search';

        searchInput.addEventListener('input', (e) => {
            this.filterTable(table, e.target.value);
        });

        table.parentNode.insertBefore(searchInput, table);
    },

    // Filter table rows
    filterTable(table, searchTerm) {
        const rows = table.querySelectorAll('tbody tr');
        const term = searchTerm.toLowerCase();

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    },

    // Add sorting functionality
    addSorting(table) {
        const headers = table.querySelectorAll('th');
        
        headers.forEach((header, index) => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                this.sortTable(table, index);
            });
        });
    },

    // Sort table by column
    sortTable(table, columnIndex) {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        const isAscending = !table.dataset.sortOrder || table.dataset.sortOrder === 'desc';
        
        rows.sort((a, b) => {
            const aVal = a.cells[columnIndex].textContent.trim();
            const bVal = b.cells[columnIndex].textContent.trim();
            
            if (isAscending) {
                return aVal.localeCompare(bVal, undefined, { numeric: true });
            } else {
                return bVal.localeCompare(aVal, undefined, { numeric: true });
            }
        });

        // Clear tbody and append sorted rows
        tbody.innerHTML = '';
        rows.forEach(row => tbody.appendChild(row));
        
        table.dataset.sortOrder = isAscending ? 'asc' : 'desc';
    },

    // Add pagination
    addPagination(table, pageSize) {
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        const totalPages = Math.ceil(rows.length / pageSize);
        
        if (totalPages <= 1) return;

        const pagination = document.createElement('div');
        pagination.className = 'table-pagination';
        
        this.updatePagination(pagination, 1, totalPages, (page) => {
            this.showPage(table, page, pageSize);
        });

        table.parentNode.appendChild(pagination);
        this.showPage(table, 1, pageSize);
    },

    // Show specific page
    showPage(table, page, pageSize) {
        const rows = table.querySelectorAll('tbody tr');
        const start = (page - 1) * pageSize;
        const end = start + pageSize;

        rows.forEach((row, index) => {
            row.style.display = (index >= start && index < end) ? '' : 'none';
        });
    },

    // Update pagination controls
    updatePagination(container, currentPage, totalPages, onPageClick) {
        container.innerHTML = '';

        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.textContent = 'Previous';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                onPageClick(currentPage - 1);
                this.updatePagination(container, currentPage - 1, totalPages, onPageClick);
            }
        });
        container.appendChild(prevBtn);

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.classList.toggle('active', i === currentPage);
            pageBtn.addEventListener('click', () => {
                onPageClick(i);
                this.updatePagination(container, i, totalPages, onPageClick);
            });
            container.appendChild(pageBtn);
        }

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                onPageClick(currentPage + 1);
                this.updatePagination(container, currentPage + 1, totalPages, onPageClick);
            }
        });
        container.appendChild(nextBtn);
    }
};

// Export components for use in other modules
window.Components = {
    Breadcrumb,
    Modal,
    Toast,
    Loading,
    FormValidator,
    DataTable
};