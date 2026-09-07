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

    // 3. Categories Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        description TEXT,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Products Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT 'General',
        category_id INT DEFAULT NULL,
        price DECIMAL(10, 2) NOT NULL,
        stock INT DEFAULT 0,
        description TEXT,
        image_url VARCHAR(500),
        is_active TINYINT(1) DEFAULT 1,
        is_featured TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        total_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        payment_status VARCHAR(50) DEFAULT 'Paid',
        shipping_partner VARCHAR(100) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, total_amount, status, payment_status, shipping_partner) VALUES
        ('ORD-1001', 'Dr. Ramesh Varma', 'ramesh.v@gmail.com', '+91 9876543210', 138.99, 'Pending', 'Paid', NULL),
        ('ORD-1002', 'Anita Sharma', 'anita.s@gmail.com', '+91 9812345678', 49.99, 'Confirmed', 'Paid', 'BlueDart'),
        ('ORD-1003', 'Vikram Patel', 'vikram.p@gmail.com', '+91 9765432109', 267.00, 'Shipped', 'Paid', 'FedEx'),
        ('ORD-1004', 'Suresh Kumar', 'suresh.k@gmail.com', '+91 9654321098', 89.00, 'Pending', 'Paid', NULL);
      `);
      console.log('🌱 Seeded default orders');
    }

    // ─── SEED DEFAULT CUSTOMERS IF EMPTY ───
    const [custs] = await pool.query('SELECT COUNT(*) as cnt FROM customers');
    if (custs[0].cnt === 0) {
      await pool.query(`
        INSERT INTO customers (name, email, phone, status, loyalty_tier, total_spent) VALUES
        ('Dr. Ramesh Varma', 'ramesh.v@gmail.com', '+91 9876543210', 'Active', 'Gold', 450.00),
        ('Anita Sharma', 'anita.s@gmail.com', '+91 9812345678', 'Active', 'Silver', 120.00),
        ('Vikram Patel', 'vikram.p@gmail.com', '+91 9765432109', 'Active', 'Platinum', 1250.00),
        ('Suresh Kumar', 'suresh.k@gmail.com', '+91 9654321098', 'Active', 'Silver', 89.00);
      `);
      console.log('🌱 Seeded default customers');
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

    console.log('✅ Database initialization complete.');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
  }
};

module.exports = { initDb };
