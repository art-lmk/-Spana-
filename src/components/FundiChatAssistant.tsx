import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Loader2, 
  Phone, 
  MessageSquare, 
  ShieldAlert, 
  Award, 
  MapPin, 
  Clock, 
  RefreshCw, 
  ChevronDown, 
  Globe2, 
  CheckCircle2, 
  Star, 
  Calendar,
  SlidersHorizontal,
  Zap,
  Info
} from 'lucide-react';
import { Fundi, LocationCoordinates, ChatMessage, LanguageMode, ChatApiResponse, TradeCategory } from '../types';
import { formatCurrency } from '../utils/format';

interface FundiChatAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: LocationCoordinates;
  onBookFundi: (fundi: Fundi) => void;
  onViewFundiDetails: (fundi: Fundi) => void;
  onApplyCategoryFilter?: (category: TradeCategory, query?: string) => void;
}

const STARTER_PROMPTS = [
  {
    lang: 'sheng',
    label: '🇰🇪 Sheng: Stima inashoot keja',
    prompt: 'Oya niaje! Keja yangu stima inashoot cheche kwa socket ya kitchen na fuse imeblow. Nani ako rada chapchap?'
  },
  {
    lang: 'sheng',
    label: '🇰🇪 Sheng: Sink inavuja maji',
    prompt: 'Niaje msee, sink ya choo inavuja maji chafu chini ya tiles na inanuka. Nahitaji plamba wa NITA haraka.'
  },
  {
    lang: 'swahili',
    label: '🇹🇿🇰🇪 Swahili: Bomba limepasuka',
    prompt: 'Habari yako! Bomba kuu la maji limepasuka ukutani na linamwaga maji mengi. Nahitaji fundi wa dharura.'
  },
  {
    lang: 'swahili',
    label: '🇹🇿🇰🇪 Swahili: Kutengeneza kabati na milango',
    prompt: 'Hujambo, natafuta fundi seremala mwenye uzoefu wa kutengeneza kabati za jikoni na kurekebisha milango.'
  },
  {
    lang: 'english',
    label: '🇬🇧 English: Water heater repair',
    prompt: 'My instant water shower stopped heating and makes a buzzing sound. Need a certified technician in Nairobi.'
  }
];

export const FundiChatAssistant: React.FC<FundiChatAssistantProps> = ({
  isOpen,
  onClose,
  userLocation,
  onBookFundi,
  onViewFundiDetails,
  onApplyCategoryFilter
}) => {
  const [languageMode, setLanguageMode] = useState<LanguageMode>('auto');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `**Niaje! Habari yako! Welcome to Spana AI!** 👋🇰🇪\n\nNinaelewa na kuongea **Sheng**, **Kiswahili Sanifu**, na **English**. Nielezee shida uliyo nayo keja au ofisini (kama stima, mabomba, mbao, chuma, au rangi), nami nitakupa uchambuzi wa kiufundi, tahadhari za usalama, makadirio ya gharama (KES), na kukuunganisha na mafundi wenye vyeti vya NITA walio karibu nawe!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      detectedLanguage: 'sheng',
      suggestedReplies: [
        'Oya, niko na shida ya stima inaruka keja',
        'Habari, nahitaji fundi wa mabomba ya maji',
        'Show me top-rated carpenters near me'
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const historyToSend = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyToSend,
          userLat: userLocation.lat,
          userLng: userLocation.lng,
          languageMode: languageMode,
          maxDistanceKm: 50
        })
      });

      if (!res.ok) {
        throw new Error('Chat service temporarily unavailable');
      }

      const data: ChatApiResponse = await res.json();

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        detectedLanguage: data.detectedLanguage,
        recommendedFundis: data.recommendedFundis,
        actionCategory: data.categoryDetected,
        costEstimateKes: data.costEstimateKes,
        safetyTips: data.safetyTips,
        suggestedReplies: data.suggestedReplies
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `**Pole sana!** Samahani kuna hitilafu ya mtandao. Jaribu tena au chagua fundi direct kwenye orodha yetu.\n\n*Error: ${err.message}*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        detectedLanguage: 'swahili'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `**Mazungumzo mapya yameanzishwa!** 💬\n\nNiko tayari kwa Sheng, Swahili, au English. Niambie tatizo au kazi yoyote unayotaka ifanywe!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        detectedLanguage: 'sheng',
        suggestedReplies: [
          'Niaje, instant shower yangu haipashi maji moto',
          'Nahitaji fundi wa stima kurekebisha taa na swichi',
          'Find emergency plumbing near Westlands'
        ]
      }
    ]);
  };

  const getLanguageLabel = (lang?: string) => {
    if (lang === 'sheng') return { text: 'Sheng 🇰🇪', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    if (lang === 'swahili') return { text: 'Kiswahili 🇹🇿🇰🇪', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    return { text: 'English 🇬🇧', color: 'bg-slate-100 text-slate-800 border-slate-300' };
  };

  if (!isOpen) return null;

  return (
    <div 
      id="fundi-chat-modal"
      className="fixed inset-0 z-50 flex items-center justify-end sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full sm:max-w-xl h-full sm:h-[92vh] bg-white sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-200">
        
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-slate-900 via-orange-950 to-slate-900 text-white p-4 sm:p-5 shrink-0 border-b border-orange-900/40 relative">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 p-0.5 shadow-md flex items-center justify-center">
                <Bot className="w-6 h-6 text-white stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-base sm:text-lg text-white font-['Outfit',sans-serif]">
                    Spana <span className="text-orange-400">AI</span>
                  </h3>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/30 text-orange-200 border border-orange-400/30">
                    Sheng & Swahili
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Artisan Triage & NITA Matcher</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={clearChat}
                title="Futa mazungumzo (Clear Chat)"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Language Mode Selector Bar */}
          <div className="flex items-center justify-between bg-black/40 p-1.5 rounded-xl border border-white/10 text-xs">
            <span className="text-[11px] font-bold text-slate-300 px-2 flex items-center gap-1">
              <Globe2 className="w-3.5 h-3.5 text-orange-400" />
              Lugha:
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setLanguageMode('auto')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  languageMode === 'auto'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                ⚡ Auto
              </button>
              <button
                type="button"
                onClick={() => setLanguageMode('sheng')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  languageMode === 'sheng'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                🇰🇪 Sheng
              </button>
              <button
                type="button"
                onClick={() => setLanguageMode('swahili')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  languageMode === 'swahili'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                🇹🇿🇰🇪 Kiswahili
              </button>
              <button
                type="button"
                onClick={() => setLanguageMode('english')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  languageMode === 'english'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                🇬🇧 English
              </button>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-50/70">
          
          {/* Quick Starter Pills */}
          {messages.length <= 1 && (
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  Mifano ya Maswali (Quick Starters):
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {STARTER_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(item.prompt)}
                    className="text-left text-xs bg-slate-50 hover:bg-orange-50 hover:text-orange-950 hover:border-orange-300 p-2.5 rounded-xl border border-slate-200 text-slate-700 transition flex items-start justify-between gap-2 group"
                  >
                    <span className="font-medium line-clamp-1">{item.prompt}</span>
                    <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 group-hover:border-orange-200">
                      {item.lang.toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages list */}
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const langBadge = getLanguageLabel(msg.detectedLanguage);

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[88%] space-y-2.5 ${isUser ? 'items-end' : 'items-start'}`}>
                  
                  {/* Speech Bubble */}
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-tr-xs'
                        : 'bg-white text-slate-900 border border-slate-200/90 rounded-tl-xs'
                    }`}
                  >
                    {/* Header in assistant message */}
                    {!isUser && msg.detectedLanguage && (
                      <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-slate-100 text-[10px]">
                        <span className={`px-1.5 py-0.5 rounded font-bold border ${langBadge.color}`}>
                          {langBadge.text}
                        </span>
                        <span className="text-slate-400">{msg.timestamp}</span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="whitespace-pre-line prose-xs font-normal">
                      {msg.content}
                    </div>

                    {/* Cost Estimate Callout */}
                    {msg.costEstimateKes && (
                      <div className="mt-3 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-950 flex items-center justify-between gap-2">
                        <div className="text-xs">
                          <span className="font-bold block text-amber-900">Makadirio ya Bei / Cost:</span>
                          <span>KES {formatCurrency(msg.costEstimateKes?.min ?? 800)} - {formatCurrency(msg.costEstimateKes?.max ?? 3000)}</span>
                        </div>
                        {msg.actionCategory && onApplyCategoryFilter && (
                          <button
                            type="button"
                            onClick={() => onApplyCategoryFilter(msg.actionCategory!)}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shrink-0 transition"
                          >
                            Filter {msg.actionCategory}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Recommended Fundis Attached */}
                    {msg.recommendedFundis && msg.recommendedFundis.length > 0 && (
                      <div className="mt-3.5 space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-orange-600" />
                            Mafundi Walioidhinishwa (Matched Artisans):
                          </span>
                        </div>

                        <div className="space-y-2">
                          {msg.recommendedFundis.map((fundi) => (
                            <div
                              key={fundi.id}
                              className="bg-slate-50 hover:bg-orange-50/50 p-2.5 rounded-xl border border-slate-200 transition text-slate-900 flex flex-col gap-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={fundi.avatarUrl}
                                    alt={fundi.name}
                                    className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div>
                                    <div className="flex items-center gap-1">
                                      <h4 className="font-bold text-xs text-slate-900">{fundi.name}</h4>
                                      {fundi.nitaAccredited && (
                                        <span className="px-1 py-0.2 rounded text-[9px] font-black bg-blue-100 text-blue-800 border border-blue-200">
                                          NITA I
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                      <span className="text-orange-600 font-semibold">{fundi.primaryCategory}</span>
                                      <span>•</span>
                                      <span className="flex items-center gap-0.5 text-slate-700 font-medium">
                                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                        {fundi.rating} ({fundi.jobsCompleted} jobs)
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="text-xs font-black text-slate-900 block">
                                    KES {fundi.hourlyRateKes}/hr
                                  </span>
                                  {fundi.distanceKm !== undefined && (
                                    <span className="text-[10px] text-slate-500 flex items-center justify-end gap-0.5">
                                      <MapPin className="w-2.5 h-2.5 text-orange-500" />
                                      {fundi.distanceKm} km
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                                <a
                                  href={`https://wa.me/${fundi.whatsapp.replace('+', '')}?text=${encodeURIComponent(
                                    msg.detectedLanguage === 'sheng'
                                      ? `Niaje Fundi ${fundi.name}, nimekuona kwa Spana AI. Natafuta usaidizi wa ${fundi.primaryCategory} keja.`
                                      : `Habari Fundi ${fundi.name}, nimepata mawasiliano yako kupitia Spana AI. Ninahitaji huduma ya ${fundi.primaryCategory}.`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] text-center flex items-center justify-center gap-1 transition shadow-xs"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </a>

                                <a
                                  href={`tel:${fundi.phone}`}
                                  className="py-1 px-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[11px] flex items-center justify-center gap-1 transition"
                                >
                                  <Phone className="w-3 h-3 text-slate-700" />
                                  <span>Piga</span>
                                </a>

                                <button
                                  type="button"
                                  onClick={() => onBookFundi(fundi)}
                                  className="flex-1 py-1 px-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition shadow-xs"
                                >
                                  <Calendar className="w-3 h-3" />
                                  <span>Book Sasa</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onViewFundiDetails(fundi)}
                                  className="py-1 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200 transition"
                                >
                                  Profile
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contextual Suggested Replies */}
                  {!isUser && msg.suggestedReplies && msg.suggestedReplies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestedReplies.map((replyText, rIdx) => (
                        <button
                          key={rIdx}
                          type="button"
                          onClick={() => handleSendMessage(replyText)}
                          className="text-[11px] bg-white hover:bg-orange-50 hover:text-orange-950 hover:border-orange-300 text-slate-700 px-2.5 py-1 rounded-xl border border-slate-200 transition shadow-2xs font-medium"
                        >
                          💬 {replyText}
                        </button>
                      ))}
                    </div>
                  )}

                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white p-3.5 rounded-2xl rounded-tl-xs border border-slate-200 shadow-xs flex items-center gap-2 text-xs text-slate-600">
                <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
                <span className="font-semibold">Fundi AI anachambua shida na kutafuta mafundi...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0 space-y-2">
          
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  languageMode === 'sheng'
                    ? 'Eleza shida kwa Sheng (e.g. Instant shower inashoot stima keja)...'
                    : languageMode === 'swahili'
                    ? 'Andika tatizo lako kwa Kiswahili (e.g. Bomba la maji linavuja)...'
                    : 'Describe your issue in Sheng, Swahili, or English...'
                }
                disabled={isLoading}
                className="w-full pl-3.5 pr-10 py-3 bg-slate-50 focus:bg-white rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-xs sm:text-sm text-slate-900 outline-hidden transition"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">
                {languageMode}
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="p-3 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white shadow-md shadow-orange-600/30 transition shrink-0 flex items-center justify-center"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>

          {/* Quick cultural disclaimer */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3 text-orange-500" />
              Supports Sheng slang, Kiswahili Sanifu & English with NITA verified ratings.
            </span>
            <span className="font-semibold text-slate-600">
              Westlands / Nairobi, KE
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
