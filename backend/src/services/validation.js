// Server-side validation for Indian mobile numbers, pincodes and delivery addresses.
// Mirrors frontend/src/services/validation.js.

/** Digits only; drops a leading +91 / 91 / 0 so "+91 98765 43210" → "9876543210". */
const normalizeMobile = (value) => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
};

const isValidMobile = (v) => /^[6-9]\d{9}$/.test(String(v || ''));
const isValidPincode = (v) => /^[1-9]\d{5}$/.test(String(v || '').trim());
// Letters (any language), spaces, . ' -  — min 2 chars by default; pass 1 for last names / initials ("D")
const isValidName = (v, minLength = 2) => {
  const s = String(v || '').trim();
  return s.length >= minLength && s.length <= 60 && /^[\p{L}][\p{L}\p{M}\s.'-]*$/u.test(s);
};

const MESSAGES = {
  name: 'Enter a valid name (letters only, at least 2 characters).',
  mobile: 'Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.',
  pincode: 'Enter a valid 6-digit pincode.',
  address: 'Enter your house no., building and street (at least 5 characters).',
  city: 'Enter a valid city name.',
  state: 'Enter a valid state name.',
};

/**
 * Validates and normalises a delivery address.
 * Returns { ok: true, value } or { ok: false, field, message }.
 */
const validateAddress = (a = {}) => {
  const value = {
    name: String(a.name || '').trim(),
    phone: normalizeMobile(a.phone),
    address_line1: String(a.address_line1 || '').trim(),
    address_line2: String(a.address_line2 || '').trim(),
    city: String(a.city || '').trim(),
    state: String(a.state || '').trim(),
    pincode: String(a.pincode || '').trim(),
  };
  const fail = (field) => ({ ok: false, field, message: MESSAGES[field === 'address_line1' ? 'address' : field === 'phone' ? 'mobile' : field] });

  if (!isValidName(value.name)) return fail('name');
  if (!isValidMobile(value.phone)) return fail('phone');
  if (value.address_line1.length < 5 || value.address_line1.length > 200) return fail('address_line1');
  if (!isValidName(value.city)) return fail('city');
  if (!isValidName(value.state)) return fail('state');
  if (!isValidPincode(value.pincode)) return fail('pincode');
  return { ok: true, value };
};

module.exports = {
  normalizeMobile,
  isValidMobile,
  isValidPincode,
  isValidName,
  validateAddress,
  MESSAGES,
};
