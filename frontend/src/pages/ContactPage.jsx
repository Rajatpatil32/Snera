import React, { useEffect } from 'react';
import SEOHead from '../components/SEOHead';

export default function ContactPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate form submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    }, 1200);
  };

  const inputStyle = {
    width: '100%',
    border: '1px solid var(--sand)',
    padding: '.85rem 1rem',
    fontFamily: 'var(--sans)',
    fontSize: '.83rem',
    fontWeight: 300,
    background: 'var(--white)',
    color: 'var(--ink)',
    outline: 'none',
    transition: 'border-color var(--t)',
  };

  const labelStyle = {
    fontSize: '.62rem',
    letterSpacing: '.2em',
    textTransform: 'uppercase',
    fontWeight: 500,
    color: 'var(--stone)',
    display: 'block',
    marginBottom: '.5rem',
  };

  return (
    <>
      <SEOHead
        title="Contact Us | SNERA"
        description="Get in touch with SNERA's team. We respond within 24–48 hours, Monday–Saturday."
        canonical="https://snera.in/contact"
      />
    <div style={{ background: 'var(--white)', minHeight: '100vh', paddingTop: 'var(--nav-h)' }}>
      {/* Header */}
      <div style={{ background: 'var(--off)', borderBottom: '1px solid var(--sand)', padding: 'clamp(3rem,6vw,5rem) 0' }}>
        <div className="container">
          <span className="label">Get In Touch</span>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(2rem,5vw,3.5rem)', letterSpacing: '-.01em', marginTop: '.5rem' }}>
            Contact Us
          </h1>
          <p style={{ fontSize: '.85rem', color: 'var(--stone2)', marginTop: '1rem', maxWidth: '50ch', lineHeight: 1.8 }}>
            We'd love to hear from you. Whether it's a question about an order, a product, or just a hello — we're here.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="container" style={{ padding: 'clamp(2.5rem,5vw,4rem) clamp(1.25rem,4vw,3rem)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '4rem', alignItems: 'start' }}>

          {/* Left: Contact Info */}
          <div>
            <div style={{ marginBottom: '2.5rem' }}>
              <span className="label">Email</span>
              <p style={{ fontSize: '.9rem', color: 'var(--ink)' }}>
                <a href="mailto:support@snera.in" style={{ color: 'var(--accent)' }}>support@snera.in</a>
              </p>
              <p style={{ fontSize: '.78rem', color: 'var(--stone2)', marginTop: '.35rem' }}>
                We respond within 24–48 hours on business days.
              </p>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
              <span className="label">Business Hours</span>
              <p style={{ fontSize: '.85rem', color: 'var(--ink)', lineHeight: 1.8 }}>
                Monday – Saturday<br />
                10:00 AM – 6:00 PM IST
              </p>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
              <span className="label">Order Support</span>
              <p style={{ fontSize: '.78rem', color: 'var(--stone2)', lineHeight: 1.8 }}>
                For order tracking, returns, and exchanges, please have your order number ready when reaching out.
              </p>
            </div>

            <div>
              <span className="label">Quick Links</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                {[
                  ['Track Your Order', '/track-order'],
                  ['Return & Refund Policy', '/refund-policy'],
                  ['Shipping Policy', '/shipping-policy'],
                ].map(([label, href]) => (
                  <a key={label} href={href} style={{ fontSize: '.8rem', color: 'var(--stone2)', textDecoration: 'underline', transition: 'color var(--t)' }}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div>
            {submitted ? (
              <div style={{
                background: 'var(--off)', border: '1px solid var(--sand)',
                padding: '3rem', textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✓</div>
                <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: '1.5rem', marginBottom: '.75rem' }}>
                  Message Sent
                </h3>
                <p style={{ fontSize: '.83rem', color: 'var(--stone2)', lineHeight: 1.8 }}>
                  Thank you for reaching out. We'll get back to you within 24–48 hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="btn btn-outline"
                  style={{ marginTop: '1.5rem' }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Name</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      required
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      required
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Subject</label>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    required
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="">Select a subject</option>
                    <option value="order">Order Inquiry</option>
                    <option value="return">Return / Refund</option>
                    <option value="shipping">Shipping Query</option>
                    <option value="product">Product Question</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Message</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help..."
                    required
                    rows={6}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-dark"
                  style={{ alignSelf: 'flex-start', minWidth: '140px', justifyContent: 'center' }}
                  disabled={loading}
                >
                  {loading ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr !important; }
          .contact-name-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
    </>
  );
}