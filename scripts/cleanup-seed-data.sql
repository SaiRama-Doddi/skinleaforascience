-- ════════════════════════════════════════════════════════════════════════════
-- Leafora: remove demo/fake rows that older versions of initDb.js inserted
-- ════════════════════════════════════════════════════════════════════════════
-- HOW TO RUN (Hostinger → hPanel → Databases → phpMyAdmin → select DB → SQL tab):
--   1. EXPORT A FULL BACKUP FIRST (phpMyAdmin → Export → Quick → SQL).
--   2. Run PART 1 alone and look at the counts. Every row it counts is demo data.
--   3. Run PART 2. It is one transaction: if any statement fails, nothing changes.
--
-- Matching is by the exact values the old seed code inserted (order numbers
-- ORD-1001…ORD-1006 together with the demo e-mails, TXN_/RFD_/SETL-/SR- codes,
-- demo admin e-mails, etc.), so real customer data is not touched.
--
-- NOT deleted automatically (review by hand in phpMyAdmin):
--   * products named 'LeafExtract Pharma Grade', 'BioVital Nutraceutical',
--     'EcoScience Active Solution', 'Aloe Vera Pure Gel Base', 'Curcumin 95% Extract'
--   * categories 'Herbal Extracts', 'Supplements', 'Biotech Formulations',
--     'Skin Care actives', 'Facial Serums', 'Vitamin C Serums'
--   These may have been edited into your real catalogue, so they are left alone.
-- ════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────── PART 1: PREVIEW ───────────────────────────
SELECT 'orders' AS tbl, COUNT(*) AS demo_rows FROM orders
  WHERE order_number IN ('ORD-1001','ORD-1002','ORD-1003','ORD-1004','ORD-1005','ORD-1006')
    AND customer_email IN ('ramesh.v@gmail.com','anita.s@gmail.com','vikram.p@gmail.com','suresh.k@gmail.com','rajesh.r@gmail.com','kiran.b@gmail.com')
UNION ALL SELECT 'customers', COUNT(*) FROM customers
  WHERE email IN ('ramesh.v@gmail.com','anita.s@gmail.com','vikram.p@gmail.com','suresh.k@gmail.com') AND password_hash IS NULL
UNION ALL SELECT 'payments', COUNT(*) FROM payments
  WHERE transaction_id IN ('TXN_98712364','TXN_98712365','TXN_98712366','TXN_98712367','TXN_FAIL_8871','TXN_98712369')
UNION ALL SELECT 'payment_refunds', COUNT(*) FROM payment_refunds WHERE refund_id IN ('RFD_887210','RFD_887211')
UNION ALL SELECT 'payment_settlements', COUNT(*) FROM payment_settlements WHERE settlement_batch_id IN ('SETL-2026-0908-01','SETL-2026-0908-02','SETL-2026-0907-01')
UNION ALL SELECT 'payment_gateways_config (Stripe/UPI/COD demo keys)', COUNT(*) FROM payment_gateways_config
  WHERE key_secret IN ('sk_test_51NxLEAFORASec9921','VPA_MERCHANT_KEY_882','COD_SECRET_PIN_001')
UNION ALL SELECT 'reviews', COUNT(*) FROM reviews
  WHERE customer_email IN ('ramesh.v@gmail.com','anita.s@gmail.com','vikram.p@gmail.com','suresh.k@gmail.com','spam.user@temp.com')
     OR (customer_email IS NULL AND customer_name IN ('Dr. Ramesh Varma','Anita Sharma','Vikram Patel'))
UNION ALL SELECT 'coupons', COUNT(*) FROM coupons
  WHERE code IN ('LEAFORA15','WELCOME50','SUMMER20','WELCOME10','FREESHIP50','LEAFORA20','VIPFLAT50') OR code LIKE 'SUMMER2026-X%'
UNION ALL SELECT 'coupon_usage_history', COUNT(*) FROM coupon_usage_history WHERE order_number IN ('ORD-1001','ORD-1002','ORD-1003')
UNION ALL SELECT 'referrals', COUNT(*) FROM referrals
  WHERE referrer_name IN ('Dr. Ramesh Varma','Anita Sharma','Vikram Patel')
UNION ALL SELECT 'wallet_transactions', COUNT(*) FROM wallet_transactions
  WHERE customer_email IN ('ramesh.v@gmail.com','anita.s@gmail.com','vikram.p@gmail.com','suresh.k@gmail.com')
UNION ALL SELECT 'shiprocket_shipments', COUNT(*) FROM shiprocket_shipments WHERE awb_code IN ('SR-AWB-987121','SR-AWB-987122','SR-AWB-987123','SR-AWB-987124')
UNION ALL SELECT 'shiprocket_ndr', COUNT(*) FROM shiprocket_ndr WHERE awb_code IN ('SR-AWB-987122','SR-AWB-987124')
UNION ALL SELECT 'shiprocket_manifests', COUNT(*) FROM shiprocket_manifests WHERE manifest_number IN ('MNF-2026-0908-01','MNF-2026-0907-04')
UNION ALL SELECT 'shiprocket_pickup_locations', COUNT(*) FROM shiprocket_pickup_locations WHERE email IN ('dispatch.hyd@leafora.com','dispatch.blr@leafora.com','dispatch.bom@leafora.com')
UNION ALL SELECT 'shiprocket_config (fake credentials)', COUNT(*) FROM shiprocket_config WHERE secret_key = 'sr_sec_live_99812376'
UNION ALL SELECT 'homepage_banners (stock-photo demos)', COUNT(*) FROM homepage_banners
  WHERE title IN ('Pharma-Grade Botanical Actives','Clinical Skin Radiance & Hydration','FLAT 20% OFF Summer Festival Sale','Pure Plant Extract Oils','Mega Flash Sale - Up to 50% OFF')
UNION ALL SELECT 'admin_users (demo admins — security risk)', COUNT(*) FROM admin_users
  WHERE email IN ('admin@leaforalifescience.com','priya.s@leaforalifescience.com','rahul.v@leaforalifescience.com')
UNION ALL SELECT 'activity_logs', COUNT(*) FROM activity_logs WHERE admin_name IN ('Sai Admin','Priya Sharma','Rahul Verma')
UNION ALL SELECT 'login_history', COUNT(*) FROM login_history
  WHERE admin_email IN ('admin@leaforalifescience.com','priya.s@leaforalifescience.com','unknown.hacker@bad.com')
UNION ALL SELECT 'system_settings (demo address/phone/currency)', COUNT(*) FROM system_settings;


-- ─────────────────────────── PART 2: DELETE ───────────────────────────
START TRANSACTION;

-- Child rows of demo orders first
DELETE oi FROM order_items oi JOIN orders o ON o.id = oi.order_id
  WHERE o.order_number IN ('ORD-1001','ORD-1002','ORD-1003','ORD-1004','ORD-1005','ORD-1006')
    AND o.customer_email IN ('ramesh.v@gmail.com','anita.s@gmail.com','vikram.p@gmail.com','suresh.k@gmail.com','rajesh.r@gmail.com','kiran.b@gmail.com');
DELETE ot FROM order_timeline ot JOIN orders o ON o.id = ot.order_id
  WHERE o.order_number IN ('ORD-1001','ORD-1002','ORD-1003','ORD-1004','ORD-1005','ORD-1006')
    AND o.customer_email IN ('ramesh.v@gmail.com','anita.s@gmail.com','vikram.p@gmail.com','suresh.k@gmail.com','rajesh.r@gmail.com','kiran.b@gmail.com');

DELETE FROM payment_refunds WHERE refund_id IN ('RFD_887210','RFD_887211');
DELETE FROM payments WHERE transaction_id IN ('TXN_98712364','TXN_98712365','TXN_98712366','TXN_98712367','TXN_FAIL_8871','TXN_98712369');
DELETE FROM payment_settlements WHERE settlement_batch_id IN ('SETL-2026-0908-01','SETL-2026-0908-02','SETL-2026-0907-01');
DELETE FROM payment_gateways_config WHERE key_secret IN ('sk_test_51NxLEAFORASec9921','VPA_MERCHANT_KEY_882','COD_SECRET_PIN_001');

DELETE FROM shiprocket_ndr WHERE awb_code IN ('SR-AWB-987122','SR-AWB-987124');
DELETE FROM shiprocket_shipments WHERE awb_code IN ('SR-AWB-987121','SR-AWB-987122','SR-AWB-987123','SR-AWB-987124');
DELETE FROM shiprocket_manifests WHERE manifest_number IN ('MNF-2026-0908-01','MNF-2026-0907-04');
DELETE FROM shiprocket_pickup_locations WHERE email IN ('dispatch.hyd@leafora.com','dispatch.blr@leafora.com','dispatch.bom@leafora.com');
DELETE FROM shiprocket_config WHERE secret_key = 'sr_sec_live_99812376';

DELETE FROM coupon_usage_history WHERE order_number IN ('ORD-1001','ORD-1002','ORD-1003');
DELETE FROM orders
  WHERE order_number IN ('ORD-1001','ORD-1002','ORD-1003','ORD-1004','ORD-1005','ORD-1006')
    AND customer_email IN ('ramesh.v@gmail.com','anita.s@gmail.com','vikram.p@gmail.com','suresh.k@gmail.com','rajesh.r@gmail.com','kiran.b@gmail.com');

DELETE FROM reviews
  WHERE customer_email IN ('ramesh.v@gmail.com','anita.s@gmail.com','vikram.p@gmail.com','suresh.k@gmail.com','spam.user@temp.com')
     OR (customer_email IS NULL AND customer_name IN ('Dr. Ramesh Varma','Anita Sharma','Vikram Patel'));
DELETE FROM coupons WHERE code IN ('LEAFORA15','WELCOME50','SUMMER20','WELCOME10','FREESHIP50','LEAFORA20','VIPFLAT50') OR code LIKE 'SUMMER2026-X%';
DELETE FROM referrals WHERE referrer_name IN ('Dr. Ramesh Varma','Anita Sharma','Vikram Patel');
DELETE FROM wallet_transactions WHERE customer_email IN ('ramesh.v@gmail.com','anita.s@gmail.com','vikram.p@gmail.com','suresh.k@gmail.com');

-- Demo customers (they never had passwords, so no real person ever signed in as them)
DELETE ca FROM customer_addresses ca JOIN customers c ON c.id = ca.customer_id
  WHERE c.email IN ('ramesh.v@gmail.com','anita.s@gmail.com','vikram.p@gmail.com','suresh.k@gmail.com') AND c.password_hash IS NULL;
DELETE cw FROM customer_wishlist cw JOIN customers c ON c.id = cw.customer_id
  WHERE c.email IN ('ramesh.v@gmail.com','anita.s@gmail.com','vikram.p@gmail.com','suresh.k@gmail.com') AND c.password_hash IS NULL;
DELETE cc FROM customer_cart cc JOIN customers c ON c.id = cc.customer_id
  WHERE c.email IN ('ramesh.v@gmail.com','anita.s@gmail.com','vikram.p@gmail.com','suresh.k@gmail.com') AND c.password_hash IS NULL;
DELETE ch FROM customer_coupon_history ch JOIN customers c ON c.id = ch.customer_id
  WHERE c.email IN ('ramesh.v@gmail.com','anita.s@gmail.com','vikram.p@gmail.com','suresh.k@gmail.com') AND c.password_hash IS NULL;
DELETE FROM customers WHERE email IN ('ramesh.v@gmail.com','anita.s@gmail.com','vikram.p@gmail.com','suresh.k@gmail.com') AND password_hash IS NULL;

DELETE FROM homepage_banners
  WHERE title IN ('Pharma-Grade Botanical Actives','Clinical Skin Radiance & Hydration','FLAT 20% OFF Summer Festival Sale','Pure Plant Extract Oils','Mega Flash Sale - Up to 50% OFF');

-- Demo admin accounts could request admin login codes: remove them
DELETE FROM admin_users WHERE email IN ('admin@leaforalifescience.com','priya.s@leaforalifescience.com','rahul.v@leaforalifescience.com');
DELETE FROM activity_logs WHERE admin_name IN ('Sai Admin','Priya Sharma','Rahul Verma');
DELETE FROM login_history WHERE admin_email IN ('admin@leaforalifescience.com','priya.s@leaforalifescience.com','unknown.hacker@bad.com');

-- The Settings screen was removed; its demo values (fake address, '+91 98765 43210', 'USD ($)') are unused
DELETE FROM system_settings;

COMMIT;
