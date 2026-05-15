import React, { useState, useRef, useCallback, useEffect } from 'react';
import API, { getImageUrl } from '../../utils/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const CANVAS_W = 600;
const CANVAS_H = 750;

// Print zone presets (where design sits on garment)
const PRINT_ZONES = {
  'Front Center':  { x: 0.28, y: 0.22, w: 0.44, h: 0.38 },
  'Front Pocket':  { x: 0.58, y: 0.24, w: 0.18, h: 0.16 },
  'Back Center':   { x: 0.28, y: 0.22, w: 0.44, h: 0.38 },
  'Left Sleeve':   { x: 0.08, y: 0.28, w: 0.18, h: 0.30 },
  'Right Sleeve':  { x: 0.74, y: 0.28, w: 0.18, h: 0.30 },
  'Custom':        null,
};

const BLEND_MODES = ['source-over', 'multiply', 'screen', 'overlay', 'darken', 'lighten'];

export default function ProductDesignComposer({ onComposed, onCancel }) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [step, setStep]           = useState(1); // 1=base, 2=design, 3=compose, 4=done
  const [baseImage, setBaseImage] = useState(null);   // { url, file, img }
  const [designImage, setDesign]  = useState(null);   // { url, file, img }
  const [baseUploading, setBaseUploading] = useState(false);
  const [designUploading, setDesignUploading] = useState(false);

  // Design transform state
  const [transform, setTransform] = useState({ x: 150, y: 165, w: 264, h: 264, rotation: 0, opacity: 1, blend: 'source-over' });
  const [printZone, setPrintZone] = useState('Front Center');
  const [isDragging, setIsDragging]   = useState(false);
  const [isResizing, setIsResizing]   = useState(false);
  const [dragStart, setDragStart]     = useState({ x: 0, y: 0 });
  const [composedUrl, setComposedUrl] = useState(null);
  const [exporting, setExporting]     = useState(false);
  const [msg, setMsg]                 = useState('');
  const [showGrid, setShowGrid]       = useState(true);
  const [showZone, setShowZone]       = useState(true);

  const canvasRef      = useRef(null);
  const baseFileRef    = useRef(null);
  const designFileRef  = useRef(null);
  const animFrameRef   = useRef(null);

  // ── Load image helper ──────────────────────────────────────────────────────
  const loadImg = (src) => new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  // ── Upload handler ─────────────────────────────────────────────────────────
  const uploadFile = async (file, type) => {
    if (type === 'base') setBaseUploading(true);
    else setDesignUploading(true);

    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await API.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = getImageUrl(res.data.url);
      const img = await loadImg(url);

      if (type === 'base') {
        setBaseImage({ url, file, img });
        setStep(2);
      } else {
        setDesign({ url, file, img });
        // Apply default print zone
        applyZone('Front Center');
        setStep(3);
      }
    } catch (err) {
      setMsg('Upload failed: ' + (err.response?.data?.error || err.message));
    } finally {
      if (type === 'base') setBaseUploading(false);
      else setDesignUploading(false);
    }
  };

  // ── Apply print zone preset ────────────────────────────────────────────────
  const applyZone = useCallback((zoneName) => {
    const zone = PRINT_ZONES[zoneName];
    if (!zone) return;
    setPrintZone(zoneName);
    setTransform(t => ({
      ...t,
      x: Math.round(zone.x * CANVAS_W),
      y: Math.round(zone.y * CANVAS_H),
      w: Math.round(zone.w * CANVAS_W),
      h: Math.round(zone.h * CANVAS_H),
    }));
  }, []);

  // ── Render canvas ──────────────────────────────────────────────────────────
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImage?.img) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Draw base product image (cover)
    const bImg = baseImage.img;
    const scale = Math.max(CANVAS_W / bImg.width, CANVAS_H / bImg.height);
    const bW = bImg.width  * scale;
    const bH = bImg.height * scale;
    const bX = (CANVAS_W - bW) / 2;
    const bY = (CANVAS_H - bH) / 2;
    ctx.drawImage(bImg, bX, bY, bW, bH);

    // Draw grid overlay
    if (showGrid) {
      ctx.strokeStyle = 'rgba(139,115,85,0.12)';
      ctx.lineWidth   = 0.5;
      for (let x = 0; x <= CANVAS_W; x += CANVAS_W / 12) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
      }
      for (let y = 0; y <= CANVAS_H; y += CANVAS_H / 15) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
      }
    }

    // Draw print zone guide
    if (showZone && printZone !== 'Custom') {
      const z = PRINT_ZONES[printZone];
      if (z) {
        ctx.strokeStyle = 'rgba(139,115,85,0.4)';
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(z.x * CANVAS_W, z.y * CANVAS_H, z.w * CANVAS_W, z.h * CANVAS_H);
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(139,115,85,0.06)';
        ctx.fillRect(z.x * CANVAS_W, z.y * CANVAS_H, z.w * CANVAS_W, z.h * CANVAS_H);
      }
    }

    // Draw design overlay
    if (designImage?.img) {
      const { x, y, w, h, rotation, opacity, blend } = transform;
      ctx.save();
      ctx.globalAlpha       = opacity;
      ctx.globalCompositeOperation = blend;
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(designImage.img, -w / 2, -h / 2, w, h);
      ctx.restore();

      // Selection handles (only in compose step)
      if (step === 3) {
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth   = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);

        // Corner handles
        const handles = [
          [x,     y    ], [x + w, y    ],
          [x,     y + h], [x + w, y + h],
        ];
        handles.forEach(([hx, hy]) => {
          ctx.fillStyle   = '#FFFFFF';
          ctx.strokeStyle = '#8B7355';
          ctx.lineWidth   = 1.5;
          ctx.beginPath();
          ctx.arc(hx, hy, 6, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
        });

        // Center move icon
        ctx.fillStyle = 'rgba(139,115,85,0.15)';
        ctx.fillRect(x + w/2 - 12, y + h/2 - 12, 24, 24);
      }
    }
  }, [baseImage, designImage, transform, showGrid, showZone, printZone, step]);

  useEffect(() => {
    if (step >= 3) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(renderCanvas);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [renderCanvas, step]);

  // ── Mouse interactions on canvas ───────────────────────────────────────────
  const getCanvasPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  };

  const isInResizeHandle = (pos) => {
    const { x, y, w, h } = transform;
    const handles = [[x+w, y+h]]; // bottom-right only for simplicity
    return handles.some(([hx, hy]) =>
      Math.abs(pos.x - hx) < 12 && Math.abs(pos.y - hy) < 12
    );
  };

  const isOverDesign = (pos) => {
    const { x, y, w, h } = transform;
    return pos.x >= x && pos.x <= x+w && pos.y >= y && pos.y <= y+h;
  };

  const onMouseDown = (e) => {
    if (step !== 3 || !designImage) return;
    const pos = getCanvasPos(e);
    if (isInResizeHandle(pos)) {
      setIsResizing(true);
      setDragStart({ x: pos.x - (transform.x + transform.w), y: pos.y - (transform.y + transform.h) });
    } else if (isOverDesign(pos)) {
      setIsDragging(true);
      setDragStart({ x: pos.x - transform.x, y: pos.y - transform.y });
    }
  };

  const onMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getCanvasPos(e);

    if (step === 3 && designImage) {
      canvas.style.cursor = isInResizeHandle(pos) ? 'se-resize'
        : isOverDesign(pos) ? 'move' : 'default';
    }

    if (isDragging) {
      setTransform(t => ({
        ...t,
        x: Math.max(0, Math.min(CANVAS_W - t.w, pos.x - dragStart.x)),
        y: Math.max(0, Math.min(CANVAS_H - t.h, pos.y - dragStart.y)),
      }));
      setPrintZone('Custom');
    } else if (isResizing) {
      const newW = Math.max(40, pos.x - transform.x - dragStart.x);
      const newH = Math.max(40, pos.y - transform.y - dragStart.y);
      setTransform(t => ({ ...t, w: newW, h: newH }));
      setPrintZone('Custom');
    }
  };

  const onMouseUp = () => { setIsDragging(false); setIsResizing(false); };

  // ── Touch support ──────────────────────────────────────────────────────────
  const onTouchStart = (e) => {
    e.preventDefault();
    onMouseDown({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
  };
  const onTouchMove = (e) => {
    e.preventDefault();
    onMouseMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
  };

  // ── Export composed image ──────────────────────────────────────────────────
  const exportComposed = async () => {
    setExporting(true);
    try {
      // Render clean canvas (no handles, no grid)
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width  = CANVAS_W;
      exportCanvas.height = CANVAS_H;
      const ctx = exportCanvas.getContext('2d');

      // Base
      const bImg  = baseImage.img;
      const scale = Math.max(CANVAS_W / bImg.width, CANVAS_H / bImg.height);
      ctx.drawImage(bImg, (CANVAS_W - bImg.width*scale)/2, (CANVAS_H - bImg.height*scale)/2, bImg.width*scale, bImg.height*scale);

      // Design
      if (designImage?.img) {
        const { x, y, w, h, rotation, opacity, blend } = transform;
        ctx.save();
        ctx.globalAlpha              = opacity;
        ctx.globalCompositeOperation = blend;
        ctx.translate(x + w/2, y + h/2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(designImage.img, -w/2, -h/2, w, h); 
        ctx.restore();
      }

      // Convert to blob → upload
      const blob = await new Promise(resolve => exportCanvas.toBlob(resolve, 'image/jpeg', 0.92));
      const fd   = new FormData();
      fd.append('image', blob, `composed_${Date.now()}.jpg`);
      const res  = await API.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const finalUrl = res.data.url;

      setComposedUrl(finalUrl);
      setStep(4);
      onComposed && onComposed(finalUrl);
    } catch (err) {
      setMsg('Export failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setExporting(false);
    }
  };

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (step !== 3 || !designImage) return;
      const STEP = e.shiftKey ? 10 : 2;
      if (e.key === 'ArrowLeft')  setTransform(t => ({ ...t, x: t.x - STEP }));
      if (e.key === 'ArrowRight') setTransform(t => ({ ...t, x: t.x + STEP }));
      if (e.key === 'ArrowUp')    setTransform(t => ({ ...t, y: t.y - STEP }));
      if (e.key === 'ArrowDown')  setTransform(t => ({ ...t, y: t.y + STEP }));
      if (e.key === '[') setTransform(t => ({ ...t, rotation: t.rotation - 1 }));
      if (e.key === ']') setTransform(t => ({ ...t, rotation: t.rotation + 1 }));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, designImage]);

  // ── Styles ─────────────────────────────────────────────────────────────────
  const S = {
    wrap: {
      position: 'fixed', inset: 0, zIndex: 1200,
      background: 'rgba(28,27,24,0.96)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--sans)',
    },
    header: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 2rem', height: 56, borderBottom: '1px solid rgba(255,255,255,0.1)',
      flexShrink: 0,
    },
    title: {
      fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 300,
      letterSpacing: '.08em', color: '#FFFFFF',
    },
    body: {
      flex: 1, display: 'flex', overflow: 'hidden',
    },
    sidebar: {
      width: 280, flexShrink: 0,
      background: 'rgba(255,255,255,0.04)',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      overflowY: 'auto', padding: '1.5rem',
      display: 'flex', flexDirection: 'column', gap: '1.25rem',
    },
    canvasArea: {
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', background: 'rgba(0,0,0,0.2)',
    },
    rightPanel: {
      width: 260, flexShrink: 0,
      borderLeft: '1px solid rgba(255,255,255,0.08)',
      overflowY: 'auto', padding: '1.5rem',
      display: 'flex', flexDirection: 'column', gap: '1.25rem',
    },
    sectionHead: {
      fontSize: '.55rem', letterSpacing: '.22em', textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.35)', marginBottom: '.6rem',
    },
    label: {
      fontSize: '.68rem', color: 'rgba(255,255,255,0.55)',
      display: 'block', marginBottom: '.3rem',
    },
    input: {
      width: '100%', background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.12)',
      color: '#FFFFFF', padding: '.45rem .7rem',
      fontFamily: 'var(--sans)', fontSize: '.75rem',
      outline: 'none', borderRadius: 0,
    },
    slider: {
      width: '100%', accentColor: '#8B7355',
      cursor: 'pointer', marginTop: '.2rem',
    },
    uploadZone: (active) => ({
      border: `1.5px dashed ${active ? '#8B7355' : 'rgba(255,255,255,0.2)'}`,
      padding: '2rem 1rem', textAlign: 'center',
      cursor: 'pointer', transition: 'all .2s',
      background: active ? 'rgba(139,115,85,0.08)' : 'transparent',
    }),
    zoneBtn: (active) => ({
      width: '100%', padding: '.45rem .75rem', border: '1px solid',
      cursor: 'pointer', fontFamily: 'var(--sans)',
      fontSize: '.6rem', letterSpacing: '.12em', textTransform: 'uppercase',
      fontWeight: 500, marginBottom: '.3rem', textAlign: 'left',
      background: active ? 'rgba(139,115,85,0.2)' : 'transparent',
      color:       active ? '#C4A882' : 'rgba(255,255,255,0.55)',
      borderColor: active ? '#8B7355' : 'rgba(255,255,255,0.12)',
      transition: 'all .15s',
    }),
    btn: (variant = 'primary') => ({
      width: '100%', padding: '.7rem',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
      fontFamily: 'var(--sans)', fontSize: '.65rem', letterSpacing: '.16em',
      textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer', border: 'none',
      ...(variant === 'primary'  ? { background: '#8B7355', color: '#FFFFFF' } :
          variant === 'success'  ? { background: '#3D7A56', color: '#FFFFFF' } :
          variant === 'ghost'    ? { background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)' } :
          { background: '#1C1B18', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.2)' }),
      transition: 'opacity .15s',
    }),
  };

  // ── Step indicators ─────────────────────────────────────────────────────────
  const steps = [
    { n: 1, label: 'Base Product' },
    { n: 2, label: 'Design Graphic' },
    { n: 3, label: 'Compose' },
    { n: 4, label: 'Done' },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={S.wrap}>

      {/* ── Top bar ── */}
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={S.title}>Product Design Composer</span>

          {/* Step track */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            {steps.map(({ n, label }, i) => (
              <React.Fragment key={n}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '.4rem',
                  opacity: step >= n ? 1 : 0.35,
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: step > n ? '#3D7A56' : step === n ? '#8B7355' : 'rgba(255,255,255,0.15)',
                    color: '#FFFFFF', fontSize: '.62rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {step > n ? '✓' : n}
                  </div>
                  <span style={{ fontSize: '.65rem', color: step === n ? '#C4A882' : 'rgba(255,255,255,0.55)', letterSpacing: '.08em', whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ width: 24, height: 1, background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', fontSize: '1.3rem', lineHeight: 1, padding: '.25rem' }}>
          ×
        </button>
      </div>

      {/* ── Body ── */}
      <div style={S.body}>

        {/* ── LEFT SIDEBAR ── */}
        <div style={S.sidebar}>

          {/* Step 1: Upload base product */}
          <div>
            <div style={S.sectionHead}>1. Base Product Photo</div>
            {!baseImage ? (
              <div
                style={S.uploadZone(baseUploading)}
                onClick={() => baseFileRef.current?.click()}
              >
                <input ref={baseFileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => e.target.files[0] && uploadFile(e.target.files[0], 'base')} />
                <div style={{ fontSize: '1.5rem', marginBottom: '.5rem' }}>👕</div>
                <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
                  {baseUploading ? 'Uploading...' : 'Upload plain product photo\nJPEG, PNG, WebP'}
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <img src={baseImage.url} alt="Base" style={{ width: '100%', aspectRatio: '3/4', objectFit: 'contain', background: '#f5f3ee', display: 'block' }} />
                <button
                  onClick={() => { setBaseImage(null); setStep(1); setComposedUrl(null); }}
                  style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(28,27,24,0.8)', border: 'none', color: 'white', cursor: 'pointer', width: 24, height: 24, fontSize: '.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >×</button>
                <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,0.4)', marginTop: '.4rem', textAlign: 'center' }}>Base product ✓</div>
              </div>
            )}
          </div>

          {/* Step 2: Upload design */}
          {step >= 2 && (
            <div>
              <div style={S.sectionHead}>2. Design / Graphic</div>
              {!designImage ? (
                <div
                  style={S.uploadZone(designUploading)}
                  onClick={() => designFileRef.current?.click()}
                >
                  <input ref={designFileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => e.target.files[0] && uploadFile(e.target.files[0], 'design')} />
                  <div style={{ fontSize: '1.5rem', marginBottom: '.5rem' }}>🎨</div>
                  <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
                    {designUploading ? 'Uploading...' : 'Upload graphic / logo\nPNG with transparency recommended'}
                  </div>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <img src={designImage.url} alt="Design" style={{ width: '100%', maxHeight: 140, objectFit: 'contain', display: 'block', background: 'rgba(255,255,255,0.05)' }} />
                  <button
                    onClick={() => { setDesign(null); setStep(2); }}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(28,27,24,0.8)', border: 'none', color: 'white', cursor: 'pointer', width: 24, height: 24, fontSize: '.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >×</button>
                  <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,0.4)', marginTop: '.4rem', textAlign: 'center' }}>Design graphic ✓</div>
                </div>
              )}
            </div>
          )}

          {/* Print zone presets */}
          {step >= 3 && (
            <div>
              <div style={S.sectionHead}>Print Zone Presets</div>
              {Object.keys(PRINT_ZONES).map(name => (
                <button key={name} style={S.zoneBtn(printZone === name)} onClick={() => { applyZone(name); }}>
                  {name}
                </button>
              ))}
            </div>
          )}

          {/* View toggles */}
          {step >= 3 && (
            <div>
              <div style={S.sectionHead}>Canvas View</div>
              {[['showGrid', showGrid, setShowGrid, 'Grid overlay'], ['showZone', showZone, setShowZone, 'Print zone guide']].map(([key, val, setter, label]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                  <span style={{ fontSize: '.68rem', color: 'rgba(255,255,255,0.55)' }}>{label}</span>
                  <button onClick={() => setter(v => !v)} style={{
                    width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: val ? '#8B7355' : 'rgba(255,255,255,0.15)', position: 'relative', transition: 'background .2s',
                  }}>
                    <span style={{ position: 'absolute', top: 3, left: val ? 18 : 3, width: 14, height: 14, borderRadius: '50%', background: 'white', transition: 'left .2s' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── CANVAS AREA ── */}
        <div style={S.canvasArea}>
          {step === 1 && (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👕</div>
              <div style={{ fontSize: '.85rem', lineHeight: 1.7 }}>
                Upload a base product photo<br/>to get started
              </div>
            </div>
          )}

          {step === 2 && baseImage && (
            <div style={{ textAlign: 'center' }}>
              <img src={baseImage.url} alt="Base" style={{ maxHeight: 480, maxWidth: '100%', display: 'block', margin: '0 auto', opacity: 0.7 }} />
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '.78rem', marginTop: '1rem' }}>
                Now upload your design graphic →
              </div>
            </div>
          )}

          {(step === 3 || step === 4) && (
            <div style={{ position: 'relative' }}>
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                style={{
                  width: Math.min(CANVAS_W, window.innerWidth - 600),
                  height: 'auto',
                  display: 'block',
                  boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
                  cursor: isDragging ? 'grabbing' : 'default',
                }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onMouseUp}
              />
              {step === 3 && (
                <div style={{ position: 'absolute', bottom: -28, left: 0, right: 0, textAlign: 'center', fontSize: '.6rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '.1em' }}>
                  Drag to move · Drag corner to resize · [ ] to rotate · Arrow keys to nudge
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: Transform Controls ── */}
        {step >= 3 && step < 4 && (
          <div style={S.rightPanel}>

            <div>
              <div style={S.sectionHead}>Position</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                {[['X', 'x', 0, CANVAS_W], ['Y', 'y', 0, CANVAS_H]].map(([label, key, min, max]) => (
                  <div key={key}>
                    <span style={S.label}>{label}</span>
                    <input
                      type="number" min={min} max={max}
                      value={Math.round(transform[key])}
                      onChange={e => { setTransform(t => ({ ...t, [key]: Number(e.target.value) })); setPrintZone('Custom'); }}
                      style={S.input}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={S.sectionHead}>Size</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                {[['Width', 'w', 20, CANVAS_W], ['Height', 'h', 20, CANVAS_H]].map(([label, key, min, max]) => (
                  <div key={key}>
                    <span style={S.label}>{label}</span>
                    <input
                      type="number" min={min} max={max}
                      value={Math.round(transform[key])}
                      onChange={e => { setTransform(t => ({ ...t, [key]: Number(e.target.value) })); setPrintZone('Custom'); }}
                      style={S.input}
                    />
                  </div>
                ))}
              </div>

              {/* Maintain aspect ratio helper */}
              <button
                onClick={() => {
                  if (!designImage?.img) return;
                  const ratio = designImage.img.naturalWidth / designImage.img.naturalHeight;
                  setTransform(t => ({ ...t, h: Math.round(t.w / ratio) }));
                }}
                style={{ ...S.btn('ghost'), marginTop: '.5rem', fontSize: '.55rem', padding: '.4rem' }}
              >
                ⟷ Lock Aspect Ratio
              </button>
            </div>

            <div>
              <div style={S.sectionHead}>Rotation</div>
              <span style={S.label}>{Math.round(transform.rotation)}°</span>
              <input type="range" min={-180} max={180} value={transform.rotation} onChange={e => setTransform(t => ({ ...t, rotation: Number(e.target.value) }))} style={S.slider} />
              <div style={{ display: 'flex', gap: '.4rem', marginTop: '.4rem' }}>
                {[-90, -45, 0, 45, 90].map(r => (
                  <button key={r} onClick={() => setTransform(t => ({ ...t, rotation: r }))} style={{
                    flex: 1, padding: '.3rem', background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.6)', fontSize: '.58rem', fontFamily: 'var(--sans)',
                  }}>{r}°</button>
                ))}
              </div>
            </div>

            <div>
              <div style={S.sectionHead}>Opacity</div>
              <span style={S.label}>{Math.round(transform.opacity * 100)}%</span>
              <input type="range" min={0.05} max={1} step={0.01} value={transform.opacity} onChange={e => setTransform(t => ({ ...t, opacity: Number(e.target.value) }))} style={S.slider} />
            </div>

            <div>
              <div style={S.sectionHead}>Blend Mode</div>
              <select
                value={transform.blend}
                onChange={e => setTransform(t => ({ ...t, blend: e.target.value }))}
                style={{ ...S.input, cursor: 'pointer' }}
              >
                {BLEND_MODES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div>
              <div style={S.sectionHead}>Quick Adjustments</div>
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                {[
                  ['Center H', () => setTransform(t => ({ ...t, x: Math.round((CANVAS_W - t.w) / 2) }))],
                  ['Center V', () => setTransform(t => ({ ...t, y: Math.round((CANVAS_H - t.h) / 2) }))],
                  ['Fit Zone', () => applyZone(printZone !== 'Custom' ? printZone : 'Front Center')],
                  ['Reset',    () => { setTransform(t => ({ ...t, rotation: 0, opacity: 1, blend: 'source-over' })); applyZone('Front Center'); }],
                ].map(([label, fn]) => (
                  <button key={label} onClick={fn} style={{
                    padding: '.35rem .65rem', background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.6)', fontSize: '.58rem', letterSpacing: '.1em',
                    fontFamily: 'var(--sans)', textTransform: 'uppercase',
                  }}>{label}</button>
                ))}
              </div>
            </div>

            {msg && <div style={{ fontSize: '.72rem', color: '#F87171', padding: '.6rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}>{msg}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginTop: 'auto', paddingTop: '1rem' }}>
              <button
                style={{ ...S.btn('success'), opacity: exporting ? .6 : 1 }}
                onClick={exportComposed}
                disabled={exporting}
              >
                {exporting ? (
                  <><span style={{ width: 14, height: 14, border: '1.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .8s linear infinite', display: 'inline-block' }} /> Composing...</>
                ) : '✓ Save Composed Image'}
              </button>
              <button style={S.btn('ghost')} onClick={onCancel}>Cancel</button>
            </div>
          </div>
        )}

        {/* ── Step 4: Done ── */}
        {step === 4 && (
          <div style={{ ...S.rightPanel, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', color: '#FFFFFF', marginBottom: '.75rem', fontWeight: 300 }}>
              Image Composed!
            </div>
            <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
              Your composed product image has been saved and is ready to use.
            </div>
            {composedUrl && (
              <img src={getImageUrl(composedUrl)} alt="Composed" style={{ width: '100%', marginBottom: '1.25rem', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', width: '100%' }}>
              <button style={S.btn('primary')} onClick={() => { setStep(1); setBaseImage(null); setDesign(null); setComposedUrl(null); }}>
                Compose Another
              </button>
              <button style={S.btn('ghost')} onClick={onCancel}>
                Back to Product
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
