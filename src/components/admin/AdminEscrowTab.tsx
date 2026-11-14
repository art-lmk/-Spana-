import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Wallet, 
  ArrowUpRight, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  Filter, 
  Eye, 
  DollarSign, 
  FileText, 
  Phone, 
  User, 
  HardHat, 
  ExternalLink,
  HelpCircle,
  X
} from 'lucide-react';
import { EscrowTransaction, EscrowStatus, EscrowMilestone } from '../../types';
import { formatCurrency } from '../../utils/format';

interface AdminEscrowTabProps {
  escrowTransactions: EscrowTransaction[];
  onUpdateEscrowStatus: (transactionId: string, newStatus: EscrowStatus, notes?: string) => void;
}

export const AdminEscrowTab: React.FC<AdminEscrowTabProps> = ({
  escrowTransactions,
  onUpdateEscrowStatus
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<EscrowTransaction | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Filtered transactions
  const filtered = escrowTransactions.filter(tx => {
    const matchesSearch = 
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.fundiName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.mpesaRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalHeld = escrowTransactions
    .filter(t => t.status === 'held_in_escrow')
    .reduce((sum, t) => sum + t.amountKes, 0);

  const totalReleased = escrowTransactions
    .filter(t => t.status === 'released_to_fundi')
    .reduce((sum, t) => sum + t.amountKes, 0);

  const totalDisputed = escrowTransactions
    .filter(t => t.status === 'disputed')
    .reduce((sum, t) => sum + t.amountKes, 0);

  const totalFeesCollected = escrowTransactions
    .filter(t => t.status === 'released_to_fundi')
    .reduce((sum, t) => sum + t.platformFeeKes, 0);

  const handleReleaseFunds = (tx: EscrowTransaction) => {
    if (window.confirm(`Release KES ${formatCurrency(tx.fundiPayoutKes)} to ${tx.fundiName} via M-Pesa B2C?`)) {
      onUpdateEscrowStatus(tx.id, 'released_to_fundi', 'Funds released to artisan upon verified job completion.');
      setActionSuccessMessage(`Successfully released KES ${formatCurrency(tx.fundiPayoutKes)} to ${tx.fundiName} (M-Pesa Ref: ${tx.mpesaRef}).`);
      setTimeout(() => setActionSuccessMessage(null), 5000);
    }
  };

  const handleDispute = (tx: EscrowTransaction) => {
    const reason = window.prompt('Enter dispute / hold reason:', 'Customer requested quality reinspection.');
    if (reason) {
      onUpdateEscrowStatus(tx.id, 'disputed', reason);
      setActionSuccessMessage(`Transaction ${tx.id} marked under dispute hold.`);
      setTimeout(() => setActionSuccessMessage(null), 5000);
    }
  };

  const handleRefund = (tx: EscrowTransaction) => {
    if (window.confirm(`Issue full refund of KES ${formatCurrency(tx.amountKes)} to ${tx.customerName}?`)) {
      onUpdateEscrowStatus(tx.id, 'refunded', 'Full refund returned to client M-Pesa account.');
      setActionSuccessMessage(`Refund of KES ${formatCurrency(tx.amountKes)} issued to ${tx.customerName}.`);
      setTimeout(() => setActionSuccessMessage(null), 5000);
    }
  };

  const getStatusBadge = (status: EscrowStatus) => {
    switch (status) {
      case 'held_in_escrow':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Lock className="w-3 h-3 text-amber-700" />
            <span>Funds Held in Escrow</span>
          </span>
        );
      case 'released_to_fundi':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            <span>Released to Fundi</span>
          </span>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
            <AlertCircle className="w-3 h-3 text-rose-700" />
            <span>Dispute Hold</span>
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <RefreshCw className="w-3 h-3 text-slate-600" />
            <span>Client Refunded</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getMilestoneLabel = (milestone: EscrowMilestone) => {
    switch (milestone) {
      case 'funds_locked':
        return 'Payment Secured';
      case 'artisan_dispatched':
        return 'Fundi En Route';
      case 'work_in_progress':
        return 'Work in Progress';
      case 'client_signoff_pending':
        return 'Pending Client Sign-off';
      case 'completed_released':
        return 'Verified & Paid';
      default:
        return milestone;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* Top Banner & Escrow Guarantee */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-5 sm:p-7 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-orange-500/10 blur-3xl pointer-events-none rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md">
                <Wallet className="w-4 h-4" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight font-['Outfit',sans-serif]">
                Fundi Escrow & Holding Money Vault
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Protects Kenyan homeowners and NITA artisans. Customer funds are held securely in the escrow account via M-Pesa Express until the homeowner inspects and signs off on the quality of work.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-xs">
            <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Escrow Safety Rating</div>
              <div className="text-lg font-black text-white">100% Backed</div>
              <div className="text-[10px] text-emerald-400 font-semibold">Zero Artisan Default</div>
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS ACTION NOTICE */}
      {actionSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs sm:text-sm text-emerald-900 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button 
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 ESCROW METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Currently in Escrow</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            KES {formatCurrency(totalHeld)}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold">
            {escrowTransactions.filter(t => t.status === 'held_in_escrow').length} jobs in progress
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Released to Fundis</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            KES {formatCurrency(totalReleased)}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold">
            Instant M-Pesa B2C payouts
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Disputes / Review</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            KES {formatCurrency(totalDisputed)}
          </div>
          <div className="text-[11px] text-rose-700 font-semibold">
            {escrowTransactions.filter(t => t.status === 'disputed').length} pending inspection
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Platform 5% Fee</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            KES {formatCurrency(totalFeesCollected)}
          </div>
          <div className="text-[11px] text-blue-700 font-semibold">
            Covers M-Pesa B2C API & insurance
          </div>
        </div>

      </div>

      {/* ESCROW WORKFLOW VISUALIZER */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <span>How Spana Escrow Protects Both Parties</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-xs font-bold text-orange-600">Step 1</div>
            <div className="text-xs font-extrabold text-slate-900">Booking & M-Pesa Deposit</div>
            <div className="text-[11px] text-slate-500">Homeowner deposits job fee via STK push. Money is held in Escrow Vault.</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-xs font-bold text-orange-600">Step 2</div>
            <div className="text-xs font-extrabold text-slate-900">Artisan Dispatched</div>
            <div className="text-[11px] text-slate-500">Fundi is notified that funds are secured and travels to location with confidence.</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-xs font-bold text-orange-600">Step 3</div>
            <div className="text-xs font-extrabold text-slate-900">Work & Inspection</div>
            <div className="text-[11px] text-slate-500">Repair completed. Homeowner tests the pipes, wiring, or carpentry work.</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-xs font-bold text-emerald-600">Step 4</div>
            <div className="text-xs font-extrabold text-slate-900">Quality Sign-off & Payout</div>
            <div className="text-[11px] text-slate-500">Upon approval, funds are instantly released directly to the fundi's M-Pesa wallet.</div>
          </div>
        </div>
      </div>

      {/* ESCROW TRANSACTIONS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6">
        
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Escrow ID, Client, Fundi, M-Pesa Ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto">
            {['all', 'held_in_escrow', 'released_to_fundi', 'disputed', 'refunded'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'all' ? 'All Transactions' : status.replace(/_/g, ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Escrow ID</th>
                <th className="py-3 px-3">Client</th>
                <th className="py-3 px-3">Artisan / Trade</th>
                <th className="py-3 px-3">Total Amount</th>
                <th className="py-3 px-3">Net Payout</th>
                <th className="py-3 px-3">Milestone</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No escrow transactions match your filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3">
                      <div className="font-extrabold text-slate-900">{tx.id}</div>
                      <div className="text-[10px] font-mono text-slate-400">{tx.mpesaRef}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{tx.customerName}</div>
                      <div className="text-[10px] text-slate-500">{tx.customerPhone}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{tx.fundiName}</div>
                      <div className="text-[10px] text-orange-600 font-bold">{tx.category}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">KES {formatCurrency(tx.amountKes)}</div>
                      <div className="text-[10px] text-slate-400">Fee: KES {formatCurrency(tx.platformFeeKes)}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-extrabold text-emerald-700">KES {formatCurrency(tx.fundiPayoutKes)}</div>
                      <div className="text-[10px] text-slate-500">{tx.paymentMethod}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {getMilestoneLabel(tx.milestone)}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      {getStatusBadge(tx.status)}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* View receipt */}
                        <button
                          onClick={() => setSelectedReceipt(tx)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          title="View Escrow Receipt"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* Release button if held */}
                        {tx.status === 'held_in_escrow' && (
                          <>
                            <button
                              onClick={() => handleReleaseFunds(tx)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-2xs"
                              title="Release Funds to Fundi"
                            >
                              Release
                            </button>
                            <button
                              onClick={() => handleDispute(tx)}
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200"
                              title="Place on Dispute Hold"
                            >
                              Dispute
                            </button>
                          </>
                        )}

                        {tx.status === 'disputed' && (
                          <button
                            onClick={() => handleRefund(tx)}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px]"
                          >
                            Refund
                          </button>
                        )}

                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ESCROW RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 font-['Outfit',sans-serif]">
                Spana Escrow Certificate
              </h3>
              <p className="text-xs text-slate-500">Official Escrow Receipt & Audit Log</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-900">{selectedReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">M-Pesa Reference:</span>
                <span className="font-mono font-bold text-slate-900">{selectedReceipt.mpesaRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Homeowner / Client:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.customerName} ({selectedReceipt.customerPhone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Certified Artisan:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.fundiName} ({selectedReceipt.category})</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between">
                <span className="text-slate-500">Total Amount Secured:</span>
                <span className="font-extrabold text-slate-900">KES {formatCurrency(selectedReceipt.amountKes)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Platform Insurance Fee (5%):</span>
                <span className="font-medium text-slate-700">KES {formatCurrency(selectedReceipt.platformFeeKes)}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-extrabold">
                <span>Net Artisan Payout:</span>
                <span>KES {formatCurrency(selectedReceipt.fundiPayoutKes)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between">
                <span className="text-slate-500">Escrow Status:</span>
                <span>{getStatusBadge(selectedReceipt.status)}</span>
              </div>
              {selectedReceipt.notes && (
                <div className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200">
                  <strong>Notes:</strong> {selectedReceipt.notes}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
