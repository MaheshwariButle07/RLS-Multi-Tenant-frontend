import React from 'react';
import { User, Shield, Folder, Award, Key } from 'lucide-react';
import type { UserProfile } from '../lib/supabase';

interface UserSelectorProps {
  profiles: UserProfile[];
  selectedProfileId: string;
  onProfileSelect: (profileId: string) => void;
  loading: boolean;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  profiles,
  selectedProfileId,
  onProfileSelect,
  loading
}) => {
  const activeProfile = profiles.find(p => p.id === selectedProfileId);

  return (
    <div className="glass-card rounded-2xl p-6 glow-active transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/25">
            <User className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Security Principal</h2>
            <p className="text-xs text-slate-400">Select active JWT identity</p>
          </div>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-xs text-indigo-400">
            <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Switching...</span>
          </div>
        )}
      </div>

      {/* Select Dropdown */}
      <div className="relative mb-6">
        <select
          value={selectedProfileId}
          onChange={(e) => onProfileSelect(e.target.value)}
          disabled={loading}
          className="w-full glass-input px-4 py-3 rounded-xl appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500/50 pr-10 font-medium text-white text-sm"
        >
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id} className="bg-slate-900 text-white">
              {profile.name} — {profile.role} ({profile.org_id === 'supra' ? 'Supra Health' : 'City Clinic'})
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Profile Details Panel */}
      {activeProfile && (
        <div className="space-y-4 text-sm">
          <div className="text-slate-300 text-xs italic bg-slate-950/45 p-3 rounded-xl border border-white/5 leading-relaxed">
            "{activeProfile.description}"
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Org Card */}
            <div className="p-3 bg-slate-950/20 rounded-xl border border-white/5 flex flex-col gap-1">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                <Shield className="w-3 h-3 text-indigo-400" /> Organization
              </span>
              <span className={`font-semibold ${activeProfile.org_id === 'supra' ? 'text-indigo-300' : 'text-emerald-300'}`}>
                {activeProfile.org_id === 'supra' ? 'Supra Healthcare' : 'City Clinic'}
              </span>
            </div>

            {/* Department Card */}
            <div className="p-3 bg-slate-950/20 rounded-xl border border-white/5 flex flex-col gap-1">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                <Folder className="w-3 h-3 text-indigo-400" /> Department
              </span>
              <span className="font-semibold text-slate-200 capitalize">
                {activeProfile.department}
              </span>
            </div>

            {/* Ceiling Card */}
            <div className="p-3 bg-slate-950/20 rounded-xl border border-white/5 flex flex-col gap-1">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                <Award className="w-3 h-3 text-indigo-400" /> Ceiling Level
              </span>
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                Level {activeProfile.ceiling_level}
                <span className="text-[10px] text-slate-400">
                  {activeProfile.ceiling_level === 1 ? '(Root Admin)' : activeProfile.ceiling_level <= 4 ? '(HOD Access)' : '(Staff)'}
                </span>
              </span>
            </div>

            {/* Role Card */}
            <div className="p-3 bg-slate-950/20 rounded-xl border border-white/5 flex flex-col gap-1">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                <User className="w-3 h-3 text-indigo-400" /> Security Role
              </span>
              <span className={`font-semibold ${
                activeProfile.role === 'ADMIN' ? 'text-rose-400' : 
                activeProfile.role === 'HOD' ? 'text-amber-400' : 
                activeProfile.role === 'EDITOR' ? 'text-sky-400' : 'text-slate-400'
              }`}>
                {activeProfile.role}
              </span>
            </div>
          </div>

          {/* Compliance Clearance */}
          <div className="p-3 bg-slate-950/20 rounded-xl border border-white/5">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 mb-2">
              <Key className="w-3 h-3 text-indigo-400" /> Compliance Clearance
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeProfile.compliance_clearance.length === 0 ? (
                <span className="text-xs text-slate-500 italic">No special clearance (Public/Internal only)</span>
              ) : (
                activeProfile.compliance_clearance.map(tag => (
                  <span
                    key={tag}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      tag === 'MNPI' 
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-300 shadow-[0_0_10px_rgba(239,68,68,0.1)]' 
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                    }`}
                  >
                    {tag}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
