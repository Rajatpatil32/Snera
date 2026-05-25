import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API, { fmt, getImageUrl } from '../utils/api';
import SEOHead from '../components/SEOHead';
import { useCart } from '../context/CartContext';

const FREE_THRESHOLD = 999;
const SHIPPING_FEE   = 99;

// ─── Razorpay script loader ───────────────────────────────────────────────────
function loadRazorpay() {
  return new Promise(resolve => {
    if (document.getElementById('rzp-script')) return resolve(true);
    const s = document.createElement('script');
    s.id = 'rzp-script';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// ─── Size guide / measurement diagram (SVG inline) ───────────────────────────
function MeasurementGuide() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: '1rem' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '.5rem',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--sans)', fontSize: '.68rem', letterSpacing: '.1em',
          textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 500,
          padding: 0,
        }}
      >
        <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, stroke: 'currentColor', fill: 'none', strokeWidth: 1.6 }}>
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        How to measure yourself {open ? '▲' : '▼'}
      </button>

      {open && (
        <div style={{ marginTop: '.85rem', border: '1px solid var(--sand)', background: 'var(--off)', padding: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.5rem', alignItems: 'start' }}>

            {/* SVG body measurement diagram */}
            <svg viewBox="0 0 200 340" style={{ width: '100%', fontFamily: 'var(--sans)' }}>
              {/* Body silhouette */}
              <ellipse cx="100" cy="38" rx="26" ry="30" fill="none" stroke="#1C1B18" strokeWidth="1.5"/>
              <path d="M74 68 C60 80 52 120 54 170 L60 230 L68 280 L80 280 L84 230 L100 190 L116 230 L120 280 L132 280 L140 230 L146 170 C148 120 140 80 126 68"
                fill="none" stroke="#1C1B18" strokeWidth="1.5"/>
              {/* Shoulders line */}
              <line x1="54" y1="90" x2="146" y2="90" stroke="#1C1B18" strokeWidth=".8" strokeDasharray="3,3"/>
              {/* Chest line */}
              <line x1="56" y1="115" x2="144" y2="115" stroke="#8B7355" strokeWidth="1.2" strokeDasharray="4,2"/>
              {/* Waist line */}
              <line x1="60" y1="148" x2="140" y2="148" stroke="#8B7355" strokeWidth="1.2" strokeDasharray="4,2"/>
              {/* Hip line */}
              <line x1="55" y1="178" x2="145" y2="178" stroke="#8B7355" strokeWidth="1.2" strokeDasharray="4,2"/>

              {/* Height arrow */}
              <line x1="28" y1="10" x2="28" y2="295" stroke="#1C1B18" strokeWidth=".8"/>
              <polygon points="28,6 25,14 31,14" fill="#1C1B18"/>
              <polygon points="28,299 25,291 31,291" fill="#1C1B18"/>
              <text x="8" y="155" fontSize="7" fill="#1C1B18" transform="rotate(-90 8 155)" textAnchor="middle">Height</text>

              {/* Chest arrow */}
              <line x1="150" y1="115" x2="170" y2="115" stroke="#8B7355" strokeWidth=".8"/>
              <text x="172" y="118" fontSize="7.5" fill="#8B7355">Chest</text>

              {/* Waist arrow */}
              <line x1="143" y1="148" x2="170" y2="148" stroke="#8B7355" strokeWidth=".8"/>
              <text x="172" y="151" fontSize="7.5" fill="#8B7355">Waist</text>

              {/* Hip arrow */}
              <line x1="148" y1="178" x2="170" y2="178" stroke="#8B7355" strokeWidth=".8"/>
              <text x="172" y="181" fontSize="7.5" fill="#8B7355">Hips</text>

              {/* Shoulder arrow */}
              <line x1="147" y1="90" x2="170" y2="90" stroke="#1C1B18" strokeWidth=".8"/>
              <text x="172" y="93" fontSize="7.5" fill="#1C1B18">Shoulder</text>

              {/* Inseam line */}
              <line x1="100" y1="185" x2="100" y2="280" stroke="#1C1B18" strokeWidth=".8" strokeDasharray="3,2"/>
              <text x="49" y="298" fontSize="7" fill="#1C1B18">Inseam</text>
              <line x1="80" y1="185" x2="120" y2="185" stroke="#1C1B18" strokeWidth=".6"/>
            </svg>

            {/* Instructions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '.72rem', color: 'var(--stone2)', lineHeight: 1.75, margin: 0 }}>
                Stand straight in fitted clothes. Use a soft measuring tape and measure in centimetres (cm).
              </p>
              {[
                ['Chest',    'Measure around the fullest part of your chest, keeping the tape parallel to the floor.'],
                ['Waist',    'Measure around your natural waistline — the narrowest part of your torso.'],
                // ['Hips',     'Measure around the fullest part of your hips, about 20 cm below your waistline.'],
                ['Shoulder', 'Measure across your back from the edge of one shoulder to the other.'],
                ['Height',   'Stand without shoes against a wall. Measure from the floor to the top of your head.'],
                // ['Inseam',   'Measure from your crotch to the floor (inside leg length).'],
              ].map(([label, desc]) => (
                <div key={label}>
                  <div style={{ fontSize: '.65rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, marginBottom: '.2rem' }}>{label}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--stone2)', lineHeight: 1.65 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Measurement input row for one cart item ──────────────────────────────────
function MeasurementRow({ item, onChange }) {
  const m = item.measurements || {};
  const fields = [
    { key: 'chest',    label: 'Chest',    unit: 'cm', placeholder: '94' },
    { key: 'waist',    label: 'Waist',    unit: 'cm', placeholder: '80' },
    // { key: 'hips',     label: 'Hips',     unit: 'cm', placeholder: '96' },
    { key: 'shoulder', label: 'Shoulder', unit: 'cm', placeholder: '44' },
    { key: 'height',   label: 'Height',   unit: 'cm', placeholder: '175' },
    // { key: 'inseam',   label: 'Inseam',   unit: 'cm', placeholder: '80' },
  ];

  return (
    <div style={{ padding: '1rem', background: 'var(--off)', border: '1px solid var(--sand)', marginBottom: '.85rem' }}>
      {/* Item header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.85rem' }}>
        {/* Image */}
        <div style={{ width: 44, height: 58, background: 'var(--sand)', flexShrink: 0, overflow: 'hidden' }}>
          {item.image
            ? <img src={getImageUrl(item.image)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '1.2rem', color: 'rgba(28,27,24,.2)' }}>{item.glyph}</div>
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginTop: '.18rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.68rem', color: 'var(--stone)' }}>Size: {item.size}</span>
            {item.colour && (
              <>
                <span style={{ color: 'var(--sand2)' }}>·</span>
                {item.colourHex && <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.colourHex, border: '1px solid rgba(0,0,0,.18)', display: 'inline-block', flexShrink: 0 }}/>}
                <span style={{ fontSize: '.68rem', color: 'var(--stone)' }}>{item.colour}</span>
              </>
            )}
            {item.qty > 1 && <><span style={{ color: 'var(--sand2)' }}>·</span><span style={{ fontSize: '.68rem', color: 'var(--stone)' }}>Qty: {item.qty}</span></>}
          </div>
        </div>

        <div style={{ fontSize: '.82rem', fontWeight: 600, flexShrink: 0 }}>{fmt(item.price * item.qty)}</div>
      </div>

      {/* Measurement inputs grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '.5rem' }}>
        {fields.map(({ key, label, unit, placeholder }) => (
          <div key={key}>
            <label style={{ fontSize: '.55rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stone)', display: 'block', marginBottom: '.22rem' }}>
              {label}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                value={m[key] || ''}
                onChange={e => onChange(item.key, { ...m, [key]: e.target.value })}
                placeholder={placeholder}
                min="1"
                max="300"
                style={{
                  width: '100%', border: '1px solid var(--sand)',
                  padding: '.45rem .55rem', paddingRight: '1.8rem',
                  fontFamily: 'var(--sans)', fontSize: '.72rem',
                  color: 'var(--ink)', background: 'var(--white)', outline: 'none',
                }}
              />
              <span style={{ position: 'absolute', right: '.45rem', top: '50%', transform: 'translateY(-50%)', fontSize: '.58rem', color: 'var(--stone)' }}>{unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, name, value, onChange, type = 'text', required, placeholder, error }) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={name}>{label}{required && ' *'}</label>
      <input
        id={name} name={name} type={type} value={value}
        onChange={e => onChange(name, e.target.value)}
        required={required} placeholder={placeholder}
        className="form-input"
        style={error ? { borderColor: 'var(--error)' } : {}}
      />
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

// ─── Main checkout ─────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { items, total, dispatch, toast } = useCart();
  const navigate = useNavigate();

  const shipping   = total >= FREE_THRESHOLD ? 0 : SHIPPING_FEE;
  const grandTotal = total + shipping;

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    line1: '', line2: '', city: '', state: '', pincode: '',
  });
  const [payMethod,  setPayMethod]  = useState('razorpay');
  const [submitting, setSubmitting] = useState(false);
  const [errors,     setErrors]     = useState({});
  const [rzpLoaded,  setRzpLoaded]  = useState(false);
  const [showWaConfirm, setShowWaConfirm] = useState(false); // WhatsApp confirm modal

  useEffect(() => { loadRazorpay().then(setRzpLoaded); }, []);

  const setField = (name, val) => {
    setForm(f => ({ ...f, [name]: val }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
  };

  // Measurements per item
  const setMeasurements = (key, measurements) => {
    dispatch({ type: 'SET_MEASUREMENTS', payload: { key, measurements } });
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (!/^\d{10}$/.test(form.phone.trim())) e.phone = 'Enter a valid 10-digit phone number';
    if (!form.line1.trim()) e.line1   = 'Address line 1 is required';
    if (!form.city.trim())  e.city    = 'City is required';
    if (!form.state.trim()) e.state   = 'State is required';
    if (!/^\d{6}$/.test(form.pincode.trim())) e.pincode = 'Enter a valid 6-digit pincode';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildOrderPayload = (method) => ({
    customer: { name: form.name, email: form.email, phone: form.phone },
    address:  { line1: form.line1, line2: form.line2, city: form.city, state: form.state, pincode: form.pincode },
    items:    items.map(i => ({
      name:         i.name,
      size:         i.size,
      price:        i.price,
      qty:          i.qty,
      image:        i.image,
      colour:       i.colour  || null,
      colourHex:    i.colourHex || null,
      measurements: i.measurements || null,
    })),
    subtotal:    total,
    shippingFee: shipping,
    total:       grandTotal,
    payment:     { method, status: 'pending' },
  });

  // ── COD ────────────────────────────────────────────────────────────────────
  const handleCOD = async () => {
    setSubmitting(true);
    try {
      const r = await API.post('/orders', buildOrderPayload('cod'));
      dispatch({ type: 'CLEAR' });
      toast('Order placed!');
      navigate(`/order-success?order=${r.data.order.orderNumber}`);
    } catch (err) {
      toast(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally { setSubmitting(false); }
  };

  // ── Razorpay ───────────────────────────────────────────────────────────────
  const handleRazorpay = async () => {
    if (!rzpLoaded) { toast('Payment gateway loading… try again in a moment.'); return; }
    setSubmitting(true);
    let createdOrder = null;
    try {
      const orderRes  = await API.post('/orders', buildOrderPayload('razorpay'));
      createdOrder    = orderRes.data.order;
      const rzpRes    = await API.post('/orders/payment/create', { amount: grandTotal, receipt: createdOrder.orderNumber });

      const options = {
        key:         rzpRes.data.key,
        amount:      rzpRes.data.amount,
        currency:    rzpRes.data.currency,
        name:        'SNERA',
        description: `Order ${createdOrder.orderNumber}`,
        order_id:    rzpRes.data.id,
        prefill:     { name: form.name, email: form.email, contact: form.phone },
        theme:       { color: '#1C1B18' },
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true
        },

        upi: {
          flow: 'collect'
        },
        handler: async (response) => {
          try {
            setSubmitting(true);
            const vRes = await API.post('/orders/payment/verify', {
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId:           createdOrder._id,
            });
            if (vRes.data.success) {
              dispatch({ type: 'CLEAR' });
              toast('Payment successful!');
              navigate(`/order-success?order=${createdOrder.orderNumber}`);
            } else { toast('Verification failed. Contact support.'); }
          } catch { toast('Verification failed. Order: ' + createdOrder.orderNumber); }
          finally { setSubmitting(false); }
        },
        modal: { ondismiss: () => { setSubmitting(false); toast('Payment cancelled. Order saved — you can retry.'); } },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', r => { toast(`Payment failed: ${r.error.description}`); setSubmitting(false); });
      rzp.open();
    } catch (err) {
      toast(err.response?.data?.error || 'Payment gateway error. Please try again.');
      setSubmitting(false);
    }
  };

  // ── WhatsApp checkout ──────────────────────────────────────────────────────
  // Builds a pre-filled WhatsApp message and opens wa.me deep-link.
  // Order is saved to DB first (status: pending_whatsapp) so owner can see it.
  const OWNER_WHATSAPP = process.env.REACT_APP_OWNER_WHATSAPP || '919999999999'; // set in .env

  const handleWhatsApp = async () => {
    setSubmitting(true);
    try {
      const payload = buildOrderPayload('whatsapp');
      const r = await API.post('/orders', { ...payload, payment: { method: 'whatsapp', status: 'pending' } });
      const orderNum = r.data.order.orderNumber;

      const itemLines = items
        .map(i => `• ${i.name} (${i.size}${i.colour ? `, ${i.colour}` : ''}) × ${i.qty} — ${fmt(i.price * i.qty)}`)
        .join('\n');

      const msg = [
        `Hi SNERA! I'd like to place an order 🛍️`,
        ``,
        `*Order Ref: ${orderNum}*`,
        ``,
        itemLines,
        ``,
        `Subtotal: ${fmt(total)}`,
        `Shipping: ${shipping === 0 ? 'Free' : fmt(shipping)}`,
        `*Total: ${fmt(grandTotal)}*`,
        ``,
        `*Delivery to:*`,
        `${form.name}`,
        `${form.line1}${form.line2 ? ', ' + form.line2 : ''}`,
        `${form.city}, ${form.state} — ${form.pincode}`,
        `Phone: ${form.phone}`,
        ``,
        `Please confirm availability and payment details. Thank you!`,
      ].join('\n');

      dispatch({ type: 'CLEAR' });
      // Open WhatsApp
      window.open(
        `https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(msg)}`,
        '_blank'
      );
      navigate(`/order-success?order=${orderNum}&method=whatsapp`);
    } catch (err) {
      toast(err.response?.data?.error || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (payMethod === 'whatsapp') { setShowWaConfirm(true); return; }
    payMethod === 'cod' ? await handleCOD() : await handleRazorpay();
  };

  if (items.length === 0) return (
    <div style={{ paddingTop: 'var(--nav-h)', textAlign: 'center', padding: '8rem 2rem' }}>
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 300, marginBottom: '1rem' }}>Your cart is empty</h2>
      <Link to="/shop" className="btn btn-dark">Continue Shopping</Link>
    </div>
  );

  return (
    <>
      <SEOHead title="Checkout | SNERA" canonical="https://snera.in/checkout" noindex={true} />

      <div style={{ paddingTop: 'var(--nav-h)' }}>
        <div className="container" style={{ paddingTop: '1rem' }}>
          <div className="breadcrumb" style={{ marginBottom: '1.5rem' }}>
            <Link to="/">Home</Link><span>/</span>
            <Link to="/shop">Shop</Link><span>/</span>
            <span style={{ color: 'var(--ink)' }}>Checkout</span>
          </div>

          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(1.8rem,3vw,2.5rem)', marginBottom: '2.5rem' }}>Checkout</h1>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '3rem', alignItems: 'start' }}>

              {/* ── LEFT ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

                {/* Contact */}
                <div>
                  <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: '1.4rem', marginBottom: '1.25rem', paddingBottom: '.75rem', borderBottom: '1px solid var(--sand)' }}>Contact</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <Field label="Full Name" name="name" value={form.name} onChange={setField} required placeholder="Aarav Shah" error={errors.name}/>
                    </div>
                    <Field label="Email"  name="email" type="email" value={form.email} onChange={setField} required placeholder="you@email.com" error={errors.email}/>
                    <Field label="Phone"  name="phone" type="tel"   value={form.phone} onChange={setField} required placeholder="9876543210"    error={errors.phone}/>
                  </div>
                </div>

                {/* Shipping address */}
                <div>
                  <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: '1.4rem', marginBottom: '1.25rem', paddingBottom: '.75rem', borderBottom: '1px solid var(--sand)' }}>Shipping Address</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <Field label="Address Line 1" name="line1" value={form.line1} onChange={setField} required placeholder="Flat / House / Building" error={errors.line1}/>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <Field label="Address Line 2 (optional)" name="line2" value={form.line2} onChange={setField} placeholder="Area / Locality / Landmark"/>
                    </div>
                    <Field label="City"    name="city"    value={form.city}    onChange={setField} required placeholder="Mumbai"      error={errors.city}/>
                    <Field label="State"   name="state"   value={form.state}   onChange={setField} required placeholder="Maharashtra" error={errors.state}/>
                    <Field label="Pincode" name="pincode" value={form.pincode} onChange={setField} required placeholder="400001"      error={errors.pincode}/>
                  </div>
                </div>

                {/* ── Measurements ── */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '.75rem', borderBottom: '1px solid var(--sand)', marginBottom: '1.1rem' }}>
                    <div>
                      <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: '1.4rem' }}>Measurements</h2>
                      <p style={{ fontSize: '.7rem', color: 'var(--stone2)', marginTop: '.25rem' }}>
                        Optional — helps us personalise your experience and handle returns faster.
                      </p>
                    </div>
                    <span style={{ fontSize: '.58rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stone)', background: 'var(--off)', border: '1px solid var(--sand)', padding: '.2rem .55rem' }}>
                      Optional
                    </span>
                  </div>

                  <MeasurementGuide/>

                  {items.map(item => (
                    <MeasurementRow key={item.key} item={item} onChange={setMeasurements}/>
                  ))}
                </div>

                {/* Payment */}
                <div>
                  <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: '1.4rem', marginBottom: '1.25rem', paddingBottom: '.75rem', borderBottom: '1px solid var(--sand)' }}>Payment</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
                    {[
                      {
                        val: 'razorpay', title: 'Pay Online', badge: 'Recommended',
                        desc: 'UPI, Credit / Debit Card, Net Banking, Wallets via Razorpay. 256-bit SSL encrypted.',
                        sub: ['UPI','Visa','Mastercard','RuPay','Wallets'],
                      },
                      {
                        val: 'cod', title: 'Cash on Delivery', badge: null,
                        desc: 'Pay when your order arrives at your doorstep. Available across India.',
                        sub: null,
                      },
                      {
                        val: 'whatsapp', title: 'Order via WhatsApp', badge: 'Chat with us',
                        desc: 'Discuss size, customisation, or bulk queries directly with the SNERA team before paying.',
                        sub: null,
                        icon: (
                          <svg viewBox="0 0 24 24" style={{ width:15, height:15, fill:'#25D366', flexShrink:0, marginTop:3 }}>
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.122 1.528 5.855L.057 23.882l6.162-1.616A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.898 0-3.67-.522-5.181-1.427l-.371-.22-3.851 1.01 1.028-3.748-.242-.386A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                          </svg>
                        ),
                      },
                    ].map(({ val, title, badge, desc, sub, icon }) => (
                      <label key={val} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem 1.25rem',
                        border: `1px solid ${payMethod===val ? (val==='whatsapp'?'#25D366':'var(--ink)') : 'var(--sand)'}`,
                        cursor: 'pointer', background: payMethod===val ? (val==='whatsapp'?'#f0fdf4':'var(--off)') : 'var(--white)', transition: 'all var(--t)',
                      }}>
                        <input type="radio" name="payMethod" value={val} checked={payMethod===val} onChange={() => setPayMethod(val)} style={{ marginTop: 3, accentColor: val==='whatsapp'?'#25D366':'var(--ink)', flexShrink: 0 }}/>
                        {icon || null}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.3rem' }}>
                            <span style={{ fontSize: '.82rem', fontWeight: 500 }}>{title}</span>
                            {badge && <span style={{ fontSize: '.55rem', letterSpacing: '.14em', textTransform: 'uppercase', background: val==='whatsapp'?'#25D366':'var(--ink)', color: 'var(--white)', padding: '.15rem .45rem' }}>{badge}</span>}
                          </div>
                          <p style={{ fontSize: '.75rem', color: 'var(--stone2)', margin: 0, lineHeight: 1.6 }}>{desc}</p>
                          {sub && (
                            <div style={{ display: 'flex', gap: '.45rem', marginTop: '.55rem', flexWrap: 'wrap' }}>
                              {sub.map(p => <span key={p} style={{ fontSize: '.55rem', letterSpacing: '.1em', border: '1px solid var(--sand)', padding: '.15rem .45rem', color: 'var(--stone2)' }}>{p}</span>)}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── RIGHT: Order summary ── */}
              <div style={{ position: 'sticky', top: 'calc(var(--nav-h) + 1.5rem)' }}>
                <div style={{ border: '1px solid var(--sand)', background: 'var(--white)' }}>
                  <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--sand)' }}>
                    <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1.1rem' }}>Order Summary</h3>
                  </div>

                  {/* Items with image + colour */}
                  <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--sand)', display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
                    {items.map(item => (
                      <div key={item.key} style={{ display: 'flex', gap: '.85rem', alignItems: 'flex-start' }}>
                        {/* Product image */}
                        <div style={{ width: 52, height: 70, background: 'var(--off)', flexShrink: 0, overflow: 'hidden', border: '1px solid var(--sand)' }}>
                          {item.image
                            ? <img src={getImageUrl(item.image)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '1.5rem', color: 'rgba(28,27,24,.15)' }}>{item.glyph}</div>
                          }
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '.2rem' }}>{item.name}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '.12rem' }}>
                            <span style={{ fontSize: '.68rem', color: 'var(--stone)' }}>Size: {item.size}</span>
                            {item.colour && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '.35rem', fontSize: '.68rem', color: 'var(--stone)' }}>
                                {item.colourHex && <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.colourHex, border: '1px solid rgba(0,0,0,.18)', display: 'inline-block', flexShrink: 0 }}/>}
                                {item.colour}
                              </span>
                            )}
                            {item.qty > 1 && <span style={{ fontSize: '.68rem', color: 'var(--stone)' }}>Qty: {item.qty}</span>}
                          </div>
                        </div>

                        <div style={{ fontSize: '.82rem', fontWeight: 600, flexShrink: 0 }}>{fmt(item.price * item.qty)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', color: 'var(--stone2)' }}>
                      <span>Subtotal</span><span>{fmt(total)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', color: 'var(--stone2)' }}>
                      <span>Shipping</span>
                      <span>{shipping === 0 ? <span style={{ color: 'var(--success)' }}>Free</span> : fmt(shipping)}</span>
                    </div>
                    {shipping > 0 && (
                      <p style={{ fontSize: '.65rem', color: 'var(--stone)', borderTop: '1px dashed var(--sand)', paddingTop: '.5rem', margin: 0 }}>
                        Add {fmt(FREE_THRESHOLD - total)} more for free shipping
                      </p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--sand)', paddingTop: '.75rem', fontSize: '1rem', fontWeight: 600 }}>
                      <span>Total</span><span>{fmt(grandTotal)}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div style={{ padding: '0 1.5rem 1.5rem' }}>
                    <button
                      type="submit" disabled={submitting}
                      className="btn btn-dark"
                      style={{
                        width: '100%', justifyContent: 'center', opacity: submitting ? .7 : 1, fontSize: '.68rem',
                        ...(payMethod === 'whatsapp' ? { background: '#25D366', borderColor: '#25D366' } : {}),
                      }}
                    >
                      {submitting ? 'Processing...'
                        : payMethod === 'cod'       ? `Place Order · ${fmt(grandTotal)}`
                        : payMethod === 'whatsapp'  ? `Continue on WhatsApp →`
                        : `Pay ${fmt(grandTotal)} →`}
                    </button>
                    <p style={{ fontSize: '.62rem', color: 'var(--stone)', textAlign: 'center', marginTop: '.75rem' }}>
                      {payMethod === 'razorpay'  && '🔒 Secured by Razorpay · SSL encrypted'}
                      {payMethod === 'cod'       && '📦 Pay on delivery · No advance required'}
                      {payMethod === 'whatsapp'  && '💬 Your order details will be sent to our team'}
                    </p>
                  </div>
                </div>

                {/* Trust */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  {['Secure Payment','Free Returns','Made in India'].map(t => (
                    <span key={t} style={{ fontSize: '.58rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--stone)' }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </form>
          <div style={{ height: '4rem' }}/>
        </div>
      </div>

      <style>{`
        @media(max-width:900px){
          form>div{grid-template-columns:1fr!important}
          form>div>div:last-child{position:relative!important;top:0!important}
        }
        @media(max-width:480px){
          .meas-grid{grid-template-columns:repeat(2,1fr)!important}
        }
      `}</style>

      {/* ── WhatsApp confirm modal ── */}
      {showWaConfirm && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(28,27,24,.55)', backdropFilter:'blur(4px)',
          zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem',
        }}>
          <div style={{ background:'var(--white)', maxWidth:420, width:'100%', padding:'2rem', border:'1px solid var(--sand)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'.75rem', marginBottom:'1rem' }}>
              <svg viewBox="0 0 24 24" style={{ width:28, height:28, fill:'#25D366', flexShrink:0 }}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.122 1.528 5.855L.057 23.882l6.162-1.616A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.898 0-3.67-.522-5.181-1.427l-.371-.22-3.851 1.01 1.028-3.748-.242-.386A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              <h3 style={{ fontFamily:'var(--serif)', fontWeight:300, fontSize:'1.2rem' }}>Order via WhatsApp</h3>
            </div>

            <p style={{ fontSize:'.8rem', color:'var(--stone2)', lineHeight:1.75, marginBottom:'1.25rem' }}>
              Your cart and delivery details will be sent as a WhatsApp message to our team. We'll confirm availability,
              discuss any customisation, and share payment instructions — usually within a few minutes.
            </p>

            {/* Order preview */}
            <div style={{ background:'var(--off)', border:'1px solid var(--sand)', padding:'.85rem 1rem', marginBottom:'1.25rem', fontSize:'.75rem', lineHeight:1.8, color:'var(--stone2)', fontFamily:'monospace' }}>
              {items.map(i => (
                <div key={i.key}>• {i.name} ({i.size}{i.colour?`, ${i.colour}`:''}) × {i.qty} — {fmt(i.price*i.qty)}</div>
              ))}
              <div style={{ borderTop:'1px solid var(--sand)', marginTop:'.5rem', paddingTop:'.5rem', fontWeight:600, color:'var(--ink)' }}>
                Total: {fmt(grandTotal)}
              </div>
            </div>

            <div style={{ display:'flex', gap:'.75rem' }}>
              <button
                className="btn btn-ghost"
                style={{ flex:1, fontSize:'.7rem' }}
                onClick={() => setShowWaConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-dark"
                style={{ flex:2, fontSize:'.7rem', background:'#25D366', borderColor:'#25D366', justifyContent:'center' }}
                onClick={async () => { setShowWaConfirm(false); await handleWhatsApp(); }}
                disabled={submitting}
              >
                {submitting ? 'Saving…' : 'Open WhatsApp →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}