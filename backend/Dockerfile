# Use official Playwright image which includes all system dependencies
FROM mcr.microsoft.com/playwright:v1.49.1-jammy

# Set working directory
WORKDIR /app

# Ensure that build-time and runtime both use the same browser cache path
ENV PLAYWRIGHT_BROWSERS_PATH=/app/playwright-browsers

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code and config files
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Install Playwright browsers AFTER build (Chromium + headless shell for Playwright v1.49)
# This ensures browsers are installed with the final dependency tree
RUN npx playwright install --with-deps chromium chromium-headless-shell

# Verify the browser was installed
RUN ls -la /root/.cache/ms-playwright/ || echo "Warning: Playwright cache directory not found"

# Expose port (Railway will set this via PORT env var)
EXPOSE 3000

# Set NODE_ENV to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]

