import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  Sliders, 
  Layers, 
  Eye, 
  Download, 
  Copy, 
  Check, 
  ExternalLink,
  Search,
  Database,
  ArrowRight,
  LogOut,
  MapPin,
  Cpu,
  User as UserIcon,
  HardHat,
  Award,
  Zap,
  Wrench,
  Hammer,
  Upload,
  FileUp,
  Clipboard,
  HelpCircle,
  Trash2
} from 'lucide-react';
import { User } from 'firebase/auth';
import { googleSignIn, logout, initAuth } from '../lib/googleAuth';
import { 
  listUserGoogleSheets, 
  getSpreadsheetMetadata, 
  fetchSheetValues, 
  fetchSpreadsheetData,
  autoDetectColumnMapping, 
  parseSheetRowsToFundis, 
  extractSpreadsheetId,
  parseCsvString,
  DriveSpreadsheetFile,
  SheetTabInfo
} from '../lib/googleSheetsService';
import { Fundi } from '../types';
import { 
  NITA_DATASET_NAME, 
  NITA_DATASET_HEADERS, 
  NITA_RAW_ROWS, 
  generateNitaMockFundis 
} from '../data/nitaMockDataset';
import { getCategoryIcon } from '../utils/categoryIcons';

interface GoogleSheetsDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetImported: (importedFundis: Fundi[], datasetMeta: { title: string; count: number; sheetName: string; spreadsheetId: string }) => void;
  activeSheetMeta?: { title: string; count: number; sheetName: string; spreadsheetId: string } | null;
  onClearCustomDataset?: () => void;
}

export const GoogleSheetsDatasetModal: React.FC<GoogleSheetsDatasetModalProps> = ({
  isOpen,
  onClose,
  onDatasetImported,
  activeSheetMeta,
  onClearCustomDataset
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Input Mode: 'url' (Link/ID) | 'csv' (Upload/Paste) | 'drive' (Google Drive) | 'nita' (Sample Benchmark)
  const [inputMode, setInputMode] = useState<'url' | 'csv' | 'drive' | 'nita'>('url');
  
  // Drive files
  const [driveFiles, setDriveFiles] = useState<DriveSpreadsheetFile[]>([]);
  const [loadingDriveFiles, setLoadingDriveFiles] = useState(false);
  const [driveSearch, setDriveSearch] = useState('');

  // Selected spreadsheet & tabs
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState('');
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState('');
  const [spreadsheetTitle, setSpreadsheetTitle] = useState('');
  const [sheetTabs, setSheetTabs] = useState<SheetTabInfo[]>([]);
  const [selectedTab, setSelectedTab] = useState('');
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Raw data & column mapping
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<(string | number)[][]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [loadingRows, setLoadingRows] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  // CSV file & text upload
  const [pastedCsvText, setPastedCsvText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Preview parsed fundis
  const [parsedPreview, setParsedPreview] = useState<Fundi[]>([]);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  // Show helpful share guide
  const [showShareGuide, setShowShareGuide] = useState(false);

  // Init Auth on open
  useEffect(() => {
    if (!isOpen) return;
    
    const unsubscribe = initAuth(
      (authUser) => {
        setUser(authUser);
      },
      () => {
        setUser(null);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen]);

  // Load drive files when logged in and in drive mode
  useEffect(() => {
    if (user && isOpen && inputMode === 'drive') {
      fetchDriveFiles();
    }
  }, [user, isOpen, inputMode]);

  const handleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        fetchDriveFiles();
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to sign in with Google');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setDriveFiles([]);
  };

  const fetchDriveFiles = async () => {
    setLoadingDriveFiles(true);
    setStatusMessage(null);
    try {
      const files = await listUserGoogleSheets();
      setDriveFiles(files);
      if (files.length === 0) {
        setStatusMessage({
          type: 'info',
          text: 'No spreadsheets found in your Google Drive. You can paste a sheet link or upload a CSV file.'
        });
      }
    } catch (err: any) {
      console.error('Error fetching drive files:', err);
      setStatusMessage({
        type: 'info',
        text: 'Could not list Google Drive files automatically. You can enter the spreadsheet link directly or upload a CSV.'
      });
    } finally {
      setLoadingDriveFiles(false);
    }
  };

  // Load NITA Mock Dataset
  const handleLoadNitaDataset = () => {
    setInputMode('nita');
    setSelectedSpreadsheetId('nita-artisan-dataset-id');
    setSpreadsheetTitle(NITA_DATASET_NAME);
    setSheetTabs([
      { title: 'NITA_Certified_Artisans', sheetId: 1, rowCount: NITA_RAW_ROWS.length, columnCount: NITA_DATASET_HEADERS.length },
      { title: 'Model_Weights_Trade_Rankings', sheetId: 2, rowCount: 14, columnCount: 8 }
    ]);
    setSelectedTab('NITA_Certified_Artisans');
    setHeaders(NITA_DATASET_HEADERS);
    setRawRows(NITA_RAW_ROWS);

    const mapping: Record<string, string> = {
      name: 'Artisan Name',
      category: 'Trade Category',
      rating: 'Rating',
      modelScore: 'Trained ML Match Score',
      hourlyRate: 'Hourly Rate (KES)',
      inspectionFee: 'Inspection Fee (KES)',
      phone: 'Phone Number',
      whatsapp: 'WhatsApp',
      experienceYears: 'Experience Years',
      jobsCompleted: 'Jobs Completed',
      skills: 'Key Skills & Specializations',
      neighborhood: 'Neighborhood',
      lat: 'Latitude',
      lng: 'Longitude',
      isVerified: 'Verified NITA Status'
    };
    setColumnMap(mapping);

    const fundis = generateNitaMockFundis();
    setParsedPreview(fundis);
    setStatusMessage({
      type: 'success',
      text: `Loaded ${fundis.length} benchmark NITA-certified artisans across Nairobi.`
    });
  };

  // Connect and load spreadsheet by URL or ID (supports both public and OAuth sheets)
  const handleConnectByUrl = async (urlOrId: string) => {
    const raw = urlOrId.trim();
    if (!raw) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid Google Sheet URL or ID' });
      return;
    }

    const cleanId = extractSpreadsheetId(raw);
    setSelectedSpreadsheetId(cleanId);
    setLoadingMetadata(true);
    setStatusMessage(null);

    try {
      const data = await fetchSpreadsheetData(raw);
      setSpreadsheetTitle(data.title);
      setSheetTabs(data.sheetTabs);
      setSelectedTab(data.sheetName);
      setHeaders(data.headers);
      setRawRows(data.rows);

      const mapping = autoDetectColumnMapping(data.headers);
      setColumnMap(mapping);

      const fundis = parseSheetRowsToFundis(data.headers, data.rows, mapping, data.title);
      setParsedPreview(fundis);

      setStatusMessage({
        type: 'success',
        text: `Connected successfully! Loaded ${fundis.length} artisan rows from "${data.title}" (Tab: ${data.sheetName}).`
      });
    } catch (err: any) {
      console.error('Error connecting Google Sheet:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to read Google Sheet. Make sure the sheet is shared as "Anyone with the link can view".'
      });
      setShowShareGuide(true);
    } finally {
      setLoadingMetadata(false);
    }
  };

  // Switch tab in an active spreadsheet
  const handleTabChange = async (tabName: string) => {
    if (!selectedSpreadsheetId || selectedSpreadsheetId === 'nita-artisan-dataset-id' || selectedSpreadsheetId === 'csv-upload') {
      setSelectedTab(tabName);
      return;
    }

    setSelectedTab(tabName);
    setLoadingRows(true);
    try {
      const data = await fetchSpreadsheetData(selectedSpreadsheetId, tabName);
      setHeaders(data.headers);
      setRawRows(data.rows);

      const mapping = autoDetectColumnMapping(data.headers);
      setColumnMap(mapping);

      const fundis = parseSheetRowsToFundis(data.headers, data.rows, mapping, spreadsheetTitle);
      setParsedPreview(fundis);

      setStatusMessage({
        type: 'success',
        text: `Switched to tab "${tabName}". Loaded ${fundis.length} artisans.`
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Failed to load tab "${tabName}": ${err.message}`
      });
    } finally {
      setLoadingRows(false);
    }
  };

  // Re-parse when column mapping changes
  const handleColumnMapChange = (mapKey: string, headerValue: string) => {
    const updated = { ...columnMap, [mapKey]: headerValue };
    setColumnMap(updated);
    const fundis = parseSheetRowsToFundis(headers, rawRows, updated, spreadsheetTitle || 'Custom Dataset');
    setParsedPreview(fundis);
  };

  // Handle direct CSV or pasted text parse
  const handleParseCsvContent = (content: string, datasetName: string = 'Uploaded Dataset') => {
    if (!content.trim()) {
      setStatusMessage({ type: 'error', text: 'Provided CSV data is empty.' });
      return;
    }

    try {
      const parsed = parseCsvString(content);
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        setStatusMessage({ type: 'error', text: 'Could not find any artisan rows or headers in this CSV.' });
        return;
      }

      setSelectedSpreadsheetId('csv-upload');
      setSpreadsheetTitle(datasetName);
      setSheetTabs([{ title: 'Artisans', sheetId: 1, rowCount: parsed.rows.length, columnCount: parsed.headers.length }]);
      setSelectedTab('Artisans');
      setHeaders(parsed.headers);
      setRawRows(parsed.rows);

      const mapping = autoDetectColumnMapping(parsed.headers);
      setColumnMap(mapping);

      const fundis = parseSheetRowsToFundis(parsed.headers, parsed.rows, mapping, datasetName);
      setParsedPreview(fundis);

      setStatusMessage({
        type: 'success',
        text: `Successfully parsed ${fundis.length} artisans from CSV!`
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Failed to parse CSV: ${err.message}` });
    }
  };

  // Handle file drop / input
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      handleParseCsvContent(text, file.name.replace(/\.[^/.]+$/, ''));
    };
    reader.onerror = () => {
      setStatusMessage({ type: 'error', text: 'Failed to read file.' });
    };
    reader.readAsText(file);
  };

  const copyTemplateCsv = () => {
    const csvContent = `Artisan Name,Trade Category,Neighborhood,Latitude,Longitude,Rating,Trained ML Score,Hourly Rate (KES),Phone Number,Experience Years,Skills,Jobs Completed
Kiprono Cheruiyot,Electrical Installation,Westlands,-1.2685,36.8045,4.95,96,950,+254711223344,9,"Solar PV, 3-Phase Wiring, Fault Triage",142
Faith Wambui,Plumbing & Pipe Fitting,Kilimani,-1.2921,36.7822,4.88,94,850,+254722334455,7,"PPR Pipe Welding, Booster Pumps, Water Heaters",118
Hassan Omar,Carpentry & Joinery,Karen,-1.3197,36.7065,4.92,91,800,+254733445566,12,"Custom Hardwood, Kitchen Cabinets, Locksmith",210
Erick Ochieng,Electronics & Appliance Repair,Lavington,-1.2720,36.7650,4.85,89,1100,+254744556677,6,"Smart Inverter Fridges, Washing Machines",95
Grace Njeri,Painting & Decoration,CBD,-1.2833,36.8233,4.79,87,750,+254755667788,5,"Epoxy Flooring, Silk Vinyl, Waterproof Priming",83
Moses Kiprop,Masonry & Tiling,South B,-1.3100,36.8350,4.90,93,850,+254766778899,11,"Porcelain Tiling, Foundation Reinforcement, Plaster",174
Dennis Muthoni,Welding & Metal Fabrication,Parklands,-1.2400,36.7800,4.82,88,900,+254777889900,8,"Laser Cut Gates, Security Grilles, Structural Steel",130
Beatrice Adhiambo,Refrigeration & Air Conditioning,Roysambu,-1.2200,36.8900,4.91,95,1200,+254788990011,7,"HVAC Ducting, Split AC Servicing, Gas Recharging",104`;

    navigator.clipboard.writeText(csvContent);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  // Compute category statistics from current parsed dataset
  const categoryStats = parsedPreview.reduce((acc, fundi) => {
    const cat = fundi.primaryCategory || 'General Trade';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryList = Object.entries(categoryStats).sort((a, b) => Number(b[1]) - Number(a[1]));

  // Import into application
  const handleFinalImport = async () => {
    if (parsedPreview.length === 0) return;
    setImporting(true);

    const meta = {
      title: spreadsheetTitle || 'Connected Artisan Sheet',
      count: parsedPreview.length,
      sheetName: selectedTab || 'Sheet1',
      spreadsheetId: selectedSpreadsheetId
    };

    try {
      // 1. Sync to server backend store so recommendations, USSD/SMS, and APIs all know about these artisans
      await fetch('/api/fundis/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fundis: parsedPreview,
          meta,
          replaceAll: true
        })
      }).catch(err => console.warn('Bulk import server sync warning:', err));

      // 2. Update client state
      onDatasetImported(parsedPreview, meta);

      setImportSuccess(true);
      setTimeout(() => {
        setImportSuccess(false);
        onClose();
      }, 1000);
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  const filteredDriveFiles = driveFiles.filter(f => 
    f.name.toLowerCase().includes(driveSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div 
        id="google-sheets-model-modal"
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white p-5 sm:p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black font-['Outfit',sans-serif] tracking-tight">
                    Connect Artisan Google Sheet
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live Sync
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Import your artisan directory from Google Sheets or CSV directly into Spana.
                </p>
              </div>
            </div>

            {/* Google Sign In status */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-emerald-300" />
                  )}
                  <span className="text-white font-medium truncate max-w-[120px]">{user.displayName || user.email}</span>
                  <button 
                    onClick={handleSignOut}
                    className="ml-1 text-slate-400 hover:text-white transition cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSignIn}
                  disabled={authLoading}
                  className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <UserIcon className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{authLoading ? 'Signing in...' : 'Sign in with Google'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Dataset Notice */}
          {activeSheetMeta && (
            <div className="mt-4 p-2.5 rounded-xl bg-emerald-800/60 border border-emerald-500/40 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>
                  Currently Active: <strong>{activeSheetMeta.title}</strong> ({activeSheetMeta.count} artisans loaded)
                </span>
              </div>
              {onClearCustomDataset && (
                <button
                  onClick={() => {
                    onClearCustomDataset();
                    setStatusMessage({ type: 'info', text: 'Reset dataset back to standard fundis.' });
                  }}
                  className="text-[11px] font-bold text-amber-200 hover:text-white underline cursor-pointer"
                >
                  Reset to Baseline
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">

          {/* MODE SELECTOR TABS */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              onClick={() => {
                setInputMode('url');
                setShowShareGuide(false);
              }}
              className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                inputMode === 'url'
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Google Sheet Link</span>
            </button>

            <button
              onClick={() => {
                setInputMode('csv');
                setShowShareGuide(false);
              }}
              className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                inputMode === 'csv'
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileUp className="w-4 h-4 text-blue-600" />
              <span>Upload CSV / Paste</span>
            </button>

            <button
              onClick={() => {
                setInputMode('drive');
                setShowShareGuide(false);
              }}
              className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                inputMode === 'drive'
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-4 h-4 text-indigo-600" />
              <span>My Google Drive</span>
            </button>

            <button
              onClick={() => {
                handleLoadNitaDataset();
              }}
              className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                inputMode === 'nita'
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-4 h-4 text-amber-600" />
              <span>Sample NITA Dataset</span>
            </button>
          </div>

          {/* TAB 1: Direct Google Sheet Link / ID */}
          {inputMode === 'url' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 block">
                    Paste Your Google Sheet Link or ID
                  </label>
                  <button
                    onClick={() => setShowShareGuide(!showShareGuide)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showShareGuide ? 'Hide instructions' : 'How to share your sheet'}</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={spreadsheetIdInput}
                      onChange={(e) => setSpreadsheetIdInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConnectByUrl(spreadsheetIdInput);
                      }}
                      placeholder="e.g. https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                      className="w-full px-3.5 py-2.5 pl-9 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                    <FileSpreadsheet className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                  <button
                    onClick={() => handleConnectByUrl(spreadsheetIdInput)}
                    disabled={loadingMetadata || !spreadsheetIdInput.trim()}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 shadow-xs cursor-pointer"
                  >
                    {loadingMetadata ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Connect Sheet</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Step by step sharing instructions */}
                <div className={`p-3.5 rounded-xl border text-xs transition-all ${
                  showShareGuide 
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 block'
                    : 'bg-slate-100/70 border-slate-200 text-slate-600'
                }`}>
                  <p className="font-bold mb-1 flex items-center gap-1.5 text-slate-900">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    How to prepare your Google Sheet:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700 text-[11px] leading-relaxed pl-1">
                    <li>Open your artisan spreadsheet in <strong>Google Sheets</strong>.</li>
                    <li>Click the blue <strong>Share</strong> button in the top-right corner.</li>
                    <li>Under <em>General access</em>, change from <strong>Restricted</strong> to <strong>&quot;Anyone with the link can view&quot;</strong>.</li>
                    <li>Click <strong>Copy link</strong>, paste it into the box above, and click <strong>Connect Sheet</strong>!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Upload CSV / Paste Raw Data */}
          {inputMode === 'csv' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Drag & Drop / File selector */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const files = e.dataTransfer.files;
                    if (files.length > 0) handleFileUpload(files[0]);
                  }}
                  className={`p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all ${
                    isDragOver 
                      ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]' 
                      : 'border-slate-300 bg-slate-50 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="p-3 rounded-full bg-emerald-100 text-emerald-700 mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">
                    Drop your CSV or TSV file here
                  </h4>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Exported from Google Sheets (File &gt; Download &gt; CSV)
                  </p>
                  <label className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-2xs transition cursor-pointer">
                    Browse File
                    <input 
                      type="file" 
                      accept=".csv,.tsv,.txt" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }} 
                    />
                  </label>
                </div>

                {/* Paste Raw Text Box */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Clipboard className="w-3.5 h-3.5 text-blue-600" />
                      <span>Or Paste CSV / Excel Cells</span>
                    </label>
                    <button
                      onClick={copyTemplateCsv}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedTemplate ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedTemplate ? 'Copied!' : 'Sample Format'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={pastedCsvText}
                    onChange={(e) => setPastedCsvText(e.target.value)}
                    placeholder="Artisan Name,Trade Category,Neighborhood,Phone,Hourly Rate...&#10;John Kamau,Plumbing & Pipe Fitting,Westlands,+254712345678,850"
                    className="w-full flex-1 p-2.5 bg-white rounded-xl border border-slate-300 text-xs font-mono text-slate-800 outline-hidden focus:border-blue-500 resize-none"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => handleParseCsvContent(pastedCsvText, 'Pasted Artisans Data')}
                      disabled={!pastedCsvText.trim()}
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Parse Artisans
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: Google Drive Sheet Browser */}
          {inputMode === 'drive' && (
            <div className="space-y-3">
              {!user ? (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Sign in to Access Your Google Drive</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Connect your Google Account to automatically list and select spreadsheets from your personal or workspace Drive.
                    </p>
                  </div>
                  <button
                    onClick={handleSignIn}
                    disabled={authLoading}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-emerald-400" />
                    <span>{authLoading ? 'Signing in...' : 'Sign in with Google'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={driveSearch}
                        onChange={(e) => setDriveSearch(e.target.value)}
                        placeholder="Search spreadsheets in Google Drive..."
                        className="w-full pl-9 pr-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:border-emerald-500"
                      />
                    </div>
                    <button
                      onClick={fetchDriveFiles}
                      disabled={loadingDriveFiles}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                      title="Refresh files"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingDriveFiles ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {loadingDriveFiles ? (
                    <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>Loading your spreadsheets from Google Drive...</span>
                    </div>
                  ) : filteredDriveFiles.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                      No spreadsheets found. You can switch to &quot;Google Sheet Link&quot; and paste a direct URL.
                    </div>
                  ) : (
                    <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                      {filteredDriveFiles.map((file) => (
                        <div
                          key={file.id}
                          onClick={() => handleConnectByUrl(file.id)}
                          className={`p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                            selectedSpreadsheetId === file.id
                              ? 'bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-400'
                              : 'bg-white hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{file.name}</p>
                              <p className="text-[10px] text-slate-400">
                                Modified: {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Recent'}
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg shrink-0">
                            Select
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: NITA Mock Dataset Quick Banner */}
          {inputMode === 'nita' && (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 p-4 sm:p-5 rounded-2xl border border-emerald-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-600 text-white">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Spana NITA Benchmark Dataset
                    </h3>
                    <p className="text-xs text-slate-600">
                      National Industrial Training Authority (NITA) accredited Kenyan artisan trade directory.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  {NITA_RAW_ROWS.length} Verified Artisans
                </span>
              </div>
            </div>
          )}

          {/* Status Message Banner */}
          {statusMessage && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              statusMessage.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}>
              {statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 whitespace-pre-line leading-relaxed">
                {statusMessage.text}
              </div>
            </div>
          )}

          {/* ACTIVE SHEET & TABS SELECTOR */}
          {sheetTabs.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Active Spreadsheet
                    </span>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">
                      {spreadsheetTitle}
                    </h3>
                  </div>
                </div>

                {/* Tab selector */}
                {sheetTabs.length > 1 && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-600 font-semibold">Sheet Tab:</label>
                    <select
                      value={selectedTab}
                      onChange={(e) => handleTabChange(e.target.value)}
                      className="px-3 py-1.5 bg-white rounded-xl border border-slate-300 text-xs font-bold text-slate-800 outline-hidden"
                    >
                      {sheetTabs.map(t => (
                        <option key={t.title} value={t.title}>
                          {t.title} {t.rowCount ? `(${t.rowCount} rows)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* DETECTED CATEGORIES BREAKDOWN */}
              {categoryList.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>Artisan Trades Detected ({categoryList.length} Categories)</span>
                    </h4>
                    <span className="text-[11px] font-bold text-slate-500">
                      Total: {parsedPreview.length} artisans
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {categoryList.map(([catName, count]) => {
                      const Icon = getCategoryIcon(catName);
                      return (
                        <span 
                          key={catName} 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs"
                        >
                          <Icon className="w-3.5 h-3.5 text-orange-600" />
                          <span>{catName}</span>
                          <span className="px-1.5 py-0.2 rounded-md bg-orange-100 text-orange-800 text-[10px] font-black">
                            {count}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* COLUMN MAPPING CONTROLS */}
              {headers.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Column Schema Mapping ({headers.length} columns detected)</span>
                    </h4>
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-md">
                      Auto-Matched
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    
                    {/* Artisan Full Name */}
                    <div className="bg-white p-2.5 rounded-xl border-2 border-emerald-200 shadow-2xs">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold uppercase text-emerald-800 block">
                          Artisan Full Name *
                        </label>
                        <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1 rounded">Primary</span>
                      </div>
                      <select
                        value={columnMap.name || ''}
                        onChange={(e) => handleColumnMapChange('name', e.target.value)}
                        className="w-full text-xs font-bold text-slate-900 border-none bg-transparent outline-hidden"
                      >
                        <option value="">-- Select Full Name Column --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <span className="text-[10px] text-slate-400 block mt-0.5">e.g. "Full Name", "Artisan Name"</span>
                    </div>

                    {/* Artisan ID / Code */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold uppercase text-slate-600 block">
                          Artisan ID / Code
                        </label>
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1 rounded">Optional</span>
                      </div>
                      <select
                        value={columnMap.artisanId || ''}
                        onChange={(e) => handleColumnMapChange('artisanId', e.target.value)}
                        className="w-full text-xs font-medium text-slate-800 border-none bg-transparent outline-hidden"
                      >
                        <option value="">-- None / Auto Generated --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <span className="text-[10px] text-slate-400 block mt-0.5">e.g. "Artisan ID", "Reg No"</span>
                    </div>

                    {/* First Name (If split) */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                        First Name (If Split)
                      </label>
                      <select
                        value={columnMap.firstName || ''}
                        onChange={(e) => handleColumnMapChange('firstName', e.target.value)}
                        className="w-full text-xs font-medium text-slate-800 border-none bg-transparent outline-hidden"
                      >
                        <option value="">-- None --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Last Name / Surname (If split) */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                        Last Name / Surname
                      </label>
                      <select
                        value={columnMap.lastName || ''}
                        onChange={(e) => handleColumnMapChange('lastName', e.target.value)}
                        className="w-full text-xs font-medium text-slate-800 border-none bg-transparent outline-hidden"
                      >
                        <option value="">-- None --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Trade Category */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                        Trade Category *
                      </label>
                      <select
                        value={columnMap.category || ''}
                        onChange={(e) => handleColumnMapChange('category', e.target.value)}
                        className="w-full text-xs font-medium text-slate-800 border-none bg-transparent outline-hidden"
                      >
                        <option value="">-- General Trade --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Neighborhood / Location */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                        Estate / Location (Kenya)
                      </label>
                      <select
                        value={columnMap.neighborhood || ''}
                        onChange={(e) => handleColumnMapChange('neighborhood', e.target.value)}
                        className="w-full text-xs font-medium text-slate-800 border-none bg-transparent outline-hidden"
                      >
                        <option value="">-- Auto Nairobi Center --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Hourly Rate */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                        Rate (KES)
                      </label>
                      <select
                        value={columnMap.hourlyRate || ''}
                        onChange={(e) => handleColumnMapChange('hourlyRate', e.target.value)}
                        className="w-full text-xs font-medium text-slate-800 border-none bg-transparent outline-hidden"
                      >
                        <option value="">-- Default KES 850 --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Phone Number */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                        Phone Number
                      </label>
                      <select
                        value={columnMap.phone || ''}
                        onChange={(e) => handleColumnMapChange('phone', e.target.value)}
                        className="w-full text-xs font-medium text-slate-800 border-none bg-transparent outline-hidden"
                      >
                        <option value="">-- Auto Format --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Rating */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                        Rating (1-5★)
                      </label>
                      <select
                        value={columnMap.rating || ''}
                        onChange={(e) => handleColumnMapChange('rating', e.target.value)}
                        className="w-full text-xs font-medium text-slate-800 border-none bg-transparent outline-hidden"
                      >
                        <option value="">-- Default 4.8★ --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Skills */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                        Skills / Services
                      </label>
                      <select
                        value={columnMap.skills || ''}
                        onChange={(e) => handleColumnMapChange('skills', e.target.value)}
                        className="w-full text-xs font-medium text-slate-800 border-none bg-transparent outline-hidden"
                      >
                        <option value="">-- Auto Diagnostics --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* GPS Coordinates */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                        GPS Coordinates
                      </label>
                      <select
                        value={columnMap.lat || ''}
                        onChange={(e) => handleColumnMapChange('lat', e.target.value)}
                        className="w-full text-xs font-medium text-slate-800 border-none bg-transparent outline-hidden"
                      >
                        <option value="">-- Geocode from Estate --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                  </div>
                </div>
              )}

              {/* LIVE DATASET PARSED PREVIEW TABLE */}
              {parsedPreview.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Artisans Preview ({parsedPreview.length} ready to import)</span>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Showing top {Math.min(parsedPreview.length, 5)} rows
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <tr>
                          <th className="p-2.5 font-bold">Artisan Name</th>
                          <th className="p-2.5 font-bold">Trade</th>
                          <th className="p-2.5 font-bold">Location</th>
                          <th className="p-2.5 font-bold">Phone</th>
                          <th className="p-2.5 font-bold">Rate</th>
                          <th className="p-2.5 font-bold">Rating</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedPreview.slice(0, 5).map((f) => {
                          const CatIcon = getCategoryIcon(f.primaryCategory);
                          return (
                            <tr key={f.id} className="hover:bg-slate-50/70">
                              <td className="p-2.5 font-bold text-slate-900">
                                <div className="flex items-center gap-2">
                                  <img src={f.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200" />
                                  <div className="min-w-0">
                                    <div className="text-xs font-black text-slate-900 truncate max-w-[150px]">{f.name}</div>
                                    {f.artisanId ? (
                                      <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                                        <span className="text-slate-400">ID:</span>
                                        <span className="font-semibold text-slate-700 bg-slate-100 px-1 rounded">{f.artisanId}</span>
                                      </div>
                                    ) : (
                                      <div className="text-[9px] text-emerald-600 font-semibold">Verified Artisan</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="p-2.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">
                                  <CatIcon className="w-3 h-3 shrink-0" />
                                  <span className="truncate max-w-[120px]">{f.primaryCategory}</span>
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-600 truncate max-w-[110px]">
                                {f.location.neighborhood || 'Nairobi'}
                              </td>
                              <td className="p-2.5 text-slate-600 font-mono text-[11px]">
                                {f.phone}
                              </td>
                              <td className="p-2.5 text-slate-900 font-bold">
                                KES {f.hourlyRateKes}
                              </td>
                              <td className="p-2.5 font-semibold text-slate-800">
                                {f.rating}★
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {parsedPreview.length > 0 ? (
              <span><strong>{parsedPreview.length}</strong> artisans ready to display on the marketplace and map.</span>
            ) : (
              <span>Paste a Google Sheet link, upload a CSV, or load the NITA dataset above.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleFinalImport}
              disabled={importing || parsedPreview.length === 0}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold shadow-md shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer"
            >
              {importSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Artisans Imported!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{importing ? 'Importing Dataset...' : `Import ${parsedPreview.length} Artisans`}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
