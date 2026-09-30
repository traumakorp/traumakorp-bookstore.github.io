# Price & Cover Notes

Traumakorp displays a reference price for each selected U.S. edition. Actual selling prices can vary by edition, seller, promotion, taxes, and availability.

When the storefront is online, it attempts to retrieve book metadata from the Google Books API. If Google Books returns a U.S. USD `retailPrice`, the card changes its label to **Google Books retail** and displays that returned price. Google Books documents both `listPrice` and `retailPrice` fields in the Volumes API.

For cover artwork, the storefront first checks Google Books image metadata. If that does not return a usable cover, it can fall back to Open Library search/cover services. If neither is available, the site keeps a built-in Traumakorp placeholder cover, so no card appears broken.

Examples of publisher-verified prices used as reference checks during this project include:
- **Atomic Habits — Hardcover $27.00** (Penguin Random House)
- **The Love Hypothesis — Paperback $16.00** (Penguin Random House, original paperback edition)
- **The Seven Husbands of Evelyn Hugo — Trade Paperback $17.00** (Simon & Schuster)

Because prices change, verify final checkout prices with your actual commerce/inventory provider before accepting orders.
