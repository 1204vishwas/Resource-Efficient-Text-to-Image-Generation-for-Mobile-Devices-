import React, { useState } from 'react';
import { Layers, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function DenoisingVisualizer({ intermediateSteps = [], enhancedImage }) {
  const [selectedStep, setSelectedStep] = useState(null);

  if (!intermediateSteps || intermediateSteps.length === 0) {
    return null;
  }

  return (
    <div className="glass-panel rounded-2xl p-5 mb-6 shadow-xl">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-dark-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-accent-cyan" />
          <h3 className="text-sm font-semibold text-slate-100">
            Denoising Trajectory & Latent Evolution
          </h3>
        </div>
        <span className="text-xs text-slate-400">
          Step-by-step LCM consistency trajectory
        </span>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {intermediateSteps.map((stepData, idx) => (
          <div key={idx} className="flex items-center shrink-0">
            <div
              onClick={() => setSelectedStep(stepData.image)}
              className="cursor-pointer group flex flex-col items-center"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-dark-700 group-hover:border-brand-400 transition-all bg-dark-900 shadow-sm relative">
                <img
                  src={stepData.image}
                  alt={`Step ${stepData.step}`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 right-1 text-[10px] font-mono font-bold bg-dark-950/80 px-1 rounded text-slate-300">
                  #{stepData.step}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 font-mono">
                Step {stepData.step}/{stepData.total_steps}
              </span>
            </div>
            {idx < intermediateSteps.length - 1 && (
              <ArrowRight className="w-3.5 h-3.5 text-slate-600 mx-1 shrink-0" />
            )}
          </div>
        ))}

        {enhancedImage && (
          <div className="flex items-center shrink-0 pl-1 border-l border-dark-800">
            <ArrowRight className="w-3.5 h-3.5 text-accent-emerald mx-1.5 shrink-0" />
            <div
              onClick={() => setSelectedStep(enhancedImage)}
              className="cursor-pointer group flex flex-col items-center"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 border-accent-emerald group-hover:border-accent-emerald/80 transition-all bg-dark-900 shadow-glow-emerald relative">
                <img
                  src={enhancedImage}
                  alt="Enhanced Final"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 right-1 text-[10px] font-mono font-bold bg-accent-emerald text-dark-950 px-1 rounded">
                  CV Post
                </span>
              </div>
              <span className="text-[11px] text-accent-emerald mt-1 font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Enhanced
              </span>
            </div>
          </div>
        )}
      </div>

      {selectedStep && (
        <div
          onClick={() => setSelectedStep(null)}
          className="fixed inset-0 z-50 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="glass-panel p-3 rounded-2xl max-w-lg w-full shadow-2xl border border-dark-700">
            <img src={selectedStep} alt="Expanded Step" className="w-full rounded-xl object-contain" />
            <p className="text-center text-xs text-slate-400 mt-2">Click anywhere to close</p>
          </div>
        </div>
      )}
    </div>
  );
}
