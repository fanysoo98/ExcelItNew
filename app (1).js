// ===== STATE =====
let sheets = [[], []], headers = [[], []];
let currentSheet = 0, sortDir = 'az', activeLetter = null;
let sortColIndex = -1, sortDirFilter = 'asc', masked = false;
let pendingFixPanel = null;

// ===== DEMO DATA =====
const demoHeaders = ['First Name', 'Last Name', 'Email', 'Phone'];
const demoData = [
  ['amelia', 'torres', 'a.torres@acme.com', '604-555-0101'],
  ['Judy W (Part-time)', '', 'judy@acme.com', ''],
  ['MICHAEL', 'CHEN', 'm.chen@acme.com', '778-555-0234'],
  ['sarah', "o'brien", 's.obrien@acme.com', '604-555-0345'],
  ['Sarah', "O'Brien", 's.obrien@acme.com', '604-555-0345'],
  ['Wong', 'Judy', 'j.wong@acme.com', '604-555-0456'],
  ['dr. james', 'park', 'j.park@university.edu', ''],
  ['Fatima', 'Al-Hassan', 'f.hassan@acme.com', '778-555-0567'],
  ['bob', 'lee', 'boblee@gmail', '604-555-0678'],
  ['Priya', 'Sharma', 'p.sharma@acme.com', '604-555-0789'],
];
const demoHeaders2 = ['Email', 'Department', 'Job Title', 'Start Date'];
const demoData2 = [
  ['a.torres@acme.com', 'HR', 'HR Manager', '2021-03-15'],
  ['m.chen@acme.com', 'Finance', 'Senior Analyst', '2019-07-01'],
  ['s.obrien@acme.com', 'Operations', 'Ops Lead', '2020-11-22'],
  ['j.wong@acme.com', 'Design', 'UX Designer', '2022-01-10'],
  ['j.park@university.edu', 'Research', 'Associate Prof.', '2018-09-01'],
  ['f.hassan@acme.com', 'Marketing', 'Campaign Manager', '2023-02-28'],
  ['p.sharma@acme.com', 'Engineering', 'Software Engineer', '2021-08-16'],
];

// ===== FORMULA DB =====
const formulas = [
  { name: 'Remove duplicates', desc: 'Return unique rows from a range', formula: '=UNIQUE(A2:D100)', tags: ['duplicate','unique','clean'] },
  { name: 'Proper case', desc: 'Capitalize first letter of each word', formula: '=PROPER(A2)', tags: ['name','capitalize','proper','format'] },
  { name: 'Academic name (Last, First)', desc: 'Combine last and first name columns', formula: '=B2&", "&A2', tags: ['name','combine','academic','format'] },
  { name: 'Combine first + last name', desc: 'Join first and last name with a space', formula: '=A2&" "&B2', tags: ['name','combine','join','merge'] },
  { name: 'Trim whitespace', desc: 'Remove leading, trailing, and extra spaces', formula: '=TRIM(A2)', tags: ['trim','space','clean','whitespace'] },
  { name: 'ALL CAPS', desc: 'Convert text to uppercase', formula: '=UPPER(A2)', tags: ['upper','caps','name','format'] },
  { name: 'lowercase', desc: 'Convert text to lowercase', formula: '=LOWER(A2)', tags: ['lower','name','format'] },
  { name: 'Extract email domain', desc: 'Get domain from email address', formula: '=MID(A2,FIND("@",A2)+1,LEN(A2))', tags: ['email','domain','extract'] },
  { name: 'Validate email format', desc: 'TRUE if email has @ and a dot after it', formula: '=AND(ISNUMBER(FIND("@",A2)),ISNUMBER(FIND(".",A2,FIND("@",A2))))', tags: ['email','validate','check'] },
  { name: 'Count non-blank cells', desc: 'Count cells that have a value', formula: '=COUNTA(A2:A100)', tags: ['count','blank','missing'] },
  { name: 'Find duplicates', desc: 'Returns TRUE if a value appears more than once', formula: '=COUNTIF($A$2:$A$100,A2)>1', tags: ['duplicate','find','count'] },
  { name: 'VLOOKUP', desc: 'Pull value from another sheet by matching key', formula: '=VLOOKUP(A2,Sheet2!$A:$D,2,0)', tags: ['vlookup','lookup','merge','match'] },
  { name: 'INDEX MATCH', desc: 'More flexible lookup — match on any column', formula: '=INDEX(Sheet2!B:B,MATCH(A2,Sheet2!A:A,0))', tags: ['vlookup','lookup','index','match','merge'] },
  { name: 'Split first name', desc: 'Extract text before the first space', formula: '=LEFT(A2,FIND(" ",A2)-1)', tags: ['split','name','first','extract'] },
  { name: 'Split last name', desc: 'Extract text after the first space', formula: '=MID(A2,FIND(" ",A2)+1,LEN(A2))', tags: ['split','name','last','extract'] },
  { name: 'Sort A to Z', desc: 'Sort a range alphabetically', formula: '=SORT(A2:D100,1,1)', tags: ['sort','alphabetical','az'] },
  { name: 'Count unique values', desc: 'Count distinct entries in a column', formula: '=SUMPRODUCT(1/COUNTIF(A2:A100,A2:A100))', tags: ['unique','count','distinct'] },
  { name: 'Flash fill names', desc: 'Tip: type the pattern in B2, press Ctrl+E', formula: 'Ctrl + E (Flash Fill)', tags: ['name','fill','auto','tip'] },
  { name: 'Remove non-printable chars', desc: 'Clean invisible characters from imported data', formula: '=CLEAN(A2)', tags: ['clean','import','character','fix'] },
  { name: 'Highlight blank cells', desc: 'Conditional format rule for empty cells', formula: '=ISBLANK(A1)', tags: ['blank','missing','highlight','conditional'] },
];

// ===== UPLOAD MODAL =====
function openUploadModal() {
  document.getElementById('uploadModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
function closeUploadModal() {
  document.getElementById('uploadModal').style.display = 'none';
  document.body.style.overflow = '';
}
document.getElementById('uploadModal').addEventListener('click', e => {
  if (e.target === document.getElementById('uploadModal')) closeUploadModal();
});

// Drag & drop
const dropZone = document.getElementById('modalDropZone');
['dragenter','dragover'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.add('drag-over'); }));
['dragleave','drop'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.remove('drag-over'); }));
dropZone.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) handleFile(f); });
document.getElementById('fileInputModal').addEventListener('change', e => { if (e.target.files[0]) handleFile(e.target.files[0]); });
document.getElementById('fileInputSidebar').addEventListener('change', e => { if (e.target.files[0]) handleFile(e.target.files[0]); });

function handleFile(file) {
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      sheets = [[], []]; headers = [[], []];
      wb.SheetNames.forEach((name, i) => {
        if (i > 1) return;
        const ws = wb.Sheets[name];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (data.length > 0) {
          headers[i] = data[0].map(String);
          sheets[i] = data.slice(1).map(r => headers[i].map((_, ci) => r[ci] !== undefined ? String(r[ci]) : ''));
        }
      });
      document.getElementById('fileName').textContent = file.name;
      document.getElementById('uploadLabel').textContent = 'Change file';
      closeUploadModal();
      showApp();
      renderAll();
      showScanModal(file.name);
    } catch(err) { showToast('Could not read file — try .xlsx or .csv'); }
  };
  reader.readAsBinaryString(file);
}

// ===== SCAN MODAL =====
function scanSheet() {
  const rows = sheets[0];
  const h = headers[0];
  let dupes = 0, brackets = 0, missingCells = 0, badEmails = 0;
  const seen = {};
  rows.forEach((row, ri) => {
    const key = row.join('||').toLowerCase();
    if (seen[key]) dupes++; else seen[key] = true;
    if (row.join(' ').match(/\(.*?\)/)) brackets++;
    row.forEach(c => { if (!c || c.trim() === '') missingCells++; });
    const emailCols = h.map((col,i) => col.toLowerCase().includes('email') ? i : -1).filter(i => i >= 0);
    emailCols.forEach(ci => {
      const v = row[ci] || '';
      if (v && !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))) badEmails++;
    });
  });
  return { total: rows.length, dupes, brackets, missingCells, badEmails };
}

function showScanModal(filename) {
  const s = scanSheet();
  document.getElementById('scanFileName').textContent = filename;

  // Summary stats
  const total = s.total;
  const issues = s.dupes + s.brackets + (s.badEmails > 0 ? 1 : 0) + (s.missingCells > 0 ? 1 : 0);
  const clean = total - (s.dupes + s.brackets);
  document.getElementById('scanSummary').innerHTML = `
    <div class="scan-stat"><div class="scan-stat-num ok">${total}</div><div class="scan-stat-label">Total rows</div></div>
    <div class="scan-stat"><div class="scan-stat-num ${issues > 0 ? 'warn' : 'ok'}">${issues}</div><div class="scan-stat-label">Issue types found</div></div>
    <div class="scan-stat"><div class="scan-stat-num ${s.dupes > 0 ? 'bad' : 'ok'}">${s.dupes}</div><div class="scan-stat-label">Duplicates</div></div>
  `;

  const issueEl = document.getElementById('scanIssues');
  if (issues === 0) {
    issueEl.innerHTML = `<div class="scan-all-clear"><i class="ti ti-circle-check"></i><p>Looks great! No obvious issues detected in your sheet.</p></div>`;
  } else {
    let html = '';
    if (s.dupes > 0) {
      html += `<div class="scan-issue si-amber" onclick="closeScanAndGo('dupes')">
        <div class="scan-issue-icon"><i class="ti ti-copy-off"></i></div>
        <div class="scan-issue-body">
          <div class="scan-issue-title">Duplicate rows detected</div>
          <div class="scan-issue-desc">${s.dupes} row${s.dupes>1?'s appear':' appears'} more than once — may be the same person entered twice.</div>
        </div>
        <span class="scan-issue-badge">${s.dupes} rows →</span>
      </div>`;
    }
    if (s.brackets > 0) {
      html += `<div class="scan-issue si-purple" onclick="closeScanAndGo('names')">
        <div class="scan-issue-icon"><i class="ti ti-alert-triangle"></i></div>
        <div class="scan-issue-body">
          <div class="scan-issue-title">Bracket names found</div>
          <div class="scan-issue-desc">${s.brackets} name${s.brackets>1?'s have':' has'} content in brackets like "(Part-time)" — last name may be missing.</div>
        </div>
        <span class="scan-issue-badge">${s.brackets} names →</span>
      </div>`;
    }
    if (s.badEmails > 0) {
      html += `<div class="scan-issue si-red" onclick="closeScanAndGo('more')">
        <div class="scan-issue-icon"><i class="ti ti-mail-off"></i></div>
        <div class="scan-issue-body">
          <div class="scan-issue-title">Invalid email addresses</div>
          <div class="scan-issue-desc">${s.badEmails} email${s.badEmails>1?'s don\'t':' doesn\'t'} look right — missing @ or domain.</div>
        </div>
        <span class="scan-issue-badge">${s.badEmails} emails →</span>
      </div>`;
    }
    if (s.missingCells > 0) {
      html += `<div class="scan-issue si-blue" onclick="closeScanAndGo('more')">
        <div class="scan-issue-icon"><i class="ti ti-table-off"></i></div>
        <div class="scan-issue-body">
          <div class="scan-issue-title">Missing data detected</div>
          <div class="scan-issue-desc">${s.missingCells} cell${s.missingCells>1?'s are':' is'} blank — some rows may have incomplete info.</div>
        </div>
        <span class="scan-issue-badge">${s.missingCells} cells →</span>
      </div>`;
    }
    issueEl.innerHTML = html;
  }
  document.getElementById('scanModal').style.display = 'flex';
}

function closeScanModal() {
  document.getElementById('scanModal').style.display = 'none';
}
function closeScanAndFix() {
  closeScanModal();
  // Go to the most urgent panel
  const s = scanSheet();
  if (s.dupes > 0) switchPanel('dupes');
  else if (s.brackets > 0) switchPanel('names');
  else if (s.badEmails > 0) switchPanel('more');
  else switchPanel('names');
}
function closeScanAndGo(panel) {
  closeScanModal();
  switchPanel(panel);
  const sideMatch = document.querySelector('.sidebar-item[data-panel="'+panel+'"]');
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  if (sideMatch) sideMatch.classList.add('active');
}

// ===== APP NAVIGATION =====
function showApp() {
  document.getElementById('landing').style.display = 'none';
  document.getElementById('app').style.display = 'block';
}
function showLanding() {
  document.getElementById('app').style.display = 'none';
  document.getElementById('landing').style.display = 'flex';
}
function loadDemo() {
  sheets[0] = demoData.map(r => [...r]);
  headers[0] = [...demoHeaders];
  sheets[1] = demoData2.map(r => [...r]);
  headers[1] = [...demoHeaders2];
  document.getElementById('fileName').textContent = 'demo_contacts.csv';
  closeUploadModal();
  showApp();
  renderAll();
  showScanModal('demo_contacts.csv');
}

// ===== RENDER =====
function renderAll() {
  renderSheetTabs();
  renderTable();
  populateColumnSelects();
  renderBadges();
  populateFormulaResults('');
}

function renderSheetTabs() {
  const c = document.getElementById('sheetTabs');
  c.innerHTML = '';
  sheets.forEach((s, i) => {
    if (s.length === 0 && headers[i].length === 0) return;
    const d = document.createElement('div');
    d.className = 'sheet-tab' + (i === currentSheet ? ' active' : '');
    d.textContent = 'Sheet ' + (i + 1);
    d.onclick = () => { currentSheet = i; renderAll(); };
    c.appendChild(d);
  });
  document.getElementById('s1cols').textContent = headers[0].slice(0,3).join(', ') || '—';
  document.getElementById('s2cols').textContent = headers[1].slice(0,3).join(', ') || '—';
}

function renderTable() {
  const h = headers[currentSheet];
  const rows = sheets[currentSheet];
  const head = document.getElementById('tableHead');
  const body = document.getElementById('tableBody');

  // Header
  head.innerHTML = '';
  const htr = document.createElement('tr');
  const chkTh = document.createElement('th');
  chkTh.innerHTML = '<input type="checkbox" id="checkAll" onchange="toggleAll(this)">';
  htr.appendChild(chkTh);
  h.forEach((col, ci) => {
    const th = document.createElement('th');
    th.textContent = col;
    th.title = 'Click to sort by ' + col;
    th.onclick = () => { sortColIndex = ci; sortDirFilter = sortDirFilter === 'asc' ? 'desc' : 'asc'; applyTableSort(); };
    htr.appendChild(th);
  });
  const statusTh = document.createElement('th');
  statusTh.textContent = 'Status';
  statusTh.onclick = null;
  htr.appendChild(statusTh);
  head.appendChild(htr);

  // Rows
  body.innerHTML = '';
  rows.forEach((row, ri) => body.appendChild(buildRow(row, ri, h)));

  buildAzBar();
  applyFilters();
  populateDupeMatchCols();
  updateDupeStats();
}

function buildRow(row, ri, h) {
  const tr = document.createElement('tr');
  tr.dataset.rowIndex = ri;
  const hasBracket = row.join(' ').match(/\(.*?\)/);
  const isDup = isRowDuplicate(ri);
  const hasMissing = row.some(c => c === '' || c === undefined);
  if (isDup) tr.classList.add('row-dup');
  else if (hasBracket) tr.classList.add('row-bracket');
  else if (hasMissing) tr.classList.add('row-missing');

  // Checkbox
  const chkTd = document.createElement('td');
  chkTd.innerHTML = '<input type="checkbox" class="row-check" data-row="' + ri + '">';
  tr.appendChild(chkTd);

  // Data cells — editable
  row.forEach((cell, ci) => {
    const td = document.createElement('td');
    td.dataset.col = ci;
    td.dataset.row = ri;
    td.textContent = (masked && (h[ci]||'').toLowerCase().includes('email')) ? maskEmail(cell) : cell;
    td.addEventListener('click', () => startEdit(td, ri, ci));
    tr.appendChild(td);
  });

  // Status
  const statusTd = document.createElement('td');
  if (isDup) statusTd.innerHTML = '<span class="status-flag"><span class="status-dot dot-dup"></span> Dupe</span>';
  else if (hasBracket) statusTd.innerHTML = '<span class="status-flag"><span class="status-dot dot-bracket"></span> Bracket</span>';
  else if (hasMissing) statusTd.innerHTML = '<span class="status-flag"><span class="status-dot dot-missing"></span> Missing</span>';
  else statusTd.innerHTML = '<span class="status-dot dot-ok"></span>';
  tr.appendChild(statusTd);
  return tr;
}

// ===== INLINE CELL EDITING =====
let activeEdit = null;
function startEdit(td, ri, ci) {
  if (activeEdit) commitEdit();
  const currentVal = sheets[currentSheet][ri][ci] || '';
  td.classList.add('cell-editing');
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentVal;
  td.textContent = '';
  td.appendChild(input);
  input.focus();
  input.select();
  activeEdit = { td, ri, ci };

  input.addEventListener('blur', commitEdit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { commitEdit(); e.preventDefault(); }
    if (e.key === 'Escape') { cancelEdit(td, currentVal); }
    if (e.key === 'Tab') {
      e.preventDefault();
      commitEdit();
      // move to next cell
      const nextTd = td.parentElement.cells[td.cellIndex + (e.shiftKey ? -1 : 1)];
      if (nextTd && nextTd.dataset.col !== undefined) startEdit(nextTd, ri, parseInt(nextTd.dataset.col));
    }
  });
}
function commitEdit() {
  if (!activeEdit) return;
  const { td, ri, ci } = activeEdit;
  const input = td.querySelector('input');
  if (input) {
    const newVal = input.value;
    sheets[currentSheet][ri][ci] = newVal;
    td.classList.remove('cell-editing');
    td.textContent = newVal;
    renderBadges();
  }
  activeEdit = null;
}
function cancelEdit(td, originalVal) {
  if (!activeEdit) return;
  td.classList.remove('cell-editing');
  td.textContent = originalVal;
  activeEdit = null;
}

function addNewRow() {
  const cols = headers[currentSheet].length;
  sheets[currentSheet].push(Array(cols).fill(''));
  renderTable();
  // scroll to bottom and start editing first cell of new row
  const tbody = document.getElementById('tableBody');
  const lastRow = tbody.lastElementChild;
  if (lastRow) {
    lastRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const firstCell = lastRow.cells[1];
    if (firstCell) setTimeout(() => startEdit(firstCell, sheets[currentSheet].length - 1, 0), 100);
  }
  showToast('New row added — start typing');
}

// ===== HELPERS =====
function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  return local[0] + '***@' + domain;
}
function isRowDuplicate(ri) {
  const rows = sheets[currentSheet];
  const key = JSON.stringify(rows[ri]);
  return rows.some((r, i) => i !== ri && JSON.stringify(r) === key);
}
function proper(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/(^|\s|'|-)([a-z])/g, (m, p, c) => p + c.toUpperCase()).trim();
}
function formatLF(last, first) {
  const l = proper(last.replace(/,/g,'')), f = proper(first.replace(/,/g,''));
  if (!l) return f; if (!f) return l;
  return l + ', ' + f;
}
function getActiveOption(listId) {
  const el = document.querySelector('#' + listId + ' .opt-item.active');
  return el ? el.dataset.value : '';
}
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
}

// ===== BADGES =====
function renderBadges() {
  const rows = sheets[currentSheet];
  const h = headers[currentSheet];
  let dupes = 0, brackets = 0, missing = 0, badEmail = 0;
  const seen = {};
  rows.forEach((row, ri) => {
    const key = JSON.stringify(row);
    if (seen[key]) dupes++; else seen[key] = true;
    if (row.join(' ').match(/\(.*?\)/)) brackets++;
    if (row.some(c => !c || c.trim() === '')) missing++;
    const emailCols = h.map((col,i) => col.toLowerCase().includes('email') ? i : -1).filter(i => i >= 0);
    emailCols.forEach(ci => { const v = row[ci]||''; if (v && !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))) badEmail++; });
  });
  const c = document.getElementById('topbarBadges');
  c.innerHTML = '';
  if (dupes) { const b = makeBadge('tbadge-amber', dupes + ' dupes'); b.onclick = () => { switchPanel('dupes'); }; c.appendChild(b); }
  if (brackets) { const b = makeBadge('tbadge-purple', brackets + ' bracket'); b.onclick = () => { switchPanel('names'); }; c.appendChild(b); }
  if (badEmail) { const b = makeBadge('tbadge-red', badEmail + ' bad email'); b.onclick = () => { switchPanel('more'); validateEmails(); }; c.appendChild(b); }
  if (missing) { const b = makeBadge('tbadge-red', missing + ' missing'); b.onclick = () => { switchPanel('more'); detectMissing(); }; c.appendChild(b); }
  c.appendChild(makeBadge('tbadge-green', rows.length + ' rows'));

  // bracket alert in panel
  const ba = document.getElementById('bracketAlert');
  document.getElementById('bracketCount').textContent = brackets + ' bracket name' + (brackets!==1?'s':'') + ' detected';
  ba.style.display = brackets > 0 ? 'flex' : 'none';
  document.getElementById('dupeCount').textContent = dupes;
  document.getElementById('dupeCount').className = 'stat-num' + (dupes ? ' warn' : '');
  document.getElementById('totalRows').textContent = rows.length;
}
function makeBadge(cls, text) {
  const s = document.createElement('span');
  s.className = 'tbadge ' + cls;
  s.textContent = text;
  s.style.cursor = 'pointer';
  s.title = 'Click to go to fix';
  return s;
}

// ===== COLUMN SELECTS =====
function populateColumnSelects() {
  const h = headers[currentSheet];
  const h2 = headers[1];
  ['firstNameCol','lastNameCol','nameFormatCol','primaryKey'].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    el.innerHTML = '';
    h.forEach((col, i) => {
      const opt = document.createElement('option');
      opt.value = i; opt.textContent = col;
      if (id === 'lastNameCol' && i === 1) opt.selected = true;
      el.appendChild(opt);
    });
  });
  const sortCol = document.getElementById('sortCol');
  sortCol.innerHTML = '<option value="">Choose column…</option>';
  h.forEach((col, i) => { const o = document.createElement('option'); o.value = i; o.textContent = col; sortCol.appendChild(o); });

  const sk = document.getElementById('secondaryKey');
  sk.innerHTML = '<option value="">None</option>';
  h.forEach((col, i) => { const o = document.createElement('option'); o.value = i; o.textContent = col; sk.appendChild(o); });

  const s2c = document.getElementById('sheet2Cols');
  s2c.innerHTML = '';
  h2.forEach((col, i) => {
    const l = document.createElement('label'); l.className = 'check-label';
    l.innerHTML = `<input type="checkbox" checked data-col="${i}"> ${col}`;
    s2c.appendChild(l);
  });
  updateCombinePreview();
  updateReliability();
}

function populateDupeMatchCols() {
  const h = headers[currentSheet];
  const c = document.getElementById('dupeMatchCols'); c.innerHTML = '';
  h.forEach((col, i) => {
    const l = document.createElement('label'); l.className = 'check-label';
    l.innerHTML = `<input type="checkbox" ${i<2?'checked':''} data-col="${i}"> ${col}`;
    c.appendChild(l);
  });
}
function updateDupeStats() {
  const rows = sheets[currentSheet];
  const seen = {};
  let dupes = 0;
  rows.forEach(r => { const k = JSON.stringify(r); if (seen[k]) dupes++; else seen[k] = true; });
  document.getElementById('dupeCount').textContent = dupes;
  document.getElementById('dupeCount').className = 'stat-num' + (dupes ? ' warn' : '');
  document.getElementById('totalRows').textContent = rows.length;
}

// ===== AZ BAR =====
function buildAzBar() {
  ['azBar','azFilterStrip'].forEach(barId => {
    const c = document.getElementById(barId); if (!c) return;
    const cls = barId === 'azBar' ? 'az-letter' : 'az-filter-letter';
    c.innerHTML = '';
    const all = document.createElement('div');
    all.className = cls + ' active'; all.textContent = 'All';
    all.onclick = () => { activeLetter = null; applyFilters(); c.querySelectorAll('.'+cls).forEach(x=>x.classList.remove('active')); all.classList.add('active'); };
    c.appendChild(all);
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(l => {
      const d = document.createElement('div'); d.className = cls; d.textContent = l; d.dataset.letter = l;
      d.onclick = () => {
        activeLetter = l;
        document.querySelectorAll('.az-letter, .az-filter-letter').forEach(x => x.classList.remove('active'));
        document.querySelectorAll('[data-letter="'+l+'"]').forEach(x => x.classList.add('active'));
        applyFilters();
      };
      c.appendChild(d);
    });
  });
}

// ===== FILTERS =====
function applyFilters() {
  const q = (document.getElementById('searchInput').value || '').toLowerCase();
  const showDupes = document.getElementById('showDupes')?.checked;
  const showBrackets = document.getElementById('showBrackets')?.checked;
  const showClean = document.getElementById('showClean')?.checked;
  const rows = document.getElementById('tableBody').querySelectorAll('tr');
  let visible = 0;
  rows.forEach(tr => {
    const ri = parseInt(tr.dataset.rowIndex);
    const row = sheets[currentSheet][ri]; if (!row) return;
    const text = row.join(' ').toLowerCase();
    const matchQ = !q || text.includes(q);
    const matchL = !activeLetter || row.some(cell => (cell||'').toUpperCase().startsWith(activeLetter));
    const isDup = tr.classList.contains('row-dup');
    const isBracket = tr.classList.contains('row-bracket');
    const isClean = !isDup && !isBracket && !tr.classList.contains('row-missing');
    let show = matchQ && matchL;
    if (showDupes && !isDup) show = false;
    if (showBrackets && !isBracket) show = false;
    if (showClean && !isClean) show = false;
    if (tr.classList.contains('row-user-hidden')) show = false;
    tr.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  document.getElementById('tableEmpty').style.display = visible === 0 ? 'flex' : 'none';
  document.getElementById('clearSearch').style.display = q ? 'flex' : 'none';
}
function filterTable() { applyFilters(); }
function clearSearchInput() { document.getElementById('searchInput').value = ''; applyFilters(); }

// ===== SORT =====
function sortTable(dir) {
  sortDir = dir;
  document.getElementById('sortAZ').className = 'sort-btn' + (dir==='az'?' active':'');
  document.getElementById('sortZA').className = 'sort-btn' + (dir==='za'?' active':'');
  sheets[currentSheet].sort((a, b) => {
    const av = (a[0]||'').toLowerCase(), bv = (b[0]||'').toLowerCase();
    return dir === 'az' ? av.localeCompare(bv) : bv.localeCompare(av);
  });
  renderTable();
}
function applySortCol() {
  const ci = parseInt(document.getElementById('sortCol').value);
  if (isNaN(ci)) return;
  sortColIndex = ci; applyTableSort();
}
function setSortDir(d) {
  sortDirFilter = d;
  document.getElementById('sortAsc').className = 'sort-dir' + (d==='asc'?' active':'');
  document.getElementById('sortDesc').className = 'sort-dir' + (d==='desc'?' active':'');
  if (sortColIndex >= 0) applyTableSort();
}
function applyTableSort() {
  const ci = sortColIndex;
  sheets[currentSheet].sort((a, b) => {
    const av = (a[ci]||'').toLowerCase(), bv = (b[ci]||'').toLowerCase();
    return sortDirFilter === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });
  renderTable();
  showToast('Sorted by ' + headers[currentSheet][ci]);
}

// ===== NAME TOOLS =====
function updateCombinePreview() {
  const fi = parseInt(document.getElementById('firstNameCol').value);
  const li = parseInt(document.getElementById('lastNameCol').value);
  const fmt = getActiveOption('combineFormatList');
  const sample = sheets[currentSheet][0];
  if (!sample) return;
  const first = sample[fi] || 'Judy', last = sample[li] || 'Wong';
  let preview = '';
  if (fmt === 'last-first') preview = formatLF(last, first);
  else if (fmt === 'first-last') preview = proper(first) + ' ' + proper(last);
  else if (fmt === 'first-only') preview = proper(first);
  else preview = proper(last);
  document.getElementById('combinePreview').innerHTML = '<i class="ti ti-eye"></i> Preview: ' + preview;
}
document.getElementById('firstNameCol').addEventListener('change', updateCombinePreview);
document.getElementById('lastNameCol').addEventListener('change', updateCombinePreview);

function combineNames() {
  const fi = parseInt(document.getElementById('firstNameCol').value);
  const li = parseInt(document.getElementById('lastNameCol').value);
  const fmt = getActiveOption('combineFormatList');
  const newH = fmt==='last-first'?'Full Name (Last, First)':fmt==='first-last'?'Full Name':fmt==='first-only'?'First Only':'Last Only';
  sheets[currentSheet].forEach(row => {
    const first = row[fi]||'', last = row[li]||'';
    let combined = '';
    if (fmt==='last-first') combined = formatLF(last, first);
    else if (fmt==='first-last') combined = proper(first)+' '+proper(last);
    else if (fmt==='first-only') combined = proper(first);
    else combined = proper(last);
    row.push(combined);
  });
  headers[currentSheet].push(newH);
  renderTable(); renderBadges();
  showToast('Combined name column added');
}

function formatNames() {
  const ci = parseInt(document.getElementById('nameFormatCol').value);
  const fmt = getActiveOption('nameFormatList');
  sheets[currentSheet].forEach(row => {
    const v = row[ci] || '';
    if (fmt==='last-first') { const parts = v.split(/\s+/); if (parts.length>=2) { const last=parts.pop(); row[ci]=proper(last)+', '+proper(parts.join(' ')); } else row[ci]=proper(v); }
    else if (fmt==='proper') row[ci] = proper(v);
    else if (fmt==='upper') row[ci] = v.toUpperCase();
    else if (fmt==='lower') row[ci] = v.toLowerCase();
  });
  renderTable(); renderBadges();
  showToast('Name format applied to ' + sheets[currentSheet].length + ' rows');
}

function handleBrackets() {
  const action = getActiveOption('bracketHandlingList');
  let count = 0;
  sheets[currentSheet].forEach(row => {
    if (row.join(' ').match(/\(.*?\)/)) {
      count++;
      if (action==='strip') row[0] = row[0].replace(/\s*\(.*?\)/g,'').trim();
    }
  });
  renderTable(); renderBadges();
  showToast(action==='strip' ? 'Stripped brackets from '+count+' rows' : count+' rows highlighted');
}

// ===== DUPLICATES =====
function findDuplicates() {
  const matchCols = [...document.querySelectorAll('#dupeMatchCols input:checked')].map(el => parseInt(el.dataset.col));
  const fuzzy = document.getElementById('fuzzyMatch').checked;
  const action = getActiveOption('dupeActionList');
  if (action === 'remove') {
    const firstSeen = {};
    const toDelete = [];
    sheets[currentSheet].forEach((row, i) => {
      let key = matchCols.map(c => { let v=(row[c]||'').toLowerCase(); if(fuzzy)v=v.replace(/[^a-z0-9]/g,''); return v; }).join('||');
      if (firstSeen[key]!==undefined) toDelete.push(i); else firstSeen[key]=i;
    });
    for (let i=toDelete.length-1;i>=0;i--) sheets[currentSheet].splice(toDelete[i],1);
    renderTable(); renderBadges();
    showToast('Removed '+toDelete.length+' duplicate rows');
  } else {
    renderTable(); renderBadges();
    showToast('Duplicates highlighted — review before removing');
  }
}

// ===== VLOOKUP =====
function updateReliability() {
  const pk = document.getElementById('primaryKey');
  const val = (pk.options[pk.selectedIndex]?.text||'').toLowerCase();
  const fill = document.getElementById('reliabilityFill');
  const text = document.getElementById('reliabilityText');
  if (val.includes('email')) { fill.style.width='92%'; fill.style.background='var(--green)'; text.style.color='var(--green-dark)'; text.textContent='High — email is unique per person'; }
  else if (val.includes('id')) { fill.style.width='98%'; fill.style.background='var(--green)'; text.style.color='var(--green-dark)'; text.textContent='Very high — IDs are always unique'; }
  else if (val.includes('phone')) { fill.style.width='70%'; fill.style.background='var(--amber)'; text.style.color='var(--amber)'; text.textContent='Medium — phones can be shared'; }
  else if (val.includes('name')) { fill.style.width='45%'; fill.style.background='var(--amber)'; text.style.color='var(--amber)'; text.textContent='Medium — names are not always unique'; }
  else { fill.style.width='30%'; fill.style.background='var(--red)'; text.style.color='var(--red)'; text.textContent='Low — may produce false matches'; }
}

function runVlookup() {
  const pkIdx = parseInt(document.getElementById('primaryKey').value);
  const skIdx = document.getElementById('secondaryKey').value !== '' ? parseInt(document.getElementById('secondaryKey').value) : -1;
  const secMode = getActiveOption('secondaryModeList');
  const sheet2 = sheets[1], h2 = headers[1];
  const pkName = headers[currentSheet][pkIdx];
  let s2KeyIdx = h2.findIndex(h => h.toLowerCase()===pkName.toLowerCase());
  if (s2KeyIdx<0) s2KeyIdx=0;
  const pullCols = [...document.querySelectorAll('#sheet2Cols input:checked')].map(el=>parseInt(el.dataset.col));
  const lookup = {};
  sheet2.forEach(row => { lookup[(row[s2KeyIdx]||'').toLowerCase()] = row; });
  const newHeaders = [...headers[currentSheet]];
  pullCols.forEach(ci => { if (!newHeaders.includes(h2[ci])) newHeaders.push(h2[ci]); });
  let matched = 0;
  sheets[currentSheet].forEach(row => {
    const pkVal = (row[pkIdx]||'').toLowerCase();
    let s2row = lookup[pkVal];
    if (!s2row && skIdx>=0 && secMode==='fallback') { const skVal=(row[skIdx]||'').toLowerCase(); s2row=Object.values(lookup).find(r=>(r[s2KeyIdx]||'').toLowerCase()===skVal); }
    if (s2row) { matched++; pullCols.forEach(ci => row.push(s2row[ci]||'')); }
    else { pullCols.forEach(()=>row.push('')); }
  });
  headers[currentSheet] = newHeaders;
  renderTable(); renderBadges();
  showToast('VLOOKUP complete — '+matched+' rows matched');
}

// ===== MORE TOOLS =====
function trimWhitespace() {
  sheets[currentSheet].forEach(row => row.forEach((c,i)=>row[i]=c.trim().replace(/\s+/g,' ')));
  renderTable(); showToast('Whitespace trimmed');
}
function validateEmails() {
  const h = headers[currentSheet];
  const emailCols = h.map((col,i)=>col.toLowerCase().includes('email')?i:-1).filter(i=>i>=0);
  if (!emailCols.length) { showToast('No email column found'); return; }
  let flagged=0;
  sheets[currentSheet].forEach(row => {
    emailCols.forEach(ci => {
      const v=row[ci]||'';
      if (v && !v.startsWith('⚠') && !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))) { row[ci]='⚠ '+v; flagged++; }
    });
  });
  renderTable(); showToast('Validated emails — '+flagged+' issues flagged');
}
function extractDomain() {
  const h = headers[currentSheet];
  const ci = h.findIndex(c=>c.toLowerCase().includes('email'));
  if (ci<0) { showToast('No email column found'); return; }
  headers[currentSheet].push('Email Domain');
  sheets[currentSheet].forEach(row => { const email=row[ci]||''; row.push(email.includes('@')?email.split('@')[1]:''); });
  renderTable(); showToast('Email domain column added');
}
function splitNameCol() {
  const h = headers[currentSheet];
  const ci = h.findIndex(c=>c.toLowerCase().includes('full')||c.toLowerCase().includes('name'));
  if (ci<0) { showToast('No name column detected'); return; }
  headers[currentSheet].push('First Name (split)','Last Name (split)');
  sheets[currentSheet].forEach(row => { const parts=(row[ci]||'').trim().split(/\s+/); row.push(parts[0]||'',parts.slice(1).join(' ')||''); });
  renderTable(); showToast('Name column split into First + Last');
}
function detectMissing() {
  let flagged=0;
  sheets[currentSheet].forEach(row => row.forEach(c=>{ if(!c||c.trim()==='') flagged++; }));
  renderTable(); showToast(flagged+' blank cells highlighted in red');
}
function addRowIds() {
  if (headers[currentSheet].includes('ID')) { showToast('ID column already exists'); return; }
  headers[currentSheet].unshift('ID');
  sheets[currentSheet].forEach((row,i)=>row.unshift('ID-'+String(i+1).padStart(4,'0')));
  renderTable(); showToast('Unique ID column added');
}
function maskSensitive() {
  masked = !masked; renderTable();
  showToast(masked?'Sensitive data masked':'Data unmasked');
}

// ===== TABLE ACTIONS =====
function toggleAll(cb) { document.querySelectorAll('.row-check').forEach(c=>c.checked=cb.checked); }
function hideSelected() {
  document.querySelectorAll('.row-check:checked').forEach(cb => { const tr=cb.closest('tr'); tr.classList.add('row-user-hidden'); tr.style.display='none'; });
  showToast('Selected rows hidden');
}
function removeSelected() {
  const toRemove = [...document.querySelectorAll('.row-check:checked')].map(cb=>parseInt(cb.dataset.row)).sort((a,b)=>b-a);
  toRemove.forEach(i=>sheets[currentSheet].splice(i,1));
  renderTable(); renderBadges(); showToast('Removed '+toRemove.length+' rows');
}
function applyAll() { formatNames(); handleBrackets(); findDuplicates(); showToast('All fixes applied!'); }

// ===== EXPORT =====
function exportFile() {
  if (!sheets[currentSheet].length) { showToast('No data to export'); return; }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([headers[currentSheet],...sheets[currentSheet]]), 'Cleaned');
  if (sheets[1].length) XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([headers[1],...sheets[1]]), 'Sheet 2');
  XLSX.writeFile(wb, 'excelit_clean.xlsx');
  showToast('File exported!');
}

// ===== FORMULA FINDER =====
function searchFormulas() { populateFormulaResults(document.getElementById('formulaSearch').value.toLowerCase()); }
function populateFormulaResults(q) {
  const c = document.getElementById('formulaResults');
  const results = q ? formulas.filter(f=>f.name.toLowerCase().includes(q)||f.desc.toLowerCase().includes(q)||f.tags.some(t=>t.includes(q))) : formulas;
  c.innerHTML = '';
  results.forEach(f => {
    const d = document.createElement('div'); d.className='formula-card';
    d.innerHTML=`<div class="formula-name"><i class="ti ti-math-function"></i>${f.name}</div><div class="formula-desc">${f.desc}</div><div class="formula-code" title="Click to copy" onclick="copyFormula('${f.formula.replace(/'/g,"\\'")}'">${f.formula}</div>`;
    c.appendChild(d);
  });
  if (!results.length) c.innerHTML='<div style="text-align:center;color:var(--text-3);font-size:13px;padding:20px">No formulas found — try different keywords</div>';
}
function copyFormula(formula) {
  navigator.clipboard.writeText(formula).then(()=>showToast('Copied: '+formula));
}

// ===== PANEL NAVIGATION =====
document.querySelectorAll('.sidebar-item[data-panel]').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.sidebar-item').forEach(i=>i.classList.remove('active'));
    item.classList.add('active');
    switchPanel(item.dataset.panel);
  });
});
document.querySelectorAll('.panel-tab[data-tab]').forEach(tab => {
  tab.addEventListener('click', () => {
    switchPanel(tab.dataset.tab);
    document.querySelectorAll('.sidebar-item').forEach(i=>i.classList.remove('active'));
    const m = document.querySelector('.sidebar-item[data-panel="'+tab.dataset.tab+'"]');
    if (m) m.classList.add('active');
  });
});
function switchPanel(name) {
  document.querySelectorAll('.panel-body').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.panel-tab').forEach(t=>t.classList.remove('active'));
  const pb = document.getElementById('panel-'+name);
  const pt = document.querySelector('.panel-tab[data-tab="'+name+'"]');
  if (pb) pb.classList.add('active');
  if (pt) pt.classList.add('active');
  // sync sidebar
  document.querySelectorAll('.sidebar-item').forEach(i=>i.classList.remove('active'));
  const si = document.querySelector('.sidebar-item[data-panel="'+name+'"]');
  if (si) si.classList.add('active');
}
document.querySelectorAll('.option-list').forEach(list => {
  list.addEventListener('click', e => {
    const item = e.target.closest('.opt-item'); if (!item) return;
    list.querySelectorAll('.opt-item').forEach(i=>i.classList.remove('active'));
    item.classList.add('active');
    if (list.id==='combineFormatList') updateCombinePreview();
  });
});

// ===== INIT — show upload modal on first load =====
openUploadModal();
