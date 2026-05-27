/**
 * SNERA Email Service
 * Sends transactional emails via Nodemailer (SMTP / Gmail / Brevo)
 * Configure via .env
 */

const nodemailer = require('nodemailer');
const SibApiV3Sdk = require('sib-api-v3-sdk');

const client = SibApiV3Sdk.ApiClient.instance;

client.authentications['api-key'].apiKey =
  process.env.BREVO_API_KEY;
const api = new SibApiV3Sdk.TransactionalEmailsApi();

// ─── Transporter ──────────────────────────────────────────────────────────────
function createTransporter() {
  // Supports Gmail, SMTP, Brevo (SendinBlue), Mailgun SMTP, etc.
  const service = process.env.EMAIL_SERVICE; // 'gmail' | undefined for raw SMTP

  if (service === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App Password (not account password)
      },
    });
  }

  // Generic SMTP (Brevo, Mailgun, AWS SES, etc.)
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  tls: {
    rejectUnauthorized: false,
  },
  });
}

// ─── Currency formatter ───────────────────────────────────────────────────────
const fmtINR = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n);

// ─── Courier tracking URL builder ─────────────────────────────────────────────
function getCourierTrackingUrl(courier, awb) {
  if (!awb) return null;
  const c = (courier || '').toLowerCase();
  if (c.includes('blue dart') || c.includes('bluedart'))
    return `https://www.bluedart.com/tracking?trackfor=${awb}`;
  if (c.includes('delhivery'))
    return `https://www.delhivery.com/track/package/${awb}`;
  if (c.includes('dtdc'))
    return `https://www.dtdc.in/tracking.asp?cno=${awb}`;
  if (c.includes('ekart'))
    return `https://ekartlogistics.com/shipmenttrack/${awb}`;
  if (c.includes('india post') || c.includes('indiapost'))
    return `https://www.indiapost.gov.in/vas/pages/trackconsignment.aspx?consignmentno=${awb}`;
  if (c.includes('xpressbees'))
    return `https://www.xpressbees.com/shipment/tracking/?awb=${awb}`;
  if (c.includes('shadowfax'))
    return `https://tracker.shadowfax.in/track?order_id=${awb}`;
  // Fallback — generic search
  return `https://www.google.com/search?q=${encodeURIComponent(courier + ' tracking ' + awb)}`;
}

// ─── HTML Email Template ──────────────────────────────────────────────────────
function buildOrderConfirmationHTML(order) {
  const siteUrl = process.env.FRONTEND_URL || 'https://snera.in';
  const trackUrl = `${siteUrl}/track-order?order=${order.orderNumber}`;

  const itemRows = order.items.map(item => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #F2F0EB;font-size:13px;color:#2E2D29;">
        ${item.name}
        <div style="font-size:11px;color:#A09D96;margin-top:2px;">Size: ${item.size}</div>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #F2F0EB;font-size:13px;color:#2E2D29;text-align:center;">${item.qty}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #F2F0EB;font-size:13px;color:#2E2D29;text-align:right;font-weight:500;">${fmtINR(item.price * item.qty)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Order Confirmed — SNERA</title>
</head>
<body style="margin:0;padding:0;background:#F8F7F4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F7F4;padding:40px 20px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#1C1B18;padding:32px 40px;text-align:center;">
            <div style="font-family:Georgia,serif;font-size:28px;font-weight:400;letter-spacing:6px;color:#FFFFFF;text-transform:uppercase;">SNERA</div>
            <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-top:6px;">Premium Essentials</div>
          </td>
        </tr>

        <!-- Order confirmed banner -->
        <tr>
          <td style="background:#FFFFFF;padding:40px 40px 28px;border-bottom:1px solid #F2F0EB;">
            <div style="display:inline-block;width:48px;height:48px;background:#EBF5EE;border-radius:50%;text-align:center;line-height:48px;margin-bottom:16px;">
              <span style="font-size:22px;">✓</span>
            </div>
            <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#1C1B18;letter-spacing:-0.5px;">Order Confirmed</h1>
            <p style="margin:0;font-size:13px;color:#7A776F;line-height:1.7;">
              Thank you, <strong style="color:#1C1B18;">${order.customer.name}</strong>. Your order has been placed and we're preparing it with care.
            </p>
          </td>
        </tr>

        <!-- Order number + track CTA -->
        <tr>
          <td style="background:#FFFFFF;padding:24px 40px;border-bottom:1px solid #F2F0EB;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#F8F7F4;border:1px solid #E8E4DC;padding:16px 20px;">
                  <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#A09D96;margin-bottom:4px;">Order Number</div>
                  <div style="font-family:Georgia,serif;font-size:22px;font-weight:400;color:#1C1B18;letter-spacing:1px;">${order.orderNumber}</div>
                </td>
                <td width="20"></td>
                <td align="right" valign="middle">
                  <a href="${trackUrl}" style="display:inline-block;background:#1C1B18;color:#FFFFFF;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:500;padding:12px 24px;text-decoration:none;">Track Order →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Items table -->
        <tr>
          <td style="background:#FFFFFF;padding:28px 40px 0;">
            <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#A09D96;margin-bottom:14px;">Items Ordered</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #F2F0EB;">
              <thead>
                <tr style="background:#F8F7F4;">
                  <th style="padding:10px 16px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#A09D96;text-align:left;font-weight:500;">Product</th>
                  <th style="padding:10px 16px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#A09D96;text-align:center;font-weight:500;">Qty</th>
                  <th style="padding:10px 16px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#A09D96;text-align:right;font-weight:500;">Amount</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
          </td>
        </tr>

        <!-- Totals -->
        <tr>
          <td style="background:#FFFFFF;padding:0 40px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #F2F0EB;border-top:none;">
              <tr>
                <td style="padding:10px 16px;font-size:12px;color:#7A776F;">Subtotal</td>
                <td style="padding:10px 16px;font-size:12px;color:#7A776F;text-align:right;">${fmtINR(order.subtotal)}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-size:12px;color:#7A776F;border-top:1px solid #F2F0EB;">Shipping</td>
                <td style="padding:10px 16px;font-size:12px;color:#7A776F;text-align:right;border-top:1px solid #F2F0EB;">${order.shippingFee === 0 ? '<span style="color:#3D7A56;">Free</span>' : fmtINR(order.shippingFee)}</td>
              </tr>
              <tr style="background:#F8F7F4;">
                <td style="padding:14px 16px;font-size:14px;font-weight:600;color:#1C1B18;border-top:2px solid #E8E4DC;">Total Paid</td>
                <td style="padding:14px 16px;font-size:14px;font-weight:600;color:#1C1B18;text-align:right;border-top:2px solid #E8E4DC;">${fmtINR(order.total)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Shipping address -->
        <tr>
          <td style="background:#FFFFFF;padding:0 40px 32px;border-bottom:1px solid #F2F0EB;">
            <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#A09D96;margin-bottom:10px;">Shipping To</div>
            <div style="font-size:13px;color:#2E2D29;line-height:1.8;">
              <strong>${order.customer.name}</strong><br/>
              ${order.address.line1}${order.address.line2 ? ', ' + order.address.line2 : ''}<br/>
              ${order.address.city}, ${order.address.state} — ${order.address.pincode}<br/>
              📞 ${order.customer.phone}
            </div>
          </td>
        </tr>

        <!-- What's next -->
        <tr>
          <td style="background:#FFFFFF;padding:28px 40px 32px;border-bottom:1px solid #F2F0EB;">
            <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#A09D96;margin-bottom:16px;">What Happens Next</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${[
                ['📦', 'Order Processing', 'We\'re picking and packing your items carefully.'],
                ['🚚', 'Shipped', 'You\'ll receive a tracking number once dispatched.'],
                ['🏠', 'Delivered', 'Expected within 3–5 business days.'],
              ].map(([icon, title, desc]) => `
                <tr>
                  <td width="36" valign="top" style="padding-bottom:14px;font-size:18px;">${icon}</td>
                  <td style="padding-bottom:14px;padding-left:12px;">
                    <div style="font-size:12px;font-weight:600;color:#1C1B18;margin-bottom:2px;">${title}</div>
                    <div style="font-size:12px;color:#7A776F;">${desc}</div>
                  </td>
                </tr>
              `).join('')}
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1C1B18;padding:28px 40px;text-align:center;">
            <div style="font-family:Georgia,serif;font-size:16px;letter-spacing:4px;color:#FFFFFF;margin-bottom:10px;">SNERA</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.45);line-height:1.8;">
              Premium Essentials · Made in India<br/>
              Questions? Reply to this email or visit <a href="${siteUrl}" style="color:rgba(255,255,255,0.6);">snera.in</a>
            </div>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`;
}

// ─── Shipping notification email ───────────────────────────────────────────────
function buildShippingHTML(order) {
  const siteUrl    = process.env.FRONTEND_URL || 'https://snera.in';
  const trackUrl   = `${siteUrl}/track-order?order=${order.orderNumber}`;
  const courierUrl = getCourierTrackingUrl(order.courier, order.trackingId);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Your Order Has Shipped — SNERA</title></head>
<body style="margin:0;padding:0;background:#F8F7F4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F7F4;padding:40px 20px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <tr>
        <td style="background:#1C1B18;padding:32px 40px;text-align:center;">
          <div style="font-family:Georgia,serif;font-size:28px;font-weight:400;letter-spacing:6px;color:#FFFFFF;text-transform:uppercase;">SNERA</div>
        </td>
      </tr>
      <tr>
        <td style="background:#FFFFFF;padding:40px;border-bottom:1px solid #F2F0EB;">
          <div style="font-size:32px;margin-bottom:12px;">🚚</div>
          <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;font-weight:400;color:#1C1B18;">Your order is on its way!</h1>
          <p style="margin:0;font-size:13px;color:#7A776F;line-height:1.7;">
            Hi <strong style="color:#1C1B18;">${order.customer.name}</strong>, your order <strong>${order.orderNumber}</strong> has been dispatched.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#FFFFFF;padding:24px 40px 32px;border-bottom:1px solid #F2F0EB;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F7F4;border:1px solid #E8E4DC;padding:20px;">
            <tr>
              <td>
                <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#A09D96;margin-bottom:4px;">Courier</div>
                <div style="font-size:16px;font-weight:600;color:#1C1B18;">${order.courier || 'Blue Dart'}</div>
              </td>
              <td>
                <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#A09D96;margin-bottom:4px;">AWB / Tracking ID</div>
                <div style="font-size:16px;font-weight:600;color:#1C1B18;letter-spacing:1px;">${order.trackingId}</div>
              </td>
            </tr>
          </table>
          <div style="margin-top:20px;text-align:center;">
            ${courierUrl ? `<a href="${courierUrl}" style="display:inline-block;background:#8B7355;color:#FFFFFF;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:500;padding:14px 28px;text-decoration:none;margin-right:10px;">Track on ${order.courier || 'Courier'} →</a>` : ''}
            <a href="${trackUrl}" style="display:inline-block;background:#1C1B18;color:#FFFFFF;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:500;padding:14px 28px;text-decoration:none;">Track on SNERA →</a>
          </div>
        </td>
      </tr>
      <tr>
        <td style="background:#1C1B18;padding:24px 40px;text-align:center;">
          <div style="font-size:11px;color:rgba(255,255,255,0.45);">SNERA · Premium Essentials · Made in India</div>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

// const api = new SibApiV3Sdk.TransactionalEmailsApi();

async function sendOrderConfirmation(order) {
  try {
    console.log('EMAIL STARTED');
console.log(order.customer.email);
    await api.sendTransacEmail({
      sender: {
        email: 'contact@snera.in',
        name: 'SNERA',
      },

      to: [
        {
          email: order.customer.email,
        },
      ],

      subject: `Order Confirmed — ${order.orderNumber}`,

      htmlContent: buildOrderConfirmationHTML(order),
    });

    console.log('EMAIL SENT');
  } catch (err) {
    console.log(err);
  }
}
// ─── Public API ───────────────────────────────────────────────────────────────
// async function sendOrderConfirmation(order) {
//   if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//     console.log('⚠ Email not configured — skipping order confirmation email');
//     return;
//   }
//   try {
//     const transporter = createTransporter();
//     transporter.verify(function (error, success) {
//   if (error) {
//     console.log('SMTP ERROR:', error);
//   } else {
//     console.log('SMTP SERVER READY');
//   }
// });
//     await transporter.sendMail({
//       from: process.env.EMAIL_FROM,
//       to:      order.customer.email,
//       cc: "snerastore@gmail.com, rajatpatil32@gmail.com",
//       subject: `Order Confirmed — ${order.orderNumber} | SNERA`,
//       html:    buildOrderConfirmationHTML(order),
//     });
//     console.log(`✓ Order confirmation email sent to ${order.customer.email}`);
//   } catch (err) {
//     console.error('✗ Failed to send order confirmation email:', err);
//     // Non-fatal — order still created
//   }
// }

async function sendShippingNotification(order) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠ Email not configured — skipping shipping email');
    return;
  }
  try {
    const transporter = createTransporter();
    transporter.verify(function (error, success) {
  if (error) {
    console.log('SMTP ERROR:', error);
  } else {
    console.log('SMTP SERVER READY');
  }
});
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to:      order.customer.email,
      subject: `Your order ${order.orderNumber} has shipped! 🚚 | SNERA`,
      html:    buildShippingHTML(order),
    });
    console.log(`✓ Shipping notification email sent to ${order.customer.email}`);
  } catch (err) {
    console.error('✗ Failed to send shipping email:', err.message);
  }
}

module.exports = {
  sendOrderConfirmation,
  sendShippingNotification,
  getCourierTrackingUrl,
};
