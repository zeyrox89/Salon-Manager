// =============================================
// js/app.js — Logica principale Salon Manager
// =============================================

// ----------- STATO GLOBALE -----------
let currentPage = 'dashboard';
let editingPrenotazioneId = null;
let editingClienteId = null;
let selectedDate = new Date();
let calendarMonth = new Date();
let allPrenotazioni = [];
let allClienti = [];
let allServizi = [];

// ----------- UTILS -----------
function fmt(date) {
  return new Date(date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtTime(date) {
  return new Date(date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}
function fmtCurrency(n) {
  return '€' + Number(n).toFixed(2).replace('.', ',');
}
function initials(nome, cognome) {
  return ((nome?.[0] || '') + (cognome?.[0] || '')).toUpperCase();
}
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type;
  setTimeout(() => t.className = 'toast hidden', 3000);
}
function statoBadge(stato) {
  const map = { confermata: 'badge-blue', completata: 'badge-green', cancellata: 'badge-red' };
  const label = { confermata: 'Confermata', completata: 'Completata', cancellata: 'Cancellata' };
  return `<span class="badge ${map[stato] || 'badge-gray'}">${label[stato] || stato}</span>`;
}

// ----------- NAVIGAZIONE -----------
function navigateTo(page, el) {
  event?.preventDefault();
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  if (el) el.classList.add('active');
  renderPage(page);
}

function renderPage(page) {
  if (page === 'dashboard') renderDashboard();
  else if (page === 'prenotazioni') renderPrenotazioni();
  else if (page === 'clienti') renderClienti();
  else if (page === 'servizi') renderServizi();
  else if (page === 'statistiche') renderStatistiche();
}

// ----------- CONFIG CHECK -----------
function isConfigured() {
  return typeof SUPABASE_URL !== 'undefined'
    && SUPABASE_URL !== 'https://TUO-PROGETTO.supabase.co'
    && typeof SUPABASE_ANON_KEY !== 'undefined'
    && SUPABASE_ANON_KEY !== 'LA-TUA-ANON-KEY';
}

function showConfigError(el) {
  el.innerHTML = `
    <div style="max-width:520px;margin:4rem auto;padding:2rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);">
      <div style="font-size:32px;margin-bottom:1rem;">⚙️</div>
      <h2 style="font-size:18px;font-weight:600;margin-bottom:0.75rem;">Configura Supabase</h2>
      <p style="color:var(--text-muted);font-size:14px;line-height:1.6;margin-bottom:1.25rem;">
        Per far funzionare l'app devi inserire le tue credenziali Supabase nel file <code style="background:var(--bg);padding:2px 6px;border-radius:4px;">js/config.js</code>.
      </p>
      <ol style="color:var(--text-muted);font-size:14px;line-height:2;padding-left:1.25rem;">
        <li>Vai su <a href="https://supabase.com" target="_blank" style="color:var(--accent)">supabase.com</a> e crea un progetto</li>
        <li>Esegui il file <strong>supabase_schema.sql</strong> nell'editor SQL</li>
        <li>Vai su <em>Project Settings → API</em></li>
        <li>Copia <strong>Project URL</strong> e <strong>anon public key</strong></li>
        <li>Incollali in <code style="background:var(--bg);padding:2px 6px;border-radius:4px;">js/config.js</code></li>
        <li>Ricarica questa pagina</li>
      </ol>
    </div>`;
}

function showFetchError(el, errMsg) {
  el.innerHTML = `
    <div style="max-width:520px;margin:4rem auto;padding:2rem;background:var(--surface);border:1px solid #f0a0a0;border-radius:var(--radius-lg);">
      <div style="font-size:32px;margin-bottom:1rem;">❌</div>
      <h2 style="font-size:18px;font-weight:600;margin-bottom:0.75rem;">Errore di connessione</h2>
      <p style="color:var(--text-muted);font-size:14px;line-height:1.6;margin-bottom:0.75rem;">
        L'app non riesce a connettersi al database. Dettaglio errore:
      </p>
      <code style="display:block;background:var(--bg);padding:0.75rem;border-radius:6px;font-size:12px;color:var(--danger);word-break:break-all;">${errMsg}</code>
      <p style="color:var(--text-muted);font-size:13px;margin-top:1rem;">
        Controlla che le credenziali in <strong>js/config.js</strong> siano corrette e che il file <strong>supabase_schema.sql</strong> sia stato eseguito su Supabase.
      </p>
    </div>`;
}

// ----------- SUPABASE FETCH -----------
async function fetchAll() {
  const [resP, resC, resS] = await Promise.all([
    supabase.from('prenotazioni_dettaglio').select('*').order('data_ora', { ascending: false }),
    supabase.from('clienti').select('*').order('cognome'),
    supabase.from('servizi').select('*').eq('attivo', true).order('nome'),
  ]);

  if (resP.error) throw new Error(resP.error.message);
  if (resC.error) throw new Error(resC.error.message);
  if (resS.error) throw new Error(resS.error.message);

  allPrenotazioni = resP.data || [];
  allClienti = resC.data || [];
  allServizi = resS.data || [];
}

// ============================================
// DASHBOARD
// ============================================
async function renderDashboard() {
  const el = document.getElementById('page-dashboard');
  el.innerHTML = '<div class="loader">Caricamento...</div>';
  if (!isConfigured()) { showConfigError(el); return; }
  try { await fetchAll(); } catch(e) { showFetchError(el, e.message); return; }

  const oggi = new Date(); oggi.setHours(0,0,0,0);
  const inizioMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1);
  const inizioMesePrec = new Date(oggi.getFullYear(), oggi.getMonth() - 1, 1);
  const fineMesePrec = new Date(oggi.getFullYear(), oggi.getMonth(), 0);

  const meseCorrente = allPrenotazioni.filter(p => {
    const d = new Date(p.data_ora); return d >= inizioMese && p.stato !== 'cancellata';
  });
  const mesePrecedente = allPrenotazioni.filter(p => {
    const d = new Date(p.data_ora); return d >= inizioMesePrec && d <= fineMesePrec && p.stato !== 'cancellata';
  });
  const oggiList = allPrenotazioni.filter(p => {
    const d = new Date(p.data_ora); d.setHours(0,0,0,0); return d.getTime() === oggi.getTime() && p.stato !== 'cancellata';
  }).sort((a,b) => new Date(a.data_ora) - new Date(b.data_ora));

  const incassoMese = meseCorrente.filter(p => p.stato === 'completata').reduce((s, p) => s + +p.prezzo, 0);
  const incassoPrec = mesePrecedente.filter(p => p.stato === 'completata').reduce((s, p) => s + +p.prezzo, 0);
  const deltaIncasso = incassoPrec > 0 ? ((incassoMese - incassoPrec) / incassoPrec * 100).toFixed(0) : null;
  const appMese = meseCorrente.length;
  const appPrec = mesePrecedente.length;
  const deltaApp = appPrec > 0 ? appMese - appPrec : null;

  const prossimiGiorni = allPrenotazioni.filter(p => {
    const d = new Date(p.data_ora); return d > new Date() && p.stato === 'confermata';
  }).sort((a,b) => new Date(a.data_ora) - new Date(b.data_ora)).slice(0, 5);

  el.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Dashboard</div><div class="page-subtitle">${oggi.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div></div>
      <button class="btn btn-primary" onclick="openModalPrenotazione()">+ Prenotazione</button>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">Incasso mese</div>
        <div class="stat-value">${fmtCurrency(incassoMese)}</div>
        ${deltaIncasso !== null ? `<div class="stat-delta ${+deltaIncasso < 0 ? 'down' : ''}">${+deltaIncasso >= 0 ? '+' : ''}${deltaIncasso}% vs mese scorso</div>` : ''}
      </div>
      <div class="stat-card">
        <div class="stat-label">Appuntamenti mese</div>
        <div class="stat-value">${appMese}</div>
        ${deltaApp !== null ? `<div class="stat-delta ${deltaApp < 0 ? 'down' : ''}">${deltaApp >= 0 ? '+' : ''}${deltaApp} vs mese scorso</div>` : ''}
      </div>
      <div class="stat-card">
        <div class="stat-label">Appuntamenti oggi</div>
        <div class="stat-value">${oggiList.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Clienti totali</div>
        <div class="stat-value">${allClienti.length}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">
      <div class="card">
        <div class="card-header"><span class="card-title">Oggi</span></div>
        <div class="card-body" style="padding:1rem;">
          ${oggiList.length === 0 ? '<div class="empty-day">Nessun appuntamento oggi</div>' :
            oggiList.map(p => `
              <div class="booking-item">
                <div class="booking-time">${fmtTime(p.data_ora)}</div>
                <div>
                  <div class="booking-info-name">${p.cliente_nome || 'Cliente eliminato'}</div>
                  <div class="booking-info-service">${p.servizio_nome || '—'}</div>
                </div>
                <div class="booking-price">${fmtCurrency(p.prezzo)}</div>
              </div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Prossimi appuntamenti</span></div>
        <div class="card-body" style="padding:1rem;">
          ${prossimiGiorni.length === 0 ? '<div class="empty-day">Nessuna prenotazione futura</div>' :
            prossimiGiorni.map(p => `
              <div class="booking-item">
                <div>
                  <div class="booking-info-name">${p.cliente_nome || '—'}</div>
                  <div class="booking-info-service">${fmt(p.data_ora)} — ${fmtTime(p.data_ora)} — ${p.servizio_nome || '—'}</div>
                </div>
                <div class="booking-price">${fmtCurrency(p.prezzo)}</div>
              </div>`).join('')}
        </div>
      </div>
    </div>`;
}

// ============================================
// PRENOTAZIONI (vista calendario)
// ============================================
async function renderPrenotazioni() {
  const el = document.getElementById('page-prenotazioni');
  el.innerHTML = '<div class="loader">Caricamento...</div>';
  if (!isConfigured()) { showConfigError(el); return; }
  try { await fetchAll(); } catch(e) { showFetchError(el, e.message); return; }
  buildPrenotazioniUI();
}

function buildPrenotazioniUI() {
  const el = document.getElementById('page-prenotazioni');
  el.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Prenotazioni</div></div>
      <button class="btn btn-primary" onclick="openModalPrenotazione()">+ Nuova</button>
    </div>
    <div class="cal-wrap">
      <div>
        <div class="mini-cal">
          <div class="mini-cal-header">
            <button class="btn btn-secondary btn-sm btn-icon" onclick="prevMonth()">‹</button>
            <span class="mini-cal-title" id="cal-month-lbl"></span>
            <button class="btn btn-secondary btn-sm btn-icon" onclick="nextMonth()">›</button>
          </div>
          <div class="cal-grid" id="cal-headers2">
            <div class="cal-dh">L</div><div class="cal-dh">M</div><div class="cal-dh">M</div>
            <div class="cal-dh">G</div><div class="cal-dh">V</div><div class="cal-dh">S</div><div class="cal-dh">D</div>
          </div>
          <div class="cal-grid" id="mini-calendar"></div>
        </div>
      </div>
      <div>
        <div class="day-bookings-title" id="day-title"></div>
        <div id="day-list"></div>
      </div>
    </div>`;
  buildMiniCalendar();
  renderDayBookings(selectedDate);
}

function buildMiniCalendar() {
  const cal = document.getElementById('mini-calendar');
  const lbl = document.getElementById('cal-month-lbl');
  if (!cal) return;
  cal.innerHTML = '';
  const y = calendarMonth.getFullYear(), m = calendarMonth.getMonth();
  lbl.textContent = new Date(y, m, 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  const firstDay = (new Date(y, m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const today = new Date(); today.setHours(0,0,0,0);

  // Giorni con prenotazioni
  const datesWithBookings = new Set(allPrenotazioni
    .filter(p => p.stato !== 'cancellata')
    .map(p => { const d = new Date(p.data_ora); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }));

  for (let i = 0; i < firstDay; i++) { const e = document.createElement('div'); e.className='cal-d empty'; cal.appendChild(e); }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(y, m, d);
    const e = document.createElement('div');
    e.className = 'cal-d';
    e.textContent = d;
    if (date.getTime() === today.getTime()) e.classList.add('today');
    if (date.getTime() === selectedDate.setHours(0,0,0,0)) { e.classList.add('selected'); selectedDate = new Date(selectedDate); }
    if (datesWithBookings.has(`${y}-${m}-${d}`)) e.classList.add('has-events');
    e.onclick = () => { selectedDate = date; buildMiniCalendar(); renderDayBookings(date); };
    cal.appendChild(e);
  }
}

function prevMonth() { calendarMonth.setMonth(calendarMonth.getMonth() - 1); buildMiniCalendar(); }
function nextMonth() { calendarMonth.setMonth(calendarMonth.getMonth() + 1); buildMiniCalendar(); }

function renderDayBookings(date) {
  const title = document.getElementById('day-title');
  const list = document.getElementById('day-list');
  if (!title || !list) return;
  title.textContent = date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const d = date; d.setHours(0,0,0,0);
  const bookings = allPrenotazioni.filter(p => {
    const pd = new Date(p.data_ora); pd.setHours(0,0,0,0);
    return pd.getTime() === d.getTime();
  }).sort((a,b) => new Date(a.data_ora) - new Date(b.data_ora));

  if (bookings.length === 0) {
    list.innerHTML = '<div class="empty-day">Nessun appuntamento per questo giorno</div>';
    return;
  }
  list.innerHTML = bookings.map(p => `
    <div class="booking-item">
      <div class="booking-time">${fmtTime(p.data_ora)}</div>
      <div style="flex:1">
        <div class="booking-info-name">${p.cliente_nome || 'Cliente eliminato'}</div>
        <div class="booking-info-service">${p.servizio_nome || '—'} · ${p.durata_minuti} min</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        ${statoBadge(p.stato)}
        <div class="booking-price">${fmtCurrency(p.prezzo)}</div>
        <button class="btn btn-secondary btn-sm" onclick="openModalPrenotazione('${p.id}')">✎</button>
        <button class="btn btn-danger btn-sm" onclick="deletePrenotazione('${p.id}')">✕</button>
      </div>
    </div>`).join('');
}

// ============================================
// CLIENTI
// ============================================
async function renderClienti() {
  const el = document.getElementById('page-clienti');
  el.innerHTML = '<div class="loader">Caricamento...</div>';
  if (!isConfigured()) { showConfigError(el); return; }
  try { await fetchAll(); } catch(e) { showFetchError(el, e.message); return; }
  buildClientiUI(allClienti);
}

function buildClientiUI(clienti) {
  const el = document.getElementById('page-clienti');
  el.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Clienti</div><div class="page-subtitle">${clienti.length} clienti</div></div>
      <button class="btn btn-primary" onclick="openModalCliente()">+ Nuovo cliente</button>
    </div>
    <div class="search-row">
      <div class="search-input-wrap">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" placeholder="Cerca per nome o telefono..." oninput="filterClientiUI(this.value)" />
      </div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Cliente</th><th>Telefono</th><th>Email</th>
            <th>Prenotazioni</th><th>Spesa totale</th><th></th>
          </tr></thead>
          <tbody id="clienti-tbody">
            ${buildClientiRows(clienti)}
          </tbody>
        </table>
      </div>
    </div>`;
}

function buildClientiRows(clienti) {
  return clienti.map(c => {
    const prenotazioni = allPrenotazioni.filter(p => p.cliente_id === c.id && p.stato !== 'cancellata');
    const spesa = prenotazioni.filter(p => p.stato === 'completata').reduce((s,p) => s + +p.prezzo, 0);
    return `<tr>
      <td><div class="avatar-row">
        <div class="avatar">${initials(c.nome, c.cognome)}</div>
        <div><div class="avatar-name">${c.nome} ${c.cognome}</div></div>
      </div></td>
      <td>${c.telefono || '—'}</td>
      <td>${c.email || '—'}</td>
      <td>${prenotazioni.length}</td>
      <td>${fmtCurrency(spesa)}</td>
      <td style="display:flex;gap:6px;justify-content:flex-end;">
        <button class="btn btn-secondary btn-sm" onclick="openModalCliente('${c.id}')">✎</button>
        <button class="btn btn-danger btn-sm" onclick="deleteCliente('${c.id}')">✕</button>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem">Nessun cliente trovato</td></tr>';
}

function filterClientiUI(q) {
  const filtered = allClienti.filter(c =>
    `${c.nome} ${c.cognome}`.toLowerCase().includes(q.toLowerCase()) ||
    (c.telefono || '').includes(q)
  );
  const tbody = document.getElementById('clienti-tbody');
  if (tbody) tbody.innerHTML = buildClientiRows(filtered);
}

// ============================================
// SERVIZI
// ============================================
async function renderServizi() {
  const el = document.getElementById('page-servizi');
  el.innerHTML = '<div class="loader">Caricamento...</div>';
  if (!isConfigured()) { showConfigError(el); return; }
  try { await fetchAll(); } catch(e) { showFetchError(el, e.message); return; }
  el.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Servizi</div></div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Servizio</th><th>Durata</th><th>Prezzo</th><th>Stato</th></tr></thead>
          <tbody>
            ${allServizi.map(s => `<tr>
              <td><strong>${s.nome}</strong></td>
              <td>${s.durata_minuti} min</td>
              <td>${fmtCurrency(s.prezzo)}</td>
              <td><span class="badge ${s.attivo ? 'badge-green' : 'badge-gray'}">${s.attivo ? 'Attivo' : 'Inattivo'}</span></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <p style="margin-top:1rem;font-size:13px;color:var(--text-muted)">Per modificare i servizi, usa l'editor SQL di Supabase o aggiungi un form qui.</p>`;
}

// ============================================
// STATISTICHE
// ============================================
async function renderStatistiche() {
  const el = document.getElementById('page-statistiche');
  el.innerHTML = '<div class="loader">Caricamento...</div>';
  if (!isConfigured()) { showConfigError(el); return; }
  try { await fetchAll(); } catch(e) { showFetchError(el, e.message); return; }

  const oggi = new Date();
  const inizioMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1);

  const completate = allPrenotazioni.filter(p => p.stato === 'completata');
  const meseCorr = completate.filter(p => new Date(p.data_ora) >= inizioMese);
  const incassoTotale = completate.reduce((s,p) => s + +p.prezzo, 0);
  const incassoMese = meseCorr.reduce((s,p) => s + +p.prezzo, 0);
  const scontrino = completate.length > 0 ? incassoTotale / completate.length : 0;

  // Servizi più richiesti
  const servMap = {};
  allPrenotazioni.filter(p => p.stato !== 'cancellata').forEach(p => {
    const n = p.servizio_nome || 'Altro';
    servMap[n] = (servMap[n] || 0) + 1;
  });
  const servTop = Object.entries(servMap).sort((a,b) => b[1]-a[1]).slice(0,6);
  const maxServ = servTop[0]?.[1] || 1;

  // Incasso ultimi 6 mesi
  const mesiMap = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(oggi.getFullYear(), oggi.getMonth() - i, 1);
    const key = d.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' });
    mesiMap[key] = 0;
  }
  completate.forEach(p => {
    const d = new Date(p.data_ora);
    const key = d.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' });
    if (key in mesiMap) mesiMap[key] += +p.prezzo;
  });
  const maxMese = Math.max(...Object.values(mesiMap), 1);

  el.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Statistiche</div></div>
    </div>
    <div class="stats-row">
      <div class="stat-card"><div class="stat-label">Incasso mese corrente</div><div class="stat-value">${fmtCurrency(incassoMese)}</div></div>
      <div class="stat-card"><div class="stat-label">Incasso totale storico</div><div class="stat-value">${fmtCurrency(incassoTotale)}</div></div>
      <div class="stat-card"><div class="stat-label">Appuntamenti completati</div><div class="stat-value">${completate.length}</div></div>
      <div class="stat-card"><div class="stat-label">Scontrino medio</div><div class="stat-value">${fmtCurrency(scontrino)}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">
      <div class="card">
        <div class="card-header"><span class="card-title">Incasso ultimi 6 mesi</span></div>
        <div class="card-body" style="padding:1.25rem;">
          <div class="bar-wrap">
            ${Object.entries(mesiMap).map(([k,v]) => `
              <div class="bar-row">
                <div class="bar-lbl">${k}</div>
                <div class="bar-track"><div class="bar-fill" style="width:${Math.round(v/maxMese*100)}%"></div></div>
                <div class="bar-val">${fmtCurrency(v)}</div>
              </div>`).join('')}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Servizi più richiesti</span></div>
        <div class="card-body" style="padding:1.25rem;">
          <div class="bar-wrap">
            ${servTop.map(([k,v]) => `
              <div class="bar-row">
                <div class="bar-lbl">${k}</div>
                <div class="bar-track"><div class="bar-fill" style="width:${Math.round(v/maxServ*100)}%"></div></div>
                <div class="bar-val">${v}</div>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
}

// ============================================
// MODAL PRENOTAZIONE
// ============================================
async function openModalPrenotazione(id = null) {
  editingPrenotazioneId = id;
  await fetchAll();

  // Popola select clienti
  const selC = document.getElementById('f-cliente');
  selC.innerHTML = '<option value="">— Seleziona cliente —</option>' +
    allClienti.map(c => `<option value="${c.id}">${c.cognome} ${c.nome}</option>`).join('');

  // Popola select servizi
  const selS = document.getElementById('f-servizio');
  selS.innerHTML = '<option value="">— Seleziona servizio —</option>' +
    allServizi.map(s => `<option value="${s.id}" data-prezzo="${s.prezzo}" data-durata="${s.durata_minuti}">${s.nome} — ${fmtCurrency(s.prezzo)}</option>`).join('');

  if (id) {
    document.getElementById('modal-title').textContent = 'Modifica prenotazione';
    const p = allPrenotazioni.find(x => x.id === id);
    if (p) {
      selC.value = p.cliente_id || '';
      selS.value = p.servizio_id || '';
      const dt = new Date(p.data_ora);
      document.getElementById('f-data').value = dt.toISOString().split('T')[0];
      document.getElementById('f-ora').value = dt.toTimeString().slice(0,5);
      document.getElementById('f-prezzo').value = p.prezzo;
      document.getElementById('f-stato').value = p.stato;
      document.getElementById('f-note').value = p.note || '';
    }
  } else {
    document.getElementById('modal-title').textContent = 'Nuova prenotazione';
    document.getElementById('f-data').value = selectedDate.toISOString().split('T')[0];
    document.getElementById('f-ora').value = '09:00';
    document.getElementById('f-prezzo').value = '';
    document.getElementById('f-stato').value = 'confermata';
    document.getElementById('f-note').value = '';
  }

  document.getElementById('modal-overlay').classList.remove('hidden');
}

function onServizioChange() {
  const sel = document.getElementById('f-servizio');
  const opt = sel.options[sel.selectedIndex];
  if (opt && opt.dataset.prezzo) {
    document.getElementById('f-prezzo').value = opt.dataset.prezzo;
  }
}

async function savePrenotazione() {
  const clienteId = document.getElementById('f-cliente').value;
  const servizioId = document.getElementById('f-servizio').value;
  const data = document.getElementById('f-data').value;
  const ora = document.getElementById('f-ora').value;
  const prezzo = document.getElementById('f-prezzo').value;
  const stato = document.getElementById('f-stato').value;
  const note = document.getElementById('f-note').value;

  if (!clienteId || !servizioId || !data || !ora) {
    showToast('Compila tutti i campi obbligatori', 'error'); return;
  }

  const selS = document.getElementById('f-servizio');
  const opt = selS.options[selS.selectedIndex];
  const durata = opt?.dataset.durata || 60;
  const dataOra = new Date(`${data}T${ora}`).toISOString();

  const payload = {
    cliente_id: clienteId, servizio_id: servizioId,
    data_ora: dataOra, durata_minuti: parseInt(durata),
    prezzo: parseFloat(prezzo), stato, note
  };

  let err;
  if (editingPrenotazioneId) {
    ({ error: err } = await supabase.from('prenotazioni').update(payload).eq('id', editingPrenotazioneId));
  } else {
    ({ error: err } = await supabase.from('prenotazioni').insert([payload]));
  }

  if (err) { showToast('Errore: ' + err.message, 'error'); return; }
  showToast(editingPrenotazioneId ? 'Prenotazione aggiornata' : 'Prenotazione salvata');
  closeModal();
  renderPage(currentPage);
}

async function deletePrenotazione(id) {
  if (!confirm('Eliminare questa prenotazione?')) return;
  const { error } = await supabase.from('prenotazioni').delete().eq('id', id);
  if (error) { showToast('Errore: ' + error.message, 'error'); return; }
  showToast('Prenotazione eliminata');
  renderPage(currentPage);
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modal-overlay')) return;
  document.getElementById('modal-overlay').classList.add('hidden');
}

// ============================================
// MODAL CLIENTE
// ============================================
async function openModalCliente(id = null) {
  editingClienteId = id;
  if (id) {
    const c = allClienti.find(x => x.id === id);
    document.getElementById('modal-cliente-title').textContent = 'Modifica cliente';
    document.getElementById('fc-nome').value = c?.nome || '';
    document.getElementById('fc-cognome').value = c?.cognome || '';
    document.getElementById('fc-telefono').value = c?.telefono || '';
    document.getElementById('fc-email').value = c?.email || '';
    document.getElementById('fc-note').value = c?.note || '';
  } else {
    document.getElementById('modal-cliente-title').textContent = 'Nuovo cliente';
    ['fc-nome','fc-cognome','fc-telefono','fc-email','fc-note'].forEach(id => document.getElementById(id).value = '');
  }
  document.getElementById('modal-cliente-overlay').classList.remove('hidden');
}

async function saveCliente() {
  const nome = document.getElementById('fc-nome').value.trim();
  const cognome = document.getElementById('fc-cognome').value.trim();
  if (!nome || !cognome) { showToast('Nome e cognome obbligatori', 'error'); return; }

  const payload = {
    nome, cognome,
    telefono: document.getElementById('fc-telefono').value.trim() || null,
    email: document.getElementById('fc-email').value.trim() || null,
    note: document.getElementById('fc-note').value.trim() || null,
  };

  let err;
  if (editingClienteId) {
    ({ error: err } = await supabase.from('clienti').update(payload).eq('id', editingClienteId));
  } else {
    ({ error: err } = await supabase.from('clienti').insert([payload]));
  }

  if (err) { showToast('Errore: ' + err.message, 'error'); return; }
  showToast(editingClienteId ? 'Cliente aggiornato' : 'Cliente aggiunto');
  closeModalCliente();
  renderPage(currentPage);
}

async function deleteCliente(id) {
  if (!confirm('Eliminare questo cliente? Le prenotazioni associate non verranno eliminate.')) return;
  const { error } = await supabase.from('clienti').delete().eq('id', id);
  if (error) { showToast('Errore: ' + error.message, 'error'); return; }
  showToast('Cliente eliminato');
  renderPage(currentPage);
}

function closeModalCliente(e) {
  if (e && e.target !== document.getElementById('modal-cliente-overlay')) return;
  document.getElementById('modal-cliente-overlay').classList.add('hidden');
}

// ----------- INIT -----------
renderPage('dashboard');
