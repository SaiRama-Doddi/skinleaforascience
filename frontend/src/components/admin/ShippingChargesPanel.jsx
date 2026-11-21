import React, { useEffect, useState } from 'react';
import { Truck, Save, RotateCcw } from 'lucide-react';
import { adminGetShippingSettings, adminUpdateShippingSettings } from '../../services/api';
import { calcShippingFee, formatRupees, setShippingSettingsCache } from '../../services/shippingService';

const fieldLabel = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
const fieldHint = { fontSize: 12, color: '#6B7280', marginTop: 6 };
const inputWrap = { display: 'flex', alignItems: 'center', border: '1px solid #E5E7EB', borderRadius: 10, background: '#FFFFFF', overflow: 'hidden' };
const rupee = { padding: '0 12px', color: '#6B7280', fontWeight: 600, borderRight: '1px solid #E5E7EB', alignSelf: 'stretch', display: 'flex', alignItems: 'center', background: '#FAF8F5' };
const input = { flex: 1, border: 'none', outline: 'none', padding: '11px 12px', fontSize: 15, minWidth: 0, background: 'transparent' };

export default function ShippingChargesPanel({ onNotify }) {
  const [form, setForm] = useState({ shipping_fee: '', free_shipping_enabled: true, free_shipping_threshold: '' });
  const [saved, setSaved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminGetShippingSettings();
      const d = res?.data || {};
      const next = {
        shipping_fee: String(d.shipping_fee ?? 99),
        free_shipping_enabled: d.free_shipping_enabled !== undefined ? Boolean(d.free_shipping_enabled) : true,
        free_shipping_threshold: String(d.free_shipping_threshold ?? 999),
      };
      setForm(next);
      setSaved(next);
    } catch (err) {
      setError(err?.message || 'Could not load shipping charges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fee = Number(form.shipping_fee);
  const threshold = Number(form.free_shipping_threshold);
  const feeValid = form.shipping_fee !== '' && Number.isFinite(fee) && fee >= 0 && fee <= 100000;
  const thresholdValid = !form.free_shipping_enabled || (form.free_shipping_threshold !== '' && Number.isFinite(threshold) && threshold >= 0 && threshold <= 100000);
  const dirty = saved && JSON.stringify(saved) !== JSON.stringify(form);
  const preview = { shipping_fee: fee || 0, free_shipping_enabled: form.free_shipping_enabled, free_shipping_threshold: threshold || 0 };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!feeValid || !thresholdValid) {
      setError('Please enter valid amounts (0 – 1,00,000).');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await adminUpdateShippingSettings({
        shipping_fee: fee,
        free_shipping_enabled: form.free_shipping_enabled,
        free_shipping_threshold: form.free_shipping_enabled ? threshold : Number(saved?.free_shipping_threshold || 0),
      });
      const d = res?.data || preview;
      const next = {
        shipping_fee: String(d.shipping_fee),
        free_shipping_enabled: Boolean(d.free_shipping_enabled),
        free_shipping_threshold: String(d.free_shipping_threshold),
      };
      setForm(next);
      setSaved(next);
      setShippingSettingsCache(d);
      if (onNotify) onNotify('Shipping charges updated. Customers will see the new amount right away.');
    } catch (err) {
      setError(err?.message || 'Could not save shipping charges.');
    } finally {
      setSaving(false);
    }
  };

  const examples = [199, 499, 999, 1499];

  return (
    <div className="leafora-card" style={{ padding: 24, maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <Truck size={20} color="#A37F3F" />
        <h3 style={{ margin: 0, fontSize: 18, color: '#111827' }}>Shipping Charges</h3>
      </div>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6B7280' }}>
        Set the delivery fee customers pay at checkout. Changes apply to the cart, the top banner and Razorpay checkout immediately.
      </p>

      {loading ? (
        <p style={{ color: '#6B7280', fontSize: 14 }}>Loading…</p>
      ) : (
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            <div>
              <label style={fieldLabel} htmlFor="ship-fee">Shipping fee per order</label>
              <div style={{ ...inputWrap, borderColor: feeValid ? '#E5E7EB' : '#F87171' }}>
                <span style={rupee}>₹</span>
                <input id="ship-fee" style={input} type="number" min="0" max="100000" step="0.01" inputMode="decimal"
                  value={form.shipping_fee} onChange={(e) => setForm({ ...form, shipping_fee: e.target.value })} />
              </div>
              <div style={fieldHint}>Enter 0 to make shipping free on every order.</div>
            </div>

            <div>
              <label style={{ ...fieldLabel, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.free_shipping_enabled}
                  onChange={(e) => setForm({ ...form, free_shipping_enabled: e.target.checked })} />
                Free shipping above a minimum order
              </label>
              <div style={{ ...inputWrap, opacity: form.free_shipping_enabled ? 1 : 0.5, borderColor: thresholdValid ? '#E5E7EB' : '#F87171' }}>
                <span style={rupee}>₹</span>
                <input style={input} type="number" min="0" max="100000" step="0.01" inputMode="decimal"
                  disabled={!form.free_shipping_enabled} aria-label="Free shipping minimum order value"
                  value={form.free_shipping_threshold} onChange={(e) => setForm({ ...form, free_shipping_threshold: e.target.value })} />
              </div>
              <div style={fieldHint}>Orders at or above this amount ship free.</div>
            </div>
          </div>

          {/* Live preview */}
          <div style={{ marginTop: 22, background: '#FAF8F5', border: '1px solid #EFECE6', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>
              What customers will pay
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              {examples.map((amt) => {
                const ship = calcShippingFee(amt, preview);
                return (
                  <div key={amt} style={{ background: '#FFFFFF', border: '1px solid #EFECE6', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>
                    <div style={{ color: '#6B7280' }}>Cart {formatRupees(amt)}</div>
                    <div style={{ fontWeight: 700, color: ship === 0 ? '#15803D' : '#111827' }}>
                      {ship === 0 ? 'Free shipping' : `+ ${formatRupees(ship)} shipping`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {error && <p style={{ color: '#DC2626', fontSize: 13, marginTop: 14 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <button type="submit" className="leafora-cat-btn-primary" disabled={saving || !dirty}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, opacity: saving || !dirty ? 0.6 : 1 }}>
              <Save size={15} /> {saving ? 'Saving…' : 'Save Shipping Charges'}
            </button>
            {dirty && (
              <button type="button" className="leafora-cat-btn-secondary" onClick={() => { setForm(saved); setError(''); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <RotateCcw size={15} /> Discard changes
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
