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
        const messageElement = document.getElementById('subscribeMessage');

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
                            messageElement.textContent = 'Thank you for subscribing! Check your email for confirmation.';
                            messageElement.style.color = '#4CAF50';
                            messageElement.style.display = 'block';
                            
                            // Reset form
                            form.reset();
                            
                            // Hide message after 5 seconds
                            setTimeout(() => {
                                messageElement.style.display = 'none';
                            }, 5000);
                        } else if (response.status === 409) {
                            // Email already subscribed
                            messageElement.textContent = 'This email is already subscribed!';
                            messageElement.style.color = '#FF9800';
                            messageElement.style.display = 'block';
                            
                            setTimeout(() => {
                                messageElement.style.display = 'none';
                            }, 5000);
                        } else if (response.status === 400) {
                            // Invalid email
                            messageElement.textContent = 'Please enter a valid email address.';
                            messageElement.style.color = '#f44336';
                            messageElement.style.display = 'block';
                        } else {
                            messageElement.textContent = 'Something went wrong. Please try again.';
                            messageElement.style.color = '#f44336';
                            messageElement.style.display = 'block';
                        }
                    } catch (error) {
                        console.error('Subscription error:', error);
                        messageElement.textContent = 'Network error. Please try again.';
                        messageElement.style.color = '#f44336';
                        messageElement.style.display = 'block';
                    }
                }
            });
        }
    }
}

// Initialize subscribe page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on subscribe page
    if (window.location.pathname.includes('/subscribe')) {
        window.subscribePage = new SubscribePage();
    }
});
