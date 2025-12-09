// Product detail page functionality
class ProductPage {
    constructor() {
        this.product = null;
        this.productNumber = null;
        this.init();
    }

    init() {
        this.loadProductFromURL();
        this.setupEventListeners();
    }

    loadProductFromURL() {
        // Get product number from URL parameter
        const params = new URLSearchParams(window.location.search);
        this.productNumber = params.get('product');
        this.imageIndex = parseInt(params.get('image')) || 0;

        if (!this.productNumber) {
            window.location.href = '/shop';
            return;
        }

        this.displayProduct();
    }

    getStockPhotos(productNumber) {
        if (productNumber === '1') {
            return [
                '/images/tricouri/deadinsideblack1.png',
                '/images/tricouri/deadinsideblack2.png',
                '/images/tricouri/deadinsideblack3.png',
            ];
        } else if (productNumber === '2') {
            return [
                '/images/tricouri/deadinsidewhite1.png',
                '/images/tricouri/deadinsidewhite2.png',
                '/images/tricouri/deadinsidewhite3.png',
            ];
        } else if (productNumber === '3') {
            return [
                '/images/tricouri/strangehearts1.png',
                '/images/tricouri/strangehearts2.png',
                '/images/tricouri/strangehearts3.png',
            ];
        } else {
            return [
                '/images/1.jpeg',
                '/images/2.jpeg',
                '/images/3.jpeg',
            ];
        }
    }

    displayProduct() {
        const stockPhotos = this.getStockPhotos(this.productNumber);
        const imageUrl = stockPhotos[0];
        
        // Custom product names for first 3 products
        let productTitle = `FREAK TSHIRT#${this.productNumber}`;
        if (this.productNumber === '1') {
            productTitle = 'DEAD INSIDE black edition';
        } else if (this.productNumber === '2') {
            productTitle = 'DEAD INSIDE white edition';
        } else if (this.productNumber === '3') {
            productTitle = 'STRANGE HEARTS';
        }

        document.getElementById('detailImage').src = imageUrl;
        document.getElementById('detailTitle').textContent = productTitle;
        document.getElementById('detailPrice').textContent = '150 RON';

        // Generate thumbnail gallery
        this.renderThumbnails(stockPhotos);
    }

    renderThumbnails(stockPhotos) {
        const container = document.getElementById('thumbnailsContainer');
        if (!container) return;

        container.innerHTML = '';
        stockPhotos.forEach((photo, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.src = photo;
            thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
            thumbnail.alt = `Product image ${index + 1}`;
            
            thumbnail.addEventListener('click', () => {
                this.selectThumbnail(index, stockPhotos);
            });

            container.appendChild(thumbnail);
        });
    }

    selectThumbnail(index, stockPhotos) {
        // Update main image
        document.getElementById('detailImage').src = stockPhotos[index];

        // Update active thumbnail
        const thumbnails = document.querySelectorAll('.thumbnail');
        thumbnails.forEach((thumb, i) => {
            if (i === index) {
                thumb.classList.add('active');
            } else {
                thumb.classList.remove('active');
            }
        });
    }

    setupEventListeners() {
        // No event listeners needed as buttons are now links
    }
}

// Initialize product page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on product page
    if (window.location.pathname.includes('/product')) {
        window.productPage = new ProductPage();
    }
});
