# 📚 Traumakorp Bookstore

A polished responsive online bookstore demo with **130 books across 13 categories**.

## Highlights
- 130 curated books, 10 per category
- Search by title or author
- Category browsing and sorting
- Wishlist and shopping cart saved in local storage
- Responsive desktop/mobile design
- Robust Traumakorp logo embedded directly in the HTML plus SVG/PNG assets
- Book-cover lookup through Google Books, with Open Library fallback
- Price cards show a U.S. reference price and can update to a current Google Books U.S. retail price when that API returns one
- Book advisory and customer-support sections

## Run locally
Open `index.html` in a browser. For best API behavior, serve the folder with a simple local web server.

Example:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000`.

## GitHub Pages
Upload the **contents of this folder** to the repository root so that `index.html`, `styles.css`, `app.js`, and `books.js` are all at the top level. Then enable GitHub Pages from the main branch/root directory.

## Contact numbers
The included `555` phone numbers are demo numbers. Replace them with Traumakorp's official support/advisory lines before launch.

## Rights
Book titles, cover images, author names and publisher trademarks belong to their respective rights holders.


## Real book covers

Every catalog title now has automatic real-cover resolution. The storefront matches each title and author against Google Books first and Open Library as a fallback, caches the resolved cover locally in the browser, and reuses it on later visits. This replaces generic placeholders as soon as a verified book-cover image is found.
