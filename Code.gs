/**
 * KAS KELAS — Google Apps Script (backend + pembuat spreadsheet)
 * Tempel seluruh isi file ini di Extensions > Apps Script pada Google Spreadsheet kamu.
 * Lalu jalankan fungsi setup() SEKALI. Detail langkah ada di PANDUAN.md.
 */

// >>> GANTI PIN ini sebelum menjalankan setup(). Ini PIN admin (bendahara Kucay).
const PIN_AWAL = '123456';

const NAMA = { SET: 'Pengaturan', SIS: 'Siswa', KAS: 'Kas', TX: 'Transaksi', ANN: 'Pengumuman', RANG: 'Rangkuman' };
const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const BLN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const KEYS = ['kelas','tahun','mulaiBulan','nominal','bendahara','wa','spreadsheetUrl','qris'];
const ROW0 = 12;   // baris pertama siswa di sheet "Kas"
const COL0 = 3;    // kolom pertama minggu (C)
const WEEKS = 48;

/* ================= SETUP (jalankan sekali) ================= */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const props = PropertiesService.getScriptProperties();
  props.setProperty('SSID', ss.getId());
  if (!props.getProperty('PIN')) props.setProperty('PIN', PIN_AWAL);

  const get = n => ss.getSheetByName(n) || ss.insertSheet(n);
  const sSet = get(NAMA.SET), sSis = get(NAMA.SIS), sKas = get(NAMA.KAS), sTx = get(NAMA.TX), sAnn = get(NAMA.ANN), sRang = get(NAMA.RANG);

  // Pengaturan
  sSet.clear();
  const thn = new Date().getFullYear();
  const defSet = [['Kunci','Nilai'], ['kelas','Kelas'], ['tahun', thn], ['mulaiBulan', new Date().getMonth() + 1], ['nominal', 5000], ['bendahara','Kucay'], ['wa',''], ['spreadsheetUrl', ss.getUrl()], ['qris','']];
  sSet.getRange('B7').setNumberFormat('@');   // nomor WA tetap teks
  sSet.getRange(1, 1, defSet.length, 2).setValues(defSet);
  sSet.getRange('A1:B1').setFontWeight('bold').setBackground('#0b7a4f').setFontColor('#fff');
  sSet.setColumnWidth(1, 140); sSet.setColumnWidth(2, 360);

  // Siswa: kosong. Admin menambah lewat web (Menu Admin) atau langsung ketik di sheet ini.
  sSis.clear();
  sSis.getRange(1, 1, 1, 4).setValues([['ID','No','Nama','HP (WhatsApp)']]).setFontWeight('bold').setBackground('#0b7a4f').setFontColor('#fff');
  sSis.getRange(2, 4, 100, 1).setNumberFormat('@');
  sSis.setColumnWidth(3, 220); sSis.setColumnWidth(4, 160);

  // Transaksi
  sTx.clear();
  sTx.getRange(1, 1, 1, 7).setValues([['ID','Tanggal','Tipe','Keterangan','Jumlah','SiswaID','Kunci']]).setFontWeight('bold').setBackground('#0b7a4f').setFontColor('#fff');
  sTx.getRange('B2:B').setNumberFormat('dd/mm/yyyy'); sTx.getRange('E2:E').setNumberFormat('"Rp"#,##0');
  sTx.setColumnWidth(4, 300); sTx.setFrozenRows(1);

  // Pengumuman
  sAnn.clear();
  sAnn.getRange(1, 1, 1, 5).setValues([['ID','Tanggal','Judul','Isi','Sematkan']]).setFontWeight('bold').setBackground('#0b7a4f').setFontColor('#fff');
  sAnn.setColumnWidth(3, 220); sAnn.setColumnWidth(4, 420);

  buildKas_(sKas, 0);
  buildRangkuman_(sRang);
  ss.setActiveSheet(sKas);
  // hapus sheet bawaan kosong (Sheet1 / Lembar1)
  ['Sheet1', 'Lembar1', 'Sheet 1'].forEach(n => { const d = ss.getSheetByName(n); if (d && ss.getSheets().length > 1 && d.getLastRow() === 0) ss.deleteSheet(d); });

  // trigger onEdit supaya centang manual di spreadsheet ikut mencatat transaksi
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'onEditKas').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('onEditKas').forSpreadsheet(ss).onEdit().create();
  Logger.log('Setup selesai. Lanjut deploy sebagai Web App (lihat PANDUAN.md).');
}

function buildKas_(sh, n) {
  sh.clear(); sh.clearConditionalFormatRules();
  const G = '#0b7a4f', GL = '#e3f6ec', last = COL0 + WEEKS - 1;
  sh.setHiddenGridlines(true);
  sh.setColumnWidth(1, 36); sh.setColumnWidth(2, 200);
  for (let c = COL0; c <= last; c++) sh.setColumnWidth(c, 30);
  // judul
  sh.getRange(2, 2, 1, 6).merge().setValue('DATA PEMBAYARAN UANG KAS').setBackground(G).setFontColor('#fff').setFontWeight('bold').setFontSize(14).setHorizontalAlignment('center').setVerticalAlignment('middle');
  sh.setRowHeight(2, 34);
  // info
  const info = [
    ['Tahun', '=Pengaturan!B3'], ['Kelas', '=Pengaturan!B2'], ['Kas per minggu', '=Pengaturan!B5'],
    ['Total kas saat ini', '=Rangkuman!B5'], ['Jumlah siswa', '=COUNTA(Siswa!C2:C)'], ['Nama bendahara', '=Pengaturan!B6']
  ];
  info.forEach((r, i) => {
    const row = 4 + i;
    sh.getRange(row, 2).setValue(r[0]).setBackground(G).setFontColor('#fff').setFontWeight('bold');
    sh.getRange(row, 3, 1, 5).merge().setFormula(r[1]).setBackground(GL).setHorizontalAlignment('left').setFontWeight('bold');
  });
  sh.getRange('C6').setNumberFormat('"Rp"#,##0'); sh.getRange('C7').setNumberFormat('"Rp"#,##0');
  // header bulan
  sh.getRange(10, 1, 2, 2).setBackground(G).setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center');
  sh.getRange(10, 1).setValue('No'); sh.getRange(10, 2).setValue('Nama');
  sh.getRange(10, 1, 2, 1).merge(); sh.getRange(10, 2, 2, 1).merge();
  for (let m = 0; m < 12; m++) {
    const c = COL0 + m * 4;
    sh.getRange(10, c, 1, 4).merge().setValue(BULAN[m]).setBackground(m % 2 ? '#1a9a63' : G).setFontColor('#fff').setFontWeight('bold').setHorizontalAlignment('center');
    for (let w = 0; w < 4; w++) sh.getRange(11, c + w).setValue('M' + (w + 1)).setBackground(GL).setFontWeight('bold').setFontSize(8).setHorizontalAlignment('center');
  }
  setKasRows_(sh, n);
  sh.setFrozenRows(11); sh.setFrozenColumns(2);
}

function setKasRows_(sh, n) {
  if (n < 1) return;
  const cur = sh.getLastRow() >= ROW0 ? sh.getLastRow() - ROW0 + 1 : 0;
  for (let k = Math.max(0, cur - 0); k < n; k++) {
    const r = ROW0 + k;
    sh.getRange(r, 1).setFormula('=Siswa!B' + (k + 2));
    sh.getRange(r, 2).setFormula('=Siswa!C' + (k + 2));
  }
  const rng = sh.getRange(ROW0, COL0, n, WEEKS);
  rng.insertCheckboxes();
  sh.getRange(ROW0, 1, n, 2).setBorder(true, true, true, true, true, true, '#cfe5d8', SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange(ROW0, 1, n, 1).setHorizontalAlignment('center').setBackground('#f4fbf7');
  rng.setBorder(true, true, true, true, true, true, '#cfe5d8', SpreadsheetApp.BorderStyle.SOLID).setHorizontalAlignment('center');
}

function buildRangkuman_(sh) {
  sh.clear(); sh.setHiddenGridlines(true);
  sh.setColumnWidth(1, 220); sh.setColumnWidth(2, 140); sh.setColumnWidth(3, 140); sh.setColumnWidth(4, 140);
  sh.getRange('A1:D1').merge().setValue('RANGKUMAN KAS KELAS').setBackground('#0b7a4f').setFontColor('#fff').setFontWeight('bold').setFontSize(14).setHorizontalAlignment('center');
  const rows = [
    ['Total masuk', '=SUMIF(Transaksi!C2:C,"Masuk",Transaksi!E2:E)'],
    ['Total keluar', '=SUMIF(Transaksi!C2:C,"Keluar",Transaksi!E2:E)'],
    ['Saldo kas', '=B3-B4'],
    ['Jumlah siswa', '=COUNTA(Siswa!C2:C)'],
    ['Jumlah transaksi', '=COUNTA(Transaksi!A2:A)']
  ];
  // letakkan: B3 masuk, B4 keluar, B5 saldo
  sh.getRange('A3:B7').setValues([[rows[0][0], ''], [rows[1][0], ''], [rows[2][0], ''], [rows[3][0], ''], [rows[4][0], '']]);
  sh.getRange('B3').setFormula(rows[0][1]); sh.getRange('B4').setFormula(rows[1][1]); sh.getRange('B5').setFormula(rows[2][1]);
  sh.getRange('B6').setFormula(rows[3][1]); sh.getRange('B7').setFormula(rows[4][1]);
  sh.getRange('B3:B5').setNumberFormat('"Rp"#,##0');
  sh.getRange('A3:A7').setFontWeight('bold').setBackground('#e3f6ec'); sh.getRange('B3:B7').setFontWeight('bold');
  sh.getRange('B5').setBackground('#0b7a4f').setFontColor('#fff'); sh.getRange('A5').setBackground('#0b7a4f').setFontColor('#fff');
  sh.getRange('A9:D9').setValues([['Bulan', 'Masuk', 'Keluar', 'Selisih']]).setBackground('#0b7a4f').setFontColor('#fff').setFontWeight('bold');
  for (let m = 0; m < 12; m++) {
    const r = 10 + m;
    const rngTgl = 'Transaksi!B2:B,">="&DATE(Pengaturan!$B$3,' + (m + 1) + ',1),Transaksi!B2:B,"<"&DATE(Pengaturan!$B$3,' + (m + 2) + ',1)';
    sh.getRange(r, 1).setValue(BULAN[m]);
    sh.getRange(r, 2).setFormula('=SUMIFS(Transaksi!E2:E,Transaksi!C2:C,"Masuk",' + rngTgl + ')');
    sh.getRange(r, 3).setFormula('=SUMIFS(Transaksi!E2:E,Transaksi!C2:C,"Keluar",' + rngTgl + ')');
    sh.getRange(r, 4).setFormula('=B' + r + '-C' + r);
  }
  sh.getRange('B10:D21').setNumberFormat('"Rp"#,##0');
  sh.getRange('A9:D21').setBorder(true, true, true, true, true, true, '#cfe5d8', SpreadsheetApp.BorderStyle.SOLID);
  const chart = sh.newChart().setChartType(Charts.ChartType.COLUMN).addRange(sh.getRange('A9:C21')).setPosition(3, 6, 0, 0).setOption('title', 'Kas masuk & keluar per bulan').setOption('colors', ['#16a06a', '#e5484d']).build();
  sh.insertChart(chart);
}

/* ================= Helper data ================= */
function ss_() { return SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SSID')); }
function tz_() { return ss_().getSpreadsheetTimeZone(); }
function fmt_(d) { return d instanceof Date ? Utilities.formatDate(d, tz_(), 'yyyy-MM-dd') : String(d || ''); }
function parseD_(s) { const p = String(s).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2], 12); }
function today_() { return Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd'); }
function idxLabel_(i) { return 'M' + ((i % 4) + 1) + ' ' + BLN[Math.floor(i / 4)]; }

function getSettings_() {
  const v = ss_().getSheetByName(NAMA.SET).getRange(2, 1, KEYS.length, 2).getValues(), o = {};
  v.forEach(r => o[r[0]] = r[1]);
  o.tahun = Number(o.tahun); o.mulaiBulan = Number(o.mulaiBulan); o.nominal = Number(o.nominal);
  ['kelas','bendahara','wa','spreadsheetUrl','qris'].forEach(k => o[k] = String(o[k] == null ? '' : o[k]));
  return o;
}
function getStudents_() {
  const sh = ss_().getSheetByName(NAMA.SIS), n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, 4).getValues().filter(r => r[2] !== '').map(r => ({ id: Number(r[0]), no: Number(r[1]), nama: String(r[2]), hp: String(r[3] || '') }));
}
function getPaid_(students) {
  const sh = ss_().getSheetByName(NAMA.KAS), paid = {};
  if (!students.length) return paid;
  const vals = sh.getRange(ROW0, COL0, students.length, WEEKS).getValues();
  students.forEach((s, k) => { const a = []; vals[k].forEach((v, i) => { if (v === true) a.push(i); }); paid[s.id] = a; });
  return paid;
}
function getTx_() {
  const sh = ss_().getSheetByName(NAMA.TX), n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, 7).getValues().filter(r => r[0] !== '').map(r => ({ id: Number(r[0]), tgl: fmt_(r[1]), tipe: String(r[2]), ket: String(r[3]), jumlah: Number(r[4]), siswaId: Number(r[5] || 0), key: String(r[6] || '') }))
    .sort((a, b) => b.tgl.localeCompare(a.tgl) || b.id - a.id);
}
function getAnn_() {
  const sh = ss_().getSheetByName(NAMA.ANN), n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, 5).getValues().filter(r => r[0] !== '').map(r => ({ id: Number(r[0]), tgl: fmt_(r[1]), judul: String(r[2]), isi: String(r[3]), pin: r[4] === true || r[4] === 'TRUE' }))
    .sort((a, b) => b.tgl.localeCompare(a.tgl) || b.id - a.id);
}
function getData_() {
  const students = getStudents_();
  return { settings: getSettings_(), students: students, paid: getPaid_(students), tx: getTx_(), ann: getAnn_() };
}
function nextId_(sh) { const n = sh.getLastRow() - 1; if (n < 1) return 1; return Math.max.apply(null, sh.getRange(2, 1, n, 1).getValues().map(r => Number(r[0]) || 0)) + 1; }
function findRow_(sh, id) { const n = sh.getLastRow() - 1; if (n < 1) return 0; const v = sh.getRange(2, 1, n, 1).getValues(); for (let i = 0; i < n; i++) if (Number(v[i][0]) === Number(id)) return i + 2; return 0; }

function addTx_(tgl, tipe, ket, jumlah, siswaId, key) {
  const sh = ss_().getSheetByName(NAMA.TX), id = nextId_(sh);
  sh.appendRow([id, parseD_(tgl), tipe, ket, Number(jumlah), siswaId || '', key || '']);
  const r = sh.getLastRow();
  sh.getRange(r, 2).setNumberFormat('dd/mm/yyyy'); sh.getRange(r, 5).setNumberFormat('"Rp"#,##0');
  return id;
}
function delTxByKey_(key) {
  const sh = ss_().getSheetByName(NAMA.TX), n = sh.getLastRow() - 1; if (n < 1) return;
  const v = sh.getRange(2, 7, n, 1).getValues();
  for (let i = n - 1; i >= 0; i--) if (String(v[i][0]) === key) sh.deleteRow(i + 2);
}
function hasTxKey_(key) {
  const sh = ss_().getSheetByName(NAMA.TX), n = sh.getLastRow() - 1; if (n < 1) return false;
  return sh.getRange(2, 7, n, 1).getValues().some(r => String(r[0]) === key);
}
function studentRow_(students, id) { return students.findIndex(s => s.id === Number(id)); }

function setPaid_(studentId, idx, paid) {
  const students = getStudents_(), k = studentRow_(students, studentId);
  if (k < 0) throw new Error('Siswa tidak ditemukan');
  const cell = ss_().getSheetByName(NAMA.KAS).getRange(ROW0 + k, COL0 + Number(idx));
  const key = studentId + '|' + idx, st = getSettings_();
  cell.setValue(!!paid);
  if (paid) { if (!hasTxKey_(key)) addTx_(today_(), 'Masuk', 'Kas ' + idxLabel_(Number(idx)) + ' — ' + students[k].nama, st.nominal, studentId, key); }
  else delTxByKey_(key);
}

/* Centang manual di spreadsheet -> ikut mencatat transaksi */
function onEditKas(e) {
  try {
    const r = e.range, sh = r.getSheet();
    if (sh.getName() !== NAMA.KAS || r.getRow() < ROW0 || r.getColumn() < COL0) return;
    const students = getStudents_(), st = getSettings_();
    for (let i = 0; i < r.getNumRows(); i++) for (let j = 0; j < r.getNumColumns(); j++) {
      const k = r.getRow() + i - ROW0, idx = r.getColumn() + j - COL0, s = students[k];
      if (!s || idx < 0 || idx >= WEEKS) continue;
      const key = s.id + '|' + idx, val = sh.getRange(r.getRow() + i, r.getColumn() + j).getValue();
      if (val === true && !hasTxKey_(key)) addTx_(today_(), 'Masuk', 'Kas ' + idxLabel_(idx) + ' — ' + s.nama, st.nominal, s.id, key);
      if (val === false) delTxByKey_(key);
    }
  } catch (err) {}
}

/* ================= Web App ================= */
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function doGet(e) {
  try { return json_({ ok: true, data: getData_() }); }
  catch (err) { return json_({ ok: false, error: String(err) }); }
}
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const p = JSON.parse(e.postData.contents), pin = PropertiesService.getScriptProperties().getProperty('PIN');
    if (p.action === 'login') return json_(String(p.pin) === pin ? { ok: true } : { ok: false, error: 'PIN salah' });
    if (String(p.pin) !== pin) return json_({ ok: false, error: 'Khusus admin. PIN salah/belum masuk.' });
    lock.waitLock(20000);
    const ss = ss_();
    switch (p.action) {
      case 'togglePaid': setPaid_(p.studentId, p.idx, p.paid); break;
      case 'payMany': p.idxs.forEach(i => setPaid_(p.studentId, i, true)); break;
      case 'addTx': addTx_(p.tgl, p.tipe, p.ket, p.jumlah, 0, ''); break;
      case 'updateTx': {
        const sh = ss.getSheetByName(NAMA.TX), r = findRow_(sh, p.id);
        if (r) { sh.getRange(r, 2, 1, 4).setValues([[parseD_(p.tgl), p.tipe, p.ket, Number(p.jumlah)]]); }
        break;
      }
      case 'deleteTx': {
        const sh = ss.getSheetByName(NAMA.TX), r = findRow_(sh, p.id);
        if (r) {
          const key = String(sh.getRange(r, 7).getValue() || '');
          if (key) { const q = key.split('|'), students = getStudents_(), k = studentRow_(students, q[0]); if (k >= 0) ss.getSheetByName(NAMA.KAS).getRange(ROW0 + k, COL0 + Number(q[1])).setValue(false); }
          sh.deleteRow(r);
        }
        break;
      }
      case 'saveAnn': {
        const sh = ss.getSheetByName(NAMA.ANN);
        if (p.id) { const r = findRow_(sh, p.id); if (r) sh.getRange(r, 3, 1, 3).setValues([[p.judul, p.isi, !!p.pin]]); }
        else { sh.appendRow([nextId_(sh), parseD_(today_()), p.judul, p.isi, !!p.pin]); sh.getRange(sh.getLastRow(), 2).setNumberFormat('dd/mm/yyyy'); }
        break;
      }
      case 'deleteAnn': { const sh = ss.getSheetByName(NAMA.ANN), r = findRow_(sh, p.id); if (r) sh.deleteRow(r); break; }
      case 'saveSettings': {
        const sh = ss.getSheetByName(NAMA.SET), keep = getSettings_();
        KEYS.forEach((k, i) => { if (k !== 'qris' && p.settings[k] !== undefined) sh.getRange(2 + i, 2).setValue(p.settings[k]); });
        break;
      }
      case 'saveQris': ss.getSheetByName(NAMA.SET).getRange(2 + KEYS.indexOf('qris'), 2).setValue(String(p.qris)); break;
      case 'saveStudent': { const sh = ss.getSheetByName(NAMA.SIS), r = findRow_(sh, p.id); if (r) sh.getRange(r, 3, 1, 2).setValues([[p.nama, String(p.hp || '')]]); break; }
      case 'addStudent': {
        const sh = ss.getSheetByName(NAMA.SIS), id = nextId_(sh), n = getStudents_().length + 1;
        sh.appendRow([id, n, p.nama, String(p.hp || '')]);
        setKasRows_(ss.getSheetByName(NAMA.KAS), n);
        break;
      }
      case 'deleteStudent': {
        const sh = ss.getSheetByName(NAMA.SIS), kas = ss.getSheetByName(NAMA.KAS), list = getStudents_(), k = list.findIndex(x => x.id === Number(p.id));
        if (k >= 0) {
          kas.deleteRow(ROW0 + k);                       // hapus baris centang dulu
          const r = findRow_(sh, p.id); if (r) sh.deleteRow(r);
          const n = sh.getLastRow() - 1; if (n > 0) sh.getRange(2, 2, n, 1).setValues(Array.from({ length: n }, (_, i) => [i + 1]));
        }
        break;
      }
      case 'changePin': if (String(p.newPin).length >= 4) PropertiesService.getScriptProperties().setProperty('PIN', String(p.newPin)); break;
      default: return json_({ ok: false, error: 'Aksi tidak dikenal' });
    }
    return json_({ ok: true, data: getData_() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally { try { lock.releaseLock(); } catch (e) {} }
}
