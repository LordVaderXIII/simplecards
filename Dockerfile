# Stage 1: Build React App
FROM node:18-alpine AS builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Serve with Express
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY server.js ./
COPY --from=builder /app/client/dist ./client/dist

# Create directory for decks persistence
RUN mkdir -p /app/decks

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
