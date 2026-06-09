import React, { useState } from 'react';

const FAQ = ({ faqs = [] }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (!faqs || faqs.length === 0) return null;

  return (
    <section className="faq-section" style={{ borderTop: '1px solid var(--sand)', background: 'var(--off)' }}>
      <div className="container">
        <div className="sect-head reveal" style={{ marginBottom: '3rem' }}>
          <span className="label">Common Questions</span>
          <h2>Customised T-Shirt & Apparel FAQs</h2>
          <p>Everything you need to know about custom design, ordering, and care.</p>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {faqs.map((faq, index) => (
            <div
              key={index}
              itemScope
              itemType="https://schema.org/Question"
              style={{
                borderBottom: '1px solid var(--sand)',
                paddingBottom: '1.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <button
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: '1rem 0',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textAlign: 'left',
                  fontSize: '.95rem',
                  fontWeight: 500,
                  color: 'var(--ink)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = 'var(--ink)';
                }}
              >
                <span itemProp="name">{faq.question}</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    marginLeft: '1rem',
                    flexShrink: 0,
                    transition: 'transform 0.3s ease',
                    transform: openIndex === index ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: 'currentColor', fill: 'none', strokeWidth: 2 }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>

              {openIndex === index && (
                <div
                  itemScope
                  itemType="https://schema.org/Answer"
                  style={{
                    paddingBottom: '1rem',
                    animation: 'fadeDown 0.3s ease forwards',
                    color: 'var(--stone2)',
                    lineHeight: '1.8',
                    fontSize: '.9rem',
                  }}
                >
                  <div itemProp="text">{faq.answer}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
};

export default FAQ;