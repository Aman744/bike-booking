import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Bike, ArrowRight, ShieldCheck, CheckCircle2, User, Calendar, ShieldAlert, FileText } from 'lucide-react';
import { bookingSchema, BookingInput, IBike } from 'shared';
import useSettings from '../../hooks/useSettings';
import api from '../../services/api';

export const CustomerBookingPage = () => {
  const { bikeId } = useParams<{ bikeId: string }>();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [step, setStep] = useState(1);

  // React Hook Form setup using the shared Zod schema
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      bikeId: '',
      bikeName: '',
      registrationNumber: '',
      customerName: '',
      mobile: '',
      alternateMobile: '',
      email: '',
      age: 18,
      gender: 'Male',
      dob: '',
      occupation: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      licenseNumber: '',
      licenseFront: '',
      licenseBack: '',
      aadhaarNumber: '',
      aadhaarFile: '',
      aadhaarFront: '',
      aadhaarBack: '',
      voterId: '',
      hotelStay: '',
      destination: '',
      bookingType: 'Rental',
      perDayRent: undefined,
      securityDeposit: undefined,
      pendingPayment: undefined,
      bookingDate: '',
      bookingTime: '',
      pickupDate: '',
      pickupTime: '',
      returnDate: '',
      returnTime: '',
      duration: '1 Hour',
      purpose: '',
      emergencyName: '',
      emergencyMobile: '',
      relationship: '',
      confirmCorrect: false as any,
      agreeTerms: false as any,
    },
  });

  const selectedBikeIdVal = watch('bikeId');
  const selectedBikeNameVal = watch('bikeName');
  const licenseFrontVal = watch('licenseFront');
  const licenseBackVal = watch('licenseBack');
  const aadhaarFrontVal = watch('aadhaarFront');
  const aadhaarBackVal = watch('aadhaarBack');
  const pickupDateVal = watch('pickupDate');
  const returnDateVal = watch('returnDate');
  const perDayRentVal = watch('perDayRent');
  const securityDepositVal = watch('securityDeposit');
  const pendingPaymentVal = watch('pendingPayment');

  // Query A: Fetch single bike if bikeId exists in URL
  const { data: singleBikeData, isLoading: isBikeLoading } = useQuery({
    queryKey: ['bookingSingleBike', bikeId],
    queryFn: async () => {
      if (!bikeId) return null;
      const { data } = await api.get(`/bikes/code/${bikeId}`);
      return data.data.bike as IBike;
    },
    enabled: !!bikeId,
  });

  // Query B: Fetch all available bikes for the dropdown if bikeId is missing
  const { data: availableBikesData, isLoading: isBikesLoading } = useQuery({
    queryKey: ['bookingAvailableBikes'],
    queryFn: async () => {
      const { data } = await api.get('/bikes', { params: { limit: 100, status: 'Available' } });
      return data.data.bikes as IBike[];
    },
    enabled: !bikeId,
  });

  // Populate bike details when single bike query finishes
  useEffect(() => {
    if (singleBikeData) {
      setValue('bikeId', singleBikeData.bikeId);
      setValue('bikeName', singleBikeData.name);
      setValue('registrationNumber', singleBikeData.registrationNumber);
      setValue('perDayRent', singleBikeData.rentPrice || settings?.defaultPerDayRent || 500);
      setValue('securityDeposit', singleBikeData.securityDeposit || settings?.defaultSecurityDeposit || 1000);
    }
  }, [singleBikeData, setValue, settings]);

  // Sync settings defaults when loaded
  useEffect(() => {
    if (settings) {
      if (watch('perDayRent') === undefined) {
        setValue('perDayRent', settings.defaultPerDayRent || 500);
      }
      if (watch('securityDeposit') === undefined) {
        setValue('securityDeposit', settings.defaultSecurityDeposit || 1000);
      }
    }
  }, [settings, setValue]);

  // Handle bike selection in dropdown
  const handleDropdownBikeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const selected = availableBikesData?.find((b) => b.bikeId === code);
    if (selected) {
      setValue('bikeId', selected.bikeId);
      setValue('bikeName', selected.name);
      setValue('registrationNumber', selected.registrationNumber);
      setValue('perDayRent', selected.rentPrice || settings?.defaultPerDayRent || 500);
      setValue('securityDeposit', selected.securityDeposit || settings?.defaultSecurityDeposit || 1000);
    } else {
      setValue('bikeId', '');
      setValue('bikeName', '');
      setValue('registrationNumber', '');
      setValue('perDayRent', settings?.defaultPerDayRent || 500);
      setValue('securityDeposit', settings?.defaultSecurityDeposit || 1000);
    }
  };

  // Convert uploaded license front image to Base64
  const handleLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        toast.error('License front file size must be less than 4MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue('licenseFront', reader.result as string, { shouldValidate: true });
        toast.success('License front copy loaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert uploaded license back image to Base64
  const handleLicenseBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        toast.error('License back file size must be less than 4MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue('licenseBack', reader.result as string, { shouldValidate: true });
        toast.success('License back copy loaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert uploaded Aadhaar front image to Base64
  const handleAadhaarFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        toast.error('Aadhaar front file size must be less than 4MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setValue('aadhaarFront', base64, { shouldValidate: true });
        setValue('aadhaarFile', base64, { shouldValidate: true }); // keep legacy sync
        toast.success('Aadhaar front copy loaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert uploaded Aadhaar back image to Base64
  const handleAadhaarBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        toast.error('Aadhaar back file size must be less than 4MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue('aadhaarBack', reader.result as string, { shouldValidate: true });
        toast.success('Aadhaar back copy loaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  // Booking submission mutation
  const bookingMutation = useMutation({
    mutationFn: async (payload: BookingInput) => {
      const { data } = await api.post('/bookings', payload);
      return data;
    },
    onSuccess: (res) => {
      const bNumber = res.data.booking.bookingNumber;
      toast.success('Booking registered successfully!');
      navigate(`/booking/success/${bNumber}`);
    },
    onError: (err: any) => {
      if (err.response?.data?.errors && err.response.data.errors.length > 0) {
        const errorMsgs = err.response.data.errors.map((e: any) => `${e.field}: ${e.message}`).join('; ');
        toast.error(`Validation Failed: ${errorMsgs}`);
      } else {
        toast.error(err.response?.data?.message || 'Submission failed. Please check inputs.');
      }
    },
  });

  // Steps validations triggers
  const handleNextStep = async () => {
    if (step === 1) {
      const isValid = await trigger([
        'customerName',
        'mobile',
        'email',
        'age',
        'dob',
        'bikeId',
        'address',
      ]);
      if (isValid) setStep(2);
    } else if (step === 2) {
      const isValid = await trigger([
        'licenseNumber',
        'licenseFront',
        'aadhaarNumber',
        'aadhaarFile',
      ]);
      if (isValid) setStep(3);
    }
  };

  const onSubmit = (data: BookingInput) => {
    // Fill compatibility fields
    data.bookingDate = data.pickupDate;
    data.bookingTime = data.pickupTime;
    bookingMutation.mutate(data);
  };

  const activeBikeData = singleBikeData || availableBikesData?.find(b => b.bikeId === selectedBikeIdVal);

  // Financial calculations for Rental bookings
  const rentPrice = perDayRentVal !== undefined ? Number(perDayRentVal) : (activeBikeData?.rentPrice || settings?.defaultPerDayRent || 500);
  const securityDeposit = securityDepositVal !== undefined ? Number(securityDepositVal) : (activeBikeData?.securityDeposit || settings?.defaultSecurityDeposit || 1000);
  let calculatedDays = 1;
  if (pickupDateVal && returnDateVal) {
    const start = new Date(pickupDateVal);
    const end = new Date(returnDateVal);
    const diffTime = end.getTime() - start.getTime();
    if (!isNaN(diffTime)) {
      calculatedDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }
  }
  const totalRent = calculatedDays * rentPrice;
  const totalPayment = totalRent + securityDeposit;

  if (isBikeLoading || isBikesLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <span className="text-slate-400 text-xs">Initializing booking form...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Headers */}
      <div className="flex flex-col items-center text-center space-y-2 border-b border-white/5 pb-5">
        {settings?.dealershipLogo && (settings.dealershipLogo.startsWith('http') || settings.dealershipLogo.startsWith('data:image/')) ? (
          <img src={settings.dealershipLogo} alt="Logo" className="h-10 object-contain max-w-[200px]" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-500 shadow-md">
            <Bike className="w-6 h-6 animate-pulse-soft" />
          </div>
        )}
        <h2 className="text-xl font-black font-display text-gradient tracking-wide uppercase mt-1">
          {settings?.dealershipName || 'MOTOHUB DEALERSHIP'}
        </h2>
      </div>

      {/* Booking Form steps tracker */}
      <div className="flex items-center justify-center gap-6 text-[10px] uppercase font-bold text-slate-500 border-b border-white/5 pb-4 px-2">
        <span className={`${step === 1 ? 'text-blue-400' : 'text-slate-500'} flex items-center gap-1`}>
          <User className="w-3.5 h-3.5" /> 1. Profile
        </span>
        <span className="text-slate-700">➔</span>
        <span className={`${step === 2 ? 'text-blue-400' : 'text-slate-500'} flex items-center gap-1`}>
          <ShieldCheck className="w-3.5 h-3.5" /> 2. Credentials
        </span>
        <span className="text-slate-700">➔</span>
        <span className={`${step === 3 ? 'text-blue-400' : 'text-slate-500'} flex items-center gap-1`}>
          <Calendar className="w-3.5 h-3.5" /> 3. Schedule
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* STEP 1: Personal Profile & Target Scooter selection */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Vehicle Selection dropdown or preselected card view */}
            <div className="space-y-1.5 p-4 bg-slate-900/40 border border-white/5 rounded-xl">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Selected Motorbike</label>
              
              {bikeId ? (
                // Locked Preselected view from scan
                <div className="flex items-center gap-4 py-1.5">
                  {singleBikeData?.image && (
                    <img src={singleBikeData.image} alt={singleBikeData.name} className="h-10 w-16 object-contain bg-slate-950/40 rounded-lg p-1" />
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">{selectedBikeNameVal || 'Loading vehicle details...'}</h4>
                    <span className="text-[9px] font-mono text-blue-400 uppercase">{watch('registrationNumber')}</span>
                  </div>
                </div>
              ) : (
                // Dropdown selector for the common booking URL
                <div className="space-y-2 pt-1">
                  <select
                    onChange={handleDropdownBikeChange}
                    value={selectedBikeIdVal}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">-- Choose Showroom Scooter --</option>
                    {availableBikesData?.map((b) => (
                      <option key={b.bikeId} value={b.bikeId}>
                        {b.brand} {b.name} ({b.registrationNumber})
                      </option>
                    ))}
                  </select>
                  {errors.bikeId && <p className="text-[10px] text-red-500 font-semibold">{errors.bikeId.message}</p>}
                </div>
              )}
            </div>

            {/* Customer Contact details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  {...register('customerName')}
                />
                {errors.customerName && <p className="text-[10px] text-red-500 font-semibold">{errors.customerName.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Mobile Number</label>
                <input
                  type="text"
                  placeholder="10 Digits Mobile Number"
                  maxLength={10}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  {...register('mobile')}
                />
                {errors.mobile && <p className="text-[10px] text-red-500 font-semibold">{errors.mobile.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. customer@email.com"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  {...register('email')}
                />
                {errors.email && <p className="text-[10px] text-red-500 font-semibold">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Date of Birth</label>
                <input
                  type="date"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  {...register('dob')}
                />
                {errors.dob && <p className="text-[10px] text-red-500 font-semibold">{errors.dob.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Age (Must be 18+)</label>
                <input
                  type="number"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  {...register('age', { valueAsNumber: true })}
                />
                {errors.age && <p className="text-[10px] text-red-500 font-semibold">{errors.age.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Gender</label>
                <select
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
                  {...register('gender')}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-slate-400 font-semibold">Home Address</label>
                <input
                  type="text"
                  placeholder="Enter complete residential address"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  {...register('address')}
                />
                {errors.address && <p className="text-[10px] text-red-500 font-semibold">{errors.address.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Hotel Stay details (Optional)</label>
                <input
                  type="text"
                  placeholder="Hotel Name / Room No. (If Tourist)"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  {...register('hotelStay')}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Where to Go / Destination</label>
                <input
                  type="text"
                  placeholder="e.g. Local tour, Rishikesh, Mussoorie"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  {...register('destination')}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleNextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-3 px-5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/10"
              >
                <span>Upload Credentials</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Identity Credentials (DL, Aadhaar, Voter ID) */}
        {step === 2 && (
          <div className="space-y-5">
            {/* Driving License details */}
            <div className="p-4 bg-slate-900/20 border border-white/5 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-blue-400 uppercase flex items-center gap-1.5 border-b border-white/5 pb-2">
                <FileText className="w-4 h-4" /> Driving License (Required)
              </h4>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Driving License Number</label>
                <input
                  type="text"
                  placeholder="e.g. DL-XXXXXXXXXXXXX"
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  {...register('licenseNumber')}
                />
                {errors.licenseNumber && <p className="text-[10px] text-red-500 font-semibold">{errors.licenseNumber.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-450 uppercase font-bold tracking-wider block">Upload License Front Copy</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLicenseUpload}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-blue-600/10 file:text-blue-400 cursor-pointer"
                  />
                  {errors.licenseFront && <p className="text-[10px] text-red-500 font-semibold">{errors.licenseFront.message}</p>}

                  {licenseFrontVal && (
                    <div className="p-3 bg-slate-955 border border-slate-900 rounded-xl flex items-center justify-center max-h-40 overflow-hidden">
                      <img src={licenseFrontVal} alt="License Front Copy" className="max-h-36 object-contain rounded-md" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-450 uppercase font-bold tracking-wider block">Upload License Back Copy (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLicenseBackUpload}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-blue-600/10 file:text-blue-400 cursor-pointer"
                  />

                  {licenseBackVal && (
                    <div className="p-3 bg-slate-955 border border-slate-900 rounded-xl flex items-center justify-center max-h-40 overflow-hidden">
                      <img src={licenseBackVal} alt="License Back Copy" className="max-h-36 object-contain rounded-md" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Aadhaar Details */}
            <div className="p-4 bg-slate-900/20 border border-white/5 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-blue-400 uppercase flex items-center gap-1.5 border-b border-white/5 pb-2">
                <ShieldCheck className="w-4 h-4" /> Aadhaar Identification (Required)
              </h4>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Aadhaar Card Number (12 Digits)</label>
                <input
                  type="text"
                  placeholder="e.g. 1234 5678 9012"
                  maxLength={12}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  {...register('aadhaarNumber')}
                />
                {errors.aadhaarNumber && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.aadhaarNumber.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-450 uppercase font-bold tracking-wider block">Upload Aadhaar Front Copy</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAadhaarFrontUpload}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-blue-600/10 file:text-blue-400 cursor-pointer"
                  />
                  {errors.aadhaarFile && <p className="text-[10px] text-red-500 font-semibold">{errors.aadhaarFile.message}</p>}

                  {aadhaarFrontVal && (
                    <div className="p-3 bg-slate-955 border border-slate-900 rounded-xl flex items-center justify-center max-h-40 overflow-hidden">
                      <img src={aadhaarFrontVal} alt="Aadhaar Front Copy" className="max-h-36 object-contain rounded-md" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-450 uppercase font-bold tracking-wider block">Upload Aadhaar Back Copy</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAadhaarBackUpload}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-blue-600/10 file:text-blue-400 cursor-pointer"
                  />

                  {aadhaarBackVal && (
                    <div className="p-3 bg-slate-955 border border-slate-900 rounded-xl flex items-center justify-center max-h-40 overflow-hidden">
                      <img src={aadhaarBackVal} alt="Aadhaar Back Copy" className="max-h-36 object-contain rounded-md" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Voter ID Details (Optional) */}
            <div className="p-4 bg-slate-900/20 border border-white/5 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-blue-400 uppercase flex items-center gap-1.5 border-b border-white/5 pb-2">
                <User className="w-4 h-4" /> Voter ID Card (Optional)
              </h4>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-455 uppercase font-bold tracking-wider">Voter ID Number</label>
                <input
                  type="text"
                  placeholder="Enter Voter Card reference number"
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
                  {...register('voterId')}
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="bg-slate-850 hover:bg-slate-800 border border-white/5 text-slate-300 text-xs font-semibold py-3 px-5 rounded-xl cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-3 px-5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/10"
              >
                <span>Setup Schedule</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Booking Schedule Options & Agreements */}
        {step === 3 && (
          <div className="space-y-5">
            {/* Show Selected vehicle summary */}
            {activeBikeData && (
              <div className="p-3 bg-blue-600/5 border border-blue-500/15 rounded-xl flex items-center gap-3">
                <Bike className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] text-slate-300 font-medium">
                  Booking Summary: <strong className="text-slate-100">{activeBikeData.brand} {activeBikeData.name}</strong> ({activeBikeData.registrationNumber})
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Booking Type</label>
                <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-300 text-sm font-semibold select-none">
                  Rental
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Pickup Date (Taking Vehicle)</label>
                <input
                  type="date"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  {...register('pickupDate')}
                />
                {errors.pickupDate && <p className="text-[10px] text-red-500 font-semibold">{errors.pickupDate.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Pickup Time (Taking Vehicle)</label>
                <input
                  type="time"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  {...register('pickupTime')}
                />
                {errors.pickupTime && <p className="text-[10px] text-red-500 font-semibold">{errors.pickupTime.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Return Date (Returning Vehicle)</label>
                <input
                  type="date"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  {...register('returnDate')}
                />
                {errors.returnDate && <p className="text-[10px] text-red-500 font-semibold">{errors.returnDate.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Return Time (Returning Vehicle)</label>
                <input
                  type="time"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  {...register('returnTime')}
                />
                {errors.returnTime && <p className="text-[10px] text-red-500 font-semibold">{errors.returnTime.message}</p>}
              </div>

              {/* Financial Breakdown Widget */}
              <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4 text-xs md:col-span-2 shadow-lg">
                <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[10px] flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-400" /> Rental Pricing details
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Per Day Rent (₹)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none text-sm">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="500"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        {...register('perDayRent', { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Security Deposit (₹)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none text-sm">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="1000"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        {...register('securityDeposit', { valueAsNumber: true })}
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">Payable at Showroom (Refundable)</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending Payment (₹)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none text-sm">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder={totalPayment.toString()}
                        className="w-full bg-slate-955 border border-slate-800 rounded-xl pl-8 pr-4 py-2 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        {...register('pendingPayment', { valueAsNumber: true })}
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">Default: ₹{totalPayment}</span>
                  </div>
                </div>
                <div className="flex justify-between text-slate-400 pt-2 border-t border-white/5">
                  <span>Rental Duration:</span>
                  <span className="font-mono text-slate-200">{calculatedDays} Day{calculatedDays > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold pt-1 border-t border-white/5">
                  <span className="text-slate-300">Total Estimated Amount:</span>
                  <span className="font-mono text-blue-400 text-base">₹{totalPayment}</span>
                </div>
              </div>
            </div>

            {/* Declarations list */}
            <div className="space-y-3 border-t border-white/5 pt-4">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="confirmCorrect"
                  className="mt-1 cursor-pointer"
                  {...register('confirmCorrect')}
                />
                <label htmlFor="confirmCorrect" className="text-[11px] text-slate-400 cursor-pointer">
                  I confirm that all entered details (address, mobile, Aadhaar copy, license copy) are correct.
                </label>
              </div>
              {errors.confirmCorrect && <p className="text-[10px] text-red-500 font-semibold ml-6">{errors.confirmCorrect.message}</p>}

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  className="mt-1 cursor-pointer"
                  {...register('agreeTerms')}
                />
                <label htmlFor="agreeTerms" className="text-[11px] text-slate-400 cursor-pointer">
                  I agree to the dealership terms and conditions and privacy policies.
                </label>
              </div>
              {errors.agreeTerms && <p className="text-[10px] text-red-500 font-semibold ml-6">{errors.agreeTerms.message}</p>}
            </div>

            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="bg-slate-850 hover:bg-slate-800 border border-white/5 text-slate-300 text-xs font-semibold py-3 px-5 rounded-xl cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={bookingMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold text-xs py-3 px-6 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/10"
              >
                {bookingMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Booking</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default CustomerBookingPage;
