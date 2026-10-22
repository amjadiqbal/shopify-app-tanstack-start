"""Generate the SVG art for shopify-app-tanstack-start. Run: python3 gen.py, then render.sh."""

from pathlib import Path

HERE = Path(__file__).parent
SANS = "Inter, -apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
MONO = "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace"

DEFS = """  <defs>
    <linearGradient id="ibg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0F172A"/>
      <stop offset="1" stop-color="#0B1220"/>
    </linearGradient>
    <linearGradient id="acc" gradientUnits="userSpaceOnUse" x1="120" y1="160" x2="440" y2="440">
      <stop offset="0" stop-color="#F9A8D4"/>
      <stop offset="1" stop-color="#EC4899"/>
    </linearGradient>
  </defs>
"""

# Icon body on a 512 canvas: the Shopify admin window, the embedded app frame inside it carrying a
# signed session token (three JWT segments), and a shield check where the request is verified.
ICON_BODY = """  <!-- admin window -->
  <rect x="78" y="104" width="340" height="276" rx="30" fill="#111C33" stroke="#475569" stroke-width="14"/>
  <path d="M78 156 H418" stroke="#475569" stroke-width="12"/>
  <circle cx="114" cy="130" r="9" fill="#64748B"/><circle cx="142" cy="130" r="9" fill="#64748B"/><circle cx="170" cy="130" r="9" fill="#64748B"/>
  <!-- embedded app frame -->
  <rect x="122" y="192" width="252" height="148" rx="20" fill="#0B1220" stroke="url(#acc)" stroke-width="16"/>
  <!-- session token: header.payload.signature -->
  <rect x="156" y="252" width="44" height="26" rx="13" fill="#94A3B8"/>
  <circle cx="214" cy="265" r="6" fill="#F9A8D4"/>
  <rect x="228" y="252" width="64" height="26" rx="13" fill="#CBD5E1"/>
  <circle cx="306" cy="265" r="6" fill="#F9A8D4"/>
  <rect x="320" y="252" width="22" height="26" rx="11" fill="#EC4899"/>
  <!-- verified -->
  <path d="M400 312 L462 336 V384 C462 424 436 450 400 466 C364 450 338 424 338 384 V336 Z" fill="url(#acc)" stroke="#0B1220" stroke-width="12" stroke-linejoin="round"/>
  <path d="M374 390 L394 410 L428 372" fill="none" stroke="#0B1220" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
"""


def icon(framed: bool) -> str:
    bg = (
        '<rect x="3" y="3" width="506" height="506" rx="110" fill="url(#ibg)" stroke="#24314D" stroke-width="6"/>'
        if framed
        else '<rect width="512" height="512" rx="112" fill="url(#ibg)"/>'
    )
    return f"  {bg}\n{ICON_BODY}"


def write(name: str, svg: str) -> None:
    (HERE / name).write_text(svg)


write(
    "icon.svg",
    f'<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">\n{DEFS}{icon(True)}</svg>\n',
)


def banner(dark: bool) -> str:
    bg, dot, title, sub, accent, chip_bg, chip_stroke, chip_text = (
        ("#0B1220", "#1A2540", "#F8FAFC", "#CBD5E1", "#F472B6", "#111C33", "#1E2A44", "#CBD5E1")
        if dark
        else ("#F8FAFC", "#E2E8F0", "#0F172A", "#334155", "#DB2777", "#FFFFFF", "#E2E8F0", "#334155")
    )
    chips = [
        (292, 190, "for TanStack Start", accent),
        (494, 290, "session tokens + token exchange", chip_text),
        (796, 270, "mirrors the React Router kit", chip_text),
    ]
    chip_svg = "\n".join(
        f'    <rect x="{x}" y="204" width="{w}" height="36" rx="18" fill="{chip_bg}" stroke="{chip_stroke}"/>'
        f'<text x="{x + w / 2:g}" y="228" text-anchor="middle" fill="{c}">{t}</text>'
        for x, w, t, c in chips
    )
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="300" viewBox="0 0 1200 300">
{DEFS}  <defs><pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="{dot}"/></pattern></defs>
  <rect width="1200" height="300" fill="{bg}"/>
  <rect x="800" width="400" height="300" fill="url(#dots)"/>
  <g transform="translate(56 50) scale(0.390625)">
{icon(dark)}  </g>
  <text x="290" y="122" font-family="{SANS}" font-size="54" font-weight="800" fill="{title}" letter-spacing="-1.5">shopify-app-tanstack-start</text>
  <text x="292" y="170" font-family="{SANS}" font-size="24" font-weight="500" fill="{sub}">Embedded Shopify apps on <tspan fill="{accent}" font-weight="600">TanStack Start</tspan>: auth, webhooks, app proxy, billing</text>
  <g font-family="{SANS}" font-size="16" font-weight="600">
{chip_svg}
  </g>
  <text x="1170" y="280" text-anchor="end" font-family="{SANS}" font-size="13" font-weight="500" fill="#64748B">Community package. Not affiliated with or endorsed by Shopify.</text>
</svg>
"""


write("banner-dark.svg", banner(True))
write("banner-light.svg", banner(False))

KW = "#C4B5FD"
FN = "#F472B6"
STR = "#7DD3FC"
CMT = "#64748B"
code = [
    (112, 330, f'<tspan fill="{KW}">export const</tspan> loadProducts = <tspan fill="{FN}">createServerFn</tspan>()'),
    (137, 362, f'.<tspan fill="{FN}">middleware</tspan>([shopify.<tspan fill="{FN}">adminMiddleware</tspan>()])'),
    (137, 394, f'.<tspan fill="{FN}">handler</tspan>(<tspan fill="{KW}">async</tspan> ({{ context: {{ admin, session }} }}) =&gt; {{'),
    (162, 426, f'<tspan fill="{KW}">const</tspan> res = <tspan fill="{KW}">await</tspan> admin.<tspan fill="{FN}">graphql</tspan>(<tspan fill="{STR}">`{{ products(first: 5) {{ … }} }}`</tspan>)'),
    (162, 458, f'<tspan fill="{KW}">return</tspan> res.<tspan fill="{FN}">json</tspan>() <tspan dx="12" fill="{CMT}">// session token verified, offline token exchanged</tspan>'),
    (137, 490, "})"),
]
code_svg = "\n".join(f'    <text x="{x}" y="{y}">{t}</text>' for x, y, t in code)

write(
    "social-preview.svg",
    f"""<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="640" viewBox="0 0 1280 640">
{DEFS}  <defs><pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.6" fill="#1A2540"/></pattern></defs>
  <rect width="1280" height="640" fill="#0B1220"/>
  <rect width="1280" height="640" fill="url(#dots)"/>
  <g transform="translate(80 64) scale(0.3125)">
{icon(True)}  </g>
  <text x="270" y="132" font-family="{SANS}" font-size="60" font-weight="800" fill="#F8FAFC" letter-spacing="-1.8">shopify-app-tanstack-start</text>
  <text x="272" y="186" font-family="{SANS}" font-size="27" font-weight="500" fill="#CBD5E1">Embedded Shopify apps on <tspan fill="#F472B6" font-weight="600">TanStack Start</tspan>: auth, webhooks, app proxy, billing</text>
  <rect x="80" y="252" width="1120" height="282" rx="20" fill="#0F172A" stroke="#1E2A44" stroke-width="2"/>
  <circle cx="112" cy="282" r="7" fill="#334155"/><circle cx="136" cy="282" r="7" fill="#334155"/><circle cx="160" cy="282" r="7" fill="#334155"/>
  <g font-family="{MONO}" font-size="21" fill="#E2E8F0" xml:space="preserve">
{code_svg}
  </g>
  <g font-family="{SANS}" font-size="20" font-weight="600">
    <text x="80" y="590" fill="#F472B6">npm i @amjadiqbal/shopify-app-tanstack-start</text>
    <text x="1200" y="590" text-anchor="end" fill="#94A3B8">built on @shopify/shopify-api · not affiliated with Shopify</text>
  </g>
</svg>
""",
)
