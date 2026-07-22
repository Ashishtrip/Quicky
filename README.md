# Quicky

Quicky is an Android-first e-commerce grocery platform that prioritizes trust over speed. The platform provides a transparent marketplace for near-expiry and fresh groceries, catering to both budget optimizers and freshness-first customers. Quicky makes freshness and discount transparency legible at a glance, while keeping store-side tagging effortless for local store (kirana) owners.

## Key Features

* **Two Apps, One System**: Includes a dedicated Customer app and a Store Partner app.
* **Freshness Meter**: Items are categorized into transparent freshness states—**Use Today** (discounted), **Soon** (expiring 2-3 days), and **Fresh Stock** (standard price).
* **3-Tap Tagging Flow**: Allows store partners to quickly categorize and list near-expiry products with minimal friction (designed for < 30 seconds per item).
* **Localization & Accessibility**: Android-first design optimized for mid-range devices, with full Hindi and English language support built into the UI.

## 1. Project Structure

This project is structured as a monorepo using [Turborepo](https://turbo.build/repo) and Yarn Workspaces.

```text
Quicky/
├── apps/
│   ├── api/               # Backend API server (Express/Fastify)
│   ├── customer-app/      # Customer-facing mobile application (React Native/Expo)
│   └── store-app/         # Store partner mobile application (React Native/Expo)
├── packages/
│   ├── api-client/        # Shared API client utilities
│   ├── config/            # Shared configuration (ESLint, etc.)
│   ├── shared-types/      # Shared TypeScript definitions for end-to-end type safety
│   └── ui-kit/            # Shared UI components and design system
├── e2e/                   # End-to-End tests
├── phase1..5/             # Project phases and iteration plans
├── package.json           # Root package.json defining workspaces
├── turbo.json             # Turborepo configuration
└── yarn.lock              # Yarn lockfile
```

## 2. Dependencies

The project relies on a modern stack distributed across the monorepo:

**Global / Monorepo Tools:**
* **Turborepo:** High-performance build system for JavaScript/TypeScript codebases.
* **Yarn Workspaces:** Dependency management and monorepo structure.
* **TypeScript:** For static typing across all packages and apps.

**Backend (`apps/api`):**
* **Express / Fastify:** Web frameworks for the API server.
* **Prisma:** Next-generation Node.js and TypeScript ORM for database access.
* **Supabase / Firebase Admin:** For authentication and database management.
* **Socket.io:** For real-time bi-directional communication.
* **BullMQ & ioredis:** For background job processing and message queues.
* **Razorpay:** For processing payments.

**Mobile Apps (`apps/customer-app` & `apps/store-app`):**
* **React Native & Expo:** For building cross-platform (Android-first) mobile applications.
* **Zustand:** A small, fast, and scalable state management solution.
* **React Navigation:** For routing and navigation within the apps.
* **Firebase (Auth, Firestore, Messaging):** For client-side authentication, real-time database, and push notifications.
* **Zod:** For schema validation.

## 3. Launching Method of the Project

From the root of the project, use the following commands to launch the different parts of the application:

1. **Install Dependencies:**
   ```bash
   yarn install
   ```

2. **Start the API Server:**
   ```bash
   yarn dev:api
   ```

3. **Start the Customer App:**
   ```bash
   yarn dev:customer
   ```

4. **Start the Store App:**
   ```bash
   yarn dev:store
   ```

5. **Database Commands (API):**
   - `yarn db:generate` - Generates Prisma client.
   - `yarn db:push` - Pushes database schema changes.
   - `yarn db:studio` - Opens Prisma Studio for the database.

*Note: Mobile apps use Expo. When you run the dev commands for mobile apps, a QR code will appear in the terminal. You can scan this using the Expo Go app on your Android device (or run an emulator) to launch the app locally.*

## 4. Prerequisites

To run this project locally, you need to have the following installed:

* **Node.js:** (v18 or higher recommended)
* **Yarn:** For dependency management and running workspace scripts.
* **Redis Server:** Required for BullMQ background jobs and caching.
* **PostgreSQL:** Required for the Prisma ORM.
* **Expo CLI / Expo Go:** For mobile development.
* **Android Studio / Emulator:** For running the Android apps locally (since it is an Android-first application).

## 5. Technology Choices (What, Where & Why)

Here are the core technologies used in Quicky and the reasoning behind their selection:

* **Prisma (ORM):** 
  * **Where:** Backend API (`apps/api`).
  * **Why:** Provides a highly intuitive, type-safe database client and easy schema migrations. It allows developers to define the database schema predictably and guarantees type safety from the database up to the frontend when combined with our shared types package.
* **Redis & BullMQ:** 
  * **Where:** Backend API (`apps/api`) and Global package layer.
  * **Why:** Used for handling asynchronous background jobs (like processing orders, sending notifications, or managing inventory expiries). Redis provides an extremely fast in-memory data store, while BullMQ provides a robust, Redis-based queueing system.
* **Socket.io:** 
  * **Where:** Between Backend API and Mobile Apps.
  * **Why:** Enables real-time, bi-directional communication. This is crucial for instant order updates, live inventory syncing, and real-time freshness meter updates without the client needing to constantly poll the server.
* **Turborepo:** 
  * **Where:** Monorepo root.
  * **Why:** Significantly speeds up build times by caching previous tasks and running scripts concurrently. It perfectly handles the complex inter-dependencies between our shared packages (`ui-kit`, `shared-types`) and the main applications, ensuring that a change in a shared package correctly triggers rebuilds where needed.
* **Expo:** 
  * **Where:** Mobile Apps (`customer-app`, `store-app`).
  * **Why:** Greatly accelerates React Native development by removing the need to manage complex native iOS/Android code directly for most features. It provides a comprehensive suite of tools and APIs out of the box, perfectly suiting our Android-first, rapid-iteration approach.
* **Zustand:** 
  * **Where:** Mobile Apps.
  * **Why:** Chosen over Redux for its simplicity, zero-boilerplate, and hook-based approach, making global state management cleaner, more scalable, and easier to maintain for our mobile teams.
