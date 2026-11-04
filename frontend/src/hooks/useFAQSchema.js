import { useMemo } from 'react';

const SNERA_FAQS = [
  {
    question: 'How can I order a customised t-shirt?',
    answer:
      'Visit our Custom Design section, describe your concept, and get instant creative direction. Our team will guide you through the customisation process on WhatsApp. From design consultation to final product, we handle everything to bring your vision to life.',
  },
  {
    question: 'What customisation options are available?',
    answer:
      'We offer complete customisation: bespoke silhouettes, colour palettes, fabric selection, and finishing details. Whether you need a single custom piece or bulk orders, SNERA crafts your design to perfection with our premium materials and ethical production.',
  },
  {
    question: 'What fabrics are available for custom t-shirts?',
    answer:
      'We work with premium materials including organic cotton, linen blends, sustainable fabrics, and specialty textiles. Each fabric is carefully selected for durability, comfort, and aesthetic appeal — perfect for custom t-shirts that last.',
  },
  {
    question: 'How long does custom t-shirt production take?',
    answer:
      'Custom orders typically take 5–7 days from final confirmation. We prioritise quality over speed to ensure your customised t-shirt meets our exacting standards. Bulk orders may have different timelines — connect with our team for specifics.',
  },
  {
    question: 'Can I customise an existing SNERA design?',
    answer:
      'Absolutely. You can choose any of our existing styles and customise the colour, fabric, or details. Our team works directly with you to modify designs while maintaining the refined aesthetic SNERA is known for.',
  },
  {
    question: 'What is your sizing and fit for custom orders?',
    answer:
      'Our custom t-shirts are tailored to your specifications. To ensure the perfect fit and avoid sizing issues, we provide an option at checkout for customers to enter their measurements. If you need assistance, contact us at contact@snera.in.',
  },
  {
    question: 'Do you offer bulk customisation?',
    answer:
      'Yes, we specialise in custom orders of any volume. Whether you need 5 pieces or 500, SNERA maintains the same quality and detail for bulk customised t-shirts. Contact our team at contact@snera.in for bulk quotes and timelines.',
  },
  {
    question: 'What is your refund policy for custom orders?',
    answer:
      `Custom orders are made-to-order, so they are generally non-refundable once production begins. However, if there's a defect in material or craftsmanship, we will resolve it. See our full Refund Policy for details.`,
  },
  {
    question: 'How do I care for my customised t-shirt?',
    answer:
      'Each custom piece comes with care instructions based on its fabric. Generally, wash in cool water, avoid bleach, and lay flat to dry. Premium materials like our custom t-shirts benefit from gentle handling to maintain colour and fit.',
  },
  {
    question: 'Can I track my custom t-shirt order?',
    answer:
      `Yes. After placing your order, you'll receive tracking updates via email and WhatsApp. Our team keeps you informed at every stage, from design confirmation to delivery.`,
  },
];

export const useFAQSchema = () => {
  return useMemo(() => {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: SNERA_FAQS.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };

    return { faqSchema, faqs: SNERA_FAQS };
  }, []);
};

export default SNERA_FAQS;