# Quicky Local Development Setup Guide

Welcome to the Quicky project! This guide will help you set up the project locally for development.

## 🏗 Project Structure

Quicky is a monorepo managed with **Yarn Workspaces** and **Turborepo**.

- **`apps/api`**: Fastify/Express based Node.js backend using Prisma ORM and PostgreSQL.
- **`apps/customer-app`**: React Native application for customers.
- **`apps/store-app`**: React Native application for store partners.
- **`packages/*`**: Shared internal packages (`api-client`, `config`, `shared-types`, `ui-kit`).

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or v20 LTS recommended)
- **Yarn** (v1.x, classic)
- **PostgreSQL** (running locally on default port 5432)
- **React Native Environment**: Follow the official [React Native CLI Environment Setup](https://reactnative.dev/docs/environment-setup) for Android Studio (and Xcode if on macOS).

---

## 🚀 Setup Instructions

### 1. Install Dependencies
Navigate to the root directory and install all dependencies for the monorepo:

```bash
yarn install
```

### 2. Environment Variables
You need to configure the environment variables for the API backend.

1. Navigate to `apps/api`.
2. Create a `.env` file (if it doesn't already exist) and configure the following variables:

```env
# apps/api/.env

# Database connection string (adjust username/password if needed)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/quicky"

# PayPal Integration (Use sandbox keys for dev)
PAYPAL_CLIENT_ID="<your_paypal_client_id>"
PAYPAL_SECRET="<your_paypal_secret>"

# Google Service Account
GOOGLE_SERVICE_ACCOUNT_KEY="<your_google_service_account_key>"
SPREADSHEET_ID="<your_spreadsheet_id>"
```

### 3. Database Setup (Prisma)
With PostgreSQL running, set up the database schema:

```bash
# Generate Prisma Client
yarn db:generate

# Push schema to the database
yarn db:push

# (Optional) Seed the database if a seed script is present
yarn workspace @quicky/api db:seed
```

You can view your local database using Prisma Studio:
```bash
yarn db:studio
```

---

## 🏃‍♂️ Running the Applications

You can start the different parts of the application using the scripts provided in the root `package.json`.

### Start the API Backend
Runs the backend API on watch mode:
```bash
yarn dev:api
```

### Start the Customer App
Starts the Metro bundler for the Customer App:
```bash
yarn dev:customer
```
Then, open a new terminal in `apps/customer-app` and run:
- **Android**: `yarn android`
- **iOS**: `yarn ios` (macOS only)

### Start the Store App
Starts the Metro bundler for the Store App:
```bash
yarn dev:store
```
Then, open a new terminal in `apps/store-app` and run:
- **Android**: `yarn android`
- **iOS**: `yarn ios` (macOS only)

---

## 🛠 Additional Commands

From the root directory, you can run the following Turborepo commands across all workspaces:

- **`yarn build`**: Build all apps and packages.
- **`yarn lint`**: Run ESLint across the monorepo.
- **`yarn typecheck`**: Run TypeScript typechecking.
- **`yarn test`**: Run tests using Jest/Vitest.
