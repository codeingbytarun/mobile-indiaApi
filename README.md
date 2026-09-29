# MobiMarket — Backend REST API (Node.js & MongoDB)

> **Enterprise-Grade REST API Backend for Used Smartphone Retail Marketplace**  
> **Environment:** Staging / Production  
> **Base URL:** `http://localhost:3000/api/v1` (Production: `https://api.mobimarket.in/api/v1`)  
> **Protocol:** HTTPS / JSON REST  
> **Frontend Target:** Angular 19 (`Mobile-india`)

---

## 📑 Table of Contents

1. [System Overview & Architecture](#-system-overview--architecture)
2. [Quick Start & Setup](#-quick-start--setup)
3. [MongoDB Connection String Configuration](#-mongodb-connection-string-configuration)
4. [Master API Catalog (45 Endpoints across 9 Modules)](#-master-api-catalog)
   - [Module 1: Authentication & Authorization (7 APIs)](#module-1-authentication--authorization-7-apis)
   - [Module 2: Shops & Digital Storefronts (7 APIs)](#module-2-shops--digital-storefronts-7-apis)
   - [Module 3: Phone Listings & Inventory Management (10 APIs)](#module-3-phone-listings--inventory-management-10-apis)
   - [Module 4: Buyer Cart & Device Reservations (5 APIs)](#module-4-buyer-cart--device-reservations-5-apis)
   - [Module 5: Leads & WhatsApp Inquiries (4 APIs)](#module-5-leads--whatsapp-inquiries-4-apis)
   - [Module 6: Analytics & Merchant Dashboard (3 APIs)](#module-6-analytics--merchant-dashboard-3-apis)
   - [Module 7: Media & Cloud Image Uploads (2 APIs)](#module-7-media--cloud-image-uploads-2-apis)
   - [Module 8: Master Data, Geo & Catalog (3 APIs)](#module-8-master-data-geo--catalog-3-apis)
   - [Module 9: Admin, KYC & Platform Moderation (4 APIs)](#module-9-admin-kyc--platform-moderation-4-apis)
5. [Database Schema & Models](#-database-schema--models)
6. [Demo Accounts & Test Credentials](#-demo-accounts--test-credentials)
7. [Running Tests](#-running-tests)

---

## 🏗️ System Overview & Architecture

The **MobiMarket Backend API** powers the hyper-local two-sided smartphone marketplace, enabling buyers to discover inspected second-hand devices from verified local phone retail shops with physical bills and testing warranties.

```
┌────────────────────────────────────────────────────────┐
│             ANGULAR 19 FRONTEND (PORT 4200)            │
│  Home, Phone Detail, Compare, Shopfront, Buyer/Seller  │
└───────────────────────────┬────────────────────────────┘
                            │ JSON REST over HTTP (CORS Enabled)
┌───────────────────────────▼────────────────────────────┐
│         NODE.JS + EXPRESS API SERVER (PORT 3000)       │
│  Helmet Security • JWT Auth • Rate Limiting • QR Code  │
└───────────────────────────┬────────────────────────────┘
                            │ Mongoose ODM
┌───────────────────────────▼────────────────────────────┐
│                   MONGODB ATLAS / LOCAL                │
│  Users • Shops • PhoneListings • Leads • Reviews • OTP │
└────────────────────────────────────────────────────────┘
```

### Key Highlights
- **Zero-Crash Resilience:** Works out-of-the-box with unified in-memory fallback stores and automatically transitions to MongoDB once your connection string is added to `.env`.
- **Automatic Seeding:** Automatically seeds authentic Jaipur/Indian mobile shop data, phone inventory, reviews, and test accounts on first launch.
- **Strict Envelope Standardization:** All responses return standard `{ success, statusCode, message, data, meta }` payloads.

---

## ⚡ Quick Start & Setup

### 1. Prerequisites
- **Node.js**: v18.x, v20.x, or v24.x
- **npm**: v10.x or higher

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
# or for production
npm start
```
The server will start at `http://localhost:3000`.

---

## 🍃 MongoDB Connection String Configuration

When you have your MongoDB connection string (from **MongoDB Atlas** or a local instance), configure it in the [`.env`](file:///d:/mobi%20market/Mob-India-Api/.env) file:

```env
# .env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/mobimarket?retryWrites=true&w=majority
```

### Manual Seeding Script
To re-seed the MongoDB database with initial sample data at any time:
```bash
npm run seed
```

---

## 📋 Master API Catalog

### Standard JSON Envelope Formats

#### Success (200 / 201)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 48,
    "totalPages": 3
  }
}
```

#### Error (400 / 401 / 403 / 404 / 409 / 500)
```json
{
  "success": false,
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Validation failed: 'price' must be a positive number",
  "timestamp": "2026-03-29T18:00:00.000Z",
  "path": "/api/v1/phones"
}
```

---

### Module 1: Authentication & Authorization (7 APIs)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/send-otp` | Public | Dispatches 6-digit OTP to mobile phone (`phone`, `channel`). |
| `POST` | `/api/v1/auth/verify-otp` | Public | Validates OTP code, logs in user, issues JWT access & refresh tokens. |
| `POST` | `/api/v1/auth/register-shopkeeper` | Public | Atomic onboarding for physical mobile shopkeeper + store setup. |
| `GET` | `/api/v1/auth/me` | Bearer Token | Fetches current user profile and linked shop information. |
| `POST` | `/api/v1/auth/refresh-token` | Public | Exchanges refresh token for a fresh access token. |
| `POST` | `/api/v1/auth/logout` | Bearer Token | Revokes session. |
| `POST` | `/api/v1/auth/resend-otp` | Public | Re-dispatches OTP for expired/delayed requests. |

---

### Module 2: Shops & Digital Storefronts (7 APIs)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/shops` | Public | Lists shops in city with geo-distance calculation & locality filters. |
| `GET` | `/api/v1/shops/:idOrSlug` | Public | Full storefront profile + live device inventory (`sharma-telecom`). |
| `PUT` | `/api/v1/shops/:id` | Shopkeeper/Admin | Updates store details, open hours, and contact details. |
| `GET` | `/api/v1/shops/:id/qr` | Public | Generates dynamic QR Code data URL pointing to digital catalog. |
| `GET` | `/api/v1/shops/:id/reviews` | Public | Lists verified customer reviews & star ratings. |
| `POST` | `/api/v1/shops/:id/reviews` | Buyer/Auth | Submits a store review and updates shop rating average. |
| `GET` | `/api/v1/shops/check-slug/:slug` | Public | Verifies availability of custom storefront URL slug. |

---

### Module 3: Phone Listings & Inventory Management (10 APIs)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/phones` | Public | Multi-facet search across brand, model, price, condition, warranty, distance. |
| `GET` | `/api/v1/phones/featured` | Public | Spotlight curated devices for the homepage hero carousel. |
| `GET` | `/api/v1/phones/:id` | Public | Granular device specs, shop contacts, and view counter increment. |
| `GET` | `/api/v1/phones/compare` | Public | Side-by-side comparison across shops in the user's city sorted by lowest price. |
| `POST` | `/api/v1/phones` | Shopkeeper | Adds phone listing to merchant's inventory. |
| `PUT` | `/api/v1/phones/:id` | Shopkeeper/Admin | Full update of existing listing details. |
| `PATCH` | `/api/v1/phones/:id/price` | Shopkeeper/Admin | Quick 1-tap price adjustment. |
| `PATCH` | `/api/v1/phones/:id/sold` | Shopkeeper/Admin | Instant inventory toggle between Active and Sold Out. |
| `PATCH` | `/api/v1/phones/:id/images` | Shopkeeper/Admin | Updates device photo gallery URLs. |
| `DELETE` | `/api/v1/phones/:id` | Shopkeeper/Admin | Deletes/archives a phone listing. |

---

### Module 4: Buyer Cart & Device Reservations (5 APIs)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/buyer/cart` | Buyer | Fetches buyer's saved phones and aggregate MRP savings. |
| `POST` | `/api/v1/buyer/cart` | Buyer | Adds a phone listing to the buyer's reserved cart. |
| `DELETE` | `/api/v1/buyer/cart/:phoneId` | Buyer | Removes an item from the cart. |
| `DELETE` | `/api/v1/buyer/cart` | Buyer | Clears all cart items. |
| `POST` | `/api/v1/buyer/cart/sync` | Buyer | Synchronizes local browser cart items upon login. |

---

### Module 5: Leads & WhatsApp Inquiries (4 APIs)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/leads` | Public / Buyer | Logs inquiry and generates pre-formatted WhatsApp deep link (`wa.me`). |
| `GET` | `/api/v1/leads/shop/:shopId` | Shopkeeper/Admin | Lists all customer leads received by a specific shop. |
| `PATCH` | `/api/v1/leads/:id/status` | Shopkeeper/Admin | Updates CRM lead status (`New`, `Contacted`, `Visited Store`, `Sold`, `Lost`). |
| `GET` | `/api/v1/leads/buyer/my-inquiries`| Buyer | Lists inquiry history for the logged-in buyer. |

---

### Module 6: Analytics & Merchant Dashboard (3 APIs)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/analytics/dashboard/:shopId` | Shopkeeper/Admin | Real-time KPIs: views, leads, active inventory, conversion rate. |
| `GET` | `/api/v1/analytics/top-models/:shopId`| Shopkeeper/Admin | Top viewed and inquired models for inventory restocking. |
| `GET` | `/api/v1/analytics/trends/:shopId` | Shopkeeper/Admin | Daily 30-day timeseries of shop views and leads. |

---

### Module 7: Media & Cloud Image Uploads (2 APIs)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/media/upload` | Shopkeeper/Admin | Handles file uploads (`multipart/form-data`) with image dimensions & CDN URL. |
| `DELETE` | `/api/v1/media` | Shopkeeper/Admin | Deletes an uploaded media asset. |

---

### Module 8: Master Data, Geo & Catalog (3 APIs)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/meta/cities` | Public | Supported cities (Jaipur, Delhi NCR, Mumbai, Bengaluru) & verified localities. |
| `GET` | `/api/v1/meta/brands` | Public | Master smartphone brands and popular model names for search autocomplete. |
| `GET` | `/api/v1/meta/price-estimator` | Public | Valuation algorithm calculating estimated resale prices based on condition & battery. |

---

### Module 9: Admin, KYC & Platform Moderation (4 APIs)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/shops/pending` | Admin | Lists new shop registrations awaiting physical verification. |
| `PATCH` | `/api/v1/admin/shops/:id/verify` | Admin | Verifies/unverifies a shop to activate its verified badge. |
| `GET` | `/api/v1/admin/stats` | Admin | Platform metrics: total shops, active phones, GMV, total leads. |
| `PATCH` | `/api/v1/admin/listings/:id/flag` | Admin | Flags, hides, restores, or deletes suspicious device listings. |

---

## 🔑 Demo Accounts & Test Credentials

| Role | Name | Phone Number | Dev Test OTP | Associated Store |
| :--- | :--- | :--- | :--- | :--- |
| **Shopkeeper** | Rajesh Sharma | `9829012345` | `482910` | Sharma Telecom (`shop_01`) |
| **Shopkeeper** | Vikram Singh | `9829022211` | `482910` | Apex Mobile Hub (`shop_02`) |
| **Buyer** | Tarun Baliyan | `9829099887` | `482910` | — |
| **Admin** | MobiMarket Admin | `9999999999` | `482910` | Platform Wide |

> **Note:** Any 6-digit OTP (e.g. `482910` or `123456`) or the OTP session code returned by `POST /auth/send-otp` is accepted in development.

---

## 🧪 Running Tests

Execute the automated test suite covering all 9 modules:
```bash
npm test
```
Result:
```
==============================================
🎉 TEST SUITE COMPLETED: 18 PASSED, 0 FAILED
==============================================
```
