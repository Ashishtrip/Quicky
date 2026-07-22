# Expo Dev Client Migration Plan

Migrate `customer-app` and `store-app` from bare React Native CLI → **Expo Dev Client + Prebuild**.  
Yarn stays as the package manager. Razorpay is excluded (not in use).

---

## Current State (Audit Summary)

| Item | Finding |
|------|---------|
| **`ios/` / `android/` folders** | Missing from both apps — no manual native changes to preserve |
| **Entry point — customer-app** | `package.json` declares `"main": "src/index.tsx"` but **this file does not exist**. The root is [_layout.tsx](file:///Users/ashishdeotripathi/projects/Quicky/apps/customer-app/src/app/_layout.tsx) |
| **Entry point — store-app** | [src/index.tsx](file:///Users/ashishdeotripathi/projects/Quicky/apps/store-app/src/index.tsx) uses `AppRegistry.registerComponent` |
| **`react-native-config`** | Listed in both `package.json` files but **never imported** anywhere in source code. Safe to drop. |
| **Bundler** | Both apps use `@react-native/metro-config` with manual `watchFolders` for monorepo symlinks |
| **Babel** | Both apps use `module:@react-native/babel-preset` + `babel-plugin-module-resolver` for `@quicky/*` aliases |
| **Package manager** | Yarn v1 workspaces — **not changing** |
| **Turborepo** | [turbo.json](file:///Users/ashishdeotripathi/projects/Quicky/turbo.json) already has `.expo/**` in build outputs |

---

## Proposed Changes

### Step 1 — Dependencies (both apps)

#### [MODIFY] [package.json](file:///Users/ashishdeotripathi/projects/Quicky/apps/customer-app/package.json) (customer-app)

**Add:**
- `expo` (~52)
- `expo-dev-client` (~5.x)
- `expo-status-bar` (~2.x)
- `expo-build-properties` (~0.13)

**Remove:**
- `react-native-config`
- `@react-native/metro-config` (replaced by `@expo/metro-config`)
- `@react-native/eslint-config` (replaced by Expo-compatible lint)

**Pin react/react-native** to Expo SDK 52 compatible versions:
- `react` → `18.3.1`
- `react-native` → `0.76.x` (Expo SDK 52)

Same changes applied to [store-app/package.json](file:///Users/ashishdeotripathi/projects/Quicky/apps/store-app/package.json).

---

### Step 2 — Expo Configuration

#### [NEW] `apps/customer-app/app.json`

```json
{
  "expo": {
    "name": "Quicky",
    "slug": "quicky-customer",
    "version": "1.0.0",
    "scheme": "quicky",
    "platforms": ["android", "ios"],
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "@react-native-firebase/messaging",
      [
        "expo-build-properties",
        {
          "android": {
            "minSdkVersion": 24,
            "compileSdkVersion": 35,
            "targetSdkVersion": 35
          },
          "ios": {
            "deploymentTarget": "15.1"
          }
        }
      ]
    ],
    "android": {
      "package": "com.quicky.customer",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "bundleIdentifier": "com.quicky.customer",
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}
```

#### [NEW] `apps/store-app/app.json`

Same structure, with `slug: "quicky-store"`, `package: "com.quicky.store"`, `bundleIdentifier: "com.quicky.store"`.

---

### Step 3 — Metro Config (both apps)

#### [MODIFY] [metro.config.js](file:///Users/ashishdeotripathi/projects/Quicky/apps/customer-app/metro.config.js)

Replace entirely with Expo's monorepo-aware Metro config:

```js
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all monorepo packages
config.watchFolders = [monorepoRoot];

// Let Metro resolve packages from both app and monorepo node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
```

> [!TIP]
> `@expo/metro-config` handles symlinks, package exports, and all the `unstable_*` flags automatically. This replaces all the manual resolver config we had.

---

### Step 4 — Babel Config (both apps)

#### [MODIFY] [babel.config.js](file:///Users/ashishdeotripathi/projects/Quicky/apps/customer-app/babel.config.js)

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin', // Must be last
    ],
  };
};
```

> [!IMPORTANT]
> The `babel-plugin-module-resolver` aliases are **no longer needed**. Expo's Metro config + Yarn workspaces resolves `@quicky/*` packages natively through the monorepo `node_modules` hoisting.

---

### Step 5 — Entry Points

#### [NEW] `apps/customer-app/App.tsx`

The customer-app currently has no proper entry file. We need to create one:

```tsx
import { registerRootComponent } from 'expo';
import RootLayout from './src/app/_layout';

registerRootComponent(RootLayout);
```

And update `package.json` → `"main": "App.tsx"`

#### [MODIFY] [apps/store-app/src/index.tsx](file:///Users/ashishdeotripathi/projects/Quicky/apps/store-app/src/index.tsx)

Replace `AppRegistry.registerComponent('QuickyStore', () => App)` with:

```tsx
import { registerRootComponent } from 'expo';
// ... rest of the file unchanged ...
registerRootComponent(App);
```

---

### Step 6 — Root package.json Scripts

#### [MODIFY] [package.json](file:///Users/ashishdeotripathi/projects/Quicky/package.json)

Update root-level convenience scripts:

```json
{
  "dev:customer": "yarn workspace @quicky/customer-app dev",
  "dev:store": "yarn workspace @quicky/store-app dev"
}
```

App-level `package.json` scripts change to:
```json
{
  "dev": "expo start --dev-client",
  "android": "expo run:android",
  "ios": "expo run:ios"
}
```

---

### Step 7 — Environment Variables

#### [MODIFY] [turbo.json](file:///Users/ashishdeotripathi/projects/Quicky/turbo.json)

Remove `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` from `globalEnv`.

For the mobile apps, any env vars accessed in JS need the `EXPO_PUBLIC_` prefix. The API server continues to use `dotenv` unchanged.

---

### Step 8 — Cleanup

- Add `android/` and `ios/` to `.gitignore` (Prebuild generates these; they should not be committed).
- Remove any stale lockfile references after dependency swap.

---

## What Does NOT Change

| Item | Status |
|------|--------|
| **Yarn v1 as package manager** | Stays |
| **Turborepo pipeline** | Stays (already has `.expo/**` output) |
| **All source code** in `src/screens/`, `src/stores/`, `src/hooks/` | Untouched |
| **`@quicky/api-client`, `@quicky/ui-kit`, `@quicky/shared-types`, `@quicky/config`** | Untouched |
| **`apps/api/` (Express backend)** | Untouched |
| **Firebase Auth / Messaging JS code** | Untouched — we keep `@react-native-firebase/*`, NOT migrating to `expo-notifications` |

---

## Verification Plan

### After Step 6 (all config changes done):

1. `yarn install` — verify no resolution errors
2. `npx expo prebuild --clean` in `apps/customer-app/` — verify Android/iOS folders generate without errors
3. `npx expo run:android` in `apps/customer-app/` — verify Dev Client builds and launches on emulator
4. `yarn dev:customer` — verify Expo CLI starts, port auto-assigned, hot reload works
5. Repeat steps 2–4 for `store-app`

### Smoke Tests:
- Home screen renders with product cards
- Tab navigation works (Browse / Cart / Profile)
- API calls to `localhost:4000` succeed (api-client still uses same default)

---

## Rollback Plan

1. All work done on a **feature branch** (`feature/expo-dev-client`).
2. If migration fails: `git checkout main` restores everything to the bare RN setup instantly.
3. **"Safe to merge" criteria:**
   - Both apps build and launch via `expo run:android`
   - `expo start --dev-client` connects to the app on emulator
   - Navigation, API calls, and UI rendering all work
   - No regressions in `yarn typecheck` or `yarn lint`
