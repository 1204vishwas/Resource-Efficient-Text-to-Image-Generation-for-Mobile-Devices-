import React from 'react';
import { Eye, CheckCircle2, Shield, Sliders, RefreshCw, Sparkles, Filter } from 'lucide-react';

export default function ClassicalCVPipeline({
  cvOptions,
  setCvOptions,
  onReapplyCV,
  isFiltering,
  artifactsDetected,
  hasImage
}) {
  const toggle = (key) => {
    setCvOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const setSuperRes = (method) => {
    setCvOptions(prev => ({ ...prev, super_res_method: method }));
  };

  return (
    <div className="glass-panel rounded-2xl p-5 mb-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-dark-800">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-accent-emerald" />
          <h3 className="text-base font-semibold text-slate-100">
            Classical Computer Vision Post-Processing Deck
          </h3>
          <span className="text-xs px-2 py-0.5 rounded bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20">
            Category A Compliant
          </span>
        </div>

        {hasImage && (
          <button
            onClick={onReapplyCV}
            disabled={isFiltering}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-200 border border-dark-700 hover:border-accent-emerald text-xs font-semibold transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFiltering ? 'animate-spin text-accent-emerald' : ''}`} />
            <span>Re-filter Live Image</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Resizing & Super-Resolution */}
        <div className="p-3.5 bg-dark-900 rounded-xl border border-dark-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200">1. Resolution Optimization</span>
            <span className="text-[10px] text-accent-cyan font-mono">Edge-Preserving</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-2.5">
            Scales 32x32 mobile latents to 512x512 using edge-directed gradient reinforcement.
          </p>
          <div className="grid grid-cols-3 gap-1 text-[11px] font-mono">
            {['edge_preserving', 'lanczos', 'bicubic'].map((m) => (
              <button
                key={m}
                onClick={() => setSuperRes(m)}
                className={`py-1 px-1.5 rounded text-center transition-all ${
                  cvOptions.super_res_method === m
                    ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40 font-bold'
                    : 'bg-dark-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'edge_preserving' ? 'Edge-SuperRes' : (m === 'lanczos' ? 'Lanczos-4' : 'Bicubic')}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Color Correction & CLAHE */}
        <div className="p-3.5 bg-dark-900 rounded-xl border border-dark-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200">2. Color & Dynamic Range</span>
            <span className="text-[10px] text-accent-emerald font-mono">CIELAB + AWB</span>
          </div>
          <div className="space-y-2">
            <label className="flex items-center justify-between cursor-pointer text-xs text-slate-300">
              <span>Gray-World Auto White Balance</span>
              <input
                type="checkbox"
                checked={cvOptions.enable_wb}
                onChange={() => toggle('enable_wb')}
                className="w-4 h-4 rounded text-accent-emerald focus:ring-accent-emerald"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer text-xs text-slate-300">
              <span>CLAHE (L* Channel Lightness)</span>
              <input
                type="checkbox"
                checked={cvOptions.enable_clahe}
                onChange={() => toggle('enable_clahe')}
                className="w-4 h-4 rounded text-accent-emerald focus:ring-accent-emerald"
              />
            </label>
          </div>
        </div>

        {/* 3. Edge-Aware Post-Processing */}
        <div className="p-3.5 bg-dark-900 rounded-xl border border-dark-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200">3. Edge-Aware Filtering</span>
            <span className="text-[10px] text-accent-purple font-mono">Bilateral + Halo-Free</span>
          </div>
          <div className="space-y-2">
            <label className="flex items-center justify-between cursor-pointer text-xs text-slate-300">
              <span>Bilateral Smoothing (Noise Filter)</span>
              <input
                type="checkbox"
                checked={cvOptions.enable_bilateral}
                onChange={() => toggle('enable_bilateral')}
                className="w-4 h-4 rounded text-accent-purple focus:ring-accent-purple"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer text-xs text-slate-300">
              <span>Edge-Preserving Unsharp Mask</span>
              <input
                type="checkbox"
                checked={cvOptions.enable_unsharp}
                onChange={() => toggle('enable_unsharp')}
                className="w-4 h-4 rounded text-accent-purple focus:ring-accent-purple"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Artifact Detection & Telemetry Bar */}
      <div className="mt-4 p-3 bg-dark-900/70 rounded-xl border border-dark-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-200">
            <input
              type="checkbox"
              checked={cvOptions.enable_artifacts}
              onChange={() => toggle('enable_artifacts')}
              className="w-4 h-4 rounded text-accent-amber focus:ring-accent-amber"
            />
            <span>Enable Artifact Detection & Selective Denoising</span>
          </label>
        </div>

        {artifactsDetected && (
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <div>
              <span>DoG Noise Variance: </span>
              <span className="text-slate-200 font-bold">{artifactsDetected.high_frequency_noise_variance ?? 'N/A'}</span>
            </div>
            <div>
              <span>Blockiness Ratio: </span>
              <span className="text-slate-200 font-bold">{artifactsDetected.blockiness_index ?? 'N/A'}</span>
            </div>
            <div>
              <span>Artifact Severity: </span>
              <span className={`font-bold uppercase ${
                artifactsDetected.artifact_severity === 'low' ? 'text-accent-emerald' : 'text-accent-amber'
              }`}>
                {artifactsDetected.artifact_severity ?? 'Normal'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
