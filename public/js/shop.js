// Shop page functionality
class ShopPage {
    constructor() {
        this.apiUrl = window.location.origin + '/api';
        this.products = [];
        this.filteredProducts = [];
        this.filters = {
            category: '',
            size: '',
            price: ''
        };
        this.init();
    }

    init() {
        this.setupFilters();
        this.loadShopProducts();
    }

    setupFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        const sizeFilter = document.getElementById('sizeFilter');
        const priceFilter = document.getElementById('priceFilter');

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.applyFilters();
            });
        }

        if (sizeFilter) {
            sizeFilter.addEventListener('change', (e) => {
                this.filters.size = e.target.value;
                this.applyFilters();
            });
        }

        if (priceFilter) {
            priceFilter.addEventListener('change', (e) => {
                this.filters.price = e.target.value;
                this.applyFilters();
            });
        }
    }

    async loadShopProducts() {
        try {
            const response = await fetch(`${this.apiUrl}/shop`);
            
            if (response.ok) {
                this.products = await response.json();
                this.filteredProducts = [...this.products];
                this.renderProducts();
            } else {
                console.error('Failed to load shop products');
                this.showErrorMessage();
            }
        } catch (error) {
            console.error('Error loading shop products:', error);
            this.showErrorMessage();
        }
    }

    applyFilters() {
        this.filteredProducts = this.products.filter(product => {
            // Category filter
            if (this.filters.category && product.category !== this.filters.category) {
                return false;
            }

            // Size filter
            if (this.filters.size) {
                const hasSize = product.variants.some(variant => variant.size === this.filters.size);
                if (!hasSize) {
                    return false;
                }
            }

            // Price filter
            if (this.filters.price) {
                const minPrice = Math.min(...product.variants.map(v => v.price));
                const priceRange = this.filters.price;
                
                if (priceRange === '0-50' && minPrice > 5000) return false;
                if (priceRange === '50-100' && (minPrice < 5000 || minPrice > 10000)) return false;
                if (priceRange === '100+' && minPrice < 10000) return false;
            }

            return true;
        });

        this.renderProducts();
    }

    renderProducts() {
        const productsContainer = document.getElementById('shopProducts');
        
        if (!productsContainer) return;

        if (this.filteredProducts.length === 0) {
            productsContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <h3 style="font-size: 24px; margin-bottom: 20px;">NO PRODUCTS FOUND</h3>
                    <p style="opacity: 0.8;">Try adjusting your filters</p>
                </div>
            `;
            return;
        }

        productsContainer.innerHTML = '';

        this.filteredProducts.forEach((product, index) => {
            const productCard = this.createProductCard(product, index + 1);
            productsContainer.appendChild(productCard);
        });
    }

    createProductCard(product, productNumber) {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        const selectedVariants = {};

        // Find available sizes based on current filter
        let availableVariants = product.variants;
        if (this.filters.size) {
            availableVariants = product.variants.filter(v => v.size === this.filters.size);
        }

        // Sort variants by size order: S, M, L, XL
        const sizeOrder = ['S', 'M', 'L', 'XL', 'ONE SIZE'];
        availableVariants.sort((a, b) => {
            return sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size);
        });

        // Generate unique stock photo based on product number and type
        let stockPhotos = [];
        let productTitle = `FREAK TSHIRT#${productNumber}`;
        
        if (productNumber === 1) {
            productTitle = 'DEAD INSIDE black edition';
            stockPhotos = [
                '/images/tricouri/deadinsideblack1.png',
                '/images/tricouri/deadinsideblack2.png',
                '/images/tricouri/deadinsideblack3.png',
                '/images/tricouri/marimi.jpeg',
            ];
        } else if (productNumber === 2) {
            productTitle = 'DEAD INSIDE white edition';
            stockPhotos = [
                '/images/tricouri/deadinsidewhite1.png',
                '/images/tricouri/deadinsidewhite2.png',
                '/images/tricouri/deadinsidewhite3.png',
                '/images/tricouri/marimi.jpeg',
            ];
        } else if (productNumber === 3) {
            productTitle = 'STRANGE HEARTS';
            stockPhotos = [
                '/images/tricouri/strangehearts1.png',
                '/images/tricouri/strangehearts2.png',
                '/images/tricouri/strangehearts3.png',
                '/images/tricouri/marimi.jpeg',
            ];
        } else {
            // Default stock photos for other products
            stockPhotos = [
                '/images/1.jpeg',
                '/images/2.jpeg',
                '/images/3.jpeg',
            ];
        }
        
        const imageIndex = 0;
        const stockPhotoUrl = stockPhotos[imageIndex];

        card.innerHTML = `
            <img src="${stockPhotoUrl}" alt="${productTitle}" class="product-image" style="cursor: pointer;">
            <div class="product-info">
                <h3 class="product-title" style="cursor: pointer;">${productTitle}</h3>
                <p class="product-price" style="cursor: pointer;">150 RON</p>
                <button class="buy-btn" ${availableVariants.length > 0 ? '' : 'disabled'}>
                    ${availableVariants.length === 0 ? 'OUT OF STOCK' : 'MORE DETAILS'}
                </button>
            </div>
        `;

        // Add event listeners
        const buyBtn = card.querySelector('.buy-btn');
        const productImage = card.querySelector('.product-image');
        const productTitleEl = card.querySelector('.product-title');
        const productPriceEl = card.querySelector('.product-price');

        // Handler for navigation
        const navigateToProduct = () => {
            if (availableVariants.length > 0) {
                window.location.href = `/product.html?product=${productNumber}&image=${imageIndex}`;
            }
        };

        // Add click listeners to image, title, price, and button
        productImage.addEventListener('click', navigateToProduct);
        productTitleEl.addEventListener('click', navigateToProduct);
        productPriceEl.addEventListener('click', navigateToProduct);
        buyBtn.addEventListener('click', navigateToProduct);

        return card;
    }

    async handleBuyNow(product, variant, productNumber, imageIndex) {
        // Redirect to product detail page with product number and image index
        window.location.href = `/product.html?product=${productNumber}&image=${imageIndex}`;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(price / 100);
    }

    showErrorMessage() {
        const productsContainer = document.getElementById('shopProducts');
        
        if (productsContainer) {
            productsContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <h3 style="font-size: 24px; margin-bottom: 20px;">FAILED TO LOAD PRODUCTS</h3>
                    <p style="opacity: 0.8;">Please try refreshing the page</p>
                </div>
            `;
        }
    }
}

// Initialize shop page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on shop page
    if (window.location.pathname.includes('/shop')) {
        window.shopPage = new ShopPage();
    }
});