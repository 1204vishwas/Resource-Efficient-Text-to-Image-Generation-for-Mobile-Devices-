import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PromptStudio from './components/PromptStudio';
import OptimizationControls from './components/OptimizationControls';
import ClassicalCVPipeline from './components/ClassicalCVPipeline';
import DenoisingVisualizer from './components/DenoisingVisualizer';
import ComparisonSlider from './components/ComparisonSlider';
import MetricsDashboard from './components/MetricsDashboard';
import AdaptiveBudgetSelector from './components/AdaptiveBudgetSelector';
import BenchmarkSuite from './components/BenchmarkSuite';
import MobileDeviceSimulator from './components/MobileDeviceSimulator';
import { Sparkles, Download, Eye, RefreshCw, Maximize2, X, CheckCircle2, Sliders } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('studio');

  // Generation prompt & analysis
  const [prompt, setPrompt] = useState('a sports car standing in road');
  const [promptAnalysis, setPromptAnalysis] = useState(null);
  const [presets, setPresets] = useState([]);

  // Frame display controls (Fit vs Fill & View Mode)
  const [fitMode, setFitMode] = useState('contain'); // 'contain' (whole image fitted) | 'cover'
  const [viewVersion, setViewVersion] = useState('enhanced'); // 'enhanced' | 'raw_latent'
  const [fullscreenModal, setFullscreenModal] = useState(false);

  // Model & Pipeline Configuration
  const [config, setConfig] = useState({
    model_type: 'mobile',
    precision: 'INT8',
    steps: 4,
    latent_size: 32,
    target_size: [512, 512],
    cfg_scale: 7.5,
    seed: 42
  });

  // Classical CV Options
  const [cvOptions, setCvOptions] = useState({
    enable_wb: true,
    enable_clahe: true,
    enable_bilateral: true,
    enable_unsharp: true,
    enable_artifacts: true,
    super_res_method: 'edge_preserving'
  });

  // Generated outputs & metrics
  const [generatedImages, setGeneratedImages] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [mobileTargets, setMobileTargets] = useState(null);
  const [artifactsDetected, setArtifactsDetected] = useState(null);

  // Benchmark outputs
  const [benchmarkData, setBenchmarkData] = useState(null);

  // Loading states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isBenchmarking, setIsBenchmarking] = useState(false);

  // Fetch presets on load & auto-generate initial sample
  useEffect(() => {
    fetch('/api/presets')
      .then(res => res.json())
      .then(data => {
        setPresets(data);
      })
      .catch(err => console.error('Presets error:', err));

    handleGenerate();
  }, []);

  const handleGenerate = async (customParams = {}) => {
    setIsGenerating(true);
    try {
      const payload = {
        prompt: prompt.trim() || 'a sports car standing in road',
        model_type: config.model_type,
        precision: config.precision,
        steps: config.steps,
        latent_size: config.latent_size,
        target_size: config.target_size,
        cfg_scale: customParams.cfgScale || config.cfg_scale,
        seed: customParams.seed || config.seed,
        cv_options: cvOptions
      };

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.success) {
        setGeneratedImages(data.images);
        setPromptAnalysis(data.prompt_analysis);
        setMetrics(data.metrics);
        setMobileTargets(data.mobile_targets);
        setArtifactsDetected(data.artifacts_detected);
      }
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReapplyCV = async () => {
    if (!generatedImages?.raw_latent) return;
    setIsFiltering(true);
    try {
      const res = await fetch('/api/postprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: generatedImages.raw_latent,
          cv_options: cvOptions,
          target_size: config.target_size
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.success) {
        setGeneratedImages(prev => ({
          ...prev,
          enhanced: data.enhanced_image
        }));
        if (data.metrics?.iqa) {
          setMetrics(prev => ({
            ...prev,
            quality_score: data.metrics.iqa.overall_quality_score,
            laplacian_sharpness: data.metrics.iqa.laplacian_sharpness,
            naturalness_score: data.metrics.iqa.naturalness_score,
            michelson_contrast: data.metrics.iqa.michelson_contrast
          }));
        }
        if (data.metrics?.artifacts) {
          setArtifactsDetected(data.metrics.artifacts);
        }
      }
    } catch (err) {
      console.error('Re-apply CV error:', err);
    } finally {
      setIsFiltering(false);
    }
  };

  const handleRunBenchmark = async () => {
    setIsBenchmarking(true);
    try {
      const res = await fetch('/api/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBenchmarkData(data);
    } catch (err) {
      console.error('Benchmark failed:', err);
    } finally {
      setIsBenchmarking(false);
    }
  };

  const handleApplyAdaptiveConfig = (recommended) => {
    setConfig(prev => ({
      ...prev,
      steps: recommended.steps,
      precision: recommended.precision,
      latent_size: recommended.latent_size,
      model_type: 'mobile'
    }));
    setActiveTab('studio');
  };

  const activeDisplayImage = viewVersion === 'enhanced'
    ? (generatedImages?.enhanced || generatedImages?.raw_latent)
    : (generatedImages?.raw_latent || generatedImages?.enhanced);

  return (
    <div className="min-h-screen flex flex-col bg-dark-950 text-slate-100">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab 1: Studio & Generation */}
        {activeTab === 'studio' && (
          <div>
            <PromptStudio
              prompt={prompt}
              setPrompt={setPrompt}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              promptAnalysis={promptAnalysis}
              presets={presets}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
              {/* Primary Canvas & Preview */}
              <div className="lg:col-span-7">
                <div className="glass-panel rounded-2xl p-5 shadow-xl flex flex-col justify-between h-full">
                  {/* Canvas Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-dark-800">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-400" />
                      <h3 className="text-sm font-bold text-slate-100">
                        Synthesized Image Canvas
                      </h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-dark-800 text-slate-300 border border-dark-700">
                        512 × 512 HD
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      {/* Version Toggle (Enhanced vs Raw) */}
                      <div className="bg-dark-900 p-0.5 rounded-lg border border-dark-700 flex text-[11px] font-medium mr-1">
                        <button
                          onClick={() => setViewVersion('enhanced')}
                          className={`px-2 py-1 rounded transition-all ${
                            viewVersion === 'enhanced'
                              ? 'bg-accent-emerald/20 text-accent-emerald font-semibold border border-accent-emerald/30'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Enhanced (CV Sharp)
                        </button>
                        <button
                          onClick={() => setViewVersion('raw_latent')}
                          className={`px-2 py-1 rounded transition-all ${
                            viewVersion === 'raw_latent'
                              ? 'bg-brand-500/20 text-brand-400 font-semibold border border-brand-500/30'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Raw Latent
                        </button>
                      </div>

                      {/* Frame Fit Toggle */}
                      <button
                        onClick={() => setFitMode(prev => prev === 'contain' ? 'cover' : 'contain')}
                        title={fitMode === 'contain' ? "Fitted within frame (no clipping)" : "Filled entire frame"}
                        className="px-2 py-1 rounded-lg bg-dark-900 hover:bg-dark-800 border border-dark-700 text-slate-300 text-[11px] font-mono"
                      >
                        {fitMode === 'contain' ? 'Fit: Whole Image' : 'Fit: Fill Frame'}
                      </button>

                      {/* Fullscreen Button */}
                      {activeDisplayImage && (
                        <button
                          onClick={() => setFullscreenModal(true)}
                          title="View Fullscreen High-Definition"
                          className="p-1 rounded-lg bg-dark-900 hover:bg-dark-800 border border-dark-700 text-slate-300"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Canvas Container with Frame Fitting */}
                  <div className="relative w-full aspect-square max-h-[512px] rounded-xl overflow-hidden bg-dark-950 border border-dark-700 shadow-2xl flex items-center justify-center p-1">
                    {isGenerating ? (
                      <div className="flex flex-col items-center gap-3 text-brand-400 text-sm">
                        <RefreshCw className="w-9 h-9 animate-spin text-accent-cyan" />
                        <span className="font-semibold animate-pulse text-slate-200">
                          Synthesizing Crisp Imagery with {config.steps}-Step LCM Diffusion...
                        </span>
                        <span className="text-xs text-slate-400">
                          Executing INT8 inference & edge-preserving computer vision
                        </span>
                      </div>
                    ) : activeDisplayImage ? (
                      <img
                        src={activeDisplayImage}
                        alt="Synthesized Canvas"
                        className={`w-full h-full rounded-lg transition-all duration-300 shadow-md ${
                          fitMode === 'contain' ? 'object-contain' : 'object-cover'
                        }`}
                      />
                    ) : (
                      <div className="text-slate-500 text-xs">
                        Enter a prompt and click "Generate On-Device"
                      </div>
                    )}
                  </div>

                  {/* Bottom Stats & Actions */}
                  {generatedImages && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-dark-800 text-xs">
                      <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                        <span>CLIP: <strong className="text-brand-400">{((metrics?.clip_similarity || 0.86) * 100).toFixed(1)}%</strong></span>
                        <span>•</span>
                        <span>RAM: <strong className="text-accent-emerald">{metrics?.peak_memory_mb || 162} MB</strong></span>
                        <span>•</span>
                        <span>Sharpness: <strong className="text-accent-cyan">{metrics?.laplacian_sharpness || 185}</strong></span>
                        <span>•</span>
                        <span>Quality: <strong className="text-accent-emerald">{metrics?.quality_score || 82}/100</strong></span>
                      </div>

                      <a
                        href={activeDisplayImage}
                        download={`mobilediff_${Date.now()}.jpg`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-200 border border-dark-700 font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Optimization Deck */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <OptimizationControls
                  config={config}
                  setConfig={setConfig}
                  disabled={isGenerating}
                />
              </div>
            </div>

            {/* Denoising Trajectory Visualizer */}
            <DenoisingVisualizer
              intermediateSteps={generatedImages?.intermediate_steps}
              enhancedImage={generatedImages?.enhanced}
            />

            {/* Classical CV Controls Deck */}
            <ClassicalCVPipeline
              cvOptions={cvOptions}
              setCvOptions={setCvOptions}
              onReapplyCV={handleReapplyCV}
              isFiltering={isFiltering}
              artifactsDetected={artifactsDetected}
              hasImage={!!generatedImages?.raw_latent}
            />

            {/* Full Metrics Dashboard */}
            <MetricsDashboard
              metrics={metrics}
              mobileTargets={mobileTargets}
              config={config}
            />
          </div>
        )}

        {/* Tab 2: Comparison Slider */}
        {activeTab === 'comparison' && (
          <ComparisonSlider
            baselineData={benchmarkData?.baseline}
            mobileRawData={benchmarkData?.mobile_raw || { images: { raw_latent: generatedImages?.raw_latent } }}
            mobileEnhancedData={benchmarkData?.mobile_optimized_cv || { images: { enhanced: generatedImages?.enhanced } }}
            onRunBenchmark={handleRunBenchmark}
            isBenchmarking={isBenchmarking}
          />
        )}

        {/* Tab 3: Adaptive Budget & Throttling */}
        {activeTab === 'adaptive' && (
          <AdaptiveBudgetSelector
            onApplyAdaptiveConfig={handleApplyAdaptiveConfig}
            activeConfig={config}
          />
        )}

        {/* Tab 4: Benchmark & Degradation */}
        {activeTab === 'benchmark' && (
          <BenchmarkSuite
            onRunFullBenchmark={handleRunBenchmark}
            isBenchmarking={isBenchmarking}
          />
        )}

        {/* Tab 5: Mobile Simulator */}
        {activeTab === 'simulator' && (
          <MobileDeviceSimulator
            currentImage={generatedImages?.enhanced}
            prompt={prompt}
            metrics={metrics}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        )}
      </main>

      {/* Fullscreen HD Modal */}
      {fullscreenModal && activeDisplayImage && (
        <div
          onClick={() => setFullscreenModal(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl w-full flex flex-col items-center">
            <button
              onClick={() => setFullscreenModal(false)}
              className="absolute -top-10 right-0 text-slate-300 hover:text-white flex items-center gap-1 text-sm bg-dark-900/80 px-3 py-1 rounded-full border border-dark-700"
            >
              <X className="w-4 h-4" /> Close
            </button>
            <img
              src={activeDisplayImage}
              alt="High Definition Fullscreen View"
              className="w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-dark-700"
            />
            <div className="mt-3 text-xs text-slate-300 font-mono bg-dark-900/90 px-4 py-1.5 rounded-full border border-dark-800">
              Prompt: "{prompt}" • 512×512 HD • Enhanced by Classical CV Pipeline
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-dark-800 bg-dark-900/60 py-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>Problem Statement 3 (ProbID - P3)</strong>: Resource-Efficient Text-to-Image Generation for Mobile Devices.
          </div>
          <div className="font-mono text-slate-500">
            PyTorch MobileUNet • OpenCV Classical CV • Latent Consistency Model
          </div>
        </div>
      </footer>
    </div>
  );
}
