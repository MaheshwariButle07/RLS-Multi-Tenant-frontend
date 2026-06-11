import React, { useState } from 'react';
import { Network, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import type { KnowledgeNode } from '../types/knowledge-node';

interface InteractiveNodeDisplayProps {
  permittedNodes: KnowledgeNode[];
  allNodes: KnowledgeNode[]; // Full list of 30 seed nodes for the "Security Lens" mode
}

export const InteractiveNodeDisplay: React.FC<InteractiveNodeDisplayProps> = ({
  permittedNodes,
  allNodes
}) => {
  const [showExcluded, setShowExcluded] = useState(true);

  // Helper to check if a node is permitted
  const permittedIds = new Set(permittedNodes.map(n => n.id));

  // Separate nodes by organization
  const renderOrgSection = (orgId: 'supra' | 'city_clinic', title: string, themeColor: string) => {
    // Filter nodes for this org
    const orgNodes = allNodes.filter(n => n.org_id === orgId);
    
    // Group by department
    const departments: Record<string, KnowledgeNode[]> = {
      'ortho': [],
      'medicine': [],
      'cardio': [],
      'general': [] // Null department
    };

    orgNodes.forEach(node => {
      const dept = node.department || 'general';
      if (departments[dept]) {
        departments[dept].push(node);
      } else {
        departments[dept] = [node];
      }
    });

    return (
      <div className="glass-card rounded-xl p-5 border border-white/5 bg-slate-950/10 flex-1 flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
          <div className={`w-2.5 h-2.5 rounded-full ${themeColor === 'indigo' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'}`}></div>
          <h3 className="font-bold text-white text-base tracking-tight">{title}</h3>
        </div>

        <div className="space-y-4 flex-1">
          {Object.entries(departments).map(([deptName, deptNodes]) => {
            // If we are hiding excluded nodes, filter them out
            const visibleNodes = showExcluded 
              ? deptNodes 
              : deptNodes.filter(n => permittedIds.has(n.id));

            if (visibleNodes.length === 0) return null;

            return (
              <div key={deptName} className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider capitalize px-1">
                  {deptName === 'general' ? 'General / Shared' : `${deptName} Department`}
                </span>
                
                <div className="grid grid-cols-1 gap-2.5">
                  {visibleNodes.map(node => {
                    const isPermitted = permittedIds.has(node.id);
                    
                    return (
                      <div
                        key={node.id}
                        className={`p-3.5 rounded-xl transition-all duration-300 border ${
                          isPermitted
                            ? 'bg-slate-900/60 border-white/5 hover:border-indigo-500/20'
                            : 'bg-slate-950/80 border-rose-500/10 opacity-35 select-none'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {isPermitted ? (
                              <CheckCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            )}
                            <h4 className={`font-semibold text-xs truncate ${isPermitted ? 'text-slate-100' : 'text-slate-500 line-through'}`}>
                              {node.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Type badge */}
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                              node.type === 'CONSTRAINT' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/15' :
                              node.type === 'DECISION' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' :
                              'bg-indigo-500/10 text-indigo-400 border border-indigo-500/15'
                            }`}>
                              {node.type}
                            </span>
                            
                            {/* Level badge */}
                            <span className="text-[8px] font-bold bg-white/5 border border-white/10 px-1 rounded text-slate-400">
                              L{node.hierarchy_level}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <p className={`text-[11px] leading-relaxed mb-2.5 ${isPermitted ? 'text-slate-400' : 'text-slate-600 blur-[2px]'}`}>
                          {isPermitted ? node.content : 'CLASSIFIED INFORMATION DIRECTIVE ENFORCED BY ROW LEVEL SECURITY POLICY BOUNDARY'}
                        </p>

                        {/* Node Footer */}
                        <div className="flex items-center justify-between flex-wrap gap-2 text-[9px]">
                          <div className="flex items-center gap-1.5">
                            {node.zone === 2 && (
                              <span className="bg-indigo-500/10 text-indigo-300 font-semibold px-1.5 py-0.5 rounded border border-indigo-500/10">
                                Zone 2 (Global)
                              </span>
                            )}
                          </div>

                          {/* Compliance Tags */}
                          {node.compliance_tags && node.compliance_tags.length > 0 && (
                            <div className="flex gap-1">
                              {node.compliance_tags.map(tag => (
                                <span key={tag} className={`px-1 rounded border text-[8px] font-bold ${
                                  tag === 'MNPI' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                                }`}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card rounded-2xl p-6 transition-all duration-300">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/25">
            <Network className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Knowledge Node Matrix</h2>
            <p className="text-xs text-slate-400">Hierarchical visual map of data security boundaries</p>
          </div>
        </div>

        {/* Security lens toggle */}
        <button
          onClick={() => setShowExcluded(!showExcluded)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            showExcluded 
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
              : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
          }`}
        >
          {showExcluded ? (
            <>
              <Eye className="w-4 h-4 text-indigo-400" />
              Security Lens: Active (Showing Excluded Nodes)
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4" />
              Standard View (Silent Exclusions Hidden)
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {renderOrgSection('supra', 'Supra Healthcare Tenant (25 Seed Nodes)', 'indigo')}
        {renderOrgSection('city_clinic', 'City Clinic Tenant (5 Seed Nodes)', 'emerald')}
      </div>
    </div>
  );
};
