'use strict';
  const express = require('express');
  const path    = require('path');
  const app     = express();

  // ── Auth cache ──────────────────────────────────────────────────────────────
  let _cookie = null, _cookieExp = 0;

  async function auth(force = false) {
    if (!force && _cookie && Date.now() < _cookieExp) return _cookie;
    const res = await fetch('https://edge.gh2benefits.com/api/enterprise-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: process.env.GH2_EDGE_ACCESS_CODE }),
      redirect: 'manual'
    });
    const sc = res.headers.get('set-cookie');
    if (!sc) throw new Error('GH2 auth failed — no Set-Cookie returned');
    _cookie    = sc.split(';')[0];
    _cookieExp = Date.now() + 23 * 3_600_000;
    console.log('[GH2] auth cookie refreshed');
    return _cookie;
  }

  async function fetchFeed(url, retried = false) {
    const cookie = await auth();
    const r = await fetch(url, { headers: { Cookie: cookie }, redirect: 'manual' });
    if ((r.status === 302 || r.status === 401) && !retried) {
      _cookie = null; _cookieExp = 0;
      return fetchFeed(url, true);
    }
    if (!r.ok) throw new Error('Feed returned ' + r.status + ' for ' + url);
    return r.json();
  }

  // ── Shared UI ───────────────────────────────────────────────────────────────
  const NAV = [
    ['For Individuals',    '/individual.html'],
    ['How It Works',       '/how-it-works.html'],
    ['What Edge Shows',    '/what-edge-shows'],
    ['Institutional',      '/institutional'],
    ['Library',            '/library'],
    ['Contact',            '/contact.html'],
  ];

  function navHtml(active) {
    return '<header style="position:sticky;top:0;z-index:50;background:#FAFAF7;border-bottom:1px solid #141412;">' +
    '<nav style="max-width:1360px;margin:0 auto;padding:0 32px;height:64px;display:flex;align-items:center;justify-content:space-between;">' +
    '<a href="/" style="text-decoration:none;font-weight:700;font-size:17px;letter-spacing:0.02em;display:flex;align-items:center;gap:10px;">' +
    '<span style="width:11px;height:11px;background:#C43A1E;display:inline-block;"></span>GH2 EDGE</a>' +
    '<div style="display:flex;gap:28px;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;white-space:nowrap;align-items:center;">' +
    NAV.map(([label, href]) => {
      const cur = label.toLowerCase() === (active||'').toLowerCase();
      return '<a href="' + href + '" style="text-decoration:none;color:' + (cur ? '#C43A1E' : '#6B6B64') + ';">' + label + '</a>';
    }).join(' ') +
    '</div></nav></header>';
  }

  function page(title, active, body) {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} — GH2 EDGE</title>
  <style>
  *{box-sizing:border-box;}
  html{scroll-behavior:smooth;}
  body{margin:0;background:#FAFAF7;color:#141412;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;}
  a{color:inherit;}
  details>summary{list-style:none;cursor:pointer;}
  details>summary::-webkit-details-marker{display:none;}
  </style>
  </head>
  <body>
  ${navHtml(active)}
  ${body}
  <footer style="border-top:1px solid #141412;">
    <div style="max-width:1360px;margin:0 auto;padding:28px 32px;display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;font-size:13px;color:#6B6B64;">
      <div>GH2 EDGE · Patent Pending · Trade Secret</div>
      <div style="display:flex;gap:24px;align-items:center;">
        <a href="/video" style="color:#6B6B64;text-decoration:none;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;" onmouseover="this.style.color='#C43A1E'" onmouseout="this.style.color='#6B6B64'">Video</a>
        <span>Jae W. Oh, MBA, CFP® · GH2 Benefits LLC</span>
      </div>
    </div>
  </footer>
  </body>
  </html>`;
  }

  function errPage(title, msg) {
    return page(title, 'What Edge Shows',
      '<section style="max-width:1360px;margin:80px auto;padding:0 32px;">' +
      '<p style="color:#C43A1E;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;">Data unavailable</p>' +
      '<p style="font-size:18px;color:#6B6B64;margin-top:12px;">' + msg + '</p></section>');
  }

  function fmt$(n) {
    if (n == null) return 'n/a';
    return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  function fmtPct(n) {
    if (n == null) return 'n/a';
    return Number(n).toFixed(1) + '%';
  }
  function fmtGap(v) {
    if (v === '>=3000000' || v === '>= 3000000') return '\u2265 $3,000,000';
    if (v == null) return 'n/a';
    return fmt$(v);
  }

  // ── legacy HTML file redirects ───────────────────────────────────────────────
  app.get('/index.html', (_req, res) => res.redirect(301, '/'));
  app.get('/home.html',  (_req, res) => res.redirect(301, '/institutional'));

  // ── Root: gateway homepage ───────────────────────────────────────────────────
  app.get('/', (_req, res) => {
    const A = '#C43A1E';
    const body = `
<style>
  .gw-btn { cursor:pointer; padding:18px 48px; font-size:15px; letter-spacing:0.1em; text-transform:uppercase; user-select:none; border:none; font-family:inherit; transition:background 0.1s,color 0.1s; }
  .gw-btn-active  { background:#141412; color:#FAFAF7; }
  .gw-btn-inactive{ background:transparent; color:#141412; }
  .gw-btn-inactive:hover { background:#F1F0EA; }
  .gw-panel { display:none; text-align:center; gap:32px; justify-items:center; max-width:620px; }
  .gw-panel.active { display:grid; }
  .gw-cta { text-decoration:none; background:#141412; color:#FAFAF7; padding:20px 44px; font-size:15px; letter-spacing:0.06em; text-transform:uppercase; }
  .gw-cta:hover { background:${A}; }
</style>

<div style="min-height:100vh;display:grid;grid-template-rows:auto 1fr auto;">

  <!-- HEADER (no nav — gateway only) -->
  <header style="border-bottom:1px solid #141412;">
    <div style="max-width:1360px;margin:0 auto;padding:0 32px;height:64px;display:flex;align-items:center;justify-content:space-between;">
      <span style="font-weight:700;font-size:17px;letter-spacing:0.02em;display:flex;align-items:center;gap:10px;">
        <span style="width:11px;height:11px;background:${A};display:inline-block;"></span>
        GH2 EDGE
      </span>
      <span style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#6B6B64;">gettheedge.com</span>
    </div>
  </header>

  <!-- CENTER -->
  <main style="max-width:1360px;margin:0 auto;width:100%;box-sizing:border-box;padding:80px 32px;display:grid;align-content:center;justify-items:center;gap:56px;">

    <div style="text-align:center;display:grid;gap:28px;justify-items:center;">
      <p style="margin:0;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#6B6B64;">There is a right retirement answer</p>
      <h1 style="margin:0;font-size:clamp(44px,5.6vw,84px);line-height:1.0;letter-spacing:-0.03em;font-weight:700;max-width:16ch;text-wrap:balance;">Who is the answer for<span style="color:${A};">?</span></h1>
    </div>

    <!-- TOGGLE -->
    <div style="display:inline-flex;border:1px solid #141412;background:#FAFAF7;">
      <button id="btn-ind"  class="gw-btn gw-btn-active"   onclick="pick('individual')">Individual</button>
      <button id="btn-inst" class="gw-btn gw-btn-inactive" onclick="pick('institutional')">Institutional</button>
      <button id="btn-res"  class="gw-btn gw-btn-inactive" onclick="pick('research')">Research</button>
    </div>

    <!-- PANELS -->
    <div id="panel-individual" class="gw-panel active">
      <p style="margin:0;font-size:clamp(19px,1.9vw,26px);line-height:1.45;color:#141412;">You're approaching retirement — or already there. Social Security, Medicare, Roth conversions, taxes: your exact situation has already been solved.</p>
      <a href="/individual.html" class="gw-cta">Find your answer →</a>
    </div>

    <div id="panel-institutional" class="gw-panel">
      <p style="margin:0;font-size:clamp(19px,1.9vw,26px);line-height:1.45;color:#141412;">Broker/dealers, carriers, recordkeepers, asset managers: deliver the right answer for every household you serve — at scale.</p>
      <a href="/institutional" class="gw-cta">Explore the platform →</a>
    </div>

    <div id="panel-research" class="gw-panel">
      <p style="margin:0;font-size:clamp(19px,1.9vw,26px);line-height:1.45;color:#141412;">Live analysis from the EDGE engine. Three findings you can't get anywhere else — updated continuously from real household data.</p>
      <a href="/what-edge-shows" class="gw-cta">See the analysis →</a>
    </div>

  </main>

  <!-- FOOTER -->
  <footer style="border-top:1px solid #141412;">
    <div style="max-width:1360px;margin:0 auto;padding:28px 32px;display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;font-size:13px;color:#6B6B64;">
      <div>GH2 EDGE · Patent Pending · Trade Secret</div>
      <div style="display:flex;gap:24px;align-items:center;">
        <a href="/video" style="color:#6B6B64;text-decoration:none;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;" onmouseover="this.style.color='${A}'" onmouseout="this.style.color='#6B6B64'">Video</a>
        <span>Jae W. Oh, MBA, CFP® · GH2 Benefits LLC</span>
      </div>
    </div>
  </footer>

</div>

<script>
function pick(track) {
  ['individual','institutional','research'].forEach(function(t) {
    var isActive = (t === track);
    var btnId = t === 'individual' ? 'btn-ind' : t === 'institutional' ? 'btn-inst' : 'btn-res';
    document.getElementById(btnId).className = 'gw-btn ' + (isActive ? 'gw-btn-active' : 'gw-btn-inactive');
    var panel = document.getElementById('panel-' + t);
    if (isActive) { panel.classList.add('active'); }
    else          { panel.classList.remove('active'); }
  });
}
</script>`;

    // Gateway uses its own minimal header — bypass the page() nav wrapper
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>GH2 EDGE</title>
<style>
*{box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{margin:0;background:#FAFAF7;color:#141412;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;}
a{color:inherit;}
</style>
</head>
<body>${body}</body>
</html>`);
  });

  // ── Video page ───────────────────────────────────────────────────────────────
  app.get('/video', (_req, res) => {
    res.send(page('GH2 EDGE Video', '',
      '<section style="max-width:1360px;margin:0 auto;padding:64px 32px;">' +
      '<div style="font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#6B6B64;margin-bottom:32px;">GH2 EDGE\u2122 \u00b7 Cinematic Overview</div>' +
      '<div style="aspect-ratio:16/9;width:100%;background:#141412;border:1px solid #141412;overflow:hidden;">' +
      '<iframe src="http://localhost:3001" style="width:100%;height:100%;border:none;" allowfullscreen></iframe>' +
      '</div>' +
      '</section>'
    ));
  });

  // ── WHAT EDGE SHOWS master ──────────────────────────────────────────────────
  function card(num, label, href, headline, desc) {
    return '<a href="' + href + '" style="text-decoration:none;background:#FAFAF7;padding:48px 40px;display:block;">' +
    '<div style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#C43A1E;margin-bottom:20px;">' + num + ' · ' + label + '</div>' +
    '<h2 style="margin:0 0 20px;font-size:clamp(22px,2.2vw,32px);line-height:1.1;letter-spacing:-0.02em;font-weight:700;">' + headline + '</h2>' +
    '<p style="margin:0;font-size:16px;line-height:1.6;color:#6B6B64;">' + desc + '</p>' +
    '<div style="margin-top:32px;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;border-bottom:2px solid #C43A1E;display:inline-block;padding-bottom:3px;">See the analysis \u2192</div></a>';
  }

  function smallCard(num, label, href, headline, desc) {
    return '<a href="' + href + '" style="text-decoration:none;background:#FAFAF7;padding:32px 28px;display:block;border-bottom:1px solid #141412;">' +
    '<div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#C43A1E;margin-bottom:12px;">' + num + ' \u00b7 ' + label + '</div>' +
    '<h3 style="margin:0 0 12px;font-size:clamp(16px,1.4vw,20px);line-height:1.2;letter-spacing:-0.01em;font-weight:700;">' + headline + '</h3>' +
    '<p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:#6B6B64;">' + desc + '</p>' +
    '<div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;border-bottom:2px solid #C43A1E;display:inline-block;padding-bottom:3px;">See the analysis \u2192</div></a>';
  }

  app.get('/what-edge-shows', (_req, res) => {
    const masthead =
      '<section style="max-width:1360px;margin:0 auto;padding:64px 32px 40px;border-bottom:1px solid #141412;display:flex;align-items:baseline;justify-content:space-between;gap:32px;flex-wrap:wrap;">' +
      '<div style="display:flex;align-items:baseline;gap:20px;">' +
      '<span style="font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#6B6B64;">GH2 EDGE\u2122</span>' +
      '<span style="font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#141412;font-weight:700;">Research &amp; Analysis</span>' +
      '</div>' +
      '<span style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6B6B64;">Vol. I \u00b7 Jul 2026</span>' +
      '</section>';

    const sectionLabel = (label) =>
      '<div style="max-width:1360px;margin:0 auto;padding:40px 32px 20px;border-bottom:1px solid #141412;">' +
      '<span style="font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#6B6B64;">' + label + '</span>' +
      '</div>';

    const featured =
      '<a href="/what-edge-shows/findings" style="text-decoration:none;display:block;padding:52px 40px;background:#141412;color:#FAFAF7;height:100%;">' +
      '<div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#C43A1E;margin-bottom:24px;">Survey Research \u00b7 Jul 2026</div>' +
      '<h2 style="margin:0 0 28px;font-size:clamp(26px,2.8vw,42px);line-height:1.1;letter-spacing:-0.02em;font-weight:700;max-width:18ch;">Retirement, Read Plainly<span style="color:#C43A1E;">.</span></h2>' +
      '<p style="margin:0 0 40px;font-size:clamp(15px,1.4vw,18px);line-height:1.6;color:#A9A9A0;max-width:36ch;">Most people feel ready to retire. Most people haven\u2019t checked. Six things the survey told us \u2014 and what they mean for anyone within a decade of the finish line.</p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;border-top:1px solid #2e2e2e;border-left:1px solid #2e2e2e;margin-bottom:48px;">' +
      ['3 in 4\nFeel Ready', '#1\nTrust Barrier', '1 in 3\nBelow the Cliff', '1 in 5\nNo Target', '#1 Fear\nOutliving Savings', '8 in 10\nWant Income'].map(s => {
        const [stat, label] = s.split('\n');
        return '<div style="border-right:1px solid #2e2e2e;border-bottom:1px solid #2e2e2e;padding:20px 16px;">' +
          '<div style="font-size:clamp(20px,1.8vw,26px);font-weight:700;color:#C43A1E;letter-spacing:-0.02em;">' + stat + '</div>' +
          '<div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#6B6B64;margin-top:4px;">' + label + '</div></div>';
      }).join('') +
      '</div>' +
      '<div style="font-size:13px;letter-spacing:0.1em;text-transform:uppercase;border-bottom:2px solid #C43A1E;display:inline-block;padding-bottom:3px;color:#FAFAF7;">Read the findings \u2192</div>' +
      '</a>';

    const sidebar =
      smallCard('01', 'The Blind Spot', '/what-edge-shows/blind-spot',
        'Two plans. Same score. $223,000 apart.',
        'The standard success metric can\'t tell them apart. EDGE can \u2014 and does, for every household.') +
      smallCard('02', 'Annuity Protection', '/what-edge-shows/annuity-protection',
        'The metric that makes annuities look wrong is the wrong metric.',
        'Asset-survival scores miss the welfare question. Shortfall collapses 70\u2013100% when you measure what actually matters.') +
      '<a href="/what-edge-shows/life-insurance" style="text-decoration:none;background:#FAFAF7;padding:32px 28px;display:block;">' +
      '<div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#C43A1E;margin-bottom:12px;">03 \u00b7 Life Insurance Cohorts</div>' +
      '<h3 style="margin:0 0 12px;font-size:clamp(16px,1.4vw,20px);line-height:1.2;letter-spacing:-0.01em;font-weight:700;">How much coverage is the family actually missing?</h3>' +
      '<p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:#6B6B64;">24 household cohorts. Two coverage gaps \u2014 needs and continuity \u2014 in dollars, including the cases that can\u2019t be closed.</p>' +
      '<div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;border-bottom:2px solid #C43A1E;display:inline-block;padding-bottom:3px;">See the analysis \u2192</div></a>';

    // ── Section 1: EDGE Analysis (3 live-data articles) ──────────────────────
    const edgeLabel = sectionLabel('What Edge Shows \u2014 Live Analysis');

    const edgeFeatured =
      '<div style="padding:52px 40px;background:#141412;color:#FAFAF7;height:100%;">' +
      '<div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#C43A1E;margin-bottom:24px;">EDGE Engine \u00b7 Live Data</div>' +
      '<h2 style="margin:0 0 28px;font-size:clamp(26px,2.8vw,42px);line-height:1.1;letter-spacing:-0.02em;font-weight:700;max-width:18ch;">Three findings you can\u2019t get anywhere else<span style="color:#C43A1E;">.</span></h2>' +
      '<p style="margin:0;font-size:clamp(15px,1.4vw,18px);line-height:1.6;color:#A9A9A0;max-width:36ch;">Live feeds from the EDGE engine \u2014 rendered in this site\u2019s own language, not ours. Updated continuously.</p>' +
      '</div>';

    const edgeGrid =
      '<section style="border-bottom:1px solid #141412;">' +
      '<div style="max-width:1360px;margin:0 auto;display:grid;grid-template-columns:3fr 2fr;gap:0;border-left:1px solid #141412;border-right:1px solid #141412;">' +
      '<div style="border-right:1px solid #141412;">' + edgeFeatured + '</div>' +
      '<div style="display:grid;grid-template-rows:1fr 1fr 1fr;">' + sidebar + '</div>' +
      '</div></section>';

    // ── Section 2: RR Survey (featured + 3 articles) ─────────────────────────
    const surveyLabel = sectionLabel('EDGE Retirement Readiness Survey \u2014 Jul 2026');

    const surveyFeatured =
      '<a href="/what-edge-shows/findings" style="text-decoration:none;display:block;padding:52px 40px;background:#141412;color:#FAFAF7;height:100%;">' +
      '<div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#C43A1E;margin-bottom:24px;">Survey Overview \u00b7 Jul 2026</div>' +
      '<h2 style="margin:0 0 28px;font-size:clamp(26px,2.8vw,42px);line-height:1.1;letter-spacing:-0.02em;font-weight:700;max-width:18ch;">Retirement, Read Plainly<span style="color:#C43A1E;">.</span></h2>' +
      '<p style="margin:0 0 40px;font-size:clamp(15px,1.4vw,18px);line-height:1.6;color:#A9A9A0;max-width:36ch;">Most people feel ready to retire. Most people haven\u2019t checked. Six things the survey told us \u2014 and what they mean for anyone within a decade of the finish line.</p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;border-top:1px solid #2e2e2e;border-left:1px solid #2e2e2e;margin-bottom:48px;">' +
      ['3 in 4\nFeel Ready','#1\nTrust Barrier','1 in 3\nBelow the Cliff','1 in 5\nNo Target','#1 Fear\nOutliving Savings','8 in 10\nWant Income'].map(s => {
        const [stat, lbl] = s.split('\n');
        return '<div style="border-right:1px solid #2e2e2e;border-bottom:1px solid #2e2e2e;padding:20px 16px;">' +
          '<div style="font-size:clamp(20px,1.8vw,26px);font-weight:700;color:#C43A1E;letter-spacing:-0.02em;">' + stat + '</div>' +
          '<div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#6B6B64;margin-top:4px;">' + lbl + '</div></div>';
      }).join('') +
      '</div>' +
      '<div style="font-size:13px;letter-spacing:0.1em;text-transform:uppercase;border-bottom:2px solid #C43A1E;display:inline-block;padding-bottom:3px;color:#FAFAF7;">Read the full findings \u2192</div>' +
      '</a>';

    const surveySidebar =
      resCard('Article \u00b7 01', '/research/confidence-gap',
        'The Confidence Gap',
        '3 in 4 feel ready. 1 in 3 are below the cliff. The gap between perceived and actual readiness is the survey\u2019s most striking finding.') +
      resCard('Article \u00b7 02', '/research/trust-barrier',
        'The Trust Problem',
        '\u201CI don\u2019t know whom to trust\u201D beats cost as the #1 thing stopping people from getting help.') +
      '<a href="/research/missing-tools" style="text-decoration:none;background:#FAFAF7;padding:32px 28px;display:block;">' +
      '<div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#C43A1E;margin-bottom:12px;">Article \u00b7 03</div>' +
      '<h3 style="margin:0 0 12px;font-size:clamp(16px,1.4vw,20px);line-height:1.2;letter-spacing:-0.01em;font-weight:700;">The Missing Tools</h3>' +
      '<p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:#6B6B64;">8 in 10 want guaranteed lifetime income. Almost none understand the tool that delivers it.</p>' +
      '<div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;border-bottom:2px solid #C43A1E;display:inline-block;padding-bottom:3px;">Read the article \u2192</div></a>';

    const surveyGrid =
      '<section style="border-bottom:1px solid #141412;">' +
      '<div style="max-width:1360px;margin:0 auto;display:grid;grid-template-columns:3fr 2fr;gap:0;border-left:1px solid #141412;border-right:1px solid #141412;">' +
      '<div style="border-right:1px solid #141412;">' + surveyFeatured + '</div>' +
      '<div style="display:grid;grid-template-rows:1fr 1fr 1fr;">' + surveySidebar + '</div>' +
      '</div></section>';

    res.send(page('What Edge Shows', 'What Edge Shows',
      masthead + edgeLabel + edgeGrid + surveyLabel + surveyGrid
    ));
  });

  app.get('/what-edge-shows/findings', (_req, res) => {
    const findings = [
      ['1. The mood is confident \u2014 and remarkably calm',
       'Roughly three in four people described themselves as confident about their retirement. When we asked what worries them most, \u201Cnothing worries me much\u201D was nearly the most common answer \u2014 running neck and neck with \u201Cnot knowing if I have enough.\u201D That\u2019s a striking amount of calm for a decision this big.',
       'Is the confidence earned, or just comfortable?'],
      ['2. The real barrier isn\u2019t cost. It\u2019s trust.',
       'Asked what has actually stopped them from getting help, more people chose \u201CI don\u2019t know whom to trust\u201D than anything else \u2014 ahead of cost, and well ahead of \u201CI don\u2019t know where to start.\u201D The most common way people describe a financial professional\u2019s job is \u201Cselling to me,\u201D not \u201Chelping me.\u201D',
       'What earns trust is unglamorous: a client-first standard, plain-English explanations, clear fees, no pressure. Not magic returns. Just proof.'],
      ['3. There\u2019s a cliff a lot of people can\u2019t see',
       'About a third of respondents sit below ~$750K \u2014 the point where the math for a 30-year retirement gets genuinely tight. The unsettling part isn\u2019t the number. It\u2019s that most of the people below that line still describe themselves as confident. Low balances simply aren\u2019t translating into felt risk.',
       ''],
      ['4. Almost no one can name their number',
       'Ask what balance would let them feel safe, and about one in five can\u2019t name one at all. Many who do name a figure set it above what they currently hold \u2014 they sense a shortfall but have no plan to close it.',
       'Here is your number, and here is why. You can\u2019t feel safe against a target you\u2019ve never been given.'],
      ['5. The deepest fear is outliving your money',
       'The single biggest fear was outliving savings \u2014 now ahead of even healthcare costs. But close behind sits a very different worry: spending too little and missing out. People need both permission to enjoy what they saved and the certainty that it will last.',
       ''],
      ['6. They want lifetime income \u2014 but the tools are a black box',
       'More than eight in ten said a tool that guarantees lifetime income would be useful. Yet the product built to do exactly that \u2014 the annuity \u2014 is also the one they understand least, by a wide margin. The appetite exists. The plain-English explanation does not.',
       ''],
    ];

    const findingBlocks = findings.map(([title, body, pull], i) =>
      '<div style="padding:56px 0;border-top:1px solid #141412;display:grid;grid-template-columns:1fr 2fr;gap:64px;align-items:start;">' +
      '<div><span style="font-size:clamp(48px,5vw,72px);font-weight:700;color:#F1F0EA;line-height:1;letter-spacing:-0.03em;">' + String(i+1).padStart(2,'0') + '</span></div>' +
      '<div>' +
      '<h2 style="margin:0 0 20px;font-size:clamp(18px,1.8vw,24px);line-height:1.2;letter-spacing:-0.01em;font-weight:700;">' + title.replace(/^\d+\.\s+/,'') + '</h2>' +
      '<p style="margin:0' + (pull?' 0 24px':' ') + ';font-size:16px;line-height:1.7;color:#6B6B64;">' + body + '</p>' +
      (pull ? '<p style="margin:0;font-size:clamp(17px,1.6vw,22px);line-height:1.4;color:#141412;font-style:italic;border-left:3px solid #C43A1E;padding-left:20px;">' + pull + '</p>' : '') +
      '</div></div>'
    ).join('');

    res.send(page('Retirement, Read Plainly', 'What Edge Shows',
      '<section style="max-width:1360px;margin:0 auto;padding:88px 32px 64px;border-bottom:1px solid #141412;">' +
      '<div style="display:flex;align-items:center;gap:16px;margin-bottom:40px;">' +
      '<a href="/what-edge-shows" style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6B6B64;text-decoration:none;">\u2190 What Edge Shows</a>' +
      '<span style="color:#E0DFD8;">|</span>' +
      '<span style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#C43A1E;">Survey Research</span>' +
      '<span style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6B6B64;">\u00b7 Jul 2026 \u00b7 6 min read</span>' +
      '</div>' +
      '<h1 style="margin:0 0 32px;font-size:clamp(40px,6vw,88px);line-height:1.0;letter-spacing:-0.03em;font-weight:700;max-width:20ch;">Retirement, Read Plainly<span style="color:#C43A1E;">.</span></h1>' +
      '<p style="margin:0;font-size:clamp(18px,1.8vw,26px);line-height:1.5;max-width:46ch;color:#6B6B64;">Most people feel ready to retire. Most people haven\u2019t checked. We asked \u2014 and the surprise wasn\u2019t fear. It was confidence no one had verified.</p>' +
      '</section>' +

      '<section style="max-width:1360px;margin:0 auto;padding:0 32px 88px;">' +
      '<p style="padding:48px 0 0;font-size:16px;line-height:1.8;color:#141412;max-width:62ch;margin:0 0 0;">' +
      'There\u2019s a story we tell about people approaching retirement: anxious, under-saved, quietly panicking. When we actually asked, the picture came back different \u2014 calmer, more self-assured, and in its own way, more worrying. This audience isn\u2019t paralyzed by fear. It\u2019s carrying a confidence that no one has ever pressure-tested.' +
      '</p>' +
      findingBlocks +
      '<div style="border-top:1px solid #141412;padding-top:56px;display:grid;grid-template-columns:1fr 2fr;gap:64px;">' +
      '<div><h2 style="margin:0;font-size:clamp(20px,2vw,28px);font-weight:700;letter-spacing:-0.01em;">So what do we do with this?</h2></div>' +
      '<div><p style="margin:0 0 24px;font-size:16px;line-height:1.8;color:#6B6B64;">The takeaway isn\u2019t \u201Cbe more afraid.\u201D It\u2019s the opposite: turn quiet confidence into verified confidence. Ask the person guiding your money how you can confirm they\u2019re held to a client-first standard. Get an actual target number instead of a feeling. And make anyone explain the tools to you in plain language before you buy them.</p>' +
      '<p style="margin:0 0 40px;font-size:16px;line-height:1.8;color:#141412;">That\u2019s the whole idea behind GH2 EDGE\u2122: one clear, defensible number you can hold accountable \u2014 not a pitch, a plan.</p>' +
      '<a href="/individual.html" style="text-decoration:none;background:#141412;color:#FAFAF7;padding:18px 40px;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;display:inline-block;" onmouseover="this.style.background=\'#C43A1E\'" onmouseout="this.style.background=\'#141412\'">Find your answer \u2192</a>' +
      '</div></div>' +
      '<p style="margin:64px 0 0;font-size:12px;line-height:1.7;color:#A9A9A0;max-width:60ch;">Figures reflect responses to the GH2 EDGE\u2122 Retirement Readiness Survey and are shared as proportions of those who answered each question. Directional, not a formal poll \u2014 a signal worth acting on, not a headline to quote as fact.</p>' +
      '</section>'
    ));
  });

  // ── BLIND SPOT ──────────────────────────────────────────────────────────────
  app.get('/what-edge-shows/blind-spot', async (_req, res) => {
    let d;
    try { d = await fetchFeed('https://edge.gh2benefits.com/dashboards/data/blind-spot.json'); }
    catch (e) { return res.send(errPage('The Blind Spot', e.message)); }

    const headline = d?.headline?.statement ?? 'Two plans. Same score. $223,000 apart.';
    const reading  = d?.blindSpot?.reading  ?? '';
    const plans2   = d?.blindSpot?.plans    ?? [];
    const disp     = d?.dispersion          ?? {};
    const allPlans = d?.plans               ?? [];
    const disc     = d?.disclaimer          ?? '';
    const rights   = d?.rights              ?? '';

    const planCards = plans2.map(p =>
      '<div style="background:#FAFAF7;border-right:1px solid #141412;padding:48px 40px;flex:1;min-width:0;">' +
      '<div style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#6B6B64;margin-bottom:16px;">' + (p.label||'Plan') + '</div>' +
      '<div style="font-size:clamp(36px,4vw,60px);font-weight:700;letter-spacing:-0.03em;">' + fmt$(p.dollarsKept) + '</div>' +
      '<div style="margin-top:8px;font-size:14px;color:#6B6B64;">Legacy kept</div>' +
      '<div style="margin-top:24px;display:inline-flex;align-items:center;gap:12px;background:#141412;color:#FAFAF7;padding:12px 20px;">' +
      '<span style="font-size:20px;font-weight:700;">' + fmtPct(p.successPct) + '</span>' +
      '<span style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#A9A9A0;">success score</span></div></div>'
    ).join('');

    const planRows = allPlans.map((p, i) =>
      '<tr style="border-top:1px solid #E0DFD8;">' +
      '<td style="padding:12px 16px;font-size:13px;font-weight:' + (i===0?700:400) + ';">' + (p.label||p.name||'Plan '+(i+1)) + '</td>' +
      '<td style="padding:12px 16px;font-size:13px;text-align:right;">' + fmt$(p.dollarsKept) + '</td>' +
      '<td style="padding:12px 16px;font-size:13px;text-align:right;">' + fmtPct(p.successPct) + '</td>' +
      '<td style="padding:12px 16px;font-size:13px;text-align:right;color:' + (i===0?'#6B6B64':'#C43A1E') + ';">' + (i===0?'\u2014':('-'+fmt$(p.gapToBest))) + '</td></tr>'
    ).join('');

    const disclaimer = (disc||rights) ?
      '<section><div style="max-width:1360px;margin:0 auto;padding:40px 32px;font-size:12px;line-height:1.7;color:#6B6B64;">' +
      (disc  ? '<p style="margin:0 0 8px;">' + disc + '</p>' : '') +
      (rights ? '<p style="margin:0;">'  + rights + '</p>'  : '') +
      '</div></section>' : '';

    res.send(page('The Blind Spot', 'What Edge Shows',
      '<section style="max-width:1360px;margin:0 auto;padding:88px 32px 72px;border-bottom:1px solid #141412;">' +
      '<p style="margin:0 0 32px;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#6B6B64;">01 · The Blind Spot</p>' +
      '<h1 style="margin:0;font-size:clamp(40px,5.6vw,84px);line-height:1.0;letter-spacing:-0.03em;font-weight:700;max-width:20ch;">' + headline + '</h1></section>' +

      '<section style="border-bottom:1px solid #141412;"><div style="max-width:1360px;margin:0 auto;padding:88px 32px;">' +
      (plans2.length ? '<div style="display:flex;gap:0;border:1px solid #141412;margin-bottom:56px;">' + planCards + '</div>' : '') +
      (reading ? '<p style="font-size:clamp(18px,1.8vw,24px);line-height:1.5;max-width:48ch;color:#6B6B64;margin:0;">' + reading + '</p>' : '') +
      '</div></section>' +

      '<section style="background:#141412;color:#FAFAF7;border-bottom:1px solid #141412;"><div style="max-width:1360px;margin:0 auto;padding:88px 32px;display:grid;grid-template-columns:1fr 1fr;gap:64px;">' +
      '<div><div style="font-size:clamp(48px,5vw,80px);font-weight:700;letter-spacing:-0.03em;">' + fmt$(disp.spreadDollars) + '</div>' +
      '<div style="margin-top:10px;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;color:#A9A9A0;">Spread across all strategies</div></div>' +
      '<div><div style="font-size:clamp(48px,5vw,80px);font-weight:700;letter-spacing:-0.03em;">' + (disp.plansOver100kBehind||31) +
      '<span style="font-size:0.45em;font-weight:400;color:#A9A9A0;"> of ' + (disp.plansTotal||32) + '</span></div>' +
      '<div style="margin-top:10px;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;color:#A9A9A0;">Plans more than $100k behind #1</div></div></div></section>' +

      (allPlans.length ?
      '<section style="border-bottom:1px solid #141412;"><div style="max-width:1360px;margin:0 auto;padding:48px 32px;"><details>' +
      '<summary style="padding:20px 0;font-size:13px;letter-spacing:0.22em;text-transform:uppercase;color:#6B6B64;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #141412;">' +
      'All ' + allPlans.length + ' strategies ranked \u2014 the industry\u2019s own names<span style="font-size:11px;">\u25b6 expand</span></summary>' +
      '<div style="overflow-x:auto;margin-top:16px;"><table style="width:100%;border-collapse:collapse;">' +
      '<thead><tr style="border-bottom:2px solid #141412;">' +
      '<th style="padding:12px 16px;text-align:left;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6B6B64;">Strategy</th>' +
      '<th style="padding:12px 16px;text-align:right;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6B6B64;">Legacy Kept</th>' +
      '<th style="padding:12px 16px;text-align:right;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6B6B64;">Success Score</th>' +
      '<th style="padding:12px 16px;text-align:right;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6B6B64;">Gap to #1</th></tr></thead>' +
      '<tbody>' + planRows + '</tbody></table></div></details></div></section>' : '') +
      disclaimer));
  });

  // ── ANNUITY PROTECTION ──────────────────────────────────────────────────────
  app.get('/what-edge-shows/annuity-protection', async (_req, res) => {
    let d;
    try { d = await fetchFeed('https://edge.gh2benefits.com/dashboards/data/annuity-protection.json'); }
    catch (e) { return res.send(errPage('Annuity Protection', e.message)); }

    const cells  = d?.cells      ?? [];
    const disc   = d?.disclaimer ?? '';
    const rights = d?.rights     ?? '';

    const byNW = {};
    cells.forEach(c => {
      const k = c.netWorthLabel ?? (c.netWorth != null ? fmt$(c.netWorth) : 'All households');
      if (!byNW[k]) byNW[k] = [];
      byNW[k].push(c);
    });

    const sections = Object.entries(byNW).map(([nw, group], gi) =>
      '<details ' + (gi===0?'open':'') + ' style="border-top:1px solid #141412;">' +
      '<summary style="padding:20px 0;font-size:13px;letter-spacing:0.22em;text-transform:uppercase;color:#6B6B64;display:flex;justify-content:space-between;align-items:center;">' +
      'Net Worth: ' + nw + '<span style="font-size:11px;">' + (gi===0?'\u25bc collapse':'\u25b6 expand') + '</span></summary>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1px;background:#141412;border:1px solid #141412;margin-bottom:8px;">' +
      group.map(c => {
        const wo = c.withoutAnnuity ?? {};
        const wi = c.withAnnuity    ?? {};
        const pct = c.shortfallReductionPct;
        return '<div style="background:#FAFAF7;padding:32px 28px;">' +
          '<div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6B6B64;margin-bottom:20px;">' + (c.state||'') + ' \u00b7 ' + (c.tier||'') + '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">' +
          '<div><div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#6B6B64;margin-bottom:10px;">Without annuity</div>' +
          '<div style="font-size:24px;font-weight:700;">' + fmtPct(wo.survivesPct) + '</div>' +
          '<div style="font-size:12px;color:#6B6B64;margin-top:2px;">survives</div>' +
          '<div style="font-size:18px;font-weight:600;color:#C43A1E;margin-top:10px;">' + fmt$(wo.shortfall) + '</div>' +
          '<div style="font-size:12px;color:#6B6B64;">shortfall</div></div>' +
          '<div><div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#6B6B64;margin-bottom:10px;">With annuity</div>' +
          '<div style="font-size:24px;font-weight:700;">' + fmtPct(wi.survivesPct) + '</div>' +
          '<div style="font-size:12px;color:#6B6B64;margin-top:2px;">survives</div>' +
          '<div style="font-size:18px;font-weight:600;margin-top:10px;">' + fmt$(wi.shortfall) + '</div>' +
          '<div style="font-size:12px;color:#6B6B64;">shortfall</div></div></div>' +
          (pct != null ? '<div style="background:#141412;color:#FAFAF7;padding:10px 16px;font-size:13px;letter-spacing:0.06em;">Shortfall reduced <strong>' + fmtPct(pct) + '</strong></div>' : '') +
          '</div>';
      }).join('') + '</div></details>'
    ).join('');

    const disclaimer = (disc||rights) ?
      '<section><div style="max-width:1360px;margin:0 auto;padding:40px 32px;font-size:12px;line-height:1.7;color:#6B6B64;">' +
      (disc  ? '<p style="margin:0 0 8px;">' + disc + '</p>'  : '') +
      (rights ? '<p style="margin:0;">'  + rights + '</p>' : '') + '</div></section>' : '';

    res.send(page('Annuity Protection', 'What Edge Shows',
      '<section style="max-width:1360px;margin:0 auto;padding:88px 32px 72px;border-bottom:1px solid #141412;">' +
      '<p style="margin:0 0 32px;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#6B6B64;">02 · Annuity Protection</p>' +
      '<h1 style="margin:0;font-size:clamp(40px,5.6vw,84px);line-height:1.0;letter-spacing:-0.03em;font-weight:700;max-width:20ch;">The metric that makes annuities look wrong is the wrong metric<span style="color:#C43A1E;">.</span></h1>' +
      '<p style="margin:40px 0 0;font-size:clamp(18px,1.8vw,24px);line-height:1.4;max-width:44ch;color:#6B6B64;">Asset-survival scores stay flat while the shortfall a survivor can\u2019t cover collapses 70\u2013100%.</p></section>' +
      '<section style="border-bottom:1px solid #141412;"><div style="max-width:1360px;margin:0 auto;padding:64px 32px;">' + sections + '</div></section>' +
      disclaimer));
  });

  // ── LIFE INSURANCE COHORTS ──────────────────────────────────────────────────
  app.get('/what-edge-shows/life-insurance', async (_req, res) => {
    let d;
    try { d = await fetchFeed('https://edge.gh2benefits.com/dashboards/data/termlife-cohorts.json'); }
    catch (e) { return res.send(errPage('Life Insurance Cohorts', e.message)); }

    const cohorts = d?.cohorts    ?? [];
    const disc    = d?.disclaimer ?? '';
    const rights  = d?.rights     ?? '';

    const rows = cohorts.map((c, i) =>
      '<tr style="border-top:1px solid #E0DFD8;background:' + (i%2===0?'#FAFAF7':'#F4F3EF') + ';">' +
      '<td style="padding:13px 16px;font-size:13px;">' + (c.earnerType||'') + '</td>' +
      '<td style="padding:13px 16px;font-size:13px;text-align:right;">' + fmt$(c.income) + '</td>' +
      '<td style="padding:13px 16px;font-size:13px;text-align:center;">' + (c.kids??0) + '</td>' +
      '<td style="padding:13px 16px;font-size:13px;">' + (c.home||'') + '</td>' +
      '<td style="padding:13px 16px;font-size:13px;text-align:right;font-weight:600;">' + fmtGap(c.coverageGapNeeds) + '</td>' +
      '<td style="padding:13px 16px;font-size:13px;text-align:right;font-weight:600;">' + fmtGap(c.coverageGapContinuity) + '</td>' +
      '<td style="padding:13px 16px;font-size:13px;text-align:right;color:#6B6B64;">' +
        (c.requiredReturnNeedsPct != null ? fmtPct(c.requiredReturnNeedsPct) : c.requiredReturnPct != null ? fmtPct(c.requiredReturnPct) : 'n/a') +
      '</td></tr>'
    ).join('');

    const disclaimer = (disc||rights) ?
      '<section><div style="max-width:1360px;margin:0 auto;padding:40px 32px;font-size:12px;line-height:1.7;color:#6B6B64;">' +
      (disc  ? '<p style="margin:0 0 8px;">' + disc + '</p>' : '') +
      (rights ? '<p style="margin:0;">'  + rights + '</p>' : '') + '</div></section>' : '';

    res.send(page('Life Insurance Cohorts', 'What Edge Shows',
      '<section style="max-width:1360px;margin:0 auto;padding:88px 32px 72px;border-bottom:1px solid #141412;">' +
      '<p style="margin:0 0 32px;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#6B6B64;">03 · Life Insurance Cohorts</p>' +
      '<h1 style="margin:0;font-size:clamp(40px,5.6vw,84px);line-height:1.0;letter-spacing:-0.03em;font-weight:700;max-width:18ch;">How much coverage is the family actually missing<span style="color:#C43A1E;">?</span></h1>' +
      '<p style="margin:40px 0 0;font-size:clamp(18px,1.8vw,24px);line-height:1.4;max-width:44ch;color:#6B6B64;">' + cohorts.length + ' household cohorts. Two coverage gaps \u2014 needs and continuity \u2014 in dollars, including the cases that can\u2019t be closed.</p></section>' +
      '<section style="border-bottom:1px solid #141412;"><div style="max-width:1360px;margin:0 auto;padding:64px 32px;overflow-x:auto;">' +
      '<table style="width:100%;border-collapse:collapse;min-width:780px;">' +
      '<thead><tr style="border-bottom:2px solid #141412;">' +
      '<th style="padding:12px 16px;text-align:left;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6B6B64;">Earner</th>' +
      '<th style="padding:12px 16px;text-align:right;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6B6B64;">Income</th>' +
      '<th style="padding:12px 16px;text-align:center;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6B6B64;">Kids</th>' +
      '<th style="padding:12px 16px;text-align:left;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6B6B64;">Home</th>' +
      '<th style="padding:12px 16px;text-align:right;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6B6B64;">Gap · Needs</th>' +
      '<th style="padding:12px 16px;text-align:right;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6B6B64;">Gap · Continuity</th>' +
      '<th style="padding:12px 16px;text-align:right;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6B6B64;">Req. Return</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div></section>' + disclaimer));
  });

  // ── RESEARCH HUB ─────────────────────────────────────────────────────────────
  function resCard(num, href, headline, deck) {
    return '<a href="' + href + '" style="text-decoration:none;background:#FAFAF7;padding:32px 28px;display:block;border-bottom:1px solid #141412;">' +
    '<div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#C43A1E;margin-bottom:12px;">' + num + '</div>' +
    '<h3 style="margin:0 0 12px;font-size:clamp(16px,1.4vw,20px);line-height:1.2;letter-spacing:-0.01em;font-weight:700;">' + headline + '</h3>' +
    '<p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:#6B6B64;">' + deck + '</p>' +
    '<div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;border-bottom:2px solid #C43A1E;display:inline-block;padding-bottom:3px;">Read the article \u2192</div></a>';
  }

  // ── LIBRARY + CASE-STUDIES JSON (fetched live, no server cache) ─────────────
  const BLOB = 'https://j8jwbg91djjmmn4u.public.blob.vercel-storage.com';

  async function getLibrary() {
    const r = await fetch(BLOB + '/library.json?t=' + Date.now(),
      { headers: { 'Cache-Control': 'no-store' } });
    if (!r.ok) throw new Error('library.json returned ' + r.status);
    return r.json();
  }

  async function getCaseStudies() {
    const r = await fetch(BLOB + '/case-studies.json?t=' + Date.now(),
      { headers: { 'Cache-Control': 'no-store' } });
    if (!r.ok) throw new Error('case-studies.json returned ' + r.status);
    return r.json();
  }

  app.get('/research', (_req, res) => res.redirect(301, '/library'));

  // ── RESEARCH ARTICLE HELPER ───────────────────────────────────────────────────
  function resArticlePage(title, num, label, readTime, headline, deck, intro, blocks, closing, ctaHref, ctaLabel) {
    const articleBlocks = blocks.map(([h, body, pull]) =>
      '<div style="padding:56px 0;border-top:1px solid #141412;display:grid;grid-template-columns:1fr 2fr;gap:64px;align-items:start;">' +
      '<div><span style="font-size:clamp(48px,5vw,72px);font-weight:700;color:#F1F0EA;line-height:1;letter-spacing:-0.03em;">' + num + '</span></div>' +
      '<div>' +
      '<h2 style="margin:0 0 20px;font-size:clamp(18px,1.8vw,24px);line-height:1.2;letter-spacing:-0.01em;font-weight:700;">' + h + '</h2>' +
      '<p style="margin:0' + (pull ? ' 0 24px' : '') + ';font-size:16px;line-height:1.7;color:#6B6B64;">' + body + '</p>' +
      (pull ? '<p style="margin:0;font-size:clamp(17px,1.6vw,22px);line-height:1.4;color:#141412;font-style:italic;border-left:3px solid #C43A1E;padding-left:20px;">' + pull + '</p>' : '') +
      '</div></div>'
    );

    return page(title, 'Research',
      '<section style="max-width:1360px;margin:0 auto;padding:88px 32px 64px;border-bottom:1px solid #141412;">' +
      '<div style="display:flex;align-items:center;gap:16px;margin-bottom:40px;">' +
      '<a href="/research" style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6B6B64;text-decoration:none;">\u2190 Retirement Readiness Survey</a>' +
      '<span style="color:#E0DFD8;">|</span>' +
      '<span style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#C43A1E;">' + label + '</span>' +
      '<span style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6B6B64;">\u00b7 Jul 2026 \u00b7 ' + readTime + '</span>' +
      '</div>' +
      '<h1 style="margin:0 0 32px;font-size:clamp(40px,6vw,88px);line-height:1.0;letter-spacing:-0.03em;font-weight:700;max-width:20ch;">' + headline + '<span style="color:#C43A1E;">.</span></h1>' +
      '<p style="margin:0;font-size:clamp(18px,1.8vw,26px);line-height:1.5;max-width:46ch;color:#6B6B64;">' + deck + '</p>' +
      '</section>' +
      '<section style="max-width:1360px;margin:0 auto;padding:0 32px 88px;">' +
      '<p style="padding:48px 0 0;font-size:16px;line-height:1.8;color:#141412;max-width:62ch;margin:0;">' + intro + '</p>' +
      articleBlocks.join('') +
      '<div style="border-top:1px solid #141412;padding-top:56px;margin-top:56px;">' +
      '<p style="margin:0 0 40px;font-size:16px;line-height:1.8;color:#6B6B64;max-width:62ch;">' + closing + '</p>' +
      '<a href="' + ctaHref + '" style="text-decoration:none;background:#141412;color:#FAFAF7;padding:18px 40px;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;display:inline-block;" onmouseover="this.style.background=\'#C43A1E\'" onmouseout="this.style.background=\'#141412\'">' + ctaLabel + ' \u2192</a>' +
      '</div>' +
      '<p style="margin:64px 0 0;font-size:12px;line-height:1.7;color:#A9A9A0;max-width:60ch;">Figures reflect responses to the GH2 EDGE\u2122 Retirement Readiness Survey and are shared as proportions of those who answered each question. Directional, not a formal poll \u2014 a signal worth acting on, not a headline to quote as fact.</p>' +
      '</section>'
    );
  }

  // ── ARTICLE 01: THE CONFIDENCE GAP ───────────────────────────────────────────
  app.get('/research/confidence-gap', (_req, res) => {
    res.send(resArticlePage(
      'The Confidence Gap',
      '01',
      'Survey Research',
      '4 min read',
      'The Confidence Gap',
      'Three in four people approaching retirement call themselves confident. One in three are below the balance where that confidence can be kept.',
      'Confidence is a strange thing in retirement planning. It doesn\u2019t track the numbers \u2014 it tracks the story you\u2019ve been told, or the one you\u2019ve told yourself. When we asked people how they felt, what came back wasn\u2019t fear. It was a quiet assurance that no one has ever been asked to prove.',
      [
        [
          'The mood is confident \u2014 and remarkably calm',
          'Roughly three in four people described themselves as confident about their retirement. When we asked what worries them most, \u201Cnothing worries me much\u201D was nearly the most common answer \u2014 running neck and neck with \u201Cnot knowing if I have enough.\u201D That\u2019s a striking amount of calm for a decision this size.',
          'Is the confidence earned, or just comfortable?'
        ],
        [
          'There\u2019s a cliff a lot of people can\u2019t see',
          'This is a wealthier-than-average group \u2014 a slim majority holds more than a million dollars. But about a third sit below what we\u2019d call the feasibility cliff: the point under roughly $750K where the math for a 30-year retirement gets genuinely tight. The unsettling part isn\u2019t the number. It\u2019s that most of the people below that line still describe themselves as confident. Low balances simply aren\u2019t translating into felt risk.',
          ''
        ]
      ],
      'The answer to the confidence gap isn\u2019t more anxiety. It\u2019s verification. A single honest number \u2014 here is where you stand, here is what you need, here is the gap \u2014 turns a feeling into a plan. That\u2019s what EDGE is built to provide.',
      '/individual.html',
      'Get your number'
    ));
  });

  // ── ARTICLE 02: THE TRUST PROBLEM ────────────────────────────────────────────
  app.get('/research/trust-barrier', (_req, res) => {
    res.send(resArticlePage(
      'The Trust Problem',
      '02',
      'Survey Research',
      '4 min read',
      'The Trust Problem',
      'The gap between this audience and good advice isn\u2019t money. It\u2019s trust. And the industry has done almost nothing to earn it.',
      'Ask people why they haven\u2019t gotten professional retirement help, and the answer you expect \u2014 \u201Cit costs too much\u201D \u2014 doesn\u2019t top the list. The answer that does is quieter, and harder to fix with a price cut.',
      [
        [
          'The real barrier isn\u2019t cost. It\u2019s trust.',
          'More people chose \u201CI don\u2019t know whom to trust\u201D than anything else \u2014 ahead of cost, and well ahead of \u201CI don\u2019t know where to start.\u201D It fits a finding just below the surface: the most common way people describe a financial professional\u2019s job is \u201Cselling to me,\u201D not \u201Chelping me.\u201D The default posture toward the industry is guarded \u2014 and understandably so.',
          'The gap between this audience and good advice isn\u2019t money, and it isn\u2019t intelligence. It\u2019s trust.'
        ],
        [
          'What would actually earn it',
          'What would earn their trust is refreshingly unglamorous: someone held to a client-first standard, plain-English explanations, clear fees, and no pressure. Not magic returns. Not a slick app. Just proof that the person across the table is working for them, not at them.',
          ''
        ]
      ],
      'The fiduciary standard exists precisely to answer this problem. Knowing how to ask for it \u2014 and what to do when you don\u2019t get a clear answer \u2014 is one of the most valuable things anyone approaching retirement can learn.',
      '/contact.html',
      'Talk to GH2 EDGE'
    ));
  });

  // ── ARTICLE 03: THE MISSING TOOLS ────────────────────────────────────────────
  app.get('/research/missing-tools', (_req, res) => {
    res.send(resArticlePage(
      'The Missing Tools',
      '03',
      'Survey Research',
      '5 min read',
      'The Missing Tools',
      'People know what they want from retirement. They don\u2019t have the tools to get it \u2014 and often don\u2019t know those tools exist.',
      'Retirement has two fears that pull in opposite directions: running out of money, and spending too little of it. The survey found both alive and well \u2014 often in the same person. The products built to resolve that tension are sitting unused, mostly because no one has explained them.',
      [
        [
          'Almost no one can name their number',
          'Ask what balance would let them feel safe, and about one in five can\u2019t name one at all. Many who do name a figure set it above what they currently hold \u2014 they sense a shortfall but have no plan to close it. If there\u2019s a single highest-leverage thing anyone can be handed here, it\u2019s a concrete, personalized target.',
          'You can\u2019t feel safe against a target you\u2019ve never been given.'
        ],
        [
          'The deepest fear is outliving your money',
          'The single biggest fear was outliving savings \u2014 now ahead of even healthcare costs. But close behind sits a very different worry: spending too little and missing out. That tension is the whole retirement puzzle in miniature. People need both permission to enjoy what they saved and the certainty that it will last.',
          ''
        ],
        [
          'They want lifetime income \u2014 but the tools are a black box',
          'More than eight in ten said a tool that guarantees lifetime income would be useful. Yet the product built to do exactly that \u2014 the annuity \u2014 is also the one they understand least, by a wide margin. The appetite for what these tools do clearly exists. The plain-English explanation of how they work does not. That\u2019s a gap worth closing before it\u2019s a product worth selling.',
          ''
        ]
      ],
      'GH2 EDGE is built around one idea: give people the number first. A clear, defensible figure that answers both fears at once \u2014 here is what you can spend, and here is how long it lasts. Not a product pitch. A plan.',
      '/individual.html',
      'Find your answer'
    ));
  });

  // ── INSTITUTIONAL ────────────────────────────────────────────────────────────
  app.get('/case-studies', (_req, res) => res.redirect(301, '/institutional'));
  app.get('/case-studies/embed/:slug', async (req, res) => {
    // keep the proxy route working even when reached directly
    return res.redirect(301, '/institutional/embed/' + req.params.slug);
  });

  app.get('/institutional/embed/:slug', async (req, res) => {
    let data;
    try { data = await getCaseStudies(); }
    catch(e) { return res.status(502).send('Could not load manifest'); }
    const panel = (data.caseStudies || []).find(p => p.slug === req.params.slug);
    if (!panel) return res.status(404).send('Panel not found');
    try {
      const upstream = await fetch(panel.embedUrl + '?t=' + Date.now(),
        { headers: { 'Cache-Control': 'no-store' } });
      if (!upstream.ok) return res.status(502).send('Upstream returned ' + upstream.status);
      const html = await upstream.text();
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.send(html);
    } catch(e) { res.status(502).send('Proxy error: ' + e.message); }
  });

  // ── Case-study gallery ────────────────────────────────────────────────────────
  app.get('/institutional', async (_req, res) => {
    let data;
    try { data = await getCaseStudies(); }
    catch(e) { return res.send(errPage('Institutional', 'Could not load case studies: ' + e.message)); }

    const panels = data.caseStudies || [];
    const A = '#C43A1E', BD = '1px solid #141412';

    const masthead =
      '<section style="max-width:1360px;margin:0 auto;padding:64px 32px 48px;border-bottom:' + BD + ';display:flex;align-items:baseline;justify-content:space-between;gap:32px;flex-wrap:wrap;">' +
      '<div style="display:flex;flex-direction:column;gap:16px;">' +
      '<div style="display:flex;align-items:baseline;gap:20px;">' +
      '<span style="font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#6B6B64;">GH2 EDGE\u2122</span>' +
      '<span style="font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#141412;font-weight:700;">Case Studies</span>' +
      '</div>' +
      '<h1 style="margin:0;font-size:clamp(36px,4.5vw,64px);line-height:1.0;letter-spacing:-0.03em;font-weight:700;max-width:22ch;">The right answer for every household<span style="color:' + A + ';">.</span></h1>' +
      '<p style="margin:0;font-size:clamp(15px,1.4vw,19px);line-height:1.55;color:#6B6B64;max-width:52ch;">Broker/dealers, carriers, recordkeepers, asset managers: see the engine at work — measured in lifetime after-tax dollars.</p>' +
      '</div>' +
      '<span style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6B6B64;align-self:flex-start;margin-top:8px;">' + panels.length + '\u00a0' + (panels.length === 1 ? 'panel' : 'panels') + '</span>' +
      '</section>';

    // Short intros keyed by slug — displayed in the gallery row
    const intros = {
      'edge-slider':          'The same household optimized two ways. Drag through retirement age and watch the lifetime dollar gap between an advisor\u2019s plan and the GH2 EDGE optimum grow in real time.',
      'termlife-value':       'A precise lifetime figure for what term life insurance actually contributes — not a rule of thumb, a number. Measured in after-tax dollars the household keeps.',
      'annuity-protection':   'The annuity\u2019s real cost and benefit in the same units: lifetime after-tax spending the household gains or gives up. The green bar shows exactly what it bought.'
    };

    // Row layout — separator between each row, thumbnail on the right
    const rowStyles =
      '<style>' +
      '.cs-row{display:flex;align-items:stretch;border-bottom:1px solid #141412;text-decoration:none;background:#FAFAF7;transition:background 0.15s;min-height:220px;}' +
      '.cs-row:hover{background:#F1F0EA;}' +
      '.cs-row:hover .cs-row-arrow{opacity:1;transform:translateX(0);}' +
      '.cs-row-body{flex:1;padding:40px 48px 40px 32px;display:flex;flex-direction:column;justify-content:space-between;gap:20px;min-width:0;}' +
      '.cs-row-top{display:flex;flex-direction:column;gap:14px;}' +
      '.cs-row-label{font-size:10px;letter-spacing:0.26em;text-transform:uppercase;color:#C43A1E;}' +
      '.cs-row-title{margin:0;font-size:clamp(20px,2vw,28px);font-weight:700;line-height:1.15;letter-spacing:-0.025em;color:#141412;}' +
      '.cs-row-intro{margin:0;font-size:15px;line-height:1.65;color:#6B6B64;max-width:58ch;}' +
      '.cs-row-cta{display:flex;align-items:center;gap:12px;}' +
      '.cs-row-arrow{font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#C43A1E;opacity:0;transform:translateX(-6px);transition:opacity 0.18s,transform 0.18s;}' +
      '.cs-row-thumb{flex:0 0 360px;position:relative;overflow:hidden;border-left:1px solid #141412;background:#EDECE5;}' +
      '.cs-row-thumb iframe{width:400%;height:400%;border:none;transform:scale(0.25);transform-origin:top left;pointer-events:none;display:block;position:absolute;top:0;left:0;}' +
      '.cs-row-num{position:absolute;bottom:12px;right:16px;font-size:clamp(56px,6vw,88px);font-weight:700;line-height:1;letter-spacing:-0.04em;color:rgba(20,20,18,0.07);pointer-events:none;user-select:none;}' +
      '@media(max-width:720px){.cs-row{flex-direction:column;}.cs-row-thumb{flex:0 0 200px;border-left:none;border-top:1px solid #141412;}.cs-row-body{padding:28px 24px;}}' +
      '</style>';

    const rows = panels.map((p, i) => {
      const num   = String(i + 1).padStart(2, '0');
      const intro = intros[p.slug] || '';
      return '<a href="/institutional/' + p.slug + '" class="cs-row">' +
        '<div class="cs-row-body">' +
        '<div class="cs-row-top">' +
        '<span class="cs-row-label">Case Study\u00a0\u00b7\u00a0' + num + '</span>' +
        '<h2 class="cs-row-title">' + p.title + '</h2>' +
        (intro ? '<p class="cs-row-intro">' + intro + '</p>' : '') +
        '</div>' +
        '<div class="cs-row-cta">' +
        '<span class="cs-row-arrow">View panel \u2192</span>' +
        '</div>' +
        '</div>' +
        '<div class="cs-row-thumb">' +
        '<iframe src="/institutional/embed/' + p.slug + '" loading="lazy" title="' + p.title.replace(/"/g, '&quot;') + ' preview" tabindex="-1" aria-hidden="true"></iframe>' +
        '<span class="cs-row-num">' + num + '</span>' +
        '</div>' +
        '</a>';
    }).join('');

    const gallery =
      '<div style="max-width:1360px;margin:0 auto;">' +
      rowStyles +
      rows +
      '</div>';

    res.send(page('Case Studies', 'Institutional', masthead + gallery));
  });

  // ── Case-study panel detail page ──────────────────────────────────────────────
  app.get('/institutional/:slug', async (req, res) => {
    const slug = req.params.slug;
    let data;
    try { data = await getCaseStudies(); }
    catch(e) { return res.send(errPage('Case Study', 'Could not load manifest: ' + e.message)); }

    const panels = data.caseStudies || [];
    const panel  = panels.find(p => p.slug === slug);
    if (!panel) return res.status(404).send(errPage('Not Found', 'No panel found for "' + slug + '".'));

    const idx    = panels.indexOf(panel);
    const num    = String(idx + 1).padStart(2, '0');
    const A      = '#C43A1E', BD = '1px solid #141412';

    const prev = idx > 0             ? panels[idx - 1] : null;
    const next = idx < panels.length - 1 ? panels[idx + 1] : null;

    const masthead =
      '<section style="max-width:1360px;margin:0 auto;padding:32px 32px 28px;border-bottom:' + BD + ';display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;">' +
      '<div style="display:flex;align-items:center;gap:20px;">' +
      '<a href="/institutional" style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6B6B64;text-decoration:none;">\u2190 Case Studies</a>' +
      '<span style="color:#E0DFD8;">|</span>' +
      '<span style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:' + A + ';">Case Study\u00a0\u00b7\u00a0' + num + '</span>' +
      '</div>' +
      '<div style="display:flex;gap:24px;">' +
      (prev ? '<a href="/institutional/' + prev.slug + '" style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6B6B64;text-decoration:none;">\u2190 Prev</a>' : '') +
      (next ? '<a href="/institutional/' + next.slug + '" style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6B6B64;text-decoration:none;">Next \u2192</a>' : '') +
      '</div>' +
      '</section>' +
      '<section style="max-width:1360px;margin:0 auto;padding:48px 32px 36px;border-bottom:' + BD + ';">' +
      '<h1 style="margin:0;font-size:clamp(28px,3.5vw,52px);line-height:1.05;letter-spacing:-0.025em;font-weight:700;max-width:28ch;">' + panel.title + '<span style="color:' + A + ';">.</span></h1>' +
      '</section>';

    const iframeSection =
      '<div style="border-bottom:' + BD + ';">' +
      '<iframe src="/institutional/embed/' + slug + '" ' +
      'style="width:100%;border:none;display:block;min-height:700px;" ' +
      'title="' + panel.title.replace(/"/g, '&quot;') + '">' +
      '</iframe></div>';

    res.send(page(panel.title, 'Institutional', masthead + iframeSection));
  });

  // ── LIBRARY ──────────────────────────────────────────────────────────────────
  app.get('/library', async (_req, res) => {
    let lib;
    try { lib = await getLibrary(); }
    catch(e) { return res.send(errPage('Library', 'Could not load library: ' + e.message)); }

    const A = '#C43A1E', BD = '1px solid #141412', BDL = '1px solid #E8E8E2';

    function card(label, item, idx) {
      const bullets = (item.bullets && item.bullets.length)
        ? '<ul style="margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px;">' +
          item.bullets.map(b =>
            '<li style="font-size:12px;line-height:1.55;color:#6B6B64;padding-left:14px;position:relative;">' +
            '<span style="position:absolute;left:0;top:6px;width:5px;height:5px;background:' + A + ';display:inline-block;"></span>' +
            b + '</li>'
          ).join('') + '</ul>'
        : (item.description
            ? '<p style="margin:0;font-size:12px;line-height:1.6;color:#6B6B64;">' + item.description + '</p>'
            : '');
      const meta = item.subtitle || item.version || '';
      return '<a href="' + item.url + '" target="_blank" rel="noopener" ' +
        'style="text-decoration:none;display:flex;flex-direction:column;border:' + BD + ';background:#FAFAF7;transition:box-shadow 0.15s;" ' +
        'onmouseover="this.style.boxShadow=\'0 4px 24px rgba(20,20,18,0.10)\'" onmouseout="this.style.boxShadow=\'none\'">' +
        (item.coverUrl
          ? '<div style="border-bottom:' + BD + ';overflow:hidden;aspect-ratio:17/22;background:#F1F0EA;">' +
            '<img src="' + item.coverUrl + '" alt="' + item.title.replace(/"/g,'&quot;') + '" ' +
            'style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy"></div>'
          : '') +
        '<div style="padding:20px 20px 24px;flex:1;display:flex;flex-direction:column;gap:10px;">' +
        '<span style="font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:' + A + ';">' + label + '</span>' +
        '<div style="font-size:15px;font-weight:700;line-height:1.25;letter-spacing:-0.01em;color:#141412;">' + item.title + '</div>' +
        (meta ? '<div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#6B6B64;">' + meta + '</div>' : '') +
        (bullets ? '<div style="margin-top:4px;">' + bullets + '</div>' : '') +
        '<div style="margin-top:auto;padding-top:14px;">' +
        '<span style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;border-bottom:2px solid ' + A + ';padding-bottom:2px;color:#141412;">Download \u2192</span>' +
        '</div></div></a>';
    }

    function section(sectionLabel, items, typePrefix) {
      if (!items || !items.length) return '';
      const grid = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:24px;padding:32px 32px 48px;max-width:1360px;margin:0 auto;">' +
        items.map((item, i) => card(typePrefix + ' \u00b7 ' + String(i+1).padStart(2,'0'), item, i)).join('') +
        '</div>';
      return '<section style="border-bottom:' + BD + ';">' +
        '<div style="max-width:1360px;margin:0 auto;padding:32px 32px 24px;display:flex;align-items:baseline;justify-content:space-between;gap:16px;border-bottom:' + BD + ';">' +
        '<div style="display:flex;align-items:baseline;gap:20px;">' +
        '<span style="font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#6B6B64;">' + sectionLabel + '</span>' +
        '<span style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#141412;font-weight:700;">' + items.length + ' ' + (items.length === 1 ? 'title' : 'titles') + '</span>' +
        '</div></div>' +
        grid + '</section>';
    }

    const total = (lib.books||[]).length + (lib.whitePapers||[]).length + (lib.articles||[]).length;
    const masthead =
      '<section style="max-width:1360px;margin:0 auto;padding:64px 32px 40px;border-bottom:' + BD + ';display:flex;align-items:baseline;justify-content:space-between;gap:32px;flex-wrap:wrap;">' +
      '<div style="display:flex;align-items:baseline;gap:20px;">' +
      '<span style="font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#6B6B64;">GH2 EDGE\u2122</span>' +
      '<span style="font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#141412;font-weight:700;">Library</span>' +
      '</div>' +
      '<span style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6B6B64;">' + total + ' titles</span>' +
      '</section>';

    const body = masthead +
      section('Books',        lib.books      || [], 'Book') +
      section('White Papers', lib.whitePapers || [], 'Paper') +
      section('Articles',     lib.articles   || [], 'Article');

    res.send(page('Library', 'Library', body));
  });


  // ── Static files (after all routes so Express routes take priority) ─────────
  app.use(express.static(path.join(__dirname)));

  // ── Start ────────────────────────────────────────────────────────────────────
  // When run directly (node server.js), start the HTTP server.
  // When imported by Vercel's serverless runtime, just export the app.
  if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => console.log('GH2 EDGE site on :' + PORT));
  }

  module.exports = app;
