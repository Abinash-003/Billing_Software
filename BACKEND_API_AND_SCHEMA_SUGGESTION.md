# Backend API & Database Schema Suggestions for Supermarket ERP

This document suggests backend extensions so the frontend ERP features work end-to-end. **No changes are required for the current frontend to run**; these are optional when you want full persistence and profit/loss tracking.

---

## 1. Database schema additions

### Products table – add columns

```sql
ALTER TABLE products
  ADD COLUMN barcode VARCHAR(50) NULL UNIQUE AFTER name,
  ADD COLUMN cost_price DECIMAL(10, 2) DEFAULT 0.00 AFTER price,
  ADD COLUMN min_stock_level INT DEFAULT 10 AFTER stocks,
  ADD COLUMN distributor_id INT NULL AFTER gst_percent,
  ADD INDEX idx_barcode (barcode),
  ADD FOREIGN KEY (distributor_id) REFERENCES suppliers(id) ON DELETE SET NULL;
```

- **barcode**: For POS search and scanning.  
- **cost_price**: For profit = (selling_price - cost_price) * quantity.  
- **min_stock_level**: For low-stock alerts (frontend uses 10 as default).  
- **distributor_id**: Link to `suppliers` (distributors).

### Bills table – add column

```sql
ALTER TABLE bills
  ADD COLUMN payment_method ENUM('cash', 'upi', 'card') DEFAULT 'cash' AFTER grand_total;
```

- **payment_method**: Sent from POS; use for analytics and reports.

### Bill items – optional cost for profit

To store profit per line (recommended for accurate history even if product cost changes later):

```sql
ALTER TABLE bill_items
  ADD COLUMN cost_price DECIMAL(10, 2) DEFAULT NULL AFTER unit_price;
```

- When creating a bill, set `cost_price` from `products.cost_price` for each item.  
- **Total profit** = SUM((unit_price - cost_price) * quantity) over all bill_items.

### New tables (optional)

**Purchases (stock from distributor)**

```sql
CREATE TABLE purchases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  distributor_id INT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) DEFAULT 0.00,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (distributor_id) REFERENCES suppliers(id)
);

CREATE TABLE purchase_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  purchase_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

- **paid_amount** vs **total_amount** → pending payment per purchase.  
- On save purchase: insert `purchases` + `purchase_items`, then `UPDATE products SET stocks = stocks + quantity` for each item.

**Expenses (losses / costs for P&L)**

```sql
CREATE TABLE expenses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('discount_loss', 'damaged', 'expired', 'manual') NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

- Frontend currently uses localStorage for expenses; this table allows server-side storage and reporting.

**Customers (optional – for full CRUD)**

Right now customers are derived from bills (group by phone/name). If you want add/edit/delete and loyalty points in DB:

```sql
CREATE TABLE customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL UNIQUE,
  loyalty_points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

- Loyalty rules (e.g. 1 point per ₹100) can be computed on read or updated on each sale.

---

## 2. API suggestions

### Products

- **GET /products** – already returns products; include `barcode`, `cost_price`, `min_stock_level`, `distributor_id` when columns exist.  
- **POST /products**, **PUT /products/:id** – accept and persist `barcode`, `cost_price`, `min_stock_level`, `distributor_id` (and validate `distributor_id` against `suppliers.id`).  
- **GET /products/search?q=** – extend search to match `barcode` as well as name/category (e.g. `WHERE name LIKE ? OR category LIKE ? OR barcode = ?`).

### Bills

- **POST /bills** – accept `paymentMethod` (or `payment_method`) and store in `bills.payment_method`.  
- **POST /bills** – when inserting `bill_items`, set `cost_price` from `products.cost_price` for each product so profit is stored per line.

### Dashboard / analytics

- **GET /bills/stats** – extend response with:
  - `todayRevenue`, `todayOrders` (from bills where DATE(created_at) = CURDATE()).
  - `monthRevenue` (current month).
- **GET /bills/reports?period=hourly** (optional) – group by HOUR(created_at) for “peak sales time” chart.  
- **GET /analytics/profit** (optional) – SUM((unit_price - cost_price) * quantity) from bill_items; subtract SUM(expenses.amount) for net profit.

### Purchases

- **POST /purchases** – body: `{ distributorId, items: [{ productId, quantity, unitPrice }], note?, paidAmount? }`.  
  - Create `purchases` row, create `purchase_items`, then increase `products.stocks` for each item.  
- **GET /purchases** – list with distributor name, total, paid, pending.  
- **GET /suppliers/:id/pending** (optional) – total unpaid amount for that distributor.

### Expenses

- **POST /expenses** – body: `{ type, amount, note }`. Insert into `expenses`.  
- **GET /expenses** – list with optional date range.  
- Use in profit API: total profit from sales − total expenses.

### Reports export

- Frontend already exports CSV from existing APIs (bills, products, suppliers).  
- Optional: **GET /reports/sales?from=&to=&format=csv** to return CSV from server for large datasets.

---

## 3. Summary

| Feature              | Current frontend behavior                    | Backend suggestion                                      |
|----------------------|---------------------------------------------|---------------------------------------------------------|
| Products (barcode, cost, min stock, distributor) | Form has fields; only existing columns sent | Add columns; accept new fields in create/update         |
| POS discount / payment method | Sent in payload; discount already in DB      | Add `payment_method` column; accept in POST /bills      |
| Profit calculation   | Shown as “—” until cost available           | Add `cost_price` (products + bill_items); P&L endpoint  |
| Purchases            | Stored in localStorage                      | Add `purchases` + `purchase_items`; POST/GET APIs      |
| Expenses             | Stored in localStorage                      | Add `expenses` table; POST/GET APIs                     |
| Peak sales time      | Sample data                                 | Optional: reports by hour                               |
| Pending distributor payments | Shown as “—”                             | Sum unpaid (purchases.total - purchases.paid) per supplier |

Implementing the schema and APIs above will align the backend with the ERP frontend and enable full tracking of sales, stock, profit, expenses, and distributor payables.
