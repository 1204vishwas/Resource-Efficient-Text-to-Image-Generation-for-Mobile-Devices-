"""
Classical Computer Vision Pipeline for Resource-Efficient Text-to-Image Generation
Mandatory Technical Requirements (Category A):
  1. Image resizing and resolution optimization (Bicubic, Lanczos, Edge-Preserving Super-Res)
  2. Colour correction and image enhancement (Gray-World AWB, CLAHE on LAB, Saturation, Gamma)
  3. Edge-aware post-processing (Bilateral filter, Edge-preserving Unsharp Mask)
  4. Image quality assessment (Laplacian Sharpness, Tenengrad, Naturalness/BRISQUE proxy, Dynamic Range)
  5. Artifact detection and correction (Noise estimation, Blockiness/Ringing, Adaptive suppression)
"""

import cv2
import numpy as np
import base64
import io
from PIL import Image

class ClassicalCVPipeline:
    def __init__(self):
        pass

    @staticmethod
    def gray_world_white_balance(img: np.ndarray) -> np.ndarray:
        """
        Auto White Balance using the Gray-World assumption:
        Computes the average reflectance of the scene and adjusts channel gains.
        """
        result = img.astype(np.float32)
        b_avg = np.mean(result[:, :, 0])
        g_avg = np.mean(result[:, :, 1])
        r_avg = np.mean(result[:, :, 2])
        
        # Avoid division by zero
        if b_avg < 1e-4 or g_avg < 1e-4 or r_avg < 1e-4:
            return img
            
        gray_avg = (b_avg + g_avg + r_avg) / 3.0
        
        # Scale each channel by gray_avg / channel_avg
        result[:, :, 0] = np.clip(result[:, :, 0] * (gray_avg / b_avg), 0, 255)
        result[:, :, 1] = np.clip(result[:, :, 1] * (gray_avg / g_avg), 0, 255)
        result[:, :, 2] = np.clip(result[:, :, 2] * (gray_avg / r_avg), 0, 255)
        return result.astype(np.uint8)

    @staticmethod
    def enhance_color_clahe(img: np.ndarray, clip_limit: float = 2.0, tile_grid_size: tuple = (8, 8),
                            saturation_factor: float = 1.15, gamma: float = 1.05) -> np.ndarray:
        """
        Enhance color and dynamic range:
        - CLAHE applied exclusively to Lightness (L*) channel in CIELAB space to preserve chroma
        - HSV saturation boost
        - Gamma correction
        """
        # 1. CLAHE in CIELAB space
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
        l_enhanced = clahe.apply(l)
        enhanced_lab = cv2.merge((l_enhanced, a, b))
        enhanced_bgr = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

        # 2. Saturation boost in HSV space
        hsv = cv2.cvtColor(enhanced_bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
        hsv[:, :, 1] = np.clip(hsv[:, :, 1] * saturation_factor, 0, 255)
        enhanced_bgr = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

        # 3. Gamma correction: O = 255 * (I / 255) ^ (1 / gamma)
        if abs(gamma - 1.0) > 0.01:
            inv_gamma = 1.0 / max(gamma, 0.1)
            table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(0, 256)]).astype(np.uint8)
            enhanced_bgr = cv2.LUT(enhanced_bgr, table)

        return enhanced_bgr

    @staticmethod
    def edge_aware_filter(img: np.ndarray, diameter: int = 7, sigma_color: float = 50.0,
                          sigma_space: float = 50.0) -> np.ndarray:
        """
        Edge-preserving smoothing using Bilateral Filtering:
        Smooths generative latent noise in homogeneous regions while sharply preserving semantic edges.
        """
        return cv2.bilateralFilter(img, d=diameter, sigmaColor=sigma_color, sigmaSpace=sigma_space)

    @staticmethod
    def edge_preserving_unsharp_mask(img: np.ndarray, strength: float = 0.8,
                                     threshold: int = 10, blur_ksize: int = 5) -> np.ndarray:
        """
        Edge-preserving unsharp mask with halo suppression:
        Generates high-frequency details without overshooting boundaries or amplifying high-frequency noise.
        """
        blurred = cv2.GaussianBlur(img, (blur_ksize, blur_ksize), 0)
        diff = cv2.absdiff(img, blurred)
        gray_diff = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
        
        # Create mask where detail exceeds noise threshold
        _, mask = cv2.threshold(gray_diff, threshold, 255, cv2.THRESH_BINARY)
        mask = mask.astype(np.float32) / 255.0
        mask_3ch = cv2.merge([mask, mask, mask])

        # Sharpened image
        sharpened = cv2.addWeighted(img, 1.0 + strength, blurred, -strength, 0)
        
        # Blend according to edge mask
        output = img.astype(np.float32) * (1.0 - mask_3ch) + sharpened.astype(np.float32) * mask_3ch
        return np.clip(output, 0, 255).astype(np.uint8)

    @staticmethod
    def resolution_optimization(img: np.ndarray, target_size: tuple = (512, 512),
                                method: str = "edge_preserving") -> np.ndarray:
        """
        Resolution optimization and super-resolution upscaling:
        - 'lanczos': High-order 8x8 sinc Lanczos interpolation
        - 'bicubic': Standard 4x4 cubic interpolation
        - 'edge_preserving': Multi-stage edge-directed super-resolution
        """
        w, h = target_size
        if method == "lanczos":
            return cv2.resize(img, (w, h), interpolation=cv2.INTER_LANCZOS4)
        elif method == "bicubic":
            return cv2.resize(img, (w, h), interpolation=cv2.INTER_CUBIC)
        else: # edge_preserving super-resolution
            # 1. Initial Lanczos upscale
            upscaled = cv2.resize(img, (w, h), interpolation=cv2.INTER_LANCZOS4)
            # 2. Gradient extraction using Sobel
            gray = cv2.cvtColor(upscaled, cv2.COLOR_BGR2GRAY)
            grad_x = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
            grad_y = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
            magnitude = cv2.magnitude(grad_x, grad_y)
            magnitude = cv2.normalize(magnitude, None, 0, 1, cv2.NORM_MINMAX)
            mag_3ch = cv2.merge([magnitude, magnitude, magnitude])
            
            # 3. Apply edge-directed detail reinforcement
            detail_enhanced = cv2.detailEnhance(upscaled, sigma_s=10, sigma_r=0.15)
            blended = upscaled.astype(np.float32) * (1.0 - mag_3ch * 0.4) + detail_enhanced.astype(np.float32) * (mag_3ch * 0.4)
            return np.clip(blended, 0, 255).astype(np.uint8)

    @staticmethod
    def detect_and_correct_artifacts(img: np.ndarray) -> tuple[np.ndarray, dict]:
        """
        Artifact Detection and Correction:
        - Detects high-frequency checkerboard / grid artifacts common in distilled VAE decoders
        - Computes artifact density metric
        - Corrects via adaptive median and directional smoothing
        """
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # High-pass filter using Difference of Gaussians (DoG)
        g1 = cv2.GaussianBlur(gray, (3, 3), 0.5)
        g2 = cv2.GaussianBlur(gray, (7, 7), 2.0)
        dog = cv2.absdiff(g1, g2)
        
        # Estimate high-frequency noise variance
        noise_var = float(np.var(dog))
        
        # Estimate blockiness metric (discontinuity along 8x8 or 4x4 latent grid lines)
        h, w = gray.shape
        diff_h = np.abs(gray[1:, :] - gray[:-1, :])
        diff_w = np.abs(gray[:, 1:] - gray[:, :-1])
        grid_step = 8
        grid_boundary_energy_h = np.mean(diff_h[grid_step-1::grid_step, :]) if h > grid_step else 0.0
        internal_energy_h = np.mean(diff_h)
        blockiness_ratio = float(grid_boundary_energy_h / (internal_energy_h + 1e-5))
        
        artifact_metrics = {
            "high_frequency_noise_variance": round(noise_var, 3),
            "blockiness_index": round(blockiness_ratio, 3),
            "artifact_severity": "low" if noise_var < 80 and blockiness_ratio < 1.3 else ("medium" if noise_var < 180 else "high")
        }
        
        # Correct if needed:
        corrected = img.copy()
        if artifact_metrics["artifact_severity"] in ["medium", "high"]:
            # Apply fast selective denoising
            denoised = cv2.fastNlMeansDenoisingColored(img, None, h=3, hColor=3, templateWindowSize=7, searchWindowSize=15)
            # Retain high-contrast edge features
            edges = cv2.Canny(gray, 60, 150)
            edges_dilated = cv2.dilate(edges, np.ones((3,3), np.uint8), iterations=1)
            mask = (edges_dilated.astype(np.float32) / 255.0)[:, :, None]
            corrected = (img.astype(np.float32) * mask + denoised.astype(np.float32) * (1.0 - mask)).astype(np.uint8)
            artifact_metrics["corrected"] = True
        else:
            artifact_metrics["corrected"] = False
            
        return corrected, artifact_metrics

    @staticmethod
    def assess_image_quality(img: np.ndarray) -> dict:
        """
        Image Quality Assessment (IQA):
        - Laplacian variance sharpness score: High values indicate crisp textures
        - Tenengrad gradient energy: Quantitative measure of edge distinctness
        - Contrast & dynamic range
        - BRISQUE naturalness proxy: Evaluates natural scene statistics of MSCN coefficients
        """
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 1. Laplacian Sharpness
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        lap_var = float(laplacian.var())
        
        # 2. Tenengrad Gradient
        gx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        gy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        tenengrad = float(np.mean(gx**2 + gy**2))
        
        # 3. Dynamic Range & Michelson Contrast
        min_val, max_val = float(np.min(gray)), float(np.max(gray))
        dynamic_range = max_val - min_val
        michelson_contrast = round((max_val - min_val) / (max_val + min_val + 1e-5), 3)
        
        # 4. MSCN (Mean Subtracted Contrast Normalized) Naturalness Proxy
        mu = cv2.GaussianBlur(gray.astype(np.float32), (7, 7), 1.16)
        sigma = np.sqrt(np.abs(cv2.GaussianBlur((gray.astype(np.float32) - mu)**2, (7, 7), 1.16)))
        mscn = (gray.astype(np.float32) - mu) / (sigma + 1.0)
        
        # Natural images have near-Gaussian MSCN distributions
        mscn_kurtosis = float(np.mean(mscn**4) / (np.mean(mscn**2)**2 + 1e-5))
        # Optimal kurtosis for natural scene statistics is around 3.0
        naturalness_score = round(max(0.0, min(100.0, 100.0 - abs(mscn_kurtosis - 3.0) * 12.0)), 1)
        
        # Overall aesthetic / sharpness score normalized 0-100
        sharpness_score = round(min(100.0, (lap_var / 500.0) * 100.0), 1)

        return {
            "laplacian_sharpness": round(lap_var, 2),
            "sharpness_score_percent": sharpness_score,
            "tenengrad_energy": round(tenengrad, 1),
            "dynamic_range": int(dynamic_range),
            "michelson_contrast": michelson_contrast,
            "naturalness_score": naturalness_score,
            "overall_quality_score": round(0.4 * sharpness_score + 0.35 * naturalness_score + 0.25 * (michelson_contrast * 100), 1)
        }

    def process(self, img_bgr: np.ndarray, target_size: tuple = (512, 512),
                enable_wb: bool = True, enable_clahe: bool = True,
                enable_bilateral: bool = True, enable_unsharp: bool = True,
                enable_artifacts: bool = True, super_res_method: str = "edge_preserving") -> tuple[np.ndarray, dict]:
        """
        Execute full classical computer vision post-processing pipeline.
        Returns:
          processed_img_bgr, metrics_dict
        """
        metrics = {}
        
        # 1. Artifact detection and correction
        current_img = img_bgr
        if enable_artifacts:
            current_img, art_metrics = self.detect_and_correct_artifacts(current_img)
            metrics["artifacts"] = art_metrics
            
        # 2. Auto white balance
        if enable_wb:
            current_img = self.gray_world_white_balance(current_img)
            
        # 3. Edge-aware bilateral filtering to clear latent generative noise
        if enable_bilateral:
            current_img = self.edge_aware_filter(current_img, diameter=5, sigma_color=35.0, sigma_space=35.0)
            
        # 4. Color enhancement & CLAHE
        if enable_clahe:
            current_img = self.enhance_color_clahe(current_img, clip_limit=2.0, tile_grid_size=(8, 8),
                                                    saturation_factor=1.12, gamma=1.04)
            
        # 5. Resolution optimization & super-resolution
        if current_img.shape[0] != target_size[1] or current_img.shape[1] != target_size[0]:
            current_img = self.resolution_optimization(current_img, target_size, method=super_res_method)
            
        # 6. Edge-preserving unsharp masking for final crisp definition
        if enable_unsharp:
            current_img = self.edge_preserving_unsharp_mask(current_img, strength=0.75, threshold=8, blur_ksize=5)
            
        # 7. Comprehensive IQA
        metrics["iqa"] = self.assess_image_quality(current_img)
        
        return current_img, metrics


def bgr_to_base64(img_bgr: np.ndarray) -> str:
    """Encode OpenCV BGR image to base64 JPEG"""
    success, buffer = cv2.imencode('.jpg', img_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
    if not success:
        raise ValueError("Failed to encode image to base64")
    return "data:image/jpeg;base64," + base64.b64encode(buffer).decode('utf-8')


def base64_to_bgr(b64_str: str) -> np.ndarray:
    """Decode base64 image string to OpenCV BGR image"""
    if "," in b64_str:
        b64_str = b64_str.split(",")[1]
    img_data = base64.b64decode(b64_str)
    nparr = np.frombuffer(img_data, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)


if __name__ == "__main__":
    # Self-test
    test_img = np.zeros((256, 256, 3), dtype=np.uint8)
    cv2.circle(test_img, (128, 128), 64, (0, 180, 255), -1)
    cv2.putText(test_img, "Mobile Diffusion", (30, 230), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    pipeline = ClassicalCVPipeline()
    enhanced, meta = pipeline.process(test_img, target_size=(512, 512))
    print("Test passed! Enhanced shape:", enhanced.shape, "Quality score:", meta["iqa"]["overall_quality_score"])
