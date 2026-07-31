import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Search, Bike, Edit, Trash2, QrCode, Download, Printer, Loader2, X, RefreshCw, Upload } from 'lucide-react';
import { bikeSchema, updateBikeSchema, BikeInput } from 'shared';
import api from '../../services/api';
import { IBike } from 'shared';

const BRANDS = ['Yamaha', 'KTM', 'Royal Enfield', 'Kawasaki', 'Honda', 'Suzuki', 'Hero', 'Bajaj', 'TVS', 'Harley Davidson'];
const STATUSES = ['Available', 'Booked', 'Maintenance', 'Inactive'];

export const BikeInventoryPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeBike, setActiveBike] = useState<IBike | null>(null);
  const [activeQR, setActiveQR] = useState<{ name: string; qr: string } | null>(null);

  // Fetch bikes list query
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['bikesList', page, search, brandFilter, statusFilter],
    queryFn: async () => {
      const { data } = await api.get('/bikes', {
        params: { page, limit: 8, search, brand: brandFilter, status: statusFilter },
      });
      return data.data;
    },
  });

  // Bike create form setup
  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAddForm,
    setValue: setAddValue,
    watch: watchAdd,
    formState: { errors: addErrors },
  } = useForm<BikeInput>({
    resolver: zodResolver(bikeSchema),
    defaultValues: {
      name: '',
      brand: '',
      model: '',
      registrationNumber: '',
      engineCC: 150,
      fuelType: 'Petrol',
      color: '',
      status: 'Available',
      image: '',
    },
  });

  // Bike edit form setup
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEditForm,
    setValue: setEditValue,
    watch: watchEdit,
    formState: { errors: editErrors },
  } = useForm({
    resolver: zodResolver(updateBikeSchema),
  });

  const addImageVal = watchAdd('image');
  const editImageVal = watchEdit('image');

  // Image Upload handler (Base64 conversion)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEditMode: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image file must be smaller than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (isEditMode) {
          setEditValue('image', base64);
        } else {
          setAddValue('image', base64);
        }
        toast.success('Image loaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: BikeInput) => {
      const { data } = await api.post('/bikes', payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Motorbike registered successfully!');
      setIsAddModalOpen(false);
      resetAddForm();
      queryClient.invalidateQueries({ queryKey: ['bikesList'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to register vehicle');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; data: any }) => {
      const { data } = await api.put(`/bikes/${payload.id}`, payload.data);
      return data;
    },
    onSuccess: () => {
      toast.success('Motorbike details updated successfully!');
      setIsEditModalOpen(false);
      setActiveBike(null);
      queryClient.invalidateQueries({ queryKey: ['bikesList'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Update failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/bikes/${id}`);
      return data;
    },
    onSuccess: () => {
      toast.success('Motorbike soft-deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['bikesList'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete motorbike');
    },
  });

  const qrMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/bikes/${id}/qr`);
      return data.data.qrCode;
    },
    onSuccess: () => {
      toast.success('QR Code regenerated successfully');
      queryClient.invalidateQueries({ queryKey: ['bikesList'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to regenerate QR code');
    },
  });

  const onAddSubmit = (data: BikeInput) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: any) => {
    if (!activeBike?._id) return;
    updateMutation.mutate({ id: activeBike._id, data });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name} from inventory?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleEditClick = (bike: IBike) => {
    setActiveBike(bike);
    resetEditForm(bike);
    setIsEditModalOpen(true);
  };

  const handleDownloadQR = (name: string, qr: string) => {
    const link = document.createElement('a');
    link.href = qr;
    link.download = `QR_${name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && activeQR) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code - ${activeQR.name}</title>
            <style>
              body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; margin: 0; }
              img { width: 250px; height: 250px; margin-bottom: 20px; }
              h1 { font-size: 20px; color: #333; margin: 0; }
              p { font-size: 14px; color: #666; margin: 5px 0 0 0; }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            <img src="${activeQR.qr}" />
            <h1>${activeQR.name}</h1>
            <p>Scan to Book Ride</p>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Available: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      Booked: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      Maintenance: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      Inactive: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return `inline-flex text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${styles[status] || 'bg-slate-800 text-slate-400'}`;
  };

  const handleDownloadDemoCSV = () => {
    const csvContent = 
      "Name,Brand,Model,Registration Number,Engine CC,Fuel Type,Color,Status,Rent Price,Security Deposit\n" +
      "Activa 6G,Honda,Standard,KA-01-EF-4567,110,Petrol,Blue,Available,400,1000\n" +
      "Jupiter 125,TVS,Disc,KA-02-GH-8901,124,Petrol,Grey,Available,400,1000\n" +
      "Classic 350,Royal Enfield,Reborn,KA-51-XY-1234,349,Petrol,Black,Available,800,2000";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "bikes_bulk_upload_demo.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Demo CSV file downloaded!');
  };

  const handleExportCSV = async () => {
    const toastId = toast.loading('Generating export CSV...');
    try {
      const { data: res } = await api.get('/bikes', {
        params: { limit: 1000 },
      });
      const bikesList: IBike[] = res.data.bikes;
      if (!bikesList || bikesList.length === 0) {
        toast.dismiss(toastId);
        toast.error('No motorbikes found to export');
        return;
      }

      const headers = ['Bike ID', 'Name', 'Brand', 'Model', 'Registration Number', 'Engine CC', 'Fuel Type', 'Color', 'Status', 'Rent Price (₹)', 'Security Deposit (₹)'];
      const rows = bikesList.map(b => [
        b.bikeId || '',
        b.name || '',
        b.brand || '',
        b.model || '',
        b.registrationNumber || '',
        b.engineCC || '',
        b.fuelType || '',
        b.color || '',
        b.status || '',
        b.rentPrice || 500,
        b.securityDeposit || 1000
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `bikes_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.dismiss(toastId);
      toast.success('Inventory exported successfully!');
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error('Failed to export inventory');
    }
  };

  const handleBulkUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const toastId = toast.loading('Parsing and uploading CSV data...');
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          if (!text) {
            toast.dismiss(toastId);
            toast.error('Empty CSV file');
            return;
          }

          const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
          if (lines.length < 2) {
            toast.dismiss(toastId);
            toast.error('CSV file must contain a header and at least one data row');
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          const nameIndex = headers.indexOf('name');
          const brandIndex = headers.indexOf('brand');
          const modelIndex = headers.indexOf('model');
          const regIndex = headers.indexOf('registration number');
          const ccIndex = headers.indexOf('engine cc');
          const fuelIndex = headers.indexOf('fuel type');
          const colorIndex = headers.indexOf('color');
          const statusIndex = headers.indexOf('status');
          const rentIndex = headers.indexOf('rent price');
          const depositIndex = headers.indexOf('security deposit');

          if (nameIndex === -1 || brandIndex === -1 || regIndex === -1) {
            toast.dismiss(toastId);
            toast.error('CSV missing required headers: Name, Brand, Registration Number');
            return;
          }

          const parsedBikes: any[] = [];
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
            if (cols.length < 3) continue;

            const name = cols[nameIndex];
            const brand = cols[brandIndex];
            const registrationNumber = cols[regIndex];
            if (!name || !brand || !registrationNumber) {
              toast.dismiss(toastId);
              toast.error(`Row ${i + 1} has missing required values (Name, Brand, Registration Number)`);
              return;
            }

            parsedBikes.push({
              name,
              brand,
              model: modelIndex !== -1 ? cols[modelIndex] || '' : '',
              registrationNumber,
              engineCC: ccIndex !== -1 ? parseInt(cols[ccIndex]) || 150 : 150,
              fuelType: fuelIndex !== -1 ? cols[fuelIndex] || 'Petrol' : 'Petrol',
              color: colorIndex !== -1 ? cols[colorIndex] || '' : '',
              status: statusIndex !== -1 ? cols[statusIndex] || 'Available' : 'Available',
              rentPrice: rentIndex !== -1 ? parseFloat(cols[rentIndex]) || 500 : 500,
              securityDeposit: depositIndex !== -1 ? parseFloat(cols[depositIndex]) || 1000 : 1000,
            });
          }

          if (parsedBikes.length === 0) {
            toast.dismiss(toastId);
            toast.error('No valid bike rows found in the CSV file');
            return;
          }

          await api.post('/bikes/bulk', { bikes: parsedBikes });
          toast.dismiss(toastId);
          toast.success(`Successfully uploaded ${parsedBikes.length} motorbikes!`);
          refetch();
        } catch (err: any) {
          toast.dismiss(toastId);
          toast.error(err.response?.data?.message || 'Bulk upload failed. Please verify data formats.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="space-y-8">
      {/* Top action header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h2 className="text-2xl font-extrabold font-display text-gradient">Bike Inventory</h2>
          <p className="text-slate-400 text-xs mt-1">Manage showroom fleet details, print booking QR codes, and trace statuses.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <button
            onClick={handleDownloadDemoCSV}
            className="flex-1 sm:flex-none bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border border-slate-800/80 font-semibold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Demo CSV</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border border-slate-800/80 font-semibold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleBulkUploadClick}
            className="flex-1 sm:flex-none bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border border-slate-800/80 font-semibold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-400" />
            <span>Bulk Upload</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-3 px-5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Motorbike</span>
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="glass-card p-5 rounded-2xl border border-white/5 shadow-md flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute inset-y-0 left-3.5 my-auto w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, reg #..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Brand select */}
          <select
            value={brandFilter}
            onChange={(e) => {
              setBrandFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none min-w-[120px] cursor-pointer"
          >
            <option value="">All Brands</option>
            {BRANDS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Status select */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none min-w-[120px] cursor-pointer"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Refresh buttons */}
          <button
            onClick={() => refetch()}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-white/5 text-slate-400 hover:text-slate-200 rounded-xl"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid of Vehicles */}
      {isLoading ? (
        <div className="py-32 flex justify-center items-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        </div>
      ) : !data?.bikes?.length ? (
        <div className="py-24 text-center border border-dashed border-white/5 rounded-2xl p-8">
          <Bike className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-300 font-bold text-sm">No Motorbikes Found</h3>
          <p className="text-slate-500 text-xs mt-1">Try modifying your filter settings or add a new vehicle to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.bikes.map((bike: IBike) => (
            <div key={bike._id} className="glass-card rounded-2xl border border-white/5 shadow-xl flex flex-col justify-between overflow-hidden relative group">
              {/* Image banner */}
              <div className="h-44 w-full bg-slate-900 relative overflow-hidden flex items-center justify-center p-3 border-b border-white/5">
                <img
                  src={bike.image}
                  alt={bike.name}
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3">
                  <span className={getStatusBadge(bike.status)}>{bike.status}</span>
                </div>
              </div>

              {/* Text descriptions */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[10px] font-mono text-blue-500 tracking-wider uppercase font-bold">{bike.brand} • {bike.bikeId}</span>
                  <h4 className="font-display font-bold text-sm text-slate-200 mt-1 truncate">{bike.name}</h4>
                  <p className="text-[10px] font-mono text-slate-500 mt-0.5 uppercase tracking-wide">{bike.registrationNumber}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-b border-white/5 py-3 text-[10px] text-slate-400">
                  <div>Engine: <span className="font-semibold text-slate-200">{bike.engineCC} CC</span></div>
                  <div>Fuel: <span className="font-semibold text-slate-200">{bike.fuelType}</span></div>
                </div>

                {/* Operations buttons bar */}
                <div className="flex items-center justify-between pt-1">
                  {/* Action Tools */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditClick(bike)}
                      className="p-2 bg-slate-800/80 hover:bg-blue-600/10 border border-white/5 text-slate-400 hover:text-blue-400 rounded-lg transition-colors cursor-pointer"
                      title="Edit vehicle details"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(bike._id!, bike.name)}
                      className="p-2 bg-slate-800/80 hover:bg-red-500/10 border border-white/5 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                      title="Soft-delete vehicle"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* QR view trigger */}
                  {bike.qrCode && (
                    <button
                      onClick={() => setActiveQR({ name: bike.name, qr: bike.qrCode! })}
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 text-[10px] font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Scan Code</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Bar */}
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

      {/* Add Motorbike Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-8 rounded-2xl border border-white/10 max-w-lg w-full shadow-2xl space-y-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-slate-200">Register Motorbike</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd(onAddSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Vehicle Name</label>
                  <input
                    type="text"
                    placeholder="e.g. KTM Duke 390"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    {...registerAdd('name')}
                  />
                  {addErrors.name && <p className="text-[10px] text-red-500 font-medium">{addErrors.name.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Brand</label>
                  <select
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
                    {...registerAdd('brand')}
                  >
                    <option value="">Select Brand</option>
                    {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  {addErrors.brand && <p className="text-[10px] text-red-500 font-medium">{addErrors.brand.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Model Version</label>
                  <input
                    type="text"
                    placeholder="e.g. 2024 V3"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    {...registerAdd('model')}
                  />
                  {addErrors.model && <p className="text-[10px] text-red-500 font-medium">{addErrors.model.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Registration Number</label>
                  <input
                    type="text"
                    placeholder="e.g. KA-01-EF-1234"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    {...registerAdd('registrationNumber')}
                  />
                  {addErrors.registrationNumber && <p className="text-[10px] text-red-500 font-medium">{addErrors.registrationNumber.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Engine Displacement (CC)</label>
                  <input
                    type="number"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    {...registerAdd('engineCC', { valueAsNumber: true })}
                  />
                  {addErrors.engineCC && <p className="text-[10px] text-red-500 font-medium">{addErrors.engineCC.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Vehicle Color</label>
                  <input
                    type="text"
                    placeholder="e.g. Matte Black"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    {...registerAdd('color')}
                  />
                  {addErrors.color && <p className="text-[10px] text-red-500 font-medium">{addErrors.color.message}</p>}
                </div>
              </div>

              {/* Fuel and Status selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Fuel Type</label>
                  <select
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
                    {...registerAdd('fuelType')}
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Status</label>
                  <select
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
                    {...registerAdd('status')}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Image Input Options */}
              <div className="border-t border-white/5 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-300">Vehicle Showcase Image</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-semibold">Paste Image URL</label>
                    <input
                      type="text"
                      placeholder="https://image-link.png..."
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      {...registerAdd('image')}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-semibold">Or Upload Image file</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, false)}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-1.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[9px] file:font-semibold file:bg-blue-600/10 file:text-blue-400 cursor-pointer"
                    />
                  </div>
                </div>
                {addErrors.image && <p className="text-[10px] text-red-500 font-medium">{addErrors.image.message}</p>}
                
                {/* Image Showcase Preview */}
                {addImageVal && (
                  <div className="p-2 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-center max-h-36 overflow-hidden">
                    <img src={addImageVal} alt="Preview" className="max-h-32 object-contain" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-slate-850 hover:bg-slate-800 border border-white/5 text-slate-300 text-xs font-semibold py-2.5 px-4 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Motorbike</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Motorbike Modal */}
      {isEditModalOpen && activeBike && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-8 rounded-2xl border border-white/10 max-w-lg w-full shadow-2xl space-y-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-slate-200">Edit Motorbike Details</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Vehicle Name</label>
                  <input
                    type="text"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    {...registerEdit('name')}
                  />
                  {editErrors.name && <p className="text-[10px] text-red-500 font-medium">{editErrors.name.message as string}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Brand</label>
                  <select
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
                    {...registerEdit('brand')}
                  >
                    {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  {editErrors.brand && <p className="text-[10px] text-red-500 font-medium">{editErrors.brand.message as string}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Model Version</label>
                  <input
                    type="text"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    {...registerEdit('model')}
                  />
                  {editErrors.model && <p className="text-[10px] text-red-500 font-medium">{editErrors.model.message as string}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Registration Number</label>
                  <input
                    type="text"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    {...registerEdit('registrationNumber')}
                  />
                  {editErrors.registrationNumber && <p className="text-[10px] text-red-500 font-medium">{editErrors.registrationNumber.message as string}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Engine Displacement (CC)</label>
                  <input
                    type="number"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    {...registerEdit('engineCC', { valueAsNumber: true })}
                  />
                  {editErrors.engineCC && <p className="text-[10px] text-red-500 font-medium">{editErrors.engineCC.message as string}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Vehicle Color</label>
                  <input
                    type="text"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    {...registerEdit('color')}
                  />
                  {editErrors.color && <p className="text-[10px] text-red-500 font-medium">{editErrors.color.message as string}</p>}
                </div>
              </div>

              {/* Fuel and Status selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Fuel Type</label>
                  <select
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
                    {...registerEdit('fuelType')}
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Status</label>
                  <select
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
                    {...registerEdit('status')}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Image Input Options */}
              <div className="border-t border-white/5 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-300">Vehicle Showcase Image</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-semibold">Paste Image URL</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      {...registerEdit('image')}
                    />
                    {editErrors.image && <p className="text-[10px] text-red-500 font-medium">{editErrors.image.message as string}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-semibold">Or Upload Image file</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, true)}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-1.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[9px] file:font-semibold file:bg-blue-600/10 file:text-blue-400 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Image Showcase Preview */}
                {editImageVal && (
                  <div className="p-2 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-center max-h-36 overflow-hidden">
                    <img src={editImageVal} alt="Preview" className="max-h-32 object-contain" />
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4">
                <button
                  type="button"
                  onClick={() => qrMutation.mutate(activeBike._id!, {
                    onSuccess: (newQr) => {
                      setActiveBike(prev => prev ? { ...prev, qrCode: newQr } : null);
                    }
                  })}
                  className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  disabled={qrMutation.isPending}
                >
                  {qrMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />}
                  <span>Regenerate QR</span>
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="bg-slate-850 hover:bg-slate-800 border border-white/5 text-slate-300 text-xs font-semibold py-2.5 px-4 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Fullscreen Preview Modal */}
      {activeQR && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-8 rounded-2xl border border-white/10 max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-6">
            <div className="w-full flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="font-display font-bold text-sm text-slate-200 truncate pr-4">{activeQR.name} Booking Link</h3>
              <button onClick={() => setActiveQR(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Image Box */}
            <div className="p-4 bg-white rounded-xl shadow-lg border border-slate-200">
              <img src={activeQR.qr} alt="Vehicle QR Code" className="w-52 h-52 object-contain" />
            </div>

            <p className="text-[10px] text-slate-400 font-sans">
              Print this code and attach it to the bike. Scanning it will open the dealership booking form directly.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full">
              <button
                onClick={() => handleDownloadQR(activeQR.name, activeQR.qr)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Save PNG</span>
              </button>
              <button
                onClick={handlePrintQR}
                className="flex-1 bg-slate-800 hover:bg-slate-700 border border-white/5 text-slate-300 text-xs font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print QR</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BikeInventoryPage;
