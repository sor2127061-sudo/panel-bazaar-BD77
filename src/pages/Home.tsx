/**
 * @license SPDX-License-Identifier: Apache-2.0
 * LUMEN Home — cinematic hero + product catalog
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product, Package } from '../types';
import ProductCard from '../components/ProductCard';
import { useToast } from '../context/ToastContext';
import { Search, ShieldCheck, Flame, Zap, Award, Sparkles, AlertCircle, ShoppingCart } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { showError } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [stockCounts, setStockCounts] = useState<{ [packageId: string]: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    async function loadCatalog() {
      try {
        setIsLoading(true);

        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        if (productsError) throw productsError;

        const { data: packagesData, error: packagesError } = await supabase
          .from('packages')
          .select('*')
          .eq('is_active', true);
        if (packagesError) throw packagesError;

        const { data: stockData, error: stockError } = await supabase
          .from('stock_items')
          .select('package_id')
          .eq('is_sold', false);
        if (stockError) throw stockError;

        const counts: { [packageId: string]: number } = {};
        if (stockData) {
          stockData.forEach((item: any) => {
            counts[item.package_id] = (counts[item.package_id] || 0) + 1;
          });
        }

        setProducts(productsData || []);
        setPackages(packagesData || []);
        setStockCounts(counts);
      } catch (err: any) {
        console.error('Error loading catalog data:', err);
        showError('Failed to load marketplace catalog! Please refresh.');
      } finally {
        setIsLoading(false);
      }
    }
    loadCatalog();
  }, [showError]);

  const productMetrics = useMemo(() => {
    const metrics: { [productId: string]: { minPrice: number | null; hasStock: boolean; packagesList: Package[] } } = {};
    products.forEach((prod) => {
      const productPackages = packages.filter((pkg) => pkg.product_id === prod.id);
      let minPrice: number | null = null;
      let hasStock = false;
      productPackages.forEach((pkg) => {
        if (minPrice === null || pkg.price < minPrice) minPrice = Number(pkg.price);
        if ((stockCounts[pkg.id] || 0) > 0) hasStock = true;
      });
      metrics[prod.id] = { minPrice, hasStock, packagesList: productPackages };
    });
    return metrics;
  }, [products, packages, stockCounts]);

  const extractYoutubeLink = (description: string): string | null => {
    if (!description) return null;
    const regex = /(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/\S+)/;
    const match = description.match(regex);
    return match ? match[0] : null;
  };

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchesCategory = activeCategory === 'All' || prod.category === activeCategory;
      const matchesQuery =
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prod.description && prod.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesQuery;
    });
  }, [products, searchQuery, activeCategory]);

  const categories = ['All', 'NON ROOT', 'ROOT', 'Game / Voucher'];

  return (
    <div className="page-enter" style={{ minHeight: '100vh', paddingBottom: '6rem' }}>

      {/* ══ Cinematic Hero ══ */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '7rem 1.5rem 4rem',
        textAlign: 'center',
      }}>
        {/* Hero glow */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
          width: '60vmax', height: '30vmax',
          background: 'radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 65%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto' }}>
          {/* Eyebrow */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.3rem 0.9rem',
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 999,
            marginBottom: '1.5rem',
          }}>
            <Zap size={11} color="#10b981" />
            <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
              Instant Digital Delivery
            </span>
          </div>

          {/* Main headline */}
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 'clamp(2.2rem, 6vw, 4rem)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: 'var(--text)',
            lineHeight: 1.1,
            margin: '0 0 1rem',
          }}>
            Panel Bazaar{' '}
            <span style={{
              background: 'linear-gradient(135deg, #10b981 0%, #34d399 60%, #6ee7b7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>BD</span>
          </h1>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-mute)', maxWidth: 480, margin: '0 auto 2rem', lineHeight: 1.6 }}>
            Premium streaming panels, developer keys & digital vouchers — delivered instantly to your dashboard.
          </p>

          {/* Trust badges */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { icon: <ShieldCheck size={13} />, label: 'Genuine Keys' },
              { icon: <Zap size={13} />, label: 'Instant Delivery' },
              { icon: <Award size={13} />, label: 'Trusted Store' },
            ].map(({ icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.73rem', color: 'var(--text-mute)', fontWeight: 500 }}>
                <span style={{ color: '#10b981' }}>{icon}</span> {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Filter + Search ══ */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.25rem' }}>
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 20,
          padding: '1rem 1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          justifyContent: 'space-between',
        }}>
          {/* Category pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`cat-pill ${activeCategory === cat ? 'active' : ''}`}
              >
                {cat === 'All' ? 'All Products' : cat}
              </button>
            ))}
            <Link
              to="/bundles"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.4rem 0.9rem',
                background: 'rgba(16,185,129,0.05)',
                border: '1px dashed rgba(16,185,129,0.3)',
                borderRadius: 999,
                color: '#10b981',
                fontSize: '0.75rem', fontWeight: 600,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s',
              }}
            >
              <ShoppingCart size={11} /> Custom Bundles
            </Link>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', minWidth: 220, flex: '0 1 280px' }}>
            <Search size={14} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-faint)', pointerEvents: 'none',
            }} />
            <input
              type="text"
              placeholder="Search products…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="lumen-input-plain"
              style={{ paddingLeft: '2.2rem', fontSize: '0.8125rem' }}
            />
          </div>
        </div>

        {/* ══ Product Grid ══ */}
        {isLoading ? (
          <div>
            {/* Section title skeleton */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div className="sk" style={{ width: 3, height: 20, borderRadius: 2 }} />
              <div className="sk" style={{ width: 180, height: 20 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(180px, 100%), 1fr))', gap: '1rem' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="sk" style={{ borderRadius: 26, aspectRatio: '4/5' }} />
              ))}
            </div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ width: 3, height: 20, borderRadius: 2, background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }} />
              <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text)' }}>
                {activeCategory === 'All' ? 'All Products' : activeCategory}
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: '0.75rem', color: 'var(--text-mute)', marginLeft: '0.5rem' }}>
                  {filteredProducts.length} items
                </span>
              </h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))',
              gap: '1.25rem',
            }}>
              {filteredProducts.map((product) => {
                const metrics = productMetrics[product.id] || { minPrice: null, hasStock: false };
                const demoUrl = extractYoutubeLink(product.description);
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    minPrice={metrics.minPrice}
                    hasStock={metrics.hasStock}
                    demoUrl={demoUrl}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div style={{
              width: 72, height: 72,
              background: 'rgba(255,255,255,0.03)',
              border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertCircle size={28} color="var(--text-faint)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text-dim)' }}>
                Nothing here yet
              </h3>
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: 'var(--text-mute)' }}>
                Try a different keyword or clear your filters.
              </p>
            </div>
            {(searchQuery || activeCategory !== 'All') && (
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                className="btn-ghost"
                style={{ fontSize: '0.75rem', padding: '0.5rem 1.25rem' }}
              >
                Reset filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
