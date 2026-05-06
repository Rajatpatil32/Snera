# SNERA — Full-Stack E-commerce

Premium fashion e-commerce platform built with React + Node.js + MongoDB.

---

## 🗂 Project Structure

```
snera/
├── backend/                  # Node.js + Express API
│   ├── models/
│   │   ├── Admin.js          # Admin user model
│   │   ├── Product.js        # Product model (slug, images, sizes)
│   │   └── Order.js          # Order model (customer, address, items, tracking)
│   ├── routes/
│   │   ├── auth.js           # POST /api/auth/login, GET /api/auth/verify
│   │   ├── products.js       # CRUD /api/products
│   │   ├── orders.js         # CRUD /api/orders, GET /api/orders/track/:num
│   │   ├── upload.js         # POST /api/upload (single & multiple images)
│   │   └── sitemap.js        # GET /api/sitemap.xml
│   ├── middleware/
│   │   └── auth.js           # JWT auth middleware
│   ├── uploads/              # Uploaded product images (auto-created)
│   ├── server.js             # App entry point
│   ├── .env.example          # Environment variables template
│   └── package.json
│
└── frontend/                 # React SPA
    ├── public/
    │   ├── index.html        # Full SEO meta + structured data
    │   ├── manifest.json
    │   └── robots.txt
    └── src/
        ├── components/
        │   ├── Navbar.jsx        # Fixed nav with cart icon + mobile menu
        │   ├── Footer.jsx        # Newsletter + links
        │   ├── CartDrawer.jsx    # Slide-in cart with qty controls
        │   ├── ProductCard.jsx   # Hover card with quick-view
        │   ├── SEOHead.jsx       # Dynamic meta + OG + JSON-LD
        │   └── Toast.jsx         # Cart feedback notifications
        ├── context/
        │   └── CartContext.jsx   # Persistent cart (localStorage)
        ├── hooks/
        │   └── useReveal.js      # IntersectionObserver scroll animations
        ├── pages/
        │   ├── HomePage.jsx          # Hero, featured products, categories
        │   ├── ShopPage.jsx          # Filtered product listing + pagination
        │   ├── ProductDetailPage.jsx # Dynamic [slug] page with size selector
        │   ├── CheckoutPage.jsx      # Guest checkout with validation
        │   ├── OrderSuccessPage.jsx  # Post-order confirmation
        │   ├── TrackOrderPage.jsx    # Order tracking with courier redirect
        │   └── admin/
        │       ├── AdminLoginPage.jsx        # Admin login
        │       ├── AdminLayout.jsx           # Protected layout + sidebar
        │       ├── AdminDashboard.jsx        # Stats + recent orders
        │       ├── AdminOrdersPage.jsx       # All orders with status filter
        │       ├── AdminOrderDetailPage.jsx  # Manage single order
        │       ├── AdminProductsPage.jsx     # Product list with actions
        │       └── AdminProductFormPage.jsx  # Create/edit product + upload
        ├── utils/
        │   └── api.js            # Axios instance + helpers
        ├── App.jsx               # Router + layout setup
        ├── index.js
        └── index.css             # Full design system (tokens, components, utilities)
```

---

## ⚡ Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env       # Edit with your MongoDB URI + secrets
npm install
npm run dev                # Starts on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm start                  # Starts on http://localhost:3000
```

> The `proxy` field in `frontend/package.json` is set to `http://localhost:5000`, so all `/api` calls proxy correctly in development.

---

## 🔐 Admin Panel

Navigate to: `http://localhost:3000/admin`

Default credentials (from `.env`):
- **ID:** `admin`
- **Password:** `snera@admin123`

> **Change these before going live.**

Admin features:
- View all orders, filter by status
- Update order status + add tracking ID
- Add/edit/archive products
- Upload product images (stored in `backend/uploads/`)
- Toggle featured, active/hidden, sold-out sizes

---

## 🌐 API Reference

| Method | Endpoint                       | Auth    | Description              |
|--------|-------------------------------|---------|--------------------------|
| POST   | /api/auth/login               | —       | Admin login              |
| GET    | /api/auth/verify              | JWT     | Verify token             |
| GET    | /api/products                 | —       | List products (filters)  |
| GET    | /api/products/:slug           | —       | Single product           |
| POST   | /api/products                 | JWT     | Create product           |
| PUT    | /api/products/:id             | JWT     | Update product           |
| DELETE | /api/products/:id             | JWT     | Archive product          |
| GET    | /api/products/admin/all       | JWT     | All products (admin)     |
| POST   | /api/orders                   | —       | Create order (checkout)  |
| GET    | /api/orders                   | JWT     | List all orders          |
| GET    | /api/orders/track/:orderNum   | —       | Public order tracking    |
| GET    | /api/orders/:id               | JWT     | Single order (admin)     |
| PATCH  | /api/orders/:id               | JWT     | Update status/tracking   |
| POST   | /api/upload                   | JWT     | Upload single image      |
| POST   | /api/upload/multiple          | JWT     | Upload multiple images   |
| GET    | /api/sitemap.xml              | —       | Dynamic sitemap          |

---

## 💳 Razorpay Integration

The payment flow is stubbed and ready. To activate:

1. `npm install razorpay` in `/backend`
2. Add keys to `.env`:
   ```
   RAZORPAY_KEY_ID=rzp_live_xxx
   RAZORPAY_KEY_SECRET=xxx
   ```
3. Uncomment the Razorpay block in `routes/orders.js` → `POST /payment/create`
4. Add the Razorpay checkout script in `CheckoutPage.jsx` to open the payment modal

---

## 📦 Deployment

### Backend (Railway / Render / VPS)
```bash
# Set environment variables on your platform
npm start
```

### Frontend (Vercel / Netlify)
```bash
npm run build
# Set REACT_APP_API_URL=https://your-api-domain.com/api
```

### MongoDB
Use MongoDB Atlas (free tier works for MVP).

---

## 🔍 SEO Features

- Dynamic `<title>`, `<meta>`, `<link rel="canonical">` via `react-helmet-async`
- Open Graph + Twitter Card on every page
- Product JSON-LD structured data on product pages
- Breadcrumb JSON-LD structured data
- Organization + WebSite schema in `index.html`
- Clean URLs: `/product/snera-essential-tee`
- Auto sitemap at `/api/sitemap.xml`
- `robots.txt` (blocks admin, checkout)

---

## 📋 Environment Variables

| Variable              | Description                          | Default                       |
|-----------------------|--------------------------------------|-------------------------------|
| `PORT`                | Backend port                         | 5000                          |
| `MONGODB_URI`         | MongoDB connection string            | mongodb://localhost/snera      |
| `JWT_SECRET`          | JWT signing secret                   | *(change this!)*              |
| `ADMIN_ID`            | Admin login ID                       | admin                         |
| `ADMIN_PASSWORD`      | Admin login password                 | snera@admin123                |
| `RAZORPAY_KEY_ID`     | Razorpay key (when ready)            | —                             |
| `RAZORPAY_KEY_SECRET` | Razorpay secret (when ready)         | —                             |
| `FRONTEND_URL`        | CORS origin                          | http://localhost:3000         |
| `REACT_APP_API_URL`   | API base URL (frontend)              | /api (proxied in dev)         |
#   S n e r a  
 