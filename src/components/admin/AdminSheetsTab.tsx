import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  RefreshCw, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Layers, 
  Eye, 
  Table,
  HardHat,
  Award,
  Filter
} from 'lucide-react';
import { Fundi } from '../../types';
import { formatCurrency } from '../../utils/format';

interface AdminSheetsTabProps {
  fundis: Fundi[];
  activeSheetMeta?: {
    title: string;
    count: number;
    sheetName: string;
    spreadsheetId: string;
  } | null;
  onOpenGoogleSheetsModal: () => void;
  onClearCustomDataset: () => void;
}

export const AdminSheetsTab: React.FC<AdminSheetsTabProps> = ({
  fundis,
  activeSheetMeta,
  onOpenGoogleSheetsModal,
  onClearCustomDataset
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = ['All', ...Array.from(new Set(fundis.map(f => f.primaryCategory)))];

  const filtered = fundis.filter(f => {
    const matchesSearch = 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.location.neighborhood?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.nitaCertificationLevel || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'All' || f.primaryCategory === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const exportCsv = () => {
    const headers = ['ID', 'Name', 'Phone', 'Category', 'HourlyRateKES', 'NITA_Accredited', 'NITA_Level', 'Rating', 'JobsCompleted', 'Neighborhood'];
    const rows = fundis.map(f => [
      f.id,
      `"${f.name}"`,
      f.phone,
      f.primaryCategory,
      f.hourlyRateKes,
      f.nitaAccredited ? 'YES' : 'NO',
      `"${f.nitaCertificationLevel || 'N/A'}"`,
      f.rating,
      f.jobsCompleted,
      `"${f.location.neighborhood || f.location.city}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `spana_dataset_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Active Sheet Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 font-['Outfit',sans-serif]">
                {activeSheetMeta?.title || 'National Industrial Training Authority (NITA) Certified Directory'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                Connected
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tab: <strong>{activeSheetMeta?.sheetName || 'Certified_Artisans_Master'}</strong> • {fundis.length} verified rows synced into recommendation engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGoogleSheetsModal}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Connect / Import Sheet</span>
          </button>

          <button
            onClick={exportCsv}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition flex items-center gap-1.5"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Row */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search artisans by name, phone, skill, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-orange-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dataset Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Artisan Name</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3">Trade</th>
                <th className="py-3 px-3">Hourly Rate</th>
                <th className="py-3 px-3">NITA Qualification</th>
                <th className="py-3 px-3">Rating</th>
                <th className="py-3 px-3">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No matching rows found in this sheet.
                  </td>
                </tr>
              ) : (
                filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3">
                      <div className="font-extrabold text-slate-900">{f.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{f.artisanId ? `ID: ${f.artisanId}` : f.id}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">{f.phone}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-orange-600">{f.primaryCategory}</span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      KES {formatCurrency(f.hourlyRateKes)}/hr
                    </td>
                    <td className="py-3 px-3">
                      {f.nitaAccredited ? (
                        <div className="flex items-center gap-1 text-emerald-700 font-bold">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          <span className="truncate max-w-[200px]">{f.nitaCertificationLevel || 'NITA Grade I'}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Field Peer Vetted</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800">★ {f.rating.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-400 ml-1">({f.jobsCompleted} jobs)</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {f.location.neighborhood || f.location.city}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
