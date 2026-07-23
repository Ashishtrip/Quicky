FROM node:20-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy root configs
COPY package.json yarn.lock turbo.json ./

# Copy packages and the API app
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install dependencies
RUN yarn install --frozen-lockfile

# Build the API (this also runs prisma generate)
RUN yarn workspace @quicky/api build

FROM node:20-alpine AS runner

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy everything from builder
COPY --from=builder /app ./

EXPOSE 3000

# Start the application
CMD ["yarn", "workspace", "@quicky/api", "start"]
