---
name: ui-ux-design
description: Design principles, dark theme tokens, responsive layouts, and animations for Dizi&Film Takip.
---

# UI/UX & Design Guidelines

## 1. Color Palette & Typography
* **Base Background**: `#0B0C0E` (Ultra-dark slate)
* **Surface / Cards**: `#14171D` with border `#232833` (Hover: `#2B313E`)
* **Primary Accent**: `#E63946` (Cinema Crimson)
* **Secondary Accents**:
  * Amber: `#F59E0B` (Watching state, stars, highlights)
  * Emerald: `#10B981` (Watched state, success indicators)
  * Blue: `#3B82F6` (Plan to watch state)
  * Purple: `#8B5CF6` (Special collections)
* **Rating Histogram**: Letterboxd style `.font-baskerville` serif typography for numeric presentation.

## 2. Responsive Layout System
* **Desktop (>= 1024px / 1280px)**: 3-column layout:
  * Left: `LeftSidebar` (User profile card, tabs, watchlist counters, custom collections)
  * Center: Main Content (`discover`, `watchlist`, `tracker`, `calendar`, `activity`, `collections`)
  * Right: `SocialFeedSidebar` (Live social stream, quick reactions)
* **Mobile (< 768px)**:
  * Bottom navigation: `MobileBottomNav`
  * Drawer menu: `MobileSidebarDrawer`
  * Dedicated mobile search: `MobileSearchView`
  * Full-width cards with optimized touch targets.

## 3. Motion & Transitions
* Use `motion/react` (`AnimatePresence`, `motion.div`) for smooth view transitions, modal appearances, and interactive button hover effects.
* Always lock `document.body.style.overflow = 'hidden'` when modals are active.
