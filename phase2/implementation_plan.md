# Phase 2 — Design System Blueprint Implementation

**Goal:** Apply the Nothing OS design system tokens defined in [design_system_blueprint.md](file:///Users/ashishdeotripathi/projects/Quicky/phase2/design_system_blueprint.md) to every Phase 2 component, screen, and navigator. All existing code works functionally — this is a **visual overhaul** to enforce the stark, high-contrast, widget-centric aesthetic.

---

## User Review Required

> [!IMPORTANT]
> **Scope confirmation:** This plan modifies _only styling and visual tokens_ across the existing Phase 2 codebase. No functional logic (cart store, API client, hooks, services) will change. All tests should continue to pass since they assert on behaviour, not pixel values.

> [!IMPORTANT]
> **Colors:** The blueprint mandates updated Freshness colors (`#16A34A`, `#D97706`, `#DC2626`) replacing the current Phase 1 colors (`#27AE60`, `#F2994A`, `#EB5757`). This is an intentional change for WCAG contrast compliance on the stark white/black backgrounds. The existing `FreshnessBadge.test.tsx` asserts specific hex values — it will be updated.

---

## Proposed Changes

### 1. Design Tokens Module — `packages/ui-kit/src/theme/`

Create a centralised design tokens file so all components reference a single source of truth.

#### [NEW] [tokens.ts](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/theme/tokens.ts)
Exports `Colors`, `Typography`, `Spacing`, `Radii`, and `Shadows` as constants matching the blueprint.

#### [NEW] [index.ts](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/theme/index.ts)
Barrel export of the theme module.

---

### 2. Component Restyling — `packages/ui-kit/src/components/`

Every component gets its hardcoded hex values replaced with token references and the visual language shifted from rounded/blue to sharp/black.

#### [MODIFY] [FreshnessBadge.tsx](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/components/FreshnessBadge.tsx)
- Update hex colors to new blueprint values (`#16A34A`, `#D97706`, `#DC2626`)
- Add icon indicators (dot) alongside text labels (colour-blind safe per blueprint)
- Change from border-outline style to filled pill badge (`borderRadius: 9999`)

#### [MODIFY] [FreshnessBadge.test.tsx](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/components/FreshnessBadge.test.tsx)
- Update asserted hex values to new blueprint palette

#### [MODIFY] [ProductCard.tsx](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/components/ProductCard.tsx)
- Card: `borderRadius: 4`, `borderWidth: 1`, `borderColor: #000`, no soft shadows
- Add button: solid black fill, white text, pill shape (`borderRadius: 9999`)
- Stepper: high-contrast black/white theme
- Discount badge: `#DC2626` (red 600)
- Replace emoji placeholder with styled text icon
- All font sizes/weights match typography system

#### [MODIFY] [FreshnessFilter.tsx](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/components/FreshnessFilter.tsx)
- Active colors: green `#16A34A`, red `#DC2626`, neutral `#000`
- Pill shape: `borderRadius: 9999`
- Background tints for active states
- `minHeight: 48` for low-tech-first targets

#### [MODIFY] [CategoryChip.tsx](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/components/CategoryChip.tsx)
- Active state: solid black fill, white text (not blue)
- Inactive: `#F5F5F5` background, `#E5E5E5` border
- Pill shape: `borderRadius: 9999`

#### [MODIFY] [CartItemCard.tsx](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/components/CartItemCard.tsx)
- Card: `borderRadius: 4`, `borderWidth: 1`, `borderColor: #E5E5E5`
- Stepper buttons: black outline style
- Replace trash emoji with text `✕`
- Font sizing per typography tokens

#### [MODIFY] [CartSectionHeader.tsx](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/components/CartSectionHeader.tsx)
- Updated accent colors to new palette
- Sharp corner radius: `borderRadius: 4`

#### [MODIFY] [Button.tsx](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/components/Button.tsx)
- Primary: solid `#000` fill, white text, `borderRadius: 9999`
- Secondary: transparent, `1px #000` border, black text, `borderRadius: 9999`
- Remove spring scale animation (per blueprint: use opacity instead, avoid layout-shifting transforms on mid-range)
- `minHeight: 48`

#### [MODIFY] [BucketSelector.tsx](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/components/BucketSelector.tsx)
- Updated accent colors to new palette
- Sharp corners on buttons: `borderRadius: 4`
- Larger touch targets: `paddingVertical: 24`

#### [MODIFY] [index.ts](file:///Users/ashishdeotripathi/projects/Quicky/packages/ui-kit/src/index.ts)
- Add export for `theme/` module

---

### 3. Screen Restyling — `apps/customer-app/src/screens/`

#### [MODIFY] [HomeScreen.tsx](file:///Users/ashishdeotripathi/projects/Quicky/apps/customer-app/src/screens/HomeScreen.tsx)
- Background: `#FFFFFF` (pure white, not `#FAFAFA`)
- Header: bold black text, use `Space Grotesk`-style weight
- Loading spinner: black, not blue
- Error/empty states: no emojis as icons → use styled text
- Grid gutters: `16px`

#### [MODIFY] [CartScreen.tsx](file:///Users/ashishdeotripathi/projects/Quicky/apps/customer-app/src/screens/CartScreen.tsx)
- Background: `#FFFFFF`
- Order summary card: `borderRadius: 4`, `borderWidth: 1`, `borderColor: #E5E5E5`, no shadow
- Checkout bar: solid black background, white text
- Checkout button: `#000` fill, pill shape, `opacity: 0.4` when disabled
- Replace emojis with styled text
- Updated accent colors

---

### 4. Navigator Restyling — `apps/customer-app/src/navigation/`

#### [MODIFY] [AppNavigator.tsx](file:///Users/ashishdeotripathi/projects/Quicky/apps/customer-app/src/navigation/AppNavigator.tsx)
- Tab bar: `backgroundColor: #FFFFFF`, `borderTopColor: #E5E5E5`, `1px` border
- Active tint: `#000000` (black, not blue)
- Inactive tint: `#737373`
- Replace emoji tab icons with simple SVG-style text glyphs (`⌂`, `☰`, `●`)
- Badge: `backgroundColor: #DC2626`

---

## File Tree Summary

```
packages/ui-kit/src/
├── theme/
│   ├── tokens.ts              [NEW]    — all design tokens
│   └── index.ts               [NEW]    — barrel export
├── components/
│   ├── FreshnessBadge.tsx      [MODIFY] — new colors + filled pill
│   ├── FreshnessBadge.test.tsx [MODIFY] — updated hex assertions
│   ├── ProductCard.tsx         [MODIFY] — stark card + black CTA
│   ├── FreshnessFilter.tsx     [MODIFY] — new colors + pill shape
│   ├── CategoryChip.tsx        [MODIFY] — black active + pill shape
│   ├── CartItemCard.tsx        [MODIFY] — sharp card + high-contrast
│   ├── CartSectionHeader.tsx   [MODIFY] — new palette + sharp corners
│   ├── Button.tsx              [MODIFY] — black primary + pill shape
│   └── BucketSelector.tsx      [MODIFY] — new palette + sharp corners
└── index.ts                    [MODIFY] — export theme

apps/customer-app/src/
├── screens/
│   ├── HomeScreen.tsx           [MODIFY] — white bg + black accents
│   └── CartScreen.tsx           [MODIFY] — stark checkout + no shadows
└── navigation/
    └── AppNavigator.tsx         [MODIFY] — black tint + no emojis
```

---

## Verification Plan

### Automated Tests
- `yarn workspace @quicky/ui-kit test` — update `FreshnessBadge.test.tsx` hex assertions, all others should pass since they test callbacks/state, not colors
- `yarn workspace @quicky/api test` — no changes, should pass (9/9)
- `yarn workspaces run typecheck` — all theme tokens are typed constants, no breakage expected

### Manual Verification
1. Visual inspection of each component against the design system blueprint
2. Confirm high-contrast readability on white background for all text
3. Verify all freshness colors pair with text labels (a11y)
4. Confirm `minHeight: 48` on all interactive elements (low-tech-first)
5. Verify no soft shadows, no spring scale animations (mid-range Android safe)
