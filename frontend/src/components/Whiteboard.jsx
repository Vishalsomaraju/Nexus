import React, { useRef, useState, useEffect, useCallback } from 'react';
import './Whiteboard.css';

const COLORS = ['#f5f5f5', '#4F6EF7', '#4ade80', '#f59e0b', '#f87171', '#a78bfa', '#38bdf8'];
const DOT_SIZE = 1;
const DOT_GAP  = 24;

function drawDotGrid(ctx, w, h) {
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (let x = DOT_GAP; x < w; x += DOT_GAP) {
    for (let y = DOT_GAP; y < h; y += DOT_GAP) {
      ctx.beginPath();
      ctx.arc(x, y, DOT_SIZE, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export default function Whiteboard({ broadcastWhiteboard }) {
  const canvasRef  = useRef(null);
  const isDrawing  = useRef(false);
  const lastPos    = useRef(null);
  const gridRef    = useRef(null); // off-screen grid canvas

  const [tool,  setTool]  = useState('pen');
  const [color, setColor] = useState('#f5f5f5');
  const [size,  setSize]  = useState(3);

  /* Init canvas + dot grid */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = width  * dpr;
      canvas.height = height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      drawDotGrid(ctx, width, height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const startDraw = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    isDrawing.current = true;
    lastPos.current = getPos(e, canvas);
  }, []);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const pos    = getPos(e, canvas);
    const from   = lastPos.current;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === 'eraser' ? '#050505' : color;
    ctx.lineWidth   = tool === 'eraser' ? size * 5 : size;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke();

    broadcastWhiteboard?.({ from, to: pos, color: tool === 'eraser' ? '#050505' : color, size: tool === 'eraser' ? size * 5 : size });
    lastPos.current = pos;
  }, [tool, color, size, broadcastWhiteboard]);

  const stopDraw = useCallback(() => { isDrawing.current = false; }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const { width, height } = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawDotGrid(ctx, width, height);
  };

  return (
    <div className="whiteboard-wrap">
      {/* Toolbar */}
      <div className="wb-toolbar">
        {/* Tools */}
        <div className="wb-tool-group">
          <button className={`wb-tool-btn ${tool === 'pen' ? 'active' : ''}`}
            title="Pen" onClick={() => setTool('pen')}>
            <span className="material-symbols-outlined">edit</span>
          </button>
          <button className={`wb-tool-btn ${tool === 'eraser' ? 'active' : ''}`}
            title="Eraser" onClick={() => setTool('eraser')}>
            <span className="material-symbols-outlined">ink_eraser</span>
          </button>
        </div>

        {/* Colors */}
        <div className="wb-colors">
          {COLORS.map(c => (
            <div
              key={c}
              className={`wb-color-swatch ${color === c ? 'active' : ''}`}
              style={{ background: c }}
              title={c}
              onClick={() => { setColor(c); setTool('pen'); }}
            />
          ))}
        </div>

        {/* Size */}
        <div className="wb-size-group">
          <span className="wb-size-label">{size}px</span>
          <input
            className="wb-size-slider"
            type="range" min={1} max={20} step={1}
            value={size}
            onChange={e => setSize(Number(e.target.value))}
          />
        </div>

        <div className="wb-spacer" />

        <button className="wb-clear-btn" onClick={clearCanvas}>
          <span className="material-symbols-outlined">delete_sweep</span>
          Clear
        </button>
      </div>

      {/* Canvas */}
      <div className="wb-canvas-wrap">
        <canvas
          ref={canvasRef}
          className={`wb-canvas tool-${tool}`}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>
    </div>
  );
}
