import React, { useState } from 'react';
import { Terminal, Play, AlertCircle, RefreshCw, Table } from 'lucide-react';
import { ApiClient } from '../lib/supabase';
import type { UserProfile } from '../lib/supabase';

interface DirectDBPanelProps {
  profiles: UserProfile[];
}

export const DirectDBPanel: React.FC<DirectDBPanelProps> = ({ profiles }) => {
  const [selectedUser, setSelectedUser] = useState('priya');
  const [query, setQuery] = useState('SELECT id, title, department, hierarchy_level, zone, compliance_tags FROM knowledge_nodes;');
  const [executing, setExecuting] = useState(false);
  const [resultData, setResultData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sampleQueries = [
    {
      name: 'Query All Nodes',
      sql: 'SELECT id, title, department, hierarchy_level, zone, compliance_tags FROM knowledge_nodes;'
    },
    {
      name: 'Zone 2 Globals',
      sql: "SELECT id, title, department, zone FROM knowledge_nodes WHERE zone = 2;"
    },
    {
      name: 'EXPLAIN Plan',
      sql: 'EXPLAIN ANALYZE SELECT * FROM knowledge_nodes;'
    }
  ];

  const handleExecute = async () => {
    setExecuting(true);
    setErrorMsg(null);
    setResultData(null);
    try {
      // Execute the query under the selected user context profile override
      const data = await ApiClient.runCustomQuery(query, selectedUser);
      setResultData(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to execute query');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 transition-all duration-300">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/25">
            <Terminal className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Direct Database Terminal</h2>
            <p className="text-xs text-slate-400">Run SQL direct to PostgreSQL bypass application layer</p>
          </div>
        </div>

        {/* Selected SQL Principal context */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Execute As:</span>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="glass-input px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer"
          >
            {profiles.map(p => (
              <option key={p.id} value={p.id} className="bg-slate-900">
                {p.name} ({p.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {/* Quick Sample Queries */}
        <div className="flex flex-wrap gap-2">
          {sampleQueries.map((q, i) => (
            <button
              key={i}
              onClick={() => setQuery(q.sql)}
              className="text-[10px] bg-slate-950/45 hover:bg-slate-950 border border-white/5 hover:border-indigo-500/30 text-indigo-300 font-semibold px-2.5 py-1 rounded-lg transition-all"
            >
              {q.name}
            </button>
          ))}
        </div>

        {/* Editor Area */}
        <div className="relative border border-white/5 rounded-xl overflow-hidden shadow-[inset_0_4px_12px_rgba(0,0,0,0.5)]">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={4}
            className="w-full bg-[#03060d]/85 text-indigo-300 code-font p-4 text-xs focus:outline-none leading-relaxed resize-none"
          />
          <button
            onClick={handleExecute}
            disabled={executing || !query.trim()}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs transition-all disabled:opacity-50"
          >
            {executing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            Run
          </button>
        </div>

        {/* Error reporting */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Results Viewer */}
        {resultData && (
          <div className="space-y-3 bg-[#03060d]/45 p-4 rounded-xl border border-white/5">
            {/* Summary details */}
            <div className="flex justify-between items-center text-[10px] text-slate-500 border-b border-white/5 pb-2">
              <span className="font-bold flex items-center gap-1">
                <Table className="w-3.5 h-3.5 text-indigo-400" /> Results Set ({resultData.count} rows)
              </span>
              <span>Executed in {resultData.metrics?.executionTimeMs?.toFixed(2) || '0'} ms</span>
            </div>

            {/* If query was EXPLAIN ANALYZE */}
            {query.trim().toLowerCase().startsWith('explain') && Array.isArray(resultData.results) ? (
              <div className="text-[10px] code-font max-h-52 overflow-y-auto space-y-1 text-emerald-400 leading-normal pr-1">
                {resultData.results.map((line: any, idx: number) => (
                  <div key={idx} className="whitespace-pre">{Object.values(line)[0] as string}</div>
                ))}
              </div>
            ) : (
              /* If normal SELECT query */
              <div className="overflow-x-auto max-h-56 pr-1">
                {resultData.results && resultData.results.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-4">Query returned zero rows.</p>
                ) : (
                  <table className="w-full text-[10px] text-left border-collapse code-font text-slate-300">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-500 font-bold uppercase tracking-wider">
                        {resultData.results && resultData.results[0] && Object.keys(resultData.results[0]).map(key => (
                          <th key={key} className="pb-1.5 px-2 font-black">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resultData.results && resultData.results.map((row: any, idx: number) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] last:border-0 transition-colors">
                          {Object.entries(row).map(([key, val]: any) => (
                            <td key={key} className="py-2 px-2 max-w-xs truncate">
                              {Array.isArray(val)
                                ? `[${val.join(', ')}]`
                                : typeof val === 'object' && val !== null
                                ? JSON.stringify(val)
                                : String(val === null ? 'NULL' : val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
