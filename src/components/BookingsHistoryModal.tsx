import React, { useState } from 'react';
import { 
  X, 
  CalendarCheck2, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Zap, 
  Phone, 
  HardHat,
  Star,
  ShieldCheck,
  Send,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { BookingResponse } from '../types';
import { formatCurrency } from '../utils/format';

interface BookingsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: BookingResponse[];
  onMarkAsCompleted?: (bookingId: string, rating: number, feedback?: string) => Promise<void>;
}

export const BookingsHistoryModal: React.FC<BookingsHistoryModalProps> = ({
  isOpen,
  onClose,
  bookings,
  onMarkAsCompleted
}) => {
  const [completingBookingId, setCompletingBookingId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartComplete = (bookingId: string) => {
    setCompletingBookingId(bookingId);
    setRating(5);
    setFeedback('');
    setSuccessToast(null);
  };

  const handleConfirmComplete = async () => {
    if (!completingBookingId || !onMarkAsCompleted) return;
    setIsSubmitting(true);
    try {
      await onMarkAsCompleted(completingBookingId, rating, feedback);
      const booking = bookings.find(b => b.bookingId === completingBookingId);
      const costKes = booking?.details?.estimatedCostKes ?? (booking?.details as any)?.agreedFeeKes ?? 0;
      setSuccessToast(`Job marked completed! Admin has been notified to dispatch KES ${formatCurrency(costKes)} to ${booking?.details?.fundiName || 'the artisan'}.`);
      setCompletingBookingId(null);
    } catch (err) {
      console.error('Failed to complete booking:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div 
        id="bookings-history-modal"
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-xs">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black font-['Outfit',sans-serif]">
              Active & Past Bookings ({bookings.length})
            </h2>
          </div>
          <p className="text-xs text-slate-300">
            Track arrival status, verify job completion, and release M-Pesa escrow to your artisan.
          </p>
        </div>

        {/* Global Success Banner */}
        {successToast && (
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 text-emerald-900 flex items-start gap-2.5 text-xs font-semibold animate-in slide-in-from-top duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-950">Work Verified by Client</p>
              <p>{successToast}</p>
            </div>
          </div>
        )}

        {/* Completing Booking Modal View */}
        {completingBookingId && (
          <div className="p-6 bg-orange-50/70 border-b border-orange-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Confirm Job Completion: {completingBookingId}</span>
              </h3>
              <button
                onClick={() => setCompletingBookingId(null)}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Did the artisan complete the work satisfactorily? Once confirmed, the <strong>Admin will receive an urgent notification to dispatch the cash payout</strong> from M-Pesa escrow directly to the artisan.
            </p>

            {/* Rating */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rate Artisan Craftsmanship</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition cursor-pointer"
                  >
                    <Star 
                      className={`w-6 h-6 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} 
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-700 ml-2">{rating} of 5 stars</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Feedback / Work Verification Notes (Optional)</label>
              <textarea
                rows={2}
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="e.g. Clean work done, checked water pressure, punctual and polite."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500 bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCompletingBookingId(null)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200/50 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-completion-submit-btn"
                disabled={isSubmitting}
                onClick={handleConfirmComplete}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Notifying Admin...' : 'Confirm Completion & Request Cash Dispatch'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Bookings List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {bookings.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <CalendarCheck2 className="w-12 h-12 mx-auto text-slate-300" />
              <h3 className="text-sm font-bold text-slate-700">No Bookings Yet</h3>
              <p className="text-xs max-w-xs mx-auto">
                Select a recommended fundi from the list or map and click "Book Fundi" to schedule a visit.
              </p>
            </div>
          ) : (
            bookings.map((booking) => {
              const isEligibleToComplete = 
                booking.status === 'confirmed' || 
                booking.status === 'dispatched' || 
                booking.status === 'pending_fundi_ack';
              
              const isClientCompleted = booking.status === 'client_completed';
              const isFullyCompleted = booking.status === 'completed';

              return (
                <div 
                  key={booking.bookingId}
                  className={`p-4 rounded-2xl border space-y-3 transition ${
                    isClientCompleted
                      ? 'bg-amber-50/60 border-amber-300'
                      : isFullyCompleted
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {booking.bookingId}
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      {isClientCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Client Confirmed • Ready for Cash Dispatch</span>
                        </span>
                      ) : isFullyCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Job Completed & Cash Dispatched</span>
                        </span>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold capitalize ${
                          booking.status === 'dispatched' 
                            ? 'bg-blue-100 text-blue-900 animate-pulse' 
                            : 'bg-slate-200 text-slate-800'
                        }`}>
                          {booking.status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {booking.details.fundiName}
                      </h4>
                      <span className="text-xs font-semibold text-orange-600">
                        {booking.details.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Date & Slot</span>
                      <span className="text-xs font-bold text-slate-800">
                        {booking.details.scheduledDate} ({booking.details.scheduledTimeSlot})
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    {booking.details.jobDescription}
                  </p>

                  <div className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      <span className="truncate">{booking.details?.customerAddress || (booking.details as any)?.location?.address || 'Nairobi'}</span>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0">
                      KES {formatCurrency(booking.details?.estimatedCostKes ?? (booking.details as any)?.agreedFeeKes ?? 0)}
                    </span>
                  </div>

                  {/* Context Banners for Completion Status */}
                  {isClientCompleted && (
                    <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">You marked this job completed</span>
                        <span className="text-[11px] text-slate-600">
                          Spana Admin has been notified to disburse KES {formatCurrency(booking.details?.estimatedCostKes ?? (booking.details as any)?.agreedFeeKes ?? 0)} from escrow to {booking.details?.fundiName || 'the artisan'} via M-Pesa.
                        </span>
                      </div>
                    </div>
                  )}

                  {isFullyCompleted && (
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Cash Disbursement Completed</span>
                        <span className="text-[11px] text-slate-600">
                          Funds safely disbursed to {booking.details.fundiName} via M-Pesa. 
                          {booking.mpesaPayoutRef && (
                            <span className="font-mono font-bold text-slate-800 ml-1">
                              Ref: {booking.mpesaPayoutRef}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Client Mark Completed Action Button */}
                  {isEligibleToComplete && onMarkAsCompleted && (
                    <div className="pt-1 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Funds held safely in escrow</span>
                      </span>

                      <button
                        id={`mark-artisan-completed-${booking.bookingId}`}
                        onClick={() => handleStartComplete(booking.bookingId)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Artisan as Completed</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Escrow protected by Spana Kenya
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

