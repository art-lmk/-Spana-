import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Send,
  Zap,
  Phone,
  User,
  FileText,
  ShieldCheck,
  Smartphone,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Fundi, BookingRequest, BookingResponse, LocationCoordinates, EscrowStatus } from '../types';
import { formatCurrency } from '../utils/format';

interface BookingModalProps {
  fundi: Fundi | null;
  userLocation: LocationCoordinates;
  onClose: () => void;
  onBookingSuccess: (booking: BookingResponse) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  fundi,
  userLocation,
  onClose,
  onBookingSuccess,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState(userLocation.neighborhood || userLocation.address || 'Nairobi');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return today;
  });
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState('09:00 AM - 11:00 AM');
  const [jobDescription, setJobDescription] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingResponse | null>(null);

  // M-Pesa STK Push & Escrow State
  const [escrowStatus, setEscrowStatus] = useState<EscrowStatus | null>(null);
  const [stkPushLoading, setStkPushLoading] = useState(false);
  const [showStkModal, setShowStkModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinVerifying, setPinVerifying] = useState(false);
  const [mpesaReceipt, setMpesaReceipt] = useState<string | null>(null);

  if (!fundi) return null;

  const triggerMpesaStkPush = async (bookingId: string) => {
    setStkPushLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/stk-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: customerPhone,
          amountKes: fundi.fixedInspectionFeeKes || 500
        })
      });
      const data = await res.json();
      if (data.success) {
        setEscrowStatus('awaiting_payment');
        setShowStkModal(true);
      }
    } catch (err) {
      console.error('Failed to trigger STK push:', err);
    } finally {
      setStkPushLoading(false);
    }
  };

  const confirmStkPayment = async (bookingId: string) => {
    setPinVerifying(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mpesaReceiptNo: `QMP${Math.floor(10000000 + Math.random() * 90000000)}`
        })
      });
      const data = await res.json();
      if (data.success) {
        setEscrowStatus('held_in_escrow');
        setMpesaReceipt(data.mpesaReceiptNo);
        setShowStkModal(false);
        try {
          confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.6 }
          });
        } catch {}
      }
    } catch (err) {
      console.error('Failed to confirm payment:', err);
    } finally {
      setPinVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) return;

    setSubmitting(true);

    const bookingPayload: BookingRequest = {
      fundiId: fundi.id,
      fundiName: fundi.name,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      scheduledDate,
      scheduledTimeSlot: isEmergency ? 'Immediate Dispatch (<30 mins)' : scheduledTimeSlot,
      jobDescription: jobDescription.trim() || `Inspection and repair for ${fundi.primaryCategory}`,
      category: fundi.primaryCategory,
      isEmergency,
      estimatedCostKes: fundi.fixedInspectionFeeKes || 500
    };

    try {
      const idempotencyKey = `bk-${fundi.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
          'X-Correlation-ID': `client-bk-${Date.now()}`
        },
        body: JSON.stringify(bookingPayload)
      });

      if (!res.ok) throw new Error('Booking failed');

      const data: BookingResponse = await res.json();
      setConfirmedBooking(data);
      onBookingSuccess(data);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Confetti fallback
      }
    } catch (err) {
      console.error('Error submitting booking:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div 
        id="booking-appointment-modal"
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <img
              src={fundi.avatarUrl}
              alt={fundi.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-white/80 shadow-md shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-200 block">
                Book Skilled Artisan
              </span>
              <h2 className="text-xl font-black text-white font-['Outfit',sans-serif]">
                {fundi.name}
              </h2>
              <span className="text-xs text-orange-100 font-semibold">
                {fundi.primaryCategory} • KES {formatCurrency(fundi.hourlyRateKes)}/hr
              </span>
            </div>
          </div>
        </div>

        {/* Form Body or Confirmation */}
        <div className="p-6 overflow-y-auto flex-1">
          {confirmedBooking ? (
            <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              
              <div>
                <h3 className="text-xl font-black text-slate-900 font-['Outfit',sans-serif]">
                  Booking Dispatched!
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Reference ID: <strong className="text-slate-900 font-mono">{confirmedBooking.bookingId}</strong>
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Artisan Assigned:</span>
                  <strong className="text-slate-900">{fundi.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Service:</span>
                  <span className="font-semibold text-orange-600">{fundi.primaryCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled For:</span>
                  <span className="font-semibold text-slate-900">{confirmedBooking.details.scheduledDate} ({confirmedBooking.details.scheduledTimeSlot})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination:</span>
                  <span className="font-semibold text-slate-900">{confirmedBooking.details.customerAddress}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                  <span>Initial Inspection Fee:</span>
                  <span className="text-emerald-700">KES {formatCurrency(fundi.fixedInspectionFeeKes)}</span>
                </div>
              </div>

              {/* M-PESA ESCROW SECTION */}
              <div className="p-4 rounded-2xl border bg-slate-50 border-slate-200 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">M-Pesa Escrow Protection</span>
                  </div>
                  {escrowStatus === 'awaiting_payment' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      awaiting_payment
                    </span>
                  )}
                  {escrowStatus === 'held_in_escrow' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      held_in_escrow
                    </span>
                  )}
                  {!escrowStatus && (
                    <span className="text-[10px] text-slate-500 font-medium">Optional Deposit</span>
                  )}
                </div>

                {escrowStatus === 'held_in_escrow' ? (
                  <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Deposit Secured in Escrow (KES {formatCurrency(fundi.fixedInspectionFeeKes)})</span>
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      M-Pesa Ref: <strong className="font-mono">{mpesaReceipt || 'QMP892014'}</strong>. Funds will only be released to {fundi.name} once you confirm the job is finished.
                    </p>
                  </div>
                ) : escrowStatus === 'awaiting_payment' ? (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Smartphone className="w-4 h-4 text-amber-600 animate-bounce" />
                      <span>STK Push Sent to Handset</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Prompt sent to <strong>{customerPhone}</strong>. Escrow transaction status is updated to <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono">awaiting_payment</code>.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowStkModal(true)}
                      className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                    >
                      Open M-Pesa PIN Prompt Simulation
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      disabled={stkPushLoading}
                      onClick={() => triggerMpesaStkPush(confirmedBooking.bookingId)}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/25 transition flex items-center justify-center gap-2 hover:scale-[1.01]"
                    >
                      {stkPushLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Initiating STK Push...</span>
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-4 h-4" />
                          <span>Pay via M-Pesa (KES {formatCurrency(fundi.fixedInspectionFeeKes)} Escrow)</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-slate-500 mt-1.5 text-center">
                      Sends instant STK push prompt to your phone and updates escrow status to <code>awaiting_payment</code>.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-3 bg-amber-50 rounded-xl text-amber-900 text-xs border border-amber-200/80 text-left">
                <strong>Next Step:</strong> {fundi.name} has received your contact details and will call <strong>{customerPhone}</strong> directly to confirm access instructions.
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Emergency Dispatch Option */}
              <div 
                onClick={() => setIsEmergency(!isEmergency)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                  isEmergency
                    ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${isEmergency ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-xs text-slate-900 block font-bold">Immediate Emergency Dispatch</strong>
                    <span className="text-[11px] text-slate-500">Priority ETA within 25–40 minutes</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isEmergency}
                  onChange={(e) => setIsEmergency(e.target.checked)}
                  className="w-4 h-4 accent-rose-600"
                />
              </div>

              {/* Customer Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Your Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Kenneth Otieno"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number (M-Pesa / Call)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+254 7..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Service Address */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Service Location / Address</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-orange-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="e.g. Westlands, Mpaka Court Apt 4B"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Scheduled Date & Slot (hidden if emergency) */}
              {!isEmergency && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Preferred Time Window</label>
                    <select
                      value={scheduledTimeSlot}
                      onChange={(e) => setScheduledTimeSlot(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:border-orange-500"
                    >
                      <option value="08:00 AM - 10:00 AM">Morning (08:00 AM - 10:00 AM)</option>
                      <option value="10:00 AM - 12:00 PM">Mid-Morning (10:00 AM - 12:00 PM)</option>
                      <option value="01:00 PM - 03:00 PM">Afternoon (01:00 PM - 03:00 PM)</option>
                      <option value="03:00 PM - 05:00 PM">Late Afternoon (03:00 PM - 05:00 PM)</option>
                      <option value="06:00 PM - 08:00 PM">Evening (06:00 PM - 08:00 PM)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Job Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Issue Description / Instructions</label>
                <textarea
                  rows={2}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Describe the leak, broken lock, wiring issue, or parts you already have..."
                  className="w-full p-3 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:border-orange-500"
                />
              </div>

              {/* Pricing breakdown pill */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600">Inspection & Arrival Deposit:</span>
                <span className="font-extrabold text-slate-900">
                  KES {formatCurrency(fundi.fixedInspectionFeeKes)}
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold shadow-md shadow-orange-600/30 transition flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Confirming Dispatch...' : 'Confirm & Dispatch Fundi'}</span>
              </button>

            </form>
          )}
        </div>
      </div>

      {/* M-PESA STK PUSH HANDSET POPUP SIMULATION */}
      {showStkModal && confirmedBooking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-slate-900 border-2 border-emerald-500 rounded-3xl overflow-hidden shadow-2xl text-white animate-in zoom-in-95 duration-150">
            {/* Safaricom M-PESA Green Header */}
            <div className="bg-emerald-600 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-white" />
                <span className="font-extrabold tracking-wider text-sm font-mono">M-PESA Express</span>
              </div>
              <button 
                type="button"
                onClick={() => setShowStkModal(false)}
                className="text-emerald-100 hover:text-white p-1"
                title="Dismiss prompt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* STK Content */}
            <div className="p-5 space-y-4">
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 text-xs space-y-1.5">
                <p className="text-slate-300 font-medium">
                  Do you want to pay <strong className="text-emerald-400 font-bold">KES {formatCurrency(fundi.fixedInspectionFeeKes)}</strong> to <strong className="text-white">Spana Escrow</strong> for {fundi.name}?
                </p>
                <div className="text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-700/60 flex justify-between">
                  <span>Acc: {confirmedBooking.bookingId}</span>
                  <span className="text-amber-400">awaiting_payment</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Enter 4-Digit M-Pesa PIN:
                </label>
                <input
                  type="password"
                  maxLength={4}
                  autoFocus
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full text-center text-xl tracking-[0.5em] font-mono py-2.5 px-3 bg-slate-800 border border-slate-600 rounded-xl focus:outline-hidden focus:border-emerald-500 text-white placeholder-slate-500"
                />
                <span className="text-[10px] text-slate-400 block text-center mt-1">
                  (Simulation: Any 4 digits, e.g. 1234)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowStkModal(false)}
                  className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Later (Keep Pending)
                </button>
                <button
                  type="button"
                  disabled={pinVerifying || pin.length < 4}
                  onClick={() => confirmStkPayment(confirmedBooking.bookingId)}
                  className="w-full py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                >
                  {pinVerifying ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send PIN</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
