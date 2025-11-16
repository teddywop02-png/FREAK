#!/bin/bash

# FREAK Streetwear Deploy Script

echo "🚀 FREAK Streetwear Deployment Script"
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration before running the server"
fi

# Initialize database
echo "🗄️  Initializing database..."
node server/db/init_db.js

if [ $? -ne 0 ]; then
    echo "❌ Failed to initialize database"
    exit 1
fi

echo "✅ Database initialized"

# Run quick test
echo "🧪 Running quick test..."
node test.js

if [ $? -ne 0 ]; then
    echo "❌ Quick test failed"
    exit 1
fi

echo ""
echo "🎉 FREAK is ready to launch!"
echo ""
echo "To start the application:"
echo "1. Edit .env file with your Stripe keys and configuration"
echo "2. Run: npm run dev"
echo ""
echo "Access the site at: http://localhost:3000"
echo ""
echo "Demo credentials:"
echo "- Admin: admin@freak.local / FreakAdmin123!"
echo "- Drop key: FREAK-TEST-KEY-2025"
echo ""
echo "Happy coding! 🎨"