const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Helper function to execute Python run_engine safely via temporary files
function executeEngine(action, payload) {
  return new Promise((resolve, reject) => {
    const tempDir = os.tmpdir();
    const tempInputFile = path.join(tempDir, `engine_in_${Date.now()}_${Math.random().toString(36).substring(7)}.json`);
    const tempOutputFile = path.join(tempDir, `engine_out_${Date.now()}_${Math.random().toString(36).substring(7)}.json`);

    try {
      fs.writeFileSync(tempInputFile, JSON.stringify(payload), 'utf8');
    } catch (writeErr) {
      return reject(new Error(`Failed to write temp input: ${writeErr.message}`));
    }

    const pythonScript = path.join(__dirname, 'run_engine.py');
    const pythonBin = 'python'; // System python

    const args = [pythonScript, action, '--file', tempInputFile];
    const proc = spawn(pythonBin, args, { cwd: __dirname });

    let stdoutData = '';
    let stderrData = '';

    proc.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    proc.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    proc.on('close', (code) => {
      // Clean up temp input
      try {
        if (fs.existsSync(tempInputFile)) fs.unlinkSync(tempInputFile);
      } catch (e) {}

      if (code !== 0) {
        console.error(`Python process error (code ${code}):`, stderrData);
        return reject(new Error(`Engine exited with code ${code}: ${stderrData || stdoutData}`));
      }

      try {
        // Output from run_engine is printed to stdout
        const trimmed = stdoutData.trim();
        if (!trimmed) {
          return reject(new Error('Engine returned empty response. Stderr: ' + stderrData));
        }
        const parsed = JSON.parse(trimmed);
        resolve(parsed);
      } catch (parseErr) {
        console.error('Failed to parse Python engine output:', stdoutData);
        reject(new Error(`Invalid JSON from engine: ${parseErr.message}`));
      }
    });

    proc.on('error', (err) => {
      try {
        if (fs.existsSync(tempInputFile)) fs.unlinkSync(tempInputFile);
      } catch (e) {}
      reject(err);
    });
  });
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Text-to-Image Generation Endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const {
      prompt,
      model_type = 'mobile',
      precision = 'INT8',
      steps = 4,
      latent_size = 32,
      target_size = [512, 512],
      cfg_scale = 7.5,
      seed = 42,
      cv_options
    } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Valid prompt is required.' });
    }

    const result = await executeEngine('generate', {
      prompt: prompt.trim(),
      model_type,
      precision,
      steps: Number(steps) || 4,
      latent_size: Number(latent_size) || 32,
      target_size,
      cfg_scale: Number(cfg_scale) || 7.5,
      seed: Number(seed) || 42,
      cv_options
    });

    res.json(result);
  } catch (err) {
    console.error('Generation failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Quantitative Benchmark Comparison (Baseline vs Mobile vs CV Post-Processed)
app.post('/api/benchmark', async (req, res) => {
  try {
    const { prompt } = req.body;
    const testPrompt = prompt || 'A red vintage sports car parked next to a modern glass skyscraper under a golden sunset';
    const result = await executeEngine('benchmark', { prompt: testPrompt });
    res.json(result);
  } catch (err) {
    console.error('Benchmark failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Classical Computer Vision Post-Processing Endpoint
app.post('/api/postprocess', async (req, res) => {
  try {
    const { image, cv_options, target_size = [512, 512] } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image base64 string required.' });
    }

    const result = await executeEngine('postprocess', {
      image,
      cv_options,
      target_size
    });

    res.json(result);
  } catch (err) {
    console.error('Postprocess failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Host System Telemetry & Target Mobile Device Profiles
app.get('/api/device-profile', async (req, res) => {
  try {
    const result = await executeEngine('device_profile', {});
    res.json(result);
  } catch (err) {
    console.error('Device profile check failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Adaptive Computational Budget Recommendation
app.post('/api/adaptive-config', (req, res) => {
  try {
    const {
      max_latency_ms = 1200,
      max_ram_mb = 800,
      battery_level_percent = 85,
      power_mode = 'balanced' // 'battery_saver' | 'balanced' | 'quality'
    } = req.body;

    let recommended = {
      model_type: 'mobile',
      precision: 'INT8',
      steps: 4,
      latent_size: 32,
      super_res_method: 'edge_preserving',
      throttle_status: 'Optimal',
      alert: null
    };

    if (power_mode === 'battery_saver' || battery_level_percent < 20) {
      recommended.steps = 2;
      recommended.precision = 'INT8';
      recommended.latent_size = 32;
      recommended.throttle_status = 'Power Saver Throttled';
      recommended.alert = 'Active Battery Throttling: 2-step LCM INT8 selected to minimize SoC energy draw.';
    } else if (max_ram_mb < 300) {
      recommended.steps = 3;
      recommended.precision = 'INT8';
      recommended.latent_size = 32;
      recommended.throttle_status = 'Memory Constrained';
      recommended.alert = 'RAM Budget < 300MB: Compact 32x32 latent grid selected with Lanczos super-res.';
    } else if (power_mode === 'quality' && max_latency_ms > 2000 && battery_level_percent >= 40) {
      recommended.steps = 8;
      recommended.precision = 'FP16';
      recommended.latent_size = 48;
      recommended.throttle_status = 'Maximum Fidelity';
      recommended.alert = 'Plugged-in / High Thermal Budget: 8-step FP16 high-fidelity synthesis.';
    } else {
      recommended.steps = 4;
      recommended.precision = 'INT8';
      recommended.latent_size = 32;
      recommended.throttle_status = 'Optimal Mobile Balance';
      recommended.alert = 'Standard Balanced Profile: 4-step distilled consistency model with full CV enhancement.';
    }

    res.json(recommended);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Complex Prompt Presets Testing Multi-Object, Attributes, and Spatial Relations
app.get('/api/presets', (req, res) => {
  res.json([
    {
      category: 'Multi-Object & Spatial Relationship',
      title: 'Vintage Car & Modern Skyscraper',
      prompt: 'A red vintage sports car parked to the left of a blue glass skyscraper under a golden sunset',
      attributes: ['red', 'vintage', 'blue', 'glass', 'golden sunset'],
      spatial: ['to the left of', 'under']
    },
    {
      category: 'Complex Spatial Composition',
      title: 'Forest Cabin with Mountain Backdrop',
      prompt: 'A small wooden cabin nestled to the right of an emerald pine tree with snow-capped mountain peaks rising behind it',
      attributes: ['wooden', 'emerald', 'snow-capped'],
      spatial: ['to the right of', 'behind it']
    },
    {
      category: 'Futuristic Cyberpunk & Lighting',
      title: 'Cybernetic Beast in Rain',
      prompt: 'A sleek neon blue cybernetic tiger standing near a glowing magenta street lamp on wet asphalt in a cyberpunk city',
      attributes: ['neon blue', 'cybernetic', 'magenta', 'wet asphalt'],
      spatial: ['standing near', 'on']
    },
    {
      category: 'Organic Texture & Micro Scene',
      title: 'Golden Retriever in Sunflowers',
      prompt: 'A playful golden retriever puppy sitting in a vibrant yellow sunflower field with bright natural studio daylight',
      attributes: ['golden', 'playful', 'yellow', 'vibrant', 'bright daylight'],
      spatial: ['sitting in']
    }
  ]);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`Mobile Diffusion Backend Server running on port ${PORT}`);
  console.log(`Endpoints available:`);
  console.log(` - POST /api/generate`);
  console.log(` - POST /api/benchmark`);
  console.log(` - POST /api/postprocess`);
  console.log(` - POST /api/adaptive-config`);
  console.log(` - GET  /api/device-profile`);
  console.log(` - GET  /api/presets`);
  console.log(`=======================================================`);
});
