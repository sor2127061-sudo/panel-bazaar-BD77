/**
 * @license SPDX-License-Identifier: Apache-2.0
 * LUMEN ProductCard — cinematic poster-style glass card
 */

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Zap } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  minPrice: number | null;
  hasStock: boolean;
  demoUrl: string | null;
  key?: React.Key;
}

export default function ProductCard({ product, minPrice, hasStock }: ProductCardProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Link
      ref={ref}
      to={`/topup/${product.id}`}
      className="product-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: 'opacity 0.55s var(--ease-out), transform 0.55s var(--ease-out)',
      }}
    >
      {/* ── Poster Image ── */}
      <div style={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden', background: '#0B0C10' }}>
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?w=600&auto=format&fit=crop&q=70'}
          alt={product.name}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transition: 'transform 0.5s var(--ease)',
          }}
          className="product-card-img"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <style>{`.product-card:hover .product-card-img{transform:scale(1.05);}`}</style>

        {/* Gradient overlay — bottom heavy */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(7,8,10,0.92) 0%, rgba(7,8,10,0.3) 45%, rgba(0,0,0,0.12) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Category badge */}
        <div style={{ position: 'absolute', top: 10, left: 10 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '0.2rem 0.55rem',
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 999,
            fontSize: '0.6rem', fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--text-mute)',
          }}>
            <Layers size={8} color="#10b981" /> {product.category}
          </span>
        </div>

        {/* Stock status */}
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          {hasStock ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '0.2rem 0.55rem',
              background: 'rgba(16,185,129,0.12)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: 999,
              fontSize: '0.6rem', fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: '#10b981',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: 999, background: '#10b981', boxShadow: '0 0 6px #10b981', animation: 'pulse 2s ease-in-out infinite' }} />
              In Stock
              <style>{`@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}`}</style>
            </span>
          ) : (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '0.2rem 0.55rem',
              background: 'rgba(239,68,68,0.1)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 999,
              fontSize: '0.6rem', fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: '#f87171',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: 999, background: '#f87171' }} />
              Restocking
            </span>
          )}
        </div>
      </div>

      {/* ── Card Body ── */}
      <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <h3 style={{
            fontSize: '0.9rem', fontWeight: 800, letterSpacing: '-0.01em',
            color: 'var(--text)', margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            transition: 'color 0.2s',
          }} className="product-card-title">
            {product.name}
          </h3>
          <style>{`.product-card:hover .product-card-title{color:#10b981;}`}</style>
          <p style={{
            fontSize: '0.72rem', color: 'var(--text-mute)', margin: '0.2rem 0 0',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {product.description?.replace(/https?:\/\/\S+/g, '').substring(0, 50) || 'Instant delivery · Genuine keys'}
          </p>
        </div>

        {/* Price + CTA */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: '0.75rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 2 }}>
              Starting From
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700,
              color: '#10b981',
              textShadow: '0 0 20px rgba(16,185,129,0.3)',
            }}>
              ৳{minPrice !== null ? minPrice.toLocaleString() : '--'}
            </div>
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '0.45rem 0.85rem',
            borderRadius: 10,
            fontSize: '0.7rem', fontWeight: 700,
            letterSpacing: '0.05em', textTransform: 'uppercase',
            fontFamily: 'var(--font-mono)',
            background: hasStock ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${hasStock ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.06)'}`,
            color: hasStock ? '#10b981' : 'var(--text-faint)',
            transition: 'background 0.2s, color 0.2s, border-color 0.2s',
          }} className="product-card-cta">
            <style>{`.product-card:hover .product-card-cta{background:${hasStock ? '#10b981' : 'rgba(255,255,255,0.04)'};color:${hasStock ? '#000' : 'var(--text-faint)'};}`}</style>
            {hasStock ? <><Zap size={10} /> Get Keys</> : 'No Stock'}
          </div>
        </div>
      </div>
    </Link>
  );
}
