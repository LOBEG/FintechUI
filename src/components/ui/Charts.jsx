'use client';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
function rand(seed) {
    let s = seed;
    return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
}
function generateCandles(count, seed = 42, base = 70000) {
    const r = rand(seed);
    const out = [];
    let prev = base;
    for (let i = 0; i < count; i++) {
        const drift = (r() - 0.48) * base * 0.012;
        const o = prev;
        const c = Math.max(1, o + drift);
        const h = Math.max(o, c) + r() * base * 0.006;
        const l = Math.min(o, c) - r() * base * 0.006;
        out.push({ o, h, l, c });
        prev = c;
    }
    return out;
}
export function CandlestickChart({ width = 720, height = 320, count = 60, seed = 7, base = 70000, animate = true, showAxes = true, data = null, }) {
    const [internal, setInternal] = useState(() => generateCandles(count, seed, base));
    useEffect(() => {
        if (data || !animate)
            return;
        const id = setInterval(() => {
            setInternal((prev) => {
                const last = prev[prev.length - 1];
                const drift = (Math.random() - 0.48) * base * 0.012;
                const o = last.c;
                const c = Math.max(1, o + drift);
                const h = Math.max(o, c) + Math.random() * base * 0.006;
                const l = Math.min(o, c) - Math.random() * base * 0.006;
                return [...prev.slice(1), { o, h, l, c }];
            });
        }, 1400);
        return () => clearInterval(id);
    }, [animate, base, data]);
    const hasExternalData = Array.isArray(data);
    const candles = hasExternalData ? data : internal;
    const { min, max } = useMemo(() => {
        if (!candles.length) return { min: 0, max: 1 };
        let mn = Infinity, mx = -Infinity;
        for (const k of candles) {
            if (k.l < mn)
                mn = k.l;
            if (k.h > mx)
                mx = k.h;
        }
        const pad = (mx - mn) * 0.08;
        return { min: mn - pad, max: mx + pad };
    }, [candles]);
    if (hasExternalData && !candles.length) {
        return (<svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" className="block">
          <rect width={width} height={height} rx="16" fill="rgba(255,255,255,0.025)"/>
          {[0.2, 0.4, 0.6, 0.8].map((p) => (<line key={p} x1="48" x2={width - 8} y1={height * p} y2={height * p} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 4"/>))}
          <text x={width / 2} y={height / 2 - 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="rgba(255,255,255,0.78)">Connecting to live market chart</text>
          <text x={width / 2} y={height / 2 + 18} textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.48)">Waiting for Binance candle data</text>
        </svg>);
    }
    const padL = showAxes ? 48 : 8;
    const padR = 8;
    const padT = 12;
    const padB = showAxes ? 24 : 8;
    const W = width - padL - padR;
    const H = height - padT - padB;
    const cw = W / candles.length;
    const bw = Math.max(2, cw * 0.6);
    const y = (v) => padT + ((max - v) / (max - min)) * H;
    const last = candles[candles.length - 1];
    const up = last.c >= last.o;
    // build line path of closes for area fill
    const linePts = candles.map((k, i) => `${padL + i * cw + cw / 2},${y(k.c)}`).join(' ');
    const areaPath = `M ${padL},${padT + H} L ${linePts.split(' ').join(' L ')} L ${padL + W},${padT + H} Z`;
    return (<svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" className="block">
      <defs>
        <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#00ffa3" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#00ffa3" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="gridGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.08)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0.02)"/>
        </linearGradient>
      </defs>

      {/* grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (<line key={i} x1={padL} x2={padL + W} y1={padT + H * p} y2={padT + H * p} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 4"/>))}

      {/* axes labels */}
      {showAxes &&
            [0, 0.25, 0.5, 0.75, 1].map((p, i) => (<text key={i} x={padL - 6} y={padT + H * p + 4} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.45)">
            {Math.round(max - (max - min) * p).toLocaleString()}
          </text>))}

      {/* area */}
      <path d={areaPath} fill="url(#areaGrad)"/>

      {/* candles */}
      {candles.map((k, i) => {
            const x = padL + i * cw + cw / 2;
            const isUp = k.c >= k.o;
            const color = isUp ? '#00ffa3' : '#ff4d6d';
            const yO = y(k.o);
            const yC = y(k.c);
            const top = Math.min(yO, yC);
            const bh = Math.max(1, Math.abs(yC - yO));
            return (<g key={i}>
            <line x1={x} x2={x} y1={y(k.h)} y2={y(k.l)} stroke={color} strokeWidth={1}/>
            <motion.rect initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} x={x - bw / 2} y={top} width={bw} height={bh} fill={color} rx={1.5}/>
          </g>);
        })}

      {/* last price line */}
      <line x1={padL} x2={padL + W} y1={y(last.c)} y2={y(last.c)} stroke={up ? '#00ffa3' : '#ff4d6d'} strokeDasharray="2 3" strokeWidth={1} opacity={0.7}/>
      <rect x={padL + W - 60} y={y(last.c) - 9} width={56} height={18} rx={4} fill={up ? '#00ffa3' : '#ff4d6d'}/>
      <text x={padL + W - 32} y={y(last.c) + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#05070d">
        {Math.round(last.c).toLocaleString()}
      </text>
    </svg>);
}
export function Sparkline({ width = 120, height = 40, seed = 1, positive = true, data = null, }) {
    const points = useMemo(() => {
        if (Array.isArray(data) && data.length) {
            return data.map((v) => Number(v)).filter((v) => Number.isFinite(v));
        }
        const r = rand(seed);
        const arr = [];
        let v = 50;
        for (let i = 0; i < 40; i++) {
            v += (r() - 0.5) * 8 + (positive ? 0.4 : -0.4);
            arr.push(v);
        }
        return arr;
    }, [data, seed, positive]);
    if (points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const path = points
        .map((p, i) => {
        const x = (i / (points.length - 1)) * width;
        const y = height - ((p - min) / (max - min || 1)) * height;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
    })
        .join(' ');
    const color = positive ? '#00ffa3' : '#ff4d6d';
    return (<svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
      <path d={path} fill="none" stroke={color} strokeWidth={1.5}/>
    </svg>);
}
export function DonutChart({ size = 180, data, }) {
    const total = data.reduce((a, b) => a + b.value, 0) || 1;
    const r = size / 2 - 14;
    const c = 2 * Math.PI * r;
    let offset = 0;
    return (<div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={14} fill="none"/>
        {data.map((d, i) => {
            const len = (d.value / total) * c;
            const dasharray = `${len} ${c - len}`;
            const dashoffset = -offset;
            offset += len;
            return (<circle key={i} cx={size / 2} cy={size / 2} r={r} stroke={d.color} strokeWidth={14} fill="none" strokeDasharray={dasharray} strokeDashoffset={dashoffset} strokeLinecap="round"/>);
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-white/50">Total</span>
        <span className="text-lg font-semibold">{total.toLocaleString()}</span>
      </div>
    </div>);
}
export function BarChart({ data, width = 320, height = 140, color = '#06d6c4', }) {
    const max = Math.max(...data, 1);
    const bw = width / data.length;
    return (<svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
      {data.map((v, i) => {
            const h = (v / max) * (height - 12);
            return (<rect key={i} x={i * bw + 3} y={height - h} width={bw - 6} height={h} rx={3} fill={color} opacity={0.85}/>);
        })}
    </svg>);
}
