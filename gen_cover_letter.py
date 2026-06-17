from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
import os

# ── Colors (matching the website) ───────────────────────────────────────────
BG         = HexColor("#0a1628")
SURFACE    = HexColor("#142845")
TEAL       = HexColor("#2dd4bf")
TEAL_SOFT  = HexColor("#1a3d3a")   # muted teal fill for divider area
TEXT_STRONG = HexColor("#ffffff")
TEXT_MUTED  = HexColor("#cbd5e1")
TEXT_DIM    = HexColor("#b0c1d4")
BORDER     = HexColor("#1a3358")

# ── Register Playfair Display ────────────────────────────────────────────────
FONT_DIR = os.path.expanduser("~/Library/Fonts")
pdfmetrics.registerFont(TTFont("Playfair", f"{FONT_DIR}/PlayfairDisplayRegular-ywLOY.ttf"))
pdfmetrics.registerFont(TTFont("Playfair-SemiBold", f"{FONT_DIR}/PlayfairDisplaySemibold-lg9nd.ttf"))

# ── Document setup ───────────────────────────────────────────────────────────
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cover-letter-render.pdf")
W, H = letter        # 612 x 792 pt
MARGIN = 0.85 * inch
CONTENT_W = W - 2 * MARGIN

c = canvas.Canvas(OUT, pagesize=letter)
c.setTitle("Cover Letter – Britt Welch")
c.setAuthor("Brittany Welch")

# ── Full-page dark background ────────────────────────────────────────────────
c.setFillColor(BG)
c.rect(0, 0, W, H, fill=1, stroke=0)

# ── Subtle top accent bar ────────────────────────────────────────────────────
c.setFillColor(TEAL)
c.rect(0, H - 4, W, 4, fill=1, stroke=0)

# ── Header area background ───────────────────────────────────────────────────
HEADER_H = 1.05 * inch
c.setFillColor(SURFACE)
c.rect(0, H - 4 - HEADER_H, W, HEADER_H, fill=1, stroke=0)

# Logo: "b." in white + teal dot
LOGO_Y = H - 4 - HEADER_H + (HEADER_H / 2)
c.setFont("Playfair-SemiBold", 28)
c.setFillColor(TEXT_STRONG)
c.drawString(MARGIN, LOGO_Y - 9, "b")
dot_x = MARGIN + c.stringWidth("b", "Playfair-SemiBold", 28)
c.setFillColor(TEAL)
c.drawString(dot_x, LOGO_Y - 9, ".")

# Tagline on the right
c.setFont("Helvetica", 9.5)
c.setFillColor(TEXT_DIM)
tagline = "brittany welch  ·  ui/ux designer"
c.drawRightString(W - MARGIN, LOGO_Y - 4, tagline)

# ── Teal divider line below header ──────────────────────────────────────────
DIV_Y = H - 4 - HEADER_H - 1
c.setStrokeColor(TEAL)
c.setLineWidth(0.8)
c.line(MARGIN, DIV_Y, W - MARGIN, DIV_Y)

# ── Helper: wrapped text block ───────────────────────────────────────────────
def draw_wrapped(c, text, x, y, max_w, font, size, color, line_h):
    c.setFont(font, size)
    c.setFillColor(color)
    words = text.split()
    line = ""
    for word in words:
        test = (line + " " + word).strip()
        if c.stringWidth(test, font, size) <= max_w:
            line = test
        else:
            c.drawString(x, y, line)
            y -= line_h
            line = word
    if line:
        c.drawString(x, y, line)
        y -= line_h
    return y

# ── Body content ─────────────────────────────────────────────────────────────
y = DIV_Y - 0.45 * inch

# Subject line (eyebrow style)
c.setFont("Helvetica-Bold", 8)
c.setFillColor(TEAL)
c.drawString(MARGIN, y, "COVER LETTER")

# Teal eyebrow rule
ew = c.stringWidth("COVER LETTER", "Helvetica-Bold", 8)
c.setStrokeColor(TEAL)
c.setLineWidth(0.6)
c.line(MARGIN + ew + 8, y + 3, MARGIN + ew + 32, y + 3)

y -= 0.3 * inch

# Subject heading
c.setFont("Playfair-SemiBold", 22)
c.setFillColor(TEXT_STRONG)
c.drawString(MARGIN, y, "Staff Design Engineer")

y -= 0.22 * inch
c.setFont("Helvetica", 10)
c.setFillColor(TEXT_DIM)
c.drawString(MARGIN, y, "Render  ·  June 2026")

y -= 0.48 * inch

# Horizontal rule
c.setStrokeColor(BORDER)
c.setLineWidth(0.5)
c.line(MARGIN, y, W - MARGIN, y)
y -= 0.38 * inch

# Body paragraphs
BODY_FONT = "Helvetica"
BODY_FONT_BOLD = "Helvetica-Bold"
BODY_SIZE = 10.5
LINE_H = 16
PARA_GAP = 10

salutation = "Hi Render team,"
c.setFont(BODY_FONT_BOLD, BODY_SIZE)
c.setFillColor(TEXT_STRONG)
c.drawString(MARGIN, y, salutation)
y -= LINE_H + PARA_GAP

paragraphs = [
    "I've spent 17 years in product design, and the work I'm proudest of has always been where design and engineering overlap. Not handing things off, but building them myself. That's why this role caught my attention.",
    "My background is genuinely hybrid. I've shipped frontend code alongside design work and spent years in complex, data-heavy products where the gap between a comp and a working interface is where things go sideways. Closing that gap isn't a workaround for me, it's just how I work.",
    "I've also spent the last few years consulting on AI-native product design, which has sharpened how I think about developer-facing tools. Technical users lose trust fast when an interface feels sloppy. Render's focus on craft and clear mental models for complex systems is exactly the kind of work I want to be doing.",
    "On React and TypeScript, I have a solid working foundation and I grow quickly into a codebase. I won't pretend to know every tool on your stack, but I care deeply about what ships and I've never treated the code as someone else's problem.",
    "Would love to connect.",
]

for para in paragraphs:
    y = draw_wrapped(c, para, MARGIN, y, CONTENT_W, BODY_FONT, BODY_SIZE, TEXT_MUTED, LINE_H)
    y -= PARA_GAP

# Sign-off
y -= 4
c.setFont(BODY_FONT, BODY_SIZE)
c.setFillColor(TEXT_MUTED)
c.drawString(MARGIN, y, "Warmly,")
y -= LINE_H + 6

c.setFont("Playfair-SemiBold", 16)
c.setFillColor(TEXT_STRONG)
c.drawString(MARGIN, y, "Britt Welch")
y -= 18

# Teal accent line under name
c.setStrokeColor(TEAL)
c.setLineWidth(1.5)
c.line(MARGIN, y, MARGIN + 80, y)
y -= 14

c.setFont("Helvetica", 9)
c.setFillColor(TEXT_DIM)
c.drawString(MARGIN, y, "bwelch.me  ·  blrwelch@gmail.com")

# ── Footer ───────────────────────────────────────────────────────────────────
FOOT_Y = 0.45 * inch
c.setFillColor(SURFACE)
c.rect(0, 0, W, FOOT_Y + 0.05 * inch, fill=1, stroke=0)
c.setStrokeColor(TEAL)
c.setLineWidth(0.5)
c.line(MARGIN, FOOT_Y + 0.05 * inch, W - MARGIN, FOOT_Y + 0.05 * inch)
c.setFont("Helvetica", 8)
c.setFillColor(TEXT_DIM)
c.drawCentredString(W / 2, FOOT_Y - 0.08 * inch, "© 2026 Brittany Welch  ·  Brandon, MS")

c.save()
print(f"Saved: {OUT}")
