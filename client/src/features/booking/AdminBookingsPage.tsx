import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import {
  FileSpreadsheet,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  Calendar,
  Clock,
  User,
  Bookmark,
  ShieldAlert,
  X,
  FileCheck,
  Edit,
  Save,
  Undo,
  Plus,
  Trash2,
  ChevronDown,
  CreditCard
} from 'lucide-react';
import api from '../../services/api';
import { IBooking, IStatusHistory, IBike } from 'shared';
import useAuth from '../../hooks/useAuth';

const ACTIVE_STATUS_OPTS = ['Pending', 'Pending Payment', 'Approved', 'Checked In', 'In Progress'];
const COMPLETED_STATUS_OPTS = ['Completed', 'Cancelled', 'Rejected'];

export const AdminBookingsPage = () => {
  const { admin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // RBAC permissions helpers
  const canCreate = admin?.permissions?.includes('booking.create') || admin?.role === 'SuperAdmin';
  const canUpdate = admin?.permissions?.includes('booking.update') || admin?.role === 'SuperAdmin';
  const canDelete = admin?.permissions?.includes('booking.delete') || admin?.role === 'SuperAdmin';
  const [search, setSearch] = useState('');
  const [bookingTab, setBookingTab] = useState<'active' | 'completed'>('active');
  const [statusFilter, setStatusFilter] = useState('');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const typeFilter = '';
  
  const [activeBooking, setActiveBooking] = useState<IBooking | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isStatusActionOpen, setIsStatusActionOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [adminRemark, setAdminRemark] = useState('');

  // Edit details panel state variables
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);

  // Creation panel state variables
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<any>(null);

  // Dropdown states for Edit and Create modals to replace native selectors
  const [isEditStatusOpen, setIsEditStatusOpen] = useState(false);
  const [isEditBikeOpen, setIsEditBikeOpen] = useState(false);
  const [isCreateStatusOpen, setIsCreateStatusOpen] = useState(false);
  const [isCreateBikeOpen, setIsCreateBikeOpen] = useState(false);

  // Sorting state variables
  const [sortBy, setSortBy] = useState('bookingDate');
  const [sortOrder, setSortOrder] = useState('desc');

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Fetch bookings list query
  const statusFilterParam = statusFilter 
    ? statusFilter 
    : (bookingTab === 'active' 
        ? 'Pending,Approved,Checked In,In Progress' 
        : 'Completed,Cancelled,Rejected');

  const { data, isLoading } = useQuery({
    queryKey: ['bookingsList', page, search, statusFilterParam, typeFilter, sortBy, sortOrder],
    queryFn: async () => {
      const { data } = await api.get('/bookings', {
        params: {
          page,
          limit: 10,
          search,
          status: statusFilterParam,
          bookingType: typeFilter,
          sortBy,
          sortOrder,
        },
      });
      return data.data;
    },
  });

  // Listen to Socket.io events for real-time updates
  useEffect(() => {
    // Establish connection to backend port
    const socket = io('http://localhost:5000', {
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('Socket.IO connected to admin bookings panel');
    });

    socket.on('newBooking', (newB: IBooking) => {
      // Play a subtle notification sound (soft beep)
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15);
      } catch (e) {
        console.warn('Audio feedback blocked by browser settings');
      }

      toast.info(`🔔 New Booking request received: ${newB.bookingNumber} (${newB.customerName})`, {
        duration: 5000,
      });

      // Refetch bookings logs list in real-time
      queryClient.invalidateQueries({ queryKey: ['bookingsList'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    });

    socket.on('bookingUpdate', () => {
      queryClient.invalidateQueries({ queryKey: ['bookingsList'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  // Update status mutation
  const statusMutation = useMutation({
    mutationFn: async (payload: { id: string; status: string; remark: string }) => {
      const { data } = await api.put(`/bookings/${payload.id}/status`, {
        status: payload.status,
        remark: payload.remark,
      });
      return data.data.booking;
    },
    onSuccess: (updated) => {
      toast.success(`Booking status updated to ${updated.status}`);
      setIsStatusActionOpen(false);
      setAdminRemark('');
      // Update active view
      if (activeBooking && activeBooking._id === updated._id) {
        setActiveBooking(updated);
      }
      queryClient.invalidateQueries({ queryKey: ['bookingsList'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update status');
    },
  });

  const triggerStatusChange = (status: string) => {
    setTargetStatus(status);
    setIsStatusActionOpen(true);
  };

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBooking?._id || !targetStatus) return;
    statusMutation.mutate({
      id: activeBooking._id,
      status: targetStatus,
      remark: adminRemark,
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      'Pending Payment': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      Approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'Checked In': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'In Progress': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      Completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      Cancelled: 'bg-slate-700/10 text-slate-400 border-slate-700/20',
      Rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return `inline-flex text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${styles[status] || 'bg-slate-800 text-slate-400'}`;
  };

  const getTimelineDotColor = (status: string) => {
    const styles: Record<string, string> = {
      Pending: 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]',
      'Pending Payment': 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
      Approved: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]',
      'Checked In': 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]',
      'In Progress': 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]',
      Completed: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
      Cancelled: 'bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.4)]',
      Rejected: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]',
    };
    return `absolute -left-[19.5px] top-[9px] w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${styles[status] || 'bg-slate-400'}`;
  };

  const handleViewDetails = (booking: IBooking) => {
    setActiveBooking(booking);
    setIsDetailsOpen(true);
  };

  // Fetch all bikes list for admin vehicle selector
  const { data: bikesData } = useQuery({
    queryKey: ['adminEditBikesList'],
    queryFn: async () => {
      const { data } = await api.get('/bikes', { params: { limit: 100 } });
      return data.data.bikes as IBike[];
    },
    enabled: (isDetailsOpen && isEditing) || isCreateOpen,
  });

  const createBookingMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/bookings', payload);
      return data.data.booking;
    },
    onSuccess: () => {
      toast.success('New booking created successfully!');
      queryClient.invalidateQueries({ queryKey: ['bookingsList'] });
      setIsCreateOpen(false);
    },
    onError: (err: any) => {
      if (err.response?.data?.errors && err.response.data.errors.length > 0) {
        const errorMsgs = err.response.data.errors.map((e: any) => `${e.field}: ${e.message}`).join('; ');
        toast.error(`Validation Failed: ${errorMsgs}`);
      } else {
        toast.error(err.response?.data?.message || 'Failed to create booking');
      }
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.put(`/bookings/${activeBooking?._id}`, payload);
      return data.data.booking;
    },
    onSuccess: (updated) => {
      toast.success('Booking details updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['bookingsList'] });
      setActiveBooking(updated);
      setIsEditing(false);
    },
    onError: (err: any) => {
      if (err.response?.data?.errors && err.response.data.errors.length > 0) {
        const errorMsgs = err.response.data.errors.map((e: any) => `${e.field}: ${e.message}`).join('; ');
        toast.error(`Validation Failed: ${errorMsgs}`);
      } else {
        toast.error(err.response?.data?.message || 'Failed to save booking edits');
      }
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/bookings/${id}`);
      return data;
    },
    onSuccess: () => {
      toast.success('Booking deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['bookingsList'] });
      setIsDetailsOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete booking');
    }
  });

  const handleStartCreate = () => {
    setCreateForm({
      customerName: '',
      mobile: '',
      email: '',
      address: '',
      hotelStay: '',
      destination: '',
      age: 18,
      dob: '2000-01-01',
      gender: 'Male',
      voterId: '',
      aadhaarNumber: '',
      licenseNumber: '',
      bikeId: bikesData?.[0]?.bikeId || '',
      bookingType: 'Rental',
      pickupDate: new Date().toISOString().slice(0, 10),
      pickupTime: '10:00',
      returnDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      returnTime: '10:00',
      perDayRent: 500,
      securityDeposit: 1000,
      totalPayment: 1500,
      status: 'Pending',
      licenseFront: 'manual-dl-placeholder',
      licenseBack: '',
      aadhaarFront: '',
      aadhaarBack: '',
      aadhaarFile: 'manual-aadhaar-placeholder',
      confirmCorrect: true,
      agreeTerms: true,
    });
    setIsCreateOpen(true);
  };

  const handleCreateBikeChange = (bikeId: string) => {
    const bike = bikesData?.find(b => b.bikeId === bikeId);
    if (bike) {
      setCreateForm((prev: any) => ({
        ...prev,
        bikeId,
        perDayRent: bike.rentPrice || 500,
        securityDeposit: bike.securityDeposit || 1000,
      }));
    }
  };

  const handleSaveCreate = () => {
    if (!createForm) return;
    
    if (!createForm.customerName || !createForm.customerName.trim()) {
      toast.error('Customer Name is required');
      return;
    }
    if (!createForm.mobile || !createForm.mobile.trim()) {
      toast.error('Mobile Number is required');
      return;
    }
    if (!/^\d{10}$/.test(createForm.mobile)) {
      toast.error('Mobile Number must be a valid 10-digit number');
      return;
    }
    if (createForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
      toast.error('Email is invalid');
      return;
    }
    if (!createForm.bikeId) {
      toast.error('Please select a motorbike');
      return;
    }
    if (!createForm.pickupDate || !createForm.pickupTime) {
      toast.error('Pickup Date and Time are required');
      return;
    }
    if (createForm.bookingType === 'Rental') {
      if (!createForm.returnDate || !createForm.returnTime) {
        toast.error('Return Date and Time are required');
        return;
      }
      const pickup = new Date(`${createForm.pickupDate}T${createForm.pickupTime}`);
      const ret = new Date(`${createForm.returnDate}T${createForm.returnTime}`);
      if (ret <= pickup) {
        toast.error('Return Date/Time must be after Pickup Date/Time');
        return;
      }
    }
    if (createForm.age < 18) {
      toast.error('Customer must be at least 18 years old');
      return;
    }
    if (createForm.aadhaarNumber && !/^\d{12}$/.test(createForm.aadhaarNumber)) {
      toast.error('Aadhaar Number must be a valid 12-digit number');
      return;
    }

    createBookingMutation.mutate(createForm);
  };

  const handleStartEdit = () => {
    if (!activeBooking) return;
    setEditForm({
      customerName: activeBooking.customerName || '',
      mobile: activeBooking.mobile || '',
      email: activeBooking.email || '',
      address: activeBooking.address || '',
      hotelStay: activeBooking.hotelStay || '',
      destination: activeBooking.destination || '',
      age: activeBooking.age || 18,
      dob: activeBooking.dob ? new Date(activeBooking.dob).toISOString().slice(0, 10) : '',
      voterId: activeBooking.voterId || '',
      aadhaarNumber: activeBooking.aadhaarNumber || '',
      licenseNumber: activeBooking.licenseNumber || '',
      licenseFront: activeBooking.licenseFront || '',
      licenseBack: activeBooking.licenseBack || '',
      aadhaarFront: activeBooking.aadhaarFront || '',
      aadhaarBack: activeBooking.aadhaarBack || '',
      aadhaarFile: activeBooking.aadhaarFile || '',
      bikeId: activeBooking.bikeId || '',
      bookingType: activeBooking.bookingType || 'Test Ride',
      pickupDate: activeBooking.pickupDate ? new Date(activeBooking.pickupDate).toISOString().slice(0, 10) : '',
      pickupTime: activeBooking.pickupTime || '',
      returnDate: activeBooking.returnDate ? new Date(activeBooking.returnDate).toISOString().slice(0, 10) : '',
      returnTime: activeBooking.returnTime || '',
      perDayRent: activeBooking.perDayRent || 0,
      securityDeposit: activeBooking.securityDeposit || 0,
      totalPayment: activeBooking.totalPayment || 0,
      pendingPayment: activeBooking.pendingPayment !== undefined ? activeBooking.pendingPayment : (activeBooking.totalPayment || 0),
      status: activeBooking.status || 'Pending',
    });
    setIsEditing(true);
  };

  const handleSaveEdits = () => {
    if (!editForm) return;

    if (!editForm.customerName || !editForm.customerName.trim()) {
      toast.error('Customer Name is required');
      return;
    }
    if (!editForm.mobile || !editForm.mobile.trim()) {
      toast.error('Mobile Number is required');
      return;
    }
    if (!/^\d{10}$/.test(editForm.mobile)) {
      toast.error('Mobile Number must be a valid 10-digit number');
      return;
    }
    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      toast.error('Email is invalid');
      return;
    }
    if (!editForm.bikeId) {
      toast.error('Please select a motorbike');
      return;
    }
    if (!editForm.pickupDate || !editForm.pickupTime) {
      toast.error('Pickup Date and Time are required');
      return;
    }
    if (editForm.bookingType === 'Rental') {
      if (!editForm.returnDate || !editForm.returnTime) {
        toast.error('Return Date and Time are required');
        return;
      }
      const pickup = new Date(`${editForm.pickupDate}T${editForm.pickupTime}`);
      const ret = new Date(`${editForm.returnDate}T${editForm.returnTime}`);
      if (ret <= pickup) {
        toast.error('Return Date/Time must be after Pickup Date/Time');
        return;
      }
    }
    if (editForm.age < 18) {
      toast.error('Customer must be at least 18 years old');
      return;
    }
    if (editForm.aadhaarNumber && !/^\d{12}$/.test(editForm.aadhaarNumber)) {
      toast.error('Aadhaar Number must be a valid 12-digit number');
      return;
    }

    updateBookingMutation.mutate(editForm);
  };

  const handleDeleteBooking = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <span className="opacity-30 ml-1">↕</span>;
    return sortOrder === 'asc' ? <span className="text-blue-400 ml-1">↑</span> : <span className="text-blue-400 ml-1">↓</span>;
  };

  // Reactively calculate booking payment rates on the client edit form
  useEffect(() => {
    if (editForm && editForm.bookingType === 'Rental') {
      const start = new Date(editForm.pickupDate);
      const end = new Date(editForm.returnDate);
      const diffTime = end.getTime() - start.getTime();
      if (!isNaN(diffTime)) {
        const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        const calculatedTotal = (days * editForm.perDayRent) + editForm.securityDeposit;
        if (calculatedTotal !== editForm.totalPayment) {
          setEditForm((prev: any) => prev ? { ...prev, totalPayment: calculatedTotal } : null);
        }
      }
    }
  }, [editForm?.pickupDate, editForm?.returnDate, editForm?.perDayRent, editForm?.securityDeposit]);

  // Reactively calculate booking payment rates on the creation form
  useEffect(() => {
    if (createForm && createForm.bookingType === 'Rental') {
      const start = new Date(createForm.pickupDate);
      const end = new Date(createForm.returnDate);
      const diffTime = end.getTime() - start.getTime();
      if (!isNaN(diffTime)) {
        const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        const calculatedTotal = (days * createForm.perDayRent) + createForm.securityDeposit;
        if (calculatedTotal !== createForm.totalPayment) {
          setCreateForm((prev: any) => prev ? { ...prev, totalPayment: calculatedTotal } : null);
        }
      }
    }
  }, [createForm?.pickupDate, createForm?.returnDate, createForm?.perDayRent, createForm?.securityDeposit]);

  return (
    <div className="space-y-8">
      {/* Top Header info */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold font-display text-gradient">Bookings & Logs</h2>
          <p className="text-slate-400 text-xs mt-1">Review active rental requests, inspect customer credentials, and alter statuses.</p>
        </div>
        {canCreate && (
          <button
            onClick={handleStartCreate}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/10 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Booking</span>
          </button>
        )}
      </div>

      {/* Tab Switcher for Active vs Completed Bookings */}
      <div className="flex border-b border-white/5 gap-6 text-sm font-semibold">
        <button
          onClick={() => {
            setBookingTab('active');
            setStatusFilter('');
            setPage(1);
          }}
          className={`pb-3 relative cursor-pointer transition-colors ${
            bookingTab === 'active' 
              ? 'text-blue-500 font-bold border-b-2 border-blue-500' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Active Bookings
        </button>
        <button
          onClick={() => {
            setBookingTab('completed');
            setStatusFilter('');
            setPage(1);
          }}
          className={`pb-3 relative cursor-pointer transition-colors ${
            bookingTab === 'completed' 
              ? 'text-blue-500 font-bold border-b-2 border-blue-500' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Completed Logs
        </button>
      </div>

      {/* Filter and search parameters */}
      <div className="glass-card p-5 rounded-2xl border border-white/5 shadow-md flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute inset-y-0 left-3.5 my-auto w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search name, phone, bkg #..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Status filtering - Custom dropdown select */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[160px] cursor-pointer flex items-center justify-between gap-2"
            >
              <span>
                {statusFilter || (bookingTab === 'active' ? 'All Active Statuses' : 'All Completed Statuses')}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {isStatusDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsStatusDropdownOpen(false)} 
                />
                <div className="absolute right-0 mt-2 z-50 glass-panel border border-white/10 rounded-xl shadow-2xl p-1.5 min-w-[160px] max-h-60 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('');
                      setPage(1);
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      statusFilter === ''
                        ? 'bg-blue-600/20 text-blue-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    {bookingTab === 'active' ? 'All Active Statuses' : 'All Completed Statuses'}
                  </button>
                  {(bookingTab === 'active' ? ACTIVE_STATUS_OPTS : COMPLETED_STATUS_OPTS).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setStatusFilter(s);
                        setPage(1);
                        setIsStatusDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        statusFilter === s
                          ? 'bg-blue-600/20 text-blue-400 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bookings log table list */}
      {isLoading ? (
        <div className="py-32 flex justify-center items-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        </div>
      ) : !data?.bookings?.length ? (
        <div className="py-24 text-center border border-dashed border-white/5 rounded-2xl p-8">
          <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-300 font-bold text-sm">No Bookings Logs Found</h3>
          <p className="text-slate-500 text-xs mt-1">Awaiting scans from your customer entrypoints.</p>
        </div>
      ) : (
        <div className="glass-card border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-900/40 border-b border-white/5 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  <th onClick={() => handleSort('bookingNumber')} className="p-4 cursor-pointer hover:text-slate-200 transition-colors">
                    Reference No {getSortIcon('bookingNumber')}
                  </th>
                  <th onClick={() => handleSort('customerName')} className="p-4 cursor-pointer hover:text-slate-200 transition-colors">
                    Customer Details {getSortIcon('customerName')}
                  </th>
                  <th onClick={() => handleSort('bikeId')} className="p-4 cursor-pointer hover:text-slate-200 transition-colors">
                    Motorbike Code {getSortIcon('bikeId')}
                  </th>
                  <th onClick={() => handleSort('bookingDate')} className="p-4 cursor-pointer hover:text-slate-200 transition-colors">
                    Date & Time {getSortIcon('bookingDate')}
                  </th>
                  <th onClick={() => handleSort('bookingType')} className="p-4 cursor-pointer hover:text-slate-200 transition-colors">
                    Type {getSortIcon('bookingType')}
                  </th>
                  <th onClick={() => handleSort('status')} className="p-4 cursor-pointer hover:text-slate-200 transition-colors">
                    Status {getSortIcon('status')}
                  </th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.bookings.map((booking: IBooking) => (
                  <tr key={booking._id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-200">{booking.bookingNumber}</td>
                    <td className="p-4">
                      <div>
                        <div className="font-semibold text-slate-200">{booking.customerName}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{booking.mobile}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-semibold text-slate-200">{booking.bikeName || (typeof booking.bike === 'object' && booking.bike ? (booking.bike as any).name : 'Unknown')}</div>
                        <span className="text-[9px] font-mono text-blue-400 uppercase">
                          {booking.bikeId || (typeof booking.bike === 'object' && booking.bike ? (booking.bike as any).bikeId : 'N/A')} • {booking.registrationNumber || (typeof booking.bike === 'object' && booking.bike ? (booking.bike as any).registrationNumber : 'N/A')}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(booking.bookingDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{booking.bookingTime} ({booking.duration})</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-semibold text-slate-400">{booking.bookingType}</span>
                    </td>
                    <td className="p-4">
                      <span className={getStatusBadge(booking.status)}>{booking.status}</span>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-1.5 items-center">
                      <button
                        onClick={() => handleViewDetails(booking)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg flex items-center gap-1 inline-flex cursor-pointer transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Info</span>
                      </button>
                      {canUpdate && (
                        <button
                          onClick={() => {
                            setActiveBooking(booking);
                            setIsDetailsOpen(true);
                            setEditForm({
                              customerName: booking.customerName || '',
                              mobile: booking.mobile || '',
                              email: booking.email || '',
                              address: booking.address || '',
                              hotelStay: booking.hotelStay || '',
                              destination: booking.destination || '',
                              age: booking.age || 18,
                              dob: booking.dob ? new Date(booking.dob).toISOString().slice(0, 10) : '',
                              voterId: booking.voterId || '',
                              aadhaarNumber: booking.aadhaarNumber || '',
                              licenseNumber: booking.licenseNumber || '',
                              licenseFront: booking.licenseFront || '',
                              licenseBack: booking.licenseBack || '',
                              aadhaarFront: booking.aadhaarFront || '',
                              aadhaarBack: booking.aadhaarBack || '',
                              aadhaarFile: booking.aadhaarFile || '',
                              bikeId: booking.bikeId || '',
                              bookingType: booking.bookingType || 'Test Ride',
                              pickupDate: booking.pickupDate ? new Date(booking.pickupDate).toISOString().slice(0, 10) : '',
                              pickupTime: booking.pickupTime || '',
                              returnDate: booking.returnDate ? new Date(booking.returnDate).toISOString().slice(0, 10) : '',
                              returnTime: booking.returnTime || '',
                              perDayRent: booking.perDayRent || 0,
                              securityDeposit: booking.securityDeposit || 0,
                              totalPayment: booking.totalPayment || 0,
                              pendingPayment: booking.pendingPayment !== undefined ? booking.pendingPayment : (booking.totalPayment || 0),
                              status: booking.status || 'Pending',
                            });
                            setIsEditing(true);
                          }}
                          className="px-3 py-1.5 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/10 hover:border-blue-500/20 text-blue-400 font-semibold rounded-lg flex items-center gap-1 inline-flex cursor-pointer transition-colors"
                          title="Edit Booking"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => booking._id && handleDeleteBooking(booking._id)}
                          className="p-1.5 bg-red-950/20 hover:bg-red-900/30 border border-red-500/10 hover:border-red-500/20 text-red-400 rounded-lg cursor-pointer transition-colors"
                          title="Delete Booking"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination logs Controls */}
      {data?.pagination?.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3.5 py-1.5 bg-slate-900 border border-white/5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Prev
          </button>
          <span className="text-xs text-slate-500">Page {page} of {data.pagination.pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
            disabled={page === data.pagination.pages}
            className="px-3.5 py-1.5 bg-slate-900 border border-white/5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

      {/* Fullscreen Details Modal */}
      {isDetailsOpen && activeBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-8 rounded-2xl border border-white/10 max-w-4xl w-full shadow-2xl space-y-6 overflow-y-auto max-h-[90vh]">
            
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div>
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold">Booking Details Reference</span>
                <h3 className="font-display font-bold text-lg text-slate-200">{activeBooking.bookingNumber}</h3>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <button
                    onClick={handleStartEdit}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 text-[11px] font-semibold border border-white/5 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Booking</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 text-[11px] font-semibold border border-white/5 cursor-pointer"
                  >
                    <Undo className="w-3.5 h-3.5" />
                    <span>Cancel Edit</span>
                  </button>
                )}
                <button onClick={() => { setIsDetailsOpen(false); setIsEditing(false); }} className="text-slate-400 hover:text-slate-200 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {isEditing && editForm ? (
              <div className="space-y-6 text-slate-300">
                <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <User className="w-4 h-4" /> Edit Customer Profile
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block text-[10px] uppercase">Full Name</label>
                      <input
                        type="text"
                        value={editForm.customerName}
                        onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block text-[10px] uppercase">Mobile</label>
                      <input
                        type="text"
                        value={editForm.mobile}
                        onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-slate-250 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block text-[10px] uppercase">Email</label>
                      <input
                        type="text"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block text-[10px] uppercase">DOB</label>
                      <input
                        type="date"
                        value={editForm.dob}
                        onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block text-[10px] uppercase">Age</label>
                      <input
                        type="number"
                        value={editForm.age}
                        onChange={(e) => setEditForm({ ...editForm, age: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block text-[10px] uppercase">Hotel Stay</label>
                      <input
                        type="text"
                        value={editForm.hotelStay}
                        onChange={(e) => setEditForm({ ...editForm, hotelStay: e.target.value })}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block text-[10px] uppercase">Destination</label>
                      <input
                        type="text"
                        value={editForm.destination}
                        onChange={(e) => setEditForm({ ...editForm, destination: e.target.value })}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-slate-400 font-semibold block text-[10px] uppercase">Address</label>
                      <input
                        type="text"
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                             <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <FileCheck className="w-4 h-4" /> Edit Identity Credentials
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-white/5 pb-4">
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block text-[10px] uppercase">Driving License</label>
                      <input
                        type="text"
                        value={editForm.licenseNumber}
                        onChange={(e) => setEditForm({ ...editForm, licenseNumber: e.target.value })}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block text-[10px] uppercase">Aadhaar Number</label>
                      <input
                        type="text"
                        value={editForm.aadhaarNumber}
                        onChange={(e) => setEditForm({ ...editForm, aadhaarNumber: e.target.value })}
                        className="w-full bg-slate-955 border border-white/5 rounded-xl px-3 py-2 text-slate-250 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block text-[10px] uppercase">Voter ID</label>
                      <input
                        type="text"
                        value={editForm.voterId}
                        onChange={(e) => setEditForm({ ...editForm, voterId: e.target.value })}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Document uploads inside edit form */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-[10px]">
                    {/* DL Front Upload */}
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block uppercase">License Front</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const r = new FileReader();
                            r.onloadend = () => setEditForm({ ...editForm, licenseFront: r.result as string });
                            r.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-slate-450 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-600/10 file:text-blue-400 file:text-[9px] cursor-pointer"
                      />
                      {editForm.licenseFront && (
                        <img src={editForm.licenseFront} className="h-16 object-contain rounded mt-1 border border-white/5" />
                      )}
                    </div>
                    {/* DL Back Upload */}
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block uppercase">License Back</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const r = new FileReader();
                            r.onloadend = () => setEditForm({ ...editForm, licenseBack: r.result as string });
                            r.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-slate-450 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-600/10 file:text-blue-400 file:text-[9px] cursor-pointer"
                      />
                      {editForm.licenseBack && (
                        <img src={editForm.licenseBack} className="h-16 object-contain rounded mt-1 border border-white/5" />
                      )}
                    </div>
                    {/* Aadhaar Front Upload */}
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block uppercase">Aadhaar Front</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const r = new FileReader();
                            r.onloadend = () => {
                              const base64 = r.result as string;
                              setEditForm({ ...editForm, aadhaarFront: base64, aadhaarFile: base64 });
                            };
                            r.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-slate-450 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-600/10 file:text-blue-400 file:text-[9px] cursor-pointer"
                      />
                      {(editForm.aadhaarFront || editForm.aadhaarFile) && (
                        <img src={editForm.aadhaarFront || editForm.aadhaarFile} className="h-16 object-contain rounded mt-1 border border-white/5" />
                      )}
                    </div>
                    {/* Aadhaar Back Upload */}
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block uppercase">Aadhaar Back</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const r = new FileReader();
                            r.onloadend = () => setEditForm({ ...editForm, aadhaarBack: r.result as string });
                            r.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-slate-450 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-600/10 file:text-blue-400 file:text-[9px] cursor-pointer"
                      />
                      {editForm.aadhaarBack && (
                        <img src={editForm.aadhaarBack} className="h-16 object-contain rounded mt-1 border border-white/5" />
                      )}
                    </div>
                  </div>
                </div>     </div>

                <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Bookmark className="w-4 h-4" /> Edit Specifications & Pricing
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block text-[10px] uppercase">Select Motorbike</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsEditBikeOpen(!isEditBikeOpen)}
                          className="w-full bg-slate-955 border border-white/5 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer flex items-center justify-between gap-2 text-left"
                        >
                          <span>
                            {(() => {
                              const b = bikesData?.find((bike) => bike.bikeId === editForm.bikeId);
                              return b ? `${b.brand} ${b.name} (${b.registrationNumber}) [${b.status}]` : '-- Choose Scooter --';
                            })()}
                          </span>
                          <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        </button>
                        {isEditBikeOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsEditBikeOpen(false)} />
                            <div className="absolute left-0 right-0 mt-2 z-50 glass-panel border border-white/10 rounded-xl shadow-2xl p-1.5 max-h-60 overflow-y-auto">
                              {bikesData?.map((b) => (
                                <button
                                  key={b.bikeId}
                                  type="button"
                                  onClick={() => {
                                    setEditForm({ ...editForm, bikeId: b.bikeId });
                                    setIsEditBikeOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                    editForm.bikeId === b.bikeId
                                      ? 'bg-blue-600/20 text-blue-400 font-semibold'
                                      : 'text-slate-300 hover:bg-slate-800/60'
                                  }`}
                                >
                                  {b.brand} {b.name} ({b.registrationNumber}) [{b.status}]
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block text-[10px] uppercase">Booking Type</label>
                      <div className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-slate-400 text-xs select-none">
                        Rental
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block text-[10px] uppercase">Booking Status</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsEditStatusOpen(!isEditStatusOpen)}
                          className="w-full bg-slate-955 border border-white/5 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer flex items-center justify-between gap-2 text-left"
                        >
                          <span>{editForm.status}</span>
                          <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        </button>
                        {isEditStatusOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsEditStatusOpen(false)} />
                            <div className="absolute left-0 right-0 mt-2 z-50 glass-panel border border-white/10 rounded-xl shadow-2xl p-1.5 max-h-60 overflow-y-auto">
                              {[...ACTIVE_STATUS_OPTS, ...COMPLETED_STATUS_OPTS].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => {
                                    setEditForm({ ...editForm, status: s });
                                    setIsEditStatusOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                    editForm.status === s
                                      ? 'bg-blue-600/20 text-blue-400 font-semibold'
                                      : 'text-slate-300 hover:bg-slate-800/60'
                                  }`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block text-[10px] uppercase">Pickup Date</label>
                      <input
                        type="date"
                        value={editForm.pickupDate}
                        onChange={(e) => setEditForm({ ...editForm, pickupDate: e.target.value })}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block text-[10px] uppercase">Pickup Time</label>
                      <input
                        type="time"
                        value={editForm.pickupTime}
                        onChange={(e) => setEditForm({ ...editForm, pickupTime: e.target.value })}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                    {editForm.bookingType === 'Rental' && (
                      <>
                        <div className="space-y-1">
                          <label className="text-slate-400 font-semibold block text-[10px] uppercase">Return Date</label>
                          <input
                            type="date"
                            value={editForm.returnDate}
                            onChange={(e) => setEditForm({ ...editForm, returnDate: e.target.value })}
                            className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 font-semibold block text-[10px] uppercase">Return Time</label>
                          <input
                            type="time"
                            value={editForm.returnTime}
                            onChange={(e) => setEditForm({ ...editForm, returnTime: e.target.value })}
                            className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>
                      </>
                    )}
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block text-[10px] uppercase">Per Day Rent (₹)</label>
                      <input
                        type="number"
                        value={editForm.perDayRent}
                        onChange={(e) => setEditForm({ ...editForm, perDayRent: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block text-[10px] uppercase">Security Deposit (₹)</label>
                      <input
                        type="number"
                        value={editForm.securityDeposit}
                        onChange={(e) => setEditForm({ ...editForm, securityDeposit: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block text-[10px] uppercase">Total Payment (₹)</label>
                      <input
                        type="number"
                        value={editForm.totalPayment}
                        onChange={(e) => setEditForm({ ...editForm, totalPayment: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-955 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block text-[10px] uppercase">Pending Payment (₹)</label>
                      <input
                        type="number"
                        value={editForm.pendingPayment !== undefined ? editForm.pendingPayment : editForm.totalPayment}
                        onChange={(e) => setEditForm({ ...editForm, pendingPayment: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-955 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-white/5 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/5 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdits}
                    disabled={updateBookingMutation.isPending}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/10"
                  >
                    {updateBookingMutation.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Customer Profile Column */}
                  <div className="space-y-4 bg-slate-900/40 p-5 rounded-xl border border-white/5 shadow-md">
                    <h4 className="text-xs font-bold text-blue-400 uppercase flex items-center gap-1.5 border-b border-white/5 pb-2.5">
                      <User className="w-4 h-4" /> Customer Profile
                    </h4>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-slate-400">Full Name</span>
                        <strong className="text-slate-200 font-semibold">{activeBooking.customerName}</strong>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-slate-400">Mobile</span>
                        <span className="font-mono text-slate-200">{activeBooking.mobile}</span>
                      </div>
                      {activeBooking.email && (
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-slate-400">Email</span>
                          <span className="text-slate-200 truncate max-w-[120px]">{activeBooking.email}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-slate-400">DOB</span>
                        <span className="text-slate-200">{new Date(activeBooking.dob).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-slate-400">Age</span>
                        <span className="font-semibold text-slate-200">{activeBooking.age} Years</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-slate-400">Aadhaar No</span>
                        <span className="font-mono text-slate-200">{activeBooking.aadhaarNumber || 'N/A'}</span>
                      </div>
                      {activeBooking.voterId && (
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-slate-400">Voter ID</span>
                          <span className="font-mono text-slate-200">{activeBooking.voterId}</span>
                        </div>
                      )}
                      {activeBooking.hotelStay && (
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-slate-400">Hotel Stay</span>
                          <span className="text-slate-200 truncate max-w-[120px]">{activeBooking.hotelStay}</span>
                        </div>
                      )}
                      {activeBooking.address && (
                        <div className="flex justify-between items-start">
                          <span className="text-slate-400 shrink-0">Address</span>
                          <span className="text-slate-200 text-right truncate max-w-[140px]" title={activeBooking.address}>{activeBooking.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Booking Specifications */}
                  <div className="space-y-4 bg-slate-900/40 p-5 rounded-xl border border-white/5 shadow-md">
                    <h4 className="text-xs font-bold text-blue-400 uppercase flex items-center gap-1.5 border-b border-white/5 pb-2.5">
                      <Bookmark className="w-4 h-4" /> Specifications
                    </h4>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-slate-400">Vehicle</span>
                        <strong className="text-slate-200 font-semibold truncate max-w-[110px]">{activeBooking.bikeName || (typeof activeBooking.bike === 'object' && activeBooking.bike ? (activeBooking.bike as any).name : 'Unknown')}</strong>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-slate-400">ID Code</span>
                        <span className="font-mono text-slate-200">{activeBooking.bikeId || (typeof activeBooking.bike === 'object' && activeBooking.bike ? (activeBooking.bike as any).bikeId : 'N/A')}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-slate-400">Reg Plate</span>
                        <span className="font-mono text-blue-400 uppercase">{activeBooking.registrationNumber || (typeof activeBooking.bike === 'object' && activeBooking.bike ? (activeBooking.bike as any).registrationNumber : 'N/A')}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-slate-400">Type</span>
                        <span className="text-slate-200 font-semibold">{activeBooking.bookingType}</span>
                      </div>
                      {activeBooking.destination && (
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-slate-400">Destination</span>
                          <span className="text-slate-200 truncate max-w-[120px]" title={activeBooking.destination}>{activeBooking.destination}</span>
                        </div>
                      )}
                      {activeBooking.pickupDate ? (
                        <>
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-slate-400">Pickup</span>
                            <span className="text-slate-200 font-medium">
                              {new Date(activeBooking.pickupDate).toLocaleDateString()} @ {activeBooking.pickupTime}
                            </span>
                          </div>
                          {activeBooking.bookingType === 'Rental' && activeBooking.returnDate && (
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                              <span className="text-slate-400">Return</span>
                              <span className="text-slate-200 font-medium">
                                {new Date(activeBooking.returnDate).toLocaleDateString()} @ {activeBooking.returnTime}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-slate-400">Scheduled</span>
                          <span className="text-slate-200">{new Date(activeBooking.bookingDate).toLocaleDateString()} @ {activeBooking.bookingTime}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Duration</span>
                        <span className="text-slate-200 font-semibold">{activeBooking.duration}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Remarks */}
                  <div className="space-y-4 bg-slate-900/40 p-5 rounded-xl border border-white/5 shadow-md">
                    <h4 className="text-xs font-bold text-blue-400 uppercase flex items-center gap-1.5 border-b border-white/5 pb-2.5">
                      <ShieldAlert className="w-4 h-4" /> Booking Status
                    </h4>
                    <div className="space-y-4 text-xs">
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <span className="text-slate-400">Current State</span>
                        <div>
                          <span className={getStatusBadge(activeBooking.status)}>{activeBooking.status}</span>
                        </div>
                      </div>
                      {activeBooking.bookingType === 'Rental' && activeBooking.totalPayment !== undefined && (
                        <div className="space-y-2 border-b border-white/5 pb-3 text-[11px]">
                          <div className="flex justify-between text-slate-400">
                            <span>Per Day Rent:</span>
                            <span className="font-mono text-slate-200 font-semibold">₹{activeBooking.perDayRent || 0}</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Security Deposit:</span>
                            <span className="font-mono text-slate-200 font-semibold">₹{activeBooking.securityDeposit || 0}</span>
                          </div>
                          <div className="flex justify-between text-slate-300 font-bold pt-1">
                            <span>Total Payment:</span>
                            <span className="font-mono text-blue-400">₹{activeBooking.totalPayment || 0}</span>
                          </div>
                          <div className="flex justify-between text-amber-400 font-bold pt-1 border-t border-white/5 mt-1">
                            <span>Pending Payment:</span>
                            <span className="font-mono text-amber-400">₹{activeBooking.pendingPayment !== undefined ? activeBooking.pendingPayment : (activeBooking.totalPayment || 0)}</span>
                          </div>
                        </div>
                      )}
                      {activeBooking.adminRemark && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Latest Administrative Remark:</span>
                          <p className="p-3 bg-slate-950 border border-white/5 rounded-xl text-slate-400 italic text-[11px] leading-relaxed">
                            "{activeBooking.adminRemark}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Uploaded Customer Credentials - Documents grid */}
                <div className="space-y-4 border-t border-white/5 pt-5">
                  <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wider">Uploaded Customer Documents</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* License Front */}
                    {activeBooking.licenseFront && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase">Driving License Front</span>
                        <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-center max-h-48 overflow-hidden">
                          <img src={activeBooking.licenseFront} alt="DL Front" className="max-h-44 object-contain rounded-lg border border-white/5" />
                        </div>
                      </div>
                    )}
                    {/* License Back */}
                    {activeBooking.licenseBack && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase">Driving License Back</span>
                        <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-center max-h-48 overflow-hidden">
                          <img src={activeBooking.licenseBack} alt="DL Back" className="max-h-44 object-contain rounded-lg border border-white/5" />
                        </div>
                      </div>
                    )}
                    {/* Aadhaar Front */}
                    {(activeBooking.aadhaarFront || activeBooking.aadhaarFile) && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase">Aadhaar Front</span>
                        <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-center max-h-48 overflow-hidden">
                          <img src={activeBooking.aadhaarFront || activeBooking.aadhaarFile} alt="Aadhaar Front" className="max-h-44 object-contain rounded-lg border border-white/5" />
                        </div>
                      </div>
                    )}
                    {/* Aadhaar Back */}
                    {activeBooking.aadhaarBack && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase">Aadhaar Back</span>
                        <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-center max-h-48 overflow-hidden">
                          <img src={activeBooking.aadhaarBack} alt="Aadhaar Back" className="max-h-44 object-contain rounded-lg border border-white/5" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status change actions bar */}
                <div className="border-t border-white/5 pt-5 flex flex-wrap justify-between items-center gap-4">
                  {/* Logs history link */}
                  <div className="text-[10px] text-slate-500 font-mono">
                    Log count: {activeBooking.statusHistory?.length || 0} state updates logged
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {activeBooking.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => triggerStatusChange('Approved')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve Request</span>
                        </button>
                        <button
                          onClick={() => triggerStatusChange('Pending Payment')}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Pending Payment</span>
                        </button>
                        <button
                          onClick={() => triggerStatusChange('Rejected')}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-500/10"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject Request</span>
                        </button>
                      </>
                    )}
                    {activeBooking.status === 'Pending Payment' && (
                      <>
                        <button
                          onClick={() => triggerStatusChange('Approved')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve Request</span>
                        </button>
                        <button
                          onClick={() => triggerStatusChange('Rejected')}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-500/10"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject Request</span>
                        </button>
                      </>
                    )}
                    {activeBooking.status === 'Approved' && (
                      <button
                        onClick={() => triggerStatusChange('Completed')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
                      >
                        <FileCheck className="w-4 h-4" />
                        <span>Complete Booking</span>
                      </button>
                    )}
                    {['Pending', 'Pending Payment', 'Approved', 'Checked In'].includes(activeBooking.status) && (
                      <button
                        onClick={() => triggerStatusChange('Cancelled')}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-white/5 rounded-xl flex items-center gap-1.5 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel Request</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Audited timeline logs list */}
                {activeBooking.statusHistory?.length > 0 && (
                  <div className="border-t border-white/5 pt-5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-300">Audited State Changes Log Timeline</h4>
                    <div className="space-y-4 font-mono text-[10px] pl-4 border-l border-blue-500/20 relative ml-2">
                      {activeBooking.statusHistory.map((log: IStatusHistory, index: number) => (
                        <div key={index} className="relative py-1.5">
                          <span className={getTimelineDotColor(log.status)} />
                          <div className="text-slate-250 font-bold uppercase tracking-wider text-[10px] text-slate-300">State: {log.status}</div>
                          <div className="text-slate-500 mt-0.5 font-sans">Changed by: <span className="font-semibold text-slate-400">{log.changedBy}</span> • {new Date(log.timestamp).toLocaleString()}</div>
                          {log.remark && <div className="text-slate-400 mt-1.5 italic font-sans text-xs bg-slate-900/20 border border-white/5 p-2.5 rounded-lg leading-relaxed">Remark: "{log.remark}"</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Remark action Dialog overlay */}
      {isStatusActionOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-xl border border-white/10 max-w-sm w-full shadow-2xl space-y-4">
            <h4 className="font-display font-bold text-sm text-slate-200">
              Confirm action: Set Status to {targetStatus}?
            </h4>
            
            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">Remarks / Reason (Optional)</label>
                <textarea
                  placeholder="e.g. License checked, verified ok"
                  value={adminRemark}
                  onChange={(e) => setAdminRemark(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[80px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStatusActionOpen(false)}
                  className="bg-slate-850 hover:bg-slate-800 border border-white/5 text-slate-300 text-xs font-semibold py-2 px-3 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  disabled={statusMutation.isPending}
                >
                  {statusMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Status</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Booking Modal Overlay */}
      {isCreateOpen && createForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-8 rounded-2xl border border-white/10 max-w-4xl w-full shadow-2xl space-y-6 overflow-y-auto max-h-[90vh]">
            
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div>
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold">New Booking Entry</span>
                <h3 className="font-display font-bold text-lg text-slate-200">Register Manual Booking</h3>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-200 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 text-xs text-slate-300">
              {/* Customer Profile Column */}
              <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <User className="w-4 h-4" /> Customer Profile
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block text-[10px] uppercase">Full Name</label>
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={createForm.customerName}
                      onChange={(e) => setCreateForm({ ...createForm, customerName: e.target.value })}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block text-[10px] uppercase">Mobile No</label>
                    <input
                      type="text"
                      placeholder="Mobile Phone Number"
                      value={createForm.mobile}
                      onChange={(e) => setCreateForm({ ...createForm, mobile: e.target.value })}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-slate-250 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block text-[10px] uppercase">Email</label>
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block text-[10px] uppercase">DOB</label>
                    <input
                      type="date"
                      value={createForm.dob}
                      onChange={(e) => setCreateForm({ ...createForm, dob: e.target.value })}
                      className="w-full bg-slate-955 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block text-[10px] uppercase">Age</label>
                    <input
                      type="number"
                      value={createForm.age}
                      onChange={(e) => setCreateForm({ ...createForm, age: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-955 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block text-[10px] uppercase">Hotel Stay (Optional)</label>
                    <input
                      type="text"
                      placeholder="Hotel / Resort Name"
                      value={createForm.hotelStay}
                      onChange={(e) => setCreateForm({ ...createForm, hotelStay: e.target.value })}
                      className="w-full bg-slate-955 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block text-[10px] uppercase">Destination</label>
                    <input
                      type="text"
                      placeholder="Where to visit"
                      value={createForm.destination}
                      onChange={(e) => setCreateForm({ ...createForm, destination: e.target.value })}
                      className="w-full bg-slate-955 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-slate-400 font-semibold block text-[10px] uppercase">Residential Address</label>
                    <input
                      type="text"
                      placeholder="Full Address"
                      value={createForm.address}
                      onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                      className="w-full bg-slate-955 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Document Identity Cards */}
              <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <FileCheck className="w-4 h-4" /> Identity Credentials
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-white/5 pb-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block text-[10px] uppercase">Driving License Number</label>
                    <input
                      type="text"
                      placeholder="DL Number"
                      value={createForm.licenseNumber}
                      onChange={(e) => setCreateForm({ ...createForm, licenseNumber: e.target.value })}
                      className="w-full bg-slate-955 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block text-[10px] uppercase">Aadhaar Number (12 Digits)</label>
                    <input
                      type="text"
                      placeholder="Aadhaar Card Number"
                      value={createForm.aadhaarNumber}
                      onChange={(e) => setCreateForm({ ...createForm, aadhaarNumber: e.target.value })}
                      className="w-full bg-slate-955 border border-white/5 rounded-xl px-3 py-2 text-slate-250 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block text-[10px] uppercase">Voter ID (Optional)</label>
                    <input
                      type="text"
                      placeholder="Voter Card Ref"
                      value={createForm.voterId}
                      onChange={(e) => setCreateForm({ ...createForm, voterId: e.target.value })}
                      className="w-full bg-slate-955 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Manual creation document file uploads */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-[10px]">
                  {/* DL Front Upload */}
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block uppercase">License Front</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const r = new FileReader();
                          r.onloadend = () => setCreateForm({ ...createForm, licenseFront: r.result as string });
                          r.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-slate-450 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-600/10 file:text-blue-400 file:text-[9px] cursor-pointer"
                    />
                    {createForm.licenseFront && createForm.licenseFront !== 'manual-dl-placeholder' && (
                      <img src={createForm.licenseFront} className="h-16 object-contain rounded mt-1 border border-white/5" />
                    )}
                  </div>
                  {/* DL Back Upload */}
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block uppercase">License Back</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const r = new FileReader();
                          r.onloadend = () => setCreateForm({ ...createForm, licenseBack: r.result as string });
                          r.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-slate-450 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-600/10 file:text-blue-400 file:text-[9px] cursor-pointer"
                    />
                    {createForm.licenseBack && (
                      <img src={createForm.licenseBack} className="h-16 object-contain rounded mt-1 border border-white/5" />
                    )}
                  </div>
                  {/* Aadhaar Front Upload */}
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block uppercase">Aadhaar Front</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const r = new FileReader();
                          r.onloadend = () => {
                            const base64 = r.result as string;
                            setCreateForm({ ...createForm, aadhaarFront: base64, aadhaarFile: base64 });
                          };
                          r.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-slate-450 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-600/10 file:text-blue-400 file:text-[9px] cursor-pointer"
                    />
                    {createForm.aadhaarFront && (
                      <img src={createForm.aadhaarFront} className="h-16 object-contain rounded mt-1 border border-white/5" />
                    )}
                  </div>
                  {/* Aadhaar Back Upload */}
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block uppercase">Aadhaar Back</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const r = new FileReader();
                          r.onloadend = () => setCreateForm({ ...createForm, aadhaarBack: r.result as string });
                          r.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-slate-450 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-600/10 file:text-blue-400 file:text-[9px] cursor-pointer"
                    />
                    {createForm.aadhaarBack && (
                      <img src={createForm.aadhaarBack} className="h-16 object-contain rounded mt-1 border border-white/5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Ride Spec, Schedule, and Pricing */}
              <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <Bookmark className="w-4 h-4" /> Ride Specifications & Payments
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block text-[10px] uppercase">Select Motorbike</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsCreateBikeOpen(!isCreateBikeOpen)}
                        className="w-full bg-slate-955 border border-white/5 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer flex items-center justify-between gap-2 text-left"
                      >
                        <span>
                          {(() => {
                            const b = bikesData?.find((bike) => bike.bikeId === createForm.bikeId);
                            return b ? `${b.brand} ${b.name} (${b.registrationNumber}) [${b.status}]` : '-- Choose Scooter --';
                          })()}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      </button>
                      {isCreateBikeOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsCreateBikeOpen(false)} />
                          <div className="absolute left-0 right-0 mt-2 z-50 glass-panel border border-white/10 rounded-xl shadow-2xl p-1.5 max-h-60 overflow-y-auto">
                            <button
                              type="button"
                              onClick={() => {
                                handleCreateBikeChange('');
                                setIsCreateBikeOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                createForm.bikeId === ''
                                  ? 'bg-blue-600/20 text-blue-400 font-semibold'
                                  : 'text-slate-350 hover:bg-slate-800/60'
                              }`}
                            >
                              -- Choose Scooter --
                            </button>
                            {bikesData?.map((b) => (
                              <button
                                key={b.bikeId}
                                type="button"
                                onClick={() => {
                                  handleCreateBikeChange(b.bikeId);
                                  setIsCreateBikeOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                  createForm.bikeId === b.bikeId
                                    ? 'bg-blue-600/20 text-blue-400 font-semibold'
                                    : 'text-slate-300 hover:bg-slate-800/60'
                                }`}
                              >
                                {b.brand} {b.name} ({b.registrationNumber}) [{b.status}]
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block text-[10px] uppercase">Booking Type</label>
                    <div className="w-full bg-slate-955 border border-white/5 rounded-xl px-3 py-2 text-slate-400 text-xs select-none">
                      Rental
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block text-[10px] uppercase">Booking Status</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsCreateStatusOpen(!isCreateStatusOpen)}
                        className="w-full bg-slate-955 border border-white/5 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer flex items-center justify-between gap-2 text-left"
                      >
                        <span>{createForm.status}</span>
                        <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      </button>
                      {isCreateStatusOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsCreateStatusOpen(false)} />
                          <div className="absolute left-0 right-0 mt-2 z-50 glass-panel border border-white/10 rounded-xl shadow-2xl p-1.5 max-h-60 overflow-y-auto">
                            {[...ACTIVE_STATUS_OPTS, ...COMPLETED_STATUS_OPTS].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => {
                                  setCreateForm({ ...createForm, status: s });
                                  setIsCreateStatusOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                  createForm.status === s
                                    ? 'bg-blue-600/20 text-blue-400 font-semibold'
                                    : 'text-slate-350 hover:bg-slate-800/60'
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block text-[10px] uppercase">Pickup Date</label>
                    <input
                      type="date"
                      value={createForm.pickupDate}
                      onChange={(e) => setCreateForm({ ...createForm, pickupDate: e.target.value })}
                      className="w-full bg-slate-955 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block text-[10px] uppercase">Pickup Time</label>
                    <input
                      type="time"
                      value={createForm.pickupTime}
                      onChange={(e) => setCreateForm({ ...createForm, pickupTime: e.target.value })}
                      className="w-full bg-slate-955 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                  {createForm.bookingType === 'Rental' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-slate-400 font-semibold block text-[10px] uppercase">Return Date</label>
                        <input
                          type="date"
                          value={createForm.returnDate}
                          onChange={(e) => setCreateForm({ ...createForm, returnDate: e.target.value })}
                          className="w-full bg-slate-955 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400 font-semibold block text-[10px] uppercase">Return Time</label>
                        <input
                          type="time"
                          value={createForm.returnTime}
                          onChange={(e) => setCreateForm({ ...createForm, returnTime: e.target.value })}
                          className="w-full bg-slate-955 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block text-[10px] uppercase">Per Day Rent (₹)</label>
                    <input
                      type="number"
                      value={createForm.perDayRent}
                      onChange={(e) => setCreateForm({ ...createForm, perDayRent: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-955 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block text-[10px] uppercase">Security Deposit (₹)</label>
                    <input
                      type="number"
                      value={createForm.securityDeposit}
                      onChange={(e) => setCreateForm({ ...createForm, securityDeposit: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-955 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block text-[10px] uppercase">Total Payment (₹)</label>
                    <input
                      type="number"
                      value={createForm.totalPayment}
                      onChange={(e) => setCreateForm({ ...createForm, totalPayment: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-955 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block text-[10px] uppercase">Pending Payment (₹)</label>
                    <input
                      type="number"
                      value={createForm.pendingPayment !== undefined ? createForm.pendingPayment : createForm.totalPayment}
                      onChange={(e) => setCreateForm({ ...createForm, pendingPayment: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-955 border border-white/5 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/5 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCreate}
                  disabled={createBookingMutation.isPending}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/10"
                >
                  {createBookingMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Create Booking</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-2xl border border-red-500/10 max-w-sm w-full shadow-2xl space-y-5 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-2">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-display font-bold text-sm text-slate-200">
                Confirm Deletion
              </h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Are you sure you want to delete this booking? This will permanently erase the record and release the motorbike.
              </p>
            </div>
            
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 bg-slate-850 hover:bg-slate-800 border border-white/5 text-slate-300 text-xs font-semibold py-2.5 px-3 rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteBookingMutation.mutate(deleteTargetId);
                  setDeleteTargetId(null);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-red-500/10 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookingsPage;
