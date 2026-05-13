import React, { useEffect } from 'react';

export default function ShippingPolicyPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ background: 'var(--white)', minHeight: '100vh', paddingTop: 'var(--nav-h)' }}>
      {/* Header */}
      <div style={{ background: 'var(--off)', borderBottom: '1px solid var(--sand)', padding: 'clamp(3rem,6vw,5rem) 0' }}>
        <div className="container">
          <span className="label">Legal</span>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(2rem,5vw,3.5rem)', letterSpacing: '-.01em', marginTop: '.5rem' }}>
            Shipping Policy
          </h1>
          <p style={{ fontSize: '.82rem', color: 'var(--stone2)', marginTop: '1rem' }}>
            Last updated: May 2025
          </p>
        </div>
      </div>

      {/* Quick info cards */}
      <div className="container" style={{ padding: 'clamp(2rem,4vw,3rem) clamp(1.25rem,4vw,3rem) 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1px', background: 'var(--sand)', border: '1px solid var(--sand)', marginBottom: '2.5rem' }}>
          {[
            { label: 'Standard Delivery', value: '5–7 Business Days' },
            { label: 'Express Delivery', value: '2–3 Business Days' },
            { label: 'Free Shipping Above', value: '₹999' },
            { label: 'Ships From', value: 'India' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--white)', padding: '1.5rem', textAlign: 'center' }}>
              <span className="label">{label}</span>
              <p style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', fontWeight: 400, color: 'var(--ink)', marginTop: '.25rem' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ padding: '0 clamp(1.25rem,4vw,3rem) clamp(2.5rem,5vw,4rem)', maxWidth: '800px' }}>

        <PolicySection title="1. Processing Time">
          <p>All orders are processed within <strong>1–2 business days</strong> of receiving payment confirmation. Orders placed on weekends or public holidays will be processed on the next business day.</p>
          <p>You will receive an email with your order confirmation and tracking details once your order has been dispatched.</p>
        </PolicySection>

        <PolicySection title="2. Shipping Methods & Delivery Times">
          <p>We offer the following shipping options for domestic orders within India:</p>
          <ul>
            <li><strong>Standard Shipping:</strong> 5–7 business days — ₹99 (Free on orders above ₹999)</li>
            <li><strong>Express Shipping:</strong> 2–3 business days — ₹199</li>
          </ul>
          <p>Delivery times are estimates and may vary depending on your location, courier partner availability, and other unforeseen circumstances such as weather disruptions or public holidays.</p>
        </PolicySection>

        <PolicySection title="3. Shipping Coverage">
          <p>We currently ship to all pin codes across India. For remote or restricted areas, delivery may take additional time. If we are unable to ship to your location, we will notify you and issue a full refund.</p>
          <p>At this time, we do not offer international shipping.</p>
        </PolicySection>

        <PolicySection title="4. Tracking Your Order">
          <p>Once your order is dispatched, you will receive a shipping confirmation email containing your tracking number and a link to track your package. You can also track your order on our website using the <a href="/track-order" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Track Order</a> page.</p>
          <p>Please allow up to 24 hours for tracking information to be updated after dispatch.</p>
        </PolicySection>

        <PolicySection title="5. Free Shipping">
          <p>We offer free standard shipping on all orders with a cart value of <strong>₹999 or above</strong> within India. The free shipping threshold is calculated on the order subtotal after any applicable discounts, and before taxes.</p>
        </PolicySection>

        <PolicySection title="6. Failed Deliveries">
          <p>If a delivery attempt fails because no one is available to receive the package, the courier will typically attempt redelivery or hold it at a nearby facility. Please ensure your delivery address and contact number are correct when placing your order.</p>
          <p>If a package is returned to us due to an incorrect address or failure to collect, we will contact you. Re-shipping charges may apply.</p>
        </PolicySection>

        <PolicySection title="7. Damaged in Transit">
          <p>In the rare event that your order arrives damaged, please contact us within <strong>48 hours</strong> of delivery at <strong>contact@snera.in</strong> with photographs of the damaged packaging and product. We will arrange a replacement or refund promptly.</p>
        </PolicySection>

        <PolicySection title="8. Contact Us">
          <p>For any shipping-related queries, please contact us:</p>
          <p><strong>Email:</strong> contact@snera.in</p>
          <p><strong>Response time:</strong> Within 24–48 hours on business days</p>
        </PolicySection>
      </div>
    </div>
  );
}

function PolicySection({ title, children }) {
  return (
    <div style={{ marginBottom: '2.5rem', paddingBottom: '2.5rem', borderBottom: '1px solid var(--sand)' }}>
      <h2 style={{
        fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(1.1rem,2.5vw,1.4rem)',
        marginBottom: '1rem', color: 'var(--ink)'
      }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', fontSize: '.85rem', color: 'var(--stone2)', lineHeight: 1.8 }}>
        {children}
      </div>
    </div>
  );
}