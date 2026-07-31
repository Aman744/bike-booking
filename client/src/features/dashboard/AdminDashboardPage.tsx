import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Bike, Calendar, FileClock, ShieldCheck, Download, Printer, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { IBooking } from 'shared';
import useSettings from '../../hooks/useSettings';
import useAuth from '../../hooks/useAuth';



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

export const AdminDashboardPage = () => {
  const { settings } = useSettings();
  const { admin } = useAuth();

  // Query actual dashboard statistics from backend
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const { data } = await api.get('/bookings/stats');
      return data.data;
    },
  });

  const commonBookingUrl = `${window.location.origin}/book`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=020617&data=${encodeURIComponent(commonBookingUrl)}`;

  const handleDownloadQR = async () => {
    const dealershipNameText = settings?.dealershipName || 'Lykan Rides';
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw card background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 900);

    // Draw border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 596, 896);

    // Helper to wrap text
    const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
      const words = text.split(' ');
      let line = '';
      let currentY = y;
      
      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, x, currentY);
          line = words[n] + ' ';
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, currentY);
    };

    // Helper to load image
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed load: ' + src));
        img.src = src;
      });
    };

    try {
      // 1. Load QR code image
      const qrImg = await loadImage(qrCodeImageUrl);

      // 2. Load Logo image (optional, fallback if fails)
      let logoImg: HTMLImageElement | null = null;
      if (settings?.dealershipLogo) {
        try {
          logoImg = await loadImage(settings.dealershipLogo);
        } catch (e) {
          console.warn('Failed to load logo image for canvas poster', e);
        }
      }

      // Draw Logo
      if (logoImg) {
        const maxW = 240;
        const maxH = 70;
        let w = logoImg.width;
        let h = logoImg.height;
        const ratio = w / h;
        
        if (w > maxW) {
          w = maxW;
          h = w / ratio;
        }
        if (h > maxH) {
          h = maxH;
          w = h * ratio;
        }
        ctx.drawImage(logoImg, 300 - w / 2, 70, w, h);
      }

      // Draw Dealership Name text
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0f172a';
      ctx.font = '800 28px Outfit, Segoe UI, sans-serif';
      ctx.fillText(dealershipNameText, 300, logoImg ? 180 : 120);

      // Draw Subtitle
      ctx.fillStyle = '#3b82f6';
      ctx.font = '600 16px Outfit, Segoe UI, sans-serif';
      ctx.fillText('Showroom Booking Portal', 300, logoImg ? 215 : 155);

      // Draw QR Box
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 2;
      ctx.strokeRect(165, logoImg ? 250 : 190, 270, 270);
      
      // Draw QR Image
      ctx.drawImage(qrImg, 175, logoImg ? 260 : 200, 250, 250);

      // Draw Instruction text
      ctx.fillStyle = '#475569';
      ctx.font = '500 15px Segoe UI, sans-serif';
      const instr = 'Scan this QR code with your mobile camera to select your scooter and complete your rental booking instantly.';
      wrapText(instr, 300, logoImg ? 570 : 510, 420, 24);

      // Draw Footer
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 12px Outfit, Segoe UI, sans-serif';
      ctx.fillText(`POWERED BY ${dealershipNameText.toUpperCase()}`, 300, 830);

      // Download
      const dataUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `${dealershipNameText.replace(/\s+/g, '_')}_Showroom_QR_Poster.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('Canvas render error, falling back to raw QR download', err);
      // Fallback
      const link = document.createElement('a');
      link.href = qrCodeImageUrl;
      link.download = `${dealershipNameText.replace(/\s+/g, '_')}_QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank');
    const dealershipLogoHtml = settings?.dealershipLogo 
      ? `<img src="${settings.dealershipLogo}" style="height: 60px; object-fit: contain; margin-bottom: 10px;" />` 
      : '';
    const dealershipNameText = settings?.dealershipName || 'Lykan Rides';

    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Showroom QR Code - ${dealershipNameText}</title>
            <style>
              body { 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                font-family: 'Outfit', 'Segoe UI', Helvetica, sans-serif; 
                margin: 0; 
                background-color: #fafafa;
                color: #1e293b;
              }
              .poster-card {
                background: #ffffff;
                border: 2px solid #e2e8f0;
                border-radius: 24px;
                padding: 40px;
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
              }
              .qr-box {
                padding: 20px;
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                margin: 20px 0;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
              }
              .qr-img { width: 260px; height: 260px; }
              h1 { font-size: 24px; font-weight: 800; color: #0f172a; margin: 5px 0 0 0; }
              p { font-size: 14px; color: #475569; margin: 8px 0 0 0; max-width: 320px; line-height: 1.5; }
              .footer { font-size: 11px; color: #94a3b8; margin-top: 20px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            <div class="poster-card">
              ${dealershipLogoHtml}
              <h1>${dealershipNameText}</h1>
              <p style="font-weight: 500; font-size: 16px; color: #3b82f6; margin-top: 4px;">Showroom Booking Portal</p>
              
              <div class="qr-box">
                <img class="qr-img" src="${qrCodeImageUrl}" />
              </div>
              
              <p>Scan this QR code with your mobile camera to select your scooter and complete your rental booking instantly.</p>
              <div class="footer">Powered by ${dealershipNameText}</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <span className="text-slate-400 text-xs">Loading dashboard analytics...</span>
      </div>
    );
  }

  const stats = [
    { label: 'Total Fleet', value: statsData?.totalBikes || '0', icon: Bike, desc: 'Registered showroom bikes', color: 'text-blue-500 bg-blue-500/5 border-blue-500/10' },
    { label: 'Pending Bookings', value: statsData?.pendingBookings || '0', icon: FileClock, desc: 'Awaiting approvals', color: (statsData?.pendingBookings || 0) > 0 ? 'text-yellow-500 bg-yellow-500/5 border-yellow-500/10 animate-pulse' : 'text-slate-400 bg-slate-900/5 border-slate-800/10' },
    { label: 'Confirmed bookings', value: statsData?.approvedBookings || '0', icon: ShieldCheck, desc: 'Approved entries', color: 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10' },
    { label: 'New Bookings Today', value: statsData?.todayInquiries || '0', icon: Calendar, desc: 'Customer submissions today', color: 'text-purple-500 bg-purple-500/5 border-purple-500/10' },
  ];

  const bikeStatusData = statsData?.bikeStatusDistribution || [];

  return (
    <div className="space-y-8">
      {/* Top welcome section */}
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold font-display text-gradient">
            {settings?.dealershipName ? `${settings.dealershipName} Admin` : 'Console Control Panel'}
          </h2>
          <p className="text-slate-400 text-xs mt-1">Hello, {admin?.name || 'Administrator'} • Role: {admin?.role || 'Viewer'}</p>
        </div>
      </header>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card p-6 rounded-2xl border border-white/5 shadow-lg relative group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">{stat.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-3xl font-extrabold text-white mb-1 font-display tracking-tight">{stat.value}</h3>
              <p className="text-[10px] text-slate-500 font-medium">{stat.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Charts / Data visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bookings Trend Area Chart */}
        <div className="glass-card p-6 rounded-2xl border border-white/5 shadow-xl lg:col-span-2 flex flex-col justify-between">
          <div className="mb-6">
            <h3 className="font-display font-bold text-base text-slate-200">Rentals Trend</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Active customer rental allocations (7d range)</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={statsData?.rentalsTrendData || []}>
                <defs>
                  <linearGradient id="colorRentals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="rentals" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRentals)" name="Rentals" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bike Utilization Pie Chart */}
        <div className="glass-card p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-base text-slate-200">Fleet Allocation</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Current state distribution of registered motorbikes</p>
          </div>
          <div className="h-48 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bikeStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {bikeStatusData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white font-display">{statsData?.totalBikes || 0}</span>
              <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">Total Fleet</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {bikeStatusData.map((entry: any) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                <span className="text-xs text-slate-400">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings Feed Table */}
        <div className="glass-card p-6 rounded-2xl border border-white/5 shadow-xl overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-base text-slate-200">Recent Booking Log</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Incoming customer reservation stream details</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pl-2">Reference ID</th>
                  <th className="pb-3">Client Name</th>
                  <th className="pb-3">Motorbike</th>
                  <th className="pb-3">Log Type</th>
                  <th className="pb-3">Target Date</th>
                  <th className="pb-3 text-right pr-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {!statsData?.recentBookings?.length ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Awaiting scans from your customer entrypoints.
                    </td>
                  </tr>
                ) : (
                  statsData.recentBookings.map((bkg: IBooking) => (
                    <tr key={bkg._id} className="hover:bg-white/2 transition-colors">
                      <td className="py-3.5 pl-2 font-mono font-bold text-blue-400">{bkg.bookingNumber}</td>
                      <td className="py-3.5 font-medium text-slate-200">{bkg.customerName}</td>
                      <td className="py-3.5 text-slate-400">
                        {bkg.bikeName || (typeof bkg.bike === 'object' && bkg.bike ? (bkg.bike as any).name : 'Unknown')}
                        <span className="text-[10px] font-mono text-slate-500 block uppercase">
                          {bkg.registrationNumber || (typeof bkg.bike === 'object' && bkg.bike ? (bkg.bike as any).registrationNumber : 'N/A')}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-400">{bkg.bookingType}</td>
                      <td className="py-3.5 text-slate-400">{bkg.bookingDate ? new Date(bkg.bookingDate).toLocaleDateString() : 'N/A'}</td>
                      <td className="py-3.5 text-right pr-2">
                        <span className={getStatusBadge(bkg.status)}>{bkg.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Common booking QR Code Card */}
        <div className="glass-card p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col justify-between items-center text-center space-y-4">
          <div className="w-full flex items-center justify-between border-b border-white/5 pb-3">
            <div className="text-left">
              <h3 className="font-display font-bold text-base text-slate-200">Showroom QR Portal</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Common booking scan code for showroom walk-ins</p>
            </div>
            {/* Logo and Name display */}
            <div className="flex items-center gap-1.5 bg-slate-900/40 px-2 py-1 rounded-lg border border-white/5">
              {settings?.dealershipLogo ? (
                <img 
                  src={settings.dealershipLogo} 
                  alt="Logo" 
                  className="h-4.5 object-contain" 
                />
              ) : (
                <span className="text-[9px] font-bold text-blue-400 font-display">
                  {settings?.dealershipName || 'Lykan Rides'}
                </span>
              )}
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl shadow-lg border border-slate-200 flex items-center justify-center">
            <img src={qrCodeImageUrl} alt="Common Showroom Booking QR" className="w-36 h-36 object-contain" />
          </div>

          <p className="text-[10px] text-slate-400 leading-normal font-sans">
            Customers scanning this poster can select their vehicle from all showroom <strong>Available</strong> scooters at <strong>{settings?.dealershipName || 'Lykan Rides'}</strong> directly on their devices.
          </p>

          <div className="flex gap-3 w-full pt-1">
            <button
              onClick={handleDownloadQR}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/10 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Save PNG</span>
            </button>
            <button
              onClick={handlePrintQR}
              className="flex-1 bg-slate-800 hover:bg-slate-700 border border-white/5 text-slate-300 font-semibold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Poster</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
