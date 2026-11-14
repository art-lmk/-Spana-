import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  MessageSquare, 
  Send, 
  RotateCcw, 
  X, 
  Signal, 
  BatteryMedium, 
  Info, 
  CheckCircle2, 
  ShieldCheck, 
  Trash2,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { SmsMessageItem } from '../types';

interface KabambeSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingCreated?: () => void;
}

export const KabambeSimulatorModal: React.FC<KabambeSimulatorModalProps> = ({
  isOpen,
  onClose,
  onBookingCreated
}) => {
  // Device Phone Number
  const [phoneNumber] = useState<string>('+254712998877');
  
  // Phone views: 'idle' (home screen), 'dialer', 'ussd_session', 'sms_inbox', 'sms_compose'
  const [activeScreen, setActiveScreen] = useState<'idle' | 'dialer' | 'ussd_session' | 'sms_inbox' | 'sms_compose'>('idle');

  // Dialer input
  const [dialedNumber, setDialedNumber] = useState<string>('*384*45#');

  // USSD Session state
  const [ussdSessionId, setUssdSessionId] = useState<string>('');
  const [ussdDisplay, setUssdDisplay] = useState<string>('');
  const [ussdInput, setUssdInput] = useState<string>('');
  const [isUssdTerminal, setIsUssdTerminal] = useState<boolean>(false);
  const [ussdHistory, setUssdHistory] = useState<string[]>([]);
  const [isUssdLoading, setIsUssdLoading] = useState<boolean>(false);

  // SMS state
  const [smsList, setSmsList] = useState<SmsMessageItem[]>([]);
  const [smsComposeText, setSmsComposeText] = useState<string>('FUNDI PLUMBER WESTLANDS');
  const [isSmsSending, setIsSmsSending] = useState<boolean>(false);
  const [smsSuccessNote, setSmsSuccessNote] = useState<string | null>(null);

  // Time display
  const [currentTime, setCurrentTime] = useState<string>('12:45 PM');

  // Audio / feedback ref
  const ussdInputRef = useRef<HTMLInputElement>(null);

  // Clock updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  // Fetch SMS inbox
  const fetchSmsInbox = async () => {
    try {
      const res = await fetch(`/api/sms/inbox?phoneNumber=${encodeURIComponent(phoneNumber)}`);
      if (res.ok) {
        const data = await res.json();
        setSmsList(data);
      }
    } catch (err) {
      console.error('Failed to fetch SMS inbox:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSmsInbox();
      const interval = setInterval(fetchSmsInbox, 6000);
      return () => clearInterval(interval);
    }
  }, [isOpen, phoneNumber]);

  if (!isOpen) return null;

  // Keypad press handler
  const handleKeyPress = (key: string) => {
    if (activeScreen === 'idle') {
      setActiveScreen('dialer');
      setDialedNumber(key);
    } else if (activeScreen === 'dialer') {
      setDialedNumber(prev => prev + key);
    } else if (activeScreen === 'ussd_session') {
      setUssdInput(prev => prev + key);
    }
  };

  // Backspace / Clear
  const handleClear = () => {
    if (activeScreen === 'dialer') {
      setDialedNumber(prev => (prev.length > 1 ? prev.slice(0, -1) : ''));
      if (dialedNumber.length <= 1) setActiveScreen('idle');
    } else if (activeScreen === 'ussd_session') {
      setUssdInput(prev => (prev.length > 1 ? prev.slice(0, -1) : ''));
    }
  };

  // Dial / Send USSD
  const handleInitiateUssd = async (codeToDial?: string) => {
    const code = codeToDial || dialedNumber;
    if (!code) return;

    setIsUssdLoading(true);
    const newSessionId = `ussd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setUssdSessionId(newSessionId);
    setUssdHistory([]);
    setUssdInput('');
    setIsUssdTerminal(false);
    setActiveScreen('ussd_session');

    // Extract any pre-dialed arguments after service code (e.g. *384*45*1# -> text "1")
    let initialText = '';
    const cleanCode = code.replace('#', '');
    if (cleanCode.startsWith('*384*45*')) {
      initialText = cleanCode.replace('*384*45*', '');
    }

    try {
      const res = await fetch('/api/ussd', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sessionId: newSessionId,
          serviceCode: '*384*45#',
          phoneNumber,
          text: initialText,
          asJson: true
        })
      });

      if (res.ok) {
        const data = await res.json();
        setUssdDisplay(data.message.replace(/^(CON|END)\s*/, ''));
        setIsUssdTerminal(Boolean(data.isTerminal));
        if (initialText) {
          setUssdHistory([initialText]);
        }
        if (onBookingCreated && initialText.includes('1')) {
          onBookingCreated();
        }
      } else {
        setUssdDisplay('Connection error. Could not reach Spana telco gateway.');
        setIsUssdTerminal(true);
      }
    } catch (err: any) {
      setUssdDisplay(`Error: ${err.message}`);
      setIsUssdTerminal(true);
    } finally {
      setIsUssdLoading(false);
      setTimeout(() => ussdInputRef.current?.focus(), 150);
    }
  };

  // Submit next step in USSD session
  const handleSubmitUssdStep = async () => {
    if (isUssdTerminal) {
      // Session already ended
      handleEndCall();
      return;
    }

    if (!ussdInput.trim()) return;

    setIsUssdLoading(true);
    const updatedHistory = [...ussdHistory, ussdInput.trim()];
    setUssdHistory(updatedHistory);
    const textAccumulator = updatedHistory.join('*');

    try {
      const res = await fetch('/api/ussd', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sessionId: ussdSessionId,
          serviceCode: '*384*45#',
          phoneNumber,
          text: textAccumulator,
          asJson: true
        })
      });

      if (res.ok) {
        const data = await res.json();
        setUssdDisplay(data.message.replace(/^(CON|END)\s*/, ''));
        setIsUssdTerminal(Boolean(data.isTerminal));
        setUssdInput('');

        // Refresh SMS inbox if bookings were confirmed
        fetchSmsInbox();
        if (onBookingCreated) {
          onBookingCreated();
        }
      } else {
        setUssdDisplay('Session expired or error. Please redial *384*45#.');
        setIsUssdTerminal(true);
      }
    } catch (err: any) {
      setUssdDisplay(`Network error: ${err.message}`);
      setIsUssdTerminal(true);
    } finally {
      setIsUssdLoading(false);
      setTimeout(() => ussdInputRef.current?.focus(), 150);
    }
  };

  // End Call / Red Button
  const handleEndCall = () => {
    setActiveScreen('idle');
    setUssdDisplay('');
    setUssdInput('');
    setIsUssdTerminal(false);
    setUssdHistory([]);
    setDialedNumber('*384*45#');
  };

  // Send two-way SMS to 22450
  const handleSendSms = async () => {
    if (!smsComposeText.trim()) return;
    setIsSmsSending(true);
    setSmsSuccessNote(null);

    try {
      const res = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: phoneNumber,
          to: '22450',
          text: smsComposeText.trim()
        })
      });

      if (res.ok) {
        await fetchSmsInbox();
        setActiveScreen('sms_inbox');
        setSmsSuccessNote('SMS delivered to Spana gateway (22450)');
        setSmsComposeText('');
        setTimeout(() => setSmsSuccessNote(null), 4000);
      }
    } catch (err: any) {
      console.error('Failed to send SMS:', err);
    } finally {
      setIsSmsSending(false);
    }
  };

  // Clear SMS
  const handleClearSms = async () => {
    try {
      await fetch('/api/sms/clear', { method: 'POST' });
      setSmsList([]);
    } catch (err) {
      console.error('Failed to clear SMS:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div 
        id="kabambe-simulator-modal-container"
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row text-slate-100 my-auto max-h-[92vh]"
      >
        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          title="Close Simulator"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT / CENTER: The Realistic Kenyan "Kabambe" / Feature Phone */}
        <div className="flex-1 p-4 sm:p-6 flex flex-col items-center justify-center bg-radial from-slate-800 to-slate-950 border-b lg:border-b-0 lg:border-r border-slate-800">
          
          {/* Header Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live USSD & GSM Gateway (*384*45#)
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Nokia 3310 / Safaricom Kabambe
            </span>
          </div>

          {/* Physical Phone Shell */}
          <div className="w-[300px] sm:w-[330px] bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 p-4 rounded-[40px] shadow-2xl border-4 border-slate-600/60 ring-8 ring-slate-950/50 flex flex-col items-center">
            
            {/* Top Speaker Earpiece Grille & Brand */}
            <div className="w-full flex flex-col items-center mb-2">
              <div className="w-16 h-1.5 bg-slate-900 rounded-full border border-slate-600/50 mb-1"></div>
              <span className="text-[10px] font-black tracking-widest text-slate-400 font-sans uppercase">
                SAFARICOM 4G GSM
              </span>
            </div>

            {/* RETRO LCD SCREEN (Greenish-Cyan Monochrome Backlight) */}
            <div className="w-full h-[240px] bg-[#9bb08f] text-[#0f240f] p-3 rounded-2xl shadow-inner border-4 border-slate-900 flex flex-col justify-between font-mono select-none overflow-hidden relative">
              
              {/* Screen Status Bar */}
              <div className="flex items-center justify-between text-[11px] font-bold border-b border-[#0f240f]/20 pb-1 mb-1">
                <div className="flex items-center gap-1">
                  <Signal className="w-3.5 h-3.5 fill-[#0f240f]" />
                  <span>Safaricom KE</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span>{currentTime}</span>
                  <BatteryMedium className="w-3.5 h-3.5 fill-[#0f240f]" />
                </div>
              </div>

              {/* SCREEN CONTENT AREA */}
              <div className="flex-1 flex flex-col justify-between overflow-y-auto py-1 text-xs leading-tight">
                
                {/* 1. IDLE / HOME SCREEN */}
                {activeScreen === 'idle' && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                    <div className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                      Spana Kenya
                    </div>
                    <div className="text-xl font-black tracking-wider">
                      *384*45#
                    </div>
                    <div className="text-[11px] font-bold bg-[#0f240f]/10 px-2 py-0.5 rounded">
                      Press GREEN CALL to Dial
                    </div>
                    <div className="text-[10px] opacity-80 pt-1">
                      Non-smartphone offline portal
                    </div>
                  </div>
                )}

                {/* 2. DIALER SCREEN */}
                {activeScreen === 'dialer' && (
                  <div className="flex flex-col justify-between h-full">
                    <div className="text-[10px] uppercase tracking-wider opacity-70">
                      Dialing GSM / USSD:
                    </div>
                    <div className="text-2xl font-black tracking-wider text-center my-auto py-2 break-all">
                      {dialedNumber || ' '}
                    </div>
                    <div className="text-[10px] flex justify-between border-t border-[#0f240f]/20 pt-1">
                      <span>[CALL] Dial</span>
                      <span>[CLEAR] Back</span>
                    </div>
                  </div>
                )}

                {/* 3. ACTIVE USSD SESSION */}
                {activeScreen === 'ussd_session' && (
                  <div className="flex flex-col justify-between h-full text-[11.5px]">
                    {isUssdLoading ? (
                      <div className="flex flex-col items-center justify-center my-auto text-center">
                        <div className="animate-spin text-lg mb-1">⏳</div>
                        <div className="font-bold">USSD In Progress...</div>
                        <div className="text-[10px] opacity-75">Contacting Safaricom Gateway</div>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-y-auto max-h-[145px] whitespace-pre-line font-medium pr-1">
                          {ussdDisplay}
                        </div>

                        {/* If session is not terminal, show input field */}
                        {!isUssdTerminal ? (
                          <div className="mt-1 pt-1 border-t border-[#0f240f]/25">
                            <form 
                              onSubmit={(e) => { e.preventDefault(); handleSubmitUssdStep(); }}
                              className="flex items-center gap-1"
                            >
                              <span className="font-bold">&gt;</span>
                              <input
                                ref={ussdInputRef}
                                type="text"
                                value={ussdInput}
                                onChange={(e) => setUssdInput(e.target.value)}
                                placeholder="Reply..."
                                className="w-full bg-[#0f240f]/10 text-[#0f240f] font-bold px-1.5 py-0.5 rounded outline-hidden border border-[#0f240f]/30 text-xs"
                                autoFocus
                              />
                            </form>
                          </div>
                        ) : (
                          <div className="mt-1 pt-1 border-t border-[#0f240f]/25 text-[10px] font-bold text-center">
                            Session Ended. Press [END] to return.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* 4. SMS INBOX */}
                {activeScreen === 'sms_inbox' && (
                  <div className="flex flex-col h-full text-[11px]">
                    <div className="flex items-center justify-between border-b border-[#0f240f]/20 pb-1 mb-1 font-bold text-[10px]">
                      <span>INBOX ({smsList.length})</span>
                      <button 
                        onClick={() => setActiveScreen('sms_compose')}
                        className="underline cursor-pointer"
                      >
                        + Write SMS
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[160px]">
                      {smsList.length === 0 ? (
                        <div className="text-center py-6 opacity-75 text-[11px]">
                          No SMS messages received yet.
                        </div>
                      ) : (
                        smsList.map((sms) => (
                          <div 
                            key={sms.id}
                            className={`p-1.5 rounded border text-[10.5px] leading-tight ${
                              sms.type === 'mpesa' 
                                ? 'bg-[#0f240f]/15 border-[#0f240f]/40 font-semibold' 
                                : sms.type === 'incoming' 
                                ? 'bg-amber-900/10 border-amber-900/30'
                                : 'bg-black/5 border-[#0f240f]/20'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold text-[9.5px] opacity-90 mb-0.5">
                              <span>From: {sms.from}</span>
                              <span>{new Date(sms.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="break-words">{sms.message}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 5. SMS COMPOSE */}
                {activeScreen === 'sms_compose' && (
                  <div className="flex flex-col h-full text-[11px] justify-between">
                    <div>
                      <div className="text-[10px] font-bold mb-1">To: 22450 (Spana)</div>
                      <textarea
                        value={smsComposeText}
                        onChange={(e) => setSmsComposeText(e.target.value)}
                        placeholder="eg: FUNDI PLUMBER WESTLANDS"
                        rows={4}
                        className="w-full bg-[#0f240f]/10 text-[#0f240f] p-1.5 rounded text-xs font-mono border border-[#0f240f]/30 outline-hidden resize-none"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] border-t border-[#0f240f]/20 pt-1">
                      <button 
                        onClick={() => setActiveScreen('sms_inbox')}
                        className="underline"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSendSms}
                        disabled={isSmsSending}
                        className="font-bold underline cursor-pointer"
                      >
                        {isSmsSending ? 'Sending...' : 'SEND SMS'}
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Bottom Screen Softkeys */}
              <div className="flex items-center justify-between text-[10px] font-bold border-t border-[#0f240f]/20 pt-1">
                {activeScreen === 'ussd_session' ? (
                  <>
                    <button 
                      onClick={handleSubmitUssdStep}
                      disabled={isUssdTerminal || isUssdLoading}
                      className="cursor-pointer hover:underline disabled:opacity-50"
                    >
                      [SEND]
                    </button>
                    <button 
                      onClick={handleEndCall}
                      className="cursor-pointer hover:underline"
                    >
                      [CANCEL]
                    </button>
                  </>
                ) : activeScreen === 'sms_inbox' ? (
                  <>
                    <button 
                      onClick={() => setActiveScreen('idle')}
                      className="cursor-pointer hover:underline"
                    >
                      [EXIT]
                    </button>
                    <button 
                      onClick={() => setActiveScreen('sms_compose')}
                      className="cursor-pointer hover:underline"
                    >
                      [NEW]
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setActiveScreen('sms_inbox')}
                      className="cursor-pointer hover:underline"
                    >
                      [SMS]
                    </button>
                    <button 
                      onClick={() => {
                        if (activeScreen === 'dialer') {
                          handleClear();
                        } else {
                          setActiveScreen('dialer');
                        }
                      }}
                      className="cursor-pointer hover:underline"
                    >
                      {activeScreen === 'dialer' ? '[CLEAR]' : '[MENU]'}
                    </button>
                  </>
                )}
              </div>

            </div>

            {/* SOFTKEYS & D-PAD */}
            <div className="w-full grid grid-cols-3 gap-2 mt-3 mb-2 px-2">
              {/* Left Softkey */}
              <button
                onClick={() => {
                  if (activeScreen === 'ussd_session') handleSubmitUssdStep();
                  else if (activeScreen === 'idle') setActiveScreen('sms_inbox');
                  else if (activeScreen === 'dialer') handleInitiateUssd();
                }}
                className="py-1.5 bg-slate-900 text-slate-300 hover:text-white rounded-lg text-xs font-bold border border-slate-700 active:scale-95 transition shadow-xs cursor-pointer"
              >
                —
              </button>

              {/* Center D-Pad Navigation */}
              <div className="flex items-center justify-center">
                <button
                  onClick={() => {
                    if (activeScreen === 'ussd_session') handleSubmitUssdStep();
                    else handleInitiateUssd('*384*45#');
                  }}
                  className="w-10 h-7 rounded-lg bg-slate-950 border border-amber-500/40 text-amber-400 text-[10px] font-bold flex items-center justify-center active:scale-95 shadow-inner cursor-pointer"
                  title="OK / Select"
                >
                  OK
                </button>
              </div>

              {/* Right Softkey */}
              <button
                onClick={() => {
                  if (activeScreen === 'ussd_session') handleEndCall();
                  else if (activeScreen === 'sms_inbox') setActiveScreen('idle');
                  else handleClear();
                }}
                className="py-1.5 bg-slate-900 text-slate-300 hover:text-white rounded-lg text-xs font-bold border border-slate-700 active:scale-95 transition shadow-xs cursor-pointer"
              >
                —
              </button>
            </div>

            {/* CALL & END BUTTONS */}
            <div className="w-full grid grid-cols-2 gap-3 mb-3 px-2">
              {/* Green Call Button */}
              <button
                id="kabambe-green-call-btn"
                onClick={() => handleInitiateUssd(dialedNumber || '*384*45#')}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-1 text-xs shadow-md shadow-emerald-900/40 active:scale-95 transition border border-emerald-400/40 cursor-pointer"
                title="Dial USSD Code / Call"
              >
                <PhoneCall className="w-4 h-4" />
                <span>CALL</span>
              </button>

              {/* Red End Button */}
              <button
                id="kabambe-red-end-btn"
                onClick={handleEndCall}
                className="py-2.5 bg-rose-700 hover:bg-rose-600 text-white rounded-xl font-bold flex items-center justify-center gap-1 text-xs shadow-md shadow-rose-950/40 active:scale-95 transition border border-rose-500/40 cursor-pointer"
                title="Hang up / Cancel USSD"
              >
                <PhoneOff className="w-4 h-4" />
                <span>END</span>
              </button>
            </div>

            {/* NUMERIC KEYPAD (1-9, *, 0, #) */}
            <div className="w-full grid grid-cols-3 gap-1.5 px-2">
              {[
                { k: '1', sub: '.,' },
                { k: '2', sub: 'ABC' },
                { k: '3', sub: 'DEF' },
                { k: '4', sub: 'GHI' },
                { k: '5', sub: 'JKL' },
                { k: '6', sub: 'MNO' },
                { k: '7', sub: 'PQRS' },
                { k: '8', sub: 'TUV' },
                { k: '9', sub: 'WXYZ' },
                { k: '*', sub: '+' },
                { k: '0', sub: '␣' },
                { k: '#', sub: '⇧' },
              ].map(item => (
                <button
                  key={item.k}
                  onClick={() => handleKeyPress(item.k)}
                  className="py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl border border-slate-700/60 active:scale-95 transition flex flex-col items-center justify-center shadow-xs cursor-pointer group"
                >
                  <span className="text-base font-bold font-mono leading-none group-hover:text-amber-400">
                    {item.k}
                  </span>
                  <span className="text-[8px] font-sans text-slate-400 tracking-wider">
                    {item.sub}
                  </span>
                </button>
              ))}
            </div>

          </div>

        </div>

        {/* RIGHT: USSD SHORTCUTS & GOVERNMENT / INCLUSION IMPACT BRIEF */}
        <div className="w-full lg:w-[480px] p-5 sm:p-6 flex flex-col justify-between bg-slate-900/90 text-xs sm:text-sm">
          
          <div>
            {/* Title Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Universal Digital Inclusion (USSD & SMS)
                </h3>
                <p className="text-xs text-slate-400">
                  Making certified fundis accessible without internet or smartphone
                </p>
              </div>
            </div>

            {/* Quick Test Shortcuts */}
            <div className="my-4 bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/80">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                ⚡ Quick Dial One-Touch Shortcuts:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleInitiateUssd('*384*45#')}
                  className="p-2 bg-slate-700/70 hover:bg-slate-700 text-left rounded-xl border border-slate-600 transition cursor-pointer"
                >
                  <div className="font-mono font-bold text-amber-400 text-xs">*384*45#</div>
                  <div className="text-[11px] text-slate-300">Main Menu (Swahili/Eng)</div>
                </button>

                <button
                  onClick={() => handleInitiateUssd('*384*45*1#')}
                  className="p-2 bg-slate-700/70 hover:bg-slate-700 text-left rounded-xl border border-slate-600 transition cursor-pointer"
                >
                  <div className="font-mono font-bold text-emerald-400 text-xs">*384*45*1#</div>
                  <div className="text-[11px] text-slate-300">Find a Fundi Fast</div>
                </button>

                <button
                  onClick={() => handleInitiateUssd('*384*45*2#')}
                  className="p-2 bg-slate-700/70 hover:bg-slate-700 text-left rounded-xl border border-slate-600 transition cursor-pointer"
                >
                  <div className="font-mono font-bold text-sky-400 text-xs">*384*45*2#</div>
                  <div className="text-[11px] text-slate-300">My Bookings & Release</div>
                </button>

                <button
                  onClick={() => handleInitiateUssd('*384*45*3#')}
                  className="p-2 bg-slate-700/70 hover:bg-slate-700 text-left rounded-xl border border-slate-600 transition cursor-pointer"
                >
                  <div className="font-mono font-bold text-purple-400 text-xs">*384*45*3#</div>
                  <div className="text-[11px] text-slate-300">Artisan Quick Hub</div>
                </button>
              </div>

              {/* Two-Way SMS Quick Triggers */}
              <div className="mt-3 pt-2.5 border-t border-slate-700/70 flex items-center justify-between">
                <button
                  onClick={() => {
                    setActiveScreen('sms_inbox');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span>Check SMS Inbox ({smsList.length})</span>
                </button>

                <button
                  onClick={handleClearSms}
                  className="text-[11px] text-slate-400 hover:text-rose-400 inline-flex items-center gap-1 cursor-pointer"
                  title="Clear simulated SMS messages"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Reset SMS</span>
                </button>
              </div>
            </div>

            {/* Why This Convinces the Kenyan Government (National Impact) */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                🇰🇪 Why This Solves Kenya's Real Problem:
              </span>

              <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-300 text-xs">Bridge Kenya's 45%+ Digital Divide</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    Millions of informal households, elderly citizens, and rural communities in all 47 counties lack smartphones or mobile data. USSD works on any 2G GSM handset.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/20 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-300 text-xs">Empowers Jua Kali Artisans Directly</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    Informal fundis can accept jobs, verify client escrow commits, and receive cash straight to M-Pesa using their basic feature phone without high-tech barriers.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/20 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-300 text-xs">Ready for Africa's Talking & Safaricom API</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    Uses the exact <code className="text-amber-300 font-mono">POST /api/ussd</code> protocol (CON/END) required by licensed Kenyan telecom aggregators.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Action / Close */}
          <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Simulated Device: +254 712 998 877</span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
            >
              Done Testing
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
