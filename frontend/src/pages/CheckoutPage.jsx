import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API, { fmt } from '../utils/api';
import SEOHead from '../components/SEOHead';
import { useCart } from '../context/CartContext';

const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 99;

// ─── Load Razorpay checkout.js once ───────────────────────────────────────────
function loadRazorpayScript() {
  return new Promise(resolve => {
    if (document.getElementById('razorpay-script')) return resolve(true);
    const s = document.createElement('script');
    s.id  = 'razorpay-script';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// ─── Field component ──────────────────────────────────────────────────────────
function Field({ label, name, value, onChange, type = 'text', required, placeholder, error }) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={name}>
        {label}{required && ' *'}
      </label>
      <input
        id={name} name={name} type={type}
        value={value}
        onChange={e => onChange(name, e.target.value)}
        required={required}
        placeholder={placeholder}
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

  const shipping   = total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const grandTotal = total + shipping;

  const [form, setForm] = useState({
    name:'', email:'', phone:'',
    line1:'', line2:'', city:'', state:'', pincode:'',
  });
  const [payMethod,  setPayMethod]  = useState('razorpay'); // 'razorpay' | 'cod'
  const [submitting, setSubmitting] = useState(false);
  const [errors,     setErrors]     = useState({});
  const [rzpLoaded,  setRzpLoaded]  = useState(false);

  // Pre-load Razorpay script
  useEffect(() => {
    loadRazorpayScript().then(setRzpLoaded);
  }, []);

  const setField = (name, val) => {
    setForm(f => ({ ...f, [name]: val }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email address is required';
    if (!/^\d{10}$/.test(form.phone.trim())) e.phone = 'Enter a valid 10-digit phone number';
    if (!form.line1.trim()) e.line1   = 'Address line 1 is required';
    if (!form.city.trim())  e.city    = 'City is required';
    if (!form.state.trim()) e.state   = 'State is required';
    if (!/^\d{6}$/.test(form.pincode.trim())) e.pincode = 'Enter a valid 6-digit pincode';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Build order payload ────────────────────────────────────────────────────
  const buildOrderPayload = (method) => ({
    customer: { name: form.name, email: form.email, phone: form.phone },
    address:  { line1: form.line1, line2: form.line2, city: form.city, state: form.state, pincode: form.pincode },
    items:    items.map(i => ({ name: i.name, size: i.size, price: i.price, qty: i.qty, image: i.image })),
    subtotal: total,
    shippingFee: shipping,
    total:    grandTotal,
    payment:  { method, status: 'pending' },
  });

  // ─── Handle submit ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (payMethod === 'cod') {
      await handleCOD();
    } else {
      await handleRazorpay();
    }
  };

  // ─── COD flow ──────────────────────────────────────────────────────────────
  const handleCOD = async () => {
    setSubmitting(true);
    try {
      const r = await API.post('/orders', buildOrderPayload('cod'));
      dispatch({ type: 'CLEAR' });
      toast('Order placed successfully!');
      navigate(`/order-success?order=${r.data.order.orderNumber}`);
    } catch (err) {
      toast(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Razorpay flow ─────────────────────────────────────────────────────────
  const handleRazorpay = async () => {
    if (!rzpLoaded) {
      toast('Payment gateway loading… please try again in a moment.');
      return;
    }

    setSubmitting(true);
    let createdOrder = null;

    try {
      // 1. Create order record in DB (status: pending)
      const orderRes = await API.post('/orders', buildOrderPayload('razorpay'));
      createdOrder   = orderRes.data.order;

      // 2. Create Razorpay payment order
      const rzpRes = await API.post('/orders/payment/create', {
        amount:  grandTotal,
        receipt: createdOrder.orderNumber,
      });

      // 3. Open Razorpay checkout modal
      const options = {
        key:         rzpRes.data.key,
        amount:      rzpRes.data.amount,          // paise
        currency:    rzpRes.data.currency,
        name:        'SNERA',
        description: `Order ${createdOrder.orderNumber}`,
        order_id:    rzpRes.data.id,
        prefill: {
          name:    form.name,
          email:   form.email,
          contact: form.phone,
        },
        notes: { orderNumber: createdOrder.orderNumber },
        theme: { color: '#1C1B18' },

        // ── Payment success ──
        handler: async (response) => {
          try {
            setSubmitting(true);
            const verifyRes = await API.post('/orders/payment/verify', {
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId:           createdOrder._id,
            });

            if (verifyRes.data.success) {
              dispatch({ type: 'CLEAR' });
              toast('Payment successful! Order confirmed.');
              navigate(`/order-success?order=${createdOrder.orderNumber}`);
            } else {
              toast('Payment verification failed. Contact support.');
            }
          } catch {
            toast('Payment verification failed. Please contact support with your order number: ' + createdOrder.orderNumber);
          } finally {
            setSubmitting(false);
          }
        },

        // ── Modal dismissed ──
        modal: {
          ondismiss: () => {
            setSubmitting(false);
            toast('Payment cancelled. Your order is saved — you can retry.');
          },
        },
      };

      const rzp = new window.Razorpay(options);

      // Handle payment failure within modal
      rzp.on('payment.failed', (response) => {
        console.error('Razorpay payment failed:', response.error);
        toast(`Payment failed: ${response.error.description}. Please try again.`);
        setSubmitting(false);
      });

      rzp.open();
    } catch (err) {
      // If Razorpay order creation fails, still keep the DB order (user can contact support)
      const msg = err.response?.data?.error || 'Payment gateway error. Please try again.';
      toast(msg);
      setSubmitting(false);
    }
  };

  // ─── Empty cart guard ───────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div style={{ paddingTop: 'var(--nav-h)', textAlign: 'center', padding: '8rem 2rem' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 300, marginBottom: '1rem' }}>
          Your cart is empty
        </h2>
        <Link to="/shop" className="btn btn-dark">Continue Shopping</Link>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <SEOHead title="Checkout — SNERA" url="https://snera.in/checkout" />

      <div style={{ paddingTop: 'var(--nav-h)' }}>
        <div className="container" style={{ paddingTop: '1rem' }}>
          <div className="breadcrumb" style={{ marginBottom: '1.5rem' }}>
            <Link to="/">Home</Link><span>/</span>
            <Link to="/shop">Shop</Link><span>/</span>
            <span style={{ color: 'var(--ink)' }}>Checkout</span>
          </div>

          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(1.8rem,3vw,2.5rem)', marginBottom: '2.5rem' }}>
            Checkout
          </h1>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '3rem', alignItems: 'start' }}>

              {/* ── Left: forms ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

                {/* Contact */}
                <div>
                  <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: '1.4rem', marginBottom: '1.25rem', paddingBottom: '.75rem', borderBottom: '1px solid var(--sand)' }}>
                    Contact
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <Field label="Full Name" name="name" value={form.name} onChange={setField} required placeholder="Aarav Shah" error={errors.name} />
                    </div>
                    <Field label="Email" name="email" type="email" value={form.email} onChange={setField} required placeholder="you@email.com" error={errors.email} />
                    <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={setField} required placeholder="9876543210" error={errors.phone} />
                  </div>
                </div>

                {/* Shipping address */}
                <div>
                  <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: '1.4rem', marginBottom: '1.25rem', paddingBottom: '.75rem', borderBottom: '1px solid var(--sand)' }}>
                    Shipping Address
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <Field label="Address Line 1" name="line1" value={form.line1} onChange={setField} required placeholder="Flat / House / Building" error={errors.line1} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <Field label="Address Line 2 (optional)" name="line2" value={form.line2} onChange={setField} placeholder="Area / Locality / Landmark" />
                    </div>
                    <Field label="City"  name="city"  value={form.city}  onChange={setField} required placeholder="Mumbai"      error={errors.city} />
                    <Field label="State" name="state" value={form.state} onChange={setField} required placeholder="Maharashtra" error={errors.state} />
                    <Field label="Pincode" name="pincode" value={form.pincode} onChange={setField} required placeholder="400001" error={errors.pincode} />
                  </div>
                </div>

                {/* Payment method selector */}
                <div>
                  <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: '1.4rem', marginBottom: '1.25rem', paddingBottom: '.75rem', borderBottom: '1px solid var(--sand)' }}>
                    Payment
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
                    {/* Razorpay option */}
                    <label style={{
                      display: 'flex', alignItems: 'flex-start', gap: '1rem',
                      padding: '1rem 1.25rem',
                      border: `1px solid ${payMethod === 'razorpay' ? 'var(--ink)' : 'var(--sand)'}`,
                      cursor: 'pointer', transition: 'border-color var(--t)',
                      background: payMethod === 'razorpay' ? 'var(--off)' : 'var(--white)',
                    }}>
                      <input
                        type="radio" name="payMethod" value="razorpay"
                        checked={payMethod === 'razorpay'}
                        onChange={() => setPayMethod('razorpay')}
                        style={{ marginTop: 3, accentColor: 'var(--ink)', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.3rem' }}>
                          <span style={{ fontSize: '.82rem', fontWeight: 500 }}>Pay Online</span>
                          <span style={{ fontSize: '.58rem', letterSpacing: '.14em', textTransform: 'uppercase', background: 'var(--ink)', color: 'var(--white)', padding: '.15rem .45rem' }}>Recommended</span>
                        </div>
                        <p style={{ fontSize: '.75rem', color: 'var(--stone2)', margin: 0, lineHeight: 1.6 }}>
                          UPI, Credit / Debit Card, Net Banking, Wallets via Razorpay. 256-bit SSL encrypted.
                        </p>
                        <div style={{ display: 'flex', gap: '.5rem', marginTop: '.6rem', flexWrap: 'wrap' }}>
                          {['UPI', 'Visa', 'Mastercard', 'RuPay', 'Wallets'].map(p => (
                            <span key={p} style={{ fontSize: '.55rem', letterSpacing: '.1em', border: '1px solid var(--sand)', padding: '.15rem .45rem', color: 'var(--stone2)' }}>{p}</span>
                          ))}
                        </div>
                      </div>
                    </label>

                    {/* COD option */}
                    <label style={{
                      display: 'flex', alignItems: 'flex-start', gap: '1rem',
                      padding: '1rem 1.25rem',
                      border: `1px solid ${payMethod === 'cod' ? 'var(--ink)' : 'var(--sand)'}`,
                      cursor: 'pointer', transition: 'border-color var(--t)',
                      background: payMethod === 'cod' ? 'var(--off)' : 'var(--white)',
                    }}>
                      <input
                        type="radio" name="payMethod" value="cod"
                        checked={payMethod === 'cod'}
                        onChange={() => setPayMethod('cod')}
                        style={{ marginTop: 3, accentColor: 'var(--ink)', flexShrink: 0 }}
                      />
                      <div>
                        <div style={{ fontSize: '.82rem', fontWeight: 500, marginBottom: '.3rem' }}>Cash on Delivery</div>
                        <p style={{ fontSize: '.75rem', color: 'var(--stone2)', margin: 0, lineHeight: 1.6 }}>
                          Pay when your order arrives at your doorstep. Available across India.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* ── Right: order summary ── */}
              <div style={{ position: 'sticky', top: 'calc(var(--nav-h) + 1.5rem)' }}>
                <div style={{ border: '1px solid var(--sand)', background: 'var(--white)' }}>
                  <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--sand)' }}>
                    <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1.1rem' }}>Order Summary</h3>
                  </div>

                  {/* Items */}
                  <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--sand)', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                    {items.map(item => (
                      <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '.82rem', fontWeight: 500 }}>{item.name}</div>
                          <div style={{ fontSize: '.7rem', color: 'var(--stone)', marginTop: '.1rem' }}>
                            Size: {item.size} · Qty: {item.qty}
                          </div>
                        </div>
                        <div style={{ fontSize: '.82rem', fontWeight: 500, flexShrink: 0 }}>{fmt(item.price * item.qty)}</div>
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
                      <p style={{ fontSize: '.65rem', color: 'var(--stone)', borderTop: '1px dashed var(--sand)', paddingTop: '.5rem' }}>
                        Add {fmt(FREE_SHIPPING_THRESHOLD - total)} more for free shipping
                      </p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--sand)', paddingTop: '.75rem', fontSize: '1rem', fontWeight: 600 }}>
                      <span>Total</span><span>{fmt(grandTotal)}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div style={{ padding: '0 1.5rem 1.5rem' }}>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-dark"
                      style={{ width: '100%', justifyContent: 'center', opacity: submitting ? .7 : 1, fontSize: '.68rem' }}
                    >
                      {submitting
                        ? 'Processing...'
                        : payMethod === 'cod'
                        ? `Place Order · ${fmt(grandTotal)}`
                        : `Pay ${fmt(grandTotal)} →`}
                    </button>
                    <p style={{ fontSize: '.62rem', color: 'var(--stone)', textAlign: 'center', marginTop: '.75rem' }}>
                      {payMethod === 'razorpay'
                        ? '🔒 Secured by Razorpay · SSL encrypted'
                        : '📦 Pay on delivery · No advance required'}
                    </p>
                  </div>
                </div>

                {/* Trust badges */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  {['Secure Payment', 'Free Returns', 'Made in India'].map(t => (
                    <span key={t} style={{ fontSize: '.58rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--stone)' }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </form>

          <div style={{ height: '4rem' }} />
        </div>
      </div>

      <style>{`
        @media(max-width:900px){
          form > div { grid-template-columns: 1fr !important; }
          form > div > div:last-child { position: relative !important; top: 0 !important; }
        }
      `}</style>
    </>
  );
}
