/**
 * LUMEN Bottom Navigation — mobile only, glass surface
 */
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, CreditCard, ClipboardList, Key, UserCircle } from 'lucide-react';

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return null;

  const tabs = [
    { label: 'Home',      path: '/',          icon: Home },
    { label: 'Add Funds', path: '/add-fund',  icon: CreditCard },
    { label: 'Orders',    path: '/orders',    icon: ClipboardList },
    { label: 'My Keys',   path: '/codes',     icon: Key },
    { label: 'Account',   path: '/account',   icon: UserCircle },
  ];

  return (
    <div className="bottom-nav md:hidden">
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'stretch', height: 60 }}>
        {tabs.map(({ label, path, icon: Icon }) => {
          const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
          return (
            <NavLink key={path} to={path} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3,
              textDecoration: 'none',
              color: active ? '#10b981' : 'var(--text-faint)',
              position: 'relative', transition: 'color 0.2s',
            }}>
              {active && (
                <div style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: 32, height: 2, background: '#10b981', borderRadius: '0 0 4px 4px',
                  boxShadow: '0 0 12px rgba(16,185,129,0.6)',
                }} />
              )}
              <div style={{ transform: active ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}>
                <Icon size={20} strokeWidth={active ? 2.2 : 1.7} />
              </div>
              <span style={{ fontSize: '0.6rem', fontWeight: active ? 700 : 500, letterSpacing: '0.01em', lineHeight: 1 }}>{label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
