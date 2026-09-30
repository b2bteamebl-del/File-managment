import React, { useState, useEffect, useRef } from 'react';
import { 
  PlusCircle, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Check, 
  X, 
  AlertCircle, 
  RefreshCw, 
  Calendar,
  Building,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CreditCard,
  FileCheck2,
  Paperclip,
  Camera,
  Navigation
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../lib/api.js';
import { CustomerFile, FileAttachment, RMProfile, ApplicationStatus, ActiveStatus, CPVStatus } from '../types/index.js';
import { formatDhakaDateTime, formatDhakaDateOnly } from '../utils/dateTime.js';
import { DocumentViewerModal } from '../components/common/DocumentViewerModal.js';
import { identifyCurrentLocationAndPing } from '../utils/geolocation.js';

interface FileEntryAndListProps {
  initialFilterRmCode?: string;
}

export const FileEntryAndList: React.FC<FileEntryAndListProps> = ({ initialFilterRmCode }) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<CustomerFile[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 20, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const [rms, setRms] = useState<RMProfile[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetectingOfficeAddress, setIsDetectingOfficeAddress] = useState(false);
  const [isDetectingCpvAddress, setIsDetectingCpvAddress] = useState(false);

  // Form fields
  const [formData, setFormData] = useState<{
    fileId: string;
    ccNumber: string;
    customerName: string;
    companyName: string;
    officeAddress: string;
    mobile: string;
    altMobile: string;
    email: string;
    rmCode: string;
    productType: string;
    applicationStatus: ApplicationStatus;
    activeStatus: ActiveStatus;
    pendingDocuments: string[];
    remarks: string;
    locationAddress?: string;
    locationLat?: number;
    locationLng?: number;
    cpvStatus: CPVStatus;
    cpvDate: string;
    cpvAddress: string;
    cpvRemarks: string;
  }>({
    fileId: '',
    ccNumber: '',
    customerName: '',
    companyName: '',
    officeAddress: '',
    mobile: '',
    altMobile: '',
    email: '',
    rmCode: user?.rmCode || user?.username || '',
    productType: 'Credit Card',
    applicationStatus: 'Collected',
    activeStatus: 'N',
    pendingDocuments: [] as string[],
    remarks: '',
    locationAddress: '',
    locationLat: undefined,
    locationLng: undefined,
    // CPV
    cpvStatus: 'Pending',
    cpvDate: '',
    cpvAddress: '',
    cpvRemarks: '',
  });

  // Staged attachments for upload
  const [pendingUploads, setPendingUploads] = useState<{
    file: File;
    category: any;
    previewUrl: string;
    dataUrl: string;
  }[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<FileAttachment[]>([]);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [filterProduct, setFilterProduct] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterActive, setFilterActive] = useState('all');
  const [filterCpv, setFilterCpv] = useState('all');
  const [filterPendingDoc, setFilterPendingDoc] = useState('all');
  const [filterRmCode, setFilterRmCode] = useState(initialFilterRmCode || 'all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals & Messages
  const [selectedAttachment, setSelectedAttachment] = useState<FileAttachment | null>(null);
  const [viewDetailsFile, setViewDetailsFile] = useState<CustomerFile | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cpvPhotoInputRef = useRef<HTMLInputElement>(null);
  const cpvDocInputRef = useRef<HTMLInputElement>(null);

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        const [settingsRes, rmsRes] = await Promise.all([
          api.getSettings(),
          user?.role !== 'RM' ? api.getRMs() : Promise.resolve([]),
        ]);
        setSettings(settingsRes);
        if (rmsRes) setRms(rmsRes as RMProfile[]);
      } catch (e) {
        console.error('Error fetching settings/rms:', e);
      }
    }
    init();
  }, [user]);

  // Load Files
  const fetchFiles = async (page = 1) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: '20',
      };
      if (search.trim()) params.search = search.trim();
      if (filterProduct !== 'all') params.productType = filterProduct;
      if (filterStatus !== 'all') params.applicationStatus = filterStatus;
      if (filterActive !== 'all') params.activeStatus = filterActive;
      if (filterCpv !== 'all') params.cpvStatus = filterCpv;
      if (filterPendingDoc !== 'all') params.pendingDoc = filterPendingDoc;
      if (filterRmCode !== 'all' && user?.role !== 'RM') params.rmCode = filterRmCode;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.getFiles(params);
      setFiles(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error('Failed to load customer files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles(1);
  }, [search, filterProduct, filterStatus, filterActive, filterCpv, filterPendingDoc, filterRmCode, startDate, endDate]);

  // Handle Form Reset / Open New
  const handleOpenNewForm = () => {
    setIsEditing(false);
    setEditingFileId(null);
    setFormData({
      fileId: '',
      ccNumber: '',
      customerName: '',
      companyName: '',
      officeAddress: '',
      mobile: '',
      altMobile: '',
      email: '',
      rmCode: user?.rmCode || user?.username || '',
      productType: settings?.productTypes?.[0] || 'Credit Card',
      applicationStatus: 'Collected',
      activeStatus: 'N',
      pendingDocuments: [],
      remarks: '',
      locationAddress: '',
      locationLat: undefined,
      locationLng: undefined,
      cpvStatus: 'Pending',
      cpvDate: '',
      cpvAddress: '',
      cpvRemarks: '',
    });
    setPendingUploads([]);
    setExistingAttachments([]);
    setFormError(null);
    setFormSuccess(null);
    setIsFormOpen(true);

    // Auto-detect current address and GPS location from Google/GPS
    setIsDetectingOfficeAddress(true);
    identifyCurrentLocationAndPing('New File Auto Address Identification')
      .then(res => {
        if (res && res.latitude && res.longitude) {
          setFormData(prev => ({
            ...prev,
            officeAddress: prev.officeAddress || res.address || '',
            locationAddress: res.address || '',
            locationLat: res.latitude,
            locationLng: res.longitude,
          }));
        }
      })
      .catch(e => {
        console.warn('Geolocation auto-fill fallback:', e);
      })
      .finally(() => {
        setIsDetectingOfficeAddress(false);
      });
  };

  // Open Edit Mode
  const handleEdit = async (file: CustomerFile) => {
    setIsEditing(true);
    setEditingFileId(file.fileId);
    setFormData({
      fileId: file.fileId,
      ccNumber: file.ccNumber || '',
      customerName: file.customerName || '',
      companyName: file.companyName || '',
      officeAddress: file.officeAddress || '',
      mobile: file.mobile || '',
      altMobile: file.altMobile || '',
      email: file.email || '',
      rmCode: file.rmCode || user?.rmCode || '',
      productType: file.productType || 'Credit Card',
      applicationStatus: file.applicationStatus || 'Collected',
      activeStatus: file.activeStatus || 'N',
      pendingDocuments: file.pendingDocuments || [],
      remarks: file.remarks || '',
      locationAddress: file.locationAddress || '',
      locationLat: file.locationLat,
      locationLng: file.locationLng,
      cpvStatus: file.cpvStatus || 'Pending',
      cpvDate: file.cpvDate || '',
      cpvAddress: file.cpvAddress || '',
      cpvRemarks: file.cpvRemarks || '',
    });

    try {
      const detailed = await api.getFileById(file.fileId);
      setExistingAttachments(detailed.attachments || []);
    } catch {
      setExistingAttachments(file.attachments || []);
    }

    setPendingUploads([]);
    setFormError(null);
    setFormSuccess(null);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // File Upload Handlers (converts file to base64, checks 10MB limit)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, category: any) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    Array.from(fileList).forEach(file => {
      // 10MB check
      if (file.size > 10 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the 10 MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPendingUploads(prev => [
          ...prev,
          {
            file,
            category,
            previewUrl: URL.createObjectURL(file),
            dataUrl,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removePendingUpload = (index: number) => {
    setPendingUploads(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to remove this document?')) return;
    try {
      await api.deleteAttachment(attachmentId);
      setExistingAttachments(prev => prev.filter(a => a.id !== attachmentId));
    } catch (e: any) {
      alert(e.message || 'Failed to delete attachment');
    }
  };

  const handleAutoDetectOfficeAddress = async () => {
    setIsDetectingOfficeAddress(true);
    try {
      const res = await identifyCurrentLocationAndPing('Customer Office Address Auto-Fill');
      setFormData(prev => ({ ...prev, officeAddress: res.address }));
    } catch (err: any) {
      alert(err.message || 'Could not detect current location');
    } finally {
      setIsDetectingOfficeAddress(false);
    }
  };

  const handleAutoDetectCpvAddress = async () => {
    setIsDetectingCpvAddress(true);
    try {
      const res = await identifyCurrentLocationAndPing('CPV Field Visit Address Auto-Fill');
      setFormData(prev => ({ ...prev, cpvAddress: res.address }));
    } catch (err: any) {
      alert(err.message || 'Could not detect current location');
    } finally {
      setIsDetectingCpvAddress(false);
    }
  };

  // Submit Form (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Validation
    if (!formData.customerName.trim() || !formData.companyName.trim() || !formData.officeAddress.trim() || !formData.mobile.trim()) {
      setFormError('Please fill out all mandatory customer fields (Name, Company, Address, Mobile).');
      return;
    }

    setIsSubmitting(true);
    try {
      let savedFile: CustomerFile;

      if (isEditing && editingFileId) {
        // UPDATE: Preserves File ID and createdAt
        savedFile = await api.updateFile(editingFileId, formData);
        setFormSuccess(`File ${savedFile.fileId} updated successfully.`);
      } else {
        // CREATE: Generates new unique File ID
        savedFile = await api.createFile(formData);
        setFormSuccess(`New file ${savedFile.fileId} created successfully.`);
      }

      // Upload staged attachments
      if (pendingUploads.length > 0) {
        for (const item of pendingUploads) {
          await api.uploadAttachment(savedFile.fileId, {
            fileName: item.file.name,
            fileType: item.file.type,
            category: item.category,
            dataUrl: item.dataUrl,
          });
        }
      }

      // Refresh list & reset form
      await fetchFiles(pagination.page);
      setTimeout(() => {
        setIsFormOpen(false);
        setPendingUploads([]);
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save customer file');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Action
  const handleDelete = async (fileId: string) => {
    try {
      const isPermanent = user?.role === 'Mentor';
      await api.deleteFile(fileId, isPermanent);
      setDeleteConfirmId(null);
      await fetchFiles(pagination.page);
    } catch (err: any) {
      alert(err.message || 'Failed to delete record');
    }
  };

  // Available options from settings
  const productTypes = settings?.productTypes || ['Credit Card', 'B2B', 'Corporate Card', 'Split', 'Limit Enhancement'];
  const applicationStatuses = settings?.applicationStatuses || [
    'Collected', 'Submitted', 'Declined', 'Return to Source', 'Approved', 'Query', 'Condition', 'STC'
  ];
  const pendingDocOptions = settings?.pendingDocOptions || [
    'NID', 'TIN', 'Office ID', 'Salary Certificate', 'BS (Bank Statement)', 'BIN',
    'Trade License 2024-25', 'Trade License 2025-26', 'Trade License 2026-27',
    'Loan Certificate', 'Card Statement (Month)', 'Card Copy'
  ];

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span>Customer File Entry & Applications</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {user?.role === 'RM' 
              ? `Authorized files for RM ${user?.rmCode} • Complete data entry with CPV and private uploads`
              : 'Enterprise portfolio • View, inspect, edit, and process customer files'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (isFormOpen) {
                setIsFormOpen(false);
              } else {
                handleOpenNewForm();
              }
            }}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-2 ${
              isFormOpen
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isFormOpen ? <X className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            <span>{isFormOpen ? 'Close Form' : 'New Customer File'}</span>
          </button>

          <button
            onClick={() => fetchFiles(pagination.page)}
            disabled={isLoading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition border border-slate-200"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* CUSTOMER FILE ENTRY / EDIT FORM */}
      {isFormOpen && (
        <div className="bg-white rounded-xl border border-slate-300 shadow-md overflow-hidden animate-in fade-in duration-150">
          <div className="bg-[#0F294A] text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-500/20 rounded-md border border-blue-400/30">
                {isEditing ? <Edit3 className="w-4 h-4 text-blue-300" /> : <PlusCircle className="w-4 h-4 text-blue-300" />}
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base">
                  {isEditing ? `Edit Customer File: ${editingFileId}` : 'New Customer File Application'}
                </h3>
                <p className="text-[11px] text-blue-200">
                  {isEditing ? 'Updates existing record preserving original Created Date and ID' : 'Auto-generates unique File ID'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsFormOpen(false)}
              className="p-1 text-slate-300 hover:text-white rounded transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {formError && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl">
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* SECTION A: Customer Information */}
            <div>
              <h4 className="text-xs font-bold text-[#0F294A] uppercase tracking-wider mb-3 pb-1 border-b border-slate-200 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                <span>A. Customer & Employment Information</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Full legal customer name"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Office / Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Employer / Business Name"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.mobile}
                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alternative Mobile (Optional)
                  </label>
                  <input
                    type="tel"
                    value={formData.altMobile}
                    onChange={e => setFormData({ ...formData, altMobile: e.target.value })}
                    placeholder="Secondary contact"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="customer@domain.com"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CC-number (Credit Card No.)
                  </label>
                  <input
                    type="text"
                    value={formData.ccNumber}
                    onChange={e => setFormData({ ...formData, ccNumber: e.target.value })}
                    placeholder="e.g. 4501-XXXX-XXXX-1234"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-medium"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Card / Account identification number</p>
                </div>

                {/* GPS Location Auto-Captured: Silent for RM & Admin; Visible ONLY to Mentor */}
                {user?.role === 'Mentor' && formData.locationAddress && (
                  <div className="sm:col-span-2 md:col-span-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Entry Location Detected (Mentor View): <strong>{formData.locationAddress}</strong></span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300">
                      GPS Tagged
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned RM Code {user?.role === 'RM' && '(Read-Only)'}
                  </label>
                  {user?.role === 'RM' ? (
                    <input
                      type="text"
                      readOnly
                      value={user?.rmCode || user?.username}
                      className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-300 rounded-lg font-mono font-bold text-slate-700 cursor-not-allowed"
                    />
                  ) : (
                    <select
                      value={formData.rmCode}
                      onChange={e => setFormData({ ...formData, rmCode: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-blue-900"
                    >
                      {rms.map(r => (
                        <option key={r.rmCode} value={r.rmCode}>
                          {r.rmCode} — {r.rmName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="sm:col-span-2 md:col-span-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Office Address <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoDetectOfficeAddress}
                      disabled={isDetectingOfficeAddress}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-bold text-[11px] transition border border-blue-200 shadow-2xs disabled:opacity-50"
                      title="Use Google/GPS location to identify and fill current address"
                    >
                      <MapPin className={`w-3.5 h-3.5 text-rose-500 ${isDetectingOfficeAddress ? 'animate-bounce' : ''}`} />
                      <span>{isDetectingOfficeAddress ? 'Detecting Location...' : '📍 Auto-Detect Current Location'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.officeAddress}
                    onChange={e => setFormData({ ...formData, officeAddress: e.target.value })}
                    placeholder="Building, Road, Area, Dhaka (or click Auto-Detect Current Location above)"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION B & C & D: Product Type, Application Status, Active Status */}
            <div>
              <h4 className="text-xs font-bold text-[#0F294A] uppercase tracking-wider mb-3 pb-1 border-b border-slate-200 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>B. Product Type & Processing Status</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.productType}
                    onChange={e => setFormData({ ...formData, productType: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  >
                    {productTypes.map((pt: string) => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Application Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.applicationStatus}
                    onChange={e => setFormData({ ...formData, applicationStatus: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-blue-900"
                  >
                    {applicationStatuses.map((st: string) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Active Status (Card Activation)
                  </label>
                  <select
                    value={formData.activeStatus}
                    onChange={e => setFormData({ ...formData, activeStatus: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  >
                    <option value="Y">Y — Active Card</option>
                    <option value="N">N — Inactive / Pending</option>
                    <option value="C">C — Cancelled / Closed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION E: Pending Documents Checklist */}
            <div>
              <h4 className="text-xs font-bold text-[#0F294A] uppercase tracking-wider mb-2 pb-1 border-b border-slate-200 flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                <span>E. Pending Documents Checklist (Select all missing docs)</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 mt-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {pendingDocOptions.map((doc: string) => {
                  const isChecked = formData.pendingDocuments.includes(doc);
                  return (
                    <label
                      key={doc}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition select-none ${
                        isChecked 
                          ? 'bg-red-50 border-red-300 text-red-900 font-semibold' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => {
                          if (e.target.checked) {
                            setFormData({ ...formData, pendingDocuments: [...formData.pendingDocuments, doc] });
                          } else {
                            setFormData({
                              ...formData,
                              pendingDocuments: formData.pendingDocuments.filter(d => d !== doc),
                            });
                          }
                        }}
                        className="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                      />
                      <span className="truncate">{doc}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* SECTION F: Remarks & Requirements */}
            <div>
              <label className="block text-xs font-bold text-[#0F294A] uppercase tracking-wider mb-1">
                F. Remarks / Requirements / Follow-up Notes
              </label>
              <textarea
                rows={2}
                value={formData.remarks}
                onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Missing documents, customer salary queries, CIB details, operational notes..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* SECTION G: Picture & Document Uploads */}
            <div>
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 mb-3">
                <h4 className="text-xs font-bold text-[#0F294A] uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                  <span>G. Pictures & Document Uploads (Instant Auto-Preview)</span>
                </h4>
                <span className="text-[11px] text-slate-500 font-medium">Max 10MB per file • Auto-visible on selection</span>
              </div>

              {/* 3 Explicit Picture Options requested by user: Status Update Picture, CPV Picture, Others */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {/* 1. Status Update Picture */}
                <div>
                  <input
                    type="file"
                    multiple
                    id="status-pic-input"
                    onChange={e => handleFileUpload(e, 'Status Update Picture')}
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="hidden"
                  />
                  <label
                    htmlFor="status-pic-input"
                    className="w-full py-3 px-3 bg-blue-50 hover:bg-blue-100 border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-xl text-xs font-bold text-blue-800 transition flex flex-col items-center justify-center gap-1 cursor-pointer shadow-2xs group text-center"
                  >
                    <div className="p-2 bg-blue-600 text-white rounded-full group-hover:scale-110 transition shadow-xs">
                      <Camera className="w-4 h-4" />
                    </div>
                    <span>1. Status Update Picture</span>
                    <span className="text-[10px] text-blue-600 font-normal">Add Status/Process Photos</span>
                  </label>
                </div>

                {/* 2. CPV Picture */}
                <div>
                  <input
                    type="file"
                    multiple
                    id="cpv-pic-input"
                    onChange={e => handleFileUpload(e, 'CPV Picture')}
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="hidden"
                  />
                  <label
                    htmlFor="cpv-pic-input"
                    className="w-full py-3 px-3 bg-purple-50 hover:bg-purple-100 border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-xl text-xs font-bold text-purple-800 transition flex flex-col items-center justify-center gap-1 cursor-pointer shadow-2xs group text-center"
                  >
                    <div className="p-2 bg-purple-600 text-white rounded-full group-hover:scale-110 transition shadow-xs">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span>2. CPV Picture</span>
                    <span className="text-[10px] text-purple-600 font-normal">Add Field Verification Photo</span>
                  </label>
                </div>

                {/* 3. Others */}
                <div>
                  <input
                    type="file"
                    multiple
                    id="others-pic-input"
                    onChange={e => handleFileUpload(e, 'Others')}
                    accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
                    className="hidden"
                  />
                  <label
                    htmlFor="others-pic-input"
                    className="w-full py-3 px-3 bg-emerald-50 hover:bg-emerald-100 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl text-xs font-bold text-emerald-800 transition flex flex-col items-center justify-center gap-1 cursor-pointer shadow-2xs group text-center"
                  >
                    <div className="p-2 bg-emerald-600 text-white rounded-full group-hover:scale-110 transition shadow-xs">
                      <Paperclip className="w-4 h-4" />
                    </div>
                    <span>3. Others</span>
                    <span className="text-[10px] text-emerald-600 font-normal">Add Other Photos / PDF Docs</span>
                  </label>
                </div>
              </div>

              {/* Immediate Picture Auto-Previews Gallery */}
              {(pendingUploads.length > 0 || existingAttachments.length > 0) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Attached Pictures & Documents ({existingAttachments.length + pendingUploads.length})</span>
                    <span className="text-[11px] text-emerald-600 font-semibold">Auto-preview enabled</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {/* Staged pending uploads (shown automatically with image preview!) */}
                    {pendingUploads.map((item, idx) => {
                      const isImage = item.file.type.startsWith('image/');
                      return (
                        <div
                          key={`pending-${idx}`}
                          className="bg-white rounded-xl border border-blue-300 shadow-sm overflow-hidden flex flex-col justify-between text-xs group"
                        >
                          {/* Image Thumbnail preview */}
                          {isImage ? (
                            <div className="relative h-28 bg-slate-100 overflow-hidden cursor-pointer" onClick={() => setSelectedAttachment({
                              id: `tmp_${idx}`,
                              fileId: formData.fileId,
                              category: item.category,
                              fileName: item.file.name,
                              fileType: item.file.type,
                              fileSize: item.file.size,
                              uploadedBy: user?.username || 'You',
                              uploadedAt: new Date().toISOString(),
                              dataUrl: item.dataUrl,
                            })}>
                              <img
                                src={item.previewUrl}
                                alt={item.file.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white shadow-xs">
                                {item.category}
                              </span>
                            </div>
                          ) : (
                            <div className="h-28 bg-slate-100 flex flex-col items-center justify-center p-2 text-center">
                              <FileText className="w-8 h-8 text-red-500 mb-1" />
                              <span className="text-[10px] font-semibold text-slate-700 truncate w-full">{item.file.name}</span>
                              <span className="text-[9px] text-slate-400">{item.category}</span>
                            </div>
                          )}

                          <div className="p-2 flex items-center justify-between border-t border-slate-100">
                            <span className="text-[10px] font-medium text-slate-500 truncate max-w-[100px]">
                              {(item.file.size / 1024).toFixed(1)} KB
                            </span>
                            <button
                              type="button"
                              onClick={() => removePendingUpload(idx)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                              title="Remove"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Existing saved attachments */}
                    {existingAttachments.map(att => {
                      const isImage = att.fileType.startsWith('image/');
                      const previewUrl = api.getAttachmentPreviewUrl(att.id);
                      return (
                        <div
                          key={att.id}
                          className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between text-xs group"
                        >
                          {isImage ? (
                            <div
                              className="relative h-28 bg-slate-100 overflow-hidden cursor-pointer"
                              onClick={() => setSelectedAttachment(att)}
                            >
                              <img
                                src={previewUrl}
                                alt={att.fileName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900/80 text-white shadow-xs">
                                {att.category}
                              </span>
                            </div>
                          ) : (
                            <div className="h-28 bg-slate-100 flex flex-col items-center justify-center p-2 text-center">
                              <FileText className="w-8 h-8 text-red-500 mb-1" />
                              <span className="text-[10px] font-semibold text-slate-700 truncate w-full">{att.fileName}</span>
                              <span className="text-[9px] text-slate-400">{att.category}</span>
                            </div>
                          )}

                          <div className="p-2 flex items-center justify-between border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setSelectedAttachment(att)}
                              className="text-blue-600 hover:text-blue-800 text-[11px] font-bold flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(att.id)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION H: CPV STATUS */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-[#0F294A] uppercase tracking-wider pb-1 border-b border-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>H. CPV (Contact Point Verification) Status</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CPV Status
                  </label>
                  <select
                    value={formData.cpvStatus}
                    onChange={e => setFormData({ ...formData, cpvStatus: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-blue-900 bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Failed">Failed</option>
                    <option value="Not Required">Not Required</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CPV Verification Date
                  </label>
                  <input
                    type="date"
                    value={formData.cpvDate}
                    onChange={e => setFormData({ ...formData, cpvDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      CPV Verified Address
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoDetectCpvAddress}
                      disabled={isDetectingCpvAddress}
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-bold transition disabled:opacity-50"
                      title="Use Google/GPS location to identify and fill CPV field address"
                    >
                      <MapPin className={`w-3.5 h-3.5 text-rose-500 ${isDetectingCpvAddress ? 'animate-bounce' : ''}`} />
                      <span>{isDetectingCpvAddress ? 'Detecting...' : '📍 Auto-Detect Location'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.cpvAddress}
                    onChange={e => setFormData({ ...formData, cpvAddress: e.target.value })}
                    placeholder="Physical address verified in person (or click Auto-Detect Location)"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CPV Remarks & Field Verification Notes
                  </label>
                  <input
                    type="text"
                    value={formData.cpvRemarks}
                    onChange={e => setFormData({ ...formData, cpvRemarks: e.target.value })}
                    placeholder="Officer remarks on premises, neighboring inquiries, identity confirmation..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* CPV Attachments */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <input
                  type="file"
                  ref={cpvPhotoInputRef}
                  onChange={e => handleFileUpload(e, 'CPV Photo')}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => cpvPhotoInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition flex items-center gap-1.5"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>Upload CPV Photo</span>
                </button>

                <input
                  type="file"
                  ref={cpvDocInputRef}
                  onChange={e => handleFileUpload(e, 'CPV Supporting Document')}
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => cpvDocInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Upload CPV Report / Doc</span>
                </button>
              </div>
            </div>

            {/* Submit / Cancel Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving File...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isEditing ? 'Save & Update Record' : 'Create Customer File'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SEARCH AND FILTERS BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by customer name, mobile, company, File ID, address, or product..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* RM filter (Admin & Mentor only) */}
            {user?.role !== 'RM' && (
              <select
                value={filterRmCode}
                onChange={e => setFilterRmCode(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700"
              >
                <option value="all">All RM Codes</option>
                {rms.map(r => (
                  <option key={r.rmCode} value={r.rmCode}>
                    RM {r.rmCode} ({r.rmName})
                  </option>
                ))}
              </select>
            )}

            {/* Product Type */}
            <select
              value={filterProduct}
              onChange={e => setFilterProduct(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700"
            >
              <option value="all">All Products</option>
              {productTypes.map((pt: string) => (
                <option key={pt} value={pt}>{pt}</option>
              ))}
            </select>

            {/* Application Status */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700"
            >
              <option value="all">All Statuses</option>
              {applicationStatuses.map((st: string) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            {/* Active Status */}
            <select
              value={filterActive}
              onChange={e => setFilterActive(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700"
            >
              <option value="all">Active Card (All)</option>
              <option value="Y">Y — Active</option>
              <option value="N">N — Inactive</option>
              <option value="C">C — Cancelled</option>
            </select>

            {/* CPV Status */}
            <select
              value={filterCpv}
              onChange={e => setFilterCpv(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700"
            >
              <option value="all">CPV (All)</option>
              <option value="Pending">CPV: Pending</option>
              <option value="Completed">CPV: Completed</option>
              <option value="Failed">CPV: Failed</option>
              <option value="Not Required">CPV: Not Required</option>
            </select>

            {/* Pending Documents Filter */}
            <select
              value={filterPendingDoc}
              onChange={e => setFilterPendingDoc(e.target.value)}
              className={`px-2.5 py-1.5 border rounded-lg font-medium text-xs ${
                filterPendingDoc !== 'all'
                  ? 'bg-red-50 border-red-300 text-red-700 font-bold ring-1 ring-red-400'
                  : 'bg-slate-50 border-slate-300 text-slate-700'
              }`}
            >
              <option value="all">Pending Docs (All)</option>
              <option value="has_pending">⚠️ Has Any Pending Docs</option>
              {pendingDocOptions.map((doc: string) => (
                <option key={doc} value={doc}>
                  ⚠️ {doc}
                </option>
              ))}
            </select>

            {/* Reset Filters Button */}
            {(search || filterProduct !== 'all' || filterStatus !== 'all' || filterActive !== 'all' || filterCpv !== 'all' || filterPendingDoc !== 'all' || filterRmCode !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setFilterProduct('all');
                  setFilterStatus('all');
                  setFilterActive('all');
                  setFilterCpv('all');
                  setFilterPendingDoc('all');
                  setFilterRmCode('all');
                }}
                className="px-2 py-1.5 text-slate-500 hover:text-slate-800 text-[11px] underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CUSTOMER FILES TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#0F294A] text-white uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-3">File ID</th>
                <th className="py-3 px-2">CC-number</th>
                <th className="py-3 px-3">Customer Name</th>
                <th className="py-3 px-3">Mobile</th>
                <th className="py-3 px-3">Company / Office</th>
                <th className="py-3 px-2">Product</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2 text-center">Active</th>
                {user?.role !== 'RM' && <th className="py-3 px-2">RM Code</th>}
                {user?.role === 'Mentor' && <th className="py-3 px-2">Entry Location</th>}
                <th className="py-3 px-2">CPV</th>
                <th className="py-3 px-3">Created</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={12 + (user?.role !== 'RM' ? 1 : 0) + (user?.role === 'Mentor' ? 1 : 0)} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading authorized customer files...</span>
                    </div>
                  </td>
                </tr>
              ) : files.length === 0 ? (
                <tr>
                  <td colSpan={12 + (user?.role !== 'RM' ? 1 : 0) + (user?.role === 'Mentor' ? 1 : 0)} className="py-12 text-center text-slate-400">
                    No customer files found matching the criteria.
                  </td>
                </tr>
              ) : (
                files.map(file => (
                  <tr key={file.fileId} className="hover:bg-blue-50/50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {file.fileId}
                    </td>
                    <td className="py-3 px-2 font-mono whitespace-nowrap">
                      {file.ccNumber ? (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px] font-bold text-slate-800">
                          {file.ccNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {file.customerName}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {file.mobile}
                    </td>
                    <td className="py-3 px-3 text-slate-700 max-w-xs truncate" title={file.companyName}>
                      {file.companyName}
                    </td>
                    <td className="py-3 px-2 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800">
                        {file.productType}
                      </span>
                    </td>
                    <td className="py-3 px-2 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        file.applicationStatus === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                        file.applicationStatus === 'Submitted' ? 'bg-amber-100 text-amber-800' :
                        file.applicationStatus === 'Declined' ? 'bg-rose-100 text-rose-800' :
                        file.applicationStatus === 'Query' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {file.applicationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold font-mono ${
                        file.activeStatus === 'Y' ? 'bg-green-100 text-green-800' :
                        file.activeStatus === 'C' ? 'bg-zinc-200 text-zinc-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {file.activeStatus}
                      </span>
                    </td>
                    {user?.role !== 'RM' && (
                      <td className="py-3 px-2 font-mono text-blue-800 font-semibold whitespace-nowrap">
                        {file.rmCode}
                      </td>
                    )}
                    {user?.role === 'Mentor' && (
                      <td className="py-3 px-2 whitespace-nowrap">
                        {file.locationAddress ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-medium border border-emerald-200" title={file.locationAddress}>
                            <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate max-w-[120px]">{file.locationAddress}</span>
                          </span>
                        ) : file.locationLat ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-mono border border-blue-200">
                            <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                            <span>{file.locationLat.toFixed(3)}, {file.locationLng?.toFixed(3)}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">—</span>
                        )}
                      </td>
                    )}
                    <td className="py-3 px-2 whitespace-nowrap">
                      <span className={`text-[10px] font-semibold ${
                        file.cpvStatus === 'Completed' ? 'text-emerald-700 font-bold' :
                        file.cpvStatus === 'Failed' ? 'text-red-600 font-bold' :
                        'text-slate-500'
                      }`}>
                        {file.cpvStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap text-[11px]">
                      {formatDhakaDateOnly(file.createdAt)}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap space-x-1">
                      {/* View Details */}
                      <button
                        onClick={() => setViewDetailsFile(file)}
                        className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition"
                        title="View Full Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleEdit(file)}
                        className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition"
                        title="Edit Record"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete Button (Admin & Mentor only) */}
                      {user?.role !== 'RM' && (
                        <button
                          onClick={() => setDeleteConfirmId(file.fileId)}
                          className="p-1 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded transition"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <strong>{files.length}</strong> of <strong>{pagination.total}</strong> records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchFiles(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-800">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => fetchFiles(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      {viewDetailsFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#0F294A] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">{viewDetailsFile.customerName}</h3>
                <p className="text-xs text-blue-200 font-mono">File ID: {viewDetailsFile.fileId}</p>
              </div>
              <button
                onClick={() => setViewDetailsFile(null)}
                className="p-1 text-slate-300 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg">
                <div>
                  <span className="text-slate-500 font-semibold">RM Code:</span>
                  <p className="font-mono font-bold text-blue-800">{viewDetailsFile.rmCode} ({viewDetailsFile.rmName})</p>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Product:</span>
                  <p className="font-bold text-slate-800">{viewDetailsFile.productType}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Application Status:</span>
                  <p className="font-bold text-slate-800">{viewDetailsFile.applicationStatus}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Active Status:</span>
                  <p className="font-bold text-slate-800">{viewDetailsFile.activeStatus}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">CC-number:</span>
                  <p className="font-mono font-bold text-slate-800">{viewDetailsFile.ccNumber || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Mobile:</span>
                  <p className="font-mono font-medium">{viewDetailsFile.mobile}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Email:</span>
                  <p className="font-medium">{viewDetailsFile.email || '—'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 font-semibold">Company & Address:</span>
                  <p className="font-medium">{viewDetailsFile.companyName} • {viewDetailsFile.officeAddress}</p>
                </div>

                {/* Entry Location: Visible ONLY to Mentor */}
                {user?.role === 'Mentor' && (
                  <div className="col-span-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                    <span className="font-bold flex items-center gap-1.5 mb-1 text-emerald-800 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>RM Entry Location (Mentor Access Only):</span>
                    </span>
                    <p className="text-xs">
                      Address: <strong>{viewDetailsFile.locationAddress || 'No reverse address'}</strong>
                    </p>
                    {viewDetailsFile.locationLat && (
                      <p className="font-mono text-[11px] text-emerald-700 mt-0.5">
                        Coordinates: {viewDetailsFile.locationLat.toFixed(5)}, {viewDetailsFile.locationLng?.toFixed(5)} ({viewDetailsFile.locationCapturedAt ? formatDhakaDateTime(viewDetailsFile.locationCapturedAt) : 'Captured at entry'})
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Pending Docs */}
              <div>
                <span className="font-bold text-slate-800 block mb-1">Pending Documents:</span>
                {viewDetailsFile.pendingDocuments && viewDetailsFile.pendingDocuments.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {viewDetailsFile.pendingDocuments.map(d => (
                      <span key={d} className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-semibold text-[11px]">
                        {d}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-emerald-600 font-semibold">No pending documents</span>
                )}
              </div>

              {/* CPV */}
              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100">
                <span className="font-bold text-blue-900 block mb-1">CPV Verification Details:</span>
                <p>Status: <strong>{viewDetailsFile.cpvStatus}</strong></p>
                <p>Date: {viewDetailsFile.cpvDate || '—'}</p>
                <p>Address: {viewDetailsFile.cpvAddress || '—'}</p>
                <p>Remarks: {viewDetailsFile.cpvRemarks || '—'}</p>
              </div>

              {/* Remarks */}
              {viewDetailsFile.remarks && (
                <div>
                  <span className="font-bold text-slate-800 block mb-1">Remarks:</span>
                  <p className="p-2.5 bg-slate-100 rounded text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {viewDetailsFile.remarks}
                  </p>
                </div>
              )}

              {/* Attachments */}
              {viewDetailsFile.attachments && viewDetailsFile.attachments.length > 0 && (
                <div>
                  <span className="font-bold text-slate-800 block mb-2">Attached Documents ({viewDetailsFile.attachments.length}):</span>
                  <div className="space-y-1.5">
                    {viewDetailsFile.attachments.map(att => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2 bg-slate-50 border rounded text-xs"
                      >
                        <span className="font-medium truncate max-w-sm">{att.fileName} ({att.category})</span>
                        <button
                          onClick={() => setSelectedAttachment(att)}
                          className="px-2.5 py-1 bg-blue-600 text-white rounded text-[11px] font-semibold"
                        >
                          Preview
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-[11px] text-slate-400 pt-2 border-t">
                Created: {formatDhakaDateTime(viewDetailsFile.createdAt)} by {viewDetailsFile.createdBy} • Updated: {formatDhakaDateTime(viewDetailsFile.updatedAt)} by {viewDetailsFile.updatedBy}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t flex justify-end">
              <button
                onClick={() => setViewDetailsFile(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 max-w-md w-full">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base">Confirm Record Deletion</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete file <strong className="text-slate-900 font-mono">{deleteConfirmId}</strong>?
              {user?.role === 'Mentor'
                ? ' As a Mentor, this action performs an authorized permanent purge or soft-deletion logged in audit logs.'
                : ' This record will be soft-deleted and logged.'}
            </p>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT VIEWER MODAL */}
      <DocumentViewerModal
        attachment={selectedAttachment}
        onClose={() => setSelectedAttachment(null)}
      />
    </div>
  );
};
