import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usersService } from '../services/users.service';
import api from '../services/api';
import { FiUser, FiMail, FiLock, FiSave, FiLoader, FiCheck } from 'react-icons/fi';

export default function Profile() {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const updatedUser = await usersService.updateProfile(user.id, {
        name: profileData.name,
        email: profileData.email,
      });

      // Update auth context with new user data
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUserData = { ...storedUser, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      
      // Reload page to update auth context
      window.location.reload();
      
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      await usersService.updatePassword(
        user.id,
        passwordData.currentPassword,
        passwordData.newPassword
      );

      setSuccess('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <FiLoader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card-modern rounded-xl p-4">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
          My Profile
        </h1>
        <p className="text-gray-600 text-sm mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="card-modern rounded-xl p-3 bg-green-50 border-l-2 border-green-400">
          <div className="flex items-center gap-2">
            <FiCheck className="w-4 h-4 text-green-600" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}
      {error && (
        <div className="card-modern rounded-xl p-3 bg-red-50 border-l-2 border-red-400">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="card-modern rounded-xl p-4">
        <div className="flex gap-2 border-b border-gray-200 mb-4">
          <button
            onClick={() => {
              setActiveTab('profile');
              setError('');
              setSuccess('');
            }}
            className={`px-4 py-2 text-sm font-medium transition-smooth ${
              activeTab === 'profile'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => {
              setActiveTab('password');
              setError('');
              setSuccess('');
            }}
            className={`px-4 py-2 text-sm font-medium transition-smooth ${
              activeTab === 'password'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Change Password
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  <FiUser className="w-3 h-3 inline mr-1" />
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-smooth bg-white"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  <FiMail className="w-3 h-3 inline mr-1" />
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-smooth bg-white"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-2">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-semibold text-gray-700 mb-1">Role</p>
                <p className="text-sm text-gray-600 capitalize">
                  {user.role?.replace('_', ' ')}
                </p>
              </div>
            </div>

            {user.schoolId && (
              <div className="pt-2">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-700 mb-1">School ID</p>
                  <p className="text-sm text-gray-600">{user.schoolId}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
              >
                {saving ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                <FiLock className="w-3 h-3 inline mr-1" />
                Current Password *
              </label>
              <input
                type="password"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-smooth bg-white"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                <FiLock className="w-3 h-3 inline mr-1" />
                New Password *
              </label>
              <input
                type="password"
                required
                minLength={8}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-smooth bg-white"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
              />
              <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                <FiLock className="w-3 h-3 inline mr-1" />
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                minLength={8}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-smooth bg-white"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
              >
                {saving ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <FiLock className="w-4 h-4" />
                    Update Password
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

