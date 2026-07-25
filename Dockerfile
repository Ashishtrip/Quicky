FROM node:22-alpine AS pruner
RUN apk add --no-cache libc6-compat
RUN yarn global add turbo@^1.13.0
WORKDIR /app
COPY . .
RUN turbo prune --scope=@quicky/api --docker

FROM node:22-alpine AS builder
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# Copy the pruned lockfile and package.json's to install dependencies
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/yarn.lock ./yarn.lock

# Install dependencies (this will only install what @quicky/api needs!)
RUN yarn install --frozen-lockfile

# Copy the actual source code of the pruned workspaces
COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json

# Build the API (this also runs prisma generate)
ENV NODE_OPTIONS="--max-old-space-size=256"
RUN yarn workspace @quicky/shared-types build
RUN yarn workspace @quicky/api run db:generate
RUN cd apps/api && npx -y -p tsup -p typescript tsup src/index.ts --format cjs --target node22 --out-dir dist

FROM node:22-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

# Copy everything from builder
COPY --from=builder /app ./

EXPOSE 3000

CMD ["yarn", "workspace", "@quicky/api", "start"]
