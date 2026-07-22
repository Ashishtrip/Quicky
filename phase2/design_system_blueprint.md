# Quicky Design System Blueprint

> [!NOTE]
> **Aesthetic Direction:** Nothing OS meets Quick Commerce (Zepto/Blinkit). 
> **Core Principles:** High-contrast, stark layouts, widget-centric dashboards, transparent freshness, and low-tech-first accessibility for mid-range Android devices.

## 1. Global Design Tokens

### Color Palette
A strict, minimal palette ensuring extreme legibility and emphasizing the "Freshness Meter" as the primary semantic signal.

| Token | Light Mode | Dark Mode | Usage |
| :--- | :--- | :--- | :--- |
| **Background** | `#FFFFFF` (White) | `#000000` (Black) | App backgrounds, main surfaces |
| **Surface** | `#F5F5F5` (Gray 100) | `#121212` (Gray 900) | Cards, widgets, secondary surfaces |
| **Text Primary** | `#000000` (Black) | `#FFFFFF` (White) | Headings, main body copy |
| **Text Secondary**| `#737373` (Gray 500) | `#A3A3A3` (Gray 400) | Subtitles, metadata, inactive states |
| **Borders** | `#E5E5E5` (Gray 200) | `#262626` (Gray 800) | Dividers, structural lines, card borders |
| **Freshness: Green**| `#16A34A` (Green 600) | `#22C55E` (Green 500) | "Fresh Stock" |
| **Freshness: Amber**| `#D97706` (Amber 600)| `#F59E0B` (Amber 500) | "Expiring Soon" (2-3 days) |
| **Freshness: Red** | `#DC2626` (Red 600) | `#EF4444` (Red 500) | "Use Today" (Discounted) |

> [!IMPORTANT]
> **Accessibility Rule:** Color is never the only signal. The Freshness colors must always be paired with an icon or clear text label (e.g., a "leaf" icon for Fresh, a "clock" icon for Soon, a "tag" icon for Use Today).

### Typography System
Optimized for high legibility in both English and Hindi. Inspired by Nothing OS's stark geometric feel mixed with highly readable body text.

- **Primary Font:** *Inter* or *Roboto* (Excellent multi-lingual support, clean sans-serif).
- **Display Font (Optional):** *Space Grotesk* or *NDot* for large price tags or hero metrics (adds the Nothing OS industrial aesthetic).

| Role | Size | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | 32px | Bold (700) | 1.2 | Hero prices, major dashboard numbers |
| **Heading 1** | 24px | SemiBold (600) | 1.3 | Screen titles, section headers |
| **Heading 2** | 20px | SemiBold (600) | 1.3 | Card titles, component headers |
| **Body Large** | 16px | Regular (400) | 1.5 | Primary readable text, product names |
| **Body Small** | 14px | Regular (400) | 1.5 | Metadata, secondary details, Hindi support |
| **Badge/Label**| 12px | Bold (700) | 1.2 | Freshness tags, small UI labels, UPPERCASE |

### Spacing & Grid (8pt System)
A rigid spacing system ensures the stark, widget-centric layout feels intentional and structured.

- `spacing-xs`: 4px
- `spacing-sm`: 8px
- `spacing-md`: 16px (Default padding/margin)
- `spacing-lg`: 24px
- `spacing-xl`: 32px
- `spacing-2xl`: 48px

### Border Radii & Elevations
Embracing the "Nothing OS" brutalist/industrial vibe while maintaining mobile usability.

- **Main Containers/Cards:** `0px` or `4px` (Sharp, widget-like rectangles).
- **Buttons/Badges:** `9999px` (Pill shapes to heavily contrast with the sharp layout and draw the eye).
- **Elevations (Shadows):** **No soft shadows.** Soft shadows stutter on mid-range Androids.
  - *Primary Interaction:* Solid borders (`1px solid #000`) or hard-edged drop shadows (e.g., `box-shadow: 4px 4px 0px #000` for a pressed/retro-tech feel).

---

## 2. Core Component Architecture

### The "Freshness Meter" (Signature Component)
This is Quicky's moat. It must be highly legible.
- **Visual:** A pill-shaped badge (`border-radius: 9999px`).
- **States:**
  - **Fresh Stock:** Green background, White text. Icon: `✓` or `Leaf`.
  - **Expiring Soon:** Amber background, Black text. Icon: `!` or `Clock`.
  - **Use Today:** Red background, White text. Icon: `%` or `Tag`.
- **Placement:** Always visible on the Product Card (top-left or next to price) and prominent on the Product Detail page.

### Product Cards (Widget-Centric)
Designed as stark rectangles that look like data widgets.
- **Structure:** `1px` high-contrast border, white background.
- **Content:** Product Image (optimized, no background), Product Name (Body Large), Freshness Meter (Badge), Price, and a high-contrast "ADD" button.
- **Tap Target:** The entire card is clickable, but the "ADD" button has a specific `48x48px` minimum tap area.

### Buttons (Low-Tech First)
Designed for thick fingers and non-technical store owners (WhatsApp-level comfort).
- **Primary Action:** Solid Black fill, White text, Pill shape. Minimum height: `48px`.
- **Secondary Action:** Transparent background, `1px` Black border, Black text.
- **Store App 3-Tap Flow Buttons:** Massive, half-screen width tap targets for selecting expiry buckets, eliminating mis-taps.

### Category Select & Filters
- **Freshness Filter (Customer App):** A sticky segmented control or horizontal pill list at the top. Three explicit states: `Use Today`, `Fresh Stock`, `Any` (Default). Never hidden in a dropdown.

---

## 3. Layout & Grid System

- **Device Target:** Android Mid-Range (e.g., Redmi 10C).
- **Grid:** 4-column fluid grid.
- **Margins:** `16px` outer margins on mobile screens.
- **Gutters:** `16px` between widgets/cards.
- **Bottom Navigation:** Stark white background, top border (`1px #E5E5E5`), minimal icons with explicit text labels below them. No complex floating action buttons.

---

## 4. Macro-Interactions & Animation Guidelines

> [!WARNING]
> **Performance Constraint:** Heavy animations (blurs, physics-based springs, complex Lottie files) will stutter on target devices and destroy the perception of "speed" and "trust."

- **Transitions:** Fast and linear. Maximum `150ms - 200ms`.
- **State Changes:** Rely on color shifts (e.g., button turning gray on press) rather than scaling (`transform: scale`) to prevent layout shifts and jank.
- **Loading States:** High-contrast skeleton screens (stark gray boxes) instead of complex spinners.
- **Empty/Error States:** Large, friendly iconography with plain-language text (Hindi/English). Always provide a single, obvious recovery action (e.g., "Tap to Retry").
- **Cart Separation:** When an item is added to the cart, items seamlessly group into "Use Today" vs. "Fresh Stock" sections without aggressive reshuffling animations.

---

## 5. Next Steps for Implementation

1. **Setup React Native/Expo Environment:** Initialize the app with Tailwind CSS (NativeWind) using these exact color and spacing tokens.
2. **Component Library:** Build the `FreshnessBadge`, `ProductCard`, and `Button` components in isolation.
3. **Screen Scaffolding:** Scaffold the Customer App Home Screen and the Store App 3-Tap Tagging flow using these widgets.
