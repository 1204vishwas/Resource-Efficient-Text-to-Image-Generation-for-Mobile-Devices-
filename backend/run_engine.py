"""
CLI interface to MobileDiffusionEngine and ClassicalCVPipeline
Used by Node.js backend via child_process
"""

import sys
import json
import base64
import os
import argparse
from diffusion_engine import MobileDiffusionEngine
from cv_pipeline import ClassicalCVPipeline, base64_to_bgr, bgr_to_base64

def main():
    parser = argparse.ArgumentParser(description="Mobile Diffusion Engine Runner")
    parser.add_argument("action", choices=["generate", "benchmark", "postprocess", "device_profile"])
    parser.add_argument("--json", type=str, default="", help="JSON input string")
    parser.add_argument("--file", type=str, default="", help="JSON file input path")
    parser.add_argument("--stdin", action="store_true", help="Read JSON from stdin")
    args = parser.parse_args()

    input_data = {}
    if args.json:
        try:
            input_data = json.loads(args.json)
        except Exception:
            pass
    elif args.file and os.path.exists(args.file):
        try:
            with open(args.file, "r", encoding="utf-8") as f:
                input_data = json.load(f)
        except Exception:
            pass
    elif args.stdin:
        try:
            input_data = json.loads(sys.stdin.read())
        except Exception:
            pass

    engine = MobileDiffusionEngine()

    try:
        if args.action == "generate":
            prompt = input_data.get("prompt", "A golden retriever puppy sitting in a sunflower field under bright sunlight")
            model_type = input_data.get("model_type", "mobile")
            precision = input_data.get("precision", "INT8")
            steps = int(input_data.get("steps", 4))
            latent_size = int(input_data.get("latent_size", 32))
            cfg_scale = float(input_data.get("cfg_scale", 7.5))
            seed = int(input_data.get("seed", 42))
            cv_options = input_data.get("cv_options", None)
            
            result = engine.generate(
                prompt=prompt,
                model_type=model_type,
                precision=precision,
                steps=steps,
                latent_size=latent_size,
                cfg_scale=cfg_scale,
                seed=seed,
                cv_options=cv_options
            )
            print(json.dumps(result))

        elif args.action == "benchmark":
            prompt = input_data.get("prompt", "A red vintage sports car parked next to a modern glass skyscraper under a golden sunset")
            result = engine.benchmark_comparison(prompt=prompt)
            print(json.dumps(result))

        elif args.action == "postprocess":
            b64_img = input_data.get("image")
            if not b64_img:
                print(json.dumps({"error": "No image provided for postprocessing"}))
                return
            cv_options = input_data.get("cv_options", {})
            target_size = tuple(input_data.get("target_size", [512, 512]))
            
            img_bgr = base64_to_bgr(b64_img)
            cv_pipe = ClassicalCVPipeline()
            enhanced_bgr, metrics = cv_pipe.process(
                img_bgr,
                target_size=target_size,
                enable_wb=cv_options.get("enable_wb", True),
                enable_clahe=cv_options.get("enable_clahe", True),
                enable_bilateral=cv_options.get("enable_bilateral", True),
                enable_unsharp=cv_options.get("enable_unsharp", True),
                enable_artifacts=cv_options.get("enable_artifacts", True),
                super_res_method=cv_options.get("super_res_method", "edge_preserving")
            )
            print(json.dumps({
                "success": True,
                "enhanced_image": bgr_to_base64(enhanced_bgr),
                "metrics": metrics
            }))

        elif args.action == "device_profile":
            import psutil
            import platform
            print(json.dumps({
                "host_system": {
                    "os": platform.system(),
                    "release": platform.release(),
                    "cpu_count": psutil.cpu_count(logical=True),
                    "ram_total_gb": round(psutil.virtual_memory().total / (1024**3), 2),
                    "ram_available_gb": round(psutil.virtual_memory().available / (1024**3), 2),
                    "cpu_percent": psutil.cpu_percent(interval=0.1)
                },
                "target_mobile_profiles": [
                    {
                        "device": "Flagship Android (Snapdragon 8 Gen 3)",
                        "npu": "Qualcomm Hexagon NPU",
                        "tops": 45,
                        "ram_budget_mb": 1500,
                        "optimal_quantization": "INT8",
                        "optimal_steps": 4,
                        "thermal_envelope_watts": 4.5
                    },
                    {
                        "device": "Apple iPhone 15 Pro / 16 (A17/A18 Pro)",
                        "npu": "Apple Neural Engine (ANE)",
                        "tops": 35,
                        "ram_budget_mb": 1800,
                        "optimal_quantization": "FP16 / INT8 Mixed",
                        "optimal_steps": 4,
                        "thermal_envelope_watts": 4.0
                    },
                    {
                        "device": "Mid-tier Mobile (MediaTek Dimensity 8300)",
                        "npu": "MediaTek APU 780",
                        "tops": 22,
                        "ram_budget_mb": 800,
                        "optimal_quantization": "INT8",
                        "optimal_steps": 2,
                        "thermal_envelope_watts": 3.0
                    }
                ]
            }))
        else:
            print(json.dumps({"error": f"Unknown action: {args.action}"}))

    except Exception as e:
        import traceback
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}))

if __name__ == "__main__":
    main()
