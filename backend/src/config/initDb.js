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

    // Columns used by admin user management (table may pre-date them)
    for (const colDef of [
      'phone VARCHAR(50) NULL',
      'permissions TEXT NULL',
      'is_active TINYINT(1) DEFAULT 1',
      'last_login_at DATETIME NULL',
    ]) {
      try { await pool.query(`ALTER TABLE admin_users ADD COLUMN ${colDef}`); } catch (e) { /* already exists */ }
    }

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
        ingredients TEXT,
        benefits TEXT,
        how_to_use TEXT,
        skin_type VARCHAR(255),
        key_ingredients TEXT,
        manufacturing_date VARCHAR(50),
        expiry_date VARCHAR(50),
        storage TEXT,
        warning TEXT,
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
      "ALTER TABLE products ADD COLUMN is_best_seller TINYINT(1) DEFAULT 0",
      "ALTER TABLE products ADD COLUMN brand VARCHAR(100) DEFAULT 'Leafora' AFTER name",
      "ALTER TABLE products ADD COLUMN sku VARCHAR(100) DEFAULT NULL AFTER brand",
      "ALTER TABLE products ADD COLUMN net_quantity VARCHAR(50) DEFAULT '100g' AFTER sku",
      "ALTER TABLE products ADD COLUMN warehouse_stock INT DEFAULT 0 AFTER stock",
      "ALTER TABLE products ADD COLUMN reserved_stock INT DEFAULT 0 AFTER warehouse_stock",
      "ALTER TABLE products ADD COLUMN low_stock_threshold INT DEFAULT 10 AFTER reserved_stock",
      "ALTER TABLE products ADD COLUMN ingredients TEXT AFTER description",
      "ALTER TABLE products ADD COLUMN benefits TEXT AFTER ingredients",
      "ALTER TABLE products ADD COLUMN how_to_use TEXT AFTER benefits",
      "ALTER TABLE products ADD COLUMN skin_type VARCHAR(255) AFTER how_to_use",
      "ALTER TABLE products ADD COLUMN key_ingredients TEXT AFTER skin_type",
      "ALTER TABLE products ADD COLUMN manufacturing_date VARCHAR(50) AFTER key_ingredients",
      "ALTER TABLE products ADD COLUMN expiry_date VARCHAR(50) AFTER manufacturing_date",
      "ALTER TABLE products ADD COLUMN storage TEXT AFTER expiry_date",
      "ALTER TABLE products ADD COLUMN warning TEXT AFTER storage",
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
        image_url LONGTEXT NOT NULL,
        is_primary TINYINT(1) DEFAULT 0,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_product_id (product_id)
      );
    `);

    // 4bb. Media Storage Table (Direct Database Storage for Images)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS media_storage (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        data_base64 LONGTEXT NOT NULL,
        file_size INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_filename (filename)
      );
    `);

    // Ensure image columns use LONGTEXT to store base64 image data directly in database
    const longtextQueries = [
      "ALTER TABLE categories MODIFY COLUMN image_url LONGTEXT",
      "ALTER TABLE categories MODIFY COLUMN icon_url LONGTEXT",
      "ALTER TABLE categories MODIFY COLUMN banner_url LONGTEXT",
      "ALTER TABLE products MODIFY COLUMN image_url LONGTEXT",
      "ALTER TABLE products MODIFY COLUMN images LONGTEXT",
      "ALTER TABLE product_images MODIFY COLUMN image_url LONGTEXT",
      "ALTER TABLE homepage_banners MODIFY COLUMN desktop_image_url LONGTEXT",
      "ALTER TABLE homepage_banners MODIFY COLUMN mobile_image_url LONGTEXT"
    ];

    for (const query of longtextQueries) {
      try { await pool.query(query); } catch (e) {}
    }

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
      "ALTER TABLE orders ADD COLUMN deleted_at DATETIME DEFAULT NULL AFTER exchange_notes",
      "ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'COD' AFTER payment_status",
      "ALTER TABLE orders ADD COLUMN razorpay_order_id VARCHAR(100) DEFAULT NULL AFTER payment_method",
      "ALTER TABLE orders ADD COLUMN razorpay_payment_id VARCHAR(100) DEFAULT NULL AFTER razorpay_order_id",
      "ALTER TABLE orders ADD COLUMN razorpay_signature VARCHAR(255) DEFAULT NULL AFTER razorpay_payment_id"
    ];
    for (const query of ordCols) {
      try { await pool.query(query); } catch (e) {}
    }

    // 5d. Payments Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT DEFAULT NULL,
        order_number VARCHAR(100) DEFAULT NULL,
        customer_name VARCHAR(255) DEFAULT NULL,
        customer_email VARCHAR(255) NOT NULL,
        transaction_id VARCHAR(100) DEFAULT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'Razorpay',
        gateway VARCHAR(50) DEFAULT 'Razorpay',
        razorpay_order_id VARCHAR(100) DEFAULT NULL,
        razorpay_payment_id VARCHAR(100) DEFAULT NULL,
        razorpay_signature VARCHAR(255) DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'Captured',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const pmtCols = [
      "ALTER TABLE payments ADD COLUMN customer_name VARCHAR(255) DEFAULT NULL AFTER order_number",
      "ALTER TABLE payments ADD COLUMN transaction_id VARCHAR(100) DEFAULT NULL AFTER customer_email",
      "ALTER TABLE payments ADD COLUMN gateway VARCHAR(50) DEFAULT 'Razorpay' AFTER payment_method",
      "ALTER TABLE payments ADD COLUMN razorpay_order_id VARCHAR(100) DEFAULT NULL AFTER gateway",
      "ALTER TABLE payments ADD COLUMN razorpay_payment_id VARCHAR(100) DEFAULT NULL AFTER razorpay_order_id",
      "ALTER TABLE payments ADD COLUMN razorpay_signature VARCHAR(255) DEFAULT NULL AFTER razorpay_payment_id"
    ];
    for (const query of pmtCols) {
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
      "ALTER TABLE customers ADD COLUMN first_name VARCHAR(100) DEFAULT NULL AFTER name",
      "ALTER TABLE customers ADD COLUMN last_name VARCHAR(100) DEFAULT NULL AFTER first_name",
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
        name VARCHAR(255) DEFAULT NULL,
        phone VARCHAR(50) DEFAULT NULL,
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

    const addrCols = [
      "ALTER TABLE customer_addresses ADD COLUMN name VARCHAR(255) DEFAULT NULL AFTER customer_id",
      "ALTER TABLE customer_addresses ADD COLUMN phone VARCHAR(50) DEFAULT NULL AFTER name"
    ];
    for (const query of addrCols) {
      try { await pool.query(query); } catch (e) {}
    }

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

    // ─── PRIMARY ADMIN (from ADMIN_EMAIL env var) ───
    const primaryAdminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    if (primaryAdminEmail) {
      const [admins] = await pool.query('SELECT id FROM admin_users WHERE LOWER(email) = ?', [primaryAdminEmail]);
      if (admins.length === 0) {
        await pool.query('INSERT INTO admin_users (email, name, role) VALUES (?, ?, ?)', [primaryAdminEmail, 'Primary Admin', 'SuperAdmin']);
        console.log('👤 Registered primary admin from ADMIN_EMAIL');
      }
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

    // ─── 16. HOMEPAGE CMS & LAYOUT BUILDER TABLES ───
    await pool.query(`
      CREATE TABLE IF NOT EXISTS homepage_banners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        banner_type ENUM('hero', 'offer', 'category', 'flash_sale') NOT NULL DEFAULT 'hero',
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255) NULL,
        desktop_image_url LONGTEXT NOT NULL,
        mobile_image_url LONGTEXT NULL,
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

    // Ensure columns are LONGTEXT even on existing databases
    try {
      await pool.query('ALTER TABLE homepage_banners MODIFY COLUMN desktop_image_url LONGTEXT');
      await pool.query('ALTER TABLE homepage_banners MODIFY COLUMN mobile_image_url LONGTEXT');
    } catch (_) {}

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

    // ─── STATUS COLUMNS: plain text, never a fixed ENUM ───
    // Older databases created these as ENUMs without values like 'Paid' / 'In Transit'.
    // MySQL then silently stored '' instead, so paid orders looked unpaid. VARCHAR keeps all values.
    for (const sql of [
      "ALTER TABLE orders MODIFY COLUMN status VARCHAR(50) DEFAULT 'Pending'",
      "ALTER TABLE orders MODIFY COLUMN payment_status VARCHAR(50) DEFAULT 'Pending'",
      "ALTER TABLE payments MODIFY COLUMN status VARCHAR(50) DEFAULT 'Pending'",
    ]) {
      try { await pool.query(sql); } catch (e) { console.warn('Status column migration notice:', e.message); }
    }
    // Repair rows blanked by the old ENUM: only orders with a recorded, signature-verified Razorpay payment
    try {
      const [fixedPayments] = await pool.query(
        `UPDATE payments SET status = 'Success'
         WHERE (status IS NULL OR status = '') AND razorpay_payment_id IS NOT NULL AND razorpay_signature IS NOT NULL`
      );
      const [fixedOrders] = await pool.query(
        `UPDATE orders o SET o.payment_status = 'Paid'
         WHERE (o.payment_status IS NULL OR o.payment_status = '') AND o.razorpay_payment_id IS NOT NULL
           AND EXISTS (SELECT 1 FROM payments p WHERE p.razorpay_payment_id = o.razorpay_payment_id AND p.status = 'Success')`
      );
      const [fixedStatus] = await pool.query("UPDATE orders SET status = 'Pending' WHERE status IS NULL OR status = ''");
      const n = fixedPayments.affectedRows + fixedOrders.affectedRows + fixedStatus.affectedRows;
      if (n > 0) console.log(`🔧 Repaired blank statuses: ${fixedOrders.affectedRows} orders marked Paid, ${fixedPayments.affectedRows} payments, ${fixedStatus.affectedRows} order statuses`);
    } catch (e) {
      console.warn('Status repair notice:', e.message);
    }

    console.log('✅ Database initialization complete.');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
  }
};

module.exports = { initDb };

