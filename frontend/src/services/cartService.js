// Cart Service to persist cart items in localStorage and sync count across components

export const getCart = () => {
  try {
    const raw = localStorage.getItem('leafora_cart');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const getCartCount = () => {
  const cart = getCart();
  return cart.reduce((total, item) => total + (Number(item.quantity) || 1), 0);
};

export const getCartSubtotal = () => {
  const cart = getCart();
  return cart.reduce((total, item) => total + (parseFloat(item.price || 0) * (Number(item.quantity) || 1)), 0);
};

export const addToCart = (product, quantity = 1) => {
  if (!product || !product.id) return;
  const cart = getCart();
  const existingIdx = cart.findIndex(item => String(item.id) === String(product.id));

  if (existingIdx >= 0) {
    cart[existingIdx].quantity = (Number(cart[existingIdx].quantity) || 1) + Number(quantity);
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url || (Array.isArray(product.images) && product.images[0]) || '',
      brand: product.brand || 'Leafora',
      category: product.category || '',
      quantity: Number(quantity) || 1
    });
  }

  localStorage.setItem('leafora_cart', JSON.stringify(cart));
  window.dispatchEvent(new Event('leafora_cart_updated'));
};

export const updateCartQuantity = (productId, newQuantity) => {
  let cart = getCart();
  if (newQuantity <= 0) {
    cart = cart.filter(item => String(item.id) !== String(productId));
  } else {
    const item = cart.find(item => String(item.id) === String(productId));
    if (item) item.quantity = newQuantity;
  }
  localStorage.setItem('leafora_cart', JSON.stringify(cart));
  window.dispatchEvent(new Event('leafora_cart_updated'));
};

export const removeFromCart = (productId) => {
  const cart = getCart().filter(item => String(item.id) !== String(productId));
  localStorage.setItem('leafora_cart', JSON.stringify(cart));
  window.dispatchEvent(new Event('leafora_cart_updated'));
};

export const clearCart = () => {
  localStorage.removeItem('leafora_cart');
  window.dispatchEvent(new Event('leafora_cart_updated'));
};
