// Drop page functionality
class DropPage {
    constructor() {
        this.apiUrl = window.location.origin + '/api';
        this.currentDrop = null;
        this.isUnlocked = false;
        this.countdownInterval = null;
        this.init();
    }

    init() {
        this.setupKeyModal();
        this.loadActiveDrop();
    }

    setupKeyModal() {
        const keyModal = document.getElementById('keyModal');
        const keyForm = document.getElementById('keyForm');
        const closeModal = document.getElementById('closeModal');

        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.hideKeyModal();
            });
        }

        if (keyForm) {
            keyForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const keyInput = keyForm.querySelector('.key-input');
                const key = keyInput.value.trim();
                
                if (key) {
                    await this.verifyDropKey(key);
                }
            });
        }

        // Close modal on outside click
        if (keyModal) {
            keyModal.addEventListener('click', (e) => {
                if (e.target === keyModal) {
                    this.hideKeyModal();
                }
            });
        }
    }

    async loadActiveDrop() {
        try {
            const response = await fetch(`${this.apiUrl}/drops/active`);
            
            if (response.ok) {
                const drop = await response.json();
                this.currentDrop = drop;
                this.renderDropHeader(drop);
                this.startCountdown(drop.end_at);
                this.showKeyModal();
            } else {
                this.showNoDropMessage();
            }
        } catch (error) {
            console.error('Error loading active drop:', error);
            this.showNoDropMessage();
        }
    }

    renderDropHeader(drop) {
        const dropTitle = document.getElementById('dropTitle');
        
        if (dropTitle) {
            dropTitle.textContent = drop.title.toUpperCase();
        }
    }

    startCountdown(endTime) {
        const updateCountdown = () => {
            const now = new Date().getTime();
            const end = new Date(endTime).getTime();
            const timeLeft = end - now;

            if (timeLeft <= 0) {
                this.showNoDropMessage();
                this.stopCountdown();
                return;
            }

            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            // Update timer display
            this.updateTimerDisplay(days, hours, minutes, seconds);
        };

        updateCountdown();
        this.countdownInterval = setInterval(updateCountdown, 1000);
    }

    updateTimerDisplay(days, hours, minutes, seconds) {
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');

        if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
        if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
        if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
        if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
    }

    stopCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }

    showKeyModal() {
        const keyModal = document.getElementById('keyModal');
        if (keyModal) {
            keyModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Focus on input
            const keyInput = keyModal.querySelector('.key-input');
            if (keyInput) {
                setTimeout(() => keyInput.focus(), 100);
            }
        }
    }

    hideKeyModal() {
        const keyModal = document.getElementById('keyModal');
        if (keyModal) {
            keyModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    async verifyDropKey(key) {
        if (!this.currentDrop) return;

        try {
            const response = await fetch(`${this.apiUrl}/drops/${this.currentDrop.id}/unlock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ key }),
            });

            const data = await response.json();

            if (response.ok) {
                this.isUnlocked = true;
                this.hideKeyModal();
                this.loadDropProducts();
                
                // Show success notification
                if (window.FreakUtils) {
                    window.FreakUtils.showNotification('Drop unlocked successfully!', 'success');
                }
            } else {
                // Show error
                if (window.FreakUtils) {
                    window.FreakUtils.showNotification(data.error || 'Invalid drop key', 'error');
                }
            }
        } catch (error) {
            console.error('Error verifying drop key:', error);
            if (window.FreakUtils) {
                window.FreakUtils.showNotification('Network error. Please try again.', 'error');
            }
        }
    }

    async loadDropProducts() {
        if (!this.currentDrop || !this.isUnlocked) return;

        try {
            const response = await fetch(`${this.apiUrl}/drops/${this.currentDrop.id}/products`);
            
            if (response.ok) {
                const products = await response.json();
                this.renderDropProducts(products);
            } else {
                console.error('Failed to load drop products');
            }
        } catch (error) {
            console.error('Error loading drop products:', error);
        }
    }

    renderDropProducts(products) {
        const productsContainer = document.getElementById('dropProducts');
        
        if (!productsContainer) return;

        if (products.length === 0) {
            productsContainer.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; opacity: 0.7;">No products in this drop yet</p>';
            return;
        }

        productsContainer.innerHTML = '';

        products.forEach(product => {
            const productCard = this.createProductCard(product);
            productsContainer.appendChild(productCard);
        });
    }

    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        const selectedVariants = {};

        card.innerHTML = `
            <img src="${product.images[0] || 'https://via.placeholder.com/300x300?text=FREAK'}" alt="${product.title}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-variants">
                    ${product.variants.map(variant => `
                        <button class="size-option" data-variant-id="${variant.id}" data-size="${variant.size}">
                            ${variant.size}
                        </button>
                    `).join('')}
                </div>
                <div class="product-price">${this.formatPrice(product.variants[0].price)}</div>
                <button class="buy-btn" disabled>BUY NOW</button>
            </div>
        `;

        // Add event listeners
        const sizeOptions = card.querySelectorAll('.size-option');
        const buyBtn = card.querySelector('.buy-btn');
        const priceEl = card.querySelector('.product-price');

        sizeOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove selection from all options
                sizeOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Select clicked option
                option.classList.add('selected');
                
                // Store selected variant
                const variantId = option.dataset.variantId;
                selectedVariants[product.id] = {
                    id: variantId,
                    size: option.dataset.size,
                    price: product.variants.find(v => v.id == variantId).price
                };

                // Update price
                priceEl.textContent = this.formatPrice(selectedVariants[product.id].price);
                
                // Enable buy button
                buyBtn.disabled = false;
            });
        });

        buyBtn.addEventListener('click', () => {
            const selectedVariant = selectedVariants[product.id];
            if (selectedVariant) {
                this.handleBuyNow(product, selectedVariant);
            }
        });

        return card;
    }

    async handleBuyNow(product, variant) {
        if (!this.isUnlocked) {
            if (window.FreakUtils) {
                window.FreakUtils.showNotification('Please unlock the drop first', 'error');
            }
            return;
        }

        try {
            const stripe = Stripe('pk_test_your_stripe_publishable_key_here'); // Replace with actual key
            
            const response = await fetch(`${this.apiUrl}/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: [{
                        variantId: variant.id,
                        title: product.title,
                        size: variant.size,
                        price: variant.price,
                        quantity: 1,
                        images: product.images
                    }],
                    email: 'customer@example.com', // Get from user input if available
                    dropId: this.currentDrop.id
                }),
            });

            const session = await response.json();

            if (response.ok) {
                // Redirect to Stripe Checkout
                const result = await stripe.redirectToCheckout({
                    sessionId: session.sessionId
                });

                if (result.error) {
                    if (window.FreakUtils) {
                        window.FreakUtils.showNotification(result.error.message, 'error');
                    }
                }
            } else {
                if (window.FreakUtils) {
                    window.FreakUtils.showNotification(session.error || 'Failed to create checkout session', 'error');
                }
            }
        } catch (error) {
            console.error('Checkout error:', error);
            if (window.FreakUtils) {
                window.FreakUtils.showNotification('Checkout failed. Please try again.', 'error');
            }
        }
    }

    formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(price / 100);
    }

    showNoDropMessage() {
        const dropHeader = document.querySelector('.drop-header');
        const dropProducts = document.querySelector('.drop-products');
        const noDropMessage = document.getElementById('noDropMessage');

        if (dropHeader) dropHeader.style.display = 'none';
        if (dropProducts) dropProducts.style.display = 'none';
        if (noDropMessage) noDropMessage.style.display = 'block';

        this.stopCountdown();
    }
}

// Initialize drop page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on drop page
    if (window.location.pathname.includes('/drop')) {
        window.dropPage = new DropPage();
    }
});