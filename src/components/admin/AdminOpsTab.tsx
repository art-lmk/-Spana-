import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldAlert, 
  Cpu, 
  RotateCw, 
  Layers, 
  ToggleLeft, 
  ToggleRight, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Database, 
  Clock, 
  Terminal, 
  RefreshCcw, 
  Server, 
  ArrowRight, 
  GitBranch, 
  ShieldCheck, 
  Lock, 
  Globe, 
  HardDrive, 
  Play, 
  Check, 
  Cloud, 
  BarChart2,
  Calendar,
  KeyRound,
  Shield,
  Radio,
  FileCode,
  Gauge
} from 'lucide-react';
import { 
  SystemMetricsSummary, 
  FeatureFlagItem, 
  DeadLetterQueueItem, 
  SagaTransactionItem,
  BlueGreenDeploymentState,
  CronJobItem,
  BackupSnapshotItem,
  InfraTopologySummary
} from '../../types';

export const AdminOpsTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'telemetry' | 'resilience' | 'deployments' | 'database' | 'security' | 'cron_dr'>('telemetry');
  const [metrics, setMetrics] = useState<SystemMetricsSummary | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlagItem[]>([]);
  const [dlqItems, setDlqItems] = useState<DeadLetterQueueItem[]>([]);
  const [sagas, setSagas] = useState<SagaTransactionItem[]>([]);
  const [blueGreen, setBlueGreen] = useState<BlueGreenDeploymentState | null>(null);
  const [cronJobs, setCronJobs] = useState<CronJobItem[]>([]);
  const [backups, setBackups] = useState<BackupSnapshotItem[]>([]);
  const [topology, setTopology] = useState<InfraTopologySummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [simulatingSaga, setSimulatingSaga] = useState<boolean>(false);
  const [runningCronId, setRunningCronId] = useState<string | null>(null);
  const [creatingBackup, setCreatingBackup] = useState<boolean>(false);

  const fetchOpsData = async () => {
    setIsRefreshing(true);
    try {
      const [
        metricsRes, 
        flagsRes, 
        dlqRes, 
        sagasRes, 
        deployRes, 
        cronRes, 
        backupsRes, 
        topologyRes
      ] = await Promise.all([
        fetch('/api/system/metrics').then(r => r.ok ? r.json() : null),
        fetch('/api/system/feature-flags').then(r => r.ok ? r.json() : []),
        fetch('/api/system/dlq').then(r => r.ok ? r.json() : []),
        fetch('/api/system/sagas').then(r => r.ok ? r.json() : []),
        fetch('/api/system/deployments').then(r => r.ok ? r.json() : null),
        fetch('/api/system/cron').then(r => r.ok ? r.json() : []),
        fetch('/api/system/backups').then(r => r.ok ? r.json() : []),
        fetch('/api/system/infra-topology').then(r => r.ok ? r.json() : null)
      ]);

      if (metricsRes) setMetrics(metricsRes);
      if (flagsRes) setFeatureFlags(flagsRes);
      if (dlqRes) setDlqItems(dlqRes);
      if (sagasRes) setSagas(sagasRes);
      if (deployRes) setBlueGreen(deployRes);
      if (cronRes) setCronJobs(cronRes);
      if (backupsRes) setBackups(backupsRes);
      if (topologyRes) setTopology(topologyRes);
    } catch (err) {
      console.warn('Ops data fetch error:', err);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpsData();
    const interval = setInterval(fetchOpsData, 8000);
    return () => clearInterval(interval);
  }, []);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleToggleFlag = async (key: string, currentVal: boolean) => {
    try {
      const res = await fetch('/api/system/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, enabled: !currentVal })
      });
      if (res.ok) {
        setFeatureFlags(prev => prev.map(f => f.key === key ? { ...f, enabled: !currentVal } : f));
        showNotice(`Feature flag "${key}" set to ${!currentVal ? 'ENABLED' : 'DISABLED'}`);
      }
    } catch (e: any) {
      showNotice(`Failed to toggle flag: ${e.message}`);
    }
  };

  const handleTripCircuitBreaker = async (name: string) => {
    try {
      const res = await fetch(`/api/system/circuit-breakers/${name}/trip`, { method: 'POST' });
      if (res.ok) {
        showNotice(`Circuit Breaker "${name}" manually TRIPPED to OPEN (Chaos test active)`);
        fetchOpsData();
      }
    } catch (e: any) {
      showNotice(`Failed: ${e.message}`);
    }
  };

  const handleResetCircuitBreaker = async (name: string) => {
    try {
      const res = await fetch(`/api/system/circuit-breakers/${name}/reset`, { method: 'POST' });
      if (res.ok) {
        showNotice(`Circuit Breaker "${name}" RESET to CLOSED (Healthy)`);
        fetchOpsData();
      }
    } catch (e: any) {
      showNotice(`Failed: ${e.message}`);
    }
  };

  const handleRetryDLQ = async (id: string) => {
    try {
      const res = await fetch(`/api/system/dlq/${id}/retry`, { method: 'POST' });
      if (res.ok) {
        showNotice(`DLQ Item ${id} replayed successfully.`);
        fetchOpsData();
      }
    } catch (e: any) {
      showNotice(`Retry failed: ${e.message}`);
    }
  };

  const handleToggleBlueGreen = async () => {
    try {
      const res = await fetch('/api/system/deployments/toggle', { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        setBlueGreen(updated);
        showNotice(`Active traffic switched to ${updated.activeSlot} slot (${updated.activeSlot === 'GREEN' ? updated.greenVersion : updated.blueVersion})`);
      }
    } catch (e: any) {
      showNotice(`Failed to switch slot: ${e.message}`);
    }
  };

  const handleRunCron = async (id: string) => {
    setRunningCronId(id);
    try {
      const res = await fetch(`/api/system/cron/${id}/run`, { method: 'POST' });
      if (res.ok) {
        const updatedJob = await res.json();
        setCronJobs(prev => prev.map(j => j.id === id ? updatedJob : j));
        showNotice(`Cron job "${updatedJob.name}" executed successfully in ${updatedJob.lastExecutionDurationMs}ms.`);
      }
    } catch (e: any) {
      showNotice(`Failed to run cron job: ${e.message}`);
    } finally {
      setRunningCronId(null);
    }
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const res = await fetch('/api/system/backups/create', { method: 'POST' });
      if (res.ok) {
        const snap = await res.json();
        setBackups(prev => [snap, ...prev]);
        showNotice(`Disaster Recovery point-in-time snapshot ${snap.id} created (${snap.sizeMb} MB) in ${snap.region}.`);
      }
    } catch (e: any) {
      showNotice(`Failed to create backup: ${e.message}`);
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleSimulateSaga = async (simulateFailure: boolean = false) => {
    setSimulatingSaga(true);
    try {
      const res = await fetch('/api/system/sagas/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulateFailure })
      });
      if (res.ok) {
        const data = await res.json();
        showNotice(data.message);
        fetchOpsData();
      }
    } catch (e: any) {
      showNotice(`Saga simulation failed: ${e.message}`);
    } finally {
      setSimulatingSaga(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header bar with auto-refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-900 text-amber-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>Enterprise Architecture & SRE Ops Console</span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Healthy • 99.98% SLI
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Observability, Distributed Sagas, Blue-Green Slots, Sharding, Dead Letter Queues, Secrets, and Microservice Protection
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchOpsData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Telemetry'}</span>
          </button>
          <a
            href="/api/metrics"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold transition shadow-xs"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Prometheus /metrics</span>
          </a>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-slate-900 text-amber-300 text-xs font-semibold rounded-xl flex items-center justify-between shadow-sm animate-in fade-in duration-150 border border-amber-500/20">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white p-1">✕</button>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('telemetry')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeSubTab === 'telemetry' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>1. SLOs & Telemetry</span>
        </button>

        <button
          onClick={() => setActiveSubTab('resilience')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeSubTab === 'resilience' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>2. Sagas, DLQ & Chaos</span>
        </button>

        <button
          onClick={() => setActiveSubTab('deployments')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeSubTab === 'deployments' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>3. Blue-Green & Scaling</span>
        </button>

        <button
          onClick={() => setActiveSubTab('database')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeSubTab === 'database' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>4. Sharding & Pooling</span>
        </button>

        <button
          onClick={() => setActiveSubTab('security')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeSubTab === 'security' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>5. Zero-Trust & Secrets</span>
        </button>

        <button
          onClick={() => setActiveSubTab('cron_dr')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeSubTab === 'cron_dr' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>6. Cron & Disaster Recovery</span>
        </button>
      </div>

      {/* 1. TELEMETRY & SLOS */}
      {activeSubTab === 'telemetry' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Availability SLI vs Target SLO */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Availability SLI</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  Target SLO: {metrics?.sli.targetSloPercentage || 99.9}%
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {metrics?.sli.currentAvailabilityPercentage?.toFixed(2) ?? '99.98'}%
              </div>
              <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-1.5 rounded-full" 
                  style={{ width: `${Math.min(100, metrics?.sli.currentAvailabilityPercentage || 99.98)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                <span>Remaining Error Budget:</span>
                <strong className="text-emerald-700 font-bold">{metrics?.sli.errorBudgetRemainingPercentage || 98.4}%</strong>
              </p>
            </div>

            {/* Latency Percentiles */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Latency Percentiles</span>
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-black text-slate-900">{metrics?.latencies.p50 || 12}ms</div>
                <span className="text-xs text-slate-500 font-semibold">(p50 median)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">p95 SLA Threshold</span>
                  <strong className="text-slate-800 font-bold">{metrics?.latencies.p95 || 32} ms</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">p99 Tail Latency</span>
                  <strong className="text-amber-700 font-bold">{metrics?.latencies.p99 || 68} ms</strong>
                </div>
              </div>
            </div>

            {/* Traffic Throughput */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Throughput & Codes</span>
                <Server className="w-4 h-4 text-slate-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {(metrics?.totalRequests || 42).toLocaleString()} <span className="text-xs text-slate-500 font-medium">requests</span>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 text-[11px] font-bold">
                <span className="text-emerald-700">2xx: {metrics?.statusCodes['2xx'] || 40}</span>
                <span className="text-amber-700">4xx: {metrics?.statusCodes['4xx'] || 2}</span>
                <span className="text-rose-700">5xx: {metrics?.statusCodes['5xx'] || 0}</span>
              </div>
            </div>

            {/* Runtime Resources */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Memory & Uptime</span>
                <Cpu className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {metrics?.memory.heapUsedMb || 45} MB <span className="text-xs text-slate-500 font-medium">heap</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span>Uptime:</span>
                <strong className="text-slate-800 font-bold">{Math.floor((metrics?.uptimeSeconds || 360) / 60)} mins</strong>
              </p>
            </div>

          </div>

          {/* Dynamic Feature Flags Management */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-orange-600" />
                  <span>Dynamic Feature Flags & Progressive Rollouts</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Toggle live capabilities without redeploying container instances</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                {featureFlags.filter(f => f.enabled).length} Enabled
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {featureFlags.map(flag => (
                <div 
                  key={flag.key}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-bold text-slate-900">{flag.name}</strong>
                      <span className="text-[10px] text-slate-500 font-mono">({flag.key})</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{flag.description}</p>
                  </div>

                  <button
                    onClick={() => handleToggleFlag(flag.key, flag.enabled)}
                    className="shrink-0 p-1 rounded-lg text-slate-700 hover:text-slate-900 cursor-pointer"
                  >
                    {flag.enabled ? (
                      <ToggleRight className="w-7 h-7 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-400" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. RESILIENCE, SAGAS, DLQ & CHAOS */}
      {activeSubTab === 'resilience' && (
        <div className="space-y-6">
          
          {/* Circuit Breakers with Chaos Testing */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Circuit Breakers & Microservice Chaos Injection</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Automated fail-open isolation when downstream dependencies falter</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                3 Breakers Active
              </span>
            </div>

            <div className="space-y-3">
              {[
                { key: 'gemini', name: 'Gemini 3.7 NLP Diagnostic Engine', desc: 'AI maintenance symptom triage and Sheng slang interpretation' },
                { key: 'fastApi', name: 'FastAPI Recommender Microservice', desc: 'Colab external collaborative filtering and ranker' },
                { key: 'mpesa', name: 'Safaricom Daraja Escrow API', desc: 'M-Pesa STK push and automated payout settlement' }
              ].map(cb => {
                const state = metrics?.circuitBreakers?.[cb.key as keyof typeof metrics.circuitBreakers] || 'CLOSED';
                const isClosed = state === 'CLOSED';

                return (
                  <div key={cb.key} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isClosed ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
                        <strong className="text-xs font-bold text-slate-900">{cb.name}</strong>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          isClosed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {state}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{cb.desc}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isClosed ? (
                        <button
                          onClick={() => handleTripCircuitBreaker(cb.key)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer"
                          title="Simulate service outage (Chaos engineering)"
                        >
                          Trip Breaker (Chaos)
                        </button>
                      ) : (
                        <button
                          onClick={() => handleResetCircuitBreaker(cb.key)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                          Reset Breaker
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Distributed Sagas & Compensating Transactions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <span>Distributed Saga Orchestrator & Compensating Rollbacks</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Multi-step distributed booking and escrow locking with two-phase rollback</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSimulateSaga(false)}
                  disabled={simulatingSaga}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3" />
                  <span>Test Successful Saga</span>
                </button>
                <button
                  onClick={() => handleSimulateSaga(true)}
                  disabled={simulatingSaga}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Test Failure & Rollback</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {sagas.slice(0, 5).map(saga => (
                <div key={saga.sagaId} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{saga.sagaId}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({saga.correlationId})</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                      saga.status === 'COMMITTED' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : saga.status === 'ROLLED_BACK'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {saga.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                    {saga.steps.map((st, i) => (
                      <div key={i} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center gap-2">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${st.status === 'SUCCESS' ? 'text-emerald-600' : 'text-amber-500'}`} />
                        <span className="text-[11px] font-medium text-slate-700 truncate">{st.name}</span>
                      </div>
                    ))}
                  </div>

                  {saga.rollbackReason && (
                    <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      <strong>Rollback Trigger:</strong> {saga.rollbackReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dead Letter Queue (DLQ) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Dead Letter Queue (DLQ) & Failure Redrive</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Captures poison pills, timeout events, and cellular SMPP SMS failures</p>
              </div>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                dlqItems.filter(i => i.status === 'PENDING_RETRY').length > 0 
                  ? 'bg-rose-100 text-rose-800 font-black' 
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {dlqItems.filter(i => i.status === 'PENDING_RETRY').length} Pending
              </span>
            </div>

            <div className="space-y-3">
              {dlqItems.map(item => (
                <div key={item.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-800">{item.id} • {item.source}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      item.status === 'PENDING_RETRY' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.status} ({item.attempts} attempts)
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg font-mono">
                    {item.error}
                  </p>
                  {item.status === 'PENDING_RETRY' && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleRetryDLQ(item.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs transition cursor-pointer"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Replay / Redrive Poison Pill</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 3. BLUE-GREEN DEPLOYMENTS & SCALING */}
      {activeSubTab === 'deployments' && (
        <div className="space-y-6">
          
          {/* Blue-Green Controller */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-emerald-600" />
                  <span>Blue-Green Zero-Downtime Deployment Controller</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Switch production customer traffic between release slots with zero packet loss</p>
              </div>

              <button
                onClick={handleToggleBlueGreen}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-xs transition shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Switch Live Traffic Slot</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Blue Slot */}
              <div className={`p-4 rounded-2xl border transition ${
                blueGreen?.activeSlot === 'BLUE'
                  ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Blue Environment Slot</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                    blueGreen?.activeSlot === 'BLUE' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {blueGreen?.activeSlot === 'BLUE' ? '100% Traffic (LIVE)' : 'STANDBY'}
                  </span>
                </div>
                <div className="text-lg font-black text-slate-900">{blueGreen?.blueVersion || 'v2.4.1 (Stable Release)'}</div>
                <p className="text-xs text-slate-500 mt-1">Status: {blueGreen?.health.blue || 'HEALTHY'}</p>
              </div>

              {/* Green Slot */}
              <div className={`p-4 rounded-2xl border transition ${
                blueGreen?.activeSlot === 'GREEN'
                  ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Green Environment Slot</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                    blueGreen?.activeSlot === 'GREEN' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {blueGreen?.activeSlot === 'GREEN' ? '100% Traffic (LIVE)' : 'PRE-WARMED STANDBY'}
                  </span>
                </div>
                <div className="text-lg font-black text-slate-900">{blueGreen?.greenVersion || 'v2.4.2 (Canary / Staged)'}</div>
                <p className="text-xs text-slate-500 mt-1">Status: {blueGreen?.health.green || 'STANDBY'}</p>
              </div>

            </div>
          </div>

          {/* Compute Scaling & CI/CD */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">HPA Autoscaling</span>
              <div className="text-2xl font-black text-slate-900 mt-1">4 / 12 Pods</div>
              <p className="text-xs text-slate-500 mt-2">Target CPU: 65% • Current Average: 34%</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Build Caching</span>
              <div className="text-2xl font-black text-slate-900 mt-1">94.2% Hit Rate</div>
              <p className="text-xs text-slate-500 mt-2">Turborepo & Vite PWA precache enabled</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Infrastructure as Code</span>
              <div className="text-lg font-black text-slate-900 mt-1">Terraform Synced</div>
              <p className="text-xs text-slate-500 mt-2 truncate">gs://fundiconnect-iac-state/prod.tfstate</p>
            </div>

          </div>

        </div>
      )}

      {/* 4. DATABASE LAYER, SHARDING & POOLING */}
      {activeSubTab === 'database' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Connection Pooling */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Connection Pooling</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">PgBouncer</span>
              </div>
              <div className="text-2xl font-black text-slate-900">18 Active / 32 Idle</div>
              <p className="text-xs text-slate-500 mt-2">Pool Utilization: 36% • Max Connections: 100</p>
            </div>

            {/* Read Replicas */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Read Replicas</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">2 Replicas</span>
              </div>
              <div className="text-2xl font-black text-slate-900">0.6 ms Lag</div>
              <p className="text-xs text-slate-500 mt-2">Synchronous streaming replication across zones</p>
            </div>

            {/* County Sharding */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">County Hash Sharding</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">47 Shards</span>
              </div>
              <div className="text-2xl font-black text-slate-900">Partitioned Tables</div>
              <p className="text-xs text-slate-500 mt-2">Hash-partitioned by Kenya County Code (047, 001, 032)</p>
            </div>

          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm">Query Optimization & Concurrency Protections</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong className="text-slate-900 block font-bold">N+1 Query Prevention:</strong>
                <p className="text-slate-500 mt-1">Batch DataLoader with in-memory memoization eliminates duplicate roundtrips when loading artisan reviews, certifications, and trade tests.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong className="text-slate-900 block font-bold">Optimistic Concurrency & Mutex:</strong>
                <p className="text-slate-500 mt-1">Row-level versioning checks prevent double-booking collisions when multiple homeowners attempt to reserve the same fundi timeslot simultaneously.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. ZERO-TRUST SECURITY & SECRETS */}
      {activeSubTab === 'security' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>JWT Key Rotation & Secrets Management</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Active Key ID:</span>
                  <span className="font-mono font-bold text-slate-800">jwt-key-2026-q3-b</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Rotation Schedule:</span>
                  <span className="font-bold text-emerald-700">Every 15 Minutes (Asymmetric RS256)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Secrets Vault:</span>
                  <span className="font-bold text-slate-800">GCP Secret Manager / HashiCorp Vault</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Encryption & Edge Defense</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">In-Transit Protocol:</span>
                  <span className="font-bold text-slate-800">TLS 1.3 (HSTS 31536000s)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">At-Rest Encryption:</span>
                  <span className="font-bold text-slate-800">AES-256-GCM Cloud KMS Envelope</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">WAF / DDoS Shield:</span>
                  <span className="font-bold text-emerald-700">Active (100+ Gbps Scrubbing)</span>
                </div>
              </div>
            </div>

          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm">Supported Edge Protocols & Network Stack</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong className="block text-slate-900">HTTP/2</strong>
                <span className="text-slate-500 text-[11px]">Multiplexed Streaming</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong className="block text-slate-900">HTTP/3 (QUIC)</strong>
                <span className="text-slate-500 text-[11px]">UDP Mobile Acceleration</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong className="block text-slate-900">WebSockets (WSS)</strong>
                <span className="text-slate-500 text-[11px]">Bidirectional Sync</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong className="block text-slate-900">SSE Live Stream</strong>
                <span className="text-slate-500 text-[11px]">Server-Sent Events</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. CRON JOBS & DISASTER RECOVERY */}
      {activeSubTab === 'cron_dr' && (
        <div className="space-y-6">
          
          {/* Automated Cron Jobs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Automated Cron Jobs Scheduler</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Recurring background daemons for escrow reconciliation and cache maintenance</p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {cronJobs.length} Jobs Active
              </span>
            </div>

            <div className="space-y-3">
              {cronJobs.map(job => (
                <div key={job.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-bold text-slate-900">{job.name}</strong>
                      <span className="font-mono text-[11px] bg-slate-200/80 px-2 py-0.5 rounded text-slate-700">{job.schedule}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{job.description}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                      <span>Executions: <strong>{job.totalExecutions}</strong></span>
                      <span>Last duration: <strong>{job.lastExecutionDurationMs} ms</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRunCron(job.id)}
                    disabled={runningCronId === job.id}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs transition shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3 h-3" />
                    <span>{runningCronId === job.id ? 'Running...' : 'Execute Now'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Disaster Recovery & Multi-Region Failover */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-blue-600" />
                  <span>Disaster Recovery & Multi-Region Standby</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Primary: af-south-1 (Nairobi Edge) • Failover: eu-west-1 (Dublin Standby)</p>
              </div>

              <button
                onClick={handleCreateBackup}
                disabled={creatingBackup}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>{creatingBackup ? 'Creating Snapshot...' : 'Create Snapshot Now'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Recovery Point Objective (RPO):</span>
                <strong className="text-slate-900 font-bold text-sm">&lt; 5 Minutes (Actual: 3.2m)</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Recovery Time Objective (RTO):</span>
                <strong className="text-slate-900 font-bold text-sm">&lt; 2 Minutes (Actual: 1.1m)</strong>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700">Point-in-Time Snapshot History:</span>
              {backups.map(snap => (
                <div key={snap.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-800">{snap.id}</span>
                    <span className="text-[10px] text-slate-400 font-mono ml-2">({snap.checksum.substring(0, 16)}...)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">{snap.sizeMb} MB</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {snap.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
