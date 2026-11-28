"""Build the private Sky Harbour study from the checked-in, reproducible models."""
from pathlib import Path
from html import escape
import json
import re
import subprocess
import tempfile
import zipfile

root = Path(__file__).resolve().parents[1]
target = root / "public" / "internal-studies"
target.mkdir(exist_ok=True)
style = """*{box-sizing:border-box}body{margin:0;color:#183b2d;background:#fafbf6;font:16px/1.6 system-ui,sans-serif}main{max-width:1120px;margin:auto;padding:32px clamp(18px,5vw,64px) 90px}h1,h2,h3{font-family:Georgia,serif;font-weight:normal;line-height:1.13}h1{font-size:clamp(40px,6vw,72px);margin:.45em 0}h2{font-size:32px;margin:1.4em 0 .4em}p{max-width:78ch}a{color:#245940;text-underline-offset:4px}details{margin:16px 0;border-top:1px solid #bbcabb;padding:16px 0}summary{font-weight:650;cursor:pointer}.scroll{overflow-x:auto}table{border-collapse:collapse;font-size:14px;width:100%;margin:18px 0}th,td{text-align:left;vertical-align:top;border-bottom:1px solid #d3ded3;padding:8px}th{background:#eaf0e6}.bars{display:grid;grid-template-columns:1fr 1fr;gap:24px}.bar{height:8px;background:#528765;border-radius:3px;margin-bottom:12px}.bars article{padding:20px;background:#eaf0e6}.bars h3{margin:0 0 12px;font-size:22px}.bars p{display:flex;justify-content:space-between;margin:0;font-size:14px}.buttons{display:flex;gap:24px;flex-wrap:wrap}.note{color:#526554}@media(max-width:650px){.bars{grid-template-columns:1fr}th,td{min-width:76px}}"""
def inline(text):
    value = escape(text)
    value = re.sub(r'https?://[^\s<>]+', lambda m: '<a href="'+m[0]+'">Source ↗</a>', value)
    return re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', value)
def document(path):
    html = []
    table = False
    for line in path.read_text().splitlines()+['']:
        if line.startswith('|'):
            cells = [c.strip() for c in line.strip('|').split('|')]
            if all(re.fullmatch(r'[-: ]+', c) for c in cells): continue
            tag = 'td' if table else 'th'
            if not table: html.append('<div class="scroll"><table>')
            table = True
            html.append('<tr>'+''.join(f'<{tag}>{inline(c)}</{tag}>' for c in cells)+'</tr>')
            continue
        if table: html.append('</table></div>'); table=False
        if not line or line.startswith('# '): continue
        if line.startswith('##'): html.append('<h3>'+inline(line.lstrip('# '))+'</h3>')
        else: html.append('<p>'+inline(line)+'</p>')
    return ''.join(html)

with tempfile.TemporaryDirectory() as temp:
    work=Path(temp)
    for folder in ['skyharbour','skyharbour-two-sites']:
        subprocess.run(['node',f'scripts/analyze-{folder}.mjs',str(work/folder)],cwd=root,check=True,stdout=subprocess.DEVNULL)
    two=work/'skyharbour-two-sites'
    stewart=work/'skyharbour'
    cases=json.loads((two/'results.json').read_text())['sites']
    bars=''
    for site in cases:
        bars+='<article><h3>'+escape(site['site']['code'])+'</h3>'
        for s in site['scenarios']:
            value=s['itMW']
            bars+=f'<p><span>{escape(s["name"])}</span><b>{value:.2f} MW</b></p><div class="bar" style="width:{value/6*100:.2f}%"></div>'
        bars+='</article>'
    page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sky Harbour · Nook site analysis</title><style>'''+style+'''</style><main><nav class="buttons"><a href="/portal#sky-harbour">← Sky Harbour workspace</a><a href="/site-files/models.zip">Download data and models</a></nav><h1>Sky Harbour</h1><p>Site capacity study · November 2026</p><h2>What could two hangar campuses support?</h2><p>With an assumed 10 MW service and a 6 MW host peak, both campuses have a strict baseline of <strong>3.04 MW IT</strong>. Storage helps most when peaks are brief and the battery can recharge between them. Both the weather and the site loads in these runs are synthetic.</p><h2>Modeled IT capacity</h2><p>Four-hour batteries sized at 10%, 25% and 50% of IT load. Each bar shows the largest IT load served on at least 99% of full UTC days. Up to three days can have a shortfall in this simulated year.</p><div class="bars">'''+bars+'''</div><h2>Sugar Land and Nashville</h2><p>Sugar Land (SGR) models seven hangars and a warm, humid climate. Nashville (BNA) models ten hangars, with documented gas heat in newer buildings. The original equipment estimates had to be scaled substantially to reach the assumed 6 MW peak. Actual interval data could materially change the result.</p>'''+document(two/'computed-results.md')+'''<details><summary>Campus research, operating assumptions, simulation and sources</summary>'''+document(two/'research-and-method.md')+'''</details><h2>Stewart · earlier sensitivity study</h2><p>Stewart was modeled as a future operating campus. The three heating and peak-duration profiles show how different load shapes affect storage value at the same service limit.</p>'''+document(stewart/'results.md')+'''<details><summary>Stewart research and source notes</summary>'''+document(stewart/'research.md')+'''</details><h2>Models and working files</h2><p>The download includes 15-minute load traces, hourly files for Sugar Land and Nashville, component and event records, importable project files, scenario comparisons, the Stewart economics sensitivities and interactive report.</p><a href="/site-files/models.zip">Download the full analysis (ZIP)</a></main></html>'''
    (target/'case.txt').write_text(page)
    with zipfile.ZipFile(target/'models.zip','w',zipfile.ZIP_DEFLATED) as z:
        for f in sorted(work.rglob('*')):
            if f.is_file(): z.write(f,f.relative_to(work))
        for folder in ['skyharbour','skyharbour-two-sites']:
            z.write(root/'examples'/folder/'generate.mjs',folder+'/generate.mjs')
