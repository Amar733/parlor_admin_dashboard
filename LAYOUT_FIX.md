# Dashboard Layout & Horizontal Scroll Fix Reference

This document outlines the standard approach for fixing horizontal scroll issues in the dashboard where the entire page (including sidebar and header) scrolls, instead of just the internal table or content.

## The Problem
In a flex-based dashboard layout, a child component (like a large table) with a `min-width` can "push" its parent containers. Because flex items have a default `min-width: auto`, they will refuse to shrink smaller than their content, eventually blowing out the width of the entire dashboard and causing a global horizontal scrollbar.

## The Solution (Three-Step Implementation)

### 1. Update the Main Dashboard Layout
Ensure the main content area is allowed to shrink smaller than its content.

**File:** `app/dashboard/layout.tsx`
```tsx
// 1. Add min-w-0 to the flex container wrapping the main content
<div className="flex flex-1 flex-col min-w-0">
  
  // 2. Add overflow-x-hidden to the <main> tag to prevent blowout
  <main className="flex-1 p-4 sm:px-6 sm:py-4 overflow-x-hidden">
    {children}
  </main>
</div>
```

### 2. Update the Page-Level Container
Constrain the page's root element so it doesn't expand beyond its parent.

**File:** `app/dashboard/your-page/page.tsx`
```tsx
return (
  <div className="w-full max-w-full overflow-x-hidden">
    {/* Page Content */}
    <Card className="w-full overflow-hidden">
      <CardContent className="w-full overflow-hidden">
        {/* Table Wrapper below */}
      </CardContent>
    </Card>
  </div>
);
```

### 3. Localize the Scroll to the Table
Force the specific element that needs scrolling (the table) to handle its own overflow.

**File:** `app/dashboard/your-page/page.tsx`
```tsx
<div className="w-full overflow-x-auto custom-scrollbar">
  {/* Set a min-width here to prevent column squashing */}
  <div className="min-w-[1100px]">
    <Table>
      {/* Table Content */}
    </Table>
  </div>
</div>
```

## Checklist for Future Fixes
- [ ] Does the flex parent of the content have `min-w-0`?
- [ ] Does the `<main>` or wrapper have `overflow-x-hidden`?
- [ ] Is the `Card` or container constrained with `w-full`?
- [ ] Is the table itself wrapped in a `div` with `overflow-x-auto`?
- [ ] Is the `min-width` applied only to the inner table wrapper, and not its parents?
