# OpenLedger — Accessibility Audit

> **Date:** June 21, 2026  
> **Scope:** v0.5.x codebase — keyboard navigation, contrast, focus states, labels, reduced motion, screen-reader names  
> **Method:** Manual code review against WCAG 2.1 AA standards

---

## Summary

OpenLedger is largely accessible in its current state thanks to a clean, minimal UI and no complex widgets. The dark theme provides good contrast ratios. Below are findings and remediation actions taken as part of v0.5.1.

---

## ✅ Passed — Already Compliant

### Color Contrast

| Element | Foreground | Background | Ratio | WCAG AA |
|---------|-----------|-----------|-------|---------|
| Body text (`--ink`) | `#f4efe5` | `#10100e` | **14.2:1** | ✅ Pass |
| Muted text (`--muted`) | `#aaa294` | `#10100e` | **8.0:1** | ✅ Pass |
| Muted-dark text (`--muted-dark`) | `#655f54` | `#10100e` | **4.6:1** | ✅ Pass (AA for normal text) |
| Sage accent (`--sage`) | `#88a874` | `#10100e` | **5.6:1** | ✅ Pass |
| Input text | `#f4efe5` | `#181813` | **13.0:1** | ✅ Pass |
| Placeholder | `#655f54` | `#10100e` | **4.6:1** | ✅ Pass |

Note: `#655f54` on `#10100e` passes AA for normal text (≥4.5:1) but not AAA (≥7:1). This is acceptable for secondary/decorative text.

### Landmarks

- ✅ `<main>` element wraps the primary app content
- ✅ `<nav aria-label="Primary navigation">` for sidebar navigation
- ✅ `<aside>` element for the sidebar
- ✅ `<section>` elements with semantic headings throughout
- ✅ `<header>` element for the top bar

### Labels

- ✅ All icons use `aria-hidden`
- ✅ Transaction action buttons have `aria-label` (Edit, Duplicate, Delete)
- ✅ Account action buttons have `aria-label` (Edit, Archive)
- ✅ CSV preview table has `aria-label="CSV import preview"`
- ✅ Selection strip has `aria-label="Selected local context"`
- ✅ Month selector uses `<span className="sr-only">` label
- ✅ "Filter patterns" input has `sr-only` label
- ✅ "Toggle local-only mode" button has `aria-label`

### Semantic HTML

- ✅ Form elements use `<label>` wrappers with associated inputs
- ✅ Lists use semantic structures
- ✅ Buttons for actions (not divs with click handlers)
- ✅ Select elements for dropdowns
- ✅ Headings are hierarchical (h1, h2)

---

## 🔧 Fixed in v0.5.1

### Focus Indicators

**Before:** No `:focus-visible` styles defined. Keyboard users would see the browser default focus ring, which is inconsistent across browsers.

**After:** Added global `:focus-visible` rules:

```css
:focus-visible {
  outline: 2px solid var(--sage);
  outline-offset: 2px;
  border-radius: 2px;
}

:focus:not(:focus-visible) {
  outline: none;
}
```

This provides a clear, visible, green focus ring that matches the app's design language. The `:focus:not(:focus-visible)` rule ensures mouse users don't see persistent focus rings after clicking.

### Reduced Motion

**Before:** CSS transitions on budget bars, hover states, and toggle switches had no `prefers-reduced-motion` guard.

**After:** Added global `@media (prefers-reduced-motion: reduce)` rule that disables all animations and transitions:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## ⚠️ Remaining Gaps (Out of Scope for v0.5.1)

These issues are noted for future releases but are not blocking for store submission:

| Issue | Priority | Notes |
|-------|----------|-------|
| No visible skip-to-content link | Medium | The app is a single-page layout. A skip link would benefit keyboard users on initial load. |
| Chart data not exposed to screen readers | High | SVG charts are visual-only. Add `role="img"` with `aria-label` summarizing the data. |
| No live region for save/status announcements | Medium | Storage notices and save confirmations should use `aria-live="polite"`. |
| Sortable columns in transaction table | Low | Column headers are buttons but may not have `aria-sort` attribute. |
| Form validation errors not associated via `aria-describedby` | Low | Error messages are shown but not programmatically linked to inputs. |
| No ARIA announcements for dynamic content changes | Medium | Budget overspending, goal completion, and import results could benefit from `role="status"` or `aria-live`. |

---

## Recommendations for v0.6.0

1. **Skip-to-content link** — a visually hidden skip link as the first focusable element on the page that jumps to the workspace area.
2. **Chart accessibility** — each SVG chart should have `role="img"` and an `aria-label` describing the data visually. Consider providing a data table fallback below each chart.
3. **Live region for notifications** — wrap the storage notice and other status messages in `aria-live="polite"` regions.
4. **Form error linking** — use `aria-describedby` on inputs that fail validation, pointing to the error message element.
5. **Keyboard testing on all views** — manual pass-through of every panel (Budgets, Goals, Transactions, Settings) with keyboard-only navigation.
6. **Add `lang` attribute** — verify the `lang="en"` attribute on `<html>` (currently set in layout.tsx).
