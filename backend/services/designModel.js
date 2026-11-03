// Small Naive-Bayes text classifier for the Design Studio.
// Four heads (fit, palette, fabric, detail) are trained on:
//   1. data/designDataset.json   — bootstrap dataset
//   2. DesignQuery rows          — real visitor requests that were accepted
//                                  (or corrected by admin); weighted higher.
// Pure JS, no external API. Training takes a few ms.

const dataset = require('../data/designDataset.json');

const FIELDS = ['fit', 'palette', 'fabric', 'detail'];
const REAL_WEIGHT = 4; // one real accepted request counts as 4 synthetic ones
const STOP = new Set(['a','an','the','i','we','my','our','me','of','on','in','with','for','to','and','want','need','please','make','like','something','can','you','it','is','that','this','some']);

const ITEM_RE = /hoodie|hoody|sweatshirt|tank|sleeveless|polo|collar|oversized|baggy|shoulder|classic|regular|mug|cup|keychain|keyring|key_ring|phone|mobile|cover|case|tote|canvas|bag|tee|shirt/;

// Each head looks at the part of the input that actually decides it:
//   fit / fabric → item type only (chip + item words like "hoodie", "mug")
//   palette      → colour / mood words only
//   detail       → design words, plus a lighter item signal (gift vs apparel)
function featurize(category, concept, field) {
  const words = String(concept || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    .filter(w => w && !STOP.has(w));
  let feats = [...words];
  for (let i = 0; i < words.length - 1; i++) feats.push(`${words[i]}_${words[i + 1]}`);

  const cat = String(category || '').toLowerCase().replace(/[^a-z]+/g, '');
  const catFeats = cat ? Array(4).fill(`cat:${cat}`) : [];

  if (field === 'fit' || field === 'fabric') return [...catFeats, ...feats.filter(x => ITEM_RE.test(x))];
  if (field === 'palette') return feats;
  // No chip and no item word → assume a tee, so apparel techniques win over gift ones
  const assumeTee = !cat && !feats.some(x => ITEM_RE.test(x)) ? ['cat:customoversizedtee', 'cat:customoversizedtee'] : [];
  return [...feats, ...catFeats.slice(0, 2), ...assumeTee];
}

let model = null;

function train(rows) {
  const m = { n: 0, fields: {} };
  const vocab = new Set();
  FIELDS.forEach(f => { m.fields[f] = { classes: {}, total: 0 }; });

  for (const r of rows) {
    const w = r.weight || 1;
    m.n += w;
    for (const f of FIELDS) {
      if (!r[f]) continue;
      const feats = featurize(r.category, r.concept, f);
      feats.forEach(x => vocab.add(x));
      const fm = m.fields[f];
      const c = fm.classes[r[f]] || (fm.classes[r[f]] = { count: 0, words: {}, wordTotal: 0 });
      c.count += w; fm.total += w;
      for (const x of feats) { c.words[x] = (c.words[x] || 0) + w; c.wordTotal += w; }
    }
  }
  m.vocabSize = vocab.size || 1;

  // Palette head: keep only words that reliably point to one palette (seen ≥3 times,
  // ≥45% in a single class). Stops theme words like "logo" from voting on colour, so
  // colourless requests fall back to the default palette.
  const pm = m.fields.palette;
  const tot = {}, top = {};
  for (const c of Object.values(pm.classes))
    for (const [x, n] of Object.entries(c.words)) { tot[x] = (tot[x] || 0) + n; top[x] = Math.max(top[x] || 0, n); }
  pm.keep = new Set(Object.keys(tot).filter(x => tot[x] >= 3 && top[x] / tot[x] >= 0.45));
  return m;
}

function predictField(m, f, feats) {
  const fm = m.fields[f];
  if (fm.keep) feats = feats.filter(x => fm.keep.has(x));
  let best = null, scores = [];
  for (const [label, c] of Object.entries(fm.classes)) {
    let lp = Math.log(c.count / fm.total);
    for (const x of feats) lp += Math.log(((c.words[x] || 0) + 1) / (c.wordTotal + m.vocabSize));
    scores.push([label, lp]);
  }
  scores.sort((a, b) => b[1] - a[1]);
  best = scores[0];
  // softmax confidence of the winner
  const max = best[1];
  const sum = scores.reduce((s, [, lp]) => s + Math.exp(lp - max), 0);
  return { label: best[0], confidence: 1 / sum };
}

function predict(category, concept) {
  if (!model) throw new Error('Design model not trained');
  const out = {}; const conf = {};
  for (const f of FIELDS) {
    const p = predictField(model, f, featurize(category, concept, f));
    out[f] = p.label; conf[f] = Math.round(p.confidence * 100) / 100;
  }
  return {
    guidance: { silhouette: out.fit, palette: out.palette, fabric: out.fabric, detail: out.detail },
    raw: out, confidence: conf,
  };
}

// Train from the bootstrap dataset + real data. `DesignQuery` is passed in to avoid a hard
// dependency when the DB isn't connected yet.
async function retrain(DesignQuery) {
  const rows = dataset.map(r => ({ ...r, weight: 1 }));
  let real = 0;
  if (DesignQuery) {
    try {
      const docs = await DesignQuery.find({ $or: [{ accepted: true }, { 'corrected.fit': { $exists: true } }] }).lean();
      for (const d of docs) {
        const lab = { ...(d.prediction || {}), ...(d.corrected || {}) };
        if (!lab.fit || !lab.palette || !lab.fabric || !lab.detail) continue;
        rows.push({ category: d.category, concept: d.concept, ...lab, weight: REAL_WEIGHT });
        real++;
      }
    } catch (e) { console.error('Design model: could not read real data —', e.message); }
  }
  model = train(rows);
  console.log(`Design model trained: ${dataset.length} bootstrap + ${real} real samples`);
  return { bootstrap: dataset.length, real };
}

// Hold-out accuracy on the bootstrap set (sanity check, used by /retrain response)
function evaluate() {
  const cut = Math.floor(dataset.length * 0.8);
  const m = train(dataset.slice(0, cut).map(r => ({ ...r, weight: 1 })));
  const test = dataset.slice(cut);
  const acc = {};
  for (const f of FIELDS) {
    let ok = 0;
    for (const r of test) if (predictField(m, f, featurize(r.category, r.concept, f)).label === r[f]) ok++;
    acc[f] = Math.round((ok / test.length) * 1000) / 10;
  }
  return acc;
}

module.exports = { retrain, predict, evaluate, isReady: () => !!model };