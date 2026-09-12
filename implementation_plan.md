# UI Redesign: Steep Design System Integration

This plan details the implementation of the new Steep Design System (as specified in `design.md`) across the MicroCredit application, converting it from a basic admin dashboard into an editorial, magazine-like interface.

## User Review Required

> [!WARNING]
> This represents a major layout change. The traditional sidebar navigation will be replaced with a centered, transparent top-navigation bar, and the color palette will shift to an achromatic (black/white/gray) scheme with peach accents.

## Proposed Changes

### Global Configuration

#### [MODIFY] `app/globals.css`
- Replace existing Shadcn HSL variables with the precise HEX tokens and shadows from `design.md`.
- Integrate the `--font-signifier` and `--font-sohne` variables to point to appropriate serif/sans fallbacks.

#### [MODIFY] `tailwind.config.ts`
- Map the new CSS variables (e.g., `ink-black`, `paper-white`, `blush-peach`) to the Tailwind theme colors object so we can use classes like `bg-paper-white` and `text-ink-black`.
- Map the typography scales and spacing units exactly to the spec.

---

### Layout Redesign

#### [MODIFY] `app/(dashboard)/layout.tsx`
- **Current:** Left-aligned sidebar navigation with a `bg-gray-50` content area.
- **New:** A transparent top navigation bar (Logo on the left, Nav Links center, Sign Out text link on the right).
- Content will sit in a max-width `1200px` centered container with a `bg-paper-white` or `bg-fog-white` canvas.
- Remove all borders and shadows from the navigation as per the "whisper-quiet" specification.

---

### Page Migrations (Phase 1)

#### [MODIFY] `app/(dashboard)/dashboard/page.tsx`
- Convert the dashboard metrics into **Stat Cards with Charts** (bold metric in Sohne 20px `#17191c`, minimal aesthetic).
- Use **Floating Product Artifact** styling for tables (border-radius 20px, subtle shadow, `padding 16px 20px 12px 12px`).
- Use the **Signifier** serif for the main page headline.

#### [MODIFY] `app/(dashboard)/loans/page.tsx`
- Update the data table container to the **Neutral Card** spec (`#f2f2f3`, 24px radius, no shadow).
- Apply the **Tag / Category Label** spec for loan statuses (ghost-like, Sohne 14px, `#979799`).

## Verification Plan

### Manual Verification
- Start the dev server and navigate to `/dashboard`.
- Verify the navigation is now a top-bar.
- Ensure the cards and buttons have extreme radii (24px and fully-rounded pills).
- Verify the serif font applies cleanly to main headings.
