import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import API, { getImageUrl } from '../../utils/api';

// ── SEO check rules — mirrors the thresholds already used in the product/collection forms ──
function auditItem(item, type) {
  const seo = item.seo || {};
  const checks = [];

  const hasImage = type === 'product'
    ? !!(item.colorGroups?.some(g => g.images?.length) || item.images?.length || item.designColors?.some(c => c.image))
    : !!item.image;

  checks.push({
    key: 'image',
    label: type === 'product' ? 'Product Image' : 'Banner Image',
    ok: hasImage,
    hint: hasImage ? '' : 'No image uploaded yet',
  });

  const titleLen = (seo.metaTitle || '').length;
  checks.push({
    key: 'metaTitle',
    label: 'Meta Title',
    ok: titleLen > 0 && titleLen <= 60,
    hint: titleLen === 0 ? 'Missing' : titleLen > 60 ? `Too long (${titleLen}/60)` : '',
  });

  const descLen = (seo.metaDescription || '').length;
  checks.push({
    key: 'metaDescription',
    label: 'Meta Description',
    ok: descLen > 0 && descLen <= 160,
    hint: descLen === 0 ? 'Missing' : descLen > 160 ? `Too long (${descLen}/160)` : '',
  });

  const hasKeyword = !!(seo.focusKeyword || '').trim();
  checks.push({
    key: 'focusKeyword',
    label: 'Focus Keyword',
    ok: hasKeyword,
    hint: hasKeyword ? '' : 'Missing',
  });

  const kwCount = (seo.keywords || []).length;
  checks.push({
    key: 'keywords',
    label: 'Keywords',
    ok: kwCount >= 3,
    hint: kwCount === 0 ? 'Missing' : kwCount < 3 ? `Only ${kwCount} — add a few more` : '',
  });

  const hasOg = !!(seo.ogTitle || '').trim() || !!(seo.ogDescription || '').trim();
  checks.push({
    key: 'og',
    label: 'Social Share (OG)',
    ok: hasOg,
    hint: hasOg ? '' : 'No OG title/description set',
  });

  const passed = checks.filter(c => c.ok).length;
  return { checks, passed, total: checks.length, score: Math.round((passed / checks.length) * 100) };
}

function ScorePill({ score }) {
  const color = score === 100 ? '#2d7a3a' : score >= 60 ? '#b8860b' : '#c0392b';
  const bg    = score === 100 ? '#e6f4ea' : score >= 60 ? '#fdf3d9' : '#fbe9e7';
  return (
    <span style={{
      display: 'inline-block', padding: '.2rem .55rem', borderRadius: 3,
      fontSize: '.68rem', fontWeight: 600, color, background: bg,
    }}>
      {score}%
    </span>
  );
}

export default function AdminSeoPage() {
  const [products, setProducts]       = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState('all'); // all | products | collections
  const [needsAttentionOnly, setNeedsAttentionOnly] = useState(false);

  useEffect(() => {
    Promise.all([
      API.get('/products/admin/all').then(r => r.data.products || []),
      API.get('/collections/admin/all').then(r => r.data.collections || r.data || []),
    ]).then(([p, c]) => {
      setProducts(p);
      setCollections(c);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    const productRows = products.map(p => ({
      type: 'product',
      id: p._id,
      name: p.name,
      category: p.category,
      image: getImageUrl(p.colorGroups?.[0]?.images?.[0] || p.images?.[0] || p.designColors?.[0]?.image || null),
      editLink: `/admin/products/${p._id}/edit`,
      audit: auditItem(p, 'product'),
    }));
    const collectionRows = collections.map(c => ({
      type: 'collection',
      id: c._id,
      name: c.name,
      category: 'Collection',
      image: c.image ? getImageUrl(c.image) : null,
      editLink: `/admin/collections/${c._id}/edit`,
      audit: auditItem(c, 'collection'),
    }));

    let all = [...productRows, ...collectionRows];
    if (tab === 'products') all = productRows;
    if (tab === 'collections') all = collectionRows;
    if (needsAttentionOnly) all = all.filter(r => r.audit.score < 100);

    // Worst SEO first, so the admin sees what needs fixing right away
    return all.sort((a, b) => a.audit.score - b.audit.score);
  }, [products, collections, tab, needsAttentionOnly]);

  const overallStats = useMemo(() => {
    const all = [...products.map(p => auditItem(p, 'product')), ...collections.map(c => auditItem(c, 'collection'))];
    if (!all.length) return { avg: 0, complete: 0, total: 0 };
    const avg = Math.round(all.reduce((s, a) => s + a.score, 0) / all.length);
    const complete = all.filter(a => a.score === 100).length;
    return { avg, complete, total: all.length };
  }, [products, collections]);

  const TH = { fontSize: '.6rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--stone2,#999)', padding: '.75rem 1rem', textAlign: 'left', borderBottom: '1px solid var(--sand,#e8e3db)', fontWeight: 400 };
  const TD = { padding: '.7rem 1rem', fontSize: '.8rem', verticalAlign: 'middle', borderBottom: '1px solid var(--sand,#e8e3db)' };

  return (
    <div style={{ padding: '2rem', maxWidth: 1100 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1.6rem' }}>SEO Health</h1>
        <p style={{ color: 'var(--stone2,#999)', fontSize: '.8rem', marginTop: '.25rem' }}>
          A quick audit of every product and collection's SEO fields, worst first, so you know exactly what to fix.
        </p>
      </div>

      {/* Overview cards */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="admin-card" style={{ padding: '1.1rem', border: '1px solid var(--sand,#e8e3db)' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 600 }}>{overallStats.avg}%</div>
            <div style={{ fontSize: '.68rem', color: 'var(--stone2,#999)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Average SEO Score</div>
          </div>
          <div className="admin-card" style={{ padding: '1.1rem', border: '1px solid var(--sand,#e8e3db)' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 600 }}>{overallStats.complete} / {overallStats.total}</div>
            <div style={{ fontSize: '.68rem', color: 'var(--stone2,#999)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Fully Optimised</div>
          </div>
          <div className="admin-card" style={{ padding: '1.1rem', border: '1px solid var(--sand,#e8e3db)' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 600 }}>{overallStats.total - overallStats.complete}</div>
            <div style={{ fontSize: '.68rem', color: 'var(--stone2,#999)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Need Attention</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'All' },
          { key: 'products', label: 'Products' },
          { key: 'collections', label: 'Collections' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '.45rem .9rem', fontSize: '.68rem', cursor: 'pointer',
              border: `1px solid ${tab === t.key ? 'var(--ink,#1C1B18)' : 'var(--sand,#e8e3db)'}`,
              background: tab === t.key ? 'var(--ink,#1C1B18)' : 'transparent',
              color: tab === t.key ? '#fff' : 'var(--stone2,#999)',
            }}
          >
            {t.label}
          </button>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.72rem', color: 'var(--stone2,#999)', marginLeft: '.5rem' }}>
          <input type="checkbox" checked={needsAttentionOnly} onChange={e => setNeedsAttentionOnly(e.target.checked)} />
          Needs attention only
        </label>
      </div>

      {loading ? (
        <p style={{ color: 'var(--stone2,#999)' }}>Loading…</p>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--stone2,#999)' }}>
          <p>{needsAttentionOnly ? "Everything's fully optimised 🎉" : 'Nothing here yet.'}</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={TH}>Item</th>
              <th style={TH}>Score</th>
              <th style={TH}>Issues</th>
              <th style={TH}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const issues = r.audit.checks.filter(c => !c.ok);
              return (
                <tr key={`${r.type}-${r.id}`}>
                  <td style={TD}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                      <div style={{
                        width: 36, height: 36, flexShrink: 0, borderRadius: 4, overflow: 'hidden',
                        background: 'var(--off,#f5f4f1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {r.image
                          ? <img src={r.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: '.6rem', color: 'var(--stone,#bbb)' }}>—</span>}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{r.name}</div>
                        <div style={{ fontSize: '.65rem', color: 'var(--stone2,#999)' }}>
                          {r.type === 'product' ? r.category : 'Collection'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={TD}><ScorePill score={r.audit.score} /></td>
                  <td style={TD}>
                    {issues.length === 0 ? (
                      <span style={{ fontSize: '.72rem', color: '#2d7a3a' }}>All good</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '.2rem' }}>
                        {issues.map(i => (
                          <span key={i.key} style={{ fontSize: '.7rem', color: '#c0392b' }}>
                            {i.label}{i.hint ? ` — ${i.hint}` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={TD}>
                    <Link to={r.editLink} style={{ fontSize: '.7rem', color: 'var(--ink,#1a1a1a)', textDecoration: 'underline', whiteSpace: 'nowrap' }}>
                      Fix →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}