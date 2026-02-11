-- Supermarket Billing Software Schema



-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(20) NOT NULL UNIQUE
);

-- Initial roles
INSERT IGNORE INTO roles (name) VALUES ('ADMIN'), ('CASHIER');

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role_id INT,
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    barcode VARCHAR(50) NULL UNIQUE,
    category VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL,
    quantity INT DEFAULT 0,
    stocks INT NOT NULL,
    unit ENUM('kg', 'ltr', 'ml', 'packet', 'pcs') NOT NULL DEFAULT 'pcs',
    gst_percent DECIMAL(5, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_product_name (name),
    INDEX idx_barcode (barcode)
);

-- Bills table
CREATE TABLE IF NOT EXISTS bills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bill_number VARCHAR(20) UNIQUE NOT NULL,
    customer_name VARCHAR(100),
    customer_phone VARCHAR(15),
    total_amount DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    grand_total DECIMAL(10, 2) NOT NULL,
    cashier_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cashier_id) REFERENCES users(id),
    INDEX idx_bill_date (created_at)
);

-- Bill items table
CREATE TABLE IF NOT EXISTS bill_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bill_id INT,
    product_id INT,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    gst_amount DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Suppliers (Distributors) table
CREATE TABLE IF NOT EXISTS suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    product_categories VARCHAR(255),
    address TEXT,
    gst_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Distributor orders (purchase orders with payment & delivery tracking)
CREATE TABLE IF NOT EXISTS distributor_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    supplier_id INT NOT NULL,
    ordered_date DATE,
    delivered_date DATE,
    delivery_status ENUM('Pending', 'Delivered', 'Cancelled') DEFAULT 'Pending',
    invoice_number VARCHAR(80),
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    balance_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    payment_status ENUM('Paid', 'Partial', 'Unpaid') DEFAULT 'Unpaid',
    notes TEXT,
    bill_file_url VARCHAR(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    INDEX idx_supplier_orders (supplier_id),
    INDEX idx_order_dates (ordered_date, delivered_date)
);

-- Line items for receive-stock (links order to product + qty + cost, and drives stock increase)
CREATE TABLE IF NOT EXISTS distributor_order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES distributor_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_order_items (order_id)
);

-- Seed Data (Password is 'admin123' and 'cashier123' hashed later, for now we will use placeholders or handle in app)
-- Inserting Admin (username: admin, password: hashed_password_here)
-- Inserting Cashier (username: cashier, password: hashed_password_here)

