// Admin panel functionality
class AdminPanel {
    constructor() {
        this.apiUrl = window.location.origin + '/api';
        this.token = localStorage.getItem('adminToken');
        this.currentTab = 'products';
        this.products = [];
        this.drops = [];
        this.orders = [];
        this.subscribers = [];
        this.init();
    }

    init() {
        if (this.token) {
            this.verifyToken();
        } else {
            this.showLogin();
        }
    }

    showLogin() {
        const loginOverlay = document.getElementById('loginOverlay');
        const loginForm = document.getElementById('loginForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = loginForm.querySelector('input[type="email"]').value;
                const password = loginForm.querySelector('input[type="password"]').value;
                
                await this.login(email, password);
            });
        }
    }

    async login(email, password) {
        try {
            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                localStorage.setItem('adminToken', this.token);
                this.hideLogin();
                this.setupDashboard();
            } else {
                alert(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Network error. Please try again.');
        }
    }

    hideLogin() {
        const loginOverlay = document.getElementById('loginOverlay');
        if (loginOverlay) {
            loginOverlay.style.display = 'none';
        }
    }

    async verifyToken() {
        try {
            const response = await fetch(`${this.apiUrl}/admin/products`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                },
            });

            if (response.ok) {
                this.hideLogin();
                this.setupDashboard();
            } else {
                localStorage.removeItem('adminToken');
                this.showLogin();
            }
        } catch (error) {
            console.error('Token verification error:', error);
            localStorage.removeItem('adminToken');
            this.showLogin();
        }
    }

    setupDashboard() {
        const dashboard = document.getElementById('adminDashboard');
        if (dashboard) {
            dashboard.style.display = 'block';
        }

        this.setupNavigation();
        this.setupLogout();
        this.setupModals();
        this.loadData();
    }

    setupNavigation() {
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update active content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');

        this.currentTab = tabName;
        this.renderCurrentTab();
    }

    setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('adminToken');
                location.reload();
            });
        }
    }

    setupModals() {
        // Product modal
        const addProductBtn = document.getElementById('addProductBtn');
        const productModal = document.getElementById('productModal');
        const closeProductModal = document.getElementById('closeProductModal');
        const productForm = document.getElementById('productForm');

        if (addProductBtn && productModal) {
            addProductBtn.addEventListener('click', () => {
                this.showModal('productModal');
            });
        }

        if (closeProductModal) {
            closeProductModal.addEventListener('click', () => {
                this.hideModal('productModal');
            });
        }

        if (productForm) {
            productForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.createProduct(productForm);
            });
        }

        // Drop modal
        const addDropBtn = document.getElementById('addDropBtn');
        const dropModal = document.getElementById('dropModal');
        const closeDropModal = document.getElementById('closeDropModal');
        const dropForm = document.getElementById('dropForm');

        if (addDropBtn && dropModal) {
            addDropBtn.addEventListener('click', () => {
                this.showModal('dropModal');
            });
        }

        if (closeDropModal) {
            closeDropModal.addEventListener('click', () => {
                this.hideModal('dropModal');
            });
        }

        if (dropForm) {
            dropForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.createDrop(dropForm);
            });
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            // Reset form
            const form = modal.querySelector('form');
            if (form) form.reset();
        }
    }

    async loadData() {
        try {
            await Promise.all([
                this.loadProducts(),
                this.loadDrops(),
                this.loadOrders(),
                this.loadSubscribers()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    async loadProducts() {
        try {
            const response = await fetch(`${this.apiUrl}/admin/products`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                },
            });

            if (response.ok) {
                this.products = await response.json();
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    async loadDrops() {
        try {
            const response = await fetch(`${this.apiUrl}/admin/drops`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                },
            });

            if (response.ok) {
                this.drops = await response.json();
            }
        } catch (error) {
            console.error('Error loading drops:', error);
        }
    }

    async loadOrders() {
        // Implement orders loading
        this.orders = [];
    }

    async loadSubscribers() {
        // Implement subscribers loading
        this.subscribers = [];
    }

    renderCurrentTab() {
        switch (this.currentTab) {
            case 'products':
                this.renderProducts();
                break;
            case 'drops':
                this.renderDrops();
                break;
            case 'orders':
                this.renderOrders();
                break;
            case 'subscribers':
                this.renderSubscribers();
                break;
        }
    }

    renderProducts() {
        const container = document.getElementById('productsTable');
        if (!container) return;

        if (this.products.length === 0) {
            container.innerHTML = '<p>No products found</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'admin-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Created</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${this.products.map(product => `
                    <tr>
                        <td>${product.id}</td>
                        <td>${product.title}</td>
                        <td>${product.category}</td>
                        <td>${new Date(product.created_at).toLocaleDateString()}</td>
                        <td>
                            <button class="btn-small" onclick="admin.editProduct(${product.id})">Edit</button>
                            <button class="btn-small btn-danger" onclick="admin.deleteProduct(${product.id})">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;

        container.innerHTML = '';
        container.appendChild(table);
    }

    renderDrops() {
        const container = document.getElementById('dropsTable');
        if (!container) return;

        if (this.drops.length === 0) {
            container.innerHTML = '<p>No drops found</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'admin-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${this.drops.map(drop => `
                    <tr>
                        <td>${drop.id}</td>
                        <td>${drop.title}</td>
                        <td>${drop.is_active ? 'Active' : 'Inactive'}</td>
                        <td>${new Date(drop.start_at).toLocaleDateString()}</td>
                        <td>${new Date(drop.end_at).toLocaleDateString()}</td>
                        <td>
                            <button class="btn-small" onclick="admin.editDrop(${drop.id})">Edit</button>
                            <button class="btn-small btn-danger" onclick="admin.deleteDrop(${drop.id})">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;

        container.innerHTML = '';
        container.appendChild(table);
    }

    renderOrders() {
        const container = document.getElementById('ordersTable');
        if (!container) return;

        container.innerHTML = '<p>Orders feature coming soon</p>';
    }

    renderSubscribers() {
        const container = document.getElementById('subscribersTable');
        if (!container) return;

        container.innerHTML = '<p>Subscribers feature coming soon</p>';
    }

    async createProduct(form) {
        const formData = new FormData(form);
        const data = {
            title: formData.get('title') || form.querySelector('input').value,
            description: formData.get('description') || form.querySelector('textarea').value,
            images: formData.get('images') ? formData.get('images').split(',').map(url => url.trim()) : [],
            category: formData.get('category') || form.querySelector('select').value
        };

        try {
            const response = await fetch(`${this.apiUrl}/admin/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`,
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                this.hideModal('productModal');
                await this.loadProducts();
                this.renderProducts();
                alert('Product created successfully');
            } else {
                alert('Failed to create product');
            }
        } catch (error) {
            console.error('Error creating product:', error);
            alert('Network error. Please try again.');
        }
    }

    async createDrop(form) {
        const formData = new FormData(form);
        const data = {
            title: formData.get('title') || form.querySelectorAll('input')[0].value,
            description: formData.get('description') || form.querySelector('textarea').value,
            startAt: formData.get('startAt') || form.querySelectorAll('input')[1].value,
            endAt: formData.get('endAt') || form.querySelectorAll('input')[2].value,
            key: formData.get('key') || form.querySelectorAll('input')[3].value
        };

        try {
            const response = await fetch(`${this.apiUrl}/admin/drops`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`,
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                this.hideModal('dropModal');
                await this.loadDrops();
                this.renderDrops();
                alert('Drop created successfully');
            } else {
                alert('Failed to create drop');
            }
        } catch (error) {
            console.error('Error creating drop:', error);
            alert('Network error. Please try again.');
        }
    }

    editProduct(id) {
        alert('Edit product feature coming soon');
    }

    deleteProduct(id) {
        if (confirm('Are you sure you want to delete this product?')) {
            alert('Delete product feature coming soon');
        }
    }

    editDrop(id) {
        alert('Edit drop feature coming soon');
    }

    deleteDrop(id) {
        if (confirm('Are you sure you want to delete this drop?')) {
            alert('Delete drop feature coming soon');
        }
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on admin page
    if (window.location.pathname.includes('/admin')) {
        window.admin = new AdminPanel();
    }
});

// Add admin table styles
const adminStyles = document.createElement('style');
adminStyles.textContent = `
    .admin-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
    }

    .admin-table th,
    .admin-table td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #333;
    }

    .admin-table th {
        background: #111;
        font-weight: 600;
        color: #fff;
    }

    .admin-table tr:hover {
        background: #111;
    }

    .btn-small {
        padding: 6px 12px;
        background: #fff;
        color: #000;
        border: none;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        border-radius: 4px;
        margin-right: 5px;
        transition: all 0.3s ease;
    }

    .btn-small:hover {
        background: #ccc;
    }

    .btn-danger {
        background: #f44336;
        color: #fff;
    }

    .btn-danger:hover {
        background: #d32f2f;
    }
`;
document.head.appendChild(adminStyles);