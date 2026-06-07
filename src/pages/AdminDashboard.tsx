/**
 * @license SPDX-License-Identifier: Apache-2.0
 * LUMEN AdminDashboard — editorial dark layout with glass stat cards
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Product, Package, StockItem, Order, StockRequest as StockReqType } from '../types';
import {
  Settings, Package as PackageIcon, Database, ListOrdered, CheckCircle,
  HelpCircle, Sparkles, Plus, Edit2, Trash2, Key, Info, RefreshCw, Save, X,
  BarChart3, ShoppingBag, Archive, AlertCircle, Layers
} from 'lucide-react';

type AdminTab = 'overview' | 'products' | 'packages' | 'stock' | 'orders' | 'requests' | 'branding';

const TABS: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
  { key: 'overview',  label: 'Overview',   icon: <BarChart3 size={15} /> },
  { key: 'products',  label: 'Products',   icon: <Layers size={15} /> },
  { key: 'packages',  label: 'Packages',   icon: <PackageIcon size={15} /> },
  { key: 'stock',     label: 'Stock',      icon: <Database size={15} /> },
  { key: 'orders',    label: 'Orders',     icon: <ShoppingBag size={15} /> },
  { key: 'requests',  label: 'Requests',   icon: <HelpCircle size={15} /> },
  { key: 'branding',  label: 'Branding',   icon: <Sparkles size={15} /> },
];

/* ── Reusable Modal wrapper ─────────────────────────────── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ margin: 0, fontSize: '0.925rem', fontWeight: 700, color: 'var(--text)' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '1.5rem' }}>{children}</div>
      </div>
    </div>
  );
}

/* ── Field helper ───────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      <label style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-mute)', fontFamily: 'var(--font-mono)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, dbUser, fetchSiteSettings } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (dbUser && dbUser.role !== 'admin') {
      showError('Unauthorized access. Only admins are allowed here!');
      navigate('/');
    }
  }, [dbUser, navigate, showError]);

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [stockItems, setStockItems] = useState<(StockItem & { packages?: { days: number; products?: { name: string } } })[]>([]);
  const [orders, setOrders] = useState<(Order & { users?: { email: string; display_name: string | null } })[]>([]);
  const [requests, setRequests] = useState<(StockReqType & { users?: { email: string; display_name: string | null } })[]>([]);

  const [brandName, setBrandName] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [brandColor, setBrandColor] = useState('#10b981');

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCategory, setProdCategory] = useState<'NON ROOT' | 'ROOT' | 'Game / Voucher' | 'Custom Bundle'>('NON ROOT');
  const [prodImg, setProdImg] = useState('');
  const [prodActive, setProdActive] = useState(true);
  const [prodSort, setProdSort] = useState(0);

  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [pkgProdId, setPkgProdId] = useState('');
  const [pkgDays, setPkgDays] = useState<1 | 3 | 7 | 15 | 30>(30);
  const [pkgPrice, setPkgPrice] = useState(0);
  const [pkgActive, setPkgActive] = useState(true);

  const [showStockModal, setShowStockModal] = useState(false);
  const [stockPkgId, setStockPkgId] = useState('');
  const [stockType, setStockType] = useState<'key' | 'credentials' | 'custom'>('key');
  const [stockKeyValue, setStockKeyValue] = useState('');
  const [stockUsername, setStockUsername] = useState('');
  const [stockPassword, setStockPassword] = useState('');
  const [bulkStockValues, setBulkStockValues] = useState('');
  const [isBulkInsert, setIsBulkInsert] = useState(false);

  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    async function loadAdminData() {
      if (!dbUser || dbUser.role !== 'admin') return;
      try {
        setLoading(true);
        const { data: pData, error: pErr } = await supabase.from('products').select('*').order('sort_order', { ascending: true });
        if (pErr) throw pErr;
        setProducts(pData || []);

        const { data: pkgData, error: pkgErr } = await supabase.from('packages').select('*');
        if (pkgErr) throw pkgErr;
        setPackages(pkgData || []);

        const { data: sSettings, error: sErr } = await supabase.from('site_settings').select('*');
        if (!sErr && sSettings && sSettings.length > 0) {
          const firstRow = sSettings[0];
          if ('site_name' in firstRow) {
            setBrandName(firstRow.site_name || 'Premium Store');
            setBrandLogo(firstRow.site_logo_url || '');
            setBrandColor(firstRow.primary_color || '#10b981');
          } else {
            sSettings.forEach((row: any) => {
              if (row.key === 'site_name') setBrandName(row.value);
              if (row.key === 'site_logo_url') setBrandLogo(row.value);
              if (row.key === 'primary_color') setBrandColor(row.value);
            });
          }
        }

        const { data: stData, error: stErr } = await supabase
          .from('stock_items').select(`*, packages:package_id (days, products:product_id (name))`).order('created_at', { ascending: false });
        if (stErr) throw stErr;
        setStockItems(stData || []);

        const { data: oData, error: oErr } = await supabase
          .from('orders').select(`id, user_id, source, package_id, bundle_id, amount_paid, status:stat, created_at, delivered_at, users:user_id (email, display_name)`).order('created_at', { ascending: false });
        if (oErr) throw oErr;
        setOrders(oData || []);

        const { data: rData, error: rErr } = await supabase
          .from('stock_requests').select(`*, users:user_id (email, display_name)`).order('created_at', { ascending: false });
        if (rErr) throw rErr;
        setRequests(rData || []);
      } catch (err: any) {
        showError('Failed to load admin dashboard resources!');
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, [dbUser, reloadCounter, showError]);

  const stats = useMemo(() => {
    const totalSales = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + Number(o.amount_paid), 0);
    return {
      totalSales,
      activeProducts: products.filter(p => p.is_active).length,
      pendingReqs: requests.filter(r => r.stat === 'pending').length,
      soldStockCount: stockItems.filter(s => s.is_sold).length,
      availableStockCount: stockItems.filter(s => !s.is_sold).length,
      totalOrders: orders.length,
    };
  }, [products, stockItems, orders, requests]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) { showError('Please provide a valid product name.'); return; }
    try {
      const payload = { name: prodName, description: prodDesc, category: prodCategory, image_url: prodImg, is_active: prodActive, sort_order: Number(prodSort) };
      if (editingProduct) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
        if (error) throw error;
        showSuccess('Product successfully updated!');
      } else {
        const { error } = await supabase.from('products').insert([payload]);
        if (error) throw error;
        showSuccess('Product successfully cataloged!');
      }
      setShowProductModal(false);
      setReloadCounter(p => p + 1);
    } catch (err: any) { showError(err.message || 'Save sequence failed.'); }
  };

  const handleToggleProductActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('products').update({ is_active: !currentStatus }).eq('id', id);
      if (error) throw error;
      showSuccess(`Product updated to ${!currentStatus ? 'Visible' : 'Hidden'}!`);
      setReloadCounter(p => p + 1);
    } catch (err: any) { showError(err.message || 'Failed to toggle product status.'); }
  };

  const handleTogglePackageActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('packages').update({ is_active: !currentStatus }).eq('id', id);
      if (error) throw error;
      showSuccess(`Package tier updated to ${!currentStatus ? 'Visible' : 'Hidden'}!`);
      setReloadCounter(p => p + 1);
    } catch (err: any) { showError(err.message || 'Failed to toggle package status.'); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product? All mapped packages will also be deleted!')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      showSuccess('Product successfully removed!');
      setReloadCounter(p => p + 1);
    } catch (err: any) { showError(err.message || 'Failed to delete resource.'); }
  };

  const handleEditProductClick = (prd: Product) => {
    setEditingProduct(prd); setProdName(prd.name); setProdDesc(prd.description || '');
    setProdCategory(prd.category); setProdImg(prd.image_url || ''); setProdActive(prd.is_active); setProdSort(prd.sort_order);
    setShowProductModal(true);
  };
  const handleAddProductClick = () => {
    setEditingProduct(null); setProdName(''); setProdDesc(''); setProdCategory('NON ROOT');
    setProdImg(''); setProdActive(true); setProdSort(0); setShowProductModal(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgProdId) { showError('Please select a product reference first.'); return; }
    if (pkgPrice < 0) { showError('Package price target must be non-negative value.'); return; }
    try {
      const payload = { product_id: pkgProdId, days: Number(pkgDays) as any, price: Number(pkgPrice), is_active: pkgActive };
      if (editingPackage) {
        const { error } = await supabase.from('packages').update(payload).eq('id', editingPackage.id);
        if (error) throw error;
        showSuccess('Package tier updated!');
      } else {
        const { error } = await supabase.from('packages').insert([payload]);
        if (error) throw error;
        showSuccess('Pricing package tier added!');
      }
      setShowPackageModal(false);
      setReloadCounter(p => p + 1);
    } catch (err: any) { showError(err.message || 'Failed to commit package!'); }
  };

  const handleEditPackageClick = (pkg: Package) => {
    setEditingPackage(pkg); setPkgProdId(pkg.product_id); setPkgDays(pkg.days);
    setPkgPrice(Number(pkg.price)); setPkgActive(pkg.is_active); setShowPackageModal(true);
  };
  const handleAddPackageClick = () => {
    setEditingPackage(null); setPkgProdId(products[0]?.id || ''); setPkgDays(30);
    setPkgPrice(0); setPkgActive(true); setShowPackageModal(true);
  };

  const handleDeletePackage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;
    try {
      const { error } = await supabase.from('packages').delete().eq('id', id);
      if (error) throw error;
      showSuccess('Package tier successfully deleted.');
      setReloadCounter(p => p + 1);
    } catch (err: any) { showError(err.message || 'Failed to delete resource.'); }
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockPkgId) { showError('Please map to an existing package association.'); return; }
    try {
      if (isBulkInsert) {
        if (!bulkStockValues.trim()) { showError('Stock payload cannot be blank!'); return; }
        const lines = bulkStockValues.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const inserts = lines.map(val => {
          if (stockType === 'key') return { package_id: stockPkgId, item_type: stockType, key_value: val, is_sold: false };
          const parts = val.split(/[:\s]+/);
          return { package_id: stockPkgId, item_type: stockType, username: parts[0] || 'User', password: parts[1] || 'Pass', is_sold: false };
        });
        const { error } = await supabase.from('stock_items').insert(inserts);
        if (error) throw error;
        showSuccess(`${lines.length} stock entries successfully cataloged!`);
      } else {
        if (stockType === 'key' && !stockKeyValue.trim()) { showError('Key content value is required!'); return; }
        if (stockType === 'credentials' && (!stockUsername.trim() || !stockPassword.trim())) { showError('Credentials username & password are required.'); return; }
        const payload = {
          package_id: stockPkgId, item_type: stockType,
          key_value: stockType === 'key' ? stockKeyValue : null,
          username: stockType === 'credentials' ? stockUsername : null,
          password: stockType === 'credentials' ? stockPassword : null,
          is_sold: false,
        };
        const { error } = await supabase.from('stock_items').insert([payload]);
        if (error) throw error;
        showSuccess('License stock inserted successfully.');
      }
      setShowStockModal(false);
      setStockKeyValue(''); setStockUsername(''); setStockPassword(''); setBulkStockValues('');
      setReloadCounter(p => p + 1);
    } catch (err: any) { showError(err.message || 'Failed to write stock entry.'); }
  };

  const handleDeleteStock = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this stock item?')) return;
    try {
      const { error } = await supabase.from('stock_items').delete().eq('id', id);
      if (error) throw error;
      showSuccess('Stock item deleted.');
      setReloadCounter(p => p + 1);
    } catch (err: any) { showError(err.message || 'Failed to delete resource.'); }
  };

  const handleCompleteRequest = async (id: string) => {
    try {
      const { error } = await supabase.from('stock_requests').update({ stat: 'done', updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      showSuccess('Restock request marked completed.');
      setReloadCounter(p => p + 1);
    } catch (err: any) { showError(err.message || 'Action failed.'); }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) { showError('Site branding name cannot be blank.'); return; }
    try {
      const { error: colError } = await supabase.from('site_settings').upsert({ id: 1, site_name: brandName, site_logo_url: brandLogo, primary_color: brandColor });
      if (colError) {
        console.warn('Column upsert failed, trying key-value rows:', colError.message);
        await supabase.from('site_settings').upsert([
          { key: 'site_name', value: brandName },
          { key: 'site_logo_url', value: brandLogo },
          { key: 'primary_color', value: brandColor },
        ], { onConflict: 'key' });
      }
      showSuccess('Branding parameters saved successfully!');
      await fetchSiteSettings();
      setReloadCounter(p => p + 1);
    } catch (err: any) { showError('Branding failed to commit: ' + err.message); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 0.875rem',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, color: 'var(--text)',
    fontFamily: 'var(--font-sans)', fontSize: '0.875rem',
    outline: 'none',
  };
  const selectStyle: React.CSSProperties = { ...inputStyle };
  const taStyle: React.CSSProperties = { ...inputStyle, resize: 'vertical', minHeight: 80 };

  if (loading) {
    return (
      <div className="page-enter" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={28} color="#10b981" style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-mute)' }}>
            Loading admin panel…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '5.5rem 1.25rem 2rem' }}>

        {/* ── Admin Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Settings size={20} color="#10b981" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>Admin Dashboard</h1>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-mute)' }}>Panel Bazaar BD · Administrative Control Center</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* ── Sidebar ── */}
          <div style={{
            width: 220, flexShrink: 0,
            background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 18, padding: '0.75rem',
            display: 'flex', flexDirection: 'column', gap: '0.25rem',
          }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-faint)', padding: '0.5rem 0.75rem 0.5rem', fontFamily: 'var(--font-mono)' }}>
              Navigation
            </div>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* ── Main Content ── */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: '1rem' }}>
                  {[
                    { label: 'Total Revenue', value: `৳${stats.totalSales.toLocaleString()}`, accent: '#10b981' },
                    { label: 'Active Products', value: stats.activeProducts, accent: '#818cf8' },
                    { label: 'Total Orders', value: stats.totalOrders, accent: '#fbbf24' },
                    { label: 'Available Stock', value: stats.availableStockCount, accent: '#10b981' },
                    { label: 'Sold Stock', value: stats.soldStockCount, accent: '#f87171' },
                    { label: 'Pending Requests', value: stats.pendingReqs, accent: '#fbbf24' },
                  ].map(({ label, value, accent }) => (
                    <div key={label} className="stat-card" style={{ borderTopColor: accent }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-mute)', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
                        {label}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color: accent }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent orders preview */}
                <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18 }}>
                  <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text)' }}>
                    Recent Orders
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="lumen-table">
                      <thead>
                        <tr><th>Order ID</th><th>User</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 10).map(o => (
                          <tr key={o.id}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>#{o.id.slice(-6).toUpperCase()}</td>
                            <td style={{ fontSize: '0.75rem' }}>{(o as any).users?.email || '—'}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#10b981' }}>৳{Number(o.amount_paid).toLocaleString()}</td>
                            <td>
                              <span className={`badge ${o.status === 'completed' ? 'badge-green' : o.status === 'pending' ? 'badge-yellow' : 'badge-dim'}`}>
                                {o.status}
                              </span>
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-faint)' }}>
                              {new Date(o.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* PRODUCTS */}
            {activeTab === 'products' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>Products ({products.length})</h2>
                  <button onClick={handleAddProductClick} className="btn-accent" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
                    <Plus size={14} /> Add Product
                  </button>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, overflowX: 'auto' }}>
                  <table className="lumen-table">
                    <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Sort</th><th>Active</th><th>Actions</th></tr></thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id}>
                          <td>
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.name} style={{ width: 40, height: 28, borderRadius: 6, objectFit: 'cover' }} referrerPolicy="no-referrer" />
                            ) : (
                              <div style={{ width: 40, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.04)' }} />
                            )}
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.8rem', maxWidth: 200 }}>{p.name}</td>
                          <td><span className="badge badge-dim">{p.category}</span></td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{p.sort_order}</td>
                          <td>
                            <button
                              onClick={() => handleToggleProductActive(p.id, p.is_active)}
                              className={`badge ${p.is_active ? 'badge-green' : 'badge-dim'}`}
                              style={{ cursor: 'pointer', border: 'none' }}
                            >
                              {p.is_active ? 'Active' : 'Hidden'}
                            </button>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button onClick={() => handleEditProductClick(p)} style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-mute)' }}>
                                <Edit2 size={12} />
                              </button>
                              <button onClick={() => handleDeleteProduct(p.id)} style={{ width: 28, height: 28, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#f87171' }}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PACKAGES */}
            {activeTab === 'packages' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>Packages ({packages.length})</h2>
                  <button onClick={handleAddPackageClick} className="btn-accent" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
                    <Plus size={14} /> Add Package
                  </button>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, overflowX: 'auto' }}>
                  <table className="lumen-table">
                    <thead><tr><th>Product</th><th>Days</th><th>Price</th><th>Active</th><th>Actions</th></tr></thead>
                    <tbody>
                      {packages.map(pkg => {
                        const prod = products.find(p => p.id === pkg.product_id);
                        return (
                          <tr key={pkg.id}>
                            <td style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.8rem' }}>{prod?.name || '—'}</td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{pkg.days}d</td>
                            <td style={{ fontFamily: 'var(--font-mono)', color: '#10b981' }}>৳{Number(pkg.price).toLocaleString()}</td>
                            <td>
                              <button
                                onClick={() => handleTogglePackageActive(pkg.id, pkg.is_active)}
                                className={`badge ${pkg.is_active ? 'badge-green' : 'badge-dim'}`}
                                style={{ cursor: 'pointer', border: 'none' }}
                              >
                                {pkg.is_active ? 'Active' : 'Hidden'}
                              </button>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button onClick={() => handleEditPackageClick(pkg)} style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-mute)' }}>
                                  <Edit2 size={12} />
                                </button>
                                <button onClick={() => handleDeletePackage(pkg.id)} style={{ width: 28, height: 28, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#f87171' }}>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* STOCK */}
            {activeTab === 'stock' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                    Stock Items
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-mute)', marginLeft: '0.5rem' }}>
                      {stats.availableStockCount} available / {stats.soldStockCount} sold
                    </span>
                  </h2>
                  <button
                    onClick={() => { setStockPkgId(packages[0]?.id || ''); setStockType('key'); setStockKeyValue(''); setStockUsername(''); setStockPassword(''); setBulkStockValues(''); setIsBulkInsert(false); setShowStockModal(true); }}
                    className="btn-accent" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
                  >
                    <Plus size={14} /> Add Stock
                  </button>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, overflowX: 'auto' }}>
                  <table className="lumen-table">
                    <thead><tr><th>Product</th><th>Days</th><th>Type</th><th>Value</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {stockItems.slice(0, 100).map(s => {
                        const pkg = s.packages as any;
                        return (
                          <tr key={s.id}>
                            <td style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)' }}>{pkg?.products?.name || '—'}</td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{pkg?.days || '—'}d</td>
                            <td><span className="badge badge-dim">{s.item_type}</span></td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {s.item_type === 'key' ? s.key_value : s.username ? `${s.username} / ${s.password}` : s.key_value}
                            </td>
                            <td>
                              <span className={`badge ${s.is_sold ? 'badge-red' : 'badge-green'}`}>
                                {s.is_sold ? 'Sold' : 'Available'}
                              </span>
                            </td>
                            <td>
                              {!s.is_sold && (
                                <button onClick={() => handleDeleteStock(s.id)} style={{ width: 28, height: 28, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#f87171' }}>
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ORDERS */}
            {activeTab === 'orders' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>Orders ({orders.length})</h2>
                <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, overflowX: 'auto' }}>
                  <table className="lumen-table">
                    <thead><tr><th>ID</th><th>User</th><th>Source</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>#{o.id.slice(-6).toUpperCase()}</td>
                          <td style={{ fontSize: '0.75rem' }}>{(o as any).users?.email || o.user_id.slice(0, 8)}</td>
                          <td><span className="badge badge-dim">{o.source}</span></td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: '#10b981' }}>৳{Number(o.amount_paid).toLocaleString()}</td>
                          <td>
                            <span className={`badge ${o.status === 'completed' ? 'badge-green' : o.status === 'pending' ? 'badge-yellow' : 'badge-dim'}`}>
                              {o.status}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-faint)' }}>
                            {new Date(o.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REQUESTS */}
            {activeTab === 'requests' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                  Stock Requests
                  {stats.pendingReqs > 0 && <span className="badge badge-yellow" style={{ marginLeft: '0.5rem' }}>{stats.pendingReqs} pending</span>}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {requests.map(req => (
                    <div key={req.id} style={{
                      background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 16, padding: '1rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                          <span className={`badge ${req.stat === 'done' ? 'badge-green' : 'badge-yellow'}`}>
                            {req.stat === 'done' ? 'Done' : 'Pending'}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-faint)' }}>
                            {(req as any).users?.email || '—'}
                          </span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)' }}>{req.product_name}</div>
                        {req.note && <div style={{ fontSize: '0.72rem', color: 'var(--text-mute)', marginTop: 2 }}>{req.note}</div>}
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-faint)', marginTop: 4 }}>
                          {new Date(req.created_at).toLocaleString()}
                        </div>
                      </div>
                      {req.stat === 'pending' && (
                        <button onClick={() => handleCompleteRequest(req.id)} className="btn-accent" style={{ fontSize: '0.72rem', padding: '0.45rem 0.875rem' }}>
                          <CheckCircle size={13} /> Mark Done
                        </button>
                      )}
                    </div>
                  ))}
                  {requests.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-mute)', fontSize: '0.8rem' }}>
                      No stock requests yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BRANDING */}
            {activeTab === 'branding' && (
              <div style={{ maxWidth: 520 }}>
                <h2 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>Site Branding</h2>
                <form onSubmit={handleSaveBranding} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <Field label="Site Name">
                    <input style={inputStyle} type="text" value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="Panel Bazaar BD" />
                  </Field>
                  <Field label="Logo URL">
                    <input style={inputStyle} type="url" value={brandLogo} onChange={e => setBrandLogo(e.target.value)} placeholder="https://..." />
                  </Field>
                  <Field label="Primary Color">
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <input style={{ ...inputStyle, flex: 1 }} type="text" value={brandColor} onChange={e => setBrandColor(e.target.value)} placeholder="#10b981" />
                      <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} style={{ width: 44, height: 44, borderRadius: 10, border: 'none', cursor: 'pointer', padding: 2, background: 'rgba(255,255,255,0.05)' }} />
                    </div>
                  </Field>
                  <button type="submit" className="btn-accent" style={{ width: '100%' }}>
                    <Save size={15} /> Save Branding
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Product Modal ── */}
      {showProductModal && (
        <Modal title={editingProduct ? 'Edit Product' : 'Add Product'} onClose={() => setShowProductModal(false)}>
          <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Field label="Product Name">
              <input style={inputStyle} type="text" value={prodName} onChange={e => setProdName(e.target.value)} placeholder="e.g. Netflix Premium" required />
            </Field>
            <Field label="Description">
              <textarea style={taStyle} value={prodDesc} onChange={e => setProdDesc(e.target.value)} placeholder="Product description..." />
            </Field>
            <Field label="Category">
              <select style={selectStyle} value={prodCategory} onChange={e => setProdCategory(e.target.value as any)}>
                {['NON ROOT','ROOT','Game / Voucher','Custom Bundle'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Image URL">
              <input style={inputStyle} type="url" value={prodImg} onChange={e => setProdImg(e.target.value)} placeholder="https://..." />
            </Field>
            <Field label="Sort Order">
              <input style={inputStyle} type="number" value={prodSort} onChange={e => setProdSort(Number(e.target.value))} />
            </Field>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <input type="checkbox" checked={prodActive} onChange={e => setProdActive(e.target.checked)} id="prodActive" style={{ width: 16, height: 16, accentColor: '#10b981' }} />
              <label htmlFor="prodActive" style={{ fontSize: '0.8rem', color: 'var(--text-dim)', cursor: 'pointer' }}>Active (visible to customers)</label>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button type="button" onClick={() => setShowProductModal(false)} className="btn-ghost" style={{ flex: 1, fontSize: '0.8rem' }}>Cancel</button>
              <button type="submit" className="btn-accent" style={{ flex: 1, fontSize: '0.8rem' }}>
                <Save size={14} /> {editingProduct ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Package Modal ── */}
      {showPackageModal && (
        <Modal title={editingPackage ? 'Edit Package' : 'Add Package'} onClose={() => setShowPackageModal(false)}>
          <form onSubmit={handleSavePackage} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Field label="Product">
              <select style={selectStyle} value={pkgProdId} onChange={e => setPkgProdId(e.target.value)}>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Duration (days)">
              <select style={selectStyle} value={pkgDays} onChange={e => setPkgDays(Number(e.target.value) as any)}>
                {[1,3,7,15,30].map(d => <option key={d} value={d}>{d} days</option>)}
              </select>
            </Field>
            <Field label="Price (৳)">
              <input style={inputStyle} type="number" min={0} value={pkgPrice} onChange={e => setPkgPrice(Number(e.target.value))} />
            </Field>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <input type="checkbox" checked={pkgActive} onChange={e => setPkgActive(e.target.checked)} id="pkgActive" style={{ width: 16, height: 16, accentColor: '#10b981' }} />
              <label htmlFor="pkgActive" style={{ fontSize: '0.8rem', color: 'var(--text-dim)', cursor: 'pointer' }}>Active</label>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button type="button" onClick={() => setShowPackageModal(false)} className="btn-ghost" style={{ flex: 1, fontSize: '0.8rem' }}>Cancel</button>
              <button type="submit" className="btn-accent" style={{ flex: 1, fontSize: '0.8rem' }}>
                <Save size={14} /> {editingPackage ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Stock Modal ── */}
      {showStockModal && (
        <Modal title="Add Stock" onClose={() => setShowStockModal(false)}>
          <form onSubmit={handleSaveStock} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Field label="Package">
              <select style={selectStyle} value={stockPkgId} onChange={e => setStockPkgId(e.target.value)}>
                {packages.map(pkg => {
                  const prod = products.find(p => p.id === pkg.product_id);
                  return <option key={pkg.id} value={pkg.id}>{prod?.name} — {pkg.days}d — ৳{pkg.price}</option>;
                })}
              </select>
            </Field>
            <Field label="Type">
              <select style={selectStyle} value={stockType} onChange={e => setStockType(e.target.value as any)}>
                <option value="key">License Key</option>
                <option value="credentials">Credentials (user/pass)</option>
                <option value="custom">Custom</option>
              </select>
            </Field>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <input type="checkbox" checked={isBulkInsert} onChange={e => setIsBulkInsert(e.target.checked)} id="bulkMode" style={{ width: 16, height: 16, accentColor: '#10b981' }} />
              <label htmlFor="bulkMode" style={{ fontSize: '0.8rem', color: 'var(--text-dim)', cursor: 'pointer' }}>Bulk insert (one per line)</label>
            </div>

            {isBulkInsert ? (
              <Field label="Values (one per line)">
                <textarea style={taStyle} value={bulkStockValues} onChange={e => setBulkStockValues(e.target.value)} placeholder="KEY1&#10;KEY2&#10;KEY3" rows={6} />
              </Field>
            ) : stockType === 'key' || stockType === 'custom' ? (
              <Field label="Key Value">
                <input style={inputStyle} type="text" value={stockKeyValue} onChange={e => setStockKeyValue(e.target.value)} placeholder="XXXX-XXXX-XXXX" />
              </Field>
            ) : (
              <>
                <Field label="Username">
                  <input style={inputStyle} type="text" value={stockUsername} onChange={e => setStockUsername(e.target.value)} placeholder="username" />
                </Field>
                <Field label="Password">
                  <input style={inputStyle} type="text" value={stockPassword} onChange={e => setStockPassword(e.target.value)} placeholder="password" />
                </Field>
              </>
            )}

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button type="button" onClick={() => setShowStockModal(false)} className="btn-ghost" style={{ flex: 1, fontSize: '0.8rem' }}>Cancel</button>
              <button type="submit" className="btn-accent" style={{ flex: 1, fontSize: '0.8rem' }}>
                <Plus size={14} /> Add Stock
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
