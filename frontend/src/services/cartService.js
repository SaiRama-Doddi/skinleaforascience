// Cart Service to persist cart items in localStorage and sync count across components

export const DEFAULT_PRODUCT_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23FAF7F2"/><circle cx="100" cy="90" r="45" fill="%23EFE8DE"/><path d="M100 55 C80 55 70 75 70 95 C70 115 80 125 100 125 C120 125 130 115 130 95 C130 75 120 55 100 55 Z" fill="%23A67C52" opacity="0.75"/><path d="M100 65 Q115 85 100 115 Q85 85 100 65 Z" fill="%23FFFFFF" opacity="0.6"/><text x="50%" y="160" dominant-baseline="middle" text-anchor="middle" fill="%23A67C52" font-family="sans-serif" font-size="12" font-weight="600">LeafOra Product</text></svg>';

export const extractProductImage = (product) => {
  if (!product) return DEFAULT_PRODUCT_IMAGE;
  if (typeof product.image_url === 'string' && product.image_url.trim() !== '') return product.image_url;
  if (typeof product.image === 'string' && product.image.trim() !== '') return product.image;
  if (typeof product.imageUrl === 'string' && product.imageUrl.trim() !== '') return product.imageUrl;
  if (Array.isArray(product.gallery) && product.gallery.length > 0 && typeof product.gallery[0] === 'string' && product.gallery[0].trim() !== '') return product.gallery[0];
  if (Array.isArray(product.images) && product.images.length > 0 && typeof product.images[0] === 'string' && product.images[0].trim() !== '') return product.images[0];
  return DEFAULT_PRODUCT_IMAGE;
};

export const getCart = () => {
  try {
    const raw = localStorage.getItem('leafora_cart');
    const items = raw ? JSON.parse(raw) : [];
    if (Array.isArray(items)) {
      return items.map(item => ({
        ...item,
        image_url: (!item.image_url || item.image_url.trim() === '') ? extractProductImage(item) : item.image_url
      }));
    }
    return [];
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

  const imgUrl = extractProductImage(product);

  if (existingIdx >= 0) {
    cart[existingIdx].quantity = (Number(cart[existingIdx].quantity) || 1) + Number(quantity);
    if (!cart[existingIdx].image_url || cart[existingIdx].image_url === DEFAULT_PRODUCT_IMAGE) {
      cart[existingIdx].image_url = imgUrl;
    }
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: imgUrl,
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

