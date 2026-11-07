import React from 'react';
import { Cpu, Zap, Smartphone, Sliders, Layers, BarChart2, ShieldCheck } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, deviceProfile }) {
  const tabs = [
    { id: 'studio', label: 'Studio & Generation', icon: Zap },
    { id: 'comparison', label: 'Comparison Slider', icon: Layers },
    { id: 'adaptive', label: 'Adaptive Budget & Throttling', icon: Sliders },
    { id: 'benchmark', label: 'Quantitative Benchmarks', icon: BarChart2 },
    { id: 'simulator', label: 'Mobile Device Simulator', icon: Smartphone },
  ];

  return (
    <header className="border-b border-dark-700/60 bg-dark-900/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Problem Statement ID */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-accent-cyan to-brand-400 p-0.5 shadow-glow flex items-center justify-center">
              <div className="w-full h-full bg-dark-950 rounded-[10px] flex items-center justify-center">
                <Cpu className="w-5 h-5 text-brand-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  MobileDiff-Edge
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  ProbID - P3
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Resource-Efficient Text-to-Image Generation for Mobile Devices
              </p>
            </div>
          </div>

          {/* Target NPU / Mobile Hardware Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg glass-panel-subtle text-xs text-slate-300">
            <div className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse"></div>
            <span className="text-slate-400">Target NPU:</span>
            <span className="font-medium text-brand-400">Snapdragon 8 Gen 3 (45 TOPS)</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">Model:</span>
            <span className="font-semibold text-accent-cyan">INT8 MobileUNet (142M)</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 sm:space-x-2 border-t border-dark-800 pt-2 pb-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-150 whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
