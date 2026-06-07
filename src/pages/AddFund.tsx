/**
 * @license SPDX-License-Identifier: Apache-2.0
 * LUMEN AddFund — glass topup page with preset amounts
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { Coins, CreditCard, ChevronRight, Loader2, Info, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function AddFund() {
  const { user, balance } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [amount, setAmount] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);

  const presets = [50, 100, 200, 500, 1000];

  const handleSelectPreset = (value: number) => {
    setAmount(value);
  };

  const handleProceedPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount < 10) {
      showError('Minimum recharge amount is ৳10!');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your session has expired. Please log in again.');

      const accessToken = session.access_token;
      const endpoint = 'https://wwtsltimoaqgmbvsfbfv.supabase.co/functions/v1/create-topup-session';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ amount: Number(amount) }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || errJson.error || `Server response failed (${response.status})`);
      }

      const data = await response.json();
      if (data && data.checkout_url) {
        showSuccess('Redirecting to payment gateway...');
        window.location.href = data.checkout_url;
      } else {
        throw new Error('Checkout URL not received from server!');
      }
    } catch (err: any) {
      console.error('Edge topup-session failure:', err);
      showError(err.message || 'Failed to construct payment session!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter" style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
      {/* Top hero glow */}
      <div style={{
        position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
        width: '60vmax', height: '20vmax',
        background: 'radial-gradient(ellipse, rgba(16,185,129,0.07) 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '5.5rem 1.25rem 2rem', position: 'relative' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18,
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.25)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(16,185,129,0.15)',
            marginBottom: '1rem',
          }}>
            <Coins size={26} color="#10b981" strokeWidth={1.6} />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em',
            color: 'var(--text)', margin: 0,
          }}>
            Add Funds
          </h1>
          <p style={{ color: 'var(--text-mute)', fontSize: '0.8rem', marginTop: '0.4rem' }}>
            Instantly top up via bKash, Nagad, and Rocket payments.
          </p>
        </div>

        {/* Balance widget */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.03) 100%)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 20,
          padding: '1.5rem',
          textAlign: 'center',
          marginBottom: '1.5rem',
          boxShadow: '0 0 40px -10px rgba(16,185,129,0.1)',
        }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>
            Current Wallet Balance
          </div>
          <div className="balance-glow">
            ৳{(balance || 0).toLocaleString()}
          </div>
        </div>

        {/* Amount form */}
        <form onSubmit={handleProceedPayment}>
          <div className="glass-card--static" style={{ padding: '1.5rem' }}>

            {/* Preset grid */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                Quick Select
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                {presets.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`preset-btn ${amount === preset ? 'active' : ''}`}
                  >
                    ৳{preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount input */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                Custom Amount
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '1rem', fontWeight: 700, color: '#10b981',
                  fontFamily: 'var(--font-mono)',
                }}>৳</span>
                <input
                  type="number"
                  min={10}
                  value={amount}
                  onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Enter amount (min ৳10)"
                  className="lumen-input-plain"
                  style={{ paddingLeft: '2rem' }}
                />
              </div>
            </div>

            {/* Info note */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
              padding: '0.75rem 1rem',
              background: 'rgba(99,102,241,0.07)',
              border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: 12,
              marginBottom: '1.25rem',
            }}>
              <Info size={14} style={{ color: '#818cf8', flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-mute)', lineHeight: 1.5 }}>
                After payment, your balance updates automatically. Contact support if balance doesn't reflect within 5 minutes.
              </span>
            </div>

            {/* Proceed button */}
            <button
              type="submit"
              disabled={loading || !amount || Number(amount) < 10}
              className="btn-accent"
              style={{
                width: '100%',
                opacity: (loading || !amount || Number(amount) < 10) ? 0.5 : 1,
                fontSize: '0.875rem',
              }}
            >
              {loading ? (
                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
              ) : (
                <>Proceed to Payment <ChevronRight size={16} /></>
              )}
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </button>
          </div>
        </form>

        {/* Security note */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
          marginTop: '1.25rem',
          fontSize: '0.7rem', color: 'var(--text-faint)',
        }}>
          <ShieldAlert size={12} color="var(--text-faint)" />
          Secured payment · Panel Bazaar BD
        </div>
      </div>
    </div>
  );
}
