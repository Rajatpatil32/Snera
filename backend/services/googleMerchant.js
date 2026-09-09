const { google } = require('googleapis');
const fs = require('fs');

const MERCHANT_ID = process.env.GOOGLE_MERCHANT_ID;
const MAX_RETRIES = 3;

// ─── Logger ───────────────────────────────────────────────────────────────────
function log(level, message, meta = {}) {
  console[level === 'error' ? 'error' : 'log'](JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: 'GoogleMerchant',
    message,
    ...meta,
  }));
}

// ─── Retry with exponential backoff ──────────────────────────────────────────
async function withRetry(fn, attempt = 1, context = '') {
  try {
    return await fn();
  } catch (err) {
    const isRateLimit   = err?.code === 429 || err?.errors?.[0]?.reason === 'rateLimitExceeded';
    const isServerError = err?.code >= 500;
    const shouldRetry   = (isRateLimit || isServerError) && attempt < MAX_RETRIES;

    if (shouldRetry) {
      const delay = 1000 * Math.pow(2, attempt - 1);
      log('warn', `Retry ${attempt}/${MAX_RETRIES} for ${context} in ${delay}ms`, { error: err?.message });
      await new Promise(res => setTimeout(res, delay));
      return withRetry(fn, attempt + 1, context);
    }
    throw err;
  }
}

// ─── Format Google error ──────────────────────────────────────────────────────
function formatError(err) {
  const errs = err?.errors || err?.response?.data?.error?.errors;
  if (errs?.length) return errs.map(e => `[${e.reason}] ${e.message}`).join('; ');
  return err?.message || 'Unknown Google API error';
}

// ─── Validate image URL ───────────────────────────────────────────────────────
function isValidImageUrl(url) {
  try {
    const p = new URL(url);
    return p.protocol === 'https:';
  } catch { return false; }
}

// ─── Get authenticated Content API client ────────────────────────────────────
async function getClient() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS)
    throw new Error('Google Merchant sync skipped — GOOGLE_APPLICATION_CREDENTIALS is not set in .env (this is fine if you are not using Google Merchant Center)');
  if (!fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS))
    throw new Error(`Google Merchant sync skipped — credentials file not found at "${process.env.GOOGLE_APPLICATION_CREDENTIALS}". Either place your Google service-account JSON key at that path, update GOOGLE_APPLICATION_CREDENTIALS to the correct path, or remove it from .env if you don't use Google Merchant Center.`);
  if (!MERCHANT_ID)
    throw new Error('Google Merchant sync skipped — GOOGLE_MERCHANT_ID is not set in .env');

  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/content'],
  });
  const authClient = await auth.getClient();
  return google.content({ version: 'v2.1', auth: authClient });
}

// ─── Map SNERA Product → Google Merchant product ─────────────────────────────
function mapProduct(product) {
  if (!product.name?.trim())  throw new Error(`Product ${product._id}: name is required`);
  if (!product.price || product.price <= 0) throw new Error(`Product ${product._id}: valid price is required`);
  if (!product.slug?.trim())  throw new Error(`Product ${product._id}: slug is required`);

  // Pick images: prefer default colorGroup images, fallback to flat images array
  const defaultGroup = product.colorGroups?.find(g => g.isDefault) || product.colorGroups?.[0];
  const rawImages    = defaultGroup?.images?.length ? defaultGroup.images : (product.images || []);
  const validImages  = rawImages.filter(isValidImageUrl);

  if (!validImages.length) throw new Error(`Product ${product._id}: no valid HTTPS image URLs`);

  const [imageLink, ...additionalImageLinks] = validImages;

  const lang    = process.env.GOOGLE_CONTENT_LANGUAGE || 'en';
  const country = process.env.GOOGLE_TARGET_COUNTRY   || 'IN';
  const channel = process.env.GOOGLE_CHANNEL          || 'online';
  const baseUrl = process.env.STORE_BASE_URL          || 'https://snera.in';

  const mapped = {
    offerId:         String(product._id),
    title:           product.name.trim().slice(0, 150),
    description:     (product.description || product.name).trim().slice(0, 5000),
    link:            `${baseUrl}/product/${product.slug}`,
    imageLink,
    availability:    'in stock',
    condition:       'new',
    brand:           'SNERA',
    contentLanguage: lang,
    targetCountry:   country,
    channel,
    price: { value: product.price.toFixed(2), currency: 'INR' },
  };

  // Additional images
  if (additionalImageLinks.length) {
    mapped.additionalImageLinks = additionalImageLinks.slice(0, 10);
  }

  // Sale price — if comparePrice > price, that means comparePrice is the original
  if (product.comparePrice && product.comparePrice > product.price) {
    mapped.price     = { value: product.comparePrice.toFixed(2), currency: 'INR' };
    mapped.salePrice = { value: product.price.toFixed(2), currency: 'INR' };
  }

  // Sizes
  if (product.sizes?.length) mapped.sizes = product.sizes;

  // Gender
  const g = product.gender?.toLowerCase();
  if (g === 'men')   mapped.gender = 'male';
  else if (g === 'women') mapped.gender = 'female';
  else mapped.gender = 'unisex';

  mapped.ageGroup = 'adult';

  // Fabric → material
  if (product.fabric) mapped.material = product.fabric;

  // Category → customLabel
  if (product.category) mapped.customLabel0 = product.category;

  // SEO fields → custom labels
  if (product.seo?.focusKeyword) mapped.customLabel1 = product.seo.focusKeyword;

  return mapped;
}

// ─── Service methods ──────────────────────────────────────────────────────────

async function syncProduct(product) {
  try {
    let mapped;
    try { mapped = mapProduct(product); }
    catch (mapErr) {
      log('error', `Mapping failed`, { productId: String(product._id), error: mapErr.message });
      return { success: false, error: mapErr.message };
    }

    const content  = await getClient();
    const response = await withRetry(
      () => content.products.insert({ merchantId: MERCHANT_ID, requestBody: mapped }),
      1, `syncProduct(${product._id})`
    );

    log('info', 'Product synced', { productId: String(product._id), offerId: mapped.offerId, googleId: response.data.id });
    return { success: true, offerId: mapped.offerId, googleId: response.data.id };
  } catch (err) {
    const error = formatError(err);
    log('error', 'Sync failed', { productId: String(product._id), error });
    return { success: false, error };
  }
}

async function updateProduct(product) {
  log('info', 'Updating product', { productId: String(product._id) });
  return syncProduct(product); // Content API insert = upsert
}

async function deleteProduct(productId) {
  try {
    const content  = await getClient();
    const lang     = process.env.GOOGLE_CONTENT_LANGUAGE || 'en';
    const country  = process.env.GOOGLE_TARGET_COUNTRY   || 'IN';
    const channel  = process.env.GOOGLE_CHANNEL          || 'online';
    const googleId = `${channel}:${lang}:${country}:${String(productId)}`;

    await withRetry(
      () => content.products.delete({ merchantId: MERCHANT_ID, productId: googleId }),
      1, `deleteProduct(${productId})`
    );

    log('info', 'Product deleted from Merchant', { productId: String(productId), googleId });
    return { success: true };
  } catch (err) {
    if (err?.code === 404 || err?.response?.status === 404) {
      log('warn', 'Product not in Merchant (already gone)', { productId: String(productId) });
      return { success: true };
    }
    const error = formatError(err);
    log('error', 'Delete failed', { productId: String(productId), error });
    return { success: false, error };
  }
}

async function syncAllProducts(products) {
  const active = products.filter(p => p.isActive);
  log('info', 'Bulk sync started', { total: products.length, active: active.length });

  const results = [];
  let succeeded = 0, failed = 0;

  // Batches of 10 to avoid rate limits
  const BATCH = 10;
  for (let i = 0; i < active.length; i += BATCH) {
    const batch = active.slice(i, i + BATCH);
    await Promise.all(batch.map(async (p) => {
      const r = await syncProduct(p);
      results.push({ productId: String(p._id), offerId: String(p._id), status: r.success ? 'ok' : 'error', error: r.error });
      if (r.success) succeeded++; else failed++;
    }));
    if (i + BATCH < active.length) await new Promise(r => setTimeout(r, 200));
  }

  log('info', 'Bulk sync complete', { total: active.length, succeeded, failed });
  return { total: active.length, succeeded, failed, results };
}

async function getProductFromMerchant(productId) {
  const content  = await getClient();
  const lang     = process.env.GOOGLE_CONTENT_LANGUAGE || 'en';
  const country  = process.env.GOOGLE_TARGET_COUNTRY   || 'IN';
  const channel  = process.env.GOOGLE_CHANNEL          || 'online';
  const googleId = `${channel}:${lang}:${country}:${String(productId)}`;
  const response = await content.products.get({ merchantId: MERCHANT_ID, productId: googleId });
  return response.data;
}

module.exports = { syncProduct, updateProduct, deleteProduct, syncAllProducts, getProductFromMerchant };