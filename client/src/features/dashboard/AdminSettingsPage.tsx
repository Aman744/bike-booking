import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShieldCheck, User, Key, Users, UserPlus, Trash2, Edit2, Loader2, RefreshCw, Store, Check, ChevronDown } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useSettings from '../../hooks/useSettings';
import api from '../../services/api';
import { IAdmin, ISettings } from 'shared';

export const AdminSettingsPage = () => {
  const { admin } = useAuth();
  const { settings, updateSettings, isUpdating } = useSettings();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'staff' | 'dealership'>('profile');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Partial<IAdmin> | null>(null);
  const [isColorSystemOpen, setIsColorSystemOpen] = useState(false);

  const hasSettingsPermission = admin?.permissions.includes('settings.read') || admin?.permissions.includes('settings.update') || admin?.role === 'SuperAdmin';
  const hasStaffPermission = admin?.permissions.includes('settings.read') || admin?.permissions.includes('settings.update') || admin?.role === 'SuperAdmin';

  // React Query to fetch all staff users
  const { data: staffData, isLoading: isStaffLoading, refetch: refetchStaff } = useQuery({
    queryKey: ['staffList'],
    queryFn: async () => {
      const { data } = await api.get('/auth/users');
      return data.data.admins as IAdmin[];
    },
    enabled: hasStaffPermission && activeTab === 'staff',
  });

  // Password Update Form Setup
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Dealership Settings Form Setup
  const {
    register: registerDealership,
    handleSubmit: handleSubmitDealership,
    reset: resetDealershipForm,
    setValue,
    watch,
  } = useForm<ISettings>();

  const dealershipLogoValue = watch('dealershipLogo');
  const dealershipFaviconValue = watch('dealershipFavicon');
  const colorSystemValue = watch('colorSystem') || 'blue';
  const isImageUrl = (val?: string) => val && (val.startsWith('http') || val.startsWith('data:image/'));

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
       if (file.size > 2 * 1024 * 1024) {
         toast.error('Logo image must be smaller than 2MB');
         return;
       }
       const reader = new FileReader();
       reader.onloadend = () => {
         const base64String = reader.result as string;
         setValue('dealershipLogo', base64String);
         toast.success('Logo file loaded! Click "Save Configurations" to apply changes.');
       };
       reader.readAsDataURL(file);
     }
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
       if (file.size > 1 * 1024 * 1024) {
         toast.error('Favicon must be smaller than 1MB');
         return;
       }
       const reader = new FileReader();
       reader.onloadend = () => {
         const base64String = reader.result as string;
         setValue('dealershipFavicon', base64String);
         toast.success('Favicon file loaded! Click "Save Configurations" to apply changes.');
       };
       reader.readAsDataURL(file);
     }
  };

  // Reset dealership form with fetched settings data
  useEffect(() => {
    if (settings) {
      resetDealershipForm(settings);
    }
  }, [settings, resetDealershipForm]);

  // Password update mutation
  const passwordMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.put('/auth/password', payload);
      return data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Password changed successfully');
      resetPasswordForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Password update failed');
    },
  });

  // Staff creation mutation
  const createStaffMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/auth/register', payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Staff account created successfully!');
      setIsAddModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create account');
    },
  });

  // Staff role update mutation
  const updateStaffMutation = useMutation({
    mutationFn: async (payload: { id: string; role: string }) => {
      const { data } = await api.put(`/auth/users/${payload.id}`, { role: payload.role });
      return data;
    },
    onSuccess: () => {
      toast.success('Staff account updated successfully!');
      setIsEditModalOpen(false);
      setSelectedStaff(null);
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Update failed');
    },
  });

  // Staff deletion mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/auth/users/${id}`);
      return data;
    },
    onSuccess: () => {
      toast.success('Staff account deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    },
  });

  const onPasswordSubmit = (data: any) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    passwordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  const onDealershipSubmit = (data: ISettings) => {
    updateSettings(data);
  };

  const handleCreateStaff = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createStaffMutation.mutate({
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role'),
    });
  };

  const handleUpdateStaff = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedStaff?._id) return;
    const formData = new FormData(e.currentTarget);
    updateStaffMutation.mutate({
      id: selectedStaff._id,
      role: formData.get('role') as string,
    });
  };

  const handleDeleteStaff = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete admin account for ${name}?`)) {
      deleteStaffMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-8">
      {/* Tabs Header */}
      <div className="flex flex-wrap border-b border-white/5 pb-1 gap-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 font-display font-bold text-sm transition-all relative flex items-center gap-2 ${
            activeTab === 'profile' ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <User className="w-4 h-4" />
          <span>My Profile & Security</span>
          {activeTab === 'profile' && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500"></span>}
        </button>

        {hasSettingsPermission && (
          <button
            onClick={() => setActiveTab('dealership')}
            className={`pb-3 font-display font-bold text-sm transition-all relative flex items-center gap-2 ${
              activeTab === 'dealership' ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Dealership Settings</span>
            {activeTab === 'dealership' && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500"></span>}
          </button>
        )}

        {hasStaffPermission && (
          <button
            onClick={() => setActiveTab('staff')}
            className={`pb-3 font-display font-bold text-sm transition-all relative flex items-center gap-2 ${
              activeTab === 'staff' ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff Management</span>
            {activeTab === 'staff' && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500"></span>}
          </button>
        )}
      </div>

      {/* Tab 1: Profile & Security */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Admin User Info Details Card */}
          <div className="glass-card p-8 rounded-2xl border border-white/5 shadow-xl space-y-6">
            <h3 className="font-display font-bold text-base text-slate-200">Account Credentials</h3>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">User Name</span>
                <span className="text-sm font-medium text-slate-200">{admin?.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Work Email</span>
                <span className="text-sm font-medium text-slate-200">{admin?.email}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Role Level</span>
                <span className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {admin?.role}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-semibold mb-2">Granted Permissions</span>
                <div className="flex flex-wrap gap-1.5">
                  {admin?.permissions.map((perm) => (
                    <span key={perm} className="text-[9px] font-mono bg-slate-800 border border-white/5 text-slate-400 px-2 py-0.5 rounded-md">
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Form Card */}
          <div className="glass-card p-8 rounded-2xl border border-white/5 shadow-xl lg:col-span-2">
            <h3 className="font-display font-bold text-base text-slate-200 mb-6">Modify Access Credentials</h3>
            <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Current Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    {...registerPassword('currentPassword', { required: 'Current password is required' })}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-xs text-red-500 mt-1">{passwordErrors.currentPassword.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">New Password</label>
                  <input
                    type="password"
                    placeholder="Minimum 6 characters"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    {...registerPassword('newPassword', {
                      required: 'New password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' },
                    })}
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-xs text-red-500 mt-1">{passwordErrors.newPassword.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    {...registerPassword('confirmPassword', { required: 'Please confirm your new password' })}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">{passwordErrors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white text-xs font-semibold py-3 px-6 rounded-xl flex items-center gap-2"
                disabled={passwordMutation.isPending}
              >
                {passwordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                <span>Update Security Password</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Dealership Settings */}
      {activeTab === 'dealership' && hasSettingsPermission && (
        <div className="glass-card p-8 rounded-2xl border border-white/5 shadow-xl">
          <div className="mb-6">
            <h3 className="font-display font-bold text-base text-slate-200">Dealership & Brand Customization</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Customize shop names, logo texts, contact details, and scheduling constraints</p>
          </div>

          <form onSubmit={handleSubmitDealership(onDealershipSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shop Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Shop / Dealership Name</label>
                <input
                  type="text"
                  placeholder="e.g. VARNA MOTORS"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  {...registerDealership('dealershipName', { required: true })}
                />
              </div>

              {/* Logo Text or Image URL / Upload */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-400 block">Sidebar Logo (Text, URL, or File Upload)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Option A: Text or Image URL</span>
                    <input
                      type="text"
                      placeholder="e.g. Varna Motors or https://logo-url..."
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      {...registerDealership('dealershipLogo')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Option B: Upload File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 file:mr-4 file:py-1.5 file:px-3.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-blue-600/10 file:text-blue-400 hover:file:bg-blue-600/20 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Logo Preview */}
                {dealershipLogoValue && (
                  <div className="mt-3 p-3 bg-slate-900/40 border border-white/5 rounded-xl flex items-center gap-4">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Active Logo Preview:</span>
                    {isImageUrl(dealershipLogoValue) ? (
                      <img src={dealershipLogoValue} alt="Preview Logo" className="h-8 object-contain max-w-[200px]" />
                    ) : (
                      <span className="text-sm font-extrabold text-blue-400 tracking-wider font-display uppercase">{dealershipLogoValue}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Favicon URL or Upload */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-400 block">Favicon (URL or File Upload)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Option A: Image URL</span>
                    <input
                      type="text"
                      placeholder="e.g. https://domain.com/favicon.png"
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      {...registerDealership('dealershipFavicon')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Option B: Upload File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFaviconUpload}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 file:mr-4 file:py-1.5 file:px-3.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-blue-600/10 file:text-blue-400 hover:file:bg-blue-600/20 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Favicon Preview */}
                {dealershipFaviconValue && (
                  <div className="mt-3 p-3 bg-slate-900/40 border border-white/5 rounded-xl flex items-center gap-4">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Active Favicon Preview:</span>
                    {isImageUrl(dealershipFaviconValue) ? (
                      <img src={dealershipFaviconValue} alt="Preview Favicon" className="w-8 h-8 object-contain rounded-md" />
                    ) : (
                      <span className="text-xs text-slate-400">Favicon value: {dealershipFaviconValue}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Support Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Support Phone Contact</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  {...registerDealership('dealershipPhone')}
                />
              </div>

              {/* Support Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Support Email Address</label>
                <input
                  type="email"
                  placeholder="support@varnamotors.com"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  {...registerDealership('dealershipEmail')}
                />
              </div>

              {/* Default Pricing configurations */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Default Per Day Rent (₹)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="500"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    {...registerDealership('defaultPerDayRent', { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Default Security Deposit (₹)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="1000"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    {...registerDealership('defaultSecurityDeposit', { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Dealership Physical Location Address</label>
              <textarea
                rows={2}
                placeholder="123 Dealership Road, Bangalore"
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                {...registerDealership('dealershipAddress')}
              />
            </div>

            {/* Color System Theme Customization */}
            <div className="border-t border-white/5 pt-6">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Color System Theme Accent</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5 relative">
                  <label className="text-xs font-semibold text-slate-400">Primary Color Theme</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsColorSystemOpen(!isColorSystemOpen)}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-3.5 h-3.5 rounded-full ${
                          colorSystemValue === 'blue' ? 'bg-blue-500' :
                          colorSystemValue === 'purple' ? 'bg-purple-500' :
                          colorSystemValue === 'green' ? 'bg-emerald-500' :
                          colorSystemValue === 'amber' ? 'bg-amber-500' :
                          colorSystemValue === 'rose' ? 'bg-rose-500' :
                          'bg-teal-500'
                        }`} />
                        <span>
                          {colorSystemValue === 'blue' ? 'Blue Accent (Default Slate)' :
                           colorSystemValue === 'purple' ? 'Purple Accent (Royal Violet)' :
                           colorSystemValue === 'green' ? 'Green Accent (Fresh Emerald)' :
                           colorSystemValue === 'amber' ? 'Amber Accent (Warm Gold)' :
                           colorSystemValue === 'rose' ? 'Rose Accent (Crimson Red)' :
                           'Teal Accent (Modern Cyan)'}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>

                    {isColorSystemOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsColorSystemOpen(false)} 
                        />
                        <div className="absolute left-0 right-0 mt-2 z-50 glass-panel border border-white/10 rounded-xl shadow-2xl p-1.5 max-h-60 overflow-y-auto">
                          {[
                            { value: 'blue', label: 'Blue Accent (Default Slate)' },
                            { value: 'purple', label: 'Purple Accent (Royal Violet)' },
                            { value: 'green', label: 'Green Accent (Fresh Emerald)' },
                            { value: 'amber', label: 'Amber Accent (Warm Gold)' },
                            { value: 'rose', label: 'Rose Accent (Crimson Red)' },
                            { value: 'teal', label: 'Teal Accent (Modern Cyan)' }
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setValue('colorSystem', opt.value);
                                setIsColorSystemOpen(false);
                              }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-colors border cursor-pointer ${
                                colorSystemValue === opt.value
                                  ? 'bg-blue-600/20 border-blue-500/20 text-blue-400 font-semibold'
                                  : 'text-slate-300 hover:bg-slate-800/60 border-transparent'
                              }`}
                            >
                              <span className={`w-3 h-3 rounded-full ${
                                opt.value === 'blue' ? 'bg-blue-500' :
                                opt.value === 'purple' ? 'bg-purple-500' :
                                opt.value === 'green' ? 'bg-emerald-500' :
                                opt.value === 'amber' ? 'bg-amber-500' :
                                opt.value === 'rose' ? 'bg-rose-500' :
                                'bg-teal-500'
                              }`} />
                              <span>{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-6">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Scheduling & Slot Rules</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Slot duration */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Booking Slot (Minutes)</label>
                  <input
                    type="number"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    {...registerDealership('bookingSlotDurationMinutes', { valueAsNumber: true })}
                  />
                </div>

                {/* Allowed Hours Start */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Allowed Booking Start Time</label>
                  <input
                    type="text"
                    placeholder="09:00"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    {...registerDealership('allowedBookingHoursStart')}
                  />
                </div>

                {/* Allowed Hours End */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Allowed Booking End Time</label>
                  <input
                    type="text"
                    placeholder="18:00"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    {...registerDealership('allowedBookingHoursEnd')}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white text-xs font-semibold py-3 px-6 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/10"
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Save Configurations</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Staff Management */}
      {activeTab === 'staff' && hasStaffPermission && (
        <div className="glass-card p-6 rounded-2xl border border-white/5 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-base text-slate-200">Dealership Administrators</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Add, delete, or manage system-wide console access nodes</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => refetchStaff()}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-white/5 text-slate-400 hover:text-slate-200 rounded-xl"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/10"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create New Staff</span>
              </button>
            </div>
          </div>

          {isStaffLoading ? (
            <div className="py-20 flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="pb-3 pl-2">Name</th>
                    <th className="pb-3">Email Address</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3 text-center">Deletable</th>
                    <th className="pb-3 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {staffData?.map((staff) => (
                    <tr key={staff._id} className="hover:bg-white/2 transition-colors">
                      <td className="py-3.5 pl-2 font-medium text-slate-200">{staff.name}</td>
                      <td className="py-3.5 text-slate-400 font-mono">{staff.email}</td>
                      <td className="py-3.5">
                        <span className="inline-flex text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                          {staff.role}
                        </span>
                      </td>
                      <td className="py-3.5 text-center">
                        {staff.email === admin?.email ? (
                          <span className="text-[10px] text-slate-500 font-medium">No (Self)</span>
                        ) : (
                          <span className="text-[10px] text-emerald-500 font-medium">Yes</span>
                        )}
                      </td>
                      <td className="py-3.5 text-right pr-2 space-x-2.5">
                        <button
                          onClick={() => {
                            setSelectedStaff(staff);
                            setIsEditModalOpen(true);
                          }}
                          className="text-slate-400 hover:text-blue-400"
                        >
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                        {staff.email !== admin?.email && (
                          <button
                            onClick={() => handleDeleteStaff(staff._id!, staff.name)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-8 rounded-2xl border border-white/10 max-w-md w-full shadow-2xl space-y-6">
            <h3 className="font-display font-bold text-lg text-slate-200">Register Staff Account</h3>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Vikram Singh"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Work Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="name@dealership.com"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Initial Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Min 6 characters"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">System Role Level</label>
                <select
                  name="role"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                >
                  <option value="Admin">Admin (Full write/read, no delete)</option>
                  <option value="SuperAdmin">SuperAdmin (Full control)</option>
                  <option value="Manager">Manager (Read & Edit entries)</option>
                  <option value="Viewer">Viewer (Read-only access)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 border border-white/5 text-slate-300 text-xs font-semibold py-2.5 px-4 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center gap-1.5"
                  disabled={createStaffMutation.isPending}
                >
                  {createStaffMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {isEditModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-8 rounded-2xl border border-white/10 max-w-md w-full shadow-2xl space-y-6">
            <h3 className="font-display font-bold text-lg text-slate-200">Update User Role</h3>
            <p className="text-slate-400 text-xs">Modifying access for: <strong className="text-slate-200">{selectedStaff.name}</strong> ({selectedStaff.email})</p>
            <form onSubmit={handleUpdateStaff} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">System Role Level</label>
                <select
                  name="role"
                  defaultValue={selectedStaff.role}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                >
                  <option value="Admin">Admin (Full write/read, no delete)</option>
                  <option value="SuperAdmin">SuperAdmin (Full control)</option>
                  <option value="Manager">Manager (Read & Edit entries)</option>
                  <option value="Viewer">Viewer (Read-only access)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedStaff(null);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 border border-white/5 text-slate-300 text-xs font-semibold py-2.5 px-4 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center gap-1.5"
                  disabled={updateStaffMutation.isPending}
                >
                  {updateStaffMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsPage;
