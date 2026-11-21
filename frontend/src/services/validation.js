// Shared form validation for Indian addresses and contact numbers.
// The backend enforces the same rules (backend/src/services/validation.js).

/** Keeps digits only; drops a leading +91 / 91 / 0 when pasted; max 10 digits. */
export const sanitizeMobileInput = (value) => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length > 10 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 10);
};

export const sanitizePincodeInput = (value) => String(value || '').replace(/\D/g, '').slice(0, 6);

/** Letters (any language), spaces, dot, apostrophe and hyphen. */
// \p{M} keeps combining marks (e.g. Hindi/Tamil vowel signs) so Indian-script names type correctly
export const sanitizeNameInput = (value) => String(value || '').replace(/[^\p{L}\p{M}\s.'-]/gu, '').slice(0, 60);

export const isValidMobile = (v) => /^[6-9]\d{9}$/.test(String(v || ''));
export const isValidPincode = (v) => /^[1-9]\d{5}$/.test(String(v || ''));
// Letters (any language), spaces, . ' -  — min 2 chars by default; pass 1 for last names / initials ("D")
export const isValidName = (v, minLength = 2) => {
  const s = String(v || '').trim();
  return s.length >= minLength && s.length <= 60 && /^[\p{L}][\p{L}\p{M}\s.'-]*$/u.test(s);
};

export const MESSAGES = {
  name: 'Enter a valid name (letters only, at least 2 characters).',
  mobile: 'Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.',
  pincode: 'Enter a valid 6-digit pincode.',
  address: 'Enter your house no., building and street (at least 5 characters).',
  city: 'Enter a valid city name.',
  state: 'Enter a valid state name.',
};

/** Returns { field: message } for every invalid field of a delivery address. Empty object = valid. */
export const validateAddress = (a = {}) => {
  const errors = {};
  if (!isValidName(a.name)) errors.name = MESSAGES.name;
  if (!isValidMobile(a.phone)) errors.phone = MESSAGES.mobile;
  if (String(a.address_line1 || '').trim().length < 5) errors.address_line1 = MESSAGES.address;
  if (!isValidName(a.city)) errors.city = MESSAGES.city;
  if (!isValidName(a.state)) errors.state = MESSAGES.state;
  if (!isValidPincode(a.pincode)) errors.pincode = MESSAGES.pincode;
  return errors;
};

export const fieldErrorStyle = { color: '#DC2626', fontSize: 12, marginTop: 4, display: 'block' };
export const invalidInputStyle = { borderColor: '#DC2626' };
