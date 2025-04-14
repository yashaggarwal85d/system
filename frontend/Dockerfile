FROM node:23-alpine

# Declare build arguments
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXTAUTH_SECRET

RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

# Set environment variables for the build process
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN pnpm build

# Set environment variables for the runtime container (for server-side code like NextAuth)
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET

EXPOSE 3000
CMD ["pnpm", "start"]
