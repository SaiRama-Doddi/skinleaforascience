import skincareStoryPhoto from '../assets/skincare_story_showcase.jpg';
import botanicalProductsPhoto from '../assets/login_botanical_products.jpg';

export const DEFAULT_PRODUCT_IMAGE = skincareStoryPhoto;

export const extractProductImage = (product) => {
  if (!product) return defaultProductPhoto();
  
  const candidates = [
    product.image_url,
    product.image,
    product.imageUrl,
    Array.isArray(product.gallery) && product.gallery[0],
    Array.isArray(product.images) && product.images[0]
  ];

  for (const img of candidates) {
    if (img && typeof img === 'string' && img.trim() !== '' && !img.includes('data:image/svg+xml') && !img.includes('LeafOra Product')) {
      return img;
    }
  }

  // Fallback to real high-resolution botanical skincare photo
  return defaultProductPhoto(product);
};

const defaultProductPhoto = (product) => {
  if (product && product.name && (product.name.toLowerCase().includes('wash') || product.name.toLowerCase().includes('sunscreen') || product.name.toLowerCase().includes('cream'))) {
    return botanicalProductsPhoto;
  }
  return skincareStoryPhoto;
};

export const getCart = () => {
  try {
    const raw = localStorage.getItem('leafora_cart');
    const items = raw ? JSON.parse(raw) : [];
    if (Array.isArray(items)) {
      return items.map(item => {
        const hasValidImg = item.image_url && typeof item.image_url === 'string' && item.image_url.trim() !== '' && !item.image_url.includes('data:image/svg+xml');
        return {
          ...item,
          image_url: hasValidImg ? item.image_url : extractProductImage(item)
        };
      });
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

