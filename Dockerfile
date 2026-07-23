FROM node:20-alpine AS pruner
RUN apk add --no-cache libc6-compat
RUN yarn global add turbo
WORKDIR /app
COPY . .
RUN turbo prune --scope=@quicky/api --docker

FROM node:20-alpine AS builder
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# Copy the pruned lockfile and package.json's to install dependencies
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/yarn.lock ./yarn.lock

# Install dependencies (this will only install what @quicky/api needs!)
RUN yarn install --frozen-lockfile

# Copy the actual source code of the pruned workspaces
COPY --from=pruner /app/out/full/ .

# Build the API (this also runs prisma generate)
RUN yarn workspace @quicky/api build

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

# Copy everything from builder
COPY --from=builder /app ./

EXPOSE 3000

CMD ["yarn", "workspace", "@quicky/api", "start"]
