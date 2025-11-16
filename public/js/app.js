// Main Application JavaScript
class FreakApp {
    constructor() {
        this.isMenuOpen = false;
        this.apiUrl = window.location.origin + '/api';
        // bound handler to close menu on outside click/touch
        this._boundCloseOnDocClick = this._closeOnDocClick.bind(this);
        this.init();
    }

    init() {
        this.setupMenu();
        this.setupNewsletterForm();
        this.setupSplash();
        this.setupPageNavigationSplash();
        // Only show dynamic splash on non-index pages
        if (window.location.pathname !== '/') {
            this.showPageLoadSplash();
        }
        this.loadFeaturedDrops();
    }

    setupPageNavigationSplash() {
        // Show splash on every internal link navigation
        const menuLinks = document.querySelectorAll('.menu-link');
        menuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                const currentPath = window.location.pathname;
                
                // Only show splash for internal navigation (not #, not external, not current page)
                if (href && href !== '/' && !href.startsWith('#') && !href.startsWith('http') && currentPath !== href) {
                    e.preventDefault();
                    // Navigate immediately, page load will trigger splash
                    window.location.href = href;
                }
            });
        });
    }

    showPageLoadSplash() {
        // Show splash after page loads
        const splash = document.createElement('div');
        splash.className = 'splash-overlay';
        splash.innerHTML = '<img src="/images/jointheteam.png" alt="Join the Team">';
        document.body.appendChild(splash);

        document.body.style.overflow = 'hidden';
        document.body.classList.add('splash-active');

        // Auto-fade and navigate after delay
        const fadeOutTimer = setTimeout(() => {
            document.body.classList.remove('splash-active');
            splash.classList.add('fade-out');
            const removeTimer = setTimeout(() => {
                if (splash.parentNode) splash.parentNode.removeChild(splash);
                document.body.style.overflow = '';
            }, 480);
        }, 500);

        // SAFETY: Make sure splash is removed after 2 seconds even if timers fail
        const safetyTimeout = setTimeout(() => {
            if (splash && splash.parentNode) {
                document.body.classList.remove('splash-active');
                splash.classList.add('fade-out');
                setTimeout(() => {
                    if (splash && splash.parentNode) {
                        splash.parentNode.removeChild(splash);
                    }
                    document.body.style.overflow = '';
                }, 480);
            }
        }, 2000);
    }

    setupSplash() {
        const splash = document.getElementById('splashOverlay');
        if (!splash) return;

        // Lock scrolling while splash is visible for polished look
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        // Add a body class so CSS can blur the page while the splash is visible
        document.body.classList.add('splash-active');

        let fadeTimer = null;
        let removeTimer = null;

        const removeSplash = (delay = 480) => {
            // Add fade-out class if not already present
            if (!splash.classList.contains('fade-out')) {
                // Remove 'splash-active' so underlying page will unblur while
                // the splash itself fades out.
                document.body.classList.remove('splash-active');
                splash.classList.add('fade-out');
            }

            // clear any existing removal timer and set a new one
            if (removeTimer) clearTimeout(removeTimer);
            removeTimer = setTimeout(() => {
                if (splash && splash.parentNode) {
                    splash.parentNode.removeChild(splash);
                }
                document.body.style.overflow = previousOverflow || '';
            }, delay);
        };

        // Dismiss quickly on click/tap for better UX
        const onClickDismiss = () => {
            if (fadeTimer) clearTimeout(fadeTimer);
            if (removeTimer) clearTimeout(removeTimer);
            removeSplash(360);
        };

        splash.addEventListener('click', onClickDismiss, { once: true });

        // Shorter, punchy timings for the entrance and exit to feel snappy
        // Start fade after ~700ms, remove after fade completes (~450ms)
        fadeTimer = setTimeout(() => {
            removeSplash(480);
        }, 700);

        // SAFETY: Make sure splash is removed after 2 seconds even if timers fail
        const safetyTimeout = setTimeout(() => {
            if (splash && splash.parentNode) {
                splash.classList.add('fade-out');
                setTimeout(() => {
                    if (splash && splash.parentNode) {
                        splash.parentNode.removeChild(splash);
                    }
                    document.body.style.overflow = previousOverflow || '';
                    document.body.classList.remove('splash-active');
                }, 480);
            }
        }, 2000);

        // Track for cleanup
        splash._fadeTimer = fadeTimer;
        splash._removeTimer = removeTimer;
        splash._safetyTimeout = safetyTimeout;
    }

    setupMenu() {
        const logoCircle = document.getElementById('logoCircle');
        const menuOverlay = document.getElementById('menuOverlay');

        if (!logoCircle || !menuOverlay) return;

        logoCircle.addEventListener('click', (e) => {
            // stop propagation so a document-level listener doesn't immediately close it
            e.stopPropagation();
            this.toggleMenu();
        });

        menuOverlay.addEventListener('click', (e) => {
            if (e.target === menuOverlay) {
                this.closeMenu();
            }
        });

        // Close menu when clicking on menu links
        const menuLinks = document.querySelectorAll('.menu-link');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.closeMenu();
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen) {
                this.closeMenu();
            }
        });

        // Note: we add a document click listener only while the menu is open (see toggleMenu/closeMenu)
    }

    // Private: document click handler bound when menu opens
    _closeOnDocClick(e) {
        try {
            // If clicked inside the menu content, do nothing
            if (e.target.closest('.menu-content')) return;

            // If clicked the logo, ignore here (logo handler toggles separately)
            if (e.target.closest('#logoCircle')) return;

            // Otherwise close the menu
            this.closeMenu();
        } catch (err) {
            // ignore errors
        }
    }

    toggleMenu() {
        const menuOverlay = document.getElementById('menuOverlay');
        
        if (this.isMenuOpen) {
            this.closeMenu();
        } else {
            menuOverlay.classList.add('active');
            this.isMenuOpen = true;
            document.body.style.overflow = 'hidden';
            // add document listeners to close when clicking/tapping outside
            document.addEventListener('click', this._boundCloseOnDocClick);
            document.addEventListener('touchstart', this._boundCloseOnDocClick);
        }
    }

    closeMenu() {
        const menuOverlay = document.getElementById('menuOverlay');
        menuOverlay.classList.remove('active');
        this.isMenuOpen = false;
        document.body.style.overflow = '';
        // remove document listeners
        document.removeEventListener('click', this._boundCloseOnDocClick);
        document.removeEventListener('touchstart', this._boundCloseOnDocClick);
    }

    setupNewsletterForm() {
        const newsletterForms = document.querySelectorAll('#newsletterForm');
        
        newsletterForms.forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const emailInput = form.querySelector('.email-input');
                const email = emailInput.value.trim();
                
                if (!email || !this.isValidEmail(email)) {
                    this.showNotification('Please enter a valid email address', 'error');
                    return;
                }

                try {
                    const response = await fetch(`${this.apiUrl}/newsletter`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email }),
                    });

                    const data = await response.json();

                    if (response.ok) {
                        this.showNotification('Successfully subscribed to newsletter!', 'success');
                        emailInput.value = '';
                    } else {
                        this.showNotification(data.error || 'Failed to subscribe', 'error');
                    }
                } catch (error) {
                    console.error('Newsletter subscription error:', error);
                    this.showNotification('Network error. Please try again.', 'error');
                }
            });
        });
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '4px',
            color: '#fff',
            fontWeight: '600',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            maxWidth: '300px',
        });

        // Set background color based on type
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            info: '#2196F3'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // Add to DOM
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    async loadFeaturedDrops() {
        const featuredDropsContainer = document.getElementById('featuredDrops');
        
        if (!featuredDropsContainer) return;

        try {
            const response = await fetch(`${this.apiUrl}/drops/active`);
            
            if (response.ok) {
                const drop = await response.json();
                this.renderFeaturedDrop(drop, featuredDropsContainer);
            } else {
                // Show message when no active drop
                featuredDropsContainer.innerHTML = `
                    <div class="no-drop-message" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                        <h3 style="font-size: 24px; margin-bottom: 20px;">NO ACTIVE DROP</h3>
                        <p style="opacity: 0.8; margin-bottom: 30px;">Check back soon for exclusive releases</p>
                        <a href="/shop" class="btn-primary" style="display: inline-block; padding: 12px 30px; background: #fff; color: #000; text-decoration: none; font-weight: 600; border-radius: 4px;">BROWSE SHOP</a>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading featured drops:', error);
            featuredDropsContainer.innerHTML = '<p style="text-align: center; opacity: 0.7;">Failed to load drops</p>';
        }
    }

    renderFeaturedDrop(drop, container) {
        const endDate = new Date(drop.end_at);
        const now = new Date();
        const timeLeft = endDate - now;

        // Convert time left to days, hours, minutes
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        const dropCard = document.createElement('div');
        dropCard.className = 'drop-card';
        dropCard.innerHTML = `
            <img src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&h=600&fit=crop" alt="${drop.title}">
            <div class="drop-card-content">
                <h3 class="drop-card-title">${drop.title}</h3>
                <p class="drop-card-description">${drop.description}</p>
                <div style="margin: 15px 0; font-size: 14px; opacity: 0.8;">
                    <div>Time remaining: ${days} days ${hours} hours</div>
                </div>
                <a href="/drop?id=${drop.id}" class="drop-card-cta">ACCESS DROP</a>
            </div>
        `;

        container.appendChild(dropCard);
    }

    // Utility function to format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount / 100);
    }

    // Utility function to format date
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.freakApp = new FreakApp();
});

// Global utility functions
window.FreakUtils = {
    showNotification: (message, type) => window.freakApp.showNotification(message, type),
    formatCurrency: (amount) => window.freakApp.formatCurrency(amount),
    formatDate: (dateString) => window.freakApp.formatDate(dateString)
};