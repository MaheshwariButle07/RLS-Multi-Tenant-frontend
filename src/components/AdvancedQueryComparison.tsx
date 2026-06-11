import React, { useState } from 'react';
import { Play, Shield, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';
import { ApiClient } from '../lib/supabase';

interface ComparisonResult {
  userId: string;
  name: string;
  role: string;
  org: string;
  count: number;
  executionTime: number;
  nodes: {
    id: string;
    title: string;
    org_id: string;
    department: string | null;
    type: string;
    hierarchy_level: number;
    compliance_tags: string[];
    content: string;
  }[];
}

export const AdvancedQueryComparison: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ComparisonResult[] | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const runComparison = async () => {
    setLoading(true);
    try {
      const usersToCompare = [
        { id: 'priya', name: 'Priya', role: 'VIEWER', org: 'supra' },
        { id: 'vikram', name: 'Vikram', role: 'HOD', org: 'supra' },
        { id: 'suresh', name: 'Suresh', role: 'ADMIN', org: 'supra' },
        { id: 'ananya', name: 'Ananya', role: 'EDITOR', org: 'supra' },
        { id: 'cc_dr', name: 'CC Dr.', role: 'EDITOR', org: 'city_clinic' },
        { id: 'cc_admin', name: 'CC Admin', role: 'ADMIN', org: 'city_clinic' },
        // { id:"ravi", name: "Ravi", role: 'VIEWER', org: 'supra' }
      ];

      // Run parallel fetches for each user context
      const fetches = usersToCompare.map(async (user) => {
        const data = await ApiClient.fetchNodes(user.id);
        return {
          userId: user.id,
          name: user.name,
          role: user.role,
          org: user.org,
          count: data.count,
          executionTime: data.metrics?.executionTimeMs || 0,
          nodes: data.nodes.map((n: any) => ({
            id: n.id,
            title: n.title,
            org_id: n.org_id,
            department: n.department,
            type: n.type,
            hierarchy_level: n.hierarchy_level,
            compliance_tags: n.compliance_tags || [],
            content: n.content
          }))
        };
      });

      const comparisonData = await Promise.all(fetches);
      setResults(comparisonData);
      if (comparisonData.length > 0) {
        setSelectedUser(comparisonData[0].userId);
      }
    } catch (err) {
      console.error('Error running comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeResult = results?.find(r => r.userId === selectedUser);

  return (
    <div className="glass-card rounded-2xl p-6 transition-all duration-300">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            Same Query, Five Users
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Demonstrates row-level security silent exclusions (No access denied errors)
          </p>
        </div>
        <button
          onClick={runComparison}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-brand-600 hover:from-indigo-500 hover:to-brand-500 text-white rounded-xl font-medium text-sm transition-all shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_25px_rgba(99,102,241,0.4)] disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
          {results ? 'Re-Run Comparison' : 'Run Comparison Query'}
        </button>
      </div>

      {!results && !loading ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/10 rounded-xl bg-slate-950/10 text-slate-400">
          <Shield className="w-12 h-12 stroke-[1] text-indigo-400/50 mb-3" />
          <p className="text-sm">Click "Run Comparison Query" to execute `SELECT * FROM knowledge_nodes` across identities</p>
        </div>
      ) : loading && !results ? (
        <div className="flex flex-col items-center justify-center py-16 text-indigo-400 gap-3">
          <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Querying database concurrently...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* User Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {results?.map((res) => {
              const orgColor = res.org === 'supra' ? 'border-indigo-500/20 text-indigo-400' : 'border-emerald-500/20 text-emerald-400';
              const countPercent = Math.min((res.count / 25) * 100, 100);
              const isSelected = selectedUser === res.userId;

              return (
                <button
                  key={res.userId}
                  onClick={() => setSelectedUser(res.userId)}
                  className={`flex flex-col text-left glass-card rounded-xl p-4 border transition-all duration-300 relative overflow-hidden bg-slate-950/15 ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/25 bg-slate-900/60 shadow-[0_4px_25px_rgba(99,102,241,0.2)]'
                      : 'border-white/5 hover:border-white/10 hover:bg-slate-950/30'
                  }`}
                >
                  {/* User Info Header */}
                  <div className="mb-4 w-full">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-sm truncate">{res.name}</h3>
                      <span className="text-[9px] uppercase font-bold text-slate-400 shrink-0">{res.role}</span>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border bg-white/5 inline-block mt-1 font-semibold ${orgColor}`}>
                      {res.org === 'supra' ? 'Supra Health' : 'City Clinic'}
                    </span>
                  </div>

                  {/* Result Indicator */}
                  <div className="mb-4 bg-slate-950/45 p-2 rounded-lg border border-white/5 flex items-center justify-between w-full">
                    <div>
                      <div className="text-xl font-black text-white">{res.count.toLocaleString()}</div>
                      <div className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Nodes</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-semibold text-slate-300">{res.executionTime.toFixed(2)} ms</div>
                      <div className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Latency</div>
                    </div>
                  </div>

                  {/* Bar Visualizer */}
                  <div className="h-1 w-full bg-slate-950/45 rounded-full overflow-hidden mb-1 border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                        res.org === 'supra' ? 'from-indigo-600 to-indigo-400' : 'from-emerald-600 to-emerald-400'
                      }`}
                      style={{ width: `${countPercent}%` }}
                    ></div>
                  </div>
                  
                  {isSelected && (
                    <div className="absolute bottom-1 right-2 text-[8px] text-indigo-400 font-bold uppercase tracking-wider">
                      Selected
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Details Pane for selected user context */}
          {activeResult && (
            <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-5 space-y-4 transition-all duration-300">
              <div className="flex justify-between items-center border-b border-white/5 pb-3 flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-white text-sm tracking-wide">
                    PERMITTED RECORDS Explorer: {activeResult.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Viewing records returned under JWT claims: {activeResult.role} at {activeResult.org === 'supra' ? 'Supra Health' : 'City Clinic'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
                    Showing {Math.min(activeResult.nodes.length, 50)} of {activeResult.nodes.length} visible rows
                  </span>
                </div>
              </div>

              {activeResult.nodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 italic">
                  No records returned under this security context. (Silent Exclusion Active)
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                  {activeResult.nodes.slice(0, 50).map((node) => (
                    <div
                      key={node.id}
                      className="p-3.5 bg-[#03060d]/45 border border-white/5 rounded-xl space-y-2 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span className="code-font text-[10px] text-indigo-300 font-bold bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded shrink-0">
                            {node.id.replace('supra_', '').replace('cc_', '')}
                          </span>
                          <h4 className="text-xs font-bold text-white leading-tight">{node.title}</h4>
                        </div>
                        
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {node.department && (
                            <span className="text-[8px] uppercase font-bold text-slate-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded capitalize">
                              {node.department}
                            </span>
                          )}
                          <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            node.type === 'CONSTRAINT' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/15' :
                            node.type === 'DECISION' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' :
                            'bg-indigo-500/10 text-indigo-400 border border-indigo-500/15'
                          }`}>
                            {node.type}
                          </span>
                          <span className="text-[8px] font-bold bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-slate-400">
                            L{node.hierarchy_level}
                          </span>
                          {node.compliance_tags && node.compliance_tags.map((tag) => (
                            <span key={tag} className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                              tag === 'MNPI' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                            }`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/10 p-2.5 rounded-lg border border-white/5/50">
                        {node.content}
                      </p>
                    </div>
                  ))}
                  {activeResult.nodes.length > 50 && (
                    <p className="text-[10px] text-slate-500 text-center italic mt-2">
                      Truncated for demonstration performance (Total {activeResult.nodes.length} nodes)
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
