import React, { useEffect } from 'react';

export default function RefundPolicyPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ background: 'var(--white)', minHeight: '100vh', paddingTop: 'var(--nav-h)' }}>
      {/* Header */}
      <div style={{ background: 'var(--off)', borderBottom: '1px solid var(--sand)', padding: 'clamp(3rem,6vw,5rem) 0' }}>
        <div className="container">
          <span className="label">Legal</span>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(2rem,5vw,3.5rem)', letterSpacing: '-.01em', marginTop: '.5rem' }}>
            Refund &amp; Return Policy
          </h1>
          <p style={{ fontSize: '.82rem', color: 'var(--stone2)', marginTop: '1rem' }}>
            Last updated: May 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ padding: 'clamp(2.5rem,5vw,4rem) clamp(1.25rem,4vw,3rem)', maxWidth: '800px' }}>

        {/* Quick Summary */}
        <div style={{
          background: 'var(--off)', border: '1px solid var(--sand)', padding: '1.75rem',
          marginBottom: '2.5rem'
        }}>
          <span className="label">Quick Summary</span>
          <p style={{ fontSize: '.85rem', color: 'var(--stone2)', lineHeight: 1.8 }}>
            We accept returns within <strong style={{ color: 'var(--ink)' }}>7 days</strong> of delivery for eligible items. Refunds are processed within <strong style={{ color: 'var(--ink)' }}>5–7 business days</strong> to your original payment method. Sale items and customized products are not eligible for returns.
          </p>
        </div>

        <PolicySection title="1. Eligibility for Returns">
          <p>To be eligible for a return, your item must be:</p>
          <ul>
            <li>Unused and in the same condition as received</li>
            <li>In its original packaging with all tags intact</li>
            <li>Returned within 7 days of the delivery date</li>
          </ul>
          <p>The following items are <strong>not eligible</strong> for return:</p>
          <ul>
            <li>Sale or discounted items</li>
            <li>Items marked as "Final Sale"</li>
            <li>Customized or personalized products</li>
            <li>Innerwear or intimate apparel (for hygiene reasons)</li>
            <li>Items that have been worn, washed, or damaged by the customer</li>
          </ul>
        </PolicySection>

        <PolicySection title="2. How to Initiate a Return">
          <p>To initiate a return, please follow these steps:</p>
          <ol>
            <li>Email us at <strong>contact@snera.in</strong> with your order number and reason for return</li>
            <li>Our team will respond within 24–48 hours with return instructions</li>
            <li>Pack the item securely in its original packaging</li>
            <li>Ship the item to the address provided by our team</li>
            <li>Share the tracking details with us via email</li>
          </ol>
          <p>Please do not ship items back without prior approval from our team.</p>
        </PolicySection>

        <PolicySection title="3. Refund Process">
          <p>Once we receive and inspect your return, we will notify you via email about the approval or rejection of your refund.</p>
          <p>If approved, your refund will be processed within <strong>5–7 business days</strong>. The refund will be credited to your original payment method:</p>
          <ul>
            <li><strong>Credit/Debit Card:</strong> 5–7 business days</li>
            <li><strong>UPI / Net Banking:</strong> 3–5 business days</li>
            <li><strong>Razorpay Wallet:</strong> 1–2 business days</li>
          </ul>
        </PolicySection>

        <PolicySection title="4. Exchanges">
          <p>We offer exchanges for a different size or colour of the same product, subject to availability. To request an exchange, contact us at <strong>contact@snera.in</strong> within 7 days of delivery.</p>
          <p>If the item you want is not available, we will issue a full refund instead.</p>
        </PolicySection>

        <PolicySection title="5. Damaged or Defective Items">
          <p>If you receive a damaged, defective, or incorrect item, please contact us within <strong>48 hours</strong> of delivery with photographs of the issue. We will arrange a replacement or full refund at no additional cost to you.</p>
        </PolicySection>

        <PolicySection title="6. Return Shipping Costs">
          <p>Return shipping costs are borne by the customer, except in cases where the item is damaged, defective, or incorrect. We recommend using a trackable shipping service for returns. We are not responsible for returns lost in transit.</p>
        </PolicySection>

        <PolicySection title="7. Contact Us">
          <p>If you have any questions about our Refund Policy, please contact us:</p>
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
      <style>{`
        ol { padding-left: 1.25rem; display: flex; flex-direction: column; gap: .4rem; }
      `}</style>
    </div>
  );
}