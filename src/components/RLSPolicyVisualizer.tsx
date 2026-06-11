import React from 'react';
import { ToggleLeft, ToggleRight, Code, CheckCircle2, XCircle } from 'lucide-react';
import type { PolicyToggle } from '../types/user';

interface RlsPolicy {
  id: keyof PolicyToggle;
  name: string;
  boundary: string;
  type: string;
  description: string;
  sql: string;
}

interface RLSPolicyVisualizerProps {
  policyToggles: PolicyToggle;
  onToggleChange: (policyId: keyof PolicyToggle, enabled: boolean) => void;
}

const policies: RlsPolicy[] = [
  {
    id: 'org_isolation',
    name: 'Organization Isolation',
    boundary: 'Policy 1 (Permissive Boundary)',
    type: 'Tenant Segregation',
    description: 'Binds queries to the user\'s tenant organization: `org_id = get_current_context(\'org_id\')`. Direct access across tenants is strictly locked.',
    sql: `CREATE POLICY org_isolation ON knowledge_nodes
    AS RESTRICTIVE FOR SELECT USING (
        current_setting('app.policy_org_isolation_enabled', true) = 'false'
        OR org_id = get_current_context('org_id')
    );`
  },
  {
    id: 'dept_scope',
    name: 'Department Scoping',
    boundary: 'Policy 2 (Restrictive Boundary)',
    type: 'Role-Based Filter',
    description: 'Enforces department-level scoping. Users can view nodes matching their department, NULL department values, Zone 2 globals bypass, or if their role is ADMIN.',
    sql: `CREATE POLICY dept_scope ON knowledge_nodes
    AS RESTRICTIVE FOR SELECT USING (
        current_setting('app.policy_dept_scope_enabled', true) = 'false'
        OR department = get_current_context('department')
        OR department IS NULL
        OR zone = 2
        OR get_current_context('role') = 'ADMIN'
    );`
  },
  {
    id: 'permission_ceiling',
    name: 'Permission Ceiling',
    boundary: 'Policy 3 (Restrictive Boundary)',
    type: 'Hierarchical Ceiling',
    description: 'Restricts nodes by classification level. Users can view nodes where hierarchy_level >= user ceiling level. Bypassed for ADMIN or HOD roles.',
    sql: `CREATE POLICY permission_ceiling ON knowledge_nodes
    AS RESTRICTIVE FOR SELECT USING (
        current_setting('app.policy_permission_ceiling_enabled', true) = 'false'
        OR hierarchy_level >= get_current_context('ceiling')::int
        OR get_current_context('role') IN ('ADMIN', 'HOD')
    );`
  },
  {
    id: 'compliance_filter',
    name: 'Compliance Filtering',
    boundary: 'Policy 4 (Restrictive Boundary)',
    type: 'Compliance Tag Subset',
    description: 'Compares array tags: compliance_tags must be a subset of the user\'s clearance tags. Empty tags are visible to all. Enforces MNPI/CONFIDENTIAL exclusions.',
    sql: `CREATE POLICY compliance_filter ON knowledge_nodes
    AS RESTRICTIVE FOR SELECT USING (
        current_setting('app.policy_compliance_filter_enabled', true) = 'false'
        OR compliance_tags = '{}'
        OR compliance_tags IS NULL
        OR compliance_tags <@ string_to_array(
            COALESCE(get_current_context('clearance'), ''), ','
        )::text[]
    );`
  }
];

export const RLSPolicyVisualizer: React.FC<RLSPolicyVisualizerProps> = ({
  policyToggles,
  onToggleChange
}) => {
  return (
    <div className="glass-card rounded-2xl p-6 transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/25">
          <Code className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">RLS Security Architect</h2>
          <p className="text-xs text-slate-400">Manage and inspect live PostgreSQL policies</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Top: Flow diagram of RLS evaluation */}
        <div className="bg-slate-950/20 rounded-xl p-5 border border-white/5 flex flex-col gap-4 min-w-0">
          <h3 className="text-sm font-bold text-white tracking-wide border-b border-white/5 pb-2">
            Dynamic RLS Evaluation Flow
          </h3>
          <p className="text-xs text-slate-400">
            A query select path traverses these gates in sequence. Restrictive gates require intersections (`AND`), while permissive gates establish union entrypoints.
          </p>

          <div className="flex flex-col gap-3 relative my-auto py-2">
            {/* Step 0: Base Permissive */}
            <div className="flex items-center gap-3 bg-slate-900/40 p-3 rounded-lg border border-white/5 relative z-10">
              <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center flex-wrap gap-1.5">
                  <span className="text-xs font-bold text-white">0. Entrypoint</span>
                  <span className="text-[8px] bg-indigo-500/15 border border-indigo-500/30 px-1.5 py-0.5 rounded font-bold text-indigo-300 uppercase tracking-wider shrink-0">AS PERMISSIVE</span>
                  <span className="text-[8px] bg-indigo-500/15 border border-indigo-500/30 px-1.5 py-0.5 rounded font-bold text-indigo-300 shrink-0">OPEN</span>
                </div>
                <div className="text-[10px] text-slate-500 code-font truncate mt-1">SELECT * FROM knowledge_nodes USING (true)</div>
              </div>
            </div>

            {/* Down arrow */}
            <div className="w-0.5 h-3 bg-indigo-500/35 mx-auto"></div>

            {/* Loop through policies */}
            {policies.map((policy, idx) => {
              const enabled = policyToggles[policy.id];
              return (
                <React.Fragment key={policy.id}>
                  <div className={`flex items-center gap-3 p-3 rounded-lg border relative z-10 transition-all ${
                    enabled 
                      ? 'bg-slate-900 border-indigo-500/20' 
                      : 'bg-slate-950 border-white/5 opacity-55'
                  }`}>
                    {enabled ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-500 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span className="text-xs font-bold text-white">{idx + 1}. {policy.name}</span>
                        <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded shrink-0">AS RESTRICTIVE</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate leading-relaxed mt-1">
                        {enabled ? policy.description.split('.')[0] : 'Policy bypassed / disabled (evaluated as TRUE)'}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => onToggleChange(policy.id, !enabled)}
                      className="shrink-0 transition-colors"
                      title={enabled ? "Bypass policy" : "Activate policy"}
                    >
                      {enabled ? (
                        <ToggleRight className="w-7 h-7 text-indigo-400" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-slate-500" />
                      )}
                    </button>
                  </div>
                  {idx < policies.length - 1 && (
                    <div className="w-0.5 h-3 bg-indigo-500/35 mx-auto"></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Bottom: Policy SQL list */}
        <div className="space-y-4 min-w-0">
          {policies.map((policy) => {
            const enabled = policyToggles[policy.id];
            return (
              <div key={policy.id} className="bg-slate-950/40 border border-white/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wide">{policy.boundary}</span>
                    <h4 className="text-sm font-bold text-white mt-0.5">{policy.name}</h4>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    enabled ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                  }`}>
                    {enabled ? 'Active Boundary' : 'Bypassed'}
                  </span>
                </div>
                
                <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/20 p-2.5 rounded-lg border border-white/5">
                  {policy.description}
                </p>

                {/* SQL Code Block */}
                <div className="relative">
                  <pre className="text-[10px] code-font bg-slate-900 border border-white/5 rounded-lg p-3 text-indigo-300 overflow-x-auto select-all leading-relaxed">
                    {policy.sql}
                  </pre>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

