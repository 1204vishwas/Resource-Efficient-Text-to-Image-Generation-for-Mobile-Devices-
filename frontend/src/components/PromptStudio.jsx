import React, { useState, useEffect } from 'react';
import { Sparkles, Compass, Tag, RefreshCw, Wand2, ShieldAlert } from 'lucide-react';

export default function PromptStudio({
  prompt,
  setPrompt,
  onGenerate,
  isGenerating,
  promptAnalysis,
  presets = []
}) {
  const [seed, setSeed] = useState(42);
  const [cfgScale, setCfgScale] = useState(7.5);

  const randomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000));
  };

  const handlePresetSelect = (presetPrompt) => {
    setPrompt(presetPrompt);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 mb-6 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-brand-400" />
          <h2 className="text-base font-semibold text-slate-100">
            Natural-Language Prompt Studio
          </h2>
          <span className="text-xs px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
            Semantic Cross-Attention
          </span>
        </div>

        {promptAnalysis && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Prompt Complexity:</span>
            <span className={`px-2 py-0.5 rounded-full font-semibold ${
              promptAnalysis.complexity_level === 'High'
                ? 'bg-accent-rose/20 text-accent-rose border border-accent-rose/30'
                : promptAnalysis.complexity_level === 'Medium'
                ? 'bg-accent-amber/20 text-accent-amber border border-accent-amber/30'
                : 'bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/30'
            }`}>
              {promptAnalysis.complexity_level} ({promptAnalysis.complexity_score}/100)
            </span>
          </div>
        )}
      </div>

      {/* Main Prompt Textarea */}
      <div className="relative mb-3">
        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe a scene with multiple objects, colors, styles, and spatial relations (e.g. 'A red vintage sports car parked to the left of a blue skyscraper under a golden sunset')..."
          className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-none shadow-inner"
        />
      </div>

      {/* Real-time Semantic Decomposition Tags */}
      {promptAnalysis && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-dark-900/60 rounded-xl border border-dark-800 text-xs">
          {promptAnalysis.entities?.length > 0 && (
            <div className="flex items-center gap-1.5 mr-2">
              <Tag className="w-3.5 h-3.5 text-accent-cyan" />
              <span className="text-slate-400">Entities:</span>
              {promptAnalysis.entities.map((ent, idx) => (
                <span key={idx} className="bg-dark-800 text-accent-cyan px-2 py-0.5 rounded border border-accent-cyan/20">
                  {ent}
                </span>
              ))}
            </div>
          )}

          {promptAnalysis.spatial_relationships?.length > 0 && (
            <div className="flex items-center gap-1.5 mr-2">
              <Compass className="w-3.5 h-3.5 text-accent-amber" />
              <span className="text-slate-400">Spatial Relations:</span>
              {promptAnalysis.spatial_relationships.map((sp, idx) => (
                <span key={idx} className="bg-dark-800 text-accent-amber px-2 py-0.5 rounded border border-accent-amber/20 font-medium">
                  {sp}
                </span>
              ))}
            </div>
          )}

          {promptAnalysis.colors?.length > 0 && (
            <div className="flex items-center gap-1.5 mr-2">
              <span className="text-slate-400">Colors:</span>
              {promptAnalysis.colors.map((c, idx) => (
                <span key={idx} className="bg-dark-800 text-accent-purple px-2 py-0.5 rounded border border-accent-purple/20 capitalize">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preset Buttons for Complex Prompts */}
      <div className="mb-4">
        <div className="text-xs text-slate-400 mb-2 flex items-center justify-between">
          <span>Try Reference Benchmark Prompts (From MobileDiffusion Research):</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetSelect(p.prompt)}
              className="text-left p-2.5 rounded-lg bg-dark-900 hover:bg-dark-800/90 border border-dark-700 hover:border-brand-500/40 transition-all text-xs group"
            >
              <div className="font-semibold text-slate-200 group-hover:text-brand-400 truncate">
                {p.title}
              </div>
              <div className="text-slate-400 line-clamp-1 mt-0.5 text-[11px]">
                {p.prompt}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Controls Bar & Generate Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-dark-800">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">CFG Scale:</span>
            <input
              type="number"
              min="1"
              max="15"
              step="0.5"
              value={cfgScale}
              onChange={(e) => setCfgScale(parseFloat(e.target.value) || 7.5)}
              className="w-16 bg-dark-900 border border-dark-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-brand-500 text-center font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Seed:</span>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value) || 42)}
              className="w-24 bg-dark-900 border border-dark-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-brand-500 text-center font-mono"
            />
            <button
              onClick={randomizeSeed}
              title="Randomize Seed"
              className="p-1 rounded hover:bg-dark-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <button
          onClick={() => onGenerate({ seed, cfgScale })}
          disabled={isGenerating || !prompt.trim()}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-glow transition-all duration-200 ${
            isGenerating
              ? 'bg-brand-600/50 text-slate-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-brand-500 to-accent-cyan hover:from-brand-600 hover:to-cyan-500 text-white active:scale-95'
          }`}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Synthesizing (LCM In-flight)...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate On-Device</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
