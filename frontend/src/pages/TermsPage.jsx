import React, { useEffect } from 'react';
import SEOHead from '../components/SEOHead';

export default function TermsPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <>
      <SEOHead
        title="Terms & Conditions | SNERA"
        description="Read SNERA's Terms & Conditions governing your use of our website and purchase of products."
        canonical="https://snera.in/terms"
      />
    <div style={{ background: 'var(--white)', minHeight: '100vh', paddingTop: 'var(--nav-h)' }}>
      {/* Header */}
      <div style={{ background: 'var(--off)', borderBottom: '1px solid var(--sand)', padding: 'clamp(3rem,6vw,5rem) 0' }}>
        <div className="container">
          <span className="label">Legal</span>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(2rem,5vw,3.5rem)', letterSpacing: '-.01em', marginTop: '.5rem' }}>
            Terms &amp; Conditions
          </h1>
          <p style={{ fontSize: '.82rem', color: 'var(--stone2)', marginTop: '1rem' }}>
            Last updated: May 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ padding: 'clamp(2.5rem,5vw,4rem) clamp(1.25rem,4vw,3rem)', maxWidth: '800px' }}>

        <p style={{ fontSize: '.85rem', color: 'var(--stone2)', lineHeight: 1.8, marginBottom: '2.5rem', paddingBottom: '2.5rem', borderBottom: '1px solid var(--sand)' }}>
          By accessing and using the SNERA website (snera.in), you accept and agree to be bound by the following Terms and Conditions. Please read them carefully before using our services.
        </p>

        <PolicySection title="1. Use of the Website">
          <p>You may use our website for lawful purposes only. You agree not to use this website:</p>
          <ul>
            <li>In any way that violates applicable local, national, or international laws or regulations</li>
            <li>To transmit any unsolicited or unauthorized advertising or promotional material</li>
            <li>To knowingly transmit any data or material that contains viruses or malicious code</li>
            <li>To scrape, crawl, or extract data from this website without our express written consent</li>
          </ul>
        </PolicySection>

        <PolicySection title="2. Products and Pricing">
          <p>We reserve the right to modify or discontinue any product at any time without notice. Prices for products are subject to change without notice. We shall not be liable to you or any third party for any modification, price change, or discontinuance of products.</p>
          <p>We have made every effort to display the colors and images of our products accurately. However, we cannot guarantee that your device's display of colors will be accurate.</p>
        </PolicySection>

        <PolicySection title="3. Orders and Payments">
          <p>By placing an order, you represent that you are authorized to use the payment method provided. All payments are processed securely through Razorpay. We reserve the right to refuse or cancel any order for reasons including product unavailability, errors in product or pricing information, or suspected fraud.</p>
          <p>Order confirmation does not constitute acceptance of your order. We reserve the right to accept or decline your order at any time after receipt.</p>
        </PolicySection>

        <PolicySection title="4. Intellectual Property">
          <p>All content on this website, including but not limited to text, images, graphics, logos, and software, is the property of SNERA and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.</p>
        </PolicySection>

        <PolicySection title="5. Limitation of Liability">
          <p>To the fullest extent permitted by law, SNERA shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the website or purchase of products. Our total liability for any claim shall not exceed the amount paid by you for the product(s) in question.</p>
        </PolicySection>

        <PolicySection title="6. Governing Law">
          <p>These Terms and Conditions are governed by and construed in accordance with the laws of India. Any disputes arising out of or related to these Terms shall be subject to the exclusive jurisdiction of the courts located in India.</p>
        </PolicySection>

        <PolicySection title="7. Changes to Terms">
          <p>We reserve the right to update or modify these Terms and Conditions at any time. Changes will be effective immediately upon posting to the website. Your continued use of the website after any changes constitutes your acceptance of the new Terms.</p>
        </PolicySection>

        <PolicySection title="8. Contact Us">
          <p>If you have any questions about these Terms and Conditions, please contact us:</p>
          <p><strong>Email:</strong> support@snera.in</p>
          <p><strong>Website:</strong> snera.in</p>
        </PolicySection>
      </div>
    </div>
    </>
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