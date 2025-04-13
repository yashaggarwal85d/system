# Base image with Node.js and install pnpm
FROM node:18-alpine AS base
WORKDIR /app

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies
FROM base AS deps

# Copy only pnpm-related files first for better caching
COPY pnpm-lock.yaml ./
COPY package.json ./

# Install dependencies (no hoisting here)
RUN pnpm install --frozen-lockfile

# Build the app
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /app/package.json ./package.json

COPY . .

RUN pnpm build

# Create production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy necessary files for running the app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["pnpm", "start"]
