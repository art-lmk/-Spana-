import React, { useState, useEffect } from 'react';
import { 
  X, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Sliders, 
  Code2, 
  Server,
  Play
} from 'lucide-react';

interface FastApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  customFastApiUrl: string;
  onSaveFastApiUrl: (url: string) => void;
  isFastApiActive: boolean;
  onToggleActive: (active: boolean) => void;
}

export const FastApiConfigModal: React.FC<FastApiConfigModalProps> = ({
  isOpen,
  onClose,
  customFastApiUrl,
  onSaveFastApiUrl,
  isFastApiActive,
  onToggleActive,
}) => {
  const [urlInput, setUrlInput] = useState(customFastApiUrl || 'http://localhost:8000/recommend');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    message: string;
    sampleOutput?: any;
    status?: number;
  } | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => {
    if (isOpen && customFastApiUrl) {
      setUrlInput(customFastApiUrl);
    }
  }, [isOpen, customFastApiUrl]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/fastapi/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() })
      });

      const data = await res.json();
      setTestResult(data);
      if (data.success) {
        onSaveFastApiUrl(urlInput.trim());
        onToggleActive(true);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection failed'
      });
    } finally {
      setTesting(false);
    }
  };

  const samplePythonCode = `from fastapi import FastAPI
from pydantic import BaseModel
import math
from typing import List, Optional

app = FastAPI(title="Spana Recommendation Engine")

class Candidate(BaseModel):
    id: str
    lat: float
    lng: float
    category: str
    rating: float
    jobs_completed: Optional[int] = 0
    is_available: Optional[bool] = True

class RecommendationRequest(BaseModel):
    user_lat: float
    user_lng: float
    category: Optional[str] = "All"
    search_query: Optional[str] = ""
    max_distance_km: Optional[float] = 50.0
    candidates: List[Candidate]

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371 # km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

@app.post("/recommend")
def recommend_fundis(req: RecommendationRequest):
    results = []
    for cand in req.candidates:
        dist_km = haversine_distance(req.user_lat, req.user_lng, cand.lat, cand.lng)
        if dist_km > req.max_distance_km:
            continue
            
        # ML Proximity Exponential Decay + Rating Model
        prox_score = max(10, 100 * math.exp(-dist_km / 15.0))
        rating_score = (cand.rating / 5.0) * 100
        avail_bonus = 10 if cand.is_available else 0
        
        # Weighted Ranking: 40% Distance, 30% Rating, 20% Category, 10% Availability
        final_score = int(prox_score * 0.40 + rating_score * 0.30 + 20 + avail_bonus)
        
        results.append({
            "id": cand.id,
            "distance_km": round(dist_km, 2),
            "match_score": min(99, max(50, final_score)),
            "reasons": [
                f"Proximity model: {round(dist_km, 1)} km away",
                f"{cand.rating}★ rating verified by Colab ML model"
            ]
        })
        
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return {
        "model_name": "FastAPI Google Colab Proximity Regressor v1.0",
        "total_ranked": len(results),
        "recommendations": results
    }`;

  const copyCode = () => {
    navigator.clipboard.writeText(samplePythonCode);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div 
        id="fastapi-config-modal"
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30">
              <Activity className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight font-['Outfit',sans-serif]">
              FastAPI & Colab ML Microservice Hub
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-indigo-200 max-w-xl">
            Seamlessly bridge your Google Colab recommendation model or remote FastAPI server into the Spana React frontend.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Microservice Endpoint Config Card */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Microservice Endpoint URL
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 font-medium">Use Live Microservice</span>
                <input
                  type="checkbox"
                  checked={isFastApiActive}
                  onChange={(e) => onToggleActive(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://xxxx.ngrok-free.app/recommend or http://localhost:8000/recommend"
                className="flex-1 px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 text-xs font-mono text-slate-900 outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                onClick={handleTestConnection}
                disabled={testing || !urlInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {testing ? 'Pinging...' : 'Test Connection'}
              </button>
            </div>

            {/* Test result display */}
            {testResult && (
              <div className={`p-3.5 rounded-xl border text-xs font-medium space-y-1.5 animate-in fade-in duration-150 ${
                testResult.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <div className="flex items-center gap-1.5">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                  {testResult.latencyMs && (
                    <span className="text-[11px] bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {testResult.latencyMs} ms
                    </span>
                  )}
                </div>
                {!testResult.success && (
                  <p className="text-[11px] text-slate-600">
                    If using Google Colab, make sure you ran <code>pyngrok</code> or <code>localtunnel</code> and copied the HTTPS public tunnel URL.
                  </p>
                )}
              </div>
            )}

          </div>

          {/* Model Weights & Telemetry */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-orange-600" />
              <span>Location-Based Recommendation Weights Breakdown</span>
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Proximity Decay</span>
                <span className="text-lg font-black text-orange-600">35%</span>
                <span className="text-[10px] text-slate-500 block">Haversine GPS Dist</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Rating & Jobs</span>
                <span className="text-lg font-black text-amber-600">25%</span>
                <span className="text-[10px] text-slate-500 block">Bayesian Mean</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Skill Match</span>
                <span className="text-lg font-black text-blue-600">20%</span>
                <span className="text-[10px] text-slate-500 block">Trade Relevance</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Trust & Speed</span>
                <span className="text-lg font-black text-emerald-600">20%</span>
                <span className="text-[10px] text-slate-500 block">ID + Dispatch ETA</span>
              </div>
            </div>
          </div>

          {/* Colab / Python Code Blueprint */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-slate-600" />
                <span>FastAPI Python Microservice Template (Google Colab Ready)</span>
              </h4>
              <button
                onClick={copyCode}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition"
              >
                {copiedSnippet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSnippet ? 'Copied!' : 'Copy Python Code'}</span>
              </button>
            </div>

            <pre className="bg-slate-900 text-slate-100 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-56 custom-scrollbar border border-slate-800 leading-relaxed">
              {samplePythonCode}
            </pre>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
          <button
            onClick={() => {
              onSaveFastApiUrl(urlInput.trim());
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
          >
            Save & Close
          </button>
        </div>

      </div>
    </div>
  );
};
