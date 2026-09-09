const { pool } = require('../config/db');
const { sendOrderConfirmationEmail } = require('../services/mailer');

// 1. GET USER PROFILE
const getUserProfile = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: 'User email is required.' });
    }

    const [rows] = await pool.query(
      'SELECT id, name, first_name, last_name, email, phone, wallet_balance, loyalty_points, loyalty_tier, avatar_url, created_at FROM customers WHERE LOWER(email) = LOWER(?)',
      [email.trim()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    const user = rows[0];
    const firstName = user.first_name || (user.name ? user.name.split(' ')[0] : '');
    const lastName = user.last_name || (user.name ? user.name.split(' ').slice(1).join(' ') : '');

    return res.status(200).json({
      success: true,
      user: {
        ...user,
        first_name: firstName,
        last_name: lastName
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. UPDATE USER PROFILE
const updateUserProfile = async (req, res) => {
  try {
    const { email, first_name, last_name, phone } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'User email is required.' });
    }

    const fullName = `${first_name || ''} ${last_name || ''}`.trim();

    await pool.query(
      `UPDATE customers SET first_name = ?, last_name = ?, name = ?, phone = ? WHERE LOWER(email) = LOWER(?)`,
      [first_name || '', last_name || '', fullName, phone || '', email.trim()]
    );

    return res.status(200).json({
      success: true,
      message: 'Profile details updated successfully!'
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. GET USER ADDRESSES
const getUserAddresses = async (req, res) => {
  try {
    const { customer_id, email } = req.query;

    let custId = customer_id;
    if (!custId && email) {
      const [rows] = await pool.query('SELECT id FROM customers WHERE LOWER(email) = LOWER(?)', [email.trim()]);
      if (rows.length > 0) custId = rows[0].id;
    }

    if (!custId) {
      return res.status(200).json({ success: true, addresses: [] });
    }

    const [addresses] = await pool.query(
      'SELECT * FROM customer_addresses WHERE customer_id = ? ORDER BY is_default DESC, id DESC',
      [custId]
    );

    return res.status(200).json({
      success: true,
      addresses
    });
  } catch (error) {
    console.error('Error fetching user addresses:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. ADD USER ADDRESS
const addUserAddress = async (req, res) => {
  try {
    const { customer_id, email, name, phone, type, address_line1, address_line2, city, state, pincode, is_default } = req.body;

    let custId = customer_id;
    if (!custId && email) {
      const [rows] = await pool.query('SELECT id FROM customers WHERE LOWER(email) = LOWER(?)', [email.trim()]);
      if (rows.length > 0) custId = rows[0].id;
    }

    if (!address_line1 || !city || !state || !pincode) {
      return res.status(400).json({ success: false, message: 'Street address, city, state, and pincode are required.' });
    }

    // If marked default, unset existing default addresses
    if (is_default && custId) {
      await pool.query('UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?', [custId]);
    }

    const [result] = await pool.query(
      `INSERT INTO customer_addresses (customer_id, name, phone, type, address_line1, address_line2, city, state, pincode, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        custId || 1,
        name || '',
        phone || '',
        type || 'Shipping',
        address_line1,
        address_line2 || '',
        city,
        state,
        pincode,
        is_default ? 1 : 0
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'New delivery address added successfully!',
      address_id: result.insertId
    });
  } catch (error) {
    console.error('Error adding user address:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. DELETE USER ADDRESS
const deleteUserAddress = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM customer_addresses WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Address removed successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. GET USER ORDERS HISTORY
const getUserOrders = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(200).json({ success: true, orders: [] });
    }

    const [orders] = await pool.query(
      `SELECT * FROM orders WHERE LOWER(customer_email) = LOWER(?) AND deleted_at IS NULL ORDER BY created_at DESC`,
      [email.trim()]
    );

    // Attach order items for each order
    for (let order of orders) {
      const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = items || [];
    }

    return res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. GET USER WISHLIST
const getUserWishlist = async (req, res) => {
  try {
    const { customer_id, email } = req.query;
    let custId = customer_id;
    if (!custId && email) {
      const [rows] = await pool.query('SELECT id FROM customers WHERE LOWER(email) = LOWER(?)', [email.trim()]);
      if (rows.length > 0) custId = rows[0].id;
    }

    if (!custId) {
      return res.status(200).json({ success: true, wishlist: [] });
    }

    const [wishlistItems] = await pool.query(
      `SELECT w.id as wishlist_id, p.* FROM customer_wishlist w
       JOIN products p ON w.product_id = p.id
       WHERE w.customer_id = ? ORDER BY w.created_at DESC`,
      [custId]
    );

    return res.status(200).json({
      success: true,
      wishlist: wishlistItems
    });
  } catch (error) {
    console.error('Error fetching user wishlist:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. PLACE USER ORDER
const placeUserOrder = async (req, res) => {
  try {
    const { 
      customer_name, 
      customer_email, 
      customer_phone, 
      shipping_address, 
      items, 
      subtotal, 
      shipping_fee, 
      discount_amount, 
      total_amount, 
      payment_method,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!customer_email || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order details and items are required.' });
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const formattedAddress = typeof shipping_address === 'object' 
      ? `${shipping_address.name ? shipping_address.name + ', ' : ''}${shipping_address.address_line1}${shipping_address.address_line2 ? ', ' + shipping_address.address_line2 : ''}, ${shipping_address.city}, ${shipping_address.state} - ${shipping_address.pincode} (Phone: ${shipping_address.phone || customer_phone})`
      : shipping_address;

    const pm = payment_method || (razorpay_payment_id ? 'Razorpay' : 'COD');
    const ps = pm === 'COD' ? 'Pending' : 'Paid';

    const [orderResult] = await pool.query(
      `INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, subtotal, shipping_fee, discount_amount, total_amount, status, payment_status, payment_method, razorpay_order_id, razorpay_payment_id, razorpay_signature, shipping_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber,
        customer_name || customer_email.split('@')[0],
        customer_email.trim().toLowerCase(),
        customer_phone || '',
        subtotal || total_amount,
        shipping_fee || 0.00,
        discount_amount || 0.00,
        total_amount,
        ps,
        pm,
        razorpay_order_id || null,
        razorpay_payment_id || null,
        razorpay_signature || null,
        formattedAddress
      ]
    );

    const orderId = orderResult.insertId;

    // Insert order items and automatically reduce product stock
    for (const item of items) {
      const qty = item.quantity || 1;
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity, total_price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.id,
          item.name,
          item.image_url || item.image || '',
          item.price,
          qty,
          (item.price * qty)
        ]
      );

      // Deduct quantity from products stock table automatically
      if (item.id) {
        await pool.query(
          `UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?`,
          [qty, item.id]
        );
      }
    }

    // Insert Payment Log Entry in Database
    try {
      await pool.query(
        `INSERT INTO payments (order_id, order_number, customer_name, customer_email, transaction_id, amount, payment_method, gateway, razorpay_order_id, razorpay_payment_id, razorpay_signature, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          orderNumber,
          customer_name || customer_email.split('@')[0],
          customer_email.trim().toLowerCase(),
          razorpay_payment_id || `TXN_${Date.now()}`,
          total_amount,
          pm,
          pm === 'Razorpay' ? 'Razorpay' : 'COD',
          razorpay_order_id || null,
          razorpay_payment_id || null,
          razorpay_signature || null,
          ps === 'Paid' ? 'Success' : 'Pending'
        ]
      );
    } catch (e) {
      console.warn('Could not insert payment record:', e.message);
    }

    // Insert Timeline Event
    await pool.query(
      `INSERT INTO order_timeline (order_id, title, description, status)
       VALUES (?, 'Order Placed', ?, 'Pending')`,
      [orderId, `Order #${orderNumber} placed successfully via ${pm}.`]
    );

    // Trigger confirmation email
    try {
      sendOrderConfirmationEmail(customer_email, {
        order_number: orderNumber,
        total_amount,
        shipping_address: formattedAddress
      });
    } catch (e) {
      console.warn('Order confirmation email trigger failed:', e.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: {
        id: orderId,
        order_number: orderNumber,
        total_amount,
        status: 'Pending',
        payment_method: pm,
        payment_status: ps
      }
    });

  } catch (error) {
    console.error('Error placing order:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserAddresses,
  addUserAddress,
  deleteUserAddress,
  getUserOrders,
  getUserWishlist,
  placeUserOrder
};
