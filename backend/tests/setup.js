/**
 * Lightweight in-memory store for Jest testing.
 * No real MongoDB binary needed — uses a simple JS store.
 */
const mongoose = require('mongoose');

// In-memory collection store: { collectionName: [docs] }
const store = {};

// Patch mongoose model operations to use the in-memory store
function patchModel(Model) {
  const name = Model.modelName;
  if (!store[name]) store[name] = [];

  const makeDoc = (data) => {
    const doc = {
      ...data,
      _id: data._id || new mongoose.Types.ObjectId(),
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    };
    return doc;
  };

  Model.create = jest.fn(async (data) => {
    // Run basic mongoose validators manually by instantiating the model
    const instance = new Model(data);
    await instance.validate(); // throws ValidationError if invalid
    const doc = makeDoc(instance.toObject());
    // Check unique fields (slug, adminId, orderNumber)
    for (const d of store[name]) {
      if (data.slug && d.slug === data.slug) {
        const err = new Error(`E11000 duplicate key: slug=${data.slug}`);
        err.code = 11000;
        throw err;
      }
      if (data.adminId && d.adminId === data.adminId) {
        const err = new Error(`E11000 duplicate key: adminId=${data.adminId}`);
        err.code = 11000;
        throw err;
      }
    }
    // Auto-generate orderNumber
    if (Model.modelName === 'Order' && !doc.orderNumber) {
      doc.orderNumber = `SNR${String(store[name].length + 1001).padStart(5, '0')}`;
    }
    store[name].push(doc);
    return doc;
  });

  Model.find = jest.fn(async (filter = {}) => {
    return store[name].filter(d => matchFilter(d, filter));
  });

  Model.findOne = jest.fn(async (filter = {}) => {
    return store[name].find(d => matchFilter(d, filter)) || null;
  });

  Model.findById = jest.fn(async (id) => {
    return store[name].find(d => String(d._id) === String(id)) || null;
  });

  Model.findByIdAndUpdate = jest.fn(async (id, update, opts) => {
    const idx = store[name].findIndex(d => String(d._id) === String(id));
    if (idx === -1) return null;
    store[name][idx] = { ...store[name][idx], ...update, updatedAt: new Date() };
    return store[name][idx];
  });

  Model.findByIdAndDelete = jest.fn(async (id) => {
    const idx = store[name].findIndex(d => String(d._id) === String(id));
    if (idx !== -1) store[name].splice(idx, 1);
  });

  Model.countDocuments = jest.fn(async (filter = {}) => {
    return store[name].filter(d => matchFilter(d, filter)).length;
  });

  Model.deleteMany = jest.fn(async () => {
    store[name] = [];
  });
}

function matchFilter(doc, filter) {
  return Object.entries(filter).every(([k, v]) => {
    if (v === null || v === undefined) return true;
    return doc[k] === v;
  });
}

function clearStore() {
  for (const k in store) store[k] = [];
}

module.exports = {
  connect: async () => {
    // Patch all registered models
    const models = mongoose.modelNames();
    models.forEach(name => patchModel(mongoose.model(name)));
  },
  close: async () => { clearStore(); },
  clear: async () => { clearStore(); },
  patchModel,
  store,
};
