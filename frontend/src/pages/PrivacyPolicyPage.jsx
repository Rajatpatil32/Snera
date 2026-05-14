import React, { useEffect } from 'react';
import SEOHead from '../components/SEOHead';

export default function PrivacyPolicyPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <>
      <SEOHead
        title="Privacy Policy | SNERA"
        description="Read SNERA's Privacy Policy — how we collect, use, and protect your personal information."
        canonical="https://snera.in/privacy-policy"
      />
    <div style={{ background: 'var(--white)', minHeight: '100vh', paddingTop: 'var(--nav-h)' }}>
      {/* Header */}
      <div style={{ background: 'var(--off)', borderBottom: '1px solid var(--sand)', padding: 'clamp(3rem,6vw,5rem) 0' }}>
        <div className="container">
          <span className="label">Legal</span>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(2rem,5vw,3.5rem)', letterSpacing: '-.01em', marginTop: '.5rem' }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: '.82rem', color: 'var(--stone2)', marginTop: '1rem' }}>
            Last updated: May 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ padding: 'clamp(2.5rem,5vw,4rem) clamp(1.25rem,4vw,3rem)', maxWidth: '800px' }}>
        <PolicySection title="1. Information We Collect">
          <p>We collect information you provide directly to us when you place an order or contact us. This includes your name, email address, shipping address, phone number, and payment information.</p>
          <p>We also collect certain information automatically when you use our website, such as your IP address, browser type, pages viewed, and referring URLs.</p>
        </PolicySection>

        <PolicySection title="2. How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul>
            <li>Process and fulfill your orders</li>
            <li>Send order confirmations and shipping updates</li>
            <li>Respond to your comments, questions, and customer service requests</li>
            <li>Send you marketing communications (with your consent)</li>
            <li>Monitor and analyze trends, usage, and activities on our website</li>
            <li>Detect and prevent fraudulent transactions and other illegal activities</li>
          </ul>
        </PolicySection>

        <PolicySection title="3. Sharing of Information">
          <p>We do not sell, trade, or rent your personal information to third parties. We may share your information with:</p>
          <ul>
            <li><strong>Payment processors:</strong> To handle payment transactions securely (e.g., Razorpay)</li>
            <li><strong>Shipping partners:</strong> To deliver your orders</li>
            <li><strong>Email service providers:</strong> To send order confirmations and communications</li>
            <li><strong>Analytics providers:</strong> To help us understand how customers use our website</li>
          </ul>
          <p>These third parties are obligated to keep your information confidential and may only use it for the purposes described above.</p>
        </PolicySection>

        <PolicySection title="4. Payment Security">
          <p>All payment information is processed through Razorpay, a PCI DSS-compliant payment gateway. We do not store your credit card or debit card details on our servers. Your payment information is encrypted and transmitted securely.</p>
        </PolicySection>

        <PolicySection title="5. Cookies">
          <p>We use cookies and similar tracking technologies to track activity on our website and hold certain information. Cookies are files with a small amount of data that are sent to your browser from a website and stored on your device.</p>
          <p>You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, some portions of our website may not function properly.</p>
        </PolicySection>

        <PolicySection title="6. Data Retention">
          <p>We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. Order records are typically retained for 7 years for legal and tax purposes.</p>
        </PolicySection>

        <PolicySection title="7. Your Rights">
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your personal data</li>
            <li>Opt out of marketing communications at any time</li>
          </ul>
          <p>To exercise any of these rights, please contact us at the details provided below.</p>
        </PolicySection>

        <PolicySection title="8. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically.</p>
        </PolicySection>

        <PolicySection title="9. Contact Us">
          <p>If you have any questions about this Privacy Policy, please contact us:</p>
          <p><strong>Email:</strong> support@snera.in</p>
          <p><strong>Address:</strong> SNERA, India</p>
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
      <style>{`
        .policy-content ul { padding-left: 1.25rem; display: flex; flex-direction: column; gap: .4rem; list-style: disc; }
      `}</style>
    </div>
  );
}