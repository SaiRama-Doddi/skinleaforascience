const { pool } = require('./db');

const initDb = async () => {
  try {
    console.log('🔄 Initializing database tables...');

    // 1. Admin Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(100) DEFAULT 'Admin',
        role VARCHAR(50) DEFAULT 'SuperAdmin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. OTP Codes Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp VARCHAR(10) NOT NULL,
        expires_at DATETIME NOT NULL,
        is_used TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Categories Table (Supporting 3-level hierarchy: category -> sub_category -> child_category)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        parent_id INT DEFAULT NULL,
        level VARCHAR(50) DEFAULT 'category',
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        description TEXT,
        image_url TEXT,
        icon_url TEXT,
        banner_url TEXT,
        meta_title VARCHAR(255),
        meta_description TEXT,
        meta_keywords VARCHAR(255),
        is_active TINYINT(1) DEFAULT 1,
        is_featured TINYINT(1) DEFAULT 0,
        is_trending TINYINT(1) DEFAULT 0,
        display_order INT DEFAULT 0,
        deleted_at DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Auto-migrate missing columns for existing categories table
    const catCols = [
      "ALTER TABLE categories ADD COLUMN parent_id INT DEFAULT NULL AFTER id",
      "ALTER TABLE categories ADD COLUMN level VARCHAR(50) DEFAULT 'category' AFTER parent_id",
      "ALTER TABLE categories ADD COLUMN image_url TEXT AFTER description",
      "ALTER TABLE categories ADD COLUMN icon_url TEXT AFTER image_url",
      "ALTER TABLE categories ADD COLUMN banner_url TEXT AFTER icon_url",
      "ALTER TABLE categories ADD COLUMN meta_title VARCHAR(255) AFTER banner_url",
      "ALTER TABLE categories ADD COLUMN meta_description TEXT AFTER meta_title",
      "ALTER TABLE categories ADD COLUMN meta_keywords VARCHAR(255) AFTER meta_description",
      "ALTER TABLE categories ADD COLUMN is_featured TINYINT(1) DEFAULT 0 AFTER is_active",
      "ALTER TABLE categories ADD COLUMN is_trending TINYINT(1) DEFAULT 0 AFTER is_featured",
      "ALTER TABLE categories ADD COLUMN display_order INT DEFAULT 0 AFTER is_trending",
      "ALTER TABLE categories ADD COLUMN deleted_at DATETIME DEFAULT NULL AFTER display_order"
    ];

    for (const query of catCols) {
      try { await pool.query(query); } catch (e) {}
    }

    // 4. Products Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(100) DEFAULT 'Leafora',
        sku VARCHAR(100) DEFAULT NULL,
        category VARCHAR(100) DEFAULT 'General',
        category_id INT DEFAULT NULL,
        price DECIMAL(10, 2) NOT NULL,
        stock INT DEFAULT 0,
        warehouse_stock INT DEFAULT 0,
        reserved_stock INT DEFAULT 0,
        low_stock_threshold INT DEFAULT 10,
        description TEXT,
        image_url VARCHAR(500),
        images TEXT,
        is_active TINYINT(1) DEFAULT 1,
        is_featured TINYINT(1) DEFAULT 0,
        is_trending TINYINT(1) DEFAULT 0,
        is_new_arrival TINYINT(1) DEFAULT 0,
        meta_title VARCHAR(255),
        meta_description TEXT,
        meta_keywords VARCHAR(255),
        canonical_url VARCHAR(500),
        deleted_at DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Auto-migrate missing columns for existing products table
    const prodCols = [
      "ALTER TABLE products ADD COLUMN brand VARCHAR(100) DEFAULT 'Leafora' AFTER name",
      "ALTER TABLE products ADD COLUMN sku VARCHAR(100) DEFAULT NULL AFTER brand",
      "ALTER TABLE products ADD COLUMN warehouse_stock INT DEFAULT 0 AFTER stock",
      "ALTER TABLE products ADD COLUMN reserved_stock INT DEFAULT 0 AFTER warehouse_stock",
      "ALTER TABLE products ADD COLUMN low_stock_threshold INT DEFAULT 10 AFTER reserved_stock",
      "ALTER TABLE products ADD COLUMN images TEXT AFTER image_url",
      "ALTER TABLE products ADD COLUMN is_trending TINYINT(1) DEFAULT 0 AFTER is_featured",
      "ALTER TABLE products ADD COLUMN is_new_arrival TINYINT(1) DEFAULT 0 AFTER is_trending",
      "ALTER TABLE products ADD COLUMN meta_title VARCHAR(255) AFTER is_new_arrival",
      "ALTER TABLE products ADD COLUMN meta_description TEXT AFTER meta_title",
      "ALTER TABLE products ADD COLUMN meta_keywords VARCHAR(255) AFTER meta_description",
      "ALTER TABLE products ADD COLUMN canonical_url VARCHAR(500) AFTER meta_keywords",
      "ALTER TABLE products ADD COLUMN deleted_at DATETIME DEFAULT NULL AFTER canonical_url"
    ];

    for (const query of prodCols) {
      try { await pool.query(query); } catch (e) {}
    }

    // 4b. Product Images Relational Table (up to 5 images per product)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        image_url TEXT NOT NULL,
        is_primary TINYINT(1) DEFAULT 0,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_product_id (product_id)
      );
    `);

    // 4c. Product Variants Relational Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        variant_name VARCHAR(100) NOT NULL,
        sku VARCHAR(100) DEFAULT NULL,
        price DECIMAL(10, 2) NOT NULL,
        stock INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_var_product_id (product_id)
      );
    `);

    // 5. Orders Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(100) NOT NULL UNIQUE,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50),
        subtotal DECIMAL(10, 2) DEFAULT 0.00,
        tax_amount DECIMAL(10, 2) DEFAULT 0.00,
        shipping_fee DECIMAL(10, 2) DEFAULT 0.00,
        discount_amount DECIMAL(10, 2) DEFAULT 0.00,
        total_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        payment_status VARCHAR(50) DEFAULT 'Paid',
        shipping_partner VARCHAR(100) DEFAULT NULL,
        warehouse VARCHAR(150) DEFAULT 'Warehouse A - Hyderabad Central',
        tracking_number VARCHAR(100) DEFAULT NULL,
        shipping_address TEXT,
        billing_address TEXT,
        customer_notes TEXT,
        admin_notes TEXT,
        return_reason TEXT,
        exchange_notes TEXT,
        deleted_at DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Auto-migrate missing columns for existing orders table
    const ordCols = [
      "ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10, 2) DEFAULT 0.00 AFTER customer_phone",
      "ALTER TABLE orders ADD COLUMN tax_amount DECIMAL(10, 2) DEFAULT 0.00 AFTER subtotal",
      "ALTER TABLE orders ADD COLUMN shipping_fee DECIMAL(10, 2) DEFAULT 0.00 AFTER tax_amount",
      "ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0.00 AFTER shipping_fee",
      "ALTER TABLE orders ADD COLUMN warehouse VARCHAR(150) DEFAULT 'Warehouse A - Hyderabad Central' AFTER shipping_partner",
      "ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100) DEFAULT NULL AFTER warehouse",
      "ALTER TABLE orders ADD COLUMN shipping_address TEXT AFTER tracking_number",
      "ALTER TABLE orders ADD COLUMN billing_address TEXT AFTER shipping_address",
      "ALTER TABLE orders ADD COLUMN customer_notes TEXT AFTER billing_address",
      "ALTER TABLE orders ADD COLUMN admin_notes TEXT AFTER customer_notes",
      "ALTER TABLE orders ADD COLUMN return_reason TEXT AFTER admin_notes",
      "ALTER TABLE orders ADD COLUMN exchange_notes TEXT AFTER return_reason",
      "ALTER TABLE orders ADD COLUMN deleted_at DATETIME DEFAULT NULL AFTER exchange_notes"
    ];
    for (const query of ordCols) {
      try { await pool.query(query); } catch (e) {}
    }

    // 5b. Order Items Relational Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_image TEXT,
        sku VARCHAR(100),
        variant_name VARCHAR(100),
        price DECIMAL(10, 2) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        total_price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_items_ord_id (order_id)
      );
    `);

    // 5c. Order Timeline Tracking Relational Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_timeline (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_time_ord_id (order_id)
      );
    `);


    // 6. Customers Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Active',
        loyalty_tier VARCHAR(50) DEFAULT 'Silver',
        total_spent DECIMAL(10, 2) DEFAULT 0.00,
        wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
        loyalty_points INT DEFAULT 0,
        referral_earnings DECIMAL(10, 2) DEFAULT 0.00,
        avatar_url TEXT,
        notes TEXT,
        password_hash VARCHAR(255) DEFAULT NULL,
        remember_token VARCHAR(255) DEFAULT NULL,
        reset_otp VARCHAR(10) DEFAULT NULL,
        reset_otp_expires DATETIME DEFAULT NULL,
        terms_accepted_at DATETIME DEFAULT NULL,
        deleted_at DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Auto-migrate missing columns for existing customers table
    const custCols = [
      "ALTER TABLE customers ADD COLUMN wallet_balance DECIMAL(10, 2) DEFAULT 0.00 AFTER total_spent",
      "ALTER TABLE customers ADD COLUMN loyalty_points INT DEFAULT 0 AFTER wallet_balance",
      "ALTER TABLE customers ADD COLUMN referral_earnings DECIMAL(10, 2) DEFAULT 0.00 AFTER loyalty_points",
      "ALTER TABLE customers ADD COLUMN avatar_url TEXT AFTER referral_earnings",
      "ALTER TABLE customers ADD COLUMN notes TEXT AFTER avatar_url",
      "ALTER TABLE customers ADD COLUMN password_hash VARCHAR(255) DEFAULT NULL AFTER notes",
      "ALTER TABLE customers ADD COLUMN remember_token VARCHAR(255) DEFAULT NULL AFTER password_hash",
      "ALTER TABLE customers ADD COLUMN reset_otp VARCHAR(10) DEFAULT NULL AFTER remember_token",
      "ALTER TABLE customers ADD COLUMN reset_otp_expires DATETIME DEFAULT NULL AFTER reset_otp",
      "ALTER TABLE customers ADD COLUMN terms_accepted_at DATETIME DEFAULT NULL AFTER reset_otp_expires",
      "ALTER TABLE customers ADD COLUMN deleted_at DATETIME DEFAULT NULL AFTER terms_accepted_at"
    ];
    for (const query of custCols) {
      try { await pool.query(query); } catch (e) {}
    }

    // 6b. Customer Addresses Relational Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customer_addresses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        type VARCHAR(50) DEFAULT 'Shipping',
        address_line1 VARCHAR(255) NOT NULL,
        address_line2 VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        pincode VARCHAR(20) NOT NULL,
        country VARCHAR(100) DEFAULT 'India',
        is_default TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_addr_cust_id (customer_id)
      );
    `);

    // 6c. Customer Wishlist Relational Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customer_wishlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        product_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_wish_cust_id (customer_id)
      );
    `);

    // 6d. Customer Cart Relational Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customer_cart (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT DEFAULT 1,
        variant_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_cart_cust_id (customer_id)
      );
    `);

    // 6e. Customer Coupon History Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customer_coupon_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        coupon_code VARCHAR(50) NOT NULL,
        discount_amount DECIMAL(10, 2) NOT NULL,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_coup_cust_id (customer_id)
      );
    `);


    // 7. Payments Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        transaction_id VARCHAR(100) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'UPI / Card',
        status VARCHAR(50) DEFAULT 'Completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Reviews Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        product_name VARCHAR(255),
        customer_name VARCHAR(255) NOT NULL,
        rating INT NOT NULL DEFAULT 5,
        comment TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        is_featured TINYINT(1) DEFAULT 0,
        reply TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 9. Coupons Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        discount_type VARCHAR(20) DEFAULT 'percentage',
        discount_value DECIMAL(10, 2) NOT NULL,
        min_order DECIMAL(10, 2) DEFAULT 0.00,
        usage_limit INT DEFAULT 100,
        used_count INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Active',
        expires_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 10. Referrals Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS referrals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        referrer_name VARCHAR(255) NOT NULL,
        referee_name VARCHAR(255) NOT NULL,
        reward_amount DECIMAL(10, 2) DEFAULT 15.00,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 11. Admin Logs Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_email VARCHAR(255) NOT NULL,
        action VARCHAR(255) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ─── SEED DEFAULT ADMIN ───
    const [admins] = await pool.query('SELECT * FROM admin_users WHERE email = ?', ['hkahir46@gmail.com']);
    if (admins.length === 0) {
      await pool.query(
        'INSERT INTO admin_users (email, name, role) VALUES (?, ?, ?)',
        ['hkahir46@gmail.com', 'Primary Admin', 'SuperAdmin']
      );
      console.log('👤 Seeded Admin user: hkahir46@gmail.com');
    }

    // ─── SEED DEFAULT CATEGORIES IF EMPTY ───
    const [cats] = await pool.query('SELECT COUNT(*) as cnt FROM categories');
    if (cats[0].cnt === 0) {
      await pool.query(`
        INSERT INTO categories (name, slug, description, is_active) VALUES
        ('Herbal Extracts', 'herbal-extracts', 'Pharma-grade pure herbal extracts', 1),
        ('Supplements', 'supplements', 'Natural bio-vital nutraceuticals', 1),
        ('Biotech Formulations', 'biotech-formulations', 'Active science solutions', 1),
        ('Skin Care actives', 'skin-care-actives', 'Pure skin wellness bio-compounds', 1);
      `);
      console.log('🌱 Seeded default categories');
    }

    // ─── SEED DEFAULT PRODUCTS IF EMPTY ───
    const [prods] = await pool.query('SELECT COUNT(*) as cnt FROM products');
    if (prods[0].cnt === 0) {
      await pool.query(`
        INSERT INTO products (name, category, price, stock, description, is_active, is_featured) VALUES
        ('LeafExtract Pharma Grade', 'Herbal Extracts', 49.99, 120, 'Pharma grade organic extract', 1, 1),
        ('BioVital Nutraceutical', 'Supplements', 29.50, 85, 'Essential daily vitamins & minerals', 1, 1),
        ('EcoScience Active Solution', 'Biotech Formulations', 89.00, 40, 'Advanced biotech cellular active formula', 1, 1),
        ('Aloe Vera Pure Gel Base', 'Skin Care actives', 19.99, 8, 'Low stock item: pure organic gel base', 1, 0),
        ('Curcumin 95% Extract', 'Herbal Extracts', 65.00, 0, 'Out of stock item: high potency extract', 1, 0);
      `);
      console.log('🌱 Seeded default products');
    }

    // ─── SEED DEFAULT ORDERS IF EMPTY ───
    const [orders] = await pool.query('SELECT COUNT(*) as cnt FROM orders');
    if (orders[0].cnt === 0) {
      await pool.query(`
        INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, subtotal, tax_amount, shipping_fee, discount_amount, total_amount, status, payment_status, shipping_partner, warehouse, tracking_number, shipping_address, billing_address, customer_notes, admin_notes) VALUES
        ('ORD-1001', 'Dr. Ramesh Varma', 'ramesh.v@gmail.com', '+91 9876543210', 120.00, 18.99, 15.00, 14.00, 138.99, 'Pending', 'Paid', 'BlueDart', 'Warehouse A - Hyderabad Central', 'BD-8821034', '42 Bio-Tech Park, Jubilee Hills, Hyderabad, Telangana - 500033', 'Suite 102, Medical Enclave, Hyderabad, Telangana - 500034', 'Please deliver during hospital morning hours.', 'High-priority clinical client account.'),
        ('ORD-1002', 'Anita Sharma', 'anita.s@gmail.com', '+91 9812345678', 49.99, 5.00, 0.00, 5.00, 49.99, 'Confirmed', 'Paid', 'BlueDart', 'Warehouse A - Hyderabad Central', 'BD-9912045', '15 Green Glen Layout, Bellandur, Bengaluru, Karnataka - 560103', '15 Green Glen Layout, Bellandur, Bengaluru, Karnataka - 560103', 'Leave with security guard if not available.', 'Verified phone payment.'),
        ('ORD-1003', 'Vikram Patel', 'vikram.p@gmail.com', '+91 9765432109', 240.00, 27.00, 20.00, 20.00, 267.00, 'Shipped', 'Paid', 'FedEx', 'Warehouse B - Bengaluru Hub', 'FX-7721908', '88 Science City Road, Ahmedabad, Gujarat - 380060', '88 Science City Road, Ahmedabad, Gujarat - 380060', 'Fragile liquid formulation, handle with care.', 'Dispatched via FedEx Express Air.'),
        ('ORD-1004', 'Suresh Kumar', 'suresh.k@gmail.com', '+91 9654321098', 80.00, 9.00, 0.00, 0.00, 89.00, 'Processing', 'Paid', 'Delhivery', 'Warehouse C - Mumbai Logistics', 'DL-4410981', '72 Link Road, Bandra West, Mumbai, Maharashtra - 400050', '72 Link Road, Bandra West, Mumbai, Maharashtra - 400050', 'Call before arrival.', 'Item being packaged.');
      `);
      console.log('🌱 Seeded default orders');
    }

    // Seed Order Items if empty
    const [oItems] = await pool.query('SELECT COUNT(*) as cnt FROM order_items');
    if (oItems[0].cnt === 0) {
      await pool.query(`
        INSERT INTO order_items (order_id, product_id, product_name, product_image, sku, variant_name, price, quantity, total_price) VALUES
        (1, 1, 'LeafExtract Pharma Grade', '/assets/vitamin_c_serum.jpg', 'LFA-VITC-01', '100ml Dropper', 49.99, 2, 99.98),
        (1, 4, 'Aloe Vera Pure Gel Base', '/assets/face_wash.jpg', 'LFA-ALOE-04', '200g Tube', 19.99, 2, 39.98),
        (2, 1, 'LeafExtract Pharma Grade', '/assets/vitamin_c_serum.jpg', 'LFA-VITC-01', '50ml Dropper', 49.99, 1, 49.99),
        (3, 3, 'EcoScience Active Solution', '/assets/night_cream.jpg', 'LFA-ECO-03', '50ml Value Pack', 89.00, 3, 267.00),
        (4, 2, 'BioVital Nutraceutical', '/assets/hydra_glow_moisturizer.jpg', 'LFA-BIO-02', '60 Capsules', 29.50, 3, 88.50);
      `);
      console.log('🌱 Seeded default order items');
    }

    // Seed Order Timeline if empty
    const [oTime] = await pool.query('SELECT COUNT(*) as cnt FROM order_timeline');
    if (oTime[0].cnt === 0) {
      await pool.query(`
        INSERT INTO order_timeline (order_id, title, description, status) VALUES
        (1, 'Order Placed', 'Customer placed order #ORD-1001 successfully on storefront.', 'Pending'),
        (1, 'Payment Confirmed', 'Payment of $138.99 received via UPI / GPay.', 'Paid'),
        (2, 'Order Placed', 'Customer placed order #ORD-1002.', 'Pending'),
        (2, 'Payment Confirmed', 'Payment of $49.99 received via Credit Card.', 'Paid'),
        (2, 'Order Confirmed', 'Admin verified and confirmed order details.', 'Confirmed'),
        (3, 'Order Placed', 'Customer placed order #ORD-1003.', 'Pending'),
        (3, 'Payment Confirmed', 'Payment of $267.00 verified.', 'Paid'),
        (3, 'Order Processing', 'Order items picked at Warehouse B - Bengaluru Hub.', 'Processing'),
        (3, 'Handed to Courier', 'Package handed over to FedEx Express Air (Tracking #FX-7721908).', 'Shipped');
      `);
      console.log('🌱 Seeded default order timeline tracking');
    }


    // ─── SEED DEFAULT CUSTOMERS IF EMPTY ───
    const [custs] = await pool.query('SELECT COUNT(*) as cnt FROM customers');
    if (custs[0].cnt === 0) {
      await pool.query(`
        INSERT INTO customers (name, email, phone, status, loyalty_tier, total_spent, wallet_balance, loyalty_points, referral_earnings) VALUES
        ('Dr. Ramesh Varma', 'ramesh.v@gmail.com', '+91 9876543210', 'Active', 'Gold', 450.00, 75.00, 450, 50.00),
        ('Anita Sharma', 'anita.s@gmail.com', '+91 9812345678', 'Active', 'Silver', 120.00, 25.00, 120, 25.00),
        ('Vikram Patel', 'vikram.p@gmail.com', '+91 9765432109', 'Active', 'Platinum', 1250.00, 150.00, 1250, 100.00),
        ('Suresh Kumar', 'suresh.k@gmail.com', '+91 9654321098', 'Active', 'Silver', 89.00, 0.00, 89, 0.00);
      `);
      console.log('🌱 Seeded default customers');
    }

    // Seed Addresses if empty
    const [addrs] = await pool.query('SELECT COUNT(*) as cnt FROM customer_addresses');
    if (addrs[0].cnt === 0) {
      await pool.query(`
        INSERT INTO customer_addresses (customer_id, type, address_line1, city, state, pincode, is_default) VALUES
        (1, 'Shipping', '42 Bio-Tech Park, Jubilee Hills', 'Hyderabad', 'Telangana', '500033', 1),
        (1, 'Billing', 'Suite 102, Medical Enclave', 'Hyderabad', 'Telangana', '500034', 0),
        (2, 'Shipping', '15 Green Glen Layout, Bellandur', 'Bengaluru', 'Karnataka', '560103', 1),
        (3, 'Shipping', '88 Science City Road', 'Ahmedabad', 'Gujarat', '380060', 1);
      `);
      console.log('🌱 Seeded default customer addresses');
    }

    // Seed Wishlist if empty
    const [wish] = await pool.query('SELECT COUNT(*) as cnt FROM customer_wishlist');
    if (wish[0].cnt === 0) {
      await pool.query(`
        INSERT INTO customer_wishlist (customer_id, product_id) VALUES
        (1, 1), (1, 3), (2, 2), (3, 1), (3, 2), (3, 3);
      `);
      console.log('🌱 Seeded default customer wishlist');
    }

    // Seed Cart if empty
    const [cart] = await pool.query('SELECT COUNT(*) as cnt FROM customer_cart');
    if (cart[0].cnt === 0) {
      await pool.query(`
        INSERT INTO customer_cart (customer_id, product_id, quantity) VALUES
        (1, 2, 2), (2, 1, 1), (3, 3, 1);
      `);
      console.log('🌱 Seeded default customer cart');
    }

    // Seed Coupon History if empty
    const [chist] = await pool.query('SELECT COUNT(*) as cnt FROM customer_coupon_history');
    if (chist[0].cnt === 0) {
      await pool.query(`
        INSERT INTO customer_coupon_history (customer_id, coupon_code, discount_amount) VALUES
        (1, 'LEAFORA15', 15.00), (2, 'WELCOME50', 50.00), (3, 'LEAFORA15', 25.00);
      `);
      console.log('🌱 Seeded default customer coupon history');
    }


    // ─── SEED DEFAULT PAYMENTS IF EMPTY ───
    const [pay] = await pool.query('SELECT COUNT(*) as cnt FROM payments');
    if (pay[0].cnt === 0) {
      await pool.query(`
        INSERT INTO payments (order_id, transaction_id, amount, payment_method, status) VALUES
        (1, 'TXN_98712364', 138.99, 'UPI / GPay', 'Completed'),
        (2, 'TXN_98712365', 49.99, 'Credit Card', 'Completed'),
        (3, 'TXN_98712366', 267.00, 'Net Banking', 'Completed');
      `);
      console.log('🌱 Seeded default payments');
    }

    // ─── SEED DEFAULT REVIEWS IF EMPTY ───
    const [rev] = await pool.query('SELECT COUNT(*) as cnt FROM reviews');
    if (rev[0].cnt === 0) {
      await pool.query(`
        INSERT INTO reviews (product_id, product_name, customer_name, rating, comment, status, is_featured) VALUES
        (1, 'LeafExtract Pharma Grade', 'Dr. Ramesh Varma', 5, 'Excellent purity and high active percentage.', 'Approved', 1),
        (2, 'BioVital Nutraceutical', 'Anita Sharma', 4, 'Very good quality packaging and fast delivery.', 'Pending', 0),
        (3, 'EcoScience Active Solution', 'Vikram Patel', 5, 'Substantial results in formulation stability.', 'Pending', 0);
      `);
      console.log('🌱 Seeded default reviews');
    }

    // ─── SEED DEFAULT COUPONS IF EMPTY ───
    const [coup] = await pool.query('SELECT COUNT(*) as cnt FROM coupons');
    if (coup[0].cnt === 0) {
      await pool.query(`
        INSERT INTO coupons (code, discount_type, discount_value, min_order, usage_limit, used_count, status, expires_at) VALUES
        ('LEAFORA15', 'percentage', 15.00, 50.00, 200, 14, 'Active', '2026-12-31 23:59:59'),
        ('WELCOME50', 'fixed', 50.00, 150.00, 50, 8, 'Active', '2026-12-31 23:59:59'),
        ('SUMMER20', 'percentage', 20.00, 100.00, 100, 100, 'Expired', '2026-08-31 23:59:59');
      `);
      console.log('🌱 Seeded default coupons');
    }

    // ─── SEED DEFAULT REFERRALS IF EMPTY ───
    const [ref] = await pool.query('SELECT COUNT(*) as cnt FROM referrals');
    if (ref[0].cnt === 0) {
      await pool.query(`
        INSERT INTO referrals (referrer_name, referee_name, reward_amount, status) VALUES
        ('Vikram Patel', 'Rajesh Rao', 25.00, 'Pending'),
        ('Dr. Ramesh Varma', 'Kiran Bedi', 25.00, 'Approved'),
        ('Anita Sharma', 'Pooja Hegde', 25.00, 'Pending');
      `);
      console.log('🌱 Seeded default referrals');
    }

    // ─── 12. SHIPROCKET TABLES ───
    // 12a. Shiprocket API Config Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shiprocket_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        api_email VARCHAR(255) DEFAULT 'shipping@leaforalifescience.com',
        api_password VARCHAR(255) DEFAULT '••••••••••••',
        secret_key VARCHAR(255) DEFAULT 'sr_sec_live_99812376',
        token TEXT,
        environment VARCHAR(50) DEFAULT 'production',
        is_connected TINYINT(1) DEFAULT 1,
        auto_sync TINYINT(1) DEFAULT 1,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // 12b. Shiprocket Pickup Locations Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shiprocket_pickup_locations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        location_name VARCHAR(255) NOT NULL,
        contact_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address_line1 VARCHAR(255) NOT NULL,
        address_line2 VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        pincode VARCHAR(20) NOT NULL,
        country VARCHAR(100) DEFAULT 'India',
        is_primary TINYINT(1) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 12c. Shiprocket Shipments Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shiprocket_shipments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        order_number VARCHAR(100) NOT NULL,
        shiprocket_order_id VARCHAR(100),
        shipment_id VARCHAR(100),
        awb_code VARCHAR(100),
        courier_company_id INT,
        courier_name VARCHAR(150),
        pickup_location_id INT,
        pickup_location_name VARCHAR(255),
        pickup_scheduled_date DATE,
        pickup_token_number VARCHAR(100),
        status VARCHAR(100) DEFAULT 'AWB Generated',
        tracking_url TEXT,
        manifest_url TEXT,
        label_url TEXT,
        freight_charges DECIMAL(10, 2) DEFAULT 0.00,
        weight DECIMAL(10, 2) DEFAULT 0.50,
        length DECIMAL(10, 2) DEFAULT 10.0,
        width DECIMAL(10, 2) DEFAULT 10.0,
        height DECIMAL(10, 2) DEFAULT 10.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // 12d. Shiprocket NDR Management Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shiprocket_ndr (
        id INT AUTO_INCREMENT PRIMARY KEY,
        shipment_id INT NOT NULL,
        order_number VARCHAR(100),
        awb_code VARCHAR(100),
        customer_name VARCHAR(255),
        customer_phone VARCHAR(50),
        ndr_reason TEXT,
        action_requested VARCHAR(100) DEFAULT 'Re-attempt',
        action_remarks TEXT,
        status VARCHAR(50) DEFAULT 'Open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 12e. Shiprocket Manifests Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shiprocket_manifests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        manifest_number VARCHAR(100) NOT NULL,
        courier_name VARCHAR(150),
        pickup_location VARCHAR(255),
        total_shipments INT DEFAULT 1,
        download_url TEXT,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ─── SEED DEFAULT SHIPROCKET CONFIG IF EMPTY ───
    const [srCfg] = await pool.query('SELECT COUNT(*) as cnt FROM shiprocket_config');
    if (srCfg[0].cnt === 0) {
      await pool.query(`
        INSERT INTO shiprocket_config (api_email, api_password, secret_key, token, environment, is_connected, auto_sync) VALUES
        ('shipping@leaforalifescience.com', 'pharma_sr_prod_2026', 'sr_sec_live_99812376', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTg3MjE0LCJlbWFpbCI6InNoaXBwaW5nQGxlYWZvcmFsaWZlc2NpZW5jZS5jb20iLCJpYXQiOjE3NDEyNTQ0MDAsImV4cCI6MTc3MjgwODAwMH0.sample_sr_token_signature', 'production', 1, 1);
      `);
      console.log('🌱 Seeded default Shiprocket configuration');
    }

    // ─── SEED DEFAULT PICKUP LOCATIONS IF EMPTY ───
    const [srLocs] = await pool.query('SELECT COUNT(*) as cnt FROM shiprocket_pickup_locations');
    if (srLocs[0].cnt === 0) {
      await pool.query(`
        INSERT INTO shiprocket_pickup_locations (location_name, contact_name, email, phone, address_line1, address_line2, city, state, pincode, is_primary, status) VALUES
        ('Hyderabad HQ Vault', 'Rajesh K. Pharma Manager', 'dispatch.hyd@leafora.com', '+91 9876500112', 'Plot 42, Bio-Tech Corridor, Phase II', 'Jubilee Hills Extension', 'Hyderabad', 'Telangana', '500033', 1, 'Active'),
        ('Bengaluru Distribution Hub', 'Meera Nair Logistics Lead', 'dispatch.blr@leafora.com', '+91 9876500113', 'Warehouse #12, Eco Tech Park', 'Bellandur Ring Road', 'Bengaluru', 'Karnataka', '560103', 0, 'Active'),
        ('Mumbai Port Depot', 'Sanjay Patil Yard Head', 'dispatch.bom@leafora.com', '+91 9876500114', 'Gate 4, Cold Chain Complex', 'Bandra Kurla Logistics Zone', 'Mumbai', 'Maharashtra', '400050', 0, 'Active');
      `);
      console.log('🌱 Seeded default Shiprocket pickup locations');
    }

    // ─── SEED DEFAULT SHIPMENTS IF EMPTY ───
    const [srShip] = await pool.query('SELECT COUNT(*) as cnt FROM shiprocket_shipments');
    if (srShip[0].cnt === 0) {
      await pool.query(`
        INSERT INTO shiprocket_shipments (order_id, order_number, shiprocket_order_id, shipment_id, awb_code, courier_company_id, courier_name, pickup_location_id, pickup_location_name, pickup_scheduled_date, pickup_token_number, status, tracking_url, freight_charges, weight, length, width, height) VALUES
        (1, 'ORD-1001', 'SR-ORD-9901', 'SR-SHP-8801', 'SR-AWB-987121', 1, 'BlueDart Express Air', 1, 'Hyderabad HQ Vault', '2026-09-08', 'PKP-99120', 'AWB Generated', 'https://track.shiprocket.in/SR-AWB-987121', 14.50, 0.75, 12.0, 10.0, 8.0),
        (2, 'ORD-1002', 'SR-ORD-9902', 'SR-SHP-8802', 'SR-AWB-987122', 2, 'Delhivery Surface', 1, 'Hyderabad HQ Vault', '2026-09-08', 'PKP-99121', 'Pickup Scheduled', 'https://track.shiprocket.in/SR-AWB-987122', 8.20, 0.50, 10.0, 10.0, 5.0),
        (3, 'ORD-1003', 'SR-ORD-9903', 'SR-SHP-8803', 'SR-AWB-987123', 3, 'FedEx Express Priority', 2, 'Bengaluru Distribution Hub', '2026-09-07', 'PKP-99119', 'In Transit', 'https://track.shiprocket.in/SR-AWB-987123', 22.00, 1.80, 20.0, 15.0, 12.0),
        (4, 'ORD-1004', 'SR-ORD-9904', 'SR-SHP-8804', 'SR-AWB-987124', 4, 'Xpressbees Air', 3, 'Mumbai Port Depot', '2026-09-06', 'PKP-99118', 'Out for Delivery', 'https://track.shiprocket.in/SR-AWB-987124', 11.00, 0.60, 11.0, 11.0, 6.0);
      `);
      console.log('🌱 Seeded default Shiprocket shipments');
    }

    // ─── SEED DEFAULT NDR CASES IF EMPTY ───
    const [srNdr] = await pool.query('SELECT COUNT(*) as cnt FROM shiprocket_ndr');
    if (srNdr[0].cnt === 0) {
      await pool.query(`
        INSERT INTO shiprocket_ndr (shipment_id, order_number, awb_code, customer_name, customer_phone, ndr_reason, action_requested, action_remarks, status) VALUES
        (2, 'ORD-1002', 'SR-AWB-987122', 'Anita Sharma', '+91 9812345678', 'Customer Unreachable on Phone - Premises Gate Locked', 'Re-attempt', 'Scheduled re-attempt after 2 PM upon customer confirmation.', 'Open'),
        (4, 'ORD-1004', 'SR-AWB-987124', 'Suresh Kumar', '+91 9654321098', 'Address Incomplete / LandMark Missing near Bandra West', 'Buyer Contacted', 'Confirmed updated landmark: Opp. City Hospital Gate 2.', 'Resolved');
      `);
      console.log('🌱 Seeded default Shiprocket NDR cases');
    }

    // ─── SEED DEFAULT MANIFESTS IF EMPTY ───
    const [srMan] = await pool.query('SELECT COUNT(*) as cnt FROM shiprocket_manifests');
    if (srMan[0].cnt === 0) {
      await pool.query(`
        INSERT INTO shiprocket_manifests (manifest_number, courier_name, pickup_location, total_shipments, download_url) VALUES
        ('MNF-2026-0908-01', 'BlueDart Express Air', 'Hyderabad HQ Vault', 2, '/manifests/MNF-2026-0908-01.pdf'),
        ('MNF-2026-0907-04', 'FedEx Express Priority', 'Bengaluru Distribution Hub', 5, '/manifests/MNF-2026-0907-04.pdf');
      `);
      console.log('🌱 Seeded default Shiprocket manifests');
    }

    // Auto-migrate missing columns for existing payments table
    const payCols = [
      "ALTER TABLE payments ADD COLUMN order_number VARCHAR(100) AFTER order_id",
      "ALTER TABLE payments ADD COLUMN customer_name VARCHAR(255) AFTER order_number",
      "ALTER TABLE payments ADD COLUMN customer_email VARCHAR(255) AFTER customer_name",
      "ALTER TABLE payments ADD COLUMN gateway VARCHAR(50) DEFAULT 'Razorpay' AFTER payment_method",
      "ALTER TABLE payments ADD COLUMN refunded_amount DECIMAL(10, 2) DEFAULT 0.00 AFTER amount",
      "ALTER TABLE payments ADD COLUMN refund_status VARCHAR(50) DEFAULT 'None' AFTER refunded_amount",
      "ALTER TABLE payments ADD COLUMN refund_reason TEXT AFTER refund_status",
      "ALTER TABLE payments ADD COLUMN cod_collected TINYINT(1) DEFAULT 0 AFTER status",
      "ALTER TABLE payments ADD COLUMN settlement_id VARCHAR(100) AFTER cod_collected",
      "ALTER TABLE payments ADD COLUMN settlement_status VARCHAR(50) DEFAULT 'Settled' AFTER settlement_id",
      "ALTER TABLE payments ADD COLUMN failure_reason TEXT AFTER settlement_status",
      "ALTER TABLE payments ADD COLUMN retry_count INT DEFAULT 0 AFTER failure_reason"
    ];
    for (const query of payCols) {
      try { await pool.query(query); } catch (e) {}
    }

    // 13. Payment Gateways Config Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_gateways_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        gateway_name VARCHAR(50) NOT NULL UNIQUE,
        key_id VARCHAR(255) NOT NULL,
        key_secret VARCHAR(255) NOT NULL,
        webhook_secret VARCHAR(255),
        environment VARCHAR(50) DEFAULT 'test',
        is_active TINYINT(1) DEFAULT 1,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // 14. Payment Refunds Relational Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_refunds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        payment_id INT NOT NULL,
        order_id INT NOT NULL,
        transaction_id VARCHAR(100) NOT NULL,
        refund_id VARCHAR(100) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        refund_type VARCHAR(50) DEFAULT 'Full',
        reason TEXT,
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 15. Payment Settlement Batches Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_settlements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        settlement_batch_id VARCHAR(100) NOT NULL UNIQUE,
        gateway VARCHAR(50) DEFAULT 'Razorpay',
        total_transactions INT DEFAULT 1,
        gross_amount DECIMAL(10, 2) NOT NULL,
        mdr_fee DECIMAL(10, 2) DEFAULT 0.00,
        tax_amount DECIMAL(10, 2) DEFAULT 0.00,
        net_settled_amount DECIMAL(10, 2) NOT NULL,
        settlement_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'Settled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ─── SEED PAYMENT GATEWAYS CONFIG IF EMPTY ───
    const [gate] = await pool.query('SELECT COUNT(*) as cnt FROM payment_gateways_config');
    if (gate[0].cnt === 0) {
      await pool.query(`
        INSERT INTO payment_gateways_config (gateway_name, key_id, key_secret, webhook_secret, environment, is_active) VALUES
        ('Razorpay', 'rzp_test_SwedUUn1KgRMs0', 'xdW2Ry7T67sUK4zMKb3oOsZh', 'whsec_rzp_live_99210', 'test', 1),
        ('Stripe', 'pk_test_51NxLEAFORA9920102', 'sk_test_51NxLEAFORASec9921', 'whsec_stripe_88120', 'test', 1),
        ('UPI', 'leaforalifesciences@icici', 'VPA_MERCHANT_KEY_882', 'whsec_upi_7721', 'test', 1),
        ('COD', 'COD_HANDLING_DESK', 'COD_SECRET_PIN_001', 'N/A', 'test', 1);
      `);
      console.log('🌱 Seeded default Payment Gateways configuration (Razorpay Test Keys set)');
    }

    // Update existing payment rows with rich details if null
    try {
      await pool.query(`
        UPDATE payments SET 
          order_number = CASE id WHEN 1 THEN 'ORD-1001' WHEN 2 THEN 'ORD-1002' WHEN 3 THEN 'ORD-1003' ELSE CONCAT('ORD-', order_id) END,
          customer_name = CASE id WHEN 1 THEN 'Dr. Ramesh Varma' WHEN 2 THEN 'Anita Sharma' WHEN 3 THEN 'Vikram Patel' ELSE 'Valued Customer' END,
          customer_email = CASE id WHEN 1 THEN 'ramesh.v@gmail.com' WHEN 2 THEN 'anita.s@gmail.com' WHEN 3 THEN 'vikram.p@gmail.com' ELSE 'customer@leafora.com' END,
          gateway = CASE id WHEN 1 THEN 'Razorpay' WHEN 2 THEN 'Stripe' WHEN 3 THEN 'UPI' ELSE 'Razorpay' END,
          settlement_id = CASE id WHEN 1 THEN 'SETL-2026-0908-01' WHEN 2 THEN 'SETL-2026-0908-02' ELSE 'SETL-2026-0908-01' END,
          settlement_status = 'Settled'
        WHERE order_number IS NULL OR gateway IS NULL;
      `);
    } catch (e) {}

    // Seed a failed payment row & COD order if payment table count <= 3
    const [pCount] = await pool.query('SELECT COUNT(*) as cnt FROM payments');
    if (pCount[0].cnt <= 3) {
      await pool.query(`
        INSERT INTO payments (order_id, order_number, customer_name, customer_email, transaction_id, amount, payment_method, gateway, status, cod_collected, settlement_id, settlement_status, failure_reason) VALUES
        (4, 'ORD-1004', 'Suresh Kumar', 'suresh.k@gmail.com', 'TXN_98712367', 89.00, 'Cash on Delivery', 'COD', 'Completed', 1, 'SETL-2026-0908-03', 'Settled', NULL),
        (5, 'ORD-1005', 'Rajesh Rao', 'rajesh.r@gmail.com', 'TXN_FAIL_8871', 145.00, 'UPI / GPay', 'UPI', 'Failed', 0, NULL, 'Pending', 'Bank OTP Session Timed Out / Customer Declined'),
        (6, 'ORD-1006', 'Kiran Bedi', 'kiran.b@gmail.com', 'TXN_98712369', 210.00, 'Credit Card', 'Razorpay', 'Refunded', 0, 'SETL-2026-0907-01', 'Settled', NULL);
      `);
      console.log('🌱 Seeded rich demo payment transactions');
    }

    // Seed Payment Refunds if empty
    const [pRef] = await pool.query('SELECT COUNT(*) as cnt FROM payment_refunds');
    if (pRef[0].cnt === 0) {
      await pool.query(`
        INSERT INTO payment_refunds (payment_id, order_id, transaction_id, refund_id, amount, refund_type, reason) VALUES
        (6, 6, 'TXN_98712369', 'RFD_887210', 210.00, 'Full', 'Order cancelled prior to warehouse dispatch'),
        (1, 1, 'TXN_98712364', 'RFD_887211', 25.00, 'Partial', 'Partial customer goodwill credit for minor outer box packaging crease');
      `);
      console.log('🌱 Seeded default payment refunds audit log');
    }

    // Seed Settlement Batches if empty
    const [pSetl] = await pool.query('SELECT COUNT(*) as cnt FROM payment_settlements');
    if (pSetl[0].cnt === 0) {
      await pool.query(`
        INSERT INTO payment_settlements (settlement_batch_id, gateway, total_transactions, gross_amount, mdr_fee, tax_amount, net_settled_amount, settlement_date, status) VALUES
        ('SETL-2026-0908-01', 'Razorpay', 14, 3480.00, 62.64, 11.28, 3406.08, '2026-09-08', 'Settled'),
        ('SETL-2026-0908-02', 'Stripe', 8, 1890.50, 47.26, 8.50, 1834.74, '2026-09-08', 'Settled'),
        ('SETL-2026-0907-01', 'UPI Direct', 22, 5120.00, 0.00, 0.00, 5120.00, '2026-09-07', 'Settled');
      `);
      console.log('🌱 Seeded default payment settlements batches');
    }

    // ─── COUPONS SCHEMA & MIGRATIONS ───
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coupon_usage_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        coupon_id INT NOT NULL,
        coupon_code VARCHAR(50) NOT NULL,
        order_id INT NULL,
        order_number VARCHAR(100) NOT NULL,
        customer_id INT NULL,
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        discount_applied DECIMAL(10, 2) NOT NULL,
        order_total DECIMAL(10, 2) NOT NULL,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure coupons table has all enterprise columns
    const couponCols = [
      "title VARCHAR(255) DEFAULT 'Special Offer'",
      "description TEXT",
      "min_purchase_amount DECIMAL(10, 2) DEFAULT 0.00",
      "max_discount_amount DECIMAL(10, 2) DEFAULT 0.00",
      "start_date DATETIME NULL",
      "expiry_date DATETIME NULL",
      "total_usage_limit INT DEFAULT 0",
      "per_user_limit INT DEFAULT 1",
      "times_used INT DEFAULT 0",
      "is_first_order_only TINYINT(1) DEFAULT 0",
      "is_free_shipping TINYINT(1) DEFAULT 0",
      "applies_to_type VARCHAR(50) DEFAULT 'all'",
      "target_ids TEXT NULL",
      "is_active TINYINT(1) DEFAULT 1",
      "deleted_at TIMESTAMP NULL"
    ];

    for (const colDef of couponCols) {
      try {
        await pool.query(`ALTER TABLE coupons ADD COLUMN ${colDef}`);
      } catch (e) {}
    }

    // Seed default coupons if empty
    const [coupCount] = await pool.query('SELECT COUNT(*) as cnt FROM coupons');
    if (coupCount[0].cnt === 0) {
      await pool.query(`
        INSERT INTO coupons (code, title, description, discount_type, discount_value, min_purchase_amount, max_discount_amount, start_date, expiry_date, total_usage_limit, per_user_limit, times_used, is_first_order_only, is_free_shipping, applies_to_type, is_active) VALUES
        ('WELCOME10', 'Welcome First Order Discount', 'Get 10% off on your first order with Leafora Lifescience', 'percentage', 10.00, 20.00, 50.00, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), 500, 1, 42, 1, 0, 'all', 1),
        ('FREESHIP50', 'Free Express Shipping', 'Free shipping on orders above $50', 'free_shipping', 0.00, 50.00, 15.00, NOW(), DATE_ADD(NOW(), INTERVAL 60 DAY), 1000, 3, 118, 0, 1, 'all', 1),
        ('LEAFORA20', 'Herbal Extracts Special 20%', 'Save 20% on all botanical and herbal extract formulations', 'percentage', 20.00, 40.00, 100.00, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 200, 2, 65, 0, 0, 'category', 1),
        ('VIPFLAT50', 'VIP Platinum $50 Off', 'Flat $50 off for VIP loyal customers', 'fixed_amount', 50.00, 150.00, 50.00, NOW(), DATE_ADD(NOW(), INTERVAL 45 DAY), 50, 1, 19, 0, 0, 'user', 1),
        ('SUMMER2026-X1', 'Bulk Promo Voucher Code 1', 'Automated bulk summer promotion series', 'percentage', 15.00, 30.00, 30.00, NOW(), DATE_ADD(NOW(), INTERVAL 15 DAY), 100, 1, 4, 0, 0, 'all', 1);
      `);
      console.log('🌱 Seeded default enterprise coupons');
    }

    // Seed default coupon usage history if empty
    const [cHist] = await pool.query('SELECT COUNT(*) as cnt FROM coupon_usage_history');
    if (cHist[0].cnt === 0) {
      await pool.query(`
        INSERT INTO coupon_usage_history (coupon_id, coupon_code, order_id, order_number, customer_id, customer_name, customer_email, discount_applied, order_total) VALUES
        (1, 'WELCOME10', 1, 'ORD-1001', 1, 'Dr. Ramesh Varma', 'ramesh.v@gmail.com', 14.00, 138.99),
        (2, 'FREESHIP50', 2, 'ORD-1002', 2, 'Anita Sharma', 'anita.s@gmail.com', 5.00, 49.99),
        (3, 'LEAFORA20', 3, 'ORD-1003', 3, 'Vikram Patel', 'vikram.p@gmail.com', 20.00, 267.00);
      `);
      console.log('🌱 Seeded default coupon usage history');
    }

    // ─── REFERRALS & WALLET SCHEMA & MIGRATIONS ───
    await pool.query(`
      CREATE TABLE IF NOT EXISTS referral_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        referrer_reward_amount DECIMAL(10, 2) DEFAULT 15.00,
        referee_discount_amount DECIMAL(10, 2) DEFAULT 10.00,
        min_order_amount DECIMAL(10, 2) DEFAULT 30.00,
        signup_bonus_amount DECIMAL(10, 2) DEFAULT 5.00,
        min_cashout_threshold DECIMAL(10, 2) DEFAULT 25.00,
        max_wallet_balance DECIMAL(10, 2) DEFAULT 500.00,
        is_program_active TINYINT(1) DEFAULT 1,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        transaction_type VARCHAR(20) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        source VARCHAR(50) NOT NULL,
        reference_id VARCHAR(100) NULL,
        description TEXT,
        balance_after DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Upgrade referrals table columns safely
    const refCols = [
      "referrer_id INT NULL",
      "referrer_email VARCHAR(255)",
      "referee_id INT NULL",
      "referee_email VARCHAR(255)",
      "referee_discount DECIMAL(10, 2) DEFAULT 10.00",
      "rejection_reason VARCHAR(255) NULL"
    ];

    for (const colDef of refCols) {
      try {
        await pool.query(`ALTER TABLE referrals ADD COLUMN ${colDef}`);
      } catch (e) {}
    }

    // Seed default referral settings if empty
    const [refSetCount] = await pool.query('SELECT COUNT(*) as cnt FROM referral_settings');
    if (refSetCount[0].cnt === 0) {
      await pool.query(`
        INSERT INTO referral_settings (referrer_reward_amount, referee_discount_amount, min_order_amount, signup_bonus_amount, min_cashout_threshold, max_wallet_balance, is_program_active) VALUES
        (15.00, 10.00, 30.00, 5.00, 25.00, 500.00, 1);
      `);
      console.log('🌱 Seeded default Referral Program settings');
    }

    // Seed default referrals if empty or count <= 3
    const [refCount] = await pool.query('SELECT COUNT(*) as cnt FROM referrals');
    if (refCount[0].cnt <= 3) {
      await pool.query(`
        INSERT INTO referrals (referrer_id, referrer_name, referrer_email, referee_id, referee_name, referee_email, reward_amount, referee_discount, status, rejection_reason) VALUES
        (1, 'Dr. Ramesh Varma', 'ramesh.v@gmail.com', 2, 'Anita Sharma', 'anita.s@gmail.com', 15.00, 10.00, 'Approved', NULL),
        (3, 'Vikram Patel', 'vikram.p@gmail.com', 4, 'Suresh Kumar', 'suresh.k@gmail.com', 15.00, 10.00, 'Pending', NULL),
        (1, 'Dr. Ramesh Varma', 'ramesh.v@gmail.com', 5, 'Rajesh Rao', 'rajesh.r@gmail.com', 15.00, 10.00, 'Approved', NULL),
        (2, 'Anita Sharma', 'anita.s@gmail.com', 6, 'Kiran Bedi', 'kiran.b@gmail.com', 15.00, 10.00, 'Rejected', 'Duplicate IP address / Self-referral attempt');
      `);
      console.log('🌱 Seeded rich default referrals history');
    }

    // Seed default wallet transactions if empty
    const [wCount] = await pool.query('SELECT COUNT(*) as cnt FROM wallet_transactions');
    if (wCount[0].cnt === 0) {
      await pool.query(`
        INSERT INTO wallet_transactions (customer_id, customer_name, customer_email, transaction_type, amount, source, reference_id, description, balance_after) VALUES
        (1, 'Dr. Ramesh Varma', 'ramesh.v@gmail.com', 'credit', 15.00, 'referral_bonus', 'REF-1001', 'Referral reward for inviting Anita Sharma', 140.00),
        (1, 'Dr. Ramesh Varma', 'ramesh.v@gmail.com', 'credit', 15.00, 'referral_bonus', 'REF-1003', 'Referral reward for inviting Rajesh Rao', 155.00),
        (2, 'Anita Sharma', 'anita.s@gmail.com', 'credit', 5.00, 'signup_bonus', 'SIGNUP-2026', 'Welcome account signup bonus credit', 45.00),
        (3, 'Vikram Patel', 'vikram.p@gmail.com', 'debit', 20.00, 'order_payment', 'ORD-1003', 'Applied wallet balance discount on order ORD-1003', 65.00);
      `);
      console.log('🌱 Seeded default customer wallet transactions log');
    }

    // ─── REVIEWS SCHEMA & MIGRATIONS ───
    const reviewCols = [
      "product_image VARCHAR(255) NULL",
      "customer_id INT NULL",
      "customer_email VARCHAR(255) NULL",
      "title VARCHAR(255) NULL",
      "images TEXT NULL",
      "is_verified_buyer TINYINT(1) DEFAULT 1",
      "is_reported_abuse TINYINT(1) DEFAULT 0",
      "abuse_reason VARCHAR(255) NULL",
      "admin_reply TEXT NULL",
      "admin_replied_at DATETIME NULL",
      "deleted_at TIMESTAMP NULL"
    ];

    for (const colDef of reviewCols) {
      try {
        await pool.query(`ALTER TABLE reviews ADD COLUMN ${colDef}`);
      } catch (e) {}
    }

    // Seed default reviews if empty or count <= 2
    const [revCount] = await pool.query('SELECT COUNT(*) as cnt FROM reviews');
    if (revCount[0].cnt <= 2) {
      await pool.query(`
        INSERT INTO reviews (product_id, product_name, product_image, customer_id, customer_name, customer_email, rating, title, comment, images, status, is_featured, is_verified_buyer, is_reported_abuse, abuse_reason, admin_reply, admin_replied_at) VALUES
        (1, 'LeafExtract Pharma Grade', '/assets/vitamin_c_serum.jpg', 1, 'Dr. Ramesh Varma', 'ramesh.v@gmail.com', 5, 'Outstanding Potency & Purity', 'Extremely high purity extract. Used this in our clinical formulation trial with wonderful results. Highly recommended for premium skincare labs!', '["/assets/vitamin_c_serum.jpg", "/assets/hydra_glow_moisturizer.jpg"]', 'Approved', 1, 1, 0, NULL, 'Thank you Dr. Varma! We take great pride in maintaining pharma-grade ISO certification standards.', NOW()),
        (2, 'BioVital Nutraceutical', '/assets/hydra_glow_moisturizer.jpg', 2, 'Anita Sharma', 'anita.s@gmail.com', 5, 'Visible Skin Radiance in 2 Weeks', 'I have been taking these nutraceutical capsules daily for 14 days and my skin texture has become noticeably smoother and hydrated.', '["/assets/hydra_glow_moisturizer.jpg"]', 'Approved', 1, 1, 0, NULL, NULL, NULL),
        (3, 'EcoScience Active Solution', '/assets/night_cream.jpg', 3, 'Vikram Patel', 'vikram.p@gmail.com', 4, 'Great Active Formula, Fast Delivery', 'Solid formulation quality. Bottle packaging was securely bubble wrapped. Will re-order next month.', '[]', 'Pending', 0, 1, 0, NULL, NULL, NULL),
        (4, 'Aloe Vera Pure Gel Base', '/assets/face_wash.jpg', 4, 'Suresh Kumar', 'suresh.k@gmail.com', 2, 'Packaging Cap Leakage Issue', 'The gel quality is okay but the plastic cap was slightly loose upon unboxing causing minor leakage.', '[]', 'Approved', 0, 1, 0, NULL, 'Apologies Suresh for the packaging inconvenience. We are sending a replacement cap seal immediately!', NOW()),
        (1, 'LeafExtract Pharma Grade', '/assets/vitamin_c_serum.jpg', 5, 'Anonymous User', 'spam.user@temp.com', 1, 'Competitor Spam Post', 'Do not buy this brand, buy competitor product X instead at website.com', '[]', 'Rejected', 0, 0, 1, 'Promotional spam / Competitor link promotion', NULL, NULL);
      `);
      console.log('🌱 Seeded default rich product reviews');
    }

    // ─── 16. HOMEPAGE CMS & LAYOUT BUILDER TABLES ───
    await pool.query(`
      CREATE TABLE IF NOT EXISTS homepage_banners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        banner_type ENUM('hero', 'offer', 'category', 'flash_sale') NOT NULL DEFAULT 'hero',
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255) NULL,
        desktop_image_url VARCHAR(500) NOT NULL,
        mobile_image_url VARCHAR(500) NULL,
        link_url VARCHAR(500) NULL,
        button_text VARCHAR(100) DEFAULT 'Shop Now',
        category_id INT NULL,
        flash_sale_end_time DATETIME NULL,
        display_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS homepage_sections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        section_key VARCHAR(100) NOT NULL UNIQUE,
        section_name VARCHAR(100) NOT NULL,
        custom_title VARCHAR(255) NULL,
        custom_subtitle VARCHAR(255) NULL,
        item_limit INT DEFAULT 8,
        display_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // Seed default homepage banners if empty
    const [bannerCount] = await pool.query('SELECT COUNT(*) as cnt FROM homepage_banners');
    if (bannerCount[0].cnt === 0) {
      await pool.query(`
        INSERT INTO homepage_banners (banner_type, title, subtitle, desktop_image_url, mobile_image_url, link_url, button_text, flash_sale_end_time, display_order, is_active) VALUES
        ('hero', 'Pharma-Grade Botanical Actives', '100% Pure Organic Extracts Certified by Global Herbal Labs', '/assets/hero_banner_1.jpg', '/assets/hero_banner_1_mobile.jpg', '/shop', 'Explore Catalog', NULL, 1, 1),
        ('hero', 'Clinical Skin Radiance & Hydration', 'Formulated with Vitamin C & Hyaluronic Acid Hybrids', '/assets/hero_banner_2.jpg', '/assets/hero_banner_2_mobile.jpg', '/category/skincare', 'Discover Skincare', NULL, 2, 1),
        ('offer', 'FLAT 20% OFF Summer Festival Sale', 'Use Promo Code SUMMER2026 at Checkout on Orders Above $99', '/assets/offer_banner_1.jpg', '/assets/offer_banner_1_mobile.jpg', '/offers', 'Claim Discount', NULL, 1, 1),
        ('category', 'Pure Plant Extract Oils', 'Cold-pressed bioactive seed & leaf distillates', '/assets/cat_banner_extracts.jpg', '/assets/cat_banner_extracts_mobile.jpg', '/category/extracts', 'Shop Extracts', NULL, 1, 1),
        ('flash_sale', 'Mega Flash Sale - Up to 50% OFF', 'Limited Stock Available! Ends In:', '/assets/flash_sale_banner.jpg', '/assets/flash_sale_banner_mobile.jpg', '/flash-sale', 'Grab Deals Now', DATE_ADD(NOW(), INTERVAL 3 DAY), 1, 1);
      `);
      console.log('🌱 Seeded default homepage banners');
    }

    // Seed default homepage layout sections if empty
    const [secCount] = await pool.query('SELECT COUNT(*) as cnt FROM homepage_sections');
    if (secCount[0].cnt === 0) {
      await pool.query(`
        INSERT INTO homepage_sections (section_key, section_name, custom_title, custom_subtitle, item_limit, display_order, is_active) VALUES
        ('hero_slider', 'Hero Banner Slider', 'Featured Seasonal Promotions', 'Discover our latest organic formulations & clinical breakthroughs', 5, 1, 1),
        ('category_banners', 'Category Banners Grid', 'Browse By Herbal Specialty', 'Explore curated categories crafted for holistic wellness', 6, 2, 1),
        ('offer_banner', 'Promo Offer Banners', 'Exclusive Customer Deals', 'Special promotional discounts and coupon codes', 2, 3, 1),
        ('flash_sale', 'Flash Sale Countdown', 'Limited Time Flash Offers', 'Hurry! Special discounted rates available while stocks last', 4, 4, 1),
        ('featured_products', 'Featured Products', 'Featured Botanical Solutions', 'Handpicked top-selling formulations loved by customers', 8, 5, 1),
        ('trending_products', 'Trending Now Products', 'Trending In Clinical Trials', 'Fastest growing formulations based on customer demand', 8, 6, 1),
        ('new_arrivals', 'New Arrivals', 'Latest Product Arrivals', 'Explore our brand new additions to the Leafora catalog', 8, 7, 1),
        ('best_sellers', 'Best Sellers', 'All-Time Customer Favorites', 'Our highest-rated & most ordered products of the month', 8, 8, 1);
      `);
      console.log('🌱 Seeded default homepage layout sections');
    }

    // ─── 17. SYSTEM SETTINGS, ADMIN USERS, ROLES & LOGS TABLES ───
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key_name VARCHAR(100) PRIMARY KEY,
        key_value TEXT,
        setting_group VARCHAR(50) NOT NULL DEFAULT 'store',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(50) NULL,
        password_hash VARCHAR(255) DEFAULT '$2b$10$e8w.x7W3J.W1zJ2L...demo',
        role VARCHAR(100) DEFAULT 'Store Manager',
        permissions TEXT NULL,
        is_active TINYINT(1) DEFAULT 1,
        last_login_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_name VARCHAR(100) NOT NULL UNIQUE,
        description VARCHAR(255) NULL,
        permissions TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_name VARCHAR(255) NOT NULL,
        action VARCHAR(255) NOT NULL,
        module VARCHAR(100) NOT NULL,
        ip_address VARCHAR(100) DEFAULT '127.0.0.1',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS login_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_email VARCHAR(255) NOT NULL,
        ip_address VARCHAR(100) DEFAULT '127.0.0.1',
        browser VARCHAR(255) DEFAULT 'Chrome / Windows',
        status VARCHAR(50) DEFAULT 'Success',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default system settings if empty
    const [settingsCount] = await pool.query('SELECT COUNT(*) as cnt FROM system_settings');
    if (settingsCount[0].cnt === 0) {
      await pool.query(`
        INSERT INTO system_settings (key_name, key_value, setting_group) VALUES
        ('store_name', 'Leafora Life Sciences', 'store'),
        ('support_email', 'support@leaforalifescience.com', 'store'),
        ('support_phone', '+91 98765 43210', 'store'),
        ('store_address', '104 Botanical Tech Park, HITEC City, Hyderabad, Telangana 500081', 'store'),
        ('store_currency', 'USD ($)', 'store'),
        ('header_logo_url', '/assets/leafora_logo_header.png', 'store'),
        ('footer_logo_url', '/assets/leafora_logo_footer.png', 'store'),
        ('favicon_url', '/favicon.ico', 'store'),
        ('meta_title', 'Leafora Lifescience - Pharma-Grade Botanical Formulations', 'seo'),
        ('meta_description', 'Discover 100% pure organic extracts, clinical skincare hybrids, and certified bioactive supplements formulated for holistic wellness.', 'seo'),
        ('meta_keywords', 'botanical extracts, clinical skincare, organic supplements, vitamin c serum, hyaluronic acid, herbal lab', 'seo'),
        ('google_analytics_id', 'G-LEAFORA2026', 'seo'),
        ('gstin_number', '36AAAAA0000A1Z5', 'gst'),
        ('hsn_code', '30049011', 'gst'),
        ('default_tax_percent', '18.00', 'gst'),
        ('tax_included_in_price', 'true', 'gst'),
        ('free_shipping_threshold', '75.00', 'delivery'),
        ('standard_shipping_fee', '5.99', 'delivery'),
        ('express_shipping_fee', '14.99', 'delivery'),
        ('smtp_host', 'smtp.sendgrid.net', 'email_smtp'),
        ('smtp_port', '587', 'email_smtp'),
        ('smtp_username', 'apikey', 'email_smtp'),
        ('smtp_password', 'SG.981237612387126387123', 'email_smtp'),
        ('smtp_encryption', 'TLS', 'email_smtp'),
        ('smtp_sender_name', 'Leafora Lifescience Customer Support', 'email_smtp'),
        ('smtp_sender_email', 'notifications@leaforalifescience.com', 'email_smtp'),
        ('sms_provider', 'MSG91', 'sms'),
        ('sms_api_key', 'msg91_live_sec_99812376', 'sms'),
        ('sms_sender_id', 'LEAFOR', 'sms'),
        ('sms_otp_template_id', 'TMP_OTP_9918', 'sms'),
        ('enable_sms_notifications', 'true', 'sms'),
        ('security_2fa_enabled', 'false', 'security'),
        ('security_session_timeout_mins', '60', 'security'),
        ('security_max_failed_attempts', '5', 'security'),
        ('security_ip_whitelist', '127.0.0.1, 192.168.1.1', 'security');
      `);
      console.log('🌱 Seeded default system settings');
    }

    // Seed default admin roles if empty
    const [rolesCount] = await pool.query('SELECT COUNT(*) as cnt FROM admin_roles');
    if (rolesCount[0].cnt === 0) {
      await pool.query(`
        INSERT INTO admin_roles (role_name, description, permissions) VALUES
        ('Super Admin', 'Full unrestricted access to all store modules and security settings', '["all"]'),
        ('Store Manager', 'Manage categories, products, coupons, banners, and review moderation', '["categories", "products", "coupons", "banners", "reviews"]'),
        ('Fulfillment Manager', 'Manage order processing, warehouse assignment, and Shiprocket logistics', '["orders", "shiprocket", "inventory"]'),
        ('Customer Support', 'View customer directories, order details, and issue refunds', '["customers", "orders_read", "refunds"]');
      `);
      console.log('🌱 Seeded default admin roles');
    }

    // Seed default admin users if empty
    const [adminUserCount] = await pool.query('SELECT COUNT(*) as cnt FROM admin_users');
    if (adminUserCount[0].cnt === 0) {
      await pool.query(`
        INSERT INTO admin_users (name, email, phone, role, permissions, is_active, last_login_at) VALUES
        ('Sai Admin', 'admin@leaforalifescience.com', '+91 98765 00001', 'Super Admin', '["all"]', 1, NOW()),
        ('Priya Sharma', 'priya.s@leaforalifescience.com', '+91 98765 00002', 'Store Manager', '["categories", "products", "coupons", "banners", "reviews"]', 1, NOW()),
        ('Rahul Verma', 'rahul.v@leaforalifescience.com', '+91 98765 00003', 'Fulfillment Manager', '["orders", "shiprocket", "inventory"]', 1, NOW());
      `);
      console.log('🌱 Seeded default admin users');
    }

    // Seed default activity logs if empty
    const [logsCount] = await pool.query('SELECT COUNT(*) as cnt FROM activity_logs');
    if (logsCount[0].cnt === 0) {
      await pool.query(`
        INSERT INTO activity_logs (admin_name, action, module, ip_address) VALUES
        ('Sai Admin', 'System settings updated (Store Name & GSTIN)', 'Settings', '127.0.0.1'),
        ('Priya Sharma', 'Created new discount coupon SUMMER2026', 'Coupons', '192.168.1.15'),
        ('Rahul Verma', 'Dispatched AWB SR-AWB-99812 via BlueDart', 'Shiprocket', '192.168.1.20'),
        ('Sai Admin', 'Approved customer review #1 by Dr. Ramesh Varma', 'Reviews', '127.0.0.1');
      `);
      console.log('🌱 Seeded default activity logs');
    }

    // Seed default login history if empty
    const [loginCount] = await pool.query('SELECT COUNT(*) as cnt FROM login_history');
    if (loginCount[0].cnt === 0) {
      await pool.query(`
        INSERT INTO login_history (admin_email, ip_address, browser, status) VALUES
        ('admin@leaforalifescience.com', '127.0.0.1', 'Chrome 128.0 (Windows 11)', 'Success'),
        ('priya.s@leaforalifescience.com', '192.168.1.15', 'Firefox 129.0 (macOS)', 'Success'),
        ('admin@leaforalifescience.com', '127.0.0.1', 'Chrome 128.0 (Windows 11)', 'Success'),
        ('unknown.hacker@bad.com', '45.12.89.102', 'Python-urllib/3.10', 'Failed');
      `);
      console.log('🌱 Seeded default login history');
    }

    console.log('✅ Database initialization complete.');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
  }
};

module.exports = { initDb };


