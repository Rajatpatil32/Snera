// Naive-Bayes text classifier for the Design Studio — pure JS, no external API.
// Four heads (fit, palette, fabric, detail) trained on:
//   1. data/designDataset.json — bootstrap dataset (themes, colours, typos, Hinglish)
//   2. DesignQuery rows        — real visitor requests that were accepted (WhatsApp click)
//                                or corrected by admin; weighted higher.
// Each head sees only the signal that decides it:
//   fit / fabric → item type (chip or item word: hoodie, mug, tote …)
//   palette      → colour / mood words
//   detail       → design words and the item type (gift vs apparel)
// Typos are repaired before scoring by snapping unknown words to the closest common
// training word (edit distance 1–2), which tested better than character n-grams.

const dataset = require('../data/designDataset.json');

const FIELDS = ['fit', 'palette', 'fabric', 'detail'];
const CONFIG = { alpha: 0.5, charNgrams: false, realWeight: 4, itemRepeat: 6, knownMinCount: 8 };

const STOP = new Set(['a','an','the','i','we','my','our','me','of','on','in','with','for','to','and','want','need','please','make','like','something','can','you','it','is','that','this','some','ek','ke','ki','ka','hai','liye','mujhe','chahiye','aisi']);

// ── Item type: chip first, then words in the text, default = oversized tee ──
const CHIP_KIND = {
  customoversizedtee: 'oversized', classicfittee: 'classic', polotshirt: 'polo', customhoodie: 'hoodie',
  dropshouldertee: 'drop', customtanktop: 'tank', custommug: 'mug', customkeychain: 'keychain',
  customphonecase: 'case', customtotebag: 'tote',
};
const TEXT_KIND = [
  [/hoodie|hoody|sweatshirt/, 'hoodie'], [/tank|sleeveless/, 'tank'], [/polo|collar/, 'polo'],
  [/drop shoulder/, 'drop'], [/\bmug\b|coffee cup/, 'mug'], [/keychain|key ring|keyring/, 'keychain'],
  [/phone case|mobile cover|phone cover/, 'case'], [/tote|canvas bag/, 'tote'],
  [/classic tee|regular tee/, 'classic'], [/oversized|baggy/, 'oversized'],
];
function itemKind(category, concept) {
  const chip = String(category || '').toLowerCase().replace(/[^a-z]+/g, '');
  if (CHIP_KIND[chip]) return CHIP_KIND[chip];
  const text = String(concept || '').toLowerCase();
  for (const [re, k] of TEXT_KIND) if (re.test(text)) return k;
  return 'oversized';
}
const isGift = k => ['mug', 'keychain', 'case', 'tote'].includes(k);

// ── Features ───────────────────────────────────────────────────────────────
function words(concept) {
  return String(concept || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w && !STOP.has(w));
}
function featurize(category, concept, field) {
  const kind = itemKind(category, concept);
  const itemFeats = Array(CONFIG.itemRepeat).fill(`item:${kind}`);
  if (field === 'fit' || field === 'fabric') return itemFeats;

  const ws = words(concept);
  const feats = [...ws];
  for (let i = 0; i < ws.length - 1; i++) feats.push(`${ws[i]}_${ws[i + 1]}`);
  if (CONFIG.charNgrams) {
    for (const w of ws) if (w.length >= 5) for (let i = 0; i <= w.length - 3; i++) feats.push(`c:${w.slice(i, i + 3)}`);
  }
  return field === 'palette' ? feats : [...feats, ...itemFeats.slice(0, 3), `kind:${isGift(kind) ? 'gift' : 'apparel'}`, `kind:${isGift(kind) ? 'gift' : 'apparel'}`];
}

// ── Training / prediction ──────────────────────────────────────────────────
let model = null;

function train(rows) {
  const m = { fields: {}, vocab: {}, known: new Set() };
  const freq = {};
  FIELDS.forEach(f => { m.fields[f] = { classes: {}, total: 0 }; m.vocab[f] = new Set(); });
  for (const r of rows) {
    const w = r.weight || 1;
    for (const x of words(r.concept)) freq[x] = (freq[x] || 0) + w;
    for (const f of FIELDS) {
      if (!r[f]) continue;
      const fm = m.fields[f];
      const c = fm.classes[r[f]] || (fm.classes[r[f]] = { count: 0, words: {}, wordTotal: 0 });
      c.count += w; fm.total += w;
      for (const x of featurize(r.category, r.concept, f)) { c.words[x] = (c.words[x] || 0) + w; c.wordTotal += w; m.vocab[f].add(x); }
    }
  }
  m.known = new Set(Object.keys(freq).filter(x => x.length >= 4 && freq[x] >= CONFIG.knownMinCount));

  // Palette: keep only features that reliably point at one palette, so theme words
  // ("logo", "hoodie") don't vote on colour and colourless requests fall to the default.
  const pm = m.fields.palette, tot = {}, top = {};
  for (const c of Object.values(pm.classes))
    for (const [x, n] of Object.entries(c.words)) { tot[x] = (tot[x] || 0) + n; top[x] = Math.max(top[x] || 0, n); }
  pm.keep = new Set(Object.keys(tot).filter(x => tot[x] >= 3 && top[x] / tot[x] >= 0.45));
  return m;
}

function scoreField(m, f, feats) {
  const fm = m.fields[f];
  if (fm.keep) feats = feats.filter(x => fm.keep.has(x));
  const V = m.vocab[f].size || 1, a = CONFIG.alpha;
  const scores = [];
  for (const [label, c] of Object.entries(fm.classes)) {
    let lp = Math.log(c.count / fm.total);
    for (const x of feats) lp += Math.log(((c.words[x] || 0) + a) / (c.wordTotal + a * V));
    scores.push([label, lp]);
  }
  scores.sort((x, y) => y[1] - x[1]);
  const max = scores[0][1];
  const sum = scores.reduce((s, [, lp]) => s + Math.exp(lp - max), 0);
  return { label: scores[0][0], confidence: 1 / sum };
}

// ── Typo repair ────────────────────────────────────────────────────────────
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]; let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}
function repairTypos(m, concept) {
  return String(concept || '').split(/(\s+)/).map(tok => {
    const w = tok.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (w.length < 5 || m.known.has(w) || STOP.has(w) || /\d/.test(w)) return tok;
    const max = w.length >= 8 ? 2 : 1;
    let best = null, bd = max + 1;
    for (const k of m.known) {
      if (k[0] !== w[0]) continue;
      const d = editDistance(w, k, max);
      if (d < bd) { bd = d; best = k; }
    }
    return best || tok;
  }).join('');
}

function predictWith(m, category, concept) {
  concept = repairTypos(m, concept);
  const raw = {}, conf = {};
  for (const f of FIELDS) {
    const p = scoreField(m, f, featurize(category, concept, f));
    raw[f] = p.label; conf[f] = Math.round(p.confidence * 100) / 100;
  }
  return { guidance: { silhouette: raw.fit, palette: raw.palette, fabric: raw.fabric, detail: raw.detail }, raw, confidence: conf };
}
const predict = (category, concept) => {
  if (!model) throw new Error('Design model not trained');
  return predictWith(model, category, concept);
};

async function retrain(DesignQuery) {
  const rows = dataset.map(r => ({ ...r, weight: 1 }));
  let real = 0;
  if (DesignQuery) {
    try {
      const docs = await DesignQuery.find({ $or: [{ accepted: true }, { 'corrected.fit': { $exists: true } }] }).lean();
      for (const d of docs) {
        const lab = { ...(d.prediction || {}), ...(d.corrected || {}) };
        if (!lab.fit || !lab.palette || !lab.fabric || !lab.detail) continue;
        rows.push({ category: d.category, concept: d.concept, ...lab, weight: CONFIG.realWeight });
        real++;
      }
    } catch (e) { console.error('Design model: could not read real data —', e.message); }
  }
  model = train(rows);
  console.log(`Design model trained: ${dataset.length} bootstrap + ${real} real samples`);
  return { bootstrap: dataset.length, real };
}

// Accuracy per head on (a) a held-out 20% of the bootstrap data and
// (b) designTestSet.json — hand-written queries the generator never produced.
function accuracy(m, rows) {
  const acc = {}; let all = 0;
  for (const f of FIELDS) acc[f] = 0;
  for (const r of rows) {
    const p = predictWith(m, r.category, r.concept).raw; let ok = true;
    for (const f of FIELDS) { if (p[f] === r[f]) acc[f]++; else ok = false; }
    if (ok) all++;
  }
  for (const f of FIELDS) acc[f] = Math.round((acc[f] / rows.length) * 1000) / 10;
  acc.allFour = Math.round((all / rows.length) * 1000) / 10;
  return acc;
}
function evaluate() {
  const cut = Math.floor(dataset.length * 0.8);
  const m = train(dataset.slice(0, cut).map(r => ({ ...r, weight: 1 })));
  let hand = null;
  try { hand = accuracy(train(dataset.map(r => ({ ...r, weight: 1 }))), require('../data/designTestSet.json')); } catch (e) { /* optional */ }
  return { syntheticHoldout: accuracy(m, dataset.slice(cut)), handWrittenTestSet: hand };
}

module.exports = { retrain, predict, evaluate, isReady: () => !!model, CONFIG, _train: train, _accuracy: accuracy, _dataset: dataset };