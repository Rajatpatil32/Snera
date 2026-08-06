import React, { useState, useRef, useCallback, useEffect } from 'react';
import { getImageUrl } from '../../utils/api';

// ─── Constants — must match backend/services/compose.js CANVAS_W/CANVAS_H ─────
const CANVAS_W = 600;
const CANVAS_H = 750;

const PRINT_ZONES = {
  'Front Center': { x: 0.28, y: 0.22, w: 0.44, h: 0.38 },
  'Front Pocket': { x: 0.58, y: 0.24, w: 0.18, h: 0.16 },
  'Back Center':  { x: 0.28, y: 0.22, w: 0.44, h: 0.38 },
  'Left Sleeve':  { x: 0.08, y: 0.28, w: 0.18, h: 0.30 },
  'Right Sleeve': { x: 0.74, y: 0.28, w: 0.18, h: 0.30 },
  'Custom':       null,
};

// Positions a design once — the same placement is reused across every
// global mockup colour, so this only needs one reference mockup to preview against.
export default function DesignPlacer({ designUrl, mockupImage, initialPlacement, onSave, onCancel }) {
  const [transform, setTransform] = useState(initialPlacement || {
    x: 150, y: 165, w: 264, h: 264, rotation: 0, opacity: 1, blend: 'source-over',
  });
  const [printZone, setPrintZone] = useState('Custom');
  const [designImg, setDesignImg] = useState(null);
  const [baseImg, setBaseImg]     = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart]   = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);

  const loadImg = (src) => new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  useEffect(() => {
    loadImg(getImageUrl(mockupImage)).then(setBaseImg).catch(() => {});
    loadImg(getImageUrl(designUrl)).then(setDesignImg).catch(() => {});
  }, [mockupImage, designUrl]);

  const applyZone = useCallback((zoneName) => {
    const zone = PRINT_ZONES[zoneName];
    if (!zone) return;
    setPrintZone(zoneName);
    setTransform(t => ({
      ...t,
      x: Math.round(zone.x * CANVAS_W), y: Math.round(zone.y * CANVAS_H),
      w: Math.round(zone.w * CANVAS_W), h: Math.round(zone.h * CANVAS_H),
    }));
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImg) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    const scale = Math.max(CANVAS_W / baseImg.width, CANVAS_H / baseImg.height);
    const bW = baseImg.width * scale, bH = baseImg.height * scale;
    ctx.drawImage(baseImg, (CANVAS_W - bW) / 2, (CANVAS_H - bH) / 2, bW, bH);

    if (designImg) {
      const { x, y, w, h, rotation, opacity, blend } = transform;
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = blend;
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(designImg, -w / 2, -h / 2, w, h);
      ctx.restore();

      ctx.strokeStyle = '#8B7355';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
      [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([hx, hy]) => {
        ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#8B7355'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(hx, hy, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      });
    }
  }, [baseImg, designImg, transform]);

  useEffect(() => { render(); }, [render]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
      y: (e.clientY - rect.top) * (CANVAS_H / rect.height),
    };
  };
  const overHandle = (pos) => Math.abs(pos.x - (transform.x + transform.w)) < 12 && Math.abs(pos.y - (transform.y + transform.h)) < 12;
  const overDesign = (pos) => pos.x >= transform.x && pos.x <= transform.x + transform.w && pos.y >= transform.y && pos.y <= transform.y + transform.h;

  const onMouseDown = (e) => {
    const pos = getPos(e);
    if (overHandle(pos)) { setIsResizing(true); setDragStart({ x: pos.x - (transform.x + transform.w), y: pos.y - (transform.y + transform.h) }); }
    else if (overDesign(pos)) { setIsDragging(true); setDragStart({ x: pos.x - transform.x, y: pos.y - transform.y }); }
  };
  const onMouseMove = (e) => {
    const pos = getPos(e);
    if (isDragging) {
      setTransform(t => ({ ...t, x: Math.max(0, Math.min(CANVAS_W - t.w, pos.x - dragStart.x)), y: Math.max(0, Math.min(CANVAS_H - t.h, pos.y - dragStart.y)) }));
      setPrintZone('Custom');
    } else if (isResizing) {
      setTransform(t => ({ ...t, w: Math.max(40, pos.x - t.x - dragStart.x), h: Math.max(40, pos.y - t.y - dragStart.y) }));
      setPrintZone('Custom');
    }
  };
  const onMouseUp = () => { setIsDragging(false); setIsResizing(false); };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,19,17,.92)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: '#1C1B18', display: 'flex', maxWidth: 980, width: '100%', maxHeight: '90vh' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <canvas
            ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
            style={{ width: Math.min(CANVAS_W, 460), height: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,.6)', cursor: isDragging ? 'grabbing' : 'default' }}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          />
        </div>
        <div style={{ width: 260, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', color: 'rgba(255,255,255,.85)', fontFamily: 'var(--sans)', overflowY: 'auto' }}>
          <div style={{ fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>Print Zone</div>
          <select value={printZone} onChange={e => applyZone(e.target.value)} style={selStyle}>
            {Object.keys(PRINT_ZONES).map(z => <option key={z} value={z}>{z}</option>)}
          </select>

          <div style={{ fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>Rotation ({Math.round(transform.rotation)}°)</div>
          <input type="range" min={-180} max={180} value={transform.rotation} onChange={e => setTransform(t => ({ ...t, rotation: Number(e.target.value) }))} />

          <div style={{ fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>Opacity ({Math.round(transform.opacity * 100)}%)</div>
          <input type="range" min={0.05} max={1} step={0.01} value={transform.opacity} onChange={e => setTransform(t => ({ ...t, opacity: Number(e.target.value) }))} />

          <div style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.4)', lineHeight: 1.6 }}>Drag to move · Drag corner to resize</div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            <button onClick={() => onSave(transform)} style={{ padding: '.6rem', background: '#fff', border: 'none', cursor: 'pointer', fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 600 }}>
              ✓ Save Placement
            </button>
            <button onClick={onCancel} style={{ padding: '.6rem', background: 'transparent', border: '1px solid rgba(255,255,255,.2)', color: 'rgba(255,255,255,.7)', cursor: 'pointer', fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase' }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const selStyle = {
  width: '100%', padding: '.5rem .6rem', background: 'rgba(255,255,255,.07)',
  border: '1px solid rgba(255,255,255,.15)', color: '#fff', fontSize: '.75rem',
};