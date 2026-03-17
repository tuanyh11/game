FROM oven/bun:1

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY server/package.json server/bun.lock ./server/

# Install dependencies
RUN bun install
RUN cd server && bun install

# Copy source code
COPY . .

# Build frontend into server/dist
RUN bun run build

# Expose port (Render sets PORT env automatically)
EXPOSE 4000

# Start server
CMD ["bun", "run", "start"]
