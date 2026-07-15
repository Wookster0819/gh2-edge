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
    ["Who It's For",       '/who-its-for.html'],
    ['The Math',           '/the-math.html'],
    ['What Edge Shows',    '/what-edge-shows'],
    ['Contact',            '/contact.html'],
  ];

  function navHtml(active) {
    return '<header style="position:sticky;top:0;z-index:50;background:#FAFAF7;border-bottom:1px solid #141412;">' +
    '<nav style="max-width:1360px;margin:0 auto;padding:0 32px;height:64px;display:flex;align-items:center;justify-content:space-between;">' +
    '<a href="/home.html" style="text-decoration:none;font-weight:700;font-size:17px;letter-spacing:0.02em;display:flex;align-items:center;gap:10px;">' +
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
      <div>Jae W. Oh, MBA, CFP® · GH2 Benefits LLC</div>
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

  // ── Static files ────────────────────────────────────────────────────────────
  app.use(express.static(path.join(__dirname)));

  // ── WHAT EDGE SHOWS master ──────────────────────────────────────────────────
  function card(num, label, href, headline, desc) {
    return '<a href="' + href + '" style="text-decoration:none;background:#FAFAF7;padding:48px 40px;display:block;">' +
    '<div style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#C43A1E;margin-bottom:20px;">' + num + ' · ' + label + '</div>' +
    '<h2 style="margin:0 0 20px;font-size:clamp(22px,2.2vw,32px);line-height:1.1;letter-spacing:-0.02em;font-weight:700;">' + headline + '</h2>' +
    '<p style="margin:0;font-size:16px;line-height:1.6;color:#6B6B64;">' + desc + '</p>' +
    '<div style="margin-top:32px;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;border-bottom:2px solid #C43A1E;display:inline-block;padding-bottom:3px;">See the analysis \u2192</div></a>';
  }

  app.get('/what-edge-shows', (_req, res) => {
    res.send(page('What Edge Shows', 'What Edge Shows',
      '<section style="max-width:1360px;margin:0 auto;padding:88px 32px 72px;border-bottom:1px solid #141412;">' +
      '<p style="margin:0 0 32px;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#6B6B64;">What Edge Shows</p>' +
      '<h1 style="margin:0;font-size:clamp(48px,6.4vw,96px);line-height:1.0;letter-spacing:-0.03em;font-weight:700;max-width:18ch;">Three findings you can\u2019t get anywhere else<span style="color:#C43A1E;">.</span></h1>' +
      '<p style="margin:40px 0 0;font-size:clamp(18px,1.8vw,24px);line-height:1.4;max-width:42ch;color:#6B6B64;">Live feeds from the EDGE engine \u2014 rendered in this site\u2019s own language, not ours.</p></section>' +
      '<section style="border-bottom:1px solid #141412;">' +
      '<div style="max-width:1360px;margin:0 auto;padding:88px 32px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;background:#141412;border:1px solid #141412;">' +
      card('01','The Blind Spot','/what-edge-shows/blind-spot','Two plans. Same score. $223,000 apart.','The standard success metric can\'t tell them apart. EDGE can \u2014 and does, for every household.') +
      card('02','Annuity Protection','/what-edge-shows/annuity-protection','The metric that makes annuities look wrong is the wrong metric.','Asset-survival scores miss the welfare question. Shortfall collapses 70\u2013100% when you measure what actually matters.') +
      card('03','Life Insurance Cohorts','/what-edge-shows/life-insurance','How much coverage is the family actually missing?','24 household cohorts. Two coverage gaps \u2014 needs and continuity \u2014 in dollars, including the cases that can\'t be closed.') +
      '</div></section>'));
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

  // ── Start ────────────────────────────────────────────────────────────────────
  const PORT = process.env.PORT || 80;
  app.listen(PORT, '0.0.0.0', () => console.log('GH2 EDGE site on :' + PORT));
  