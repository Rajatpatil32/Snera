/**
 * productHooks.service.js
 *
 * Fire-and-forget hooks — call these from your existing product routes
 * AFTER the DB operation succeeds. They never block or throw to the caller.
 */
const { syncProduct, updateProduct, deleteProduct } = require('./googleMerchant');

function logHook(event, productId, err) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    service: 'ProductHooks',
    event,
    productId: String(productId),
    ...(err ? { error: err?.message || String(err) } : {}),
  }));
}

// Call after product CREATE
function onProductCreated(product) {
  if (!product.isActive) return;
  setImmediate(async () => {
    try {
      logHook('product.created → merchant.sync', product._id);
      await syncProduct(product);
    } catch (err) {
      logHook('product.created → merchant.sync FAILED', product._id, err);
    }
  });
}

// Call after product UPDATE
function onProductUpdated(product) {
  setImmediate(async () => {
    try {
      if (product.isActive) {
        logHook('product.updated → merchant.update', product._id);
        await updateProduct(product);
      } else {
        logHook('product.deactivated → merchant.delete', product._id);
        await deleteProduct(product._id);
      }
    } catch (err) {
      logHook('product.updated → merchant FAILED', product._id, err);
    }
  });
}

// Call after product DELETE
function onProductDeleted(productId) {
  setImmediate(async () => {
    try {
      logHook('product.deleted → merchant.delete', productId);
      await deleteProduct(productId);
    } catch (err) {
      logHook('product.deleted → merchant FAILED', productId, err);
    }
  });
}

module.exports = { onProductCreated, onProductUpdated, onProductDeleted };