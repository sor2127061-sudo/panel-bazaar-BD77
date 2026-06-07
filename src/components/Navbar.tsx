/**
 * LUMEN Navbar — Mobile-first, 56px height, glass drawer
 */
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { Menu, X, Home, CreditCard, ShoppingBag, Key, User as UserIcon, LogOut, Package, RefreshCw, Send, Layers } from 'lucide-react';

export default function Navbar() {
  const { user, dbUser, balance, refreshBalance, siteSettings } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const fn = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      if (y > lastY.current + 10 && y > 80) setHidden(true);
      else if (y < lastY.current - 8) setHidden(false);
      lastY.current = y;
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      showSuccess('Logged out');
      setIsOpen(false);
      navigate('/');
    } catch (err: any) { showError(err.message || 'Error signing out'); }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try { await refreshBalance(); showSuccess('Balance updated'); }
    catch { showError('Failed to refresh'); }
    finally { setIsRefreshing(false); }
  };

  const isActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const drawerLinks = [
    { label: 'Home', path: '/', icon: <Home size={18} /> },
    { label: 'Custom Bundles', path: '/bundles', icon: <Package size={18} /> },
    ...(user ? [
      { label: 'Add Funds', path: '/add-fund', icon: <CreditCard size={18} /> },
      { label: 'My Orders', path: '/orders', icon: <ShoppingBag size={18} /> },
      { label: 'My Keys', path: '/codes', icon: <Key size={18} /> },
      { label: 'Stock Request', path: '/stock-request', icon: <Send size={18} /> },
      { label: 'Account', path: '/account', icon: <UserIcon size={18} /> },
    ] : []),
    ...(dbUser?.role === 'admin' ? [{ label: 'Admin', path: '/admin', icon: <Package size={18} /> }] : []),
  ];

  return (
    <>
      {/* ── Top Bar ── */}
      <nav className={`lumen-nav ${scrolled ? 'lumen-nav--scrolled' : ''} ${hidden ? 'lumen-nav--hidden' : ''}`}>
        <div className="nav-inner">
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', flexShrink: 0 }}>
            {siteSettings?.site_logo_url
              ? <img src={siteSettings.site_logo_url} alt="Logo" style={{ height: 28, width: 28, borderRadius: 7, objectFit: 'cover' }} />
              : <div style={{ width: 30, height: 30, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={15} color="#10b981" strokeWidth={1.8} />
                </div>
            }
            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
              {siteSettings?.site_name || 'Panel Bazaar BD'}
            </span>
          </Link>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {user ? (
              <>
                {/* Balance pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.7rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 999 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>৳{(balance || 0).toLocaleString()}</span>
                  <button onClick={handleRefresh} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', lineHeight: 1, color: 'rgba(16,185,129,0.6)' }}>
                    <RefreshCw size={10} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
                  </button>
                </div>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

                {/* Hamburger */}
                <button onClick={() => setIsOpen(o => !o)} aria-label="Menu" style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-dim)', flexShrink: 0 }}>
                  {isOpen ? <X size={16} /> : <Menu size={16} />}
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <Link to="/login" className="btn-ghost" style={{ padding: '0.4rem 0.875rem', fontSize: '0.72rem', textDecoration: 'none' }}>Login</Link>
                <Link to="/register" className="btn-accent" style={{ padding: '0.4rem 0.875rem', fontSize: '0.72rem', textDecoration: 'none' }}>Register</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Backdrop ── */}
      {isOpen && (
        <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} />
      )}

      {/* ── Drawer ── */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(300px, 85vw)', zIndex: 96,
        background: 'rgba(7,8,10,0.98)',
        backdropFilter: 'blur(32px) saturate(180%)',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.32s cubic-bezier(0.22,1,0.36,1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-16px 0 60px rgba(0,0,0,0.8)',
        overflowY: 'auto',
        paddingBottom: 'env(safe-area-inset-bottom,0px)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
              {siteSettings?.site_name || 'Panel Bazaar BD'}
            </div>
            {user && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-mute)', marginTop: 2 }}>{user.email}</div>}
          </div>
          <button onClick={() => setIsOpen(false)} style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-mute)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Balance */}
        {user && (
          <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)' }}>Wallet</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color: '#10b981', textShadow: '0 0 20px rgba(16,185,129,0.35)' }}>
              ৳{(balance || 0).toLocaleString()}
            </div>
            <Link to="/add-fund" onClick={() => setIsOpen(false)} className="btn-accent" style={{ marginTop: '0.75rem', width: '100%', fontSize: '0.72rem', textDecoration: 'none', justifyContent: 'center' }}>
              + Add Funds
            </Link>
          </div>
        )}

        {/* Nav links */}
        <div style={{ flex: 1, padding: '0.5rem' }}>
          {drawerLinks.map(item => (
            <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.875rem 0.875rem', borderRadius: 12, marginBottom: 2,
              textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600,
              color: isActive(item.path) ? '#10b981' : 'var(--text-dim)',
              background: isActive(item.path) ? 'rgba(16,185,129,0.08)' : 'transparent',
            }}>
              <span style={{ color: isActive(item.path) ? '#10b981' : 'var(--text-mute)' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {user ? (
            <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem', borderRadius: 13, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', color: '#f87171', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              <LogOut size={14} /> Log Out
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link to="/login" onClick={() => setIsOpen(false)} className="btn-ghost" style={{ width: '100%', textDecoration: 'none', justifyContent: 'center' }}>Login</Link>
              <Link to="/register" onClick={() => setIsOpen(false)} className="btn-accent" style={{ width: '100%', textDecoration: 'none', justifyContent: 'center' }}>Register</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
