import { useEffect, useState } from 'react';
import { Shield, ShieldAlert, Eye, Network, Terminal, Activity, HelpCircle } from 'lucide-react';
import { ApiClient } from './lib/supabase';
import type { UserProfile } from './lib/supabase';
import { UserSelector } from './components/UserSelector';
import { AdvancedQueryComparison } from './components/AdvancedQueryComparison';
import { PerformanceDashboard } from './components/PerformanceDashboard';
import { InteractiveNodeDisplay } from './components/InteractiveNodeDisplay';
import { RLSPolicyVisualizer } from './components/RLSPolicyVisualizer';
import { DirectDBPanel } from './components/DirectDBPanel';
import type { KnowledgeNode } from './types/knowledge-node';
import type { PolicyToggle } from './types/user';
import type { PerformanceMetrics } from './types/performance-metrics';

function App() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('priya');
  const [policyToggles, setPolicyToggles] = useState<PolicyToggle>({
    org_isolation: true,
    dept_scope: true,
    permission_ceiling: true,
    compliance_filter: true
  });

  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [allNodes, setAllNodes] = useState<KnowledgeNode[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'comparison' | 'performance' | 'terminal'>('hierarchy');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<boolean>(false);

  // 1. Initial Load: Fetch profiles and health check
  useEffect(() => {
    const initApp = async () => {
      try {
        // Ping health
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const healthRes = await fetch(`${backendUrl}/api/health`);
        if (healthRes.ok) setHealthStatus(true);

        const data = await ApiClient.fetchProfiles();
        setProfiles(data.profiles);

        // Select default profile Priya on boot
        await handleProfileSelect('priya');
      } catch (err: any) {
        console.error('Boot error:', err);
        setError('Express server connection failed. Please ensure the backend is running on port 5000.');
      }
    };
    initApp();
  }, []);

  // 2. Fetch Nodes and Metrics when Profile or Policy Toggles change
  const refreshData = async () => {
    setLoading(true);
    try {
      // Fetch permitted nodes and metrics for active user context
      const res = await ApiClient.fetchNodes();
      setNodes(res.nodes);
      setMetrics(res.metrics);

      // Fetch all nodes (under Admin Suresh's credentials to showcase security lens comparisons)
      const allRes = await ApiClient.fetchNodes('suresh');
      // Suresh can see all 25 Supra nodes.
      // Wait, we also want the 5 City Clinic nodes! Let's fetch under CC Admin to pull them as well, and merge them
      const ccRes = await ApiClient.fetchNodes('cc_admin');
      
      const mergedNodes = [...allRes.nodes, ...ccRes.nodes];
      // Filter out duplicate IDs just in case
      const uniqueNodesMap = new Map();
      mergedNodes.forEach(item => uniqueNodesMap.set(item.id, item));
      setAllNodes(Array.from(uniqueNodesMap.values()));
    } catch (err: any) {
      console.error('Fetch data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profiles.length > 0) {
      refreshData();
    }
  }, [activeProfileId, policyToggles]);

  // Handle Profile switching
  const handleProfileSelect = async (profileId: string) => {
    setLoading(true);
    try {
      setActiveProfileId(profileId);
      await ApiClient.selectProfile(profileId);
    } catch (err: any) {
      console.error('Profile change error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Policy toggle switching
  const handlePolicyToggle = (policyId: keyof PolicyToggle, enabled: boolean) => {
    const updatedToggles = { ...policyToggles, [policyId]: enabled };
    setPolicyToggles(updatedToggles);
    ApiClient.setPolicyToggles(updatedToggles);
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-glow-radial from-slate-900 via-slate-950 to-slate-950 flex flex-col antialiased">
      {/* Background Neon Glowing Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse"></div>
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>

      {/* Main Header Container */}
      <header className="border-b border-white/5 py-4 px-6 md:px-12 backdrop-blur-md sticky top-0 z-40 bg-slate-950/70">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
              <Shield className="w-6 h-6 text-indigo-400 stroke-[1.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight m-0 select-none">Brahmo RLS Guardian</h1>
                <span className="text-[9px] uppercase font-bold tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                  v1.2 Sandbox
                </span>
              </div>
              <p className="text-[10px] text-slate-400">PostgreSQL Row Level Security Simulation & Performance Audit</p>
            </div>
          </div>

          {/* Connection status badge */}
          <div className="flex items-center gap-2 bg-slate-950 border border-white/5 px-3 py-1.5 rounded-full text-xs">
            <span className={`w-2 h-2 rounded-full ${healthStatus ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`}></span>
            <span className="text-slate-400 font-medium">
              {healthStatus ? 'Local Database Engine Connected' : 'Engine Disconnected'}
            </span>
          </div>
        </div>
      </header>

      {/* Server connection error alert */}
      {error && (
        <div className="max-w-7xl mx-auto w-full px-6 mt-6">
          <div className="p-4 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-2xl flex items-center gap-3 shadow-[0_4px_20px_rgba(239,68,68,0.1)]">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="text-sm font-medium">
              {error}
              <div className="text-xs text-slate-400 mt-1 font-normal">
                Please open your terminal, navigate to `/backend` and run `npm run dev` to start the simulator server.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column - Security configuration control (4/12 size) */}
        <div className="lg:col-span-4 space-y-6">
          <UserSelector
            profiles={profiles}
            selectedProfileId={activeProfileId}
            onProfileSelect={handleProfileSelect}
            loading={loading}
          />
          <RLSPolicyVisualizer
            policyToggles={policyToggles}
            onToggleChange={handlePolicyToggle}
          />
        </div>

        {/* Right Column - Workspaces and outputs (8/12 size) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tab Selection Header */}
          <div className="flex border-b border-white/5 p-1 bg-slate-950/45 rounded-2xl border border-white/5">
            <button
              onClick={() => setActiveTab('hierarchy')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'hierarchy'
                  ? 'bg-slate-900 border border-white/5 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Network className="w-4 h-4 text-indigo-400" />
              Node Matrix
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'comparison'
                  ? 'bg-slate-900 border border-white/5 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4 text-indigo-400" />
              User Comparison
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'performance'
                  ? 'bg-slate-900 border border-white/5 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4 text-indigo-400" />
              Performance metrics
            </button>
            <button
              onClick={() => setActiveTab('terminal')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'terminal'
                  ? 'bg-slate-900 border border-white/5 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-4 h-4 text-indigo-400" />
              DB SQL Console
            </button>
          </div>

          {/* Render Active Workspace Panel */}
          {activeTab === 'hierarchy' && (
            <InteractiveNodeDisplay
              permittedNodes={nodes}
              allNodes={allNodes}
            />
          )}

          {activeTab === 'comparison' && (
            <AdvancedQueryComparison />
          )}

          {activeTab === 'performance' && (
            <PerformanceDashboard
              metrics={metrics}
              onRefreshNodes={refreshData}
            />
          )}

          {activeTab === 'terminal' && (
            <DirectDBPanel profiles={profiles} />
          )}
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="border-t border-white/5 py-4 text-center text-[10px] text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between px-6 items-center gap-2">
          <span>© 2026 Brahmo Security Lab. Developed in pair-programming with Antigravity.</span>
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5" /> Direct DB Bypass Demonstration</span>
            <span>RLS Enforced at Engine level</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
