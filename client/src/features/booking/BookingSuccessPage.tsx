import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Printer, CheckCircle, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    Pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    Approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Checked In': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'In Progress': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    Completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Cancelled: 'bg-slate-700/10 text-slate-400 border-slate-700/20',
    Rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return `inline-flex items-center text-[9px] font-semibold px-2 py-0.5 rounded-full border ${styles[status] || 'bg-slate-800 text-slate-400 border-slate-700/20'}`;
};

export const BookingSuccessPage = () => {
  const { bookingNumber } = useParams<{ bookingNumber: string }>();
  const navigate = useNavigate();

  // Fetch the booking details publicly using React Query
  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['publicBookingDetails', bookingNumber],
    queryFn: async () => {
      if (!bookingNumber) return null;
      const { data } = await api.get(`/bookings/reference/${bookingNumber}`);
      return data.data.booking;
    },
    enabled: !!bookingNumber,
  });

  const handlePrintReceipt = () => {
    if (!booking) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Booking Invoice - ${booking.bookingNumber}</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                color: #1e293b;
                margin: 40px;
                background: #fff;
                line-height: 1.5;
              }
              .header {
                background: #0f172a;
                color: #ffffff;
                padding: 24px 32px;
                border-radius: 12px;
                margin-bottom: 30px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              }
              .header-top {
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              .dealership-info {
                display: flex;
                align-items: center;
                gap: 16px;
              }
              .dealership-info img {
                height: 44px;
                width: auto;
                object-fit: contain;
              }
              .dealership-info p {
                margin: 0;
                font-size: 11px;
                color: #94a3b8;
                line-height: 1.5;
              }
              .invoice-meta {
                text-align: right;
              }
              .invoice-meta h2 {
                margin: 0;
                font-size: 18px;
                color: #ffffff;
                font-weight: 800;
                letter-spacing: 0.05em;
              }
              .invoice-meta p {
                margin: 2px 0 0 0;
                font-size: 12px;
                color: #cbd5e1;
                font-family: monospace;
              }
              .invoice-meta .status-badge {
                display: inline-block;
                margin-top: 8px;
                padding: 4px 12px;
                font-size: 9px;
                font-weight: 800;
                background: #22c55e;
                color: #ffffff;
                border-radius: 9999px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
              }
              .invoice-meta .status-badge.pending {
                background: #eab308;
              }
              .invoice-meta .status-badge.cancelled,
              .invoice-meta .status-badge.rejected {
                background: #ef4444;
              }
              .section-title {
                font-size: 11px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: #0f172a;
                border-bottom: 2px solid #cbd5e1;
                padding-bottom: 6px;
                margin-top: 5px;
                margin-bottom: 16px;
              }
              .grid {
                display: grid;
                grid-template-cols: 1fr 1fr;
                gap: 24px;
              }
              .card {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
              }
              .field {
                font-size: 11px;
                margin-bottom: 8px;
                display: flex;
                border-bottom: 1px dashed #e2e8f0;
                padding-bottom: 6px;
              }
              .field:last-child {
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
              }
              .field span {
                color: #64748b;
                font-weight: 700;
                width: 130px;
                flex-shrink: 0;
                text-transform: uppercase;
                font-size: 9px;
                letter-spacing: 0.05em;
              }
              .field strong {
                color: #0f172a;
                flex-grow: 1;
                font-weight: 600;
              }
              .financial-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 25px;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                overflow: hidden;
              }
              .financial-table th, .financial-table td {
                font-size: 11px;
                text-align: left;
                padding: 12px 16px;
              }
              .financial-table th {
                background-color: #f1f5f9;
                color: #334155;
                font-weight: 800;
                text-transform: uppercase;
                font-size: 9px;
                letter-spacing: 0.05em;
              }
              .financial-table td {
                border-bottom: 1px solid #e2e8f0;
                color: #334155;
              }
              .financial-table tr:last-child td {
                border-bottom: none;
              }
              .financial-table td.total {
                font-weight: 800;
                color: #0f172a;
                font-size: 13px;
              }
              .images-section {
                page-break-before: auto;
              }
              .images-grid {
                display: grid;
                grid-template-cols: 1fr 1fr;
                gap: 20px;
                margin-top: 15px;
              }
              .img-box {
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                overflow: hidden;
                padding: 12px;
                background: #f8fafc;
                text-align: center;
              }
              .img-box span {
                display: block;
                font-size: 9px;
                font-weight: 800;
                color: #64748b;
                text-transform: uppercase;
                margin-bottom: 8px;
                letter-spacing: 0.05em;
              }
              .img-box img {
                max-width: 100%;
                max-height: 150px;
                object-fit: contain;
                border-radius: 4px;
                border: 1px solid #e2e8f0;
                background: #fff;
              }
              .footer {
                text-align: center;
                font-size: 9px;
                color: #94a3b8;
                margin-top: 40px;
                border-top: 1px solid #e2e8f0;
                padding-top: 20px;
              }
              @media print {
                body { margin: 10px; }
                .img-box { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body onload="window.print();">
            <div class="header">
              <div class="header-top">
                <div class="dealership-info">
                  <img src="https://lykanrides.com/wp-content/uploads/2025/03/logo.png" alt="Lykan Rides Logo" />
                  <div>
                    <p style="font-weight: 600;">Haridwar Bypass, Dehradun, UK</p>
                    <p>Phone: +91 98081 24250 | Website: https://lykanrides.com</p>
                    <p>GSTIN: 05AAACV7744M1Z2</p>
                  </div>
                </div>
                <div class="invoice-meta">
                  <h2>RENTAL INVOICE</h2>
                  <p>Ref: <strong>${booking.bookingNumber}</strong></p>
                  <span class="status-badge ${booking.status.toLowerCase()}">${booking.status}</span>
                </div>
              </div>
            </div>

            <div class="grid">
              <div class="card">
                <div class="section-title">Customer Profile</div>
                <div class="field"><span>Full Name:</span> <strong>${booking.customerName}</strong></div>
                <div class="field"><span>Mobile Number:</span> <strong>${booking.mobile}</strong></div>
                ${booking.email ? `<div class="field"><span>Email Address:</span> <strong>${booking.email}</strong></div>` : ''}
                <div class="field"><span>Age / DOB:</span> <strong>${booking.age} Years (${booking.dob ? new Date(booking.dob).toLocaleDateString() : 'N/A'})</strong></div>
                ${booking.address ? `<div class="field"><span>Residential Address:</span> <strong>${booking.address}</strong></div>` : ''}
                ${booking.hotelStay ? `<div class="field"><span>Local Hotel Stay:</span> <strong>${booking.hotelStay}</strong></div>` : ''}
                ${booking.destination ? `<div class="field"><span>Where to Go:</span> <strong>${booking.destination}</strong></div>` : ''}
                <div class="field"><span>Aadhaar Number:</span> <strong>${booking.aadhaarNumber || 'N/A'}</strong></div>
                <div class="field"><span>Driving License:</span> <strong>${booking.licenseNumber || 'N/A'}</strong></div>
                ${booking.voterId ? `<div class="field"><span>Voter ID Card:</span> <strong>${booking.voterId}</strong></div>` : ''}
              </div>
              
              <div class="card">
                <div class="section-title">Scooter Details</div>
                <div class="field"><span>Vehicle Model:</span> <strong>${booking.bikeName}</strong></div>
                <div class="field"><span>Registration No:</span> <strong style="text-transform: uppercase;">${booking.registrationNumber}</strong></div>
                <div class="field"><span>Vehicle ID Code:</span> <strong>${booking.bikeId}</strong></div>
                <div class="field"><span>Booking Type:</span> <strong>Rental</strong></div>
                <div class="field"><span>Scheduled Pickup:</span> <strong>${booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString() : 'N/A'} @ ${booking.pickupTime}</strong></div>
                ${booking.returnDate ? `<div class="field"><span>Scheduled Return:</span> <strong>${booking.returnDate ? new Date(booking.returnDate).toLocaleDateString() : 'N/A'} @ ${booking.returnTime}</strong></div>` : ''}
                <div class="field"><span>Rental Duration:</span> <strong>${booking.duration}</strong></div>
              </div>
            </div>

            <table class="financial-table">
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th style="text-align: right; width: 200px;">Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Per Day Rent Fee</td>
                  <td style="text-align: right;">₹${booking.perDayRent || 0}</td>
                </tr>
                <tr>
                  <td>Refundable Security Deposit</td>
                  <td style="text-align: right;">₹${booking.securityDeposit || 0}</td>
                </tr>
                <tr style="background-color: #f8fafc; font-weight: bold; border-top: 2px solid #e2e8f0;">
                  <td style="color: #0f172a;">Total Amount Paid / Due</td>
                  <td style="text-align: right; color: #0f172a;" class="total">₹${booking.totalPayment || 0}</td>
                </tr>
              </tbody>
            </table>

            <div class="images-section">
              <div class="section-title" style="margin-top: 30px; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px;">Uploaded Verification Documents</div>
              
              ${(booking.licenseFront || booking.licenseBack) ? `
                <div style="margin-top: 15px;">
                  <div style="font-size: 10px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.05em;">Driving License</div>
                  <div class="images-grid">
                    ${booking.licenseFront ? `
                      <div class="img-box">
                        <span>Front Copy</span>
                        <img src="${booking.licenseFront}" />
                      </div>
                    ` : ''}
                    ${booking.licenseBack ? `
                      <div class="img-box">
                        <span>Back Copy</span>
                        <img src="${booking.licenseBack}" />
                      </div>
                    ` : ''}
                  </div>
                </div>
              ` : ''}

              ${(booking.aadhaarFront || booking.aadhaarBack) ? `
                <div style="margin-top: 20px;">
                  <div style="font-size: 10px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.05em;">Aadhaar Card</div>
                  <div class="images-grid">
                    ${booking.aadhaarFront ? `
                      <div class="img-box">
                        <span>Front Copy</span>
                        <img src="${booking.aadhaarFront}" />
                      </div>
                    ` : ''}
                    ${booking.aadhaarBack ? `
                      <div class="img-box">
                        <span>Back Copy</span>
                        <img src="${booking.aadhaarBack}" />
                      </div>
                    ` : ''}
                  </div>
                </div>
              ` : ''}
            </div>

            <div class="footer">
              <p>Thank you for choosing Lykan Rides. Please present this invoice copy along with physical ID cards at the counter.</p>
              <p>System Invoice Generated on ${new Date().toLocaleString()}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <span className="text-slate-400 text-xs">Loading booking summary...</span>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
        <ShieldCheck className="w-12 h-12 text-red-500" />
        <h3 className="text-slate-200 font-bold text-base">Booking Reference Invalid</h3>
        <p className="text-slate-400 text-xs max-w-xs">Could not find record for reference {bookingNumber}. Please check details.</p>
        <button
          onClick={() => navigate('/book')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl cursor-pointer"
        >
          Book Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col items-center">
      {/* Success banner */}
      <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 animate-bounce">
        <CheckCircle className="w-7 h-7" />
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold text-gradient">Booking Submitted!</h2>
        <p className="text-slate-500 text-xs mt-1">Pending administrative review at showroom</p>
      </div>

      {/* Invoice Card */}
      <div className="w-full bg-slate-900/40 border border-white/5 rounded-2xl p-6 space-y-6 shadow-xl max-w-2xl">
        {/* Dealership & Brand Header */}
        <div className="w-full text-center space-y-2 border-b border-white/5 pb-4">
          <div className="flex items-center justify-center gap-2 text-white pb-1">
            <img src="https://lykanrides.com/wp-content/uploads/2025/03/logo.png" alt="Lykan Rides Logo" className="h-10 w-auto object-contain" />
          </div>
          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
            Haridwar Bypass, Dehradun, UK | Website: https://lykanrides.com | GSTIN: 05AAACV7744M1Z2
          </p>
        </div>

        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <div>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Reference No</span>
            <strong className="text-blue-400 font-mono text-sm">{booking.bookingNumber}</strong>
          </div>
          <span className={getStatusBadge(booking.status)}>
            {booking.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Customer Details */}
          <div className="space-y-4 bg-slate-950/40 p-5 border border-slate-900 rounded-xl">
            <h4 className="font-bold text-[10px] text-blue-400 uppercase tracking-wider border-b border-blue-500/10 pb-1.5">Customer Profile</h4>
            <div className="space-y-2.5 text-slate-300">
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Full Name</span>
                <span className="text-xs font-semibold text-slate-200">{booking.customerName}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Mobile Number</span>
                <span className="text-xs font-semibold text-slate-200 font-mono">{booking.mobile}</span>
              </div>
              {booking.email && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Email Address</span>
                  <span className="text-xs font-semibold text-slate-200 break-all">{booking.email}</span>
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Age / DOB</span>
                <span className="text-xs font-semibold text-slate-200">
                  {booking.age} Years ({booking.dob ? new Date(booking.dob).toLocaleDateString() : 'N/A'})
                </span>
              </div>
              {booking.address && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Residential Address</span>
                  <span className="text-xs font-semibold text-slate-300">{booking.address}</span>
                </div>
              )}
              {booking.hotelStay && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Local Hotel Stay</span>
                  <span className="text-xs font-semibold text-slate-300">{booking.hotelStay}</span>
                </div>
              )}
              {booking.destination && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Where to Go</span>
                  <span className="text-xs font-semibold text-slate-300">{booking.destination}</span>
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Aadhaar Number</span>
                <span className="text-xs font-semibold text-slate-200 font-mono">{booking.aadhaarNumber || 'N/A'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Driving License</span>
                <span className="text-xs font-semibold text-slate-200 font-mono">{booking.licenseNumber || 'N/A'}</span>
              </div>
              {booking.voterId && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Voter ID Card</span>
                  <span className="text-xs font-semibold text-slate-200 font-mono">{booking.voterId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle & Timelines */}
          <div className="space-y-4 bg-slate-950/40 p-5 border border-slate-900 rounded-xl">
            <h4 className="font-bold text-[10px] text-blue-400 uppercase tracking-wider border-b border-blue-500/10 pb-1.5">Scooter Details</h4>
            <div className="space-y-2.5 text-slate-300">
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Vehicle Model</span>
                <span className="text-xs font-semibold text-slate-200">{booking.bikeName}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Registration No</span>
                <span className="text-xs font-semibold text-blue-400 font-mono uppercase">{booking.registrationNumber}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Vehicle ID Code</span>
                <span className="text-xs font-semibold text-slate-200 font-mono">{booking.bikeId}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Booking Type</span>
                <span className="text-xs font-semibold text-slate-200">Rental</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Scheduled Pickup</span>
                <span className="text-xs font-semibold text-slate-200">
                  {booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString() : 'N/A'} @ {booking.pickupTime}
                </span>
              </div>
              {booking.returnDate && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Scheduled Return</span>
                  <span className="text-xs font-semibold text-slate-200">
                    {booking.returnDate ? new Date(booking.returnDate).toLocaleDateString() : 'N/A'} @ {booking.returnTime}
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Rental Duration</span>
                <span className="text-xs font-bold text-blue-400">{booking.duration}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-2 text-xs">
          <h4 className="font-bold text-[10px] text-blue-400 uppercase tracking-wider">Pricing Estimates</h4>
          <div className="flex justify-between text-slate-400">
            <span>Per Day rent:</span>
            <span className="font-mono text-slate-200">₹{booking.perDayRent || 0}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Refundable Deposit:</span>
            <span className="font-mono text-slate-200">₹{booking.securityDeposit || 0}</span>
          </div>
          <div className="flex justify-between text-slate-200 font-bold border-t border-white/5 pt-2 text-sm">
            <span>Total Payment:</span>
            <span className="font-mono text-blue-400">₹{booking.totalPayment || 0}</span>
          </div>
        </div>

        {/* Uploaded Documents */}
        <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-3">
          <h4 className="font-bold text-[10px] text-blue-400 uppercase tracking-wider">Uploaded Documents</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {booking.licenseFront && (
              <div className="space-y-1 text-center">
                <span className="text-[8px] text-slate-500 font-semibold block uppercase">DL Front</span>
                <div className="aspect-[3/2] rounded-lg overflow-hidden border border-white/5 bg-slate-950/80 flex items-center justify-center">
                  <img src={booking.licenseFront} alt="DL Front" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            {booking.licenseBack && (
              <div className="space-y-1 text-center">
                <span className="text-[8px] text-slate-500 font-semibold block uppercase">DL Back</span>
                <div className="aspect-[3/2] rounded-lg overflow-hidden border border-white/5 bg-slate-950/80 flex items-center justify-center">
                  <img src={booking.licenseBack} alt="DL Back" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            {booking.aadhaarFront && (
              <div className="space-y-1 text-center">
                <span className="text-[8px] text-slate-500 font-semibold block uppercase">Aadhaar Front</span>
                <div className="aspect-[3/2] rounded-lg overflow-hidden border border-white/5 bg-slate-950/80 flex items-center justify-center">
                  <img src={booking.aadhaarFront} alt="Aadhaar Front" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            {booking.aadhaarBack && (
              <div className="space-y-1 text-center">
                <span className="text-[8px] text-slate-500 font-semibold block uppercase">Aadhaar Back</span>
                <div className="aspect-[3/2] rounded-lg overflow-hidden border border-white/5 bg-slate-950/80 flex items-center justify-center">
                  <img src={booking.aadhaarBack} alt="Aadhaar Back" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 w-full max-w-2xl">
        <button
          onClick={handlePrintReceipt}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/10 transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Save Receipt (PDF)</span>
        </button>
        <button
          onClick={() => navigate('/book')}
          className="flex-1 bg-slate-800 hover:bg-slate-700 border border-white/5 text-slate-300 font-semibold text-xs py-3 px-4 rounded-xl cursor-pointer transition-colors"
        >
          Book Another
        </button>
      </div>
    </div>
  );
};

export default BookingSuccessPage;
