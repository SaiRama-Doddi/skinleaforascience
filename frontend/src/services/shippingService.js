import { useEffect, useState } from 'react';
import api from './api';

// Shipping charges are set by the admin (Admin Dashboard → Shipping Charges).
// The server always recalculates them at checkout; these values are for display.

export const DEFAULT_SHIPPING = Object.freeze({
  shipping_fee: 99,
  free_shipping_enabled: true,
  free_shipping_threshold: 999,
});

const CACHE_MS = 60 * 1000;
let cached = null;
let cachedAt = 0;
let inflight = null;
const listeners = new Set();

export const fetchShippingSettings = async (force = false) => {
  if (!force && cached && Date.now() - cachedAt < CACHE_MS) return cached;
  if (!inflight) {
    inflight = api
      .get('/shipping-settings')
      .then((res) => {
        const d = (res && res.data) || {};
        cached = {
          shipping_fee: Number(d.shipping_fee ?? DEFAULT_SHIPPING.shipping_fee),
          free_shipping_enabled: d.free_shipping_enabled !== undefined ? Boolean(d.free_shipping_enabled) : DEFAULT_SHIPPING.free_shipping_enabled,
          free_shipping_threshold: Number(d.free_shipping_threshold ?? DEFAULT_SHIPPING.free_shipping_threshold),
        };
        cachedAt = Date.now();
        listeners.forEach((fn) => fn(cached));
        return cached;
      })
      .catch(() => cached || DEFAULT_SHIPPING)
      .finally(() => { inflight = null; });
  }
  return inflight;
};

/** Called by the admin screen after saving so open pages pick up new values immediately. */
export const setShippingSettingsCache = (settings) => {
  cached = { ...settings };
  cachedAt = Date.now();
  listeners.forEach((fn) => fn(cached));
};

export const calcShippingFee = (subtotal, s = DEFAULT_SHIPPING) => {
  if (!subtotal || subtotal <= 0) return 0;
  if (s.free_shipping_enabled && subtotal >= s.free_shipping_threshold) return 0;
  return Number(s.shipping_fee) || 0;
};

export const formatRupees = (n) => {
  const v = Number(n) || 0;
  return Number.isInteger(v) ? `₹${v}` : `₹${v.toFixed(2)}`;
};

export const useShippingSettings = () => {
  const [settings, setSettings] = useState(cached || DEFAULT_SHIPPING);
  useEffect(() => {
    listeners.add(setSettings);
    fetchShippingSettings().then(setSettings);
    return () => listeners.delete(setSettings);
  }, []);
  return settings;
};
