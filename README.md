# DistribuERP - Mini ERP + CRM Operations Portal

> **Full Stack Developer Case Study**: Mini ERP + CRM Operations Portal for Wholesale and Distribution Operations.  
> **Tech Stack**: Node.js, TypeScript, Express, Prisma ORM, PostgreSQL (Supabase), React, Vite, TailwindCSS, Socket.IO WebSockets.  
> 🎥 **Full Flow Video Demonstration**: [Watch on Loom](https://www.loom.com/share/96916c5f53bf408e80febd5ea6a786d1)

---

## 🎥 Live Demonstration & Video Walkthrough

- **Loom Recording**: [https://www.loom.com/share/96916c5f53bf408e80febd5ea6a786d1](https://www.loom.com/share/96916c5f53bf408e80febd5ea6a786d1)
- **GitHub Repository**: [https://github.com/sandeepj-git567/ERP-CRM-system](https://github.com/sandeepj-git567/ERP-CRM-system)
- **Postman Collection**: [`postman_collection.json`](https://github.com/sandeepj-git567/ERP-CRM-system/blob/main/postman_collection.json)

## 🌟 Executive Summary & Architecture Overview

**DistribuERP** is a full-stack, enterprise-grade operations and CRM platform designed for wholesale and distribution enterprises. It coordinates four core operational departments—**Sales CRM**, **Warehouse Logistics**, **Accounts & GST Invoicing**, and **System Administration**—in real time via two-way WebSocket event broadcasting.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             DistribuERP System Architecture                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
   ┌───────────────────────────┐             ┌───────────────────────────┐
   │ React + Vite Client (SPA) │ ◄──────────►│ Express + Node.js Backend │
   │ - TailwindCSS Glassmorphism│  REST + WS  │ - TypeScript & Express.js │
   │ - Dynamic Multi-Role UI   │             │ - Socket.IO WebSockets    │
   │ - 1-Click Excel/CSV Center│             │ - Zod Validation Engine   │
   │ - Multi-Channel Dispatch  │             │ - Centralized Error Layer │
   └───────────────────────────┘             └─────────────┬─────────────┘
                                                           │ Prisma ORM
                                                           ▼
                                             ┌───────────────────────────┐
                                             │ PostgreSQL DB (Supabase)  │
                                             │ - users & credentials     │
                                             │ - customers & follow-ups  │
                                             │ - products & movements    │
                                             │ - sales challans & items  │
                                             └───────────────────────────┘
```

---

## 🔑 Test Login Credentials (All 4 Roles)

You can log in directly using the pre-seeded credentials below or register a new staff account via the **Sign Up (Create Account)** tab.

| Role | Email | Password | Primary Capabilities & Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `Admin@123` | Full system governance, all modules, company settings, staff management. |
| **Sales** | `sales@example.com` | `Sales@123` | Customer CRM, lead conversions, follow-up logs, create & confirm sales challans. |
| **Warehouse** | `warehouse@example.com` | `Warehouse@123` | Stock valuation, inbound/outbound stock movements, dispatch verification. |
| **Accounts** | `accounts@example.com` | `Accounts@123` | Confirmed sales ledgers, Company GST details, 1-Click GSTR-1 & revenue exports. |

---

## 🚀 Core Features & Case Study Verification

### 1. Authentication & Role-Based Access Control
- JWT-based authentication with bcrypt (10 rounds) password hashing.
- Role-based route middleware on backend (`authorize('ADMIN', 'SALES')`) and frontend route guards (`<ProtectedRoute roles={[...]} />`).
- Dynamic staff registration supporting role-specific metadata:
  - **Sales**: Assigned Territory/Region & Sales Bio.
  - **Warehouse**: Assigned Hub/Dock & Logistics Bio.
  - **Accounts**: Accounting Desk & Compliance Bio.
  - **Admin**: Executive Division & Supervisory Bio.
- **My Profile & Bio Settings (`/profile`)**: Manage personal details, role descriptions, contact phone, and password changes.

### 2. Customer CRM Module
- Comprehensive fields: Customer Name, Business Name, Mobile, Email, GSTIN (optional), Type (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`), Address, Status (`LEAD`, `ACTIVE`, `INACTIVE`), Follow-up Date, and Notes.
- Paginated table with search by name/mobile/business and filtering by status and customer type.
- Detail page (`/customers/:id`) with activity feed and follow-up timeline logger (`POST /customers/:id/follow-ups`).

### 3. Product & Inventory Module
- SKU, Product Name, Category, Unit Price (₹), Current Stock, Minimum Stock Alert, and Warehouse Location.
- Visual low-stock warning indicators and inventory stock valuation badges.
- Stock Movement Log (`IN` / `OUT`, quantity, reason, creator, timestamp) updating inventory live.

### 4. Sales Challan Module & Atomic Stock Deduction
- Auto-generated serial challan numbers per year (e.g. `CH-2026-000001`).
- Multi-product line item selector with live subtotal calculation and out-of-stock badge enforcement.
- **Atomic Stock Deduction**: When confirming a challan, stock is deducted inside a PostgreSQL transaction (`prisma.$transaction`). Stock is prevented from going negative.
- **Snapshot Preservation**: Challan items preserve immutable snapshots (`productNameSnapshot`, `skuSnapshot`, `unitPriceSnapshot`) ensuring past invoices remain accurate regardless of future price changes.

### 5. Multi-Channel Automated Notifications
- Auto-triggered modal on challan confirmation with 1-click actions:
  - **WhatsApp**: Pre-filled dispatch message opening `https://wa.me/`.
  - **Email Invoice**: Formatted subject line and itemized invoice opening `mailto:`.
  - **DLT SMS**: Single-segment SMS template with 1-click copy.
  - **Printable Tax Receipt**: Formatted delivery receipt with company header, GSTIN, PAN, bank details, and signature blocks.

### 6. 1-Click GST & Sales Reporting
- Dedicated **Reports & Export Center (`/reports`)** with period filters (*This Month*, *Last Month*, *All Time*):
  - **GSTR-1 Monthly Sales CSV**: Itemized sales challans with GSTIN, Taxable Base, CGST (9%), SGST (9%), and Grand Total.
  - **Inventory Valuation CSV**: SKUs, categories, warehouse locations, live stock, and asset value.
  - **Customer Master CRM CSV**: Complete customer records with lead statuses and order counts.

### 7. Real-Time Synchronization
- Socket.IO WebSockets broadcast events (`CUSTOMER_CREATED`, `STOCK_MOVEMENT`, `CHALLAN_CONFIRMED`, `USER_CREATED`) to all active roles immediately without manual page refresh.

---

## 🛠️ Local Setup & Installation

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x
- PostgreSQL instance (or Supabase URL)

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-username/distribu-erp.git
cd distribu-erp

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Variables Configuration

#### Backend (`server/.env`)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.vqxgcevxxetjftgnsrxa.supabase.co:5432/postgres"
JWT_SECRET="super_secret_jwt_key_distribu_erp_2026"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:3000"
```

#### Frontend (`client/.env`)
```env
VITE_API_URL="http://localhost:5000/api"
VITE_WS_URL="http://localhost:5000"
```

### 3. Database Migration & Seeding
```bash
cd server
# Push Prisma schema to database
npx prisma db push

# Seed initial admin, sales, warehouse, accounts accounts, sample customers & products
npm run seed
```

### 4. Running the Development Servers
```bash
# Terminal 1: Backend Server (runs on http://localhost:5000)
cd server
npm run dev

# Terminal 2: Frontend Client (runs on http://localhost:3000)
cd client
npm run dev
```

### 5. Running the Test Suite
```bash
cd server
npm test
```

---

## 🐳 Docker Containerized Execution

Run the entire system (Frontend, Backend, PostgreSQL) with a single command:

```bash
docker-compose up --build
```
- Frontend UI: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`

---

## ☁️ Deployment Guide

### Option 1: Frontend (Vercel / Netlify)
1. Link your GitHub repository to Vercel or Netlify.
2. Root directory: `client`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Environment Variables:
   - `VITE_API_URL`: `https://your-backend.onrender.com/api`
   - `VITE_WS_URL`: `https://your-backend.onrender.com`

### Option 2: Backend (Render / Railway / Fly.io / AWS ECS)
1. Link the `server` directory to Render Web Service or Railway.
2. Build command: `npm ci && npx prisma generate && npm run build`
3. Start command: `npm start`
4. Environment Variables:
   - `DATABASE_URL`: `postgresql://...`
   - `JWT_SECRET`: `...`
   - `CLIENT_URL`: `https://your-frontend.vercel.app`

---

## 📬 Postman API Collection

The project includes a ready-to-import Postman Collection file at `postman_collection.json` covering:
- `POST /auth/login` & `POST /auth/register`
- `GET /auth/me` & `PUT /auth/profile`
- `GET /customers` & `POST /customers` & `POST /customers/:id/follow-ups`
- `GET /products` & `POST /products` & `POST /products/:id/stock`
- `GET /challans` & `POST /challans` & `PATCH /challans/:id/confirm`
- `GET /dashboard/stats`

---

## 📝 Design Assumptions & Notes
- **GST Standard**: Tax calculations follow standard Indian GST intra-state 18% splits (9% CGST + 9% SGST).
- **Challan Snapshot**: Prices and names are snapshotted on creation to preserve audit compliance.
- **Stock Movement Integrity**: Stock deductions occur inside an atomic database transaction to prevent race conditions during high-volume dispatches.
