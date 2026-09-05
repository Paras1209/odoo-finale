// ===========================================
// DealFlow360 - Portal Account Page
// ===========================================
// Full account settings with profile and password management
// ===========================================

'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface AccountData {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  phone: string | null;
  address: string | null;
  tier: string;
  createdAt: string;
}

const tierColors: Record<string, string> = {
  GOLD: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  SILVER: 'bg-gray-100 text-gray-800 border-gray-200',
  BRONZE: 'bg-orange-100 text-orange-800 border-orange-200',
};

export default function PortalAccountPage() {
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    companyName: '',
    phone: '',
    address: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    fetchAccount();
  }, []);

  const fetchAccount = async () => {
    setLoading(true);
    setError(null);

    const res = await api.get<AccountData>('/portal/account');
    
    if (res.success && res.data) {
      setAccount(res.data);
      setProfileForm({
        name: res.data.name,
        companyName: res.data.companyName || '',
        phone: res.data.phone || '',
        address: res.data.address || '',
      });
    } else {
      setError(res.error?.message || 'Failed to load account');
    }
    
    setLoading(false);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);

    const res = await api.put<AccountData>('/portal/account', {
      name: profileForm.name,
      companyName: profileForm.companyName || null,
      phone: profileForm.phone || null,
      address: profileForm.address || null,
    });

    if (res.success && res.data) {
      setAccount(res.data);
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
    } else {
      setProfileMessage({ type: 'error', text: res.error?.message || 'Failed to update profile' });
    }

    setProfileSaving(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      setPasswordSaving(false);
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      setPasswordSaving(false);
      return;
    }

    const res = await api.post('/portal/account/password', {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword,
    });

    if (res.success) {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
    } else {
      setPasswordMessage({ type: 'error', text: res.error?.message || 'Failed to change password' });
    }

    setPasswordSaving(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
            <div className="space-y-3">
              <div className="h-10 bg-gray-100 rounded"></div>
              <div className="h-10 bg-gray-100 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={fetchAccount}
          className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!account) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h1>

      <div className="space-y-6">
        {/* Account Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Account Overview</h2>
              <p className="text-sm text-gray-500">Member since {formatDate(account.createdAt)}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${tierColors[account.tier] || tierColors.BRONZE}`}>
              {account.tier} Tier
            </span>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2 text-gray-900 font-medium">{account.email}</span>
              </div>
              <div>
                <span className="text-gray-500">Account ID:</span>
                <span className="ml-2 text-gray-900 font-mono text-xs">{account.id.slice(0, 8)}...</span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Your tier determines your discount eligibility. Contact sales to upgrade.
          </p>
        </div>

        {/* Company Information Form */}
        <form onSubmit={handleProfileSubmit} className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
            <p className="text-sm text-gray-500 mt-1">Update your company details and contact information</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={profileForm.companyName}
                  onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Company name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Billing Address
              </label>
              <textarea
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Street address, City, State, ZIP"
              />
            </div>

            {profileMessage && (
              <div className={`p-3 rounded-lg ${
                profileMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {profileMessage.text}
              </div>
            )}
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <button
              type="submit"
              disabled={profileSaving}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium"
            >
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Password Change Form */}
        <form onSubmit={handlePasswordSubmit} className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
            <p className="text-sm text-gray-500 mt-1">Update your portal login password</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter current password"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showPasswords"
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
                className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="showPasswords" className="ml-2 text-sm text-gray-600">
                Show passwords
              </label>
            </div>

            {passwordMessage && (
              <div className={`p-3 rounded-lg ${
                passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {passwordMessage.text}
              </div>
            )}
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <button
              type="submit"
              disabled={passwordSaving}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium"
            >
              {passwordSaving ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-2">Need Help?</h3>
          <p className="text-sm text-blue-700 mb-3">
            For account upgrades, billing inquiries, or other assistance, contact our support team.
          </p>
          <div className="flex gap-4 text-sm">
            <a 
              href="mailto:support@dealflow360.com"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              support@dealflow360.com
            </a>
            <span className="text-blue-400">|</span>
            <span className="text-blue-700">1-800-DEAL-360</span>
          </div>
        </div>
      </div>
    </div>
  );
}
