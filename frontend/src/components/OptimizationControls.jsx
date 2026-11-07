import React from 'react';
import { Cpu, HardDrive, Zap, Layers, Activity, SlidersHorizontal } from 'lucide-react';

export default function OptimizationControls({ config, setConfig, disabled }) {
  const architectures = [
    {
      id: 'mobile',
      name: 'MobileDiffusion UNet',
      params: '142M',
      desc: 'Pruned depthwise-separable convs, inverted residuals',
      optimal: true
    },
    {
      id: 'baseline',
      name: 'Baseline Heavy UNet',
      params: '860M',
      desc: 'Standard uncompressed cross-attention diffusion architecture',
      optimal: false
    }
  ];

  const precisions = [
    { id: 'INT8', label: 'INT8 Quantized', badge: '4.0x Memory Drop', size: '142 MB', ram: '~160 MB' },
    { id: 'FP16', label: 'FP16 Half-Prec', badge: '2.0x Memory Drop', size: '284 MB', ram: '~320 MB' },
    { id: 'FP32', label: 'FP32 Baseline', badge: 'Uncompressed', size: '3.44 GB', ram: '~2.85 GB' },
  ];

  const latentSizes = [
    { value: 32, label: '32x32 Compact Latent', desc: '75% memory drop + Edge Super-Res' },
    { value: 64, label: '64x64 Standard Latent', desc: 'Native latent grid' },
  ];

  return (
    <div className="glass-panel rounded-2xl p-5 mb-6 shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-dark-800">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-accent-cyan" />
          <h3 className="text-base font-semibold text-slate-100">
            Model Optimization & Pipeline Configuration
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Category B & C Compliant
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Architecture Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-brand-400" />
            Lightweight Architecture
          </label>
          <div className="space-y-2">
            {architectures.map((arch) => (
              <button
                key={arch.id}
                disabled={disabled}
                onClick={() => setConfig(prev => ({ ...prev, model_type: arch.id }))}
                className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs ${
                  config.model_type === arch.id
                    ? 'bg-brand-500/15 border-brand-500/40 text-slate-100 shadow-sm'
                    : 'bg-dark-900 border-dark-700 text-slate-400 hover:text-slate-200 hover:bg-dark-850'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>{arch.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    arch.optimal ? 'bg-accent-emerald/20 text-accent-emerald' : 'bg-dark-800 text-slate-400'
                  }`}>
                    {arch.params}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                  {arch.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Quantization / Precision */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-accent-emerald" />
            Quantization & Precision
          </label>
          <div className="space-y-2">
            {precisions.map((p) => (
              <button
                key={p.id}
                disabled={disabled}
                onClick={() => setConfig(prev => ({ ...prev, precision: p.id }))}
                className={`w-full text-left p-2 rounded-xl border transition-all text-xs ${
                  config.precision === p.id
                    ? 'bg-accent-emerald/15 border-accent-emerald/40 text-slate-100 shadow-sm'
                    : 'bg-dark-900 border-dark-700 text-slate-400 hover:text-slate-200 hover:bg-dark-850'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>{p.label}</span>
                  <span className="text-[10px] text-accent-emerald font-mono">
                    {p.badge}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-0.5 font-mono">
                  <span>Size: {p.size}</span>
                  <span>RAM: {p.ram}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Reduced Diffusion Sampling Steps */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-accent-amber" />
              Diffusion Sampling Steps
            </label>
            <span className="text-xs font-bold text-accent-amber font-mono bg-accent-amber/10 px-2 py-0.5 rounded border border-accent-amber/20">
              {config.steps} Steps (LCM)
            </span>
          </div>

          <div className="p-3 bg-dark-900 rounded-xl border border-dark-700">
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              disabled={disabled}
              value={config.steps}
              onChange={(e) => setConfig(prev => ({ ...prev, steps: parseInt(e.target.value) || 4 }))}
              className="w-full mb-3"
            />

            <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-mono">
              <button
                disabled={disabled}
                onClick={() => setConfig(prev => ({ ...prev, steps: 1 }))}
                className={`p-1 rounded ${config.steps === 1 ? 'bg-accent-cyan/20 text-accent-cyan font-bold' : 'bg-dark-800 text-slate-400'}`}
              >
                1 Step
              </button>
              <button
                disabled={disabled}
                onClick={() => setConfig(prev => ({ ...prev, steps: 2 }))}
                className={`p-1 rounded ${config.steps === 2 ? 'bg-accent-cyan/20 text-accent-cyan font-bold' : 'bg-dark-800 text-slate-400'}`}
              >
                2 Steps
              </button>
              <button
                disabled={disabled}
                onClick={() => setConfig(prev => ({ ...prev, steps: 4 }))}
                className={`p-1 rounded ${config.steps === 4 ? 'bg-accent-emerald/20 text-accent-emerald font-bold' : 'bg-dark-800 text-slate-400'}`}
              >
                4 Steps ★
              </button>
              <button
                disabled={disabled}
                onClick={() => setConfig(prev => ({ ...prev, steps: 8 }))}
                className={`p-1 rounded ${config.steps === 8 ? 'bg-brand-500/20 text-brand-400 font-bold' : 'bg-dark-800 text-slate-400'}`}
              >
                8 Steps
              </button>
            </div>
            <div className="text-[10px] text-slate-400 mt-2 text-center">
              LCM Scheduler achieves convergence in 2-4 steps vs 50 baseline steps.
            </div>
          </div>
        </div>

        {/* 4. Latent Space Optimization */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-accent-purple" />
            Latent-Space Resolution
          </label>
          <div className="space-y-2">
            {latentSizes.map((ls) => (
              <button
                key={ls.value}
                disabled={disabled}
                onClick={() => setConfig(prev => ({ ...prev, latent_size: ls.value }))}
                className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs ${
                  config.latent_size === ls.value
                    ? 'bg-accent-purple/15 border-accent-purple/40 text-slate-100 shadow-sm'
                    : 'bg-dark-900 border-dark-700 text-slate-400 hover:text-slate-200 hover:bg-dark-850'
                }`}
              >
                <div className="font-semibold">{ls.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {ls.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
