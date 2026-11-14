import React, { useState } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  HardHat, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Truck, 
  MessageSquare, 
  ExternalLink,
  DollarSign,
  Send
} from 'lucide-react';
import { BookingResponse } from '../../types';
import { formatCurrency } from '../../utils/format';

interface AdminBookingsTabProps {
  bookings: BookingResponse[];
  onUpdateBookingStatus: (bookingId: string, newStatus: BookingResponse['status']) => void;
  onDispatchCash?: (bookingId: string) => void;
}

export const AdminBookingsTab: React.FC<AdminBookingsTabProps> = ({
  bookings,
  onUpdateBookingStatus,
  onDispatchCash
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = bookings.filter(b => {
    const matchesSearch = 
      b.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.details.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.details.fundiName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.details.customerPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.details.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.details.customerAddress.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: BookingResponse['status']) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            <span>Confirmed</span>
          </span>
        );
      case 'dispatched':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Truck className="w-3 h-3 text-amber-600" />
            <span>En Route</span>
          </span>
        );
      case 'client_completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-400 animate-pulse">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Client Confirmed • Dispatch Ready</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Job Completed</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Cancelled</span>
          </span>
        );
      case 'pending_fundi_ack':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <Clock className="w-3 h-3 text-slate-600" />
            <span>Pending Artisan Ack</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 font-['Outfit',sans-serif]">
              Bookings & Artisan Dispatch Queue
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {bookings.length} Total Requests
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitor client repair requests, artisan dispatch travel times, and job execution stages across Nairobi.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search bookings by customer, fundi, phone, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto">
          {['all', 'confirmed', 'dispatched', 'client_completed', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                statusFilter === status
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status === 'all' 
                ? 'All Bookings' 
                : status === 'client_completed' 
                ? 'Ready for Cash Dispatch' 
                : status.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 py-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-2">
            <Calendar className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-semibold text-sm">No bookings found for the selected filter.</p>
          </div>
        ) : (
          filtered.map((b) => (
            <div 
              key={b.bookingId}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4 hover:border-orange-200 transition"
            >
              {/* Top Row: Ref & Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {b.bookingId}
                  </span>
                  {b.details.isEmergency && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Emergency
                    </span>
                  )}
                </div>
                <div>{getStatusBadge(b.status)}</div>
              </div>

              {/* Customer & Fundi Details */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Homeowner / Client</span>
                  <div className="font-extrabold text-slate-900">{b.details?.customerName || 'Client'}</div>
                  <div className="text-slate-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{b.details?.customerPhone || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Fundi</span>
                  <div className="font-extrabold text-slate-900">{b.details?.fundiName || 'Artisan'}</div>
                  <div className="text-orange-600 font-bold">{b.details?.category || (b.details as any)?.serviceCategory || 'Artisan Service'}</div>
                </div>
              </div>

              {/* Schedule & Address */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span><strong>Date:</strong> {b.details?.scheduledDate || 'Flexible'} • Slot: {b.details?.scheduledTimeSlot || (b.details as any)?.scheduledTime || 'Standard'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate"><strong>Location:</strong> {b.details?.customerAddress || (b.details as any)?.location?.address || 'Nairobi'}</span>
                </div>
                <div className="flex items-start gap-2 bg-white p-2 rounded-xl border border-slate-100">
                  <span className="font-semibold shrink-0">Job:</span>
                  <span className="text-slate-700">{b.details?.jobDescription}</span>
                </div>
              </div>

              {/* Actions & Price */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="text-xs font-extrabold text-slate-900">
                  Est. KES {formatCurrency(b.details?.estimatedCostKes ?? (b.details as any)?.agreedFeeKes ?? 0)}
                </div>

                <div className="flex items-center gap-1.5">
                  {b.status === 'client_completed' && (
                    <button
                      id={`dispatch-cash-booking-${b.bookingId}`}
                      onClick={() => onDispatchCash ? onDispatchCash(b.bookingId) : onUpdateBookingStatus(b.bookingId, 'completed')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs transition flex items-center gap-1.5 shadow-sm animate-pulse cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Cash</span>
                    </button>
                  )}

                  {b.status !== 'dispatched' && b.status !== 'completed' && b.status !== 'client_completed' && (
                    <button
                      onClick={() => onUpdateBookingStatus(b.bookingId, 'dispatched')}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                    >
                      Dispatch
                    </button>
                  )}

                  {b.status !== 'completed' && b.status !== 'client_completed' && (
                    <button
                      onClick={() => onUpdateBookingStatus(b.bookingId, 'completed')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                    >
                      Complete
                    </button>
                  )}

                  {b.status === 'completed' && b.mpesaPayoutRef && (
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                      Paid: {b.mpesaPayoutRef}
                    </span>
                  )}

                  {b.status !== 'cancelled' && b.status !== 'completed' && (
                    <button
                      onClick={() => onUpdateBookingStatus(b.bookingId, 'cancelled')}
                      className="px-2 py-1 text-slate-400 hover:text-rose-600 rounded-lg text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};
