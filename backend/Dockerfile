# Use node 20 lightweight alpine image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy dependency configuration
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy server code
COPY server.js ./

# Create the data directory for storage volume mounting
RUN mkdir -p /app/data

# Expose backend port
EXPOSE 5000

# Set environment variables
ENV PORT=5000
ENV NODE_ENV=production

# Run the server
CMD ["node", "server.js"]
