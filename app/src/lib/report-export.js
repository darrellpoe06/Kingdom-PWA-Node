// =============================================================================
// report-export — the reusable Download + Print primitive (deterministic, no LLM)
// =============================================================================
// Darrell 2026-07-01: any data surface should be able to download (CSV / print to
// PDF) and print a clean report of what's on screen. This is the shared, ~90%
// prebuilt core: a surface builds a plain REPORT MODEL from the rows the user can
// already see, and this turns it into raw-data CSV and a print-friendly HTML page.
//
// DISPLAY / EXPORT ONLY — never writes, never moves money. RLS / no-leak holds by
// construction: the model carries only the visible rows the surface passed in (no
// query is embedded), so an export can never reach data the user can't see.
// Deterministic + pure (the CSV/HTML builders take a model, return a string), so
// exports are testable and always match the on-screen numbers.
//
// Report model:
//   {
//     title, subtitle?, meta: [{ label, value }],
//     columns: [{ key, label, align?: 'left'|'right', type?: 'money'|'date'|'text' }],
//     groups: [{ label, rows: [{ [colKey]: value }],
//                subtotal?: { in, out, net, count } }],
//     total?: { in, out, net, count },
//     note?,
//   }
// =============================================================================

export function fmtMoney2(n) {
  const v = Number(n) || 0;
  return (v < 0 ? '-$' : '$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function csvCell(v) {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// RAW-DATA CSV (opens directly in Excel/Sheets): a Group column + the model
// columns, ONE row per line item — no subtotal/total rows, so summing the Amount
// column reconciles exactly to the on-screen total. Money cells are plain numbers
// (2dp) for spreadsheet math; the human-readable subtotals live in the PDF.
export function reportToCSV(model) {
  const cols = model.columns || [];
  const header = ['Group', ...cols.map((c) => c.label)];
  const lines = [header.map(csvCell).join(',')];
  const fmt = (c, v) => (c.type === 'money' ? (Number(v) || 0).toFixed(2) : (v == null ? '' : String(v)));
  for (const g of (model.groups || [])) {
    for (const r of g.rows) {
      lines.push([g.label, ...cols.map((c) => fmt(c, r[c.key]))].map(csvCell).join(','));
    }
  }
  return lines.join('\r\n') + '\r\n';
}

// The sum of the money column across every line item — the figure a spreadsheet
// would produce. Exported so a test can prove CSV totals == on-screen totals.
export function csvNetTotal(model) {
  const key = (model.columns || []).find((c) => c.type === 'money')?.key;
  if (!key) return 0;
  let sum = 0;
  for (const g of (model.groups || [])) for (const r of g.rows) sum += Number(r[key]) || 0;
  return Math.round(sum * 100) / 100;
}

const PRINT_CSS = `
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #1A1815; margin: 0; padding: 24px; }
  h1 { font-size: 20px; margin: 0 0 2px; }
  .sub { color: #5A5751; font-size: 12px; margin: 0 0 10px; }
  .meta { font-size: 11px; color: #5A5751; margin: 0 0 16px; }
  .meta span { margin-right: 16px; white-space: nowrap; }
  .group { margin: 0 0 14px; page-break-inside: avoid; }
  .ghead { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #1A1815; padding: 4px 0; }
  .ghead .lbl { font-weight: 700; }
  .ghead .sub2 { font-family: 'Courier New', monospace; font-size: 11px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead th { text-align: left; color: #5A5751; text-transform: uppercase; letter-spacing: .05em; font-size: 9px; border-bottom: 1px solid #E8E4DC; padding: 3px 6px; }
  td { padding: 3px 6px; border-bottom: 1px solid #F0EDE7; vertical-align: top; }
  .num { text-align: right; font-family: 'Courier New', monospace; white-space: nowrap; }
  .in { color: #166534; } .out { color: #B85838; }
  .grand { margin-top: 18px; border-top: 2px solid #1A1815; padding-top: 6px; display: flex; justify-content: space-between; font-weight: 700; }
  .note { margin-top: 20px; color: #5A5751; font-size: 10px; font-style: italic; }
  @page { margin: 0.6in; }
  @media print { body { padding: 0; } .group { page-break-inside: avoid; } thead { display: table-header-group; } }
`;

function subtotalHTML(t) {
  if (!t) return '';
  return `<span class="sub2"><span class="in">in ${esc(fmtMoney2(t.in))}</span> &middot; `
    + `<span class="out">out ${esc(fmtMoney2(t.out))}</span> &middot; `
    + `net ${esc(fmtMoney2(t.net))}</span>`;
}

// A complete, print-friendly HTML document for the report (clean page breaks,
// repeated headers, dates, per-group subtotals, and a grand total). Pure — the
// window-opening happens in printReport().
export function reportToPrintHTML(model) {
  const cols = model.columns || [];
  const groupsHTML = (model.groups || []).map((g) => {
    const body = g.rows.map((r) => '<tr>' + cols.map((c) => {
      const raw = r[c.key];
      const cls = c.align === 'right' || c.type === 'money' ? ' class="num"' : '';
      const text = c.type === 'money' ? fmtMoney2(raw) : (raw == null ? '' : String(raw));
      return `<td${cls}>${esc(text)}</td>`;
    }).join('') + '</tr>').join('');
    const head = '<thead><tr>' + cols.map((c) => `<th${c.align === 'right' || c.type === 'money' ? ' class="num"' : ''}>${esc(c.label)}</th>`).join('') + '</tr></thead>';
    return `<div class="group"><div class="ghead"><span class="lbl">${esc(g.label)}`
      + ` <span style="color:#5A5751;font-weight:400;font-size:10px">${(g.subtotal?.count ?? g.rows.length)} tx</span></span>${subtotalHTML(g.subtotal)}</div>`
      + `<table>${head}<tbody>${body}</tbody></table></div>`;
  }).join('');
  const metaHTML = (model.meta || []).map((m) => `<span><strong>${esc(m.label)}:</strong> ${esc(m.value)}</span>`).join('');
  const grand = model.total
    ? `<div class="grand"><span>Total &middot; ${model.total.count ?? ''} tx</span>${subtotalHTML(model.total)}</div>`
    : '';
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(model.title || 'Report')}</title><style>${PRINT_CSS}</style></head>`
    + `<body><h1>${esc(model.title || 'Report')}</h1>`
    + (model.subtitle ? `<p class="sub">${esc(model.subtitle)}</p>` : '')
    + (metaHTML ? `<div class="meta">${metaHTML}</div>` : '')
    + groupsHTML + grand
    + (model.note ? `<p class="note">${esc(model.note)}</p>` : '')
    + '</body></html>';
}

// ---- Thin browser side-effect wrappers (not pure; kept tiny + guarded) -------

export function downloadText(text, filename, mime = 'text/plain;charset=utf-8') {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) return false;
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

export function downloadCSV(model, filenameBase) {
  return downloadText(reportToCSV(model), `${filenameBase}.csv`, 'text/csv;charset=utf-8');
}

// Open the report in a clean window and print it (the user chooses Save-as-PDF or
// a printer). Falls back to downloading the HTML if a popup is blocked, so the
// report is never lost.
export function printReport(model, filenameBase = 'report') {
  const html = reportToPrintHTML(model);
  try {
    const w = typeof window !== 'undefined' ? window.open('', '_blank') : null;
    if (!w) throw new Error('popup blocked');
    w.document.open(); w.document.write(html); w.document.close();
    w.focus();
    // Give the new document a tick to lay out before printing.
    setTimeout(() => { try { w.print(); } catch { /* user can print manually */ } }, 250);
    return true;
  } catch {
    return downloadText(html, `${filenameBase}.html`, 'text/html;charset=utf-8');
  }
}
