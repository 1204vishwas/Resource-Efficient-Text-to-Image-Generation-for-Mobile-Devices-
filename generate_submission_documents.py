"""
Submission Document Generator: Converts Evaluation Report into Professional DOCX and PDF
Includes complete corrected mathematics, reconciled benchmark tables, and team metadata.
"""

import os
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
from reportlab.pdfgen import canvas

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def generate_docx(output_path):
    doc = Document()

    # Set standard 1-inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Title
    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r_title = title.add_run("Evaluation Report: MobileDiff-Edge")
    r_title.bold = True
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(24)
    r_title.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A) # Deep Navy

    # Subtitle / Metadata
    sub = doc.add_paragraph()
    r_sub = sub.add_run("Problem Statement 3 (ProbID - P3): Resource-Efficient Text-to-Image Generation for Mobile Devices\n")
    r_sub.font.size = Pt(12)
    r_sub.bold = True
    r_sub.font.color.rgb = RGBColor(0x3B, 0x82, 0xF6)

    r_meta = sub.add_run(
        "Team ID: T91 | Evaluated Model: INT8 Quantized MobileDiffusion UNet (142M Parameters, LCM 4-Step)\n"
        "GitHub Repository: https://github.com/1204vishwas/Resource-Efficient-Text-to-Image-Generation-for-Mobile-Devices-\n"
        "Evaluated Commit SHA: 1609685b75fe6ae628d2e861b31955ed0b4f5273\n"
        "Date of Evaluation: November 2026"
    )
    r_meta.font.size = Pt(9.5)
    r_meta.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ---------------- TEAM MEMBERS TABLE ----------------
    h_team = doc.add_heading("Team Identification & Student Information", level=1)
    h_team.paragraph_format.space_before = Pt(10)
    h_team.paragraph_format.space_after = Pt(6)

    team_table = doc.add_table(rows=6, cols=4)
    team_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["#", "Team Member Full Name", "University Seat Number (USN)", "Primary Project Role"]
    team_data = [
        ["1", "Vishwas Tripathi", "1RUA24CSE0539", "Project Lead & Model Optimization (Pruning, INT8)"],
        ["2", "Vishnuswaroop Ramkumar", "1RUA24CSE0537", "Deep Learning & Latent Diffusion Pipeline (LCM)"],
        ["3", "Yashash Ravi", "1RUA24CSE0547", "Classical Computer Vision & Super-Resolution (OpenCV)"],
        ["4", "Vikas", "1RUA24CSE0531", "Frontend Architecture & UI Telemetry Dashboard"],
        ["5", "Veena", "1RUA24CSE0526", "Benchmarking, Empirical Verification & SoC Profiling"]
    ]

    for c_idx, h_text in enumerate(headers):
        cell = team_table.cell(0, c_idx)
        cell.text = h_text
        set_cell_background(cell, "1E3A8A")
        p = cell.paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        p.runs[0].font.size = Pt(9.5)
        set_cell_margins(cell, top=120, bottom=120, left=140, right=140)

    for r_idx, row in enumerate(team_data, start=1):
        for c_idx, val in enumerate(row):
            cell = team_table.cell(r_idx, c_idx)
            cell.text = val
            p = cell.paragraphs[0]
            p.runs[0].font.size = Pt(9.5)
            if r_idx % 2 == 1:
                set_cell_background(cell, "F8FAFC")
            set_cell_margins(cell, top=100, bottom=100, left=140, right=140)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # ---------------- MATHEMATICAL CORRECTIONS ----------------
    h_corr = doc.add_heading("1. Mathematical Reconciliation & Corrections Summary", level=1)
    h_corr.paragraph_format.space_before = Pt(12)
    h_corr.paragraph_format.space_after = Pt(6)

    p_corr_intro = doc.add_paragraph(
        "Prior draft documentation contained several numerical inconsistencies and transcription errors. "
        "The following table provides the exact mathematical derivations and empirical reconciliations:"
    )
    p_corr_intro.paragraph_format.space_after = Pt(6)

    corr_table = doc.add_table(rows=7, cols=4)
    corr_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_headers = ["Metric Dimension", "Prior Claim", "Corrected Mathematical Derivation", "Reconciled Figure"]
    c_rows = [
        ["RAM Reduction (2850 -> 162 MB)", "86.0%", "(2850 - 162) / 2850 * 100% = 2688 / 2850", "94.32% RAM Saved"],
        ["Headroom under 200 MB Budget", "90.0%", "(200 - 162) / 200 * 100% = 38 / 200", "19.00% Headroom (38 MB free)"],
        ["Model Compression (3440 -> 142 MB)", "24.8x", "3440 / 142 = 24.2254x", "24.23x Compression (95.87% drop)"],
        ["Baseline Efficiency Index (eta)", "42.0 pts/s*GB", "eta = 98.5 / (18.5 * 2.85) = 98.5 / 52.725", "1.87 pts/(s*GB)"],
        ["Host Efficiency Index (eta)", "472.6 pts/s*GB", "eta = 97.1 / (1.2988 * 0.162) = 97.1 / 0.21041", "461.5 pts/(s*GB)"],
        ["Host Efficiency Multiplier", "20.2x", "Multiplier = 461.49 / 1.8682", "247.0x Gain vs Baseline"]
    ]

    for c_idx, h_text in enumerate(c_headers):
        cell = corr_table.cell(0, c_idx)
        cell.text = h_text
        set_cell_background(cell, "0F172A")
        p = cell.paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        p.runs[0].font.size = Pt(9.5)
        set_cell_margins(cell, top=120, bottom=120, left=140, right=140)

    for r_idx, row in enumerate(c_rows, start=1):
        for c_idx, val in enumerate(row):
            cell = corr_table.cell(r_idx, c_idx)
            cell.text = val
            p = cell.paragraphs[0]
            p.runs[0].font.size = Pt(9.0)
            if r_idx % 2 == 1:
                set_cell_background(cell, "F1F5F9")
            set_cell_margins(cell, top=90, bottom=90, left=120, right=120)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # ---------------- MASTER COMPARISON TABLE ----------------
    h_comp = doc.add_heading("2. Quantitative Comparison with Baseline Model", level=1)
    h_comp.paragraph_format.space_before = Pt(14)
    h_comp.paragraph_format.space_after = Pt(6)

    comp_table = doc.add_table(rows=15, cols=5)
    comp_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    m_headers = ["Evaluation Metric", "Baseline Reference (SD 1.5)", "MobileDiff-Edge (Host Cold)", "MobileDiff-Edge (Host Warm)", "Snapdragon 8 Gen 3 (NPU Model)"]
    m_rows = [
        ["UNet Parameter Count", "860 Million", "142.0 Million", "142.0 Million", "142.0 Million (6.06x pruned)"],
        ["Numerical Precision", "FP32 Single", "INT8 Dynamic", "INT8 Dynamic", "INT8 Tensor NPU"],
        ["Model Weight Storage", "3,440 MB (3.44 GB)", "142 MB", "142 MB", "142 MB (24.23x compression)"],
        ["Sampling Steps", "50 Steps (DDIM)", "4 Steps (LCM)", "4 Steps (LCM)", "4 Steps (LCM Distillation)"],
        ["Latent Resolution", "64x64", "32x32 Compact", "32x32 Compact", "32x32 (75% spatial drop)"],
        ["Denoising Latency", "~14,200 ms", "61.6 ms", "36.0 ms", "48.2 ms (INT8 NPU)"],
        ["Post-Processing & Super-Res", "~4,180 ms (Neural VAE)", "1,147.5 ms (Full CV)", "221.9 ms (Opt CV)", "171.1 ms (DSP/OpenCL)"],
        ["Total Inference Latency", "18,500 ms (CPU)", "1,298.8 ms", "306.1 ms", "233.8 ms (79.1x speedup)"],
        ["Peak Operating RAM", "2,850 MB (OOM Crash)", "162 MB", "162 MB", "162 MB (94.32% RAM saved)"],
        ["Memory Budget Headroom", "None (Exceeds budget)", "19.0% Margin (<200 MB)", "19.0% Margin (<200 MB)", "19.0% Margin (<200 MB)"],
        ["Mean CLIP Cosine Similarity", "0.931 (93.1%)", "0.923 (92.3%)", "0.924 +/- 0.003", "0.924 (99.25% retention)"],
        ["Distribution FID (COCO 2017)", "23.8", "26.4", "26.4", "26.4 (<30 human threshold)"],
        ["Composite IQA Score", "94.2 / 100", "97.1 / 100", "99.4 / 100", "97.1 / 100"],
        ["Quality-Cost Efficiency (eta)", "1.87 pts/(s*GB)", "461.5 pts/(s*GB)", "2,004.8 pts/(s*GB)", "2,563.7 pts/(s*GB) (1372x gain)"]
    ]

    for c_idx, h_text in enumerate(m_headers):
        cell = comp_table.cell(0, c_idx)
        cell.text = h_text
        set_cell_background(cell, "1E3A8A")
        p = cell.paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        p.runs[0].font.size = Pt(8.5)
        set_cell_margins(cell, top=100, bottom=100, left=100, right=100)

    for r_idx, row in enumerate(m_rows, start=1):
        for c_idx, val in enumerate(row):
            cell = comp_table.cell(r_idx, c_idx)
            cell.text = val
            p = cell.paragraphs[0]
            p.runs[0].font.size = Pt(8.0)
            if r_idx % 2 == 1:
                set_cell_background(cell, "F8FAFC")
            set_cell_margins(cell, top=80, bottom=80, left=90, right=90)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # ---------------- COMPLIANCE MATRIX ----------------
    h_comp_m = doc.add_heading("3. Compliance Matrix Against Problem Statement P3", level=1)
    h_comp_m.paragraph_format.space_before = Pt(12)
    h_comp_m.paragraph_format.space_after = Pt(6)

    comp_items = [
        ("A. Classical Computer Vision", "Image resizing & resolution optimization (Bicubic, Lanczos-4, Edge-SuperRes), CIELAB CLAHE, Gray-World AWB, Bilateral filtering, Edge-preserving Unsharp Mask, Laplacian sharpness, BRISQUE naturalness proxy, DoG artifact suppression."),
        ("B. Deep Learning Architecture", "142M MobileDiffusion UNet using depthwise-separable convolutions (~85% MAC reduction) and cross-attention text conditioning with Latent Consistency Model (LCM) 4-step distilled scheduler."),
        ("C. Model Optimization Strategies", "Post-training INT8 quantization (24.23x storage reduction, 142 MB), sampling step reduction (50 -> 4 steps, 12.5x step reduction), 6.06x parameter pruning, and compact 32x32 latent space (75% memory drop)."),
        ("D. Advanced Challenge Capabilities", "Multi-object spatial relationship parsing, CLIP cosine text-image alignment evaluation (0.924 mean), adaptive computational budget controller, and thermal/memory fallback mechanism."),
        ("Quantitative Deliverable", "Standalone on-device application with interactive React frontend, Node.js API orchestrator, native PyTorch/OpenCV engine, and reproducible benchmark verification script.")
    ]

    for title_text, desc_text in comp_items:
        p = doc.add_paragraph()
        r1 = p.add_run(f"• {title_text}: ")
        r1.bold = True
        r1.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
        r2 = p.add_run(desc_text)
        r2.font.size = Pt(9.5)
        p.paragraph_format.space_after = Pt(4)

    # ---------------- FOOTER & VERIFICATION NOTE ----------------
    doc.add_paragraph().paragraph_format.space_after = Pt(10)
    p_disc = doc.add_paragraph()
    r_disc = p_disc.add_run(
        "Disclosure & Reproducibility Notice: Physical benchmark numbers were obtained on the evaluation host testbed "
        "(Windows, Python 3.13, PyTorch 2.14 CPU, OpenCV 4.12) via backend/benchmark_verification.py. "
        "Snapdragon 8 Gen 3 Hexagon NPU (45 TOPS) and Apple A17 Pro (35 TOPS) figures represent analytical roofline hardware throughput projections. "
        "The complete evaluated repository commit is 1609685b75fe6ae628d2e861b31955ed0b4f5273."
    )
    r_disc.font.size = Pt(8.5)
    r_disc.font.italic = True
    r_disc.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    doc.save(output_path)
    print(f"[OK] Generated DOCX report at: {output_path}")


def generate_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1E3A8A'),
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#2563EB'),
        spaceAfter=2
    )
    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=8
    )
    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.HexColor('#1E3A8A'),
        spaceBefore=8,
        spaceAfter=4
    )
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=4
    )
    table_text_style = ParagraphStyle(
        'TableText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#0F172A')
    )
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.white
    )

    elements = []

    # Title & Metadata
    elements.append(Paragraph("Evaluation Report: MobileDiff-Edge", title_style))
    elements.append(Paragraph("Problem Statement 3 (ProbID - P3): Resource-Efficient Text-to-Image Generation for Mobile Devices", subtitle_style))
    elements.append(Paragraph(
        "<b>Team ID:</b> T91 &nbsp;|&nbsp; <b>Evaluated Model:</b> INT8 MobileDiffusion UNet (142M Params, LCM 4-Step)<br/>"
        "<b>GitHub:</b> https://github.com/1204vishwas/Resource-Efficient-Text-to-Image-Generation-for-Mobile-Devices-<br/>"
        "<b>Commit SHA:</b> <code>1609685b75fe6ae628d2e861b31955ed0b4f5273</code> &nbsp;|&nbsp; <b>Date:</b> November 2026",
        meta_style
    ))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E2E8F0'), spaceAfter=8))

    # Team Members Table
    elements.append(Paragraph("Team Identification & Student Information", h1_style))
    team_data = [
        [Paragraph("#", table_header_style), Paragraph("Team Member Full Name", table_header_style), Paragraph("University Seat Number (USN)", table_header_style), Paragraph("Primary Project Role", table_header_style)],
        [Paragraph("1", table_text_style), Paragraph("Vishwas Tripathi", table_text_style), Paragraph("1RUA24CSE0539", table_text_style), Paragraph("Project Lead & Model Optimization (Pruning, INT8)", table_text_style)],
        [Paragraph("2", table_text_style), Paragraph("Vishnuswaroop Ramkumar", table_text_style), Paragraph("1RUA24CSE0537", table_text_style), Paragraph("Deep Learning & Latent Diffusion Pipeline (LCM)", table_text_style)],
        [Paragraph("3", table_text_style), Paragraph("Yashash Ravi", table_text_style), Paragraph("1RUA24CSE0547", table_text_style), Paragraph("Classical Computer Vision & Super-Resolution (OpenCV)", table_text_style)],
        [Paragraph("4", table_text_style), Paragraph("Vikas", table_text_style), Paragraph("1RUA24CSE0531", table_text_style), Paragraph("Frontend Architecture & UI Telemetry Dashboard", table_text_style)],
        [Paragraph("5", table_text_style), Paragraph("Veena", table_text_style), Paragraph("1RUA24CSE0526", table_text_style), Paragraph("Benchmarking, Empirical Verification & SoC Profiling", table_text_style)]
    ]
    t_team = Table(team_data, colWidths=[25, 175, 140, 200])
    t_team.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E3A8A')),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(t_team)
    elements.append(Spacer(1, 8))

    # Mathematical Corrections Table
    elements.append(Paragraph("1. Mathematical Derivations & Reconciled Corrections", h1_style))
    c_data = [
        [Paragraph("Metric Dimension", table_header_style), Paragraph("Prior Claim", table_header_style), Paragraph("Corrected Mathematical Derivation", table_header_style), Paragraph("Reconciled Figure", table_header_style)],
        [Paragraph("RAM Reduction (2850 -> 162 MB)", table_text_style), Paragraph("86.0%", table_text_style), Paragraph("(2850 - 162) / 2850 * 100% = 2688 / 2850", table_text_style), Paragraph("<b>94.32% RAM Saved</b>", table_text_style)],
        [Paragraph("Headroom under 200 MB Budget", table_text_style), Paragraph("90.0%", table_text_style), Paragraph("(200 - 162) / 200 * 100% = 38 / 200", table_text_style), Paragraph("<b>19.00% Margin (38 MB free)</b>", table_text_style)],
        [Paragraph("Model Compression (3440 -> 142 MB)", table_text_style), Paragraph("24.8x", table_text_style), Paragraph("3440 / 142 = 24.2254x", table_text_style), Paragraph("<b>24.23x Compression (95.87% drop)</b>", table_text_style)],
        [Paragraph("Baseline Efficiency Index (eta)", table_text_style), Paragraph("42.0 pts/s*GB", table_text_style), Paragraph("eta = 98.5 / (18.5 * 2.85) = 98.5 / 52.725", table_text_style), Paragraph("<b>1.87 pts/(s*GB)</b>", table_text_style)],
        [Paragraph("Host Efficiency Index (eta)", table_text_style), Paragraph("472.6 pts/s*GB", table_text_style), Paragraph("eta = 97.1 / (1.2988 * 0.162) = 97.1 / 0.21041", table_text_style), Paragraph("<b>461.5 pts/(s*GB)</b>", table_text_style)],
        [Paragraph("Host Efficiency Multiplier", table_text_style), Paragraph("20.2x", table_text_style), Paragraph("Multiplier = 461.49 / 1.8682", table_text_style), Paragraph("<b>247.0x Gain vs Baseline</b>", table_text_style)]
    ]
    t_corr = Table(c_data, colWidths=[140, 70, 200, 130])
    t_corr.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F1F5F9')]),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
    ]))
    elements.append(t_corr)
    elements.append(Spacer(1, 8))

    # Master Quantitative Comparison Table
    elements.append(Paragraph("2. Master Quantitative Comparison with Baseline", h1_style))
    m_data = [
        [Paragraph("Evaluation Dimension", table_header_style), Paragraph("Baseline (SD 1.5)", table_header_style), Paragraph("Host Cold / Worst-Case", table_header_style), Paragraph("Host Warm Empirical", table_header_style), Paragraph("Snapdragon 8 Gen 3 NPU", table_header_style)],
        [Paragraph("UNet Parameters", table_text_style), Paragraph("860 Million", table_text_style), Paragraph("142.0 Million", table_text_style), Paragraph("142.0 Million", table_text_style), Paragraph("142.0M (6.06x pruned)", table_text_style)],
        [Paragraph("Numerical Precision", table_text_style), Paragraph("FP32 Single", table_text_style), Paragraph("INT8 Dynamic", table_text_style), Paragraph("INT8 Dynamic", table_text_style), Paragraph("INT8 Tensor NPU", table_text_style)],
        [Paragraph("Model Storage", table_text_style), Paragraph("3,440 MB (3.44 GB)", table_text_style), Paragraph("142 MB", table_text_style), Paragraph("142 MB", table_text_style), Paragraph("142 MB (24.23x smaller)", table_text_style)],
        [Paragraph("Denoising Steps", table_text_style), Paragraph("50 Steps (DDIM)", table_text_style), Paragraph("4 Steps (LCM)", table_text_style), Paragraph("4 Steps (LCM)", table_text_style), Paragraph("4 Steps (LCM)", table_text_style)],
        [Paragraph("Latent Resolution", table_text_style), Paragraph("64x64 Grid", table_text_style), Paragraph("32x32 Compact", table_text_style), Paragraph("32x32 Compact", table_text_style), Paragraph("32x32 (75% memory drop)", table_text_style)],
        [Paragraph("Core Denoising Time", table_text_style), Paragraph("~14,200 ms", table_text_style), Paragraph("61.6 ms", table_text_style), Paragraph("36.0 ms", table_text_style), Paragraph("48.2 ms (INT8 NPU)", table_text_style)],
        [Paragraph("Total Inference Latency", table_text_style), Paragraph("18,500 ms (CPU)", table_text_style), Paragraph("1,298.8 ms", table_text_style), Paragraph("306.1 ms", table_text_style), Paragraph("233.8 ms (79.1x faster)", table_text_style)],
        [Paragraph("Peak Operating RAM", table_text_style), Paragraph("2,850 MB (OOM Crash)", table_text_style), Paragraph("162 MB", table_text_style), Paragraph("162 MB", table_text_style), Paragraph("162 MB (94.32% RAM saved)", table_text_style)],
        [Paragraph("Memory Headroom (<200MB)", table_text_style), Paragraph("None (Crash)", table_text_style), Paragraph("19.0% Margin (38 MB)", table_text_style), Paragraph("19.0% Margin (38 MB)", table_text_style), Paragraph("19.0% Margin (38 MB free)", table_text_style)],
        [Paragraph("Mean CLIP Alignment", table_text_style), Paragraph("0.931 (93.1%)", table_text_style), Paragraph("0.923 (92.3%)", table_text_style), Paragraph("0.924 +/- 0.003", table_text_style), Paragraph("0.924 (99.25% retained)", table_text_style)],
        [Paragraph("Distribution FID (COCO 2017)", table_text_style), Paragraph("23.8", table_text_style), Paragraph("26.4", table_text_style), Paragraph("26.4", table_text_style), Paragraph("26.4 (<30 human threshold)", table_text_style)],
        [Paragraph("Composite IQA Score", table_text_style), Paragraph("94.2 / 100", table_text_style), Paragraph("97.1 / 100", table_text_style), Paragraph("99.4 / 100", table_text_style), Paragraph("97.1 / 100", table_text_style)],
        [Paragraph("Efficiency Index (eta)", table_text_style), Paragraph("1.87 pts/(s*GB)", table_text_style), Paragraph("461.5 pts/(s*GB)", table_text_style), Paragraph("2,004.8 pts/(s*GB)", table_text_style), Paragraph("2,563.7 pts/(s*GB) (1372x)", table_text_style)]
    ]
    t_master = Table(m_data, colWidths=[110, 105, 105, 105, 115])
    t_master.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E3A8A')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(t_master)
    elements.append(Spacer(1, 8))

    # Disclosure
    elements.append(Paragraph(
        "<b>Scientific Integrity & Methodology Disclosure:</b> Physical host measurements were executed directly on the testbed using "
        "Python 3.13, PyTorch 2.14, and OpenCV 4.12 via <code>backend/benchmark_verification.py</code>. "
        "Snapdragon 8 Gen 3 Hexagon NPU (45 TOPS) and Apple A17 Pro (35 TOPS) metrics represent analytical roofline hardware throughput projections. "
        "Evaluated code repository corresponds to commit SHA: <code>1609685b75fe6ae628d2e861b31955ed0b4f5273</code>.",
        meta_style
    ))

    doc.build(elements)
    print(f"[OK] Generated PDF report at: {output_path}")

if __name__ == "__main__":
    downloads_dir = "C:/Users/vishu/Downloads"
    repo_dir = "c:/Users/vishu/OneDrive/Desktop/hakthon"

    docx_paths = [
        os.path.join(downloads_dir, "eval_p3_final.docx"),
        os.path.join(repo_dir, "eval_p3_final.docx")
    ]
    pdf_paths = [
        os.path.join(downloads_dir, "eval_p3_final.pdf"),
        os.path.join(repo_dir, "eval_p3_final.pdf")
    ]

    for p in docx_paths:
        generate_docx(p)

    for p in pdf_paths:
        generate_pdf(p)

    print("\nAll submission DOCX and PDF documents successfully generated!")
