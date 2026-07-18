# --- Build Stage ---
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy dependency configuration
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy application source code
COPY . .

# Build the static distribution assets
# Allow building with a custom VITE_API_URL if needed
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# --- Serve Stage ---
FROM nginx:stable-alpine

# Copy built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the custom Nginx server configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose Nginx default HTTP port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
