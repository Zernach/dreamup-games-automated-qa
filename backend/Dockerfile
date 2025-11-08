# Use official Playwright image which includes all system dependencies
FROM mcr.microsoft.com/playwright:v1.48.2-jammy

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code and config files
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production

# Expose port (Railway will set this via PORT env var)
EXPOSE 3000

# Set NODE_ENV to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]

