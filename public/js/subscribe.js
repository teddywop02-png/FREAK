// Subscribe page functionality
class SubscribePage {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const form = document.getElementById('newsletterForm');

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('emailInput').value;
                
                if (email) {
                    try {
                        // Send email to server to store in database
                        const response = await fetch('/api/newsletter', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ email })
                        });

                        const data = await response.json();
                        console.log('Response status:', response.status);
                        console.log('Response data:', data);

                        if (response.ok) {
                            this.showNotification('Successfully subscribed!', 'success');
                            
                            // Reset form
                            form.reset();
                        } else if (response.status === 409) {
                            // Email already subscribed
                            this.showNotification('This email is already subscribed!', 'warning');
                        } else if (response.status === 400) {
                            // Invalid email
                            this.showNotification('Please enter a valid email address.', 'error');
                        } else {
                            this.showNotification('Something went wrong. Please try again.', 'error');
                        }
                    } catch (error) {
                        console.error('Subscription error:', error);
                        this.showNotification('Network error. Please try again.', 'error');
                    }
                }
            });
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles if not already in CSS
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '15px 20px';
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '9999';
        notification.style.fontFamily = 'Courier New, monospace';
        notification.style.fontSize = '14px';
        
        // Set colors based on type
        const colors = {
            success: { bg: '#4CAF50', text: '#fff' },
            error: { bg: '#f44336', text: '#fff' },
            warning: { bg: '#FF9800', text: '#fff' },
            info: { bg: '#2196F3', text: '#fff' }
        };
        
        const color = colors[type] || colors.info;
        notification.style.backgroundColor = color.bg;
        notification.style.color = color.text;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize subscribe page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on subscribe page
    if (window.location.pathname.includes('/subscribe')) {
        window.subscribePage = new SubscribePage();
    }
});
