# Traumakorp Bookstore

A polished responsive bookstore storefront for **Traumakorp**.

## Included
- 64 books across 8 categories
- Search, category filtering, and price/title sorting
- Shopping cart + wishlist interactions
- Responsive desktop/mobile design
- Traumakorp logo optimized below 1 MB
- Current retail-price references (checked Sept. 29, 2026)
- Real book-cover lookup through the Open Library Search + Covers APIs, with local fallback artwork so images never appear broken
- Book Advisory: +1 (212) 555-0136
- Customer Support: +1 (212) 555-0184

> The 555-01xx phone numbers are fictional placeholders for demo use. Replace them with your official business numbers before launch.

## Files
- `index.html` — storefront
- `styles.css` — visual design and responsive layout
- `books.js` — 64-book catalog
- `app.js` — search, filters, live cover lookup, cart and wishlist
- `assets/traumakorp-logo.webp` — optimized logo
- `PRICE_SOURCES.md` — retailer source notes

## Deploy
Upload all files to the root of your GitHub repository and enable GitHub Pages from the repository settings.

## Cover images
The site looks up cover art from Open Library when the page is online. If a matching cover cannot be retrieved, Traumakorp's local styled fallback cover remains visible.

## Important
Prices can change at any time. Before accepting live orders, connect a real inventory/payment backend and replace demo contact details.
