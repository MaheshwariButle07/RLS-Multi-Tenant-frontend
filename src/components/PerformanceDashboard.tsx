import React, { useState } from 'react';
import { Activity, Database, Trash2, Cpu, Zap, Info, BarChart3 } from 'lucide-react';
import { ApiClient } from '../lib/supabase';
import type { PerformanceMetrics } from '../types/performance-metrics';

interface PerformanceDashboardProps {
  metrics: PerformanceMetrics | null;
  onRefreshNodes: () => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  metrics,
  onRefreshNodes
}) => {
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState<any | null>(null);

  const handleSeed = async (count: number) => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const data = await ApiClient.seedScaleData(count);
      setSeedResult(`Successfully loaded ${count.toLocaleString()} scale testing nodes in ${data.durationMs}ms.`);
      onRefreshNodes();
    } catch (err: any) {
      setSeedResult(`Error: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleCleanup = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const data = await ApiClient.cleanupScaleData();
      setSeedResult(data.message);
      setBenchmarkData(null);
      onRefreshNodes();
    } catch (err: any) {
      setSeedResult(`Error: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleBenchmark = async () => {
    setBenchmarking(true);
    try {
      const data = await ApiClient.runBenchmark();
      setBenchmarkData(data);
    } catch (err: any) {
      console.error('Benchmark failed:', err);
    } finally {
      setBenchmarking(false);
    }
  };

  // Compute timing breakdowns
  const planTime = metrics?.planningTimeMs || 0;
  const execTime = metrics?.executionTimeMs || 0;
  const total = planTime + execTime || 1;
  const planPct = (planTime / total) * 100;
  const execPct = (execTime / total) * 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Real-Time Latency Dashboard */}
      <div className="glass-card rounded-2xl p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/25">
              <Activity className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Postgres Query Plan</h2>
              <p className="text-xs text-slate-400">Database EXPLAIN ANALYZE feedback</p>
            </div>
          </div>
        </div>

        {metrics ? (
          <div className="space-y-6">
            {/* Latency breakdown stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-950/35 p-4 rounded-xl border border-white/5 flex flex-col">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Planning Time</span>
                <span className="text-2xl font-black text-indigo-400">{metrics.planningTimeMs.toFixed(3)}<span className="text-xs font-normal"> ms</span></span>
              </div>
              <div className="bg-slate-950/35 p-4 rounded-xl border border-white/5 flex flex-col">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Execution Time</span>
                <span className="text-2xl font-black text-emerald-400">{metrics.executionTimeMs.toFixed(3)}<span className="text-xs font-normal"> ms</span></span>
              </div>
              <div className="bg-slate-950/35 p-4 rounded-xl border border-white/5 flex flex-col">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Total Duration</span>
                <span className="text-2xl font-black text-white">{(metrics.planningTimeMs + metrics.executionTimeMs).toFixed(3)}<span className="text-xs font-normal"> ms</span></span>
              </div>
            </div>

            {/* Micro bar representing breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-400 px-1">
                <span>Planning ({planPct.toFixed(1)}%)</span>
                <span>Execution ({execPct.toFixed(1)}%)</span>
              </div>
              <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex border border-white/5">
                <div className="h-full bg-indigo-500" style={{ width: `${planPct}%` }} title="Planning"></div>
                <div className="h-full bg-emerald-500" style={{ width: `${execPct}%` }} title="Execution"></div>
              </div>
            </div>

            {/* Scans & Indexes utilized */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950/20 p-4 rounded-xl border border-white/5">
                <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-3">Index Strategy Audit</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Index Scans Used</span>
                    <span className={`font-bold ${metrics.hasIndexScan ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {metrics.hasIndexScan ? 'YES' : 'NO (Seq Scan)'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {metrics.indexesUsed.length === 0 ? (
                      <span className="text-xs text-slate-500 italic">No DB indexes hit. Sequential scan used.</span>
                    ) : (
                      metrics.indexesUsed.map((idx, i) => (
                        <span key={i} className="text-[10px] code-font font-semibold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                          {idx}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/20 p-4 rounded-xl border border-white/5">
                <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-3">Buffer Statistics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Shared Hit (Cache)</span>
                    <span className="font-semibold text-slate-200">{metrics.sharedHitBlocks} blocks</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Shared Read (Disk)</span>
                    <span className="font-semibold text-slate-200">{metrics.sharedReadBlocks} blocks</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Cache Hit Rate</span>
                    <span className="font-bold text-indigo-400">
                      {metrics.sharedHitBlocks + metrics.sharedReadBlocks > 0
                        ? `${((metrics.sharedHitBlocks / (metrics.sharedHitBlocks + metrics.sharedReadBlocks)) * 100).toFixed(1)}%`
                        : '100% (Cache)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RLS Filter overhead breakdown */}
            <div className="bg-slate-950/25 p-4 rounded-xl border border-white/5">
              <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" /> RLS Filter Conditions Evaluated
              </h3>
              {metrics.rlsFilterDetails.length === 0 ? (
                <p className="text-xs text-slate-500 italic mt-1">No RLS filters applied (Security bypassed or disabled)</p>
              ) : (
                <div className="space-y-2 mt-2 max-h-36 overflow-y-auto pr-1">
                  {metrics.rlsFilterDetails.map((f, i) => (
                    <div key={i} className="text-[10px] code-font p-2 rounded bg-slate-900/60 border border-white/5 text-slate-300 whitespace-pre-wrap leading-relaxed">
                      <span className="text-indigo-400 font-bold">[{f.nodeType}]</span> {f.filter || f.indexCondition}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-20 text-center text-slate-500 italic text-sm">
            Execute a query to retrieve PG execution plan.
          </div>
        )}
      </div>

      {/* 2. Scale Testing Panel */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/25">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Scale Testing</h2>
              <p className="text-xs text-slate-400">Validate queries on 50,000+ nodes</p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <p className="text-xs text-slate-400 leading-relaxed">
            Test and prove database efficiency at high volume. The benchmark measures how indexes mitigate RLS overhead on a large table size.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSeed(10000)}
              disabled={seeding}
              className="px-3 py-2 bg-slate-950/45 hover:bg-slate-950/75 border border-white/5 hover:border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-xl transition-all"
            >
              Seed 10k Nodes
            </button>
            <button
              onClick={() => handleSeed(50000)}
              disabled={seeding}
              className="px-3 py-2 bg-slate-950/45 hover:bg-slate-950/75 border border-white/5 hover:border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-xl transition-all"
            >
              Seed 50k Nodes
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBenchmark}
              disabled={seeding || benchmarking}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold text-sm transition-all shadow-[0_4px_20px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.4)] disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-emerald-300" />
              {benchmarking ? 'Running Benchmarks...' : 'Run Query Benchmarks'}
            </button>
            
            <button
              onClick={handleCleanup}
              disabled={seeding}
              title="Delete scaled records"
              className="p-2.5 bg-slate-900 border border-white/5 hover:border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Feedback log */}
          {seeding && (
            <div className="p-3 bg-slate-950/50 rounded-xl border border-white/5 text-xs text-indigo-400 flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Seeding/Cleaning database scale dataset...</span>
            </div>
          )}

          {seedResult && !seeding && (
            <div className="p-3 bg-slate-950/45 rounded-xl border border-white/5 text-[11px] text-slate-300 font-medium code-font leading-normal">
              {seedResult}
            </div>
          )}

          {/* Benchmark output */}
          {benchmarkData && (
            <div className="space-y-4 bg-slate-950/35 p-4 rounded-xl border border-white/5">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-400" /> Latency Report
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">{benchmarkData.totalNodesInDb.toLocaleString()} Rows in DB</span>
              </div>
              
              <div className="space-y-3 text-xs">
                {/* Benchmark 1 */}
                <div>
                  <div className="flex justify-between text-slate-300 font-medium mb-1">
                    <span>1. Point Index Search (Ortho HOD)</span>
                    <span className="text-emerald-400 font-black">{benchmarkData.results.indexScan?.executionTimeMs.toFixed(2)} ms</span>
                  </div>
                  <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${Math.min(benchmarkData.results.indexScan?.executionTimeMs * 10, 100)}%` }}></div>
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5 flex items-center gap-1">
                    <Info className="w-2.5 h-2.5 shrink-0" />
                    Used index: <span className="text-slate-400 code-font">{benchmarkData.results.indexScan?.indexesUsed.join(', ') || 'None'}</span>
                  </div>
                </div>

                {/* Benchmark 2 */}
                <div>
                  <div className="flex justify-between text-slate-300 font-medium mb-1">
                    <span>2. Compliance GIN Search (MNPI Tag)</span>
                    <span className="text-indigo-400 font-black">{benchmarkData.results.ginScan?.executionTimeMs.toFixed(2)} ms</span>
                  </div>
                  <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${Math.min(benchmarkData.results.ginScan?.executionTimeMs * 10, 100)}%` }}></div>
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5 flex items-center gap-1">
                    <Info className="w-2.5 h-2.5 shrink-0" />
                    Used GIN index: <span className="text-slate-400 code-font">{benchmarkData.results.ginScan?.indexesUsed.join(', ') || 'None'}</span>
                  </div>
                </div>

                {/* Benchmark 3 */}
                <div>
                  <div className="flex justify-between text-slate-300 font-medium mb-1">
                    <span>3. Wide Scan (All Supra Org rows)</span>
                    <span className="text-amber-400 font-black">{benchmarkData.results.wideScan?.executionTimeMs.toFixed(2)} ms</span>
                  </div>
                  <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${Math.min(benchmarkData.results.wideScan?.executionTimeMs * 10, 100)}%` }}></div>
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5 flex items-center gap-1">
                    <Info className="w-2.5 h-2.5 shrink-0" />
                    Scan Type: <span className="text-slate-400 code-font">{benchmarkData.results.wideScan?.scanTypes.join(', ')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
