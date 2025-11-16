# FREAK Streetwear Brand

A full-stack web application for an exclusive streetwear brand featuring limited drops, permanent shop, and admin management.

## Features

- **Hero Slideshow**: Dynamic carousel with touch/keyboard controls
- **Exclusive Drops**: Time-limited collections with key-based access
- **Permanent Shop**: Year-round available products with filtering
- **Admin Panel**: Full product and drop management
- **Stripe Integration**: Secure payment processing
- **Newsletter System**: Email subscription management
- **Responsive Design**: Mobile-first approach

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Authentication**: JWT tokens
- **Payments**: Stripe
- **Security**: Helmet, CORS, bcrypt

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd freak
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   JWT_SECRET=your_jwt_secret_key
   PORT=3000
   ```

4. **Initialize database**
   ```bash
   npm run init-db
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```

   For production:
   ```bash
   npm start
   ```

## Default Credentials

### Admin Login
- **Email**: `admin@freak.local`
- **Password**: `FreakAdmin123!`

### Test Drop Key
- **Key**: `FREAK-TEST-KEY-2025`

## Project Structure

```
/freak
├── public/                 # Frontend files
│   ├── css/
│   │   └── main.css       # Main stylesheet
│   ├── js/
│   │   ├── app.js         # Main application logic
│   │   ├── slideshow.js   # Hero slideshow
│   │   ├── drop.js        # Drop page logic
│   │   ├── shop.js        # Shop page logic
│   │   └── admin.js       # Admin panel
│   ├── images/            # Static images
│   ├── index.html         # Homepage
│   ├── drop.html          # Drop page
│   ├── shop.html          # Shop page
│   └── admin.html         # Admin panel
├── server/                # Backend files
│   ├── server.js          # Main server file
│   ├── db/
│   │   ├── init_db.js     # Database initialization
│   │   └── data.sqlite    # SQLite database
│   └── routes/
│       ├── api.js         # API routes
│       └── admin.js       # Admin routes
├── package.json           # Node.js dependencies
├── .env.example          # Environment variables template
└── README.md             # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout

### Drops
- `GET /api/drops/active` - Get active drop
- `GET /api/drops/:id` - Get drop details (protected)
- `POST /api/drops/:id/unlock` - Verify drop key
- `GET /api/drops/:id/products` - Get drop products

### Shop
- `GET /api/shop` - Get permanent collection products

### Checkout
- `POST /api/checkout` - Create Stripe checkout session
- `POST /webhook` - Stripe webhook endpoint

### Newsletter
- `POST /api/newsletter` - Subscribe to newsletter

### Admin
- `GET /api/admin/products` - Get all products
- `POST /api/admin/products` - Create product
- `GET /api/admin/drops` - Get all drops
- `POST /api/admin/drops` - Create drop

## Database Schema

### Users
- `id` - Primary key
- `email` - User email
- `password_hash` - Hashed password
- `role` - User role (admin)
- `created_at` - Timestamp

### Products
- `id` - Primary key
- `title` - Product name
- `description` - Product description
- `images` - JSON array of image URLs
- `category` - Product category
- `created_at` - Timestamp

### Product Variants
- `id` - Primary key
- `product_id` - Foreign key to products
- `size` - Size (S, M, L, XL, etc.)
- `price` - Price in cents
- `stock_total` - Available stock
- `stock_for_drop` - Stock allocated for drops

### Drops
- `id` - Primary key
- `title` - Drop name
- `description` - Drop description
- `start_at` - Start datetime
- `end_at` - End datetime
- `key_hash` - Hashed access key
- `is_active` - Active status
- `processed` - Completion status

### Orders
- `id` - Primary key
- `user_email` - Customer email
- `items` - JSON array of ordered items
- `total_amount` - Total in cents
- `stripe_session_id` - Stripe session ID
- `status` - Order status
- `created_at` - Timestamp

## Usage

### Homepage
- View hero slideshow with brand imagery
- See featured active drop
- Subscribe to newsletter

### Drop Page
- Enter drop key to access exclusive collection
- View countdown timer
- Browse and purchase limited products

### Shop Page
- Browse permanent collection
- Filter by category, size, and price
- Purchase available products

### Admin Panel
- Login with admin credentials
- Manage products (CRUD operations)
- Create and manage drops
- View orders and subscribers

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- CORS protection
- Helmet security headers
- Rate limiting (implement as needed)

## Deployment

### Local Development
```bash
npm run dev
```

### Production
1. Set environment variables
2. Run database migrations
3. Start with PM2 or similar process manager
4. Configure reverse proxy (nginx)
5. Set up SSL certificate

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check existing issues
2. Create a new issue with detailed description
3. Include steps to reproduce
4. Add relevant logs and screenshots

## Roadmap

- [ ] Product variant management
- [ ] Inventory tracking
- [ ] Customer accounts
- [ ] Email notifications
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app
- [ ] Social media integration