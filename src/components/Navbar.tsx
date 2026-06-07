/**
 * LUMEN Navbar — scroll-aware, hide-on-down, reveal-on-up
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
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      if (y > lastScrollY.current + 8 && y > 80) setHidden(true);
      else if (y < lastScrollY.current - 8) setHidden(false);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      showSuccess('Logged out successfully');
      setIsOpen(false);
      navigate('/');
    } catch (err: any) { showError(err.message || 'Error signing out'); }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try { await refreshBalance(); showSuccess('Balance updated successfully'); }
    catch { showError('Failed to update balance'); }
    finally { setIsRefreshing(false); }
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Bundles', path: '/bundles' },
    ...(user ? [{ label: 'Orders', path: '/orders' }, { label: 'My Keys', path: '/codes' }] : []),
    ...(dbUser?.role === 'admin' ? [{ label: 'Admin', path: '/admin' }] : []),
  ];

  const isActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      <nav className={`lumen-nav ${scrolled ? 'lumen-nav--scrolled' : ''} ${hidden ? 'lumen-nav--hidden' : ''}`} style={{ height: 64 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.25rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', flexShrink: 0 }}>
            {siteSettings?.site_logo_url ? (
              <img src={siteSettings.site_logo_url} alt="Logo" style={{ height: 30, width: 30, borderRadius: 8, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 32, height: 32, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(16,185,129,0.15)' }}>
                <Layers size={16} color="#10b981" strokeWidth={1.8} />
              </div>
            )}
            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)', letterSpacing: '-0.02em' }}>
              {siteSettings?.site_name || 'Panel Bazaar BD'}
            </span>
          </Link>

          <div className="md-flex" style={{ display: 'none', alignItems: 'center', gap: '0.25rem', flex: 1, justifyContent: 'center' }}>
            <style>{`@media(min-width:768px){.md-flex{display:flex!important;}}`}</style>
            {navLinks.map(link => (
              <Link key={link.path} to={link.path} style={{ padding: '0.45rem 0.9rem', borderRadius: 9, fontSize: '0.8rem', fontWeight: 600, color: isActive(link.path) ? '#10b981' : 'var(--text-mute)', textDecoration: 'none', background: isActive(link.path) ? 'rgba(16,185,129,0.1)' : 'transparent', transition: 'color 0.18s, background 0.18s' }}>{link.label}</Link>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.85rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 999 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>৳{(balance || 0).toLocaleString()}</span>
                  <button onClick={handleRefresh} title="Refresh balance" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'rgba(16,185,129,0.6)' }}>
                    <RefreshCw size={11} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
                  </button>
                </div>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <Link to="/add-fund" className="btn-accent" style={{ padding: '0.45rem 1rem', fontSize: '0.75rem', textDecoration: 'none' }}>+ Fund</Link>
                <button onClick={() => setIsOpen(o => !o)} style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-dim)' }} aria-label="Menu">
                  {isOpen ? <X size={17} /> : <Menu size={17} />}
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link to="/login" className="btn-ghost" style={{ padding: '0.45rem 1rem', fontSize: '0.75rem', textDecoration: 'none' }}>Login</Link>
                <Link to="/register" className="btn-accent" style={{ padding: '0.45rem 1rem', fontSize: '0.75rem', textDecoration: 'none' }}>Register</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {isOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setIsOpen(false)} />}

      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(340px, 88vw)', zIndex: 96, background: 'rgba(7,8,10,0.97)', backdropFilter: 'blur(32px) saturate(180%)', borderLeft: '1px solid rgba(255,255,255,0.06)', transform: isOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.35s cubic-bezier(0.22,1,0.36,1)', display: 'flex', flexDirection: 'column', boxShadow: '-24px 0 80px rgba(0,0,0,0.8)', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>{siteSettings?.site_name || 'Panel Bazaar BD'}</div>
            {user && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-mute)', marginTop: 2 }}>{user.email}</div>}
          </div>
          <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)' }}><X size={20} /></button>
        </div>

        {user && (
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: '0.4rem', fontFamily: 'var(--font-mono)' }}>Wallet Balance</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 700, color: '#10b981', textShadow: '0 0 20px rgba(16,185,129,0.4)' }}>৳{(balance || 0).toLocaleString()}</span>
              <button onClick={handleRefresh} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(16,185,129,0.6)' }}><RefreshCw size={14} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} /></button>
            </div>
          </div>
        )}

        <div style={{ padding: '0.75rem', flex: 1 }}>
          {[{ label: 'Home', path: '/', icon: <Home size={16} /> }, { label: 'Custom Bundles', path: '/bundles', icon: <Package size={16} /> }, ...(user ? [{ label: 'Add Funds', path: '/add-fund', icon: <CreditCard size={16} /> }, { label: 'My Orders', path: '/orders', icon: <ShoppingBag size={16} /> }, { label: 'My Keys', path: '/codes', icon: <Key size={16} /> }, { label: 'Stock Request', path: '/stock-request', icon: <Send size={16} /> }, { label: 'Account', path: '/account', icon: <UserIcon size={16} /> }] : []), ...(dbUser?.role === 'admin' ? [{ label: 'Admin Dashboard', path: '/admin', icon: <Package size={16} /> }] : [])].map(item => (
            <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0.875rem', borderRadius: 12, marginBottom: 2, textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, color: isActive(item.path) ? '#10b981' : 'var(--text-dim)', background: isActive(item.path) ? 'rgba(16,185,129,0.08)' : 'transparent', transition: 'background 0.15s, color 0.15s' }}>
              <span style={{ color: isActive(item.path) ? '#10b981' : 'var(--text-mute)' }}>{item.icon}</span>{item.label}
            </Link>
          ))}
        </div>

        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {user ? (
            <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              <LogOut size={14} /> Log Out
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login" onClick={() => setIsOpen(false)} className="btn-ghost" style={{ flex: 1, textDecoration: 'none', justifyContent: 'center' }}>Login</Link>
              <Link to="/register" onClick={() => setIsOpen(false)} className="btn-accent" style={{ flex: 1, textDecoration: 'none', justifyContent: 'center' }}>Register</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
