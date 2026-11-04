# TURMS · Account Section (UX Revamp)

A React + TypeScript + Vite build of the **"Shopify – Account Page (urturms) Design"** Figma file. It covers the desktop screens, the Edit Order (draft) flow and the mobile frames.

## Run it

```bash
npm install
npm run dev        # http://localhost:5175 → redirects to /account/orders (default)
npm run build      # type-check + production build into dist/
```

## Screens and routes

**Orders is the landing section.** Opening the site (`/`, `/account`) or refreshing any section page (Profile, Address, Chat with us, FAQs) always lands on **Orders**, with Orders selected in the menu. Order and tracking links (`/account/orders/…`, including `?status=` filters) open where they point. Moving between sections inside the app is unaffected; to change this, edit `LANDING` and `SECTION_PAGES` at the top of `src/App.tsx`.

| Route | Figma screen |
| --- | --- |
| `/account/orders` | Order History & Status: accordions, `+N more`, draft orders ("Edit Order Details" and "Draft Saved") |
| `/account/profile` | Profile section: editable form with validation, Save/Cancel when edited, and a prompt if you leave with unsaved changes |
| `/account/addresses` | Address section: default address first, Home/Work/Other tags, and quiet Edit · Remove · Set as Default actions on each card; "Add New Address" button |
| `/account/orders/:orderId` | Order details: Overall Shipment Info, Total Products, Order Summary, Buy Again (delivered orders) |
| `/account/orders/:orderId/items/:itemId` | AWB / shipment page: delivered, failed (Reattempt) and in-transit variants, timeline that opens with "View in detail" and closes with "Hide Details", star rating, Initiate Return, copy AWB |
| `/account/chat`, `/account/faqs` | Sidebar destinations (not in the Figma file; built in the same visual language) |

"Explore Our New Arrivals" scrolls on its own on every page, and every rail also has round **‹ ›** buttons next to its title for moving one product at a time. That covers Profile, Address, Orders, order details and every tracking page, on desktop and mobile. Going back from the first product wraps to the last, and using the buttons pauses the auto-scroll for 5 seconds. The buttons are hidden when all the products already fit. It moves one card about every 4 seconds with an eased slide, and loops without a visible jump. It pauses while you hover over it or use the keyboard on it. It waits 5 seconds after you drag, swipe or scroll it, and it pauses when it's off-screen or the tab is hidden. It stays still if the system is set to reduce motion, and doesn't move when all the cards fit. The timing is set in `src/hooks/useAutoScroll.ts`, and `autoPlay={false}` on `<NewArrivals>` turns it off.

**Orders** (formerly "Order Details") shows a small grey count pill with the number of orders, on desktop and mobile. It caps at 99+ and matches the count pill next to the "Order History & Status" title. It's the length of the order list (`accountService.getOrders()`), drafts included. It's hidden while loading, on an error, or when there are 0 orders. Screen readers hear "Orders, 5 orders".

**Order History & Status** is a single card: the title and the order list sit together with no gap between them.
- **Order count:** a small grey pill next to the title shows the total number of orders (drafts included, so it matches the Orders badge in the menu). It stays the total when a filter is on, because the filtered count shows in the "Showing X of Y" line. It's hidden while loading, on an error, or with no orders. Screen readers read it as "(5 orders)". On phones the title shrinks slightly so the pill and the filter stay on the same line, and below 380px wide the filter shows only its icon.
- **Status filter:** the title row has a filter on the right with All, In-Transit, Delivered, Failed, Returned and Draft. Each option shows how many orders it matches, and options with 0 are greyed out. An order counts for a status if any item in it has that status. The choice is kept in the page address (`?status=failed`), so it survives a refresh, the back button and sharing a link. When a filter is on, the list shows "Showing X of Y orders · Clear filter", and a filter with no matches shows an empty state with a "Show all orders" button. The filter works with the keyboard (arrow keys, Enter, Esc).
- **Order link:** the link on each placed order reads **View Full Order (N)**, where N is the number of items in that order (quantities added up, the same as "Total Products" on the order page). It opens the full order page: shipment info, delivery address, every item and the payment summary. Screen readers hear the full description, e.g. "View full order #521438: 3 items, shipment, delivery address and payment summary". Draft orders keep "Edit Order Details".
- **One order open at a time:** opening an order closes the one that was open, and clicking an open order closes it. If closing an order above makes the newly opened one jump out of view, the page scrolls gently to bring its header back to the top. Changing the filter closes everything.
- **Status on each order row:** the row shows status badges built from the items inside it. If every item has the same status, the row shows one badge (Delivered, In-Transit or Failed). If the items differ, the row shows one badge per status with a count (e.g. "2 Failed" · "1 Delivered"), with problems first. If a return has been started, the row adds "1 Return Requested". On mobile the badges sit under the order date.

**Managing addresses**
- **Add / Edit** opens a form dialog. On mobile it's a bottom sheet with Cancel and Save buttons fixed at the bottom, within thumb reach.
  - Fields: full name, mobile number (with +91 shown), flat or house, area or landmark (optional), PIN code, city, state (picked from a list of states and union territories), country (fixed to India), a Home/Work/Other tag, and a "Make this my default address" box.
  - Checks: name required; a 10-digit mobile number starting with 6–9; a 6-digit PIN code; state required. Problems show when you leave a field or press Save, and the first problem field gets focus.
  - Closing with unsaved changes (Esc, tapping outside or the X) asks before discarding them.
  - Your first address always becomes the default. A default address can't be un-set; you choose another one as default instead.
- **Remove** asks first in a confirmation dialog. The dialog shows the address being removed. If it's the default, it says which address will become the default next. Cancel, Esc or tapping outside keeps the address; **Remove** deletes it and shows a success toast.
- **Set as Default** updates straight away, moves that card to the top and shows a success toast.
- All of these go through `accountService` (`createAddress`, `updateAddress`, `deleteAddress`, `restoreAddress`, `setDefaultAddress`). Each one notes the Shopify Customer Account API mutation to swap in.

**Account sidebar (desktop and tablet):** a profile card with initials, full name, email and phone; the whole card opens Profile, and on hover the initials turn into a pencil. Below it is one joined menu (Orders, Profile, Address, Chat with us, FAQs) where the selected item stays white with a sliding red marker, then Logout. The name and counts update straight away when the profile or addresses change. Code: `src/components/layout/ProfileSidebar.tsx`.

Below 768px the layout switches to the mobile frames: a compact header, a scrolling announcement bar, and a bottom bar ("User Account / …") that opens the account menu sheet.

The mobile account menu is laid out for one-handed use with the right thumb:
- The open/close button sits at the bottom-right. Opening and closing use the same spot, and the whole bottom bar can be tapped.
- The sheet grows upward from the bar. The most-used item, **Orders**, sits at the bottom, closest to the thumb, followed upward by Profile, Address, Chat with us and FAQs. The order comes from `accountNav` in `src/components/layout/navigation.ts` and is reversed on mobile.
- Rare actions are at the top, furthest from the thumb and behind a divider: Back to Shopping, and Logout, which still asks for confirmation.
- Rows are 48px tall. The sheet closes with a swipe down, a tap outside, the X button or Esc. When it opens, it scrolls to the bottom and puts keyboard focus on the current page.

## Test data and edge-case states

The mock orders cover every status: draft, all delivered, mixed failed + delivered, in transit, and a cash-on-delivery order with 6 items, a discount and a shipping fee.
To force a state, add a query parameter to any account URL:

- `?state=loading`: skeletons
- `?state=empty`: empty states (no orders, no addresses)
- `?state=error`: error state with a Try again button; saving the profile also fails

Bad IDs (e.g. `/account/orders/999`) show a "not found" state.

## Structure

```
src/
  assets/icons, assets/images   ← exported from Figma (SVG icons, WebP images)
  styles/tokens.css             ← Figma variables as CSS custom properties
  data/                         ← types, mock data, accountService (the only data layer)
  components/ui                 ← Button, Badge, Field, Panel/Strip, Modal, Toast, Skeleton…
  components/layout             ← Announcement bar, header, footer, account sidebar + mobile sheet
  components/orders|product|address
  pages/
```

## Going live (Shopify)

All data goes through `src/data/accountService.ts`. Each function names the Customer Account API query or mutation that replaces it. The UI types (`src/data/types.ts`) follow that API's shape.

## Where the build differs from Figma

These changes make the screens consistent with each other:

- The "Order History & Status" title uses the 3D box illustration on every screen. That matches the mobile and Edit Order Flow frames.
- The summary card is always called "Order Summary". One Figma frame says "Total Order Summary".
- The shipment page always uses an "Order Timeline" strip above the item and timeline.
- The duplicate second "ABOUT US" in the header nav is now "CONTACT US".
- Prices and totals are calculated from line items, so "Total Products" and "Order Total" always agree.
- Weekdays come from the real calendar date, so 27 Jun 2025 shows as Fri.
