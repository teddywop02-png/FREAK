FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create database directory and initialize
RUN mkdir -p server/db && \
    node server/db/init_db.js

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]