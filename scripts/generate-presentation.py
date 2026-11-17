import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    # 16:9 widescreen
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # Brand Colors
    C_FOREST = RGBColor(22, 58, 53)      # #163A35
    C_LIME = RGBColor(183, 216, 107)     # #B7D86B
    C_CREAM = RGBColor(247, 245, 239)    # #F7F5EF
    C_TERRACOTTA = RGBColor(198, 106, 69)# #C66A45
    C_DARK = RGBColor(16, 31, 28)        # #101F1C
    C_CARD = RGBColor(26, 45, 40)        # #1A2D28
    C_TEXT_LIGHT = RGBColor(244, 245, 238)
    C_MUTED = RGBColor(160, 175, 168)
    C_WHITE = RGBColor(255, 255, 255)

    blank_layout = prs.slide_layouts[6]

    def add_bg(slide, color):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = color
        bg.line.fill.background()
        return bg

    def add_header(slide, title_text, category_text, dark=False):
        # Header category tag
        tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.7), Inches(0.4))
        tf_tag = tag_box.text_frame
        tf_tag.word_wrap = True
        p_tag = tf_tag.paragraphs[0]
        p_tag.text = category_text.upper()
        p_tag.font.size = Pt(11)
        p_tag.font.bold = True
        p_tag.font.color.rgb = C_LIME if dark else C_TERRACOTTA

        # Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.85), Inches(11.7), Inches(0.8))
        tf = title_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title_text
        p.font.size = Pt(28)
        p.font.bold = True
        p.font.color.rgb = C_TEXT_LIGHT if dark else C_FOREST

    def add_card(slide, left, top, width, height, bg_color, border_color=None):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        if border_color:
            card.line.color.rgb = border_color
            card.line.width = Pt(1.5)
        else:
            card.line.fill.background()
        return card

    # ==========================================
    # SLIDE 1: Title & Introduction
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    add_bg(s1, C_FOREST)

    # Accent decorative banner
    banner = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(0.4), Inches(7.5))
    banner.fill.solid()
    banner.fill.fore_color.rgb = C_LIME
    banner.line.fill.background()

    # Title Box
    t_box = s1.shapes.add_textbox(Inches(1.2), Inches(1.5), Inches(11.0), Inches(2.2))
    tf1 = t_box.text_frame
    tf1.word_wrap = True
    
    p_tag = tf1.paragraphs[0]
    p_tag.text = "NEXT-GEN WORKFORCE & RETAIL OPERATING PLATFORM"
    p_tag.font.size = Pt(13)
    p_tag.font.bold = True
    p_tag.font.color.rgb = C_LIME

    p_title = tf1.add_paragraph()
    p_title.text = "KaamSetu (कामसेतु)"
    p_title.font.size = Pt(54)
    p_title.font.bold = True
    p_title.font.color.rgb = C_WHITE

    p_sub = tf1.add_paragraph()
    p_sub.text = "Bridging India's Daily-Wage Workers & Local Businesses into One Trusted Ecosystem"
    p_sub.font.size = Pt(20)
    p_sub.font.color.rgb = C_CREAM

    # Cards for Meta Info
    card1 = add_card(s1, Inches(1.2), Inches(4.3), Inches(3.4), Inches(2.3), C_CARD, C_LIME)
    tf_c1 = card1.text_frame
    tf_c1.word_wrap = True
    p = tf_c1.paragraphs[0]
    p.text = "TEAM DETAILS"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_LIME
    p2 = tf_c1.add_paragraph()
    p2.text = "Team: Team KaamSetu\nTrack: Full-Stack Innovation\nDomain: Social Impact & MSME SaaS"
    p2.font.size = Pt(13)
    p2.font.color.rgb = C_TEXT_LIGHT

    card2 = add_card(s1, Inches(4.9), Inches(4.3), Inches(3.6), Inches(2.3), C_CARD)
    tf_c2 = card2.text_frame
    tf_c2.word_wrap = True
    p = tf_c2.paragraphs[0]
    p.text = "CORE MISSION"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_LIME
    p2 = tf_c2.add_paragraph()
    p2.text = "Empowering 400M+ informal laborers with dignified, verified work while digitizing 60M+ Kiranas with modern billing, attendance, and ledger tools."
    p2.font.size = Pt(13)
    p2.font.color.rgb = C_TEXT_LIGHT

    card3 = add_card(s1, Inches(8.8), Inches(4.3), Inches(3.4), Inches(2.3), C_CARD)
    tf_c3 = card3.text_frame
    tf_c3.word_wrap = True
    p = tf_c3.paragraphs[0]
    p.text = "KEY PILLARS"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_LIME
    p2 = tf_c3.add_paragraph()
    p2.text = "• Transparent Work Lifecycle\n• Digital Attendance & Wages\n• POS Billing & Udhaar Ledger\n• Two-Way Trust & Reputation"
    p2.font.size = Pt(13)
    p2.font.color.rgb = C_TEXT_LIGHT

    # ==========================================
    # SLIDE 2: Problem Statement
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    add_bg(s2, C_CREAM)
    add_header(s2, "The Dual Crisis in India's Informal Economy", "Slide 2: Problem Statement")

    # Worker Side Problem Card
    c_w = add_card(s2, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0), C_WHITE, RGBColor(220, 225, 220))
    tf_w = c_w.text_frame
    tf_w.word_wrap = True
    p = tf_w.paragraphs[0]
    p.text = "THE WORKER DILEMMA (400M+ Workforce)"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = C_TERRACOTTA

    items_w = [
        ("Unreliable Job Discovery:", "Workers gather at physical labor nakas daily with zero income guarantees and severe middleman exploitation."),
        ("Wage Insecurity & Wage Theft:", "Informal verbal agreements frequently result in delayed payments, unilateral cuts, or total non-payment."),
        ("Unrecorded Working Hours:", "No formal log of check-in, check-out, or overtime hours leads to disputes and unfair treatment."),
        ("Zero Digital Financial Identity:", "Because work history and wages are unrecorded, workers remain excluded from formal banking, loans, and credit.")
    ]
    for title, desc in items_w:
        p = tf_w.add_paragraph()
        p.text = f"• {title} {desc}"
        p.font.size = Pt(12)
        p.font.color.rgb = RGBColor(40, 50, 45)

    # Employer / Kirana Problem Card
    c_e = add_card(s2, Inches(6.9), Inches(1.8), Inches(5.6), Inches(5.0), C_WHITE, RGBColor(220, 225, 220))
    tf_e = c_e.text_frame
    tf_e.word_wrap = True
    p = tf_e.paragraphs[0]
    p.text = "THE SHOPKEEPER / MSME STRUGGLE (60M+ Stores)"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = C_FOREST

    items_e = [
        ("Unreliable Staffing & Hiring:", "Shopkeepers and contractors struggle to find verified, skilled helpers and masons on short notice."),
        ("Paper-Based Udhaar Defaults:", "Over ₹3 Lakh Cr locked in traditional paper Khata books; manual follow-ups cause customer friction and bad debts."),
        ("Fragmented Operations:", "Kiranas juggle separate paper diaries for stock, supplier bills, customer credit, and daily worker wages."),
        ("Language & Complexity Barriers:", "Existing enterprise SaaS tools are overly complex, English-only, and ignore hyper-local Indian workflows.")
    ]
    for title, desc in items_e:
        p = tf_e.add_paragraph()
        p.text = f"• {title} {desc}"
        p.font.size = Pt(12)
        p.font.color.rgb = RGBColor(40, 50, 45)

    # ==========================================
    # SLIDE 3: Proposed Solution
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    add_bg(s3, C_CREAM)
    add_header(s3, "KaamSetu: The Unified Two-Sided Operating Platform", "Slide 3: Proposed Solution")

    # 3 Solution Pillars
    sol_cards = [
        (
            "FOR DAILY WORKERS",
            C_LIME,
            C_FOREST,
            [
                ("Transparent Job Hub:", "Bilingual job discovery with verified wages, task descriptions, and location filters."),
                ("Digital Attendance:", "Tamper-proof daily check-in / check-out timestamps with supervisor verification."),
                ("Protected Wage Ledger:", "Clear tracking of agreed wages, partial advances, and pending balances."),
                ("Portable Reputation:", "Verified 5-star rating profile based on completed assignments to unlock higher wages.")
            ]
        ),
        (
            "FOR SHOPKEEPERS / MSMES",
            C_FOREST,
            C_WHITE,
            [
                ("Work Assignment System:", "Instantly convert applicants or select workers into scheduled assignments with clear tasks."),
                ("Unified POS & Stock:", "Lightning-fast billing with barcode lookup and auto-decrementing inventory."),
                ("Digital Udhaar Ledger:", "1-click credit recording with automated WhatsApp payment reminder links."),
                ("P&L & Expense Tracking:", "Supplier purchase invoices and categorized business expenses to measure true gross & net profit.")
            ]
        ),
        (
            "FOR PLATFORM GOVERNANCE",
            C_TERRACOTTA,
            C_WHITE,
            [
                ("Admin Moderation:", "Platform-wide user, business, and job moderation to eliminate fraudulent postings."),
                ("Trust & Verification:", "Official government ID and skill certification approval workflows."),
                ("Dispute Arbitration:", "Dedicated grievance channel for wage disputes and unfair work conditions."),
                ("Data Telemetry:", "Real-time analytics and CSV reporting on economic activity across regions.")
            ]
        )
    ]

    for idx, (title, color_top, text_color, bullets) in enumerate(sol_cards):
        cx = Inches(0.8 + idx * 4.0)
        card = add_card(s3, cx, Inches(1.8), Inches(3.7), Inches(5.0), C_WHITE, RGBColor(210, 215, 210))
        
        # Header banner inside card
        inner_top = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, cx, Inches(1.8), Inches(3.7), Inches(0.6))
        inner_top.fill.solid()
        inner_top.fill.fore_color.rgb = color_top
        inner_top.line.fill.background()
        tf_it = inner_top.text_frame
        p = tf_it.paragraphs[0]
        p.text = title
        p.alignment = PP_ALIGN.CENTER
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = text_color

        tf_body = s3.shapes.add_textbox(cx + Inches(0.2), Inches(2.5), Inches(3.3), Inches(4.1)).text_frame
        tf_body.word_wrap = True
        for b_title, b_desc in bullets:
            p = tf_body.add_paragraph() if tf_body.paragraphs[0].text else tf_body.paragraphs[0]
            p.text = f"• {b_title} {b_desc}"
            p.font.size = Pt(11.5)
            p.font.color.rgb = RGBColor(40, 50, 45)

    # ==========================================
    # SLIDE 4: Technology Stack
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    add_bg(s4, C_DARK)
    add_header(s4, "Enterprise-Grade Architecture & Technology Stack", "Slide 4: Technology Stack", dark=True)

    tech_columns = [
        (
            "FRONTEND & CLIENT",
            C_LIME,
            [
                ("Next.js 16 (App Router):", "Server Components & Turbopack engine for ultra-low latency rendering."),
                ("React 19 & TypeScript:", "Modern hooks, concurrent rendering, and strict compile-time type safety."),
                ("Tailwind CSS v4:", "Native CSS token design system with Forest Green & Warm Cream brand identity."),
                ("Lucide Icons & UI Shell:", "Responsive, accessible interface tailored for mobile web and desktop.")
            ]
        ),
        (
            "BACKEND & DATA ENGINE",
            C_LIME,
            [
                ("PostgreSQL 17 (Neon):", "Serverless relational database with ACID compliance and connection pooling."),
                ("Prisma ORM (v6.4):", "Type-safe database queries with multi-model transactions and audit trails."),
                ("Exact Decimal Math:", "Strict 2-decimal paisa precision for financial ledger and wage accounting."),
                ("REST API Endpoints:", "Strict Zod-validated payloads with structured error handling.")
            ]
        ),
        (
            "SECURITY & AUTH",
            C_TERRACOTTA,
            [
                ("HTTP-Only Cookies:", "Secure JWT token delivery immune to client-side XSS exploitation."),
                ("Bcrypt Password Hashing:", "Salted high-cost password derivation preventing credential leaks."),
                ("Tri-Role RBAC Matrix:", "Independent middleware and client guards for Worker, Merchant, and Admin."),
                ("Rate Limiting Engine:", "Token-bucket request limiter mitigating brute-force attacks.")
            ]
        ),
        (
            "AI & LOCALIZATION",
            C_TERRACOTTA,
            [
                ("Voice Quick Entry:", "Web Speech API integration for hands-free voice billing in busy shops."),
                ("Bilingual Localization:", "100% complete English & Hindi translation dictionaries for universal adoption."),
                ("WhatsApp Automation:", "Dynamic deep links for 1-click customer payment and wage reminders."),
                ("Telemetry & Auditing:", "Comprehensive CSV reporting and audit logs for administrative oversight.")
            ]
        )
    ]

    for idx, (title, tag_color, bullets) in enumerate(tech_columns):
        cx = Inches(0.8 + idx * 3.0)
        c = add_card(s4, cx, Inches(1.8), Inches(2.8), Inches(5.0), C_CARD, RGBColor(40, 65, 58))
        tf = c.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = tag_color

        for b_title, b_desc in bullets:
            p = tf.add_paragraph()
            p.text = f"\n▸ {b_title}\n  {b_desc}"
            p.font.size = Pt(10.5)
            p.font.color.rgb = C_TEXT_LIGHT

    # ==========================================
    # SLIDE 5: Implementation & Features
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    add_bg(s5, C_CREAM)
    add_header(s5, "Working Model & High-Impact Feature Implementation", "Slide 5: Implementation & Features")

    features = [
        (
            "1. COMPLETE WORK LIFECYCLE",
            "Job Posted → Worker Applies → Merchant Accepts → Work Assignment Scheduled with Task Brief → Daily Attendance → Verified Wage Settlement → 2-Way Reviews.",
            "Eliminates verbal ambiguity and guarantees payment accountability for informal labor."
        ),
        (
            "2. DIGITAL ATTENDANCE SYSTEM",
            "Daily check-in / check-out logging with automatic working hours computation (e.g. 9 hrs logged). Unique daily constraints prevent double-punching.",
            "Employer audit trail with one-click verification and attendance history."
        ),
        (
            "3. POS BILLING & UDHAAR LEDGER",
            "Full barcode-supported Point of Sale billing with live stock deduction. Digital credit book records customer Udhaar with instant WhatsApp reminder links.",
            "Over 40% improvement in customer credit recovery times."
        ),
        (
            "4. SUPPLIER & P&L ACCOUNTING",
            "Wholesale supplier purchase orders automatically replenish stock. Operating expenses (rent, electricity) tracked to calculate Gross and Net Profit.",
            "Real-time financial clarity previously unavailable to small shopkeepers."
        ),
        (
            "5. TRUST, REPUTATION & SAFETY",
            "Government ID and skill certificate verification with Admin approval. Confidential dispute filing system for wage and safety grievances.",
            "Transforms invisible manual workers into trusted, verified professionals."
        )
    ]

    for idx, (f_title, f_desc, f_imp) in enumerate(features):
        top_pos = Inches(1.7 + idx * 1.05)
        card = add_card(s5, Inches(0.8), top_pos, Inches(11.7), Inches(0.95), C_WHITE, RGBColor(220, 225, 220))
        tf = card.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = f_title
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = C_FOREST

        p2 = tf.add_paragraph()
        p2.text = f"Workflow: {f_desc} | Impact: {f_imp}"
        p2.font.size = Pt(11)
        p2.font.color.rgb = RGBColor(60, 75, 70)

    # ==========================================
    # SLIDE 6: Innovation & Impact
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    add_bg(s6, C_CREAM)
    add_header(s6, "Innovation, Uniqueness & Tangible Social Impact", "Slide 6: Innovation & Impact")

    # Innovation Column
    c_inno = add_card(s6, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0), C_WHITE, RGBColor(220, 225, 220))
    tf_i = c_inno.text_frame
    tf_i.word_wrap = True
    p = tf_i.paragraphs[0]
    p.text = "WHAT MAKES KAAMSETU UNIQUE"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = C_FOREST

    inno_points = [
        ("Dual-Sided Economic Bridge:", "Unlike generic job boards (which ignore merchant needs) or Kirana apps (which ignore labor), KaamSetu connects both sides in a single ecosystem."),
        ("Voice-First Indian Accessibility:", "Voice Quick Entry and 100% Hindi/English localization enable low-literacy shopkeepers and workers to operate effortlessly."),
        ("Zero-Hardware Digital Attendance:", "Provides enterprise-grade attendance and wage tracking using ordinary smartphones with no biometric hardware costs."),
        ("Formal Financial Inclusion:", "Converts informal cash work into an immutable, verifiable digital record of earnings and reliability.")
    ]
    for title, desc in inno_points:
        p = tf_i.add_paragraph()
        p.text = f"★ {title}\n   {desc}\n"
        p.font.size = Pt(11)
        p.font.color.rgb = RGBColor(30, 45, 40)

    # Impact Column
    c_imp = add_card(s6, Inches(6.9), Inches(1.8), Inches(5.6), Inches(5.0), C_FOREST)
    tf_m = c_imp.text_frame
    tf_m.word_wrap = True
    p = tf_m.paragraphs[0]
    p.text = "REAL-WORLD IMPACT & METRICS"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = C_LIME

    impact_points = [
        ("100% Transparency in Wage Payouts:", "Zero wage withholding or disputes through digital agreement and attendance verification."),
        ("40%+ Reduction in Udhaar Defaults:", "Automated WhatsApp payment reminder links accelerate credit recovery for Kirana owners."),
        ("Portable Employment Credentials:", "Workers carry their verified reviews and attendance ratings anywhere, breaking generational exploitation."),
        ("Full P&L Visibility for MSMEs:", "Shop owners gain instant insights into daily sales, inventory levels, supplier invoices, and net profitability.")
    ]
    for title, desc in impact_points:
        p = tf_m.add_paragraph()
        p.text = f"✔ {title}\n   {desc}\n"
        p.font.size = Pt(11)
        p.font.color.rgb = C_TEXT_LIGHT

    # ==========================================
    # SLIDE 7: Future Scope
    # ==========================================
    s7 = prs.slides.add_slide(blank_layout)
    add_bg(s7, C_DARK)
    add_header(s7, "Future Roadmap: Scaling India's Informal Economy", "Slide 7: Future Scope & Roadmap", dark=True)

    future_cards = [
        (
            "PHASE 1: MULTI-LINGUAL VOICE AI",
            C_LIME,
            "Integrate generative AI speech models supporting 8+ regional Indian languages (Gujarati, Tamil, Bengali, Marathi) for conversational job matching and voice invoicing."
        ),
        (
            "PHASE 2: WHATSAPP BOT WORKFLOWS",
            C_LIME,
            "Deploy an interactive WhatsApp Bot allowing feature-phone workers to receive job alerts, accept assignments, and check in via simple SMS/WhatsApp prompts."
        ),
        (
            "PHASE 3: UPI ESCROW & MICRO-FINANCE",
            C_TERRACOTTA,
            "Introduce smart UPI Auto-Escrow where employers pre-fund wages, releasing automatically upon confirmed attendance, plus micro-insurance and daily-wage credit lines."
        ),
        (
            "PHASE 4: ONDC & DIGILOCKER INTEGRATION",
            C_TERRACOTTA,
            "Connect KaamSetu with the Open Network for Digital Commerce (ONDC) for retail logistics and DigiLocker for instant Aadhaar/e-KYC verification."
        )
    ]

    for idx, (title, color_tag, desc) in enumerate(future_cards):
        row = idx // 2
        col = idx % 2
        cx = Inches(0.8 + col * 5.9)
        cy = Inches(1.8 + row * 2.5)

        c = add_card(s7, cx, cy, Inches(5.6), Inches(2.2), C_CARD, RGBColor(50, 75, 68))
        tf = c.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = color_tag

        p2 = tf.add_paragraph()
        p2.text = f"\n{desc}"
        p2.font.size = Pt(12)
        p2.font.color.rgb = C_TEXT_LIGHT

    # Save presentation
    output_path = "KaamSetu_Presentation.pptx"
    prs.save(output_path)
    print(f"Presentation saved successfully to {output_path}")

if __name__ == "__main__":
    create_deck()
