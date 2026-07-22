'use strict';
const fs = require('fs');
const path = require('path');

const NAV = [
  ['For Individuals',    '/individual.html'],
  ['How It Works',       '/how-it-works.html'],
  ['What Edge Shows',    '/what-edge-shows'],
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
<title>${title} \u2014 GH2 EDGE</title>
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
    <div>GH2 EDGE \u00b7 Patent Pending \u00b7 Trade Secret</div>
    <div>Jae W. Oh, MBA, CFP\u00ae \u00b7 GH2 Benefits LLC</div>
  </div>
</footer>
</body>
</html>`;
}

function smallCard(num, label, href, headline, desc) {
  return '<a href="' + href + '" style="text-decoration:none;background:#FAFAF7;padding:32px 28px;display:block;border-bottom:1px solid #141412;">' +
  '<div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#C43A1E;margin-bottom:12px;">' + num + ' \u00b7 ' + label + '</div>' +
  '<h3 style="margin:0 0 12px;font-size:clamp(16px,1.4vw,20px);line-height:1.2;letter-spacing:-0.01em;font-weight:700;">' + headline + '</h3>' +
  '<p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:#6B6B64;">' + desc + '</p>' +
  '<div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;border-bottom:2px solid #C43A1E;display:inline-block;padding-bottom:3px;">See the analysis \u2192</div></a>';
}

// ── /what-edge-shows ────────────────────────────────────────────────────────
function buildWhatEdgeShows() {
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

  const surveyLabel = sectionLabel('EDGE Retirement Readiness Survey \u2014 Jul 2026');

  function resCard(num, href, headline, desc) {
    return '<a href="' + href + '" style="text-decoration:none;background:#FAFAF7;padding:32px 28px;display:block;border-bottom:1px solid #141412;">' +
    '<div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#C43A1E;margin-bottom:12px;">' + num + '</div>' +
    '<h3 style="margin:0 0 12px;font-size:clamp(16px,1.4vw,20px);line-height:1.2;letter-spacing:-0.01em;font-weight:700;">' + headline + '</h3>' +
    '<p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:#6B6B64;">' + desc + '</p>' +
    '<div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;border-bottom:2px solid #C43A1E;display:inline-block;padding-bottom:3px;">Read the article \u2192</div></a>';
  }

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

  return page('What Edge Shows', 'What Edge Shows',
    masthead + edgeLabel + edgeGrid + surveyLabel + surveyGrid);
}

// ── /what-edge-shows/findings ───────────────────────────────────────────────
function buildFindings() {
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

  return page('Retirement, Read Plainly', 'What Edge Shows',
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
    '<p style="padding:48px 0 0;font-size:16px;line-height:1.8;color:#141412;max-width:62ch;margin:0;">' +
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
  );
}

// Write files
fs.mkdirSync('what-edge-shows', { recursive: true });
fs.mkdirSync('what-edge-shows/findings', { recursive: true });

fs.writeFileSync('what-edge-shows/index.html', buildWhatEdgeShows());
fs.writeFileSync('what-edge-shows/findings/index.html', buildFindings());

console.log('Generated: what-edge-shows/index.html');
console.log('Generated: what-edge-shows/findings/index.html');
