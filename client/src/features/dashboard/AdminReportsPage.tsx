import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BarChart3, Download, Printer, Loader2, IndianRupee, Calendar, FileText, Briefcase, Search, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import useSettings from '../../hooks/useSettings';
import { IBooking } from 'shared';

export const AdminReportsPage = () => {
  const { settings } = useSettings();
  const [search, setSearch] = useState('');

  // Fetch all bookings for report calculations
  const { data: bookingsData, isLoading, refetch } = useQuery({
    queryKey: ['reportsBookings'],
    queryFn: async () => {
      const { data } = await api.get('/bookings', {
        params: { limit: 1000 },
      });
      return (data.data.bookings || []) as IBooking[];
    },
  });

  const bookings = bookingsData || [];
  
  const totalBookings = bookings.length;
  
  const grossRevenue = bookings
    .filter(b => b.status !== 'Cancelled' && b.status !== 'Rejected')
    .reduce((sum, b) => sum + (b.totalPayment || 0), 0);

  const securityDepositsHeld = bookings
    .filter(b => b.status === 'Approved' || b.status === 'Checked In')
    .reduce((sum, b) => sum + (b.securityDeposit || 0), 0);

  const completedTrips = bookings.filter(b => b.status === 'Completed').length;
  const activeRentals = bookings.filter(b => b.status === 'Approved' || b.status === 'Checked In').length;

  // Export Bookings Report
  const handleExportCompleteReport = () => {
    if (bookings.length === 0) {
      toast.error('No bookings data found to export');
      return;
    }

    const headers = [
      'Reference No', 
      'Booking Date', 
      'Customer Name', 
      'Email', 
      'Phone', 
      'Motorbike', 
      'Pickup Date', 
      'Return Date', 
      'Total Days', 
      'Rent Price/Day (₹)', 
      'Security Deposit (₹)', 
      'Total Amount Paid (₹)', 
      'Status', 
      'Aadhaar Number', 
      'Destination'
    ];

    const rows = bookings.map(b => {
      let days = 1;
      if (b.pickupDate && b.returnDate) {
        const start = new Date(b.pickupDate);
        const end = new Date(b.returnDate);
        const diffTime = end.getTime() - start.getTime();
        if (!isNaN(diffTime)) {
          days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }
      }

      return [
        b.bookingNumber || '',
        b.bookingDate ? new Date(b.bookingDate).toLocaleDateString() : '',
        b.customerName || '',
        b.email || '',
        b.mobile || '',
        b.bikeName || b.bikeId || '',
        b.pickupDate ? new Date(b.pickupDate).toLocaleDateString() : '',
        b.returnDate ? new Date(b.returnDate).toLocaleDateString() : '',
        days,
        b.perDayRent || 0,
        b.securityDeposit || 0,
        b.totalPayment || 0,
        b.status || '',
        b.aadhaarNumber || '',
        b.destination || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${(settings?.dealershipName || 'Lykan_Rides').replace(/\s+/g, '_')}_Complete_Bookings_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Complete Bookings Report exported successfully!');
  };

  // Export Invoice Ledger
  const handleExportInvoiceLedger = () => {
    if (bookings.length === 0) {
      toast.error('No invoices found to export');
      return;
    }

    const headers = [
      'Invoice Reference',
      'Invoice Date',
      'Billing Customer',
      'Rented Motorbike',
      'Registration Number',
      'Rental Day Rate (₹)',
      'Deposit Paid (₹)',
      'Gross Total Amount (₹)',
      'Payment Status'
    ];

    const rows = bookings.map(b => [
      b.bookingNumber || '',
      b.bookingDate ? new Date(b.bookingDate).toLocaleDateString() : '',
      b.customerName || '',
      b.bikeName || b.bikeId || '',
      b.registrationNumber || '',
      b.perDayRent || 0,
      b.securityDeposit || 0,
      b.totalPayment || 0,
      b.status === 'Completed' || b.status === 'Approved' ? 'Paid' : b.status === 'Cancelled' ? 'Refunded' : 'Unpaid'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${(settings?.dealershipName || 'Lykan_Rides').replace(/\s+/g, '_')}_Invoice_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Invoice Ledger exported successfully!');
  };

  const handlePrintInvoice = (bookingNumber: string) => {
    window.open(`/booking/success/${bookingNumber}`, '_blank');
  };

  const filteredBookings = bookings.filter(b => 
    b.bookingNumber?.toLowerCase().includes(search.toLowerCase()) ||
    b.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    b.mobile?.toLowerCase().includes(search.toLowerCase()) ||
    (b.bikeName || b.bikeId || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      Pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      Approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'Checked In': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'In Progress': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      Completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      Cancelled: 'bg-slate-700/10 text-slate-400 border-slate-700/20',
      Rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return `inline-flex text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${styles[status] || 'bg-slate-800 text-slate-400 border-slate-700/20'}`;
  };

  return (
    <div className="space-y-8">
      {/* Top action header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h2 className="text-2xl font-extrabold font-display text-gradient">Reports & Invoices</h2>
          <p className="text-slate-400 text-xs mt-1">Analyze gross revenue, view invoice collections, and download Excel/CSV ledger records.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <button
            onClick={handleExportInvoiceLedger}
            className="flex-1 sm:flex-none bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border border-slate-800/80 font-semibold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export Invoice Ledger</span>
          </button>
          <button
            onClick={handleExportCompleteReport}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-3 px-5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 transition-all cursor-pointer"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Export Bookings Report</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <span className="text-slate-400 text-xs">Generating analytical reports ledger...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card p-6 rounded-2xl border border-white/5 shadow-lg relative group">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-semibold text-slate-400">Gross Revenue Collected</span>
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-200">₹{grossRevenue.toLocaleString('en-IN')}</h3>
              <p className="text-[10px] text-slate-500 mt-2">Sum of active and completed bookings</p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-white/5 shadow-lg relative group">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-semibold text-slate-400">Deposits Currently Held</span>
                <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                  <Briefcase className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-200">₹{securityDepositsHeld.toLocaleString('en-IN')}</h3>
              <p className="text-[10px] text-slate-500 mt-2">Active rental security deposits</p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-white/5 shadow-lg relative group">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-semibold text-slate-400">Total Bookings Serviced</span>
                <div className="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-200">{totalBookings}</h3>
              <p className="text-[10px] text-slate-500 mt-2">Chronological database total</p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-white/5 shadow-lg relative group">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-semibold text-slate-400">Completed & Active Trips</span>
                <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-200">{completedTrips} / {activeRentals}</h3>
              <p className="text-[10px] text-slate-500 mt-2">Completed trips vs current rentals</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-lg font-bold text-slate-300 font-display">Invoice Ledger Collections</h3>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute inset-y-0 left-3.5 my-auto w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search invoice ref, customer..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => refetch()}
                  className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-white/5 text-slate-400 hover:text-slate-200 rounded-xl"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="glass-card rounded-2xl border border-white/5 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-slate-900/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-4 px-6">Invoice Ref</th>
                      <th className="py-4 px-6">Billing Date</th>
                      <th className="py-4 px-6">Billing Customer</th>
                      <th className="py-4 px-6">Motorbike</th>
                      <th className="py-4 px-6">Total Amount Paid</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Invoice Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          No matching invoice receipts found.
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((b) => (
                        <tr key={b._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-6 font-mono font-bold text-blue-400">{b.bookingNumber}</td>
                          <td className="py-4 px-6 text-slate-400">
                            {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-4 px-6 font-medium text-slate-200">{b.customerName}</td>
                          <td className="py-4 px-6 text-slate-400">{b.bikeName || b.bikeId}</td>
                          <td className="py-4 px-6 font-black text-slate-200">₹{(b.totalPayment || 0).toLocaleString('en-IN')}</td>
                          <td className="py-4 px-6">
                            <span className={getStatusStyle(b.status)}>{b.status}</span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => handlePrintInvoice(b.bookingNumber)}
                              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 font-semibold text-[10px] py-2 px-3 rounded-lg border border-white/5 transition-all cursor-pointer"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Print Invoice</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReportsPage;
