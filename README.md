# Supermarket Billing Software

A complete, production-ready billing solution for supermarkets built with React, Node.js, and MySQL.

## Features
- **Authentication & RBAC**: Secure login for Admin and Cashier roles using JWT.
- **Product Management**: Full CRUD operations with categories, pricing, and stock tracking.
- **Billing Module**: Real-time cart calculations, GST handling, and stock auto-deduction.
- **Reports & Analytics**: Visual sales performance data using interactive charts.
- **Clean Architecture**: Modular MVC backend and reusable component-based frontend.

## Prerequisites
- Node.js (v16+)
- MySQL Server

## Setup Instructions

### 1. Database Setup
1. Create a database named `supermarket_billing`.
2. The schema will be automatically initialized when you start the backend server.
3. Default credentials:
   - **Admin**: `admin` / `admin123`
   - **Cashier**: Create through Admin panel (logic included in schema).

### 2. Backend Configuration
1. Navigate to the `backend` folder.
2. Edit the `.env` file with your MySQL credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=supermarket_billing
   JWT_SECRET=your_secret_key
   ```
3. Run `npm install`.
4. Run `npm start`.

### 3. Frontend Configuration
1. Navigate to the `frontend` folder.
2. Run `npm install`.
3. Run `npm run dev`.

## Project Structure
```
/backend
  /src
    /config      - Database & app configurations
    /controllers - Route handlers
    /middleware  - Auth & Error handlers
    /models      - DB logical models
    /routes      - API route definitions
    /services    - Business logic (Service Layer)
    /database    - SQL schema & init scripts

/frontend
  /src
    /components  - Reusable UI elements
    /context     - Auth & Global state
    /layouts     - Page wrappers (Sidebar/Navbar)
    /pages       - Functional screens
    /services    - API communication layer
    /utils       - Helper functions
```

## API Documentation
The API follows REST standards with versioning `/api/v1`.
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/products` - List all products
- `POST /api/v1/bills` - Generate new bill
- `GET /api/v1/bills/reports` - Fetch sales metrics (Admin only)

## Repository & Deployment
- **GitHub:** [Abinash-003/Billing_Software](https://github.com/Abinash-003/Billing_Software)
- **Deploy frontend on Vercel:** See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for step-by-step GitHub push, environment variables, and Vercel configuration (root: `frontend`, build: `npm run build`, output: `dist`, set `VITE_API_URL` to your backend API URL).
