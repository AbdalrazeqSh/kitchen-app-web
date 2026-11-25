(function () {
'use strict';
/* ===== 00-core.js ===== */
var E = window.Engine, UI = window.UI, X = UI.X, B = UI.B, T = UI.T, noop = UI.noop, VERSION = '1.0.198';
var Cap = window.Capacitor || {}, P = Cap.Plugins || {};
var S = null, PROP = null;
var $ = function (i) { return document.getElementById(i); };

/* ---------- أدوات ---------- */
function iso(d) { d = d || new Date(); var m = d.getMonth() + 1, dd = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd; }
function dshow(s) { var p = s.split('-'); return +p[2] + '/' + +p[1] + '/' + p[0]; }
var DN = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'], MN = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
function dlong(s) { var d = new Date(s + 'T12:00:00'); return DN[d.getDay()] + ' ' + d.getDate() + ' ' + MN[d.getMonth()] + ' ' + d.getFullYear(); }
function dlabel(s) { var t = iso(), y = iso(new Date(Date.now() - 864e5)); return s === t ? 'اليوم' : s === y ? 'أمس' : DN[new Date(s + 'T12:00:00').getDay()] + ' ' + dshow(s).slice(0, -5); }
function r2(n) { return Math.round(n * 100) / 100; }
function r3(n) { return Math.round(n * 1000) / 1000; }
function gSmall(n, u) { return n > 0 && n < 0.5 && (u === 'كيلو' || u === 'لتر'); }
function fmt(n) { var v = r2(n); return v < 0 ? '\u2066' + v + '\u2069' : String(v); } /* الناقص: معزول LTR فلا ينقلب الشرطة في سياق RTL */
function fmtRaw(n) { return String(r2(n)); }
function qv(n, u) { return gSmall(n, u) ? String(Math.round(n * 1000)) : fmt(n); }
function qu(n, u) { return gSmall(n, u) ? (u === 'كيلو' ? 'غرام' : 'مل') : u; }
function qtyU(n, u) { return qv(n, u) + ' ' + qu(n, u); }
/* إشارة المبلغ في صفوف الحركات: + وارد، − ناقص (الدلالة ليست باللون وحده) */
function sg(dir, t) { return '\u200E' + (dir === 'in' ? '+' : '\u2212') + '\u200E' + t; }
var MONEY_EXACT = false; /* في كشوف الحساب الخارجية: بلا تقريب حتى لا يختلف المجموع عن مجموع الأسطر الظاهرة */
function money(n) { var v = Math.abs(n) >= 1000 && !MONEY_EXACT ? Math.round(n) : r2(n), p = (v % 1 ? v.toFixed(2) : String(v)).split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return (n < 0 ? '‎' : '') + p.join('.') + ' ₪'; }
/* العدد والمعدود: 1 مفرد، 2 وما فوق 10 مفرد بالرقم (2 قدر، 24 قدر)، 3–10 جمع، 11 فأكثر والكسر مفرد (24 قدر، 2.5 قدر) (2.5 قدر) */
/* كلمة المعدود وحدها لتسمية تحت رقم: 1 و11 فأكثر مفرد، 3–10 جمع (24 صنف، 5 قدور) */
function plw(n, one, many) { return n !== 1 && n >= 3 && n <= 10 && n === Math.floor(n) ? many : one; }
function pl(n, one, two, many) {
  if (n === 1) return one;
  var m = /^(\S+?)\s+(واحدة|واحد)(.*)$/.exec(one);
  if (n === 0 || n === 2 || n >= 11 || n !== Math.floor(n)) return n + ' ' + (m ? m[1] + m[3] : one); /* 2 رقمًا لا مثنى: العين تلتقط الأرقام في الملخصات */
  return n + ' ' + many;
}
function norm(s) { return String(s || '').replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim().toLowerCase(); }
function item(id) { return E.by(S.items, id); }
function led(id) { return E.by(S.ledgers, id); }
var GHOST_REC = { id: '__free', code: '', name: 'طبخة بلا وصفة', en: '', kind: 'both', lines: [], steps: [], ghost: true }; /* طبخات الشيت المعتمدة بلا وصفة: نفس شاشة التعديل بأصناف إضافية فقط */
function rec(id) { return E.by(S.recipes, id) || (id === GHOST_REC.id ? GHOST_REC : null); }
function inst(id) { return E.by(S.insts, id); }
function wk(id) { return E.by(S.workers || [], id); }
function packTxt(it, q) {
  var p = it.pack; if (!p || !(p.n > 0) || !(q > 0)) return '';
  var full = Math.floor(q / p.n + 1e-9), rem = r2(q - full * p.n);
  if (!full) return ''; /* وحدة التعبئة تُعرض فقط إن تجاوز الرصيد وحدة كاملة */
  return packNum(full, p.name) + (rem > 0 ? ' و' + fmt(rem) + ' ' + it.unit : '');
}
/* العدد والمعدود لوحدة التعبئة: كرتونة واحدة، كرتونتان، 3 كراتين، 13 شوال */
var PACK_PL = { 'صندوق': 'صناديق', 'كرتونة': 'كراتين', 'كيس': 'أكياس', 'علبة': 'علب', 'شوال': 'شوالات', 'جالون': 'جالونات', 'غالون': 'غالونات', 'تنكة': 'تنكات', 'ربطة': 'ربطات', 'باكيت': 'باكيتات', 'حبة': 'حبات', 'قارورة': 'قوارير', 'عبوة': 'عبوات', 'بالة': 'بالات', 'طبق': 'أطباق', 'سطل': 'سطول', 'جركن': 'جراكن', 'برميل': 'براميل' };
function packNum(n, name) {
  var fem = /ة$/.test(name), many = PACK_PL[name] || (fem ? name.slice(0, -1) + 'ات' : name + 'ات');
  return pl(n, name + (fem ? ' واحدة' : ' واحد'), fem ? name.slice(0, -1) + 'تان' : name + 'ان', many);
}
/* كمية القدر الواحد من الإجمالي بلا تقريب مبكر (كزبرة 1.76 كيلو لـ 28 قدرًا = 63 غرامًا لا 60) */
function perTxt(q, pots, u) {
  var v = q / pots;
  if (gSmall(v, u)) { var g = Math.round(v * 10000) / 10; return String(g) + ' ' + qu(v, u); } /* غرام بخانة عشرية: 400 ÷ 28 = 14.3 لا 10 */
  return qtyU(Math.round(v * 1000) / 1000, u);
}
function packFull(it, q) { return packTxt(it, q); }
function totalQty(id) { var t = 0; S.ledgers.forEach(function (l) { if (!l.arch) t += E.balance(S, l.id, id); }); return r2(t); }

/* ---------- التخزين المحلي (IndexedDB مع نسخة في localStorage) ---------- */
var DB = null, saveT = null;
function idb() { return new Promise(function (res) { try { var r = indexedDB.open('kitchen', 1); r.onupgradeneeded = function () { r.result.createObjectStore('kv'); }; r.onsuccess = function () { res(r.result); }; r.onerror = function () { res(null); }; } catch (e) { res(null); } }); }
function dbGet(k) { return new Promise(function (res) { if (!DB) return res(null); var q = DB.transaction('kv').objectStore('kv').get(k); q.onsuccess = function () { res(q.result || null); }; q.onerror = function () { res(null); }; }); }
function dbPut(k, v) { return new Promise(function (res) { if (!DB) return res(); var t = DB.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = res; t.onerror = res; }); }
/* إلغاء أثر «التغطية التلقائية» التي أُضيفت بالخطأ في 0.9.56: المخزن الخارجي مستقل عن مخزن المطبخ. تُضاف حركات عكسية (السجل لا يُمس) مرة واحدة */
function undoCover() {
  if (!S || !S.settings || S.settings.coverUndone) return; S.settings.coverUndone = true;
  var t = today(); S.moves.filter(function (m) { return m.kind === 'cover' && !m.rev; }).forEach(function (m) { m.rev = true; E.addMove(S, { date: t, led: m.led, item: m.item, q: -m.q, kind: 'cover', note: 'إلغاء تغطية خاطئة' }).rev = true; });
}
function save() { try { undoCover(); } catch (e) {} clearTimeout(saveT); if (typeof syncSoon === 'function') syncSoon(); if (typeof gwKick === 'function') gwKick(); saveT = setTimeout(function () { var j = JSON.stringify(S); dbPut('state', j); try { localStorage.setItem('kitchen_state_bak', j); } catch (e) {} }, 150); }
function load() {
  return idb().then(function (d) { DB = d; return dbGet('state'); }).then(function (j) {
    if (!j) { try { j = localStorage.getItem('kitchen_state_bak'); } catch (e) {} }
    if (j) { S = JSON.parse(j); return; }
    return fetch('seed.json').then(function (r) { return r.json(); }).then(function (seed) { S = E.newState(seed); save(); });
  }).then(function () { try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {} });
}

/* ---------- ترحيلات البيانات (تُطبَّق مرة واحدة لكل تثبيت) ---------- */
function migrate() {
  if (S.settings.fix1) return;
  var t = item('tomato'); if (t) { t.name = 'صلصة (علبة)'; t.unit = 'علبة'; t.pack = { name: 'كرتونة', n: 6 }; t.price = 0; t.daily = 0; }
  S.recipes.forEach(function (r) { r.lines = r.lines.filter(function (l) { return l.item !== 'tomato'; }); });
  S.settings.fix1 = true; save();
}
function migrate2() {
  if (S.settings.fix2) return; // علبة الصلصة = 3 كجم: كميات الوصفات بالعلب
  var Tm = { r03: 0.167, r06: 0.167, r07: 2.5, r08: 2, r11: 2, r12: 2, r13: 2, r17: 1, r18: 0.333, r20: 2, r21: 3 };
  S.recipes.forEach(function (r) { if (Tm[r.id] != null && !r.lines.some(function (l) { return l.item === 'tomato'; })) r.lines.push({ item: 'tomato', per: Tm[r.id], cat: 'b' }); });
  S.settings.fix2 = true; save();
}
function migrate3() {
  E.wInit(S); if (S.settings.fix3) return; // عمال الشيت وأرصدتهم الحالية كرصيد افتتاحي
  var W = [['بدر', 100, 35], ['منيب', 100, 100], ['عبود', 100, 100], ['حميدا', 100, 100.6], ['مجاهد', 85.7, 94.5], ['حمود المجايدة', 50, 0], ['أحمد عزمي', 70, 70], ['طارق', 50, 0], ['عبدالله', 50, 0], ['بلال', 50, 0]];
  W.forEach(function (x, i) { var id = 'w' + (i + 1); if (E.by(S.workers, id)) return; S.workers.push({ id: id, name: x[0], daily: x[1] }); if (x[2] > 0) E.wEntry(S, { date: iso(), w: id, kind: 'open', amt: x[2], note: 'من الشيت' }); });
  S.settings.fix3 = true; save();
}
function migrate4() { // تحويل حالات الحضور القديمة (إن وُجدت) إلى حالات التصميم
  if (S.settings.fix4) return; E.wInit(S);
  S.att.forEach(function (a) { if (a.m == null) { var sd = E.by(S.stats, a.st) || E.by(S.stats, 'p'); a.m = sd.mult; a.b = sd.bonus; } });
  S.settings.fix4 = true; save();
}
function migrate5() { // اسم المخزن: «المخزن»
  if (S.settings.fix5) return; var k = led('kitchen'); if (k) k.name = 'المخزن'; S.settings.fix5 = true; save();
}
function mergeMoney() { // تاريخ رصيد حميدا وكشف البنك وبايننس من الشيت، مرة واحدة وعلى جهاز بلا حركات مال
  if (S.settings.moneyImported) return Promise.resolve();
  if ((S.fm || []).length) { S.settings.moneyImported = true; save(); return Promise.resolve(); }
  return fetch('money-history.json').then(function (r) { return r.json(); }).then(function (h) {
    S.fm = h.moves.map(function (m, i) { return { id: 'h' + (i + 1), date: m.date, h: m.h, dir: m.dir, cur: m.cur, amt: m.amt, ils: m.ils || 0, rate: m.rate || 0, note: m.note, w: null, x: !!m.x, imported: true }; });
    S.settings.moneyImported = true; save();
  }).catch(function () {});
}
function loadProposal() { return fetch('opening-proposal.json').then(function (r) { return r.json(); }).then(function (p) { PROP = p; }).catch(function () {}); }
function mergeHistory() {
  if (S.settings.historyImported) return Promise.resolve();
  if (S.moves.some(function (m) { return m.kind === 'hist' && m.imported; })) { S.settings.historyImported = true; save(); return Promise.resolve(); } // نسخة استُعيدت بلا العلامة: السجل موجود فلا يُكرَّر
  return fetch('history.json').then(function (r) { return r.json(); }).then(function (h) {
    h.items.forEach(function (it) { if (!item(it.id)) S.items.push(it); });
    h.moves.forEach(function (m) { E.addMove(S, { date: m.date, led: m.led, item: m.item, q: m.q, kind: 'hist', imported: true, note: m.note, meal: m.meal }); });
    S.settings.historyImported = true; save();
  }).catch(function () {});
}

/* ---------- التنبيه اليومي والصندوق الصادر (اختبارات التقنية) ---------- */
function lsj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
function lss(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
var OUT = [];
function tlog(t) { OUT.unshift(new Date().toLocaleTimeString('ar') + ' — ' + t); OUT = OUT.slice(0, 12); }
function LN() { return P.LocalNotifications; }
function armDaily() { if (!LN()) return Promise.reject(new Error('الإضافة غير متاحة')); return LN().requestPermissions().then(function (r) { if (r.display !== 'granted') throw new Error('لم يُمنح الإذن'); return LN().schedule({ notifications: [{ id: 1, title: 'المطبخ', body: 'صباح الخير — راجع ما ينتظرك اليوم', schedule: { on: { hour: 8, minute: 0 }, allowWhileIdle: true } }] }); }); }
function flushOut() { if (!navigator.onLine) { tlog('لا اتصال — بقيت الحركات'); return; } var q = lsj('ahd_outbox_test', []); if (!q.length) return; var seen = {}, ok = 0, dup = 0; q.forEach(function (r) { if (seen[r.id]) dup++; else { seen[r.id] = 1; ok++; } }); lss('ahd_outbox_test', []); lss('ahd_sent_test', lsj('ahd_sent_test', 0) + ok); tlog('أُرسلت ' + pl(ok, 'حركة واحدة', 'حركتان', 'حركات') + (dup ? ' (تكرار مرفوض ' + dup + ')' : '')); }

/* ---------- نسخة احتياطية ---------- */
function backupDone() { S.settings.lastBackup = Date.now(); save(); render(); }
function exportBackup() {
  phAll().then(function (pm) { writeBackup(JSON.stringify(Object.keys(pm).length ? Object.assign({}, S, { _photos: pm }) : S)); });
}
function writeBackup(j) {
  var name = 'kitchen-backup-' + iso() + '.json';
  if (P.Filesystem && P.Share) {
    P.Filesystem.writeFile({ path: name, data: j, directory: 'CACHE', encoding: 'utf8' }).then(function (r) {
      return P.Share.share({ title: 'نسخة مطبخ عهد الاحتياطية', url: r.uri, dialogTitle: 'احفظ النسخة (درايف أو واتساب أو الملفات)' });
    }).then(function () { backupDone(); say('جُهّزت النسخة. تأكد أنك حفظتها خارج الهاتف'); }).catch(function (er) { if (!/cancel/i.test((er && er.message) || '')) say('تعذّر التصدير: ' + (er && er.message)); });
    return;
  }
  var blob = new Blob([j], { type: 'application/json' }), url = URL.createObjectURL(blob), x = document.createElement('a'); x.href = url; x.download = name; document.body.appendChild(x); x.click(); setTimeout(function () { x.remove(); URL.revokeObjectURL(url); }, 500); backupDone(); say('جُهّزت النسخة الاحتياطية');
}
function backupDays() { var last = S.settings.lastBackup || 0; return last ? Math.floor((Date.now() - last) / 864e5) : 99; }
function hasData() { return S.moves.some(function (m) { return m.kind !== 'hist'; }) || (S.att || []).length > 0; }

/* ===== 00m-menu.js ===== */
/* ترحيل قائمة WCK الموحّدة (نوفمبر 2026، 22 وصفة). يُطبَّق مرة واحدة لكل جهاز.
   - الوصفات تُعدَّل في مكانها وتحتفظ بمعرّفاتها (الطبخات المنفَّذة تحمل نسخة أسطرها فلا تتغير).
   - الخطط التي لم تُنفَّذ تحسب كمياتها من الوصفة عند التنفيذ فتأخذ القيم الجديدة.
   - القيم القديمة تبقى في سجل الوصفة (log). */
var MENU_MEAT_RULE = 'إضافة اللحم: 30 علبة للقدر الواحد، مرة واحدة أسبوعيًا، مع الإبلاغ عند الطهي باللحم. توحَّد طريقة الطهي لكل القدور ولا يُخصَّص بعضها باللحم وبعضها بدونه. تُضاف علب اللحم قبل انتهاء الطهي بـ 15 إلى 20 دقيقة (ربع أو ثلث ساعة).';
function migrateMenu() {
  if (S.settings.menu1126) return;
  var ln = function (r, id) { return r.lines.filter(function (l) { return l.item === id; })[0]; };
  var P = function (rid, o) {
    var r = E.by(S.recipes, rid); if (!r) return; var ch = [];
    Object.keys(o.set || {}).forEach(function (id) { var l = ln(r, id); if (l && l.per !== o.set[id]) { ch.push(item(id).name + ' ' + l.per + '←' + o.set[id]); l.per = o.set[id]; } });
    Object.keys(o.notes || {}).forEach(function (id) { var l = ln(r, id); if (l) l.note = o.notes[id]; });
    (o.del || []).forEach(function (id) { if (ln(r, id)) { ch.push('حُذف ' + item(id).name); r.lines = r.lines.filter(function (l) { return l.item !== id; }); } });
    (o.add || []).forEach(function (l) { if (!ln(r, l.item)) { ch.push('أُضيف ' + item(l.item).name + ' ' + l.per); r.lines.push(l); } });
    if (o.noalt) r.lines.forEach(function (l) { if (l.alt) { delete l.alt; ch.push('أُلغي البديل'); } });
    ['name', 'en', 'code', 'water', 'wnote', 'meat', 'exp', 'note'].forEach(function (k) { if (o[k] !== undefined && r[k] !== o[k]) { if (k === 'name' || k === 'water') ch.push(k === 'name' ? 'الاسم: ' + o[k] : 'الماء ' + r.water + '←' + o[k]); r[k] = o[k]; } });
    if (ch.length || o.code) { r.log = r.log || []; r.log.unshift({ date: today(), what: 'قائمة نوفمبر الموحّدة: ' + (ch.join('، ') || 'ترقيم') }); r.log = r.log.slice(0, 30); }
  };
  var s = function (it, per, note) { var l = { item: it, per: per, cat: 's' }; if (note) l.note = note; return l; };
  var b = function (it, per, note, swap) { var l = { item: it, per: per, cat: 'b' }; if (note) l.note = note; if (swap) l.swap = true; return l; };
  P('r01', { set: { coriander: 0.03, cumin: 0.025, spice: 0.1 } });
  P('r02', { add: [s('coriander', 0.04), s('cumin', 0.025)] });
  P('r06', { set: { galangal: 0.015 } });
  P('r07', { name: 'بازيلاء بالجزر والبطاطا', en: 'Peas with Carrots & Potato Stew', set: { bpepper: 0.03, ghee: 0.2, tomato: 1.667 }, noalt: true,
    notes: { ghee: 'يمكن استخدام زيت طهي أو سمن', potato_c: '14 علبة صغيرة، وإن لم تتوفر فعلبتان كبيرتان', tomato: 'معجون 5 كجم: انتبه لنوع الصلصة فقد تتغير الكمية حسب النوع' }, water: 38, wnote: 'من 38 إلى 40 لترًا' });
  P('r08', { set: { bpepper: 0.03, ghee: 0.2 } });
  P('r09', { set: { bpepper: 0.03, oil: 0.2 }, water: 50 });
  P('r10', { set: { bpepper: 0.03, lentil: 12, oil: 0.2, salt: 0.35, stock: 0.25 }, water: 40, wnote: 'من 40 إلى 42 لترًا' });
  P('r11', { set: { bpepper: 0.03 } }); P('r12', { set: { bpepper: 0.03 } }); P('r17', { set: { bpepper: 0.03 } });
  P('r13', { set: { bpepper: 0.03, ghee: 0.2, tomato: 1.667 } });
  /* اليخنة: كانت «المفتول الكذّاب (مكونات اليخنة)» r18 ← R-19 */
  P('r18', { code: 'R-19', name: 'اليخنة', en: 'Maftoul for Stew', del: ['allspice', 'ghee'], set: { bpepper: 0.02, cardamom: 0.02, salt: 0.25, spice: 0.07, stock: 0.2, turmeric: 0.03 }, add: [s('coriander', 0.03)], note: 'عند التوزيع: كل 2 قدر برغل مفلفل يقابلهم قدر يخنة واحد' });
  /* المفتول المفلفل: كان «المفتول الكذّاب (برغل مفلفل)» r19 ← R-18 */
  P('r19', { code: 'R-18', name: 'المفتول المفلفل', en: 'Burghul – Maftoul', exp: false, meat: false, set: { burghul: 15, ghee: 1, oil: 1, salt: 0.25, stock: 0.15 },
    notes: { oil: 'للتحميص', ghee: 'نصف كيلو للتحميص ونصف كيلو للتفتيح', salt: 'حسب المجتمع المحيط' },
    add: [s('spice', 0.04), s('cardamom', 0.02), s('bpepper', 0.02), s('cumin', 0.03), s('coriander', 0.03), s('turmeric', 0.03)], water: 22, wnote: 'تختلف الكمية حسب نوعية البرغل وامتصاصه (22 لترًا للعينة الحالية)', note: 'عند التوزيع: كل 2 قدر برغل مفلفل يقابلهم قدر يخنة واحد' });
  P('r20', { code: 'R-21' }); P('r21', { code: 'R-22' });
  /* وصفة جديدة R-20 (الموصى بها) */
  if (!E.by(S.recipes, 'r22')) {
    S.recipes.push({ id: 'r22', code: 'R-20', name: 'المفتول باليخني', en: 'Maftoul with Stew', meat: true, exp: true, water: 22, wnote: 'تختلف الكمية حسب نوعية البرغل وامتصاصه (22 لترًا للعينة الحالية)',
      lines: [b('burghul', 15, 'يضاف بعد غليان الماء'), b('onion', 3), b('oil', 1, 'للتحميص'), b('ghee', 1, 'نصف كيلو للتحميص ونصف كيلو للتفتيح'),
        b('sweetp', 2, 'علبتان × 3 كجم', true), b('pstrip', 1, 'علبة واحدة × 3 كجم', true), b('tomw', 1, 'علبة واحدة × 3 كجم', true), b('carrot', 2, 'علبتان × 3 كجم', true),
        b('tomato', 0.167, 'نصف كيلو'), b('chick', 2, 'الحب: يوزن قبل النقع ويُسلق قبل الطهي'),
        s('opowder', 0.05), s('dillseed', 0.15, 'تجهّز لخلطة الدقة'), s('gchili', 0.2, 'تجهّز لخلطة الدقة'), s('cpods', 0.03, 'تجهّز لخلطة الدقة'), s('salt', 0.25, 'حسب المجتمع المحيط'),
        s('stock', 0.15), s('spice', 0.07), s('cardamom', 0.02), s('bpepper', 0.02), s('cumin', 0.03), s('coriander', 0.03), s('turmeric', 0.03)].filter(function (l) { return item(l.item); }),
      note: 'الوصفة الموصى بها. خطواتها: (1) التجهيز المسبق: تُضاف البهارات والماجي، ويُسلق الحمص الحب المنقوع قبل البدء، وتُجهَّز الخضار، وتُجهَّز خلطة الدقة (البصل المفروم مع الجرادة والفلفل الأخضر والشطة وتُدعك). (2) تحميص البرغل: لتر زيت مع نصف كيلو سمن حتى يسخنا، ثم يُضاف البرغل ويُقلَّب 3 إلى 4 دقائق حتى يتغلف. (3) الترشيب: تُضاف الخضار والحمص والبندورة وصلصة الطماطم مع خلطة الدقة، وتُسكب المياه المغلية (22 لترًا) ويُضبط الملح تدريجيًا (250 إلى 300 غرام). (4) الامتصاص: يُحرَّك جيدًا حتى يمتص البرغل الماء، ثم تُخفَّض النار ويُغطى القدر بإحكام لمدة أقصاها 30 دقيقة. (5) التفتيح والتقديم: يُضاف نصف كيلو سمن للتفتيح ويُقلَّب برفق من الأسفل إلى الأعلى.',
      kinds: ['private', 'external'], log: [{ date: today(), what: 'أُضيفت من قائمة نوفمبر الموحّدة (R-20)' }], src: 'قائمة WCK الموحّدة · نوفمبر 2026' });
  }
  S.settings.menu1126 = true; save();
}
/* تصحيح R-20 بعد مراجعة الصفحة: إضافة الجفت وترتيب الخطوات كما في القائمة */
function migrateMenu2() {
  if (S.settings.menu1126b) return; var r = E.by(S.recipes, 'r22');
  if (r) {
    if (!r.lines.some(function (l) { return l.item === 'pellet'; }) && item('pellet')) r.lines.push({ item: 'pellet', per: 7.5, cat: 'f', note: '7 إلى 8 كجم' });
    r.note = 'الوصفة الموصى بها.\nالمرحلة الأولى (التجهيز المسبق): يُوزن 2 كجم حمص حب قبل النقع، ثم يُنقع مسبقًا ويُسلق حتى يقترب من النضج التام قبل بدء طهي البرغل. تُغسل الخضار الطازجة جيدًا أو تُفتح معلبات الخضار، وتُقطّع البطاطا والجزر والبصل بأحجام مناسبة ومتقاربة لضمان نضجها بشكل متجانس، وتُجهَّز الفليفلة المشكلة وعلبة بندورة الكبيرة 3 كيلو حبة كاملة ونصف كيلو (500 غرام) صلصة الطماطم. تُجهَّز «الدقة/العروسة» العطرية: يُفرم البصل المخصص للبرغل (3 كغ) مع الفلفل الأخضر (200 غرام) ويُضاف إليهم الشطة قرون (30 غرامًا)، وتُضاف إليها الجرادة الناشفة (150 غرامًا) وباقي البهارات العطرية وتُدعك معًا لإخراج الزيوت العطرية قبل إضافتها للقدر.\nالمرحلة الثانية (تحميص البرغل): يوضع القدر على النار ويُضاف إليه 1 لتر من زيت السريج مع نصف كيلو (500 غرام) من السمنة النباتية، ويُترك حتى يحمى الزيت والسمنة جيدًا. يُضاف البرغل (15 كغ) إلى الزيت والسمنة الساخنين، ويُقلَّب باستمرار لمدة 3 إلى 4 دقائق حتى يتحمّص البرغل وتتغلف حباته بالكامل بالمادة الدهنية.\nالمرحلة الثالثة (التشريب وإضافة الدقة والخضار والتتبيلة): تُضاف خلطة الخضار المجهزة (البصل، البطاطا، الجزر، الفليفلة، الحمص المسلوق، البندورة، و500 غرام صلصة الطماطم) مع خلطة الدقة (البصل والجرادة والفلفل) إلى القدر. ثم تُضاف تشكيلة البهارات المعتمدة (70 غرام سبع بهارات، 30 غرام كمون، 30 غرام كزبرة، 30 غرام كركم، 20 غرام هيل، 20 غرام فلفل أسود) مع 150 غرام ماجي. ثم يُسكب الماء المغلي (22 لترًا) فوق المكونات، ويُضاف الملح (250 إلى 300 غرام) تدريجيًا حسب الحاجة وحسب نوع الملح بعد تذوق المرق ومراعاة ملوحة الماجي.\nالمرحلة الرابعة (الامتصاص والكمر): التحريك والتشريب: تُحرَّك المكونات جيدًا وبانتظام على النار حتى يمتص البرغل المياه وتتوزع الخضار والدقة بالتساوي. التغطية والكمر: بمجرد تشرب البرغل للسائل تُخفَّف النار إلى أهدأ درجة ويُغطى القدر بإحكام ويُكمَّر لمدة أقصاها 30 دقيقة حتى ينضج البرغل والخضار تمامًا على البخار.\nالمرحلة الخامسة (التفتيح والتقديم): إضافة سمنة التفتيح: بعد مرور 30 دقيقة والتأكد من اكتمال نضج البرغل وتفتّح حباته ونضج الخضار، يُضاف نصف كيلو (500 غرام) من السمنة النباتية المخصصة للتفتيح الإضافي على وجه القدر. التقليب النهائي: تُقلَّب المكونات جيدًا من الأسفل إلى الأعلى برفق حتى تذوب السمنة وتتجانس المكونات تمامًا وتكتسب لمعة ونكهة غنية، وتكون الوجبة جاهزة للسكب والتقديم.';
    r.log = r.log || []; r.log.unshift({ date: today(), what: 'إضافة الجفت وتصحيح ترتيب الخطوات' });
  }
  S.settings.menu1126b = true; save();
}

/* تحديث المنيو الموحّد 23 نوفمبر 2026 (26 وصفة): أربع وصفات مجمدة جديدة، الفاصوليا والبامية مجمدتان، أُزيلت «إضافة اللحم» من ست وصفات،
   ملاحظة زيت الأرز، تنبيه الصلصة، خطوات البنجر والبازيلاء، وإزاحة الأكواد. تُعدَّل الوصفات في مكانها وتبقى معرّفاتها (الطبخات المنفَّذة تحمل نسخة أسطرها). */
function migrateMenu3() {
  if (S.settings.menu1123) return;
  var ln = function (r, id) { return r.lines.filter(function (l) { return l.item === id; })[0]; };
  var rec = function (id) { return E.by(S.recipes, id); };
  var log = function (r, what) { r.log = r.log || []; r.log.unshift({ date: today(), what: 'قائمة 23 نوفمبر: ' + what }); r.log = r.log.slice(0, 30); };
  var mkItem = function (id, name, cond) {
    if (item(id)) return;
    S.items.push({ id: id, name: name, unit: 'كيلو', price: 0, daily: 0, step: 1, pack: { name: 'كرتونة', n: 10 }, packs: [{ name: 'كرتونة', n: 10 }], cond: cond || 'مجمّد' });
    E.addMove(S, { date: today(), led: 'kitchen', item: id, q: 0, kind: 'opening', note: 'إضافة الصنف' });
  };
  mkItem('molokhia_f', 'ملوخية مجمدة'); mkItem('gbeans_f', 'فاصوليا خضراء مجمدة'); mkItem('spinach_f', 'سبانخ مجمدة'); mkItem('zucchini_f', 'كوسا مجمدة'); mkItem('cauli_f', 'زهرة (قرنبيط) مجمدة');
  var b = function (it, per, note) { var l = { item: it, per: per, cat: 'b' }; if (note) l.note = note; return l; };
  var sp = function (it, per) { return { item: it, per: per, cat: 's' }; };
  var fuel = function () { return { item: 'pellet', per: 7.5, cat: 'f', note: '7 إلى 8 كجم' }; };
  /* 1) إزالة «إضافة اللحم» من الست */
  ['r07', 'r08', 'r11', 'r12', 'r13', 'r18', 'r22'].forEach(function (id) { var r = rec(id); if (r && r.meat) { r.meat = false; log(r, 'أُزيلت «إضافة اللحم»'); } });
  /* 2) ملاحظة زيت الأرز */
  ['r02', 'r03', 'r04', 'r05', 'r06'].forEach(function (id) { var r = rec(id), l = r && ln(r, 'oil'); if (l) { l.note = 'الكمية الموردة مخصصة لتحميص الأرز'; log(r, 'ملاحظة الزيت'); } });
  /* 3) تنبيه نوع الصلصة (الكمية بالكيلو كما في المنيو) */
  var tw = function (kg) { return 'معجون ' + kg + ' كجم: انتبه لنوع الصلصة فقد تتغير الكمية حسب النوع'; };
  [['r08', 6], ['r11', 6], ['r12', 6], ['r13', 5], ['r17', 3], ['r20', 6], ['r21', 9]].forEach(function (x) { var r = rec(x[0]), l = r && ln(r, 'tomato'); if (l) { l.note = tw(x[1]); log(r, 'تنبيه الصلصة'); } });
  var yk = rec('r18'), yt = yk && ln(yk, 'tomato'); if (yt) { yt.note = '1 كيلو فقط'; log(yk, 'ملاحظة الصلصة'); }
  var r08 = rec('r08'); if (r08 && !r08.wnote) { r08.wnote = '27 إلى 30 لترًا'; }
  var r09 = rec('r09'), ol = r09 && ln(r09, 'olive'); if (ol) { ol.note = 'أو زيت قلي، حسب التوفر'; log(r09, 'ملاحظة الزيت'); }
  /* 4) خطوات البنجر والبازيلاء */
  var bt = rec('r14'); if (bt) { bt.note = 'طريقة التحضير: 1) تصفية البنجر جيدًا من السائل الموجود داخل العلب. 2) تجهيز الليمون الطازج والجرادة الخضراء، ثم إضافتهما إلى البنجر. 3) إضافة الخل الأبيض والملح وتقليب المكونات جيدًا حتى تتجانس. 4) إضافة زيت عباد الشمس وخلط المكونات بصورة متساوية. 5) ترك الخليط لمدة ثلاث ساعات، مع مراعاة شروط النظافة وسلامة الغذاء، وحفظه في درجة حرارة مناسبة. 6) بعد التأكد من سلامة المنتج وجودته، يتم توزيعه بالتساوي على المستفيدين.'; log(bt, 'خطوات التحضير'); }
  var pz = rec('r07'); if (pz) { pz.note = 'طريقة الطهي: 1) تُنقع البازيلاء للمدة المحددة، ثم تُصفّى جيدًا من ماء النقع وتُجهَّز للطبخ. 2) يُقطَّع البصل ويُقلى بالزيت حتى يذبل مع مراعاة عدم حرقه. 3) تُوضع البازيلاء في قدر الطبخ مع إضافة 30 لترًا من الماء، ويُترك القدر حتى الغليان. 4) يُضاف البصل المقلي إلى القدر بعد بدء الغليان مع التحريك لتوزيع المكونات. 5) تُضاف البطاطا والجزر المعلّبان، وتُترك المكونات حتى تقترب من النضج. 6) تُضاف الصلصة والملح والماجي والفلفل الأسود مع التحريك جيدًا. 7) تُترك الطبخة على النار حتى تنضج تمامًا ويصل قوام الصلصة للدرجة المطلوبة مع متابعة الماء. 8) يُراعى ضبط قوام الطبخة والتأكد من اكتمال النضج قبل التقديم والتوزيع.'; log(pz, 'خطوات الطهي'); }
  /* 5) الفاصوليا والبامية مجمدتان (الفاصوليا صنف مستقل 22 كجم، لا علب) */
  var gb = rec('r11');
  if (gb) {
    var gl = ln(gb, 'gbeans'); if (gl) { var at = gb.lines.indexOf(gl); gb.lines[at] = b('gbeans_f', 22); }
    gb.name = 'فاصوليا خضراء (مجمدة)'; gb.en = 'Green Beans Stew (Frozen)'; log(gb, 'مجمدة: 22 كجم بدل 11 علبة معلبة');
  }
  var ok = rec('r12'); if (ok) { ok.name = 'بامية (مجمدة)'; ok.en = 'Okra Stew (Frozen)'; log(ok, 'مجمدة'); }
  /* 6) الأكواد الجديدة */
  var CODES = { r13: 'R-17', r14: 'R-18', r15: 'R-19', r16: 'R-20', r17: 'R-21', r19: 'R-22', r18: 'R-23', r22: 'R-24', r20: 'R-25', r21: 'R-26' };
  Object.keys(CODES).forEach(function (id) { var r = rec(id); if (r && r.code !== CODES[id]) { var was = r.code; r.code = CODES[id]; log(r, 'الرمز ' + was + '←' + CODES[id]); } });
  /* 7) الوصفات الأربع الجديدة (كلها مجمدة، ماؤها 27 إلى 30 لترًا) */
  var mk = function (id, code, name, en, lines) {
    if (rec(id)) return;
    S.recipes.push({ id: id, code: code, name: name, en: en, meat: false, exp: false, water: 30, wnote: '27 إلى 30 لترًا', lines: lines.filter(function (l) { return item(l.item); }), note: '', kinds: ['private', 'external'],
      log: [{ date: today(), what: 'أُضيفت من قائمة 23 نوفمبر الموحّدة (' + code + ')' }], src: 'قائمة WCK الموحّدة · 23 نوفمبر 2026' });
  };
  mk('r23', 'R-13', 'ملوخية (مجمدة)', 'Molokhia (Frozen)', [b('molokhia_f', 27), b('oil', 0.6), b('onion', 1.5), b('garlic', 0.2), sp('salt', 0.4), sp('stock', 0.15), sp('bpepper', 0.03), sp('coriander', 0.1), fuel()]);
  mk('r24', 'R-14', 'سبانخ (مجمدة)', 'Spinach (Frozen)', [b('spinach_f', 26), b('ghee', 0.27, 'سمن أو زيت طهي: 0.2 للتقلية و0.07 للثوم'), b('chick', 3), b('onion', 1.5), b('garlic', 0.14), sp('coriander', 0.03), sp('chili', 0.02), sp('bpepper', 0.03), sp('salt', 0.2), sp('stock', 0.23), fuel()]);
  mk('r25', 'R-15', 'كوسا (مجمدة)', 'Zucchini (Frozen)', [b('zucchini_f', 23), b('tomato', 2, 'معجون 6 كجم: انتبه لنوع الصلصة فقد تتغير الكمية حسب النوع'), b('ghee', 0.2, 'أو زيت طهي'), b('onion', 1.5), b('garlic', 0.1), sp('bpepper', 0.03), sp('salt', 0.3), sp('stock', 0.2), fuel()]);
  mk('r26', 'R-16', 'زهرة (مجمدة)', 'Cauliflower (Frozen)', [b('cauli_f', 23), b('tomato', 2, 'معجون 6 كجم: انتبه لنوع الصلصة فقد تتغير الكمية حسب النوع'), b('oil', 0.2), b('chick', 2), b('onion', 1.5), sp('cumin', 0.01), sp('salt', 0.3), sp('bpepper', 0.03), sp('coriander', 0.03), sp('stock', 0.25), fuel()]);
  /* ترتيب القائمة بالرمز */
  var num = function (r) { return parseInt(String(r.code || '').replace(/\D/g, ''), 10) || 999; };
  S.recipes = S.recipes.map(function (r, i) { return [r, i]; }).sort(function (a, c) { return num(a[0]) - num(c[0]) || a[1] - c[1]; }).map(function (x) { return x[0]; });
  S.settings.menu1123 = true; save();
}

/* توزيع الإجمالي لكل نقطة كان يُقسَّم تلقائيًا على الطبخات ويُكتب كأنواع. نعلّم ما يطابق التقسيم التلقائي تمامًا بأنه «بالإجمالي» فلا يُنسب لنقطة نوع لم تحدده. */
function migrateDistTot() {
  if (S.settings.distTot1114) return;
  var fix = function (list) {
    var by = {}; list.forEach(function (x) { if (x.dist && Object.keys(x.dist).length && (x.kind || 'private') === 'private' && !x.void) (by[x.date] = by[x.date] || []).push(x); });
    Object.keys(by).forEach(function (dt) {
      var g = by[dt]; if (g.length < 2) return; var tot = {};
      g.forEach(function (x) { Object.keys(x.dist).forEach(function (k) { tot[k] = r2((tot[k] || 0) + x.dist[k]); }); });
      var al = planDistAlloc(g, tot), same = g.every(function (x, i) { var ks = Object.keys(x.dist).concat(Object.keys(al[i])); return ks.every(function (k) { return (x.dist[k] || 0) === (al[i][k] || 0); }); });
      if (same) g.forEach(function (x) { x.distTot = true; });
    });
  };
  fix(S.plans || []); fix(S.batches || []);
  S.settings.distTot1114 = true; save();
}

/* ===== 00s-safe.js ===== */
/* ---------- حماية البيانات: تحقق، ترحيلات مرقّمة، لقطات تلقائية، سجل أخطاء ---------- */
var SCHEMA = 3;
var ARR_REQ = ['moves', 'items', 'ledgers'], ARR_DEF = ['recipes', 'batches', 'insts', 'plans'];

/* تحقق من بنية النسخة قبل اعتمادها: يُرجع نص الخطأ أو '' إن كانت سليمة */
function validState(n) {
  if (!n || typeof n !== 'object' || Array.isArray(n)) return 'ملف غير صالح';
  for (var i = 0; i < ARR_REQ.length; i++) if (!Array.isArray(n[ARR_REQ[i]])) return 'ملف غير صالح: ينقصه «' + ARR_REQ[i] + '»';
  if (!n.ledgers.some(function (l) { return l && l.id === 'kitchen'; })) return 'ملف غير صالح: لا يوجد مخزن المطبخ';
  var bad = 0; n.moves.forEach(function (m) { if (!m || !m.item || !m.led || !isFinite(+m.q)) bad++; });
  if (bad) return 'ملف تالف: ' + bad + ' حركة غير سليمة';
  var badI = 0; n.items.forEach(function (it) { if (!it || !it.id) badI++; });
  if (badI) return 'ملف تالف: ' + badI + ' صنف بلا معرّف';
  return '';
}
function fixShape(n) { n.settings = n.settings || {}; ARR_DEF.forEach(function (k) { if (!Array.isArray(n[k])) n[k] = []; }); return n; }

/* الترحيلات مرقّمة وتعمل عند كل تحميل وعند كل استعادة؛ كل ترحيل يحمل علامته فلا يُكرَّر */
function runMigrations() {
  fixShape(S);
  migrate(); migrate2(); migrate3(); migrate4(); migrate5(); migrate6(); migrateMenu(); migrateMenu2(); migrateMenu3(); migrateDistTot(); E.wInit(S);
  if ((S.v || 0) < SCHEMA) { S.v = SCHEMA; save(); }
}

/* ---------- لقطات تلقائية (آخر 7 أيام) ولقطة أمان قبل كل استعادة ---------- */
var BKM = [];
function bkAll() { return dbGet('snaps').then(function (a) { return Array.isArray(a) ? a : []; }); }
function bkMeta(list) { BKM = list.map(function (e) { return { t: e.t, d: e.d, why: e.why, mv: e.mv, bt: e.bt, i: e.i }; }); }
function bkAdd(why) {
  return bkAll().then(function (list) {
    var d = iso(), now = Date.now();
    if (why === 'auto') {
      var td = list.filter(function (e) { return e.why === 'auto' && e.d === d; })[0];
      if (td && now - td.t < 3 * 36e5) { bkMeta(list); return list; }
      list = list.filter(function (e) { return e !== td; });
    }
    list.push({ t: now, d: d, why: why, mv: S.moves.length, bt: (S.batches || []).length, j: JSON.stringify(S) });
    var au = list.filter(function (e) { return e.why === 'auto'; }).slice(-30), ot = list.filter(function (e) { return e.why !== 'auto'; }).slice(-3);
    list = au.concat(ot).sort(function (a, b) { return a.t - b.t; });
    return dbPut('snaps', list).then(function () { bkMeta(list); return list; });
  }).catch(function () { return []; });
}
function bkRestore(t) {
  bkAll().then(function (list) {
    var e = list.filter(function (x) { return x.t === t; })[0];
    if (!e) { say('اللقطة غير موجودة'); return; }
    restoreState(e.j);
  });
}

/* ---------- استعادة آمنة: تحقق ثم لقطة أمان ثم ترحيل ثم تراجع ممكن ---------- */
function restoreState(text) {
  var n; try { n = JSON.parse(text); } catch (er) { say('تعذّرت الاستعادة: الملف ليس نسخة صالحة'); return; }
  var phs = n && n._photos; if (n) delete n._photos;
  var bad = validState(n); if (bad) { say('تعذّرت الاستعادة: ' + bad); return; }
  phRestore(phs);
  var prev = S, prevJ = JSON.stringify(S);
  bkAdd('pre').then(function () {
    try { S = n; runMigrations(); }
    catch (er) { S = prev; logErr('restore', er); say('تعذّرت الاستعادة، وبقيت بياناتك كما هي'); return; }
    save(); resetCaches(); OPV = null; shut();
    return mergeHistory().then(mergeMoney).then(function () {
      setState({ page: 'main', tab: 'today', sh: null, form: {} });
      say('تمت الاستعادة. لقطة بيانات ما قبلها محفوظة في «لقطات تلقائية»', function () { S = JSON.parse(prevJ); save(); resetCaches(); OPV = null; render(); say('أُلغيت الاستعادة'); });
    });
  });
}

/* ---------- سجل الأخطاء ---------- */
var ERRS = lsj('kitchen_errs', []), inFail = false;
function logErr(src, e) {
  var m = (e && (e.stack || e.message)) || String(e);
  ERRS.unshift({ t: Date.now(), v: VERSION, src: src, m: String(m).slice(0, 500) }); ERRS = ERRS.slice(0, 20); lss('kitchen_errs', ERRS);
}
function onFail(src, e) {
  logErr(src, e); if (inFail) return; inFail = true; setTimeout(function () { inFail = false; }, 1500);
  try { say('حدث خطأ غير متوقع وسُجّل. راجع «سجل الأخطاء» في المزيد'); } catch (x) {}
}
window.addEventListener('error', function (ev) { onFail('window', ev.error || ev.message); });
window.addEventListener('unhandledrejection', function (ev) { onFail('promise', ev.reason); });
UI.onError = function (er) { onFail('handler', er); };
function errText() { return 'مطبخ عهد ' + VERSION + '\n' + ERRS.map(function (x) { return new Date(x.t).toLocaleString('ar') + ' [' + x.src + '] ' + x.v + '\n' + x.m; }).join('\n---\n'); }
function copyText(text, okMsg) {
  var ok = function () { say(okMsg || 'نُسخ'); }, bad = function () { say('تعذّر النسخ'); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, bad);
  else { try { var t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); ok(); } catch (e) { bad(); } }
}
function bkSub() { var a = BKM.filter(function (e) { return e.why === 'auto'; }); return a.length ? 'ارجع بالتطبيق إلى أي يوم من آخر 30 يومًا · ' + pl(a.length, 'لقطة واحدة', 'لقطتان', 'لقطات') : 'تُؤخذ تلقائيًا كل يوم عند فتح التطبيق'; }

/* نوافذ: لقطات تلقائية وسجل الأخطاء */
function safeSheet(sh) {
  switch (sh.t) {
    case 'snaps': {
      var rows = BKM.slice().reverse().map(function (e) {
        return X({ icon: 'i-clock', icTone: e.why === 'auto' ? 'info' : 'warn', title: dlabel(e.d) + ' · ' + new Date(e.t).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }), sub: (e.why === 'auto' ? 'لقطة تلقائية' : 'لقطة أمان قبل استعادة') + ' · ' + pl(e.mv, 'حركة واحدة', 'حركتان', 'حركات'), chev: true,
          go: function () { openSh({ t: 'snapGo', at: e.t }); } });
      });
      return { title: 'العودة إلى يوم سابق', sub: 'آخر 30 يومًا على هذا الجهاز · كل لقطة هي حالة التطبيق وقتها', rows: rows, empty: 'لا لقطات بعد، تُؤخذ أول لقطة عند فتح التطبيق' };
    }
    case 'snapGo': {
      var e1 = BKM.filter(function (x) { return x.t === sh.at; })[0];
      return { title: 'استعادة لقطة ' + (e1 ? dlabel(e1.d) : ''), sub: e1 ? pl(e1.mv, 'حركة واحدة', 'حركتان', 'حركات') : '',
        note: { text: e1 ? 'ستعود بياناتك إلى حالتها وقت هذه اللقطة، ويُفقد ما سُجّل بعدها: ' + pl(Math.max(S.moves.length - (e1.mv || 0), 0), 'حركة واحدة', 'حركتان', 'حركات') + (e1.bt != null ? ' و' + pl(Math.max(S.batches.length - e1.bt, 0), 'طبخة واحدة', 'طبختان', 'طبخات') : '') + '. تُحفظ لقطة بالحالي قبل ذلك، ويمكنك التراجع بعدها مباشرة.' : '', tone: 'warn' },
        ft: { label: 'العودة إلى هذه الحالة', ok: !!e1, go: function () { bkRestore(sh.at); } } };
    }
    case 'errlog': {
      return { title: 'سجل الأخطاء', sub: ERRS.length ? pl(ERRS.length, 'خطأ واحد', 'خطآن', 'أخطاء') : 'لا أخطاء مسجّلة',
        rows: ERRS.map(function (x) { return X({ icon: 'i-lock', icTone: 'bad', title: new Date(x.t).toLocaleString('ar') + ' · ' + x.src, sub: String(x.m).split('\n')[0].slice(0, 120) }); }), empty: 'لا أخطاء مسجّلة',
        ft: { label: 'نسخ السجل لإرساله', ok: ERRS.length > 0, go: function () { copyText(errText(), 'نُسخ السجل، الصقه حيث تشاء'); } },
        ft2: ERRS.length ? { label: 'مسح السجل', go: function () { ERRS = []; lss('kitchen_errs', []); render(); } } : null };
    }
  }
  return null;
}

/* ===== 01-state.js ===== */
/* ---------- حالة الواجهة (غير محفوظة) ---------- */
var KN = { private: 'طبخ', external: 'طبخ خارجي' }, KT = { private: 'ok', external: 'ext' }, KNF = { private: 'طبخة', external: 'طبخة خارجية' };
var LSHORT = { kitchen: 'المطبخ', ext: 'الخارجي', wfp: 'WFP', mkt: 'السوق مباشرة' };
var SORTS = {
  stock: [['crit', 'الأحرج', 1], ['days', 'أيام الكفاية', 1], ['qty', 'الكمية', -1], ['cat', 'الفئة (ألوان)', 1], ['name', 'الاسم', 1]],
  batches: [['time', 'الوقت', -1], ['cost', 'التكلفة', -1], ['name', 'اسم الطبخة', 1]],
  workers: [['need', 'الأولوية', 1], ['name', 'الاسم', 1], ['bal', 'الرصيد', -1]]
};
var A = {
  tab: 'today', page: 'main', sh: null, form: {}, q: '', led: 'kitchen', sg: 'all', wmode: 'att', kk: 'private', kindF: 'all',
  draft: null, wid: null, rid: null, toast: '', hasUndo: false, attOpen: false, showArch: false, offline: false,
  sort: { stock: { f: 'crit', d: 1 }, batches: { f: 'time', d: -1 }, workers: { f: 'need', d: 1 } }
};
var UNDO = null, TK = 0;
/* تفضيلات العرض (ترتيب القوائم، تصفية المخزن/الوصفات، المؤرشفون) تُحفظ على هذا الجهاز وتعود بعد إغلاق التطبيق (المالك 2026-11-23: «بطفي التطبيق وبرجع بلاقيه مترتب بشيء جديد») */
var VIEWK = ['sort', 'sg', 'kindF', 'showArch', 'hideZero'], VIEWJ = '';
function loadView() {
  try {
    var v = JSON.parse(localStorage.getItem('kitchen_view') || '{}');
    if (v.sort) for (var k in SORTS) { var c = v.sort[k]; if (c && (c.d === 1 || c.d === -1) && SORTS[k].some(function (x) { return x[0] === c.f; })) A.sort[k] = { f: c.f, d: c.d }; }
    ['sg', 'kindF'].forEach(function (k) { if (typeof v[k] === 'string') A[k] = v[k]; });
    if (v.showArch === true) A.showArch = true; if (v.hideZero === true) A.hideZero = true;
  } catch (e) {}
  VIEWJ = JSON.stringify(VIEWK.map(function (k) { return A[k]; }));
}
function saveView() {
  try {
    var j = JSON.stringify(VIEWK.map(function (k) { return A[k]; }));
    if (j === VIEWJ) return; VIEWJ = j;
    var o = {}; VIEWK.forEach(function (k) { o[k] = A[k]; });
    localStorage.setItem('kitchen_view', JSON.stringify(o));
  } catch (e) {}
}
loadView();
function render() { saveView(); UI.render(); }
function setState(p) { for (var k in p) A[k] = p[k]; render(); }
function say(msg, undo) {
  var tk = ++TK; UNDO = undo || null; A.toast = msg; A.hasUndo = !!undo; render();
  setTimeout(function () { if (TK === tk) { UNDO = null; A.toast = ''; A.hasUndo = false; render(); } }, undo ? 7000 : 2800);
}
function doUndo() { var u = UNDO; UNDO = null; A.toast = ''; A.hasUndo = false; render(); if (u) u(); }
function today() { return iso(); }

/* ---------- تنقّل ونوافذ ---------- */
/* مكدّس التنقل: زر الرجوع يعيدك إلى الشاشة التي كنت فيها قبل هذه الخطوة تمامًا، لا إلى «أب» ثابت */
var NAV = [], NAVB = false, SHS = [], NAVSKIP = { sh: 1, form: 1, q: 1, toast: 1, hasUndo: 1, draft: 1, offline: 1, sort: 1, attOpen: 1, showArch: 1 };
function navSnap() { var o = {}; for (var k in A) if (!NAVSKIP[k]) o[k] = A[k]; return o; }
function navKey(o) { return [o.page, o.tab, o.wid, o.rid, o.did, o.sid, o.fid, o.rk, o.bk].join('|'); }
function navValid(s) { try { if (s.page === 'worker') return !!wk(s.wid); if (s.page === 'recipe') return !!rec(s.rid); } catch (e) { return false; } return true; }
function open(page, extra) {
  var p = { page: page, sh: null, q: '', form: {} }; for (var k in (extra || {})) p[k] = extra[k];
  if (!NAVB && A.page !== 'batch' && A.page !== 'fix') {
    var from = navSnap(), to = Object.assign({}, from, p), top = NAV[NAV.length - 1];
    if (navKey(to) !== navKey(from) && !(from.page === 'main' && page === 'main') && !(top && navKey(top) === navKey(from))) { NAV.push(from); if (NAV.length > 30) NAV.shift(); }
  }
  setState(p);
}
function openSh(sh, form) {
  if (A.sh) { if (A.sh.t !== sh.t) { SHS.push({ sh: A.sh, form: A.form }); if (SHS.length > 6) SHS.shift(); } } else SHS = [];
  if (isClosed() && LOCKT.indexOf(sh.t) >= 0) { sh = { t: 'locked', what: sh.t }; form = {}; }
  if (A.hasUndo) { TK++; UNDO = null; A.toast = ''; A.hasUndo = false; } // فتح شاشة جديدة يُنهي فرصة التراجع كي لا يغطي الإشعار الأزرار
  setState({ sh: sh, q: '', form: form || {} });
}
function shut() { SHS = []; setState({ sh: null, q: '', form: {} }); }
function fv(k) { var v = A.form[k]; return v == null ? '' : v; }
function fset(k, v) { A.form[k] = v; render(); }
/* الأرقام تقبل عمليات بسيطة: 12×3 أو 12*3 أو 100/4 أو 10+5 */
function evalNum(v) {
  var t = String(v == null ? '' : v).replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 1632); }).replace(/[×xX*]/g, '*').replace(/[÷]/g, '/').replace(/٫/g, '.').replace(/,/g, '.').replace(/\s+/g, '');
  if (!t) return 0;
  if (/^[0-9.+\-*\/()]+$/.test(t) && /[*\/+\-]/.test(t.replace(/^-/, ''))) { try { var r = Function('"use strict";return (' + t + ')')(); if (typeof r === 'number' && isFinite(r)) return r2(r); } catch (e) {} }
  var n = parseFloat(t); return isNaN(n) ? 0 : n;
}
function hasOp(v) { return /[×xX*÷\/+]|\d\s*-\s*[\d.]/.test(String(v || '').replace(/^\s*-/, '')) && /\d/.test(String(v)); }
function num(k) { return evalNum(fv(k)); }
function goBack() {
  if (A.page === 'batch' && A.draft && A.draft.step > 1 && !A.draft.editId && !A.draft.planEdit) { setDraft({ step: A.draft.step - 1 }); return; }
  if (A.page === 'batch' && A.draft && (A.draft.editId || A.draft.planEdit) && A.draft.step > 2) { setDraft({ step: A.draft.step - 1 }); return; }
  while (NAV.length) { var nv = NAV.pop(); if (navValid(nv)) { NAVB = true; try { setState(Object.assign({}, nv, { sh: null, q: '', form: {} })); } finally { NAVB = false; } return; } }
  NAVB = true;
  var map = { order: { tab: 'stock' }, supplies: { tab: 'stock' }, worker: { tab: 'workers' }, recipe: { tab: 'kitchen' }, recipes: { tab: 'kitchen' }, device: { tab: 'more' }, batches: { tab: 'kitchen' }, batch: { tab: 'kitchen' }, backup: { tab: 'more' }, tests: { tab: 'more' }, history: { tab: 'more' }, opening: { tab: 'stock' }, funds: { tab: 'more' }, reports: { tab: 'more' }, assets: { tab: 'more' }, people: { tab: 'more' }, lists: { tab: 'more' }, admin: { tab: 'more' }, cal: { tab: 'more' }, pad: { tab: 'more' } };
  if (A.page === 'fund' || A.page === 'finsum') { open('funds'); NAVB = false; return; }
  if (A.page === 'supply') { open('supplies'); NAVB = false; return; }
  if (A.page === 'cal') { open('pad'); NAVB = false; return; }
  open('main', map[A.page] || {}); NAVB = false;
}
function setDraft(p) { for (var k in p) A.draft[k] = p[k]; render(); }
function mutated(msg, undo) { save(); say(msg, undo); }

/* ---------- حقول النوافذ (نفس مكونات التصميم) ---------- */
/* تنظيف نص البيان عند الحفظ: لا مسافة قبل الفاصلة وعلامات الترقيم العربية ولا مسافات مضاعفة (السجلات القديمة لا تُمس) */
function cleanNote(t) { return String(t == null ? '' : t).replace(/\s+([،؛؟,])/g, '$1').replace(/\s{2,}/g, ' ').trim(); }
function fText(k, label, ph, mode, hint) {
  var f = fText0(k, label, ph, mode, hint); return mode === 'decimal' ? inlineN(f) : f;
}
/* حقل سر (كلمة سر البوابة، كلمة الدخول): مخفي افتراضيًا وفي مكانه زر عين للإظهار والإخفاء. كل حقل سر يمرّ من هنا (حارس: tests/total-guard-test.js) */
function fSecret(k, label, ph, hint) {
  var f = fText0(k, label, ph, 'text', hint), rv = fv('_rv_' + k) === '1';
  f.isGrow = false; f.isText = true; f.itype = rv ? 'text' : 'password'; f.dir = 'ltr'; f.ta = 'left'; f.isEye = true; f.eyeSlash = rv ? 'M3 3l18 18' : '';
  f.eyeGo = function () { fset('_rv_' + k, rv ? '' : '1'); }; return f;
}
/* رقم قصير: العنوان يمينًا وخانة ضيقة يسارًا في سطر واحد */
function inlineN(f) { f.fd = 'row'; f.ai = 'center'; f.gp = '12px'; f.lf = '1'; f.cw = '160px'; return f; }
/* المبلغ والبيان في صف واحد: خانة مبلغ ضيقة مميزة (خلفية خضراء خفيفة وخط أكبر) وبجانبها البيان؛ يُستعمل في كل نوافذ الحركات المالية (المالك 2026-11-18) */
/* لون اتجاه الحركة على النافذة كلها (حقل المبلغ، الترويسة، الغمامة، زر التسجيل): ناقص أحمر، وارد أخضر، وغيرهما بلا لون (المالك 2026-11-21) */
var TONES = { out: { tag: 'ناقص', line: '#B3261E', text: '#8E1B14', fieldBg: '#FDEEEC', hdBg: '#FFF6F5' }, 'in': { tag: 'وارد', line: '#14563A', text: '#14563A', fieldBg: '#F2F9F5', hdBg: '#F4FAF6' } };
function toneOf(k) { return k ? TONES[k] || null : null; }
function fPair(k1, cap1, k2, cap2, ph2, num2) {
  var f = fText(k1, '', '0', 'decimal'); f.cw = '124px'; f.gp = '10px'; f.lf = '0'; f.lbd = 'none'; f.hasCap = true; f.cap1 = cap1; f.cap2 = cap2;
  f.hasSide = true; f.sideV = String(fv(k2)); f.sideIn = function (v) { fset(k2, v); }; f.sidePh = ph2 || ''; if (num2) { f.sideDir = 'ltr'; f.sideMode = 'decimal'; f.sideTa = 'right'; f.sideFs = '18px'; f.cw = '150px'; } f.ibg = '#F2F9F5'; f.ibd = '#14563A'; f.ifs = '18px'; f.ifw = '500'; f.money = true; return f;
}
function fText0(k, label, ph, mode, hint) {
  var calc = mode === 'decimal', cur = String(fv(k)), ex = calc && hasOp(cur) ? evalNum(cur) : null;
  if (ex != null) hint = '= ' + fmt(ex) + (hint ? ' · ' + hint : '');
  var op = function (c) { return function () { var v = String(fv(k)); if (!v || v === '-') return; fset(k, /[×÷+\-]$/.test(v) ? v.slice(0, -1) + c : v + c); }; },
    eq = function () { var v = String(fv(k)); if (hasOp(v) && !/[×÷+\-]$/.test(v)) fset(k, String(evalNum(v))); };
  return { label: label, hint: hint || '', hasHint: !!hint, isText: calc || (mode || 'text') !== 'text', isGrow: !calc && (mode || 'text') === 'text', isChips: false, value: cur, ph: ph || '', mode: mode || 'text', itype: 'text', min: '', max: '', isArea: false,
    dir: calc ? 'ltr' : 'rtl', ta: calc ? 'right' : 'start', isCalc: calc, isEye: false, eyeGo: function () {}, eyeSlash: '', opAdd: op('+'), opSub: op('-'), opMul: op('×'), opDiv: op('÷'), opEq: eq, keep: function () {}, onKey: calc ? eq : noop,
    onInput: function (v) { fset(k, v); }, chips: [] };
}
/* حقل بسطر واحد: العنوان يمينًا والقيمة يسارًا */
function inlineF(f) { f.fd = 'row'; f.ai = 'center'; f.gp = '12px'; f.lf = '1'; f.cw = '170px'; return f; }
/* حقل تاريخ بمنتقي تقويم النظام (القيمة yyyy-mm-dd). lo/hi اختياريان: أدنى وأعلى تاريخ مسموح */
function fDate(k, label, lo, hi, hint) { var dv = fv(k), f = fText(k, label, '', 'text', hint || (/^\d{4}-\d\d-\d\d$/.test(dv || '') ? dlong(dv) : '')); f.isGrow = false; f.isText = true; f.itype = 'date'; f.min = lo || ''; f.max = hi || ''; return inlineF(f); }
/* حقل نص متعدد الأسطر (للصق نص طويل): بنفس شكل حقل النص */
function fArea(k, label, ph, hint) { var f = fText(k, label, ph, 'text', hint); f.isText = false; f.isGrow = false; f.isArea = true; return f; }
function fTime(k, label, hint) { var f = fText(k, label, '', 'text', hint); f.isGrow = false; f.isText = true; f.itype = 'time'; return inlineF(f); }
/* قائمة منسدلة: تُعرض القيمة الحالية وحدها، والنقر عليها يفتح الخيارات الأخرى. تُستعمل لكل اختيار عملة في النوافذ */
/* قائمة منسدلة مضغوطة لقائمة خيارات طويلة (وحدة، تعبئة، تخزين، فئة، مكان، يوم، وقت): الخيارات كلها موجودة بسطر واحد بدل رقائق تلتف على 3 صفوف (المالك 2026-11-23: «نفس العناصر مترتبة أحسن») */
function fDD(k, label, opts, hint) { var z = opts.filter(function (o) { return o[0] === ''; })[0], f = fSelect(k, label, opts, fv(k) == null ? '' : fv(k), (fv(k) == null || fv(k) === '') && z ? z[1] : undefined); if (hint) { f.hint = hint; f.hasHint = true; } return f; }
function fSelect(k, label, opts, sel, closedLabel) {
  var ok = k + '_o', open = fv(ok) === '1', cur = opts.filter(function (o) { return o[0] === sel; })[0] || opts[0], f = fChips(k, label, opts);
  var tog = function () { A.form[ok] = open ? '' : '1'; render(); };
  f.isChips = false; f.isDD = true; f.fd = 'row'; f.ai = 'center'; f.gp = '12px'; f.lf = 'none'; f.ddOpen = open; f.ddToggle = tog;
  f.ddLabel = closedLabel || (sel === '' || sel == null ? 'اختر…' : cur[1]);
  f.ddOpts = opts.map(function (o) { var on = sel !== '' && sel != null ? o[0] === cur[0] : o[0] === ''; return { label: o[1], bg: on ? '#EAF3EE' : '#fff', fg: on ? '#14563A' : '#1B2421', fw: on ? '500' : '400', go: function () { A.form[k] = o[0]; A.form[ok] = ''; render(); } }; });
  return f; /* قائمة منسدلة حقيقية تطفو فوق الصفحة ولا تدفع ما تحتها (المالك 2026-11-18) */
}
function fChips(k, label, opts, hint) {
  var cur = fv(k), short = opts.length <= 3 && opts.reduce(function (a, o) { return a + String(o[1]).length; }, 0) <= 20 && label.length <= 16, f;
  f = { label: label, hint: hint || '', hasHint: !!hint, isText: false, isChips: true, value: '', ph: '', mode: 'text', onInput: noop,
    chips: opts.map(function (o) { var sel = cur === o[0]; return X({ label: o[1], on: sel, selTone: o[2], tone: sel ? undefined : o[2], go: function () { fset(k, o[0]); } }); }) };
  /* لون المحدد يتبع لون اتجاه النافذة (ناقص أحمر/وارد أخضر) لا أخضر ثابتًا: `shFields` تستدعيها بنغمة النافذة (المالك 2026-11-22: «الشيكل بلون مخالف») */
  f.retone = function (tk) { var st = tk === 'out' ? 'bad' : 'ok'; f.chips = opts.map(function (o) { var sel = cur === o[0]; return X({ label: o[1], on: sel, selTone: o[2] || st, tone: sel ? undefined : o[2], go: function () { fset(k, o[0]); } }); }); };
  if (short) { f.fd = 'row'; f.ai = 'center'; f.gp = '12px'; f.lf = '1'; }
  return f;
}
/* شريط بنصفين متساويين لاختيار من 2 إلى 3 (نوع الحركة، العملة) */
function fSeg(k, label, opts) {
  var f = fChips(k, label, opts); if (!label) f.lbd = 'none'; f.fd = 'column'; f.ai = 'stretch'; f.gp = '6px'; f.lf = '0'; f.cbg = '#EEF1EC'; f.cpad = '4px'; f.cflex = '1'; f.cjc = 'center';
  f.chips = opts.map(function (o) { var sel = fv(k) === o[0]; return X({ label: o[1], on: sel, selTone: o[2] === 'bad' ? 'bad' : undefined, go: function () { fset(k, o[0]); } }); });
  var paint = function (tk) { f.chips.forEach(function (c, i) { var on = fv(k) === opts[i][0], bad = on && (opts[i][2] === 'bad' || (tk === 'out' && opts[i][2] !== 'ok')), col = bad ? '#B3261E' : '#14563A'; c.bg = on ? col : 'transparent'; c.fg = on ? '#FFFFFF' : '#5B6660'; c.bd = on ? col : 'transparent'; }); };
  paint(''); f.retone = paint;
  return f;
}
/* مفتاح ثلاثي مضغوط في صف واحد: الاسم يمينًا والمفتاح يسارًا بقياس موحّد (خيارات التقرير؛ المالك 2026-11-19) */
function fTri(k, label, opts) {
  var f = fSeg(k, label, opts); f.fd = 'row'; f.ai = 'center'; f.gp = '10px'; f.lf = '1'; f.cflex = 'none'; f.cpad = '3px'; f.chh = '34px'; f.chmw = '58px'; f.chp = '0 10px'; f.chfs = '13px'; f.cdir = 'row'; f.cdisp = 'tri';
  return f;
}
/* شبكة رقائق بحالات: كل خيار رقاقة بلون حالتها (ظاهر أخضر، لي فقط كهرماني، مخفي رمادي) والضغطة تدوّر الحالة؛ رقاقتان في الصف، وعناوين مجموعات صغيرة، والمفتاح مرة واحدة أعلى الشبكة (المالك 2026-11-23: «نفس العناصر مترتبة بشكل أحسن لا بحذفها»). كل نافذة خيارات ثلاثية/ثنائية تمرّ من هنا */
function fStateGrid(items, states) {
  states = states || [['on', 'ظاهر'], ['me', 'لي فقط'], ['off', 'مخفي']];
  var COL = { on: ['#E3F0E8', '#14563A', '#BFD9C8'], me: ['#FFF1D0', '#8A5A00', '#EBCB86'], off: ['#F1F3F0', '#8A948E', '#E1E5E0'], '1': ['#E3F0E8', '#14563A', '#BFD9C8'], '0': ['#F1F3F0', '#8A948E', '#E1E5E0'] };
  var f = { label: '', lbd: 'none', hint: '', hasHint: false, isText: false, isChips: false, isGrid: true, value: '', ph: '', mode: 'text', onInput: noop, fd: 'column', ai: 'stretch', gp: '6px', lf: '0', did: 'grid' };
  var legend = states.map(function (s) { var c = COL[s[0]] || COL.off; return { label: s[1], bg: c[0], fg: c[1], bd: c[2] }; });
  f.legend = legend;
  f.cells = items.map(function (it) {
    if (typeof it === 'string') return { isHead: true, isCell: false, label: it, go: noop, gc: '1 / -1', bg: 'transparent', fg: '#5B6660', bd: 'transparent', st: '' };
    if (it.tog) { var on = !!it.tog(), cc = on ? COL['1'] : COL['0']; return { isHead: false, isCell: true, label: it.label, st: on ? 'مفعّل' : 'مطفأ', gc: 'auto', bg: cc[0], fg: cc[1], bd: cc[2], dim: '1', go: function () { it.set(!on); render(); } }; }
    var cur = fv(it[0]), idx = Math.max(0, states.map(function (s) { return s[0]; }).indexOf(cur)), c = COL[cur] || COL.off;
    return { isHead: false, isCell: true, label: it[1], st: states[idx][1], gc: 'auto', bg: c[0], fg: c[1], bd: c[2], dim: cur === 'off' ? '.8' : '1', go: function () { fset(it[0], states[(idx + 1) % states.length][0]); } };
  });
  return f;
}
function fQuick(k, label, arr) {
  var cur = num(k);
  return { label: label, hint: '', hasHint: false, isText: false, isChips: true, value: '', ph: '', mode: 'text', onInput: noop,
    chips: arr.map(function (n) { var v = Array.isArray(n) ? n[0] : n; return X({ label: Array.isArray(n) ? n[1] : n + ' ₪', on: cur === v, go: function () { fset(k, String(v)); } }); }),
    retone: function (tk) { var me = this; me.chips = arr.map(function (n) { var v = Array.isArray(n) ? n[0] : n; return X({ label: Array.isArray(n) ? n[1] : n + ' ₪', on: cur === v, selTone: tk === 'out' ? 'bad' : 'ok', go: function () { fset(k, String(v)); } }); }); } };
}
function pickOr(list, o) {
  var raw = A.q.trim(), q = norm(raw);
  var als = function (x, f) { return (x.alias || []).filter(f); };
  var rows = list.filter(function (x) { return !q || norm(x.name).indexOf(q) >= 0 || als(x, function (a) { return norm(a).indexOf(q) >= 0; }).length > 0; });
  var exact = list.filter(function (x) { return norm(x.name) === q; })[0];
  var exAl = !exact && q ? list.filter(function (x) { return als(x, function (a) { return norm(a) === q; }).length > 0; })[0] : null;
  var known = exact || exAl;
  var near = q.length >= 3 && !known ? list.filter(function (x) { var n = norm(x.name); return n.indexOf(q) >= 0 || q.indexOf(n) >= 0; })[0] : null;
  return {
    title: o.title, sub: o.sub || '', search: 'ابحث في ' + o.plural,
    rows: rows.map(function (x) {
      var via = q && norm(x.name).indexOf(q) < 0 ? als(x, function (a) { return norm(a).indexOf(q) >= 0; })[0] : '';
      return X({ title: x.name, sub: (via ? 'يُسمّى أيضًا «' + via + '»' + (x.sub ? ' · ' : '') : '') + (x.sub || ''), tag: x.tag, tagTone: x.tagTone || 'mute', sel: x.id === o.sel, go: function () { o.onPick(x.id); } });
    }),
    empty: rows.length ? '' : (q ? 'لا يوجد «' + raw + '» بين ' + o.plural : 'لا توجد عناصر بعد'),
    dup: exact ? 'يوجد «' + exact.name + '» بنفس الاسم، اخترْه بدل التكرار.' : (exAl ? '«' + raw + '» اسم بديل للصنف «' + exAl.name + '». اخترْه من القائمة.' : (near ? 'يشبه «' + near.name + '» الموجود. هل تقصده؟' : '')),
    add: known || !o.onAdd ? null : { label: '+ ' + o.addLabel + (raw ? ' «' + raw + '»' : ''), go: function () { o.onAdd(A.q.trim()); } },
    add2: !known && raw && o.then ? { label: '«' + raw + '» اسم آخر لصنف موجود', go: function () { openSh({ t: 'aliasTo', name: raw, then: o.then }, { led: A.form.led }); } } : null
  };
}

/* ---------- ترتيب ---------- */
function sortInfo(k) {
  var cur = A.sort[k], o = SORTS[k].filter(function (x) { return x[0] === cur.f; })[0];
  return { label: 'ترتيب: ' + o[1], asc: cur.d === 1, go: function () { openSh({ t: 'sort', k: k }); } };
}

/* ===== 02-data.js ===== */
/* ---------- حسابات العرض فوق المحرك ---------- */
function daysTxt(n) { n = Math.floor(n); if (n < 1) return 'أقل من طبخة'; if (n === 1) return 'طبخة واحدة'; if (n >= 3 && n <= 10) return n + ' طبخات'; return n + ' طبخة'; }
var UC = {};
function usageOf(id) { if (!(id in UC)) { var u = E.usage(S, id); UC[id] = u && u.days >= 3 ? u : null; } return UC[id]; } // لا حكم على صنف استُعمل أقل من 3 أيام
function resetCaches() { UC = {}; PC = {}; }
/* ---------- خطة الطبخات القادمة ---------- */
function plans() { return (S.plans || []).filter(function (p) { return !p.done && !p.off && rec(p.recipeId); }).sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; }); }
/* خطط تبويب الطبخ (طبخ / طبخ خارجي): لا تُعرض خطط نوع في تبويب نوع آخر (المالك 2026-11-18) */
function plansOf(k) { return plans().filter(function (p) { return (p.kind || 'private') === (k === 'init' ? 'external' : k); }); }
function planLines() { return plans().map(function (p) { return { date: p.date, lines: E.scaleRecipe(rec(p.recipeId), p.pots, p) }; }); }
var PC = {};
function planCover(id) { // يكفي كم طبخة مخططة؟ null إن لم يدخل الصنف في أي خطة
  if (!(id in PC)) {
    var pl0 = planLines(), total = pl0.filter(function (p) { return p.lines.some(function (l) { return l.item === id; }); }).length;
    PC[id] = total ? Object.assign({ total: total }, E.coverageDays(S, ['kitchen', 'ext'], id, pl0)) : null;
  }
  return PC[id];
}
function planTxt(c) { return c.on ? 'يكفي ' + (c.days ? daysTxt(c.days) : 'أقل من طبخة') + ' من ' + c.total + ' مخططة' : 'يكفي الخطة كلها (' + c.total + ')'; }
function dayOff(n) { return iso(new Date(Date.now() + n * 864e5)); }
/* حالة الصنف: الكفاية = الرصيد ÷ المعتاد في يوم طبخ (وسيط أيام الاستعمال الفعلية) لا متوسطًا مضلِّلًا */
function stStatus(q, id) {
  var pc = planCover(id);
  if (pc && q >= 0) { // بوجود خطة: الحكم عليها لا على المتوسط
    if (!pc.on) return { t: 'كافٍ', tone: 'ok', rank: 3, days: 99, plan: pc };
    if (pc.days === 0) return { t: 'حرج', tone: 'bad', rank: 1, days: 0, plan: pc };
    if (pc.days === 1) return { t: 'ينقص قريبًا', tone: 'warn', rank: 2, days: 1, plan: pc };
    return { t: 'كافٍ', tone: 'ok', rank: 3, days: pc.days, plan: pc };
  }
  if (q < 0) return { t: 'رصيد سالب', tone: 'bad', rank: 0, days: 0 };
  if (q === 0) return { t: 'نفد', tone: 'bad', rank: 0, days: 0 };
  var u = usageOf(id), d = u && u.typical > 0 ? q / u.typical : 99;
  if (d <= 2) return { t: 'حرج', tone: 'bad', rank: 1, days: d };
  if (d <= 4) return { t: 'ينقص قريبًا', tone: 'warn', rank: 2, days: d };
  return { t: 'كافٍ', tone: 'ok', rank: 3, days: d };
}
function alertable(l, it, q) { return !l.arch && (q < 0 || !(l.ext && ((!usageOf(it.id) && !planCover(it.id)) || q === 0))); } /* الرصيد السالب (نقص مسجّل للمطالبة) ينبّه دائمًا */
function ledgers(showArch) { return S.ledgers.filter(function (l) { return showArch || !l.arch; }); }
function itemsIn(led) { // الأصناف التي لها حركة في هذا المخزن
  var seen = {}, out = [];
  S.moves.forEach(function (m) { if (m.led === led && m.kind !== 'hist' && !seen[m.item]) { seen[m.item] = 1; var it = item(m.item); if (it) out.push(it); } });
  return out;
}
function usedCount(id) { var n = 0; S.moves.forEach(function (m) { if (m.item === id && m.kind === 'batch') n++; }); return n; }
function recUsed(rid) { var n = 0; S.batches.forEach(function (b) { if (b.recipe === rid) n++; }); return n; }
function nIng(n) { return n > 10 ? n + ' مكوّنًا' : pl(n, 'مكوّن واحد', 'مكوّنان', 'مكونات'); }
function instsOf(init) { return S.insts.filter(function (i) { return !i.arch && !!i.init === !!init; }); }
function itemLabel(it) { return it.name; }

/* ---------- العمال ---------- */
function stat(id) { return E.by(S.stats || [], id); }
function activeW() { return (S.workers || []).filter(function (w) { return !w.arch; }); }
function wAtt(w) { return E.attOn(S, today(), w.id); }
function wAccToday(w) { return E.attAmt(wAtt(w)); }
function wBal(w) { return E.wBalance(S, w.id); }
/* بصيغة المخاطَب: لكشف يُرسل للعامل نفسه (بلا ضمائر) */
function balTxtTo(v) { return v > 0 ? 'مستحق ' + money(v) : v < 0 ? 'مستحق للمطبخ ' + money(-v) : 'خالص'; }
function balTxt(v) { return v > 0 ? 'له ' + money(v) : v < 0 ? 'عليه ' + money(-v) : 'خالص'; }
function balTone(v) { return v > 0 ? 'info' : v < 0 ? 'warn' : 'ok'; }
function wLastPay(w) {
  var l = null; wlOn().forEach(function (e) { if (e.w === w.id && e.kind === 'pay' && (!l || e.ts > l.ts)) l = e; });
  return l ? money(l.amt) + ' · ' + dlabel(l.date) : 'لا توجد دفعات بعد';
}
function wHist(w, n) { // آخر الأيام المسجّلة
  return (S.att || []).filter(function (a) { return a.w === w.id; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, n || 6);
}
/* تصنيف حركة العامل للعرض في كل مكان (الصفحة، الكشف، الصورة، النص): دفعة، سلفة، مكافأة، مخالفة، مسحوبات، خصم، تصحيح */
function wCat(e) {
  if (e.kind === 'pay') return /^سلفة/.test(e.note || '') ? 'adv' : 'pay';
  if (e.kind === 'viol') return 'viol';
  if (e.cat === 'adjw') return 'adjw';
  if (e.kind === 'deduct') return e.cat === 'buy' ? 'buy' : 'ded';
  if (e.kind === 'add') return /^إلغاء/.test(e.note || '') ? 'rev' : e.cat === 'kbuy' ? 'kbuy' : 'bonus';
  return e.kind;
}
var WCAT = { pay: ['دفعة', 'mute'], adv: ['سلفة', 'mute'], bonus: ['إضافة', 'ok'], kbuy: ['شراء للمطبخ', 'info'], adjw: ['تسوية', 'mute'], viol: ['مخالفة', 'bad'], buy: ['مسحوبات', 'bad'], ded: ['خصم', 'bad'], rev: ['تصحيح', 'mute'], open: ['رصيد سابق', 'mute'] };
function wPlusC(c) { return c === 'bonus'; } /* «إضافة» لحسابه (مكافأة، بدل مواصلات...): السبب يكتبه المالك في البيان */
function wLabel(e) { return (WCAT[wCat(e)] || [e.kind])[0]; }
function wTone(e) { return (WCAT[wCat(e)] || [0, 'mute'])[1]; }
function wlOn() { return (S.wl || []).filter(function (e) { return !e.void; }); } /* حركات العمال السارية: الملغاة تبقى في السجل ولا تُحتسب */
function wViol(w) { return wlOn().filter(function (e) { return e.w === w.id && e.kind === 'viol'; }).sort(function (a, b) { return b.ts - a.ts; }); }
function wToday(w) { return wlOn().filter(function (e) { return e.w === w.id && e.kind !== 'open' && e.kind !== 'viol' && e.date === today(); }); }
function wOpenAmt(w) { return E.wSum(S, w.id, ['open']); }
function setStat(wid, sid, date) { E.setAtt(S, date || today(), wid, sid); save(); shut(); }
function allPresent() {
  var ids = []; activeW().forEach(function (w) { if (!wAtt(w)) { E.setAtt(S, today(), w.id, 'p'); ids.push(w.id); } });
  if (!ids.length) { say('كل العمال مسجَّل حضورهم'); return; }
  mutated('سُجّل حضور ' + pl(ids.length, 'عامل واحد', 'عاملين', 'عمال'), function () {
    S.att = (S.att || []).filter(function (a) { return !(a.date === today() && a.st === 'p' && ids.indexOf(a.w) >= 0); });
    save(); say('أُلغي تسجيل الحضور الجماعي');
  });
}

/* ---------- الطبخة (مسودة) ---------- */
function stepFor(unit, v, dir) {
  if (unit !== 'كيلو' && unit !== 'لتر') return 1;
  var edge = dir < 0;
  if (edge ? v <= 0.1001 : v < 0.1) return 0.01;
  if (edge ? v <= 1.0001 : v < 1) return 0.1;
  if (edge ? v <= 5.0001 : v < 5) return 0.25;
  return 0.5;
}
function newDraft(kind, ini) {
  return { step: 1, date: today(), kind: kind, init: !!ini, rec: null, inst: null, portions: '', dish: '', pots: 3, over: {}, del: {}, extra: [], editId: null, alt: {}, opts: {}, mkt: {}, fill: {}, pm: 'items', lump: '', xl: [], cf: {} };
}
function startBatch(kind, ini) { if (isClosed()) { openSh({ t: 'locked', what: 'batch' }); return; } open('batch', { draft: newDraft(kind, ini) }); }
/* سطر في معالج الطبخة. meta: cat, note, fixed, extra, swap, mkt (اشتُري مباشرة من السوق) */
function mkLine(it, planned, actual, order, meta, extraMap) {
  var fill = !!meta.fill, mk = !!meta.mkt && fill, src = E.splitQty(S, fill ? order : order.slice(0, 1), it.id, actual, extraMap, !!meta.sink);
  if (mk && src.ext) { src.mkt = src.ext; delete src.ext; }
  var avail = Math.max(E.balance(S, order[0], it.id) + ((extraMap && extraMap[order[0]]) || 0), 0), short = r3(Math.max(0, actual - avail));
  var used = order.filter(function (k) { return src[k] != null; }), last = used.length ? used[used.length - 1] : order[0], dev = '';
  if (!meta.extra && meta.cat === 'b' && planned > 0 && Math.abs(actual - planned) > 0.0001) dev = 'يختلف عن وصفة المؤسسة';
  if (!meta.extra && meta.cat === 's' && planned > 0 && Math.abs(actual - planned) / planned > 0.1001) dev = 'أعلى من وصفة المؤسسة بأكثر من 10%';
  return { id: it.id, name: it.name, unit: it.unit, planned: planned, actual: actual, price: it.price || 0, src: src, cat: meta.cat || 'b', note: meta.note || '', fixed: !!meta.fixed, extra: !!meta.extra, swap: !!meta.swap, mkt: mk, fill: fill, short: short, dev: dev,
    after: r2(E.balance(S, last, it.id) + ((extraMap && extraMap[last]) || 0) - (src[last] || 0)), lastName: led(last).name, cover: order[0] === 'kitchen' || order[0] === 'ext' ? (src.ext || 0) + (src.mkt || 0) : 0 };
}
/* الأساسيات أولًا والبهارات أخيرًا في كل قائمة مكوّنات (ترتيب ثابت يحفظ ترتيب الوصفة داخل كل مجموعة) */
function isSpiceIt(id) { var it = id ? item(id) : null; return it && it.grp === 'spice' ? 1 : 0; }
function spiceLast(list, key) {
  var sp = function (x) { var it = item(key ? key(x) : x.item); return it && it.grp === 'spice' ? 1 : 0; };
  return list.map(function (x, i) { return [x, i]; }).sort(function (a, b) { return (sp(a[0]) - sp(b[0])) || (a[1] - b[1]); }).map(function (p) { return p[0]; });
}
/* ما يُضاف للرصيد الخام لصنف في هذه الطبخة: استهلاك الطبخة نفسها عند تعديلها، وما حجزته الخطط السابقة (سالب) */
function dExm(d) {
  var order = E.planOrder(S, d.kind, d.inst), net = d.editId ? E.batchNet(S, d.editId) : null;
  var psim = d.planEdit ? planPrior(d.planEdit) : (!d.editId && !d.planId && d.date && d.date > today() ? planPrior(null) : null); /* تعديل خطة أو طبخة مجدولة جديدة: الخطط السابقة حجزت موادها */
  return function (id) {
    var o = {}, pe = psim ? priorExtra(psim, order, id) : null;
    if (!net && !pe) return null;
    order.forEach(function (l) { o[l] = (net ? net[l + '|' + id] || 0 : 0) + (pe ? pe[l] || 0 : 0); });
    return o;
  };
}
/* المتبقي من صنف في مخزن الطبخة بعد ما تحجزه هذه الطبخة (أسطرها وإضافاتها) والخطط السابقة: هو الرقم الذي يُعرض عند الاختيار لا الرصيد الخام */
function dRemain(id) {
  var d = A.draft; if (!d) return null;
  var order = E.planOrder(S, d.kind, d.inst), o = dExm(d)(id), ln = dLines().filter(function (l) { return l.id === id; });
  var used = ln.reduce(function (a, l) { return a + (l.src[order[0]] || 0); }, 0);
  return r3(E.balance(S, order[0], id) + ((o && o[order[0]]) || 0) - used);
}
function dLines() {
  var d = A.draft, out = [];
  if (!d || !d.rec) return out;
  var r = rec(d.rec), order = E.planOrder(S, d.kind, d.inst), alt = d.alt || {}, opts = d.opts || {}, mk = d.mkt || {}, fl = d.fill || {}, exm = dExm(d);
  r.lines.forEach(function (l) {
    if (l.opt && !opts[l.item]) return; /* مكوّن اختياري: لا يدخل إلا إن أضفته */
    var id = l.item, per = l.per, note = l.note;
    if (l.alt && alt[l.item]) { id = l.alt.item; per = l.alt.per; note = l.alt.note; }
    if (d.del[id]) return;
    var planned = r3(l.fixed ? per : per * d.pots);
    out.push(mkLine(item(id), planned, d.over[id] != null ? d.over[id] : planned, order, { sink: d.kind === 'external', cat: l.cat, note: note, fixed: l.fixed, swap: l.swap, mkt: !!mk[id], fill: !!fl[id] }, exm(id)));
  });
  d.extra.forEach(function (e) { out.push(mkLine(item(e.item), e.qty, d.over[e.item] != null ? d.over[e.item] : e.qty, order, { sink: d.kind === 'external', extra: true, mkt: !!mk[e.item], fill: !!fl[e.item] }, exm(e.item))); });
  return spiceLast(out, function (x) { return x.id; });
}
function nudge(id, dir) {
  var l = dLines().filter(function (x) { return x.id === id; })[0], over = Object.assign({}, A.draft.over);
  over[id] = Math.max(0, r2(l.actual + dir * stepFor(l.unit, l.actual, dir)));
  setDraft({ over: over });
}
function srcTxt(l) { return Object.keys(l.src).map(function (k) { return (LSHORT[k] || k) + ' ' + fmt(l.src[k]); }).join(' + '); }
function batchCostTxt(b) { var f = E.isFree(led(b.order[0])); return b.kind === 'external' && f && !(b.cost > 0) ? 'عيني' : money(b.cost || 0); }
function planName(p) { return p.dish || (rec(p.recipeId) || {}).name || 'طبخة'; }
function batchName(b) { return b.dish || (rec(b.recipe) || {}).name || 'طبخة'; }
function batchesOf(k) { return S.batches.filter(function (b) { var i = inst(b.inst); var n = !!(i && i.init); return k === 'all' ? true : k === 'init' ? n : (b.kind === k && !n); }); }
function sortedBatches(list) {
  var c = A.sort.batches, a = list.slice();
  a.sort(function (x, y) {
    if (c.f === 'cost') return ((x.cost || 0) - (y.cost || 0)) * c.d;
    if (c.f === 'name') return batchName(x).localeCompare(batchName(y), 'ar') * c.d;
    return ((x.date === y.date ? x.ts - y.ts : (x.date < y.date ? -1 : 1))) * c.d;
  });
  return a;
}
/* هل الطبخة من يوم اليوم؟ (للتعديل والإلغاء الحر) */
function isToday(b) { return b.date === today(); }

/* ===== 02a-assets.js ===== */
/* ---------- الموجودات: قدور وأدوات ومعدات المطبخ (عدد وحالة وجرد) ---------- */
var ACATS = ['قدور', 'أدوات طبخ', 'معدات', 'أواني وتعبئة', 'أخرى'], ALOCS = ['المطبخ', 'المستودع', 'خارج المطبخ'];
function acats() { return (S.acats && S.acats.length ? S.acats : ACATS); }
function alocs() { return (S.alocs && S.alocs.length ? S.alocs : ALOCS); }
function AA(all) { return (S.assets || []).filter(function (a) { return all || !a.arch; }); }
function asset(id) { return E.by(S.assets || [], id); }
function aTot(a) { return (a.qty || 0) + (a.bad || 0) + (a.out || 0); }
function aDays(a) { return a.cdate ? Math.floor((Date.now() - new Date(a.cdate + 'T12:00:00').getTime()) / 864e5) : null; }
function aStale(a) { var d = aDays(a); return d == null || d > 30; }
function aAgeTxt(a) { var d = aDays(a); return d == null ? 'لم يُجرد بعد' : d <= 0 ? 'جُرد اليوم' : d === 1 ? 'جُرد أمس' : 'جُرد قبل ' + pl(d, 'يوم', 'يومين', 'أيام'); }
function aTxt(a) { var p = ['سليم ' + fmt(a.qty || 0)]; if (a.bad > 0) p.push('معطّل ' + fmt(a.bad)); if (a.out > 0) p.push('معار ' + fmt(a.out)); return p.join(' · '); }
function aIcon(cat) { return cat === 'قدور' ? 'i-pot' : cat === 'معدات' ? 'i-sliders' : cat === 'أدوات طبخ' ? 'i-book' : 'i-box'; }
function aAvail(a, t) { return { buy: 9999, bad: a.qty || 0, fix: a.bad || 0, out: a.qty || 0, back: a.out || 0, lost: a.qty || 0, junk: a.bad || 0 }[t] || 0; }
function aMoves() { return [['buy', 'إضافة (شراء أو استلام)'], ['bad', 'تعطّل أو كُسر'], ['fix', 'تم إصلاحه'], ['out', 'إعارة لجهة'], ['back', 'عاد من الإعارة'], ['lost', 'فُقد'], ['junk', 'إتلاف نهائي']]; }
function aApply(a, t, n) {
  if (t === 'buy') a.qty += n; else if (t === 'bad') { a.qty -= n; a.bad += n; } else if (t === 'fix') { a.bad -= n; a.qty += n; }
  else if (t === 'out') { a.qty -= n; a.out += n; } else if (t === 'back') { a.out -= n; a.qty += n; } else if (t === 'lost') a.qty -= n; else if (t === 'junk') a.bad -= n;
}
function aLog(a, t, q, note, ph) { a.log = a.log || []; var e = { date: today(), t: t, q: q, note: note || '' }; if (ph) e.ph = ph; a.log.unshift(e); }
function assetAttention() { return AA().filter(function (a) { return a.bad > 0 || aStale(a); }); }

function pgAssets() {
  var bl = [], act = AA(), cat = A.acat || 'all', tot = act.reduce(function (t, a) { return t + aTot(a); }, 0), good = act.reduce(function (t, a) { return t + (a.qty || 0); }, 0), warn = assetAttention().length;
  bl.push(B('kpi', { items: [X({ label: 'أنواع', value: act.length, sub: 'مسجّلة', go: function () { openSh({ t: 'kAstT' }); } }), X({ label: 'قطع', value: tot, sub: 'سليم ' + good, go: function () { openSh({ t: 'kAstP' }); } }), X({ label: 'تحتاج انتباه', value: warn, sub: 'معطّل أو يلزم جرد', endTone: warn ? 'bad' : 'ok', go: function () { openSh({ t: 'kAst' }); } })] }));
  bl.push(B('chips', { items: [X({ label: 'الكل', on: cat === 'all', go: function () { setState({ acat: 'all' }); } })].concat(acats().filter(function (c) { return act.some(function (a) { return a.cat === c; }); }).map(function (c) { return X({ label: c, on: cat === c, go: function () { setState({ acat: c }); } }); })) }));
  bl.push(B('acts', { items: [X({ title: 'موجود جديد', icon: 'i-plus', go: function () { openSh({ t: 'addAsset' }, { name: '', cat: acats()[0], catNew: '', qty: '', loc: alocs()[0], locNew: '', note: '' }); } }), X({ title: 'جرد', icon: 'i-check', go: function () { openSh({ t: 'stocktake' }); } })] }));
  var cats = acats().filter(function (c) { return (cat === 'all' || cat === c) && act.some(function (a) { return a.cat === c; }); });
  cats.forEach(function (c) {
    var rs = act.filter(function (a) { return a.cat === c; });
    bl.push(B('rows', { title: c + ' (' + rs.length + ')', items: rs.map(function (a) {
      var st = a.bad > 0 ? ['معطّل ' + fmt(a.bad), 'warn'] : aStale(a) ? ['يلزم جرد', 'info'] : a.out > 0 ? ['معار ' + fmt(a.out), 'mute'] : ['سليم', 'ok'];
      return X({ icon: aIcon(c), icTone: a.bad > 0 ? 'warn' : 'mute', ph: !!a.ph, title: a.name, sub: (a.bad > 0 || a.out > 0 ? aTxt(a) : 'العدد ' + fmt(a.qty || 0)) + ' · ' + a.loc, tag: st[0], tagTone: st[1], chev: true, go: function () { openSh({ t: 'asset', id: a.id }); },
        lp: function () { assetQa(a); } });
    }) }));
  });
  if (!cats.length) bl.push(B('rows', { items: [], empty: 'لا موجودات بعد. أضف أول قدر أو أداة.' }));
  return bl;
}

function doAddAsset() {
  var nm = fv('name').trim(), cat = (fv('catNew') || '').trim() || fv('cat') || 'أخرى', loc = (fv('locNew') || '').trim() || fv('loc') || 'المطبخ', qty = Math.round(num('qty')), note = (fv('note') || '').trim(), pid = phTake();
  S.assets = S.assets || []; S.acats = acats().slice(); S.alocs = alocs().slice();
  if (S.acats.indexOf(cat) < 0) S.acats.push(cat); if (S.alocs.indexOf(loc) < 0) S.alocs.push(loc);
  var a = { id: newId('a', S.assets), name: nm, cat: cat, loc: loc, qty: qty, bad: 0, out: 0, note: note, cdate: today(), log: [] }; phTag(a, pid);
  aLog(a, 'إضافة', qty, 'أول تسجيل', pid); S.assets.push(a); audit('إضافة «' + nm + '» إلى الموجودات (' + qty + ')');
  save(); setState({ sh: null, form: {}, acat: 'all' }); say('أُضيف «' + nm + '» إلى الموجودات');
}
function doEditAsset(id) {
  var a = asset(id), nm = fv('name').trim(), cat = (fv('catNew') || '').trim() || fv('cat') || a.cat, loc = (fv('locNew') || '').trim() || fv('loc') || a.loc, note = (fv('note') || '').trim(), ch = [], pid = phTake();
  S.acats = acats().slice(); S.alocs = alocs().slice(); if (S.acats.indexOf(cat) < 0) S.acats.push(cat); if (S.alocs.indexOf(loc) < 0) S.alocs.push(loc);
  if (a.name !== nm) ch.push('الاسم إلى «' + nm + '»'); if (a.cat !== cat) ch.push('الفئة: ' + cat); if (a.loc !== loc) ch.push('المكان: ' + loc); if ((a.note || '') !== note) ch.push('الملاحظة');
  a.name = nm; a.cat = cat; a.loc = loc; a.note = note; if (pid) { a.ph = pid; ch.push('صورة القطعة'); } if (ch.length) audit('تعديل «' + nm + '» في الموجودات: ' + ch.join('، '));
  save(); setState({ sh: { t: 'asset', id: id }, form: {}, q: '' }); say('حُفظت بيانات الموجود');
}
function doAssetCount(id) {
  var a = asset(id), q = Math.max(0, Math.round(num('cq'))), b = Math.max(0, Math.round(num('cb'))), o = Math.max(0, Math.round(num('co'))), df = [], pid = phTake();
  if (q !== (a.qty || 0)) df.push('سليم ' + (q - a.qty > 0 ? '+' : '−') + Math.abs(q - a.qty)); if (b !== (a.bad || 0)) df.push('معطّل ' + (b - a.bad > 0 ? '+' : '−') + Math.abs(b - a.bad)); if (o !== (a.out || 0)) df.push('معار ' + (o - a.out > 0 ? '+' : '−') + Math.abs(o - a.out));
  a.qty = q; a.bad = b; a.out = o; a.cdate = today(); aLog(a, 'جرد', q + b + o, df.length ? 'فرق عن المسجّل: ' + df.join('، ') : 'مطابق للمسجّل', pid); audit('جرد «' + a.name + '»: ' + (df.length ? df.join('، ') : 'مطابق'));
  save(); setState({ sh: { t: 'stocktake' }, form: {}, q: '' }); say(df.length ? 'سُجّل الجرد مع فرق: ' + df.join('، ') : 'الجرد مطابق للمسجّل');
}
function doAssetMove(id) {
  var a = asset(id), t = fv('type'), n = Math.round(num('n')), note = (fv('note') || '').trim(), pid = phTake(), lab = aMoves().filter(function (m) { return m[0] === t; })[0][1];
  aApply(a, t, n); aLog(a, lab, n, note, pid); audit(lab + ' ' + n + ' من «' + a.name + '»' + (note ? ' — ' + note : ''));
  save(); setState({ sh: { t: 'asset', id: id }, form: {}, q: '' }); say('سُجّل: ' + lab + ' ' + n + ' (' + a.name + ')');
}

function assetSheet(sh) {
  var R = null, nm, dup;
  switch (sh.t) {
    case 'addAsset': case 'assetEdit': {
      var aed = sh.t === 'assetEdit', a0 = aed ? asset(sh.id) : null;
      nm = fv('name').trim(); dup = AA(true).filter(function (x) { return norm(x.name) === norm(nm) && (!aed || x.id !== a0.id); })[0];
      var aq = Math.round(num('qty')), fl = [fText('name', 'الاسم', 'مثال: قدر 60 لتر'), fDD('cat', 'الفئة', acats().map(function (c) { return [c, c]; })), fText('catNew', 'أو فئة جديدة', 'مثال: تبريد')];
      if (!aed) fl.push(fText('qty', 'العدد', '0', 'numeric', 'كم قطعة سليمة عندك الآن؟ التعطّل والإعارة تُسجَّل بعدها كحركات.'));
      fl.push(fDD('loc', 'مكانه', alocs().map(function (c) { return [c, c]; }))); fl.push(fText('locNew', 'أو مكان جديد', 'مثال: سطح المبنى')); fl.push(fText('note', 'ملاحظة (اختياري)', 'مثال: سعة، موديل، رقم تسلسلي')); fl.push(fPhoto('صورة القطعة (اختياري)'));
      R = { title: aed ? 'بيانات ' + a0.name : 'موجود جديد', sub: aed ? 'العدد والحالة تتغير بالحركات والجرد فقط' : 'قدر أو أداة أو معدّة للمطبخ', fields: fl,
        dup: dup ? 'يوجد «' + dup.name + '» بنفس الاسم' + (dup.arch ? ' (مؤرشف: استعده من الأرشيف)' : '') + '.' : '',
        ft: { label: aed ? 'حفظ البيانات' : 'حفظ في الموجودات', ok: nm.length > 1 && !dup && (aed || aq > 0), go: function () { if (aed) doEditAsset(a0.id); else doAddAsset(); } } };
      break;
    }
    case 'asset': {
      var ast = asset(sh.id), ar = [X({ total: true, title: 'الإجمالي', sub: aAgeTxt(ast), tag: fmt(aTot(ast)) + ' قطعة', tagTone: aStale(ast) ? 'info' : 'ok' }), X({ title: 'سليم وجاهز', tag: fmt(ast.qty || 0), tagTone: 'ok' }),
        X({ title: 'معطّل', sub: ast.bad > 0 ? 'يحتاج إصلاحًا أو استبدالًا' : '', tag: fmt(ast.bad || 0), tagTone: ast.bad > 0 ? 'warn' : 'mute' }), X({ title: 'معار لجهة', tag: fmt(ast.out || 0), tagTone: 'mute' }), X({ title: 'الفئة', tag: ast.cat, tagTone: 'mute' }), X({ title: 'مكانه', tag: ast.loc, tagTone: 'mute' })];
      if (ast.note) ar.push(X({ title: 'ملاحظة', sub: ast.note }));
      ar.push(X({ icon: 'i-pencil', icTone: 'mute', title: 'تعديل البيانات', sub: 'الاسم والفئة والمكان والملاحظة', chev: true, go: function () { openSh({ t: 'assetEdit', id: ast.id }, { name: ast.name, cat: ast.cat, catNew: '', loc: ast.loc, locNew: '', note: ast.note || '' }); } }));
      (ast.log || []).slice(0, 6).forEach(function (l) { ar.push(phRow({ title: l.t, sub: dlabel(l.date) + (l.note ? ' · ' + l.note : ''), tag: fmt(l.q), tagTone: 'mute' }, l, ast.name + ' · ' + l.t)); });
      ar.push(X({ icon: 'i-lock', icTone: 'mute', title: 'إنهاء التعامل (أرشفة)', sub: 'لبيع أو إتلاف نهائي: يختفي من القائمة ولا يُحذف', chev: true, go: function () { openSh({ t: 'archConfirm', k: 'asset', id: ast.id }, { why: 'انتهى التعامل' }); } }));
      R = { title: ast.name, sub: ast.cat + ' · ' + ast.loc, rows: ar,
        ft: { label: 'تسجيل حركة', ok: true, go: function () { var v = aMoves().filter(function (m) { return aAvail(ast, m[0]) > 0; })[0][0]; openSh({ t: 'assetMove', id: ast.id }, { type: v === 'buy' ? 'bad' : v, n: '1', note: '' }); } },
        ft2: { label: 'جرد', go: function () { openSh({ t: 'assetCount', id: ast.id }, { cq: String(ast.qty || 0), cb: String(ast.bad || 0), co: String(ast.out || 0) }); } } };
      break;
    }
    case 'assetCount': {
      var ac = asset(sh.id), cdf = [];
      if (Math.round(num('cq')) !== (ac.qty || 0)) cdf.push('سليم ' + (num('cq') > ac.qty ? '+' : '−') + Math.abs(Math.round(num('cq')) - ac.qty)); if (Math.round(num('cb')) !== (ac.bad || 0)) cdf.push('معطّل ' + (num('cb') > ac.bad ? '+' : '−') + Math.abs(Math.round(num('cb')) - ac.bad)); if (Math.round(num('co')) !== (ac.out || 0)) cdf.push('معار ' + (num('co') > ac.out ? '+' : '−') + Math.abs(Math.round(num('co')) - ac.out));
      R = { title: 'جرد: ' + ac.name, sub: 'المسجّل: ' + aTxt(ac) + ' · ' + aAgeTxt(ac), fields: [fText('cq', 'عددتُ سليمًا', '0', 'numeric'), fText('cb', 'عددتُ معطّلًا', '0', 'numeric'), fText('co', 'معار خارج المطبخ (حسب علمك)', '0', 'numeric'), fPhoto('صورة الجرد (اختياري)')],
        note: { text: cdf.length ? 'فرق عن المسجّل: ' + cdf.join('، ') + '. يُحفظ الفرق في سجل الموجود.' : 'مطابق للمسجّل', tone: cdf.length ? 'warn' : 'ok' },
        ft: { label: 'اعتماد الجرد', ok: fv('cq') !== '' && fv('cb') !== '' && fv('co') !== '', go: function () { doAssetCount(ac.id); } } };
      break;
    }
    case 'assetMove': {
      var am = asset(sh.id), mt = fv('type'), mn = Math.round(num('n')), mnote = (fv('note') || '').trim(), mav = aAvail(am, mt), mvalid = aMoves().filter(function (m) { return aAvail(am, m[0]) > 0; });
      var pr = Object.assign({}, am); if (mt && mn > 0 && mn <= mav) aApply(pr, mt, mn); var mlab = aMoves().filter(function (m) { return m[0] === mt; })[0];
      R = { title: 'حركة: ' + am.name, sub: aTxt(am), fields: [fChips('type', 'نوع الحركة', mvalid), fText('n', 'العدد', '1', 'numeric', mt && mt !== 'buy' ? 'المتاح لهذه الحركة: ' + fmt(mav) : ''),
          fChips('n', 'سريع', [1, 2, 5, 10].filter(function (v) { return v <= mav; }).map(function (v) { return [String(v), String(v)]; })), fText('note', mt === 'out' ? 'لمن أُعيرت؟ (مطلوب)' : mt === 'lost' ? 'كيف فُقد؟ (اختياري)' : 'ملاحظة (اختياري)', mt === 'out' ? 'مثال: مطبخ الجيران' : ''), fPhoto('صورة (اختياري)')],
        note: { text: mn > 0 && mn <= mav ? 'بعد الحركة: ' + aTxt(pr) : mn > mav ? 'العدد أكبر من المتاح (' + fmt(mav) + ')' : '', tone: mn > mav ? 'warn' : 'info' },
        ft: { label: 'تسجيل ' + (mlab ? mlab[1] : 'الحركة'), ok: !!mlab && mn >= 1 && mn <= mav && (mt !== 'out' || mnote.length > 1), go: function () { doAssetMove(am.id); } } };
      break;
    }
    case 'stocktake': {
      var sta = AA().slice().sort(function (a, b) { return (bd(b)) - (bd(a)); }), nst = sta.filter(aStale).length;
      function bd(a) { var d = aDays(a); return d == null ? 999 : d; }
      R = { title: 'جرد الموجودات', sub: nst ? nst + ' من ' + sta.length + ' يلزم جردها (أكثر من 30 يومًا)' : 'كلها مجرودة حديثًا', rows: sta.map(function (a) {
          return X({ icon: aIcon(a.cat), icTone: aStale(a) ? 'warn' : 'mute', title: a.name, sub: aAgeTxt(a) + ' · ' + a.loc, tag: fmt(aTot(a)), tagTone: aStale(a) ? 'info' : 'ok', chev: true, go: function () { openSh({ t: 'assetCount', id: a.id }, { cq: String(a.qty || 0), cb: String(a.bad || 0), co: String(a.out || 0) }); }, lp: function () { assetQa(a); } });
        }), empty: 'لا موجودات', note: { text: 'اضغط على أي موجود، وأدخل ما عددته فعلًا. الأقدم جردًا في الأعلى.', tone: 'info' } };
      break;
    }
  }
  return R;
}

function assetQa(a) { qa(a.name, a.cat + ' · ' + a.loc, [['جرد', 'i-check', function () { openSh({ t: 'assetCount', id: a.id }, { cq: String(a.qty || 0), cb: String(a.bad || 0), co: String(a.out || 0) }); }], ['تسجيل حركة', 'i-box', function () { var mv = aMoves().filter(function (m) { return aAvail(a, m[0]) > 0; })[0]; if (!mv) { openSh({ t: 'asset', id: a.id }); return; } openSh({ t: 'assetMove', id: a.id }, { type: mv[0] === 'buy' ? 'bad' : mv[0], n: '1', note: '' }); }], ['تعديل البيانات', 'i-pencil', function () { openSh({ t: 'assetEdit', id: a.id }, { name: a.name, cat: a.cat, catNew: '', loc: a.loc, locNew: '', note: a.note || '' }); }]]); }

/* ===== 02b-batchx.js ===== */
/* ---------- الطبخة: ميزات التصميم المكمّلة (خيارات الوصفة، السوق مباشرة، التسعير وبنود التكلفة، الحقول المخصصة، تأكيد الكميات) ---------- */
var XK = ['عمال', 'نقل', 'غاز ووقود', 'أخرى'];
function xkinds() { return (S.xkinds && S.xkinds.length ? S.xkinds : XK); }
function fieldsFor(kind) { return (S.fields || []).filter(function (f) { return f.where === 'all' || f.where === kind; }); }
function cp(o) { return JSON.parse(JSON.stringify(o)); }

/* يملأ مسودة من طبخة محفوظة (للتعديل أو للتحويل إلى خطة): الكميات المعدّلة والمحذوف والإضافي والخيارات والبدائل والسوق والتسعير */
function draftFromBatch(d, b, r) {
  var inB = function (id) { return b.lines.some(function (x) { return x.item === id; }); }, qOf = function (id) { return b.lines.filter(function (x) { return x.item === id; })[0].qty; }, used = {};
  r.lines.forEach(function (l) {
    var id = l.item;
    if (l.alt && !inB(l.item) && inB(l.alt.item)) { d.alt[l.item] = true; id = l.alt.item; }
    if (l.opt) { if (inB(id)) d.opts[l.item] = true; else return; }
    if (!inB(id)) { d.del[id] = true; return; }
    used[id] = 1;
    var per = d.alt[l.item] ? l.alt.per : l.per, planned = r3(l.fixed ? per : per * d.pots);
    if (Math.abs(planned - qOf(id)) > 0.0001) d.over[id] = qOf(id);
  });
  b.lines.forEach(function (ln) { if (!used[ln.item]) d.extra.push({ item: ln.item, qty: ln.qty }); if (ln.src && ln.src.mkt) d.mkt[ln.item] = true; if (ln.src && Object.keys(ln.src).some(function (k) { return k !== b.order[0]; })) d.fill[ln.item] = true; });
  d.pm = b.pm || 'items'; d.lump = b.lump ? String(b.lump) : ''; d.xl = cp(b.xl || []); d.cf = Object.assign({}, b.cf || {});
  return d;
}
/* الخطة تحمل نفس حقول المسودة كي تُطبَّق كما هي عند البدء */
var PLAN_KEYS = ['over', 'del', 'alt', 'opts', 'mkt', 'fill', 'cf'];
function planFromDraft(d, id) {
  var p = { id: id, date: d.date, recipeId: d.rec, pots: d.pots, kind: d.kind, inst: d.inst || '', init: !!d.init, dish: d.dish || '', portions: d.portions, extra: (d.extra || []).slice(), pm: d.pm || 'items', lump: d.lump || '', xl: cp(d.xl || []) };
  PLAN_KEYS.forEach(function (k) { p[k] = Object.assign({}, d[k] || {}); });
  return p;
}
/* تغيير عدد القدور مع إبقاء تعديلاتك متناسبة: ما عدّلته للقدر يُضرب بالعدد الجديد (الثابت والإضافي لا يتغيران) */
function potsPatch(d, n) {
  var r = rec(d.rec), keep = {}, over = {}; (r ? r.lines : []).forEach(function (l) { if (l.fixed) { keep[l.item] = 1; if (l.alt) keep[l.alt.item] = 1; } }); (d.extra || []).forEach(function (e) { keep[e.item] = 1; });
  Object.keys(d.over || {}).forEach(function (id) { over[id] = keep[id] || !(d.pots > 0) ? d.over[id] : r3(d.over[id] * n / d.pots); });
  return { pots: n, over: over };
}
function editPlan(p) {
  var d = draftFromPlan(p, newDraft(p.kind || 'private', !!p.init)); d.date = p.date; d.step = 2; d.planEdit = p.id; delete d.planId;
  shut(); open('batch', { draft: d });
}
function draftFromPlan(p, d) {
  d.rec = p.recipeId; d.pots = p.pots; d.planId = p.id; d.dish = p.dish || '';
  if (p.inst) d.inst = p.inst; if (p.init) d.init = true; if (p.portions) d.portions = p.portions; if (p.extra) d.extra = p.extra.slice();
  PLAN_KEYS.forEach(function (k) { if (p[k]) d[k] = Object.assign({}, p[k]); });
  d.pm = p.pm || 'items'; d.lump = p.lump || ''; d.xl = cp(p.xl || []);
  return d;
}

/* تكلفة الطبخة في الخطوة 3: مواد، أو مواد + بنود، أو سعر القدر الإجمالي (للمدفوعة الخارجية فقط) */
function paidSrc(k) { return k === 'mkt' || (!!led(k) && !E.isFree(led(k))); }
function priceInfo(d, lines) {
  var order = E.planOrder(S, d.kind, d.inst), free0 = E.isFree(led(order[0])), mat = lines.reduce(function (a, l) {
    var q = d.kind === 'private' ? Object.keys(l.src).filter(paidSrc).reduce(function (x, k) { return x + l.src[k]; }, 0) : free0 ? 0 : l.actual;
    return a + q * l.price;
  }, 0), xl = d.xl || [], xt = r2(xl.reduce(function (a, x) { return a + x.amt; }, 0)), lumpOn = d.pm === 'lump', lumpV = Number(d.lump) || 0, isPaid = d.kind === 'external', total = mat;
  if (isPaid) total = lumpOn ? r2(d.pots * lumpV) : r2(mat + xt);
  return { free0: free0, mat: mat, xl: xl, xt: xt, lumpOn: lumpOn, lumpV: lumpV, isPaid: isPaid, total: total, kv: lines.reduce(function (a, l) { return a + (l.src.kitchen || 0) * l.price; }, 0) };
}
function applyPricing(b, d) {
  b.matCost = b.cost; var free = E.isFree(led(b.order[0]));
  if (b.kind === 'external') {
    b.pm = d.pm === 'lump' ? 'lump' : 'items'; b.lump = Number(d.lump) || 0; b.xl = cp(d.xl || []);
    b.cost = b.pm === 'lump' ? r2((b.pots || 0) * b.lump) : r2(b.matCost + b.xl.reduce(function (a, x) { return a + x.amt; }, 0));
  } else { delete b.pm; delete b.lump; delete b.xl; }
  var cf = {}; fieldsFor(b.kind).forEach(function (f) { var v = (d.cf || {})[f.id]; if (v !== undefined && String(v).trim() !== '') cf[f.id] = v; }); b.cf = cf;
  b.gone = Object.keys(d.del || {}).filter(function (k) { return d.del[k]; });
}
function batchLinesOut(lines) { return lines.filter(function (l) { return l.actual > 0; }).map(function (l) { return { item: l.id, qty: l.actual, mkt: l.mkt, fill: l.fill, planned: l.planned, dev: l.dev, extra: l.extra }; }); }
/* تسجيل طبخة جديدة من مسودة. done=false: بدء سريع بالوصفة وتنتظر تأكيد الكميات */
function commitBatch(d, done) {
  var r = rec(d.rec), nb = E.recordBatch(S, { date: d.date || today(), dish: d.dish || r.name, recipeId: r.id, pots: d.pots, kind: d.kind, instId: d.inst, lines: batchLinesOut(dLines()) });
  var p0 = d.planId && E.by(S.plans || [], d.planId); if (p0) { p0.done = true; if (p0.dist && d.kind === 'private') { nb.dist = Object.assign({}, p0.dist); nb.distPlan = true; if (p0.distTot) nb.distTot = true; } }
  nb.portions = Number(d.portions) || 0; nb.done = done !== false; applyPricing(nb, d);
  return nb;
}

/* ---------- تأكيد الكميات الفعلية ---------- */
function unconfDay() { return S.batches.filter(function (b) { return b.done === false && !b.void && b.date === today(); }); }
function unconfAll() { return S.batches.filter(function (b) { return b.done === false && !b.void; }); }
function doConfirmBatch(id) {
  var b = E.by(S.batches, id); b.done = true; b.confirmedOn = today(); audit('تأكيد كميات «' + batchName(b) + '»');
  shut(); mutated('أُكّدت كميات «' + batchName(b) + '»', function () { b.done = false; delete b.confirmedOn; mutated('أُلغي التأكيد'); });
}
/* بدء سريع لطبخة مخططة بالوصفة كما هي: تُخصم المواد وتنتظر تأكيد الكميات الفعلية */
function quickStartPlan(p) {
  if (isClosed()) { openSh({ t: 'locked', what: 'batch' }); return; }
  var r = rec(p.recipeId), d = draftFromPlan(p, newDraft(p.kind || 'private', !!p.init)), prev = A.draft, nb; d.date = today(); d.step = 3; A.draft = d;
  try { nb = commitBatch(d, false); } finally { A.draft = prev; }
  shut(); setState({ page: 'main', tab: 'kitchen', kk: d.kind, draft: null });
  mutated('بدأت «' + r.name + '» بكميات الوصفة وتنتظر تأكيدك', function () { E.voidBatch(S, nb.id, today()); var p1 = E.by(S.plans || [], p.id); if (p1) delete p1.done; mutated('أُلغيت الطبخة وأُعيدت المواد'); });
}

/* ---------- نسخة الشيف (بلا أسعار): مستند واحد لكل الحالات (مخططة، قيد الإعداد، مسجّلة) نصًّا وصورة، بخيارات الأقسام والطبخات ---------- */
function chefRow(it, qty, pots, fixed, rm) {
  var pk = packFull(it, qty), neg = rm < -0.0001;
  return { id: it.id, q: qty, rmv: rm, name: it.name, tot: qtyU(qty, it.unit), pack: pk, per: pots > 1 && !fixed ? perTxt(qty, pots, it.unit) : '', rem: (neg ? '−' : '') + qtyU(Math.abs(rm), it.unit), neg: neg, rpack: packFull(it, Math.abs(rm)) };
}
function chefSpecPlan(p) {
  var r = rec(p.recipeId), sc = E.scaleRecipe(r, p.pots, p), af = planAfter(p);
  return { name: r.name, date: p.date, pots: p.pots, r: r, rows: spiceLast(sc).map(function (l) { return chefRow(item(l.item), l.qty, p.pots, l.fixed, af[l.item] != null ? af[l.item] : 0); }),
    dist: (p.kind || 'private') === 'private' && p.dist ? Object.keys(p.dist).filter(function (k) { return p.dist[k] > 0; }).map(function (k) { return [benName(k), p.dist[k]]; }) : [] };
}
/* b: طبخة مسجّلة أو مسوّدة {dish, rec, pots, date, lines, dist}؛ saved=false تعني أن المواد لم تُخصم بعد */
function chefSpecBatch(b, saved) {
  var rid = b.recipe || b.rec, r = rec(rid), fx = {}; if (r) r.lines.forEach(function (l) { if (l.fixed) fx[l.item] = 1; });
  var rows = spiceLast(b.lines.filter(function (l) { return l.qty > 0; })).map(function (l) {
    var order = b.order || E.planOrder(S, b.kind || 'private', b.inst || b.instId), sim = poolSim();
    if (!((b.fill && b.fill[l.item]) || (l.src && Object.keys(l.src).filter(function (k) { return k !== 'mkt'; }).length > 1))) order = order.slice(0, 1); /* المتبقي من مخزنه وحده ما لم تُسحب المادة من مخزنين باختيارك */
    if (saved === false) poolTake(sim, order, l.item, l.qty);
    return chefRow(item(l.item), l.qty, b.pots || 0, fx[l.item], poolLeft(sim, order, l.item));
  });
  return { name: batchName(b), date: b.date, pots: b.pots || 0, r: r, rows: rows, dist: b.kind === 'external' || !b.dist ? [] : Object.keys(b.dist).filter(function (k) { return b.dist[k] > 0; }).map(function (k) { return [benName(k), b.dist[k]]; }) };
}
function chefHead(sp) { return sp.sub || (pl(sp.pots, 'قدر واحد', 'قدران', 'قدور') + ' · ' + dlabel(sp.date)); }
function chefSpecRec(r) { return { name: r.name, sub: 'الكميات لقدر واحد', pots: 1, r: r, noRem: true, dist: [], rows: spiceLast(r.lines).map(function (l) { var w = chefRow(item(l.item), l.per, 1, true, 0); w.tot = qtyU(l.per, item(l.item).unit); w.pack = ''; w.note = (l.fixed ? 'ثابتة للطبخة' : '') + (l.fixed && l.note ? ' · ' : '') + (l.note || ''); return w; }) }; }

/* تركيب المستند من طبخة أو أكثر. o: {merge: مكوّنات مدموجة، mats/dist/notes: false لإخفاء القسم}. المخرج كتل: mats وdist وnotes */
function chefCompose(specs, o) {
  o = o || {}; var multi = specs.length > 1, merge = !!o.merge && multi, blocks = [], first = specs[0], potsT = function (n) { return pl(n, 'قدر واحد', 'قدران', 'قدور'); };
  var dates = specs.map(function (x) { return x.date; }).filter(function (d, i, a) { return d && a.indexOf(d) === i; });
  var doc = { name: specs.map(function (x) { return x.name; }).join(' + '), date: dates.length === 1 ? dates[0] : '', blocks: blocks, noRem: !!first.noRem };
  doc.sub = multi ? specs.map(function (x) { return potsT(x.pots); }).join(' + ') + (dates.length ? ' · ' + dates.map(dlabel).join('، ') : '') : (first.sub || chefHead(first));
  if (o.mats !== false) {
    if (merge) {
      var by = {}, ord = [];
      specs.forEach(function (x) { x.rows.forEach(function (w) { if (!by[w.id]) { by[w.id] = { id: w.id, q: 0 }; ord.push(by[w.id]); } by[w.id].q = r3(by[w.id].q + w.q); by[w.id].rmv = w.rmv; }); });
      blocks.push({ t: 'mats', title: 'المكوّنات مدموجة لكل الطبخات', noRem: false, noPer: true, rows: spiceLast(ord, function (z) { return z.id; }).map(function (z) { return chefRow(item(z.id), z.q, 0, false, z.rmv); }) });
    } else specs.forEach(function (x) { blocks.push({ t: 'mats', title: multi ? x.name + ' · ' + potsT(x.pots) : '', noRem: !!x.noRem, rows: x.rows }); });
  }
  if (o.dist !== false) {
    var dm = {}, dord = [];
    specs.forEach(function (x) { (x.dist || []).forEach(function (d) { if (!dm[d[0]]) { dm[d[0]] = { name: d[0], tot: 0, t: [] }; dord.push(dm[d[0]]); } dm[d[0]].tot = r2(dm[d[0]].tot + d[1]); dm[d[0]].t.push([x.name, d[1]]); }); });
    if (dord.length) blocks.push({ t: 'dist', title: 'التوزيع على المخيمات', total: potsT(r2(dord.reduce(function (a, g) { return a + g.tot; }, 0))), rows: dord.map(function (g) { return { name: g.name, n: potsT(g.tot), types: multi ? (g.t.length > 1 ? g.t.map(function (z) { return z[0] + ' ' + fmt(z[1]); }).join(' · ') : g.t[0][0]) : '' }; }) });
  }
  if (o.notes !== false) {
    var nl = [];
    specs.forEach(function (x) { var r = x.r, pre = multi ? x.name + ': ' : ''; if (r && r.water) nl.push(pre + 'الماء: ' + r.water + ' لترًا لكل قدر' + (r.wnote ? ' (' + r.wnote + ')' : '')); if (r && r.note) nl.push(pre + r.note); });
    if (nl.length) blocks.push({ t: 'notes', lines: nl });
  }
  return doc;
}
function chefDoc(sp) { return sp.blocks ? sp : chefCompose([sp]); }
function chefText(sp0) {
  var sp = chefDoc(sp0), L = [sp.name + ' — ' + sp.sub];
  sp.blocks.forEach(function (bk) {
    L.push('');
    if (bk.t === 'mats') {
      L.push((bk.title || 'المكوّنات') + ':');
      bk.rows.forEach(function (w) { if (bk.noRem) { L.push('• ' + w.name + ': ' + w.tot + (w.note ? ' — ' + w.note : '')); return; } L.push('• ' + w.name + ': ' + (w.per ? 'للقدر ' + w.per + ' — ' : '') + 'الإجمالي ' + w.tot + (w.pack ? ' (' + w.pack + ')' : '') + ' — المتبقي ' + w.rem + (w.rpack ? ' (' + w.rpack + ')' : '')); });
    } else if (bk.t === 'dist') {
      L.push(bk.title + ':'); bk.rows.forEach(function (d) { L.push('• ' + d.name + ' ' + d.n + (d.types ? ' — ' + d.types : '')); }); L.push('الإجمالي ' + bk.total);
    } else L.push(bk.lines.join('\n\n'));
  });
  return L.join('\n');
}
function chefCanvas(sp0) {
  var sp = chefDoc(sp0), W = 840, PAD = 36, F = "'IBM Plex Sans Arabic', sans-serif", RH = 60, hdr = 130, GAP = 14, i;
  var hOf = function (bk) {
    if (bk.t === 'mats') return (bk.title ? 58 : 0) + 56 + bk.rows.length * RH + GAP;
    if (bk.t === 'dist') return 60 + bk.rows.reduce(function (a, d) { return a + (d.types ? 74 : 54); }, 0) + 60 + GAP;
    return 14 + bk.lines.length * 46 + GAP;
  };
  var H = hdr + 16 + sp.blocks.reduce(function (a, bk) { return a + hOf(bk); }, 0) + 24;
  var c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d'); x.direction = 'rtl';
  var fit = function (t, w, px, wt) { var z = px; x.font = wt + ' ' + z + 'px ' + F; while (z > 24 && x.measureText(t).width > w) { z -= 2; x.font = wt + ' ' + z + 'px ' + F; } };
  x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, W, H); x.fillStyle = '#14563A'; x.fillRect(0, 0, W, hdr);
  x.fillStyle = 'rgba(255,255,255,.8)'; x.textAlign = 'left'; x.font = '500 22px ' + F; x.fillText('الشيف', PAD, 36); /* هوية الورقة في الزاوية (لمن هي) لا ملاحظة في أسفلها */
  x.fillStyle = '#FFFFFF'; x.textAlign = 'right'; fit(sp.name, W - 2 * PAD, 40, 700); x.fillText(sp.name, W - PAD, 62);
  fit(sp.sub, W - 2 * PAD, 25, 500); x.fillText(sp.sub, W - PAD, 104);
  var y = hdr + 16;
  sp.blocks.forEach(function (bk) {
    var top = y;
    if (bk.t === 'mats') {
      if (bk.title) { x.fillStyle = '#14563A'; x.textAlign = 'right'; fit(bk.title, W - 2 * PAD, 30, 700); x.fillText(bk.title, W - PAD, top + 38); top += 58; }
      var yy = top + 40; x.fillStyle = '#5B6660'; x.font = '600 22px ' + F;
      x.textAlign = 'right'; x.fillText('الصنف', W - PAD, yy); if (bk.noRem) { x.textAlign = 'center'; x.fillText('الكمية', W * 0.4, yy); } else { x.textAlign = 'center'; if (!bk.noPer) x.fillText('للقدر', W * 0.56, yy); x.fillText('الإجمالي', W * 0.36, yy); x.textAlign = 'left'; x.fillText('المتبقي', PAD, yy); } yy += 16;
      bk.rows.forEach(function (rw, k) {
        if (k % 2 === 0) { x.fillStyle = '#F4F6F2'; x.fillRect(0, yy, W, RH); }
        x.fillStyle = '#1B2421'; x.textAlign = 'right'; x.font = '700 28px ' + F; x.fillText(rw.name, W - PAD, yy + 38);
        if (bk.noRem) { x.textAlign = 'center'; x.font = '700 26px ' + F; x.fillText(rw.tot, W * 0.4, yy + 38); if (rw.note) { x.textAlign = 'left'; x.fillStyle = '#5B6660'; x.font = '500 21px ' + F; x.fillText(rw.note, PAD, yy + 38); } yy += RH; return; }
        x.textAlign = 'center'; x.font = '600 25px ' + F; x.fillText(rw.tot, W * 0.36, yy + (rw.pack ? 30 : 38)); if (rw.pack) { x.fillStyle = '#5B6660'; x.font = '500 19px ' + F; x.fillText(rw.pack, W * 0.36, yy + 52); }
        x.fillStyle = '#5B6660'; x.font = '500 23px ' + F; x.fillText(rw.per, W * 0.56, yy + 38);
        x.textAlign = 'left'; x.fillStyle = rw.neg ? '#B3261E' : '#14563A'; x.font = '700 25px ' + F; x.fillText(rw.rem, PAD, yy + (rw.rpack ? 30 : 38)); if (rw.rpack) { x.font = '500 19px ' + F; x.fillText(rw.rpack, PAD, yy + 52); } yy += RH;
      });
    } else if (bk.t === 'dist') {
      var dy = top + 46; x.fillStyle = '#14563A'; x.textAlign = 'right'; x.font = '700 30px ' + F; x.fillText(bk.title, W - PAD, dy); dy += 14;
      bk.rows.forEach(function (d, k) {
        var h = d.types ? 74 : 54; if (k % 2 === 0) { x.fillStyle = '#F4F6F2'; x.fillRect(0, dy, W, h); }
        x.fillStyle = '#1B2421'; x.textAlign = 'right'; x.font = '700 27px ' + F; x.fillText(d.name, W - PAD, dy + (d.types ? 32 : 37));
        x.textAlign = 'left'; x.fillStyle = '#14563A'; x.font = '700 27px ' + F; x.fillText(d.n, PAD, dy + (d.types ? 32 : 37));
        if (d.types) { x.textAlign = 'right'; x.fillStyle = '#5B6660'; fit(d.types, W - 2 * PAD, 22, 500); x.fillText(d.types, W - PAD, dy + 62); }
        dy += h;
      });
      x.fillStyle = '#14563A'; x.fillRect(PAD, dy + 4, W - 2 * PAD, 2); x.textAlign = 'right'; x.fillStyle = '#1B2421'; x.font = '700 27px ' + F; x.fillText('الإجمالي', W - PAD, dy + 44); x.textAlign = 'left'; x.fillStyle = '#14563A'; x.fillText(bk.total, PAD, dy + 44);
    } else {
      bk.lines.forEach(function (n, k) { x.fillStyle = '#46504B'; x.textAlign = 'right'; x.font = '500 24px ' + F; x.fillText(n.length > 48 ? n.slice(0, 47) + '…' : n, W - PAD, top + 34 + k * 46); });
    }
    y += hOf(bk);
  });
  return c;
}
function shareChef(sp) { imgPreview(function () { return chefCanvas(sp); }, fnName(['الشيف', sp.name, sp.date || ''], 'png'), sp.name + ' — ' + (sp.sub || dlabel(sp.date))); }
/* حفظ نسخة الشيف عندك: صورة أو PDF (تُسلَّم كملف تحفظه أو تشاركه) أو نسخ النص */
function saveChef(sp, how) {
  if (how === 'txt') { copyText(chefText(sp), 'نُسخ نص نسخة الشيف'); return; }
  if (how === 'png') { shareChef(sp); return; }
  say('جارٍ تجهيز الملف…');
  var go = function () {
    try {
      var c = chefCanvas(sp), nm = fnName(['الشيف', sp.name, sp.date || ''], '');
      var pr = how === 'pdf' ? saveFile(nm + '.pdf', u8b64(pdfFromCanvas(c)), 'application/pdf', sp.name) : saveFile(nm + '.png', c.toDataURL('image/png').split(',')[1], 'image/png', sp.name);
      pr.then(function (r) { say(savedMsg(r, how === 'pdf' ? 'ملف PDF' : 'الصورة')); }).catch(function (e) { if (!(e && /cancel|dismiss/i.test(String(e.message || e)))) say('تعذّر تجهيز الملف'); });
    } catch (e) { say('تعذّر تجهيز الملف'); }
  };
  if (document.fonts && document.fonts.load) document.fonts.load("700 28px 'IBM Plex Sans Arabic'").then(go, go); else go();
}
function shareChefRec(r) { shareChef(chefSpecRec(r)); }

/* نافذة خيارات نسخة الشيف: أي الطبخات (طبخات اليوم نفسه)، المكوّنات منفصلة أو مدموجة، وأي الأقسام تُضمَّن */
function chefGroup(src) {
  var potsT = function (n) { return pl(n, 'قدر واحد', 'قدران', 'قدور'); };
  if (src.k === 'plan') {
    var p0 = E.by(S.plans, src.id), g = plans().filter(function (q) { return q.date === p0.date; });
    if (!g.some(function (q) { return q.id === p0.id; })) g.push(p0);
    return g.map(function (q) { return { key: q.id, label: rec(q.recipeId).name + ' · ' + potsT(q.pots), self: q.id === p0.id, spec: function () { return chefSpecPlan(q); } }; });
  }
  if (src.k === 'batch') {
    var b0 = E.by(S.batches, src.id), gb = S.batches.filter(function (b) { return !b.void && b.date === b0.date; });
    if (!gb.some(function (b) { return b.id === b0.id; })) gb.push(b0);
    return gb.map(function (b) { return { key: b.id, label: batchName(b) + ' · ' + potsT(b.pots || 0), self: b.id === b0.id, spec: function () { return chefSpecBatch(b, true); } }; });
  }
  return [{ key: 'd', label: src.label || '', self: true, spec: src.spec }];
}
function chefOpen(src) {
  var f = { cmode: 'sep', cs_mats: '1', cs_dist: '1', cs_notes: '1' };
  chefGroup(src).forEach(function (g) { f['cb_' + g.key] = g.self ? '1' : ''; });
  openSh({ t: 'chefOpt', src: src }, f);
}
function chefMulti(k, label, opts, hint) {
  return { label: label, hint: hint || '', hasHint: !!hint, isText: false, isChips: true, value: '', ph: '', mode: 'text', onInput: noop,
    chips: opts.map(function (o) { var on = fv(o[0]) === '1'; return X({ label: o[1], on: on, go: function () { fset(o[0], on ? '' : '1'); } }); }) };
}
function chefOptSheet(sh) {
  var grp = chefGroup(sh.src), sel = grp.filter(function (g) { return fv('cb_' + g.key) === '1'; }), multi = grp.length > 1, many = sel.length > 1, fl = [];
  if (multi) fl.push(chefMulti('cb', 'الطبخات في النسخة', grp.map(function (g) { return ['cb_' + g.key, g.label]; })));
  if (many) fl.push(fChips('cmode', 'المكوّنات', [['sep', 'منفصلة لكل طبخة'], ['merge', 'مدموجة معًا']]));
  fl.push(chefMulti('cs', 'الأقسام', [['cs_mats', 'المكوّنات'], ['cs_dist', 'التوزيع'], ['cs_notes', 'الماء والملاحظات']]));
  var ok = sel.length > 0 && (fv('cs_mats') === '1' || fv('cs_dist') === '1' || fv('cs_notes') === '1');
  var make = function () { return chefCompose(sel.map(function (g) { return g.spec(); }), { merge: many && fv('cmode') === 'merge', mats: fv('cs_mats') === '1', dist: fv('cs_dist') === '1', notes: fv('cs_notes') === '1' }); };
  return { title: 'نسخة للشيف', sub: multi ? 'اختر ما يصل الشيف' : 'اختر الأقسام التي تصل الشيف', fields: fl,
    note: !sel.length ? { text: 'اختر طبخة واحدة على الأقل.', tone: 'warn' } : !ok ? { text: 'اختر قسمًا واحدًا على الأقل.', tone: 'warn' } : null,
    acts: [X({ title: 'تنزيل صورة', icon: 'i-download', go: function () { if (ok) saveChef(make(), 'png'); } }), X({ title: 'تنزيل PDF', icon: 'i-download', go: function () { if (ok) saveChef(make(), 'pdf'); } }), X({ title: 'نسخ النص', icon: 'i-list', go: function () { if (ok) saveChef(make(), 'txt'); } })],
    ft: { label: 'مشاركة', ok: ok, go: function () { var d = make(); shut(); shareChef(d); } } };
}
function shareChefBatch(b, saved) { if (saved === false) chefOpen({ k: 'draft', label: batchName(b), spec: function () { return chefSpecBatch(b, false); } }); else chefOpen({ k: 'batch', id: b.id }); }
function shareChefPlan(p) { chefOpen({ k: 'plan', id: p.id }); }

/* ---------- نافذة بند التكلفة ---------- */
function doXline(idx) {
  var d = A.draft, k = (fv('kNew') || '').trim() || fv('k'), xl = (d.xl || []).slice(), e = { k: k, amt: num('amt'), note: (fv('note') || '').trim() };
  if (idx != null) xl[idx] = e; else xl.push(e);
  S.xkinds = xkinds().slice(); if (S.xkinds.indexOf(k) < 0) S.xkinds.push(k);
  A.draft = Object.assign({}, d, { xl: xl }); save(); shut(); say(idx != null ? 'حُفظ البند' : 'أُضيف البند «' + k + '»');
}
function doDelX(idx) { var d = A.draft, xl = (d.xl || []).slice(); xl.splice(idx, 1); A.draft = Object.assign({}, d, { xl: xl }); shut(); say('حُذف البند'); }
function batchxSheet(sh) {
  switch (sh.t) {
    case 'chefOpt': return chefOptSheet(sh);
    case 'xline': {
      var xi = sh.idx, xk = (fv('kNew') || '').trim() || fv('k'), xa = num('amt');
      return { title: xi != null ? 'تعديل بند' : 'بند تكلفة إضافي', sub: 'يُضاف إلى تكلفة الطبخة وحساب الجهة', fields: [
          fChips('k', 'نوع البند', xkinds().map(function (t) { return [t, t]; })),
          fText('kNew', 'أو نوع جديد', 'مثال: تغليف'),
          fText('amt', 'المبلغ (₪)', '0', 'decimal'),
          fText('note', 'البيان (اختياري)', 'مثال: يومان × 3 عمال')
        ], ft: { label: xi != null ? 'حفظ البند' : 'إضافة البند', ok: !!xk && xa > 0, go: function () { doXline(xi); } },
        ft2: xi != null ? { label: 'حذف البند', go: function () { doDelX(xi); } } : null };
    }
  }
  return null;
}

/* ===== 02c-cal.js ===== */
/* ---------- التقويم والتنبيهات: مواعيد ودفعات ومهام وأحداث، مع إشعارات تُجدوَل على الجهاز ---------- */
var CAL_DN = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'], CAL_MN = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
function cBase() { var d = new Date(); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); }
function cDate(off) { return new Date(cBase() + off * 864e5); }
function cDow(off) { return cDate(off).getUTCDay(); } function cDay(off) { return cDate(off).getUTCDate(); } function cMon(off) { return cDate(off).getUTCMonth(); }
function cOff(y, m, d) { return Math.round((Date.UTC(y, m, d) - cBase()) / 864e5); }
function cIso(off) { var d = cDate(off), m = d.getUTCMonth() + 1, dd = d.getUTCDate(); return d.getUTCFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd; }
function cFromIso(s) { var p = String(s).split('-'); return cOff(+p[0], +p[1] - 1, +p[2]); }
function cAddM(off, k) { var dt = cDate(off), y = dt.getUTCFullYear(), m = dt.getUTCMonth() + k, d = dt.getUTCDate(), dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); return cOff(y, m, Math.min(d, dim)); }
function cLabel(off) { return off === 0 ? 'اليوم' : off === 1 ? 'غدًا' : off === -1 ? 'أمس' : CAL_DN[cDow(off)] + ' ' + cDay(off) + '/' + (cMon(off) + 1); }
function cTime(t) { if (!t) return ''; var p = t.split(':'), h = +p[0]; return (h % 12 || 12) + ':' + p[1] + ' ' + (h >= 12 ? 'م' : 'ص'); }
function cShift(off, t, mins) { var m = +t.split(':')[0] * 60 + +t.split(':')[1] + mins, d = Math.floor(m / 1440); m = ((m % 1440) + 1440) % 1440; return { off: off + d, t: ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2) }; }
function parseTime(txt) { var m = String(txt || '').replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 1632); }).match(/^\s*(\d{1,2})(?:[:.](\d{2}))?\s*$/); if (!m) return null; var h = +m[1], mi = m[2] ? +m[2] : 0; if (h > 23 || mi > 59) return null; return ('0' + h).slice(-2) + ':' + ('0' + mi).slice(-2); }
function parseDate(txt) {
  var iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(txt || '').trim()); if (iso) return cOff(+iso[1], +iso[2] - 1, +iso[3]);
  var m = String(txt || '').replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 1632); }).match(/^\s*(\d{1,2})\s*[\/\-\.]\s*(\d{1,2})\s*$/); if (!m) return null;
  var d = +m[1], mo = +m[2]; if (mo < 1 || mo > 12 || d < 1 || d > 31) return null; var y = new Date().getFullYear(), o = cOff(y, mo - 1, d); if (o < 0) o = cOff(y + 1, mo - 1, d); return o;
}
/* تاريخ «يوم/شهر» الأقرب: خلال آخر 45 يومًا يُعدّ ماضيًا، وغير ذلك القادم. يرجع yyyy-mm-dd أو null */
function dateNear(txt) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(txt || '').trim())) return String(txt).trim();
  var m = String(txt || '').replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 1632); }).match(/^\s*(\d{1,2})\s*[\/\-\.]\s*(\d{1,2})\s*$/); if (!m) return null;
  var d = +m[1], mo = +m[2]; if (mo < 1 || mo > 12 || d < 1 || d > 31) return null; var y = new Date().getFullYear(), o = cOff(y, mo - 1, d); if (o < -45) o = cOff(y + 1, mo - 1, d); return cIso(o);
}
function calS() {
  if (!S.cal) S.cal = { set: { on: true, sum: '07:30', defT: '08:00' }, done: {}, ev: [], rules: [
    { id: 'r_pay', name: 'تصفية حسابات العمال', per: 'w', dow: 4, dom: 1, t: '10:00', on: true, go: 'workers' }, { id: 'r_stk', name: 'جرد المخزن', per: 'w', dow: 6, dom: 1, t: '09:00', on: true, go: 'stock' },
    { id: 'r_ast', name: 'جرد الموجودات', per: 'm', dow: 0, dom: 1, t: '09:00', on: true, go: 'assets' }, { id: 'r_fund', name: 'مراجعة الأرصدة', per: 'm', dow: 0, dom: 28, t: '10:00', on: false, go: 'funds' }] };
  return S.cal;
}
function calOccs(from, to) {
  var C = calS(), out = [];
  C.ev.forEach(function (e) {
    if (e.arch) return; var offs = [], k, o, e0 = cFromIso(e.date);
    if (!e.rep) offs = [e0]; else for (k = 0; k < 500; k++) { o = e.rep === 'd' ? e0 + k : e.rep === 'w' ? e0 + 7 * k : cAddM(e0, k); if (o > to) break; offs.push(o); }
    offs.forEach(function (o2) { if (o2 >= from && o2 <= to) out.push({ key: e.id + '@' + o2, e: e, off: o2, t: e.t || '', done: (e.doneOn || []).indexOf(cIso(o2)) >= 0, auto: false }); });
  });
  C.rules.forEach(function (r) {
    if (!r.on) return;
    for (var o = from; o <= to; o++) if (r.per === 'w' ? cDow(o) === r.dow : cDay(o) === r.dom) out.push({ key: r.id + '@' + o, e: { id: r.id, title: r.name, kind: 'auto', t: r.t, rem: 'at', who: 'p1', go: r.go, rep: r.per }, off: o, t: r.t, done: !!C.done[r.id + '@' + cIso(o)], auto: true });
  });
  /* تذكير تلقائي بالتوريد القادم المجدول (بدل أن يُكتب يدويًا): في يوم وصوله، ولا يمسّ المخزن */
  try { supSched().forEach(function (d) { if (d.hold) return; var o = cFromIso(d.date); if (o >= from && o <= to) out.push({ key: 'sup_' + d.id + '@' + o, e: { id: 'sup_' + d.id, title: 'توريد: ' + supTitle(d), kind: 'auto', t: C.set.defT, rem: 'at', who: 'p1', go: 'supply', sid: d.id, rep: '' }, off: o, t: C.set.defT, done: !!C.done['sup_' + d.id + '@' + cIso(o)], auto: true }); }); } catch (er) {}
  out.sort(function (a, b) { return (a.off - b.off) || String(a.t || '99').localeCompare(String(b.t || '99')); });
  return out;
}
function calFires(e, off) {
  var t0 = e.t || calS().set.defT, r = e.rem || 'at', out = [], f; if (r === 'none') return [];
  var add = function (o, t) { out.push(cLabel(o) + ' · ' + cTime(t)); };
  if (r === '1d' || r === '1d+at') add(off - 1, t0); if (r === '1h') { f = cShift(off, t0, -60); add(f.off, f.t); } if (r === 'at' || r === '1d+at') add(off, t0);
  return out;
}
function calKindIc(k) { return { pay: 'i-wallet', order: 'i-truck', task: 'i-check', auto: 'i-calendar', event: 'i-book' }[k] || 'i-clock'; }
function calQa(o) {
  var e = o.e, a = [];
  if (e.kind !== 'event') a.push([o.done ? 'إلغاء علامة تمّ' : 'تمّ', 'i-check', function () { shut(); doEvDone(o.key, o.done); }]);
  if (e.kind !== 'event' && !o.done) a.push(['تأجيل', 'i-clock', function () { openSh({ t: 'calSnz', key: o.key }); }]);
  if (!o.auto) a.push([e.kind === 'event' ? 'تعديل الحدث' : 'تعديل الموعد', 'i-pencil', function () { openSh({ t: 'calEdit', id: e.id }, calForm(e)); }]);
  a.push(['فتح التفاصيل', 'i-book', function () { openSh({ t: 'calEv', key: o.key }); }]);
  qa(e.title, o.t ? cTime(o.t) : 'طوال اليوم', a);
}
function calRow(o) {
  var e = o.e, sub = [o.t ? cTime(o.t) : 'طوال اليوم']; if (e.party) sub.push(e.party); if (e.rep) sub.push('يتكرر'); if (o.auto) sub.push('تلقائي');
  if (e.kind === 'event') return X({ icon: 'i-book', icTone: o.off < 0 ? 'mute' : 'info', title: e.title, sub: sub.join(' · '), tag: o.off < 0 ? 'جرى' : o.off === 0 ? 'اليوم' : 'قادم', tagTone: o.off < 0 ? 'mute' : 'info', chev: true, go: function () { openSh({ t: 'calEv', key: o.key }); }, lp: function () { calQa(o); } });
  var late = !o.done && o.off < 0, tg = o.done ? ['تمّ', 'ok'] : late ? ['متأخر', 'bad'] : e.kind === 'pay' && e.amt ? [money(e.amt) + (e.dir === 'in' ? ' لنا' : ' علينا'), e.dir === 'in' ? 'ok' : 'warn'] : o.off === 0 ? ['اليوم', 'info'] : ['', 'mute'];
  return X({ icon: calKindIc(e.kind), icTone: o.done ? 'ok' : late ? 'bad' : e.kind === 'pay' ? 'warn' : 'info', title: e.title, sub: sub.join(' · '), tag: tg[0], tagTone: tg[1], chev: true, go: function () { openSh({ t: 'calEv', key: o.key }); }, lp: function () { calQa(o); } });
}
function calToday() {
  var oc = calOccs(-45, 0).filter(function (o) { return o.e.kind !== 'event' && (!o.done && !o.auto || (o.auto && !o.done && o.off === 0)); }), late = oc.filter(function (o) { return o.off < 0; }), td = oc.filter(function (o) { return o.off === 0; });
  return { n: late.length + td.length, late: late.length, today: td.length, titles: late.concat(td).slice(0, 2).map(function (o) { return o.e.title; }).join('، ') };
}
function calSummary() { var c = calToday(), up = calOccs(1, 7).filter(function (o) { return !o.auto && o.e.kind !== 'event'; }).length; return (c.n ? c.today + ' اليوم' + (c.late ? ' · ' + c.late + ' متأخر' : '') : 'لا مواعيد اليوم') + ' · ' + up + ' خلال أسبوع'; }

function pgCal() {
  var s = A, C = calS(), bl = [], cm = s.cm || 0, isT = function (o) { return o.e.kind !== 'event'; }, agenda = s.cv === 'a';
  var late = calOccs(-45, -1).filter(function (o) { return !o.done && !o.auto && isT(o); }), wk = calOccs(0, 6).filter(function (o) { return !o.done && isT(o); }), td = calOccs(0, 0).filter(function (o) { return !o.done && isT(o); });
  if (!C.set.on) bl.push(B('note', { tone: 'warn', icon: 'i-alert', text: 'التنبيهات متوقفة: ستبقى المواعيد هنا لكن بلا إشعارات. فعّلها من «التنبيهات».', act: 'التنبيهات', actGo: function () { openSh({ t: 'calNotif' }, {}); } }));
  bl.push(B('seg', { items: [['t', 'المهام والدفعات'], ['a', 'الأجندة']].map(function (a) { return X({ label: a[1], on: (s.cv || 't') === a[0], go: function () { setState({ cv: a[0], cd: null }); } }); }) }));
  if (!agenda) bl.push(B('kpi', { items: [X({ label: 'اليوم', value: td.length, sub: 'لم تُنجز', go: function () { openSh({ t: 'kCal', k: 't' }); } }), X({ label: '7 أيام', value: wk.length, sub: 'قادمة', go: function () { openSh({ t: 'kCal', k: 'w' }); } }), X({ label: 'متأخرة', value: late.length, sub: late.length ? 'تحتاج إنجازًا' : 'لا شيء', endTone: late.length ? 'bad' : 'ok', go: function () { openSh({ t: 'kCal', k: 'l' }); } })] }));
  else { var evs = function (a, b) { return calOccs(a, b).filter(function (o) { return o.e.kind === 'event'; }); }; bl.push(B('kpi', { items: [X({ label: 'قادمة', value: evs(0, 30).length, sub: 'خلال 30 يومًا', go: function () { openSh({ t: 'kCal', k: 'ea' }); } }), X({ label: 'اليوم', value: evs(0, 0).length, sub: 'أحداث', go: function () { openSh({ t: 'kCal', k: 'et' }); } }), X({ label: 'جرت', value: evs(-30, -1).length, sub: 'آخر 30 يومًا', go: function () { openSh({ t: 'kCal', k: 'ep' }); } })] })); }
  var y = cDate(0).getUTCFullYear(), mo = cDate(0).getUTCMonth() + cm, ms = new Date(Date.UTC(y, mo, 1)), yy = ms.getUTCFullYear(), mm = ms.getUTCMonth();
  var o1 = cOff(yy, mm, 1), pad = (ms.getUTCDay() + 1) % 7, dim = new Date(Date.UTC(yy, mm + 1, 0)).getUTCDate(), occM = calOccs(o1, o1 + dim - 1), cells = [], i;
  for (i = 0; i < pad; i++) cells.push({ label: '', bg: 'transparent', fg: '#1B2421', bd: 'transparent', go: noop, d1: 'transparent', d2: 'transparent', d3: 'transparent' });
  for (i = 0; i < dim; i++) (function (off) {
    var dayO = occM.filter(function (o) { return o.off === off; }), isTd = off === 0, sel = s.cd === off, fri = cDow(off) === 5, dots = ['transparent', 'transparent', 'transparent'];
    dayO.slice(0, 3).forEach(function (o, j) { dots[j] = o.done ? '#9AA59F' : o.e.kind === 'event' ? '#0B6E6E' : o.off < 0 ? '#B3261E' : o.e.kind === 'pay' ? '#B26A00' : o.auto ? '#7A8A83' : '#243C8F'; });
    cells.push({ label: String(cDay(off)), bg: sel ? '#14563A' : isTd ? '#DFF1E7' : 'transparent', fg: sel ? '#fff' : fri ? '#9A4A12' : '#1B2421', bd: sel ? '#14563A' : isTd ? '#14563A' : 'transparent', go: function () { setState({ cd: sel ? null : off }); }, d1: dots[0], d2: dots[1], d3: dots[2] });
  })(o1 + i);
  bl.push(B('month', { mon: { title: CAL_MN[mm] + ' ' + yy, prev: function () { setState({ cm: cm - 1, cd: null }); }, next: function () { setState({ cm: cm + 1, cd: null }); }, head: ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'].map(function (n) { return { t: n }; }), cells: cells } }));
  bl.push(B('btns', { items: [X({ label: agenda ? 'حدث جديد' : 'موعد جديد', icon: 'i-plus', on: true, go: function () { openSh({ t: 'calAdd' }, { title: '', kind: agenda ? 'event' : 'task', dsel: s.cd != null && s.cd >= 0 && s.cd <= 6 ? String(s.cd) : '', dtxt: s.cd != null && s.cd > 6 ? cDay(s.cd) + '/' + (cMon(s.cd) + 1) : '', t: '', tNew: '', rep: '', rem: agenda ? 'none' : 'at', who: 'p1', party: '', amt: '', dir: 'out', note: '' }); } }), X({ label: 'التنبيهات', icon: 'i-sliders', go: function () { openSh({ t: 'calNotif' }, {}); } })] }));
  if (!agenda) bl.push(B('chips', { items: [['all', 'الكل'], ['pay', 'دفعات'], ['task', 'مهام'], ['auto', 'تلقائية']].map(function (a) { return X({ label: a[1], on: (s.cf || 'all') === a[0], go: function () { setState({ cf: a[0] }); } }); }) }));
  var flt = function (o) { var f = s.cf || 'all'; return f === 'all' || (f === 'pay' && o.e.kind === 'pay') || (f === 'task' && (o.e.kind === 'task' || o.e.kind === 'order')) || (f === 'auto' && o.auto); };
  if (s.cd != null) { var dl = calOccs(s.cd, s.cd).filter(function (o) { return agenda ? o.e.kind === 'event' : flt(o); }); bl.push(B('rows', { title: cLabel(s.cd) + ' (' + dl.length + ')', act: 'كل المواعيد', actGo: function () { setState({ cd: null }); }, items: dl.map(calRow), empty: 'لا شيء في هذا اليوم' })); }
  else if (agenda) {
    var up = calOccs(0, 90).filter(function (o) { return o.e.kind === 'event'; }), past = calOccs(-30, -1).filter(function (o) { return o.e.kind === 'event'; }).reverse();
    bl.push(B('rows', { title: 'قادمة (' + up.length + ')', items: up.map(calRow), empty: 'لا أحداث قادمة. سجّل زيارة أو مناسبة أو وصول شحنة.' })); bl.push(B('rows', { title: 'جرت (' + past.length + ')', items: past.map(calRow), empty: 'لا أحداث في آخر 30 يومًا' }));
  } else {
    var all = calOccs(-45, 45).filter(function (o) { return o.e.kind !== 'event' && flt(o) && (o.off >= 0 || (!o.done && !o.auto)); }), gs = [['متأخرة', function (o) { return o.off < 0; }], ['اليوم', function (o) { return o.off === 0; }], ['غدًا', function (o) { return o.off === 1; }], ['خلال أسبوع', function (o) { return o.off >= 2 && o.off <= 7; }], ['لاحقًا', function (o) { return o.off > 7; }]];
    gs.forEach(function (g) { var rs = all.filter(g[1]); if (rs.length) bl.push(B('rows', { title: g[0] + ' (' + rs.length + ')', items: rs.map(calRow) })); });
    if (!all.length) bl.push(B('rows', { items: [], empty: 'لا مواعيد. أضف دفعة أو مهمة أو موعد تسليم.' }));
  }
  return bl;
}

function calFromForm() {
  var dsel = fv('dsel'), dtxt = fv('dtxt'), off = dsel !== '' ? parseInt(dsel, 10) : (dtxt ? parseDate(dtxt) : null), tNew = fv('tNew').trim(), tp = tNew ? parseTime(tNew) : null;
  return { title: fv('title').trim(), kind: fv('kind') || 'task', off: off, t: tNew ? (tp || '') : fv('t'), tBad: !!tNew && !tp, rep: fv('rep'), rem: fv('rem') || 'at', who: fv('who') || 'p1', party: fv('party').trim(), amt: num('amt'), dir: fv('dir') || 'out', note: fv('note').trim() };
}
function calForm(e) { return { title: e.title, kind: e.kind, dsel: '', dtxt: e.date, t: e.t || '', tNew: '', rep: e.rep || '', rem: e.rem || 'at', who: e.who || 'p1', party: e.party || '', amt: e.amt ? String(e.amt) : '', dir: e.dir || 'out', note: e.note || '' }; }
function calLog(e, what) { e.log = e.log || []; e.log.unshift({ date: today(), what: what }); }
function doSaveEv(id) {
  var c = calFromForm(), C = calS(), e = id ? E.by(C.ev, id) : null;
  if (!e) { e = { id: newId('e', C.ev), doneOn: [], log: [] }; C.ev.push(e); }
  Object.assign(e, { title: c.title, kind: c.kind, date: cIso(c.off), t: c.t, rep: c.kind === 'event' ? '' : c.rep, rem: c.kind === 'event' ? 'none' : c.rem, who: c.who, party: c.kind === 'pay' ? c.party : '', amt: c.kind === 'pay' ? c.amt : 0, dir: c.kind === 'pay' ? c.dir : '', note: c.note });
  calLog(e, id ? 'تعديل' : 'إنشاء'); audit((id ? 'تعديل موعد «' : 'موعد جديد «') + c.title + '»'); save(); armCal(); setState({ sh: null, form: {}, q: '' }); say(id ? 'حُفظ التعديل' : 'حُفظ الموعد');
}
function doEvDone(key, done) {
  var C = calS(), p = key.split('@'), iso = cIso(+p[1]), e = E.by(C.ev, p[0]);
  if (e) { e.doneOn = e.doneOn || []; var i = e.doneOn.indexOf(iso); if (done && i >= 0) e.doneOn.splice(i, 1); else if (!done && i < 0) e.doneOn.push(iso); calLog(e, done ? 'أُلغيت علامة تمّ' : 'تمّ'); }
  else { if (done) delete C.done[p[0] + '@' + iso]; else C.done[p[0] + '@' + iso] = true; }
  save(); armCal(); shut(); say(done ? 'أُلغيت علامة تمّ' : 'تمّ');
}
function doSnooze(key, days) {
  var C = calS(), p = key.split('@'), e = E.by(C.ev, p[0]), off = +p[1], iso = cIso(off);
  if (e && !e.rep) { e.date = cIso(off + days); calLog(e, 'تأجيل ' + pl(days, 'يوم واحد', 'يومان', 'أيام')); }
  else { if (e) { e.doneOn = e.doneOn || []; e.doneOn.push(iso); } else C.done[p[0] + '@' + iso] = true; var src = e || { title: (C.rules.filter(function (r) { return r.id === p[0]; })[0] || {}).name, kind: 'task', t: '', rem: 'at', who: 'p1' };
    C.ev.push({ id: newId('e', C.ev), title: src.title, kind: src.kind === 'auto' ? 'task' : src.kind, date: cIso(off + days), t: src.t || '', rep: '', rem: src.rem || 'at', who: src.who || 'p1', party: src.party || '', amt: src.amt || 0, dir: src.dir || '', note: 'مؤجَّل', doneOn: [], log: [] }); }
  save(); armCal(); shut(); say('أُجّل الموعد ' + pl(days, 'يومًا واحدًا', 'يومين', 'أيام'));
}
function doEvArch(id, on) { var e = E.by(calS().ev, id); e.arch = on; calLog(e, on ? 'إيقاف' : 'استعادة'); save(); armCal(); shut(); say(on ? 'أُوقف الموعد ويمكن استعادته من «التنبيهات»' : 'استُعيد الموعد'); }
function doRule(id) {
  var r = E.by(calS().rules, id), tt = fv('rt') ? parseTime(fv('rt')) : fv('rt0');
  r.on = fv('on') === 'yes'; if (r.per === 'w') r.dow = parseInt(fv('dow'), 10); else r.dom = Math.max(1, Math.min(28, parseInt(fv('dom'), 10) || 1)); if (tt) r.t = tt;
  save(); armCal(); setState({ sh: { t: 'calNotif' }, form: {}, q: '' }); say('حُفظ');
}
function doCalSet(k, v) { calS().set[k] = v; save(); armCal(); render(); }

/* جدولة الإشعارات على الجهاز (تعمل بلا إنترنت): المواعيد القادمة 14 يومًا + الملخص الصباحي */
function armCal() {
  if (!LN()) return; var C = calS(), list = [], id = 1000, now = Date.now();
  var at = function (off, t, title, body) { var d = cDate(off), p = t.split(':'), dt = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), +p[0], +p[1], 0); if (dt.getTime() > now + 5000) list.push({ id: id++, title: title, body: body || '', schedule: { at: dt, allowWhileIdle: true } }); };
  if (C.set.on) {
    calOccs(0, 14).forEach(function (o) {
      if (o.done || o.e.rem === 'none' || o.e.kind === 'event') return; var t0 = o.t || C.set.defT, r = o.e.rem || 'at', f;
      if (r === '1d' || r === '1d+at') at(o.off - 1, t0, 'غدًا: ' + o.e.title, o.e.party || ''); if (r === '1h') { f = cShift(o.off, t0, -60); at(f.off, f.t, 'بعد ساعة: ' + o.e.title, o.e.party || ''); } if (r === 'at' || r === '1d+at') at(o.off, t0, o.e.title, o.e.party || '');
    });
    if (C.set.sum) for (var d = 0; d <= 14; d++) { var oc = calOccs(d, d).filter(function (o) { return !o.done && o.e.kind !== 'event'; }); if (oc.length) at(d, C.set.sum, 'مواعيد اليوم: ' + oc.length, oc.slice(0, 3).map(function (o) { return o.e.title; }).join('، ')); }
  }
  LN().getPending().then(function (r) { var old = (r.notifications || []).filter(function (n) { return n.id >= 1000; }); return old.length ? LN().cancel({ notifications: old.map(function (n) { return { id: n.id }; }) }) : null; })
    .then(function () { return list.length ? LN().requestPermissions().then(function (p) { if (p.display === 'granted') return LN().schedule({ notifications: list }); }) : null; }).catch(function () {});
}

function calSheet(sh) {
  var R = null, C = calS();
  switch (sh.t) {
    case 'calAdd': case 'calEdit': {
      var ced = sh.t === 'calEdit', ce = ced ? E.by(C.ev, sh.id) : null, cf = calFromForm(), fl = [], days = []; for (var di = 0; di < 7; di++) days.push([String(di), cLabel(di)]);
      fl.push(fText('title', 'العنوان', 'مثال: دفعة مؤسسة أو توصيل طلبية'));
      fl.push(fChips('kind', 'النوع', [['task', 'مهمة'], ['pay', 'دفعة'], ['order', 'تسليم'], ['event', 'حدث في الأجندة']], cf.kind === 'event' ? 'الحدث علامة على ما جرى أو سيجري: لا يحتاج تنفيذًا ولا يظهر متأخرًا.' : ''));
      if (cf.kind === 'pay') { fl.push(fText('party', 'الجهة', 'مثال: مداد الخير')); fl.push(fText('amt', 'المبلغ بالشيكل (اختياري)', '0', 'decimal')); fl.push(fSeg('dir', 'الاتجاه', [['in', 'لنا (نقبضها)', 'ok'], ['out', 'علينا (ندفعها)', 'bad']])); }
      fl.push(fDD('dsel', 'اليوم', days)); fl.push(fDate('dtxt', 'أو اختر من التقويم'));
      fl.push(fDD('t', 'الوقت', [['', 'بدون وقت'], ['08:00', '8 ص'], ['12:00', '12 ظ'], ['16:00', '4 م'], ['20:00', '8 م']])); fl.push(fTime('tNew', 'أو وقت آخر'));
      fl.push(fChips('rep', 'التكرار', [['', 'لا يتكرر'], ['d', 'يوميًا'], ['w', 'أسبوعيًا'], ['m', 'شهريًا']])); fl.push(fDD('rem', 'التنبيه', [['none', 'بلا تنبيه'], ['at', 'وقت الموعد'], ['1h', 'قبله بساعة'], ['1d', 'قبله بيوم'], ['1d+at', 'قبله بيوم وفي الوقت']]));
      fl.push(fChips('who', 'يخص', people().filter(function (p) { return p.preset !== 'observer' && p.preset !== 'worker'; }).map(function (p) { return [p.id, p.name]; }))); fl.push(fText('note', 'ملاحظة (اختياري)', ''));
      var cfr = cf.off != null ? calFires({ t: cf.t, rem: cf.rem }, cf.off) : [];
      R = { tone: cf.kind === 'pay' ? (fv('dir') === 'in' ? 'in' : fv('dir') === 'out' ? 'out' : '') : '', toneTag: fv('dir') === 'in' ? 'لنا' : 'علينا', title: ced ? (cf.kind === 'event' ? 'تعديل الحدث' : 'تعديل الموعد') : cf.kind === 'event' ? 'حدث جديد' : 'موعد جديد', sub: cf.kind === 'event' ? 'علامة في الأجندة' : 'يُنبّه الشخص المختار على جهازه', fields: fl,
        note: { text: cf.off == null ? 'اختر اليوم لترى متى يصلك التنبيه' : cfr.length ? 'يصلك التنبيه: ' + cfr.join(' ، ') : 'بلا تنبيه', tone: cf.off == null ? 'info' : cfr.length ? 'ok' : 'info' },
        ft: { label: ced ? 'حفظ التعديل' : 'حفظ الموعد', ok: cf.title.length > 1 && cf.off != null && !cf.tBad && (cf.kind !== 'pay' || cf.party.length > 1), go: function () { doSaveEv(ced ? ce.id : ''); } } };
      break;
    }
    case 'calEv': {
      var co = calOccs(-45, 120).filter(function (x) { return x.key === sh.key; })[0];
      if (!co) { R = { title: 'الموعد', rows: [], empty: 'لم يعد في النطاق' }; break; }
      var cev = co.e, cr = [X({ title: 'الموعد', sub: co.t ? cTime(co.t) : 'طوال اليوم', tag: cLabel(co.off), tagTone: !co.done && co.off < 0 ? 'bad' : 'info' }),
        X({ title: 'التكرار', tag: cev.kind === 'event' ? 'لا يتكرر' : cev.rep === 'd' ? 'يوميًا' : cev.rep === 'w' ? 'أسبوعيًا' : cev.rep === 'm' ? 'شهريًا' : 'لا يتكرر', tagTone: 'mute' }), X({ title: 'التنبيه', sub: calFires(cev, co.off).join(' ، ') || 'بلا تنبيه' })];
      if (cev.kind === 'pay') { cr.push(X({ title: 'الجهة', tag: cev.party, tagTone: 'mute' })); if (cev.amt) cr.push(X({ title: cev.dir === 'in' ? 'لنا' : 'علينا', tag: money(cev.amt), tagTone: cev.dir === 'in' ? 'ok' : 'warn' })); cr.push(X({ icon: 'i-wallet', icTone: 'mute', title: 'تسجيل الدفعة نفسها', sub: 'من الأرصدة', chev: true, go: function () { open('funds'); } })); }
      if (cev.note) cr.push(X({ title: 'ملاحظة', sub: cev.note }));
      if (!co.auto) {
        var pw = E.by(people(), cev.who); cr.push(X({ title: 'يخص', tag: pw ? pw.name : '', tagTone: 'mute' }));
        cr.push(X({ icon: 'i-pencil', icTone: 'mute', title: cev.kind === 'event' ? 'تعديل الحدث' : 'تعديل الموعد', chev: true, go: function () { openSh({ t: 'calEdit', id: cev.id }, calForm(cev)); } }));
        (cev.log || []).slice(0, 4).forEach(function (l) { cr.push(X({ title: l.what, sub: dlabel(l.date) })); });
        cr.push(X({ icon: 'i-lock', icTone: 'mute', title: cev.rep ? 'إيقاف التكرار' : cev.kind === 'event' ? 'إلغاء الحدث' : 'إلغاء الموعد', sub: 'يختفي من القائمة ويُحفظ ويمكن استعادته', chev: true, go: function () { doEvArch(cev.id, true); } }));
      } else {
        cr.push(X({ icon: 'i-calendar', icTone: 'mute', title: 'موعد تلقائي', sub: 'يتولّد من «التنبيهات» ويمكن إيقافه أو تغيير يومه من هناك', chev: true, go: function () { openSh({ t: 'calNotif' }, {}); } }));
        if (cev.go) cr.push(X({ icon: 'i-doc', icTone: 'mute', title: 'فتح الصفحة المرتبطة', chev: true, go: function () { shut(); if (cev.sid) open('supply', { sid: cev.sid }); else if (cev.go === 'workers' || cev.go === 'stock') setState({ tab: cev.go, page: 'main' }); else open(cev.go); } }));
      }
      R = { title: cev.title, sub: cev.kind === 'event' ? 'حدث في الأجندة · ' + (co.off < 0 ? 'جرى' : 'قادم') : (co.done ? 'تمّ · ' : '') + (cev.kind === 'pay' ? 'موعد دفعة' : cev.kind === 'order' ? 'موعد تسليم' : co.auto ? 'تلقائي' : 'مهمة'), rows: cr,
        ft: cev.kind === 'event' ? { label: 'تعديل الحدث', ok: true, go: function () { openSh({ t: 'calEdit', id: cev.id }, calForm(cev)); } } : { label: co.done ? 'إلغاء علامة تمّ' : 'تمّ', ok: true, go: function () { doEvDone(co.key, co.done); } },
        ft2: co.done || cev.kind === 'event' ? null : { label: 'تأجيل', go: function () { openSh({ t: 'calSnz', key: co.key }); } } };
      break;
    }
    case 'calNotif': {
      var cs2 = C.set, nr = [
        X({ icon: 'i-alert', icTone: cs2.on ? 'ok' : 'warn', title: 'إشعارات التطبيق', sub: cs2.on ? 'تصل حتى والتطبيق مغلق ودون إنترنت' : 'متوقفة: لن يصلك أي تنبيه', tag: cs2.on ? 'تعمل' : 'متوقفة', tagTone: cs2.on ? 'ok' : 'warn', chev: true, go: function () { doCalSet('on', !cs2.on); } }),
        X({ icon: 'i-clock', icTone: 'info', title: 'الملخص الصباحي', sub: cs2.sum ? 'إشعار واحد الساعة ' + cTime(cs2.sum) + ' بمواعيد اليوم والمتأخرة' : 'متوقف', tag: cs2.sum ? cTime(cs2.sum) : 'متوقف', tagTone: cs2.sum ? 'info' : 'mute', chev: true, go: function () { var l = ['07:30', '08:00', '06:30', '']; doCalSet('sum', l[(l.indexOf(cs2.sum) + 1) % l.length]); } }),
        X({ icon: 'i-clock', icTone: 'mute', title: 'وقت المواعيد بلا ساعة', sub: 'ينبّه فيه إن لم تحدد وقتًا للموعد', tag: cTime(cs2.defT), tagTone: 'mute', chev: true, go: function () { var l = ['08:00', '09:00', '07:00']; doCalSet('defT', l[(l.indexOf(cs2.defT) + 1) % l.length]); } })];
      var rr = C.rules.map(function (r) { return X({ icon: 'i-calendar', icTone: r.on ? 'info' : 'mute', title: r.name, sub: (r.per === 'w' ? 'كل ' + CAL_DN[r.dow] : 'يوم ' + r.dom + ' من كل شهر') + ' · ' + cTime(r.t), tag: r.on ? 'يعمل' : 'متوقف', tagTone: r.on ? 'ok' : 'mute', chev: true, go: function () { openSh({ t: 'calRule', id: r.id }, { on: r.on ? 'yes' : 'no', dow: String(r.dow), dom: String(r.dom), rt0: r.t, rt: '' }); } }); });
      var arc = C.ev.filter(function (e) { return e.arch; }).map(function (e) { return X({ icon: 'i-lock', icTone: 'mute', title: e.title, sub: 'موقوف', tag: 'استعادة', tagTone: 'info', chev: true, go: function () { doEvArch(e.id, false); } }); });
      R = { title: 'التنبيهات', sub: 'تُجدوَل على جهازك، فلا تحتاج إنترنت', rows: nr.concat(rr).concat(arc), note: { text: 'الصفوف الأولى للإعدادات، والتالية مواعيد تلقائية تتولّد كل أسبوع أو شهر (اضغط للتعديل). المواعيد الموقوفة في الأسفل ويمكن استعادتها.', tone: 'info' } };
      break;
    }
    case 'calRule': {
      var cru = E.by(C.rules, sh.id), crf = [fChips('on', 'الحالة', [['yes', 'يعمل'], ['no', 'متوقف']])];
      if (cru.per === 'w') crf.push(fChips('dow', 'اليوم', [0, 1, 2, 3, 4, 5, 6].map(function (d) { return [String(d), CAL_DN[d]]; }))); else crf.push(fText('dom', 'يوم الشهر (1 إلى 28)', '1', 'numeric'));
      crf.push(fChips('rt0', 'الوقت', [['07:00', '7 ص'], ['09:00', '9 ص'], ['10:00', '10 ص'], ['14:00', '2 م'], ['18:00', '6 م']])); crf.push(fText('rt', 'أو وقت آخر', 'مثال: 11:30'));
      R = { title: cru.name, sub: cru.per === 'w' ? 'يتكرر أسبوعيًا' : 'يتكرر شهريًا', fields: crf, ft: { label: 'حفظ', ok: !fv('rt') || parseTime(fv('rt')) != null, go: function () { doRule(cru.id); } } };
      break;
    }
    case 'calSnz': {
      var cur = (calOccs(-45, 120).filter(function (x) { return x.key === sh.key; })[0] || { off: 0 }).off;
      R = { title: 'تأجيل الموعد', sub: 'إلى متى؟', rows: [[1, 'غدًا'], [2, 'بعد يومين'], [3, 'بعد 3 أيام'], [7, 'الأسبوع القادم']].map(function (a) { return X({ icon: 'i-clock', icTone: 'info', title: a[1], sub: cLabel(a[0] + Math.max(0, cur)), chev: true, go: function () { doSnooze(sh.key, a[0]); } }); }),
        note: { text: 'الموعد المتكرر يبقى كما هو، ويُنشأ موعد منفرد مؤجّل بدل هذه المرة فقط.', tone: 'info' } };
      break;
    }
  }
  return R;
}

/* ===== 02c2-pad.js ===== */
/* ---------- المفكرة (المالك 2026-11-25): مكان واحد للمطبخ لي وحدي: مهام بتاريخ ووقت وتذكير (فوق التقويم نفسه)، مشتريات، ملاحظات، وتذكير تلقائي بالتوريد القادم ---------- */
function padS() { if (!S.pad) S.pad = { shop: [], notes: [] }; return S.pad; }
function padShopOpen() { return padS().shop.filter(function (x) { return !x.arch; }); }
function padNotes(arch) { return padS().notes.filter(function (n) { return !!n.arch === !!arch; }).sort(function (a, b) { return (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || (b.ts || 0) - (a.ts || 0); }); }
/* الأصناف التي تحتاج شراءً (نفد/حرج) ولم تُضَف بعد إلى المشتريات: من مخازن المطبخ لا الخارجية */
function padShort() {
  var have = {}, seen = {}, out = []; padShopOpen().forEach(function (x) { have[x.t] = 1; });
  ledgers().forEach(function (l) {
    if (l.ext) return;
    itemsIn(l.id).forEach(function (it) {
      var q = E.balance(S, l.id, it.id), st = stStatus(q, it.id);
      if (alertable(l, it, q) && st.rank <= 2 && !have[it.name] && !seen[it.name]) { seen[it.name] = 1; out.push({ name: it.name, rank: st.rank, q: q, unit: it.unit }); }
    });
  });
  return out.sort(function (a, b) { return a.rank - b.rank; });
}
function padAdd(names) {
  var P = padS(), have = {}, n = 0; padShopOpen().forEach(function (x) { have[x.t] = 1; });
  names.forEach(function (t) { t = String(t || '').trim(); if (!t || have[t]) return; have[t] = 1; P.shop.push({ id: newId('s', P.shop), t: t, done: false, ts: Date.now() }); n++; });
  if (n) { save(); }
  return n;
}
function padToggle(id) { var x = E.by(padS().shop, id); if (!x) return; x.done = !x.done; save(); render('morph'); }
function padClearDone() { var n = 0; padS().shop.forEach(function (x) { if (!x.arch && x.done) { x.arch = true; n++; } }); save(); render(); say(n ? 'مُسح ' + pl(n, 'صنف واحد', 'صنفان', 'أصناف') + ' مما اشتُري' : 'لا شيء مشترى'); }
function padText() { return 'المشتريات\n' + padShopOpen().map(function (x) { return (x.done ? '✓ ' : '• ') + x.t; }).join('\n'); }
function padSaveNote(id) {
  var P = padS(), n = id ? E.by(P.notes, id) : null, t = fv('ntitle').trim(), b = fv('nbody').trim();
  if (!n) { n = { id: newId('n', P.notes), ts: Date.now() }; P.notes.push(n); }
  n.t = t; n.b = b; n.pin = fv('npin') === '1'; n.ts = Date.now(); save(); setState({ sh: null, form: {}, q: '' }); say('حُفظت الملاحظة');
}
function padArchNote(id, on) { var n = E.by(padS().notes, id); if (!n) return; n.arch = on; save(); setState({ sh: null, form: {}, q: '' }); say(on ? 'أُرشفت الملاحظة' : 'استُعيدت الملاحظة'); }
function padNoteForm(n) { return { ntitle: n ? (n.t || '') : '', nbody: n ? (n.b || '') : '', npin: n && n.pin ? '1' : '' }; }
function padNewTask() { var C = calS(); openSh({ t: 'calAdd' }, { title: '', kind: 'task', dsel: '0', dtxt: '', t: '', tNew: '', rep: '', rem: C.set.on ? 'at' : 'none', who: 'p1', party: '', amt: '', dir: 'out', note: '' }); }
function padSummary() {
  var c = calToday(), sh = padShopOpen().filter(function (x) { return !x.done; }).length, a = [];
  if (c.today) a.push(c.today + ' اليوم'); if (c.late) a.push(c.late + ' متأخر'); if (sh) a.push(sh + ' للشراء');
  return a.length ? a.join(' · ') : 'لا شيء اليوم';
}

function pgPad() {
  var bl = [], P = padS(), isT = function (o) { return o.e.kind !== 'event'; };
  var late = calOccs(-45, -1).filter(function (o) { return !o.done && !o.auto && isT(o); }), nxt = calOccs(0, 7).filter(function (o) { return !o.done && isT(o); });
  var tasks = late.concat(nxt.filter(function (o) { return !o.auto || o.off <= 1; })); /* مهامي أولًا؛ التلقائي (جرد، تصفية) في يومه وغده فقط فلا يزاحم */
  bl.push(B('rows', { title: 'المهام' + (tasks.length ? ' (' + tasks.length + ')' : ''), act: 'مهمة', actGo: padNewTask, items: tasks.map(calRow), empty: 'لا مهام. أضف ما تريد تذكّره بتاريخه ووقته.' }));
  var shop = padShopOpen(), left = shop.filter(function (x) { return !x.done; }).length, sho = padShort();
  bl.push(B('rows', { title: 'المشتريات' + (shop.length ? ' (' + left + ')' : ''), act: 'صنف', actGo: function () { openSh({ t: 'padShop' }, { pitems: '' }); }, all: true,
    items: shop.map(function (x) { return X({ icon: x.done ? 'i-check' : 'i-dot', icTone: x.done ? 'ok' : 'mute', title: x.t, tag: x.done ? 'اشتُري' : '', tagTone: 'ok', go: function () { padToggle(x.id); }, lp: function () { qa(x.t, '', [['حذف', 'i-x', function () { shut(); P.shop = P.shop.filter(function (y) { return y.id !== x.id; }); save(); render(); }]]); } }); }),
    empty: 'لا مشتريات. اكتب ما تحتاج جلبه.' }));
  var sa = [];
  if (sho.length) sa.push(X({ title: 'من النواقص', icon: 'i-box', go: function () { openSh({ t: 'padShort' }, {}); } }));
  if (shop.length) sa.push(X({ title: 'نسخ القائمة', icon: 'i-copy', go: function () { copyText(padText(), 'نُسخت القائمة'); } }));
  if (shop.some(function (x) { return x.done; })) sa.push(X({ title: 'مسح المشترى', icon: 'i-check', go: padClearDone }));
  if (sa.length) bl.push(B('acts', { items: sa }));
  var ns = padNotes(false), na = padNotes(true);
  bl.push(B('rows', { title: 'الملاحظات' + (ns.length ? ' (' + ns.length + ')' : ''), act: 'ملاحظة', actGo: function () { openSh({ t: 'padNote', id: '' }, padNoteForm(null)); },
    items: ns.map(function (n) { var ln = String(n.b || '').split('\n')[0]; return X({ icon: n.pin ? 'i-heart' : 'i-pencil', icTone: n.pin ? 'warn' : 'mute', title: n.t || ln || 'ملاحظة', sub: n.t ? ln : '', chev: true, go: function () { openSh({ t: 'padNote', id: n.id }, padNoteForm(n)); } }); })
      .concat(na.length ? [X({ more: true, title: 'المؤرشفة (' + na.length + ')', go: function () { openSh({ t: 'padArc' }, {}); } })] : []), empty: 'لا ملاحظات.' }));
  bl.push(B('rows', { items: [X({ icon: 'i-calendar', icTone: 'info', title: 'التقويم والتنبيهات', sub: calSummary(), chev: true, go: function () { open('cal'); } })] }));
  return bl;
}

function padSheet(sh) {
  var R = null, P = padS();
  switch (sh.t) {
    case 'padShop': {
      var ln = fv('pitems').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      R = { title: 'مشتريات', fields: [fArea('pitems', 'الأصناف', 'صنف في كل سطر')], ft: { label: 'إضافة' + (ln.length ? ' · ' + ln.length : ''), ok: ln.length > 0, go: function () { var n = padAdd(ln); setState({ sh: null, form: {}, q: '' }); say(n ? 'أُضيف ' + pl(n, 'صنف واحد', 'صنفان', 'أصناف') : 'موجودة في القائمة'); } } };
      break;
    }
    case 'padShort': {
      var sr = padShort();
      R = { title: 'من النواقص', sub: pl(sr.length, 'صنف واحد', 'صنفان', 'أصناف'), rows: sr.map(function (r) { return X({ title: r.name, sub: r.q > 0 ? 'حرج: ' + fmt(r.q) + ' ' + r.unit : r.q < 0 ? 'ناقص ' + fmt(-r.q) + ' ' + r.unit : 'نفد', tag: '+', tagTone: 'ok', go: function () { padAdd([r.name]); render(); } }); }), empty: 'كل النواقص في قائمتك',
        ft: sr.length ? { label: 'إضافة الكل · ' + sr.length, ok: true, go: function () { padAdd(sr.map(function (r) { return r.name; })); shut(); say('أُضيفت النواقص'); } } : null };
      break;
    }
    case 'padNote': {
      var nn = sh.id ? E.by(P.notes, sh.id) : null;
      R = { title: nn ? 'ملاحظة' : 'ملاحظة جديدة', fields: [fText('ntitle', 'العنوان', 'اختياري'), fArea('nbody', 'النص', 'اكتب هنا'), fChips('npin', 'التثبيت', [['', 'عادية'], ['1', 'مثبتة في الأعلى']])],
        ft: { label: 'حفظ', ok: (fv('ntitle').trim() + fv('nbody').trim()).length > 0, go: function () { padSaveNote(nn ? nn.id : ''); } },
        ft2: nn ? { label: 'أرشفة', go: function () { padArchNote(nn.id, true); } } : null };
      break;
    }
    case 'padArc': {
      R = { title: 'الملاحظات المؤرشفة', rows: padNotes(true).map(function (n) { return X({ icon: 'i-pencil', icTone: 'mute', title: n.t || String(n.b || '').split('\n')[0] || 'ملاحظة', tag: 'استعادة', tagTone: 'info', go: function () { padArchNote(n.id, false); } }); }), empty: 'لا مؤرشفة' };
      break;
    }
  }
  return R;
}

/* ===== 02d-day.js ===== */
/* ---------- اليوم: المستفيدون وتوزيع القدور والعطلة والإغلاق (كما في التصميم) ---------- */
var LOCKT = ['distDay', 'dist', 'issue', 'adjust', 'count', 'holiday'], LOCKN = { distDay: 'توزيع القدور', dist: 'توزيع القدور', issue: 'صرف المواد', adjust: 'جرد المخزن', count: 'جرد المخزن', holiday: 'إعلان العطلة', batch: 'طبخة جديدة' };
function dayInfo(d) { return (S.days || {})[d || today()] || {}; }
function dayW() { S.days = S.days || {}; var t = today(); if (!S.days[t]) S.days[t] = {}; return S.days[t]; }
function isHol() { return dayInfo().holiday || null; }
function isClosed() { return !!dayInfo().closed; }
function audit(what) { S.audit = S.audit || []; S.audit.unshift({ ts: Date.now(), date: today(), what: what }); S.audit = S.audit.slice(0, 300); }

/* المستفيدون: مخيمات ونقاط توزيع */
function bens() { return (S.bens || []).filter(function (g) { return !g.arch; }); }
function benName(id) { var g = E.by(S.bens || [], id); return g ? g.name : id; }
/* توزيع الطبخة = ما سُجّل عليها مباشرة + تسجيلات «توزيع القدور» لليوم المنسوبة إليها (بالطبخة المختارة، أو الطبخة الوحيدة اليوم) */
function distDirect(b) { var d = b.dist || {}; return r2(Object.keys(d).reduce(function (a, k) { return a + d[k]; }, 0)); }
function distLinks() {
  var out = {}, left = {}, pv = dayBatches('private');
  pv.forEach(function (b) { left[b.id] = Math.max(0, r2((b.pots || 0) - distDirect(b))); out[b.id] = []; });
  dayDist().forEach(function (x) {
    var c = pv.filter(function (b) { return x.dish ? b.recipe === x.dish : pv.length === 1; }); if (!c.length) return;
    var t = c.filter(function (b) { return left[b.id] > 0; })[0] || c[0]; out[t.id].push(x); left[t.id] = r2(left[t.id] - x.pots);
  });
  return out;
}
function distSum(b) { var l = (distLinks()[b.id] || []).reduce(function (a, x) { return a + x.pots; }, 0); return r2(distDirect(b) + l); }
function distLeft(b) { return Math.max(0, r2((b.pots || 0) - distSum(b))); }
function distTxt(b) {
  var d = b.dist || {}, m = {}, o = []; Object.keys(d).filter(function (k) { return d[k] > 0; }).forEach(function (k) { m[k] = d[k]; o.push(k); });
  (distLinks()[b.id] || []).forEach(function (x) { if (!(x.ben in m)) { m[x.ben] = 0; o.push(x.ben); } m[x.ben] = r2(m[x.ben] + x.pots); });
  return o.length ? o.map(function (k) { return benName(k) + ' ' + fmt(m[k]); }).join(' · ') : 'لم يُوزَّع بعد';
}
/* الطبخة الافتراضية عند تسجيل توزيع: إن كانت طبخة واحدة اليوم فهي المقصودة */
function distDish0() { var r = {}; dayBatches('private').forEach(function (b) { if (b.recipe) r[b.recipe] = 1; }); var k = Object.keys(r); return k.length === 1 ? k[0] : ''; }
/* محرر التوزيع الموحَّد (الطبخة، الخطة، خطة اليوم): تظهر المخيمات المضافة فقط، ✕ لإخفاء مخيم (حتى لو قيمته صفر)، وتحتها إضافة من المسجّلين أو مخيم جديد من نفس النافذة */
function dlAuto(f) {
  f.dl = bens().filter(function (g) { return Object.keys(f).some(function (k) { return (k === 'd_' + g.id || k === 't_' + g.id || (/^d_[^_]+_/.test(k) && k.slice(-g.id.length - 1) === '_' + g.id)) && +f[k] > 0; }); }).map(function (g) { return g.id; }).join(',');
  return f;
}
function dlGet() { var all = bens().map(function (g) { return g.id; }); return (fv('dl') || '').split(',').filter(function (id, i, a) { return id && all.indexOf(id) >= 0 && a.indexOf(id) === i; }); }
/* آخر توزيعة قبل تاريخ معيّن: من الطبخات والتسجيلات والخطط (تُجمع حسب المستفيد) */
function prevDist(day) {
  var m = {};
  var add = function (dt, ben, v) { if (!dt || dt >= day || !(v > 0) || !E.by(S.bens || [], ben) || (E.by(S.bens || [], ben) || {}).arch) return; m[dt] = m[dt] || {}; m[dt][ben] = r2((m[dt][ben] || 0) + v); };
  S.batches.forEach(function (b) { if (!b.void && b.kind === 'private' && b.dist) Object.keys(b.dist).forEach(function (k) { add(b.date, k, b.dist[k]); }); });
  (S.dist || []).forEach(function (x) { add(x.date, x.ben, x.pots); });
  (S.plans || []).forEach(function (p) { if (!p.off && !p.done && p.dist) Object.keys(p.dist).forEach(function (k) { add(p.date, k, p.dist[k]); }); });
  var ds = Object.keys(m).sort(); if (!ds.length) return null; var d = ds[ds.length - 1]; return { date: d, v: m[d] };
}
function distEditFields(sh, mk, clr, day, keyOf) {
  var ids = dlGet(), fl = [], pv = day ? prevDist(day) : null;
  if (pv) {
    var pk = Object.keys(pv.v), tot = r2(pk.reduce(function (a, k) { return a + pv.v[k]; }, 0));
    fl.push({ label: 'من توزيع سابق', hint: '', hasHint: false, isText: false, isChips: true, value: '', ph: '', mode: 'text', onInput: noop, chips: [X({ label: 'تكرار توزيعة ' + dlabel(pv.date) + ' · ' + pl(tot, 'قدر واحد', 'قدران', 'قدور') + ' على ' + pk.length, on: false, go: function () {
      bens().forEach(function (g) { A.form[keyOf(g.id)] = pv.v[g.id] ? String(pv.v[g.id]) : ''; if (sh.t === 'pdistDay') A.form['d_' + g.id] = ''; });
      if (sh.t === 'pdistDay') A.form.dmode = 'tot';
      fset('dl', pk.join(','));
    } })] });
  }
  ids.forEach(function (id) {
    var g = E.by(S.bens, id);
    mk(g).forEach(function (f, i) { f.did = id; if (ids.length > 1) f.hasDrag = true; if (i === 0) { f.hasRm = true; f.rm = function () { clr(id); fset('dl', ids.filter(function (x) { return x !== id; }).join(',')); }; } fl.push(f); });
  });
  var chips = bens().filter(function (g) { return ids.indexOf(g.id) < 0; }).map(function (g) { return X({ label: g.name, on: false, go: function () { fset('dl', ids.concat(g.id).join(',')); } }); });
  chips.push(X({ label: '+ مخيم جديد', on: false, go: function () { openSh({ t: 'addBen', back: { sh: sh, form: Object.assign({}, A.form) } }, { name: '' }); } }));
  fl.push({ label: ids.length ? 'إضافة مخيم' : 'اختر المخيمات', hint: '', hasHint: false, isText: false, isChips: true, value: '', ph: '', mode: 'text', onInput: noop, chips: chips });
  return fl;
}
function distForm(b) { var f = {}, d = b.dist || {}; bens().forEach(function (g) { f['d_' + g.id] = d[g.id] ? String(d[g.id]) : ''; }); return dlAuto(f); }
function dayDist() { return (S.dist || []).filter(function (x) { return x.date === today(); }); }
function dayBatches(kind) { return S.batches.filter(function (b) { return b.date === today() && !b.void && (!kind || b.kind === kind); }); }
function distAgg(batches, withDay) { // التوزيع حسب الجهة: الطبخات الخارجية لجهتها، والذاتية لمستفيديها
  var map = {}, order = [], priv = 0, given = 0;
  var add = function (key, name, pots, dish) { if (!map[key]) { map[key] = { name: name, pots: 0, dishes: {} }; order.push(key); } map[key].pots = r2(map[key].pots + pots); if (dish) map[key].dishes[dish] = r2((map[key].dishes[dish] || 0) + pots); };
  batches.forEach(function (b) {
    var dish = b.distTot ? '' : batchName(b);
    if (b.kind === 'external') { var i = inst(b.inst); add('i:' + b.inst, (i && i.init ? 'مبادرة · ' : 'مؤسسة · ') + (i ? i.name : ''), b.pots || 0, dish); return; }
    var d = b.dist || {}; priv = r2(priv + (b.pots || 0));
    Object.keys(d).forEach(function (k) { if (d[k] > 0) { add('g:' + k, benName(k), d[k], dish); given = r2(given + d[k]); } });
  });
  if (withDay !== false && batches.some(function (b) { return b.kind === 'private'; })) dayDist().forEach(function (x) { add('g:' + x.ben, benName(x.ben), x.pots, x.dish ? (rec(x.dish) || {}).name : ''); given = r2(given + x.pots); });
  var dn = {}; order.forEach(function (k) { Object.keys(map[k].dishes).forEach(function (n) { dn[n] = 1; }); }); var multi = Object.keys(dn).length > 1; /* اسم الطبخة يُذكر فقط حين يتعدد الأصناف في اليوم */
  return { rows: order.map(function (k) { var m = map[k]; return { name: m.name, pots: m.pots, dishes: !multi ? '' : Object.keys(m.dishes).map(function (n) { return n + ' ' + fmt(m.dishes[n]); }).join(' · ') }; }), und: Math.max(0, r2(priv - given)), priv: priv, given: given };
}

/* ما يخص تقرير المراقب: لقطة وقت الإغلاق لمعرفة ما تغيّر بعد إعادة الفتح */
function snapRep() {
  var t = today();
  return {
    'الطبخات': JSON.stringify(dayBatches().map(function (b) { return [b.id, b.recipe, b.pots, b.lines.map(function (l) { return [l.item, l.qty]; }), b.dist || null]; })),
    'التوزيع': JSON.stringify(dayDist().map(function (x) { return [x.ben, x.pots, x.dish]; })),
    'صرف المواد': JSON.stringify(S.moves.filter(function (m) { return m.kind === 'issue' && m.date === t; }).map(function (m) { return [m.item, m.q, m.note]; })),
    'العطلة': JSON.stringify(isHol())
  };
}
function repChg() { var di = dayInfo(); if (!di.reopened) return []; var now = snapRep(), was = di.reopened.snap; return Object.keys(now).filter(function (k) { return now[k] !== was[k]; }); }

/* ---- الأفعال ---- */
/* بيانات المخيم لتنظيم العمل (خاصة بك: لا تدخل تقارير المراقب) */
var BF = ['rep', 'phone', 'addr', 'loc', 'fam', 'note'];
function benForm(g) { var f = { name: g ? g.name : '' }; BF.forEach(function (k) { f[k] = g && g[k] != null ? String(g[k]) : ''; }); return f; }
function benFields() {
  return [fText('name', 'الاسم', 'مثال: المخيم 3'), fText('rep', 'اسم المندوب', 'اسم المسؤول عن المخيم'), fText('phone', 'رقم جوال المندوب', '05xxxxxxxx', 'tel'),
    fText('addr', 'العنوان', 'وصف مكتوب للمكان'), fText('loc', 'الموقع على الخريطة', 'رابط أو إحداثيات', 'text', 'ألصق رابط الموقع من الخرائط، أو اكتب الإحداثيات مثل 31.52,34.45'),
    fText('fam', 'عدد الأسر', '0', 'numeric'), fText('note', 'ملاحظات', 'أي شيء آخر تريد تذكّره')];
}
function benPhoneOk() { var v = fv('phone').trim(); return !v || v.replace(/[^0-9٠-٩]/g, '').length >= 7; }
function benRead() { var o = { name: fv('name').trim() }; BF.forEach(function (k) { o[k] = fv(k).trim(); }); o.fam = o.fam ? Math.max(0, Math.round(num('fam'))) : ''; return o; }
function benSub(g) { var a = []; if (g.rep) a.push(g.rep); if (g.phone) a.push(g.phone); if (g.fam) a.push(pl(g.fam, 'أسرة واحدة', 'أسرتان', 'أسرة')); if (!a.length && g.addr) a.push(g.addr); return a.join(' · ') || 'وُزّع عليه اليوم ' + fmt(benToday(g.id)) + ' قدر'; }
function doAddBen(then) {
  var o = benRead(); S.bens = S.bens || [];
  var g = { id: newId('g', S.bens) }; for (var k in o) g[k] = o[k]; S.bens.push(g); audit('مستفيد جديد: ' + o.name); save();
  if (then && then.back) { var f2 = Object.assign({}, then.back.form); f2.dl = (f2.dl ? f2.dl + ',' : '') + g.id; setState({ sh: then.back.sh, q: '', form: f2 }); return; }
  if (then) setState({ sh: then, q: '', form: then.t === 'dist' ? distForm(E.by(S.batches, then.id)) : { ben: g.id, pots: '', dish: '' } }); else shut();
}
function doSaveBen(id) {
  var g = E.by(S.bens || [], id), o = benRead(); for (var k in o) g[k] = o[k]; audit('تعديل بيانات «' + g.name + '»'); shut(); mutated('حُفظت بيانات «' + g.name + '»');
}
function benCall(g) { var n = String(g.phone || '').replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 1632); }).replace(/[^0-9+]/g, ''); if (n) window.location.href = 'tel:' + n; }
function benMapUrl(g) {
  var v = String(g.loc || '').trim();
  if (/^https?:\/\//i.test(v)) return v;
  var m = /^(-?\d+(?:\.\d+)?)\s*[,،]\s*(-?\d+(?:\.\d+)?)$/.exec(v.replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 1632); }));
  if (m) return 'https://www.google.com/maps?q=' + m[1] + ',' + m[2];
  var q = v || g.addr || g.name; return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
}
function benQa(g) {
  var a = []; if (g.phone) a.push(['اتصال بالمندوب' + (g.rep ? ': ' + g.rep : ''), 'i-users', function () { benCall(g); }]); if (g.loc || g.addr) a.push(['فتح الموقع على الخريطة', 'i-home', function () { benOpenMap(g); }]);
  a.push(['تسجيل توزيع قدور', 'i-pot', function () { openSh({ t: 'distDay' }, { ben: g.id, pots: '', dish: distDish0() }); }]); a.push(['تعديل البيانات', 'i-pencil', function () { openSh({ t: 'benEdit', id: g.id }, benForm(g)); }]);
  qa(g.name, benSub(g), a);
}
function benOpenMap(g) { window.open(benMapUrl(g), '_blank'); }
function doSetDist(bid) {
  var b = E.by(S.batches, bid), vals = {}; bens().forEach(function (g) { var v = num('d_' + g.id); if (v > 0) vals[g.id] = v; });
  b.dist = vals; delete b.distTot; audit('توزيع قدور «' + batchName(b) + '» على المستفيدين'); shut(); mutated('حُفظ توزيع القدور');
}
function doDistDay(eid) {
  S.dist = S.dist || []; var o = { ben: fv('ben'), pots: num('pots'), dish: fv('dish') || '' };
  if (eid) { var x = E.by(S.dist, eid); if (x) Object.assign(x, o); } else S.dist.push(Object.assign({ id: newId('x', S.dist), date: today() }, o));
  audit('توزيع ' + fmt(o.pots) + ' قدر على ' + benName(o.ben)); shut(); mutated('سُجّل التوزيع');
}
function doDelDist(eid) { S.dist = (S.dist || []).filter(function (x) { return x.id !== eid; }); shut(); mutated('حُذف تسجيل التوزيع'); }
function doHoliday(reason) {
  dayW().holiday = { reason: reason }; activeW().forEach(function (w) { E.setAtt(S, today(), w.id, 'h'); });
  audit('عطلة اليوم: ' + reason); shut(); mutated('اليوم عطلة: ' + reason);
}
function doCancelHoliday() {
  delete dayW().holiday; S.att = (S.att || []).filter(function (a) { return !(a.date === today() && a.st === 'h'); });
  audit('أُلغيت عطلة اليوم'); save(); say('أُلغيت العطلة');
}
function doClose() {
  var di = dayW(), ch = repChg(), msg = 'أُغلق اليوم وجُهّز تقرير المراقب';
  if (di.reopened) { msg = ch.length ? 'أُغلق اليوم وأُرسل للمراقب تقرير معدَّل رقم ' + di.reopened.n : 'أُغلق اليوم، ولم يتغير شيء في تقرير المراقب'; }
  if (!di.reopened) { di.rv = 1; di.sent = { ver: 1, ts: Date.now(), ch: [] }; }
  else if (ch.length) { di.rv = di.reopened.n; di.sent = { ver: di.rv, ts: Date.now(), ch: ch }; audit('تقرير المراقب معدَّل رقم ' + di.rv + ' (تعديل في: ' + ch.join('، ') + ')'); }
  else audit('أُغلق اليوم بلا تغيير في تقرير المراقب: بقيت النسخة ' + di.rv);
  di.closed = true; di.reopened = null; shut(); mutated(msg);
}
function doReopen(why) {
  var di = dayW(); di.reopened = { n: (di.rv || 1) + 1, why: why, snap: snapRep() }; di.closed = false; audit('إعادة فتح اليوم: ' + why); shut(); mutated('أُعيد فتح اليوم وسُجّل السبب');
}

/* ---- النوافذ ---- */
function daySheet(sh) {
  var R = null, d = dayInfo(), dgs, dtot, db, nm, dup;
  switch (sh.t) {
    case 'dist': {
      db = E.by(S.batches, sh.id); dgs = bens(); dtot = r2(dgs.reduce(function (a, g) { return a + num('d_' + g.id); }, 0)); var dlk = r2((distLinks()[db.id] || []).reduce(function (a, x) { return a + x.pots; }, 0));
      R = { title: 'توزيع قدور ' + batchName(db), sub: pl(db.pots || 0, 'قدر واحد', 'قدران', 'قدور') + ' · اكتب عدد القدور لكل مستفيد',
        fields: distEditFields(sh, function (g) { return [fText('d_' + g.id, g.name, '0', 'decimal')]; }, function (id) { A.form['d_' + id] = ''; }, db.date, function (id) { return 'd_' + id; }),
        note: { text: dtot + dlk > db.pots ? 'المجموع ' + fmt(r2(dtot + dlk)) + ' أكبر من قدور الطبخة (' + fmt(db.pots) + ')' : 'الموزّع ' + fmt(r2(dtot + dlk)) + ' من ' + fmt(db.pots) + (dlk ? ' (منها ' + fmt(dlk) + ' سُجّلت من «توزيع القدور» في اليوم)' : '') + (dtot + dlk < db.pots ? ' · يبقى ' + fmt(r2(db.pots - dtot - dlk)) + ' غير موزّع' : ' · موزّعة كلها'), tone: dtot + dlk > db.pots ? 'warn' : dtot + dlk === db.pots ? 'ok' : 'info' },
        ft: { label: 'حفظ التوزيع', ok: dtot + dlk <= db.pots, go: function () { doSetDist(db.id); } } };
      break;
    }
    case 'distDay': {
      var dpots = num('pots'), dben = fv('ben'), seen = {}, dopts = [['', 'بدون']];
      dayBatches('private').forEach(function (b) { if (b.recipe && !seen[b.recipe]) { seen[b.recipe] = 1; dopts.push([b.recipe, (rec(b.recipe) || {}).name || batchName(b)]); } });
      R = { title: sh.eid ? 'تعديل التوزيع' : 'توزيع قدور', sub: 'مخيم وعدد القدور يكفيان', fields: [fChips('ben', 'المستفيد', bens().map(function (g) { return [g.id, g.name]; })), fText('pots', 'عدد القدور', '0', 'decimal'), fChips('dish', 'الطبخة (اختياري)', dopts)],
        ft: { label: sh.eid ? 'حفظ' : 'تسجيل', ok: !!dben && dpots > 0, go: function () { doDistDay(sh.eid); } }, ft2: sh.eid ? { label: 'حذف التسجيل', go: function () { doDelDist(sh.eid); } } : (bens().length ? { label: 'مستفيد جديد', go: function () { openSh({ t: 'addBen', then: { t: 'distDay' } }, { name: '' }); } } : null) };
      if (!bens().length) R.note = { text: 'لا مستفيدين بعد: أضف أول مخيم أو نقطة توزيع.', tone: 'info' };
      break;
    }
    case 'addBen': {
      nm = fv('name').trim(); dup = bens().filter(function (g) { return norm(g.name) === norm(nm); })[0];
      R = { title: 'مستفيد جديد', sub: 'مخيم أو نقطة توزيع · الاسم وحده يكفي والباقي اختياري', fields: benFields(), dup: dup ? 'يوجد مستفيد بهذا الاسم.' : '', ft: { label: 'إضافة المستفيد', ok: nm.length > 1 && !dup && benPhoneOk(), go: function () { doAddBen(sh.then || (sh.back ? { back: sh.back } : null)); } } };
      break;
    }
    case 'benEdit': {
      var bg = E.by(S.bens || [], sh.id); nm = fv('name').trim(); dup = bens().filter(function (g) { return g.id !== bg.id && norm(g.name) === norm(nm); })[0];
      var cur = { phone: fv('phone').trim(), loc: fv('loc').trim(), addr: fv('addr').trim(), name: nm };
      R = { title: bg.name, sub: 'بيانات المخيم لتنظيم العمل · لا تظهر في تقرير المراقب', fields: benFields(),
        rows: [].concat(cur.phone && benPhoneOk() ? [X({ icon: 'i-users', icTone: 'info', title: 'اتصال بالمندوب', sub: (fv('rep').trim() ? fv('rep').trim() + ' · ' : '') + cur.phone, chev: true, go: function () { benCall(cur); } })] : [],
          cur.loc || cur.addr ? [X({ icon: 'i-home', icTone: 'info', title: 'فتح الموقع على الخريطة', sub: cur.loc ? 'من الموقع المحفوظ' : 'بحث بالعنوان المكتوب', chev: true, go: function () { benOpenMap(cur); } })] : []),
        dup: dup ? 'يوجد مستفيد آخر بهذا الاسم.' : '', ft: { label: 'حفظ', ok: nm.length > 1 && !dup && benPhoneOk(), go: function () { doSaveBen(bg.id); } } };
      break;
    }
    case 'holiday': {
      var hr = fv('reason') || S.settings.weekHol || 'الجمعة', ho = hr === 'أخرى', hrs = ho ? fv('other').trim() : hr;
      if (hr === 'الجمعة والسبت' || hr === 'لا يوجد') hrs = 'الجمعة';
      R = { title: 'إعلان عطلة اليوم', sub: dlong(today()), fields: [fChips('reason', 'سبب العطلة', [['الجمعة', 'الجمعة'], ['انقطاع كهرباء', 'انقطاع كهرباء'], ['نفاد حطب', 'نفاد حطب'], ['أخرى', 'سبب آخر']])].concat(ho ? [fText('other', 'اكتب السبب', 'مثال: ظرف طارئ')] : []),
        note: { text: (dayBatches().length ? 'تنبيه: سُجّلت اليوم طبخات، راجعها قبل إعلان العطلة. ' : '') + 'يُسجَّل كل العمال «عطلة» بلا أجر، ويُوقف تنبيهات الحضور. لمن يعمل رغم العطلة: افتح حسابه واختر «إضافة».', tone: 'info' },
        ft: { label: 'تأكيد العطلة', ok: hrs.length > 1, go: function () { doHoliday(hrs); } } };
      break;
    }
    case 'weekHol': {
      R = { title: 'العطلة الأسبوعية', sub: 'تُقترح تلقائيًا عند إعلان عطلة اليوم', fields: [fChips('v', 'اليوم المعتاد', [['الجمعة', 'الجمعة'], ['الجمعة والسبت', 'الجمعة والسبت'], ['لا يوجد', 'لا يوجد']])],
        note: { text: 'العطلة الطارئة (كهرباء، حطب) لا تحتاج إعدادًا: أعلنها من الصفحة الرئيسية في أي يوم.', tone: 'info' },
        ft: { label: 'حفظ', ok: !!fv('v'), go: function () { S.settings.weekHol = fv('v'); shut(); mutated('حُفظت العطلة المعتادة'); } } };
      break;
    }
    case 'close': {
      var miss = E.wDay(S, today()).none, hol = isHol(), crit = 0, unc = unconfDay().length;
      ledgers().forEach(function (l) { if (l.ext) return; itemsIn(l.id).forEach(function (it) { var q = E.balance(S, l.id, it.id); if (alertable(l, it, q) && stStatus(q, it.id).rank <= 1) crit++; }); });
      var chk = function (ok, title, subt, tab, extra) { return X({ title: title, sub: subt, tag: ok ? 'جاهز' : 'ناقص', tagTone: ok ? 'ok' : 'warn', chev: !ok && !!tab, go: !ok && tab ? function () { setState(Object.assign({ sh: null, form: {}, page: 'main', tab: tab }, extra || {})); } : noop }); };
      var ch = repChg(), rp;
      if (d.reopened) rp = ch.length ? X({ title: 'تقرير المراقب', sub: 'يصله معدَّلًا رقم ' + d.reopened.n + ' (تعديل في: ' + ch.join('، ') + ')', tag: 'سيُرسل', tagTone: 'warn' }) : X({ title: 'تقرير المراقب', sub: 'لا تغيير عمّا أُرسل: لن يُرسل شيء جديد', tag: 'بلا تغيير', tagTone: 'ok' });
      else if (d.closed && d.sent) rp = X({ title: 'تقرير المراقب', sub: 'أُرسل · النسخة ' + d.sent.ver, tag: 'أُرسل', tagTone: 'ok' });
      else rp = chk(true, 'تقرير المراقب', 'يُجهَّز تلقائيًا بلا أسعار');
      R = { title: 'إغلاق اليوم', sub: dlong(today()), rows: [
          chk(!miss, hol ? 'الدوام' : 'حضور كل العمال', hol ? 'عطلة: ' + hol.reason : miss ? pl(miss, 'عامل واحد لم يُسجَّل', 'عاملان لم يُسجَّلا', 'عمال لم يُسجَّلوا') + ' · اضغط للتسجيل' : 'مسجّل للجميع', 'workers', { wmode: 'att' }),
          chk(!unc, 'تأكيد كميات الطبخات', unc ? pl(unc, 'طبخة واحدة تنتظر', 'طبختان تنتظران', 'طبخات تنتظر') + ' تأكيد · اضغط للمراجعة' : 'كلها مؤكدة', 'kitchen'),
          chk(!crit, 'الأصناف الحرجة', crit ? pl(crit, 'صنف واحد يحتاج', 'صنفان يحتاجان', 'أصناف تحتاج') + ' طلبًا · اضغط للمخزن' : 'لا أصناف حرجة', 'stock'), rp],
        note: { text: miss || unc ? 'يمكنك الإغلاق الآن، وتبقى النواقص ظاهرة في «يحتاج انتباهك».' : 'كل شيء جاهز للإغلاق.', tone: miss || unc ? 'warn' : 'ok' },
        ft: d.closed ? { label: 'اليوم مغلق', ok: true, go: function () { shut(); } } : { label: d.reopened ? (repChg().length ? 'إغلاق وإرسال النسخة المعدَّلة' : 'إغلاق اليوم') : hol ? 'إغلاق يوم العطلة' : 'إغلاق اليوم وتجهيز التقرير', ok: true, go: function () { doClose(); } },
        ft2: d.closed ? { label: 'إعادة فتح اليوم', go: function () { openSh({ t: 'reopen' }, { why: '' }); } } : null };
      break;
    }
    case 'reopen': {
      var rw = fv('why').trim();
      R = { title: 'إعادة فتح اليوم', sub: dlong(today()), fields: [fText('why', 'سبب إعادة الفتح', 'مثال: نسيت توزيع قدر')],
        note: { text: d.closed ? 'السبب يبقى في سجلك. إن تغيّر شيء يخص المراقب يصله تقرير معدَّل رقم ' + ((d.rv || 1) + 1) + ' بما تغيّر فقط.' : 'اليوم غير مغلق: لا حاجة لإعادة الفتح.', tone: d.closed ? 'info' : 'warn' },
        ft: { label: 'إعادة فتح اليوم', ok: !!d.closed && rw.length > 2, go: function () { doReopen(rw); } } };
      break;
    }
    case 'locked': {
      R = { title: 'اليوم مغلق', sub: LOCKN[sh.what] || '', rows: [X({ icon: 'i-lock', icTone: 'ok', title: 'أُرسل للمراقب', sub: 'النسخة ' + (d.rv || 1), tag: 'مغلق', tagTone: 'mute' })],
        note: { text: 'هذا يغيّر ما في تقرير المراقب. أعد فتح اليوم بسبب يُسجَّل، ويصله تقرير معدَّل برقم جديد. الحضور والدفعات تبقى مفتوحة.', tone: 'info' },
        ft: { label: 'إعادة فتح اليوم', ok: true, go: function () { openSh({ t: 'reopen' }, { why: '' }); } }, ft2: { label: 'ليس الآن', go: function () { shut(); } } };
      break;
    }
  }
  return R;
}

/* ترتيب المخيمات بالسحب: يُحفظ في القائمة الرئيسية فيشمل كل شاشات التوزيع والتقارير */
window.__reorder = function (ids) {
  var pos = [], gs = ids.map(function (id) { return E.by(S.bens, id); }).filter(Boolean);
  gs.forEach(function (g) { pos.push(S.bens.indexOf(g)); }); pos.sort(function (a, b) { return a - b; });
  gs.forEach(function (g, i) { S.bens[pos[i]] = g; });
  fset('dl', ids.join(',')); mutated('رُتّبت المخيمات');
};

/* ===== 02i-photo.js ===== */
/* ---------- صور التوثيق: التقاط/اختيار، ضغط، حفظ على الجهاز، عرض، نسخ احتياطي ---------- */
/* الصورة تُحفظ في IndexedDB بمفتاح ph:<معرّف>، والسجل يحمل المعرّف في الحقل ph فقط (فلا تثقل البيانات الأساسية) */
var PH_MAX = 60 * 1024; // الحجم المستهدف بعد الضغط (بايت)
var PHBUSY = false;

function phKey(id) { return 'ph:' + id; }
function phNewId() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function dataBytes(u) { return Math.round((String(u).length - String(u).indexOf(',') - 1) * 0.75); }

/* ضغط: يصغّر الضلع الأطول إلى 1280 ثم يخفض الجودة حتى يبلغ الحجم المستهدف */
function phCompress(src) {
  return new Promise(function (res, rej) {
    var img = new Image();
    img.onload = function () {
      try {
        var side = 1280, out = '';
        for (var pass = 0; pass < 4; pass++) {
          var k = Math.min(1, side / Math.max(img.width, img.height)), c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
          var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
          for (var q = 0.72; q >= 0.34; q -= 0.12) { out = c.toDataURL('image/jpeg', q); if (dataBytes(out) <= PH_MAX) return res(out); }
          side = Math.round(side * 0.75);
        }
        res(out);
      } catch (e) { rej(e); }
    };
    img.onerror = function () { rej(new Error('تعذّر قراءة الصورة')); };
    img.src = src;
  });
}
function phFromFile(file) {
  return new Promise(function (res, rej) {
    var r = new FileReader(); r.onload = function () { phCompress(String(r.result)).then(res, rej); }; r.onerror = function () { rej(new Error('تعذّر قراءة الملف')); }; r.readAsDataURL(file);
  });
}
/* يضع الصورة المضغوطة في نموذج النافذة الحالية */
function phApply(url, srcKind) { A.form.photo = url; A.form.photoSrc = srcKind; A.form.photoMenu = false; PHBUSY = false; render(); }
function phFail(er) { PHBUSY = false; if (er && /cancel|dismiss|no image/i.test(String(er.message || er))) { render(); return; } say('تعذّر إرفاق الصورة'); }
function phFileIn(file, kind) { if (!file) return; PHBUSY = true; phFromFile(file).then(function (u) { phApply(u, kind); }, phFail); }

function phFile() { var i = $('pfile'); if (i) i.click(); else say('اختيار الصور غير متاح هنا'); }
function phCam() {
  if (P.Camera && P.Camera.getPhoto) {
    PHBUSY = true;
    P.Camera.getPhoto({ quality: 80, resultType: 'dataUrl', source: 'CAMERA', width: 1600, correctOrientation: true, saveToGallery: false })
      .then(function (r) { return phCompress(r.dataUrl); }).then(function (u) { phApply(u, 'cam'); }, phFail);
    return;
  }
  var i = $('pcam'); if (i) i.click(); else phFile();
}

/* حقل الصورة بنفس مكوّن التصميم (m3): فارغ ← قائمة (التقاط/من الجهاز) ← مرفقة */
function fPhoto(label) {
  var p = A.form.photo || '', menu = !!A.form.photoMenu, set = function (v, m) { A.form.photo = v; A.form.photoMenu = m; if (!v) A.form.photoSrc = ''; render(); };
  var kb = p ? Math.max(1, Math.round(dataBytes(p) / 1024)) : 0;
  return { label: label || 'صورة توثيق (اختياري)', hint: '', hasHint: false, isText: false, isChips: false, isArea: false, value: '', ph: '', mode: 'text', onInput: noop, chips: [],
    isPhoto: true, phEmpty: !p && !menu, phMenu: !p && menu, phOn: !!p, phSrc: A.form.photoSrc === 'file' ? 'اختيرت من الجهاز' : 'التُقطت الآن',
    phOpen: function () { set('', true); }, phCam: phCam, phFile: phFile, phDel: function () { set('', false); }, phCancel: function () { set('', false); }, phKb: kb, fd: !p && !menu ? 'row' : 'column', ai: !p && !menu ? 'center' : 'stretch', gp: !p && !menu ? '12px' : '6px', lf: !p && !menu ? '1' : 'none' };
}

/* عند الحفظ: يُخزَّن ما في النموذج ويُرجَع معرّفه ('' إن لم توجد صورة). يُستدعى قبل shut() */
function phTake() {
  var u = A.form && A.form.photo; if (!u) return '';
  var id = phNewId(); dbPut(phKey(id), u); return id;
}
/* وسم السجل بالصورة إن وُجدت: rec.ph = المعرّف */
function phTag(rec, id) { if (rec && id) rec.ph = id; return rec; }

function phGet(id) { return dbGet(phKey(id)); }
/* كل الصور (للنسخة الاحتياطية) */
function phAll() {
  return new Promise(function (res) {
    var out = {}; if (!DB) return res(out);
    try {
      var q = DB.transaction('kv').objectStore('kv').openCursor(IDBKeyRange.bound('ph:', 'ph:￿'));
      q.onsuccess = function () { var c = q.result; if (c) { out[String(c.key).slice(3)] = c.value; c.continue(); } else res(out); };
      q.onerror = function () { res(out); };
    } catch (e) { res(out); }
  });
}
function phRestore(map) {
  if (!map || typeof map !== 'object') return Promise.resolve(0);
  var ks = Object.keys(map).filter(function (k) { return typeof map[k] === 'string' && map[k].indexOf('data:image') === 0; });
  return Promise.all(ks.map(function (k) { return dbPut(phKey(k), map[k]); })).then(function () { return ks.length; });
}

/* عرض الصورة: تُفتح عبر نافذة النظام (مشاركة/معرض الصور) لأن الواجهة المعتمدة لا تحوي معاينة صورة */
function phOpenFile(id) {
  phGet(id).then(function (u) {
    if (!u) { say('الصورة غير موجودة على هذا الجهاز (ربما أتت من نسخة احتياطية بلا صور)'); return; }
    var b64 = u.split(',')[1];
    deliverFile(fnName(['صورة', today()], 'jpg'), b64, 'image/jpeg', 'صورة مرفقة').then(function () { shut(); }, function (er) { if (!/cancel|dismiss/i.test(String((er && er.message) || er))) say('تعذّر فتح الصورة'); });
  });
}
/* صف سجل يحمل صورة: يفتح نافذة الصورة إن لم يكن له فعل آخر */
function phRow(o, rec, title) {
  if (rec && rec.ph) { o.ph = true; if (!o.go) { o.go = function () { openSh({ t: 'phv', id: rec.ph, title: title || o.title || '' }); }; o.chev = true; } }
  return X(o);
}

/* مشاركة الصورة بلا إغلاق النافذة: تُفتح قائمة النظام فيختار المستخدم أي تطبيق */
function phShare(id, title) {
  phGet(id).then(function (u) {
    if (!u) { say('الصورة غير موجودة على هذا الجهاز'); return; }
    deliverFile(fnName(['صورة', title && title !== 'صورة مرفقة' ? title : '', today()], 'jpg'), u.split(',')[1], 'image/jpeg', title || 'صورة مرفقة').catch(function (er) { if (!/cancel|dismiss/i.test(String((er && er.message) || er))) say('تعذّر فتح المشاركة'); });
  });
}
function phSave(id) {
  phGet(id).then(function (u) {
    if (!u) { say('الصورة غير موجودة على هذا الجهاز'); return; }
    saveFile('صورة-' + id + '.jpg', u.split(',')[1], 'image/jpeg', 'صورة مرفقة').then(function (r) { say(savedMsg(r, 'الصورة')); }, function () { say('تعذّر حفظ الصورة'); });
  });
}
/* نافذة الصورة المشتركة: تظهر الصورة داخل التطبيق ثم المشاركة لأي تطبيق والحفظ. تخدم كل صفوف الصور (phRow) */
function fPhotoView(url, scroll, sticky) {
  return { label: '', hint: '', hasHint: false, isText: false, isChips: false, isArea: false, value: '', ph: '', mode: 'text', onInput: noop, chips: [], isPhView: true,
    phUrl: url || '', phShow: url ? 'block' : 'none', phWait: url ? 'none' : 'block', phH: url ? '0' : '160px', phAi: scroll ? 'flex-start' : 'center', phBox: sticky ? '30vh' : scroll ? '44vh' : 'none', pos: sticky ? 'sticky' : 'static', pz: sticky ? '6' : '0', pbg: sticky ? '#fff' : 'transparent', phMax: scroll ? 'none' : '55vh', fd: 'column', ai: 'stretch', gp: '0', lf: 'none' };
}
function photoSheet(sh) {
  if (sh.t !== 'phv') return null;
  if (A.form.pvId !== sh.id) { A.form.pvId = sh.id; A.form.pvUrl = ''; phGet(sh.id).then(function (u) { if (A.form.pvId === sh.id) { A.form.pvUrl = u || ''; if (!u) say('الصورة غير موجودة على هذا الجهاز (ربما أتت من نسخة احتياطية بلا صور)'); render(); } }); }
  var t = sh.title || 'صورة مرفقة';
  return { title: 'صورة مرفقة', sub: sh.title || '', fields: [fPhotoView(A.form.pvUrl)],
    ft: { label: 'مشاركة', ok: !!A.form.pvUrl, go: function () { phShare(sh.id, t); } },
    ft2: { label: 'تنزيل', go: function () { phSave(sh.id); } } };
}

/* مدخلات الملفات المخفية (index.html) */
function phMk(id, cap) { var i = document.createElement('input'); i.id = id; i.type = 'file'; i.accept = 'image/*'; if (cap) i.setAttribute('capture', 'environment'); i.hidden = true; document.body.appendChild(i); return i; }
function phWire() {
  /* الحزمة المحدَّثة صامتًا قد تعمل فوق index.html قديم لا يحوي المدخلين: نُنشئهما عند الحاجة */
  var f = $('pfile') || phMk('pfile', false), c = $('pcam') || phMk('pcam', true);
  if (f) f.addEventListener('change', function () { if (f.files[0]) phFileIn(f.files[0], 'file'); f.value = ''; });
  if (c) c.addEventListener('change', function () { if (c.files[0]) phFileIn(c.files[0], 'cam'); c.value = ''; });
}

/* معاينة أي صورة مولَّدة (كشف، تقرير، ملخص، نسخة الشيف) داخل التطبيق أولًا، وتحتها «مشاركة» و«تنزيل» */
var IMGP = null;
function imgShow(c, name, title, text, pdf) { IMGP = { url: c.toDataURL('image/png'), name: name, title: title, text: text || '', cv: pdf ? c : null }; openSh({ t: 'imgp' }, {}); }
function imgPreview(make, name, title, text, pdf) {
  say('جارٍ تجهيز الصورة…');
  var go = function () { try { imgShow(make(), name, title, text, pdf); } catch (e) { say('تعذّر تجهيز الصورة'); } };
  if (document.fonts && document.fonts.load) document.fonts.load("700 28px 'IBM Plex Sans Arabic'").then(go, go); else go();
}
function imgSheet(sh) {
  if (sh.t !== 'imgp' || !IMGP) return null;
  var g = IMGP;
  return { title: g.title, sub: 'هكذا ستصل الصورة', fields: [fPhotoView(g.url)],
    acts: g.cv ? [X({ title: 'PDF', icon: 'i-doc', go: function () { var pn = g.name.replace(/\.png$/, '.pdf'); deliverFile(pn, u8b64(pdfFromCanvas(g.cv)), 'application/pdf', g.title, g.text).catch(function (er) { if (!/cancel|dismiss/i.test(String((er && er.message) || er))) say('تعذّر فتح المشاركة'); }); } })] : [],
    ft: { label: 'مشاركة', ok: true, go: function () { deliverFile(g.name, g.url.split(',')[1], 'image/png', g.title, g.text).catch(function (er) { if (!/cancel|dismiss/i.test(String((er && er.message) || er))) say('تعذّر فتح المشاركة'); }); } },
    ft2: { label: 'تنزيل', go: function () { saveFile(g.name, g.url.split(',')[1], 'image/png', g.title).then(function (r) { say(savedMsg(r, 'الصورة')); }, function () { say('تعذّر حفظ الصورة'); }); } } };
}

/* ===== 02m-money.js ===== */
/* ---------- وحدة المال: الأرصدة (حاملو المال) ----------
   رصيد = مكان فيه مال: البنك (دولار وأحيانًا شيكل)، بايننس (دولار)، حميدا، وأي عامل يبقى المال عنده.
   كل حركة: وارد أو ناقص بعملة الرصيد. المصروف بالشيكل من رصيد دولار يُسجَّل بالشيكل وبسعر الصرف وقتها
   ويُخصم ما يقابله بالدولار. الحركات إضافية فقط: الإلغاء يضع علامة void ويبقى السجل. */
function migrate6() {
  if (S.settings.fix6b) return;
  S.funds = S.funds || []; S.fm = S.fm || [];
  if (!S.funds.length) {
    var hm = (S.workers || []).filter(function (w) { return w.name === 'حميدا'; })[0];
    S.funds.push({ id: 'f1', name: 'البنك', curs: ['usd', 'ils'] }, { id: 'f2', name: 'بايننس', curs: ['usd'] }, { id: 'f3', name: 'حميدا', curs: ['ils'], w: hm ? hm.id : null });
  }
  S.settings.fix6b = true; save();
}
function funds() { return (S.funds || []).filter(function (f) { return !f.arch; }); }
function fund(id) { return E.by(S.funds || [], id); }
function fmOn(id) { return (S.fm || []).filter(function (m) { return !m.void && (!id || m.h === id); }); }
function fBal(id, cur) { return r2(fmOn(id).reduce(function (a, m) { return m.cur !== cur ? a : a + (m.dir === 'in' ? m.amt : -m.amt); }, 0)); }
function fSum(id, cur, dir) { return r2(fmOn(id).reduce(function (a, m) { return a + (m.cur === cur && m.dir === dir && !m.x ? m.amt : 0); }, 0)); }
function fXnet(id, cur) { return r2(fmOn(id).reduce(function (a, m) { return a + (m.cur === cur && m.x ? (m.dir === 'in' ? m.amt : -m.amt) : 0); }, 0)); }
function fMonth(id, cur, dir, ym) { return r2(fmOn(id).reduce(function (a, m) { return a + (m.cur === cur && m.dir === dir && !m.x && String(m.date).slice(0, 7) === ym ? m.amt : 0); }, 0)); }
/* إجمالي الوارد أو الناقص بكل أنواعه (التحويلات من الأرصدة الأخرى وإليها داخلة فيه) لعرض رقم واحد في البطاقة العلوية */
function fGross(id, cur, dir, ym) { return r2(fmOn(id).reduce(function (a, m) { return a + (m.cur === cur && m.dir === dir && (!ym || String(m.date).slice(0, 7) === ym) ? m.amt : 0); }, 0)); }
function fTot(cur) { return r2(funds().reduce(function (a, f) { return a + fBal(f.id, cur); }, 0)); }
function usdTxt(n) { var v = r2(Math.abs(n)), p = v.toFixed(2).replace(/\.00$/, '').split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return (n < 0 ? '‎-' : '') + p.join('.') + ' $'; }
function usdK(n) { return usdTxt(r2(n)); }
function fTxt(cur, n) { return cur === 'usd' ? usdTxt(n) : money(n); }
function hasCur(f, c) { return f.curs.indexOf(c) >= 0; }
function fMain(f) { return f.curs[0]; }
/* العملة الافتراضية في نوافذ الإدخال: الشيكل إن وُجد في الرصيد */
/* مصدر الصرف الافتراضي في كل نوافذ الدفع: الشيكل إن وُجد في الرصيد، والدولار خيار يختاره المالك من القائمة (المالك 2026-11-18) */
function fDefSrc(f) { return f && hasCur(f, 'ils') ? 'ils' : 'usd'; }
function ensureSrc(f) { var d = fDefSrc(f); if (!A.form.src || (A.form.srcAuto && A.form.src === A.form.srcAuto)) { A.form.src = d; A.form.srcAuto = d; } return A.form.src; }
function fDefCur(f) { return f && f.curs.indexOf('ils') >= 0 ? 'ils' : f.curs[0]; }
/* اسم الرصيد للعرض: إن طابق اسمَ عامل يُضاف «(رصيد)» حتى لا يُلتبس بالعامل */
/* لون هوية كل رصيد على اسمه فقط (بلا تغيير قياسات): بنك فلسطين أحمر عنابي، بايننس ذهبي */
function fColor(f) { var n = f ? f.name || '' : ''; return /بنك/.test(n) ? '#B3202A' : /باين/.test(n) ? '#A87B00' : ''; }
function fName(f) { return (S.workers || []).some(function (w) { return !w.arch && w.name === f.name; }) ? f.name + ' (رصيد)' : f.name; }
/* الرصيد كاملًا بكل عملاته (الدولار والشيكل معًا) حيث يُختار رصيد أو يُعرض */
function fBalAll(f) { return f.curs.map(function (c) { return fTxt(c, fBal(f.id, c)); }).join(' · '); }
function fBalTxt(f) { return fTxt(fMain(f), fBal(f.id, fMain(f))); }
function fKind(f) { var w = f.w ? wk(f.w) : null; return f.w || f.curs.length === 1 && fMain(f) === 'ils' ? (w ? 'عند ' + w.name + ' · شيكل' : 'شيكل') : f.curs.length > 1 ? 'دولار وشيكل' : 'دولار'; }
function lastRate() { var l = movesDesc((S.fm || []).filter(function (m) { return m.rate > 0 && !m.void; }))[0]; return l ? l.rate : 0; }
function openMove(fid, dir) { openSh({ t: 'fMove' }, { fund: fid || defFund(), dir: dir || 'out', dlock: dir ? '1' : '', mode: '', amt: '', rate: '', note: '', cat: '', dtxt: today() }); }
/* صف حركة موحَّد في كل مكان؛ withFund يُظهر من أي رصيد */
/* نوع الحركة (راتب، سلفة، مكافأة...) غمامة ملوّنة قبل البيان، فلا يُقرأ كأنه جزء من اسم الشخص: «سلفة» + «حمود المجايدة» */
/* في كشف الحساب والقوائم المالية كل الأنواع بلون غمامة واحد (رمادي): التلوين حسب المعنى مكانه أقسام العمال فقط */
function moveParts(m) {
  var n = m.note || '', mm = /^(راتب|سلفة|مكافأة|إضافة|دفعة نقدية|دفعة|تسوية|خصم|مخالفة|شراء للمطبخ)\s+(.+)$/.exec(n);
  return mm ? { kind: mm[1], tone: 'mute', title: mm[2] } : { kind: '', tone: 'mute', title: n || (m.dir === 'in' ? 'وارد' : 'ناقص') };
}
function moveRowX(m, withFund, mini) {
  var mp = moveParts(m);
  var conv = m.cur === 'usd' && m.ils > 0, f0 = fund(m.h);
  return X({ mini: !!mini, ph: !!m.ph, icon: mini ? '' : m.x ? 'i-send' : m.dir === 'in' ? 'i-plus' : 'i-minus', icTone: m.x ? 'info' : m.dir === 'in' ? 'ok' : 'bad', title: mp.title,
    subPre: withFund && f0 ? fName(f0) : '', subPreFg: fColor(f0), sub: joinSub(dlabel(m.date), mini && conv ? usdTxt(m.amt) : ''),
    end: sg(m.dir, conv ? money(m.ils) : fTxt(m.cur, m.amt)), endSub: mini ? '' : conv ? usdTxt(m.amt) : '', tag: m.x ? 'تحويل' : mp.kind, tagTone: m.x ? 'info' : mp.tone, endTone: m.dir === 'in' ? 'ok' : 'bad', chev: true, go: function () { openSh({ t: 'fView', id: m.id }); }, lp: function () { moveQa(m); } });
}
function recentMoves(n, fid) { return movesDesc(fmOn(fid)).slice(0, n); }
/* أرصدة الصندوق بالعملتين بحجم واحد */
function fBalEq(f) { var x = { end: fBalTxt(f) }; if (f.curs.length > 1) { x.endSub = fTxt(f.curs[1], fBal(f.id, f.curs[1])); x.endEq = true; } return x; }
function todayMoney() { var t = today(), ms = fmOn().filter(function (m) { return m.date === t && !m.x; }); return ms.length; }
function defFund() { var l = fund(S.settings.lastFund); if (l && !l.arch) return l.id; var c = funds().filter(function (f) { return !hasCur(f, 'usd'); })[0]; return (c || funds()[0] || {}).id; }
function dayBack(n) { return iso(new Date(Date.now() - 864e5 * (+n || 0))); }
function movesDesc(list) { return list.map(function (m, i) { return { m: m, i: i }; }).sort(function (a, b) { return a.m.date < b.m.date ? 1 : a.m.date > b.m.date ? -1 : b.i - a.i; }).map(function (o) { return o.m; }); }
function moreRow(n, go) { return X({ more: true, icon: 'i-chevD', icTone: 'mute', title: 'عرض ' + n + ' أخرى', sub: 'الأحدث أولًا', chev: false, go: go }); }
function mid(list, p) { return newId(p, list); }

/* خطة الصرف من رصيد: من الشيكل إن كفى، وإلا من الدولار بسعر الصرف */
function payPlan(f, ils, rate) {
  if (!f || !(ils > 0)) return { ok: false, txt: '' };
  var src = fv('src') || fDefSrc(f);
  if (hasCur(f, 'ils') && (!hasCur(f, 'usd') || src === 'ils')) {
    var b = fBal(f.id, 'ils'); return { ok: true, cur: 'ils', amt: ils, ils: 0, rate: 0, txt: 'يُخصم ' + money(ils) + ' من رصيد الشيكل' + (b < ils ? ' (يصير سالبًا، والأفضل الصرف من الدولار بسعر الصرف)' : '') };
  }
  if (hasCur(f, 'usd')) {
    if (!(rate > 0)) return { ok: false, txt: 'أدخل سعر الصرف' };
    var u = r2(ils / rate); return { ok: true, cur: 'usd', amt: u, ils: ils, rate: rate, txt: 'يُخصم ' + usdTxt(u) + ' من الدولار بسعر ' + rate };
  }
  return { ok: false, txt: '' };
}
function fundFields() {
  if (!A.form.fund) A.form.fund = defFund(); ensureSrc(fund(A.form.fund));
  var f = fund(fv('fund')), fl = [fSelect('fund', 'من أي رصيد؟', funds().map(function (x) { return [x.id, fName(x) + ' · ' + fBalAll(x)]; }), fv('fund'))];
  if (f && f.curs.length > 1) fl.push(fChips('src', 'يُصرف من', [['ils', 'رصيد الشيكل'], ['usd', 'الدولار بسعر الصرف']]));
  if (f && hasCur(f, 'usd') && (fv('src') || fDefSrc(f)) === 'usd') { if (fv('rate') === '' && lastRate()) A.form.rate = String(lastRate()); fl.push(fText('rate', 'سعر الصرف (شيكل لكل دولار)', '3.2', 'decimal', 'ما يقابل المبلغ يُخصم من الدولار')); }
  return fl;
}
function payFund(fid, w, ils, note, kind, rate, wl, date) {
  var f = fund(fid), pl_ = payPlan(f, ils, rate); if (!pl_.ok) return;
  S.settings.lastFund = fid;
  S.fm.push({ id: mid(S.fm, 'm'), date: date || today(), h: fid, dir: 'out', cur: pl_.cur, amt: pl_.amt, ils: pl_.ils, rate: pl_.rate, note: (kind || 'راتب') + ' ' + w.name + (note ? ' — ' + note : ''), w: w.id, wl: wl || null, wils: ils });
}


/* ---------- الأرصدة ---------- */
function pgFunds() {
  var bl = [], L = funds(), ff = A.fFeed && fund(A.fFeed) ? A.fFeed : '', n = A.fN || 8;
  if (ff) bl.push(fundBig(fund(ff), 'رصيد ' + fName(fund(ff))));
  else bl.push(B('kpi', { items: [
    X({ label: 'الدولار', value: usdK(fTot('usd')), sub: 'في كل الأرصدة' }),
    X({ label: 'الشيكل', value: money(fTot('ils')), sub: 'في كل الأرصدة' })
  ] }));
  /* وارد وناقص في سطر وحدهما يتقاسمان العرض (الأهم)، وبقية الإجراءات في سطر كامل تحتهما */
  bl.push(B('btns', { items: [
    X({ label: 'وارد', icon: 'i-plus', on: true, selTone: 'ok', go: function () { openMove(ff || '', 'in'); } }),
    X({ label: 'ناقص', icon: 'i-minus', on: true, selTone: 'bad', go: function () { openMove(ff || '', 'out'); } })] }));
  bl.push(B('acts', { items: [
    X({ title: 'تحويل', icon: 'i-send', go: function () { openSh({ t: 'fXfer' }, { from: ff || defFund(), to: '', cur: '', amt: '', got: '', dtxt: today() }); } }),
    X({ title: 'جرد', icon: 'i-check', go: function () { openSh({ t: 'fCount', f: ff || defFund() }, { cur: '', cnt: '' }); } }),
    X({ title: 'الملخص', icon: 'i-list', go: function () { setState({ fsm: today().slice(0, 7) }); open('finsum'); } }),
    X({ title: 'كشف حسابنا', icon: 'i-ledger', go: function () { ownOpen(); } })] }));
  /* آخر الحركات أولًا: للتأكد أنها سُجّلت، ومن أي رصيد */
  var all = movesDesc(fmOn(ff)), items = all.slice(0, n).map(function (m) { return moveRowX(m, !ff, true); });
  if (all.length > n) items.push(moreRow(Math.min(25, all.length - n), function () { setState({ fN: n + 25 }); }));
  if (L.length > 1) bl.push(B('seg', { items: [X({ label: 'الكل', on: !ff, go: function () { setState({ fFeed: '', fN: 8 }); } })].concat(L.map(function (f) { return X({ label: f.name, on: ff === f.id, go: function () { setState({ fFeed: f.id, fN: 8 }); } }); })) }));
  bl.push(B('rows', { title: 'آخر الحركات', all: true, items: items, empty: 'لا حركات بعد' }));
  bl.push(B('rows', { title: 'الأرصدة', act: 'رصيد', actGo: function () { openSh({ t: 'fAdd' }, {}); }, items: L.map(function (f) {
    return X(Object.assign({ icon: f.w ? 'i-users' : 'i-wallet', icTone: f.w ? 'info' : 'ok', title: f.name, sub: fKind(f), chev: true, go: function () { open('fund', { fid: f.id }); } }, fBalEq(f), !fBal(f.id, fMain(f)) && !(f.curs.length > 1 && fBal(f.id, f.curs[1])) ? { endTone: 'mute' } : {}));
  }), empty: 'لا أرصدة بعد' }));
  bl.push(B('kpi', { items: [X({ label: 'مستحق لك', value: money(oweInst()), sub: 'من المؤسسات', go: function () { openSh({ t: 'kOweI' }); } }), X({ label: 'عليك', value: money(oweWork()), sub: 'للعمال', go: function () { openSh({ t: 'kOweW' }); } })] }));
  return bl;
}

/* تفاصيل الرصيد الواحد (الرصيد والوارد والناقص والشهر): واحدة لصفحة الرصيد ولأعلى صفحة الأرصدة عند اختياره */
function fundBig(f, label) {
  var last = movesDesc(fmOn(f.id))[0], ym = today().slice(0, 7);
  var mon = f.curs.map(function (c) { var i = fGross(f.id, c, 'in', ym), o = fGross(f.id, c, 'out', ym); return i || o ? 'هذا الشهر: وارد ' + fTxt(c, i) + ' · ناقص ' + fTxt(c, o) : ''; }).filter(Boolean);
  var v2 = f.curs.length > 1 ? fBal(f.id, f.curs[1]) : 0;
  return B('big', { label: label || 'الرصيد', value: fBalTxt(f), value2: v2 ? fTxt(f.curs[1], v2) : '', text: mon.concat([last ? 'آخر حركة: ' + dlabel(last.date) + ' · ' + (last.note || '') : 'لا حركات بعد']).join('\n') });
}
function pgFund() {
  var f = fund(A.fid), bl = [], all = movesDesc(fmOn(f.id)), flt = A.fF || 'all', last = all[0], c0 = fMain(f);
  bl.push(fundBig(f));
  bl.push(B('btns', { items: [
    X({ label: 'وارد', icon: 'i-plus', on: true, selTone: 'ok', go: function () { openMove(f.id, 'in'); } }),
    X({ label: 'ناقص', icon: 'i-minus', on: true, selTone: 'bad', go: function () { openMove(f.id, 'out'); } })] }));
  bl.push(B('acts', { items: [
    X({ title: 'تحويل', icon: 'i-send', go: function () { openSh({ t: 'fXfer' }, { from: f.id, to: '', cur: '', amt: '', got: '', dtxt: today() }); } }),
    X({ title: 'جرد', icon: 'i-check', go: function () { openSh({ t: 'fCount', f: f.id }, { cur: '', cnt: '' }); } })] }));
  bl.push(B('seg', { items: [['all', 'الكل'], ['in', 'وارد'], ['out', 'ناقص']].map(function (a) {
    return X({ label: a[1], on: flt === a[0], go: function () { setState({ fF: a[0], fN: 25 }); } });
  }) }));
  var rows = all.filter(function (m) { return flt === 'all' || m.dir === flt; }), n = A.fN || 25;
  var items = rows.slice(0, n).map(function (m) { return moveRowX(m, false); });
  if (rows.length > n) items.push(moreRow(Math.min(25, rows.length - n), function () { setState({ fN: n + 25 }); }));
  bl.push(B('rows', { title: 'الحركات (' + rows.length + ')', all: true, items: items, empty: 'لا حركات بعد' }));
  var vm = voidedMoves(f.id); if (vm.length) bl.push(B('rows', { title: 'ملغاة (' + vm.length + ')', items: vm.map(voidedRow) }));
  return bl;
}

/* ---------- الإجراءات ---------- */
function modesOf(f, dir) {
  if (f.curs.length === 1) return [[f.curs[0], f.curs[0] === 'usd' ? 'دولار' : 'شيكل']];
  return dir === 'out' ? [['ils', 'شيكل'], ['conv', 'من الدولار'], ['usd', 'دولار']] : [['ils', 'شيكل'], ['usd', 'دولار']];
}
function doMove() {
  var dir = fv('dir') || 'out', f = fund(fv('fund')), ms0 = modesOf(f, dir), md = ms0.some(function (x) { return x[0] === fv('mode'); }) ? fv('mode') : ms0[0][0], a = num('amt'), rt = num('rate'), note = cleanNote(fv('note')), m = { id: mid(S.fm, 'm'), date: moveDate(), h: f.id, dir: dir, note: note }; if (fv('cat')) m.cat = fv('cat'); phTag(m, phTake());
  if (md === 'conv') { m.cur = 'usd'; m.ils = a; m.rate = rt; m.amt = r2(a / rt); } else { m.cur = md; m.amt = a; m.ils = 0; m.rate = 0; }
  S.fm.push(m); S.settings.lastFund = f.id; shut();
  mutated((dir === 'in' ? 'سُجّل وارد ' : 'سُجّل ناقص ') + (md === 'conv' ? money(a) : fTxt(md, a)) + ' — ' + f.name);
}
function doXfer() {
  var f = fund(fv('from')), t = fund(fv('to')), cur = fv('cur') || fDefCur(f), a = num('amt'), dc = hasCur(t, cur) ? cur : fMain(t), got = num('got') || (dc === cur ? a : 0), d = moveDate();
  var o = { id: mid(S.fm, 'm'), date: d, h: f.id, dir: 'out', cur: cur, amt: a, ils: 0, rate: 0, note: 'تحويل إلى ' + t.name, x: true };
  if (cur === 'usd' && dc === 'ils') { o.ils = got; o.rate = r3(got / a); }
  phTag(o, phTake()); S.fm.push(o);
  var i2 = { id: mid(S.fm, 'm'), date: d, h: t.id, dir: 'in', cur: dc, amt: got, ils: 0, rate: 0, note: 'تحويل من ' + f.name + (dc === cur && got < a ? ' · وصل ' + fTxt(cur, got) + ' من ' + fTxt(cur, a) : ''), x: true, pair: o.id };
  o.pair = i2.id; S.fm.push(i2);
  shut(); mutated('حُوّل ' + fTxt(cur, a) + ' من «' + f.name + '» إلى «' + t.name + '»');
}
/* تحويل إلى رصيد: دفعة سجّلها غيري من رصيده (حميدا) قصدها تحويل إلى رصيد عندي؛ حسابه كما هو (الحركة تبقى ناقصًا من رصيده) وتُعلَّم تحويلًا وتدخل الرصيد المقصود وارد (المالك 2026-11-24). يُعاد بـ«إلغاء كتحويل» فيُلغى الطرف الداخل فقط */
function xtOk(m) { return !!m && !m.void && !m.x && !m.w && m.dir === 'out'; }
function xtTargets(m) { return funds().filter(function (f) { return f.id !== m.h && hasCur(f, m.cur); }); }
function doMarkXfer(id, tid) {
  var m = E.by(S.fm, id), t = fund(tid), f = fund(m.h); if (!xtOk(m) || !t) return;
  var i2 = { id: mid(S.fm, 'm'), date: m.date, h: t.id, dir: 'in', cur: m.cur, amt: m.amt, ils: 0, rate: 0, note: 'تحويل من ' + f.name + (m.note ? ' · ' + m.note : ''), x: true, xl: true, pair: m.id }, was = m.cat;
  S.fm.push(i2); m.x = true; m.xl = true; m.pair = i2.id; if (was) { m.catWas = was; delete m.cat; }
  audit('تحويل لرصيد «' + t.name + '»: ' + fTxt(m.cur, m.amt) + ' من «' + f.name + '»'); shut();
  mutated('حُوّلت إلى «' + t.name + '» وبقي حساب «' + f.name + '» كما هو', function () { S.fm = S.fm.filter(function (x) { return x.id !== i2.id; }); m.x = false; delete m.xl; delete m.pair; if (m.catWas) { m.cat = m.catWas; delete m.catWas; } save(); render(); });
}
function doUnmarkXfer(id) {
  var m = E.by(S.fm, id), p = m && m.pair ? E.by(S.fm, m.pair) : null; if (!m || !m.xl) return;
  m.x = false; delete m.xl; delete m.pair; if (m.catWas) { m.cat = m.catWas; delete m.catWas; } if (p) p.void = true;
  audit('إلغاء تعليم التحويل على «' + (m.note || '') + '»'); shut();
  mutated('أُلغي التحويل وبقيت الحركة ناقصًا من رصيدها', function () { m.x = true; m.xl = true; if (p) { m.pair = p.id; p.void = false; } save(); render(); });
}
function voidMove(id) {
  var m = E.by(S.fm, id); if (!m) return;
  var all = [m], rev = null;
  if (m.pair) { var p2 = E.by(S.fm, m.pair); if (p2 && !p2.void) all.push(p2); } // طرفا التحويل يُلغيان معًا
  all.forEach(function (x) { x.void = true; });
  if (m.w && m.wl) rev = E.wEntry(S, { date: today(), w: m.w, kind: 'add', amt: m.wils || (m.cur === 'ils' ? m.amt : m.ils), note: 'إلغاء دفعة: ' + m.note }); // تُعاد الدفعة إلى حساب العامل
  shut(); mutated(rev ? 'أُلغيت الدفعة وأُعيدت إلى حساب العامل' : all.length > 1 ? 'أُلغي التحويل بطرفيه' : 'أُلغيت الحركة وبقي سجلها', function () {
    all.forEach(function (x) { x.void = false; }); if (rev) S.wl = S.wl.filter(function (e) { return e.id !== rev.id; }); save(); render();
  });
}
function voidedMoves(fid) { return movesDesc((S.fm || []).filter(function (m) { return m.h === fid && m.void && !m.edTo && !m.rsTo; })); }
function restoreMove(id) {
  var m = E.by(S.fm, id); if (!m || !m.void) return;
  var all = [m], rev = null;
  if (m.pair) { var p2 = E.by(S.fm, m.pair); if (p2 && p2.void) all.push(p2); }
  if (m.w && m.wl) { rev = wlOn().filter(function (e) { return e.w === m.w && e.kind === 'add' && e.note === 'إلغاء دفعة: ' + m.note; }).slice(-1)[0] || null; }
  all.forEach(function (x) { x.void = false; }); if (rev) rev.void = true;
  audit('استرجاع حركة «' + (m.note || '') + '»'); shut();
  mutated(rev ? 'أُعيدت الدفعة وخُصمت من حساب العامل' : 'أُعيدت الحركة إلى الرصيد', function () { all.forEach(function (x) { x.void = true; }); if (rev) rev.void = false; save(); render(); });
}
function voidedRow(m) {
  var mp = moveParts(m), conv = m.cur === 'usd' && m.ils > 0;
  return X({ dim: true, icon: m.x ? 'i-send' : m.dir === 'in' ? 'i-plus' : 'i-minus', icTone: 'mute', title: mp.title, tag: mp.kind, tagTone: mp.tone, sub: dlabel(m.date) + ' · ملغاة', end: sg(m.dir, conv ? money(m.ils) : fTxt(m.cur, m.amt)), chev: true, go: function () { openSh({ t: 'fView', id: m.id }); }, undo: function () { restoreMove(m.id); } });
}
/* تغيير مصدر الصرف لحركة ناقص: من رصيد الشيكل إلى الدولار بسعر صرف (أو العكس). الأصل يُلغى ويبقى سجله، وتُضاف حركة بديلة بالتاريخ نفسه وبالارتباط نفسه بحساب العامل */
function reSrcOk(m) { var f = m && fund(m.h); return !!f && !m.void && !m.x && m.dir === 'out' && f.curs.length > 1; }
function doReSource(id) {
  var m = E.by(S.fm, id), rt = num('rate'), toUsd = m.cur === 'ils', ils = toUsd ? m.amt : m.ils;
  if (toUsd && !(rt > 0)) return;
  var n = Object.assign({}, m, { id: mid(S.fm, 'm'), void: false, rs: m.id });
  if (toUsd) { n.cur = 'usd'; n.amt = r2(ils / rt); n.ils = ils; n.rate = rt; } else { n.cur = 'ils'; n.amt = ils; n.ils = 0; n.rate = 0; }
  n.wils = m.wils || ils; m.void = true; m.rsTo = n.id; S.fm.push(n);
  audit('تغيير مصدر صرف «' + m.note + '» من ' + (toUsd ? 'رصيد الشيكل إلى الدولار بسعر ' + rt : 'الدولار إلى رصيد الشيكل'));
  shut(); mutated(toUsd ? 'صار الخصم ' + usdTxt(n.amt) + ' من الدولار، وعاد رصيد الشيكل' : 'صار الخصم من رصيد الشيكل', function () { m.void = false; delete m.rsTo; S.fm = S.fm.filter(function (x) { return x.id !== n.id; }); save(); render(); });
}
function doFundAdd(name, wid) {
  var id = mid(S.funds, 'f'); S.funds.push({ id: id, name: name, curs: ['ils'], w: wid || null }); shut(); mutated('أُضيف الرصيد «' + name + '»');
}

/* ---------- نوافذ المال ---------- */
var DAYS3 = [['0', 'اليوم'], ['1', 'أمس'], ['2', 'قبل يومين']];
function moneySheet(sh) {
  var R, m, f;
  switch (sh.t) {
    case 'fMove': {
      var dir = fv('dir') || 'out'; if (!fv('dir')) A.form.dir = dir; var fo0 = fund(fv('fund')) || fund(defFund()); if (!fund(fv('fund'))) A.form.fund = fo0.id; f = fo0;
      var ms = modesOf(f, dir), md = ms.some(function (x) { return x[0] === fv('mode'); }) ? fv('mode') : ms[0][0], a = num('amt'), rt = num('rate'), fl = [];
      var cl = (dir === 'in' ? CATS_IN : CATS_OUT).map(function (c) { return c[0]; }); if (fv('cat') && cl.indexOf(fv('cat')) < 0) A.form.cat = '';
      if (!fv('dlock')) fl.push(fSeg('dir', '', [['out', 'ناقص (صرف)', 'bad'], ['in', 'وارد (دخل)', 'ok']]));
      fl.push(fSelect('fund', dir === 'in' ? 'إلى أي رصيد' : 'من أي رصيد', funds().map(function (x) { return [x.id, fName(x) + ' · ' + fBalAll(x)]; }), fv('fund')));
      if (ms.length > 1) { A.form.mode = md; fl.push(ms.length <= 3 ? fSeg('mode', 'العملة', ms) : fSelect('mode', 'العملة', ms, md)); }
      fl.push(fPair('amt', md === 'usd' ? 'المبلغ $' : 'المبلغ ₪', 'note', 'البيان', dir === 'in' ? 'مثال: مبيعات، إيداع' : 'مثال: كارة، نقل، كهرباء'));
      if (md === 'conv') { if (fv('rate') === '' && lastRate()) A.form.rate = String(lastRate()); fl.push(fText('rate', 'سعر الصرف (شيكل لكل دولار)', '3.2', 'decimal', 'ما يقابل المبلغ يُخصم من الدولار')); }
      fl.push(catChips(dir)); fl = fl.concat(dayFields()); fl.push(fPhoto('صورة الوصل أو السند (اختياري)'));
      var usd = md === 'conv' && a > 0 && rt > 0 ? r2(a / rt) : 0, cur = md === 'conv' ? 'usd' : md, delta = md === 'conv' ? usd : a, after = r2(fBal(f.id, cur) + (dir === 'in' ? delta : -delta));
      R = { tone: dir, title: fv('dlock') ? (dir === 'in' ? 'وارد جديد' : 'ناقص جديد (صرف)') : 'حركة جديدة', sub: (dir === 'in' ? 'إلى ' : 'من ') + f.name + ' · الرصيد الآن: ' + fBalAll(f), fields: fl,
        note: a > 0 && (md !== 'conv' || usd > 0) ? { text: (md === 'conv' ? 'يُخصم ' + usdTxt(usd) + '. ' : '') + 'الرصيد بعد الحركة: ' + fTxt(cur, after), tone: after < 0 ? 'warn' : 'info' } : null,
        ft: { label: (dir === 'in' ? 'تسجيل وارد' : 'تسجيل ناقص') + (a > 0 ? ' ' + fTxt(cur, delta) : ''), ok: a > 0 && cleanNote(fv('note')).length > 0 && (md !== 'conv' || rt > 0) && dayOk(), go: doMove } };
      break;
    }
    case 'fXfer': {
      var fo = fund(fv('from')), to = fund(fv('to')), opts = funds().map(function (x) { return [x.id, x.name]; }), fl2 = [fSelect('from', 'من رصيد', opts, fv('from')), fSelect('to', 'إلى رصيد', opts.filter(function (o) { return o[0] !== fv('from'); }), fv('to'))];
      var cu = fv('cur') || (fo ? fDefCur(fo) : 'ils'), am = num('amt'), dc = to ? (hasCur(to, cu) ? cu : fMain(to)) : cu, diff = dc !== cu;
      if (fo && fo.curs.length > 1) { A.form.cur = cu; fl2.push(fSeg('cur', 'العملة المرسلة', fo.curs.map(function (c) { return [c, c === 'usd' ? 'دولار' : 'شيكل']; }))); }
      if (to) fl2.push(fPair('amt', cu === 'usd' ? 'المرسل $' : 'المرسل ₪', 'got', (dc === 'usd' ? 'الواصل $' : 'الواصل ₪') + (diff ? '' : ' (اختياري)'), '', true));
      else fl2.push(fText('amt', cu === 'usd' ? 'المبلغ $' : 'المبلغ ₪', '0', 'decimal'));
      fl2 = fl2.concat(dayFields()); fl2.push(fPhoto('صورة الوصل (اختياري)'));
      var gt = num('got') || (diff ? 0 : am), fee = diff ? 0 : r2(am - gt);
      R = { title: 'تحويل بين الأرصدة', sub: fo ? fo.name + ' · ' + fBalAll(fo) : 'اختر الرصيدين', fields: fl2,
        note: fo && to && am > 0 && gt > 0 ? { text: diff ? 'سعر الصرف ' + r3(gt / am) + '. «' + fo.name + '» بعدها ' + fTxt(cu, r2(fBal(fo.id, cu) - am)) : (fee > 0 ? 'سيصل ' + fTxt(cu, gt) + ' من ' + fTxt(cu, am) + '. ' : '') + '«' + fo.name + '» بعدها ' + fTxt(cu, r2(fBal(fo.id, cu) - am)), tone: fBal(fo.id, cu) - am < 0 || fee < 0 ? 'warn' : 'info' } : null,
        ft: { label: 'تحويل', ok: !!fo && !!to && fo.id !== to.id && am > 0 && gt > 0 && fee >= 0 && dayOk(), go: doXfer } };
      break;
    }
    case 'fAdd': {
      var have = funds().filter(function (x) { return x.w; }).map(function (x) { return x.w; }), ws = activeW().filter(function (w) { return have.indexOf(w.id) < 0; });
      R = pickOr(ws.map(function (w) { return { id: w.id, name: w.name, sub: 'عامل · المال يبقى عنده' }; }), { title: 'رصيد جديد', sub: 'مال يبقى عند عامل أو عند أي شخص', plural: 'العمال', addLabel: 'رصيد باسم', sel: '',
        onPick: function (id) { doFundAdd(wk(id).name, id); }, onAdd: function (nm) { doFundAdd(nm, null); } });
      break;
    }
    case 'fView': {
      m = E.by(S.fm, sh.id); f = fund(m.h); var cv = m.cur === 'usd' && m.ils > 0;
      R = { title: m.note || (m.dir === 'in' ? 'وارد' : 'ناقص'), sub: (m.dir === 'in' ? 'إلى ' : 'من ') + f.name + ' · ' + dlong(m.date),
        acts: m.void ? (m.edTo || m.rsTo ? undefined : [X({ title: 'استرجاع', icon: 'i-check', go: function () { restoreMove(m.id); } })]) : (m.w && m.wl ? [X({ title: 'تعديل', icon: 'i-pencil', go: function () { openEditPay(m); } }), X({ title: 'البيان والتصنيف', icon: 'i-list', go: function () { openSh({ t: 'fEdit', id: m.id }, { amt: String(m.amt), note: m.note || '', cat: m.cat || '', rule: 'no', dir: m.dir, day: 'd', dtxt: m.date }); } })] : [X({ title: 'تعديل', icon: 'i-pencil', go: function () { var cv2 = m.cur === 'usd' && m.ils > 0; openSh({ t: 'fEdit', id: m.id }, { amt: String(cv2 ? m.ils : m.amt), note: m.note || '', cat: m.cat || '', rule: 'no', dir: m.dir, day: 'd', dtxt: m.date }); } })]),
        rows: [X({ title: 'التصنيف', sub: m.cat ? 'مختار' : 'مخمَّن من البيان', tag: catName(catOf(m)), tagTone: 'info' }), X({ title: 'المبلغ', sub: m.dir === 'in' ? 'وارد' : 'ناقص', tag: sg(m.dir, cv ? money(m.ils) : fTxt(m.cur, m.amt)), tagTone: m.dir === 'in' ? 'ok' : 'bad' }), cv ? X({ title: 'يقابله بالدولار', sub: 'سعر الصرف ' + m.rate, tag: usdTxt(m.amt), tagTone: 'mute' }) : null, m.w ? X({ title: wk(m.w).name, sub: 'دفعة من حساب العامل' }) : null].filter(Boolean),
        note: { text: m.void ? 'حركة ملغاة: بقيت في السجل ولا تُحتسب.' : m.w && m.wl ? 'دفعة مرتبطة بحساب العامل: إلغاؤها يُعيد المبلغ إلى حسابه.' : m.x ? 'جزء من تحويل بين رصيدين: يُلغى طرفاه معًا.' : 'الحركات لا تُحذف، والإلغاء يُبقيها في السجل.', tone: m.void || (m.w && m.wl) ? 'warn' : 'info' },
        ft: { label: 'إغلاق', ok: true, go: shut }, ft2: m.void ? null : { label: 'إلغاء الحركة', go: function () { voidMove(m.id); } } };
      if (m.ph) R.rows.push(phRow({ icon: 'i-image', icTone: 'ok', title: 'صورة الوصل', sub: 'اضغط لفتحها', tag: 'مرفقة', tagTone: 'ok' }, m, m.note || ''));
      else if (!m.void && !(reSrcOk(m) && fv('resrc') === '1')) {
        R.fields = [fPhoto('صورة الوصل أو السند (اختياري)')];
        if (fv('photo')) R.ft = { label: 'حفظ الصورة', ok: true, go: function () { var pid = phTake(); if (pid) { m.ph = pid; audit('أُرفقت صورة بحركة «' + (m.note || '') + '»'); } shut(); mutated('أُرفقت الصورة بالحركة'); } };
      }
      if (xtOk(m) && fv('resrc') !== '1' && fv('asx') !== '1') R.acts = (R.acts || []).concat([X({ title: 'تحويل إلى رصيد', icon: 'i-send', go: function () { fset('asx', '1'); } })]);
      if (m.xl && !m.void) R.acts = (R.acts || []).concat([X({ title: 'إلغاء كتحويل', icon: 'i-x', go: function () { doUnmarkXfer(m.id); } })]);
      if (xtOk(m) && fv('asx') === '1') {
        var xt = xtTargets(m), xv = fv('xto'), xf = fund(xv);
        R.fields = [fChips('xto', 'يصل إلى رصيد', xt.map(function (x) { return [x.id, x.name]; }))];
        R.note = { text: 'حساب «' + f.name + '» كما هو، وتُعلَّم الحركة تحويلًا ويدخل المبلغ ' + (xf ? 'رصيد «' + xf.name + '»' : 'الرصيد الذي تختاره') + ' وارد.' };
        R.ft = { label: xf ? 'تحويل إلى ' + xf.name : 'اختر الرصيد', ok: !!xf, go: function () { doMarkXfer(m.id, xv); } };
        R.ft2 = { label: 'رجوع', go: function () { fset('asx', ''); } };
      }
      /* تغيير مصدر الخصم (شيكل ↔ دولار) تصحيح نادر: يبقى مخفيًا خلف أيقونة ولا يُعرض سعر الصرف إلا إذا طلبه المستخدم */
      if (!m.void && reSrcOk(m) && fv('resrc') !== '1') { R.acts = (R.acts || []).concat([X({ title: m.cur === 'ils' ? 'خصم من الدولار' : 'إرجاع للشيكل', icon: 'i-wallet', go: function () { fset('resrc', '1'); } })]); }
      if (reSrcOk(m) && fv('resrc') === '1') {
        var toU = m.cur === 'ils', rt2 = num('rate');
        if (toU) { if (fv('rate') === '' && lastRate()) A.form.rate = String(lastRate()); R.fields = [fText('rate', 'سعر الصرف (شيكل لكل دولار)', '3.2', 'decimal', 'يُخصم ما يقابل ' + money(m.amt) + ' من الدولار، ويعود رصيد الشيكل.')]; }
        R.note = { text: toU ? (rt2 > 0 ? 'سيُخصم ' + usdTxt(r2(m.amt / rt2)) + ' من الدولار بدل ' + money(m.amt) + ' من الشيكل. الأصل يُلغى ويبقى سجله، والدفعة تبقى مرتبطة بحساب العامل.' : 'هذه الحركة خُصمت من رصيد الشيكل. أدخل سعر الصرف لتُخصم من الدولار بدلًا منه.') : 'يمكن إرجاع الخصم إلى رصيد الشيكل بدل الدولار.', tone: 'info' };
        R.ft = { label: toU ? 'الخصم من الدولار بهذا السعر' : 'إرجاع الخصم إلى رصيد الشيكل', ok: !toU || rt2 > 0, go: function () { doReSource(m.id); } };
        R.ft2 = { label: 'إلغاء الحركة', go: function () { voidMove(m.id); } };
      }
      break;
    }
  }
  return R;
}

/* ===== 02m2-sheetgw.js ===== */
/* ---------- بوابة الشيت: يرسل التطبيق حركات الأرصدة تلقائيًا إلى شيت «المطبخ $» (من التطبيق إلى الشيت فقط) ----------
   الشيت مرجع يستقبل: لا قراءة منه ولا تعديل لصف قديم. الإلغاء/التعديل يحذف الصف الخطأ من الشيت (لا صف عكس)، والاسترجاع يُرسَل صفًا جديدًا.
   رابط البوابة وكلمتها يخصان هذا الجهاز (مفاتيح sync* لا تُدمج مع الأجهزة الأخرى). تتبّع المُرسَل في S.settings.shSent: عدد العمليات المنفَّذة لكل حركة
   (1 = صف الحركة، 2 = صف إلغائها، 3 = استرجاعها، ...) فلا يتكرر إرسال، والبوابة نفسها ترفض التكرار بمعرّف «رقم#عدد». */
var GW_FROM = '2026-11-01', GW_BUSY = false, GW_T = null, GW_ERR = '', GW_PV = null, GW_PVBUSY = false; /* حدود العمل: من 1/11/2026 فصاعدًا (قرار المالك 2026-11-15): ما قبله لا يُستورد ولا يُرسل */
function gwOk() { return S.settings.gwOk === GW_FROM; } /* لا إرسال إلا بعد فحص واعتماد لهذا النطاق */
function gwUrl() { return String(S.settings.syncGwUrl || '').trim(); }
function gwSec(m) {
  var f = fund(m.h); if (!f) return '';
  if (f.w) return /حميدا/.test(f.name || '') ? 'ham' : ''; /* رصيد حميدا يطابق تبويب «رصيد مع حميدا»: حميدا نفسها تكتب فيه من تطبيقها، فالمزامنة هنا باتجاهين (إرسال ما ينقص الشيت + استيراد ما ينقص التطبيق) بقرار المالك 2026-11-18 */
  return m.cur === 'ils' ? 'ils' : f.name === 'بايننس' ? 'bin' : 'bank';
}
function gwRow(m, sec, n, rev, pre) {
  var dir = rev ? (m.dir === 'in' ? 'out' : 'in') : m.dir, a = r2(m.amt);
  return { id: m.id + '#' + n, sec: sec, d: n === 1 ? m.date : today(), i: dir === 'in' ? a : null, o: dir === 'out' ? a : null, t: m.ils > 0 ? r2(m.ils) : null, r: m.rate > 0 ? m.rate : null, n: pre + String(m.note || '').replace(/[\t\r\n]+/g, ' ').trim() };
}
function gwNote(m) { return String(m.note || '').replace(/[\t\r\n]+/g, ' ').trim(); }
function gwDel(m, sec, st, id, part) { /* عملية حذف: يطابق الصف المكتوب سابقًا (التاريخ + المبلغ + الاتجاه + البيان) فيزيله من قسمه */
  var a = r2(m.amt); return { id: typeof id === 'string' ? id : m.id + '#' + id, del: 1, part: part || 'del', mv: m.id, sec: sec, d: st === 1 ? m.date : null, i: m.dir === 'in' ? a : null, o: m.dir === 'out' ? a : null, n: (st > 1 ? 'استرجاع: ' : '') + gwNote(m) };
}
function gwOps() {
  var sent = S.settings.shSent = S.settings.shSent || {}, ops = [];
  (S.fm || []).forEach(function (m) {
    var sec = gwSec(m); if (!sec) return;
    var st = +sent[m.id] || 0, odd = st % 2 === 1;
    if (m.void) { /* الإلغاء/التعديل = حذف الصف الخطأ من الشيت لا صف عكس (المالك 2026-11-19: «بدي تنحذف») */
      if (odd) ops.push(gwDel(m, sec, st, st + 1));
      else if (st === 2 && !m.gwDel && !m.gwIn && m.date >= GW_FROM) { ops.push(gwDel(m, sec, 1, m.id + '#x1', 'x1')); ops.push(Object.assign(gwDel(m, sec, 1, m.id + '#x2', 'x2'), { d: null, n: 'إلغاء: ' + gwNote(m), i: m.dir === 'in' ? null : r2(m.amt), o: m.dir === 'in' ? r2(m.amt) : null })); } /* بقايا صف العكس القديم: يُحذف هو وأصله */
    }
    else if (!odd && !(st === 0 && m.date < GW_FROM)) ops.push(gwRow(m, sec, st + 1, false, st ? 'استرجاع: ' : ''));
  });
  return ops;
}
function gwHamFund() { return (S.funds || []).filter(function (f) { return f.w && /حميدا/.test(f.name || ''); })[0] || null; }
function gwImport(rows) { /* صفوف الشيت التي ليست في التطبيق (من تطبيق حميدا): تُضاف حركات بعلامة gwIn وتُعلَّم مُرسَلة فلا تعود إلى الشيت */
  var f = gwHamFund(), sent = S.settings.shSent = S.settings.shSent || {}, n = 0; if (!f) return 0;
  rows.forEach(function (r) { var a = r2(r.i || r.o || 0); if (!r.d || !(a > 0)) return;
    var m = { id: mid(S.fm, 'm'), date: r.d, h: f.id, dir: r.i ? 'in' : 'out', cur: 'ils', amt: a, ils: 0, rate: 0, note: String(r.n || '').trim(), gwIn: 1 };
    S.fm.push(m); sent[m.id] = 1; n++; });
  return n;
}
function gwPost(body) {
  return fetch(gwUrl(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ key: S.settings.syncGwKey || '' }, body)) })
    .then(function (r) { return r.json(); }).then(function (j) { if (!j || !j.ok) throw new Error((j && j.err) || 'رفضت البوابة الطلب'); return j; });
}
/* حركات حميدا لا تُرسَل قبل مطابقتها بالشيت: حميدا قد تكون كتبتها عندها (التحويل والراتب مثلًا)، فتُعلَّم مُرسَلة بدل أن تُكتب ثانيةً */
function gwSend() {
  if (!gwUrl() || GW_BUSY || !gwOk()) return Promise.resolve();
  if (!gwOps().some(function (o) { return o.sec === 'ham'; })) return gwSend2(true);
  return gwHamPull(true).then(function (ok) { return gwSend2(!!ok); });
}
function gwSend2(hamOk) {
  if (!gwUrl() || GW_BUSY || !gwOk()) return Promise.resolve();
  var ops = gwOps().filter(function (o) { return hamOk || o.sec !== 'ham'; }); if (!ops.length) return Promise.resolve();
  var batch = ops.slice(0, 40); GW_BUSY = true;
  return gwPost({ rows: batch }).then(function (j) {
    var sent = S.settings.shSent, byId = {}; batch.forEach(function (o) { byId[o.id] = o; });
    (j.done || []).forEach(function (id) { if (!byId[id]) return; var k = id.lastIndexOf('#'), mid = id.slice(0, k), n = +id.slice(k + 1), mm = E.by(S.fm, mid); if (byId[id].del && mm && byId[id].part !== 'x1') mm.gwDel = 1; if (!isNaN(n) && (+sent[mid] || 0) === n - 1) sent[mid] = n; });
    S.settings.syncGwAt = Date.now(); GW_ERR = ''; GW_BUSY = false; save();
    if (ops.length > batch.length) return gwSend2(hamOk);
  }).catch(function (e) { GW_BUSY = false; GW_ERR = String((e && e.message) || e || 'تعذّر الاتصال'); try { render(); } catch (x) {} });
}
function gwKick() {
  if (!gwUrl() || !S.settings.syncGwAuto || !gwOk()) return;
  clearTimeout(GW_T); GW_T = setTimeout(function () { gwSend(); }, 2500);
  try { if (typeof waKick === 'function') waKick(); } catch (e) {}
}
/* رصيد حميدا تلقائيًا: كل ما يضيفه تطبيق حميدا في الشيت يدخل رصيد حميدا هنا، وما تحذفه من الشيت يُلغى هنا (الحركات المستوردة فقط، وسجلها يبقى) */
var GW_HB = false, GW_HAT = 0;
function gwHamPull(force) {
  if (!gwUrl() || !gwOk() || GW_HB || GW_BUSY || !gwHamFund() || (!force && Date.now() - GW_HAT < 120000)) return Promise.resolve(false);
  GW_HB = true; GW_HAT = Date.now();
  return gwPost({ list: { from: GW_FROM } }).then(function (j) {
    GW_HB = false; var L = (j.list || {}).ham; if (!j.list || !L) return false;
    var f = gwHamFund(), sent = S.settings.shSent = S.settings.shSent || {}, mv = (S.fm || []).filter(function (m) { return m.h === f.id && (!m.void || (+sent[m.id] || 0) % 2 === 1) && m.date >= GW_FROM; }), imp = [], ch = 0;
    L.forEach(function (r) { r.used = false; });
    var pend = []; /* حركات أُلغيت/عُدّلت وصفوفها (الأصل وصف العكس القديم) ما زالت في الشيت بانتظار الحذف: تحجز صفوفها فلا تُستورد ثانيةً كحركات مكررة (المالك 2026-11-19: ظهرت الحركة مرتين بعد تغيير الحساب) */
    (S.fm || []).forEach(function (m) { if (m.h !== f.id || !m.void || m.gwIn || m.date < GW_FROM) return; var st = +sent[m.id] || 0; if (st === 2 && !m.gwDel) { var r1 = gwFind(L, m, false); if (r1) r1.used = true; var r2_ = gwFind(L, { dir: m.dir === 'in' ? 'out' : 'in', amt: m.amt }, true); if (r2_) r2_.used = true; } });
    mv.filter(function (m) { return !m.gwIn; }).concat(mv.filter(function (m) { return m.gwIn; })).forEach(function (m) { m._r = gwFind(L, m, false); if (m._r) m._r.used = true; });
    L.forEach(function (r) { if (!r.used) imp.push(r); });
    mv.forEach(function (m) { var hit = !!m._r; delete m._r; if (hit && !m.gwIn && !(+sent[m.id] > 0)) { sent[m.id] = 1; ch++; } /* موجودة في الشيت (كتبتها حميدا): تُعلَّم مُرسَلة فلا تُكتب ثانيةً */ if (!hit && m.gwIn) { m.void = true; sent[m.id] = 2; ch++; } }); /* حذفتها حميدا من الشيت: تُلغى هنا ويبقى سجلها */
    ch += gwImport(imp);
    if (ch) { save(); try { render('morph'); } catch (e) {} }
    return true;
  }).catch(function () { GW_HB = false; return false; });
}
try { window.addEventListener('online', gwKick); document.addEventListener('visibilitychange', function () { if (!document.hidden) gwHamPull(); }); setTimeout(function () { try { gwHamPull(true); } catch (e) {} }, 9000); setTimeout(function () { try { gwKick(); } catch (e) {} }, 7000); } catch (e) {}

/* فحص قبل الإرسال (قراءة فقط): يقرأ صفوف الشيت من GW_FROM ويطابقها بحركات التطبيق (نفس القسم والتاريخ والمبلغ والاتجاه، كل صف مرة واحدة).
   ما وُجد في الشيت لا يُرسَل ثانيةً (يُعلَّم مُرسَلًا)، وما ليس فيه يُرسَل، وما في الشيت فقط يُعرض ولا يمسّه التطبيق. */
function gwEq(a, b) { return a !== null && a !== undefined && Math.abs(a - b) < 0.011; }
function gwFind(list, m, any) {
  var a = r2(m.amt), k = m.dir === 'in' ? 'i' : 'o';
  for (var i = 0; i < list.length; i++) { var r = list[i]; if (r.used) continue; if ((any || r.d === m.date) && gwEq(r[k], a)) return r; }
  return null;
}
function gwPreview() {
  if (!gwUrl() || GW_PVBUSY) return Promise.resolve(); GW_PVBUSY = true; GW_ERR = '';
  return gwPost({ list: { from: GW_FROM } }).then(function (j) {
    if (!j.list) throw new Error('كود البوابة قديم: الصق الكود الجديد في Apps Script وانشر إصدارًا جديدًا'); /* بلا قائمة الشيت لا يُفحص شيء ولا يُعدّ كل شيء ناقصًا */
    var L = j.list, sent = S.settings.shSent || {}, mv = [], pv = { match: [], send: [], only: [], imp: [], at: Date.now() };
    Object.keys(L).forEach(function (k) { (L[k] || []).forEach(function (r) { r.used = false; r.sec = k; }); });
    (S.fm || []).forEach(function (m) { var sec = gwSec(m); if (sec && m.date >= GW_FROM) mv.push({ m: m, sec: sec, st: +sent[m.id] || 0 }); });
    mv.filter(function (x) { return x.st > 0; }).forEach(function (x) { /* ما أرسله التطبيق سابقًا يستهلك صفّه كي لا يُعدّ «في الشيت فقط» */
      var r = gwFind(L[x.sec] || [], x.m, false) || gwFind(L[x.sec] || [], x.m, true); if (r) r.used = true;
      if (x.st >= 2) { var r2_ = gwFind(L[x.sec] || [], Object.assign({}, x.m, { dir: x.m.dir === 'in' ? 'out' : 'in' }), true); if (r2_) r2_.used = true; }
    });
    mv.filter(function (x) { return x.st === 0 && !x.m.void; }).forEach(function (x) {
      var r = gwFind(L[x.sec] || [], x.m, false);
      if (r) { r.used = true; pv.match.push({ m: x.m, sec: x.sec, row: r }); } else pv.send.push({ m: x.m, sec: x.sec });
    });
    Object.keys(L).forEach(function (k) { (L[k] || []).forEach(function (r) { if (r.used) return; (k === 'ham' && gwHamFund() ? pv.imp : pv.only).push(r); }); });
    GW_PV = pv; GW_PVBUSY = false; render();
  }).catch(function (e) { GW_PVBUSY = false; GW_ERR = String((e && e.message) || e || 'تعذّر الاتصال'); try { render(); } catch (x) {} });
}
function gwApprove() {
  if (!GW_PV) return;
  var sent = S.settings.shSent = S.settings.shSent || {};
  GW_PV.match.forEach(function (x) { if (!(+sent[x.m.id] > 0)) sent[x.m.id] = 1; }); /* موجودة في الشيت أصلًا: تُعلَّم مُرسَلة بلا كتابة */
  gwImport(GW_PV.imp || []);
  S.settings.gwOk = GW_FROM; S.settings.syncGwAuto = 1; GW_PV = null; save();
  return gwSend();
}
function gwOnOff() { S.settings.syncGwAuto = S.settings.syncGwAuto ? 0 : 1; save(); render(); }
function gwAmt(m) { return fTxt(m.cur, r2(m.amt)); }
var GW_OPEN = {};
function gwCap(rows, key, items) { /* القائمة بأكثر من 6 تُختصر إلى 5 + «عرض N أخرى» (قاعدة التطبيق) */
  var open = !!GW_OPEN[key], n = items.length - 5;
  (items.length > 6 && !open ? items.slice(0, 5) : items).forEach(function (x) { rows.push(x); });
  if (items.length > 6) rows.push(X({ more: true, icon: open ? 'i-minus' : 'i-chevD', icTone: 'mute', title: open ? 'طيّ القائمة' : 'عرض ' + n + ' أخرى', go: function () { GW_OPEN[key] = !open; render('morph'); } }));
}
function gwRowsX(pv) {
  var rows = [X({ title: 'ستُرسل إلى الشيت', sub: 'حركات التطبيق غير الموجودة فيه', tag: String(pv.send.length), tagTone: pv.send.length ? 'warn' : 'ok' })];
  gwCap(rows, 'send', pv.send.map(function (x) { return X({ title: String(x.m.note || (fund(x.m.h) || {}).name || ''), sub: dlabel(x.m.date) + ' · ' + ((fund(x.m.h) || {}).name || ''), end: (x.m.dir === 'in' ? '+' : '−') + gwAmt(x.m) }); }));
  rows.push(X({ title: 'موجودة في الشيت أصلًا', sub: 'لن تُرسَل مرة ثانية', tag: String(pv.match.length), tagTone: 'ok' }));
  if (pv.imp && pv.imp.length) {
    rows.push(X({ title: 'ستُستورد إلى التطبيق (حميدا)', sub: 'مكتوبة في تبويب «رصيد مع حميدا» وليست عندك: تُضاف حركات لرصيد حميدا', tag: String(pv.imp.length), tagTone: 'warn' }));
    gwCap(rows, 'imp', pv.imp.map(function (r) { return X({ title: r.n || '—', sub: dshow(r.d) + ' · حميدا', end: r.i ? '+' + r.i : '−' + r.o }); }));
  }
  rows.push(X({ title: 'في الشيت فقط', sub: 'لا يمسّها التطبيق: تأكد أنها ليست حركة تخص التطبيق', tag: String(pv.only.length), tagTone: pv.only.length ? 'warn' : 'ok' }));
  gwCap(rows, 'only', pv.only.map(function (r) { return X({ title: r.n || '—', sub: dshow(r.d) + ' · ' + ({ bin: 'بايننس', bank: 'البنك', ils: 'الشيكل', ham: 'حميدا' }[r.sec] || r.sec), end: r.i ? '+' + r.i : '−' + r.o }); }));
  return rows;
}
function gwSub() {
  if (!gwUrl()) return '';
  if (!gwOk()) return '';
  var n = gwOps().length;
  return (S.settings.syncGwAuto ? '' : 'الإرسال التلقائي موقوف · ') + (GW_ERR ? 'تعذّر الإرسال: ' + GW_ERR : n ? n + ' بانتظار الإرسال' : 'كل الحركات في الشيت') + (S.settings.syncGwAt ? ' · آخر إرسال ' + dlabel(new Date(S.settings.syncGwAt).toISOString().slice(0, 10)) : '');
}
function gwTag() { return !gwUrl() ? { t: 'غير مربوط', tone: 'mute' } : !gwOk() ? { t: 'يحتاج فحصًا', tone: 'warn' } : !S.settings.syncGwAuto ? { t: 'موقوف', tone: 'mute' } : GW_ERR ? { t: 'خطأ', tone: 'bad' } : gwOps().length ? { t: 'بانتظار', tone: 'warn' } : { t: 'متزامن', tone: 'ok' }; }
function gwSave() { S.settings.syncGwUrl = (fv('gwurl') || '').trim(); S.settings.syncGwKey = (fv('gwkey') || '').trim(); save(); }
function gwSheet(sh) {
  if (sh.t !== 'shGw') return null;
  var tg = gwTag(), url = (fv('gwurl') || '').trim(), pv = GW_PV;
  var rows = [X({ sect: true, icon: 'i-doc', icTone: 'ok', title: 'الحركات المالية', sub: gwSub(), tag: tg.t, tagTone: tg.tone })];
  rows.push(X({ more: true, title: 'فحص قبل الإرسال', go: function () { gwSave(); GW_PV = null; say('جارٍ قراءة الشيت…'); gwPreview(); } }));
  if (GW_ERR) rows.push(X({ title: 'آخر خطأ', sub: GW_ERR }));
  if (GW_PVBUSY) rows.push(X({ title: 'جارٍ قراءة الشيت…', sub: 'قراءة فقط، لا يُكتب فيه شيء' }));
  if (pv) rows = rows.concat(gwRowsX(pv));
  /* كل تبويب مجموعة واحدة: شريطه ثم صفوفه ثم إجراءاته (فحص/كتابة) في آخرها، لا بلاطات مختلطة فوق القائمة (المالك 2026-11-23) */
  var gwGrp = function (fn, name, dry, pvv, wr) {
    if (!(gwOk() && typeof fn === 'function')) return;
    rows = rows.concat(fn());
    rows.push(X({ more: true, title: 'فحص ' + name, go: function () { gwSave(); say('جارٍ قراءة الشيت…'); dry(); } }));
    if (pvv && pvv.ok) rows.push(X({ more: true, title: 'كتابة ' + name + ' في تبويبك', go: function () { say('جارٍ الكتابة…'); wr(); } }));
  };
  gwGrp(typeof waRows === 'function' ? waRows : null, 'العمال', waDry, WA_PV, waWrite);
  gwGrp(typeof saRows === 'function' ? saRows : null, 'المخزن', saDry, SA_PV, saWrite);
  gwGrp(typeof eaRows === 'function' ? eaRows : null, 'طبخ خارجي', eaDry, EA_PV, eaWrite);
  gwGrp(typeof wfRows === 'function' ? wfRows : null, 'WFP', wfDry, WF_PV, wfWrite);
  var acts = [
    X({ title: 'اختبار الاتصال', icon: 'i-wifi', go: function () { gwSave(); say('جارٍ الاختبار…'); gwPost({ ping: 1 }).then(function () { GW_ERR = ''; say('البوابة تعمل وكلمة السر صحيحة'); render(); }).catch(function (e) { GW_ERR = String((e && e.message) || e); say('تعذّر الاتصال: ' + GW_ERR); render(); }); } })
  ];
  if (gwOk()) acts.push(X({ title: S.settings.syncGwAuto ? 'إيقاف الإرسال' : 'تشغيل الإرسال', icon: 'i-wifi', go: gwOnOff }));
  return { title: 'مزامنة الشيت', sub: 'من التطبيق إلى شيت «المطبخ $» فقط · من ' + dshow(GW_FROM), fields: [fText('gwurl', 'رابط البوابة (Apps Script)', 'https://script.google.com/macros/s/…/exec'), fSecret('gwkey', 'كلمة سر البوابة', '')], rows: rows, acts: acts,
    note: { text: 'حدود العمل من ' + dshow(GW_FROM) + ' فصاعدًا. قبل أول إرسال يقرأ التطبيق الشيت (قراءة فقط) ويطابق حركاته بصفوفه: ما وُجد فيه لا يُرسَل ثانيةً، وما ليس فيه يُرسَل بعد اعتمادك. التعديل والإلغاء يُضيفان صف فرق ولا يمسّان القديم.', tone: 'info' },
    ft: pv ? { label: 'اعتماد وإرسال ' + pv.send.length + (pv.imp && pv.imp.length ? ' واستيراد ' + pv.imp.length : ''), ok: !!url, go: function () { shut(); say('جارٍ الإرسال إلى الشيت…'); Promise.resolve(gwApprove()).then(function () { say(GW_ERR ? 'تعذّر الإرسال: ' + GW_ERR : 'الشيت محدَّث'); }); } } : { label: 'حفظ', ok: !!url, go: function () { gwSave(); shut(); } } };
}

/* ===== 02m4-wapp.js ===== */
/* ---------- العمال داخل تبويب المالك نفسه («العمال») بدل تبويب لقطة منفصل ----------
   التطبيق يضيف ذيلًا بعد آخر صف للمالك في ثلاثة جداول بأعمدته نفسها (الحضور A:L، الدفعات O:R، الإضافات والخصومات W:AB)؛ معادلات المالك (إجمالي المستحق/المدفوع/الرصيد) تحسبها كما هي.
   الذيل وحده يُعاد كتابته (عمود مفتاح مخفي app:…)، وصفوف المالك لا تُمس. قبل أول كتابة: «فحص» (قراءة فقط) ثم اعتماد (المالك 2026-11-18). */
var WA_TAB = 'العمال', WA_PV = null, WA_BUSY = false, WA_ERR = '', WA_CHK = null, WA_T = null;
function waSpec(dry) {
  var ws = S.workers || [], nm = {}; ws.forEach(function (w) { nm[w.id] = w.name; });
  var days = {}; (S.att || []).forEach(function (a) { if (!nm[a.w]) return; var s = stat(a.st); (days[a.date] = days[a.date] || {})[nm[a.w]] = s ? s.name : a.st; });
  var att = Object.keys(days).sort().map(function (d) { return { k: 'app:att:' + d, d: { d: d }, st: days[d] }; });
  var byT = function (x, y) { return x.date < y.date ? -1 : x.date > y.date ? 1 : (x.ts || 0) - (y.ts || 0); };
  var L = (S.wl || []).filter(function (e) { return e.kind !== 'open' && nm[e.w]; }).sort(byT), pay = [], log = [];
  L.forEach(function (e) {
    var c = wCat(e), t = (WCAT[c] || [e.kind])[0], a = r2(e.amt || 0);
    if (!e.void && (e.kind === 'pay' || c === 'buy')) { pay.push({ k: 'app:pay:' + e.id, v: [{ d: e.date }, nm[e.w], a, e.note && e.note !== t ? e.note : (c === 'buy' ? t : '')] }); return; }
    if (e.kind === 'pay' || c === 'buy') return; /* دفعة ملغاة: لا أثر ولا صف */
    var add = e.kind === 'add', sign = add ? 1 : -1, act = !a ? 'تنبيه' : (c === 'kbuy' ? 'شراء للمطبخ ' : c === 'adjw' ? 'تسوية ' : add ? 'إضافة ' : 'خصم ') + a + ' ش';
    log.push({ k: 'app:log:' + e.id, v: [nm[e.w], e.note && e.note !== t ? e.note : t, act, e.void ? 'ملغي' : 'تم', { d: e.date }, e.void || !a ? '' : sign * a] });
  });
  return { tab: WA_TAB, dry: !!dry, peek: 'C1:U14',
    setup: [{ type: 'hdr', cell: 'AB7', from: 'AA7', text: 'المبلغ (±)' }, { type: 'fappend', range: 'C3:L3', has: '$AB$8', add: '+SUMIF($W$8:$W$499,{c}$1,$AB$8:$AB$499)' }],
    blocks: [
      { id: 'att', c0: 1, n: 12, row0: 8, key: 34, skip: [1], dedup: [0], map: { row: 7, c0: 3, n: 10 }, rows: att },
      { id: 'pay', c0: 15, n: 4, row0: 8, key: 35, dedup: [0, 1, 2], rows: pay },
      { id: 'log', c0: 23, n: 6, row0: 8, key: 36, nf: { 5: '#,##0.##' }, rows: log }] };
}
function waHash() { var s = JSON.stringify(waSpec(false).blocks), h = 5381, i; for (i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return h + ':' + s.length; }
function waOn() { return !!(S.settings.shApp && S.settings.shApp.workers && S.settings.shApp.workers.on); }
function waChk(j) {
    var pn = function (x) { var n = parseFloat(String(x).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; }, bad = [], p = j.peek || [];
    if (p[0] && p[4]) p[0].forEach(function (h, i) { var w = (S.workers || []).filter(function (x) { return x.name === String(h).trim(); })[0]; if (!w) return; var a = E.wBalance(S, w.id), b = pn(p[4][i]); if (Math.abs(a - b) > 0.011) bad.push({ n: w.name, app: a, sheet: b }); });
    /* حالة حضور في التطبيق لها أثر مالي ولا تعرفها قائمة تصنيفات الشيت (T8:T14) فلا تحسبها معادلاته: يُسمّى السبب بدل فرق رقمي (المالك 2026-11-23: «نصف يوم») */
    var known = {}, unk = [], hasList = false; for (var r = 7; r < 14; r++) { var cv = p[r] && p[r][17]; if (cv) { known[String(cv).trim()] = 1; hasList = true; } }
    if (hasList) (S.att || []).forEach(function (a) { if (a.date < '2026-11-01') return; var sd = stat(a.st); if (!sd || (!sd.mult && !sd.bonus) || known[sd.name] || unk.indexOf(sd.name) >= 0) return; unk.push(sd.name); });
    WA_CHK = { bad: bad, missing: j.missing || [], unk: unk, at: Date.now() }; save();
}
function waDry() {
  if (!gwUrl() || WA_BUSY) return Promise.resolve(); WA_BUSY = true; WA_ERR = ''; WA_PV = null;
  return gwPost({ app: waSpec(true) }).then(function (j) { if (!j.blocks) throw new Error('كود البوابة قديم: الصق الكود الجديد وانشر إصدارًا جديدًا'); WA_PV = j; WA_BUSY = false; waChk(j); render(); }).catch(function (e) { WA_BUSY = false; WA_ERR = String((e && e.message) || e); try { render(); } catch (x) {} });
}
function waWrite() {
  if (!gwUrl() || WA_BUSY) return Promise.resolve(); WA_BUSY = true; WA_ERR = '';
  return gwPost({ app: waSpec(false) }).then(function (j) {
    if (!j.blocks) throw new Error('كود البوابة قديم: الصق الكود الجديد وانشر إصدارًا جديدًا');
    WA_BUSY = false; var sa = S.settings.shApp = S.settings.shApp || {}; sa.workers = { on: 1, hash: waHash(), at: Date.now() }; WA_PV = null;
    waChk(j); try { render('morph'); } catch (x) {}
  }).catch(function (e) { WA_BUSY = false; WA_ERR = String((e && e.message) || e); try { render(); } catch (x) {} });
}
function waKick() {
  if (!waOn() || !gwUrl() || !gwOk()) return; clearTimeout(WA_T);
  WA_T = setTimeout(function () { try { if (S.settings.shApp.workers.hash !== waHash()) waWrite(); } catch (e) {} }, 5000);
}
function waRows() {
  var rows = [], pv = WA_PV;
  if (waOn()) rows.push(X({ sect: true, icon: 'i-doc', icTone: 'ok', title: 'العمال', sub: (WA_CHK ? (WA_CHK.bad.length ? 'مخالفات: ' + WA_CHK.bad.length : 'الأرصدة مطابقة') : 'لم يُفحص'), tag: WA_ERR ? 'خطأ' : WA_BUSY ? '…' : 'يعمل', tagTone: WA_ERR ? 'bad' : 'ok' }));
  if (WA_ERR) rows.push(X({ title: 'خطأ العمال', sub: 'العمال · ' + WA_ERR }));
  if (WA_CHK && WA_CHK.unk && WA_CHK.unk.length) rows.push(X({ title: 'حالة حضور غير معرّفة في الشيت', sub: 'العمال · ' + WA_CHK.unk.join('، ') + ' · أضفها لقائمة التصنيفات (T) ولمعادلة «إجمالي المستحق» ثم افحص', tag: String(WA_CHK.unk.length), tagTone: 'bad' }));
  if (WA_CHK) { WA_CHK.bad.forEach(function (b) { rows.push(X({ title: b.n, sub: 'العمال · الرصيد في الشيت يخالف التطبيق', end: b.sheet + ' ≠ ' + b.app, endTone: 'bad' })); }); if (WA_CHK.missing.length) rows.push(X({ title: 'عمال بلا عمود في تبويبك', sub: 'العمال · ' + WA_CHK.missing.join('، '), tag: String(WA_CHK.missing.length), tagTone: 'warn' })); }
  if (pv) {
    if (!pv.ok) rows.push(X({ title: 'لا كتابة', sub: 'العمال · ' + pv.err || 'رفضت البوابة', tag: 'خطأ', tagTone: 'bad' }));
    var nmB = { att: 'أيام الحضور', pay: 'الدفعات والسلف', log: 'الإضافات والخصومات' };
    (pv.blocks || []).forEach(function (b) { rows.push(X({ title: nmB[b.id] || b.id, sub: 'العمال · تحت صفك ' + b.manualLast + (b.dropped ? ' · ' + b.dropped + ' موجودة عندك يدويًا فلا تُكرَّر' : '') + (b.hadApp ? ' · يُعاد كتابة ' + b.hadApp + ' صف للتطبيق' : ''), tag: String(b.want), tagTone: 'ok' })); });
    if (pv.missing && pv.missing.length) rows.push(X({ title: 'عمال بلا عمود في تبويبك', sub: 'العمال · ' + pv.missing.join('، '), tag: String(pv.missing.length), tagTone: 'warn' }));
  }
  return rows;
}
try { setTimeout(function () { try { waKick(); } catch (e) {} }, 13000); } catch (e) {}

/* ===== 02m5-sapp.js ===== */
/* ---------- المخزن داخل تبويب المالك نفسه («المخزن») بدل تبويب لقطة منفصل ----------
   التطبيق يُضيف ذيلًا بعد آخر صف للمالك في جدولي الاستهلاك اليومي (G:K) والوارد (N:R) بأعمدته نفسها؛ عمودا «الوحدة» و«المتبقي» معادلاته تُنسخ من صفه الأخير،
   وعمود «الكمية الحالية» عنده (معادلة SUMIF على الجدولين) يحسب منهما. الذيل وحده يُعاد كتابته بعمود مفتاح مخفي app:…؛ وصفوف المالك لا تُمس.
   مخزن المطبخ وحده (لا مخازن متعددة في تبويبه)، من حدود العمل 2026-11-01. قبل أول كتابة: «فحص» (قراءة فقط) ثم اعتماد؛ وبعدها مطابقة الأرصدة (المالك 2026-11-18). */
var SA_TAB = 'المخزن', SA_LED = 'kitchen', SA_PV = null, SA_BUSY = false, SA_ERR = '', SA_CHK = null, SA_T = null;
/* اسم الوجبة لكل صف استهلاك (الطبخة أو سبب الصرف/الجرد): عمود «الوجبة» بجوار «المتبقي» في الجدول (المالك 2026-11-19: «مش لازم نكتب اسم الطبخة؟ في كل مخزن») */
function mealLabel(m) { if (m.kind === 'batch') { var b = (S.batches || []).filter(function (x) { return x.id === m.ref; })[0]; return b ? batchName(b) : (m.note || ''); } return String(m.note || (m.kind === 'issue' ? 'صرف' : m.kind === 'adjust' ? 'تسوية' : '')).replace(/[\t\r\n]+/g, ' ').trim(); }
function saSpec(dry) {
  var from = typeof GW_FROM === 'string' ? GW_FROM : '2026-11-01', use = {}, inn = {};
  (S.moves || []).forEach(function (m) {
    if (m.led !== SA_LED || m.date < from || m.rev || { batch: 1, issue: 1, receive: 1, adjust: 1 }[m.kind] !== 1) return;
    var it = item(m.item); if (!it || !m.q) return;
    var lb = m.q < 0 ? mealLabel(m) : '', bag = m.q < 0 ? use : inn, k = m.date + '|' + lb + '|' + it.name, o = bag[k] = bag[k] || { d: m.date, n: it.name, q: 0, l: lb };
    o.q = r2(o.q + Math.abs(m.q));
  });
  /* التاريخ يُكتب عند تغيّره فقط، واسم الوجبة عند تغيّر الوجبة فقط، وكل وجبة (بتاريخها) كتلة بلون مغاير للتي قبلها وخط فاصل في أولها (المالك 2026-11-19، كما في تبويب طبخ خارجي) */
  var rows = function (bag, p) { var pd = '', pl_ = null, gi = -1; return Object.keys(bag).sort().filter(function (k) { return bag[k].q > 0; }).map(function (k) { var o = bag[k], gs = false; if (o.d !== pd || (p === 'use' && o.l !== pl_)) { gi++; gs = true; } var sd = o.d !== pd; pd = o.d; pl_ = o.l; return { k: 'app:' + p + ':' + k, bn: gi % 2, gs: gs, dv: [{ d: o.d }, o.n, o.q], v: [sd ? { d: o.d } : '', o.n, o.q, '', ''].concat(p === 'use' ? [gs ? (o.l || '') : ''] : []) }; }); };
  /* أصناف التطبيق التي ليس لها صف في قائمة المخزون عنده: تُضاف (الرصيد الافتتاحي = رصيد التطبيق قبل حركات الذيل) فلا يظهر #N/A في الوحدة والمتبقي */
  var net = {}; [use, inn].forEach(function (bag, bi) { Object.keys(bag).forEach(function (k) { var o = bag[k], it = (S.items || []).filter(function (x) { return x.name === o.n; })[0]; if (it) net[it.id] = r2((net[it.id] || 0) + (bi ? o.q : -o.q)); }); });
  var qOf = {}; stockRows(SA_LED).forEach(function (r) { qOf[r.it.id] = r.q; });
  var seen = {}; [use, inn].forEach(function (bag) { Object.keys(bag).forEach(function (k) { seen[bag[k].n] = 1; }); });
  /* كل صنف له صف في الذيل يلزم أن يوجد في قائمة المخزون ولو رصيده صفر (دخل وخرج بالكمية نفسها)، فلا يظهر #N/A */
  var stk = (S.items || []).filter(function (it) { return qOf[it.id] || net[it.id] || seen[it.name]; }).map(function (it) { return { name: it.name, unit: it.unit || '', open: r2((qOf[it.id] || 0) - (net[it.id] || 0)) }; });
  return { tab: SA_TAB, dry: !!dry, peek: 'A3:D400',
    stock: { c0: 1, n: 4, row0: 3, items: stk },
    setup: [{ type: 'hdr', cell: 'L2', from: 'K2', text: 'الوجبة' }], blocks: [
      { id: 'use', c0: 7, n: 6, row0: 3, key: 27, skip: [3, 4], fx: [3, 4], dedup: [0, 1, 2], band: ['#BFE3C6', '#FFD59A'], mealCol: 5, names: { col: 2, idx: 1, row0: 3 }, rows: rows(use, 'use') },
      { id: 'in', c0: 14, n: 5, row0: 3, key: 28, skip: [3, 4], fx: [3, 4], dedup: [0, 1, 2], band: ['#BFE3C6', '#FFD59A'], names: { col: 2, idx: 1, row0: 3 }, rows: rows(inn, 'in') }] };
}
function saHash() { var sp = saSpec(false), s = JSON.stringify([sp.blocks, sp.stock]), h = 5381, i; for (i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return h + ':' + s.length; }
function saOn() { return !!(S.settings.shApp && S.settings.shApp.stock && S.settings.shApp.stock.on); }
function saChk(j) {
  var pn = function (x) { var n = parseFloat(String(x).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; }, bad = [], sh = {};
  (j.peek || []).forEach(function (r) { if (r[1]) sh[String(r[1]).trim()] = pn(r[2]); });
  stockRows(SA_LED).forEach(function (r) { var b = sh[r.it.name]; if (b === undefined) return; if (Math.abs(r2(r.q) - b) > 0.011) bad.push({ n: r.it.name, app: r2(r.q), sheet: b }); });
  SA_CHK = { bad: bad, missing: j.missing || [], at: Date.now() }; save();
}
function saDry() {
  if (!gwUrl() || SA_BUSY) return Promise.resolve(); SA_BUSY = true; SA_ERR = ''; SA_PV = null;
  return gwPost({ app: saSpec(true) }).then(function (j) { if (!j.blocks) throw new Error('كود البوابة قديم: الصق الكود الجديد وانشر إصدارًا جديدًا'); SA_PV = j; SA_BUSY = false; saChk(j); render(); }).catch(function (e) { SA_BUSY = false; SA_ERR = String((e && e.message) || e); try { render(); } catch (x) {} });
}
function saWrite() {
  if (!gwUrl() || SA_BUSY) return Promise.resolve(); SA_BUSY = true; SA_ERR = '';
  return gwPost({ app: saSpec(false) }).then(function (j) {
    if (!j.blocks) throw new Error('كود البوابة قديم: الصق الكود الجديد وانشر إصدارًا جديدًا');
    SA_BUSY = false; var sa = S.settings.shApp = S.settings.shApp || {}; sa.stock = { on: 1, hash: saHash(), at: Date.now() }; SA_PV = null;
    var pn = function (x) { var n = parseFloat(String(x).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; }, bad = [], sh = {};
    (j.peek || []).forEach(function (r) { if (r[1]) sh[String(r[1]).trim()] = pn(r[2]); });
    stockRows(SA_LED).forEach(function (r) { var b = sh[r.it.name]; if (b === undefined) return; if (Math.abs(r2(r.q) - b) > 0.011) bad.push({ n: r.it.name, app: r2(r.q), sheet: b }); });
    SA_CHK = { bad: bad, missing: j.missing || [], at: Date.now() }; save(); try { render('morph'); } catch (x) {}
  }).catch(function (e) { SA_BUSY = false; SA_ERR = String((e && e.message) || e); try { render(); } catch (x) {} });
}
function saKick() {
  if (!saOn() || !gwUrl() || !gwOk()) return; clearTimeout(SA_T);
  SA_T = setTimeout(function () { try { if (S.settings.shApp.stock.hash !== saHash()) saWrite(); } catch (e) {} }, 5000);
}
function saRows() {
  var rows = [], pv = SA_PV;
  if (saOn()) rows.push(X({ sect: true, icon: 'i-doc', icTone: 'ok', title: 'المخزن', sub: (SA_CHK ? (SA_CHK.bad.length ? 'مخالفات: ' + SA_CHK.bad.length : 'الأرصدة مطابقة') : 'لم يُفحص'), tag: SA_ERR ? 'خطأ' : SA_BUSY ? '…' : 'يعمل', tagTone: SA_ERR ? 'bad' : 'ok' }));
  if (SA_ERR) rows.push(X({ title: 'خطأ المخزن', sub: 'المخزن · ' + SA_ERR }));
  if (SA_CHK) { SA_CHK.bad.slice(0, 5).forEach(function (b) { rows.push(X({ title: b.n, sub: 'المخزن · الرصيد في الشيت يخالف التطبيق', end: b.sheet + ' ≠ ' + b.app, endTone: 'bad' })); }); if (SA_CHK.bad.length > 5) rows.push(X({ more: true, title: 'و ' + (SA_CHK.bad.length - 5) + ' أخرى مخالفة' })); if (SA_CHK.missing.length) rows.push(X({ title: 'أصناف بلا صف في تبويبك', sub: 'المخزن · ' + SA_CHK.missing.join('، '), tag: String(SA_CHK.missing.length), tagTone: 'warn' })); }
  if (pv) {
    if (!pv.ok) rows.push(X({ title: 'لا كتابة', sub: 'المخزن · ' + pv.err || 'رفضت البوابة', tag: 'خطأ', tagTone: 'bad' }));
    var nmB = { use: 'الاستهلاك اليومي', 'in': 'الوارد للمخزن' };
    (pv.blocks || []).forEach(function (b) { rows.push(X({ title: nmB[b.id] || b.id, sub: 'المخزن · تحت صفك ' + b.manualLast + (b.dropped ? ' · ' + b.dropped + ' موجودة عندك يدويًا فلا تُكرَّر' : '') + (b.hadApp ? ' · يُعاد كتابة ' + b.hadApp + ' صف للتطبيق' : ''), tag: String(b.want), tagTone: 'ok' })); });
    if (pv.added && pv.added.length) rows.push(X({ title: 'أصناف تُضاف لقائمة المخزون عندك', sub: 'المخزن · ' + pv.added.join('، '), tag: String(pv.added.length), tagTone: 'ok' }));
    if (pv.missing && pv.missing.length) rows.push(X({ title: 'أصناف بلا صف في تبويبك', sub: 'المخزن · ' + pv.missing.join('، '), tag: String(pv.missing.length), tagTone: 'warn' }));
  }
  return rows;
}
try { setTimeout(function () { try { saKick(); } catch (e) {} }, 15000); } catch (e) {}

/* ===== 02m6-eapp.js ===== */
/* ---------- طبخ المؤسسات داخل تبويب المالك «طبخ خارجي» نفسه بدل تبويب لقطة ----------
   التطبيق يُضيف ذيلًا بعد آخر صف للمالك في جدول الطبخات (A:F: التاريخ، المؤسسة، القدور، الطبخة، الصنف، الكمية)؛ أعمدته G:J (الوحدة والسعر والتكلفة وقدور محسوبة) ومجاميع المؤسسات P:R معادلاته تحسبها
   من قائمة الأسعار L:N (يُضاف إليها ما ينقصها بوحدته وسعره). الذيل وحده يُعاد كتابته بعمود مفتاح مخفي app:…، وصفوفه الأولى تُقارَن بصفوفه اليدوية بالدفعة كلها: الطبخة المكتوبة يدويًا لا تتكرر.
   الإضافات والدفعات تبقى في التطبيق. بعد الكتابة: مطابقة تكلفة كل مؤسسة بمجموعه. فحص (قراءة فقط) ثم اعتماد (المالك 2026-11-18). */
var EA_TAB = 'طبخ خارجي', EA_PV = null, EA_BUSY = false, EA_ERR = '', EA_CHK = null, EA_T = null;
function eaSpec(dry) {
  var from = typeof GW_FROM === 'string' ? GW_FROM : '2026-11-01', nm = {}, rows = [], pl = {}, plA = [];
  (S.insts || []).forEach(function (i) { nm[i.id] = i.name; });
  (S.batches || []).filter(function (b) { return b.inst && nm[b.inst] && !b.void && b.date >= from; }).sort(function (x, y) { return x.date < y.date ? -1 : x.date > y.date ? 1 : (x.ts || 0) - (y.ts || 0); }).forEach(function (bt) {
    var first = true, sum = 0, put = function (kk, name, qty, price, unit) { /* صف واحد: الصنف والكمية وسعر الوحدة قيمةً (فتطابق التكلفة التطبيق ولو تغيّر سعر القائمة) */
      rows.push({ k: kk, g: bt.id, nd: !first, v: [first ? { d: bt.date } : '', first ? nm[bt.inst] : '', first ? bt.pots || 0 : '', first ? batchName(bt) : '', name, qty, '', price] });
      first = false; sum = r2(sum + r2(qty * price));
    };
    spiceLast(bt.lines || []).forEach(function (ln) {
      var li = item(ln.item); if (!li || !(ln.qty > 0)) return;
      var c = ln.cost != null ? ln.cost : (ln.qty || 0) * (ln.price || 0), up = c > 0 && ln.qty > 0 ? r2(c / ln.qty) : null, q = r2(ln.qty), hp = c > 0 && q > 0 ? Math.round(c / q * 10000) / 10000 : 0;
      put('app:bat:' + bt.id + ':' + ln.item, li.name, q, hp);
      if (!pl[li.id]) { pl[li.id] = { name: li.name, unit: li.unit || '', price: up }; plA.push(pl[li.id]); } else if (up) pl[li.id].price = up; /* آخر سعر للصنف؛ ويُكمَل به سعر قائمتك الفارغ فقط (لا يُبدَّل سعر كتبته) */
    });
    /* بنود التكلفة غير المواد (عمال، تغليف، رشة...) صفوف ظاهرة بمبلغها، ثم صف «تسوية» لأي فرق متبقٍ: مجموع الطبخة في الشيت = مجموعها في التطبيق دائمًا */
    (bt.xl || []).forEach(function (x, xi) { if (!(x.amt > 0) || !x.k) return; put('app:bat:' + bt.id + ':x' + xi, x.k, 1, r2(x.amt)); if (!pl['x:' + x.k]) { pl['x:' + x.k] = { name: x.k, unit: 'بند', price: null }; plA.push(pl['x:' + x.k]); } });
    var rest = r2((bt.cost || 0) - sum); if (Math.abs(rest) >= 0.01 && !first) { put('app:bat:' + bt.id + ':adj', 'تسوية', 1, rest); if (!pl['x:تسوية']) { pl['x:تسوية'] = { name: 'تسوية', unit: 'بند', price: null }; plA.push(pl['x:تسوية']); } }
  });
  return { tab: EA_TAB, dry: !!dry, peek: 'P4:R60',
    plist: { c0: 12, n: 3, row0: 4, items: plA },
    blocks: [{ id: 'bat', c0: 1, n: 8, row0: 4, key: 23, skip: [6], dedup: [0, 1, 2, 3], names: { col: 12, idx: 4, row0: 4 }, rows: rows }] };
}
function eaHash() { var sp = eaSpec(false), s = JSON.stringify([sp.blocks, sp.plist]), h = 5381, i; for (i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return h + ':' + s.length; }
function eaOn() { return !!(S.settings.shApp && S.settings.shApp.ext && S.settings.shApp.ext.on); }
function eaChk(j) {
    var pn = function (x) { var n = parseFloat(String(x).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; }, bad = [], sh = {}, man = ((j.blocks || [])[0] || {}).manual || [];
    (j.peek || []).forEach(function (r) { if (r[0]) sh[String(r[0]).trim()] = pn(r[2]); });
    (S.insts || []).forEach(function (i) {
      var cost = r2((S.batches || []).filter(function (b) { return b.inst === i.id && !b.void && b.date >= GW_FROM; }).reduce(function (t, b) { return t + (b.cost || 0); }, 0)), s0 = sh[i.name];
      if (s0 !== undefined && Math.abs(cost - s0) > 0.011) { var mb = (S.batches || []).filter(function (b) { return b.inst === i.id && !b.void && man.indexOf(b.id) >= 0; }); bad.push({ n: i.name, app: cost, sheet: s0, why: mb.length ? 'الفرق من طبخة ' + mb.map(function (b) { return b.date; }).join('، ') + ' المكتوبة يدويًا في تبويبك: لا يكررها التطبيق، وأرقامها غير أرقامه' : '' }); }
    });
    EA_CHK = { bad: bad, missing: j.missing || [], at: Date.now() }; save();
}
function eaDry() {
  if (!gwUrl() || EA_BUSY) return Promise.resolve(); EA_BUSY = true; EA_ERR = ''; EA_PV = null;
  return gwPost({ app: eaSpec(true) }).then(function (j) { if (!j.blocks) throw new Error('كود البوابة قديم: الصق الكود الجديد وانشر إصدارًا جديدًا'); EA_PV = j; EA_BUSY = false; eaChk(j); render(); }).catch(function (e) { EA_BUSY = false; EA_ERR = String((e && e.message) || e); try { render(); } catch (x) {} });
}
function eaWrite() {
  if (!gwUrl() || EA_BUSY) return Promise.resolve(); EA_BUSY = true; EA_ERR = '';
  return gwPost({ app: eaSpec(false) }).then(function (j) {
    if (!j.blocks) throw new Error('كود البوابة قديم: الصق الكود الجديد وانشر إصدارًا جديدًا');
    EA_BUSY = false; var sa = S.settings.shApp = S.settings.shApp || {}; sa.ext = { on: 1, hash: eaHash(), at: Date.now() }; EA_PV = null;
    eaChk(j); try { render('morph'); } catch (x) {}
  }).catch(function (e) { EA_BUSY = false; EA_ERR = String((e && e.message) || e); try { render(); } catch (x) {} });
}
function eaKick() {
  if (!eaOn() || !gwUrl() || !gwOk()) return; clearTimeout(EA_T);
  EA_T = setTimeout(function () { try { if (S.settings.shApp.ext.hash !== eaHash()) eaWrite(); } catch (e) {} }, 5000);
}
function eaRows() {
  var rows = [], pv = EA_PV;
  if (eaOn()) rows.push(X({ sect: true, icon: 'i-doc', icTone: 'ok', title: 'طبخ خارجي', sub: (EA_CHK ? (EA_CHK.bad.length ? 'مخالفات: ' + EA_CHK.bad.length : 'التكاليف مطابقة') : 'لم يُفحص'), tag: EA_ERR ? 'خطأ' : EA_BUSY ? '…' : 'يعمل', tagTone: EA_ERR ? 'bad' : 'ok' }));
  if (EA_ERR) rows.push(X({ title: 'خطأ الطبخ الخارجي', sub: 'طبخ خارجي · ' + EA_ERR }));
  if (EA_CHK) { EA_CHK.bad.slice(0, 5).forEach(function (b) { rows.push(X({ title: b.n, sub: 'طبخ خارجي · ' + (b.why || 'التكلفة في الشيت تخالف التطبيق'), end: b.sheet + ' ≠ ' + b.app, endTone: 'bad' })); }); if (EA_CHK.bad.length > 5) rows.push(X({ more: true, title: 'و ' + (EA_CHK.bad.length - 5) + ' أخرى مخالفة' })); }
  if (pv) {
    if (!pv.ok) rows.push(X({ title: 'لا كتابة', sub: 'طبخ خارجي · ' + pv.err || 'رفضت البوابة', tag: 'خطأ', tagTone: 'bad' }));
    (pv.blocks || []).forEach(function (b) { rows.push(X({ title: 'الطبخات (صفوف المواد)', sub: 'طبخ خارجي · تحت صفك ' + b.manualLast + (b.dropped ? ' · ' + b.dropped + ' صفًا موجودة عندك يدويًا فلا تُكرَّر' : '') + (b.hadApp ? ' · يُعاد كتابة ' + b.hadApp + ' صف للتطبيق' : ''), tag: String(b.want), tagTone: 'ok' })); });
    if (pv.filledP && pv.filledP.length) rows.push(X({ title: 'أسعار تُكمَل في قائمتك (كانت فارغة)', sub: 'طبخ خارجي · ' + pv.filledP.join('، '), tag: String(pv.filledP.length), tagTone: 'ok' }));
    if (pv.addedP && pv.addedP.length) rows.push(X({ title: 'أصناف تُضاف لقائمة الأسعار عندك', sub: 'طبخ خارجي · ' + pv.addedP.join('، '), tag: String(pv.addedP.length), tagTone: 'ok' }));
  }
  return rows;
}
try { setTimeout(function () { try { eaKick(); } catch (e) {} }, 17000); } catch (e) {}

/* ===== 02m7-wfp.js ===== */
/* ---------- مخزن WFP داخل تبويب المالك نفسه («WFP») بدل تبويب لقطة منفصل (بالطريقة نفسها وبالتنسيق نفسه للمخزن: G:K و N:R) ----------
   التطبيق يُضيف ذيلًا بعد آخر صف للمالك في جدولي الاستهلاك اليومي (G:K) والوارد (N:R) بأعمدته نفسها؛ عمودا «الوحدة» و«المتبقي» معادلاته تُنسخ من صفه الأخير،
   وعمود «الكمية الحالية» عنده (معادلة SUMIF على الجدولين) يحسب منهما. الذيل وحده يُعاد كتابته بعمود مفتاح مخفي app:…؛ وصفوف المالك لا تُمس.
   مخزن WFP وحده، من حدود العمل 2026-11-01. قبل أول كتابة: «فحص» (قراءة فقط) ثم اعتماد؛ وبعدها مطابقة الأرصدة (المالك 2026-11-18). */
var WF_TAB = 'WFP', WF_LED = 'wfp', WF_PV = null, WF_BUSY = false, WF_ERR = '', WF_CHK = null, WF_T = null;
function wfSpec(dry) {
  var from = typeof GW_FROM === 'string' ? GW_FROM : '2026-11-01', use = {}, inn = {};
  (S.moves || []).forEach(function (m) {
    if (m.led !== WF_LED || m.date < from || m.rev || { batch: 1, issue: 1, receive: 1, adjust: 1 }[m.kind] !== 1) return;
    var it = item(m.item); if (!it || !m.q) return;
    var lb = m.q < 0 ? mealLabel(m) : '', bag = m.q < 0 ? use : inn, k = m.date + '|' + lb + '|' + it.name, o = bag[k] = bag[k] || { d: m.date, n: it.name, q: 0, l: lb };
    o.q = r2(o.q + Math.abs(m.q));
  });
  /* التاريخ يُكتب عند تغيّره فقط، واسم الوجبة عند تغيّر الوجبة فقط، وكل وجبة (بتاريخها) كتلة بلون مغاير للتي قبلها وخط فاصل في أولها (المالك 2026-11-19، كما في تبويب طبخ خارجي) */
  var rows = function (bag, p) { var pd = '', pl_ = null, gi = -1; return Object.keys(bag).sort().filter(function (k) { return bag[k].q > 0; }).map(function (k) { var o = bag[k], gs = false; if (o.d !== pd || (p === 'use' && o.l !== pl_)) { gi++; gs = true; } var sd = o.d !== pd; pd = o.d; pl_ = o.l; return { k: 'app:' + p + ':' + k, bn: gi % 2, gs: gs, dv: [{ d: o.d }, o.n, o.q], v: [sd ? { d: o.d } : '', o.n, o.q, '', ''].concat(p === 'use' ? [gs ? (o.l || '') : ''] : []) }; }); };
  /* أصناف التطبيق التي ليس لها صف في قائمة المخزون عنده: تُضاف (الرصيد الافتتاحي = رصيد التطبيق قبل حركات الذيل) فلا يظهر #N/A في الوحدة والمتبقي */
  var net = {}; [use, inn].forEach(function (bag, bi) { Object.keys(bag).forEach(function (k) { var o = bag[k], it = (S.items || []).filter(function (x) { return x.name === o.n; })[0]; if (it) net[it.id] = r2((net[it.id] || 0) + (bi ? o.q : -o.q)); }); });
  var qOf = {}; stockRows(WF_LED).forEach(function (r) { qOf[r.it.id] = r.q; });
  var seen = {}; [use, inn].forEach(function (bag) { Object.keys(bag).forEach(function (k) { seen[bag[k].n] = 1; }); });
  /* كل صنف له صف في الذيل يلزم أن يوجد في قائمة المخزون ولو رصيده صفر (دخل وخرج بالكمية نفسها)، فلا يظهر #N/A */
  var stk = (S.items || []).filter(function (it) { return qOf[it.id] || net[it.id] || seen[it.name]; }).map(function (it) { return { name: it.name, unit: it.unit || '', open: r2((qOf[it.id] || 0) - (net[it.id] || 0)) }; });
  return { tab: WF_TAB, dry: !!dry, peek: 'A3:D400',
    stock: { c0: 1, n: 4, row0: 3, items: stk },
    setup: [{ type: 'hdr', cell: 'L2', from: 'K2', text: 'الوجبة' }], blocks: [
      { id: 'use', c0: 7, n: 6, row0: 3, key: 27, skip: [3, 4], fx: [3, 4], dedup: [0, 1, 2], band: ['#BFE3C6', '#FFD59A'], mealCol: 5, names: { col: 2, idx: 1, row0: 3 }, rows: rows(use, 'use') },
      { id: 'in', c0: 14, n: 5, row0: 3, key: 28, skip: [3, 4], fx: [3, 4], dedup: [0, 1, 2], band: ['#BFE3C6', '#FFD59A'], names: { col: 2, idx: 1, row0: 3 }, rows: rows(inn, 'in') }] };
}
function wfHash() { var sp = wfSpec(false), s = JSON.stringify([sp.blocks, sp.stock]), h = 5381, i; for (i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return h + ':' + s.length; }
function wfOn() { return !!(S.settings.shApp && S.settings.shApp.wfp && S.settings.shApp.wfp.on); }
function wfChk(j) {
  var pn = function (x) { var n = parseFloat(String(x).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; }, bad = [], sh = {};
  (j.peek || []).forEach(function (r) { if (r[1]) sh[String(r[1]).trim()] = pn(r[2]); });
  stockRows(WF_LED).forEach(function (r) { var b = sh[r.it.name]; if (b === undefined) return; if (Math.abs(r2(r.q) - b) > 0.011) bad.push({ n: r.it.name, app: r2(r.q), sheet: b }); });
  WF_CHK = { bad: bad, missing: j.missing || [], at: Date.now() }; save();
}
function wfDry() {
  if (!gwUrl() || WF_BUSY) return Promise.resolve(); WF_BUSY = true; WF_ERR = ''; WF_PV = null;
  return gwPost({ app: wfSpec(true) }).then(function (j) { if (!j.blocks) throw new Error('كود البوابة قديم: الصق الكود الجديد وانشر إصدارًا جديدًا'); WF_PV = j; WF_BUSY = false; wfChk(j); render(); }).catch(function (e) { WF_BUSY = false; WF_ERR = String((e && e.message) || e); try { render(); } catch (x) {} });
}
function wfWrite() {
  if (!gwUrl() || WF_BUSY) return Promise.resolve(); WF_BUSY = true; WF_ERR = '';
  return gwPost({ app: wfSpec(false) }).then(function (j) {
    if (!j.blocks) throw new Error('كود البوابة قديم: الصق الكود الجديد وانشر إصدارًا جديدًا');
    WF_BUSY = false; var sa = S.settings.shApp = S.settings.shApp || {}; sa.wfp = { on: 1, hash: wfHash(), at: Date.now() }; WF_PV = null;
    var pn = function (x) { var n = parseFloat(String(x).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; }, bad = [], sh = {};
    (j.peek || []).forEach(function (r) { if (r[1]) sh[String(r[1]).trim()] = pn(r[2]); });
    stockRows(WF_LED).forEach(function (r) { var b = sh[r.it.name]; if (b === undefined) return; if (Math.abs(r2(r.q) - b) > 0.011) bad.push({ n: r.it.name, app: r2(r.q), sheet: b }); });
    WF_CHK = { bad: bad, missing: j.missing || [], at: Date.now() }; save(); try { render('morph'); } catch (x) {}
  }).catch(function (e) { WF_BUSY = false; WF_ERR = String((e && e.message) || e); try { render(); } catch (x) {} });
}
function wfKick() {
  if (!wfOn() || !gwUrl() || !gwOk()) return; clearTimeout(WF_T);
  WF_T = setTimeout(function () { try { if (S.settings.shApp.wfp.hash !== wfHash()) wfWrite(); } catch (e) {} }, 5000);
}
function wfRows() {
  var rows = [], pv = WF_PV;
  if (wfOn()) rows.push(X({ sect: true, icon: 'i-doc', icTone: 'ok', title: 'WFP', sub: (WF_CHK ? (WF_CHK.bad.length ? 'مخالفات: ' + WF_CHK.bad.length : 'الأرصدة مطابقة') : 'لم يُفحص'), tag: WF_ERR ? 'خطأ' : WF_BUSY ? '…' : 'يعمل', tagTone: WF_ERR ? 'bad' : 'ok' }));
  if (WF_ERR) rows.push(X({ title: 'خطأ WFP', sub: 'WFP · ' + WF_ERR }));
  if (WF_CHK) { WF_CHK.bad.slice(0, 5).forEach(function (b) { rows.push(X({ title: b.n, sub: 'WFP · الرصيد في الشيت يخالف التطبيق', end: b.sheet + ' ≠ ' + b.app, endTone: 'bad' })); }); if (WF_CHK.bad.length > 5) rows.push(X({ more: true, title: 'و ' + (WF_CHK.bad.length - 5) + ' أخرى مخالفة' })); if (WF_CHK.missing.length) rows.push(X({ title: 'أصناف بلا صف في تبويبك', sub: 'WFP · ' + WF_CHK.missing.join('، '), tag: String(WF_CHK.missing.length), tagTone: 'warn' })); }
  if (pv) {
    if (!pv.ok) rows.push(X({ title: 'لا كتابة', sub: 'WFP · ' + pv.err || 'رفضت البوابة', tag: 'خطأ', tagTone: 'bad' }));
    var nmB = { use: 'الاستهلاك اليومي', 'in': 'الوارد للمخزن' };
    (pv.blocks || []).forEach(function (b) { rows.push(X({ title: nmB[b.id] || b.id, sub: 'WFP · تحت صفك ' + b.manualLast + (b.dropped ? ' · ' + b.dropped + ' موجودة عندك يدويًا فلا تُكرَّر' : '') + (b.hadApp ? ' · يُعاد كتابة ' + b.hadApp + ' صف للتطبيق' : ''), tag: String(b.want), tagTone: 'ok' })); });
    if (pv.added && pv.added.length) rows.push(X({ title: 'أصناف تُضاف لقائمة المخزون عندك', sub: 'WFP · ' + pv.added.join('، '), tag: String(pv.added.length), tagTone: 'ok' }));
    if (pv.missing && pv.missing.length) rows.push(X({ title: 'أصناف بلا صف في تبويبك', sub: 'WFP · ' + pv.missing.join('، '), tag: String(pv.missing.length), tagTone: 'warn' }));
  }
  return rows;
}
try { setTimeout(function () { try { wfKick(); } catch (e) {} }, 15000); } catch (e) {}

/* ===== 02n-init.js ===== */
/* ---------- حساب الجهة (المبادرة): تكلفة الطبخات + إضافات − دفعات = المتبقي ---------- */
function iniAcct(i) {
  var bs = S.batches.filter(function (b) { return b.inst === i.id && !b.void; });
  var cost = r2(bs.reduce(function (a, b) { return a + (b.cost || 0); }, 0)), chg = r2((i.chg || []).reduce(function (a, c) { return a + c.amt; }, 0)), paid = r2((i.pay || []).reduce(function (a, c) { return a + c.amt; }, 0));
  return { bs: bs, cost: cost, chg: chg, paid: paid, due: r2(cost + chg - paid) };
}
function iniTag(i) { var a = iniAcct(i); return a.due > 0 ? { t: 'عليه ' + money(a.due), tone: 'warn' } : a.cost + a.chg > 0 ? { t: 'مسدَّد', tone: 'ok' } : { t: '', tone: 'mute' }; }

/* «إضافة مبلغ» لها نوع (رصيد سابق، طبخة بلا تفاصيل، أجرة نقل، أخرى) وتاريخ، وكل إضافة ودفعة قابلة للتعديل والحذف مع تراجع (المالك 2026-11-24: «ما فيش تاريخ، ما فيش تعديل») */
var CHG_KINDS = [['prev', 'رصيد سابق'], ['cook', 'طبخة'], ['ship', 'أجرة نقل'], ['', 'أخرى']];
function chgTitle(c) { var k = (CHG_KINDS.filter(function (x) { return x[0] && x[0] === c.kind; })[0] || [])[1] || '', n = c.note || ''; return k && n ? k + ': ' + n : k || n || 'إضافة'; }
function iniBack(id) { onBack(); }
function doIniChg(id, amt, note, kind, date) {
  var i = inst(id); i.chg = (i.chg || []).concat([{ amt: amt, note: note || '', kind: kind || '', date: date || today() }]);
  audit('إضافة ' + money(amt) + ' على حساب «' + i.name + '»' + (note ? ': ' + note : ''));
  iniBack(id); mutated('أُضيف ' + money(amt) + ' على حساب ' + i.name);
}
function doIniChgEdit(id, k) {
  var i = inst(id), c = (i.chg || [])[k]; if (!c) return; var was = { amt: c.amt, note: c.note, kind: c.kind, date: c.date };
  c.amt = num('amt'); c.note = (fv('note') || '').trim(); c.kind = fv('kind') || ''; c.date = moveDate();
  audit('تعديل إضافة على «' + i.name + '»: ' + money(was.amt) + ' ← ' + money(c.amt));
  iniBack(id); mutated('عُدّلت الإضافة', function () { Object.assign(c, was); save(); render(); });
}
function doIniChgDel(id, k) {
  var i = inst(id), c = (i.chg || [])[k]; if (!c) return; i.chg.splice(k, 1);
  audit('حذف إضافة ' + money(c.amt) + ' من «' + i.name + '»');
  iniBack(id); mutated('حُذفت الإضافة', function () { i.chg.splice(Math.min(k, i.chg.length), 0, c); save(); render(); });
}
/* حركة الرصيد المصاحبة للدفعة: بمعرّفها e.mv، وللدفعات القديمة بالمطابقة (الجهة والتاريخ والمبلغ) */
function iniPayMove(i, e) {
  if (e.mv) return E.by(S.fm, e.mv);
  return (S.fm || []).filter(function (m) { return m.ini === i.id && !m.void && m.dir === 'in' && m.date === e.date && (m.cur === 'usd' ? m.ils === e.amt : m.amt === e.amt); })[0] || null;
}
function iniFundMove(i, e, fid, rate, pid) {
  var f = fund(fid), m = { id: mid(S.fm, 'm'), date: e.date, h: fid, dir: 'in', note: 'دفعة من ' + i.name + (e.note ? ' — ' + e.note : ''), ini: i.id };
  if (hasCur(f, 'ils')) { m.cur = 'ils'; m.amt = e.amt; m.ils = 0; m.rate = 0; } else { m.cur = 'usd'; m.amt = r2(e.amt / rate); m.ils = e.amt; m.rate = rate; }
  if (pid) phTag(m, pid); else if (e.ph) m.ph = e.ph;
  S.fm.push(m); e.mv = m.id; return m;
}
/* دفعة من الجهة بتاريخها، وإن اختير رصيد يزيد رصيده بالمبلغ (بالدولار عند رصيد دولاري فقط، بسعر صرف) */
function doIniPay(id, amt, fid, note, rate, date) {
  var i = inst(id), pid = phTake(), e = { amt: amt, date: date || today(), note: note || '', fund: fid || '' }; phTag(e, pid);
  i.pay = (i.pay || []).concat([e]);
  if (fid) { iniFundMove(i, e, fid, rate, pid); S.settings.lastFund = fid; }
  audit('دفعة ' + money(amt) + ' من «' + i.name + '»');
  iniBack(id); mutated('سُجّلت دفعة ' + money(amt) + ' من ' + i.name);
}
function doIniPayEdit(id, k, rate) {
  var i = inst(id), e = (i.pay || [])[k]; if (!e) return; var old = iniPayMove(i, e), was = { amt: e.amt, date: e.date, note: e.note, fund: e.fund, mv: e.mv }, fid = fv('fund'), nm = null;
  e.amt = num('amt'); e.note = (fv('note') || '').trim(); e.date = moveDate(); e.fund = fid || '';
  if (old) old.void = true;
  if (fid) { nm = iniFundMove(i, e, fid, rate); S.settings.lastFund = fid; } else e.mv = '';
  if (old && nm) old.edTo = nm.id;
  audit('تعديل دفعة من «' + i.name + '»: ' + money(was.amt) + ' ← ' + money(e.amt));
  iniBack(id); mutated('عُدّلت الدفعة', function () { Object.assign(e, was); if (nm) { S.fm = S.fm.filter(function (x) { return x.id !== nm.id; }); } if (old) { old.void = false; delete old.edTo; } save(); render(); });
}
function doIniPayDel(id, k) {
  var i = inst(id), e = (i.pay || [])[k]; if (!e) return; var old = iniPayMove(i, e); i.pay.splice(k, 1); if (old) old.void = true;
  audit('حذف دفعة ' + money(e.amt) + ' من «' + i.name + '»');
  iniBack(id); mutated('حُذفت الدفعة', function () { i.pay.splice(Math.min(k, i.pay.length), 0, e); if (old) old.void = false; save(); render(); });
}
function iniChgOpen(i, c) { var k = (i.chg || []).indexOf(c); if (k < 0) return; openSh({ t: 'iniChgEd', id: i.id, k: k }, { amt: String(c.amt), note: c.note || '', kind: c.kind || '', dtxt: c.date || today() }); }
function iniPayOpen(i, c) { var k = (i.pay || []).indexOf(c); if (k < 0) return; var mv = iniPayMove(i, c), f = c.fund || (mv && mv.h) || ''; openSh({ t: 'iniPayEd', id: i.id, k: k }, { amt: String(c.amt), note: c.note || '', fund: f, rate: mv && mv.rate ? String(mv.rate) : '', dtxt: c.date || today() }); }
function startIniBatch(iid) {
  shut(); if (isClosed()) { openSh({ t: 'locked', what: 'batch' }); return; }
  var d0 = newDraft('external', !!(inst(iid) || {}).init); d0.inst = iid; open('batch', { draft: d0 });
}

function initSheet(sh) {
  switch (sh.t) {
    case 'init': {
      var ni = inst(sh.id), na = iniAcct(ni);
      var rows = [X({ subt: true, title: 'التكلفة', sub: na.bs.length ? pl(na.bs.length, 'طبخة واحدة', 'طبختان', 'طبخات') : 'بلا طبخات', tag: money(na.cost), tagTone: 'mute' })];
      (ni.chg || []).forEach(function (c) { rows.push(X({ title: chgTitle(c), sub: c.date ? dlabel(c.date) : '', tag: money(c.amt), tagTone: 'mute', chev: true, go: function () { iniChgOpen(ni, c); } })); });
      (ni.pay || []).forEach(function (c) { rows.push(phRow({ title: 'دفعة' + (c.note ? ': ' + c.note : ''), sub: c.date ? dlabel(c.date) : '', tag: '− ' + money(c.amt), tagTone: 'ok', chev: true, go: function () { iniPayOpen(ni, c); } }, c, 'دفعة من ' + ni.name)); });
      rows.push(X({ total: true, title: 'المتبقي', tag: money(na.due), tagTone: na.due > 0 ? 'warn' : 'ok' }));
      na.bs.forEach(function (b) { rows.push(X({ icon: 'i-pot', icTone: 'warn', title: batchName(b), sub: dlabel(b.date) + ' · ' + pl(b.pots || 0, 'قدر واحد', 'قدران', 'قدور'), tag: batchCostTxt(b), tagTone: 'mute', chev: true, go: function () { openSh({ t: 'bview', id: b.id }); }, lp: function () { batchQa(b); } })); });
      return { acts: [X({ title: 'كشف الحساب', icon: 'i-doc', go: function () { openSh({ t: 'stmt', id: ni.id }, { m: '' }); } }), X({ title: 'إضافة مبلغ', icon: 'i-plus', go: function () { openSh({ t: 'iniChg', id: ni.id }, { amt: '', note: '', kind: '' }); } })], title: ni.name, sub: ni.occ || 'مبادرة', rows: rows,
        ft: { label: 'تسجيل دفعة', ok: true, go: function () { openSh({ t: 'iniPay', id: ni.id }, { fund: '', amt: '', note: '', rate: '' }); } },
        ft2: { label: 'طبخة جديدة', go: function () { startIniBatch(ni.id); } } };
    }
    case 'iniPay': case 'iniPayEd': {
      var ed = sh.t === 'iniPayEd', pi = inst(sh.id), pa = iniAcct(pi), pamt = num('amt'), fid = fv('fund'), pf = fid ? fund(fid) : null, usdOnly = !!pf && !hasCur(pf, 'ils'), rt = num('rate');
      var fl = [fText('amt', 'المبلغ بالشيكل', '0', 'decimal'), (ed ? null : fQuick('amt', 'مبالغ سريعة', pa.due > 0 ? [Math.min(pa.due, 100), pa.due].filter(function (v, k, a) { return a.indexOf(v) === k; }) : [50, 100, 200])),
        fChips('fund', 'يدخل في رصيد (اختياري)', [['', 'بدون']].concat(funds().map(function (x) { return [x.id, x.name]; })), 'إن اخترت رصيدًا زاد رصيده بالمبلغ.')];
      if (usdOnly) { if (fv('rate') === '' && lastRate()) A.form.rate = String(lastRate()); fl.push(fText('rate', 'سعر الصرف (شيكل لكل دولار)', '3.2', 'decimal', 'الرصيد بالدولار فقط، فيدخل ما يقابل المبلغ')); }
      fl.push(fText('note', 'ملاحظة (اختياري)', 'مثال: عربون')); fl = fl.concat(dayFields()); if (!ed) fl.push(fPhoto('صورة سند القبض (اختياري)'));
      var R = { title: (ed ? 'تعديل دفعة من ' : 'دفعة من ') + pi.name, sub: ed ? undefined : 'المتبقي ' + money(pa.due), fields: fl.filter(Boolean),
        ft: { label: ed ? 'حفظ التعديل' : 'تسجيل الدفعة', ok: pamt > 0 && dayOk() && (!usdOnly || rt > 0), go: function () { if (ed) doIniPayEdit(pi.id, sh.k, rt); else doIniPay(pi.id, pamt, fid, (fv('note') || '').trim(), rt, moveDate()); } } };
      if (ed) R.ft2 = { label: 'حذف الدفعة', go: function () { doIniPayDel(pi.id, sh.k); } };
      return R;
    }
    case 'iniChg': case 'iniChgEd': {
      var ced = sh.t === 'iniChgEd', ci = inst(sh.id), camt = num('amt');
      var R2 = { title: (ced ? 'تعديل إضافة على ' : 'إضافة على حساب ') + ci.name, fields: [fText('amt', 'المبلغ بالشيكل', '0', 'decimal'), fChips('kind', 'النوع', CHG_KINDS), fText('note', 'البيان (اختياري)', 'مثال: طبخة الأحد')].concat(dayFields()),
        ft: { label: ced ? 'حفظ التعديل' : 'إضافة', ok: camt > 0 && dayOk(), go: function () { if (ced) doIniChgEdit(ci.id, sh.k); else doIniChg(ci.id, camt, (fv('note') || '').trim(), fv('kind'), moveDate()); } } };
      if (ced) R2.ft2 = { label: 'حذف الإضافة', go: function () { doIniChgDel(ci.id, sh.k); } };
      return R2;
    }
  }
  return null;
}

/* ===== 02o-order.js ===== */
/* ---------- مسودة توريد: طلبية واردة تُجهَّز سطرًا سطرًا، تُراجَع، ثم تُعتمد فتصير استلامًا عاديًا ----------
   اليوم تُجهَّز من نص يُلصق (من واتساب أو من قراءة صورة الطلبية). لاحقًا تُملأ تلقائيًا من صورة تُلتقط بالكاميرا.
   لا يتغير المخزن قبل «اعتماد التوريد». المسودة المعتمدة أو المتروكة تبقى في السجل ولا تُحذف. */
function drafts() { return (S.drafts || []).filter(function (d) { return !d.done; }); }
function draftOf(id) { return E.by(S.drafts || [], id); }
function dDigits(s) { return String(s || '').replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 1632); }).replace(/٫/g, '.').replace(/(\d),(\d)/g, '$1.$2'); }
var UNIT_TOK = /^(كيلو|كغ|كجم|كيلوغرام|كيلوجرام|غرام|جرام|غم|غ|لتر|ل|مل|حبة|حبه|حبات|علبة|علبه|علب|كيس|اكياس|أكياس|كرتونة|كرتونه|كرتون|ظرف|قطعة|قطع|شوال|جركن|ربطة|ربطه|عبوة|عبوه|kg|g|l|ml)$/i;
function unitMult(it, tok) {
  var t = norm(tok), u = norm(it.unit);
  if (!t) return { m: 1, ok: true };
  if (t === u || (u === 'كيلو' && /^(كغ|كجم|كيلوغرام|كيلوجرام|kg)$/i.test(t)) || (u === 'لتر' && /^(ل|l)$/i.test(t))) return { m: 1, ok: true };
  var pk = packsOf(it).filter(function (p) { return norm(p.name) === t || norm(p.name).replace(/^ال/, '') === t.replace(/^ال/, ''); })[0];
  if (pk) return { m: pk.n, ok: true };
  if (u === 'كيلو' && /^(غرام|جرام|غم|غ|g)$/i.test(t)) return { m: 0.001, ok: true };
  if (u === 'لتر' && /^(مل|ml)$/i.test(t)) return { m: 0.001, ok: true };
  return { m: 1, ok: false };
}
/* يطابق اسمًا مكتوبًا مع صنف من المخزن: تطابق تام (اسم أو اسم بديل)، ثم احتواء، وإلا لا شيء */
function matchItem(name) {
  var n = norm(name).replace(/^ال/, ''); if (!n) return null;
  var all = S.items.filter(function (i) { return !i.arch; }), nm = function (x) { return norm(x).replace(/^ال/, ''); };
  var ex = all.filter(function (i) { return nm(i.name) === n || (i.alias || []).some(function (a) { return nm(a) === n; }); })[0];
  if (ex) return { it: ex, sure: true };
  if (n.length < 3) return null;
  var near = all.filter(function (i) { var x = nm(i.name); return x.indexOf(n) >= 0 || n.indexOf(x) >= 0 || (i.alias || []).some(function (a) { var y = nm(a); return y.length >= 3 && (y.indexOf(n) >= 0 || n.indexOf(y) >= 0); }); })
    .sort(function (a, b) { return Math.abs(nm(a.name).length - n.length) - Math.abs(nm(b.name).length - n.length); });
  return near.length ? { it: near[0], sure: near.length === 1 } : null;
}
/* سطر نص ← {name, qty, unit, price}: يقبل «رز | 25 | كيلو | 4.5» أو «رز 25 كيلو 4.5» أو «25 كيلو رز» أو «رز: 25 كيس بسعر 120» */
function parseOrderLine(raw) {
  var t = dDigits(raw).replace(/^[\s\-\*•·]+/, '').replace(/^\d+\s*[\.\)\-]\s+(?=[^\d\s])/, '').trim(); if (!t) return null;
  var out = { name: '', qty: 0, unit: '', price: 0 }, num_ = /^\d+(?:\.\d+)?$/, junk = /^(بسعر|سعر|@|x|×|=|:|-|–|₪|شيكل|شيقل)$/i;
  var toks;
  if (/[|\t;،]/.test(t)) {
    var parts = t.split(/\s*[|\t;،]\s*/).filter(Boolean); out.name = parts.shift() || '';
    toks = parts.join(' ').split(/\s+/);
  } else {
    var all = t.replace(/[:：]/g, ' ').split(/\s+/), i0 = -1, k;
    for (k = 0; k < all.length; k++) if (num_.test(all[k])) { i0 = k; break; }
    if (i0 < 0) { out.name = t; return out; }
    if (i0 === 0) { // الكمية أولًا: «25 كيلو رز»
      var rest = all.slice(1), u0 = rest.length && UNIT_TOK.test(rest[0]) ? rest.shift() : '';
      out.qty = parseFloat(all[0]); out.unit = u0; out.name = rest.join(' ');
      return out;
    }
    out.name = all.slice(0, i0).join(' '); toks = all.slice(i0);
  }
  var got = 0;
  for (var j = 0; j < toks.length; j++) {
    var w = toks[j].replace(/[₪]$/, '');
    if (!w || junk.test(w)) continue;
    var mm = /^(\d+(?:\.\d+)?)([^\d\s]*)$/.exec(w);
    if (mm) { if (!got) { out.qty = parseFloat(mm[1]); out.unit = mm[2] || ''; got = 1; if (!out.unit && toks[j + 1] && !num_.test(toks[j + 1]) && !junk.test(toks[j + 1])) { out.unit = toks[j + 1]; j++; } } else if (!out.price) out.price = parseFloat(mm[1]); }
  }
  return out;
}
function mkDraftLine(raw, id) {
  var p = parseOrderLine(raw); if (!p) return null;
  var l = { id: id, raw: String(raw).trim(), item: null, qty: 0, price: p.price > 0 ? p.price : 0, flag: '' }, mt = p.name ? matchItem(p.name) : null;
  if (mt) { l.item = mt.it.id; var um = unitMult(mt.it, p.unit); l.qty = r3(p.qty * um.m); if (!mt.sure) l.flag = 'guess'; else if (!um.ok) l.flag = 'unit'; }
  else { l.flag = 'item'; l.qty = p.qty; }
  if (!(l.qty > 0)) l.flag = l.flag || 'qty';
  return l;
}
function parseOrder(text) {
  var out = [], n = 0;
  String(text || '').split(/\n+/).forEach(function (r) { if (!r.trim()) return; var l = mkDraftLine(r, 'l' + (++n)); if (l) out.push(l); });
  return out;
}
var DFLAG = { item: 'اختر الصنف', guess: 'تأكد من الصنف', unit: 'راجع الوحدة', kg: 'حدّد وزن الوحدة', qty: 'اكتب الكمية' };
function dNeeds(d) { return d.lines.filter(function (l) { return l.flag || !l.item || !(l.qty > 0); }); }
function dValue(d) { return d.lines.reduce(function (a, l) { return a + (l.price > 0 && l.qty > 0 ? l.qty * l.price : 0); }, 0); }
function dLineRow(d, l) {
  var it = l.item ? item(l.item) : null, bad = l.flag || !it || !(l.qty > 0);
  return X({ title: it ? it.name : (l.ocr ? (l.ocr.code ? 'كود ' + l.ocr.code : l.ocr.name || 'سطر من الصورة') : l.raw), sub: (it && norm(it.name) !== norm(l.raw) ? (l.ocr ? 'من الصورة: ' : 'من النص: ') + l.raw : (!it && l.ocr ? l.ocr.packs + ' عبوة · ' + fmt(l.ocr.w) + ' كغ' : '')) + (l.price > 0 && !E.isFree(led(d.led)) ? (it && norm(it.name) !== norm(l.raw) ? ' · ' : '') + 'سعر ' + fmt(l.price) : ''),
    tag: bad ? (DFLAG[l.flag] || 'راجع') : 'جاهز', tagTone: bad ? 'warn' : 'ok', end: l.qty > 0 ? fmt(l.qty) : '', endSub: it ? it.unit : '', chev: true,
    go: function () { openDLine(d, l); }, lp: function () { dLineQa(d, l); } });
}
function openDLine(d, l) {
  if ((l.flag === 'kg' || l.flag === 'unit') && l.ocr && l.item && !(item(l.item).unit === 'كيلو')) { openSh({ t: 'ocrkg', did: d.id, lid: l.id }, { okm: 'per', kg: '' }); return; } /* وزن الوحدة مجهول: نسأل عنه أولًا */
  openSh({ t: 'dline', did: d.id, lid: l.id }, { unitMode: 'base', qty: l.qty > 0 ? String(l.qty) : '', price: l.price > 0 ? String(l.price) : '' }); }
function dLineQa(d, l) {
  var it = l.item ? item(l.item) : null;
  qa(it ? it.name : l.raw, 'سطر في مسودة توريد', [['مراجعة وتعديل', 'i-pencil', function () { openDLine(d, l); }], ['اختيار صنف آخر', 'i-box', function () { openSh({ t: 'dpick', did: d.id, lid: l.id }); }], ['حذف السطر', 'i-minus', function () { dDelLine(d, l); }]]);
}
function dDelLine(d, l) { d.lines = d.lines.filter(function (x) { return x.id !== l.id; }); shut(); mutated('حُذف السطر من المسودة', function () { d.lines.push(l); save(); render(); }); }
function pgDraft() {
  var d = draftOf(A.did), bl = [];
  if (!d) return [B('note', { tone: 'warn', icon: 'i-alert', text: 'هذه المسودة غير موجودة.' })];
  var need = dNeeds(d), val = dValue(d), L = led(d.led), free = E.isFree(L);
  bl.push(B('note', { tone: 'info', icon: 'i-doc', text: 'مسودة توريد من ' + (d.src || 'نص') + ': لم يتغير المخزن بعد. راجع كل سطر، ثم اعتمد ليُسجَّل استلامًا عاديًا كأنك أدخلته بيدك.' }));
  var on = ocrNote(d); if (on) bl.push(B('note', on));
  if (d.ocr && OCR_IMG && OCR_IMG.did === d.id) bl.push(B('rows', { items: [X({ icon: 'i-image', icTone: 'info', title: 'عرض صورة الطلبية', sub: 'للمقارنة بالأسطر', chev: true, go: function () { openSh({ t: 'ocrimg' }, {}); } })] }));
  bl.push(B('kpi', { items: [
    X({ label: 'الأسطر', value: d.lines.length, sub: 'في المسودة' }),
    X({ label: 'تحتاج مراجعة', value: need.length, sub: need.length ? 'علّمتها بالأصفر' : 'كلها جاهزة', endTone: need.length ? 'warn' : 'ok' }),
    X({ label: free ? 'القيمة' : 'القيمة المكتوبة', value: free ? 'عيني' : val > 0 ? money(val) : '—', sub: L ? L.name : '' })
  ] }));
  bl.push(B('rows', { title: 'الأسطر', act: 'سطر', actGo: function () { openSh({ t: 'dpick', did: d.id, lid: '' }); }, items: spiceLast(d.lines).map(function (l) { return dLineRow(d, l); }), empty: 'لا أسطر: أضف سطرًا' }));
  bl.push(B('rows', { items: [
    X({ icon: 'i-box', icTone: 'ok', title: 'سيُسجَّل في ' + (L ? L.name : '—'), sub: 'بتاريخ ' + dlabel(d.date), tag: 'تعديل', tagTone: 'info', chev: true, go: function () { openSh({ t: 'dmeta', did: d.id }, { led: d.led, day: '', dtxt: d.date, hold: d.hold ? '1' : '0' }); } })
  ] }));
  if (d.hold) bl.push(B('note', { tone: 'info', icon: 'i-truck', text: 'لم يصل بعد: لا يدخل المخزن ولا يُحسب في أي تقرير حتى تضغط «وصل الآن» من «توريد قادم».' }));
  else if (d.date > today()) bl.push(B('note', { tone: 'info', icon: 'i-truck', text: 'توريد قادم: لا يدخل المخزن قبل ' + dlabel(d.date) + '، ويُسجَّل تلقائيًا في ذلك اليوم. تقدر تعدّل تاريخه متى شئت قبل ذلك.' }));
  else if (!rcvOk(d.date)) bl.push(B('note', { tone: 'warn', icon: 'i-lock', text: 'هذا اليوم مُغلق: غيّر التاريخ أو أعد فتح اليوم.' }));
  bl.push(B('btns', { items: [X({ label: 'ترك المسودة', icon: 'i-minus', go: function () { openSh({ t: 'dDrop', did: d.id }); } })] }));
  return bl;
}
function dReady(d) { return !!d && d.lines.length > 0 && !dNeeds(d).length && (rcvOk(d.date) || d.date > today() || !!d.hold); }
/* ترحيل مسودة إلى المخزن (حركات استلام بتاريخها) — يستعملها الاعتماد المباشر ووصول التوريد القادم */
function draftPost(d, date) {
  var made = [], olds = []; ocrLearn(d);
  d.lines.forEach(function (l) {
    var it = item(l.item), mv = E.addMove(S, { date: date, led: d.led, item: l.item, q: l.qty, kind: 'receive', ref: d.id, price: l.price > 0 ? l.price : undefined, note: d.src && d.src !== 'نص' ? 'توريد ' + d.src : 'مسودة توريد' });
    made.push(mv.id);
    if (l.price > 0 && !E.isFree(led(d.led))) { olds.push([it, it.price]); it.price = l.price; (d.olds = d.olds || []).push([it.id, l.price, olds[olds.length - 1][1]]); }
  });
  d.done = 'approved'; d.doneAt = today(); d.moves = made; d.date = date; delete d.hold;
  return { made: made, olds: olds };
}
function approveDraft() {
  var d = draftOf(A.did); if (!dReady(d)) return;
  if (d.date > today() || d.hold) { /* توريد قادم أو لم يصل بعد: يُجدوَل ولا يمسّ المخزن حتى يحين تاريخه (المالك 2026-11-18) */
    d.done = 'sched'; d.doneAt = today(); audit('جدولة توريد قادم: ' + pl(d.lines.length, 'صنف واحد', 'صنفين', 'أصناف') + ' إلى ' + led(d.led).name + ' بتاريخ ' + d.date);
    A.led = d.led; open('main', { tab: 'stock' });
    mutated(d.hold ? 'حُفظ: لم يصل بعد، لا يدخل المخزن حتى تضغط «وصل الآن»' : 'جُدول التوريد: يدخل المخزن في ' + dlabel(d.date), function () { d.done = ''; delete d.doneAt; A.did = d.id; setState({ page: 'order', sh: null }); save(); });
    return;
  }
  var r = draftPost(d, d.date), made = r.made, olds = r.olds;
  audit('اعتماد مسودة توريد: ' + pl(d.lines.length, 'صنف واحد', 'صنفين', 'أصناف') + ' إلى ' + led(d.led).name + ' بتاريخ ' + d.date);
  A.led = d.led; open('main', { tab: 'stock' });
  mutated('اعتُمد التوريد: ' + pl(d.lines.length, 'صنف واحد', 'صنفان', 'أصناف') + ' إلى ' + led(d.led).name, function () {
    S.moves = S.moves.filter(function (m) { return made.indexOf(m.id) < 0; }); olds.forEach(function (o) { o[0].price = o[1]; });
    d.done = ''; delete d.doneAt; delete d.moves; delete d.olds; A.did = d.id; setState({ page: 'order', sh: null }); save();
  });
}
/* وصول التوريدات القادمة: كل توريد مجدول بلغ تاريخه يدخل المخزن بتاريخه (أو اليوم إن كان يومه مغلقًا) */
function supSched() { return (S.drafts || []).filter(function (d) { return d.done === 'sched'; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; }); }
function supArrive(force) {
  var due = supSched().filter(function (d) { return force === d.id || (!d.hold && d.date <= today()); }), n = 0;
  due.forEach(function (d) { var dt = d.date <= today() && rcvOk(d.date) ? d.date : today(); draftPost(d, dt); audit('وصل توريد قادم: ' + supTitle(d) + ' إلى ' + led(d.led).name + ' بتاريخ ' + dt); n++; });
  if (n) { save(); try { render('morph'); } catch (e) {} try { say(n === 1 ? 'وصل التوريد القادم ودخل المخزن' : 'وصلت ' + n + ' توريدات قادمة ودخلت المخزن'); } catch (e) {} }
  return n;
}
try { document.addEventListener('visibilitychange', function () { if (!document.hidden) supArrive(); }); setInterval(function () { supArrive(); }, 600000); setTimeout(function () { supArrive(); }, 3000); } catch (e) {}
function doNewDraft() {
  var lines = parseOrder(fv('otxt')); if (!lines.length) return;
  var lid = fv('led') || 'kitchen', d = { id: newId('d', S.drafts || []), date: rcvDate() || today(), led: lid, src: (fv('dsrc') || '').trim() || 'نص', created: today(), lines: lines };
  S.drafts = S.drafts || []; S.drafts.push(d); audit('مسودة توريد جديدة: ' + pl(lines.length, 'سطر واحد', 'سطران', 'أسطر'));
  save(); A.did = d.id; open('order', { did: d.id });
}
function doSaveDLine(d, l, it) {
  l.item = it.id; l.qty = r3(num('qty') * unitF(it, fv('unitMode'))); l.price = num('price') > 0 ? num('price') : 0; l.flag = '';
  shut(); mutated('حُدّث السطر');
}
function orderSheet(sh) {
  var R, d, l, it;
  switch (sh.t) {
    case 'draftNew': {
      var lid = fv('led') || (led(A.led) && !led(A.led).arch ? A.led : 'kitchen'), ps = parseOrder(fv('otxt')), bad = ps.filter(function (x) { return x.flag || !x.item || !(x.qty > 0); }).length, rw = rcvWhen(true), rdt = rcvDate();
      R = { title: 'مسودة توريد', sub: 'الصق نص الطلبية الواردة: سطر لكل صنف', acts: [X({ title: 'من صورة', icon: 'i-image', go: function () { ocrPick(); } })],
        fields: [fText('dsrc', 'المصدر ورقم الطلبية (اختياري)', 'مثال: WCK RQ24574'), fArea('otxt', 'نص الطلبية', 'رز | 25 | كيلو | 4.5\nسكر 10 كيلو\nزيت 8 لتر 12'), fChips('led', 'تُسجَّل في', ledgers().map(function (x) { return [x.id, x.name]; })), rw[0]],
        note: { text: ps.length ? 'فُهم ' + pl(ps.length, 'سطر واحد', 'سطران', 'أسطر') + (bad ? '، منها ' + bad + ' تحتاج مراجعتك.' : ' وكلها جاهزة للمراجعة.') : 'اكتب الصنف ثم الكمية والوحدة، والسعر اختياريًا. صيغ مقبولة: «رز | 25 | كيلو | 4.5» أو «رز 25 كيلو» أو «25 كيلو رز». ما لم يُفهم تختاره بنفسك في الخطوة التالية.', tone: ps.length && !bad ? 'ok' : 'info' },
        ft: { label: 'تجهيز المسودة', ok: ps.length > 0 && !!rdt, go: function () { if (!A.form.led) A.form.led = lid; doNewDraft(); } } };
      break;
    }
    case 'ocrimg': R = ocrImgSheet(); break;
    case 'ocrprog': R = ocrProgSheet(); break;
    case 'ocrkg': R = ocrKgSheet(sh); break;
    case 'dline': {
      d = draftOf(sh.did); l = d && E.by(d.lines, sh.lid); if (!l) { R = { title: 'سطر' }; break; }
      it = l.item ? item(l.item) : null;
      var paid = !E.isFree(led(d.led)), fl = [];
      if (it) {
        fl.push(fChips('unitMode', 'الوحدة', [['base', it.unit]].concat(packsOf(it).map(function (p, i) { return ['p' + i, p.name + ' · ' + fmt(p.n) + ' ' + it.unit]; }))));
        fl.push(fText('qty', 'الكمية', '0', 'decimal'));
        if (paid) fl.push(fText('price', 'سعر ' + it.unit + ' (اختياري)', it.price ? 'الآن ' + fmt(it.price) : '0', 'decimal', 'يحدّث آخر سعر شراء عند الاعتماد.'));
      }
      var q = it ? r3(num('qty') * unitF(it, fv('unitMode'))) : 0;
      R = { title: it ? it.name : 'اختر الصنف', sub: (l.ocr ? 'من الصورة: ' : 'من النص: ') + l.raw,
        rows: [X({ icon: 'i-box', icTone: it ? 'ok' : 'warn', title: it ? 'الصنف: ' + it.name : 'لم يُعرف الصنف', sub: 'اضغط لاختيار صنف آخر', tag: it ? '' : 'اختر', tagTone: 'warn', chev: true, go: function () { openSh({ t: 'dpick', did: d.id, lid: l.id }); } })],
        fields: fl, note: it && q > 0 ? { text: 'سيُسجَّل استلام ' + fmt(q) + ' ' + it.unit + '.', tone: 'info' } : null,
        ft: { label: 'حفظ السطر', ok: !!it && q > 0, go: function () { doSaveDLine(d, l, it); } }, ft2: { label: 'حذف السطر', go: function () { dDelLine(d, l); } } };
      break;
    }
    case 'dpick': {
      d = draftOf(sh.did);
      R = pickOr(itemList(d.led), { title: sh.lid ? 'اختر الصنف' : 'سطر جديد', sub: sh.lid ? 'للسطر الذي لم يُفهم' : 'اختر الصنف ثم اكتب كميته', plural: 'الأصناف', addLabel: 'إضافة صنف جديد', sel: '',
        onPick: function (id) {
          var l2 = sh.lid ? E.by(d.lines, sh.lid) : null;
          if (!l2) { l2 = { id: newId('l', d.lines), raw: item(id).name, item: id, qty: 0, price: 0, flag: 'qty' }; d.lines.push(l2); }
          else if (l2.ocr) { var oq = ocrQty(item(id), null, l2.ocr); l2.item = id; l2.qty = oq.qty; l2.flag = oq.flag; }
          else { l2.item = id; l2.flag = l2.qty > 0 ? '' : 'qty'; }
          if (l2.ocr) { save(); if (l2.flag === 'kg') { shut(); openSh({ t: 'ocrkg', did: d.id, lid: l2.id }, { okm: 'per', kg: '' }); return; } shut(); return; } /* سطر الصورة: يعود للمراجعة مباشرة (الكمية من الصورة، وتُعدَّل بالضغط على السطر) */
          save(); openSh({ t: 'dline', did: d.id, lid: l2.id }, { unitMode: 'base', qty: l2.qty > 0 ? String(l2.qty) : '', price: l2.price > 0 ? String(l2.price) : '' });
        },
        onAdd: function (name) { openSh({ t: 'addItem', then: '' }, { name: name, unit: 'كيلو', price: '', packType: 'none', packN: '', cond: 'جاف' }); } });
      break;
    }
    case 'dmeta': {
      d = draftOf(sh.did); var rw2 = rcvWhen(true), dd = rcvDate();
      R = { title: 'مكان وتاريخ التوريد', sub: 'يُطبَّقان على كل أسطر المسودة', fields: [fChips('led', 'المخزن', ledgers().map(function (x) { return [x.id, x.name]; })), rw2[0], fSeg('hold', 'حالة التوريد', [['0', 'يصل في تاريخه'], ['1', 'لم يصل بعد: أدخله بيدي']])], note: rcvNote(dd),
        ft: { label: 'حفظ', ok: !!dd, go: function () { d.led = fv('led') || d.led; d.date = dd; if (fv('hold') === '1') d.hold = 1; else delete d.hold; shut(); mutated('حُدّث مكان المسودة وتاريخها'); setTimeout(function () { supArrive(); }, 0); } } };
      break;
    }
    case 'supLine': {
      d = draftOf(sh.sid); l = d && E.by(d.lines, sh.lid); if (!l || d.done !== 'approved') { R = { title: 'سطر' }; break; }
      it = item(sh.pick || l.item);
      R = { title: it ? it.name : 'اختر الصنف', sub: 'توريدة ' + supTitle(d),
        rows: [X({ icon: 'i-box', icTone: 'ok', title: 'الصنف: ' + (it ? it.name : '—'), sub: 'اضغط لاختيار صنف آخر', chev: true, go: function () { openSh({ t: 'supPick', sid: d.id, lid: l.id }); } })],
        fields: [fChips('unitMode', 'الوحدة', [['base', it.unit]].concat(packsOf(it).map(function (p, i) { return ['p' + i, p.name + ' · ' + fmt(p.n) + ' ' + it.unit]; }))), fText('qty', 'الكمية', '0', 'decimal')],
        note: { text: 'يتحدّث رصيد المخزن بالفرق مباشرة.', tone: 'info' },
        ft: { label: 'حفظ التعديل', ok: r3(num('qty') * unitF(it, fv('unitMode'))) > 0, go: function () { saveSupLine(d, l, it, r3(num('qty') * unitF(it, fv('unitMode')))); } }, ft2: { label: 'حذف السطر من التوريدة', go: function () { delSupLine(d, l); } } };
      break;
    }
    case 'supPick': {
      d = draftOf(sh.sid);
      R = pickOr(itemList(d.led), { title: 'اختر الصنف', sub: 'بدل الصنف الحالي', plural: 'الأصناف', addLabel: 'إضافة صنف جديد', sel: '',
        onPick: function (id) { var q0 = fv('qty'); openSh({ t: 'supLine', sid: d.id, lid: sh.lid, pick: id }, { unitMode: 'base', qty: q0 }); },
        onAdd: function (name) { openSh({ t: 'addItem', then: '' }, { name: name, unit: 'كيلو', price: '', packType: 'none', packN: '', cond: 'جاف' }); } });
      break;
    }
    case 'supVoid': {
      d = draftOf(sh.sid);
      R = { title: 'إلغاء التوريدة؟', sub: d ? supTitle(d) : '', note: { text: 'تُزال كميات هذه التوريدة (' + pl(d ? d.lines.length : 0, 'صنف واحد', 'صنفان', 'أصناف') + ') من المخزن، وتبقى في السجل معلّمة «أُلغيت». إن كان بعضها قد صُرف فسيظهر الرصيد بالسالب للمطالبة.', tone: 'warn' },
        ft: { label: 'إلغاء التوريدة', ok: !!d, go: function () { voidSupply(d); } }, ft2: { label: 'رجوع', go: shut } };
      break;
    }
    case 'dDrop': {
      d = draftOf(sh.did);
      R = { title: 'ترك المسودة؟', sub: 'لن يتغير المخزن', note: { text: 'تُخفى من القائمة ويبقى سجلها. لا شيء يُحذف من المخزن لأنها لم تُعتمد.', tone: 'info' },
        ft: { label: 'تركها وإخفاؤها', ok: true, go: function () { d.done = 'dropped'; d.doneAt = today(); audit('ترك مسودة توريد (' + pl(d.lines.length, 'سطر واحد', 'سطران', 'أسطر') + ')'); A.did = null; shut(); open('main', { tab: 'stock' }); mutated('أُخفيت المسودة'); } }, ft2: { label: 'رجوع', go: shut } };
      break;
    }
  }
  return R;
}

/* ---------- سجل التوريدات: كل مسودة معتمدة = توريدة مستقلة بأسطرها، ويمكن إلغاؤها كاملة ---------- */
function supplies() { return (S.drafts || []).filter(function (d) { return d.done === 'approved' || d.done === 'voided' || d.done === 'sched'; }).sort(function (a, b) { return (b.date + (b.doneAt || '')) < (a.date + (a.doneAt || '')) ? -1 : 1; }); }
function supMoves(d) {
  if (d.moves && d.moves.length) return d.moves.filter(function (id) { return E.by(S.moves, id); });
  var used = {}, out = [];
  (S.drafts || []).forEach(function (x) { (x.moves || []).forEach(function (id) { used[id] = 1; }); });
  d.lines.forEach(function (l) {
    var m = S.moves.filter(function (m) { return !used[m.id] && m.kind === 'receive' && m.date === d.date && m.led === d.led && m.item === l.item && Math.abs(m.q - l.qty) < 0.001 && (m.ref === d.id || (!m.ref && /توريد/.test(m.note || ''))); })[0];
    if (m) { used[m.id] = 1; out.push(m.id); }
  });
  return out;
}
function supTitle(d) { return d.src && d.src !== 'نص' ? d.src : 'توريدة ' + dlabel(d.date); }
function pgSupplies() {
  var sp = supplies(), act = sp.filter(function (d) { return d.done === 'approved'; }), kit = function (d) { return d.led === 'kitchen'; };
  var nItems = {}; act.forEach(function (d) { d.lines.forEach(function (l) { nItems[l.item || l.raw] = 1; }); });
  return [B('acts', { items: [
      X({ title: 'مسودة توريد', icon: 'i-doc', go: function () { openSh({ t: 'draftNew' }, { led: 'kitchen', otxt: '', dtxt: today() }); } }),
      X({ title: 'استلام مواد', icon: 'i-truck', go: function () { openSh({ t: 'recv', item: null }, { led: 'kitchen' }); } })] }),
    B('kpi', { items: [X({ label: 'التوريدات', value: act.length, go: function () { openSh({ t: 'kSup' }); } }), X({ label: 'الأصناف', value: Object.keys(nItems).length, go: function () { openSh({ t: 'kSupI' }); } }), X({ label: 'آخر توريدة', value: act.length ? dshow(act[0].date).slice(0, -5) : '—', sub: act.length ? supTitle(act[0]) : '', go: act.length ? function () { open('supply', { sid: act[0].id }); } : undefined })] }),
    B('rows', { items: sp.map(function (d) {
      return X({ icon: 'i-truck', icTone: d.done === 'voided' ? 'warn' : 'ok', title: supTitle(d), sub: dlabel(d.date) + (kit(d) || !led(d.led) ? '' : ' · ' + led(d.led).name) + ' · ' + pl(d.lines.length, 'صنف واحد', 'صنفان', 'أصناف'), tag: d.done === 'voided' ? 'أُلغيت' : d.done === 'sched' ? (d.hold ? 'بانتظار الوصول' : 'قادمة') : '', tagTone: d.done === 'sched' ? 'info' : 'warn', chev: true, go: function () { open('supply', { sid: d.id }); }, lp: function () { supplyQa(d); } });
    }), empty: 'لا توريدات معتمدة بعد' })];
}
function pgSupply() {
  var d = draftOf(A.sid), bl = [];
  if (!d) return [B('note', { tone: 'warn', icon: 'i-alert', text: 'هذه التوريدة غير موجودة.' })];
  var L = led(d.led), free = E.isFree(L), val = dValue(d);
  if (d.done === 'sched' && d.hold) bl.push(B('note', { tone: 'info', icon: 'i-truck', text: 'لم يصل بعد · لا يدخل المخزن ولا التقارير حتى «وصل الآن»' }));
  else if (d.done === 'sched') bl.push(B('note', { tone: 'info', icon: 'i-truck', text: 'قادم · يدخل المخزن تلقائيًا في ' + dlabel(d.date) }));
  if (d.done === 'voided') bl.push(B('note', { tone: 'warn', icon: 'i-lock', text: 'أُلغيت هذه التوريدة' + (d.voidAt ? ' بتاريخ ' + dlabel(d.voidAt) : '') + (d.schedVoid ? ' قبل أن تصل، فلم يدخل المخزن منها شيء.' : ' وأُزيلت كمياتها من المخزن.') }));
  bl.push(B('kpi', { items: [X({ label: 'الأصناف', value: d.lines.length }), X({ label: 'التاريخ', value: dshow(d.date).slice(0, -5), sub: L && d.led !== 'kitchen' ? L.name : '' }), X({ label: free ? 'القيمة' : 'القيمة المكتوبة', value: free ? 'عيني' : val > 0 ? money(val) : '—', sub: '' })] }));
  bl.push(B('rows', { title: 'الأصناف', items: spiceLast(d.lines).map(function (l) { var it = item(l.item); return X({ title: it ? it.name : l.raw, sub: l.price > 0 && !free ? 'بسعر ' + money(l.price) : '', end: fmt(l.qty) + ' ' + (it ? it.unit : ''), endSub2: it ? packTxt(it, l.qty) : '', chev: d.done === 'approved', go: d.done === 'approved' ? function () { openSh({ t: 'supLine', sid: d.id, lid: l.id }, { unitMode: 'base', qty: String(l.qty) }); } : noop }); }), empty: '' }));
  if (d.done === 'sched') bl.unshift(B('acts', { items: [X({ title: 'تعديل التاريخ', icon: 'i-calendar', go: function () { openSh({ t: 'dmeta', did: d.id }, { led: d.led, day: '', dtxt: d.date, hold: d.hold ? '1' : '0' }); } }), X({ title: 'وصل الآن', icon: 'i-truck', go: function () { d.date = today(); supArrive(d.id); } }), X({ title: 'إلغاء', icon: 'i-minus', go: function () { d.done = 'voided'; d.voidAt = today(); d.schedVoid = 1; audit('إلغاء توريد قادم: ' + supTitle(d)); save(); open('supplies'); mutated('أُلغي التوريد القادم', function () { d.done = 'sched'; delete d.voidAt; delete d.schedVoid; save(); render(); }); } })] }));
  if (d.done === 'approved') bl.unshift(B('acts', { items: [X({ title: 'إلغاء التوريدة', icon: 'i-minus', go: function () { openSh({ t: 'supVoid', sid: d.id }); } })] }));
  return bl;
}
function supLineMove(d, l) { var ids = supMoves(d); return S.moves.filter(function (m) { return ids.indexOf(m.id) >= 0 && m.item === l.item && Math.abs(m.q - l.qty) < 0.001; })[0]; }
function saveSupLine(d, l, it, q) {
  var mv = supLineMove(d, l); if (!mv) { shut(); say('تعذّر إيجاد حركة هذا الصنف في المخزن'); return; }
  var o = { i: mv.item, q: mv.q, li: l.item, lq: l.qty };
  mv.item = it.id; mv.q = q; l.item = it.id; l.qty = q; if (!d.moves || d.moves.indexOf(mv.id) < 0) d.moves = ids0(d, mv.id);
  audit('تعديل سطر في توريدة ' + supTitle(d) + ': ' + it.name + ' ' + fmt(q) + ' ' + it.unit);
  shut(); mutated('عُدّل السطر وتحدّث المخزن', function () { mv.item = o.i; mv.q = o.q; l.item = o.li; l.qty = o.lq; save(); render(); });
}
function ids0(d, extra) { var a = supMoves(d); if (extra && a.indexOf(extra) < 0) a.push(extra); return a; }
function delSupLine(d, l) {
  var mv = supLineMove(d, l); if (!mv) { shut(); say('تعذّر إيجاد حركة هذا الصنف في المخزن'); return; }
  d.moves = ids0(d); S.moves = S.moves.filter(function (m) { return m.id !== mv.id; }); d.moves = d.moves.filter(function (x) { return x !== mv.id; }); d.lines = d.lines.filter(function (x) { return x.id !== l.id; });
  audit('حذف سطر من توريدة ' + supTitle(d) + ': ' + (item(mv.item) ? item(mv.item).name : ''));
  shut(); mutated('حُذف السطر وتحدّث المخزن', function () { S.moves.push(mv); d.moves.push(mv.id); d.lines.push(l); save(); render(); });
}
function voidSupply(d) {
  var ids = supMoves(d), gone = S.moves.filter(function (m) { return ids.indexOf(m.id) >= 0; });
  S.moves = S.moves.filter(function (m) { return ids.indexOf(m.id) < 0; });
  (d.olds || []).forEach(function (o) { var it = item(o[0]); if (it && it.price === o[1]) it.price = o[2]; });
  d.done = 'voided'; d.voidAt = today();
  audit('إلغاء توريدة: ' + supTitle(d) + ' (' + pl(gone.length, 'حركة واحدة', 'حركتان', 'حركات') + ')');
  shut(); open('supplies');
  mutated('أُلغيت التوريدة وأُزيلت كمياتها من المخزن', function () { gone.forEach(function (m) { S.moves.push(m); }); d.done = 'approved'; delete d.voidAt; save(); render(); });
}

/* ===== 02o2-ocr.js ===== */
/* ---------- مسودة توريد من صورة طلبية WCK ----------
   تُقرأ الصورة على الهاتف نفسه (tesseract.js، بلا إرسال الصورة لأي جهة): الكود والعبوات والوزن الكلي لكل سطر،
   فتُبنى «مسودة توريد» عادية تمر بشاشة المراجعة (لا يتغير المخزن قبل الاعتماد).
   الأداة (≈11MB) تُحمَّل من مستودع التحديث عند أول استعمال فقط وتُخزَّن. الأكواد تُربط بالصنف مرة واحدة عند اعتماد المسودة. */
var OCR_IMG = null;
function ocrBase() { return window.OCR_BASE || (UPD_URL + 'ocr/'); }
function ocrLib() {
  return new Promise(function (ok, no) {
    if (window.Tesseract) return ok(window.Tesseract);
    var s = document.createElement('script'); s.src = ocrBase() + 'tesseract.min.js'; s.onload = function () { ok(window.Tesseract); }; s.onerror = function () { no(new Error('net')); }; document.head.appendChild(s);
  });
}
/* مراحل القراءة تُعرض للمالك دائمًا، ومن لا يتحرك 60 ثانية يُبلَّغ باسم المرحلة العالقة بدل صمت */
var OCR_STAGE = '', OCR_T = 0;
/* نافذة تقدّم دائمة (دوّارة + شريط + عدّاد ثواني) بدل رسالة عابرة تختفي: يعرف المالك أن العمل ما زال جاريًا */
var OCR_B = null, OCR_KILL = null, OCR_TICK = 0;
function ocrStage(msg, pct) {
  OCR_STAGE = msg; OCR_T = Date.now(); if (!OCR_B) OCR_B = { t0: Date.now() };
  OCR_B.text = msg; OCR_B.pct = pct == null ? -1 : pct;
  if (!A.sh || A.sh.t !== 'ocrprog') openSh({ t: 'ocrprog' }, {}); else UI.render('morph');
  if (!OCR_TICK) OCR_TICK = setInterval(function () { if (!OCR_B) { clearInterval(OCR_TICK); OCR_TICK = 0; return; } if (A.sh && A.sh.t === 'ocrprog') UI.render('morph'); }, 1000);
}
function ocrEnd() { OCR_B = null; if (OCR_TICK) { clearInterval(OCR_TICK); OCR_TICK = 0; } if (A.sh && A.sh.t === 'ocrprog') shut(); }
function ocrCancel() { if (OCR_KILL) OCR_KILL(new Error('cancel')); }
function ocrProgSheet() {
  var secs = OCR_B ? Math.round((Date.now() - OCR_B.t0) / 1000) : 0;
  return { title: 'قراءة الطلبية', sub: 'ما زال العمل جاريًا: لا تغلق التطبيق', busy: { text: OCR_B ? OCR_B.text : '', pct: OCR_B ? OCR_B.pct : -1, hint: 'مرّت ' + secs + ' ثانية' + (secs > 8 ? ' · أول مرة أبطأ لأن أداة القراءة تُحمَّل' : '') },
    ft: { label: 'إلغاء', ok: true, go: ocrCancel } };
}
var OCR_ST = { 'loading tesseract core': 'تحميل أداة القراءة (مرة واحدة)', 'loading language traineddata': 'تحميل بيانات القراءة (مرة واحدة)', 'initializing tesseract': 'تهيئة أداة القراءة', 'initializing api': 'تهيئة أداة القراءة', 'recognizing text': 'قراءة الصورة' };
function ocrWorker(kill, langs) {
  return ocrLib().then(function (T) {
    return T.createWorker(langs || 'eng', 1, { workerPath: ocrBase() + 'worker.min.js', corePath: ocrBase(), langPath: ocrBase(), gzip: true,
      errorHandler: function (e) { kill(e instanceof Error ? e : new Error(String(e))); },
      logger: function (m) { var t = OCR_ST[m.status]; if (t) ocrStage('جارٍ ' + t + (m.progress >= 0 && m.progress < 1 ? ' ' + Math.round(m.progress * 100) + '%' : '…'), m.progress >= 0 && m.progress < 1 ? m.progress : null); else OCR_T = Date.now(); } });
  }).then(function (w) { return w.setParameters({ tessedit_pageseg_mode: '6', preserve_interword_spaces: '1' }).then(function () { return w; }); });
}
function ocrRace(p, dead) {
  return new Promise(function (ok, no) {
    var iv = setInterval(function () { if (Date.now() - OCR_T > 60000) { clearInterval(iv); no(new Error('stall')); } }, 3000);
    dead.catch(function (e) { clearInterval(iv); no(e); });
    p.then(function (v) { clearInterval(iv); ok(v); }, function (e) { clearInterval(iv); no(e); });
  });
}
/* فكّ الصورة: createImageBitmap مع احترام اتجاه الكاميرا، وإلا عبر عنصر img (بعض الأجهزة لا تدعم الأولى) */
function ocrDecode(file) {
  var viaImg = function () { return new Promise(function (ok, no) { var u = URL.createObjectURL(file), im = new Image(); im.onload = function () { ok(im); }; im.onerror = function () { no(new Error('decode')); }; im.src = u; }); };
  if (!window.createImageBitmap) return viaImg();
  return createImageBitmap(file, { imageOrientation: 'from-image' }).catch(function () { return createImageBitmap(file); }).catch(viaImg);
}
/* تكبير الصورة ورمادية خفيفة: الأكواد الصغيرة تُقرأ بعدها بدقة (جُرّب على صورة حقيقية) */
function ocrPrep(file) {
  return ocrDecode(file).then(function (bm) {
    var bw = bm.naturalWidth || bm.width, bh = bm.naturalHeight || bm.height, sc = bw > 2600 ? 2600 / bw : Math.min(2.5, Math.max(1, 1800 / bw)), c = document.createElement('canvas'); c.width = Math.round(bw * sc); c.height = Math.round(bh * sc);
    var x = c.getContext('2d'); x.filter = 'grayscale(1) contrast(1.15)'; x.drawImage(bm, 0, 0, c.width, c.height);
    var t = document.createElement('canvas'), ts = Math.min(1, 900 / bw); t.width = Math.round(bw * ts); t.height = Math.round(bh * ts); t.getContext('2d').drawImage(bm, 0, 0, t.width, t.height);
    return { cv: c, thumb: t.toDataURL('image/jpeg', 0.7) };
  });
}
function ocrKnownCodes() { return Object.keys((S.settings && S.settings.itemCodes) || {}); }
function ocrLev1(a, b) { if (a === b) return true; if (Math.abs(a.length - b.length) > 1) return false; var i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return a.slice(i + 1) === b.slice(i + 1) || a.slice(i) === b.slice(i + 1) || a.slice(i + 1) === b.slice(i); }
/* ---- جدول بلا أكواد (اسم عربي + كمية + وزن): تُقرأ الأسماء بلغة العربية وتُطابَق بالأصناف تقريبيًا، وكل مطابقة تقريبية «تأكد من الصنف» ---- */
var OCR_NOISE = { 'كع': 1, 'كغ': 1, 'كم': 1, 'كجم': 1, 'خع': 1, 'كيلو': 1 };
function ocrNameOf(rest) { return (String(rest).match(/[؀-ۿ]+/g) || []).filter(function (x) { return x.length > 1 && !OCR_NOISE[x]; }).join(' '); }
function ocrNw(x) { return norm(String(x).replace(/\([^)]*\)/g, ' ')).replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[^؀-ۿ\s]/g, ' ').split(/\s+/).filter(Boolean).map(function (w) { return w.replace(/^ال/, ''); }).filter(function (w) { return w.length > 1; }); }
var OCR_GEN = { 'معلب': 1, 'معلبه': 1, 'علب': 1, 'علبه': 1, 'طازج': 1, 'مطحون': 1, 'مطحونه': 1, 'قطع': 1, 'شرائح': 1 };
function ocrWordEq(a, b) { if (a === b) return true; if (a.length >= 3 && b.length >= 3 && (a.indexOf(b) >= 0 || b.indexOf(a) >= 0)) return true; return a.length >= 4 && b.length >= 4 && ocrLev1(a, b); }
function ocrNameMatch(name) {
  var ex = matchItem(name); if (ex && ex.sure) return { it: ex.it, sure: true };
  var ow = ocrNw(name), best = null, bs = 0, bn = 0, tie = false; if (!ow.length) return null;
  S.items.filter(function (i) { return !i.arch; }).forEach(function (i) {
    [i.name].concat(i.alias || []).forEach(function (nm) {
      var cw = ocrNw(nm); if (!cw.length) return;
      var hit = cw.filter(function (c) { return ow.some(function (o) { return ocrWordEq(c, o); }); }), core = hit.filter(function (c) { return !OCR_GEN[c]; }).length;
      if (!core) return;
      var sc = hit.length / cw.length; if (sc < 0.5) return;
      var key = sc * 10 + hit.length; if (key > bs) { bs = key; best = i; bn = hit.length; tie = false; } else if (key === bs && best && best.id !== i.id) tie = true;
    });
  });
  return best ? { it: best, sure: false, tie: tie } : null;
}
function nameKg(n) { var m = /علبة\s*([\d.]+)\s*كجم/.exec(String(n || '')); return m ? parseFloat(m[1]) : 0; }
/* نص التعرّف ← أسطر {code, packs, w}: السطر الذي فيه «pack» وكود (حرف + 4 أرقام) ووزن بخانتين عشريتين */
function ocrRows(text, byName) {
  var rows = [], total = null, rq = (/RQ\d{4,}/.exec(text) || [''])[0], wck = /WCK/i.test(text), known = ocrKnownCodes();
  String(text || '').split('\n').forEach(function (ln) {
    var pk = /(\d+)\s*pack/i.exec(ln), w = /(\d{1,3}(?:,\d{3})+|\d+)\.(\d{2})(?!\d)/.exec(ln);
    if (!pk) { var tm = /^\s*(\d{1,3}(?:,\d{3})*|\d+)\.(\d{2})\s*\S{0,5}\s*$/.exec(ln) || (byName ? /^\s*(\d{1,3}(?:,\d{3})+|\d+)\.(\d{2})\s+\d{3,}/.exec(ln) : null); if (tm) total = parseFloat((tm[1] + '.' + tm[2]).replace(/,/g, '')); return; }
    /* الكود آخر رمز في السطر قبل رقم الصف: حرف + 4 أرقام، وقد يُقرأ الصفر «O/o» والحرف E «£» وصفر زائد */
    if (byName) { /* الوزن الكلي = العبوات × وزن العبوة: يُصحَّح به رقم فقدت نقطته العشرية («200» بدل 2.00) */
      var nn = (ln.slice(0, pk.index).match(/\d[\d,]*(?:\.\d+)?/g) || []).map(function (x) { var v = parseFloat(x.replace(/,/g, '')); return /\./.test(x) || !(v >= 100 && v % 100 === 0) ? v : v / 100; }), pks = parseInt(pk[1], 10), uw = nn.length > 1 ? nn[nn.length - 1] : 0, tw = nn.length ? nn[0] : 0;
      if (uw > 0 && pks > 0 && Math.abs(pks * uw - tw) > 0.011) tw = r2(pks * uw);
      if (tw > 0) rows.push({ code: '', codeOk: false, name: ocrNameOf(ln.slice(pk.index + pk[0].length)), packs: pks, w: tw }); return; }
    var cms = ln.match(/[A-Za-z£][0-9OoQD]{3,5}(?![0-9A-Za-z])/g), cr = cms ? cms[cms.length - 1] : '', code = '', okc = false;
    if (!w) return;
    if (cr) {
      var dg = cr.slice(1).replace(/[OoQD]/g, '0'); if (dg.length === 5 && dg[0] === '0') dg = dg.slice(1);
      code = (cr[0] === '£' ? 'E' : cr[0].toUpperCase()) + dg; okc = /^[A-Z]\d{4}$/.test(code);
      if (!okc) { var fz = known.filter(function (k) { return k[0] === code[0] && ocrLev1(k, code); }); if (fz.length === 1) { code = fz[0]; okc = true; } }
    }
    rows.push({ code: code, codeOk: okc, packs: parseInt(pk[1], 10), w: parseFloat((w[1] + '.' + w[2]).replace(/,/g, '')) });
  });
  return { rows: rows, total: total, rq: rq, wck: wck };
}
/* الكمية بوحدة الصنف: الكود المحفوظ يعرف وزن العبوة (زيت 20 لتر)، وإلا فالوزن الكلي للأصناف بالكيلو، وغيرها تُراجَع */
function ocrQty(it, m, r) {
  if (m && m.per > 0) return { qty: r3(r.packs * m.per), flag: '' };
  if (norm(it.unit) === 'كيلو') return { qty: r.w, flag: '' };
  var kp = it.kgPer > 0 ? it.kgPer : nameKg(it.name); if (kp > 0) return { qty: r3(r.w / kp), flag: '' }; /* وزن الوحدة معروف: 672 كغ ÷ 0.8 = 840 علبة */
  return { qty: 0, flag: 'kg' }; /* وزن الوحدة مجهول: لا نكتب الكيلوغرامات كأنها وحدات، نسأل مرة واحدة */
}
function ocrDraft(pr, ctx) {
  ctx = ctx || {};
  var map = (S.settings && S.settings.itemCodes) || {}, sum = 0, lines = pr.rows.map(function (r, i) {
    sum = r2(sum + r.w);
    var m = map[r.code], it = m && item(m.item) && !item(m.item).arch ? item(m.item) : null, nmt = !r.code && r.name ? ocrNameMatch(r.name) : null, l = { id: 'l' + (i + 1), raw: (r.code ? r.code + ' · ' : r.name ? r.name + ' · ' : '') + r.packs + ' عبوة · ' + fmt(r.w) + ' كغ', item: null, qty: r.w, price: 0, flag: 'item', ocr: { code: r.code, name: r.name || '', packs: r.packs, w: r.w, ok: r.codeOk } };
    if (nmt) { var qn = ocrQty(nmt.it, null, r); l.item = nmt.it.id; l.qty = qn.qty; l.flag = qn.flag || (nmt.sure ? '' : 'guess'); l.ocr.fz = !nmt.sure; }
    else if (it) { var q = ocrQty(it, m, r); l.item = it.id; l.qty = q.qty; l.flag = q.flag; }
    return l;
  });
  var lid = ctx.led || fv('led') || 'kitchen', d = { id: newId('d', S.drafts || []), date: ctx.date || rcvDate() || today(), led: lid, src: pr.rq ? (pr.wck ? 'WCK ' : '') + pr.rq : 'صورة', created: today(), lines: lines,
    ocr: { total: pr.total, sum: sum, n: lines.length, ok: pr.total != null && Math.abs(sum - pr.total) < 0.005 } };
  S.drafts = S.drafts || []; S.drafts.push(d); audit('مسودة توريد من صورة: ' + pl(lines.length, 'سطر واحد', 'سطران', 'أسطر'));
  if (OCR_IMG) OCR_IMG.did = d.id;
  save(); A.did = d.id; open('order', { did: d.id }); say('قُرئ ' + pl(lines.length, 'سطر واحد', 'سطران', 'أسطر') + ': راجع الأصناف');
  return d;
}
function ocrRun(file) {
  var kill, dead = new Promise(function (ok, no) { kill = no; }); dead.catch(function () {}); OCR_KILL = kill;
  var ctx = { led: fv('led'), date: rcvDate() }; /* تُلتقط قبل أن تحلّ نافذة التقدّم محل نافذة المسودة */
  ocrStage('جارٍ تجهيز الصورة…');
  var chain = ocrPrep(file).then(function (pp) {
    OCR_IMG = { url: pp.thumb, did: '' }; ocrStage('جارٍ تحميل أداة القراءة…');
    var pass = function (langs) { return ocrWorker(kill, langs).then(function (w) { ocrStage('جارٍ قراءة الصورة…'); return w.recognize(pp.cv).then(function (r) { return w.terminate().then(function () { return r.data.text; }); }); }); };
    /* القراءة الأولى للأكواد؛ وإن لم تجد كودًا واحدًا فالجدول بأسماء عربية: قراءة ثانية بالعربية (تُحمَّل مرة واحدة) */
    return pass('eng').then(function (t1) { return ocrRows(t1).rows.some(function (r) { return r.codeOk; }) ? { text: t1, names: false } : pass(['ara', 'eng']).then(function (t2) { return { text: t2, names: true }; }); });
  });
  return ocrRace(chain, dead).then(function (text) {
    var pr = ocrRows(text.text, text.names);
    ocrEnd(); OCR_KILL = null;
    if (!pr.rows.length) { say('لم أجد أسطر طلبية في الصورة: صوّر الجدول كاملًا ومستقيمًا'); return null; }
    return ocrDraft(pr, ctx);
  }).catch(function (e) {
    var m = String((e && e.message) || e); ocrEnd(); OCR_KILL = null;
    if (m === 'cancel') { say('أُلغيت القراءة'); return null; }
    say(m === 'stall' ? 'توقفت القراءة عند «' + OCR_STAGE.replace(/[…]+$/, '') + '»: تأكد من الإنترنت وجرّب مرة أخرى' : m === 'net' ? 'تحتاج اتصالًا بالإنترنت لتحميل أداة القراءة (مرة واحدة)' : 'تعذّرت قراءة الصورة (' + m.slice(0, 60) + ')');
    return null;
  });
}
function ocrPick() {
  var f = $('ofile');
  if (!f) { f = phMk('ofile', false); f.addEventListener('change', function () { if (f.files[0]) ocrRun(f.files[0]); f.value = ''; }); }
  f.click();
}
/* ما يُتعلَّم عند الاعتماد: كود الطلبية ← الصنف ووزن العبوة بوحدته (فيُربط الطلب القادم تلقائيًا) */
/* وحدة الصنف الأساسية (لتر، علبة...) هي المرجع: الأصل «كم وحدة في العبوة» مضروبًا بعدد عبوات الصورة؛ والكيلو بديل اختياري (وزن الوحدة) يُحفظ في الصنف */
function ocrSetPer(d, it, code, per) {
  (d.lines || []).forEach(function (l) { if (l.ocr && l.item === it.id && l.ocr.code === code && l.ocr.packs > 0) { l.qty = r3(l.ocr.packs * per); l.flag = l.ocr.fz ? 'guess' : ''; } });
}
function ocrSetKg(d, it, kg) {
  it.kgPer = r3(kg);
  (d.lines || []).forEach(function (l) { if (l.ocr && l.item === it.id) { var q = ocrQty(it, null, l.ocr); l.qty = q.qty; l.flag = q.flag || (l.ocr.fz ? 'guess' : ''); } });
}
function ocrKgSheet(sh) {
  var d = draftOf(sh.did), l = d && E.by(d.lines, sh.lid), it = l && l.item ? item(l.item) : null;
  if (!it) return { title: 'كمية الصنف' };
  var o = l.ocr, per = fv('okm') !== 'kg', x = num('kg'), q = x > 0 ? (per ? r3(o.packs * x) : r3(o.w / x)) : 0;
  return { title: 'كم ' + it.unit + ' في الصورة؟', sub: it.name + ' · الصورة تكتب ' + o.packs + ' عبوة (' + fmt(o.w) + ' كغ)',
    fields: [fChips('okm', 'احسبها بـ', [['per', it.unit + ' في العبوة الواحدة'], ['kg', 'وزن ' + it.unit + ' الواحدة (كغ)']]),
      fText('kg', per ? 'كم ' + it.unit + ' في العبوة الواحدة' : 'وزن ' + it.unit + ' الواحدة (كغ)', per ? 'مثلًا 20' : 'مثلًا 0.92', 'decimal', per ? 'يُحفظ مع كود العبوة عند الاعتماد فلا يُسأل عنه ثانيةً.' : 'يُحفظ في الصنف فلا يُسأل عنه ثانيةً.')],
    note: q > 0 ? { text: (per ? o.packs + ' عبوة × ' + fmt(x) : fmt(o.w) + ' كغ ÷ ' + fmt(x)) + ' = ' + fmt(q) + ' ' + it.unit, tone: 'info' } : null,
    ft: { label: 'حفظ', ok: x > 0, go: function () { if (per) ocrSetPer(d, it, o.code, x); else ocrSetKg(d, it, x); shut(); mutated('حُدّدت كمية ' + it.name); } } };
}
function ocrLearn(d) {
  (d.lines || []).forEach(function (l) {
    if (l.ocr && l.item && !l.ocr.code && l.ocr.name && l.ocr.name.length >= 3) { var li = item(l.item); if (li && li.name !== l.ocr.name && (li.alias || []).indexOf(l.ocr.name) < 0) { li.alias = (li.alias || []).concat([l.ocr.name]); } return; } /* الاسم المقروء يصير اسمًا بديلًا للصنف فيُربط تلقائيًا في الطلب القادم */
    if (!l.ocr || !l.item || !l.ocr.ok || !/^[A-Z]\d{4}$/.test(l.ocr.code)) return;
    S.settings.itemCodes = S.settings.itemCodes || {};
    S.settings.itemCodes[l.ocr.code] = { item: l.item, per: l.ocr.packs > 0 ? r3(l.qty / l.ocr.packs) : 0 };
  });
}
/* شريط التحقق في شاشة المراجعة: مجموع الأوزان المقروءة مقابل إجمالي الطلبية المكتوب في الصورة */
function ocrNote(d) {
  var o = d.ocr; if (!o) return null;
  if (o.total == null) return { tone: 'warn', icon: 'i-alert', text: 'قُرئ ' + pl(o.n, 'سطر واحد', 'سطران', 'أسطر') + ' من الصورة، لكن لم أجد الإجمالي لأقارنه: قارن الأسطر بالصورة.' };
  return o.ok ? { tone: 'info', icon: 'i-check', text: 'مجموع الأوزان المقروءة ' + fmt(o.sum) + ' كغ يطابق إجمالي الطلبية في الصورة (' + pl(o.n, 'سطر واحد', 'سطران', 'أسطر') + '). ما زال عليك تأكيد الأصناف.' }
    : { tone: 'warn', icon: 'i-alert', text: 'مجموع الأوزان المقروءة ' + fmt(o.sum) + ' كغ لا يطابق إجمالي الصورة ' + fmt(o.total) + ' كغ: سطر ناقص أو رقم مقروء خطأ. قارن الأسطر بالصورة قبل الاعتماد.' };
}
function ocrImgSheet() { return OCR_IMG && OCR_IMG.url ? { title: 'صورة الطلبية', sub: 'للمقارنة بالأسطر', fields: [fPhotoView(OCR_IMG.url)] } : { title: 'صورة الطلبية', sub: 'لم تعد الصورة محفوظة بعد إغلاق التطبيق', note: { text: 'تُحفظ الصورة للمقارنة أثناء هذه الجلسة فقط.', tone: 'info' } }; }

/* ===== 02p-admin.js ===== */
/* ---------- الأشخاص والصلاحيات + القوائم والحقول + الأرشيف والإدارة (كما في التصميم) ---------- */
var PRESETS0 = [{ id: 'exec', name: 'المدير التنفيذي', desc: 'كل شيء، وحده يؤرشف ويدير' }, { id: 'manager', name: 'مدير', desc: 'يتابع ويستلم التقارير، ولا يعدّل إلا ما تسمح له به' }, { id: 'chef', name: 'شيف', desc: 'الوصفات والكميات بلا أسعار' }, { id: 'observer', name: 'مراقب', desc: 'تقارير الجهة الداعمة فقط' }, { id: 'worker', name: 'عامل', desc: 'كشف حسابه فقط' }];
function presets() { return S.presets && S.presets.length ? S.presets : PRESETS0; }
function people() { return S.people && S.people.length ? S.people : [{ id: 'p1', name: 'أنت', preset: 'exec', rep: false }]; }
function preset(id) { return E.by(presets(), id); }
function recipients() { return people().filter(function (p) { return p.rep; }); }

function pgPeople() {
  var bl = [];
  bl.push(B('rows', { title: 'من يستخدم التطبيق', items: people().map(function (p) {
    var pr = preset(p.preset) || { name: '', desc: '' };
    return X({ icon: 'i-users', icTone: p.preset === 'exec' ? 'ok' : 'mute', title: p.name, sub: pr.desc + (p.worker ? ' · وله صفحته كعامل' : '') + (p.rep ? ' · يستلم التقارير' : ''), tag: pr.name, tagTone: 'mute', chev: true,
      go: function () { openSh({ t: 'person', id: p.id }, { preset: p.preset, rep: p.rep ? 'yes' : 'no', wk: p.worker || '' }); }, lp: function () { personQa(p); } });
  }), act: 'شخص', actGo: function () { openSh({ t: 'addPerson' }, { name: '', preset: 'manager', phone: '', rep: 'no', wk: '' }); } }));
  bl.push(B('rows', { title: 'العمال', items: [X({ icon: 'i-wallet', icTone: 'mute', title: pl(activeW().length, 'عامل واحد', 'عاملان', 'عمال'), sub: 'يرى كل عامل أيام دوامه ورصيده وآخر دفعة فقط، والعطلة تظهر له «عطلة»' })] }));
  bl.push(B('note', { tone: 'info', icon: 'i-shield', text: 'الأدوار جاهزة وقابلة للتعديل. التفاصيل (ماذا يرى كل شخص وماذا يعدّل) في شاشة الصلاحيات على الحاسوب.' }));
  return bl;
}
/* أسباب جرد المخزن (تالف، هدر، تبرع، فرق جرد): لكل سبب أثر ينقص أو يزيد */
function whys() {
  var d = [{ id: 'w1', name: 'تالف أو منتهي', dir: -1 }, { id: 'w2', name: 'هدر في الطبخ', dir: -1 }, { id: 'w3', name: 'تبرع', dir: -1 }, { id: 'w4', name: 'فرق جرد', dir: 0 }];
  if (!(S.whys && S.whys.length)) return d;
  var l = S.whys.filter(function (w) { return w.name !== 'فرق جرد بالنقص' && w.name !== 'فرق جرد بالزيادة'; });
  if (l.length !== S.whys.length && !l.some(function (w) { return w.name === 'فرق جرد'; })) l.push({ id: 'w4', name: 'فرق جرد', dir: 0 });
  return l;
}
function pgLists() {
  var row = function (k, icon, title, sub) { return X({ icon: icon, icTone: 'mute', title: title, sub: sub, chev: true, go: function () { openSh({ t: 'list', k: k }); } }); };
  return [B('rows', { items: [
    row('ledgers', 'i-box', 'المخازن', ledgers().map(function (l) { return l.name; }).join('، ')),
    row('insts', 'i-truck', 'المؤسسات', S.insts.filter(function (i) { return !i.arch; }).map(function (i) { return i.name; }).join('، ')),
    row('bens', 'i-users', 'المستفيدون (المخيمات والنقاط)', bens().map(function (g) { return g.name; }).join('، ') || 'لا مستفيدين بعد'),
    row('hol', 'i-calendar', 'العطل', 'العطلة المعتادة: ' + (S.settings.weekHol || 'لا يوجد') + (isHol() ? ' · اليوم عطلة' : '')),
    row('stats', 'i-calendar', 'حالات الحضور وأثرها على الأجر', (S.stats || []).map(function (t) { return t.name; }).join('، ')),
    row('whys', 'i-box', 'أسباب جرد المخزن', whys().map(function (w) { return w.name; }).join('، ')),
    row('units', 'i-list', 'وحدات القياس', (S.units || []).join('، ')),
    row('presets', 'i-shield', 'أدوار الصلاحيات', presets().map(function (p) { return p.name; }).join('، ')),
    row('fields', 'i-pencil', 'الحقول المخصصة', (S.fields || []).map(function (f) { return f.name; }).join('، ') || 'لا حقول بعد')
  ] })];
}

/* ---- الأرشيف ---- */
var AK = { worker: ['العمال', 'عامل', 'i-users'], ledger: ['المخازن', 'مخزن', 'i-box'], inst: ['المؤسسات', 'مؤسسة', 'i-truck'], recipe: ['الطبخات', 'طبخة', 'i-book'], ben: ['المستفيدون', 'مستفيد', 'i-users'], asset: ['الموجودات', 'موجود', 'i-box'] };
function archSrc(k) { return { worker: S.workers || [], ledger: S.ledgers, inst: S.insts, recipe: S.recipes, ben: S.bens || [], asset: S.assets || [] }[k]; }
function archList(k) { return archSrc(k).filter(function (x) { return !x.arch && !(k === 'ledger' && (x.id === 'kitchen' || x.id === 'ext' || x.id === 'wfp')); }); }
function archCheck(k, id) {
  var e = E.by(archSrc(k), id), out = [];
  if (k === 'worker') { var b = wBal(e); out.push({ ok: b === 0, title: 'رصيد العامل', sub: b === 0 ? 'خالص: لا له ولا عليه' : balTxt(b) + ': صفِّ الحساب أولًا', fix: b === 0 ? null : { go: function () { open('worker', { wid: id }); } } }); }
  else if (k === 'ledger') { var bl = E.balances(S, id), ks = Object.keys(bl).filter(function (x) { return bl[x] !== 0; }); out.push({ ok: !ks.length, title: 'أرصدة المخزن', sub: ks.length ? pl(ks.length, 'صنف واحد', 'صنفان', 'أصناف') + ' برصيد غير صفر: انقله أو سجّل جردًا' : 'كل الأرصدة صفر' }); }
  else if (k === 'recipe') { var np = plans().filter(function (p) { return p.recipeId === id; }).length; out.push({ ok: !np, title: 'الخطط القادمة', sub: np ? pl(np, 'خطة واحدة', 'خطتان', 'خطط') + ' تستعملها: احذفها أولًا' : 'لا خطط قادمة' }); }
  else if (k === 'asset') { out.push({ ok: !(e.out > 0), title: 'المعار', sub: e.out > 0 ? fmt(e.out) + ' معار لجهة: سجّل عودته أولًا' : 'لا معار' }); }
  else out.push({ ok: true, title: 'الفحص', sub: 'لا شيء يمنع' });
  return out;
}
function stD(x) { return /^\d{4}-\d\d-\d\d$/.test(x || '') ? dlong(x) : (x || ''); }
function stintRows(e, prior) { // فترات العمل: من... إلى... مع السبب
  return (e.stints || []).map(function (t) {
    var done = !!t.to;
    return X({ icon: 'i-calendar', icTone: done ? 'mute' : 'ok', title: done ? stD(t.from) + ' ← ' + stD(t.to) : 'منذ ' + stD(t.from), sub: t.why || (prior ? 'فترة سابقة' : done ? '' : 'فترة حالية'), tag: prior ? 'سابقة' : done ? '' : 'حالية', tagTone: prior ? 'mute' : 'ok' });
  });
}
function doArchive(k, id, why) {
  var e = E.by(archSrc(k), id); e.arch = true; e.archWhy = why;
  e.stints = e.stints || [{ from: 'قبل الأرشفة', to: '' }];
  var last = e.stints[e.stints.length - 1]; last.to = today(); last.why = why;
  audit('إنهاء التعامل مع «' + e.name + '» (' + AK[k][1] + '): ' + why); shut(); mutated('أُخفي «' + e.name + '» ويمكن استعادته من الأرشيف');
}
function doUnarch(k, id) {
  var e = E.by(archSrc(k), id), wage = num('wage');
  delete e.arch; delete e.archWhy;
  e.stints = e.stints || []; e.stints.push({ from: today(), to: '', why: '' });
  if (k === 'worker' && wage > 0 && wage !== e.daily) { audit('تعديل يومية «' + e.name + '» من ' + money(e.daily) + ' إلى ' + money(wage)); e.daily = wage; }
  audit('عودة «' + e.name + '» للعمل وإضافة فترة جديدة إلى سجله'); shut(); mutated('استُعيد «' + e.name + '»');
}
function pgAdmin() {
  var bl = [], arch = [];
  Object.keys(AK).forEach(function (k) { archSrc(k).forEach(function (e) { if (e.arch) arch.push({ k: k, e: e }); }); });
  var di = dayInfo();
  bl.push(B('note', { tone: 'warn', icon: 'i-lock', text: 'ما تُنهي التعامل معه يختفي من القوائم ولا يُحذف، ويمكن استعادته.' }));
  bl.push(B('kpi', { items: [X({ label: 'مؤرشف', value: arch.length, sub: 'مخفي من القوائم' }), X({ label: 'سجل التعديلات', value: (S.audit || []).length, sub: 'عملية مسجّلة' }), X({ label: 'اليوم', value: di.closed ? 'مغلق' : di.holiday ? 'عطلة' : 'مفتوح', sub: dlong(today()) })] }));
  bl.push(B('rows', { title: 'إنهاء التعامل مع', items: Object.keys(AK).map(function (k) { var n = archList(k).length; return X({ icon: AK[k][2], icTone: 'mute', title: AK[k][0], sub: pl(n, 'عنصر واحد فعّال', 'عنصران فعّالان', 'عناصر فعّالة'), chev: true, go: function () { openSh({ t: 'arch', k: k }); } }); }) }));
  bl.push(B('rows', { title: 'المؤرشفون', items: arch.map(function (a) { return X({ icon: AK[a.k][2], icTone: 'mute', title: a.e.name, sub: AK[a.k][0].replace(/^ال/, '') + ' · ' + (a.e.archWhy || 'انتهى التعامل'), tag: 'استعادة', tagTone: 'info', chev: true, go: function () { openSh({ t: 'unarch', k: a.k, id: a.e.id }, { wage: a.k === 'worker' ? String(a.e.daily || '') : '' }); } }); }), empty: 'لا مؤرشفين: كل شيء فعّال' }));
  bl.push(B('rows', { title: 'أدوات الإدارة', items: [X({ icon: 'i-clock', icTone: 'warn', title: 'إعادة فتح يوم مغلق', sub: di.closed ? 'أُرسلت النسخة ' + (di.rv || 1) + '، وتحتاج سببًا يُسجَّل' : di.reopened ? 'اليوم مفتوح للتصحيح' : 'اليوم غير مغلق الآن', chev: true, go: function () { openSh({ t: 'reopen' }, { why: '' }); } }), X({ icon: 'i-copy', icTone: 'mute', title: 'دمج الأسماء المكررة', sub: 'متاح في شاشة الإدارة على الحاسوب', tag: 'حاسوب', tagTone: 'mute' })] }));
  bl.push(B('rows', { title: 'سجل التعديلات', items: (S.audit || []).slice(0, 8).map(function (e) { return X({ title: e.what, sub: dlabel(e.date) }); }), empty: 'لا تعديلات مسجّلة' }));
  return bl;
}

function doAddPerson(editId) {
  var name = fv('name').trim(), pr = fv('preset') || 'worker', rep = fv('rep') === 'yes', phone = fv('phone').trim(), wk = fv('wk') || '';
  S.people = people().slice();
  if (editId) { var p = E.by(S.people, editId); p.preset = pr; p.rep = rep; p.worker = wk; audit('تعديل صلاحيات «' + p.name + '»'); }
  else { S.people.push({ id: newId('p', S.people), name: name, preset: pr, phone: phone, worker: wk, rep: rep }); audit('إضافة «' + name + '» إلى الأشخاص'); }
  shut(); mutated(editId ? 'حُدّثت صلاحيات الشخص' : 'أُضيف «' + name + '» إلى الأشخاص');
}
function doSimple(kind) {
  var name = fv('name').trim();
  if (kind === 'unit') { S.units = (S.units || []).concat([name]); }
  if (kind === 'why') { S.whys = whys().concat([{ id: newId('w', whys()), name: name, dir: fv('dir') === 'up' ? 1 : -1 }]); }
  if (kind === 'role') { S.presets = presets().concat([{ id: newId('ro', presets()), name: name, desc: fv('desc').trim() || 'صلاحيات مخصصة' }]); }
  if (kind === 'field') { S.fields = (S.fields || []).concat([{ id: newId('f', S.fields || []), name: name, type: fv('type') || 'نص', where: fv('where') || 'all' }]); }
  audit('أُضيف «' + name + '» إلى القائمة'); save(); setState({ sh: { t: 'list', k: kind === 'unit' ? 'units' : kind === 'role' ? 'presets' : kind === 'why' ? 'whys' : 'fields' }, form: {}, q: '' }); say('أُضيف «' + name + '» إلى القائمة');
}

function adminSheet(sh) {
  var R = null, nm, dup;
  switch (sh.t) {
    case 'addPerson': case 'person': {
      var edit = sh.t === 'person', pe = edit ? E.by(people(), sh.id) : null, pr = preset(fv('preset')); nm = edit ? pe.name : fv('name').trim(); dup = edit ? null : dupOf(people(), nm);
      var fl = []; if (!edit) fl.push(fText('name', 'الاسم', 'اسم الشخص')); fl.push(fChips('preset', 'الدور', presets().map(function (x) { return [x.id, x.name]; }))); if (!edit) fl.push(fText('phone', 'رقم الهاتف (اختياري)', '05', 'tel'));
      fl.push(fTri('rep', 'يستلم التقارير', [['no', 'لا'], ['yes', 'نعم']])); fl.push(fSelect('wk', 'له سجل عامل (صفحتي)', [['', 'لا']].concat(activeW().map(function (w) { return [w.id, w.name]; })), fv('wk') || '', fv('wk') ? undefined : 'لا'));
      R = { title: edit ? pe.name : 'شخص جديد', sub: edit ? 'غيّر دوره أو استلامه للتقارير' : 'الدور يحدد ما يراه وما يعدّله', fields: fl,
        note: { text: (pr ? pr.name + ': ' + pr.desc : '') + (fv('wk') ? '. ويُضاف إليه «صفحتي»: يومياته ودفعاته وحضوره وغيابه، له وحده.' : ''), tone: 'info' }, dup: dup ? 'يوجد «' + dup.name + '» بنفس الاسم.' : '',
        ft: { label: edit ? 'حفظ التعديل' : 'إضافة الشخص', ok: nm.length > 1 && !dup, go: function () { doAddPerson(edit ? pe.id : ''); } } };
      break;
    }
    case 'addRole': { nm = fv('name').trim(); dup = dupOf(presets(), nm);
      R = { title: 'دور جديد', sub: 'مثل: محاسب أو مشرف مخزن', fields: [fText('name', 'اسم الدور', 'مثال: محاسب'), fText('desc', 'وصف قصير', 'ماذا يرى وماذا يعدّل')], dup: dup ? 'يوجد دور بنفس الاسم.' : '', note: { text: 'تفاصيل الصلاحيات لكل قسم تُضبط من شاشة الصلاحيات على الحاسوب.', tone: 'info' }, ft: { label: 'حفظ الدور', ok: nm.length > 1 && !dup, go: function () { doSimple('role'); } } }; break; }
    case 'addWhy': { nm = fv('name').trim(); dup = dupOf(whys(), nm);
      R = { tone: fv('dir') === 'up' ? 'in' : fv('dir') === 'down' ? 'out' : '', toneTag: fv('dir') === 'up' ? 'يزيد' : 'ينقص', title: 'سبب جرد جديد', sub: 'لماذا تتغير كمية بغير طبخ أو استلام', fields: [fText('name', 'اسم السبب', 'مثال: عينة تذوق'), fChips('dir', 'الأثر', [['down', 'ينقص'], ['up', 'يزيد']])], dup: dup ? 'يوجد سبب بنفس الاسم.' : '', ft: { label: 'حفظ السبب', ok: nm.length > 1 && !dup, go: function () { doSimple('why'); } } }; break; }
    case 'addUnit': { nm = fv('name').trim(); dup = (S.units || []).filter(function (u) { return norm(u) === norm(nm); })[0];
      R = { title: 'وحدة قياس جديدة', sub: 'مثل: صندوق أو حزمة', fields: [fText('name', 'اسم الوحدة', 'مثال: صندوق')], dup: dup ? 'يوجد وحدة بهذا الاسم.' : '', ft: { label: 'حفظ الوحدة', ok: nm.length > 0 && !dup, go: function () { doSimple('unit'); } } }; break; }
    case 'addField': { nm = fv('name').trim(); dup = dupOf(S.fields || [], nm);
      R = { title: 'حقل مخصص', sub: 'معلومة تريد تسجيلها مع كل طبخة', fields: [fText('name', 'اسم الحقل', 'مثال: رقم دفعة الوجبات'), fChips('type', 'نوعه', [['نص', 'نص'], ['رقم', 'رقم']]), fChips('where', 'أين يظهر', [['all', 'كل الطبخات'], ['private', 'الطبخ فقط'], ['external', 'الطبخ الخارجي فقط']])], dup: dup ? 'يوجد حقل بهذا الاسم.' : '', ft: { label: 'حفظ الحقل', ok: nm.length > 1 && !dup, go: function () { doSimple('field'); } } }; break; }
    case 'list': {
      var WH = { all: 'كل الطبخات', private: 'الطبخ فقط', external: 'الطبخ الخارجي فقط' }, holRows = [X({ title: 'العطلة الأسبوعية', sub: S.settings.weekHol || 'لا يوجد', tag: 'تغيير', chev: true, go: function () { openSh({ t: 'weekHol' }, { v: S.settings.weekHol || '' }); } })];
      Object.keys(S.days || {}).sort().reverse().forEach(function (d) { if (S.days[d].holiday) holRows.push(X({ title: dlabel(d), sub: S.days[d].holiday.reason + ' · بلا طبخ ولا أجور', tag: 'عطلة', tagTone: 'mute' })); });
      var META = {
        ledgers: ['المخازن', ledgers().map(function (l) { return X({ title: l.name, sub: E.isFree(l) ? 'مواد عينية من جهة' : 'مدفوع على حسابك', tag: pl(itemsIn(l.id).length, 'صنف واحد', 'صنفان', 'أصناف') }); }), 'إضافة مخزن جديد', function () { openSh({ t: 'addLedger' }, { name: '', inkind: 'own' }); }],
        insts: ['المؤسسات', S.insts.filter(function (i) { return !i.arch; }).map(function (i) { return X({ title: i.name, sub: i.init ? 'مبادرة' : 'مؤسسة', chev: true, go: function () { openSh({ t: 'instEdit', id: i.id }, { name: i.name }); }, lp: function () { openSh({ t: 'instEdit', id: i.id }, { name: i.name }); } }); }), 'إضافة مؤسسة جديدة', function () { openSh({ t: 'addInst' }, { name: '', src: 'own' }); }],
        hol: ['العطل', holRows, 'إعلان عطلة اليوم', function () { openSh({ t: 'holiday' }, { reason: 'الجمعة', other: '' }); }],
        stats: ['حالات الحضور', (S.stats || []).map(function (t) { return X({ title: t.name, sub: t.sys ? 'نظامية: بلا أجر ولا تُحسب غيابًا' : (t.mult === 0 ? 'بلا أجر' : t.mult !== 1 ? '× ' + t.mult + ' من اليومية' : 'يومية كاملة') + (t.bonus ? ' + ' + money(t.bonus) : ''), tag: t.name, tagTone: t.tone }); }), 'إضافة حالة حضور', function () { openSh({ t: 'addStat' }, { name: '', mult: '1', bonus: '' }); }],
        bens: ['المستفيدون', bens().map(function (g) { return X({ title: g.name, sub: benSub(g), chev: true, go: function () { openSh({ t: 'benEdit', id: g.id }, benForm(g)); },
          lp: function () { benQa(g); } }); }), 'إضافة مستفيد جديد', function () { openSh({ t: 'addBen' }, benForm(null)); }],
        whys: ['أسباب جرد المخزن', whys().map(function (w) { return X({ title: w.name, tag: w.dir === 0 ? 'يزيد أو ينقص' : w.dir > 0 ? 'يزيد' : 'ينقص', tagTone: w.dir === 0 ? 'info' : w.dir > 0 ? 'ok' : 'warn' }); }), 'إضافة سبب جرد', function () { openSh({ t: 'addWhy' }, { name: '', dir: 'down' }); }],
        units: ['وحدات القياس', (S.units || []).map(function (u) { return X({ title: u }); }), 'إضافة وحدة قياس', function () { openSh({ t: 'addUnit' }, { name: '' }); }],
        presets: ['أدوار الصلاحيات', presets().map(function (p) { return X({ title: p.name, sub: p.desc }); }), 'إضافة دور جديد', function () { openSh({ t: 'addRole' }, { name: '', desc: '' }); }],
        fields: ['الحقول المخصصة', (S.fields || []).map(function (f) { return X({ title: f.name, sub: f.type + ' · ' + WH[f.where] }); }), 'إضافة حقل مخصص', function () { openSh({ t: 'addField' }, { name: '', type: 'نص', where: 'all' }); }]
      }[sh.k];
      R = { title: META[0], sub: 'القائمة قابلة للإضافة متى احتجت', rows: META[1], add: { label: '+ ' + META[2], go: META[3] } };
      break;
    }
    case 'instEdit': {
      var ie = E.by(S.insts, sh.id); nm = fv('name').trim(); dup = S.insts.filter(function (i) { return i.id !== ie.id && norm(i.name) === norm(nm); })[0];
      R = { title: ie.name, sub: ie.init ? 'جهة متفرقة' : 'مؤسسة', fields: [fText('name', 'الاسم', '')],
        rows: [X({ icon: AK.inst[2], icTone: 'mute', title: 'إنهاء التعامل', sub: 'يختفي من الاختيار وتبقى حساباته القديمة', chev: true, go: function () { openSh({ t: 'archConfirm', k: 'inst', id: ie.id }, { why: 'انتهى التعامل' }); } })],
        dup: dup ? 'يوجد اسم مماثل.' : '', ft: { label: 'حفظ', ok: nm.length > 1 && !dup, go: function () { if (nm !== ie.name) { audit('تعديل اسم «' + ie.name + '» إلى «' + nm + '»'); ie.name = nm; } shut(); mutated('حُفظ الاسم'); } } };
      break;
    }
    case 'arch': {
      R = { title: 'إنهاء التعامل: ' + AK[sh.k][0], sub: 'اختر ما انتهى العمل معه ليختفي من القوائم', rows: archList(sh.k).map(function (e) {
        var ck = archCheck(sh.k, e.id), bad = ck.filter(function (c) { return !c.ok; }).length;
        return X({ title: e.name, sub: bad ? ck.filter(function (c) { return !c.ok; })[0].sub : 'جاهز للإنهاء', tag: bad ? 'يحتاج جردًا' : 'جاهز', tagTone: bad ? 'warn' : 'ok', chev: true, go: function () { openSh({ t: 'archConfirm', k: sh.k, id: e.id }, { why: 'انتهى التعامل' }); } });
      }), empty: 'لا عناصر فعّالة' };
      break;
    }
    case 'archConfirm': {
      var ae = E.by(archSrc(sh.k), sh.id), cks = archCheck(sh.k, sh.id), blocked = cks.filter(function (c) { return !c.ok; }), why = fv('why') || 'انتهى التعامل';
      var reasons = sh.k === 'worker' ? [['استقال', 'استقال'], ['انتهى التعامل', 'انتهى عمله'], ['أخرى', 'أخرى']] : sh.k === 'asset' ? [['بيع', 'بيع'], ['أُتلف نهائيًا', 'أُتلف نهائيًا'], ['لم نعد نستخدمه', 'لم نعد نستخدمه'], ['أخرى', 'أخرى']] : sh.k === 'recipe' ? [['لم تعد تُطبخ', 'لم تعد تُطبخ'], ['مكررة', 'مكررة'], ['أخرى', 'أخرى']] : [['انتهى التعامل', 'انتهى التعامل'], ['أخرى', 'أخرى']];
      R = { title: ae.name, sub: 'فحص قبل الإخفاء', rows: cks.map(function (c) { return X({ title: c.title, sub: c.sub, tag: c.ok ? 'سليم' : 'يمنع', tagTone: c.ok ? 'ok' : 'bad', go: c.fix ? c.fix.go : noop }); }), fields: [fChips('why', 'السبب', reasons)],
        note: { text: blocked.length ? 'لا يمكن الإنهاء قبل حل ما سبق. لن يُحذف شيء.' : 'سيختفي من القوائم والاختيار، وتبقى بياناته في التقارير السابقة، ويمكنك استعادته متى شئت.', tone: blocked.length ? 'warn' : 'info' },
        ft: { label: blocked.length ? 'لا يمكن الإنهاء الآن' : 'إنهاء التعامل وإخفاؤه', ok: !blocked.length, go: function () { doArchive(sh.k, sh.id, why); } } };
      break;
    }
    case 'unarch': {
      var ue = E.by(archSrc(sh.k), sh.id);
      R = { title: 'عودة: ' + ue.name, sub: AK[sh.k][1] + ' يرجع بسجله القديم كاملًا، وتُضاف فترة جديدة', rows: stintRows(ue, true), empty: (ue.stints && ue.stints.length) ? '' : 'لا فترات مسجّلة قبل الأرشفة',
        fields: sh.k === 'worker' ? [fText('wage', 'اليومية عند العودة (₪)', String(ue.daily || ''), 'decimal', 'عدّلها إن تغيّرت، وتُسجَّل في سجل التعديلات.')] : [],
        note: { text: 'لا يُنشأ سجل جديد: كل حساباته وتقاريره السابقة تبقى كما هي.', tone: 'info' },
        ft: { label: 'تأكيد العودة', ok: sh.k !== 'worker' || num('wage') > 0, go: function () { doUnarch(sh.k, sh.id); } } };
      break;
    }
  }
  return R;
}
function benToday(id) { var a = dayBatches('private').reduce(function (t, b) { return t + ((b.dist || {})[id] || 0); }, 0); return r2(a + dayDist().filter(function (x) { return x.ben === id; }).reduce(function (t, x) { return t + x.pots; }, 0)); }

/* ===== 02q-search.js ===== */
/* ---------- البحث الشامل: أوامر سريعة + كل أنواع السجلات + صفحات (كما في النموذج) ---------- */
function searchGo(fn) { return function () { setState({ sh: null, q: '', form: {} }); fn(); }; }
function searchCmds() {
  return [
    ['دفع الأسبوع', 'صرف مستحقات العمال دفعة واحدة', ['تسويه', 'راتب', 'رواتب', 'اجور', 'مستحقات'], function () { open('main', { tab: 'workers' }); openSh({ t: 'settle' }, { sel: activeW().filter(function (w) { return wBal(w) > 0; }).map(function (w) { return w.id; }).join(',') }); }],
    ['حركة في رصيد', 'وارد أو ناقص أو تحويل بين الأرصدة', ['صرف', 'مصروف', 'مصاريف', 'دخل', 'وارد', 'صادر', 'ميزانيه', 'قيد', 'تحويل'], function () { open('funds'); }],
    ['دفعة لعامل', 'دفعة أو سلفة أو خصم', ['سلفه', 'خصم', 'اضافه'], function () { open('main', { tab: 'today' }); openSh({ t: 'pickWorker' }); }],
    ['حضور من لم يُسجَّل', 'تسجيل حضور الجميع دفعة واحدة', ['حضور', 'دوام'], function () { open('main', { tab: 'workers', wmode: 'att' }); }],
    ['طبخة جديدة', 'بدء تسجيل طبخة', ['طبخه', 'قدر', 'وصفه جديده'], function () { startBatch('private'); }],
    ['استلام مواد', 'إدخال مواد وصلت إلى المخزن', ['استلام', 'شراء', 'مشتريات', 'وارد'], function () { open('main', { tab: 'today' }); openSh({ t: 'recv', item: null }, { unitMode: 'base', qty: '', price: '' }); }],
    ['قائمة المشتريات', 'ما ينقص للأيام القادمة، مجمّعة حسب المورّد', ['مشتريات', 'نواقص', 'طلب', 'مورد', 'موردين', 'شراء'], function () { openBuyList(); }],
    ['ملخص اليوم', 'ما جرى اليوم في رسالة واحدة للنسخ أو الإرسال', ['ملخص', 'تقرير اليوم', 'نهاية اليوم'], function () { openDaySummary(); }],
    ['إغلاق اليوم', 'قائمة التحقق وتجهيز تقرير المراقب', ['اغلاق', 'تقرير اليوم'], function () { open('main', { tab: 'today' }); openSh({ t: 'close' }); }]
  ];
}
function searchPages() {
  return [
    ['التقارير والإرسال', 'التقارير', ['استهلاك', 'مراقب', 'تصدير', 'pdf'], function () { open('reports'); }],
    ['الأرصدة', 'صفحة', ['ميزانيه', 'موافقات', 'رصيد', 'مستحقات', 'حسابات', 'مال'], function () { open('funds'); }],
    ['المفكرة', 'صفحة', ['مفكرة', 'مهام', 'مشتريات', 'ملاحظات', 'تذكير', 'قائمة'], function () { open('pad'); }],
    ['التقويم والتنبيهات', 'صفحة', ['تقويم', 'مواعيد', 'تذكير', 'مهام'], function () { open('cal'); }],
    ['الموجودات', 'صفحة', ['قدور', 'معدات', 'جرد', 'ادوات'], function () { open('assets'); }],
    ['الأشخاص والصلاحيات', 'صفحة', ['صلاحيات', 'اشخاص', 'مستخدمين'], function () { open('people'); }],
    ['القوائم والحقول', 'صفحة', ['قوائم', 'حقول', 'وحدات', 'حالات'], function () { open('lists'); }],
    ['الأرشيف والإدارة', 'صفحة', ['ارشيف', 'سجل التعديلات', 'اداره', 'اعاده فتح'], function () { open('admin'); }],
    ['لقطات تلقائية', 'نسخ على هذا الجهاز', ['لقطات', 'استعادة', 'نسخه', 'احتياطي'], function () { open('main', { tab: 'more' }); openSh({ t: 'snaps' }); }],
    ['سجل الأخطاء', 'للدعم', ['اخطاء', 'عطل', 'مشكله'], function () { open('main', { tab: 'more' }); openSh({ t: 'errlog' }); }]
  ];
}
function searchRows(q) {
  var nq = norm(q), hits = []; if (!nq) return [];
  var tb = { workers: 'w', stock: 'i', kitchen: 'r' }[A.tab] || '';
  var score = function (names) {
    var best = null;
    names.forEach(function (nm) {
      var n = norm(nm), sc = null; if (!n) return;
      if (n === nq) sc = 0; else if (n.indexOf(nq) === 0) sc = 1; else if (n.split(' ').some(function (w) { return w.indexOf(nq) === 0; })) sc = 2; else if (n.indexOf(nq) > 0) sc = 3;
      if (sc != null && (best == null || sc < best)) best = sc;
    });
    return best;
  };
  var add = function (cat, names, row) { var sc = score(names); if (sc == null) return; hits.push({ sc: sc + (cat === tb ? -1.5 : 0), row: row }); };
  var row = function (title, sub, tag, go, ic, lp) { return X({ icon: ic || 'i-search', icTone: 'mute', title: title, sub: sub, tag: tag, tagTone: 'mute', chev: true, go: searchGo(go), lp: lp }); };
  searchCmds().forEach(function (c) { add('c', [c[0]].concat(c[2]), row(c[0], c[1], 'أمر', c[3], 'i-check')); });
  S.items.filter(function (i) { return !i.arch; }).forEach(function (i) {
    var al = (i.alias || []).filter(function (a) { return score([a]) != null && score([i.name]) == null; })[0], lg = ledgers().filter(function (l) { return E.balance(S, l.id, i.id) !== 0; })[0] || led('kitchen');
    add('i', [i.name].concat(i.alias || []), row(i.name, 'صنف · ' + fmt(totalQty(i.id)) + ' ' + i.unit + (al ? ' · يُعرف أيضًا «' + al + '»' : ''), 'صنف', function () { open('main', { tab: 'stock', led: lg.id }); openSh({ t: 'item', id: i.id }); }, 'i-box', function () { stockQa(i, lg.id); }));
  });
  S.recipes.filter(function (r) { return !r.arch; }).forEach(function (r) { add('r', [r.name, r.code || ''], row(r.name, (r.code ? r.code + ' · ' : '') + (r.draft ? 'مبدئية' : 'معتمدة'), 'وصفة', function () { open('recipe', { rid: r.id }); }, 'i-book', function () { qa(r.name, r.code || '', [['فتح الوصفة', 'i-book', function () { open('recipe', { rid: r.id }); }], ['تخطيط طبخة قادمة', 'i-calendar', function () { openSh({ t: 'planAdd', rec: r.id }, { day: '1', pots: '3', kind: (r.kinds || []).indexOf('private') >= 0 ? 'private' : 'external' }); }]]); })); });
  (S.workers || []).forEach(function (w) { add('w', [w.name], row(w.name, w.arch ? 'مؤرشف' : balTxt(wBal(w)), 'عامل', function () { open('worker', { wid: w.id }); }, 'i-users', w.arch ? undefined : function () { wQa(w); })); });
  S.batches.filter(function (b) { return !b.void; }).slice().sort(function (a, b) { return b.ts - a.ts; }).slice(0, 40).forEach(function (b) {
    add('b', [batchName(b)], row(batchName(b), dlabel(b.date) + ' · ' + (KN[b.kind] || '') + ' · ' + pl(b.pots || 0, 'قدر واحد', 'قدران', 'قدور'), 'طبخة', function () { open('main', { tab: 'kitchen' }); openSh({ t: 'bview', id: b.id }); }, 'i-pot', function () { batchQa(b); }));
  });
  instsOf(true).forEach(function (i) { add('n', [i.name, i.occ || ''], row(i.name, i.occ || 'مبادرة', 'مبادرة', function () { open('main', { tab: 'kitchen', kk: 'external' }); openSh({ t: 'stmt', id: i.id }, { m: '' }); }, 'i-heart', function () { instQa(i, true); })); });
  instsOf(false).forEach(function (i) { add('n', [i.name], row(i.name, 'جهة طبخ خارجي', 'مؤسسة', function () { open('main', { tab: 'kitchen', kk: 'external' }); }, 'i-truck', function () { instQa(i, false); })); });
  AA().forEach(function (a) { add('a', [a.name, a.cat || ''], row(a.name, (a.cat || 'موجودات') + ' · ' + a.loc, 'موجود', function () { open('assets'); openSh({ t: 'asset', id: a.id }); }, 'i-box', function () { assetQa(a); })); });
  people().forEach(function (p) { add('p', [p.name], row(p.name, (preset(p.preset) || {}).name || '', 'شخص', function () { open('people'); openSh({ t: 'person', id: p.id }, { preset: p.preset, rep: p.rep ? 'yes' : 'no', wk: p.worker || '' }); }, 'i-shield', function () { personQa(p); })); });
  ((S.cal && S.cal.ev) || []).forEach(function (e) { add('e', [e.title, e.party || ''], row(e.title, 'موعد أو مهمة', 'موعد', function () { open('cal'); }, 'i-calendar')); });
  searchPages().forEach(function (p) { add('g', [p[0]].concat(p[2]), row(p[0], p[1], 'صفحة', p[3], 'i-menu')); });
  hits.sort(function (a, b) { return a.sc - b.sc; });
  return hits.map(function (h) { return h.row; });
}
function searchSheet() {
  var sq = (A.q || '').trim(), srows = sq ? searchRows(sq) : searchCmds().map(function (c) { return X({ icon: 'i-check', icTone: 'mute', title: c[0], sub: c[1], tag: 'أمر', tagTone: 'mute', chev: true, go: searchGo(c[3]) }); });
  return { title: 'بحث', sub: sq ? '' : 'اكتب جزءًا من الاسم، أو اختر أمرًا سريعًا', search: 'صنف، وصفة، عامل، أمر…', rows: srows.slice(0, 14), empty: sq && !srows.length ? 'لا نتيجة لـ «' + sq + '»' : '' };
}

/* ===== 02r-reports.js ===== */
/* ---------- التقارير: مستند التقرير ونصه (نفس بنية «repDoc» و«repText» في التصميم) ---------- */
var RPTS = [['cook', 'الاستهلاك اليومي'], ['supply', 'التوريد اليومي'], ['wck', 'نسخة المراقب'], ['stock', 'حالة المخزون'], ['wfp', 'مخزون WFP'], ['workers', 'كشف العمال']];
var RO = {
  supply: [['tiles', 'ملخص الأرقام'], ['mats', 'المواد']],
  cook: [['tiles', 'ملخص الأرقام'], ['batches', 'الطبخات'], ['dist', 'التوزيع'], ['mats', 'المواد'], ['split', 'تقسيم المواد لعمودين'], ['left', 'عمود المتبقي'], ['neg', 'المتبقي بالسالب'], ['alert', 'ألوان تنبيه المتبقي'], ['mkt', 'من السوق مباشرة'], ['extra', 'خارجي'], ['dev', 'فروق عن المنيو']],
  wck: [['tiles', 'ملخص الأرقام'], ['batches', 'الطبخات'], ['dist', 'التوزيع'], ['mats', 'المواد'], ['split', 'تقسيم المواد لعمودين'], ['left', 'عمود المتبقي'], ['neg', 'المتبقي بالسالب'], ['alert', 'ألوان تنبيه المتبقي'], ['extra', 'خارجي'], ['dev', 'فروق عن المنيو']],
  stock: [['tiles', 'ملخص الأرقام'], ['status', 'عمود الحالة'], ['pack', 'تفصيل العبوات'], ['main', 'الأصناف الأساسية'], ['spice', 'البهارات'], ['zero', 'الأصناف برصيد صفر']],
  wfp: [['tiles', 'ملخص الأرقام'], ['status', 'عمود الحالة'], ['pack', 'تفصيل العبوات'], ['main', 'الأصناف الأساسية'], ['spice', 'البهارات'], ['zero', 'الأصناف برصيد صفر']]
};
var RO_DEP = { neg: 'left', alert: 'left' }; /* خيار ← أصله: يظهر في «خيارات التقرير» ما دام أصله غير مخفي */
var SEC = { cook: ['batches', 'dist', 'mats', 'mkt', 'extra', 'dev'], wck: ['batches', 'dist', 'mats', 'extra', 'dev'] };
function secLabel(k, key) { var a = (RO[k] || []).filter(function (x) { return x[0] === key; })[0]; return a ? a[1] : key; }
function secOrder(k, saved) { var def = SEC[k] || [], sv = (typeof saved === 'string' ? saved.split(',') : (S.ro && S.ro[k] && S.ro[k].order ? String(S.ro[k].order).split(',') : [])).filter(function (x) { return def.indexOf(x) >= 0; }); return sv.concat(def.filter(function (x) { return sv.indexOf(x) < 0; })); }
function roV(k, key) { var o = S.ro && S.ro[k]; return (o && o[key]) || (key === 'neg' ? 'off' : (k === 'stock' || k === 'wfp') && key === 'status' ? 'me' : 'on'); }
function roShow(k, key, exp) { var v = roV(k, key); return v === 'on' || (v === 'me' && !exp); }
function roMe(k, key, exp) { return !exp && roV(k, key) === 'me'; }
function roHasMe(k) { return (RO[k] || []).some(function (a) { return roV(k, a[0]) === 'me'; }); }
function wfpOn() { var l = led('wfp'); return !!l && !l.arch; }
var RCOL = { ext: '#3B5BDB', bad: '#B42318', warn: '#B54708', ok: '#14563A', mute: '#5B6660' };
function rptName(k) { return (RPTS.filter(function (a) { return a[0] === k; })[0] || [0, 'التقرير'])[1]; }

/* ما استُهلك اليوم: من الطبخات غير الملغاة + أي صرف خارج الطبخ. kind: '' للكل أو 'private' */
function dayCalc(kind) {
  var t = today(), tb = kind === 'noext' ? dayBatches('').filter(function (b) { return b.kind !== 'external'; }) : dayBatches(kind || ''), agg = {}, order = [], pots = 0;
  var ens = function (id) { if (!agg[id]) { agg[id] = { cook: 0, other: 0, kit: 0, ext: 0, mkt: 0, why: [] }; order.push(id); } return agg[id]; };
  tb.forEach(function (b) { pots = r2(pots + (b.pots || 0)); b.lines.forEach(function (l) { var a = ens(l.item); a.cook = r3(a.cook + l.qty); Object.keys(l.src || {}).forEach(function (lg) { if (lg === 'kitchen') a.kit = r3(a.kit + l.src[lg]); else { a.ext = r3(a.ext + l.src[lg]); if (lg === 'mkt') a.mkt = r3(a.mkt + l.src[lg]); } }); }); });
  if (!kind || kind === 'noext') S.moves.forEach(function (m) {
    if (m.kind !== 'issue' || m.date !== t || !(m.q < 0)) return;
    var a = ens(m.item); a.other = r3(a.other - m.q); var w = (m.note || '').trim(); if (w && a.why.indexOf(w) < 0) a.why.push(w);
  });
  return { tb: tb, agg: agg, order: order, pots: pots };
}
function pc(t, o) {
  o = o || {};
  return { t: t == null ? '' : String(t), u: o.u || '', sub: o.sub || '', hasSub: !!o.sub, sfg: '#5B6660', st: (o.c ? 'text-align:center;white-space:nowrap;' : 'text-align:start;') + (o.b ? 'font-weight:700;' : '') + (o.fg ? 'color:' + o.fg + ';' : '') };
}
/* صف الإجمالي يتميز بخلفية أغمق وخط أخضر غليظ وخط علوي، وصف التنبيه (tone:'ext') بلون كهرماني: يسري على كل جداول التقارير */
function prow(cells, total, tone) {
  var fg = total ? '#14563A' : tone === 'ext' ? '#8A5A00' : '';
  cells.forEach(function (c) { if (fg) c.st += 'color:' + fg + ';' + (total ? 'font-weight:700;' : ''); });
  return { cells: cells, bg: total ? '#D5E8DC' : tone === 'ext' ? '#FFF3D6' : '', bt: total ? '2px solid #14563A' : '1px solid #EDEFEA' };
}
function secK(k, sec) { sec.k = k; return sec; }
function psec(title, cols, head, rows, empty) {
  var out = rows.map(function (r, i) { return { cells: r.cells, grp: r.grp, bg: r.bg || (i % 2 ? '#F8FAF7' : '#FFFFFF'), bt: r.bt || '1px solid #EDEFEA' }; });
  return { isTab: true, isGrid: false, isDual: false, title: title, cols: cols, head: head.map(function (h, i) { return { t: h, st: i === 0 ? 'text-align:start' : 'text-align:center' }; }), rows: out, hasEmpty: !out.length, empty: empty || '' };
}
/* جدول طويل (12 صفًا فأكثر) يُرسم نصفين متجاورين فيقصر التقرير إلى النصف تقريبًا؛ rows تبقى كاملة للنص المنسوخ (المالك 2026-11-19: صورة المراقب طويلة) */
function dualSec(sec, dropSub) {
  var n = sec.rows.length; if (n < 12 || !sec.isTab) return sec;
  var three = sec.head.length >= 3, h = Math.ceil(n / 2), cols = three ? '1fr 58px 50px' : '1fr 66px';
  var rows = sec.rows.map(function (r) { /* وحدة المتبقي هي وحدة الكمية نفسها فلا تتكرر: رقم فقط بلونه */
    var cells = r.cells.map(function (c, k) { return k === 2 ? { t: c.t, u: '', sub: '', hasSub: false, st: c.st + 'font-size:12px;', sfg: c.sfg } : k === 0 ? { t: c.t, u: c.u, sub: dropSub ? '' : c.sub, hasSub: dropSub ? false : c.hasSub, st: c.st + 'white-space:normal;', sfg: c.sfg } : c; });
    return { cells: cells, grp: r.grp, bg: r.bg, bt: r.bt };
  });
  var gm = rows.filter(function (r) { return r.grp === 'm'; }), gs = rows.filter(function (r) { return r.grp === 's'; }), hd = function (t) { return [{ t: t, st: sec.head[0].st }].concat(sec.head.slice(1)); };
  sec.halves = gm.length >= 4 && gs.length >= 4 /* أساسي | بهارات: كل عمود له عنوانه بدل تقسيم بلا اعتبار */
    ? [{ cols: cols, head: hd('الأساسية'), rows: gm, bs: '0' }, { cols: cols, head: hd('البهارات'), rows: gs, bs: '1px solid #D9DDD7' }]
    : [{ cols: cols, head: sec.head, rows: rows.slice(0, h), bs: '0' }, { cols: cols, head: sec.head, rows: rows.slice(h), bs: '1px solid #D9DDD7' }];
  sec.isTab = false; sec.isDual = true; return sec;
}
function stockAsOf() { var d = A.rdate; return d && d !== 'w7' && d < today() ? d : null; }
function stockRows(lid, asOf) { // أصناف مخزن واحد، الأحرج أولًا
  return itemsIn(lid).filter(function (it) { return !asOf || S.moves.some(function (m) { return m.led === lid && m.item === it.id && m.kind !== 'hist' && m.date <= asOf; }); }).map(function (it) { var q = asOf ? E.balanceAt(S, lid, it.id, asOf) : E.balance(S, lid, it.id); return { it: it, q: q, st: stStatus(q, it.id) }; }).sort(function (x, y) { return x.st.rank - y.st.rank || (x.it.name < y.it.name ? -1 : 1); });
}

function plannedOf(b) { var r = rec(b.recipe), o = {}; if (r) r.lines.forEach(function (l) { o[l.item] = l.fixed ? l.per : r3(l.per * (b.pots || 0)); }); return o; }
/* القدور بالصنف: «12 قدر عدس + 5 قدور فاصولياء» (بلا عدّ للطبخات) */
function potsWord(n) { return n === 1 ? 'قدر' : n >= 3 && n <= 10 ? 'قدور' : 'قدر'; }
function potsTxt(n, name) { return fmt(n) + ' ' + potsWord(n) + ' ' + name; }
function potsByDish(tb) { var o = {}, a = []; tb.forEach(function (b) { var key = batchName(b) + '|' + b.kind; if (!o[key]) { o[key] = { name: batchName(b), kind: b.kind, pots: 0 }; a.push(o[key]); } o[key].pots = r2(o[key].pots + (b.pots || 0)); }); return a; }
function repDoc(k, forceExp) {
  var exp = forceExp === true || !!A.rexp, SH = function (kk) { return roShow(k, kk, exp); }, TT = function (t, kk) { return t + (roMe(k, kk, exp) ? ' · لي فقط' : ''); }, C = pc, R = prow;
  var di = dayInfo(), hol = di.holiday, P = { org: 'مطبخ عهد', date: dlong(today()), sub: '', title: '', tiles: [], secs: [], notes: [], lead: '', foot: 'تلقائي' }, CL = RCOL;
  if (hol) P.notes.push({ t: 'عطلة: ' + hol.reason });
  if (k === 'cook' || k === 'wck') {
    var priv = k === 'wck', EXT = SH('extra') /* «خارجي» مخفي = لا أثر للخارجي في أي سطر أو عدد أو قسم */, dc = dayCalc(priv ? 'private' : EXT ? '' : 'noext'), tb = dc.tb, da = distAgg(tb), nm = dc.order.length, xb = priv ? dayBatches('external') : [], potsExt = xb.length; /* نسخة المراقب ذاتية فقط، ويُذكر الطبخ الخارجي بسطر سفلي في الطبخات */
    P.title = 'الاستهلاك اليومي'; P.sub = priv ? 'المراقب' : '';
    var pd = potsByDish(tb);
    var extLead = potsExt > 0 && EXT && !SH('batches') ? '+ ' + potsByDish(xb).map(function (x) { return potsTxt(x.pots, x.name); }).join(' + ') + ' (طبخ خارجي)' : ''; /* سطر مستقل بعد الجملة العلوية حين يُخفى جدول الطبخات (الجدول يحمله بسطره السفلي)؛ ولا أثر له إن أُطفئ «خارجي» */
    P.leadX = extLead;
    P.lead = tb.length ? 'طُبخ ' + pd.map(function (x) { return potsTxt(x.pots, x.name); }).join(' + ') + (SH('dist') && da.rows.length ? '، توزّعت على ' + pl(da.rows.length, 'جهة', 'جهتين', 'جهات') : '') + (SH('dist') && da.und > 0 ? '، ويبقى ' + fmt(da.und) + ' غير موزّع' : '') + '.' : extLead || potsExt > 0 && EXT ? '' : 'لا طبخ اليوم.';
    if (tb.length && SH('batches')) P.lead = SH('dist') && da.rows.length ? 'توزّعت على ' + pl(da.rows.length, 'جهة', 'جهتين', 'جهات') + (da.und > 0 ? '، ويبقى ' + fmt(da.und) + ' غير موزّع' : '') + '.' : ''; /* جدول الطبخات يغني عن تكرار أسمائها في الملخص */
    if (priv && di.sent && di.sent.ver > 1) P.lead = 'نسخة معدَّلة رقم ' + di.sent.ver + ' — تعديل في: ' + di.sent.ch.join('، ') + '. ' + P.lead;
    P.hasTiles = SH('tiles'); P.tiles = [{ label: plw(dc.pots, 'قدر', 'قدور'), value: fmt(dc.pots) }].concat(priv ? (EXT ? [(function (n) { return { label: plw(n, 'صنف خارجي', 'أصناف خارجية'), value: String(n) }; })(dc.order.filter(function (id) { return dc.agg[id].ext > 0; }).length)] : []) : [{ label: plw(nm, 'صنف', 'أصناف'), value: String(nm) }]);
    var sk = pd.length > 0 && pd.every(function (x) { return x.kind === pd[0].kind; }); /* نوع واحد لكل الطبخات: لا عمود «النوع» */
    var br = pd.map(function (x) { return sk ? R([C(x.name, { b: 1 }), C(fmt(x.pots), { c: 1, b: 1 })]) : R([C(x.name, { b: 1 }), C(KN[x.kind], { c: 1 }), C(fmt(x.pots), { c: 1, b: 1 })]); });
    if (tb.length) br.push(sk ? R([C('الإجمالي', { b: 1 }), C(fmt(dc.pots), { c: 1, b: 1 })], true) : R([C('الإجمالي', { b: 1 }), C(''), C(fmt(dc.pots), { c: 1, b: 1 })], true));
    if (potsExt > 0 && EXT) br.push(sk ? R([C('طبخ خارجي: ' + potsByDish(xb).map(function (x) { return potsTxt(x.pots, x.name); }).join(' + '), {}), C('')], false, 'ext') : R([C('طبخ خارجي: ' + potsByDish(xb).map(function (x) { return potsTxt(x.pots, x.name); }).join(' + '), {}), C(''), C('')], false, 'ext'));
    if (SH('batches')) P.secs.push(secK('batches', sk ? psec(TT('الطبخات', 'batches'), '1fr 54px', ['الطبخة', 'القدور'], br, 'لا طبخ اليوم') : psec(TT('الطبخات', 'batches'), '1fr 84px 54px', ['الطبخة', 'النوع', 'القدور'], br, 'لا طبخ اليوم')));
    /* التوزيع: مخيمان بجانب بعض لتقصير الورقة؛ وسطر الطبخة يُحذف إن كانت الطبخة واحدة لكل الجهات */
    var one = pd.length <= 1, dcells = da.rows.map(function (r, i) { return { name: r.name, val: fmt(r.pots), sub: one ? '' : r.dishes, hasSub: !one && !!r.dishes, fg: '#1B2421', st: i % 2 ? '' : 'border-inline-end:1px solid #EDEFEA;' }; });
    if (da.und > 0) dcells.push({ name: 'غير موزّع', val: fmt(da.und), sub: '', hasSub: false, fg: CL.warn, st: dcells.length % 2 ? '' : 'border-inline-end:1px solid #EDEFEA;' });
    if (SH('dist') && da.rows.length) P.secs.push(secK('dist', { isGrid: true, gcols: '1fr 1fr', isTab: false, isDual: false, title: TT('التوزيع', 'dist'), cells: dcells, hasTotal: dcells.length > 0, totLabel: 'الإجمالي', totVal: fmt(dc.pots), hasEmpty: !dcells.length, empty: 'لا توزيع بعد' }));
    var isSp = function (id) { return (item(id) || {}).grp === 'spice'; }, ordM = dc.order.filter(function (id) { return !isSp(id); }).concat(dc.order.filter(isSp)); /* الأساسية ثم البهارات في جدول واحد بلا فاصل */
    var mr = ordM.map(function (id) {
      var it = item(id), a = dc.agg[id], tot = r3(a.cook + a.other), parts = [];
      /* خلية المادة بلا سرد: «من المطبخ/خارجي» يعرضه قسم «خارجي» والمتبقي عمود؛ يبقى فقط ما لا يظهر في غيره (نقص مسجّل، أسباب الصرف) */
      if (priv) { if (!EXT) { var kb = E.balance(S, 'kitchen', id), ng = kb < 0 ? r3(Math.min(a.kit, -kb)) : 0; if (ng > 0) parts.push('نقص مسجّل في المطبخ ' + qtyU(ng, it.unit)); } }
      else if (a.other && a.why.length) parts.push(a.why.join('، '));
      var left = SH('neg') ? E.balance(S, 'kitchen', id) : Math.max(0, E.balance(S, 'kitchen', id)) /* الناقص صفرًا افتراضيًا؛ خيار «المتبقي بالسالب» (ظاهر/لي فقط/مخفي) يُظهره */ /* المتبقي = رصيد المخزن الأساسي في كل التقارير */, lst = stStatus(left, id);
      var cs = [C(it.name, { b: 1, sub: parts.join(' · ')}), C(qv(tot, it.unit), { c: 1, b: 1, u: qu(tot, it.unit), fg: priv && EXT && a.ext > 0 && SH('extra') ? CL.ext : undefined })];
      if (SH('left')) cs.push(C(qv(left, it.unit), { c: 1, u: qu(left, it.unit), fg: SH('alert') ? (lst.rank <= 1 ? CL.bad : lst.rank === 2 ? CL.warn : CL.mute) : CL.mute, b: SH('alert') && lst.rank < 3 }));
      var rr = R(cs); rr.grp = isSp(id) ? 's' : 'm'; return rr;
    });
    if (SH('mats')) P.secs.push(secK('mats', SH('left') ? psec(TT('المواد', 'mats'), '1fr 84px 84px', ['الصنف', 'الكمية', 'المتبقي' + (roMe(k, 'left', exp) ? ' (لي)' : '')], mr, 'لا مواد') : psec(TT('المواد', 'mats'), '1fr 150px', ['الصنف', 'الكمية'], mr, 'لا مواد')));
    if (!priv) {
      var mkL = dc.order.filter(function (id) { return dc.agg[id].mkt > 0; });
      if (mkL.length && SH('mkt')) P.secs.push(secK('mkt', psec(TT('من السوق مباشرة', 'mkt'), '1fr 96px', ['المادة', 'الكمية'], mkL.map(function (id) { var it = item(id); return R([C(it.name, { b: 1 }), C(qv(dc.agg[id].mkt, it.unit), { c: 1, b: 1, u: qu(dc.agg[id].mkt, it.unit) })]); }))));
    }
    { /* «خارجي» و«فروق عن المنيو» خياران في التقريرين معًا: ما يُضاف لأحدهما يُضاف للآخر */
      var ex = dc.order.filter(function (id) { return dc.agg[id].ext > 0; });
      if (ex.length && SH('extra')) P.secs.push(secK('extra', psec(TT('خارجي: من خارج المطبخ', 'extra'), '1fr 96px', ['المادة', 'الكمية'], ex.map(function (id) { var it = item(id); return R([C(it.name, { b: 1, fg: CL.ext }), C(qv(dc.agg[id].ext, it.unit), { c: 1, b: 1, fg: CL.ext, u: qu(dc.agg[id].ext, it.unit) })]); }))));
      var dv = []; tb.forEach(function (b) { var pln = plannedOf(b); spiceLast(b.lines).forEach(function (l) { var p = l.planned != null && !l.extra ? l.planned : l.extra ? null : pln[l.item]; if (p == null) dv.push(R([C(batchName(b) + ' — ' + item(l.item).name, { b: 1, sub: 'مضاف خارج الوصفة' }), C(fmt(l.qty), { c: 1 })])); else if (Math.abs(p - l.qty) > 0.001) dv.push(R([C(batchName(b) + ' — ' + item(l.item).name, { b: 1 }), C(fmt(l.qty), { c: 1, u: 'بدل ' + fmt(p) })])); }); });
      if (dv.length && SH('dev')) P.secs.push(secK('dev', psec(TT('فروق عن المنيو', 'dev'), '1fr 96px', ['البند', 'الفعلي'], dv)));
    }
  } else if (k === 'stock' || k === 'wfp') {
    var lid = k === 'wfp' ? 'wfp' : 'kitchen', asOf = stockAsOf(), SHs = SH('status') && !asOf, rs = stockRows(lid, asOf).filter(function (r) { return r.it.grp === 'spice' ? SH('spice') : SH('main'); }), mn = rs.filter(function (r) { return r.it.grp !== 'spice'; }), sp = rs.filter(function (r) { return r.it.grp === 'spice'; }), warnR = rs.filter(function (r) { return r.st.rank < 3; });
    P.title = asOf ? 'حالة المخزون بتاريخ ' + dshow(asOf) : 'حالة المخزون'; P.sub = (lid === 'wfp' ? 'مخزن WFP' : 'مخزن المطبخ') + (SH('main') && !SH('spice') ? ' · بدون البهارات' : !SH('main') && SH('spice') ? ' · البهارات فقط' : ''); if (asOf) P.date = dlong(asOf);
    P.lead = asOf ? 'الأرصدة في نهاية ذلك اليوم.' : warnR.length ? 'يحتاج انتباهًا: ' + warnR.slice(0, 4).map(function (r) { return r.it.name; }).join('، ') + (warnR.length > 4 ? ' و' + (warnR.length - 4) + ' أخرى' : '') + '.' : 'كل الأصناف كافية.';
    P.hasTiles = SH('tiles'); P.tiles = [{ label: plw(rs.length, 'صنف', 'أصناف'), value: String(rs.length) }].concat(SHs ? [{ label: 'تحتاج انتباه', value: String(warnR.length) }, { label: 'كافية', value: String(rs.length - warnR.length) }] : []);
    if (!SH('status')) P.lead = '';
    var rowsOf = function (arr) { return arr.filter(function (r) { return SH('zero') || r.q !== 0; }).map(function (r) {
      var cs = [C(r.it.name), C(qv(r.q, r.it.unit), { c: 1, b: 1, u: qu(r.q, r.it.unit), sub: SH('pack') ? packTxt(r.it, r.q) : '' })];
      if (SHs) cs.push(C(r.st.rank < 3 ? r.st.t : 'كافٍ', { c: 1, b: r.st.rank < 3, fg: r.st.rank <= 1 ? CL.bad : r.st.rank === 2 ? CL.warn : CL.ok }));
      return R(cs);
    }); };
    var sg = SHs ? '1fr 150px 74px' : '1fr 150px', shd = SHs ? ['المادة', 'الرصيد', 'الحالة' + (roMe(k, 'status', exp) ? ' (لي)' : '')] : ['المادة', 'الرصيد'];
    P.secs.push(psec(!SH('main') && SH('spice') ? 'البهارات' : 'الأرصدة', sg, shd, rowsOf(mn.concat(sp)), 'لا أصناف'));
  } else if (k === 'supply') {
    var wk = A.rdate === 'w7', sd = wk ? today() : (A.rdate || today()), rcv = S.moves.filter(function (m) { return m.kind === 'receive' && m.q > 0; });
    var days = wk ? [0, 1, 2, 3, 4, 5, 6].map(function (n) { return dayOff(-n); }) : [sd];
    var perDay = days.map(function (dd) {
      var sm = {}, so = [], sl = {};
      rcv.filter(function (m) { return m.date === dd; }).forEach(function (m) { if (!sm[m.item]) { sm[m.item] = { q: 0, leds: {} }; so.push(m.item); } sm[m.item].q = r3(sm[m.item].q + m.q); sm[m.item].leds[m.led] = 1; sl[m.led] = 1; });
      return { d: dd, sm: sm, so: so, sl: sl };
    }).filter(function (x) { return x.so.length; });
    var allL = {}, nIt = {}; perDay.forEach(function (x) { Object.keys(x.sl).forEach(function (l) { allL[l] = 1; }); x.so.forEach(function (i) { nIt[i] = 1; }); });
    var nl = Object.keys(allL).length, ni = Object.keys(nIt).length;
    var lastD = rcv.map(function (m) { return m.date; }).filter(function (d) { return d < days[days.length - 1]; }).sort().pop();
    var lastTxt = lastD ? ' آخر توريد سابق: ' + dlabel(lastD) + ' (قبل ' + pl(Math.round((new Date(today() + 'T12:00:00') - new Date(lastD + 'T12:00:00')) / 864e5), 'يوم', 'يومين', 'أيام') + ').' : '';
    P.title = wk ? 'التوريد: آخر 7 أيام' : 'التوريد اليومي'; P.date = wk ? dlabel(days[days.length - 1]) + ' إلى ' + dlabel(days[0]) : dlong(sd);
    P.lead = ni ? (wk ? 'وصل توريد في ' + pl(perDay.length, 'يوم واحد', 'يومين', 'أيام') + ': ' : 'وصل ') + pl(ni, 'صنف واحد', 'صنفان', 'أصناف') + (nl > 1 ? ' إلى ' + pl(nl, 'مخزن', 'مخزنين', 'مخازن') : '') + '.' : (wk ? 'لا توريد خلال آخر 7 أيام.' : 'لا توريد في هذا اليوم.') + lastTxt;
    P.hasTiles = SH('tiles') && ni > 0; P.tiles = (wk ? [{ label: 'أيام توريد', value: String(perDay.length) }] : []).concat([{ label: plw(ni, 'صنف', 'أصناف'), value: String(ni) }, { label: 'مخازن', value: String(nl) }]);
    if (SH('mats')) {
      var mkRows = function (x) { return x.so.map(function (id) {
        var it = item(id), a = x.sm[id], ln = Object.keys(a.leds).map(function (l) { return LSHORT[l] || (led(l) || {}).name || l; }), pk = packTxt(it, a.q);
        return R([C(it.name, { b: 1, sub: nl > 1 ? ln.join('، ') : '' }), C(qv(a.q, it.unit), { c: 1, b: 1, u: qu(a.q, it.unit), sub: pk })]);
      }); };
      if (wk && perDay.length) perDay.forEach(function (x) { P.secs.push(psec(dlabel(x.d) + ' · ' + dshow(x.d).slice(0, -5), '1fr 150px', ['الصنف', 'الكمية'], mkRows(x), '')); });
      else P.secs.push(psec(TT('المواد الواصلة', 'mats'), '1fr 150px', ['الصنف', 'الكمية'], perDay.length ? mkRows(perDay[0]) : [], 'لا توريد في هذا اليوم'));
    }
  } else {
    var ws = activeW(), pres = ws.filter(function (w) { var a = wAtt(w); return a && a.st !== 'a' && a.st !== 'h'; }).length, none = ws.filter(function (w) { return !wAtt(w); }).length;
    P.title = 'كشف العمال'; P.sub = 'داخلي'; P.lead = pres + ' من ' + ws.length + ' حاضرون اليوم.';
    P.hasTiles = true; P.tiles = [{ label: 'عمال', value: String(ws.length) }, { label: 'حاضرون', value: String(pres) }, { label: 'بلا تسجيل', value: String(none) }];
    P.secs.push(psec('الحضور والأرصدة', '1fr 70px 100px', ['العامل', 'الحالة', 'الرصيد'], ws.map(function (w) { var a = wAtt(w), bv = wBal(w); return R([C(w.name, { b: 1 }), C(a ? (stat(a.st) || {}).name || '—' : '—', { c: 1 }), C(balTxt(bv), { c: 1, b: 1, fg: bv < 0 ? CL.bad : bv > 0 ? CL.ok : CL.mute })]); }), 'لا عمال'));
  }
  P.secs.forEach(function (x) { if (x.k === 'mats' && SH('split')) dualSec(x, P.secs.some(function (y) { return y.k === 'extra'; })); /* تفصيل «من المطبخ/خارجي» يغني عنه قسم الخارجي */ }); /* خيار: أحيانًا لا يُراد التقسيم وإن طال الجدول */
  if (SEC[k]) { var od = secOrder(k); P.secs.sort(function (a, b) { return od.indexOf(a.k) - od.indexOf(b.k); }); }
  P.hasLead = !!P.lead || !!P.leadX; P.hasLeadMain = !!P.lead; P.hasLeadX = !!P.leadX; P.leadXfg = '#7A4A12';
  return P;
}
function repText(k) { // يُبنى من المستند نفسه: ما يظهر في التقرير هو ما يُرسل، وما كان «لي فقط» لا يُصدَّر
  var d = repDoc(k, true), L = [rptName(k) + (d.sub ? ' — ' + d.sub : '') + ' — ' + d.date, ''];
  if (d.lead) L.push(d.lead); if (d.leadX) L.push(d.leadX); if (d.lead || d.leadX) L.push('');
  d.secs.forEach(function (s) {
    L.push(s.title + ':');
    if (s.hasEmpty) L.push('• ' + s.empty);
    if (s.isGrid) { s.cells.forEach(function (g) { L.push('• ' + g.name + ': ' + g.val + (g.hasSub ? ' (' + g.sub + ')' : '')); }); if (s.hasTotal) L.push('• ' + s.totLabel + ': ' + s.totVal); }
    else s.rows.forEach(function (r) { var c = r.cells, rest = c.slice(1).map(function (x) { return (x.t + ' ' + x.u).trim(); }).filter(Boolean).join(' — '); L.push('• ' + c[0].t + (rest ? ': ' + rest : '') + (c[0].hasSub ? ' (' + c[0].sub + ')' : '')); });
    L.push('');
  });
  d.notes.forEach(function (n) { L.push(n.t); });
  L.push('مطبخ عهد — أُعدّ تلقائيًا من التطبيق'); return L.join('\n');
}
function shareReport(k) {
  var text = repText(k), title = rptName(k);
  if (P.Share) P.Share.share({ title: title, text: text, dialogTitle: 'إرسال التقرير' }).catch(function () {});
  else if (navigator.share) navigator.share({ title: title, text: text }).catch(function () {});
  else copyReport(k);
}
function copyReport(k) {
  var text = repText(k), ok = function () { say('نُسخ نص التقرير، الصقه حيث تشاء'); }, bad = function () { say('تعذّر النسخ'); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, bad);
  else { try { var t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); ok(); } catch (e) { bad(); } }
}
function pgReports() {
  var k = A.rpt || 'cook', bl = [], list = RPTS.filter(function (a) { return a[0] !== 'wfp' || wfpOn(); });
  if (!list.some(function (a) { return a[0] === k; })) k = 'cook';
  bl.push(B('chips', { items: list.map(function (a) { return X({ label: a[1], on: k === a[0], go: function () { setState({ rpt: a[0] }); } }); }) }));
  /* تاريخ التقرير: تقويم واحد بأيقونته المعروفة بدل أزرار اليوم/أمس */
  if (k === 'supply' || k === 'stock' || k === 'wfp') {
    var sdv = A.rdate || today(), w7 = k === 'supply' && sdv === 'w7', cur = w7 ? today() : sdv > today() ? today() : sdv;
    bl.push(B('btns', { items: [X({ label: dlabel(cur) + ' · تغيير التاريخ', icon: 'i-calendar', on: !w7, go: function () { openSh({ t: 'repDay' }, { dtxt: cur }); } })].concat(k === 'supply' ? [X({ label: 'آخر 7 أيام', on: w7, go: function () { setState({ rdate: w7 ? today() : 'w7' }); } })] : []) }));
  }
  if (k !== 'workers' && roHasMe(k)) bl.push(B('chips', { items: [[false, 'عرضي'], [true, 'كما يُصدَّر']].map(function (a) { return X({ label: a[1], on: !!A.rexp === a[0], go: function () { setState({ rexp: a[0] }); } }); }) }));
  bl.push(B('paper', { pap: repDoc(k) }));
  bl.push(B('btns', { items: [X({ label: k === 'workers' ? 'داخلي: بلا مشاركة' : 'مشاركة', icon: 'i-send', on: k !== 'workers', go: function () { if (k === 'workers') say('كشف العمال داخلي ولا يُرسل'); else exportReport(k, 'share'); } })] }));
  if (k !== 'workers') bl.push(B('btns', { items: [X({ label: 'خيارات التقرير', icon: 'i-sliders', go: function () { var f = {}; RO[k].forEach(function (a) { f[a[0]] = roV(k, a[0]); }); f.order = secOrder(k).join(','); openSh({ t: 'repOpt', k: k }, f); } })] }));
  bl.push(B('btns', { items: [X({ label: 'PDF', icon: 'i-send', go: function () { exportReport(k, 'sharepdf'); } }), X({ label: 'تنزيل PDF', icon: 'i-download', go: function () { exportReport(k, 'pdf'); } }), X({ label: 'تنزيل صورة', icon: 'i-download', go: function () { exportReport(k, 'png'); } }), X({ label: 'نسخ النص', icon: 'i-copy', go: function () { copyReport(k); } })] }));
  if (k === 'stock' || k === 'wfp') bl.push(B('btns', { items: [X({ label: 'تغيير دورة تقرير المخزون', icon: 'i-clock', go: function () { openSh({ t: 'stockEvery' }, { n: String(S.settings.stockEvery || 3) }); } })] }));
  var di = dayInfo();
  if (k === 'wck' && di.sent && di.sent.ver > 1) bl.push(B('note', { tone: 'warn', icon: 'i-doc', text: 'النسخة الحالية معدَّلة رقم ' + di.sent.ver + '، وفيها: ' + di.sent.ch.join('، ') + '.' }));
  if (k === 'wck') bl.push(B('note', { tone: 'info', icon: 'i-clock', text: 'يصل المراقب كل يوم عند إغلاق اليوم: الاستهلاك والتوزيع، بلا أسعار ولا عمال.' }));
  if (k === 'stock' || k === 'wfp') bl.push(B('note', { tone: 'info', icon: 'i-clock', text: 'يصل المراقب كل ' + ((S.settings.stockEvery || 3) === 2 ? 'يومين' : pl(S.settings.stockEvery || 3, 'يوم', 'يومين', 'أيام')) + '، بلا أسعار.' }));
  if (k === 'wck' || k === 'stock') bl.push(B('rows', { title: 'مستلمو تقرير المراقب', act: 'مستلم', actGo: function () { openSh({ t: 'addPerson' }, { name: '', preset: 'observer', phone: '', rep: 'yes', wk: '' }); },
    items: recipients().map(function (p) { return X({ icon: 'i-send', icTone: 'info', title: p.name, sub: (preset(p.preset) || {}).name || '', tag: k === 'stock' ? 'يستلم' : 'يستلم يوميًا', tagTone: 'mute' }); }), empty: 'لا مستلمين بعد' }));
  return bl;
}
/* خيارات التقرير مجمّعة بعنوانين صغيرين (أقسام التقرير | جدول المواد) داخل شبكة رقائق واحدة؛ الخيار التابع يختفي حين يُخفى أصله (RO_DEP) */
var RO_TBL = { split: 1, left: 1, neg: 1, alert: 1 };
function roGrid(k) {
  var all = RO[k].filter(function (a) { return !RO_DEP[a[0]] || fv(RO_DEP[a[0]]) !== 'off'; });
  var secs = all.filter(function (a) { return !RO_TBL[a[0]]; }), tbl = all.filter(function (a) { return RO_TBL[a[0]]; });
  return ['ما يظهر في التقرير'].concat(secs, tbl.length ? ['جدول المواد'] : [], tbl);
}
function repSheet(sh) {
  var R = null;
  if (sh.t === 'repOpt') {
    R = { title: 'خيارات التقرير', sub: 'ما تعلّمه «ظاهر» يصل في التصدير، و«لي فقط» تراه هنا ولا يُصدَّر', fields: [fStateGrid(roGrid(sh.k))],
      rows: SEC[sh.k] ? secOrder(sh.k, fv('order')).map(function (key, i, arr) { return X({ icon: 'i-sliders', icTone: 'mute', title: (i + 1) + '. ' + secLabel(sh.k, key), tag: i ? '' : 'الأول', tagTone: 'ok', go: function () { if (!i) return; var a2 = arr.slice(); a2.splice(i - 1, 0, a2.splice(i, 1)[0]); fset('order', a2.join(',')); } }); }) : [],
      note: SEC[sh.k] ? { text: 'ترتيب الأقسام: اضغط القسم لرفعه فوق ما قبله. يُطبَّق على الشاشة والتصدير.', tone: 'info' } : null,
      ft: { label: 'حفظ الخيارات', ok: true, go: function () { var v = {}; RO[sh.k].forEach(function (a) { v[a[0]] = fv(a[0]); }); if (SEC[sh.k]) v.order = secOrder(sh.k, fv('order')).join(','); S.ro = S.ro || {}; S.ro[sh.k] = v; audit('تغيير خيارات تقرير «' + rptName(sh.k) + '»'); shut(); mutated('حُفظت خيارات التقرير وتُطبَّق على كل تصدير قادم'); } } };
  } else if (sh.t === 'repDay') {
    var rdd = dateNear(fv('dtxt'));
    R = { title: 'تاريخ التقرير', sub: 'اختر اليوم من التقويم', fields: [fDate('dtxt', 'التاريخ', '', today())],
      note: rdd ? { text: dlabel(rdd), tone: 'info' } : null, ft: { label: 'عرض التقرير', ok: !!rdd && rdd <= today(), go: function () { shut(); setState({ rdate: rdd }); } } };
  } else if (sh.t === 'stockEvery') {
    R = { title: 'دورة تقرير المخزون للمراقب', sub: 'كل كم يوم يُجهَّز تقرير حالة المخزون', fields: [fChips('n', 'كل', [['2', 'يومين'], ['3', '3 أيام'], ['4', '4 أيام'], ['7', 'أسبوع']])],
      note: { text: 'التقرير اليومي (الاستهلاك والمخيمات) لا يتأثر بهذا الإعداد، ويبقى كل يوم.', tone: 'info' },
      ft: { label: 'حفظ', ok: !!fv('n'), go: function () { var n = parseInt(fv('n'), 10); S.settings.stockEvery = n; audit('دورة تقرير المخزون للمراقب: كل ' + pl(n, 'يوم', 'يومين', 'أيام')); shut(); mutated('سيُجهَّز تقرير المخزون كل ' + pl(n, 'يوم', 'يومين', 'أيام')); } } };
  }
  return R;
}

/* ===== 02s-smart.js ===== */
/* ---------- ابتكارات: قائمة المشتريات، تنبيه السعر والتكرار، ملخص اليوم، كشف الشهر ---------- */
function shareText(title, text) {
  if (P.Share) P.Share.share({ title: title, text: text, dialogTitle: title }).catch(function () {});
  else if (navigator.share) navigator.share({ title: title, text: text }).catch(function () {});
  else copyText(text, 'نُسخ النص');
}

/* ===== 1) قائمة المشتريات: ما ينقص لخطة 7 أيام، أو ضعف المعتاد إن لم توجد خطة، مجمّعة حسب المورّد ===== */
function buyList() {
  var hz = dayOff(7), need = {}, out = [];
  planLines().forEach(function (p) { if (p.date > hz) return; p.lines.forEach(function (l) { need[l.item] = r3((need[l.item] || 0) + l.qty); }); });
  S.items.forEach(function (it) {
    if (it.arch) return;
    var have = Math.max(E.balance(S, 'kitchen', it.id), 0) + Math.max(E.balance(S, 'ext', it.id), 0), want = need[it.id] || 0, why = want ? 'للخطة' : '';
    if (!want) { var u = usageOf(it.id); if (u && u.typical > 0 && have < u.typical) { want = r3(u.typical * 2); why = 'ضعف المعتاد'; } }
    var lack = r3(want - have);
    if (lack > 0) out.push({ it: it, lack: lack, have: have, why: why, sup: (it.sup || '').trim() });
  });
  out.sort(function (a, b) { return (a.sup === b.sup ? 0 : !a.sup ? 1 : !b.sup ? -1 : a.sup.localeCompare(b.sup, 'ar')) || a.it.name.localeCompare(b.it.name, 'ar'); });
  return out;
}
function buyGroups(list) { var g = [], map = {}; list.forEach(function (r) { var k = r.sup || 'بلا مورّد محدد'; if (!map[k]) { map[k] = { name: k, rows: [] }; g.push(map[k]); } map[k].rows.push(r); }); return g; }
function buyText(list) {
  var L = ['قائمة المشتريات — ' + dlong(today())];
  buyGroups(list).forEach(function (g) {
    L.push('', g.name + ':');
    g.rows.forEach(function (r) { var pk = packTxt(r.it, r.lack); L.push('- ' + r.it.name + ': ' + qtyU(r.lack, r.it.unit) + (pk ? ' (' + pk + ')' : '')); });
  });
  return L.join('\n');
}
function openBuyList() { open('main', { tab: 'stock' }); openSh({ t: 'buy' }); }

/* ===== 2 و 3) تنبيهات الاستلام: تغيّر السعر، واستلام مكرر ===== */
function rcvAlerts(it, lid, rq, price) {
  var out = [], last = it.price || 0;
  if (price > 0 && last > 0) { var r = (price - last) / last; if (Math.abs(r) > 0.15) out.push('السعر ' + (r > 0 ? 'أعلى' : 'أقل') + ' بنسبة ' + Math.round(Math.abs(r) * 100) + '٪ من آخر سعر (' + money(last) + ')'); }
  var dup = null, now = Date.now();
  S.moves.forEach(function (m) { if (m.kind === 'receive' && m.item === it.id && m.led === lid && Math.abs(m.q - rq) < 0.0005 && now - m.ts < 864e5 && (!dup || m.ts > dup.ts)) dup = m; });
  if (rq > 0 && dup) { var mins = Math.max(1, Math.round((now - dup.ts) / 6e4)); out.push('سُجّل استلام بالكمية نفسها لهذا الصنف قبل ' + (mins < 60 ? pl(mins, 'دقيقة', 'دقيقتين', 'دقائق') : pl(Math.round(mins / 60), 'ساعة', 'ساعتين', 'ساعات')) + '. تأكد أنه ليس تكرارًا'); }
  return { notes: out, dup: !!dup };
}

/* ===== 4) ملخص اليوم ===== */
function dayFacts() {
  var t = today(), wd = E.wDay(S, t), bs = dayBatches(), rc = S.moves.filter(function (m) { return m.kind === 'receive' && m.date === t; }),
    pays = wlOn().filter(function (e) { return e.kind === 'pay' && e.date === t; }), adj = S.moves.filter(function (m) { return (m.kind === 'adjust' || m.kind === 'issue') && m.date === t; });
  return { t: t, wd: wd, bs: bs, rc: rc, pays: pays, adj: adj, paid: r2(pays.reduce(function (a, e) { return a + e.amt; }, 0)), closed: isClosed(), unconf: unconfDay().length,
    any: !!(bs.length || rc.length || pays.length || adj.length || wd.total - wd.none > 0) };
}
function daySummaryText() {
  var f = dayFacts(), L = ['ملخص ' + dlong(f.t) + ' — مطبخ عهد'];
  L.push('الحضور: ' + (f.wd.total - f.wd.none) + ' من ' + f.wd.total + (f.wd.cost ? ' · يومية اليوم ' + money(f.wd.cost) : ''));
  if (f.bs.length) { L.push('', 'الطبخات (' + f.bs.length + '):'); f.bs.forEach(function (b) { L.push('- ' + batchName(b) + ' · ' + pl(b.pots || 0, 'قدر واحد', 'قدران', 'قدور') + (b.kind === 'external' ? ' · ' + KN.external : '') + (b.done === false ? ' (كمياتها لم تُؤكَّد)' : '')); }); }
  else L.push('', 'لا طبخات اليوم');
  if (f.rc.length) { L.push('', 'المواد المستلمة:'); f.rc.forEach(function (m) { var it = item(m.item); L.push('- ' + (it ? it.name : m.item) + ': ' + qtyU(m.q, it ? it.unit : '')); }); }
  if (f.adj.length) { L.push('', 'صرف وتسويات: ' + pl(f.adj.length, 'حركة واحدة', 'حركتان', 'حركات')); }
  if (f.pays.length) L.push('', 'دفعات العمال: ' + money(f.paid) + ' (' + pl(f.pays.length, 'دفعة واحدة', 'دفعتان', 'دفعات') + ')');
  L.push('', f.closed ? 'اليوم مُغلق وأُرسل تقريره.' : 'اليوم لم يُغلق بعد.');
  return L.join('\n');
}
function openDaySummary() { open('main', { tab: 'today' }); openSh({ t: 'dsum' }); }

/* ===== 5) كشف شهري للعامل ===== */
function monthKeys(n) { var out = [], d = new Date(); d.setDate(1); for (var i = 0; i < n; i++) { out.push(d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2)); d.setMonth(d.getMonth() - 1); } return out; }
function monthLabel(ym) { var p = ym.split('-'); return MN[+p[1] - 1] + ' ' + p[0]; }
function monthNext(ym) { var p = ym.split('-').map(Number), y = p[0], m = p[1] + 1; if (m > 12) { m = 1; y++; } return y + '-' + ('0' + m).slice(-2) + '-01'; }
function monthStmt(w, ym) {
  var from = ym + '-01', nx = monthNext(ym), to = nx > dayOff(1) ? dayOff(1) : nx, last = {};
  (S.att || []).forEach(function (a) { if (a.w === w.id && a.date >= from && a.date < to) last[a.date] = a; });
  var days = Object.keys(last).sort().map(function (k) { return last[k]; }), earned = r2(days.reduce(function (a, x) { return a + E.attAmt(x); }, 0)), byName = {};
  days.forEach(function (x) { var s = stat(x.st) || { name: x.st }; byName[s.name] = (byName[s.name] || 0) + 1; });
  var es = wlOn().filter(function (e) { return e.w === w.id && e.kind !== 'open' && e.cat !== 'adjw' && e.date >= from && e.date < to; }).sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : a.ts - b.ts; });
  return { from: from, open: wBalBefore(w, from), days: days, earned: earned, byName: byName, es: es, close: wBalBefore(w, to), partial: nx > dayOff(1) };
}
function monthText(w, ym) {
  var s = monthStmt(w, ym);
  var L = ['كشف حساب ' + monthLabel(ym) + ' — ' + w.name, 'الرصيد في أول الشهر: ' + balTxtTo(s.open), '', 'أيام العمل: ' + s.days.length + ' · مستحق اليوميات ' + money(s.earned)];
  var bn = Object.keys(s.byName); if (bn.length) L.push(bn.map(function (k) { return k + ' ' + s.byName[k]; }).join(' · '));
  if (s.es.length) { L.push('', 'الحركات:'); s.es.forEach(function (e) { L.push('- ' + dlabel(e.date) + ': ' + wLabel(e) + (e.amt ? ' ' + money(e.amt) : '') + (e.note ? ' — ' + e.note : '')); }); }
  L.push('', (s.partial ? 'الرصيد حتى اليوم: ' : 'الرصيد في آخر الشهر: ') + balTxtTo(s.close));
  return L.join('\n');
}

function smartSheet(sh) {
  switch (sh.t) {
    case 'buy': {
      var list = buyList(), rows = [];
      buyGroups(list).forEach(function (g) {
        rows.push(X({ par: true, icon: 'i-truck', icTone: 'info', title: g.name, sub: pl(g.rows.length, 'صنف واحد', 'صنفان', 'أصناف') }));
        g.rows.forEach(function (r) { rows.push(X({ kid: true, icon: 'i-box', icTone: 'warn', title: r.it.name, sub: 'عندك ' + qtyU(r.have, r.it.unit) + ' · ' + r.why, end: qtyU(r.lack, r.it.unit), endSub: packTxt(r.it, r.lack), chev: true, go: function () { openSh({ t: 'recv', item: r.it.id }, { led: 'kitchen', unitMode: 'base', qty: String(r.lack), price: '' }); }, lp: function () { stockQa(r.it, 'kitchen'); } })); });
      });
      return { title: 'قائمة المشتريات', sub: list.length ? pl(list.length, 'صنف واحد ينقص', 'صنفان ينقصان', 'أصناف تنقص') : 'لا شيء ينقص', rows: rows, empty: 'المخزون يغطي خطة الأيام السبعة القادمة',
        note: list.length ? { text: 'تُحسب من الخطة القادمة (7 أيام) مطروحًا منها رصيد المطبخ والخارجي. ولتجميعها بالمورّد أضف «المورّد المعتاد» في بيانات الصنف.', tone: 'info' } : null,
        ft: { label: 'إرسال القائمة', ok: list.length > 0, go: function () { shareText('قائمة المشتريات', buyText(list)); } },
        ft2: list.length ? { label: 'نسخ النص', go: function () { copyText(buyText(list), 'نُسخت القائمة'); } } : null };
    }
    case 'dsum': {
      var f = dayFacts(), tx = daySummaryText();
      return { title: 'ملخص اليوم', sub: dlong(f.t),
        rows: [
          X({ icon: 'i-users', icTone: 'info', title: 'الحضور', sub: f.wd.cost ? 'يومية اليوم ' + money(f.wd.cost) : '', tag: (f.wd.total - f.wd.none) + ' من ' + f.wd.total, tagTone: f.wd.none ? 'warn' : 'ok' }),
          X({ icon: 'i-pot', icTone: 'warn', title: 'الطبخات', sub: f.bs.map(batchName).join('، '), tag: String(f.bs.length), tagTone: 'mute' }),
          X({ icon: 'i-truck', icTone: 'ok', title: 'مواد مستلمة', tag: String(f.rc.length), tagTone: 'mute' }),
          X({ icon: 'i-wallet', icTone: 'mute', title: 'دفعات العمال', tag: money(f.paid), tagTone: 'mute' }),
          X({ icon: 'i-lock', icTone: f.closed ? 'ok' : 'warn', title: 'الإغلاق', tag: f.closed ? 'مُغلق' : 'لم يُغلق', tagTone: f.closed ? 'ok' : 'warn' })],
        note: f.unconf ? { text: pl(f.unconf, 'طبخة كمياتها لم تُؤكَّد', 'طبختان كمياتهما لم تُؤكَّدا', 'طبخات كمياتها لم تُؤكَّد') + ' بعد.', tone: 'warn' } : null,
        ft: { label: 'إرسال الملخص', ok: true, go: function () { shareText('ملخص اليوم', tx); } }, ft2: { label: 'نسخ النص', go: function () { copyText(tx, 'نُسخ الملخص'); } } };
    }
    case 'wmonth': { var wm = wk(sh.wid); return wstSheet({ t: 'wst', wid: wm.id }); }
  }
  return null;
}

/* ===== 02t-extimp.js ===== */
/* ---------- طبخات المؤسسات المجهّزة من الشيت: تظهر في «يحتاج انتباهك» وتُسجَّل باعتمادك (بأسعار الشيت) ---------- */
var EXTP = null;
function loadExtProposal() { return fetch('ext-proposal.json').then(function (r) { return r.json(); }).then(function (p) { EXTP = p; }).catch(function () {}); }
function extDone(b) { return (S.settings.extImp || []).indexOf(b.key) >= 0 || S.batches.some(function (x) { return x.imp === b.key || (!x.void && x.inst === b.inst && x.date === b.date && x.kind === 'external'); }); }
function extPending() { return EXTP && EXTP.batches ? EXTP.batches.filter(function (b) { return inst(b.inst) && !extDone(b); }) : []; }
function extImportOne(b) {
  var nb = E.recordBatch(S, { date: b.date, dish: b.dish, pots: b.pots, kind: 'external', instId: b.inst, lines: b.lines.map(function (l) { return { item: l[0], qty: l[1], price: l[2], fill: false }; }) });
  nb.done = true; nb.imp = b.key; nb.portions = 0; S.settings.extImp = (S.settings.extImp || []).concat([b.key]);
  audit('اعتماد طبخة «' + b.dish + '» لـ' + inst(b.inst).name + ' بتاريخ ' + dlabel(b.date) + ' من الشيت'); return nb;
}
function doExtImport() { var ps = extPending(); if (!ps.length) { shut(); return; } ps.forEach(extImportOne); shut(); mutated('سُجّلت ' + pl(ps.length, 'طبخة واحدة', 'طبختان', 'طبخات') + ' من الشيت'); }
function extAttn(att) {
  var ps = extPending(); if (!ps.length) return;
  att.push({ rank: 0.55, row: X({ icon: 'i-pot', icTone: 'warn', title: 'طبخة من الشيت بانتظار اعتمادك', sub: ps.map(function (b) { return inst(b.inst).name + ' · ' + dlabel(b.date); }).join('، '), tag: 'للاعتماد', tagTone: 'warn', chev: true, go: function () { openSh({ t: 'extimp' }); } }) });
}
function extSheet(sh) {
  if (sh.t !== 'extimp') return null;
  var ps = extPending();
  if (!ps.length) return { title: 'طبخات من الشيت', sub: '', rows: [X({ icon: 'i-check', icTone: 'ok', title: 'لا شيء بانتظار الاعتماد' })], ft: { label: 'إغلاق', ok: true, go: shut } };
  var rows = [];
  ps.forEach(function (b) {
    rows.push(X({ par: true, icon: 'i-pot', icTone: 'info', title: inst(b.inst).name + ' · ' + b.dish, sub: dlabel(b.date) + ' · ' + pl(b.pots, 'قدر واحد', 'قدران', 'قدور'), tag: money(b.total), tagTone: 'mute' }));
    spiceLast(b.lines, function (l) { return l[0]; }).forEach(function (l) { var it = item(l[0]); rows.push(X({ kid: true, title: it ? it.name : l[0], sub: qtyU(l[1], it ? it.unit : '') + ' × ' + money(l[2]), tag: money(l[1] * l[2]), tagTone: 'mute' })); });
  });
  return { title: 'طبخات من الشيت', sub: 'بأسعار الشيت كما هي', rows: rows,
    note: { text: 'تُسجَّل الطبخة بسعر كل مادة في الشيت، وتُخصم المواد من المخزن الخارجي، وما ينقص منه يبقى سالبًا. لا يتغير الشيت.', tone: 'info' },
    ft: { label: 'اعتماد وتسجيل', ok: true, go: doExtImport } };
}

/* ===== 02u-fix.js ===== */
/* ---------- تعديل طبخة قديمة (أصناف وكميات وأسعار) + كشف حساب الجهة بالشهر ---------- */
/* نسخة عمل: لا يتغير شيء قبل «حفظ التعديلات» */
function fixOpen(b) {
  A.fix = { id: b.id, dish: b.dish || '', pots: b.pots || 0, lines: b.lines.map(function (l) { return { item: l.item, qty: l.qty, price: l.price, keep: l.src ? JSON.parse(JSON.stringify(l.src)) : null, mkt: !!(l.src && l.src.mkt), planned: l.planned, dev: l.dev, extra: l.extra }; }) };
  openSh({ t: 'bfix', id: b.id }, {});
}
function fixFree(b) { return b.kind === 'external' && E.isFree(led(b.order[0])); }
function fixCost(f, b) { return fixFree(b) ? 0 : r2(f.lines.reduce(function (a, l) { return a + (l.qty || 0) * (l.price || 0); }, 0)); }
function fixSave() {
  var f = A.fix, b = E.by(S.batches, f.id); if (!b || !f) return;
  var ls = f.lines.filter(function (l) { return l.qty > 0; }); if (!ls.length) { say('أضف صنفًا واحدًا على الأقل'); return; }
  var was = b.cost || 0;
  try {
    E.editBatch(S, b.id, { dish: f.dish || (rec(b.recipe) || {}).name || b.dish, pots: f.pots, lines: ls.map(function (l) { return { item: l.item, qty: l.qty, price: l.price, keep: l.keep, mkt: l.mkt, planned: l.planned, dev: l.dev, extra: l.extra }; }) });
  } catch (e) { say(String(e.message || e)); return; }
  if (b.kind === 'external') { var del = {}; (b.gone || []).forEach(function (g) { del[g] = true; }); applyPricing(b, { pm: b.pm, lump: b.lump, xl: b.xl, cf: b.cf, del: del }); }
  b.fixTs = Date.now();
  audit('تعديل أصناف/أسعار «' + batchName(b) + '» (' + dlabel(b.date) + '): ' + money(was) + ' ← ' + money(b.cost || 0));
  A.fix = null; setState({ sh: { t: 'bview', id: b.id }, form: {}, q: '' }); mutated('حُفظ تعديل «' + batchName(b) + '»');
}

/* ---------- كشف الحساب ---------- */
function stMonths(i) {
  var o = {}, cur = today().slice(0, 7); o[cur] = 1;
  S.batches.forEach(function (b) { if (b.inst === i.id && !b.void) o[b.date.slice(0, 7)] = 1; });
  (i.chg || []).concat(i.pay || []).forEach(function (c) { if (c.date) o[c.date.slice(0, 7)] = 1; });
  return Object.keys(o).sort().reverse();
}
function stAcct(i, ym) {
  var all = S.batches.filter(function (b) { return b.inst === i.id && !b.void; }).sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  var inM = function (d) { return ym === 'all' || (d || '').slice(0, 7) === ym; }, before = function (d) { return ym !== 'all' && (d || '').slice(0, 7) < ym; };
  var sum = function (a) { return r2(a.reduce(function (t, x) { return t + (x.cost != null ? x.cost : x.amt || 0); }, 0)); };
  var prev = r2(sum(all.filter(function (b) { return before(b.date); })) + sum((i.chg || []).filter(function (c) { return before(c.date); })) - sum((i.pay || []).filter(function (c) { return before(c.date); })));
  var bs = all.filter(function (b) { return inM(b.date); }), chg = (i.chg || []).filter(function (c) { return inM(c.date); }), pay = (i.pay || []).filter(function (c) { return inM(c.date); });
  var cost = sum(bs), ch = sum(chg), pd = sum(pay);
  return { prev: prev, bs: bs, chg: chg, pay: pay, cost: cost, ch: ch, pd: pd, due: r2(prev + cost + ch - pd) };
}
function stKey(i, ym) { return i.id + '|' + ym; }
function stCurM(i) { var ms = stMonths(i); if (!fv('m')) A.form.m = ms.filter(function (m) { return S.batches.some(function (b) { return b.inst === i.id && !b.void && b.date.slice(0, 7) === m; }); })[0] || ms[0]; return fv('m'); }
function stLate(i, ym, a) {
  var sent = (S.settings.stmtSent || {})[stKey(i, ym)]; if (!sent) return 0;
  return a.bs.filter(function (b) { return (b.fixTs || 0) > sent; }).length;
}
/* عنوان فرعي موحّد لكل أسطح كشف الحساب (الشاشة، الصورة، المفصّل): المناسبة (عزاء، عرس…) ثم الشهر؛ تظهر في القائمة فتظهر في كل تفصيلها (المالك 2026-11-19) */
function stmtSub(i, ym) { return (i && i.occ ? i.occ + ' · ' : '') + (ym === 'all' ? 'كل الأشهر' : monthLabel(ym)); }
/* ---------- خيارات كشف الحساب: كل بند ظاهر أو مخفي (المالك 2026-11-21) ----------
   تُحفظ لكل جهة وتُضبط افتراضيًا لكل الجهات (`*`). إخفاء بند يخفي عرضه في الشاشة والصورة وPDF والمشاركة كلها ولا يغيّر أي رقم ولا المستحق. */
var STO = [['head', 'بيانات الكشف (الرقم والتاريخ والعملة)'], ['sum', 'الملخص في الأعلى'], ['lines', 'تفصيل الأصناف داخل الطبخة'], ['unit', 'أسعار الوحدات'], ['labor', 'سطر العمالة'], ['subt', 'مجموع المواد'], ['notes', 'الملاحظات'], ['terms', 'الشروط وبيانات الدفع']];
var ST_OV = null; /* خيارات المعاينة الحية: تُمرَّر من النموذج لا من المحفوظ، فتتغير الصورة مع كل تبديل قبل الإرسال */
function stOpt(i) {
  var st = S.settings.stOpt || {}, base = Object.assign(i.all ? { lbl: 'cost' } : {}, st['*'] || {}, st[i.id] || {}, ST_OV || {}), o = {};
  STO.forEach(function (k) { o[k[0]] = base[k[0]] !== '0'; });
  o.sv = base.sv === 'sum' ? 'sum' : 'full'; /* شكل الكشف يُحفظ مع الخيارات */
  o.lbl = base.lbl === 'cost' ? 'التكلفة' : 'المستحق'; /* عنوان المبلغ: «المستحق» أو «التكلفة» لمن يُتعامل معهم على اتفاق التكلفة؛ الأرقام نفسها لا تتغير */
  o.noteTxt = ST_OV && ST_OV.noteTxt != null ? ST_OV.noteTxt : ((S.settings.stNote || {})[i.id] || '').trim(); o.termsTxt = ST_OV && ST_OV.termsTxt != null ? ST_OV.termsTxt : (S.settings.stTerms || '').trim(); return o;
}
function stNo(i, ym) { return 'K-' + (ym === 'all' ? 'ALL' : String(ym).replace('-', '')) + '-' + (i.all ? 'ALL' : String(S.insts.indexOf(i) + 1).padStart(2, '0')); }
function stMeta(i, ym) { return 'مطبخ عهد · رقم الكشف ' + stNo(i, ym) + ' · صدر ' + dlong(today()) + ' · العملة: شيكل'; }
var _stM = null;
function stWrap(t, mw, font) {
  _stM = _stM || document.createElement('canvas').getContext('2d'); _stM.font = font; var out = [];
  String(t).split('\n').forEach(function (ln) { var cur = ''; ln.split(' ').forEach(function (w) { var nx = cur ? cur + ' ' + w : w; if (cur && _stM.measureText(nx).width > mw) { out.push(cur); cur = w; } else cur = nx; }); out.push(cur); });
  return out;
}
/* ذيل الكشف: الملاحظات ثم الشروط وبيانات الدفع (يُحسب ارتفاعه قبل الرسم ثم يُرسم) */
function stTail(i, o, W, PAD, F) {
  var bl = []; if (o.notes && o.noteTxt) bl.push(['ملاحظات', o.noteTxt]); if (o.terms && o.termsTxt) bl.push(['الشروط وبيانات الدفع', o.termsTxt]);
  bl.forEach(function (b) { b.push(stWrap(b[1], W - 2 * PAD, '500 22px ' + F)); });
  return { h: bl.reduce(function (t, b) { return t + 44 + b[2].length * 34 + 14; }, 0), draw: function (x, y) {
    bl.forEach(function (b) { x.fillStyle = '#14563A'; x.textAlign = 'right'; x.font = '700 23px ' + F; x.fillText(b[0], W - PAD, y + 30); x.fillStyle = '#E3E8E4'; x.fillRect(PAD, y + 40, W - 2 * PAD, 1); y += 44;
      x.fillStyle = '#3E4843'; x.font = '500 22px ' + F; b[2].forEach(function (ln) { x.fillText(ln, W - PAD, y + 26); y += 34; }); y += 14; }); return y; } };
}
/* ترويسة كشف الجهة الموحّدة (المختصر والمفصّل): «كشف حساب» وسم صغير خفيف فوق الاسم، والاسم هو العنوان الكبير؛ فلا يتساوى الوسم والاسم في الوزن (المالك 2026-11-21) */
function stHeadH(o) { return o.head ? 176 : 150; }
function stHead(x, W, PAD, F, i, ym, o, sub2) {
  x.fillStyle = '#14563A'; x.fillRect(0, 0, W, stHeadH(o)); x.fillStyle = '#FFFFFF'; x.textAlign = 'right';
  x.globalAlpha = .72; x.font = '500 22px ' + F; x.fillText('كشف حساب', W - PAD, 36); x.globalAlpha = 1;
  var nm = String(i.name), fs = 44; x.font = '700 ' + fs + 'px ' + F; while (fs > 28 && x.measureText(nm).width > W - 2 * PAD) { fs -= 2; x.font = '700 ' + fs + 'px ' + F; } x.fillText(nm, W - PAD, 86);
  x.font = '500 25px ' + F; x.fillText(stmtSub(i, ym) + (sub2 || ''), W - PAD, 124);
  if (o.head) { x.font = '500 20px ' + F; x.globalAlpha = .85; x.fillText(stMeta(i, ym), W - PAD, 158); x.globalAlpha = 1; }
}
/* معاينة الكشف مع خيارات تتبدل حيًّا: الصورة فوق والخيارات تحتها، ثم المشاركة (المالك 2026-11-21) */
function stFormOv() { var v = {}; STO.forEach(function (k) { v[k[0]] = fv('o_' + k[0]) === '0' ? '0' : '1'; }); v.lbl = fv('lbl') === 'cost' ? 'cost' : 'due'; v.sv = fv('sv') === 'sum' ? 'sum' : 'full'; v.noteTxt = (fv('stNote') || '').trim(); v.termsTxt = (fv('stTerms') || '').trim(); return v; }
function stPrevCanvas(i, ym) { ST_OV = stFormOv(); try { return i.all ? stAllCanvas(ym, fv('sv') !== 'sum') : fv('sv') === 'sum' ? stmtCanvas(i, ym) : stmtDetailCanvas(i, ym); } finally { ST_OV = null; } }
function stSaveOpts(i) {
  var st = S.settings.stOpt = S.settings.stOpt || {}, tgt = fv('stAll') === '1' && !i.all ? '*' : i.id, v = stFormOv(); delete v.noteTxt; delete v.termsTxt; st[tgt] = v;
  if (tgt === '*' && st[i.id]) STO.concat([['lbl'], ['sv']]).forEach(function (k) { delete st[i.id][k[0]]; });
  S.settings.stNote = S.settings.stNote || {}; S.settings.stNote[i.id] = (fv('stNote') || '').trim(); S.settings.stTerms = (fv('stTerms') || '').trim();
}
/* الخيارات تُحفظ تلقائيًا مع كل تغيير وتبقى كما هي حتى يغيّرها المالك (المالك 2026-11-25: «خيارات الكشف تضل نفسها طالما أنا ما غيرتها»؛ فئة الخطأ: خيار يضيع إن لم يُضغط «حفظ» أو أُغلقت النافذة) */
function stAutoSave(i) { if (!fv('lbl')) return; var b = JSON.stringify([S.settings.stOpt, S.settings.stNote, S.settings.stTerms]); stSaveOpts(i); if (JSON.stringify([S.settings.stOpt, S.settings.stNote, S.settings.stTerms]) !== b) save(); }
/* شكل الكشف (مفصّل/مختصر) على شاشة الكشف نفسها: يبدأ من المحفوظ ويُحفظ عند تغييره */
function stSvInit(i) { var st = S.settings.stOpt = S.settings.stOpt || {}, sv = stOpt(i).sv; if (!fv('sv')) A.form.sv = sv; else if (fv('sv') !== sv) { st[i.id] = Object.assign(st[i.id] || {}, { sv: fv('sv') === 'sum' ? 'sum' : 'full' }); save(); } }
function stmtOptsSheet(sh) {
  var i = sh.id === '__all' ? ALLI : inst(sh.id); stAutoSave(i); var ym = sh.ym, full = fv('sv') !== 'sum', cv = stPrevCanvas(i, ym), url = cv.toDataURL('image/png'), nm = fnName(['كشف-حساب', i.name, ym, full ? 'مفصل' : ''], 'png'), ttl = 'كشف حساب ' + i.name;
  var fl = [fPhotoView(url, true, true), fSeg('sv', 'شكل الكشف', [['full', 'مفصّل بالمواد'], ['sum', 'مختصر']]), fSeg('lbl', 'عنوان المبلغ', [['due', 'المستحق'], ['cost', 'التكلفة']])];
  fl.push(fStateGrid(['ما يظهر في الكشف'].concat(STO.map(function (k) { return ['o_' + k[0], k[1]]; })), [['1', 'ظاهر'], ['0', 'مخفي']]));
  fl.push(fArea('stNote', 'ملاحظة تظهر في كشف هذه الجهة (اختياري)', 'مثال: يشمل طبخات الأسبوع الأول'));
  fl.push(fArea('stTerms', 'الشروط وبيانات الدفع (لكل الجهات)', 'مثال: الدفع خلال 15 يومًا · حساب البنك … · للاستفسار …'));
  if (!i.all) fl.push(fTri('stAll', 'تطبيق الخيارات على', [['0', 'هذه الجهة'], ['1', 'كل الجهات']]));
  var fail = function (er) { if (!/cancel|dismiss/i.test(String((er && er.message) || er))) say('تعذّر فتح المشاركة'); };
  return { title: 'معاينة كشف ' + i.name, sub: 'غيّر الخيارات فتتغير المعاينة، ثم شارك', fields: fl,
    acts: [X({ title: 'PDF', icon: 'i-doc', go: function () { deliverFile(nm.replace(/\.png$/, '.pdf'), u8b64(pdfFromCanvas(cv)), 'application/pdf', ttl, '').catch(fail); } }),
      X({ title: 'PDF للطباعة', icon: 'i-doc', go: function () { deliverFile(nm.replace(/\.png$/, '-للطباعة.pdf'), u8b64(pdfA4Pages(cv)), 'application/pdf', ttl, '').catch(fail); } }),
      X({ title: 'تنزيل صورة', icon: 'i-down', go: function () { saveFile(nm, url.split(',')[1], 'image/png', ttl).then(function (r) { say(savedMsg(r, 'الصورة')); }, function () { say('تعذّر حفظ الصورة'); }); } })],
    ft: { label: 'مشاركة', ok: true, go: function () { stSaveOpts(i); deliverFile(nm, url.split(',')[1], 'image/png', ttl, '').then(function () { S.settings.stmtSent = S.settings.stmtSent || {}; S.settings.stmtSent[stKey(i, ym)] = Date.now(); audit('إرسال كشف «' + i.name + '» ' + (ym === 'all' ? '' : monthLabel(ym))); mutated(''); }, fail); } },
    ft2: { label: 'رجوع', go: function () { stSaveOpts(i); setState({ sh: { t: i.all ? 'stAll' : 'stmt', id: i.id }, form: { m: ym }, q: '' }); mutated('حُفظت خيارات الكشف'); } } };
}
function stOptsOpen(i, ym, sv) { /* i = ALLI للكشف المجمّع */ var o = stOpt(i), f = { stNote: o.noteTxt, stTerms: o.termsTxt, stAll: '0', sv: sv || 'full', lbl: o.lbl === 'التكلفة' ? 'cost' : 'due' }; STO.forEach(function (k) { f['o_' + k[0]] = o[k[0]] ? '1' : '0'; }); openSh({ t: 'stOpts', id: i.id, ym: ym }, f); }
/* ---------- الكشف المجمّع لكل الجهات: صف لكل جهة بمبلغها والمجموع العام، ومشاركته من نافذة المعاينة نفسها ---------- */
function stAllMonths() { var o = {}; instsOf(false).concat(instsOf(true)).forEach(function (i) { stMonths(i).forEach(function (m) { o[m] = 1; }); }); return Object.keys(o).sort().reverse(); }
function stmtAllSheet(sh) {
  var ms = stAllMonths(); stSvInit(ALLI);
  if (!fv('m')) A.form.m = ms.filter(function (m) { return S.batches.some(function (b) { return !b.void && b.date.slice(0, 7) === m; }); })[0] || ms[0];
  var ym = fv('m'), o = stOpt(ALLI), zs = stAllInsts(ym), t = stAllAcct(zs), rows = [];
  zs.forEach(function (z) {
    var n = z.a.bs.length, pots = z.a.bs.reduce(function (s, b) { return s + (b.pots || 0); }, 0);
    rows.push(X({ icon: z.i.init ? 'i-heart' : 'i-truck', icTone: 'ext', title: z.i.name, sub: (z.i.occ ? z.i.occ + ' · ' : '') + (n ? pl(n, 'طبخة واحدة', 'طبختان', 'طبخات') + ' · ' + pl(pots, 'قدر واحد', 'قدران', 'قدور') : 'بلا طبخات'), tag: money(z.a.due), tagTone: z.a.due > 0 ? 'warn' : 'ok', chev: true, go: function () { openSh({ t: 'stmt', id: z.i.id }, { m: ym }); } }));
  });
  if (!zs.length) rows.push(X({ title: 'لا حركة لأي جهة في هذه الفترة', tag: money(0), tagTone: 'mute' }));
  rows.push(X({ total: true, title: o.lbl + ' (' + pl(zs.length, 'جهة واحدة', 'جهتان', 'جهات') + ')', tag: money(t.due), tagTone: t.due > 0 ? 'warn' : 'ok' }));
  return { title: 'كشف حساب كل الجهات', sub: stmtSub(ALLI, ym), fields: [fChips('m', 'الشهر', ms.map(function (m) { return [m, monthLabel(m)]; }).concat([['all', 'الكل']])), fSeg('sv', 'شكل الكشف عند المشاركة', [['full', 'مفصّل بالمواد'], ['sum', 'مختصر (جهة بسطر)']])],
    rows: rows, note: { text: 'يجمع كشوف الجهات في ورقة واحدة بأرقامها نفسها. اضغط جهة لفتح كشفها، أو شارك الكشف المجمّع.', tone: 'info' },
    ft: { label: 'مشاركة الكشف', ok: true, go: function () { stOptsOpen(ALLI, ym, fv('sv')); } },
    ft3: { label: 'PDF للطباعة', go: function () { stPrintPdf(ALLI, ym, fv('sv')); } },
    ft2: { label: 'خيارات الكشف', go: function () { stOptsOpen(ALLI, ym, fv('sv')); } } };
}
function stmtSheet(sh) {
  var i = inst(sh.id), ym = stCurM(i); stSvInit(i); var stActs = [X({ title: 'دفعة', icon: 'i-wallet', go: function () { A.stM = ym; openSh({ t: 'iniPay', id: i.id }, { fund: '', amt: '', note: '', rate: '' }); } }), X({ title: 'إضافة مبلغ', icon: 'i-plus', go: function () { A.stM = ym; openSh({ t: 'iniChg', id: i.id }, { amt: '', note: '', kind: '' }); } }), X({ title: 'طبخة جديدة', icon: 'i-pot', go: function () { startIniBatch(i.id); } })], a = stAcct(i, ym), sent = (S.settings.stmtSent || {})[stKey(i, ym)], late = stLate(i, ym, a);
  var ms = stMonths(i), rows = [];
  if (a.prev) rows.push(X({ title: 'الرصيد السابق', sub: 'قبل ' + (ym === 'all' ? '' : monthLabel(ym)), tag: money(a.prev), tagTone: a.prev > 0 ? 'warn' : 'ok' }));
  a.bs.forEach(function (b) {
    rows.push(X({ icon: 'i-pot', icTone: (b.fixTs || 0) > (sent || 0) && sent ? 'bad' : 'warn', title: batchName(b), sub: dlabel(b.date) + ' · ' + pl(b.pots || 0, 'قدر واحد', 'قدران', 'قدور') + (b.fixTs ? ' · عُدّلت' : ''),
      tag: batchCostTxt(b), tagTone: sent && (b.fixTs || 0) > sent ? 'bad' : 'mute', chev: true, go: function () { openSh({ t: 'bview', id: b.id }); }, lp: function () { batchQa(b); } }));
  });
  /* الطبخات المخططة لهذه الجهة: على الشاشة فقط (لي فقط)، بلا مبلغ ولا تدخل المستحق ولا الكشف المُصدَّر */
  var pls = plans().filter(function (p) { return p.inst === i.id && (ym === 'all' || (p.date || '').slice(0, 7) === ym); });
  pls.forEach(function (p) {
    rows.push(X({ icon: 'i-calendar', icTone: 'info', title: planName(p), sub: dlabel(p.date) + ' · ' + pl(p.pots || 0, 'قدر واحد', 'قدران', 'قدور'), tag: 'مخططة', tagTone: 'mute', chev: true, go: function () { openSh({ t: 'planView', id: p.id }); } }));
  });
  if (!a.bs.length && !pls.length) rows.push(X({ title: 'لا طبخات في هذا الشهر', tag: money(0), tagTone: 'mute' }));
  a.chg.forEach(function (c) { rows.push(X({ title: chgTitle(c), sub: c.date ? dlabel(c.date) : '', tag: money(c.amt), tagTone: 'mute', chev: true, go: function () { iniChgOpen(i, c); } })); });
  a.pay.forEach(function (c) { rows.push(X({ title: 'دفعة' + (c.note ? ': ' + c.note : ''), sub: c.date ? dlabel(c.date) : '', tag: '− ' + money(c.amt), tagTone: 'ok', chev: true, go: function () { iniPayOpen(i, c); } })); });
  rows.push(X({ total: true, title: stOpt(i).lbl, tag: money(a.due), tagTone: a.due > 0 ? 'warn' : 'ok' }));
  var nt = late ? { text: 'عُدّل ' + pl(late, 'طبخة واحدة', 'طبختان', 'طبخات') + ' بعد إرسال الكشف (' + dlabel(new Date(sent).toISOString().slice(0, 10)) + '): أرسل نسخة جديدة.', tone: 'warn' }
    : sent ? { text: 'أُرسل هذا الكشف في ' + dlabel(new Date(sent).toISOString().slice(0, 10)) + '.', tone: 'info' }
    : { text: 'قبل الإرسال: اضغط أي طبخة لتعديل أصنافها وكمياتها وأسعارها، ثم عاين الكشف وشاركه.', tone: 'info' };
  return { acts: stActs, title: 'كشف حساب ' + i.name, sub: stmtSub(i, ym), fields: [fChips('m', 'الشهر', ms.map(function (m) { return [m, monthLabel(m)]; }).concat([['all', 'الكل']])), fSeg('sv', 'شكل الكشف عند المشاركة', [['full', 'مفصّل بالمواد'], ['sum', 'مختصر']])],
    rows: rows, note: nt,
    ft: { label: 'مشاركة الكشف', ok: true, go: function () { stOptsOpen(i, ym, fv('sv')); } },
    ft2: { label: 'خيارات الكشف', go: function () { stOptsOpen(i, ym, fv('sv')); } },
    ft3: { label: 'PDF للطباعة', go: function () { stPrintPdf(i, ym, fv('sv')); } } };
}
/* PDF للطباعة (A4، تُقطع عند حدود الكتل) من نافذة الكشف مباشرة لكل جهة وللكشف المجمّع، بالخيارات المحفوظة */
function stPrintPdf(i, ym, sv) {
  var full = sv !== 'sum', cv = i.all ? stAllCanvas(ym, full) : full ? stmtDetailCanvas(i, ym) : stmtCanvas(i, ym), nm = fnName(['كشف-حساب', i.name, ym, full ? 'مفصل' : '', 'للطباعة'], 'pdf');
  deliverFile(nm, u8b64(pdfA4Pages(cv)), 'application/pdf', 'كشف حساب ' + i.name, '').catch(function (er) { if (!/cancel|dismiss/i.test(String((er && er.message) || er))) say('تعذّر فتح المشاركة'); });
}
function stmtCanvas(i, ym) {
  var o = stOpt(i), a = stAcct(i, ym), W = 840, PAD = 36, F = "'IBM Plex Sans Arabic', sans-serif", RH = 56, L = [], tail = stTail(i, o, W, PAD, F);
  if (a.prev) L.push(['الرصيد السابق', '', money(a.prev), 0]);
  a.bs.forEach(function (b) { L.push([batchName(b), dlabel(b.date) + ' · ' + pl(b.pots || 0, 'قدر واحد', 'قدران', 'قدور'), batchCostTxt(b), 0]); });
  a.chg.forEach(function (c) { L.push([chgTitle(c), c.date ? dlabel(c.date) : '', money(c.amt), 0]); });
  a.pay.forEach(function (c) { L.push(['دفعة' + (c.note ? ': ' + c.note : ''), c.date ? dlabel(c.date) : '', '− ' + money(c.amt), 1]); });
  var hdr = stHeadH(o), H = hdr + 30 + L.length * RH + 140 + tail.h + (tail.h ? 34 : 0), c = document.createElement('canvas'); c.width = W; c.height = H;
  var x = c.getContext('2d'); x.direction = 'rtl'; x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, W, H); stHead(x, W, PAD, F, i, ym, o, '');
  var y = hdr + 30;
  L.forEach(function (r, k) {
    if (k % 2 === 0) { x.fillStyle = '#F4F6F2'; x.fillRect(0, y, W, RH); }
    x.fillStyle = '#1B2421'; x.textAlign = 'right'; x.font = '700 27px ' + F; x.fillText(r[0], W - PAD, y + 36);
    x.textAlign = 'center'; x.fillStyle = '#5B6660'; x.font = '500 22px ' + F; x.fillText(r[1], W * 0.5, y + 36);
    x.textAlign = 'left'; x.fillStyle = r[3] ? '#14563A' : '#1B2421'; x.font = '700 27px ' + F; x.fillText(r[2], PAD, y + 36); y += RH;
  });
  y += 20; x.fillStyle = '#14563A'; x.fillRect(PAD, y, W - 2 * PAD, 64);
  x.fillStyle = '#FFFFFF'; x.textAlign = 'right'; x.font = '700 30px ' + F; x.fillText(stOpt(i).lbl, W - PAD - 20, y + 42); x.textAlign = 'left'; x.fillText(money(a.due), PAD + 20, y + 42);
  y += 64 + 24; y = tail.draw(x, y);
  x.fillStyle = '#8A948E'; x.textAlign = 'center'; x.font = '500 20px ' + F; x.fillText('مطبخ عهد', W / 2, H - 22);
  return c;
}
function shareStmt(i, ym, mode) { var full = mode !== 'sum'; imgPreview(function () { return full ? stmtDetailCanvas(i, ym) : stmtCanvas(i, ym); }, fnName(['كشف-حساب', i.name, ym, full ? 'مفصل' : ''], 'png'), 'كشف حساب ' + i.name, '', full); }

/* ---------- نوافذ التعديل ---------- */
function fixSheet(sh) {
  var f = A.fix, b;
  switch (sh.t) {
    case 'stmt': return stmtSheet(sh);
    case 'stAll': return stmtAllSheet(sh);
    case 'stOpts': return stmtOptsSheet(sh);
    case 'bfix': {
      b = E.by(S.batches, sh.id); if (!f || f.id !== sh.id) { fixOpen(b); f = A.fix; }
      var free = fixFree(b), rows = [], facts = [X({ title: 'اسم الطبخة', icon: 'i-pencil', go: function () { openSh({ t: 'bfn' }, { dn: f.dish || batchName(b) }); } }), X({ title: pl(f.pots, 'قدر واحد', 'قدران', 'قدور'), icon: 'i-pot', go: function () { openSh({ t: 'bfp' }, { n: String(f.pots || '') }); } }), X({ title: 'إضافة صنف', icon: 'i-plus', go: function () { openSh({ t: 'bfadd' }); } })];
      spiceLast(f.lines.map(function (l, k) { return { l: l, k: k, item: l.item }; })).forEach(function (o) {
        var l = o.l, k = o.k, it = item(l.item), bad = !(l.qty > 0);
        rows.push(X({ title: it.name, sub: qtyU(l.qty, it.unit) + (free ? '' : ' × ' + money(l.price || 0)), tag: free ? '' : money(r2((l.qty || 0) * (l.price || 0))), tagTone: bad ? 'bad' : 'mute', chev: true, go: function () { openSh({ t: 'bfl', k: k }, { qty: String(l.qty || ''), price: String(l.price == null ? '' : l.price) }); } }));
      });
      return { acts: facts, title: 'تعديل «' + batchName(b) + '»', sub: dlabel(b.date) + (free ? ' · عيني' : ' · التكلفة ' + money(fixCost(f, b))), rows: rows,
        note: { text: 'لا يتغير شيء قبل «حفظ التعديلات». التعديل يضيف حركات فرق للمخزن ولا يمسّ السجل القديم' + (free ? '.' : '، والسعر هنا لهذه الطبخة فقط ولا يغيّر سعر الصنف.'), tone: 'info' },
        ft: { label: 'حفظ التعديلات', ok: f.lines.some(function (l) { return l.qty > 0; }), go: fixSave }, ft2: { label: 'إلغاء', go: function () { A.fix = null; openSh({ t: 'bview', id: b.id }); } } };
    }
    /* أسعار مواد طبخة قيد التجهيز/مخططة: كل صنف بكميته وسعره ومبلغه مرتبة بالأعلى، وتعديل سعر الصنف قبل البدء */
    case 'dprices': {
      var dd = A.draft, dl = dd ? dLines().filter(function (l) { return l.actual > 0; }) : [], dpi = dd ? priceInfo(dd, dl) : null;
      if (!dd) return null;
      var amt = function (l) { return dd.kind === 'private' ? Object.keys(l.src).filter(paidSrc).reduce(function (x, k) { return x + l.src[k]; }, 0) * l.price : l.actual * l.price; };
      var drows = dl.map(function (l) { return { l: l, a: r2(amt(l)) }; }).sort(function (x, y) { return y.a - x.a; }).map(function (o) {
        var l = o.l, np = !(l.price > 0);
        return X({ title: l.name, sub: qtyU(l.actual, l.unit) + ' × ' + (np ? 'بلا سعر' : money(l.price)), tag: np ? 'بلا سعر' : money(o.a), tagTone: np ? 'bad' : 'mute', chev: true, go: function () { openSh({ t: 'dpr', id: l.id }, { price: l.price > 0 ? String(l.price) : '' }); } });
      });
      drows.push(X({ total: true, title: 'الإجمالي', end: money(dpi.mat) }));
      return { title: 'أسعار المواد', sub: (dd.dish || (rec(dd.rec) || {}).name || 'الطبخة') + ' · مرتبة بالمبلغ الأعلى', rows: drows,
        note: { text: 'اضغط على صنف لتعديل سعره. السعر هو «آخر سعر للوحدة» للصنف نفسه، فيسري على كل الطبخات المخططة والجديدة ولا يغيّر الطبخات المسجّلة سابقًا.', tone: 'info' }, ft: { label: 'تم', ok: true, go: function () { shut(); } } };
    }
    case 'dpr': {
      var pit = item(sh.id), pq = (dLines().filter(function (l) { return l.id === sh.id; })[0] || {}).actual || 0, pp2 = num('price');
      return { title: pit.name, sub: 'السعر لكل ' + pit.unit, fields: [fText('price', 'السعر لكل ' + pit.unit + ' (شيكل)', '0', 'decimal', 'يغيّر سعر الصنف نفسه في كل المخازن')],
        note: pq > 0 && fv('price') !== '' ? { text: qtyU(pq, pit.unit) + ' × ' + money(pp2) + ' = ' + money(r2(pq * pp2)), tone: 'info' } : undefined,
        ft: { label: 'حفظ السعر', ok: fv('price') !== '' && pp2 >= 0, go: function () { var was = pit.price || 0; pit.price = pp2; audit('تعديل سعر «' + pit.name + '»: ' + money(was) + ' ← ' + money(pp2)); openSh({ t: 'dprices' }, {}); mutated('حُدّث سعر «' + pit.name + '»'); } } };
    }
    case 'bfn': return { title: 'اسم الطبخة', sub: 'للطبخة هذه فقط، كـ«مجدرة بالذرة». الوصفة نفسها لا تتغير', fields: [fText('dn', 'الاسم', (rec(E.by(S.batches, f.id).recipe) || {}).name || '', 'text')],
      ft: { label: 'تطبيق', ok: !!(fv('dn') || '').trim(), go: function () { f.dish = fv('dn').trim(); openSh({ t: 'bfix', id: f.id }); } } };
    case 'bfp': return { title: 'عدد القدور', sub: 'اكتب العدد مباشرة', fields: [fText('n', 'عدد القدور', '0', 'decimal')],
      ft: { label: 'تطبيق', ok: num('n') > 0, go: function () { f.pots = num('n'); openSh({ t: 'bfix', id: f.id }); } } };
    case 'bfadd': return pickOr(itemList(E.by(S.batches, f.id).order[0]), { title: 'إضافة صنف', sub: 'اختر الصنف أو أضف صنفًا جديدًا', plural: 'الأصناف', addLabel: 'إضافة صنف جديد', sel: '',
      onPick: function (id) { var it = item(id); f.lines.push({ item: id, qty: 0, price: it.price || 0 }); var k = f.lines.length - 1; openSh({ t: 'bfl', k: k, isNew: true }, { qty: '', price: String(it.price || 0) }); },
      onAdd: function (name) { openSh({ t: 'addItem', then: 'bfadd' }, { name: name, unit: 'كيلو', price: '' }); } });
    case 'bfl': {
      b = E.by(S.batches, f.id); var l = f.lines[sh.k], it = item(l.item), free = fixFree(b), q = num('qty'), p = num('price');
      return { title: it.name, sub: 'الوحدة: ' + it.unit, fields: [fText('qty', 'الكمية (' + it.unit + ')', '0', 'decimal')].concat(free ? [] : [fText('price', 'السعر لكل ' + it.unit + ' (شيكل)', '0', 'decimal', 'لهذه الطبخة فقط')]),
        note: free ? undefined : { text: 'التكلفة: ' + money(r2(q * p)), tone: 'info' },
        ft: { label: 'تطبيق', ok: q > 0 && (free || fv('price') !== ''), go: function () { l.qty = q; if (!free) l.price = p; openSh({ t: 'bfix', id: f.id }); } },
        ft2: { label: 'حذف السطر', go: function () { f.lines.splice(sh.k, 1); openSh({ t: 'bfix', id: f.id }); } } };
    }
  }
  return null;
}

/* ===== 02u2-stmtdet.js ===== */
/* ---------- كشف حساب الجهة المفصّل بالمواد ----------
   لكل يوم: الطبخات وعدد قدورها، ثم المواد التي دخلت كل طبخة (الكمية، سعر الوحدة، التكلفة)، وإجمالي الطبخة وإجمالي اليوم،
   كله في كشف واحد. الطبخة بسعر مقطوع للقدر تُعرض موادها بكمياتها وتحتها «عدد القدور × السعر». الطبخة العينية بلا أسعار.
   الشاشة والصورة وملف PDF من الرسم نفسه، ومجموع الكشف يطابق «المستحق» في الكشف المختصر. */
function stDayGroups(a) {
  var g = [], by = {};
  a.bs.forEach(function (b) { if (!by[b.date]) { by[b.date] = { date: b.date, bs: [] }; g.push(by[b.date]); } by[b.date].bs.push(b); });
  return g;
}
function stBatchBlock(b, o) {
  var free = b.kind === 'external' && E.isFree(led(b.order[0])), lump = b.pm === 'lump', rows = [];
  spiceLast(b.lines || []).forEach(function (ln) {
    var li = item(ln.item) || { name: '؟', unit: '' }, c = ln.cost != null ? ln.cost : r2((ln.qty || 0) * (ln.price || 0)), eff = ln.qty > 0 ? r2(c / ln.qty) : 0;
    rows.push({ n: li.name, q: qtyU(ln.qty, li.unit), p: free || lump || !o.unit ? '' : c > 0 ? money(eff) + ' / ' + li.unit : 'عيني', c: free || lump ? '' : c > 0 ? money(c) : '—' });
  });
  var extra = [];
  if (!lump) (b.xl || []).forEach(function (x) { var nm = x.k || x.name || x.note || 'رسوم إضافية'; if (!o.labor && /عمال|عمالة/.test(nm)) return; extra.push({ n: nm, d: x.k && x.note ? x.note : '', c: money(x.amt || 0) }); });
  var foot = lump && o.labor ? pl(b.pots || 0, 'قدر واحد', '2 قدر', 'قدور') + ' × ' + money(b.lump || 0) + ' / قدر' : '';
  var mat = r2((b.lines || []).reduce(function (t, ln) { return t + (ln.cost || 0); }, 0));
  return { name: batchName(b), pots: pl(b.pots || 0, 'قدر واحد', '2 قدر', 'قدور'), total: batchCostTxt(b), rows: o.lines ? rows : [], extra: extra, foot: foot, free: free, lump: lump, mat: mat, subt: o.subt && !lump && !free && mat > 0 && extra.length ? money(mat) : '' }; /* بلا بنود إضافية يطابق مجموع المواد إجمالي الطبخة فلا يُكرَّر رقمه */
}
/* ثوابت الأعمدة: عنوان واحد للجدول وأرقام محاذاة عموديًا (الكمية يمينًا عند QX، السعر عند PX، التكلفة يسارًا) */
var ST_BRK = [], ST_QX = 560, ST_PX = 380;
/* أسطر جسم كشف جهة واحدة (الرصيد السابق، الأيام والطبخات، الإضافات، الدفعات): يستعملها الكشف الفردي والمجمّع معًا */
/* المبلغ يظهر مرة واحدة في تسلسل (جهة ← يوم ← طبخة ← عمالة): لا رقم يليه الرقم نفسه (المالك 2026-11-22: 2,061 تحتها 2,061 غير مريح للعميل)؛ `hideDay` = يوم الجهة الوحيد يطابق شريطها */
function stBodyRows(a, o, L, hideDay) {
  var groups = stDayGroups(a), anyRows = false;
  var blocks = groups.map(function (g) { return { g: g, bl: g.bs.map(function (b) { var B = stBatchBlock(b, o); if (B.rows.length) anyRows = true; return B; }) }; });
  if (a.prev) L.push({ k: 'row', a: 'الرصيد السابق', d: '', c: money(a.prev), h: 56 });
  blocks.forEach(function (gb) {
    var g = gb.g, dayTot = r2(g.bs.reduce(function (t, b) { return t + (b.cost || 0); }, 0)), pots = g.bs.reduce(function (t, b) { return t + (b.pots || 0); }, 0);
    L.push({ k: 'day', a: dlong(g.date), d: pl(pots, 'قدر واحد', '2 قدر', 'قدور'), c: hideDay && groups.length === 1 ? '' : money(dayTot), h: 58 });
    gb.bl.forEach(function (B) {
      L.push({ k: 'bat', a: B.name, d: B.pots, c: g.bs.length > 1 ? B.total : '', h: 50 });
      B.rows.forEach(function (r) { L.push({ k: 'ln', r: r, lump: B.lump, free: B.free, h: 44 }); });
      if (B.subt) L.push({ k: 'sb', a: 'مجموع المواد', c: B.subt, h: 44 });
      B.extra.forEach(function (x) { L.push({ k: 'ex', a: x.n, d: x.d, c: x.c, h: 44 }); });
      if (B.foot) L.push({ k: 'ft', a: 'العمالة', d: B.foot, c: '', h: 44 });
      L.push({ k: 'gap', h: 10 });
    });
  });
  if (!groups.length) L.push({ k: 'row', a: 'لا طبخات في هذه الفترة', d: '', c: money(0), h: 56 });
  a.chg.forEach(function (c) { L.push({ k: 'row', a: chgTitle(c), d: c.date ? dlabel(c.date) : '', c: money(c.amt), h: 56 }); });
  a.pay.forEach(function (c) { L.push({ k: 'row', a: 'دفعة' + (c.note ? ': ' + c.note : ''), d: c.date ? dlabel(c.date) : '', c: '− ' + money(c.amt), ok: 1, h: 56 }); });
  return anyRows;
}
/* رسم أسطر L على اللوحة من y وإرجاع y بعدها (مشترك بين الكشف الفردي والمجمّع) */
function stDrawL(x, W, PAD, F, L, y) {
  var prevK = '', brk = []; ST_BRK = brk; /* بدايات الكتل لقطع صفحات الطباعة: جهة/يوم، وتفصيل طبخة؛ لا قطع بين عنوان اليوم وأول طبخته */
  var fit = function (t, mw) { t = String(t); if (x.measureText(t).width <= mw) return t; while (t.length > 1 && x.measureText(t + '…').width > mw) t = t.slice(0, -1); return t + '…'; };
  L.forEach(function (r) {
    var cy = y + r.h / 2 + 9;
    if ((r.k === 'inst' || r.k === 'day' || r.k === 'bat') && prevK && prevK !== 'inst' && prevK !== 'day') brk.push(y); prevK = r.k;
    if (r.k === 'inst') { x.fillStyle = '#14563A'; x.fillRect(0, y, W, r.h); x.fillStyle = '#FFFFFF'; x.textAlign = 'right'; x.font = '700 30px ' + F; x.fillText(fit(r.a, 360), W - PAD, y + 41); x.textAlign = 'center'; x.globalAlpha = .85; x.font = '500 21px ' + F; x.fillText(r.d, W * 0.31, y + 41); x.globalAlpha = 1; x.textAlign = 'left'; x.font = '700 30px ' + F; x.fillText(r.c, PAD, y + 41); }
    else if (r.k === 'isum') { x.fillStyle = '#F7F1E4'; x.fillRect(0, y, W, r.h); x.fillStyle = '#1B2421'; x.textAlign = 'right'; x.font = '600 24px ' + F; x.fillText(r.a, W - PAD, y + 34); x.textAlign = 'left'; x.font = '700 26px ' + F; x.fillText(r.c, PAD, y + 34); }
    else if (r.k === 'sum') { x.fillStyle = '#F4F6F2'; x.fillRect(PAD, y, W - 2 * PAD, r.h - 10); x.fillStyle = '#5B6660'; x.textAlign = 'right'; x.font = '500 21px ' + F; x.fillText(r.lbl, W - PAD - 18, y + 30); x.fillStyle = '#14563A'; x.font = '700 34px ' + F; x.fillText(r.due, W - PAD - 18, y + 68); x.textAlign = 'left'; x.fillStyle = '#3E4843'; x.font = '500 22px ' + F; x.fillText(r.n + ' · ' + r.p, PAD + 18, y + 50); }
    else if (r.k === 'day') { x.fillStyle = '#E6F0EA'; x.fillRect(0, y, W, r.h); x.fillStyle = '#14563A'; x.textAlign = 'right'; x.font = '700 28px ' + F; x.fillText(r.a, W - PAD, cy); x.textAlign = 'center'; x.font = '500 22px ' + F; x.fillText(r.d, W * 0.5, cy); x.textAlign = 'left'; x.font = '700 28px ' + F; x.fillText(r.c, PAD, cy); }
    else if (r.k === 'bat') { x.fillStyle = '#1B2421'; x.textAlign = 'right'; x.font = '700 27px ' + F; x.fillText(fit(r.a, 430), W - PAD, cy); x.textAlign = 'center'; x.fillStyle = '#5B6660'; x.font = '500 22px ' + F; x.fillText(r.d, W * 0.52, cy); x.textAlign = 'left'; x.fillStyle = '#1B2421'; x.font = '700 27px ' + F; x.fillText(r.c, PAD, cy); }
    else if (r.k === 'th') { x.fillStyle = '#8A948E'; x.font = '500 19px ' + F; x.textAlign = 'right'; x.fillText('الصنف', W - PAD - 16, y + 24); x.fillText('الكمية', ST_QX, y + 24); if (r.unit) x.fillText('سعر الوحدة', ST_PX, y + 24); x.textAlign = 'left'; x.fillText('التكلفة', PAD, y + 24); x.fillStyle = '#E3E8E4'; x.fillRect(PAD, y + r.h - 3, W - 2 * PAD, 1); }
    else if (r.k === 'ln') { x.fillStyle = '#1B2421'; x.textAlign = 'right'; x.font = '500 24px ' + F; x.fillText(fit(r.r.n, 215), W - PAD - 16, cy - 2); x.fillStyle = '#5B6660'; x.font = '500 22px ' + F; x.fillText(r.r.q, ST_QX, cy - 2); if (r.r.p) { x.font = '500 20px ' + F; x.fillText(r.r.p, ST_PX, cy - 2); } if (r.r.c) { x.textAlign = 'left'; x.fillStyle = '#1B2421'; x.font = '500 24px ' + F; x.fillText(r.r.c, PAD, cy - 2); } }
    else if (r.k === 'sb') { x.fillStyle = '#F7F1E4'; x.fillRect(PAD, y + 2, W - 2 * PAD, r.h - 4); x.fillStyle = '#3E4843'; x.textAlign = 'right'; x.font = '600 23px ' + F; x.fillText(r.a, W - PAD - 16, cy - 2); x.textAlign = 'left'; x.font = '700 24px ' + F; x.fillStyle = '#1B2421'; x.fillText(r.c, PAD + 12, cy - 2); }
    else if (r.k === 'ex' || r.k === 'ft') { x.fillStyle = '#5B6660'; x.textAlign = 'right'; x.font = '500 23px ' + F; x.fillText(fit(r.a, r.d ? 200 : 360), W - PAD - 16, cy - 2); if (r.d) { x.textAlign = 'right'; x.fillText(r.d, ST_QX, cy - 2); } x.textAlign = 'left'; x.fillStyle = '#1B2421'; x.font = '700 24px ' + F; x.fillText(r.c, PAD, cy - 2); }
    else if (r.k === 'row') { x.fillStyle = '#F4F6F2'; x.fillRect(0, y, W, r.h); x.fillStyle = '#1B2421'; x.textAlign = 'right'; x.font = '700 26px ' + F; x.fillText(fit(r.a, 430), W - PAD, cy); x.textAlign = 'center'; x.fillStyle = '#5B6660'; x.font = '500 21px ' + F; x.fillText(r.d, W * 0.52, cy); x.textAlign = 'left'; x.fillStyle = r.ok ? '#14563A' : '#1B2421'; x.font = '700 26px ' + F; x.fillText(r.c, PAD, cy); }
    y += r.h;
  });
  return y;
}
function stmtDetailCanvas(i, ym) {
  var o = stOpt(i), a = stAcct(i, ym), W = 840, PAD = 36, F = "'IBM Plex Sans Arabic', sans-serif", L = [], tail = stTail(i, o, W, PAD, F);
  var nPots = a.bs.reduce(function (t, b) { return t + (b.pots || 0); }, 0), body = [], anyRows = stBodyRows(a, o, body);
  if (o.sum) L.push({ k: 'sum', h: 96, lbl: o.lbl, n: pl(a.bs.length, 'طبخة واحدة', '2 طبخة', 'طبخات'), p: pl(nPots, 'قدر واحد', '2 قدر', 'قدور'), due: money(a.due) });
  if (anyRows) L.push({ k: 'th', unit: o.unit, h: 34 });
  L = L.concat(body);
  return stFinishCanvas(i, ym, o, a, L, tail, ' · مفصّل بالمواد');
}
/* الخاتمة المشتركة: ملخص الأجزاء + شريط المستحق/التكلفة + الذيل، ثم الرسم */
function stFinishCanvas(i, ym, o, a, L, tail, sub2) {
  var W = 840, PAD = 36, F = "'IBM Plex Sans Arabic', sans-serif";
  var sum = [['الرصيد السابق', a.prev], ['الطبخات', a.cost], ['إضافات', a.ch], ['دفعات', -a.pd]].filter(function (s) { return s[1]; });
  if (sum.length === 1 && sum[0][0] === 'الطبخات') sum = []; /* لا يتكرر المجموع نفسه مرتين */
  var hdr = stHeadH(o), H = hdr + 24 + L.reduce(function (t, r) { return t + r.h; }, 0) + 30 + 64 + sum.length * 46 + 140 + tail.h + (tail.h ? 34 : 0);
  var c = document.createElement('canvas'); c.width = W; c.height = H;
  var x = c.getContext('2d'); x.direction = 'rtl'; x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, W, H); stHead(x, W, PAD, F, i, ym, o, sub2);
  var y = stDrawL(x, W, PAD, F, L, hdr + 24);
  c.brk = ST_BRK.concat([y]); /* ملخص الكشف كتلة واحدة لا تُقطع */
  /* ملخص الكشف: لوحة مظلّلة بعرض الصفحة وخط علوي أخضر وعنوان، فيُقرأ أنه يمثّل الكشف كله لا ذيلًا لآخر بند فوقه (المالك 2026-11-22) */
  y += 18; var pTop = y, pH = 44 + sum.length * 46 + 14 + 64 + 22; x.fillStyle = '#EAF1EC'; x.fillRect(0, pTop, W, pH); x.fillStyle = '#14563A'; x.fillRect(0, pTop, W, 4);
  x.fillStyle = '#14563A'; x.textAlign = 'right'; x.font = '700 23px ' + F; x.fillText('ملخص الكشف', W - PAD, pTop + 34); y = pTop + 44;
  y += 4; sum.forEach(function (s) { x.fillStyle = '#5B6660'; x.textAlign = 'right'; x.font = '500 25px ' + F; x.fillText(s[0], W - PAD, y + 32); x.textAlign = 'left'; x.fillStyle = '#1B2421'; x.font = '700 25px ' + F; x.fillText((s[1] < 0 ? '− ' : '') + money(Math.abs(s[1])), PAD, y + 32); y += 46; });
  y += 14; x.fillStyle = '#14563A'; x.fillRect(PAD, y, W - 2 * PAD, 64);
  x.fillStyle = '#FFFFFF'; x.textAlign = 'right'; x.font = '700 30px ' + F; x.fillText(o.lbl, W - PAD - 20, y + 42); x.textAlign = 'left'; x.fillText(money(a.due), PAD + 20, y + 42);
  y = pTop + pH + 24; y = tail.draw(x, y);
  x.fillStyle = '#8A948E'; x.textAlign = 'center'; x.font = '500 20px ' + F; x.fillText('مطبخ عهد', W / 2, H - 22);
  return c;
}
/* ---------- الكشف المجمّع لكل الجهات (المالك 2026-11-22) ----------
   جهة واحدة لكل شريط: اسمها وطبخاتها وقدورها ومبلغها، ثم (مفصّلًا) أيامها وطبخاتها كالكشف الفردي؛ وفي الآخر المجموع العام.
   الخيارات هي نفسها خيارات الكشف الفردي (تُحفظ تحت `__all`) والأرقام من `stAcct` لكل جهة فتطابق كشوفها. */
var ALLI = { id: '__all', name: 'كل الجهات', occ: '', all: true };
function stAllInsts(ym) {
  return instsOf(false).concat(instsOf(true)).map(function (i) { return { i: i, a: stAcct(i, ym) }; }).filter(function (z) { return z.a.bs.length || z.a.chg.length || z.a.pay.length || z.a.prev; });
}
function stAllAcct(zs) {
  var t = { prev: 0, bs: [], chg: [], pay: [], cost: 0, ch: 0, pd: 0, due: 0 };
  zs.forEach(function (z) { t.prev += z.a.prev; t.cost += z.a.cost; t.ch += z.a.ch; t.pd += z.a.pd; t.due += z.a.due; t.bs = t.bs.concat(z.a.bs); });
  Object.keys(t).forEach(function (k) { if (typeof t[k] === 'number') t[k] = r2(t[k]); }); return t;
}
function stAllCanvas(ym, full) {
  var i = ALLI, o = stOpt(i), zs = stAllInsts(ym), t = stAllAcct(zs), W = 840, PAD = 36, F = "'IBM Plex Sans Arabic', sans-serif", L = [], tail = stTail(i, o, W, PAD, F);
  var nPots = t.bs.reduce(function (s, b) { return s + (b.pots || 0); }, 0), any = false, parts = [];
  zs.forEach(function (z) { var one = z.a.bs.length && !z.a.prev && !z.a.chg.length && !z.a.pay.length, body = [], ar = stBodyRows(z.a, o, body, one), pots = z.a.bs.reduce(function (s, b) { return s + (b.pots || 0); }, 0); if (ar) any = true; parts.push({ z: z, body: body, pots: pots }); });
  if (o.sum) L.push({ k: 'sum', h: 96, lbl: o.lbl, n: pl(zs.length, 'جهة واحدة', '2 جهة', 'جهات') + ' · ' + pl(t.bs.length, 'طبخة واحدة', '2 طبخة', 'طبخات'), p: pl(nPots, 'قدر واحد', '2 قدر', 'قدور'), due: money(t.due) });
  if (full && any) L.push({ k: 'th', unit: o.unit, h: 34 });
  parts.forEach(function (p) {
    var z = p.z, tx = [z.a.bs.length ? pl(z.a.bs.length, 'طبخة واحدة', '2 طبخة', 'طبخات') : '', p.pots ? pl(p.pots, 'قدر واحد', '2 قدر', 'قدور') : ''].filter(Boolean).join(' · ');
    L.push({ k: full ? 'inst' : 'row', a: z.i.name + (z.i.occ ? ' · ' + z.i.occ : ''), d: tx, c: money(z.a.due), h: full ? 64 : 62 }); /* المفصّل: شريط جهة داكن يفصل أقسامها؛ المختصر: صفوف خفيفة كالكشف المختصر */
    if (full) { L = L.concat(p.body); if (z.a.prev || z.a.ch || z.a.pd) L.push({ k: 'isum', a: o.lbl + ' ' + z.i.name, c: money(z.a.due), h: 46 }); L.push({ k: 'gap', h: 14 }); }
  });
  if (!zs.length) L.push({ k: 'row', a: 'لا حركة لأي جهة في هذه الفترة', d: '', c: money(0), h: 56 });
  return stFinishCanvas(i, ym, o, t, L, tail, full ? ' · مفصّل بالمواد' : '');
}

/* كشف الحساب الخارجي بلا تقريب للمبالغ (1,624.50 لا 1,625): مجموع الأسطر الظاهرة = المجموع المعروض */
var _stmtC = stmtCanvas, _stmtD = stmtDetailCanvas;
stmtCanvas = function (i, ym) { MONEY_EXACT = true; try { return _stmtC(i, ym); } finally { MONEY_EXACT = false; } };
stmtDetailCanvas = function (i, ym) { MONEY_EXACT = true; try { return _stmtD(i, ym); } finally { MONEY_EXACT = false; } };
var _stmtA = stAllCanvas;
stAllCanvas = function (ym, full) { MONEY_EXACT = true; try { return _stmtA(ym, full); } finally { MONEY_EXACT = false; } };

/* ===== 02w-fin.js ===== */
/* ---------- المالية: تصنيف الحركات، الملخص الشهري، تعديل الحركة، جرد الصندوق، المستحقات ---------- */
var CATS_OUT = [['pay', 'رواتب وعمال'], ['buy', 'مشتريات مواد'], ['move', 'نقل وكارة'], ['rent', 'إيجار وصيانة'], ['misc', 'متفرقات']];
var CATS_IN = [['sales', 'مبيعات'], ['inst', 'من مؤسسة'], ['oth', 'وارد آخر']];
var CAT_SYS = [['xfer', 'تحويل بين الأرصدة'], ['adj', 'تسوية جرد'], ['kb', 'شراء العمال للمطبخ']];
function catName(k) { var a = CATS_OUT.concat(CATS_IN, CAT_SYS).filter(function (c) { return c[0] === k; })[0]; return a ? a[1] : 'متفرقات'; }
function noteKey(t) { return norm(String(t || '').replace(/\s+/g, ' ').trim()); }
/* التصنيف: ما اخترته، ثم قاعدة البيان، ثم تخمين من الكلمات (بلا تعديل للحركات القديمة) */
function catOf(m) {
  if (m.cat) return m.cat; if (m.x) return 'xfer'; if (m.adj) return 'adj';
  var rl = (S.settings.catRules || {})[noteKey(m.note)]; if (rl) return rl;
  var n = String(m.note || '');
  if (m.dir === 'in') return /مبيعات|مبيع/.test(n) ? 'sales' : m.ini ? 'inst' : 'oth';
  if (m.w || /راتب|سلفة|يومية|حساب أسبوع عامل/.test(n) || (S.workers || []).some(function (w) { return w.name && n.indexOf(w.name) >= 0; })) return 'pay';
  if (/كارة|نقل|تكتك|توصيل|محروقات|بنزين/.test(n)) return 'move';
  if (/ايجار|إيجار|اجار|صيانة/.test(n)) return 'rent';
  if (/بهارات|ملح|زيت|دكان|سكر|خبز|بقدونس|لحمة|كبدة|حمص|رز|عدس|مية|سائل|جلي|كياس|نفايات|قصدير|مكنسة|زبدية|فئران|غاز/.test(n)) return 'buy';
  return 'misc';
}
function ilsOf(m) { return m.cur === 'ils' ? m.amt : (m.ils > 0 ? m.ils : 0); }
/* دولار مدفوع قيمته بالشيكل محسوبة في مجموع الشيكل: يُعرض «منه $X» لئلا يختفي الدولار (جولة المفتّش 2026-11-23) */
function usdIn(m) { return m.cur === 'usd' && m.ils > 0 ? m.amt : 0; }
function uTxt(u, ux) { return (ux ? 'منه ' + usdTxt(ux) : '') + (ux && u ? ' + ' : '') + (u ? usdTxt(u) : ''); }
function usdOnly(m) { return m.cur === 'usd' && !(m.ils > 0) ? m.amt : 0; }
function moveDate() { return dateNear(fv('dtxt')) || today(); }
function dayFields() { if (!fv('dtxt')) A.form.dtxt = today(); return [fDate('dtxt', 'التاريخ', '', today())]; }
function dayOk() { var d = dateNear(fv('dtxt')); return !!d && d <= today(); }

/* ---------- الملخص الشهري ---------- */
function finMonths() { var o = {}; o[today().slice(0, 7)] = 1; fmOn().forEach(function (m) { o[m.date.slice(0, 7)] = 1; }); return Object.keys(o).sort().reverse(); }
function finData(ym) {
  var ms = fmOn().filter(function (m) { return ym === 'all' || m.date.slice(0, 7) === ym; }), cats = {}, parties = {}, T = { inI: 0, outI: 0, inU: 0, outU: 0, inX: 0, outX: 0, adjI: 0, xI: 0, nI: 0, nU: 0 };
  ms.forEach(function (m) {
    var c = catOf(m), i = ilsOf(m), u = usdOnly(m);
    if (c === 'xfer') { var sx = m.dir === 'in' ? 1 : -1; if (m.cur === 'ils') T.nI = r2(T.nI + sx * m.amt); else T.nU = r2(T.nU + sx * m.amt); return; }
    var k = (m.dir === 'in' ? 'i_' : 'o_') + c; cats[k] = cats[k] || { c: c, dir: m.dir, n: 0, ils: 0, usd: 0 }; cats[k].n++; cats[k].ils = r2(cats[k].ils + i); cats[k].usd = r2(cats[k].usd + u);
    if (c !== 'adj') { var sg = m.dir === 'in' ? 1 : -1; if (m.cur === 'ils') T.nI = r2(T.nI + sg * m.amt); else T.nU = r2(T.nU + sg * m.amt); }
    if (c === 'adj') { T.adjI = r2(T.adjI + (m.dir === 'in' ? i : -i)); return; }
    if (m.dir === 'in') { T.inI = r2(T.inI + i); T.inU = r2(T.inU + u); T.inX = r2(T.inX + usdIn(m)); } else { T.outI = r2(T.outI + i); T.outU = r2(T.outU + u); T.outX = r2(T.outX + usdIn(m));
      var pk = String(m.note || 'بلا بيان').replace(/\s+/g, ' ').split(' — ')[0].trim(); parties[pk] = parties[pk] || { n: 0, ils: 0, usd: 0 }; parties[pk].n++; parties[pk].ils = r2(parties[pk].ils + i); parties[pk].usd = r2(parties[pk].usd + u); }
  });
  /* شراء العمال للمطبخ من مالهم: يظهر بنده في الصرف بقدر ما دُفع فعلًا لهم، ويُقتطع من «رواتب وعمال» فلا يتضاعف ولا يمسّ المجموع ولا الأرصدة */
  var kb = r2(wlOn().filter(function (e) { return e.kind === 'add' && e.cat === 'kbuy' && (ym === 'all' || e.date.slice(0, 7) === ym); }).reduce(function (a, e) { return a + e.amt; }, 0)), pc = cats.o_pay;
  if (kb > 0 && pc && pc.ils > 0) { var mv = Math.min(kb, pc.ils); pc.ils = r2(pc.ils - mv); cats.o_kb = { c: 'kb', dir: 'out', n: wlOn().filter(function (e) { return e.kind === 'add' && e.cat === 'kbuy' && (ym === 'all' || e.date.slice(0, 7) === ym); }).length, ils: mv, usd: 0 }; }
  T.dI = r2(T.inI - T.outI); T.dU = r2(T.inU - T.outU);
  return { ms: ms, cats: Object.keys(cats).map(function (k) { return cats[k]; }), parties: Object.keys(parties).map(function (k) { return { k: k, v: parties[k] }; }).sort(function (a, b) { return (b.v.ils + b.v.usd * 3.2) - (a.v.ils + a.v.usd * 3.2); }), T: T };
}
function oweInst() { return r2(S.insts.filter(function (i) { return !i.arch; }).reduce(function (a, i) { var d = iniAcct(i).due; return a + (d > 0 ? d : 0); }, 0)); }
function oweWork() { return r2(activeW().reduce(function (a, w) { var b = wBal(w); return a + (b > 0 ? b : 0); }, 0)); }
function pgFinSum() {
  var ym = A.fsm || today().slice(0, 7), D = finData(ym), bl = [], ms = finMonths(), t = D.T;
  bl.push(B('chips', { scroll: true, items: ms.slice(0, 12).map(function (m) { return X({ label: monthLabel(m), on: ym === m, go: function () { setState({ fsm: m }); } }); }).concat([X({ label: 'الكل', on: ym === 'all', go: function () { setState({ fsm: 'all' }); } })]) }));
  bl.push(B('kpi', { items: [X({ label: 'وارد', value: money(t.inI), value2: uTxt(t.inU, t.inX), endTone: 'ok', sub: (t.inU || t.inX) ? '' : 'مكافئ بالشيكل' }), X({ label: 'صرف', value: money(t.outI), value2: uTxt(t.outU, t.outX), endTone: 'bad', sub: (t.outU || t.outX) ? '' : 'مكافئ بالشيكل' }), X({ label: 'الفرق (وارد − صرف)', value: money(t.dI), endTone: (t.dI < 0 || t.dU < 0) ? 'bad' : 'ok', value2: (t.dU || t.inX || t.outX) ? usdTxt(r2(t.inU + t.inX - t.outU - t.outX)) : '', sub: (t.dU || t.inX || t.outX) ? '' : 'مكافئ بالشيكل' })] }));
  bl.push(B('rows', { title: 'التغيّر الفعلي في الأرصدة', items: [X({ title: 'الشيكل', end: t.nI < 0 ? sg('out', money(-t.nI)) : sg('in', money(t.nI)), endTone: t.nI < 0 ? 'bad' : 'ok' }), X({ title: 'الدولار', end: t.nU < 0 ? sg('out', usdTxt(-t.nU)) : sg('in', usdTxt(t.nU)), endTone: t.nU < 0 ? 'bad' : 'ok' })] }));
  bl.push(B('btns', { items: [X({ label: 'مشاركة الملخص (صورة)', icon: 'i-send', on: true, go: function () { shareFin(ym); } })] }));
  var CI = { pay: 'i-users', kb: 'i-truck', buy: 'i-box', move: 'i-truck', rent: 'i-home', misc: 'i-list', sales: 'i-wallet', inst: 'i-shield', oth: 'i-plus', adj: 'i-check' };
  var shareBase = function (dir) { return D.cats.filter(function (c) { return c.dir === dir && c.c !== 'adj'; }).reduce(function (a, c) { return a + c.ils; }, 0); }, bOut = shareBase('out'), bIn = shareBase('in');
  /* الدلالة اللونية: الوارد أخضر والصرف أحمر؛ والأيقونة تميّز التصنيف، والنسبة من مجموع جهتها */
  var rowOf = function (c) { var bs = c.dir === 'in' ? bIn : bOut, pc = bs > 0 && c.ils ? Math.round(c.ils / bs * 100) : 0; return X({ icon: CI[c.c] || (c.dir === 'in' ? 'i-plus' : 'i-minus'), icTone: c.c === 'adj' ? 'info' : c.dir === 'in' ? 'ok' : 'bad', title: catName(c.c), sub: pl(c.n, 'حركة واحدة', 'حركتان', 'حركات') + (pc ? ' · ' + pc + '%' : ''), endTone: c.c === 'adj' ? '' : c.dir === 'in' ? 'ok' : 'bad', end: sg(c.dir, c.ils ? money(c.ils) : usdTxt(c.usd)), endSub: c.ils && c.usd ? usdTxt(c.usd) : '', chev: true, go: function () { openSh({ t: 'fcat', ym: ym, c: c.c, dir: c.dir }); } }); };
  var outs = D.cats.filter(function (c) { return c.dir === 'out' && c.c !== 'adj'; }).sort(function (a, b) { return b.ils - a.ils; }), ins = D.cats.filter(function (c) { return c.dir === 'in' && c.c !== 'adj'; }).sort(function (a, b) { return b.ils - a.ils; }), adj = D.cats.filter(function (c) { return c.c === 'adj'; });
  bl.push(B('rows', { title: 'الصرف حسب التصنيف', items: outs.map(rowOf), empty: 'لا صرف في هذه الفترة' }));
  bl.push(B('rows', { title: 'الوارد حسب المصدر', items: ins.map(rowOf), empty: 'لا وارد في هذه الفترة' }));
  if (adj.length) bl.push(B('rows', { title: 'تسويات الجرد', items: adj.map(rowOf) }));
  bl.push(B('rows', { title: 'أكبر المصروفات', items: D.parties.slice(0, 8).map(function (p) { return X({ title: p.k, sub: pl(p.v.n, 'حركة واحدة', 'حركتان', 'حركات'), end: sg('out', p.v.ils ? money(p.v.ils) : usdTxt(p.v.usd)), endTone: 'bad' }); }), empty: 'لا صرف' }));
  bl.push(B('rows', { title: 'المستحقات الآن', items: [X({ icon: 'i-truck', icTone: 'info', title: 'مستحق لك من المؤسسات', sub: 'بحسب كشوف الحساب', end: money(oweInst()), chev: true, go: kGo({ t: 'kOweI' }) }), X({ icon: 'i-users', icTone: 'warn', title: 'عليك للعمال', sub: 'أرصدة العمال المستحقة', end: money(oweWork()), chev: true, go: kGo({ t: 'kOweW' }) })] }));
  bl.push(B('note', { tone: 'info', icon: 'i-shield', text: 'التحويلات بين الأرصدة لا تُحسب واردًا ولا صرفًا.' }));
  return bl;
}
function finCanvas(ym) {
  var D = finData(ym), t = D.T, W = 840, PAD = 36, F = "'IBM Plex Sans Arabic', sans-serif", RH = 56, L = [];
  var addC = function (title, arr) { if (!arr.length) return; L.push([title, '', '', 1]); arr.forEach(function (c) { L.push([catName(c.c), pl(c.n, 'حركة واحدة', 'حركتان', 'حركات'), c.ils ? money(c.ils) : usdTxt(c.usd), 0]); }); };
  addC('الصرف حسب التصنيف', D.cats.filter(function (c) { return c.dir === 'out' && c.c !== 'adj'; }).sort(function (a, b) { return b.ils - a.ils; }));
  addC('الوارد حسب المصدر', D.cats.filter(function (c) { return c.dir === 'in' && c.c !== 'adj'; }).sort(function (a, b) { return b.ils - a.ils; }));
  if (D.parties.length) { L.push(['أكبر المصروفات', '', '', 1]); D.parties.slice(0, 6).forEach(function (p) { L.push([p.k, pl(p.v.n, 'حركة واحدة', 'حركتان', 'حركات'), p.v.ils ? money(p.v.ils) : usdTxt(p.v.usd), 0]); }); }
  var hdr = 130, H = hdr + 110 + L.length * RH + 70, c = document.createElement('canvas'); c.width = W; c.height = H;
  var x = c.getContext('2d'); x.direction = 'rtl'; x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, W, H); x.fillStyle = '#14563A'; x.fillRect(0, 0, W, hdr);
  x.fillStyle = '#FFFFFF'; x.textAlign = 'right'; x.font = '700 40px ' + F; x.fillText('الملخص المالي', W - PAD, 62); x.font = '500 25px ' + F; x.fillText(ym === 'all' ? 'كل الأشهر' : monthLabel(ym), W - PAD, 104);
  var y = hdr + 30, cols = [['وارد', money(t.inI) + (t.inU ? '  ' + usdTxt(t.inU) : ''), '#14563A'], ['صرف', money(t.outI) + (t.outU ? '  ' + usdTxt(t.outU) : ''), '#B3261E'], ['الفرق', money(t.dI) + (t.dU ? '  ' + usdTxt(t.dU) : ''), (t.dI < 0 || t.dU < 0) ? '#B3261E' : '#14563A']];
  cols.forEach(function (k, i) { var cx = W - PAD - 130 - i * 270; x.textAlign = 'center'; x.fillStyle = '#5B6660'; x.font = '500 22px ' + F; x.fillText(k[0], cx, y + 24); x.fillStyle = k[2]; x.font = '700 32px ' + F; x.fillText(k[1], cx, y + 66); });
  y += 90;
  L.forEach(function (r, k) {
    if (r[3]) { x.fillStyle = '#EEF0EC'; x.fillRect(0, y, W, RH); x.fillStyle = '#14563A'; x.textAlign = 'right'; x.font = '700 26px ' + F; x.fillText(r[0], W - PAD, y + 37); y += RH; return; }
    x.fillStyle = '#1B2421'; x.textAlign = 'right'; x.font = '600 26px ' + F; x.fillText(r[0], W - PAD, y + 37);
    x.textAlign = 'center'; x.fillStyle = '#5B6660'; x.font = '500 21px ' + F; x.fillText(r[1], W * 0.45, y + 37);
    x.textAlign = 'left'; x.fillStyle = '#1B2421'; x.font = '700 26px ' + F; x.fillText(r[2], PAD, y + 37); y += RH;
  });
  x.fillStyle = '#8A948E'; x.textAlign = 'center'; x.font = '500 20px ' + F; x.fillText('مطبخ عهد', W / 2, H - 22);
  return c;
}
function shareFin(ym) { imgPreview(function () { return finCanvas(ym); }, fnName(['ملخص-مالي', ym], 'png'), 'الملخص المالي'); }

/* ---------- تعديل الحركة وجرد الصندوق ---------- */
function mLocked(m) { return !!(m.x || m.pair || (m.w && m.wl)); }
function mKey(m) { return noteKey(m.note); }
function doEditMove(id) {
  var m = E.by(S.fm, id); if (!m) return;
  var note = cleanNote(fv('note')), cat = fv('cat'), rule = fv('rule') === 'yes' && note;
  var conv = m.cur === 'usd' && m.ils > 0, a = num('amt'), d = moveDate(), was = m.note;
  if (rule && cat) { S.settings.catRules = S.settings.catRules || {}; S.settings.catRules[noteKey(note)] = cat; }
  if (mLocked(m)) { m.note = note || m.note; if (cat) m.cat = cat; audit('تعديل بيان/تصنيف حركة «' + was + '»'); shut(); mutated('حُفظ التعديل'); return; }
  var n = Object.assign({}, m, { id: mid(S.fm, 'm'), void: false, edFrom: m.id, note: note || m.note, date: d });
  var nd = fv('dir') === 'in' || fv('dir') === 'out' ? fv('dir') : m.dir; n.dir = nd;
  var nf = fv('fund'); if (nf && nf !== m.h && fund(nf) && hasCur(fund(nf), m.cur)) n.h = nf;
  if (cat && nd === m.dir) n.cat = cat; else delete n.cat;
  if (conv) { n.ils = a; n.amt = r2(a / m.rate); } else { n.amt = a; }
  m.void = true; m.edTo = n.id; S.fm.push(n);
  audit('تعديل حركة «' + was + '»: ' + fTxt(m.cur, m.amt) + ' ← ' + fTxt(n.cur, n.amt) + (n.h !== m.h ? ' · من «' + (fund(m.h) || {}).name + '» إلى «' + (fund(n.h) || {}).name + '»' : ''));
  shut(); mutated('عُدّلت الحركة وبقي سجل الأصل', function () { m.void = false; delete m.edTo; S.fm = S.fm.filter(function (x) { return x.id !== n.id; }); save(); render(); });
}
function doCount(fid) {
  var f = fund(fid), cur = fv('cur') || fDefCur(f), sys = fBal(fid, cur), cnt = num('cnt'), diff = r2(cnt - sys);
  if (!diff) { shut(); say('الرصيد مطابق للجرد'); return; }
  var m = { id: mid(S.fm, 'm'), date: today(), h: fid, dir: diff > 0 ? 'in' : 'out', cur: cur, amt: Math.abs(diff), ils: 0, rate: 0, note: 'تسوية جرد: كان ' + fTxt(cur, sys) + ' والفعلي ' + fTxt(cur, cnt), adj: true, cat: 'adj' };
  S.fm.push(m); S.settings.lastCount = S.settings.lastCount || {}; S.settings.lastCount[fid] = today();
  audit('جرد «' + f.name + '»: فرق ' + fTxt(cur, diff)); shut(); mutated('سُجّلت تسوية الجرد ' + fTxt(cur, Math.abs(diff)), function () { S.fm = S.fm.filter(function (x) { return x.id !== m.id; }); save(); render(); });
}
function catChips(dir, m0) {
  var nt = cleanNote(fv('note')), g = nt ? catName(catOf({ dir: dir, note: nt, w: m0 && m0.w, x: m0 && m0.x, ini: m0 && m0.ini })) : '', opts = [['', 'تلقائي']].concat(dir === 'in' ? CATS_IN : CATS_OUT);
  return fSelect('cat', 'التصنيف', opts, fv('cat') || '', fv('cat') ? '' : 'تلقائي' + (g ? ': ' + g : ''));
}

/* ---------- حركات العمال (مكافأة، خصم، دفعة، مخالفة): تعديل، تغيير التاريخ، إلغاء. الأصل يبقى في السجل ملغى ولا يُحذف ---------- */
function wlLink(e) { return (S.fm || []).filter(function (m) { return m.wl === e.id && !m.void; })[0] || null; }
function wlLocked(e) { return e.kind === 'open' || wCat(e) === 'rev'; }
function wlForm(e, only) { return { amt: e.amt ? String(e.amt) : '', note: e.note || '', dtxt: e.date, only: only || '' }; }
function wlOpenEdit(e, only) { openSh({ t: 'wlEdit', id: e.id }, wlForm(e, only)); }
/* حركة عامل كسطر ملاصق ليومها: ملاحظة ثم غمامة بلون معناها ثم المبلغ، بنفس نسق صف الحضور */
function wlEnt(e, w, last, hasHead) {
  var c = wCat(e), v = !!e.void, tone = wPlusC(c) || c === 'kbuy' ? 'info' : c === 'viol' || c === 'buy' || c === 'ded' ? 'bad' : c === 'rev' ? 'ok' : 'mute', neg = c === 'viol' || c === 'buy' || c === 'ded' || c === 'pay' || c === 'adv' || (c === 'adjw' && e.kind === 'deduct');
  var o = { ent: true, entLast: last, title: e.note && e.note !== wLabel(e) ? e.note : '', tag: wLabel(e), tagTone: v ? 'mute' : tone, end: e.amt ? sg(neg ? 'out' : 'in', money(e.amt)) : 'تنبيه فقط', endTone: v || !e.amt ? undefined : tone === 'info' ? 'info' : tone === 'bad' ? 'bad' : tone === 'ok' ? 'ok' : undefined };
  if (v && !e.edTo) { o.dim = true; o.undo = function () { wlRestore(e); }; }
  if (!wlLocked(e)) { o.chev = true; o.go = function () { openSh({ t: 'wlv', id: e.id }); }; o.lp = function () { wlQa(e); }; }
  return phRow(o, e, w.name + ' · ' + wLabel(e));
}
function wlRow(e, w, past) {
  var lab = wLabel(e), isV = e.kind === 'viol', v = !!e.void, nt = e.note || '', sub = nt;
  var o = isV ? { icon: 'i-alert', icTone: 'bad', title: 'مخالفة', sub: sub, tag: v ? 'ملغاة' : e.amt ? 'خصم ' + money(e.amt) : 'تنبيه فقط', tagTone: v ? 'mute' : 'bad' }
    : { title: lab, sub: sub, end: v || !e.amt ? '' : sg(e.kind === 'add' ? 'in' : 'out', money(e.amt)), tag: v ? 'ملغاة' : '', tagTone: 'mute', endTone: v ? undefined : e.kind === 'add' && wTone(e) === 'ok' ? 'ok' : wTone(e) === 'bad' ? 'bad' : undefined };
  if (v && !e.edTo) { o.dim = true; o.undo = function () { wlRestore(e); }; }
  if (!wlLocked(e)) { o.chev = true; o.go = function () { openSh({ t: 'wlv', id: e.id }); }; o.lp = function () { wlQa(e); }; }
  return phRow(o, e, w.name + ' · ' + lab);
}
function wlQa(e) {
  var lm = wlLink(e), w = wk(e.w), a = [['عرض الحركة', 'i-book', function () { openSh({ t: 'wlv', id: e.id }); }]];
  if (!e.void) {
    if (!lm) { a.push(['تعديل المبلغ والبيان', 'i-pencil', function () { wlOpenEdit(e); }]); a.push(['تغيير التاريخ', 'i-calendar', function () { wlOpenEdit(e, 'date'); }]); }
    a.push(['إلغاء الحركة', 'i-x', function () { wlCancel(e); }]);
  }
  qa(wLabel(e) + ' · ' + (w ? w.name : ''), dlabel(e.date) + (e.amt ? ' · ' + money(e.amt) : ''), a);
}
function wlRestore(e) {
  if (!e || !e.void || e.edTo) return; e.void = false; audit('استرجاع ' + wLabel(e) + ' ' + money(e.amt) + ' — ' + (wk(e.w) || {}).name);
  shut(); mutated('أُعيدت ' + wLabel(e) + ' إلى حساب العامل', function () { e.void = true; save(); render(); });
}
function wlCancel(e) {
  var lm = wlLink(e); if (lm) { voidMove(lm.id); return; } /* دفعة مرتبطة برصيد: إلغاء حركة الرصيد يُعيد المبلغ إلى حساب العامل */
  e.void = true; audit('إلغاء ' + wLabel(e) + ' ' + money(e.amt) + ' — ' + (wk(e.w) || {}).name);
  shut(); mutated('أُلغيت ' + wLabel(e) + ' وبقي سجلها', function () { e.void = false; save(); render(); });
}
function doWlEdit(id) {
  var e = E.by(S.wl, id); if (!e || e.void) return;
  var only = fv('only') === 'date', amt = only ? e.amt : r2(num('amt')), note = only ? e.note : cleanNote(fv('note')), d = moveDate();
  var n = E.wEntry(S, { date: d, w: e.w, kind: e.kind, amt: amt, note: note }); if (e.cat) n.cat = e.cat; if (e.ph) n.ph = e.ph; n.ed = e.id;
  e.void = true; e.edTo = n.id;
  audit('تعديل ' + wLabel(e) + ' — ' + (wk(e.w) || {}).name + ': ' + money(e.amt) + ' ← ' + money(amt) + (d !== e.date ? ' · ' + dlabel(e.date) + ' ← ' + dlabel(d) : ''));
  shut(); mutated(only ? 'نُقلت الحركة إلى ' + dlabel(d) : 'حُفظ التعديل وبقي الأصل ملغى في السجل', function () { S.wl = S.wl.filter(function (x) { return x.id !== n.id; }); e.void = false; delete e.edTo; save(); render(); });
}
/* تعديل دفعة مرتبطة برصيد: المبلغ ومن أي رصيد والتاريخ. الدفعتان (حساب العامل وحركة الرصيد) تُلغيان ويبقى سجلهما، وتُضاف دفعة بديلة مرتبطة بالطريقة نفسها */
function openEditPay(m) {
  openSh({ t: 'fEditPay', id: m.id }, { amt: String(m.wils || (m.cur === 'ils' ? m.amt : m.ils)), fund: m.h, src: m.cur === 'usd' ? 'usd' : 'ils', rate: m.rate ? String(m.rate) : '', dtxt: m.date });
}
function doEditPay(id) {
  var m = E.by(S.fm, id), e = m && E.by(S.wl, m.wl), w = m && wk(m.w); if (!m || !e || !w || m.void || e.void) return;
  var a = r2(num('amt')), fid = fv('fund'), f = fund(fid), pp = payPlan(f, a, num('rate')), d = moveDate(); if (!pp.ok || !(a > 0)) return;
  var n = E.wEntry(S, { date: d, w: w.id, kind: e.kind, amt: a, note: e.note }); if (e.cat) n.cat = e.cat; if (e.ph) n.ph = e.ph; n.ed = e.id;
  e.void = true; e.edTo = n.id;
  payFund(fid, w, a, '', 'راتب', num('rate'), n.id);
  var nm = S.fm[S.fm.length - 1]; nm.note = m.note; nm.date = d; nm.ed = m.id; if (m.ph) nm.ph = m.ph; m.void = true; m.edTo = nm.id;
  audit('تعديل دفعة ' + w.name + ': ' + money(e.amt) + ' ← ' + money(a) + ((fund(m.h) || {}).name !== f.name ? ' · من «' + (fund(m.h) || {}).name + '» إلى «' + f.name + '»' : '') + (d !== m.date ? ' · ' + dlabel(m.date) + ' ← ' + dlabel(d) : ''));
  shut(); mutated('حُفظ التعديل وبقيت الدفعة الأصلية ملغاة في السجل', function () { S.fm = S.fm.filter(function (x) { return x.id !== nm.id; }); S.wl = S.wl.filter(function (x) { return x.id !== n.id; }); m.void = false; delete m.edTo; e.void = false; delete e.edTo; save(); render(); });
}
function wlSheet(sh) {
  var e = E.by(S.wl, sh.id); if (!e) return null;
  var w = wk(e.w) || {}, lm = wlLink(e);
  if (sh.t === 'wlv') {
    var acts = e.void ? (e.edTo ? undefined : [X({ title: 'استرجاع', icon: 'i-check', go: function () { wlRestore(e); } })]) : (lm ? [X({ title: 'تعديل', icon: 'i-pencil', go: function () { openEditPay(lm); } })] : [X({ title: 'تعديل', icon: 'i-pencil', go: function () { wlOpenEdit(e); } }), X({ title: 'التاريخ', icon: 'i-calendar', go: function () { wlOpenEdit(e, 'date'); } })]).concat([X({ title: 'إلغاء', icon: 'i-x', tone: 'bad', go: function () { wlCancel(e); } })]);
    var rows = [X({ title: 'المبلغ', sub: wLabel(e), tag: e.amt ? sg(e.kind === 'add' ? 'in' : 'out', money(e.amt)) : 'تنبيه فقط', tagTone: e.kind === 'add' ? 'ok' : e.kind === 'pay' ? 'mute' : 'bad' })];
    if (e.note) rows.push(X({ title: 'البيان', sub: e.note }));
    if (e.ed) rows.push(X({ title: 'حركة معدَّلة', sub: 'حلّت محل حركة سابقة بقيت ملغاة في السجل' }));
    var R = { title: wLabel(e) + ' · ' + w.name, sub: dlong(e.date), acts: acts, rows: rows,
      note: { text: e.void ? 'حركة ملغاة: بقيت في السجل ولا تُحتسب.' : lm ? 'دفعة مرتبطة برصيد «' + ((fund(lm.h) || {}).name || '') + '»: إلغاؤها يُعيد المبلغ إلى حساب العامل ويُعيده إلى الرصيد. لتغيير مبلغها أو رصيدها اضغط «تعديل».' : 'الحركات لا تُحذف: التعديل والإلغاء يُبقيان الأصل في السجل.', tone: e.void || lm ? 'warn' : 'info' },
      ft: { label: 'إغلاق', ok: true, go: shut } };
    if (e.ph) R.rows.push(phRow({ icon: 'i-image', icTone: 'ok', title: 'صورة التوثيق', sub: 'اضغط لفتحها', tag: 'مرفقة', tagTone: 'ok' }, e, wLabel(e)));
    return R;
  }
  if (sh.t === 'wlEdit') {
    var only = fv('only') === 'date', isV = e.kind === 'viol', a = num('amt'), fl = [];
    if (!only) { fl.push(fText('amt', isV ? 'مبلغ الخصم (0 = تنبيه فقط)' : 'المبلغ بالشيكل', '0', 'decimal')); fl.push(fText('note', 'البيان', '')); }
    fl = fl.concat(dayFields());
    return { title: only ? 'تغيير التاريخ' : 'تعديل ' + wLabel(e), sub: w.name + ' · ' + dlong(e.date) + (e.amt ? ' · ' + money(e.amt) : ''), fields: fl,
      note: { text: 'الأصل يبقى في السجل ملغى، وتُضاف حركة معدَّلة بدلًا منه. حساب العامل وكشفه يتبعان القيمة الجديدة.', tone: 'info' },
      ft: { label: only ? 'نقل إلى هذا التاريخ' : 'حفظ التعديل', ok: (only || isV || a > 0) && dayOk(), go: function () { doWlEdit(e.id); } } };
  }
  return null;
}
function finSheet(sh) {
  var m, f;
  if (sh.t === 'wlv' || sh.t === 'wlEdit') return wlSheet(sh);
  switch (sh.t) {
    case 'fcat': {
      var D = finData(sh.ym), rows = movesDesc(D.ms.filter(function (x) { return catOf(x) === sh.c && x.dir === sh.dir; })).map(function (x) {
        var conv = x.cur === 'usd' && x.ils > 0; return X({ title: x.note || catName(sh.c), sub: dlabel(x.date) + ' · ' + (fund(x.h) || {}).name, end: sg(sh.dir, conv ? money(x.ils) : fTxt(x.cur, x.amt)), endTone: sh.dir === 'in' ? 'ok' : 'bad', chev: true, go: function () { openSh({ t: 'fView', id: x.id }); }, lp: function () { moveQa(x); } });
      });
      return { title: catName(sh.c), sub: (sh.ym === 'all' ? 'كل الأشهر' : monthLabel(sh.ym)) + ' · ' + pl(rows.length, 'حركة واحدة', 'حركتان', 'حركات'), rows: rows, empty: 'لا حركات' };
    }
    case 'fEditPay': {
      m = E.by(S.fm, sh.id); var w2 = wk(m.w) || {}, fo2 = fund(fv('fund')) || fund(m.h), a2 = num('amt'), rt2 = num('rate'), fl3 = [];
      var fa2 = fText('amt', 'المبلغ بالشيكل', '0', 'decimal'); fa2.fd = 'column'; fa2.ai = 'stretch'; fa2.gp = '6px'; fa2.lf = '0'; fa2.cw = '100%'; fl3.push(fa2);
      fl3.push(fSelect('fund', 'من أي رصيد', funds().map(function (x) { return [x.id, fName(x) + ' · ' + fBalAll(x)]; }), fo2.id));
      if (fo2.curs.length > 1) { ensureSrc(fo2); fl3.push(fSeg('src', 'يُصرف من', [['ils', 'الشيكل'], ['usd', 'الدولار']])); }
      if (hasCur(fo2, 'usd') && (fo2.curs.length < 2 || fv('src') === 'usd')) { if (fv('rate') === '' && lastRate()) A.form.rate = String(lastRate()); fl3.push(fText('rate', 'سعر الصرف (شيكل لكل دولار)', '3.2', 'decimal', 'ما يقابل المبلغ يُخصم من الدولار')); }
      fl3 = fl3.concat(dayFields());
      var pp2 = payPlan(fo2, a2, rt2);
      return { title: 'تعديل الدفعة', sub: w2.name + ' · ' + dlong(m.date) + ' · ' + money(m.wils || 0), fields: fl3,
        note: { text: (a2 > 0 && pp2.txt ? pp2.txt + '. ' : '') + 'الدفعة الأصلية تبقى في السجل ملغاة، وحساب العامل وكشفه يتبعان الدفعة الجديدة.', tone: 'info' },
        ft: { label: 'حفظ التعديل', ok: a2 > 0 && pp2.ok && dayOk(), go: function () { doEditPay(m.id); } } };
    }
    case 'fEdit': {
      m = E.by(S.fm, sh.id); var lk = mLocked(m), conv = m.cur === 'usd' && m.ils > 0, a = num('amt'), fl = [];
      if (!lk) fl.push(fSeg('dir', '', [['out', 'ناقص (صرف)', 'bad'], ['in', 'وارد (دخل)', 'ok']]));
      if (!lk) fl.push(fPair('amt', conv ? 'المبلغ ₪' : m.cur === 'usd' ? 'المبلغ $' : 'المبلغ ₪', 'note', 'البيان', '')); else fl.push(fText('note', 'البيان', ''));
      fl.push(catChips(fv('dir') || m.dir, m)); if ((fv('cat') || '') && cleanNote(fv('note'))) fl.push(fChips('rule', 'تطبيق التصنيف', [['no', 'هذه الحركة فقط'], ['yes', 'كل حركات بنفس البيان']], 'يُصنَّف أيضًا ما تسجّله لاحقًا بالبيان نفسه'));
      if (!lk) { if (!fv('fund')) A.form.fund = m.h; fl.push(fSelect('fund', 'الرصيد (الحساب)', funds().filter(function (x) { return hasCur(x, m.cur); }).map(function (x) { return [x.id, fName(x) + ' · ' + fBalAll(x)]; }), fv('fund'))); }
      if (!lk) fl = fl.concat(dayFields());
      return { tone: lk ? '' : (fv('dir') || m.dir), title: 'تعديل الحركة', sub: (fund(m.h) || {}).name + ' · ' + dlong(m.date), fields: fl,
        note: { text: lk ? 'هذه الحركة مرتبطة بتحويل أو بحساب عامل: يمكن تعديل البيان والتصنيف فقط. لتغيير المبلغ ألغِها وسجّلها من جديد.' : 'يُستبدل الخطأ بالجديد: الأصل يخرج من القوائم والأرصدة (أثره في سجل التدقيق فقط) ولا تُضاف حركة عكسية.', tone: lk ? 'warn' : 'info' },
        ft: { label: 'حفظ التعديل', ok: (lk || a > 0) && cleanNote(fv('note')).length > 0 && (lk || dayOk()), go: function () { doEditMove(m.id); } } };
    }
    case 'fCount': {
      f = fund(sh.f); var cur = fv('cur') || fDefCur(f), sys = fBal(f.id, cur), has = fv('cnt') !== '', cnt = num('cnt'), diff = r2(cnt - sys), fl2 = [];
      if (f.curs.length > 1) { A.form.cur = cur; fl2.push(fSeg('cur', 'العملة', f.curs.map(function (c) { return [c, c === 'usd' ? 'دولار' : 'شيكل']; }))); }
      fl2.push(fText('cnt', 'الموجود فعلًا الآن (' + (cur === 'usd' ? 'دولار' : 'شيكل') + ')', '0', 'decimal', 'اكتب ما عددته بيدك أو رأيته في الحساب'));
      return { title: 'جرد ' + f.name, sub: 'في النظام: ' + fTxt(cur, sys) + ((S.settings.lastCount || {})[f.id] ? ' · آخر جرد ' + dlabel(S.settings.lastCount[f.id]) : ''), fields: fl2,
        note: has ? { text: diff === 0 ? 'الرصيد مطابق، لا حاجة لتسوية.' : (diff > 0 ? 'يزيد الفعلي ' : 'ينقص الفعلي ') + fTxt(cur, Math.abs(diff)) + ' عن النظام: تُسجَّل حركة تسوية بهذا الفرق.', tone: diff === 0 ? 'ok' : 'warn' } : null,
        ft: { label: diff === 0 && has ? 'مطابق' : 'تسجيل التسوية', ok: has, go: function () { doCount(f.id); } } };
    }
  }
  return null;
}

/* ===== 02w2-ownst.js ===== */
/* ---------- كشف حسابنا: وارد ومصروف بمصدره وحسابه، ورصيد كل حساب في أول الفترة وآخرها، وما بينهما يبرّر الفرق (المالك 2026-11-22) ---------- */
function ownRange() {
  var f = (A.sh && A.sh.t === 'ownp' && fv('from')) || A.ofrom || today().slice(0, 7) + '-01', t = (A.sh && A.sh.t === 'ownp' && fv('to')) || A.oto || today();
  if (t > today()) t = today(); if (f > t) f = t;
  return { from: f, to: t };
}
function ownAddDays(s, n) { var d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function ownPresets() {
  var t = today(), ym = t.slice(0, 7), py = ym.split('-'), pm = new Date(Date.UTC(+py[0], +py[1] - 2, 1, 12)).toISOString().slice(0, 7);
  var last = new Date(Date.UTC(+py[0], +py[1] - 1, 0, 12)).toISOString().slice(0, 10);
  return [['هذا الشهر', ym + '-01', t], ['الشهر الماضي', pm + '-01', last], ['آخر 7 أيام', ownAddDays(t, -6), t], ['كل المدة', '2000-01-01', t]];
}
function ownOpts() {
  var d = S.settings.ownOpt || {}, g = function (k, def) { var v = fv(k); return v === '1' || v === '0' ? v === '1' : d[k] != null ? d[k] : def; };
  return { sv: fv('sv') || d.sv || 'full', bal: g('bal', true), ins: g('ins', true), outs: g('outs', true), xf: g('xf', true), acc: g('acc', true) };
}
function ownSaveOpts() { var o = ownOpts(); S.settings.ownOpt = { sv: o.sv, bal: o.bal, ins: o.ins, outs: o.outs, xf: o.xf, acc: o.acc }; }
function ownSigned(m) { return m.dir === 'in' ? m.amt : -m.amt; }
/* المعطيات: لكل (رصيد، عملة): أول الفترة + وارد − صرف ± تحويل ± جرد = آخر الفترة، وقوائم الحركات مصنّفة */
function ownData(from, to) {
  var recs = [];
  funds().forEach(function (f) {
    f.curs.forEach(function (cur) {
      var ms = fmOn(f.id).filter(function (m) { return m.cur === cur; }), r = { f: f, cur: cur, open: 0, inn: 0, inN: 0, out: 0, outN: 0, x: 0, xN: 0, adj: 0, adjN: 0, close: 0 };
      ms.forEach(function (m) {
        var s = ownSigned(m), c = catOf(m);
        if (m.date < from) { r.open = r2(r.open + s); r.close = r2(r.close + s); return; }
        if (m.date > to) return;
        r.close = r2(r.close + s);
        if (c === 'xfer') { r.x = r2(r.x + s); r.xN++; } else if (c === 'adj') { r.adj = r2(r.adj + s); r.adjN++; } else if (m.dir === 'in') { r.inn = r2(r.inn + m.amt); r.inN++; } else { r.out = r2(r.out + m.amt); r.outN++; }
      });
      if (r.open || r.close || r.inN || r.outN || r.xN || r.adjN) recs.push(r);
    });
  });
  var inR = [], outR = [], xR = [], adjR = [], T = { inI: 0, inU: 0, outI: 0, outU: 0, inX: 0, outX: 0 };
  fmOn().filter(function (m) { return m.date >= from && m.date <= to; }).sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; }).forEach(function (m) {
    var c = catOf(m);
    if (c === 'xfer') { if (m.dir === 'out') xR.push(m); return; }
    if (c === 'adj') { adjR.push(m); return; }
    if (m.dir === 'in') { inR.push(m); T.inI = r2(T.inI + ilsOf(m)); T.inU = r2(T.inU + usdOnly(m)); T.inX = r2(T.inX + usdIn(m)); } else { outR.push(m); T.outI = r2(T.outI + ilsOf(m)); T.outU = r2(T.outU + usdOnly(m)); T.outX = r2(T.outX + usdIn(m)); }
  });
  var grp = function (arr) {
    var o = {}; arr.forEach(function (m) { var c = catOf(m); o[c] = o[c] || { c: c, ms: [], ils: 0, usd: 0 }; o[c].ms.push(m); o[c].ils = r2(o[c].ils + ilsOf(m)); o[c].usd = r2(o[c].usd + usdOnly(m)); });
    return Object.keys(o).map(function (k) { return o[k]; }).sort(function (a, b) { return (b.ils + b.usd * 3.2) - (a.ils + a.usd * 3.2); });
  };
  var N = { i: 0, u: 0 }; recs.forEach(function (r) { var d = r2(r.close - r.open); if (r.cur === 'usd') N.u = r2(N.u + d); else N.i = r2(N.i + d); });
  /* وارد ومصروفات كل عملة من أرصدتها وحدها فيتّسق: أول + وارد − مصروفات ± تحويل/جرد = آخر (المالك 2026-11-25: «الصافي بالموجب والفرق بين الوارد والمصروفات مختلف»: كان الدولار المدفوع محسوبًا بالشيكل في المصروفات وخارج صافي الشيكل) */
  var P = { i: { inn: 0, out: 0, xa: 0 }, u: { inn: 0, out: 0, xa: 0 } }; recs.forEach(function (r) { var q = P[r.cur === 'usd' ? 'u' : 'i']; q.inn = r2(q.inn + r.inn); q.out = r2(q.out + r.out); q.xa = r2(q.xa + r.x + r.adj); });
  return { P: P, N: N, from: from, to: to, recs: recs, ins: grp(inR), outs: grp(outR), xs: xR, adjs: adjR, T: T };
}
function ownSub() { var R = ownRange(); return R.from === '2000-01-01' ? 'كل المدة حتى ' + dshow(R.to) : dshow(R.from) + ' ← ' + dshow(R.to); }
function ownRecName(r) { return r.f.name + (r.f.curs.length > 1 ? ' · ' + (r.cur === 'usd' ? 'دولار' : 'شيكل') : ''); }
/* صافي الفترة للرصيد = آخره − أوله (وارد − صرف ± تحويل ± جرد)؛ يظهر في صف عنوان البطاقة نفسه مقابل الاسم (المالك 2026-11-24) */
function ownNet(r) { var n = r2(r.close - r.open); return { n: n, txt: n === 0 ? fTxt(r.cur, 0) : n < 0 ? sg('out', fTxt(r.cur, -n)) : sg('in', fTxt(r.cur, n)), tone: n < 0 ? 'bad' : n > 0 ? 'ok' : '' }; }
function ownRecRows(r) {
  var nt = ownNet(r), o = [X({ par: true, icon: 'i-wallet', icTone: r.cur === 'usd' ? 'info' : 'ok', title: ownRecName(r), sub: 'صافي الفترة', end: nt.txt, endTone: nt.tone || undefined }), X({ title: 'رصيد أول الفترة', end: fTxt(r.cur, r.open) })];
  if (r.inN) o.push(X({ kid: true, title: 'وارد', sub: pl(r.inN, 'حركة واحدة', 'حركتان', 'حركات'), end: sg('in', fTxt(r.cur, r.inn)), endTone: 'ok' }));
  if (r.outN) o.push(X({ kid: true, title: 'مصروفات', sub: pl(r.outN, 'حركة واحدة', 'حركتان', 'حركات'), end: sg('out', fTxt(r.cur, r.out)), endTone: 'bad' }));
  if (r.xN) o.push(X({ kid: true, title: 'تحويلات', sub: pl(r.xN, 'حركة واحدة', 'حركتان', 'حركات'), end: (r.x < 0 ? sg('out', fTxt(r.cur, -r.x)) : sg('in', fTxt(r.cur, r.x))), endTone: r.x < 0 ? 'bad' : 'ok' }));
  if (r.adjN) o.push(X({ kid: true, title: 'تسوية جرد', sub: pl(r.adjN, 'حركة واحدة', 'حركتان', 'حركات'), end: (r.adj < 0 ? sg('out', fTxt(r.cur, -r.adj)) : sg('in', fTxt(r.cur, r.adj))), endTone: r.adj < 0 ? 'bad' : 'ok' }));
  o.push(X({ total: true, title: 'رصيد آخر الفترة', end: fTxt(r.cur, r.close) }));
  return o;
}
function ownTot(g) { return g.ils ? money(g.ils) + (g.usd ? ' + ' + usdTxt(g.usd) : '') : usdTxt(g.usd); }
function ownOpen() { setState({ ofrom: ownRange().from, oto: ownRange().to }); open('ownst'); }
function ownSetRange(f, t) { A.ofrom = f; A.oto = t; render(); }
/* صافي الفترة الإجمالي لكل الأرصدة: مجموع صافي كل رصيد، بالشيكل وبالدولار بوزن واحد (المالك 2026-11-24: «ليش مش كاتب الإجمالي فوق؟») */
function ownNetTxt(n, cur) { return n === 0 ? fTxt(cur, 0) : n < 0 ? sg('out', fTxt(cur, -n)) : sg('in', fTxt(cur, n)); }
function ownNetNote(q, cur) { return q && q.xa ? 'منه تحويل وجرد ' + ownNetTxt(q.xa, cur) : ''; }
/* ملخص الفترة بطاقة واحدة بعمودين (شيكل | دولار): وارد (أخضر +)، مصروفات (أحمر −)، ثم صافي الفترة صف إجمالي؛ الأيقونة والصف يميّزان الدور (المالك 2026-11-25: «حاجات شبه بعض لا تدل على اختلافها») */
function ownSumRows(D) {
  var P = D.P, N = D.N, two = !!(P.u.inn || P.u.out || N.u), o = [];
  var col = function (cur, v, dir) { return v ? sg(dir, fTxt(cur, v)) : fTxt(cur, 0); };
  if (two) o.push(X({ hdr: true, colw: 104, title: '', end: 'شيكل', end2: 'دولار' }));
  var row = function (o2, ti, ic, tn, qi, qu, dir) { var r = { title: ti, icon: ic, icTone: tn, end: col('ils', qi, dir), endTone: qi ? tn : undefined }; if (two) { r.colw = 104; r.end2 = col('usd', qu, dir); if (qu && tn === 'bad') r.end2Tone = 'bad'; } o2.push(X(r)); };
  row(o, 'وارد', 'i-plus', 'ok', P.i.inn, P.u.inn, 'in');
  row(o, 'مصروفات', 'i-minus', 'bad', P.i.out, P.u.out, 'out');
  var t = { total: true, title: 'صافي الفترة', end: ownNetTxt(N.i, 'ils'), endTone: N.i < 0 ? 'bad' : undefined };
  if (two) { t.colw = 104; t.end2 = ownNetTxt(N.u, 'usd'); if (N.u < 0) t.end2Tone = 'bad'; }
  var xa = ownNetNote(P.i, 'ils'), xu = ownNetNote(P.u, 'usd'); if (xa || xu) t.sub = [xa, xu].filter(Boolean).join(' · ');
  o.push(X(t));
  return o;
}
function pgOwnSt() {
  var R = ownRange(), D = ownData(R.from, R.to), bl = [], T = D.T;
  bl.push(B('chips', { items: ownPresets().map(function (p) { return X({ label: p[0], on: R.from === p[1] && R.to === p[2], go: function () { ownSetRange(p[1], p[2]); } }); }).concat([X({ label: 'فترة محددة', icon: 'i-calendar', go: function () { ownPrev(); } })]) }));
  bl.push(B('acts', { items: [X({ title: 'مشاركة الكشف', icon: 'i-send', go: function () { ownPrev(); } })] }));
  var P = D.P, hasU = P.u.inn || P.u.out;
  bl.push(B('rows', { title: 'ملخص الفترة', all: true, items: ownSumRows(D) }));
  D.recs.forEach(function (r) { bl.push(B('rows', { all: true, items: ownRecRows(r) })); });
  if (!D.recs.length) bl.push(B('rows', { title: 'الأرصدة', items: [], empty: 'لا حركات في هذه الفترة' }));
  D.ins.forEach(function (g) { bl.push(B('rows', { title: 'الوارد · ' + catName(g.c) + ' · ' + ownTot(g), items: g.ms.map(function (m) { return moveRowX(m, true); }) })); });
  D.outs.forEach(function (g) { bl.push(B('rows', { title: 'المصروفات · ' + catName(g.c) + ' · ' + ownTot(g), items: g.ms.map(function (m) { return moveRowX(m, true); }) })); });
  if (D.xs.length) bl.push(B('rows', { title: 'تحويلات بين الحسابات', items: D.xs.map(function (m) { return moveRowX(m, true); }) }));
  if (D.adjs.length) bl.push(B('rows', { title: 'تسويات الجرد', items: D.adjs.map(function (m) { return moveRowX(m, true); }) }));
  return bl;
}
function ownPrev() { var R = ownRange(), d = S.settings.ownOpt || {}; openSh({ t: 'ownp' }, { from: R.from, to: R.to, sv: d.sv || 'full' }); }
function ownFileName(R, o) { return fnName(['كشف-حسابنا', R.from, R.to, o.sv === 'sum' ? 'مختصر' : ''], ''); }
/* معاينة حية فوق الخيارات (تتغير الصورة مع كل تبديل) ثم مشاركة أو حفظ صورة أو PDF، كباقي الكشوف */
function ownSheet(sh) {
  if (sh.t !== 'ownp') return null;
  var R = ownRange(), o = ownOpts(), D = ownData(R.from, R.to), cv = ownCanvas(D, o), url = cv.toDataURL('image/png'), nm = ownFileName(R, o), ttl = 'كشف حسابنا';
  var fail = function (er) { if (!/cancel|dismiss/i.test(String((er && er.message) || er))) say('تعذّر فتح المشاركة'); };
  if (!fv('from')) A.form.from = R.from; if (!fv('to')) A.form.to = R.to;
  ['bal', 'ins', 'outs', 'xf', 'acc'].forEach(function (k) { if (fv(k) !== '1' && fv(k) !== '0') A.form[k] = o[k] ? '1' : '0'; });
  var fl = [fPhotoView(url, true, true), fDate('from', 'من يوم', '', today()), fDate('to', 'إلى يوم', '', today()), fSeg('sv', 'شكل الكشف', [['full', 'مفصّل'], ['sum', 'مختصر']]),
    fStateGrid(['ما يظهر في الكشف', ['bal', 'أرصدة الحسابات'], ['ins', 'الوارد'], ['outs', 'المصروفات'], ['xf', 'التحويلات'], ['acc', 'اسم الحساب في كل حركة']], [['1', 'ظاهر'], ['0', 'مخفي']])
  ];
  return { title: 'كشف حسابنا', sub: 'غيّر الخيارات فتتغير المعاينة، ثم شارك', fields: fl,
    acts: [X({ title: 'PDF', icon: 'i-doc', go: function () { deliverFile(nm + '.pdf', u8b64(pdfFromCanvas(cv)), 'application/pdf', ttl, '').catch(fail); } }),
      X({ title: 'PDF للطباعة', icon: 'i-doc', go: function () { deliverFile(nm + '-للطباعة.pdf', u8b64(pdfA4Pages(cv)), 'application/pdf', ttl, '').catch(fail); } }),
      X({ title: 'تنزيل صورة', icon: 'i-download', go: function () { saveFile(nm + '.png', url.split(',')[1], 'image/png', ttl).then(function (r) { say(savedMsg(r, 'الصورة')); }, function () { say('تعذّر حفظ الصورة'); }); } }),
      X({ title: 'نسخ النص', icon: 'i-list', go: function () { copyText(ownText(D, o), 'نُسخ الكشف'); } })],
    ft: { label: 'مشاركة', ok: R.from <= R.to && R.to <= today(), go: function () { ownSaveOpts(); deliverFile(nm + '.png', url.split(',')[1], 'image/png', ttl, '').catch(fail); } },
    ft2: { label: 'عرض في الصفحة', go: function () { ownSaveOpts(); shut(); ownSetRange(R.from, R.to); mutated('حُفظت خيارات الكشف'); } } };
}
function ownMvTxt(m, o) { var f0 = fund(m.h), cv = m.cur === 'usd' && m.ils > 0; return '  ' + dshow(m.date) + ' · ' + (m.note || '') + (o.acc && f0 ? ' · ' + f0.name : '') + ' · ' + (cv ? money(m.ils) + ' (' + usdTxt(m.amt) + ')' : fTxt(m.cur, m.amt)); }
function ownText(D, o) {
  o = o || ownOpts();
  var L = ['كشف حسابنا', 'من ' + dshow(D.from) + ' إلى ' + dshow(D.to), ''];
  if (o.bal) D.recs.forEach(function (r) { L.push(ownRecName(r) + ' (صافي الفترة ' + ownNet(r).txt + '): رصيد أول الفترة ' + fTxt(r.cur, r.open) + (r.inN ? ' · وارد ' + fTxt(r.cur, r.inn) : '') + (r.outN ? ' · مصروفات ' + fTxt(r.cur, r.out) : '') + (r.xN ? ' · تحويلات ' + fTxt(r.cur, r.x) : '') + (r.adjN ? ' · جرد ' + fTxt(r.cur, r.adj) : '') + ' · رصيد آخر الفترة ' + fTxt(r.cur, r.close)); });
  L.push('صافي الفترة: ' + ownNetTxt(D.N.i, 'ils') + (D.N.u ? ' · ' + ownNetTxt(D.N.u, 'usd') : ''), '');
  var sec = function (t, gs) { if (!gs.length) return; L.push('', t); gs.forEach(function (g) { L.push(catName(g.c) + ' (' + pl(g.ms.length, 'حركة واحدة', 'حركتان', 'حركات') + ' · ' + ownTot(g) + ')'); if (o.sv !== 'sum') g.ms.forEach(function (m) { L.push(ownMvTxt(m, o)); }); }); };
  if (o.ins) sec('الوارد', D.ins); if (o.outs) sec('المصروفات', D.outs);
  if (o.xf && D.xs.length) { L.push('', 'تحويلات بين الحسابات'); D.xs.forEach(function (m) { L.push(ownMvTxt(m, o)); }); }
  return L.join('\n');
}
/* لوحة الكشف: ترويسة، أرصدة كل حساب (أول + حركات = آخر)، ثم الوارد والمصروفات بتواريخها وأصحابها وحسابها؛ والخيارات تُظهر وتُخفي بلا أثر على الأرقام */
function ownCanvas(D, o) {
  o = o || ownOpts();
  var W = 840, PAD = 36, F = "'IBM Plex Sans Arabic', sans-serif", hdr = 150, L = [], brk = [];
  L.push({ k: 'sum' });
  if (o.bal) D.recs.forEach(function (r) {
    L.push({ k: 'sec', cc: r.cur, t: ownRecName(r), brk: 1, v: ownNet(r).txt, tone: ownNet(r).tone, cap: 'صافي الفترة' });
    L.push({ k: 'rec', l: 'رصيد أول الفترة', v: fTxt(r.cur, r.open) });
    if (r.inN) L.push({ k: 'rec', fl: 1, l: 'وارد (' + r.inN + ')', v: sg('in', fTxt(r.cur, r.inn)), tone: 'ok' });
    if (r.outN) L.push({ k: 'rec', fl: 1, l: 'مصروفات (' + r.outN + ')', v: sg('out', fTxt(r.cur, r.out)), tone: 'bad' });
    if (r.xN) L.push({ k: 'rec', fl: 1, l: 'تحويلات', v: sg(r.x < 0 ? 'out' : 'in', fTxt(r.cur, Math.abs(r.x))), tone: r.x < 0 ? 'bad' : 'ok' });
    if (r.adjN) L.push({ k: 'rec', fl: 1, l: 'تسوية جرد', v: sg(r.adj < 0 ? 'out' : 'in', fTxt(r.cur, Math.abs(r.adj))), tone: r.adj < 0 ? 'bad' : 'ok' });
    L.push({ k: 'tot', l: 'رصيد آخر الفترة', v: fTxt(r.cur, r.close) });
  });
  var mv = function (m, dir) { var f0 = fund(m.h), cv = m.cur === 'usd' && m.ils > 0; return { k: 'mv', d: dshow(m.date), n: m.note || (dir === 'in' ? 'وارد' : dir === 'out' ? 'مصروف' : 'تحويل'), a: o.acc && f0 ? (dir === 'in' ? 'إلى ' : 'من ') + f0.name : '', v: (dir ? sg(dir, cv ? money(m.ils) : fTxt(m.cur, m.amt)) : (cv ? money(m.ils) : fTxt(m.cur, m.amt))), s: cv ? usdTxt(m.amt) : '', tone: dir === 'in' ? 'ok' : dir === 'out' ? 'bad' : '' }; };
  var mvs = function (pre, gs, dir) {
    if (o.sv === 'sum') { if (!gs.length) return; L.push({ k: 'sec', t: pre, brk: 1 }); gs.forEach(function (g) { L.push({ k: 'rec', l: catName(g.c) + ' (' + g.ms.length + ')', v: sg(dir, ownTot(g)), tone: dir === 'in' ? 'ok' : 'bad' }); }); return; }
    gs.forEach(function (g, i) { L.push({ k: 'sec', t: pre + ' · ' + catName(g.c) + ' · ' + ownTot(g), brk: !i }); g.ms.forEach(function (m) { L.push(mv(m, dir)); }); });
  };
  if (o.ins) mvs('الوارد', D.ins, 'in'); if (o.outs) mvs('المصروفات', D.outs, 'out');
  if (o.xf && D.xs.length) { L.push({ k: 'sec', t: 'تحويلات بين الحسابات', brk: 1 }); D.xs.forEach(function (m) { L.push(mv(m, '')); }); }
  var H = hdr + 30, i;
  for (i = 0; i < L.length; i++) H += L[i].k === 'mv' ? (L[i].a || L[i].d ? 70 : 52) : L[i].k === 'sum' ? 262 : L[i].k === 'sec' ? 58 : L[i].fl ? 44 : 52;
  H += 70;
  var c = document.createElement('canvas'); c.width = W; c.height = H;
  var x = c.getContext('2d'); x.direction = 'rtl'; x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#14563A'; x.fillRect(0, 0, W, hdr); x.fillStyle = '#FFFFFF'; x.textAlign = 'right';
  x.font = '700 42px ' + F; x.fillText('كشف حسابنا', W - PAD, 66); x.font = '500 25px ' + F; x.fillText('من ' + dshow(D.from) + ' إلى ' + dshow(D.to), W - PAD, 110);
  x.textAlign = 'left'; x.font = '500 22px ' + F; x.fillText('مطبخ عهد', PAD, 66);
  var CO = { ok: '#14563A', bad: '#B3261E', '': '#1B2421' };
  var fit = function (t, w) { if (x.measureText(t).width <= w) return t; while (t.length > 1 && x.measureText(t + '…').width > w) t = t.slice(0, -1); return t + '…'; };
  var y = hdr + 30;
  L.forEach(function (r) {
    if (r.k === 'sum') {
      brk.push(y); var P0 = D.P, N0 = D.N, two = !!(P0.u.inn || P0.u.out || N0.u), xI = two ? 440 : 230, xU = 170, cs = function (cur, v, dir) { return v ? sg(dir, fTxt(cur, v)) : fTxt(cur, 0); };
      x.fillStyle = '#E4EFE8'; x.fillRect(0, y, W, 58); x.fillStyle = '#14563A'; x.textAlign = 'right'; x.font = '700 27px ' + F; x.fillText('ملخص الفترة', W - PAD, y + 38); y += 58;
      x.fillStyle = '#F3F6F3'; x.fillRect(0, y, W, 40); x.fillStyle = '#14563A'; x.font = '600 20px ' + F; x.textAlign = 'center'; x.fillText('شيكل', xI, y + 27); if (two) x.fillText('دولار', xU, y + 27); y += 40;
      [['وارد', '+', '#14563A', '#DFF1E7', P0.i.inn, P0.u.inn, 'in'], ['مصروفات', '−', '#B3261E', '#FDE7E4', P0.i.out, P0.u.out, 'out']].forEach(function (q) {
        x.fillStyle = q[3]; x.beginPath(); x.arc(W - PAD - 17, y + 26, 17, 0, 7); x.fill(); x.fillStyle = q[2]; x.font = '700 26px ' + F; x.textAlign = 'center'; x.fillText(q[1], W - PAD - 17, y + 35);
        x.textAlign = 'right'; x.fillStyle = '#1B2421'; x.font = '500 25px ' + F; x.fillText(q[0], W - PAD - 48, y + 34);
        x.textAlign = 'center'; x.fillStyle = q[4] ? q[2] : '#1B2421'; x.font = '600 25px ' + F; x.fillText(cs('ils', q[4], q[6]), xI, y + 34); if (two) { x.fillStyle = q[5] ? q[2] : '#1B2421'; x.fillText(cs('usd', q[5], q[6]), xU, y + 34); }
        x.fillStyle = '#EEF0EC'; x.fillRect(PAD, y + 51, W - 2 * PAD, 1); y += 52; });
      var nz = function (v) { return v < 0 ? '#B3261E' : '#14563A'; };
      x.fillStyle = '#DCEBE2'; x.fillRect(0, y, W, 64); x.fillStyle = '#14563A'; x.fillRect(0, y, W, 2); x.textAlign = 'right'; x.font = '700 27px ' + F; x.fillText('صافي الفترة', W - PAD, y + 41);
      x.textAlign = 'center'; x.fillStyle = nz(N0.i); x.fillText(ownNetTxt(N0.i, 'ils'), xI, y + 41); if (two) { x.fillStyle = nz(N0.u); x.fillText(ownNetTxt(N0.u, 'usd'), xU, y + 41); }
      var xa = ownNetNote(P0.i, 'ils'), xu = ownNetNote(P0.u, 'usd'); y += 64; return;
    }
    if (r.k === 'sec') { if (r.brk) brk.push(y); var cardH = !!r.cap; x.fillStyle = cardH ? '#FFFFFF' : '#E4EFE8'; x.fillRect(0, y, W, 58); if (cardH) { x.fillStyle = '#DDE2DC'; x.fillRect(0, y, W, 2); x.fillStyle = r.cc === 'usd' ? '#243C8F' : '#14563A'; x.fillRect(W - 8, y, 8, 58); } x.fillStyle = cardH ? '#1B2421' : '#14563A'; x.textAlign = 'right'; x.font = '700 27px ' + F; x.fillText(fit(r.t, W - 2 * PAD - (r.v ? 300 : 0)), W - PAD, y + 38); if (r.v) { x.textAlign = 'left'; x.fillStyle = CO[r.tone || ''] === '#1B2421' ? '#14563A' : CO[r.tone]; x.font = '700 27px ' + F; x.fillText(r.v, PAD, y + 38); if (r.cap) { var vw = x.measureText(r.v).width; x.fillStyle = '#6B756F'; x.font = '500 19px ' + F; x.fillText(r.cap, PAD + vw + 14, y + 37); } } y += 58; return; }
    if (r.k === 'rec' && r.fl) { x.fillStyle = '#4A554F'; x.textAlign = 'right'; x.font = '400 22px ' + F; x.fillText(r.l, W - PAD - 24, y + 30); x.textAlign = 'left'; x.fillStyle = CO[r.tone || '']; x.font = '500 22px ' + F; x.fillText(r.v, PAD, y + 30); x.fillStyle = '#EEF0EC'; x.fillRect(PAD, y + 43, W - 2 * PAD, 1); y += 44; return; }
    if (r.k === 'rec') { x.fillStyle = '#1B2421'; x.textAlign = 'right'; x.font = '500 25px ' + F; x.fillText(r.l, W - PAD, y + 34); x.textAlign = 'left'; x.fillStyle = CO[r.tone || '']; x.font = '600 25px ' + F; x.fillText(r.v, PAD, y + 34); x.fillStyle = '#EEF0EC'; x.fillRect(PAD, y + 51, W - 2 * PAD, 1); y += 52; return; }
    if (r.k === 'tot') { x.fillStyle = '#DCEBE2'; x.fillRect(0, y, W, 52); x.fillStyle = '#14563A'; x.fillRect(0, y, W, 2); x.textAlign = 'right'; x.font = '700 26px ' + F; x.fillText(r.l, W - PAD, y + 35); x.textAlign = 'left'; x.fillText(r.v, PAD, y + 35); y += 52; return; }
    var two = !!(r.a || r.d), h = two ? 70 : 52;
    x.textAlign = 'right'; x.fillStyle = '#1B2421'; x.font = '600 24px ' + F; x.fillText(fit(r.n, W - 2 * PAD - 210), W - PAD, y + 30);
    x.fillStyle = '#6B756F'; x.font = '500 20px ' + F; x.fillText(r.d + (r.a ? ' · ' + r.a : ''), W - PAD, y + 58);
    x.textAlign = 'left'; x.fillStyle = CO[r.tone || '']; x.font = '700 25px ' + F; x.fillText(r.v, PAD, y + 32);
    if (r.s) { x.fillStyle = '#6B756F'; x.font = '500 19px ' + F; x.fillText(r.s, PAD, y + 58); }
    x.fillStyle = '#EEF0EC'; x.fillRect(PAD, y + h - 2, W - 2 * PAD, 1); y += h;
  });
  x.fillStyle = '#8A948E'; x.textAlign = 'center'; x.font = '500 20px ' + F; x.fillText('كشف حسابنا · مطبخ عهد', W / 2, H - 24);
  brk.push(y); c.brk = brk; return c;
}

/* ===== 02w3-ach.js ===== */
/* ---------- الإنجاز: قدور وطبخات وأيام وجهات وعمل العمال لفترة من/إلى (المالك 2026-11-23) ---------- */
function achRange() {
  var f = A.afrom || ownPresets()[0][1], t = A.ato || today();
  if (t > today()) t = today(); if (f > t) f = t;
  return { from: f, to: t };
}
function achSetRange(f, t) { A.afrom = f; A.ato = t; render(); }
function achExtras() { return (S.settings.achExtra || []).slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }); }
function achMeal() { var m = parseFloat(S.settings.mealsPerPot); return m > 0 ? m : 0; }
/* الطبخات المنجزة فقط (لا الخطط ولا الملغاة) داخل الفترة، ثم قدور ما قبل التطبيق المُدخلة يدويًا */
function achData(from, to) {
  var bs = (S.batches || []).filter(function (b) { return !b.void && b.done !== false && b.done !== 'sched' && b.date >= from && b.date <= to; });
  var ex = achExtras().filter(function (e) { return e.date >= from && e.date <= to; });
  var D = { from: from, to: to, bs: bs, ex: ex, pv: 0, ext: 0, n: bs.length, days: {}, camps: {}, insts: {}, dish: {}, wd: 0, ws: {} };
  bs.forEach(function (b) {
    var p = b.pots || 0; D.days[b.date] = 1;
    if (b.kind === 'external') { D.ext += p; if (b.inst) D.insts[b.inst] = 1; } else { D.pv += p; Object.keys(b.dist || {}).forEach(function (g) { if (b.dist[g] > 0) D.camps[g] = 1; }); }
    var nm = batchName(b); D.dish[nm] = (D.dish[nm] || 0) + p;
  });
  ex.forEach(function (e) { D.pv += e.pots; D.days[e.date] = 1; D.n += 0; });
  (S.att || []).forEach(function (a) { if (a.date >= from && a.date <= to && a.m > 0) { D.wd = r2(D.wd + a.m); D.ws[a.w] = 1; } });
  D.pots = r2(D.pv + D.ext); D.nd = Object.keys(D.days).length; D.nc = Object.keys(D.camps).length; D.ni = Object.keys(D.insts).length; D.nw = Object.keys(D.ws).length;
  D.meals = achMeal() ? Math.round(D.pots * achMeal()) : 0;
  D.top = Object.keys(D.dish).map(function (k) { return { n: k, p: D.dish[k] }; }).sort(function (a, b) { return b.p - a.p; }).slice(0, 5);
  return D;
}
function achNum(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function pgAch() {
  var R = achRange(), D = achData(R.from, R.to), bl = [];
  bl.push(B('chips', { items: ownPresets().map(function (p) { return X({ label: p[0], on: R.from === p[1] && R.to === p[2], go: function () { achSetRange(p[1], p[2]); } }); }).concat([X({ label: 'فترة محددة', icon: 'i-calendar', go: function () { openSh({ t: 'achp' }, { from: R.from, to: R.to }); } })]) }));
  bl.push(B('acts', { items: [X({ title: 'مشاركة', icon: 'i-send', go: function () { openSh({ t: 'achs' }); } }), X({ title: 'قدور سابقة', icon: 'i-plus', go: function () { openSh({ t: 'achx' }, { date: R.from, pots: '' }); } }), X({ title: 'وجبات/قدر', icon: 'i-sliders', go: function () { openSh({ t: 'achm' }, { m: achMeal() ? String(achMeal()) : '' }); } })] }));
  bl.push(B('kpi', { items: [X({ label: 'قدور', value: achNum(D.pots), endTone: 'ok', sub: D.meals ? '' : pl(D.n, 'طبخة واحدة', 'طبختان', 'طبخات') }), X({ label: 'أيام الطبخ', value: D.nd, sub: D.nd ? '≈ ' + (Math.round(D.pots / D.nd * 10) / 10) + ' قدر/يوم' : '' })] }));
  if (D.meals) bl.push(B('kpi', { items: [X({ label: 'وجبات', value: achNum(D.meals), endTone: 'ok', sub: achMeal() + ' وجبة/قدر' }), X({ label: 'طبخات', value: D.n })] }));
  bl.push(B('rows', { title: 'التفصيل', all: true, items: [
    X({ title: 'مخيمات', sub: D.nc ? pl(D.nc, 'نقطة واحدة', 'نقطتان', 'نقاط') : '', end: achNum(D.pv) + ' قدر' }),
    X({ title: 'طبخ خارجي', sub: D.ni ? pl(D.ni, 'جهة واحدة', 'جهتان', 'جهات') : '', end: achNum(D.ext) + ' قدر' }),
    X({ title: 'العمال', sub: D.nw ? pl(D.nw, 'عامل واحد', 'عاملان', 'عمال') : '', end: achNum(D.wd) + ' يوم عمل' })
  ] }));
  if (D.top.length) bl.push(B('rows', { title: 'الأكثر طبخًا', all: true, items: D.top.map(function (t) { return X({ title: t.n, end: achNum(t.p) + ' قدر' }); }) }));
  if (D.ex.length) bl.push(B('rows', { title: 'قدور سابقة', all: true, items: D.ex.map(function (e) { return X({ title: dshow(e.date), sub: e.note || '', end: e.pots + ' قدر', chev: true, go: function () { openSh({ t: 'achx', id: e.id }, { date: e.date, pots: String(e.pots), note: e.note || '' }); } }); }) }));
  return bl;
}
function achLabel(D) { return D.from === '2000-01-01' ? 'كل المدة حتى ' + dshow(D.to) : 'من ' + dshow(D.from) + ' إلى ' + dshow(D.to); }
function achText(D) {
  var L = ['الإنجاز · مطبخ عهد', achLabel(D), '', 'القدور: ' + achNum(D.pots) + (D.meals ? ' (≈ ' + achNum(D.meals) + ' وجبة)' : ''), 'الطبخات: ' + D.n, 'أيام الطبخ: ' + D.nd];
  if (D.nc) L.push('مخيمات: ' + pl(D.nc, 'نقطة واحدة', 'نقطتان', 'نقاط'));
  L.push('العمال: ' + achNum(D.wd) + ' يوم عمل');
  return L.join('\n');
}
function achCanvas(D) {
  var W = 840, PAD = 40, F = "'IBM Plex Sans Arabic', sans-serif", big = [['قدور', achNum(D.pots)]];
  if (D.meals) big.push(['وجبات', achNum(D.meals)]);
  big.push(['أيام الطبخ', String(D.nd)]);
  var rows = [['طبخات', String(D.n)], ['مخيمات', achNum(D.pv) + ' قدر'], ['طبخ خارجي', achNum(D.ext) + ' قدر'], ['أيام عمل العمال', achNum(D.wd)]];
  D.top.forEach(function (t, i) { rows.push([i ? t.n : 'الأكثر طبخًا: ' + t.n, achNum(t.p) + ' قدر']); });
  var H = 150 + 190 + rows.length * 56 + 90, c = document.createElement('canvas'); c.width = W; c.height = H;
  var x = c.getContext('2d'); x.direction = 'rtl'; x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#14563A'; x.fillRect(0, 0, W, 150); x.fillStyle = '#FFFFFF'; x.textAlign = 'right'; x.font = '700 42px ' + F; x.fillText('الإنجاز', W - PAD, 66); x.font = '500 25px ' + F; x.fillText(achLabel(D), W - PAD, 110);
  x.textAlign = 'left'; x.font = '500 22px ' + F; x.fillText('مطبخ عهد', PAD, 66);
  var bw = (W - 2 * PAD - (big.length - 1) * 16) / big.length, y = 150 + 30;
  big.forEach(function (b, i) {
    var bx = W - PAD - bw - i * (bw + 16); x.fillStyle = '#E4EFE8'; x.fillRect(bx, y, bw, 140); x.fillStyle = '#14563A'; x.textAlign = 'center';
    x.font = '700 56px ' + F; x.fillText(b[1], bx + bw / 2, y + 78); x.font = '500 24px ' + F; x.fillText(b[0], bx + bw / 2, y + 118);
  });
  y += 140 + 20;
  rows.forEach(function (r) { x.fillStyle = '#1B2421'; x.textAlign = 'right'; x.font = '500 26px ' + F; x.fillText(r[0], W - PAD, y + 36); x.textAlign = 'left'; x.font = '600 26px ' + F; x.fillText(r[1], PAD, y + 36); x.fillStyle = '#EEF0EC'; x.fillRect(PAD, y + 54, W - 2 * PAD, 1); y += 56; });
  x.fillStyle = '#8A948E'; x.textAlign = 'center'; x.font = '500 20px ' + F; x.fillText('مطبخ عهد', W / 2, H - 28);
  return c;
}
function achSheet(sh) {
  if (sh.t === 'achp') {
    var f0 = fv('from') || achRange().from, t0 = fv('to') || achRange().to;
    return { title: 'فترة محددة', fields: [fDate('from', 'من يوم', '', today()), fDate('to', 'إلى يوم', '', today())], ft: { label: 'عرض', ok: f0 <= t0 && t0 <= today(), go: function () { shut(); achSetRange(f0, t0); } } };
  }
  if (sh.t === 'achm') {
    var m = parseFloat(fv('m'));
    return { title: 'وجبات/قدر', fields: [fText('m', 'عدد الوجبات في القدر', 'مثال: 230', 'numeric')], note: { text: 'يُحسب به إجمالي الوجبات. اتركه فارغًا ليختفي.', tone: 'info' },
      ft: { label: 'حفظ', ok: fv('m') === '' || m > 0, go: function () { S.settings.mealsPerPot = m > 0 ? m : 0; shut(); mutated('حُفظ'); } } };
  }
  if (sh.t === 'achx') {
    var pots = parseFloat(fv('pots')), dt = fv('date') || today();
    return { title: 'قدور سابقة', fields: [fDate('date', 'التاريخ', '', today()), fText('pots', 'عدد القدور', '0', 'numeric'), fText('note', 'ملاحظة (اختياري)', '')],
      ft: { label: 'حفظ', ok: pots > 0 && dt <= today(), go: function () {
        var l = S.settings.achExtra = S.settings.achExtra || [], e = sh.id && l.filter(function (z) { return z.id === sh.id; })[0];
        if (e) { e.date = dt; e.pots = pots; e.note = fv('note').trim(); } else l.push({ id: newId('x', l), date: dt, pots: pots, note: fv('note').trim() });
        shut(); mutated('حُفظت القدور');
      } },
      ft2: sh.id ? { label: 'حذف', go: function () { S.settings.achExtra = (S.settings.achExtra || []).filter(function (z) { return z.id !== sh.id; }); shut(); mutated('حُذفت'); } } : null };
  }
  if (sh.t === 'achs') {
    var R = achRange(), D = achData(R.from, R.to), cv = achCanvas(D), url = cv.toDataURL('image/png'), nm = fnName(['الإنجاز', R.from, R.to], ''), ttl = 'الإنجاز';
    var fail = function (er) { if (!/cancel|dismiss/i.test(String((er && er.message) || er))) say('تعذّر فتح المشاركة'); };
    return { title: 'الإنجاز', fields: [fPhotoView(url, true, true)],
      acts: [X({ title: 'PDF', icon: 'i-doc', go: function () { deliverFile(nm + '.pdf', u8b64(pdfFromCanvas(cv)), 'application/pdf', ttl, '').catch(fail); } }),
        X({ title: 'تنزيل صورة', icon: 'i-download', go: function () { saveFile(nm + '.png', url.split(',')[1], 'image/png', ttl).then(function (r) { say(savedMsg(r, 'الصورة')); }, function () { say('تعذّر حفظ الصورة'); }); } }),
        X({ title: 'نسخ النص', icon: 'i-list', go: function () { copyText(achText(D), 'نُسخ'); } })],
      ft: { label: 'مشاركة', ok: true, go: function () { deliverFile(nm + '.png', url.split(',')[1], 'image/png', ttl, '').catch(fail); } } };
  }
  return null;
}

/* ===== 02w4-wrep.js ===== */
/* ---------- ملخص المتابعة الأسبوعي للمدير (المالك 2026-11-25): الإنجاز، الطبخ الخارجي، العمال، المخزن، المال؛ فترة من/إلى ومقارنة بالفترة السابقة ---------- */
var WR_BL = [['hd', 'الحكم العام'], ['kpi', 'الأرقام الرئيسية'], ['ex', 'نقاط المتابعة'], ['bars', 'رسم القدور اليومي'], ['ext', 'الطبخ الخارجي'], ['wk', 'العمال'], ['stk', 'المخزن'], ['mon', 'المال'], ['nx', 'الأسبوع القادم'], ['cmp', 'المقارنة بالفترة السابقة']];
function wrOpt() {
  var s = (S.settings.wrOpt || {}), o = {};
  WR_BL.forEach(function (k) { o[k[0]] = s[k[0]] !== '0'; });
  o.note = (s.note || '').trim(); o.who = (s.who || '').trim();
  return o;
}
function wrSetOpt(k, v) { S.settings.wrOpt = S.settings.wrOpt || {}; S.settings.wrOpt[k] = v; save(); }
function wrRange() {
  var f = A.wfrom || wstWeekFrom(), t = A.wto || today();
  if (t > today()) t = today(); if (f > t) f = t;
  return { from: f, to: t };
}
function wrSetRange(f, t) { A.wfrom = f; A.wto = t; render(); }
function wrPresets() {
  var t = today(), w = wstWeekFrom(), pw = ownAddDays(w, -7), lw = ownAddDays(w, -1);
  return [['هذا الأسبوع', w, t], ['الأسبوع الماضي', pw, lw], ['آخر 7 أيام', ownAddDays(t, -6), t], ['هذا الشهر', t.slice(0, 7) + '-01', t]];
}
function wrPrev(f, t) { var n = Math.round((new Date(t + 'T12:00:00Z') - new Date(f + 'T12:00:00Z')) / 864e5) + 1; return { from: ownAddDays(f, -n), to: ownAddDays(f, -1) }; }
function wrIn(d, f, t) { return d >= f && d <= t; }
function wrInstName(id) { var i = (S.insts || []).filter(function (x) { return x.id === id; })[0]; return i ? i.name : 'جهة'; }
function wrData(from, to) {
  var pr = wrPrev(from, to), A1 = achData(from, to), P = achData(pr.from, pr.to), D = { from: from, to: to, pf: pr.from, pt: pr.to, a: A1, p: P };
  /* قدور كل يوم (خاص + خارجي + قدور سابقة مُدخلة) */
  var per = {}; A1.bs.forEach(function (b) { per[b.date] = r2((per[b.date] || 0) + (b.pots || 0)); }); A1.ex.forEach(function (e) { per[e.date] = r2((per[e.date] || 0) + e.pots); });
  D.days = []; for (var d = from, n = 0; d <= to && n < 62; d = ownAddDays(d, 1), n++) D.days.push({ d: d, v: per[d] || 0 });
  /* الطبخ الخارجي لكل جهة */
  var im = {}; A1.bs.filter(function (b) { return b.kind === 'external'; }).forEach(function (b) { var o = im[b.inst] = im[b.inst] || { n: wrInstName(b.inst), pots: 0, days: {}, cost: 0 }; o.pots += b.pots || 0; o.days[b.date] = 1; o.cost += b.cost || 0; });
  D.ext = Object.keys(im).map(function (k) { var o = im[k]; return { n: o.n, pots: r2(o.pots), nd: Object.keys(o.days).length, cost: r2(o.cost) }; }).sort(function (a, b) { return b.pots - a.pots; });
  D.extCost = r2(D.ext.reduce(function (a, o) { return a + o.cost; }, 0));
  /* العمال: آخر سجل لكل (يوم، عامل) */
  var am = {}; (S.att || []).forEach(function (a) { if (wrIn(a.date, from, to)) am[a.date + '|' + a.w] = a; });
  var cnt = {}; Object.keys(am).forEach(function (k) { var a = am[k]; cnt[a.st] = (cnt[a.st] || 0) + 1; });
  D.st = (S.stats || []).filter(function (s) { return s.id !== 'h' && cnt[s.id]; }).map(function (s) { return { n: s.name, c: cnt[s.id], tone: s.tone }; });
  D.nw = activeW().length;
  D.noAtt = to === today() && !isHol() ? activeW().filter(function (w) { return !wAtt(w); }).length : 0;
  D.earn = r2(Object.keys(am).reduce(function (a, k) { return a + E.attAmt(am[k]); }, 0));
  /* المخزن */
  D.stk = []; ledgers().forEach(function (l) {
    var c = [0, 0, 0]; itemsIn(l.id).forEach(function (it) { var q = E.balance(S, l.id, it.id), st = stStatus(q, it.id); if (alertable(l, it, q) && st.rank <= 2) c[st.rank]++; });
    if (c[0] + c[1] + c[2]) D.stk.push({ n: l.name, out: c[0], low: c[1], soon: c[2] });
  });
  var arr = (S.drafts || []).filter(function (x) { return x.done === 'approved' && wrIn(x.date, from, to); });
  D.sup = arr.length; D.supItems = arr.reduce(function (a, x) { return a + x.lines.length; }, 0);
  D.next = supSched().filter(function (x) { return !x.hold && x.date > to; });
  D.nextN = D.next.length; D.nextD = D.next.length ? D.next[0].date : '';
  /* المال */
  D.owW = oweWork(); D.owI = oweInst();
  D.paidW = r2(wlOn().filter(function (e) { return e.kind === 'pay' && wrIn(e.date, from, to); }).reduce(function (a, e) { return a + e.amt; }, 0));
  D.colI = r2((S.insts || []).reduce(function (a, i) { return a + (i.pay || []).filter(function (c) { return wrIn(c.date, from, to); }).reduce(function (z, c) { return z + c.amt; }, 0); }, 0));
  var OD = ownData(from, to); D.inI = OD.P.i.inn; D.outI = OD.P.i.out; D.inU = OD.P.u.inn; D.outU = OD.P.u.out; D.net = r2(D.inI - D.outI); D.netU = r2(D.inU - D.outU); D.netNow = r2(D.owI - D.owW);
  /* مؤشرات الإدارة: تكلفة القدر (مواد المطبخ الخاص ÷ قدوره)، إنتاجية العمل (قدور لكل يوم عمل)، صافي الفترة السابقة */
  var pc = function (A0) { var c = 0, q = 0; A0.bs.forEach(function (b) { if (b.kind !== 'external') { c += b.cost || 0; q += b.pots || 0; } }); return { c: r2(c), q: q, per: q > 0 ? r2(c / q) : 0 }; };
  D.pc = pc(A1); D.ppc = pc(P); D.ppd = A1.wd > 0 ? r2(A1.pots / A1.wd) : 0; D.pppd = P.wd > 0 ? r2(P.pots / P.wd) : 0;
  var OP = ownData(pr.from, pr.to); D.pnet = r2(OP.P.i.inn - OP.P.i.out);
  /* الأسبوع القادم: طبخات مخططة بعد نهاية الفترة، وتوريدات قادمة */
  D.nxB = plans().filter(function (z) { return z.date > to; }); D.nxPots = r2(D.nxB.reduce(function (a, z) { return a + (z.pots || 0); }, 0));
  D.outNames = []; ledgers().forEach(function (l) { itemsIn(l.id).forEach(function (it) { var q = E.balance(S, l.id, it.id), st = stStatus(q, it.id); if (alertable(l, it, q) && st.rank === 0 && D.outNames.length < 40) D.outNames.push(it.name); }); });
  /* نقاط المتابعة: الاستثناءات فقط */
  D.exc = []; var oc = D.stk.reduce(function (a, z) { return a + z.out; }, 0), lc = D.stk.reduce(function (a, z) { return a + z.low; }, 0);
  if (oc) D.exc.push({ t: pl(oc, 'صنف واحد نفد', 'صنفان نفدا', 'أصناف نفدت') + (D.outNames.length ? ': ' + D.outNames.slice(0, 3).join('، ') + (D.outNames.length > 3 ? '…' : '') : ''), tone: 'bad' });
  if (lc) D.exc.push({ t: pl(lc, 'صنف حرج', 'صنفان حرجان', 'أصناف حرجة'), tone: 'warn' });
  if (D.noAtt) D.exc.push({ t: 'حضور ' + pl(D.noAtt, 'عامل واحد', 'عاملين', 'عمال') + ' لم يُسجَّل اليوم', tone: 'warn' });
  if (D.net < 0) D.exc.push({ t: 'المصروفات أكثر من الوارد هذه الفترة', tone: 'bad' });
  if (P.pots > 0 && A1.pots < P.pots * 0.7) D.exc.push({ t: 'القدور أقل من الفترة السابقة بأكثر من 30%', tone: 'warn' });
  if (D.ppc.per > 0 && D.pc.per > D.ppc.per * 1.15) D.exc.push({ t: 'تكلفة القدر ارتفعت أكثر من 15% عن السابق', tone: 'warn' });
  D.lvl = D.net < 0 || D.exc.length >= 3 ? 2 : D.exc.length ? 1 : 0;
  return D;
}
function wrNet(v) { return v < 0 ? '\u2066\u2212' + money(-v) + '\u2069' : money(v); }
function wrLabel(D) { return 'من ' + dshow(D.from) + ' إلى ' + dshow(D.to); }
function wrDelta(c, p, inv) { var d = r2(c - p); return { d: d, t: d === 0 ? '=' : (d > 0 ? '+' : '\u2212') + achNum(Math.abs(d)), good: d === 0 ? null : (inv ? d < 0 : d > 0) }; }
function wrDayName(s) { return DN[new Date(s + 'T12:00:00').getDay()]; }
function wrHead(D) {
  var a = D.a, L = ['جيد', 'يحتاج متابعة', 'يحتاج تدخّلًا'][D.lvl], t = a.pots ? achNum(a.pots) + ' قدر في ' + pl(a.nd, 'يوم واحد', 'يومين', 'أيام') + ' من الطبخ' : 'لا طبخ في هذه الفترة';
  if (a.pots && D.p.pots) t += ' (' + (a.pots >= D.p.pots ? 'أعلى' : 'أقل') + ' من الفترة السابقة)';
  t += ' · صافي الفترة ' + wrNet(D.net);
  return { lvl: D.lvl, l: L, t: t };
}
function wrRows(D, o) { /* المحتوى كله أسطرًا: تعتمده الشاشة والنص والصورة معًا فلا يختلف بينها شيء */
  var S1 = [], a = D.a, p = D.p;
  if (o.hd) { var h = wrHead(D); S1.push({ k: 'verdict', lvl: h.lvl, l: h.l, t: h.t }); }
  if (o.kpi) {
    var k = [['قدور', achNum(a.pots), wrDelta(a.pots, p.pots)]];
    if (D.pc.per) k.push(['تكلفة القدر', money(D.pc.per), wrDelta(D.pc.per, D.ppc.per, true)]);
    if (D.ppd) k.push(['قدور/يوم عمل', String(D.ppd), wrDelta(D.ppd, D.pppd)]);
    k.push(['صافي الفترة', wrNet(D.net), wrDelta(D.net, D.pnet)]);
    S1.push({ k: 'kpi', t: k });
    var m2 = [pl(a.n, 'طبخة واحدة', 'طبختان', 'طبخات'), pl(a.nd, 'يوم طبخ', 'يومان', 'أيام طبخ')]; if (a.meals) m2.unshift(achNum(a.meals) + ' وجبة');
    if (a.nc) m2.push(pl(a.nc, 'مخيم واحد', 'مخيمان', 'مخيمات'));
    if (a.n) S1.push({ k: 'row', l: m2.join(' · '), v: '' });
    if (a.top.length) S1.push({ k: 'row', l: 'الأكثر طبخًا: ' + a.top[0].n, v: achNum(a.top[0].p) + ' قدر' });
  }
  if (o.ex) { S1.push({ k: 'sec', t: 'نقاط المتابعة', c: '#B3261E', n: D.exc.length ? String(D.exc.length) : '' }); if (!D.exc.length) S1.push({ k: 'row', l: 'لا شيء يحتاج متابعة', v: '✓', tone: 'ok' }); D.exc.forEach(function (z) { S1.push({ k: 'row', l: z.t, v: '', tone: z.tone, ex: 1 }); }); }
  if (o.bars && D.days.length > 1 && D.days.length <= 14 && D.days.some(function (z) { return z.v > 0; })) S1.push({ k: 'bars', t: D.days });
  if (o.ext && D.ext.length) { S1.push({ k: 'sec', t: 'الطبخ الخارجي', c: '#7A4A1E', n: achNum(a.ext) + ' قدر' }); D.ext.forEach(function (e) { S1.push({ k: 'row', l: e.n, v: achNum(e.pots) + ' قدر', s: pl(e.nd, 'يوم واحد', 'يومان', 'أيام') }); }); }
  if (o.wk && (D.st.length || D.noAtt)) {
    S1.push({ k: 'sec', t: 'العمال', c: '#243C8F', n: achNum(a.wd) + ' يوم عمل' });
    D.st.forEach(function (s) { S1.push({ k: 'row', l: s.n, v: achNum(s.c) + ' يوم', tone: s.tone === 'bad' ? 'bad' : s.tone === 'warn' ? 'warn' : '' }); });
    if (D.noAtt) S1.push({ k: 'row', l: 'لم يُسجَّل حضورهم اليوم', v: pl(D.noAtt, 'عامل واحد', 'عاملان', 'عمال'), tone: 'warn' });
  }
  if (o.stk) {
    S1.push({ k: 'sec', t: 'المخزن', c: '#8A5A00', n: D.sup ? 'وصل: ' + pl(D.sup, 'توريد واحد', 'توريدان', 'توريدات') : '' });
    if (!D.stk.length) S1.push({ k: 'row', l: 'لا أصناف ناقصة', v: '✓', tone: 'ok' });
    D.stk.forEach(function (z) { var p2 = []; if (z.out) p2.push(z.out + ' نفد'); if (z.low) p2.push(z.low + ' حرج'); if (z.soon) p2.push(z.soon + ' ينقص قريبًا'); S1.push({ k: 'row', l: z.n, v: p2.join(' · '), tone: z.out || z.low ? 'bad' : 'warn' }); });
  }
  if (o.mon) {
    S1.push({ k: 'sec', t: 'المال', c: '#14563A', n: '' });
    S1.push({ k: 'row', l: 'وارد الفترة', v: money(D.inI), tone: D.inI > 0 ? 'ok' : '' });
    if (D.colI > 0) S1.push({ k: 'row', l: 'منه: محصَّل من المؤسسات', v: money(D.colI), sub: 1 });
    S1.push({ k: 'row', l: 'مصروفات الفترة', v: money(D.outI), tone: D.outI > 0 ? 'bad' : '' });
    if (D.paidW > 0) S1.push({ k: 'row', l: 'منها: دُفع للعمال', v: money(D.paidW), sub: 1 });
    if (D.inU || D.outU) { S1.push({ k: 'row', l: 'وارد بالدولار', v: usdTxt(D.inU), tone: D.inU > 0 ? 'ok' : '' }); S1.push({ k: 'row', l: 'مصروفات بالدولار', v: usdTxt(D.outU), tone: D.outU > 0 ? 'bad' : '' }); }
    S1.push({ k: 'row', l: 'صافي الفترة', v: wrNet(D.net), tone: D.net < 0 ? 'bad' : D.net > 0 ? 'ok' : '', tot: 1, s: 'وارد − مصروفات' });
    if (D.inU || D.outU) S1.push({ k: 'row', l: 'صافي الفترة بالدولار', v: D.netU < 0 ? '\u2066\u2212' + usdTxt(-D.netU) + '\u2069' : usdTxt(D.netU), tone: D.netU < 0 ? 'bad' : D.netU > 0 ? 'ok' : '', tot: 1 });
    S1.push({ k: 'sec', t: 'المستحقات الآن', c: '#14563A', n: '' });
    S1.push({ k: 'row', l: 'مستحق للعمال', v: money(D.owW), tone: D.owW > 0 ? 'warn' : '' });
    if (D.extCost > 0) S1.push({ k: 'row', l: 'تكلفة الطبخ الخارجي هذه الفترة', v: money(D.extCost) });
    S1.push({ k: 'row', l: 'مستحق لنا من المؤسسات', v: money(D.owI), tone: D.owI > 0 ? 'warn' : '' });
    S1.push({ k: 'row', l: 'صافي المستحق', v: wrNet(D.netNow), tone: D.netNow < 0 ? 'bad' : D.netNow > 0 ? 'ok' : '', tot: 1, s: 'لنا − علينا' });
  }
  if (o.nx && (D.nxB.length || D.nextN)) {
    S1.push({ k: 'sec', t: 'الأسبوع القادم', c: '#243C8F', n: '' });
    if (D.nxB.length) S1.push({ k: 'row', l: 'طبخات مخططة', v: pl(D.nxB.length, 'طبخة واحدة', 'طبختان', 'طبخات') + ' · ' + achNum(D.nxPots) + ' قدر' });
    if (D.nextN) S1.push({ k: 'row', l: 'توريد قادم', v: dshow(D.nextD) + (D.nextN > 1 ? ' (+' + (D.nextN - 1) + ')' : '') });
  }
  if (o.note) S1.push({ k: 'note', t: o.note });
  return S1;
}
function wrText(D, o) {
  o = o || wrOpt(); var L = ['ملخص المتابعة الأسبوعي · مطبخ عهد', wrLabel(D), ''];
  wrRows(D, o).forEach(function (r) {
    if (r.k === 'verdict') { L.push('الحكم العام: ' + r.l); L.push(r.t); L.push(''); }
    else if (r.k === 'kpi') r.t.forEach(function (z) { L.push(z[0] + ': ' + z[1] + (o.cmp && z[2].d ? ' (' + z[2].t + ' عن الفترة السابقة)' : '')); });
    else if (r.k === 'sec') { L.push(''); L.push(r.t + (r.n ? ' · ' + r.n : '')); }
    else if (r.k === 'row') L.push('- ' + r.l + (r.v ? ': ' + r.v : '') + (r.s ? ' (' + r.s + ')' : ''));
    else if (r.k === 'note') { L.push(''); L.push(r.t); }
  });
  return L.join('\n');
}
function wrCanvas(D, o) {
  o = o || wrOpt();
  var W = 840, PAD = 40, F = "'IBM Plex Sans Arabic', sans-serif", R = wrRows(D, o), G = '#14563A', HD = 170, y, H = HD + 24;
  R.forEach(function (r) { H += r.k === 'verdict' ? 150 : r.k === 'kpi' ? 168 : r.k === 'bars' ? 232 : r.k === 'sec' ? 76 : r.k === 'note' ? 120 : 54; });
  H += 70;
  var c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d'); x.direction = 'rtl';
  x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, W, H);
  /* الترويسة */
  x.fillStyle = G; x.fillRect(0, 0, W, HD); x.fillStyle = '#0F4430'; x.beginPath(); x.arc(40, 20, 150, 0, 7); x.fill();
  x.fillStyle = '#FFFFFF'; x.textAlign = 'right'; x.font = '700 44px ' + F; x.fillText('ملخص المتابعة الأسبوعي', W - PAD, 78);
  x.font = '500 26px ' + F; x.fillText(wrLabel(D), W - PAD, 124);
  x.textAlign = 'left'; x.font = '600 24px ' + F; x.fillText('مطبخ عهد', PAD, 70);
  if (o.who) { x.font = '500 20px ' + F; x.fillText(o.who, PAD, 106); }
  y = HD + 24;
  var tri = function (cx, cy, up, col) { x.fillStyle = col; x.beginPath(); if (up) { x.moveTo(cx, cy - 7); x.lineTo(cx - 7, cy + 5); x.lineTo(cx + 7, cy + 5); } else { x.moveTo(cx, cy + 7); x.lineTo(cx - 7, cy - 5); x.lineTo(cx + 7, cy - 5); } x.closePath(); x.fill(); };
  R.forEach(function (r) {
    if (r.k === 'verdict') {
      var VC = [['#E8F1EB', '#14563A'], ['#FFF1D0', '#8A5A00'], ['#FDEBE9', '#B3261E']][r.lvl];
      x.fillStyle = VC[0]; x.fillRect(PAD, y, W - 2 * PAD, 130); x.fillStyle = VC[1]; x.fillRect(W - PAD - 8, y, 8, 130);
      x.beginPath(); x.arc(W - PAD - 44, y + 40, 12, 0, 7); x.fill();
      x.textAlign = 'right'; x.font = '700 32px ' + F; x.fillText(r.l, W - PAD - 70, y + 52);
      x.fillStyle = '#1B2421'; x.font = '500 23px ' + F; wrapLines(x, r.t, W - 2 * PAD - 60).slice(0, 2).forEach(function (ln, i) { x.fillText(ln, W - PAD - 30, y + 90 + i * 30 - (i ? 0 : 6)); });
      y += 150;
    } else if (r.k === 'kpi') {
      var n = r.t.length, gap = 12, bw = (W - 2 * PAD - (n - 1) * gap) / n;
      r.t.forEach(function (z, i) {
        var bx = W - PAD - bw - i * (bw + gap); x.fillStyle = i === 0 ? G : '#E8F1EB'; x.fillRect(bx, y, bw, 148);
        x.fillStyle = i === 0 ? '#FFFFFF' : G; x.textAlign = 'center'; var fs0 = 48; do { x.font = '700 ' + fs0 + 'px ' + F; fs0 -= 2; } while (x.measureText(z[1]).width > bw - 16 && fs0 > 22);
        x.fillText(z[1], bx + bw / 2, y + 72); x.font = '500 21px ' + F; x.fillText(z[0], bx + bw / 2, y + 106);
        if (o.cmp && (z[2].d || +String(z[1]).replace(/[^0-9.]/g, ''))) { var d = z[2], col = i === 0 ? '#FFFFFF' : d.good === true ? '#14563A' : d.good === false ? '#B3261E' : '#8A948E'; x.fillStyle = col; x.font = '600 19px ' + F; if (d.d) { tri(bx + bw / 2 - 24, y + 130, d.d > 0, col); x.textAlign = 'left'; x.fillText(d.t.replace(/^[+\u2212]/, ''), bx + bw / 2 - 11, y + 136); } else { x.textAlign = 'center'; x.fillText('كالسابق', bx + bw / 2, y + 136); } }
      });
      y += 168;
    } else if (r.k === 'bars') {
      var mx = Math.max.apply(null, r.t.map(function (z) { return z.v; }).concat([1])), n2 = r.t.length, bw2 = (W - 2 * PAD) / n2, base = y + 170;
      x.fillStyle = '#F4F6F3'; x.fillRect(PAD, y, W - 2 * PAD, 206); x.fillStyle = '#5B6660'; x.textAlign = 'right'; x.font = '600 21px ' + F; x.fillText('القدور كل يوم', W - PAD - 14, y + 30);
      r.t.forEach(function (z, i) {
        var bx = W - PAD - (i + 1) * bw2 + bw2 * 0.2, w2 = bw2 * 0.6, h = Math.round(z.v / mx * 100);
        x.fillStyle = z.v ? G : '#DDE3DE'; x.fillRect(bx, base - Math.max(h, 4), w2, Math.max(h, 4));
        x.textAlign = 'center'; x.fillStyle = '#1B2421'; x.font = '600 19px ' + F; if (z.v) x.fillText(achNum(z.v), bx + w2 / 2, base - h - 8);
        x.fillStyle = '#8A948E'; x.font = '500 ' + (n2 > 7 ? 16 : 18) + 'px ' + F; x.fillText(n2 > 7 ? String(+z.d.slice(8)) : wrDayName(z.d), bx + w2 / 2, base + 26);
      });
      y += 232;
    } else if (r.k === 'sec') {
      x.fillStyle = r.c; x.fillRect(W - PAD - 8, y + 20, 8, 36); x.textAlign = 'right'; x.font = '700 30px ' + F; x.fillText(r.t, W - PAD - 24, y + 48);
      if (r.n) { x.textAlign = 'left'; x.fillStyle = '#5B6660'; x.font = '600 24px ' + F; x.fillText(r.n, PAD, y + 48); }
      x.fillStyle = '#DDE3DE'; x.fillRect(PAD, y + 66, W - 2 * PAD, 2); y += 76;
    } else if (r.k === 'row') {
      var col2 = r.tone === 'bad' ? '#B3261E' : r.tone === 'warn' ? '#8A5A00' : r.tone === 'ok' ? G : '#1B2421';
      if (r.tot) { x.fillStyle = '#E8F1EB'; x.fillRect(PAD, y, W - 2 * PAD, 52); }
      if (r.ex) { x.fillStyle = col2; x.beginPath(); x.arc(W - PAD - 16, y + 27, 6, 0, 7); x.fill(); }
      x.fillStyle = r.sub ? '#5B6660' : '#1B2421'; x.textAlign = 'right'; x.font = (r.tot ? '700 ' : '500 ') + (r.sub ? '22' : '26') + 'px ' + F; x.fillText(r.l, W - PAD - (r.sub ? 30 : r.ex ? 36 : 10), y + 35);
      if (r.s) { var wl = x.measureText(r.l).width; x.fillStyle = '#8A948E'; x.font = '500 20px ' + F; x.fillText(r.s, W - PAD - 10 - wl - 16, y + 35); }
      x.fillStyle = col2; x.textAlign = 'left'; x.font = (r.sub ? '500 22px ' : '600 26px ') + F; x.fillText(r.v, PAD + 10, y + 35);
      x.fillStyle = '#EEF0EC'; x.fillRect(PAD, y + 52, W - 2 * PAD, 1); y += 54;
    } else if (r.k === 'note') {
      x.fillStyle = '#FFF6DD'; x.fillRect(PAD, y + 12, W - 2 * PAD, 96); x.fillStyle = '#8A5A00'; x.fillRect(W - PAD - 6, y + 12, 6, 96);
      x.fillStyle = '#1B2421'; x.textAlign = 'right'; x.font = '500 24px ' + F; wrapLines(x, r.t, W - 2 * PAD - 40).slice(0, 2).forEach(function (ln, i) { x.fillText(ln, W - PAD - 24, y + 52 + i * 36); }); y += 120;
    }
  });
  x.fillStyle = '#8A948E'; x.textAlign = 'center'; x.font = '500 20px ' + F; x.fillText('مطبخ عهد · ' + dshow(today()), W / 2, H - 26);
  return c;
}
function wrapLines(x, t, mw) { var ws = String(t).split(/\s+/), out = [], cur = ''; ws.forEach(function (w) { var n = cur ? cur + ' ' + w : w; if (x.measureText(n).width > mw && cur) { out.push(cur); cur = w; } else cur = n; }); if (cur) out.push(cur); return out; }
function wrTone(t) { return t === 'bad' ? 'bad' : t === 'warn' ? 'warn' : t === 'ok' ? 'ok' : undefined; }
function pgWrep() {
  var R = wrRange(), D = wrData(R.from, R.to), o = wrOpt(), bl = [];
  bl.push(B('chips', { scroll: true, items: wrPresets().map(function (p) { return X({ label: p[0], on: R.from === p[1] && R.to === p[2], go: function () { wrSetRange(p[1], p[2]); } }); }).concat([X({ label: 'فترة محددة', icon: 'i-calendar', go: function () { openSh({ t: 'wrp' }, { from: R.from, to: R.to }); } })]) }));
  bl.push(B('acts', { items: [X({ title: 'إرسال للمدير', icon: 'i-send', go: function () { openSh({ t: 'wrs' }); } }), X({ title: 'الخيارات', icon: 'i-sliders', go: function () { openSh({ t: 'wrs', opt: 1 }); } })] }));
  var items = [], flush = function (t) { if (items.length) bl.push(B('rows', { title: t || '', all: true, items: items })); items = []; }, cur = '';
  wrRows(D, { hd: true, ex: true, nx: true, kpi: true, bars: false, ext: true, wk: true, stk: true, mon: true, cmp: true, note: '' }).forEach(function (r) {
    if (r.k === 'verdict') bl.push(B('rows', { all: true, items: [X({ icon: 'i-alert', icTone: r.lvl === 0 ? 'ok' : r.lvl === 1 ? 'warn' : 'bad', title: r.l, sub: r.t })] }));
    else if (r.k === 'kpi') { bl.push(B('kpi', { items: r.t.slice(0, 2).map(function (z) { return X({ label: z[0], value: z[1], sub: z[2].d ? z[2].t + ' عن السابق' : '' }); }) })); r.t.slice(2).forEach(function (z) { items.push(X({ title: z[0], end: z[1] })); }); }
    else if (r.k === 'sec') { flush(cur); cur = r.t; }
    else if (r.k === 'row') items.push(X({ title: r.l, sub: r.s || '', end: r.v, endTone: wrTone(r.tone), total: !!r.tot }));
  });
  flush(cur);
  return bl;
}
function wrSheet(sh) {
  if (sh.t === 'wrp') {
    var f0 = fv('from') || wrRange().from, t0 = fv('to') || wrRange().to;
    return { title: 'فترة محددة', fields: [fDate('from', 'من يوم', '', today()), fDate('to', 'إلى يوم', '', today())], ft: { label: 'عرض', ok: f0 <= t0 && t0 <= today(), go: function () { shut(); wrSetRange(f0, t0); } } };
  }
  if (sh.t === 'wrs') {
    var R = wrRange(), o = wrOpt(), D = wrData(R.from, R.to), cv = wrCanvas(D, o), url = cv.toDataURL('image/png'), nm = fnName(['ملخص المتابعة', R.from, R.to], ''), ttl = 'ملخص المتابعة الأسبوعي';
    var fail = function (er) { if (!/cancel|dismiss/i.test(String((er && er.message) || er))) say('تعذّر فتح المشاركة'); };
    var grid = ['البنود'].concat(WR_BL.map(function (k) { return { label: k[1], tog: function () { return wrOpt()[k[0]]; }, set: function (v) { wrSetOpt(k[0], v ? '1' : '0'); } }; }));
    if (A.form.wn == null) A.form.wn = o.note; if (A.form.ww == null) A.form.ww = o.who;
    var wn = (fv('wn') || '').trim(), ww = (fv('ww') || '').trim();
    if (wn !== o.note || ww !== o.who) { S.settings.wrOpt = S.settings.wrOpt || {}; S.settings.wrOpt.note = wn; S.settings.wrOpt.who = ww; save(); }
    return { title: 'ملخص المتابعة', fields: [fPhotoView(url, true, true), fStateGrid(grid, [['1', 'مفعّل'], ['0', 'مطفأ']]), fText('ww', 'المرسَل إليه (يظهر في الزاوية)', 'المدير'), fArea('wn', 'ملاحظة في آخر الملخص (اختياري)', '')],
      acts: [X({ title: 'PDF', icon: 'i-doc', go: function () { deliverFile(nm + '.pdf', u8b64(pdfFromCanvas(cv)), 'application/pdf', ttl, '').catch(fail); } }),
        X({ title: 'تنزيل صورة', icon: 'i-download', go: function () { saveFile(nm + '.png', url.split(',')[1], 'image/png', ttl).then(function (r) { say(savedMsg(r, 'الصورة')); }, function () { say('تعذّر حفظ الصورة'); }); } }),
        X({ title: 'نسخ النص', icon: 'i-list', go: function () { copyText(wrText(D, o), 'نُسخ'); } })],
      ft: { label: 'مشاركة', ok: true, go: function () { deliverFile(nm + '.png', url.split(',')[1], 'image/png', ttl, '').catch(fail); } }, ft2: { label: 'رجوع', go: function () { shut(); } } };
  }
  return null;
}

/* ===== 02x-export.js ===== */
/* ---------- تصدير التقرير: صورة / PDF / مشاركة (يرسم «الورقة» نفسها بلا إنترنت) ---------- */
var EXW = 420, EXS = 4, FONT64 = null;
function paperNode() { return document.querySelector('[style*="box-shadow:0 1px 4px rgba(27,36,33,.16),0 0 0 1px"]'); }
function b64(buf) { var b = new Uint8Array(buf), s = '', i; for (i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }
function exFonts() {
  if (FONT64) return Promise.resolve(FONT64);
  var jobs = [];
  [400, 500, 600, 700].forEach(function (w) {
    ['arabic', 'latin'].forEach(function (sc) {
      jobs.push(fetch('fonts/ibm-plex-sans-arabic-' + sc + '-' + w + '-normal.woff2').then(function (r) { return r.ok ? r.arrayBuffer() : null; }).then(function (b) {
        return b ? "@font-face{font-family:'IBM Plex Sans Arabic';font-weight:" + w + ";src:url(data:font/woff2;base64," + b64(b) + ") format('woff2');" + (sc === 'arabic' ? 'unicode-range:U+0600-06FF,U+0750-077F,U+FB50-FDFF,U+FE70-FEFC,U+200C-200E' : 'unicode-range:U+0000-00FF,U+2000-206F,U+20AA,U+2212') + '}' : '';
      }).catch(function () { return ''; }));
    });
  });
  return Promise.all(jobs).then(function (a) { FONT64 = a.join(''); return FONT64; });
}
/* يُرسَل دائمًا «كما يُصدَّر»: ما كان «لي فقط» لا يخرج من الجهاز، مهما كان العرض على الشاشة */
function paperExportHtml(k) {
  var keep = A.rexp; A.rexp = true; render();
  var node = paperNode(), ser = node ? new XMLSerializer().serializeToString(node) : '';
  A.rexp = keep; render(); return ser;
}
function paperCanvas(k) {
  var raw = paperExportHtml(k); if (!raw) return Promise.reject(new Error('no paper'));
  return exFonts().then(function (css) {
    var ser = raw.replace(/<use\s+href="#([\w-]+)"\s*(?:\/>|><\/use>)/g, function (m, id) { var sy = document.getElementById(id); return sy ? sy.innerHTML : ''; });
    var html = '<div xmlns="http://www.w3.org/1999/xhtml" dir="rtl" style="width:' + EXW + 'px;padding:14px;background:#EEF0EC;font-family:\'IBM Plex Sans Arabic\',sans-serif;color:#1B2421;box-sizing:border-box">' + ser + '</div>';
    var tmp = document.createElement('div'); tmp.style.cssText = 'position:fixed;left:-9999px;top:0;width:' + EXW + 'px'; tmp.innerHTML = html.replace(' xmlns="http://www.w3.org/1999/xhtml"', ''); document.body.appendChild(tmp);
    var h = tmp.firstChild.offsetHeight; tmp.remove();
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + EXW + '" height="' + h + '"><foreignObject width="100%" height="100%"><style>' + css + '</style>' + html + '</foreignObject></svg>';
    var src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    /* الخطوط المضمَّنة داخل SVG تُفكّ ترميزها بعد onload، فأول رسم يخرج فارغًا أو بخط بديل (وكان الإرسال يعمل في المحاولة الثانية فقط).
       لذلك نحمّل الصورة مرة تسخينًا ونرسمها خارج الشاشة، ننتظر قليلًا، ثم نحمّلها ونرسمها فعليًا */
    var load = function () { return new Promise(function (ok2, bad2) { var im = new Image(); im.onload = function () { ok2(im); }; im.onerror = function () { bad2(new Error('render')); }; im.src = src; }); };
    var paint = function (im) {
      var es = Math.min(EXS, 14000 / h), c = document.createElement('canvas'); c.width = Math.round(EXW * es); c.height = Math.round(h * es);
      var x = c.getContext('2d'); x.fillStyle = '#EEF0EC'; x.fillRect(0, 0, c.width, c.height); x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, c.width, c.height);
      /* قصّ الفراغ السفلي: القياس خارج الشاشة قد يزيد عن الرسم الفعلي، فنقصّ عند آخر صف فيه محتوى ونترك هامشًا ثابتًا */
      try {
        var id = x.getImageData(0, 0, c.width, c.height).data, bg = [0xEE, 0xF0, 0xEC], row = c.height - 1, W4 = c.width * 4, found = false;
        for (; row > 0 && !found; row--) { for (var q = 0; q < W4; q += 16) { var o = row * W4 + q; if (Math.abs(id[o] - bg[0]) > 6 || Math.abs(id[o + 1] - bg[1]) > 6 || Math.abs(id[o + 2] - bg[2]) > 6) { found = true; break; } } }
        var nh = Math.min(c.height, row + 2 + Math.round(14 * es));
        if (found && nh < c.height) { var c2 = document.createElement('canvas'); c2.width = c.width; c2.height = nh; var x2 = c2.getContext('2d'); x2.fillStyle = '#EEF0EC'; x2.fillRect(0, 0, c2.width, nh); x2.drawImage(c, 0, 0); return c2; }
      } catch (e) {}
      return c;
    };
    return load().then(function (w1) { paint(w1); return new Promise(function (r) { setTimeout(r, 250); }); }).then(load).then(paint);
  });
}
/* PDF بصفحة واحدة مهما طال التقرير بقياس الورقة نفسها (لا A4 ولا هوامش) (المالك 2026-11-19) */
function pdfAssemble(pages, PW, PH, sc, w) { /* كاتب PDF المشترك: صفحات صور JPEG بقياس واحد */
  var M = 0;
  var objs = [], n = pages.length, off = [], out = '%PDF-1.4\n', i;
  function add(s) { objs.push(s); }
  add('<< /Type /Catalog /Pages 2 0 R >>');
  add('<< /Type /Pages /Kids [' + pages.map(function (_, k) { return (3 + k * 3) + ' 0 R'; }).join(' ') + '] /Count ' + n + ' >>');
  pages.forEach(function (pg, k) {
    var base = 3 + k * 3, dh = pg.h * sc, cs = 'q ' + w.toFixed(2) + ' 0 0 ' + dh.toFixed(2) + ' ' + M.toFixed(2) + ' ' + (PH - M - dh).toFixed(2) + ' cm /Im Do Q';
    add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PW + ' ' + PH + '] /Resources << /XObject << /Im ' + (base + 1) + ' 0 R >> >> /Contents ' + (base + 2) + ' 0 R >>');
    add({ img: pg });
    add('<< /Length ' + cs.length + ' >>\nstream\n' + cs + '\nendstream');
  });
  var parts = [out], len = out.length;
  objs.forEach(function (o, k) {
    off.push(len); var s;
    if (o && o.img) s = (k + 1) + ' 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + o.img.w + ' /Height ' + o.img.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + o.img.jpg.length + ' >>\nstream\n' + o.img.jpg + '\nendstream\nendobj\n';
    else s = (k + 1) + ' 0 obj\n' + o + '\nendobj\n';
    parts.push(s); len += s.length;
  });
  var xr = 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + off.map(function (o) { return ('0000000000' + o).slice(-10) + ' 00000 n \n'; }).join('') + 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + len + '\n%%EOF';
  parts.push(xr);
  var str = parts.join(''), u = new Uint8Array(str.length); for (i = 0; i < str.length; i++) u[i] = str.charCodeAt(i) & 255;
  return u;
}
function pdfFromCanvas(c) {
  var M = 0, sc = 1 / EXS, w = c.width * sc, PW = Math.round(w), PH = Math.round(c.height * sc), pages = []; /* الصفحة بقياس الورقة الأصلي (420 عرضًا) بلا هوامش ولا مقاس ثابت */
  if (PH > 14000) { sc = sc * 14000 / PH; w = c.width * sc; PW = Math.round(w); PH = 14000; } /* حد ارتفاع الصفحة في PDF */
  var p = document.createElement('canvas'); p.width = c.width; p.height = c.height;
  var px = p.getContext('2d'); px.fillStyle = '#fff'; px.fillRect(0, 0, p.width, p.height); px.drawImage(c, 0, 0);
  pages.push({ jpg: atob(p.toDataURL('image/jpeg', 0.92).split(',')[1]), w: p.width, h: p.height });
  return pdfAssemble(pages, PW, PH, sc, w);
}
/* PDF للطباعة: صفحات A4 تُقطع عند حدود الكتل فقط (جهة، يوم، تفصيل طبخة كاملًا)، فلا يُقطع جدول طبخة بين صفحتين وتبدأ الكتلة التالية صفحة جديدة؛ brk = مواضع بدء الكتل في اللوحة (المالك 2026-11-22) */
function pdfA4Pages(c) {
  var MX = 30, MY = 40, PWc = c.width + 2 * MX, PHc = Math.round(PWc * 842 / 595), room = PHc - 2 * MY, brk = (c.brk || []).slice().sort(function (a, b) { return a - b; }), cuts = [0], s = 0, pages = [], k;
  while (c.height - s > room) {
    var e = s + room, pick = 0; brk.forEach(function (b) { if (b > s + 40 && b <= e) pick = b; });
    s = pick || e; cuts.push(s);
  }
  cuts.push(c.height);
  for (k = 0; k + 1 < cuts.length; k++) {
    var p = document.createElement('canvas'); p.width = PWc; p.height = PHc; var px = p.getContext('2d');
    px.fillStyle = '#fff'; px.fillRect(0, 0, PWc, PHc); px.drawImage(c, 0, cuts[k], c.width, cuts[k + 1] - cuts[k], MX, MY, c.width, cuts[k + 1] - cuts[k]);
    px.fillStyle = '#8A948E'; px.font = "500 18px 'IBM Plex Sans Arabic', sans-serif"; px.textAlign = 'center'; px.fillText((k + 1) + ' / ' + (cuts.length - 1), PWc / 2, PHc - 14);
    pages.push({ jpg: atob(p.toDataURL('image/jpeg', 0.92).split(',')[1]), w: PWc, h: PHc });
  }
  return pdfAssemble(pages, 595, 842, 595 / PWc, 595);
}
function u8b64(u) { var s = '', i; for (i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
/* أسماء الملفات المنزَّلة أو المشاركة: مصدر واحد، النوع أولًا ثم الجهة/العامل ثم الفترة، بالعربية وبلا رموز ممنوعة؛ لا اسم عشوائي ولا «A4» (المالك 2026-11-23) */
function fnClean(s) { return String(s == null ? '' : s).replace(/[\\\/:*?"<>|\u0000-\u001f\u200e\u200f\u202a-\u202e]/g, ' ').replace(/\s+/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '').slice(0, 70); }
function fnName(parts, ext) { var b = parts.map(fnClean).filter(Boolean).join('-') || 'ملف'; return ext ? b + '.' + ext : b; }
function exName(k, ext) { return fnName(['تقرير', { cook: 'الاستهلاك', supply: 'التوريد', wck: 'نسخة-المراقب', stock: 'المخزون', wfp: 'مخزون-WFP', workers: 'العمال' }[k], today()], ext); }
/* يسلّم الملف: مشاركة على الجوال، وتنزيل في المتصفح */
/* تسليم ملف عبر قائمة المشاركة. الاسم المؤقت لاتيني فريد (الأسماء العربية المكرّرة في الكاش كانت تُظهر المعاينة فارغة في أول محاولة)، والنص لا يُترك فارغًا،
   وإن فشلت أول محاولة (غير الإلغاء) تُعاد تلقائيًا مرة بالرابط بدل المصفوفة */
var SHSEQ = 0;
function shareNameNative() { try { return vcmp(window.PKG_VER || '0.0.0', '1.0.162') >= 0; } catch (e) { return false; } }
/* الاسم الحقيقي يصل المستلم؛ التفرّد بمجلد مؤقت لكل مشاركة لا بتغيير الاسم. على APK أقدم من 1.0.162 تبقى الإضافة تحوّل الحروف العربية فيُستعمل اسم لاتيني مؤقت */
function shareTmpName(name) { var m = /\.([a-z0-9]{2,4})$/i.exec(name || ''); if (shareNameNative()) return fnClean(name) || ('file.' + (m ? m[1].toLowerCase() : 'png')); return 'kitchen-' + Date.now().toString(36) + (++SHSEQ) + '.' + (m ? m[1].toLowerCase() : 'png'); }
function shareCancelled(er) { return /cancel|dismiss/i.test(String((er && er.message) || er || '')); }
function shareNative() { try { return !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform() && Capacitor.isPluginAvailable && Capacitor.isPluginAvailable('KitchenShare') && Capacitor.Plugins && Capacitor.Plugins.KitchenShare); } catch (e) { return false; } }
function deliverFile(name, b64data, mime, title, text) {
  if (shareNative()) { /* إضافة أندرويد: منح إذن القراءة صراحةً فيصل المرفق إلى واتساب وغيره من أول مرة */
    return Capacitor.Plugins.KitchenShare.file({ name: shareTmpName(name), data: b64data, mime: mime, title: title || '', text: text || '' }).catch(function (er) {
      if (shareCancelled(er)) throw er; return deliverFilePlain(name, b64data, mime, title, text); });
  }
  return deliverFilePlain(name, b64data, mime, title, text);
}
function deliverFilePlain(name, b64data, mime, title, text) {
  if (P.Filesystem && P.Share) {
    var tmp = 'share-' + Date.now().toString(36) + (++SHSEQ) + '/' + (fnClean(name) || shareTmpName(name)), body = text || title || '';
    return P.Filesystem.writeFile({ path: tmp, data: b64data, directory: 'CACHE', recursive: true }).then(function (r) {
      return new Promise(function (ok) { setTimeout(ok, 120); }).then(function () {
        return P.Share.share({ title: title, text: body, files: [r.uri], dialogTitle: title }).catch(function (er) {
          if (shareCancelled(er)) throw er;
          return P.Share.share({ title: title, text: body, url: r.uri, dialogTitle: title });
        });
      });
    });
  }
  var a = document.createElement('a'); a.href = 'data:' + mime + ';base64,' + b64data; a.download = name; document.body.appendChild(a); a.click(); a.remove(); return Promise.resolve();
}
/* حفظ فعلي: الملف يُكتب في مجلد «المستندات» دون فتح أي تطبيق. إن تعذّر الكتابة نعود إلى المشاركة. يُرجع {where: 'docs'|'share'|'web'} */
function saveFile(name, b64data, mime, title) {
  if (P.Filesystem) {
    return P.Filesystem.writeFile({ path: 'مطبخ-عهد/' + name, data: b64data, directory: 'DOCUMENTS', recursive: true }).then(function () { return { where: 'docs', name: name }; }, function () { return deliverFile(name, b64data, mime, title).then(function () { return { where: 'share' }; }); });
  }
  return deliverFile(name, b64data, mime, title).then(function () { return { where: 'web' }; });
}
function savedMsg(r, what) { return r && r.where === 'docs' ? 'حُفظت ' + what + ' في المستندات ← مطبخ-عهد' : 'جُهّزت ' + what; }
var EXBUSY = false;
function exportReport(k, how) {
  if (EXBUSY) return; EXBUSY = true; say('جارٍ تجهيز التقرير…');
  var done = function () { EXBUSY = false; }, fail = function () { done(); say('تعذّر تجهيز التقرير'); };
  paperCanvas(k).then(function (c) {
    var title = rptName(k);
    if (how === 'sharepdf') return deliverFile(exName(k, 'pdf'), u8b64(pdfFromCanvas(c)), 'application/pdf', title, shortText(k)).then(function () { done(); say('جُهّز «' + title + '» كملف PDF'); });
    if (how === 'pdf') return saveFile(exName(k, 'pdf'), u8b64(pdfFromCanvas(c)), 'application/pdf', title).then(function (r) { done(); say(savedMsg(r, 'ملف PDF لـ«' + title + '»')); });
    /* «مشاركة» تفتح قائمة النظام مباشرة بالصورة (حركة واحدة)، و«تنزيل صورة» تحفظها في المستندات بلا معاينة وسيطة */
    if (how === 'share') return deliverFile(exName(k, 'png'), c.toDataURL('image/png').split(',')[1], 'image/png', title, shortText(k)).then(function () { done(); });
    return saveFile(exName(k, 'png'), c.toDataURL('image/png').split(',')[1], 'image/png', title).then(function (r) { done(); say(savedMsg(r, 'صورة «' + title + '»')); });
  }).catch(function (e) { if (e && /cancel|dismiss/i.test(String(e.message || e))) { done(); return; } fail(); });
}
function shortText(k) { var d = repDoc(k, true); return d.title + ' — ' + d.date + (d.lead ? '\n' + d.lead : '') + (d.leadX ? '\n' + d.leadX : ''); }

/* ===== 02x-kdet.js ===== */
/* ---------- تفاصيل أسطر الملخص: كل رقم ملخّص يُنقر فيفتح ما وراءه ---------- */
function kGo(sh, form) { return function () { openSh(sh, form || {}); }; }
function kdetSheet(sh) {
  var rows, td = today();
  switch (sh.t) {
    case 'kAtt': {
      var g = {}, order = [];
      activeW().forEach(function (w) { var a = wAtt(w), st = a ? stat(a.st) : null, k = st ? st.name : 'لم يُسجَّل'; if (!g[k]) { g[k] = { n: k, tone: st ? st.tone : 'mute', w: [] }; order.push(k); } g[k].w.push(w.name); });
      rows = order.map(function (k) { var x = g[k]; return X({ title: x.n, sub: x.w.join('، '), tag: String(x.w.length), tagTone: x.tone, chev: true, go: function () { shut(); setState({ page: 'main', tab: 'workers', wmode: 'att' }); } }); });
      return { title: 'حضور اليوم', sub: dlong(td), rows: rows, empty: 'لا عمال' };
    }
    case 'kOweW': {
      var ws = activeW().filter(function (w) { return wBal(w) > 0; }).sort(function (a, b) { return wBal(b) - wBal(a); });
      rows = ws.map(function (w) { return X({ title: w.name, sub: 'آخر دفعة: ' + wLastPay(w), end: balTxt(wBal(w)), endTone: 'warn', chev: true, go: function () { shut(); open('worker', { wid: w.id }); }, lp: function () { wQa(w); } }); });
      return { title: 'مستحق للعمال', sub: money(oweWork()) + ' · ' + pl(ws.length, 'عامل واحد', 'عاملان', 'عمال'), rows: rows, empty: 'لا مستحقات على العمال' };
    }
    case 'kOweI': {
      var is = S.insts.filter(function (i) { return !i.arch && iniAcct(i).due > 0; }).sort(function (a, b) { return iniAcct(b).due - iniAcct(a).due; });
      rows = is.map(function (i) { return X({ title: i.name, sub: 'كشف الحساب', end: money(iniAcct(i).due), endTone: 'ok', chev: true, go: function () { openSh({ t: 'stmt', id: i.id }, { m: '' }); }, lp: function () { instQa(i, !!i.init); } }); });
      return { title: 'مستحق لك من المؤسسات', sub: money(oweInst()), rows: rows, empty: 'لا مستحقات على المؤسسات' };
    }
    case 'kCal': {
      var isT = function (o) { return o.e.kind !== 'event'; }, ev = function (a, b) { return calOccs(a, b).filter(function (o) { return o.e.kind === 'event'; }); }, T0 = { t: ['اليوم: لم تُنجز', calOccs(0, 0).filter(function (o) { return !o.done && isT(o); })], w: ['خلال 7 أيام', calOccs(0, 6).filter(function (o) { return !o.done && isT(o); })], l: ['متأخرة', calOccs(-45, -1).filter(function (o) { return !o.done && !o.auto && isT(o); })], ea: ['أحداث قادمة (30 يومًا)', ev(0, 30)], et: ['أحداث اليوم', ev(0, 0)], ep: ['أحداث جرت (آخر 30 يومًا)', ev(-30, -1)] }[sh.k];
      return { title: T0[0], sub: pl(T0[1].length, 'بند واحد', 'بندان', 'بنود'), rows: T0[1].map(calRow), empty: 'لا شيء هنا' };
    }
    case 'kAst': {
      rows = assetAttention().map(function (a) { var st = a.bad > 0 ? ['معطّل ' + fmt(a.bad), 'warn'] : ['يلزم جرد', 'info']; return X({ icon: aIcon(a.cat), icTone: a.bad > 0 ? 'warn' : 'mute', title: a.name, sub: aTxt(a) + ' · ' + a.loc, tag: st[0], tagTone: st[1], chev: true, go: function () { openSh({ t: 'asset', id: a.id }); }, lp: function () { assetQa(a); } }); });
      return { title: 'موجودات تحتاج انتباه', sub: pl(rows.length, 'موجود واحد', 'موجودان', 'موجودات'), rows: rows, empty: 'لا شيء يحتاج انتباهك' };
    }
    case 'kAstT': case 'kAstP': {
      var as = AA().filter(function (a) { return sh.t === 'kAstT' || aTot(a) > 0; }).sort(function (a, b) { return sh.t === 'kAstP' ? aTot(b) - aTot(a) : a.name.localeCompare(b.name, 'ar'); });
      rows = as.map(function (a) { return X({ icon: aIcon(a.cat), icTone: a.bad > 0 ? 'warn' : 'mute', title: a.name, sub: sh.t === 'kAstT' ? a.cat + ' · ' + a.loc : aTxt(a) + ' · ' + a.loc, end: sh.t === 'kAstP' ? fmt(aTot(a)) : aTxt(a), chev: true, go: function () { openSh({ t: 'asset', id: a.id }); }, lp: function () { assetQa(a); } }); });
      return { title: sh.t === 'kAstT' ? 'أنواع الموجودات' : 'القطع حسب النوع', sub: pl(as.length, 'نوع واحد', 'نوعان', 'أنواع'), rows: rows, empty: 'لا موجودات مسجّلة' };
    }
    case 'kSupI': {
      var tot = {}, ord = [];
      supplies().filter(function (d) { return d.done === 'approved'; }).forEach(function (d) { d.lines.forEach(function (l) { var k = l.item || l.raw; if (!tot[k]) { tot[k] = { it: item(l.item), raw: l.raw, q: 0, n: 0 }; ord.push(k); } tot[k].q += l.qty || 0; tot[k].n++; }); });
      rows = ord.sort(function (a, b) { return (isSpiceIt(tot[a].it && tot[a].it.id) - isSpiceIt(tot[b].it && tot[b].it.id)) || (tot[b].q - tot[a].q); }).map(function (k) { var x = tot[k]; return X({ title: x.it ? x.it.name : x.raw, sub: pl(x.n, 'توريدة واحدة', 'توريدتان', 'توريدات'), end: fmt(r2(x.q)) + ' ' + (x.it ? x.it.unit : ''), endSub2: x.it ? packTxt(x.it, x.q) : '' }); });
      return { title: 'أصناف كل التوريدات', sub: 'مجموع ما وُرِّد من كل صنف', rows: rows, empty: 'لا توريدات معتمدة بعد' };
    }
    case 'kSup': {
      var sp = supplies().filter(function (d) { return d.done === 'approved'; });
      rows = sp.map(function (d) { return X({ icon: 'i-truck', icTone: 'ok', title: supTitle(d), sub: dlabel(d.date) + ' · ' + pl(d.lines.length, 'صنف واحد', 'صنفان', 'أصناف'), chev: true, go: function () { shut(); open('supply', { sid: d.id }); }, lp: function () { supplyQa(d); } }); });
      return { title: 'التوريدات المعتمدة', sub: pl(sp.length, 'توريدة واحدة', 'توريدتان', 'توريدات'), rows: rows, empty: 'لا توريدات معتمدة بعد' };
    }
    case 'kWarn': case 'kVal': {
      var l0 = A.led, L = led(l0) || led('kitchen'), rs = itemsIn(l0).map(function (it) { var q = E.balance(S, l0, it.id); return { it: it, q: q, st: stStatus(q, it.id) }; });
      if (sh.t === 'kWarn') {
        rs = rs.filter(function (r) { return alertable(L, r.it, r.q) && r.st.rank <= 2; }).sort(function (a, b) { return a.st.rank - b.st.rank || a.st.days - b.st.days; });
        rows = rs.map(function (r) { return X({ title: r.it.name, sub: r.q > 0 ? 'يكفي ' + daysTxt(r.st.days) : r.q < 0 ? 'ناقص ' + fmt(-r.q) + ' ' + r.it.unit : 'لا يوجد رصيد', tag: r.st.t, tagTone: r.st.tone, end: fmt(r.q) + ' ' + r.it.unit, endSub2: packTxt(r.it, r.q), chev: true, go: function () { openSh({ t: 'item', id: r.it.id }); }, lp: function () { stockQa(r.it, 'kitchen', r.q); } }); });
        return { title: 'أصناف تحتاج انتباه', sub: L.name, rows: rows, empty: 'لا شيء يحتاج انتباهك' };
      }
      rs = rs.filter(function (r) { return r.q > 0 && r.it.price > 0; }).sort(function (a, b) { return b.q * b.it.price - a.q * a.it.price; });
      var tot = rs.reduce(function (a, r) { return a + r.q * r.it.price; }, 0);
      rows = rs.slice(0, 25).map(function (r) { return X({ title: r.it.name, sub: fmt(r.q) + ' ' + r.it.unit + ' × ' + money(r.it.price), end: money(r2(r.q * r.it.price)), chev: true, go: function () { openSh({ t: 'item', id: r.it.id }); }, lp: function () { stockQa(r.it, 'kitchen', r.q); } }); });
      return { title: 'قيمة المخزن التقديرية', sub: L.name + ' · ' + money(r2(tot)), rows: rows, empty: 'لا أصناف مسعّرة' };
    }
  }
  return null;
}

/* ===== 02y-wstmt.js ===== */
/* ---------- كشف حساب العامل: صورة للإرسال (واتساب) أو الحفظ أو نص ----------
   يُبنى من حركات العامل نفسها: يوميات الحضور، المكافآت، الخصومات (مخالفات ومسحوبات وغيرها)، الدفعات والسلف.
   عهدة المطبخ التي بحوزة العامل ليست من مستحقاته، فلا تدخل في الكشف. */
function wstNext(d) { var t = new Date(d + 'T12:00:00'); t.setDate(t.getDate() + 1); return t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2); }
/* كشف عن فترة محددة (من يوم إلى يوم). opt.sum: إظهار ملخص الإجماليات، opt.det: إظهار حركات المكافآت والخصومات داخل الأيام */
function isSettleE(e) { return e.kind === 'pay' && (e.note === 'دفع الأسبوع' || e.note === 'تسوية الأسبوع'); }
function wstDoc(w, from, to, opt) {
  opt = opt || {}; var nx = wstNext(to), showSum = opt.sum !== false, showDet = opt.det !== false, last = {}, by = {};
  (S.att || []).forEach(function (a) { if (a.w === w.id && a.date >= from && a.date <= to) last[a.date] = a; });
  var days = Object.keys(last).sort().map(function (k) { return last[k]; });
  var es = wlOn().filter(function (e) { return e.w === w.id && e.kind !== 'open' && e.cat !== 'adjw' && e.date >= from && e.date <= to; }).sort(function (x, y) { return x.date < y.date ? -1 : x.date > y.date ? 1 : x.ts - y.ts; });
  /* دفعة «دفع الأسبوع» التي أُلغيت لها قيد عكسي («إلغاء دفعة: …»): الاثنان يُحذفان معًا من الكشف لأنهما يلغيان بعضهما، ولا تُحسب في الشريط الختامي */
  es.filter(function (r) { return r.kind === 'add' && /^إلغاء دفعة:.*(تسوية|دفع) الأسبوع/.test(r.note || ''); }).forEach(function (r) {
    var o = es.filter(function (e) { return isSettleE(e) && e.amt === r.amt; })[0]; if (o) es = es.filter(function (x) { return x !== o && x !== r; });
  });
  es.forEach(function (e) { var c = wCat(e); (by[c] = by[c] || []).push(e); });
  var sum = function (a) { return r2((a || []).reduce(function (t, e) { return t + (e.amt || 0); }, 0)); };
  var bon = sum(by.bonus), rev = sum(by.rev), pay = r2(sum(by.pay) + sum(by.adv)), ded = r2(sum(by.viol) + sum(by.buy) + sum(by.ded)), close = wBalBefore(w, nx);
  var d = { name: w.name, sub: 'كشف حساب', date: from === to ? dlong(from) : 'من ' + dlong(from) + ' إلى ' + dlong(to), days: [], sums: [], bal: close };
  if (showSum) {
    if (bon) d.sums.push({ l: 'الإضافات', v: '+ ' + money(bon), tone: 'info' });
    if (rev) d.sums.push({ l: 'تصحيحات', v: '+ ' + money(rev), tone: 'mute' });
    if (ded) d.sums.push({ l: 'الخصومات', v: '− ' + money(ded), tone: 'bad' });
    if (pay) d.sums.push({ l: 'الدفعات والسلف', v: '− ' + money(pay), tone: 'mute' });
  }
  /* جدول واحد: لكل يوم صف (التاريخ + غمامة الحالة + المبلغ) وتحته حركاته ملاصقة (ملاحظة + غمامة + مبلغ) كما في صفحة العامل */
  var neg = { viol: 1, buy: 1, ded: 1, pay: 1, adv: 1 }, hid = { bonus: 1, rev: 1, viol: 1, buy: 1, ded: 1 }, dm = {};
  days.forEach(function (x) { (dm[x.date] = dm[x.date] || { es: [] }).att = x; });
  /* دفعة «دفع الأسبوع» ليست حركة عادية: تظهر في الشريط الأخضر الختامي بجانب «خالص» لا كصف بين الأيام */
  var stl = es.filter(isSettleE); if (stl.length) d.settle = { l: 'تم الدفع', v: money(sum(stl)) };
  es.forEach(function (e) { if (isSettleE(e) || (!showDet && hid[wCat(e)])) return; (dm[e.date] = dm[e.date] || { es: [] }).es.push(e); });
  d.days = Object.keys(dm).sort().map(function (k) {
    var g = dm[k], sx = g.att ? (stat(g.att.st) || { name: g.att.st, tone: 'mute' }) : null, am = g.att ? E.attAmt(g.att) : 0;
    return { title: dlong(k).replace(/ \d{4}$/, ''), pill: sx ? sx.name : '', pillTone: sx ? sx.tone : 'mute', a: sx && g.att.st !== 'h' ? money(am) : '', tone: '',
      rows: g.es.map(function (e) { var c = wCat(e), n = !!neg[c]; return { note: e.note && e.note !== WCAT[c][0] ? e.note : '', pill: WCAT[c][0], pillTone: wPlusC(c) || c === 'kbuy' ? 'info' : c === 'viol' || c === 'buy' || c === 'ded' ? 'bad' : c === 'rev' ? 'ok' : 'mute', a: e.amt ? (n ? '− ' : '+ ') + money(e.amt) : 'تنبيه فقط', tone: e.amt ? (wPlusC(c) || c === 'kbuy' ? 'info' : c === 'viol' || c === 'buy' || c === 'ded' ? 'bad' : c === 'rev' ? 'ok' : '') : '' }; }) };
  });
  d.closeL = to === today() ? 'الرصيد حتى اليوم' : 'الرصيد حتى ' + dlabel(to); d.closeV = balTxtTo(close); d.closeTone = balTone(close);
  return d;
}
function wstText(d) {
  var L = [d.sub + ' — ' + d.name, d.date, ''];
  d.sums.forEach(function (x) { L.push(x.l + ': ' + x.v + (x.sub ? ' (' + x.sub + ')' : '')); });
  L.push(''); d.days.forEach(function (g) { L.push(g.title + (g.pill ? ' · ' + g.pill : '') + (g.a ? ' ' + g.a : '')); g.rows.forEach(function (r) { L.push('   ' + r.pill + (r.note ? ' · ' + r.note : '') + ' ' + r.a); }); });
  L.push('', d.settle ? d.settle.l + ' ' + d.settle.v + ' · ' + d.closeV : d.closeL + ': ' + d.closeV);
  return L.join('\n');
}
var WST_COL = { ok: '#14563A', bad: '#B3261E', mute: '#5B6660', info: '#243C8F', warn: '#B54708' };
function wstCanvas(d) {
  var W = 840, PAD = 36, F = "'IBM Plex Sans Arabic', sans-serif", hdr = 130, RH = 54, RS = 58, i, H;
  H = hdr + 20 + d.sums.reduce(function (a, x) { return a + RH + (x.sub ? 26 : 0); }, 0) + 24 + d.days.reduce(function (a, g) { return a + 64 + g.rows.length * 50 + (g.rows.length ? 12 : 0); }, 0) + 120;
  var c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d'); x.direction = 'rtl';
  var fit = function (t, w, px, wt) { var z = px; x.font = wt + ' ' + z + 'px ' + F; while (z > 18 && x.measureText(t).width > w) { z -= 2; x.font = wt + ' ' + z + 'px ' + F; } };
  x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, W, H); x.fillStyle = '#14563A'; x.fillRect(0, 0, W, hdr);
  x.fillStyle = '#FFFFFF'; x.textAlign = 'right'; fit(d.name, W - 2 * PAD, 40, 700); x.fillText(d.name, W - PAD, 62); fit(d.sub + ' · ' + d.date, W - 2 * PAD, 25, 500); x.fillText(d.sub + ' · ' + d.date, W - PAD, 104);
  var y = hdr + 20;
  d.sums.forEach(function (s, k) {
    var h = RH + (s.sub ? 26 : 0); if (k % 2 === 0) { x.fillStyle = '#F4F6F2'; x.fillRect(0, y, W, h); }
    x.fillStyle = '#1B2421'; x.textAlign = 'right'; fit(s.l, W - 2 * PAD - 220, 26, 600); x.fillText(s.l, W - PAD, y + 36);
    x.textAlign = 'left'; x.fillStyle = WST_COL[s.tone] || '#1B2421'; x.font = '700 28px ' + F; x.fillText(s.v, PAD, y + 37);
    if (s.sub) { x.textAlign = 'right'; x.fillStyle = '#5B6660'; fit(s.sub, W - 2 * PAD, 21, 500); x.fillText(s.sub, W - PAD, y + 62); }
    y += h;
  });
  y += 24;
  var PC = { ok: ['#DFF1E7', '#14563A'], warn: ['#FFF1D6', '#6B3F00'], bad: ['#FDE7E4', '#8E1B10'], info: ['#E6EBFA', '#243C8F'], mute: ['#ECEEEA', '#46504B'] };
  var pill = function (txt, tone, xl, yc) { var c = PC[tone] || PC.mute, w2; x.font = '500 20px ' + F; w2 = x.measureText(txt).width + 28; x.fillStyle = c[0]; x.beginPath(); if (x.roundRect) x.roundRect(xl, yc - 17, w2, 34, 17); else x.rect(xl, yc - 17, w2, 34); x.fill(); x.fillStyle = c[1]; x.textAlign = 'center'; x.fillText(txt, xl + w2 / 2, yc + 7); return w2; };
  d.days.forEach(function (g, gi) {
    var hh = g.rows.length ? 56 : 64; if (gi) { x.fillStyle = '#E6E9E4'; x.fillRect(PAD, y, W - 2 * PAD, 2); }
    x.fillStyle = '#1B2421'; x.textAlign = 'right'; x.font = '500 27px ' + F; x.fillText(g.title, W - PAD, y + 40);
    var xl = PAD; if (g.a) { x.textAlign = 'left'; x.font = '500 27px ' + F; x.fillStyle = '#1B2421'; x.fillText(g.a, PAD, y + 40); xl = PAD + x.measureText(g.a).width + 18; }
    if (g.pill) pill(g.pill, g.pillTone, xl, y + 30);
    y += hh;
    g.rows.forEach(function (r) {
      var xl2 = PAD, col = PC[r.tone] ? PC[r.tone][1] : '#1B2421';
      x.textAlign = 'left'; x.font = '500 25px ' + F; x.fillStyle = col; x.fillText(r.a, PAD, y + 34); xl2 = PAD + x.measureText(r.a).width + 18;
      var pw = pill(r.pill, r.pillTone, xl2, y + 25);
      if (r.note) { x.textAlign = 'left'; x.fillStyle = '#5B6660'; fit(r.note, W - xl2 - pw - 16 - PAD - 120, 22, 400); x.fillText(r.note, xl2 + pw + 16, y + 33); }
      y += 50;
    });
    y += g.rows.length ? 12 : 0;
  });
  var cc = d.closeTone === 'bad' ? '#B3261E' : d.closeTone === 'ok' ? '#14563A' : '#5B6660';
  x.fillStyle = cc; x.fillRect(0, y, W, 84); x.fillStyle = '#FFFFFF'; x.textAlign = 'right'; x.font = '600 28px ' + F; x.fillText(d.settle ? d.settle.l : d.closeL, W - PAD, y + 52); x.textAlign = 'left'; x.font = '700 34px ' + F; x.fillText(d.settle ? d.settle.v + ' · ' + d.closeV : d.closeV, PAD, y + 54);
  x.fillStyle = '#8A948E'; x.textAlign = 'center'; x.font = '500 20px ' + F; x.fillText('مطبخ عهد', W / 2, H - 20);
  return c;
}
/* how: share (صورة + عنوان للواتساب) | png | pdf | txt */
function wstSend(w, o, how) {
  var d = wstDoc(w, o.from, o.to, o), ym = o.from + '_' + o.to;
  if (how === 'txt') { copyText(wstText(d), 'نُسخ كشف ' + w.name); return; }
  var ttl = d.sub + ' — ' + w.name, nm = fnName(['كشف-عامل', w.name, ym], '');
  if (how !== 'pdf') { imgPreview(function () { return wstCanvas(d); }, nm + '.png', ttl, ttl + '\n' + d.closeL + ': ' + d.closeV); return; }
  say('جارٍ تجهيز الكشف…');
  var go = function () {
    try { saveFile(nm + '.pdf', u8b64(pdfFromCanvas(wstCanvas(d))), 'application/pdf', ttl).then(function (r) { say(savedMsg(r, 'ملف PDF')); }).catch(function (e) { if (!(e && /cancel|dismiss/i.test(String(e.message || e)))) say('تعذّر تجهيز الكشف'); }); }
    catch (e) { say('تعذّر تجهيز الكشف'); }
  };
  if (document.fonts && document.fonts.load) document.fonts.load("700 28px 'IBM Plex Sans Arabic'").then(go, go); else go();
}
/* «هذا الأسبوع»: من آخر جمعة (اليوم إن كان جمعة) حتى اليوم؛ والاختيار الحر من/إلى يبقى (المالك 2026-11-25) */
function wstWeekFrom() { var d = new Date(today() + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - (d.getUTCDay() - 5 + 7) % 7); return d.toISOString().slice(0, 10); }
function wstOpen(w) { openSh({ t: 'wst', wid: w.id }, { from: wstWeekFrom(), to: today(), sum: '0', det: '1' }); }
function wstOpts() { var f = fv('from') || wstWeekFrom(), t = fv('to') || today(); if (t > today()) t = today(); if (f > t) f = t; return { from: f, to: t, sum: fv('sum') === '1', det: fv('det') !== '0' }; }
function wstSheet(sh) {
  if (sh.t !== 'wst') return null;
  var w = wk(sh.wid); if (!fv('from')) A.form.from = wstWeekFrom(); if (!fv('to')) A.form.to = today(); if (!fv('sum')) A.form.sum = '0'; if (!fv('det')) A.form.det = '1';
  var o = wstOpts(), d = wstDoc(w, o.from, o.to, o);
  return { title: 'كشف ' + w.name, sub: 'اختر الفترة وما يظهر في الكشف',
    fields: [fPhotoView(wstCanvas(d).toDataURL('image/png'), true, true), fDate('from', 'من يوم', '', today()), fDate('to', 'إلى يوم', '', today()),
      fStateGrid(['ما يظهر في الكشف', ['sum', 'ملخص الإجماليات في الأعلى'], ['det', 'حركات المكافآت والخصومات بتواريخها']], [['1', 'إظهار'], ['0', 'إخفاء']])],
    acts: [X({ title: 'تنزيل صورة', icon: 'i-download', go: function () { wstSend(w, o, 'png'); } }), X({ title: 'تنزيل PDF', icon: 'i-download', go: function () { wstSend(w, o, 'pdf'); } }), X({ title: 'نسخ النص', icon: 'i-list', go: function () { wstSend(w, o, 'txt'); } })],
    ft: { label: 'مشاركة', ok: true, go: function () { shut(); wstSend(w, o, 'share'); } } };
}

/* ===== 02z-sms.js ===== */
/* ---------- رسائل المخيمات الصباحية (SMS) ----------
   مخيمات اليوم: كل مخيم له طعام اليوم (طبخات اليوم أو توزيع اليوم أو خطة اليوم غير المنفّذة) وله مندوب ورقم.
   النص قالب يعدّله المالك متى شاء (الإعدادات)، ويُرسَل من التطبيق مباشرة عبر إضافة أندرويد (تحتاج APK 0.9.96 فأحدث)،
   وفي غير ذلك تُفتح الرسالة جاهزة في تطبيق الرسائل. علامة «أُرسلت» تُحفظ لليوم فلا تتكرر رسالة المخيم نفسه. */
/* حالة الإرسال المشتركة (المخيمات والعمال): run = إرسال جارٍ فلا يبدأ ثانٍ فوقه، all/ids = المستلمون في نافذة التأكيد (المالك 2026-11-24: «أي ضغطة بتنتشر الرسائل حتى لو أخطأت») */
var SMSX = { run: false, kind: '', all: [], ids: [] };
var SMS_TPL = 'صباح الخير {المندوب}، طعام اليوم لمخيم {المخيم}: {الأصناف}. الاستلام {الوقت} {المكان}. شكرًا.';
function smsCfg() { var c = (S.settings.campSms = S.settings.campSms || {}); if (c.tpl == null) c.tpl = SMS_TPL; if (c.time == null) c.time = ''; if (c.place == null) c.place = ''; return c; }
function smsNative() { try { return !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform() && Capacitor.isPluginAvailable && Capacitor.isPluginAvailable('KitchenSms') && vcmp(window.PKG_VER || '0.0.0', '0.9.96') >= 0); } catch (e) { return false; } }
function smsNum(v) { return String(v || '').replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 1632); }).replace(/[^0-9+]/g, ''); }
function campsToday() {
  var td = today(), m = {}, ord = [];
  var add = function (id, dish, pots) { if (!(pots > 0)) return; if (!m[id]) { m[id] = { g: E.by(S.bens || [], id), d: {} }; ord.push(id); } m[id].d[dish] = r2((m[id].d[dish] || 0) + pots); };
  dayBatches('private').forEach(function (b) { Object.keys(b.dist || {}).forEach(function (k) { add(k, batchName(b), b.dist[k]); }); });
  dayDist().forEach(function (x) { add(x.ben, x.dish ? (rec(x.dish) || {}).name : 'طعام', x.pots); });
  plans().filter(function (p) { return p.date === td && (p.kind || 'private') === 'private'; }).forEach(function (p) { Object.keys(p.dist || {}).forEach(function (k) { add(k, (rec(p.recipeId) || {}).name || 'طعام', p.dist[k]); }); });
  return ord.filter(function (id) { return m[id].g && !m[id].g.arch; }).map(function (id) { return { g: m[id].g, dishes: Object.keys(m[id].d).map(function (n) { return n + ' ' + pl(m[id].d[n], 'قدر واحد', '2 قدر', 'قدور'); }).join('، ') }; });
}
function smsText(c, tpl) {
  var cf = smsCfg(), g = c.g;
  var t = String(tpl != null ? tpl : cf.tpl).replace(/\{المخيم\}/g, g.name || '').replace(/\{المندوب\}/g, g.rep || '').replace(/\{الأصناف\}/g, c.dishes).replace(/\{الوقت\}/g, cf.time || '').replace(/\{المكان\}/g, cf.place || '');
  if (!cf.time && !cf.place) t = t.replace(/الاستلام\s*\./g, '');
  return t.replace(/[ \t]{2,}/g, ' ').replace(/ ([.،])/g, '$1').trim();
}
function smsSent(id) { var s = S.settings.campSent; return !!(s && s.d === today() && s.ids && s.ids[id]); }
function smsMark(id) { var s = S.settings.campSent; if (!s || s.d !== today()) s = S.settings.campSent = { d: today(), ids: {} }; s.ids[id] = Date.now(); save(); }
function smsSendOne(c, tpl) {
  var n = smsNum(c.g.phone), tx = smsText(c, tpl);
  if (!n) { say('لا رقم لمندوب ' + c.g.name); return Promise.resolve(false); }
  if (smsNative()) return Capacitor.Plugins.KitchenSms.send({ to: n, body: tx }).then(function () { smsMark(c.g.id); return true; }).catch(function (e) { say('تعذّر الإرسال لـ ' + c.g.name + (e && e.message === 'denied' ? ': لم يُمنح إذن الرسائل' : '')); return false; });
  window.location.href = 'sms:' + n + '?body=' + encodeURIComponent(tx); smsMark(c.g.id); return Promise.resolve(true);
}
var CSMS = { sel: null };
/* المحدَّدون: الافتراضي كل مخيم له رقم ولم تُرسَل له رسالة اليوم؛ الضغط على صف يبدّل تحديده، فيمكن الإرسال لمخيم واحد أو اثنين (المالك 2026-11-22: «كيف بدي أرسل لواحد فيهم أو اثنين») */
function smsPicked() { var cs = campsToday().filter(function (c) { return smsNum(c.g.phone); }); return CSMS.sel == null ? cs.filter(function (c) { return !smsSent(c.g.id); }) : cs.filter(function (c) { return CSMS.sel.indexOf(c.g.id) >= 0; }); }
function smsSendList(todo, tpl) {
  var ok = 0, bad = 0;
  if (!todo.length) { say('اختر مخيمًا واحدًا على الأقل'); return; }
  if (SMSX.run) { say('جارٍ إرسال رسائل سابقة، انتظر'); return; }
  SMSX.run = true; audit('رسائل المخيمات إلى ' + pl(todo.length, 'مخيم واحد', '2 مخيم', 'مخيمات') + ': ' + String(tpl != null ? tpl : smsCfg().tpl).slice(0, 60)); save();
  shut(); say('جارٍ إرسال ' + pl(todo.length, 'رسالة واحدة', '2 رسالة', 'رسائل') + '…');
  var i = 0, step = function () {
    if (i >= todo.length) { SMSX.run = false; say(smsNative() ? 'أُرسلت ' + ok + (bad ? ' · تعذّرت ' + bad : '') : 'فُتحت الرسالة جاهزة في تطبيق الرسائل'); render(); return; }
    var c = todo[i++]; smsSendOne(c, tpl).then(function (r) { if (r) ok++; else bad++; setTimeout(step, 1200); });
  }; step();
}
function smsSheet(sh) {
  if (sh.t === 'campSms') {
    var cs = campsToday(), nat = smsNative(), picked = smsPicked(), withNum = cs.filter(function (c) { return smsNum(c.g.phone); }), allOn = withNum.length > 0 && picked.length === withNum.length;
    var setSel = function (a) { CSMS.sel = a; render(); };
    return { title: 'رسائل المخيمات', sub: cs.length ? pl(cs.length, 'مخيم واحد له طعام اليوم', '2 مخيم لهما طعام اليوم', 'مخيمات لها طعام اليوم') + ' · اضغط مخيمًا لتحديده أو إلغائه' : 'لا مخيمات لها طعام اليوم',
      acts: [X({ title: allOn ? 'إلغاء التحديد' : 'تحديد الكل', icon: 'i-check', go: function () { setSel(allOn ? [] : withNum.map(function (c) { return c.g.id; })); } }), X({ title: 'نص الرسالة', icon: 'i-pencil', go: function () { var c = smsCfg(); openSh({ t: 'campTpl' }, { tpl: c.tpl, time: c.time, place: c.place }); } })],
      rows: cs.map(function (c) { var n = smsNum(c.g.phone), sent = smsSent(c.g.id), on = picked.some(function (p) { return p.g.id === c.g.id; });
        return X({ icon: 'i-users', icTone: sent ? 'ok' : n ? 'info' : 'warn', title: c.g.name, sub: (c.g.rep ? c.g.rep + ' · ' : '') + (n ? c.g.phone : 'بلا رقم') + ' · ' + c.dishes, tag: sent ? 'أُرسلت' : n ? '' : 'بلا رقم', tagTone: sent ? 'ok' : 'warn', sel: !!n && on,
          go: function () { if (!n) { openSh({ t: 'campOne', id: c.g.id }); return; } var base = CSMS.sel == null ? picked.map(function (p) { return p.g.id; }) : CSMS.sel.slice(); setSel(on ? base.filter(function (x) { return x !== c.g.id; }) : base.concat([c.g.id])); },
          lp: function () { openSh({ t: 'campOne', id: c.g.id }); } }); }),
      empty: 'وزّع القدور على المخيمات أو خطّط لها أولًا',
      note: nat ? { text: 'الضغطة المطوّلة على مخيم تعرض رسالته وحده.', tone: 'info' } : { text: 'الإرسال التلقائي يحتاج النسخة الجديدة من التطبيق (APK). حتى ذلك الحين يفتح كل مخيم تطبيق الرسائل بالنص جاهزًا.', tone: 'info' },
      ft: { label: picked.length ? (nat ? 'إرسال للمحدد (' + picked.length + ')' : 'الإرسال التلقائي يحتاج APK') : 'اختر مخيمًا', ok: nat && picked.length > 0, go: function () { smsConfirm('camp', picked.map(function (p) { return p.g.id; }), smsCfg().tpl); } } };
  }
  if (sh.t === 'campOne') {
    var c = campsToday().filter(function (x) { return x.g.id === sh.id; })[0]; if (!c) return { title: 'رسالة المخيم', rows: [], empty: 'لا طعام لهذا المخيم اليوم' };
    var n = smsNum(c.g.phone);
    return { title: c.g.name, sub: (c.g.rep ? c.g.rep + ' · ' : '') + (n ? c.g.phone : 'بلا رقم'),
      rows: [X({ title: 'نص الرسالة', sub: smsText(c) })],
      ft: { label: smsSent(c.g.id) ? 'إعادة الإرسال' : 'إرسال الرسالة', ok: !!n, go: function () { smsConfirm('camp', [c.g.id], smsCfg().tpl); } } };
  }
  if (sh.t === 'campTpl') {
    return { title: 'نص رسالة المخيمات', sub: 'عدّله متى شئت: الكلمات بين الأقواس تُستبدل تلقائيًا',
      fields: [fArea('tpl', 'النص', '', 'المتاح: {المخيم} {المندوب} {الأصناف} {الوقت} {المكان}'), fText('time', 'وقت الاستلام', 'مثال: الساعة 11'), fText('place', 'مكان الاستلام', 'مثال: من باب المطبخ')],
      ft: { label: 'حفظ النص', ok: fv('tpl').trim().length > 5, go: function () { var c = smsCfg(); c.tpl = fv('tpl').trim(); c.time = fv('time').trim(); c.place = fv('place').trim(); save(); shut(); mutated('حُفظ نص الرسالة'); } },
      ft2: { label: 'إعادة النص الأصلي', go: function () { A.form.tpl = SMS_TPL; render(); } } };
  }
  return null;
}

/* ===== 02z2-wsms.js ===== */
/* ---------- رسائل جماعية للعمال (SMS) ----------
   يختار المالك كل العمال أو بعضهم، يكتب الرسالة (مثلًا: «بكرة الدوام الساعة 7»)، وبضغطة واحدة تصل للجميع.
   {الاسم} في النص يُستبدل باسم كل عامل. الإرسال من التطبيق مباشرة عبر إضافة أندرويد (نفس إضافة المخيمات)،
   وبدونها تُفتح رسالة واحدة جاهزة بكل الأرقام في تطبيق الرسائل. آخر الرسائل تُحفظ للإعادة. الرقم يُحفظ في سجل العامل (w.phone). */
function wsmsRecent() { var c = (S.settings.wSmsRecent = S.settings.wSmsRecent || []); return c; }
function wsmsText(tpl, w) { return String(tpl || '').replace(/\{الاسم\}/g, w.name || '').replace(/[ \t]{2,}/g, ' ').trim(); }
function wsmsSel() { return (fv('sel') || '').split(',').filter(Boolean); }
function wsmsKeep(tpl) { var r = wsmsRecent().filter(function (x) { return x !== tpl; }); r.unshift(tpl); S.settings.wSmsRecent = r.slice(0, 8); }
function wsmsSendAll(list, tpl) {
  var ok = 0, bad = 0, i = 0, nat = smsNative();
  if (!list.length) return;
  if (SMSX.run) { say('جارٍ إرسال رسائل سابقة، انتظر'); return; }
  wsmsKeep(tpl); audit('رسالة جماعية إلى ' + pl(list.length, 'عامل واحد', '2 عامل', 'عمال') + ': ' + tpl.slice(0, 60)); save();
  if (!nat) { shut(); window.location.href = 'sms:' + list.map(function (w) { return smsNum(w.phone); }).join(',') + '?body=' + encodeURIComponent(wsmsText(tpl, { name: '' })); say('فُتحت الرسالة جاهزة في تطبيق الرسائل'); return; }
  SMSX.run = true; shut(); say('جارٍ إرسال ' + pl(list.length, 'رسالة واحدة', '2 رسالة', 'رسائل') + '…');
  var step = function () {
    if (i >= list.length) { SMSX.run = false; say('أُرسلت ' + ok + (bad ? ' · تعذّرت ' + bad : '')); render(); return; }
    var w = list[i++];
    Capacitor.Plugins.KitchenSms.send({ to: smsNum(w.phone), body: wsmsText(tpl, w) }).then(function () { ok++; }).catch(function () { bad++; }).then(function () { setTimeout(step, 1200); });
  }; step();
}
var WSMS = { sel: null };
/* المستلمون: الافتراضي كل من له رقم، ويُعاد الافتراض عند كل فتح جديد لنافذة الرسالة */
function wsmsPicked() { var ws = activeW().filter(function (w) { return smsNum(w.phone); }); return WSMS.sel == null ? ws : ws.filter(function (w) { return WSMS.sel.indexOf(w.id) >= 0; }); }
function wsmsSheet(sh) {
  if (sh.t === 'wSms') {
    var ws = activeW(), tpl = fv('msg'), nat = smsNative(), withNum = ws.filter(function (w) { return smsNum(w.phone); }), noNum = ws.length - withNum.length, picked = wsmsPicked();
    var who = !withNum.length ? 'لا أحد له رقم' : picked.length === withNum.length ? 'كل العمال' : picked.length ? picked.slice(0, 3).map(function (w) { return w.name; }).join('، ') + (picked.length > 3 ? '…' : '') : 'لم تختر أحدًا';
    return { title: 'رسالة للعمال', sub: 'تصل بضغطة واحدة للمختارين',
      acts: [X({ title: 'رسائل جاهزة', icon: 'i-chat', go: function () { openSh({ t: 'smsLib', kind: 'worker' }, {}); } }), X({ title: 'رسائل سابقة', icon: 'i-clock', go: function () { openSh({ t: 'wSmsHist' }, {}); } })],
      fields: [fArea('msg', 'نص الرسالة', 'مثال: بكرة الدوام الساعة 7 صباحًا', 'يمكنك كتابة {الاسم} ليُستبدل باسم كل عامل')],
      rows: [X({ icon: 'i-users', icTone: picked.length ? 'ok' : 'warn', title: 'المستلمون', sub: who, tag: pl(picked.length, 'عامل واحد', '2 عامل', 'عمال'), tagTone: picked.length ? 'ok' : 'warn', chev: true, go: function () { openSh({ t: 'wSmsPick' }, {}); } })],
      note: nat ? (noNum ? { text: pl(noNum, 'عامل واحد بلا رقم', '2 عامل بلا رقم', 'عمال بلا رقم') + ': أضف أرقامهم من «المستلمون».', tone: 'info' } : null)
        : { text: 'الإرسال التلقائي يحتاج النسخة الجديدة من التطبيق (APK). حتى ذلك الحين تُفتح رسالة واحدة جاهزة بأرقام المختارين في تطبيق الرسائل.', tone: 'warn' },
      ft: { label: picked.length ? 'إرسال إلى ' + pl(picked.length, 'عامل واحد', '2 عامل', 'عمال') : 'اختر المستلمين', ok: picked.length > 0 && String(tpl || '').trim().length > 1, go: function () { smsConfirm('worker', picked.map(function (w) { return w.id; }), String(tpl).trim()); } } };
  }
  if (sh.t === 'wSmsPick') {
    var pw = activeW(), wn = pw.filter(function (w) { return smsNum(w.phone); }), cur = wsmsPicked(), allOn = wn.length > 0 && cur.length === wn.length;
    var setSel = function (a) { WSMS.sel = a; render(); };
    return { title: 'المستلمون', sub: pl(cur.length, 'عامل واحد مختار', '2 عامل مختار', 'عمال مختارون'),
      acts: [X({ title: allOn ? 'إلغاء التحديد' : 'تحديد الكل', icon: 'i-check', go: function () { setSel(allOn ? [] : wn.map(function (w) { return w.id; })); } })],
      rows: pw.map(function (w) { var n = smsNum(w.phone), on = cur.some(function (c) { return c.id === w.id; });
        return X({ icon: 'i-users', icTone: n ? 'info' : 'warn', title: w.name, sub: n ? w.phone : 'بلا رقم · اضغط لإضافته', tag: n ? '' : 'بلا رقم', tagTone: 'warn', sel: !!n && on,
          go: function () { if (!n) { openSh({ t: 'wPhone', id: w.id }, { phone: '' }); return; } var base = WSMS.sel == null ? wn.map(function (x) { return x.id; }) : WSMS.sel.slice(); setSel(on ? base.filter(function (i) { return i !== w.id; }) : base.concat([w.id])); },
          lp: function () { openSh({ t: 'wPhone', id: w.id }, { phone: w.phone || '' }); } }); }),
      empty: 'أضف عمالًا أولًا',
      note: pw.length - wn.length ? { text: 'الضغطة المطوّلة على اسم تعدّل رقمه.', tone: 'info' } : null,
      ft: { label: 'تم', ok: true, go: function () { onBack(); } } };
  }
  if (sh.t === 'wPhone') {
    var w = wk(sh.id); if (!w) return { title: 'رقم العامل', rows: [], empty: 'لا عامل' };
    var ok = !fv('phone').trim() || fv('phone').replace(/[^0-9٠-٩]/g, '').length >= 7;
    return { title: w.name, sub: 'رقم الجوال لاستلام الرسائل',
      fields: [fText('phone', 'رقم الجوال', '05XXXXXXXX', 'tel')],
      ft: { label: 'حفظ الرقم', ok: ok, go: function () { var v = fv('phone').trim(); w.phone = v; audit('رقم جوال «' + w.name + '»: ' + (v ? 'حُفظ' : 'حُذف')); save(); onBack(); say('حُفظ الرقم'); } } };
  }
  if (sh.t === 'wSmsHist') {
    var r = wsmsRecent();
    return { title: 'رسائل سابقة', sub: 'اضغط رسالة لإعادتها إلى نص الإرسال',
      rows: r.map(function (t) { return X({ icon: 'i-send', icTone: 'mute', title: t, chev: true, go: function () { onBack(); fset('msg', t); } }); }),
      empty: 'لا رسائل سابقة بعد' };
  }
  return null;
}

/* ===== 02z3-smsx.js ===== */
/* ---------- الرسائل الجماعية: مراجعة وتأكيد قبل كل إرسال، تعديل النص لهذه المرة، ورسائل جاهزة محفوظة ----------
   كل إرسال (مخيمات، عمال، مخيم واحد) يمرّ من نافذة «تأكيد الإرسال»: المستلمون والنص النهائي لكل واحد، النص قابل للتعديل
   واستبدال برسالة جاهزة، وصف المستلم يُستبعد بضغطة؛ ولا إرسال إلا بزر التأكيد الصريح (المالك 2026-11-24: «أي ضغطة بتنتشر
   الرسائل حتى لو أخطأت»). الرسائل الجاهزة S.settings.smsLib = [{id, kind: 'camp'|'worker', name, text}]. */
var SMSLIB_H = { camp: 'المتاح: {المخيم} {المندوب} {الأصناف} {الوقت} {المكان}', worker: 'يمكنك كتابة {الاسم} ليُستبدل باسم كل عامل' };
function smsLib(kind) { return (S.settings.smsLib || []).filter(function (m) { return m.kind === kind; }); }
function smsxWho(kind, ids) {
  return kind === 'camp' ? campsToday().filter(function (c) { return smsNum(c.g.phone) && ids.indexOf(c.g.id) >= 0; }) : activeW().filter(function (w) { return smsNum(w.phone) && ids.indexOf(w.id) >= 0; });
}
function smsxId(kind, x) { return kind === 'camp' ? x.g.id : x.id; }
function smsConfirm(kind, ids, tpl) {
  if (SMSX.run) { say('جارٍ إرسال رسائل سابقة، انتظر'); return; }
  if (!ids.length) { say('اختر مستلمًا واحدًا على الأقل'); return; }
  SMSX.kind = kind; SMSX.all = ids.slice(); SMSX.ids = ids.slice();
  openSh({ t: 'smsGo' }, { msg: tpl });
}
function smsxDo() {
  var kind = SMSX.kind, msg = String(fv('msg')).trim(), inc = smsxWho(kind, SMSX.ids);
  if (SMSX.run) { say('جارٍ الإرسال، انتظر'); return; }
  if (!inc.length || msg.length < 2) return;
  if (kind === 'camp') smsSendList(inc, msg); else wsmsSendAll(inc, msg);
}
function smsxSheet(sh) {
  if (sh.t === 'smsGo') {
    var kind = SMSX.kind, isC = kind === 'camp', msg = String(fv('msg')), nat = smsNative();
    var all = smsxWho(kind, SMSX.all), inc = smsxWho(kind, SMSX.ids), incIds = inc.map(function (x) { return smsxId(kind, x); });
    var txt = function (x) { return isC ? smsText(x, msg) : wsmsText(msg, x); };
    var sentN = isC ? inc.filter(function (c) { return smsSent(c.g.id); }).length : 0;
    var mx = inc.reduce(function (m, x) { return Math.max(m, txt(x).length); }, 0), parts = mx > 70 ? Math.ceil(mx / 67) : 1;
    var nt = sentN ? { text: pl(sentN, 'مخيم واحد أُرسلت له', '2 مخيم أُرسلت لهما', 'مخيمات أُرسلت لها') + ' رسالة اليوم. اضغط صفه لاستبعاده.', tone: 'warn' }
      : parts > 1 ? { text: 'أطول رسالة ' + mx + ' حرفًا، فتُحسب ' + pl(parts, 'رسالة واحدة', '2 رسالة', 'رسائل') + '.', tone: 'info' }
      : !nat ? { text: 'ستُفتح الرسالة في تطبيق الرسائل وتضغط الإرسال هناك.', tone: 'info' } : null;
    var who = isC ? pl(inc.length, 'مخيم واحد', '2 مخيم', 'مخيمات') : pl(inc.length, 'عامل واحد', '2 عامل', 'عمال');
    return { title: 'تأكيد الإرسال', sub: inc.length ? who : 'لم تختر أحدًا',
      acts: [X({ title: 'رسائل جاهزة', icon: 'i-chat', go: function () { openSh({ t: 'smsLib', kind: kind }, {}); } }),
        X({ title: 'حفظ كرسالة', icon: 'i-plus', go: function () { if (String(fv('msg')).trim().length < 2) { say('اكتب النص أولًا'); return; } openSh({ t: 'smsLibOne', kind: kind, id: '' }, { name: '', text: String(fv('msg')).trim() }); } })],
      fields: [fArea('msg', 'نص الرسالة', '', SMSLIB_H[kind])],
      rows: all.map(function (x) { var id = smsxId(kind, x), on = incIds.indexOf(id) >= 0, sent = isC && smsSent(id);
        return X({ icon: 'i-users', icTone: sent ? 'warn' : 'info', title: isC ? x.g.name : x.name, sub: txt(x), tag: sent ? 'أُرسلت اليوم' : '', tagTone: 'warn', sel: on,
          go: function () { SMSX.ids = on ? SMSX.ids.filter(function (k) { return k !== id; }) : SMSX.ids.concat([id]); render(); } }); }),
      note: nt,
      ft: { label: inc.length ? 'تأكيد الإرسال · ' + who : 'اختر مستلمًا', ok: inc.length > 0 && msg.trim().length > 1 && !SMSX.run, go: smsxDo } };
  }
  if (sh.t === 'smsLib') {
    var L = smsLib(sh.kind);
    return { title: 'رسائل جاهزة',
      acts: [X({ title: 'رسالة جديدة', icon: 'i-plus', go: function () { openSh({ t: 'smsLibOne', kind: sh.kind, id: '' }, { name: '', text: '' }); } })],
      rows: L.map(function (m) { return X({ icon: 'i-chat', icTone: 'info', title: m.name, sub: m.text, go: function () { onBack(); fset('msg', m.text); }, lp: function () { openSh({ t: 'smsLibOne', kind: sh.kind, id: m.id }, { name: m.name, text: m.text }); } }); }),
      empty: 'لا رسائل جاهزة بعد', note: L.length ? { text: 'الضغطة المطوّلة على رسالة تعدّلها أو تحذفها.', tone: 'info' } : null };
  }
  if (sh.t === 'smsLibOne') {
    var cur = (S.settings.smsLib || []).filter(function (m) { return m.id === sh.id; })[0];
    var R = { title: cur ? 'تعديل الرسالة' : 'رسالة جاهزة', fields: [fText('name', 'الاسم', 'مثال: تذكير الدوام'), fArea('text', 'النص', '', SMSLIB_H[sh.kind])],
      ft: { label: 'حفظ', ok: String(fv('text')).trim().length > 1, go: function () {
        var Ls = (S.settings.smsLib = S.settings.smsLib || []), t = String(fv('text')).trim(), nm = String(fv('name')).trim() || t.slice(0, 24);
        if (cur) { cur.name = nm; cur.text = t; } else Ls.push({ id: 'm' + Date.now().toString(36), kind: sh.kind, name: nm, text: t });
        save(); onBack(); say('حُفظت الرسالة'); } } };
    if (cur) R.ft2 = { label: 'حذف الرسالة', go: function () { var Ls = S.settings.smsLib, i = Ls.indexOf(cur); Ls.splice(i, 1); save(); onBack(); say('حُذفت الرسالة', function () { Ls.splice(Math.min(i, Ls.length), 0, cur); save(); render(); }); } };
    return R;
  }
  return null;
}

/* ===== 03-pages.js ===== */
/* ---------- الصفحات: كل صفحة تُرجع كتلًا من مكونات التصميم ---------- */
function batchRow(b, nd) {
  var i = inst(b.inst), n = b.lines ? b.lines.length : 0;
  return X({
    icon: b.void ? 'i-x' : 'i-pot', icTone: b.void ? 'bad' : KT[b.kind], rbg: b.void ? '#F6F1F0' : undefined, title: batchName(b),
    sub: (nd && b.date === today() ? '' : dlabel(b.date) + ' · ') + KN[b.kind] + ' · ' + pl(b.pots || 0, 'قدر واحد', 'قدران', 'قدور') + (i ? ' · ' + i.name : '') + (b.portions ? ' · ' + b.portions + ' وجبة' : ''),
    tag: b.void ? 'ملغاة' : b.done === false ? 'تنتظر تأكيد' : b.edits ? 'عُدّلت' : '', tagTone: b.void ? 'bad' : b.done === false ? 'warn' : 'info', end: b.void ? '' : batchCostTxt(b), chev: true,
    go: function () { openSh({ t: 'bview', id: b.id }); },
    lp: function () { batchQa(b); }
  });
}
function batchQa(b) {
  var a = [['فتح الطبخة', 'i-pot', function () { openSh({ t: 'bview', id: b.id }); }]];
  if (!b.void) {
    a.push(['تغيير تاريخ الطبخة', 'i-calendar', function () { openSh({ t: 'bdate', id: b.id }, { day: '', dtxt: b.date }); }]);
    if (b.kind === 'private') a.push(['توزيع القدور', 'i-users', function () { openSh({ t: 'dist', id: b.id }, distForm(b)); }]);
    a.push(['نسخة للشيف', 'i-send', function () { shareChefBatch(b); }]);
  }
  qa(batchName(b), dlabel(b.date), a);
}
function stockQa(it, l0, q) {
  if (q == null) q = E.balance(S, l0, it.id);
  qa(it.name, 'الرصيد ' + fmt(q) + ' ' + it.unit, [['فتح الصنف', 'i-box', function () { openSh({ t: 'item', id: it.id }); }], ['استلام', 'i-truck', function () { openSh({ t: 'recv', item: it.id }, { led: l0, unitMode: 'base', qty: '', price: '' }); }], ['صرف', 'i-box', function () { openSh({ t: 'issue', item: it.id }, { led: l0, qty: '', why: '' }); }], ['جرد: تالف أو فرق', 'i-check', function () { openSh({ t: 'adjust', item: it.id }, { led: l0, how: 'amt', why: '', sign: '', unitMode: 'base', qty: '', note: '', day: '0', dtxt: '' }); }], ['تعديل بيانات الصنف', 'i-pencil', function () { openItemEdit(it); }]]);
}
function instQa(i, init) {
  var l = led(i.led);
  qa(i.name, init ? (i.occ || 'مبادرة') : 'تُسحب المواد من: ' + l.name, [['كشف الحساب', 'i-wallet', function () { openSh({ t: 'stmt', id: i.id }, { m: '' }); }], ['إضافة مبلغ على الحساب', 'i-plus', function () { openSh({ t: 'iniChg', id: i.id }, { amt: '', note: '', kind: '' }); }], ['تسجيل دفعة', 'i-wallet', function () { openSh({ t: 'iniPay', id: i.id }, { fund: '', amt: '', note: '', rate: '' }); }], [init ? 'طبخة جديدة لهذه الجهة' : 'طبخة خارجية جديدة لهذه المؤسسة', 'i-pot', function () { shut(); if (isClosed()) { openSh({ t: 'locked', what: 'batch' }); return; } var d0 = newDraft('external', !!init); d0.inst = i.id; open('batch', { draft: d0 }); }]]);
}
function moveQa(m) {
  var a = [['عرض الحركة', 'i-book', function () { openSh({ t: 'fView', id: m.id }); }]];
  if (!m.void) {
    a.push(['تعديل', 'i-pencil', function () { if (m.w && m.wl) { openEditPay(m); return; } var cv = m.cur === 'usd' && m.ils > 0; openSh({ t: 'fEdit', id: m.id }, { amt: String(cv ? m.ils : m.amt), note: m.note || '', cat: m.cat || '', rule: 'no', dir: m.dir, day: 'd', dtxt: m.date }); }]);
    a.push(['إلغاء الحركة', 'i-x', function () { voidMove(m.id); }]);
  }
  qa(m.note || (m.dir === 'in' ? 'وارد' : 'ناقص'), dlabel(m.date), a);
}
function supplyQa(d) {
  var a = [['فتح التوريدة', 'i-truck', function () { shut(); open('supply', { sid: d.id }); }]];
  if (d.done === 'approved') a.push(['إلغاء التوريدة', 'i-x', function () { voidSupply(d); }]);
  qa(supTitle(d), dlabel(d.date), a);
}
function personQa(p) {
  qa(p.name, (preset(p.preset) || {}).name || '', [['تعديل الصلاحيات', 'i-pencil', function () { openSh({ t: 'person', id: p.id }, { preset: p.preset, rep: p.rep ? 'yes' : 'no', wk: p.worker || '' }); }]]);
}
function recipeRow(r, k) {
      return X({ icon: 'i-book', icTone: 'mute', title: r.name, sub: (r.code ? r.code + ' · ' : '') + nIng(r.lines.length) + ' لكل قدر', tag: r.exp ? 'تجريبية' : r.draft ? 'مبدئية' : '', tagTone: r.exp || r.draft ? 'warn' : 'ok', chev: true,
        go: function () { open('recipe', { rid: r.id }); },
        lp: function () { qa(r.name, (r.code ? r.code + ' · ' : '') + nIng(r.lines.length) + ' لكل قدر', [['طبخة جديدة من هذه الوصفة', 'i-pot', function () { shut(); if (isClosed()) { openSh({ t: 'locked', what: 'batch' }); return; } var d0 = newDraft(k, false); d0.rec = r.id; open('batch', { draft: d0 }); }], ['تخطيط طبخة قادمة', 'i-calendar', function () { openSh({ t: 'planAdd', rec: r.id }, { day: '1', pots: '3', kind: r.kinds.indexOf('private') >= 0 ? 'private' : 'external' }); }], ['فتح الوصفة', 'i-book', function () { shut(); open('recipe', { rid: r.id }); }]]); } });
}
function pgBatches() {
  var k = A.bk || 'private', all = sortedBatches(batchesOf(k)).slice().sort(function (x, y) { return x.date < y.date ? 1 : x.date > y.date ? -1 : 0; }), act = all.filter(function (b) { return !b.void; }), vd = all.filter(function (b) { return b.void; }), g = [], map = {};
  act.forEach(function (b) { if (!map[b.date]) { map[b.date] = []; g.push(b.date); } map[b.date].push(b); });
  var bl = [B('kpi', { items: [X({ label: 'الطبخات', value: act.length, sub: KN[k] }), X({ label: 'الأيام', value: g.length, sub: 'فيها طبخ' })].concat(vd.length ? [X({ label: 'ملغاة', value: vd.length, endTone: 'bad', sub: 'في قسم منفصل' })] : []) })];
  g.forEach(function (d) { var L = map[d], pots = L.reduce(function (a, b) { return a + (b.pots || 0); }, 0); bl.push(B('rows', { title: dlabel(d) + ' · ' + pl(pots, 'قدر واحد', 'قدران', 'قدور'), items: L.map(batchRow) })); });
  if (!g.length) bl.push(B('rows', { title: 'الطبخات', items: [], empty: 'لا طبخات بعد' }));
  if (vd.length) bl.push(B('rows', { title: 'ملغاة (' + vd.length + ')', items: vd.map(batchRow) }));
  return bl;
}
function pgRecipes() {
  var k = A.rk || 'private', rs = S.recipes.filter(function (r) { return !r.arch && r.kinds.indexOf(k) >= 0; }), ok = rs.filter(function (r) { return !r.draft && !r.exp; }), dr = rs.filter(function (r) { return r.draft || r.exp; });
  /* تجميع حسب أول كلمة من الاسم (أرز، عدس…) متى تكرّرت؛ والباقي «أخرى» */
  var fw = function (r) { return String(r.name).split(/\s+/)[0]; }, cnt = {}; ok.forEach(function (r) { cnt[fw(r)] = (cnt[fw(r)] || 0) + 1; });
  var order = [], map = {}; ok.forEach(function (r) { var g = cnt[fw(r)] > 1 ? fw(r) : 'أخرى'; if (!map[g]) { map[g] = []; order.push(g); } map[g].push(r); });
  order.sort(function (x, y) { return x === 'أخرى' ? 1 : y === 'أخرى' ? -1 : map[y].length - map[x].length; });
  var bl = [B('kpi', { items: [X({ label: 'معتمدة', value: ok.length, sub: 'جاهزة للطبخ' }), X({ label: 'مبدئية/تجريبية', value: dr.length, sub: 'تحتاج مراجعة' })] }), B('acts', { items: [X({ title: 'وصفة جديدة', icon: 'i-plus', go: function () { openSh({ t: 'addRecipe' }, { name: '', kinds: k }); } })] })];
  order.forEach(function (g, i) { bl.push(B('rows', { title: g + ' (' + map[g].length + ')', items: map[g].map(function (r) { return recipeRow(r, k); }) })); });
  if (!order.length) bl.push(B('rows', { title: 'معتمدة', items: [], empty: 'لا وصفات معتمدة' }));
  if (dr.length) bl.push(B('rows', { title: 'مبدئية وتجريبية (' + dr.length + ')', items: dr.map(function (r) { return recipeRow(r, k); }) }));
  return bl;
}
/* فئة الصنف للترتيب والتلوين الخفيف على طول القائمة */
var ICAT_ORDER = ['جاف', 'بهارات', 'مبرّد', 'مجمّد', 'غير غذائي'], ICAT_BG = { 'جاف': '#FBF6E6', 'بهارات': '#FCEEE6', 'مبرّد': '#E8F2FB', 'مجمّد': '#EEEAF8', 'غير غذائي': '#EFEFEC' };
function joinSub() { return Array.prototype.filter.call(arguments, Boolean).join(' · '); }
function itemCat(it) { return it.grp === 'spice' ? 'بهارات' : (it.cond || 'جاف'); }
function pgToday() {
  var bl = [], f = A.kindF, td = today();
  var all = S.batches.filter(function (b) { return b.date === td && !b.void; });
  var tb = all.filter(function (b) { return f === 'all' || b.kind === f; });
  var pots = tb.reduce(function (a, b) { return a + (b.pots || 0); }, 0), cost = tb.reduce(function (a, b) { return a + (b.cost || 0); }, 0);
  var wd = E.wDay(S, td);
  var hol = isHol(), di = dayInfo();
  if (hol) bl.push(B('note', { tone: 'info', icon: 'i-calendar', text: 'اليوم عطلة: ' + hol.reason + '. لا دوام ولا تنبيهات حضور، ويظهر في التقارير «عطلة».', act: di.closed ? '' : 'إلغاء العطلة', actGo: doCancelHoliday }));
  bl.push(B('seg', { items: [['all', 'الكل'], ['private', 'طبخ'], ['external', 'طبخ خارجي']].map(function (a) {
    return X({ label: a[1], on: f === a[0], kind: a[0], go: function () { setState({ kindF: a[0] }); } });
  }) }));
  bl.push(B('kpi', { items: [
    X({ label: 'قدور اليوم', value: pots, sub: pl(tb.length, 'طبخة واحدة', 'طبختان', 'طبخات'), go: function () { setState({ page: 'main', tab: 'kitchen' }); } }),
    X({ label: 'تكلفة المواد', value: money(cost), sub: 'المشترى فقط', go: function () { setState({ page: 'main', tab: 'kitchen' }); } }),
    X({ label: 'الحضور', value: hol ? 'عطلة' : (wd.total - wd.none) + '/' + wd.total, sub: hol ? hol.reason : 'مسجّل', go: function () { openSh({ t: 'kAtt' }); } })
  ] }));
  bl.push(B('grid', { items: [
    X({ label: 'طبخة', icon: 'i-pot', icTone: 'ok', go: function () { startBatch('private'); } }),
    X({ label: 'طبخة خارجية', icon: 'i-truck', icTone: 'ext', go: function () { startBatch('external'); } }),
    X({ label: 'استلام مواد', icon: 'i-box', icTone: 'warn', go: function () { openSh({ t: 'recv', item: null }); } }),
    X({ label: 'دفعة لعامل', icon: 'i-wallet', icTone: 'mute', go: function () { openSh({ t: 'pickWorker' }); } })
  ] }));
  var att = [];
  /* تنبيهات المخزون مجمَّعة: صف واحد لكل مخزن بأعداد (نفد · حرج · ينقص قريبًا) والنقر يفتح قائمته، لا صف لكل صنف (اقتراح المالك 2026-11-19: ٦٢ تنبيهًا كثيرة) */
  ledgers().forEach(function (l) {
    var cnt = { 0: 0, 1: 0, 2: 0 }, worst = 3;
    itemsIn(l.id).forEach(function (it) {
      var q = E.balance(S, l.id, it.id), st = stStatus(q, it.id);
      if (alertable(l, it, q) && st.rank <= 2) { cnt[st.rank]++; if (st.rank < worst) worst = st.rank; }
    });
    var n = cnt[0] + cnt[1] + cnt[2]; if (!n) return;
    var parts = []; if (cnt[0]) parts.push(cnt[0] + ' نفد'); if (cnt[1]) parts.push(cnt[1] + ' حرج'); if (cnt[2]) parts.push(cnt[2] + ' ينقص قريبًا');
    att.push({ kd: l.ext ? 'external' : 'private', rank: worst, row: X({ icon: 'i-box', icTone: worst <= 1 ? 'bad' : 'warn', title: l.name + ': ' + pl(n, 'صنف واحد', 'صنفان', 'أصناف'), sub: parts.join(' · '), tag: worst === 0 ? 'نفد' : worst === 1 ? 'حرج' : 'ينقص قريبًا', tagTone: worst <= 1 ? 'bad' : 'warn', chev: true, go: function () { A.led = l.id; openSh({ t: 'kWarn' }); } }) });
  });
  if (!hol && wd.none > 0) att.push({ rank: 2.5, row: X({ icon: 'i-users', icTone: 'info', title: 'حضور ' + pl(wd.none, 'عامل واحد', 'عاملين', 'عمال') + ' لم يُسجَّل',
    sub: 'سجّله ليُحسب رصيد اليوم', chev: true, go: function () { setState({ tab: 'workers', wmode: 'att' }); } }) });
  var wNeg = activeW().filter(function (w) { return wBal(w) < 0; });
  if (wNeg.length === 1) { var w1 = wNeg[0]; att.push({ rank: 3, row: X({ icon: 'i-wallet', icTone: 'warn', title: w1.name + ' ' + balTxt(wBal(w1)), sub: 'دفعات أكثر من المستحق', chev: true, go: function () { open('worker', { wid: w1.id }); }, lp: function () { wQa(w1); } }) }); }
  else if (wNeg.length > 1) att.push({ rank: 3, row: X({ icon: 'i-wallet', icTone: 'warn', title: 'العمال: ' + pl(wNeg.length, 'عامل واحد', 'عاملان', 'عمال') + ' دُفع لهم أكثر من المستحق', sub: wNeg.slice(0, 3).map(function (w) { return w.name; }).join('، ') + (wNeg.length > 3 ? ' و' + (wNeg.length - 3) + ' آخرين' : ''), chev: true, go: function () { setState({ tab: 'workers' }); } }) });
  extAttn(att); syncAttn(att);
  if (!S.settings.openingDone) att.push({ rank: 0.5, row: X({ icon: 'i-box', icTone: 'warn', title: 'الأرصدة الافتتاحية', sub: 'راجع الأرقام ثم اعتمدها', tag: 'لم تُعتمد', tagTone: 'warn', chev: true, go: function () { open('opening'); } }) });
  if (hasData() && backupDays() >= 3) att.push({ rank: 0.6, row: X({ icon: 'i-doc', icTone: 'warn', title: 'نسخة احتياطية', sub: S.settings.lastBackup ? 'آخر نسخة قبل ' + pl(backupDays(), 'يوم', 'يومين', 'أيام') : 'لم تُصدَّر نسخة بعد: احفظها خارج الهاتف', tag: 'احفظ نسخة', tagTone: 'warn', chev: true, go: function () { exportBackup(); } }) });
  if (di.reopened) att.push({ rank: 0.2, row: X({ icon: 'i-lock', icTone: 'warn', title: 'اليوم مُعاد فتحه للتصحيح', sub: 'أغلقه ليصل المراقب التقرير المعدَّل', tag: 'مفتوح', tagTone: 'warn', chev: true, go: function () { openSh({ t: 'close' }); } }) });
  var cs = calToday();
  var shN = padShopOpen().filter(function (x) { return !x.done; }).length;
  if (shN && !cs.n) att.push({ rank: 0.7, row: X({ icon: 'i-pencil', icTone: 'info', title: 'المفكرة: ' + pl(shN, 'صنف واحد للشراء', 'صنفان للشراء', 'أصناف للشراء'), chev: true, go: function () { open('pad'); } }) });
  if (cs.n) att.push({ rank: 0.8, row: X({ icon: 'i-calendar', icTone: cs.late ? 'bad' : 'info', title: 'المواعيد: ' + (cs.today ? cs.today + ' اليوم' : '') + (cs.today && cs.late ? ' · ' : '') + (cs.late ? cs.late + ' متأخر' : ''), sub: cs.titles, tag: cs.late ? 'متأخر' : 'اليوم', tagTone: cs.late ? 'bad' : 'info', chev: true, go: function () { open('pad'); } }) });
  unconfAll().forEach(function (b) { att.push({ kd: b.kind, rank: 1.2, row: X({ icon: 'i-pot', icTone: 'warn', title: batchName(b), sub: 'كمياتها الفعلية لم تُؤكَّد · ' + dlabel(b.date), tag: 'تنتظر تأكيد', tagTone: 'warn', chev: true, go: function () { openSh({ t: 'bview', id: b.id }); }, lp: function () { batchQa(b); } }) }); });
  var dfx = dayFacts(); if (new Date().getHours() >= 17 && dfx.any && !dfx.closed) att.push({ rank: 1.5, row: X({ icon: 'i-doc', icTone: 'info', title: 'ملخص اليوم جاهز', sub: 'انسخه أو أرسله قبل إغلاق اليوم', chev: true, go: function () { openSh({ t: 'dsum' }); } }) });
  /* لمرة واحدة: حضور السبت 2026-11-07 كان داخل الرصيد المرحّل من الشيت؛ يختفي بعد النقل أو بعد 15 نوفمبر */
  if (!S.settings.carryDone && today() <= '2026-11-15' && activeW().some(function (w) { return wOpenAmt(w) !== 0 && !E.attOn(S, '2026-11-07', w.id); })) att.push({ rank: 0.5, row: X({ icon: 'i-calendar', icTone: 'info', title: 'حضور السبت 7 نوفمبر', sub: 'كان داخل الرصيد المرحّل من الشيت: سجّله هنا بلا تغيير في الأرصدة', chev: true, go: function () { openSh({ t: 'carry', d0: '2026-11-07' }, { cdate: '2026-11-07', sel: '' }); } }) });
  var bn = buyList(); if (bn.length) att.push({ rank: 2.8, row: X({ icon: 'i-truck', icTone: 'warn', title: 'قائمة المشتريات', sub: pl(bn.length, 'صنف واحد ينقص', 'صنفان ينقصان', 'أصناف تنقص') + ' للأيام القادمة', chev: true, go: function () { openSh({ t: 'buy' }); } }) });
  var aw = assetAttention();
  if (aw.length) att.push({ rank: 3, row: X({ icon: 'i-box', icTone: 'warn', title: 'الموجودات: ' + pl(aw.length, 'نوع واحد يحتاج', 'نوعان يحتاجان', 'أنواع تحتاج') + ' انتباهًا', sub: aw.filter(function (a) { return a.bad > 0; }).length + ' فيها معطّل · ' + aw.filter(aStale).length + ' يلزم جردها', tag: 'الموجودات', tagTone: 'warn', chev: true, go: function () { open('assets'); } }) });
  /* التنبيهات تتبع تبويب النوع: في «طبخ» و«طبخ خارجي» ما يخصه فقط، وما بلا نوع (العمال، الموجودات، المواعيد…) في «الكل» وحده (المالك 2026-11-21) */
  att = att.filter(function (a) { return f === 'all' || a.kd === f; });
  var hid = S.settings.attHide || {}, td0 = today(), hidN = att.filter(function (a) { return hid[a.row.title] === td0; }).length;
  att = att.filter(function (a) { return hid[a.row.title] !== td0; });
  att.forEach(function (a) { var k = a.row.title; a.row.hasX = true; a.row.xGo = function () { S.settings.attHide = S.settings.attHide || {}; S.settings.attHide[k] = td0; Object.keys(S.settings.attHide).forEach(function (z) { if (S.settings.attHide[z] !== td0) delete S.settings.attHide[z]; }); mutated('أُخفي التنبيه حتى الغد', function () { delete S.settings.attHide[k]; save(); render(); }); }; });
  att.sort(function (a, b) { return a.rank - b.rank; });
  var ALIM = 3, aOpen = !!A.attOpen, aItems = (aOpen ? att : att.slice(0, ALIM)).map(function (a) { return a.row; });
  if (att.length > ALIM) aItems.push(X({ more: true, icon: aOpen ? 'i-minus' : 'i-chevD', icTone: 'mute', title: aOpen ? 'طيّ القائمة' : 'عرض ' + (att.length - ALIM) + ' أخرى', sub: aOpen ? '' : 'مرتّبة بالأهمية', chev: false, go: function () { setState({ attOpen: !aOpen }); } }));
  if (hidN) aItems.push(X({ more: true, icon: 'i-chevD', icTone: 'mute', title: 'أخفيت ' + pl(hidN, 'تنبيهًا واحدًا', '2 تنبيه', 'تنبيهات') + ' اليوم · إظهار', chev: false, go: function () { S.settings.attHide = {}; save(); render(); } }));
  bl.push(B('rows', { title: 'يحتاج انتباهك' + (att.length ? ' (' + att.length + ')' : ''), items: aItems, empty: hidN ? '' : 'لا شيء يحتاج انتباهك الآن' }));
  bl.push(B('rows', { title: 'طبخات اليوم' + (tb.length ? ' (' + tb.length + ')' : ''), sort: sortInfo('batches'), items: sortedBatches(tb).map(function (b) { return batchRow(b, true); }), empty: hol ? 'عطلة: لا طبخ اليوم' : 'لا طبخ اليوم بعد' }));
  var pv = dayBatches('private');
  if (f !== 'external' && (pv.length || dayDist().length)) {
    var da0 = distAgg(pv), drows = [X({ par: true, icon: 'i-pot', icTone: da0.und > 0 ? 'warn' : 'ok', title: 'الموزّع ' + fmt(da0.given) + ' من ' + fmt(da0.priv) + ' قدر', sub: da0.und > 0 ? 'غير موزّع ' + fmt(da0.und) : 'كلها موزّعة', tag: da0.und > 0 ? 'ناقص' : 'تمّ', tagTone: da0.und > 0 ? 'warn' : 'ok' })];
    dayDist().forEach(function (x) { drows.push(X({ kid: true, icon: 'i-users', icTone: 'mute', title: benName(x.ben), sub: x.dish ? (rec(x.dish) || {}).name : '', tag: fmt(x.pots) + ' قدر', tagTone: 'mute', chev: true, go: function () { openSh({ t: 'distDay', eid: x.id }, { ben: x.ben, pots: String(x.pots), dish: x.dish || '' }); },
      lp: function () { var g = E.by(S.bens || [], x.ben); if (g) benQa(g); } })); });
    bl.push(B('rows', { title: 'توزيع القدور', act: 'توزيع', actGo: function () { openSh({ t: 'distDay' }, { ben: '', pots: '', dish: distDish0() }); }, items: drows }));
  }
  if (f !== 'external' && campsToday().length) bl.push(B('acts', { items: [X({ title: 'رسائل الصباح للمخيمات', icon: 'i-chat', go: function () { CSMS.sel = null; openSh({ t: 'campSms' }, {}); } })] }));
  var tmw = iso(new Date(Date.now() + 864e5));
  if (f !== 'external') planDistBlocks(plans().filter(function (p) { return p.date <= tmw; })).forEach(function (b) { bl.push(b); });
  /* المال والعطلة وإغلاق اليوم على مستوى اليوم لا النوع: تظهر في «الكل» وحده فلا تبقى ثابتة بين تبويبي النوع (المالك 2026-11-21) */
  if (f !== 'all') return bl;
  moneyCard().forEach(function (b) { bl.push(b); });
  if (!hol && !di.closed) bl.push(B('btns', { items: [X({ label: 'اليوم عطلة', icon: 'i-calendar', go: function () { openSh({ t: 'holiday' }, { reason: S.settings.weekHol && S.settings.weekHol !== 'لا يوجد' ? 'الجمعة' : 'الجمعة', other: '' }); } })] }));
  var miss = []; if (!hol && wd.none) miss.push('حضور ' + pl(wd.none, 'عامل واحد', '2 عامل', 'عمال')); if (unconfAll().length) miss.push(pl(unconfAll().length, 'طبخة واحدة', '2 طبخة', 'طبخات') + ' لم تُؤكَّد');
  bl.push(B('note', { tone: di.closed ? 'ok' : di.reopened ? 'warn' : 'info', icon: 'i-lock',
    text: di.closed ? 'أُغلق اليوم وجُهّز تقرير المراقب' + (di.rv > 1 ? ' (معدَّل رقم ' + di.rv + ')' : '') + '.' : di.reopened ? 'أُعيد فتح اليوم للتصحيح: أغلقه ليصل المراقب التقرير المعدَّل.' : (miss.length ? 'قبل إغلاق اليوم ينقص: ' + miss.join(' · ') + '.' : 'اليوم جاهز للإغلاق.'),
    act: di.closed ? '' : 'مراجعة وإغلاق اليوم', actGo: function () { openSh({ t: 'close' }); } }));
  return bl;
}
/* ما يبقى من كل صنف بعد هذه الطبخة المخططة وبعد الطبخات المخططة التي قبلها */
/* المتبقي بعد الخطط بالترتيب: كل خطة تسحب من مخازنها بترتيبها الفعلي (E.planOrder)، والمخزن الخارجي مستقل ورصيده السالب لا يُطرح، والنقص يظهر سالبًا */
/* ترتيب سحب صنف في خطة: مخزنها الأول وحده، ولا يمتد لمخزن آخر إلا إذا اخترتَ ذلك للصنف في الخطة (p.fill) */
function planOrdFor(p, id, order) { return p.fill && p.fill[id] ? order : order.slice(0, 1); }
function poolSim() { return { bal: {}, short: {}, sl: {} }; } /* sl: النقص مقيَّدًا على مخزنه (الأول في ترتيب الطبخة) فلا يظهر سالبًا في مخزن آخر */
function poolBal(sim, l, id) { var k = l + '|' + id; return sim.bal[k] == null ? Math.max(E.balance(S, l, id), 0) : sim.bal[k]; }
function poolTake(sim, order, id, q) {
  var rem = q; order.forEach(function (l) { var have = poolBal(sim, l, id), t = Math.min(have, rem); sim.bal[l + '|' + id] = r2(have - t); rem = r2(rem - t); });
  if (rem > 0) { sim.short[id] = r2((sim.short[id] || 0) + rem); sim.sl[order[0] + '|' + id] = r2((sim.sl[order[0] + '|' + id] || 0) + rem); }
}
function poolLeft(sim, order, id) { return r2(order.reduce(function (a, l) { return a + poolBal(sim, l, id); }, 0) - (sim.short[id] || 0)); }
function planAfter(p) {
  var left = {}, ps = plans(), sim = poolSim(), i, order;
  for (i = 0; i < ps.length; i++) {
    order = E.planOrder(S, ps[i].kind || 'private', ps[i].inst);
    E.scaleRecipe(rec(ps[i].recipeId), ps[i].pots, ps[i]).forEach(function (l) { poolTake(sim, planOrdFor(ps[i], l.item, order), l.item, l.qty); });
    if (ps[i].id === p.id) { E.scaleRecipe(rec(p.recipeId), p.pots, p).forEach(function (l) { left[l.item] = poolLeft(sim, planOrdFor(p, l.item, order), l.item); }); break; }
  }
  return left;
}
/* حالة المخزن بعد طبخ كل الخطط: كل صنف في المخزن (داخل في الخطط أو لا)، الآن ثم المسحوب للخطط ثم المتبقي؛ والنقص يظهر سالبًا */
function stockAfter(l0) {
  var sim = poolSim(), use = {}, ids = {}, rows = [];
  plans().forEach(function (p) {
    var order = E.planOrder(S, p.kind || 'private', p.inst);
    E.scaleRecipe(rec(p.recipeId), p.pots, p).forEach(function (l) { var ord = planOrdFor(p, l.item, order); poolTake(sim, ord, l.item, l.qty); if (ord.indexOf(l0) >= 0) { use[l.item] = r2((use[l.item] || 0) + l.qty); ids[l.item] = 1; } }); /* لا يُحسب «يلزم» لمخزن لا تسحب منه الخطة (تبديل المخزن يغيّر الأرقام) */
  });
  itemsIn(l0).forEach(function (it) { ids[it.id] = 1; });
  Object.keys(ids).forEach(function (id) {
    var it = item(id); if (!it) return;
    var q = E.balance(S, l0, id), after = q > 0 ? poolBal(sim, l0, id) : q, sh = sim.sl[l0 + '|' + id] || 0, rem = sh > 0 ? r2(after - sh) : after;
    if (q === 0 && !use[id]) return;
    rows.push({ it: it, q: q, take: q > 0 ? r2(q - poolBal(sim, l0, id)) : 0, need: use[id] || 0, rem: rem, short: sh });
  });
  return spiceLast(rows, function (r) { return r.it.id; }).sort(function (a, b) { return ((a.it.grp === 'spice') - (b.it.grp === 'spice')) || a.it.name.localeCompare(b.it.name, 'ar'); });
}
function stockAfterText(l0) {
  return 'حالة ' + led(l0).name + ' بعد الطبخ المخطط\n' + stockAfter(l0).map(function (r) { return r.it.name + ': الآن ' + fmt(r.q) + ' · يُسحب ' + fmt(r.take) + ' · يتبقى ' + fmt(r.rem) + ' ' + r.it.unit; }).join('\n');
}
/* توزيع الطبخات المخططة موحَّد لكل يوم: كل نقطة بعدد قدورها الإجمالي وأمامها نوع قدورها (من الطبختين أو واحدة) */
function planDistPts(dp) {
  var by = {}, out = [];
  dp.forEach(function (p) { var d = p.dist || {}; Object.keys(d).forEach(function (k) { if (d[k] > 0) { if (!by[k]) { by[k] = { id: k, tot: 0, t: [] }; out.push(by[k]); } by[k].tot = r2(by[k].tot + d[k]); if (!p.distTot) by[k].t.push([planName(p), d[k]]); } }); });
  return out;
}
function planDistOpen(day) {
  var f = {}, ps = plans().filter(function (p) { return (p.kind || 'private') === 'private' && p.date === day; }), tot = {}, same = true;
  bens().forEach(function (g) { var t = r2(ps.reduce(function (a, p) { return a + ((p.dist || {})[g.id] || 0); }, 0)); f['t_' + g.id] = t ? String(t) : ''; if (t > 0) tot[g.id] = t; ps.forEach(function (p) { var v = (p.dist || {})[g.id]; f['d_' + p.id + '_' + g.id] = v ? String(v) : ''; }); });
  var al = planDistAlloc(ps, tot);
  ps.forEach(function (p, i) { Object.keys(p.dist || {}).forEach(function (k) { if ((p.dist[k] || 0) !== (al[i][k] || 0)) same = false; }); });
  f.dmode = same ? 'tot' : 'det';
  openSh({ t: 'pdistDay', day: day }, dlAuto(f));
}
/* يوزّع إجمالي كل نقطة على طبخات اليوم بالترتيب: تُملأ الأولى ثم الثانية، فيظهر نوع قدور كل نقطة تلقائيًا */
function planDistAlloc(dps, totals, keepIds) {
  var cap = dps.map(function (p) { return p.pots; }), out = dps.map(function () { return {}; });
  Object.keys(totals).forEach(function (k) { var t = totals[k]; for (var i = 0; i < dps.length && t > 0; i++) { var take = Math.min(t, cap[i]); if (take > 0) { out[i][k] = r2((out[i][k] || 0) + take); cap[i] = r2(cap[i] - take); t = r2(t - take); } } });
  return out;
}
function planDistBlocks(ps) {
  var priv = ps.filter(function (p) { return (p.kind || 'private') === 'private'; }), days = [];
  priv.forEach(function (p) { if (days.indexOf(p.date) < 0) days.push(p.date); });
  return days.map(function (day) {
    var dp = priv.filter(function (p) { return p.date === day; }), multi = dp.length > 1, pts = planDistPts(dp), go = function () { planDistOpen(day); },
      pots = r2(dp.reduce(function (a, p) { return a + p.pots; }, 0)), given = r2(pts.reduce(function (a, g) { return a + g.tot; }, 0)), left = r2(pots - given), none = !pts.length;
    var rows = [X({ par: true, icon: 'i-pot', icTone: none || left > 0 ? 'warn' : 'ok', title: none ? 'لم يُخطَّط التوزيع بعد' : 'المخطَّط ' + fmt(given) + ' من ' + pl(pots, 'قدر واحد', 'قدران', 'قدور'),
      sub: multi ? dp.map(function (p) { return planName(p) + ' ' + pl(p.pots, 'قدر واحد', 'قدران', 'قدور'); }).join(' · ') : planName(dp[0]), tag: none ? 'لم يُخطَّط' : left > 0 ? 'ناقص' : 'تمّ', tagTone: none || left > 0 ? 'warn' : 'ok', chev: true, go: go, lp: function () { qa('توزيع الطبخات المخططة', dlabel(day), [['تعديل التوزيع', 'i-users', go]]); } })];
    pts.forEach(function (g) {
      rows.push(X({ kid: true, icon: 'i-users', icTone: 'info', title: benName(g.id), sub: g.t.length > 1 ? g.t.map(function (x) { return x[0] + ' ' + fmt(x[1]); }).join(' · ') : g.t.length ? g.t[0][0] : '', tag: pl(g.tot, 'قدر واحد', 'قدران', 'قدور'), tagTone: 'mute', chev: true, go: go, lp: function () { var g2 = E.by(S.bens || [], g.id); if (g2) benQa(g2); else go(); } }));
    });
    return B('rows', { title: 'توزيع الطبخات المخططة' + (days.length > 1 ? ' · ' + dlabel(day) : ''), act: 'توزيع', actGo: go, items: rows });
  });
}
/* ما سحبته الطبخات المخططة التي قبل هذه (بترتيبها الفعلي) من كل مخزن: يُحسب منه رصيد الطبخة التالية، فلا يُعدّ الملح المحجوز متاحًا مرتين. upto = معرّف الخطة (الأخيرة تُستثنى)، أو null = كل الخطط */
function planPrior(upto) {
  var sim = poolSim(), ps = plans(), i, order;
  for (i = 0; i < ps.length; i++) {
    if (upto && ps[i].id === upto) break;
    order = E.planOrder(S, ps[i].kind || 'private', ps[i].inst);
    E.scaleRecipe(rec(ps[i].recipeId), ps[i].pots, ps[i]).forEach(function (l) { poolTake(sim, planOrdFor(ps[i], l.item, order), l.item, l.qty); });
  }
  return sim;
}
/* تعديل الرصيد لسطر طبخة: خصم ما حجزته الخطط السابقة من كل مخزن، والنقص السابق من المخزن الأول */
function priorExtra(sim, order, id) {
  var o = {}, any = false;
  order.forEach(function (l) { var d = r2(poolBal(sim, l, id) - Math.max(E.balance(S, l, id), 0)); if (d) { o[l] = d; any = true; } });
  if (sim.short[id]) { o[order[0]] = r2((o[order[0]] || 0) - sim.short[id]); any = true; }
  return any ? o : null;
}
function planShort(p, upto) { // عدد أصناف الخطة التي ينقص رصيدها لهذه الطبخة بعد ما حجزته الخطط السابقة
  var sim = planPrior(upto), order = E.planOrder(S, p.kind || 'private', p.inst);
  return E.scaleRecipe(rec(p.recipeId), p.pots, p).filter(function (l) { return planOrdFor(p, l.item, order).reduce(function (a, k) { return a + poolBal(sim, k, l.item); }, 0) - (sim.short[l.item] || 0) < l.qty - 0.0001; }).length;
}
/* الطبخات المخططة لمؤسسة أو جهة: تظهر في سطرها بالقائمة (وفي صف الخطة نفسه اسمها) حتى لا تبدو «بلا طبخات» */
function planTxt(id) {
  var n = plans().filter(function (p) { return p.inst === id; }).length;
  return n ? pl(n, 'طبخة مخططة واحدة', 'طبختان مخططتان', 'طبخات مخططة') : '';
}
function pgKitchen() {
  var k = A.kk === 'init' ? 'external' : A.kk, bl = [];
  bl.push(B('seg', { items: [['private', 'طبخ'], ['external', 'طبخ خارجي']].map(function (a) {
    return X({ label: a[1], on: k === a[0], kind: a[0], count: batchesOf(a[0]).filter(function (b) { return !b.void; }).length, go: function () { setState({ kk: a[0] }); } });
  }) }));
  bl.push(B('btns', { items: [X({ label: KNF[k] + ' جديدة', icon: 'i-plus', on: true, selTone: k === 'external' ? 'ext' : 'ok', go: function () { startBatch(k); } })] }));
  if (k === 'external') bl.push(B('acts', { items: [X({ title: 'كشف حساب كل الجهات', icon: 'i-ledger', tone: 'ext', go: function () { openSh({ t: 'stAll', id: '__all' }, { m: '', sv: 'full' }); } })] })); /* تحت الزر الرئيسي مباشرة: تقرير مهم لا يُدفن آخر الصفحة */
  var kp = plansOf(k);
  bl.push(B('rows', { title: 'الطبخات القادمة' + (kp.length ? ' (' + kp.length + ')' : ''), act: 'تخطيط', actGo: function () { openSh({ t: 'planAdd', rec: null }, { day: '1', pots: '3', kind: k }); },
    items: kp.map(function (p) {
      var r = rec(p.recipeId), short = planShort(p);
      return X({ icon: 'i-calendar', icTone: short ? 'warn' : 'info', title: r.name, sub: dlabel(p.date).replace(/^(اليوم|أمس)$/, '$1') + ' · ' + (p.inst && inst(p.inst) ? inst(p.inst).name : KN[p.kind || 'private']) + ' · ' + pl(p.pots, 'قدر واحد', 'قدران', 'قدور'),
        tag: short ? 'ينقص ' + pl(short, 'صنف', 'صنفان', 'أصناف') : 'المواد تكفي', tagTone: short ? 'warn' : 'ok', chev: true, go: function () { openSh({ t: 'planView', id: p.id }); },
        lp: function () { qa(r.name, dlabel(p.date), [['عرض ما يلزم', 'i-calendar', function () { openSh({ t: 'planView', id: p.id }); }], ['نسخة للشيف', 'i-image', function () { shut(); shareChefPlan(p); }], ['تغيير التاريخ', 'i-calendar', function () { openSh({ t: 'planDate', id: p.id }, { day: '', dtxt: '' }); }], ['ابدأ هذه الطبخة', 'i-pot', function () { shut(); startFromPlan(p); }]].concat(p.date <= today() ? [['بدء سريع بكميات الوصفة', 'i-check', function () { quickStartPlan(p); }]] : [])); } });
    }), empty: 'لا طبخات مخططة. خطّط لتعرف ما ينقص قبل أن تطبخ.' }));
  if (k === 'private') planDistBlocks(kp).forEach(function (b) { bl.push(b); });
  var allB = batchesOf(k).filter(function (b) { return !b.void; }), todayB = allB.filter(function (b) { return b.date === today(); });
  bl.push(B('rows', { title: 'طبخات اليوم' + (todayB.length ? ' (' + todayB.length + ')' : ''), items: sortedBatches(todayB).map(function (b) { return batchRow(b, true); }), empty: 'لا طبخات اليوم' }));
  if (allB.length > todayB.length) bl.push(B('rows', { title: 'الطبخات السابقة', items: [X({ more: true, chev: true, icon: 'i-calendar', icTone: 'info', title: 'كل الطبخات (' + allB.length + ')', sub: 'مجمّعة حسب اليوم', go: function () { open('batches', { bk: k }); } })] }));
  if (k === 'external') {
    bl.push(B('rows', { title: 'المؤسسات', act: 'مؤسسة', actGo: function () { openSh({ t: 'addInst' }, { name: '', src: 'own' }); },
      items: instsOf(false).map(function (i) {
        var l = led(i.led);
        return X({ icon: 'i-truck', icTone: 'ext', title: i.name, sub: 'تُسحب المواد من: ' + l.name + (planTxt(i.id) ? ' · ' + planTxt(i.id) : ''), tag: l.inkind ? 'مواد عينية' : l.ext ? 'من الخارجي' : 'من المطبخ', tagTone: 'mute', chev: true, go: function () { openSh({ t: 'stmt', id: i.id }, { m: '' }); },
          lp: function () { instQa(i, false); } });
      }) }));
    bl.push(B('rows', { title: 'المبادرات', act: 'جهة', actGo: function () { openSh({ t: 'addInit' }, { name: '', occ: '' }); }, items: instsOf(true).map(function (i) {
      var n = S.batches.filter(function (b) { return b.inst === i.id && !b.void; }).length, tg = iniTag(i);
      return X({ icon: 'i-heart', icTone: 'ext', title: i.name, sub: (i.occ ? i.occ + ' · ' : '') + [n ? pl(n, 'طبخة واحدة', 'طبختان', 'طبخات') : '', planTxt(i.id)].filter(Boolean).join(' · ') || 'بلا طبخات بعد', tag: tg.t, tagTone: tg.tone, chev: true, go: function () { openSh({ t: 'stmt', id: i.id }, { m: '' }); },
        lp: function () { instQa(i, true); } });
    }), empty: 'أفراد وجهات متفرقة (عرس، عزاء…). تُضاف عند أول طبخة لها.' }));
  }
  var rs = S.recipes.filter(function (r) { return !r.arch && r.kinds.indexOf(k) >= 0; });
  /* الوصفات: ثلاث الأكثر استعمالًا لبدء طبخة بضغطة، والباقي خلف «كل الوصفات» */
  var use = {}; S.batches.forEach(function (b) { if (!b.void && b.recipe) use[b.recipe] = (use[b.recipe] || 0) + 1; });
  var top = rs.filter(function (r) { return !r.draft && !r.exp; }).sort(function (x, y) { return (use[y.id] || 0) - (use[x.id] || 0); }).slice(0, 3);
  bl.push(B('rows', { title: 'الوصفات', act: 'وصفة', actGo: function () { openSh({ t: 'addRecipe' }, { name: '', kinds: k }); },
    items: top.map(function (r) { return recipeRow(r, k); }).concat([X({ more: true, chev: true, icon: 'i-book', icTone: 'info', title: 'كل الوصفات (' + rs.length + ')', sub: pl(rs.filter(function (r) { return !r.draft && !r.exp; }).length, 'معتمدة', 'معتمدتان', 'معتمدة') + ' · ' + (rs.length - rs.filter(function (r) { return !r.draft && !r.exp; }).length) + ' مبدئية/تجريبية', chev: true, go: function () { open('recipes', { rk: k }); } })]), empty: 'لا وصفات لهذا النوع بعد' }));
  return bl;
}
function pgStock() {
  var l0 = A.led, L = led(l0) || led('kitchen'), bl = [];
  if (!led(l0)) { A.led = 'kitchen'; l0 = 'kitchen'; }
  bl.push(B('chips', { items: ledgers(A.showArch).map(function (l) {
    return X({ label: l.name, on: l.id === l0, selTone: l.ext ? 'ext' : 'ok', go: function () { setState({ led: l.id }); } });
  }).concat([X({ label: '+', tone: 'ok', go: function () { openSh({ t: 'addLedger' }, { name: '', inkind: 'own' }); } })]) }));
  var rows = itemsIn(l0).map(function (it) { var q = E.balance(S, l0, it.id); return { it: it, q: q, st: stStatus(q, it.id) }; });
  var sm = A.sort.stock;
  rows.sort(function (a, b) {
    if (sm.f === 'name') return a.it.name.localeCompare(b.it.name, 'ar') * sm.d;
    if (sm.f === 'cat') return ((ICAT_ORDER.indexOf(itemCat(a.it)) - ICAT_ORDER.indexOf(itemCat(b.it))) || a.it.name.localeCompare(b.it.name, 'ar')) * sm.d;
    if (sm.f === 'qty') return (a.q - b.q) * sm.d;
    if (sm.f === 'days') return (a.st.days - b.st.days) * sm.d;
    return ((a.st.rank - b.st.rank) || (a.st.days - b.st.days)) * sm.d;
  });
  if (!L.wck) rows = rows.filter(function (r) { return r.q !== 0; });
  var warn = rows.filter(function (r) { return alertable(L, r.it, r.q) && r.st.rank <= 2; }).length;
  var value = rows.reduce(function (a, r) { return a + Math.max(r.q, 0) * (r.it.price || 0); }, 0), free = E.isFree(L);
  bl.push(B('kpi', { items: [
    X({ label: 'أصناف', value: rows.length, sub: 'في هذا المخزن' }),
    X({ label: 'تحتاج انتباه', value: warn, sub: 'حرج أو قريب', endTone: warn ? 'bad' : 'ok', go: function () { openSh({ t: 'kWarn' }); } }),
    X({ label: free ? 'قيمة تقديرية' : 'قيمة المخزون', value: money(value), sub: L.inkind ? 'مواد عينية' : L.wck ? 'مدعومة' : 'بآخر سعر', go: function () { openSh({ t: 'kVal' }); } })
  ] }));
  var inL = function (d) { return (d.led || 'kitchen') === l0; }, dsL = drafts().filter(inL), ssL = supSched().filter(inL), spL = supplies().filter(inL); /* كل قوائم التوريد تخص مخزنها وحده؛ الخارجي لا توريد له (المالك 2026-11-25) */
  if (!S.settings.openingDone && l0 === 'kitchen') bl.push(B('note', { tone: 'warn', icon: 'i-pencil', text: 'الأرصدة الافتتاحية لم تُعتمد.', act: 'مراجعة واعتماد', actGo: function () { open('opening'); } }));
  if (L.wck) bl.push(B('note', { tone: 'info', icon: 'i-shield', text: 'تابع لـ WCK' }));
  if (L.inkind) bl.push(B('note', { tone: 'info', icon: 'i-shield', text: 'مواد عينية: لا تُحسب عليك، وتُخصم منها طبخات هذه الجهة وحدها.' }));
  if (L.arch) bl.push(B('note', { tone: 'warn', icon: 'i-lock', text: 'مخزن مؤرشف (' + (L.archWhy || 'انتهى التعامل') + '): للاطلاع فقط.' }));
  bl.push(B('acts', { items: [
    X({ title: 'استلام مواد', icon: 'i-truck', on: true, go: function () { openSh({ t: 'recv', item: null }, { led: l0 }); } }),
    X({ title: 'صرف مواد', icon: 'i-box', go: function () { openSh({ t: 'issue', item: null }, { led: l0, qty: '', why: '' }); } }),
    L.ext ? [] : X({ title: 'مسودة توريد', icon: 'i-doc', go: function () { openSh({ t: 'draftNew' }, { led: l0, otxt: '', dtxt: today() }); } }),
    X({ title: 'جرد', icon: 'i-check', go: function () { openSh({ t: 'count' }, { led: l0 }); } })].filter(function (x) { return x && !Array.isArray(x); }) }));
  if (dsL.length) bl.push(B('rows', { title: 'مسودات توريد تنتظر مراجعتك (' + dsL.length + ')', items: dsL.map(function (d) {
    var nd = dNeeds(d).length;
    return X({ icon: 'i-doc', icTone: nd ? 'warn' : 'ok', title: pl(d.lines.length, 'صنف واحد', 'صنفان', 'أصناف') + ' · ' + (led(d.led) ? led(d.led).name : ''), sub: 'من ' + (d.src || 'نص') + ' · ' + dlabel(d.created || d.date), tag: nd ? nd + ' للمراجعة' : 'جاهزة', tagTone: nd ? 'warn' : 'ok', chev: true,
      go: function () { open('order', { did: d.id }); }, lp: function () { qa('مسودة توريد', pl(d.lines.length, 'صنف واحد', 'صنفان', 'أصناف'), [['فتح ومراجعة', 'i-doc', function () { shut(); open('order', { did: d.id }); }], ['ترك المسودة', 'i-minus', function () { openSh({ t: 'dDrop', did: d.id }); }]]); } });
  }) }));
  if (ssL.length) bl.push(B('rows', { title: 'توريد قادم', items: ssL.map(function (d) { return X({ icon: 'i-truck', icTone: 'info', title: supTitle(d), sub: (d.hold ? 'بانتظار الوصول · المتوقع ' : 'يدخل المخزن ') + dlabel(d.date) + ' · ' + (led(d.led) ? led(d.led).name : '') + ' · ' + pl(d.lines.length, 'صنف واحد', 'صنفان', 'أصناف'), tag: d.hold ? 'لم يصل' : 'قادم', tagTone: d.hold ? 'warn' : 'info', chev: true, go: function () { open('supply', { sid: d.id }); } }); }) }));
  if (spL.length) bl.push(B('rows', { items: [X({ icon: 'i-truck', icTone: 'ok', title: 'سجل التوريدات', sub: pl(spL.filter(function (d) { return d.done === 'approved'; }).length, 'توريدة واحدة', 'توريدتان', 'توريدات') + (spL.filter(function (d) { return d.done === 'approved'; })[0] ? ' · آخرها ' + dlabel(spL.filter(function (d) { return d.done === 'approved'; })[0].date) : ''), chev: true, go: function () { open('supplies'); } })] }));
  var mkRow = function (r) {
    var al = alertable(L, r.it, r.q);
    var byCat = A.sort.stock.f === 'cat', cat = itemCat(r.it);
    return X({ rbg: byCat ? ICAT_BG[cat] : undefined, title: r.it.name, sub: joinSub(byCat ? cat : '', !al && L.ext ? '' : r.q > 0 ? (r.st.plan ? planTxt(r.st.plan) : usageOf(r.it.id) ? 'يكفي ' + daysTxt(r.st.days) : '') : r.q < 0 ? 'ناقص ' + fmt(-r.q) + ' ' + r.it.unit : 'لا يوجد رصيد'), tag: r.st.rank < 3 && al ? r.st.t : '', tagTone: r.st.tone,
      end: fmt(r.q) + ' ' + r.it.unit, endSub2: packTxt(r.it, r.q), chev: true, go: function () { openSh({ t: 'item', id: r.it.id }); },
      lp: function () { stockQa(r.it, l0, r.q); } });
  };
  /* إخفاء الأصناف الصفرية (اختياري من نافذة الترتيب): ما رصيده صفر ولا تحتاجه خطة ولا استُعمل حديثًا يُطوى في صف واحد؛ السالب والمحتاج يبقيان (المالك 2026-11-23) */
  var zeroSplit = function (list) {
    if (!A.hideZero) return { keep: list, z: [] };
    var z = list.filter(function (r) { return r.q === 0 && !r.st.plan; });
    return { keep: z.length ? list.filter(function (r) { return z.indexOf(r) < 0; }) : list, z: z };
  };
  var zeroRows = function (list) {
    var sp = zeroSplit(list), out = sp.keep.map(mkRow);
    if (sp.z.length) {
      if (A.zeroOpen) { out = out.concat(sp.z.map(mkRow)); out.push(X({ more: true, title: 'طيّ الأصناف بلا رصيد', icon: 'i-chevU', go: function () { setState({ zeroOpen: false }); } })); }
      else out.push(X({ more: true, title: 'بلا رصيد (' + sp.z.length + ')', icon: 'i-chevD', go: function () { setState({ zeroOpen: true }); } }));
    }
    return out;
  };
  var byCat0 = A.sort.stock.f === 'cat';
  var addIt = { act: 'صنف', actGo: function () { openSh({ t: 'addItem', then: '' }, { name: '', unit: 'كيلو', price: '', packType: 'none', packN: '', cond: 'جاف' }); } };
  if (byCat0) { bl.push(B('rows', Object.assign({ title: 'الأصناف مرتّبة بالفئة', sort: sortInfo('stock'), items: zeroRows(rows), all: !!A.hideZero, empty: 'لا أصناف في هذا المخزن بعد' }, addIt))); return bl; }
  var sg = A.sg || 'all', mainR = rows.filter(function (r) { return r.it.grp !== 'spice'; }), spR = rows.filter(function (r) { return r.it.grp === 'spice'; });
  var plR = rows.filter(function (r) { return planCover(r.it.id); });
  var plN = stockAfter(l0).filter(function (r) { return r.need > 0; }).length, plsL = plans().filter(function (p) { return E.planOrder(S, p.kind || 'private', p.inst).indexOf(l0) >= 0; });
  if (sg === 'after') sg = 'plan'; if (sg === 'plan' && !plN) sg = 'all';
  var segs = [['all', 'الكل', rows.length], ['main', 'الأساسية', mainR.length]].concat(spR.length ? [['spice', 'البهارات', spR.length]] : [], plN ? [['plan', 'المخطط له', plN]] : []);
  if (spR.length || plN) bl.push(B('seg', { items: segs.map(function (a) {
    return X({ label: a[1], count: segs.length > 3 ? undefined : a[2], on: sg === a[0], go: function () { setState({ sg: a[0] }); } });
  }) }));
  if (sg === 'plan') {
    var sa = stockAfter(l0).filter(function (r) { return r.need > 0; }), cov = {}; plR.forEach(function (r) { cov[r.it.id] = r; });
    bl.push(B('rows', { title: 'المخطط له · ' + pl(plsL.length, 'طبخة واحدة', 'طبختان', 'طبخات'), act: 'نسخ', actGo: function () { copyText(stockAfterText(l0), 'نُسخت حالة المخزن بعد الطبخ'); }, sort: sortInfo('stock'), all: true, items: (sa.length ? [X({ hdr: true, chev: true, colw: 96, title: 'الصنف', end: 'الآن', end2: 'بعد الطبخ' })] : []).concat(sa.map(function (r) {
      var c = cov[r.it.id];
      return X({ title: r.it.name, sub: 'يلزم ' + fmt(r.need), colw: 96, end: fmt(r.q) + ' ' + r.it.unit, endSub2: packTxt(r.it, r.q), end2: fmt(r.rem) + ' ' + r.it.unit, end2Tone: r.rem < 0 ? 'bad' : '', end2Sub: packTxt(r.it, Math.max(r.rem, 0)), chev: true, go: function () { openSh({ t: 'item', id: r.it.id }); }, lp: function () { stockQa(r.it, l0, r.q); } });
    })), empty: 'لا أصناف' }));
    return bl;
  }
  if (sg !== 'spice') bl.push(B('rows', Object.assign({ title: spR.length ? 'الأساسية' : 'الأصناف', sort: sortInfo('stock'), items: zeroRows(mainR), all: !!A.hideZero, empty: 'لا أصناف في هذا المخزن بعد' }, addIt)));
  if (sg !== 'main' && spR.length) bl.push(B('rows', Object.assign({ title: 'البهارات', sort: sg === 'spice' ? sortInfo('stock') : null, items: zeroRows(spR), all: !!A.hideZero, empty: '' }, sg === 'spice' ? addIt : {})));
  return bl;
}
/* جدول حضور وغياب الأسبوع (السبت إلى الجمعة): صف لكل عامل وخلية لكل يوم بلون الحالة. النقر على خلية يفتح حالة ذلك اليوم */
var WK_DN = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'], WK_EMPTY = { bg: 'transparent', fg: '#B3BBB6', bd: '1.5px dashed #C9CFCA' };
function wkLetter(st) { return { p: 'ح', x: 'م', l: 'ت', a: 'غ', h: 'ع' }[st.id] || String(st.name || '').charAt(0); }
function weekBlock(W) {
  var off = A.wkOff || 0, k0 = -((new Date().getDay() + 1) % 7) + 7 * off, days = [], td = today(), i;
  for (i = 0; i < 7; i++) { var dd = dayOff(k0 + i); days.push({ date: dd, n: WK_DN[new Date(dd + 'T12:00:00').getDay()], d: String(+dd.slice(8)), fg: dd === td ? '#14563A' : '#1B2421', fut: dd > td }); }
  var cell = function (w, d) {
    var a = E.attOn(S, d.date, w.id), st = a ? stat(a.st) : null, tn = st ? T[st.tone] || T.mute : null;
    return { t: st ? wkLetter(st) : '·', bg: tn ? tn[0] : WK_EMPTY.bg, fg: tn ? tn[1] : WK_EMPTY.fg, bd: tn ? '0' : WK_EMPTY.bd, go: d.fut ? noop : function () { openSh({ t: 'status', wid: w.id, date: d.date }); } };
  };
  var rows = W.map(function (w) {
    var tot = days.filter(function (d) { var a = E.attOn(S, d.date, w.id), st = a ? stat(a.st) : null; return st && st.mult > 0; }).length;
    return { name: w.name, go: function () { open('worker', { wid: w.id }); }, cells: days.map(function (d) { return cell(w, d); }), tot: String(tot) };
  });
  var legend = (S.stats || []).filter(function (t) { return !t.sys; }).map(function (t) { var tn = T[t.tone] || T.mute; return { t: wkLetter(t), l: t.name, bg: tn[0], fg: tn[1], bd: '0' }; }).concat([{ t: '·', l: 'لم يُسجَّل', bg: WK_EMPTY.bg, fg: WK_EMPTY.fg, bd: WK_EMPTY.bd }]);
  return B('week', { wk: { title: dlong(days[0].date).replace(/ \d{4}$/, '') + ' – ' + dlong(days[6].date).replace(/ \d{4}$/, ''), prev: function () { setState({ wkOff: off - 1 }); }, next: off < 0 ? function () { setState({ wkOff: off + 1 }); } : noop, days: days, rows: rows, legend: legend } });
}
function pgWorkers() {
  var m = A.wmode, bl = [], W = activeW(), td = today(), wd = E.wDay(S, td), hol = isHol();
  bl.push(B('seg', { items: [['att', 'الحضور اليوم'], ['wk', 'الأسبوع'], ['acc', 'الحسابات']].map(function (a) {
    return X({ label: a[1], on: m === a[0], go: function () { setState({ wmode: a[0] }); } });
  }) }));
  var owed = W.reduce(function (a, w) { var b = wBal(w); return a + (b > 0 ? b : 0); }, 0);
  bl.push(B('kpi', { items: [
    X({ label: 'حاضرون', value: hol ? '—' : wd.present, sub: hol ? 'عطلة اليوم' : 'من ' + W.length, go: function () { openSh({ t: 'kAtt' }); } }),
    X({ label: 'بلا تسجيل', value: wd.none, sub: 'اليوم', endTone: wd.none ? 'warn' : 'ok', go: function () { openSh({ t: 'kAtt' }); } }),
    X({ label: 'مستحق لهم', value: money(owed), sub: 'مجموع الأرصدة', go: function () { openSh({ t: 'kOweW' }); } })
  ] }));
  bl.push(B('acts', { items: [
    X({ title: 'حضور الباقين', icon: 'i-check', go: function () { allPresent(); } }),
    X({ title: 'رسالة للعمال', icon: 'i-chat', go: function () { WSMS.sel = null; openSh({ t: 'wSms' }, { msg: '' }); } }),
    X({ title: 'دفع الأسبوع', icon: 'i-wallet', go: function () { openSh({ t: 'settle' }, { sel: W.filter(function (w) { return wBal(w) > 0; }).map(function (w) { return w.id; }).join(',') }); } })] }));
  if (m === 'wk') { bl.push(weekBlock(W)); return bl; }
  var wl = (S.workers || []).filter(function (w) { return !w.arch || A.showArch; }), wm = A.sort.workers;
  wl.sort(function (a, b) {
    if (wm.f === 'name') return a.name.localeCompare(b.name, 'ar') * wm.d;
    if (wm.f === 'bal') return (wBal(a) - wBal(b)) * wm.d;
    var ka = (wAtt(a) ? 1 : 0) * 10 + (wBal(a) < 0 ? 0 : 1), kb = (wAtt(b) ? 1 : 0) * 10 + (wBal(b) < 0 ? 0 : 1);
    return (ka - kb) * wm.d;
  });
  if (hol) bl.push(B('note', { tone: 'info', icon: 'i-calendar', text: 'اليوم عطلة (' + hol.reason + '): لا أجر. لمن عمل رغم العطلة افتح حسابه واختر «إضافة».' }));
  var addW = { act: 'عامل', actGo: function () { openSh({ t: 'addWorker' }, { name: '', wage: '' }); } }; /* الإضافة في سطر عنوان القائمة (ظ40) */
  var wRow = function (w) {
    var a = wAtt(w), st = a ? stat(a.st) : null, b = wBal(w);
    if (w.arch) return X({ title: w.name, sub: 'مؤرشف · ' + (w.archWhy || ''), tag: 'مؤرشف', tagTone: 'mute', chev: true, go: function () { openSh({ t: 'unarch', k: 'worker', id: w.id }, { wage: String(w.daily || '') }); } });
    if (m === 'att') {
      return X({ icon: 'i-users', icTone: st ? st.tone : 'mute', title: w.name, sub: money(w.daily) + ' يوميًا', tag: st ? st.name : 'لم يُسجَّل', tagTone: st ? st.tone : 'mute',
        end: st && st.id !== 'h' ? money(E.attAmt(a)) : '', chev: true, go: function () { openSh({ t: 'status', wid: w.id }); }, lp: function () { wQa(w); } });
    }
    var nv = wViol(w).length;
    return X({ title: w.name, sub: 'آخر دفعة: ' + wLastPay(w), tag: nv ? 'مخالفات ' + nv : '', tagTone: 'bad', end: balTxt(b), endTone: b === 0 ? '' : balTone(b), chev: true,
      go: function () { open('worker', { wid: w.id }); }, lp: function () { wQa(w); } });
  };
  /* الحضور: «بلا تسجيل» أولًا ثم «سُجّل»، ولكل عامل أيقونة بلون حالته */
  if (m === 'att' && wm.f === 'need' && !hol) {
    var todo = wl.filter(function (w) { return !w.arch && !wAtt(w); }), done = wl.filter(function (w) { return w.arch || wAtt(w); });
    /* أكثر من 3 بلا تسجيل: صف واحد مختصر يُفتح بالنقر، بدل صفوف متطابقة (لهم «حضور الباقين» وجدول الأسبوع) */
    var tItems = todo.map(wRow);
    if (todo.length > 3) tItems = A.todoOpen ? [X({ more: true, icon: 'i-minus', icTone: 'mute', title: 'طيّ القائمة', go: function () { setState({ todoOpen: false }); } })].concat(tItems) : [X({ icon: 'i-users', icTone: 'warn', title: 'عرض الأسماء', sub: todo.slice(0, 3).map(function (w) { return w.name; }).join('، ') + '…', chev: true, go: function () { setState({ todoOpen: true }); } })];
    bl.push(B('rows', Object.assign({ all: true, title: 'بلا تسجيل (' + todo.length + ')', sort: todo.length > 3 && !A.todoOpen ? null : sortInfo('workers'), items: tItems, empty: 'سُجّل حضور الجميع اليوم' }, addW)));
    if (done.length) bl.push(B('rows', { all: true, title: 'سُجّل (' + done.length + ')', items: done.map(wRow) }));
  } else bl.push(B('rows', Object.assign({ all: true, title: m === 'att' ? 'سجّل حضور اليوم' : 'أرصدة العمال', sort: sortInfo('workers'), items: wl.map(wRow) }, addW)));
  return bl;
}
/* بطاقة المال: الإجراء الأهم والأرصدة وآخر الحركات (مع اسم الرصيد) في مكان واحد، وتحتها بقية الخيارات */
function moneyCard() {
  var items = [X(Object.assign({ par: true, icon: 'i-wallet', icTone: 'ok', title: 'الأرصدة', sub: pl(funds().length, 'رصيد واحد', 'رصيدان', 'أرصدة'), end: usdK(fTot('usd')), endSub: money(fTot('ils')), endEq: true, chev: true, go: function () { open('funds'); } }))];
  var rm = recentMoves(4); rm.forEach(function (m) { items.push(moveRowX(m, true, true)); });
  if (!rm.length) items.push(X({ icon: 'i-wallet', icTone: 'mute', title: 'لا حركات مالية بعد', sub: 'سجّل أول حركة من الزر أعلاه' }));
  return [B('rows', { title: 'المال', headBtn: { label: 'حركة مالية جديدة', go: function () { openMove(); } }, items: items })]; /* الإجراء الأهم زر رئيسي كامل العرض كـ«طبخة جديدة» لا غمامة صغيرة (المالك 2026-11-18) */
}
function moneyRows() {
  var oi = oweInst(), ow = oweWork();
  return [
    X({ icon: 'i-ledger', icTone: 'info', title: 'كشف حسابنا', chev: true, go: function () { ownOpen(); } }),
    X({ icon: 'i-doc', icTone: 'info', title: 'الملخص المالي', chev: true, go: function () { setState({ fsm: today().slice(0, 7) }); open('finsum'); } }),
    X({ icon: 'i-plus', icTone: oi > 0 ? 'ok' : 'mute', title: 'مستحق لك من المؤسسات', end: money(oi), chev: true, go: kGo({ t: 'kOweI' }) }),
    X({ icon: 'i-minus', icTone: ow > 0 ? 'warn' : 'mute', title: 'عليك للعمال', end: money(ow), chev: true, go: kGo({ t: 'kOweW' }) })
  ];
}
function pgMore() {
  return moneyCard().concat([B('rows', { title: 'الحسابات', items: moneyRows() }), B('rows', { title: 'المتابعة', items: [
    X({ icon: 'i-pot', icTone: 'ok', title: 'الإنجاز', sub: 'هذا الشهر', end: achNum(achData(ownPresets()[0][1], today()).pots) + ' قدر', chev: true, go: function () { open('ach'); } }),
    X({ icon: 'i-send', icTone: 'info', title: 'ملخص المتابعة', chev: true, go: function () { open('wrep'); } }),
    X({ icon: 'i-doc', icTone: 'info', title: 'التقارير', chev: true, go: function () { open('reports'); } }),
    X({ icon: 'i-pencil', icTone: 'info', title: 'المفكرة', sub: padSummary(), chev: true, go: function () { open('pad'); } }),
    X({ icon: 'i-box', icTone: 'ok', title: 'الموجودات', sub: pl(AA().length, 'نوع واحد', 'نوعان', 'أنواع'), chev: true, go: function () { open('assets'); } }),
    X({ icon: 'i-users', icTone: 'mute', title: 'المستفيدون', sub: pl(bens().length, 'مستفيد واحد', 'مستفيدان', 'مستفيدين'), chev: true, go: function () { openSh({ t: 'list', k: 'bens' }); } }),
    X({ icon: 'i-truck', icTone: 'mute', title: 'المؤسسات', sub: pl(S.insts.filter(function (i) { return !i.arch; }).length, 'مؤسسة واحدة', 'مؤسستان', 'مؤسسات'), chev: true, go: function () { openSh({ t: 'list', k: 'insts' }); } })
  ] }), B('rows', { title: 'أخرى', items: [
    X({ icon: 'i-sliders', icTone: 'mute', title: 'الإدارة والإعدادات', chev: true, go: function () { open('device'); } }),
    X({ icon: 'i-wifi', icTone: 'info', title: 'الحساب والمزامنة', sub: syncSub(), tag: syncTag().t, tagTone: syncTag().tone, chev: true, go: function () { openSh({ t: 'sync' }, { email: '', pw: '' }); } }),
    X({ icon: 'i-copy', icTone: 'info', title: 'مزامنة الشيت', sub: gwSub(), tag: gwTag().t, tagTone: gwTag().tone, chev: true, go: function () { openSh({ t: 'shGw' }, { gwurl: S.settings.syncGwUrl || '', gwkey: S.settings.syncGwKey || '' }); } }),
    X({ icon: 'i-doc', icTone: 'info', title: 'نسخة احتياطية', sub: S.settings.lastBackup ? 'آخر نسخة قبل ' + pl(backupDays(), 'يوم', 'يومين', 'أيام') : 'لم تُصدَّر بعد', chev: true, go: function () { exportBackup(); } }),
    X({ icon: 'i-lock', icTone: 'mute', title: 'عن التطبيق', sub: 'الإصدار ' + VERSION + (updPending() ? ' · تحديث ' + updPending() + ' جاهز: أغلق التطبيق وافتحه' : ''), chev: false, go: function () { checkUpdate(true); } })
  ] })]);
}
function pgDevice() {
  return [B('rows', { title: 'الإدارة', items: [
    X({ icon: 'i-shield', icTone: 'ok', title: 'الأشخاص والصلاحيات', sub: pl(people().length, 'شخص واحد', 'شخصان', 'أشخاص') + ' · ' + people().slice(0, 3).map(function (x) { return x.name; }).join('، '), chev: true, go: function () { open('people'); } }),
    X({ icon: 'i-sliders', icTone: 'warn', title: 'القوائم والحقول', sub: 'المؤسسات والمستفيدون والمخازن والحالات والوحدات: عدّل أو أضف', chev: true, go: function () { open('lists'); } }),
    X({ icon: 'i-lock', icTone: 'bad', title: 'الأرشيف والإدارة', sub: 'للمدير التنفيذي: إنهاء التعامل، استعادة، سجل التعديلات', chev: true, go: function () { open('admin'); } }),
  ] }), B('rows', { title: 'متقدمة', items: [
    X({ icon: 'i-box', icTone: 'warn', title: 'الأرصدة الافتتاحية', sub: S.settings.openingDone ? 'اعتُمدت: يمكنك مراجعتها' : 'لم تُعتمد بعد: راجع المعبّأ من الشيت', tag: S.settings.openingDone ? '' : 'مطلوب', tagTone: 'warn', chev: true, go: function () { open('opening'); } }),
    X({ icon: 'i-doc', icTone: 'mute', title: 'استعادة نسخة احتياطية', sub: 'تستبدل بيانات هذا الجهاز بما في ملف النسخة', chev: true, go: function () { openSh({ t: 'restore' }); } }),
    X({ icon: 'i-clock', icTone: 'info', title: 'العودة إلى يوم سابق', sub: bkSub(), chev: true, go: function () { openSh({ t: 'snaps' }); } }),
    X({ icon: 'i-lock', icTone: 'mute', title: 'سجل الأخطاء', sub: ERRS.length ? pl(ERRS.length, 'خطأ واحد', 'خطآن', 'أخطاء') + ' مسجّلة' : 'لا أخطاء مسجّلة', tag: ERRS.length ? String(ERRS.length) : '', tagTone: 'bad', chev: true, go: function () { openSh({ t: 'errlog' }); } }),
    X({ icon: 'i-clock', icTone: 'mute', title: 'تنبيه الثامنة صباحًا', sub: lsj('ahd_daily', false) ? 'مفعّل ويُعاد ضبطه عند كل فتح' : 'غير مفعّل', tag: lsj('ahd_daily', false) ? 'مفعّل' : 'متوقف', tagTone: lsj('ahd_daily', false) ? 'ok' : 'warn', chev: true, go: function () { openSh({ t: 'daily' }); } })
  ] })];
}


/* ---------- الطبخة الجديدة: ثلاث خطوات ---------- */
/* المؤسسة/الجهة في خطوتي الكميات والتكلفة (وفي تعديل الخطة التي تبدأ من الخطوة 2): تظهر دائمًا وتُغيَّر بالضغط */
function instPickBlock(d) {
  var ins = inst(d.inst);
  return B('pick', { label: d.init ? 'الجهة أو الفرد' : 'المؤسسة', value: ins ? ins.name : d.init ? 'اختر الجهة' : 'اختر المؤسسة', filled: !!ins, go: function () { openSh({ t: 'instp' }); } });
}
function pgBatch() {
  var d = A.draft, bl = [], r = d.rec ? rec(d.rec) : null, ins = inst(d.inst), order = E.planOrder(S, d.kind, d.inst), l0 = led(order[0]);
  if (d.step === 1) {
    bl.push(B('seg', { items: [['private', 'طبخ'], ['external', 'طبخ خارجي']].map(function (a) {
      var k = a[0];
      return X({ label: a[1], on: d.kind === k, kind: k, go: function () {
        var cur = A.draft, rr = cur.rec ? rec(cur.rec) : null;
        setDraft({ kind: k, init: false, inst: k === 'private' ? null : cur.inst, rec: rr && rr.kinds.indexOf(k) >= 0 ? cur.rec : null });
      } });
    }) }));
    if (d.kind === 'external') bl.push(B('seg', { items: [[false, 'مؤسسة'], [true, 'مبادرة']].map(function (a) {
      return X({ label: a[1], on: !!d.init === a[0], kind: 'external', go: function () { if (!!A.draft.init !== a[0]) setDraft({ init: a[0], inst: null }); } });
    }) }));
    bl.push(B('pick', { label: 'الطبخة', value: r ? r.name : 'اختر من الطبخات أو أضف جديدة', filled: !!r, go: function () { openSh({ t: 'dish' }); } }));
    if (r) bl.push(B('input', { label: 'اسم الطبخة لهذا اليوم (اختياري)', value: d.dish || '', ph: r.name, onInput: function (v) { setDraft({ dish: v.trim() }); } }));
    if (d.kind === 'external') {
      bl.push(B('pick', { label: d.init ? 'الجهة أو الفرد' : 'المؤسسة', value: ins ? ins.name : d.init ? 'اختر الجهة' : 'اختر المؤسسة أو أضف جديدة', filled: !!ins, go: function () { openSh({ t: 'instp' }); } }));
      bl.push(B('input', { label: 'عدد الوجبات (اختياري)', value: d.portions, ph: 'مثال: 480', mode: 'numeric', onInput: function (v) { setDraft({ portions: v }); } }));
    }
    if (!d.editId) {
      bl.push(B('pick', { label: 'تاريخ الطبخة', value: dlabel(d.date) + (d.date > today() ? ' · مجدولة' : ''), filled: true, go: function () { openSh({ t: 'bwhen' }, { day: d.date === today() ? '0' : '', dtxt: '' }); } }));
      if (d.date > today()) bl.push(B('note', { tone: 'info', icon: 'i-calendar', text: 'طبخة قادمة: تُحفظ مجدولة ولا تُخصم المواد الآن، وتُخصم عندما تبدأها في يومها من «الطبخات القادمة».' }));
      else if (d.date < today()) bl.push(B('note', { tone: 'warn', icon: 'i-alert', text: 'تسجيل لطبخة سابقة: تُخصم المواد وتُحسب في تقرير ذلك اليوم.' }));
    }
    if (d.editId || d.date <= today()) bl.push(B('note', { tone: l0.inkind ? 'info' : 'ok', icon: 'i-box',
      text: order.length > 1 ? (d.kind === 'private' ? 'تُخصم من مخزن WCK أولًا، وما ينقص يبقى سالبًا فيه.'
        : 'تُخصم من المخزن الخارجي أولًا، وما ينقص يبقى سالبًا فيه.') : 'ستُخصم المواد من: ' + l0.name + (l0.inkind ? ' (مواد عينية)' : '') }));
    return bl;
  }
  var lines = dLines(), short = lines.filter(function (l) { return l.after < 0; }).length;
  if (d.step === 2) {
    if (d.kind === 'external') bl.push(instPickBlock(d));
    bl.push(B('stepper', { label: 'عدد القدور', text: r.name + ': الكميات من الوصفة × عدد القدور، وما عدّلته يتناسب مع العدد', value: d.pots, edit: function () { openSh({ t: 'potsSet' }, { n: String(A.draft.pots) }); },
      minus: function () { setDraft(potsPatch(A.draft, Math.max(1, A.draft.pots - 1))); },
      plus: function () { setDraft(potsPatch(A.draft, A.draft.pots + 1)); } }));
    bl.push(B('note', { tone: 'info', icon: 'i-pencil', text: 'الوصفة نقطة بداية فقط. عدّل الكمية بـ + و−، أو اضغط على الرقم لكتابتها أو لإزالة الصنف. كل تعديل لهذه الطبخة وحدها، والوصفة تبقى كما هي.' }));
    var mkRow = function (l) {
      return X({ step: true, edit: function () { openSh({ t: 'bline', id: l.id }, { qty: String(l.actual), by: 'all' }); }, title: l.name + (l.fixed ? ' (ثابت)' : '') + (l.extra && !r.ghost ? ' (إضافي)' : '') + (l.swap ? ' · قابل للاستبدال' : ''), val: fmt(l.actual), unit: l.unit,
        badge: l.dev ? 'يختلف عن الوصفة' : '', sub: [d.pots > 1 && l.actual > 0 && !l.fixed ? 'للقدر ' + perTxt(l.actual, d.pots, l.unit) : '', packFull(item(l.id), l.actual) ? 'الإجمالي ' + packFull(item(l.id), l.actual) : '', Object.keys(l.src).length > 1 ? srcTxt(l) : (l.extra ? 'مضاف لهذا اليوم' : l.note ? l.note : '')].filter(Boolean).join(' · '),
        sub2: 'يبقى ' + fmt(l.after) + (l.after > 0 && packFull(item(l.id), l.after) ? ' = ' + packFull(item(l.id), l.after) : ''),
        hintTxt: !l.extra && l.planned != null ? 'حسب الوصفة ' + fmt(l.planned) + ' ' + l.unit : '', hintGo: !l.extra && l.planned != null ? function () { var o2 = Object.assign({}, A.draft.over); delete o2[l.id]; setDraft({ over: o2 }); } : null,
        warn: l.after < 0 ? 'ينقص ' + fmt(-l.after) + ' ' + l.unit + ' عن رصيد ' + l.lastName : '',
        minus: function () { nudge(l.id, -1); }, plus: function () { nudge(l.id, 1); } });
    };
    var grp = function (cat) { return lines.filter(function (l) { return l.cat === cat && !l.extra; }); };
    var gB = grp('b'), gS = grp('s'), gF = grp('f'), gX = lines.filter(function (l) { return l.extra; });
    var opts = r.lines.filter(function (l) { return l.opt || l.alt; });
    if (opts.length) bl.push(B('rows', { title: 'خيارات في الوصفة', items: opts.map(function (l) {
      if (l.alt) { var on = !!(d.alt || {})[l.item]; return X({ title: on ? 'يستخدم البديل: ' + item(l.alt.item).name : 'بديل متاح: ' + item(l.alt.item).name, sub: l.alt.note, tag: on ? 'مفعّل' : 'غير مفعّل', tagTone: on ? 'ok' : 'mute', chev: true,
        go: function () { var a2 = Object.assign({}, A.draft.alt), o2 = Object.assign({}, A.draft.over); delete o2[l.item]; delete o2[l.alt.item]; if (a2[l.item]) delete a2[l.item]; else a2[l.item] = true; setDraft({ alt: a2, over: o2 }); } }); }
      var on2 = !!(d.opts || {})[l.item]; return X({ title: item(l.item).name + ' (اختياري)', sub: l.note || '', tag: on2 ? 'مضاف' : 'غير مضاف', tagTone: on2 ? 'ok' : 'mute', chev: true,
        go: function () { var o2 = Object.assign({}, A.draft.opts); if (o2[l.item]) delete o2[l.item]; else o2[l.item] = true; setDraft({ opts: o2 }); } });
    }) }));
    if (r.ghost) { gB = gB.concat(gX); gX = []; } /* طبخة بلا وصفة: كل أصنافها أساسية */
    bl.push(B('rows', { all: true, title: 'الأصناف الأساسية', act: 'مكوّن', actGo: function () { openSh({ t: 'extra', item: null }); }, items: gB.map(mkRow), empty: 'لا أصناف أساسية' }));
    if (gS.length) bl.push(B('rows', { all: true, title: 'البهارات (تعديلها حتى 10%)', items: gS.map(mkRow) }));
    if (gF.length) bl.push(B('rows', { all: true, title: 'الوقود', items: gF.map(mkRow) }));
    if (gX.length) bl.push(B('rows', { all: true, title: 'إضافات لهذا اليوم', items: gX.map(mkRow) }));
    var gone = r.lines.filter(function (l) { return d.del[l.item]; });
    if (gone.length) bl.push(B('rows', { all: true, title: 'أُزيلت من هذه الطبخة', items: gone.map(function (l) {
      return X({ title: item(l.item).name, sub: 'حسب الوصفة ' + qtyU(l.fixed ? l.per : r3(l.per * d.pots), item(l.item).unit), tag: 'إعادة', tagTone: 'info', chev: true, go: function () { var dl = Object.assign({}, A.draft.del); delete dl[l.item]; setDraft({ del: dl }); } });
    }) }));
    if (r.meat) bl.push(B('note', { tone: 'warn', icon: 'i-alert', text: MENU_MEAT_RULE }));
    var ord = E.planOrder(S, d.kind, d.inst), p0 = ord[0], p1 = ord[1], mktOk = p0 === 'kitchen' && p1 === 'ext', shl = lines.filter(function (l) { return l.short > 0; });
    if (shl.length && p1) {
      /* النقص يبقى سالبًا في المخزن الأول، ولا يُكمَّل من غيره إلا باختيارك: سالب ← من المخزن الثاني ← (من السوق مباشرة للطبخ الخاص) */
      var setAll = function (mode) { var f = Object.assign({}, A.draft.fill), m = Object.assign({}, A.draft.mkt); dLines().forEach(function (x) { if (x.short > 0) { if (mode) f[x.id] = true; else delete f[x.id]; if (mode === 'mkt') m[x.id] = true; else delete m[x.id]; } }); setDraft({ fill: f, mkt: m }); };
      bl.push(B('rows', { title: 'ينقص عن رصيد ' + (LSHORT[p0] || led(p0).name) + ': كيف يُسجَّل؟', items: shl.map(function (l) {
        var st = l.mkt ? 2 : l.fill ? 1 : 0;
        return X({ title: l.name, sub: 'ينقص ' + qtyU(l.short, l.unit), tag: st === 2 ? 'من السوق مباشرة' : st === 1 ? 'من ' + (LSHORT[p1] || led(p1).name) : 'سالب في ' + (LSHORT[p0] || led(p0).name), tagTone: st === 2 ? 'warn' : st === 1 ? 'info' : 'bad', chev: true,
          go: function () { var f = Object.assign({}, A.draft.fill), m = Object.assign({}, A.draft.mkt), nx = (st + 1) % (mktOk ? 3 : 2); delete f[l.id]; delete m[l.id]; if (nx >= 1) f[l.id] = true; if (nx === 2) m[l.id] = true; setDraft({ fill: f, mkt: m }); } });
      }) }));
      bl.push(B('btns', { items: [X({ label: 'الكل سالب', go: function () { setAll(''); } }), X({ label: 'الكل ' + (LSHORT[p1] || led(p1).name), go: function () { setAll('fill'); } })].concat(mktOk ? [X({ label: 'الكل السوق', go: function () { setAll('mkt'); } })] : []) }));
      bl.push(B('note', { tone: 'info', text: 'الأصل أن يبقى النقص سالبًا في ' + (LSHORT[p0] || led(p0).name) + ' فتطالب به لاحقًا، ولا يُكمَّل من غيره إلا باختيارك.' + (mktOk ? ' ما اشتُري من السوق مباشرة لا يُخصم من الخارجي، ويظهر للمراقب ضمن «خارجي» دون ذكر المصدر، ويُحسب في التكلفة.' : '') }));
    }
    if (short) bl.push(B('note', { tone: 'warn', text: 'تنبيه: ' + pl(short, 'صنف واحد ينقص', 'صنفان ينقصان', 'أصناف تنقص') + ' عن الرصيد. يمكنك المتابعة، ويظهر الرصيد بالسالب حتى تسجّل الاستلام.' }));
    return bl;
  }
  var pi = priceInfo(d, lines), free0 = pi.free0, por = Number(d.portions) || 0, total = pi.total, kv = pi.kv, mat = pi.mat, xl = pi.xl, xt = pi.xt, lumpOn = pi.lumpOn, lumpV = pi.lumpV, isPaid = pi.isPaid;
  if (d.kind === 'external') bl.push(instPickBlock(d));
  bl.push(B('kpi', { items: [
    X({ label: free0 && d.kind === 'external' && !(total > 0) ? 'قيمة المواد' : d.kind === 'external' ? 'تكلفة الطبخة' : 'التكلفة عليك', value: free0 && d.kind === 'external' && !(total > 0) ? 'عيني' : money(total), sub: d.kind === 'private' ? 'مغطّى من الخارجي' : isPaid && lumpOn ? 'سعر القدر × العدد' : isPaid && xt > 0 ? 'مواد + بنود إضافية' : d.init ? 'على حساب الجهة' : 'تُحاسَب بها المؤسسة' }),
    X({ label: 'تكلفة القدر', value: money(total / d.pots), sub: pl(d.pots, 'قدر واحد', 'قدران', 'قدور') }),
    d.kind === 'private' ? X({ label: 'من المخزن', value: money(kv), sub: 'تابع لـ WCK' })
      : X({ label: 'الوجبة', value: por > 0 ? money(total / por) : '—', sub: por > 0 ? 'لكل وجبة' : 'العدد غير مُدخل' })
  ] }));
  if (isPaid) {
    bl.push(B('seg', { items: [['items', 'تفصيل: مواد وبنود'], ['lump', 'سعر إجمالي للقدر']].map(function (a) {
      return X({ label: a[1], on: (d.pm || 'items') === a[0], go: function () { setDraft({ pm: a[0] }); } });
    }) }));
    if (lumpOn) {
      bl.push(B('input', { label: 'سعر القدر الواحد (₪)', value: d.lump, ph: 'مثال: 90', mode: 'decimal', onInput: function (v) { setDraft({ lump: v }); } }));
      bl.push(B('note', { tone: 'info', icon: 'i-check', text: lumpV > 0 ? pl(d.pots, 'قدر واحد', 'قدران', 'قدور') + ' × ' + money(lumpV) + ' = ' + money(total) + '. المواد تُخصم من المخزن كالمعتاد (قيمتها ' + money(mat) + ') لكن الحساب بسعر القدر.' : 'اكتب سعر القدر الواحد المتفق عليه. المواد تُخصم من المخزن كالمعتاد.' }));
    } else {
      var xrows = [X({ subt: true, title: 'تكلفة المواد', sub: free0 ? 'عيني من المؤسسة' : 'بسعر اليوم', end: free0 ? 'عيني' : money(mat), chev: !free0, go: free0 ? null : function () { openSh({ t: 'dprices' }, {}); } })].concat(xl.map(function (x, i) {
        return X({ title: x.k, sub: x.note, end: money(x.amt), chev: true, go: function () { openSh({ t: 'xline', idx: i }, { k: x.k, kNew: '', amt: String(x.amt), note: x.note || '' }); } });
      })).concat(xl.length ? [X({ total: true, title: 'تكلفة الطبخة', end: money(total) })] : []);
      bl.push(B('rows', { title: 'بنود التكلفة', act: 'بند', actGo: function () { openSh({ t: 'xline' }, { k: xkinds()[0], kNew: '', amt: '', note: '' }); }, items: xrows }));
      if (!xl.length) bl.push(B('note', { tone: 'info', icon: 'i-pencil', text: 'أضف ما يلزم فوق المواد: العمال، النقل، وأي بند آخر. تدخل كلها في تكلفة الطبخة وحساب المؤسسة.' }));
    }
  }
  fieldsFor(d.kind).forEach(function (f) {
    bl.push(B('input', { label: f.name + ' (حقل مخصص)', value: (d.cf || {})[f.id] || '', ph: '', mode: f.type === 'رقم' ? 'numeric' : 'text', onInput: function (v) { var cf = Object.assign({}, A.draft.cf); cf[f.id] = v; setDraft({ cf: cf }); } }));
  });
  if (!d.editId && d.date > today()) bl.push(B('note', { tone: 'info', icon: 'i-calendar', text: 'ستُحفظ مجدولة ليوم ' + dlabel(d.date) + '. لا تُخصم أي مادة الآن، والكميات التي عدّلتها تُحفظ لتُطبَّق عند البدء.' }));
  else bl.push(B('note', { tone: short ? 'warn' : 'ok', icon: short ? 'i-alert' : 'i-check',
    text: (short ? 'بعد الحفظ ينقص ' + pl(short, 'صنف', 'صنفان', 'أصناف') + ' عن الرصيد وسيظهر بالسالب. ' : '') + (d.kind === 'private' ? 'تُخصم المواد من المخزن أولًا ثم من الخارجي' : 'تُخصم المواد من ' + l0.name + (order.length > 1 ? ' ثم من المخزن' : '')) + (ins ? ' ويُسجَّل الطبخ للمؤسسة: ' + ins.name : '') + '.' }));
  var devs = lines.filter(function (l) { return l.dev; });
  if (devs.length) bl.push(B('note', { tone: 'info', icon: 'i-pencil', text: 'وصفة المؤسسة إرشاد يُتّبع قدر الإمكان، والاختلاف مقبول: ' + devs.map(function (l) { return l.name; }).join('، ') + '. يُذكر في تقرير المراقب فقط إن كان خيار «فروق عن المنيو» ظاهرًا.' }));
  bl.push(B('rows', { all: true, title: 'ملخص الكميات', items: lines.map(function (l) { return X({ title: l.name, end: fmt(l.actual), endSub: l.unit, sub: Object.keys(l.src).length > 1 ? srcTxt(l) : (LSHORT[Object.keys(l.src)[0]] || '') }); }) }));
  return bl;
}

/* ---------- صفحة العامل ---------- */
function wBalBefore(w, date) {
  var t = 0, days = {};
  (S.att || []).forEach(function (a) { if (a.w === w.id && a.date < date) days[a.date] = a; });
  Object.keys(days).forEach(function (k) { t += E.attAmt(days[k]); });
  wlOn().forEach(function (e) {
    if (e.w !== w.id || e.date >= date) return;
    if (e.kind === 'open' || e.kind === 'add') t += e.amt; else t -= e.amt;
  });
  return r2(t);
}
function wEnt(w, type) { return function () { openSh({ t: 'entry', wid: w.id }, { type: type, amt: '', note: '', sev: 'warn' }); }; }
function wQa(w) {
  qa(w.name, balTxt(wBal(w)), [['تسجيل حضور اليوم', 'i-check', function () { openSh({ t: 'status', wid: w.id }); }], ['دفعة نقدية', 'i-wallet', wEnt(w, 'دفعة نقدية')], ['سلفة', 'i-wallet', wEnt(w, 'سلفة')], ['إضافة', 'i-plus', wEnt(w, 'إضافة')], ['مسحوبات', 'i-minus', wEnt(w, 'مسحوبات')], ['خصم', 'i-minus', wEnt(w, 'خصم')], ['مخالفة', 'i-alert', wEnt(w, 'مخالفة')], ['كشف الحساب', 'i-book', function () { shut(); open('worker', { wid: w.id }); }], ['إرسال كشف الحساب للعامل', 'i-send', function () { shut(); wstOpen(w); }]]);
}
function pgWorker() {
  var w = wk(A.wid), a = wAtt(w), st = a ? stat(a.st) : null, b = wBal(w), bl = [];
  var ent = function (type) { return wEnt(w, type); }, ym0 = monthKeys(1)[0], ms = monthStmt(w, ym0), mc = { bonus: 0, ded: 0, pay: 0 };
  var wk0 = wstWeekFrom(), d0 = today(); /* بطاقات العامل لهذا الأسبوع (من آخر جمعة) لا للشهر (المالك 2026-11-25: 90% من الاستعمال هذا الأسبوع) */
  wlOn().filter(function (e) { return e.w === w.id && e.kind !== 'open' && e.date >= wk0 && e.date <= d0; }).forEach(function (e) { var c = wCat(e); if (wPlusC(c)) mc.bonus += e.amt; else if (c === 'kbuy') mc.kb = (mc.kb || 0) + e.amt; else if (c === 'viol' || c === 'buy' || c === 'ded') mc.ded += e.amt; else if (c === 'pay' || c === 'adv') mc.pay += e.amt; });
  var wf = funds().filter(function (f) { return f.w === w.id; })[0];
  bl.push(B('big', { label: 'الرصيد الحالي', value: balTxt(b), side: wf ? { label: 'مال المطبخ', value: money(fBal(wf.id, 'ils')), go: function () { open('fund', { fid: wf.id }); } } : null,
    text: 'آخر دفعة: ' + wLastPay(w) + (st ? '' : '\nحضور اليوم لم يُسجَّل بعد') }));
  bl.push(B('acts', { items: [
    X({ title: 'دفعة', icon: 'i-wallet', on: true, go: ent('دفعة نقدية') }),
    X({ title: 'إضافة', icon: 'i-plus', tone: 'ok', go: ent('إضافة') }),
    X({ title: 'شراء للمطبخ', icon: 'i-truck', tone: 'info', go: ent('شراء للمطبخ') }),
    X({ title: 'مسحوبات', icon: 'i-minus', tone: 'bad', go: ent('مسحوبات') }),
    X({ title: 'خصم', icon: 'i-minus', tone: 'bad', go: ent('خصم') }),
    X({ title: 'مخالفة', icon: 'i-alert', tone: 'warn', go: ent('مخالفة') })
  ] }));
  if (mc.bonus || mc.ded || mc.pay) bl.push(B('kpi', { items: [
    X({ label: 'إضافات', value: money(mc.bonus), endTone: mc.bonus ? 'ok' : undefined, sub: 'هذا الأسبوع' }),
    X({ label: 'خصومات', value: money(mc.ded), endTone: mc.ded ? 'bad' : undefined, sub: 'هذا الأسبوع' }),
    X({ label: 'دفعات', value: money(mc.pay), sub: 'هذا الأسبوع' })
  ] }));
  /* سجل واحد: اليوم أولًا (حضوره وحركاته) ثم الأيام السابقة، والرصيد أعلاه هو الإجمالي */
  /* السجل: لكل يوم بطاقة واحدة: صف الحضور ثم حركات ذلك اليوم تحته في البطاقة نفسها (مكافأة، خصم، دفعة، مخالفة). الملغاة تبقى تحت يومها بخط باهت وزر «استرجاع» */
  /* السجل بالأسابيع (المالك 2026-11-25): الظاهر «هذا الأسبوع» من آخر جمعة حتى اليوم ولو كان اليوم سبتًا أو أحدًا؛ وفي آخره صف يفتح الأسبوع السابق، وكل ضغطة تفتح أسبوعًا آخر؛ و«طيّ» يعيد لهذا الأسبوع */
  var ents = (S.wl || []).filter(function (e) { return e.w === w.id && e.kind !== 'open' && !(e.void && e.edTo); }), dts = {}, hist = wHist(w, 4000), items = [];
  ents.forEach(function (e) { dts[e.date] = 1; }); hist.forEach(function (h) { dts[h.date] = 1; }); if (st) dts[d0] = 1; /* اليوم غير المسجَّل لا يظهر في الحسابات (تنبيهه في بطاقة الرصيد) */
  var wkOf = function (d) { var x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() - (x.getUTCDay() - 5 + 7) % 7); return x.toISOString().slice(0, 10); }, wkMap = {}, cur0 = wkOf(d0);
  Object.keys(dts).forEach(function (d) { (wkMap[wkOf(d)] = wkMap[wkOf(d)] || []).push(d); });
  var wks = Object.keys(wkMap).filter(function (k) { return k !== cur0; }).sort().reverse(), nOpen = Math.min((A.wkm || {})[w.id] || 0, wks.length);
  var wkLab = function (k) { var e = ownAddDays(k, 6), m1 = +k.slice(5, 7), m2 = +e.slice(5, 7); return +k.slice(8) + (m1 !== m2 ? ' ' + MN[m1 - 1] : '') + ' – ' + (+e.slice(8)) + ' ' + MN[m2 - 1]; };
  var dayRows = function (d) {
    var es = ents.filter(function (e) { return e.date === d; }).sort(function (x, y) { return (x.void ? 1 : 0) - (y.void ? 1 : 0) || x.ts - y.ts; }), head, tg = es.length > 0, r = [];
    if (d === d0) head = X({ tight: tg, title: 'اليوم', tag: st ? st.name : '', tagTone: st ? st.tone : 'mute', end: st && a.st !== 'h' ? money(E.attAmt(a)) : '', chev: true, go: function () { openSh({ t: 'status', wid: w.id }); } });
    else { var h = hist.filter(function (x) { return x.date === d; })[0], t = h ? (stat(h.st) || {}) : null; head = X({ tight: tg, title: dlong(d).replace(/ \d{4}$/, ''), tag: t ? t.name : '', tagTone: t ? t.tone : 'mute', end: h && h.st !== 'h' ? money(E.attAmt(h)) : '' }); }
    r.push(head); es.forEach(function (e, i) { r.push(wlEnt(e, w, i === es.length - 1)); }); return r;
  };
  var setN = function (n) { var m = Object.assign({}, A.wkm || {}); m[w.id] = n; setState({ wkm: m }); };
  (wkMap[cur0] || []).sort().reverse().forEach(function (d) { items = items.concat(dayRows(d)); });
  if (!items.length && wks.length) items.push(X({ title: 'لا حركات هذا الأسبوع' }));
  wks.slice(0, nOpen).forEach(function (k) { items.push(X({ sect: true, title: 'الأسبوع ' + wkLab(k) })); wkMap[k].sort().reverse().forEach(function (d) { items = items.concat(dayRows(d)); }); });
  if (nOpen < wks.length) items.push(X({ more: true, icon: 'i-chevD', icTone: 'mute', title: 'الأسبوع السابق · ' + wkLab(wks[nOpen]), go: function () { setN(nOpen + 1); } }));
  if (nOpen > 0) items.push(X({ more: true, icon: 'i-chevU', icTone: 'mute', title: 'طيّ إلى هذا الأسبوع', go: function () { setN(0); } }));
  bl.push(B('rows', { title: 'السجل', items: items, all: true, empty: 'لا حركات بعد' }));
  if (w.stints && w.stints.length) bl.push(B('rows', { title: 'فترات العمل', items: stintRows(w, false) }));
  bl.push(B('rows', { title: 'الكشف', items: [X({ icon: 'i-doc', icTone: 'info', title: 'كشف حساب ' + monthLabel(ym0), sub: 'صورة للمشاركة', chev: true, go: function () { wstOpen(w); } })] }));
  return bl;
}

/* ---------- صفحة الوصفة ---------- */
function pgRecipe() {
  var r = rec(A.rid), bl = [];
  var per = r.lines.reduce(function (a, l) { return a + l.per * (item(l.item).price || 0); }, 0);
  var edit = function (fn) { return function () { fn(r); mutated('حُفظ التعديل'); }; };
  if (r.draft) bl.push(B('note', { tone: 'warn', icon: 'i-pencil', text: 'وصفة مبدئية: الكميات لقدر واحد، وتصير معتمدة بعد مراجعتك لها.' }));
  bl.push(B('kpi', { items: [
    X({ label: 'تكلفة القدر', value: money(per), sub: 'بآخر سعر شراء' }),
    X({ label: 'المكونات', value: r.lines.length, sub: 'لكل قدر' })
  ].concat(r.draft ? [X({ label: 'الحالة', value: 'مبدئية', sub: 'الوصفة', endTone: 'warn' })] : []) }));
  bl.push(B('chips', { items: ['private', 'external'].map(function (k) {
    return X({ label: (r.kinds.indexOf(k) >= 0 ? '✓ ' : '+ ') + KN[k], on: r.kinds.indexOf(k) >= 0, selTone: k === 'external' ? 'ext' : 'ok', go: edit(function (rr) {
      var i = rr.kinds.indexOf(k);
      if (i >= 0 && rr.kinds.length > 1) rr.kinds.splice(i, 1); else if (i < 0) rr.kinds.push(k);
    }) });
  }) }));
  var rowOf = function (l) {
    var it = item(l.item);
    return X({ title: it.name + (l.opt ? ' (اختياري)' : '') + (l.swap ? ' · قابل للاستبدال' : ''), sub: [l.fixed ? 'ثابتة للطبخة' : '', l.note || '', l.alt ? 'بديل: ' + item(l.alt.item).name : ''].filter(Boolean).join(' · '), end: qv(l.per, it.unit), endSub: qu(l.per, it.unit), chev: true,
      go: function () { openSh({ t: 'recEdit', item: l.item }, { per: String(l.per), fixed: l.fixed ? 'yes' : 'no' }); },
      lp: function () { qa(it.name, qtyU(l.per, it.unit) + ' لقدر واحد', [['تعديل الكمية', 'i-pencil', function () { openSh({ t: 'recEdit', item: l.item }, { per: String(l.per), fixed: l.fixed ? 'yes' : 'no' }); }], ['فتح الصنف', 'i-box', function () { openSh({ t: 'item', id: it.id }); }], ['إزالة من الوصفة', 'i-x', function () { var r = rec(A.rid); r.lines = r.lines.filter(function (x) { return x.item !== it.id; }); recLog(r, 'إزالة ' + it.name); shut(); mutated('أُزيل ' + it.name + ' من الوصفة'); }]]); } });
  };
  [['b', 'الأصناف الأساسية'], ['s', 'البهارات'], ['f', 'الوقود']].forEach(function (c, i) {
    var ls = r.lines.filter(function (l) { return (l.cat || 'b') === c[0]; });
    if (!ls.length && i > 0) return;
    bl.push(B('rows', { title: c[1] + (i === 0 ? ' · لقدر واحد' : ''), act: i === 0 ? 'مكوّن' : '', actGo: function () { openSh({ t: 'recLine', item: null }, {}); }, items: ls.map(rowOf), empty: 'لا مكونات بعد: أضف أول مكوّن' }));
  });
  if (r.water || r.note) bl.push(B('note', { tone: 'info', icon: 'i-book', text: (r.water ? 'الماء: ' + r.water + ' لترًا لكل قدر' + (r.wnote ? ' (' + r.wnote + ')' : '') + '. ' : '') + (r.note || '') }));
  if (r.src) bl.push(B('note', { tone: 'mute', icon: 'i-book', text: 'المصدر: ' + r.src + (r.code ? ' · ' + r.code : '') }));
  if (r.log && r.log.length) bl.push(B('rows', { title: 'سجل تعديلات الوصفة', items: r.log.slice(0, 5).map(function (e) { return X({ title: e.what, sub: dlabel(e.date) }); }) }));
  bl.push(B('btns', { items: [
    X({ label: r.draft ? 'اعتماد الوصفة' : 'وصفة معتمدة', icon: 'i-check', on: !!r.draft, go: edit(function (rr) { if (rr.draft) { rr.draft = false; recLog(rr, 'اعتماد الوصفة'); } }) }),
    X({ label: 'نسخة للشيف', icon: 'i-send', go: function () { shareChefRec(r); } })
  ] }));
  return bl;
}
function recLog(r, what) { r.log = r.log || []; r.log.unshift({ date: today(), what: what }); r.log = r.log.slice(0, 30); }
/* فروق طبخة عن وصفتها: ما يمكن أن تتحدّث به الوصفة (اختياري، ولا يحدث وحده) */
function batchDiffs(b) {
  var rc = rec(b.recipe), out = []; if (!rc || !b.pots) return out;
  var pln = plannedOf(b), has = {};
  b.lines.forEach(function (l) {
    var it = item(l.item), r0 = E.by(rc.lines, l.item), per = r0 && r0.fixed ? l.qty : Math.round(l.qty / b.pots * 10000) / 10000; has[l.item] = 1;
    if (!r0) out.push({ op: 'add', item: l.item, per: per, name: it.name, txt: 'يُضاف للوصفة: ' + fmt(per) + ' ' + it.unit + ' لكل قدر', tag: 'إضافة', tone: 'ok' });
    else if (Math.abs(l.qty - pln[l.item]) > 0.0001) out.push({ op: 'set', item: l.item, per: per, name: it.name, txt: (r0.fixed ? 'ثابت: ' : 'لكل قدر: ') + fmt(r0.per) + ' ← ' + fmt(per) + ' ' + it.unit, tag: 'تعديل', tone: 'warn' });
  });
  rc.lines.forEach(function (l) { if (!has[l.item]) out.push({ op: 'del', item: l.item, name: item(l.item).name, txt: 'يُحذف من الوصفة', tag: 'حذف', tone: 'warn' }); });
  return out;
}
function doRecFromBatch(id) {
  var b = E.by(S.batches, id), rc = rec(b.recipe), df = batchDiffs(b);
  df.forEach(function (x) {
    if (x.op === 'add') rc.lines.push({ item: x.item, per: x.per, cat: (item(x.item).grp === 'spice') ? 's' : 'b', fixed: false });
    else if (x.op === 'set') { E.by(rc.lines, x.item).per = x.per; } else rc.lines = rc.lines.filter(function (l) { return l.item !== x.item; });
  });
  recLog(rc, 'تحديث من طبخة ' + dlabel(b.date) + ' (' + pl(df.length, 'فرق واحد', 'فرقان', 'فروق') + ')'); audit('تحديث وصفة «' + rc.name + '» من طبخة'); shut(); mutated('حُدّثت الوصفة بكميات هذه الطبخة');
}

/* ---------- الأرصدة الافتتاحية (نفس مكونات الصفوف) ---------- */
var OPV = null;
function opInit() {
  if (OPV) return;
  OPV = {};
  itemsIn('kitchen').forEach(function (it) { OPV[it.id] = E.balance(S, 'kitchen', it.id); });
  if (PROP && !S.settings.openingDone) Object.keys(PROP.items).forEach(function (id) { if (item(id) && !(OPV[id] > 0)) OPV[id] = PROP.items[id]; });
}
function pgOpening() {
  opInit();
  var ids = Object.keys(OPV).filter(function (id) { return item(id); }).sort(function (a, b) { return item(a).name.localeCompare(item(b).name, 'ar'); });
  return [
    B('note', { tone: 'info', icon: 'i-pencil', text: 'اضغط على أي صنف لتصحيح رقمه بما عددته فعليًا، ثم اعتمد.' }),
    B('rows', { title: 'المخزن · ' + pl(ids.length, 'صنف واحد', 'صنفان', 'أصناف'), items: ids.map(function (id) {
      var it = item(id), changed = OPV[id] !== E.balance(S, 'kitchen', id);
      return X({ title: it.name, end: fmt(OPV[id]) + ' ' + it.unit, endSub2: packTxt(it, OPV[id]), chev: true, tag: changed ? 'معدّل' : '', tagTone: 'info',
        go: function () { openSh({ t: 'opItem', id: id }, { qty: String(OPV[id]) }); } });
    }), empty: 'لا أصناف' })
  ];
}

/* ===== 04-sheets.js ===== */
/* ---------- وصف النافذة المفتوحة (نفس بنية التصميم) ---------- */
function packsOf(it) { return it.packs && it.packs.length ? it.packs : (it.pack ? [it.pack] : []); }
function packIdx(mode) { return mode === 'pack' ? 0 : mode && mode.charAt(0) === 'p' ? +mode.slice(1) : -1; }
function unitF(it, mode) { var i = packIdx(mode), p = i >= 0 ? packsOf(it)[i] : null; return p ? p.n : 1; }
function itemTotal(id) { return totalQty(id); }
function aliasList(txt) { var seen = {}; return String(txt || '').split(/[,،\n]/).map(function (x) { return x.trim(); }).filter(function (x) { var k = norm(x); if (!x || seen[k]) return false; seen[k] = 1; return true; }); }
function packTypes() { var o = ['شوال', 'كرتونة', 'كيس', 'جركن']; S.items.forEach(function (i) { packsOf(i).forEach(function (p) { if (o.indexOf(p.name) < 0) o.push(p.name); }); }); return o; }
function conds() { var o = ['جاف', 'بارد', 'مجمّد']; S.items.forEach(function (i) { if (i.cond && o.indexOf(i.cond) < 0) o.push(i.cond); }); return o; }
function itemList(l) {
  var inL = {}; S.moves.forEach(function (m) { if (m.led === l && m.kind !== 'hist') inL[m.item] = 1; });
  return S.items.slice().sort(function (x, y) { return ((x.grp === 'spice' ? 1 : 0) - (y.grp === 'spice' ? 1 : 0)) || (usedCount(y.id) - usedCount(x.id)); }).map(function (it) {
    return { id: it.id, name: it.name, alias: it.alias || [], sub: it.unit + (inL[it.id] ? ' · الرصيد ' + fmt(E.balance(S, l, it.id)) : ' · غير مسجّل في هذا المخزن'), tag: '', tagTone: 'mute' };
  });
}
function newId(prefix, list) { var n = list.length + 1, id; do { id = prefix + n++; } while (E.by(list, id)); return id; }
/* ضغطة مطوّلة على صف: نافذة إجراءات سريعة (كلها تفتح نوافذ التطبيق المعتادة، ولا شيء يُنفَّذ مباشرة) */
function qa(title, sub, acts) { openSh({ t: 'qa', title: title, sub: sub, acts: acts }); }
function openItemEdit(it) { openSh({ t: 'itemEdit', id: it.id }, { name: it.name, unit: it.unit, unitNew: '', packType: it.pack ? it.pack.name : 'none', packNew: '', packN: it.pack ? String(it.pack.n) : '', cond: it.cond || 'جاف', condNew: '', grp: it.grp || '', alias: (it.alias || []).join('، '), sup: it.sup || '', price: String(it.price || '') }); }
var KIND = { opening: 'رصيد افتتاحي', receive: 'استلام', batch: 'طبخة', adjust: 'جرد', hist: 'سجل قديم', issue: 'صرف', cover: 'تغطية (ملغاة)' };
function dupOf(list, name) { return list.filter(function (x) { return norm(x.name) === norm(name); })[0]; }
function dupMsg(x, what) { return !x ? '' : x.arch ? '«' + x.name + '» مؤرشف سابقًا.' : 'يوجد ' + what + ' «' + x.name + '» بنفس الاسم، اخترْه بدل التكرار.'; }

function shDesc() {
  var sh = A.sh, d = A.draft, R = {}, nm, dup, it, w, l, q0, st;
  switch (sh.t) {
    case 'dish': {
      R = pickOr(S.recipes.filter(function (r) { return !r.arch && (!fv('kind') || r.kinds.indexOf(fv('kind')) >= 0); }).sort(function (a, b) { return recUsed(b.id) - recUsed(a.id); }).map(function (r) {
        return { id: r.id, name: r.name, sub: (r.code ? r.code + ' · ' : '') + nIng(r.lines.length) + (r.draft ? ' · مبدئية' : ''), tag: r.kinds.length === 2 ? '' : KN[r.kinds[0]] };
      }), { title: 'اختر الطبخة', sub: 'من المسجّلة عندك، أو أضف طبخة جديدة إن لم تجدها', plural: 'الطبخات', addLabel: 'إضافة طبخة جديدة', sel: d.rec,
        onPick: function (id) {
          var r = rec(id); if (r.kinds.indexOf(d.kind) < 0) r.kinds.push(d.kind);
          A.draft = Object.assign({}, d, { rec: id, dish: '', over: {}, del: {}, extra: [] }); A.sh = null; A.q = ''; save(); render();
        },
        onAdd: function (name) { openSh({ t: 'addRecipe', fromBatch: true }, { name: name, kinds: d.kind }); } });
      break;
    }
    case 'instp': {
      R = pickOr(instsOf(d.init).map(function (i) {
        var l1 = led(i.led);
        return { id: i.id, name: i.name, sub: d.init ? (i.occ || 'جهة أو فرد') : l1.inkind ? 'مواد عينية من: ' + l1.name : 'من المخزن الخارجي، ويُغطّى الناقص من المخزن', tag: d.init ? '' : l1.inkind ? 'مواد عينية' : 'من الخارجي' };
      }), { title: d.init ? 'اختر الجهة' : 'اختر المؤسسة', sub: d.init ? 'فرد أو جهة متفرقة (عرس، عزاء…)' : 'المؤسسة تحدد من أي مخزن تُخصم المواد', plural: d.init ? 'الجهات' : 'المؤسسات', addLabel: d.init ? 'إضافة جهة جديدة' : 'إضافة مؤسسة جديدة', sel: d.inst,
        onPick: function (id) { A.draft = Object.assign({}, A.draft, { inst: id }); A.sh = null; A.q = ''; render(); },
        onAdd: function (name) { openSh({ t: d.init ? 'addInit' : 'addInst', fromBatch: true }, { name: name, src: 'own', occ: '' }); } });
      break;
    }
    case 'addRecipe': {
      nm = fv('name').trim(); dup = dupOf(S.recipes, nm);
      R = { title: 'طبخة جديدة', sub: 'تُحفظ وصفة مبدئية، وتكتمل مكوناتها من أول طبخة', fields: [
          fText('name', 'اسم الطبخة', 'مثال: مقلوبة دجاج'),
          fChips('kinds', 'تُطبخ لـ', [['private', 'طبخ'], ['external', 'طبخ خارجي'], ['both', 'الاثنين']])
        ], dup: dupMsg(dup, 'طبخة'),
        ft: { label: 'حفظ الطبخة', ok: nm.length > 1 && !dup, go: function () { doAddRecipe(sh.fromBatch); } } };
      break;
    }
    case 'addInst': {
      nm = fv('name').trim(); dup = dupOf(S.insts, nm);
      R = { title: 'مؤسسة جديدة', sub: 'حدّد من أين تأتي مواد الطبخ لها', fields: [
          fText('name', 'اسم المؤسسة', 'مثال: جمعية الأمل'),
          fChips('src', 'مواد الطبخ لها', [['own', 'من المخزن الخارجي (ويغطّي المخزن جزءًا)'], ['inkind', 'عينية منها (مخزن مستقل)']], 'اختيار «عينية» ينشئ مخزنًا مستقلًا لموادها، كما هو الحال مع WFP.')
        ], dup: dupMsg(dup, 'مؤسسة'),
        ft: { label: 'حفظ المؤسسة', ok: nm.length > 1 && !dup, go: function () { doAddInst(sh.fromBatch); } } };
      break;
    }
    case 'addInit': {
      nm = fv('name').trim(); dup = dupOf(S.insts, nm);
      R = { title: 'جهة جديدة', sub: 'فرد أو جهة متفرقة: تُسحب موادها من المخزن الخارجي', fields: [
          fText('name', 'الاسم', 'مثال: عرس أبو خالد'), fText('occ', 'المناسبة (اختياري)', 'مثال: وليمة عرس')
        ], dup: dupMsg(dup, 'جهة'),
        ft: { label: 'حفظ الجهة', ok: nm.length > 1 && !dup, go: function () { doAddInit(sh.fromBatch); } } };
      break;
    }
    case 'addLedger': {
      nm = fv('name').trim(); dup = dupOf(S.ledgers, nm);
      R = { title: 'مخزن جديد', sub: 'كل مخزن له أرصدته وحركاته المستقلة', fields: [
          fText('name', 'اسم المخزن', 'مثال: مخزن المطبخ الفرعي'),
          fChips('inkind', 'نوع المخزن', [['own', 'مدفوع (على حسابك)'], ['inkind', 'مواد عينية من جهة']])
        ], dup: dup ? 'يوجد «' + dup.name + '» بنفس الاسم.' : '',
        ft: { label: 'حفظ المخزن', ok: nm.length > 1 && !dup, go: function () { doAddLedger(); } } };
      break;
    }
    case 'recv': {
      var lid = fv('led') || (led(A.led) && !led(A.led).arch ? A.led : 'kitchen');
      if (!sh.item) {
        R = pickOr(itemList(lid), { title: 'استلام مواد', sub: 'إلى ' + led(lid).name, plural: 'الأصناف', then: 'recv', addLabel: 'إضافة صنف جديد', sel: '',
          onPick: function (id) { openSh({ t: 'recv', item: id }, { led: lid, unitMode: 'base', qty: '', price: '' }); },
          onAdd: function (name) { openSh({ t: 'addItem', then: 'recv' }, { name: name, unit: 'كيلو', price: '', led: lid }); } });
        break;
      }
      it = item(sh.item);
      var rq = num('qty') * unitF(it, fv('unitMode')), paid = !E.isFree(led(lid));
      var fl = [fChips('led', 'المخزن', ledgers().map(function (x) { return [x.id, x.name]; }))];
      var pks = packsOf(it), pim = packIdx(fv('unitMode')), cur0 = E.balance(S, lid, it.id);
      fl.push(fChips('unitMode', 'الوحدة المستلمة', [['base', it.unit]].concat(pks.map(function (p, i) { return ['p' + i, p.name + ' · ' + fmt(p.n) + ' ' + it.unit]; }))));
      fl.push(fText('qty', 'الكمية المستلمة', '0', 'decimal'));
      if (paid) fl.push(fText('price', 'سعر ' + it.unit + ' (اختياري)', 'الآن ' + fmt(it.price || 0), 'decimal', 'يحدّث آخر سعر شراء، وتُحسب به الطبخات القادمة.'));
      var rdw = rcvWhen(), rd = rcvDate(), ral = rcvAlerts(it, lid, r3(rq), num('price')); fl.push(rdw[0]); fl.push(fPhoto('صورة فاتورة المورّد (اختياري)'));
      R = { title: 'استلام: ' + it.name, sub: 'الرصيد الآن ' + fmt(cur0) + ' ' + it.unit, fields: fl,
        note: rcvNote(rd) || (ral.notes.length ? { text: ral.notes.join('. ') + '.', tone: 'warn' } : { text: rq > 0 ? 'الرصيد بعد الاستلام: ' + fmt(cur0 + rq) + ' ' + it.unit + (pim > 0 ? '. وسيصبح هذا الحجم هو الحجم الحالي للصنف.' : '') : '', tone: 'info' }),
        ft: { label: ral.dup ? 'تسجيل الاستلام رغم التشابه' : 'تسجيل الاستلام', ok: rq > 0 && rcvOk(rd), go: function () { doRecv(it, lid); } } };
      break;
    }
    case 'qa': {
      R = { title: sh.title, sub: sh.sub || 'إجراءات سريعة', rows: sh.acts.map(function (a) { return X({ icon: a[1], icTone: 'mute', title: a[0], chev: true, go: a[2] }); }) };
      break;
    }
    case 'count': {
      var cl = fv('led') || (led(A.led) && !led(A.led).arch ? A.led : 'kitchen'), cin = {};
      S.moves.forEach(function (m) { if (m.led === cl && m.kind !== 'hist') cin[m.item] = 1; });
      var cits = spiceLast(itemList(cl).filter(function (x) { return cin[x.id]; }), function (x) { return x.id; }), cf = [], cdiff = [], cneg = [];
      if (ledgers().length > 1) cf.push(fChips('led', 'المخزن', ledgers().map(function (x) { return [x.id, x.name]; })));
      cits.forEach(function (x) {
        var ci = item(x.id), cb = E.balance(S, cl, x.id), cv = fv('c_' + x.id);
        cf.push(fText('c_' + x.id, ci.name + ' · الرصيد ' + fmt(cb) + ' ' + ci.unit, fmtRaw(cb), 'decimal'));
        if (cv !== '' && cv != null) { var cn = evalNum(cv); if (cn < 0) cneg.push(ci.name); else if (r3(cn - cb) !== 0) cdiff.push({ it: ci, dq: r3(cn - cb) }); }
      });
      R = { title: 'جرد المخزن', sub: led(cl).name + ' · اكتب الكمية الفعلية فقط لما تغيّر، والباقي يبقى كما هو', fields: cf,
        note: cneg.length ? { text: 'الكمية الفعلية لا تكون سالبة: ' + cneg.join('، '), tone: 'warn' } : cdiff.length ? { text: pl(cdiff.length, 'صنف واحد يتغيّر', 'صنفان يتغيّران', 'أصناف تتغيّر') + ': ' + cdiff.slice(0, 4).map(function (d) { return d.it.name + ' ' + (d.dq > 0 ? '+' : '') + fmt(d.dq); }).join('، ') + (cdiff.length > 4 ? '…' : ''), tone: 'info' } : { text: 'الخانة الفارغة تعني أن الرصيد المسجّل صحيح.', tone: 'info' },
        ft: { label: cdiff.length ? 'حفظ الجرد (' + cdiff.length + ')' : 'حفظ الجرد', ok: cdiff.length > 0 && !cneg.length, go: function () { doCount2(cl, cdiff); } } };
      break;
    }
    case 'adjust': {
      var al = fv('led') || (led(A.led) && !led(A.led).arch ? A.led : 'kitchen');
      if (!sh.item) {
        R = pickOr(itemList(al), { title: 'جرد المخزن', sub: 'تالف أو هدر أو تبرع أو فرق جرد · ' + led(al).name + ' · اختر الصنف', plural: 'الأصناف', then: 'adjust', addLabel: '', sel: '',
          onPick: function (id) { openSh({ t: 'adjust', item: id }, { led: al, how: 'amt', why: '', sign: '', unitMode: 'base', qty: '', note: '', day: '0', dtxt: '' }); } });
        break;
      }
      it = item(sh.item); var ac = adjCalc(it, al), ap = packsOf(it), afl = [fChips('led', 'المخزن', ledgers().map(function (x) { return [x.id, x.name]; })), fChips('how', 'طريقة الجرد', [['amt', 'كمية تالفة أو ناقصة'], ['cnt', 'جرد: الرصيد الفعلي']])];
      if (ac.how === 'amt') afl.push(fChips('why', 'السبب', whys().map(function (w) { return [w.id, w.name + (w.dir === 0 ? ' (+ أو −)' : w.dir > 0 ? ' (+)' : ' (−)')]; })));
      var aw = E.by(whys(), fv('why')); if (ac.how === 'amt' && aw && aw.dir === 0) afl.push(fChips('sign', 'اتجاه الفرق', [['up', 'زيادة (+)'], ['down', 'نقص (−)']]));
      if (ap.length) afl.push(fChips('unitMode', 'الوحدة', [['base', it.unit]].concat(ap.map(function (p, i) { return ['p' + i, p.name + ' · ' + fmt(p.n) + ' ' + it.unit]; }))));
      afl.push(fText('qty', ac.how === 'cnt' ? 'الرصيد الفعلي بعد العدّ' : 'الكمية', '0', 'decimal'));
      afl.push(fText('note', 'ملاحظة (اختياري)', 'مثال: انتهت صلاحيته'));
      var adw = rcvWhen(), ad = rcvDate(); afl.push(adw[0]);
      var aOk = ac.dq !== 0 && rcvOk(ad) && ac.after >= 0 && (ac.how === 'cnt' || !!ac.wn);
      R = { title: 'جرد: ' + it.name, sub: 'الرصيد المسجّل ' + fmt(ac.bal) + ' ' + it.unit + ' في ' + led(al).name, fields: afl,
        note: rcvNote(ad) || (ac.dq ? { text: (ac.dq > 0 ? 'يزيد ' : 'ينقص ') + fmt(Math.abs(ac.dq)) + ' ' + it.unit + (ac.wn ? ' (' + ac.wn + ')' : '') + ' · الرصيد بعد الجرد ' + fmt(ac.after) + ' ' + it.unit + (ac.after < 0 ? ' — أكبر من الرصيد الموجود' : '') + '. لا تُحسب استهلاكًا في التقارير.', tone: ac.after < 0 ? 'warn' : 'info' } : (ac.how === 'cnt' && fv('qty') !== '' ? { text: 'الرصيد الفعلي مطابق للمسجّل: لا حاجة لتسوية.', tone: 'ok' } : null)),
        ft: { label: 'تسجيل الجرد', ok: aOk, go: function () { doAdjust(it, al); } } };
      break;
    }
    case 'issue': {
      var il = fv('led') || A.led;
      if (!sh.item) {
        R = pickOr(itemList(il), { title: 'صرف مواد من المخزن', sub: 'أي مادة خرجت لغير الطبخ: مكنسة، منظفات، أكياس…', plural: 'الأصناف', then: 'issue', addLabel: '', sel: '',
          onPick: function (id) { openSh({ t: 'issue', item: id }, { led: il, qty: '', why: '' }); } });
        break;
      }
      it = item(sh.item);
      var iq = num('qty'), iq0 = E.balance(S, il, it.id);
      R = { title: 'صرف: ' + it.name, sub: 'الرصيد الآن ' + fmt(iq0) + ' ' + it.unit, fields: [
          fChips('led', 'من أي مخزن؟', ledgers().map(function (x) { return [x.id, x.name]; })),
          fText('qty', 'الكمية المصروفة (' + it.unit + ')', '0', 'decimal'),
          fText('why', 'السبب (اختياري)', 'مثال: كنس الساحة، تنظيف')
        ], note: { text: iq > iq0 ? 'الكمية أكبر من الرصيد الموجود' : iq > 0 ? 'الرصيد بعد الصرف: ' + fmt(iq0 - iq) + ' ' + it.unit + '.' : '', tone: iq > iq0 ? 'warn' : 'info' },
        ft: { label: 'تسجيل الصرف', ok: iq > 0 && iq <= iq0, go: function () { doIssue(it, il); } } };
      break;
    }
    case 'addItem': {
      nm = fv('name').trim(); dup = dupOf(S.items, nm);
      var dupA = !dup && nm ? S.items.filter(function (x) { return (x.alias || []).some(function (a) { return norm(a) === norm(nm); }); })[0] : null;
      R = { title: 'صنف جديد', sub: 'يُضاف للمخزن المفتوح الآن: ' + led(fv('led') || A.led).name, fields: [
          fText('name', 'اسم الصنف', 'مثال: سكر'),
          fDD('unit', 'الوحدة', (S.units || []).map(function (u) { return [u, u]; })),
          fDD('packType', 'التعبئة', [['none', 'بدون']].concat(packTypes().map(function (t) { return [t, t]; }))),
          fText('packN', 'سعة العبوة', '25', 'decimal'),
          fDD('cond', 'التخزين', conds().map(function (t) { return [t, t]; })),
          fChips('grp', 'المجموعة', [['', 'أساسي'], ['spice', 'بهارات']]),
          fText('alias', 'أسماء أخرى (اختياري)', 'صلصة، رب البندورة', 'text'),
          fText('price', 'آخر سعر للوحدة (اختياري)', '0', 'decimal')
        ], dup: dup ? 'يوجد «' + dup.name + '» بنفس الاسم، اخترْه بدل التكرار.' : (dupA ? '«' + nm + '» اسم بديل للصنف «' + dupA.name + '». اخترْه بدل التكرار.' : ''),
        ft: { label: 'حفظ الصنف', ok: nm.length > 1 && !dup && !dupA, go: function () { doAddItem(sh.then); } } };
      break;
    }
    case 'item': {
      it = item(sh.id); l = A.led; q0 = E.balance(S, l, it.id); st = stStatus(q0, it.id);
      var mv = S.moves.filter(function (m) { return m.led === l && m.item === it.id; }).sort(function (a, b) { return a.date === b.date ? b.ts - a.ts : (a.date < b.date ? 1 : -1); }).slice(0, 6);
      var ipk = packsOf(it), ptx = packTxt(it, q0), uu = usageOf(it.id);
      var info = [
        X({ title: 'الرصيد في ' + led(l).name, end: fmt(q0) + ' ' + it.unit, endSub: ptx, endTone: st.rank < 3 ? 'warn' : 'ok' })
      ];
      if (uu) info.push(X({ title: 'المعتاد في يوم طبخ', sub: 'آخر استعمال ' + dlabel(uu.last), end: qtyU(uu.typical, it.unit) }));
      var cfg = [
        X({ title: 'الوحدة', tag: it.unit, tagTone: 'mute' }),
        X({ title: 'التعبئة', sub: ipk.length > 1 ? 'سابقًا: ' + ipk.slice(1).map(function (p) { return p.name + ' ' + fmt(p.n); }).join('، ') : '', tag: it.pack ? '1 ' + it.pack.name + ' = ' + fmt(it.pack.n) + ' ' + it.unit : 'غير محددة', tagTone: 'mute' }),
        X({ title: 'التخزين', tag: it.cond || 'جاف', tagTone: 'mute' }),
        X({ title: 'المجموعة', tag: it.grp === 'spice' ? 'بهارات' : 'أساسي', tagTone: 'mute' })
      ];
      if ((it.alias || []).length) cfg.push(X({ title: 'أسماء أخرى', tag: it.alias.join('، '), tagTone: 'mute' }));
      R = { title: it.name, sub: 'آخر سعر ' + money(it.price || 0) + ' للـ' + it.unit + (st.rank < 3 ? ' · ' + st.t : ''),
        rows: info.concat(mv.map(function (m) { return phRow({ title: (KIND[m.kind] || m.kind) + (m.note && m.kind !== 'opening' ? ' · ' + m.note : ''), sub: dlabel(m.date), tag: (m.q > 0 ? 'دخل ' : 'خرج ') + fmt(Math.abs(m.q)) + ' ' + it.unit, tagTone: m.q > 0 ? 'ok' : 'bad' }, m, it.name + ' · ' + dlabel(m.date)); }), cfg), empty: '',
        acts: [X({ title: 'جرد', icon: 'i-check', go: function () { openSh({ t: 'adjust', item: it.id }, { led: l, how: 'amt', why: '', unitMode: 'base', qty: '', note: '', day: '0', dtxt: '' }); } }), X({ title: 'صرف', icon: 'i-box', go: function () { openSh({ t: 'issue', item: it.id }, { led: l, qty: '', why: '' }); } })],
        ft: { label: 'استلام ' + it.name, ok: true, go: function () { openSh({ t: 'recv', item: it.id }, { led: l, unitMode: 'base', qty: '', price: '' }); } },
        ft2: { label: 'تعديل البيانات', go: function () { openItemEdit(it); } } };
      break;
    }
    case 'itemEdit': {
      it = item(sh.id); var hasStk = itemTotal(it.id) !== 0, eu = hasStk ? it.unit : ((fv('unitNew') || '').trim() || fv('unit') || it.unit);
      var ept = (fv('packNew') || '').trim() || fv('packType'), epn = num('packN'), epack = ept && ept !== 'none' && epn > 0 ? { name: ept, n: epn } : null, efl = [fText('name', 'اسم الصنف', it.name, 'text', 'تغيير الاسم لا يمس الرصيد ولا الحركات ولا الوصفات؛ يبقى الاسم القديم اسمًا آخر للصنف.')];
      if (!hasStk) { efl.push(fDD('unit', 'الوحدة الأساسية (الصغرى)', (S.units || []).map(function (u) { return [u, u]; }), 'أصغر وحدة يُعدّ بها الصنف. تُغيَّر فقط ما دام رصيده صفرًا.')); efl.push(fText('unitNew', 'أو وحدة جديدة', 'مثال: جالون')); }
      efl.push(fDD('packType', 'وحدة التعبئة (الكبرى)', [['none', 'بدون']].concat(packTypes().map(function (t) { return [t, t]; })), 'ما يصل به الصنف من المورّد: شوال، كرتونة…'));
      efl.push(fText('packNew', 'أو نوع تعبئة جديد', 'مثال: جركن'));
      efl.push(fText('packN', 'سعة العبوة: كم ' + eu + ' فيها؟', '25', 'decimal', 'تتغير سعة الشوال والكرتونة بحسب المورّد، فعدّلها هنا متى تغيّرت. الأرصدة تبقى بالـ' + eu + ' ولا تتأثر.'));
      efl.push(fDD('cond', 'نوع التخزين', conds().map(function (t) { return [t, t]; })));
      efl.push(fChips('grp', 'المجموعة', [['', 'أساسي'], ['spice', 'بهارات']]));
      efl.push(fText('alias', 'أسماء أخرى للصنف', 'مثال: صلصة، رب البندورة', 'text', 'الأسماء التي تكتبها المؤسسات في طلبياتها. افصل بينها بفاصلة.'));
      efl.push(fText('condNew', 'أو نوع تخزين جديد', 'مثال: يحتاج تبريد'));
      efl.push(fText('price', 'آخر سعر للـ' + eu + ' (اختياري)', '0', 'decimal')); efl.push(fText('sup', 'المورّد المعتاد (اختياري)', 'مثال: أبو أحمد للخضار', 'text', 'تُجمَّع به قائمة المشتريات'));
      var tq = itemTotal(it.id);
      R = { title: 'بيانات ' + it.name, sub: 'الوحدة الأساسية: ' + it.unit + ' · الرصيد الكلي ' + fmt(tq), fields: efl,
        note: { text: epack ? '1 ' + epack.name + ' = ' + fmt(epack.n) + ' ' + eu + '. رصيدك الحالي ' + fmt(tq) + ' ' + eu + (packTxt({ unit: eu, pack: epack }, tq) ? ' = ' + packTxt({ unit: eu, pack: epack }, tq) : '') : 'بلا وحدة تعبئة: يُعرض الرصيد بالـ' + eu + ' فقط.', tone: 'info' },
        ft: { label: 'حفظ البيانات', ok: true, go: function () { doEditItem(it.id); } } };
      break;
    }
    case 'status': {
      w = wk(sh.wid); var sd = sh.date || today(), ca = E.attOn(S, sd, w.id);
      R = { title: w.name, sub: 'حالة حضور ' + (sd === today() ? 'اليوم' : dlong(sd)) + ' · ' + money(w.daily) + ' يوميًا',
        rows: (S.stats || []).filter(function (t) { return !t.sys; }).map(function (t) {
          return X({ title: t.name, sub: (t.mult === 0 ? 'بلا أجر' : t.mult !== 1 ? '× ' + t.mult + ' من اليومية' : 'يومية كاملة') + (t.bonus ? ' + ' + money(t.bonus) : ''),
            tag: money(r2(w.daily * t.mult + t.bonus)), tagTone: t.tone, sel: !!ca && ca.st === t.id, go: function () { setStat(w.id, t.id, sd); } });
        }),
        add: { label: '+ إضافة حالة حضور جديدة', go: function () { openSh({ t: 'addStat' }, { name: '', mult: '1', bonus: '' }); } },
        ft: { label: 'كشف حساب ' + w.name, ok: true, go: function () { open('worker', { wid: w.id }); } } };
      break;
    }
    case 'addStat': {
      nm = fv('name').trim(); dup = dupOf(S.stats, nm);
      R = { title: 'حالة حضور جديدة', sub: 'تحدد كم يُحسب للعامل في اليوم', fields: [
          fText('name', 'اسم الحالة', 'مثال: نصف يوم'),
          fChips('mult', 'أثرها على اليومية', [['1', 'يومية كاملة'], ['0.8', '× 0.8'], ['0.5', 'نصف يومية'], ['0', 'بلا أجر']]),
          fText('bonus', 'إضافة ثابتة (اختياري)', '0', 'decimal', 'مثل 10 ₪ للامتياز.')
        ], dup: dup ? 'يوجد «' + dup.name + '» بنفس الاسم.' : '',
        ft: { label: 'حفظ الحالة', ok: nm.length > 1 && !dup, go: function () { doAddStat(); } } };
      break;
    }
    case 'pickWorker': {
      R = pickOr(activeW().map(function (x) { return { id: x.id, name: x.name, sub: balTxt(wBal(x)), tag: '' }; }),
        { title: 'على أي عامل؟', sub: 'اختر عاملًا لتسجيل دفعة أو خصم أو إضافة', plural: 'العمال', addLabel: 'إضافة عامل جديد', sel: '',
          onPick: function (id) { openSh({ t: 'entry', wid: id }, { type: 'دفعة نقدية', amt: '', note: '', sev: 'warn' }); },
          onAdd: function (name) { openSh({ t: 'addWorker', then: true }, { name: name, wage: '' }); } });
      break;
    }
    case 'addWorker': {
      nm = fv('name').trim(); dup = dupOf(S.workers || [], nm);
      R = { title: 'عامل جديد', sub: 'يظهر فورًا في الحضور والحسابات', fields: [fText('name', 'اسم العامل', 'الاسم'), fText('wage', 'اليومية بالشيكل', '50', 'decimal'), fText('phone', 'رقم الجوال (اختياري)', '05XXXXXXXX', 'tel')],
        dup: dupMsg(dup, 'عامل'), ft: { label: 'حفظ العامل', ok: nm.length > 1 && num('wage') > 0 && !dup, go: function () { doAddWorker(sh.then); } } };
      if (dup && dup.arch) R.add = { label: 'استعادة «' + dup.name + '» وإكمال سجله', go: function () { openSh({ t: 'unarch', k: 'worker', id: dup.id }, { wage: String(dup.daily || '') }); } };
      break;
    }
    case 'entry': {
      w = wk(sh.wid);
      var type = fv('type') || 'دفعة نقدية', amt = num('amt'), plus = type === 'إضافة' || type === 'شراء للمطبخ' || (type === 'تسوية' && fv('adjd') === 'up'), isV = type === 'مخالفة', sev = fv('sev') || 'warn';
      var bw = wBal(w), after = r2(bw + (plus ? 1 : -1) * ((isV && sev === 'warn') ? 0 : amt)), ef = [];
      if (!fv('dtxt')) A.form.dtxt = today(); var edt = dateNear(fv('dtxt'));
      ef.push(fDate('dtxt', 'التاريخ', '', today()));
      ef.push(fChips('type', 'نوع الحركة', [['دفعة نقدية', 'دفعة'], ['سلفة', 'سلفة'], ['إضافة', 'إضافة'], ['شراء للمطبخ', 'شراء للمطبخ'], ['مسحوبات', 'مسحوبات'], ['خصم', 'خصم'], ['مخالفة', 'مخالفة'], ['تسوية', 'تسوية']]));
      if (type === 'تسوية') { if (!fv('adjd')) A.form.adjd = 'down'; ef.push(fSeg('adjd', 'اتجاه التسوية', [['down', 'عليه (نقص)'], ['up', 'له (زيادة)']])); }
      if (isV) {
        ef.push(fChips('sev', 'الإجراء', [['warn', 'تنبيه فقط'], ['ded', 'تنبيه وخصم']]));
        ef.push(fText('note', 'ما المخالفة؟ (اختياري)', 'مثال: تأخر عن الدوام'));
        if (sev === 'ded') { ef.push(fText('amt', 'مبلغ الخصم', '0', 'decimal')); ef.push(fQuick('amt', 'مبالغ سريعة', [5, 10, 20, 50])); }
      } else {
        ef.push(fPair('amt', 'المبلغ ₪', 'note', 'البيان (اختياري)', type === 'إضافة' ? 'سبب الإضافة: مواصلات، اتصالات، امتياز…' : type === 'شراء للمطبخ' ? 'مثال: خرطوم، أكياس نفايات' : type === 'مسحوبات' ? 'مثال: 8 لتر زيت أخذها' : type === 'خصم' ? 'سبب الخصم' : ''));
        ef.push(fQuick('amt', 'مبالغ سريعة', [5, 10, 20, 50, 100].concat(type === 'دفعة نقدية' && bw > 0 && [5, 10, 20, 50, 100].indexOf(bw) < 0 ? [[bw, 'المستحق كاملًا ' + fmt(bw) + ' ₪']] : [])));
        if (type === 'دفعة نقدية' || type === 'سلفة') ef = ef.concat(fundFields());
      }
      ef.push(fPhoto(isV ? 'صورة توثيق المخالفة (اختياري)' : type === 'دفعة نقدية' || type === 'سلفة' ? 'صورة سند الصرف (اختياري)' : 'صورة توثيق (اختياري)'));
      var okV = isV ? (sev === 'warn' || amt > 0) : amt > 0, payT = type === 'دفعة نقدية' || type === 'سلفة', pp = payT ? payPlan(fund(fv('fund') || defFund()), amt, num('rate')) : null; if (payT) okV = okV && pp.ok; okV = okV && !!edt && edt <= today();
      var HINT = { 'دفعة نقدية': 'مبلغ يُدفع من مستحقاته', 'سلفة': 'مبلغ قبل استحقاقه، يُخصم من حسابه', 'إضافة': 'تُضاف إلى حسابه، واكتب سببها في البيان', 'شراء للمطبخ': 'اشتراه من ماله للمطبخ: يُعوَّض مع راتبه', 'مسحوبات': 'مواد أخذها من المطبخ، تُخصم من حسابه', 'خصم': 'يُخصم من حسابه بسبب تذكره', 'مخالفة': 'تنبيه، مع خصم أو بدونه', 'تسوية': 'تقريب أو فرق صغير: يغيّر الرصيد فقط، ولا يظهر في الكشف ولا الملخص' };
      R = { tone: isV && sev === 'warn' ? '' : plus ? 'in' : 'out', toneTag: plus ? 'يزيد حسابه' : 'ينقص حسابه', title: w.name, sub: 'الرصيد الآن: ' + balTxt(bw), fields: ef,
        note: { text: (HINT[type] ? HINT[type] + (amt > 0 || isV ? ' · ' : '') : '') + (isV ? (sev === 'warn' ? 'تُسجَّل في سجله بلا خصم.' : amt > 0 ? 'تُسجَّل في سجله ويُخصم ' + money(amt) + '. الرصيد بعدها: ' + balTxt(after) : '') : amt > 0 ? 'الرصيد بعد الحركة: ' + balTxt(after) + (pp && pp.txt ? ' · ' + pp.txt : '') : ''), tone: isV ? 'warn' : 'info' },
        ft: { label: isV ? 'تسجيل المخالفة' : 'تسجيل ' + (type === 'دفعة نقدية' ? 'الدفعة' : type), ok: okV, go: function () { doEntry(w, type, amt, cleanNote(fv('note')), sev, fv('fund') || defFund(), num('rate'), edt); } } };
      break;
    }
    case 'settle': {
      if (!fv('dtxt')) A.form.dtxt = today();
      var sel = (fv('sel') || '').split(',').filter(Boolean), owedL = activeW().filter(function (x) { return wBal(x) > 0; }), debtL = activeW().filter(function (x) { return wBal(x) < 0; });
      var picked = owedL.filter(function (x) { return sel.indexOf(x.id) >= 0; }), tot = r2(picked.reduce(function (a, x) { return a + wBal(x); }, 0)), unrec = picked.filter(function (x) { return !wAtt(x); }).length;
      R = { title: 'دفع الأسبوع', sub: S.settings.lastSettle ? 'آخر دفع ' + dlabel(S.settings.lastSettle) : 'لم يُسجَّل دفع بعد',
        rows: owedL.map(function (x) {
          return X({ title: x.name, sub: wAtt(x) ? '' : 'حضور اليوم لم يُسجَّل', tag: money(wBal(x)), tagTone: 'info', sel: sel.indexOf(x.id) >= 0, go: function () { var s2 = sel.indexOf(x.id) >= 0 ? sel.filter(function (i) { return i !== x.id; }) : sel.concat([x.id]); fset('sel', s2.join(',')); } });
        }).concat(debtL.map(function (x) { return X({ title: x.name, sub: 'يُرحَّل ولا يُدفع', tag: 'عليه ' + money(-wBal(x)), tagTone: 'warn' }); })),
        fields: owedL.length ? [fDate('dtxt', 'تاريخ الدفع', '', today())].concat(fundFields()) : [],
        note: owedL.length ? (unrec ? { text: pl(unrec, 'عامل واحد لم يُسجَّل حضوره', 'عاملان لم يُسجَّل حضورهما', 'عمال لم يُسجَّل حضورهم') + ' اليوم، ومبلغه دون يومية اليوم.', tone: 'warn' } : null) : { text: 'لا مستحقات للعمال الآن.', tone: 'ok' },
        ft: { label: tot > 0 ? 'صرف ' + money(tot) + ' · ' + pl(picked.length, 'عامل واحد', 'عاملان', 'عمال') : 'اختر عمالًا للصرف', ok: tot > 0 && payPlan(fund(fv('fund') || defFund()), tot, num('rate')).ok && (!fv('dtxt') || (dateNear(fv('dtxt')) && dateNear(fv('dtxt')) <= today())), go: function () { doSettle(picked, fv('fund') || defFund(), num('rate'), dateNear(fv('dtxt'))); } } };
      break;
    }
    case 'carry': {
      var cdt = dateNear(fv('cdate')) || sh.d0, cl = activeW().filter(function (x) { return !E.attOn(S, cdt, x.id); }), csel = (fv('sel') || '').split(',').filter(Boolean);
      var cpk = cl.filter(function (x) { return csel.indexOf(x.id) >= 0; }), ctot = r2(cpk.reduce(function (a, x) { return a + (x.daily || 0); }, 0));
      R = { title: 'يوم كان في الرصيد المرحّل', sub: 'يُسجَّل حضوره هنا ويُخصم من الرصيد المرحّل بالمبلغ نفسه، فلا يتغيّر رصيد أحد',
        fields: [fDate('cdate', 'اليوم', '', today())],
        rows: cl.map(function (x) { return X({ title: x.name, sub: 'رصيد سابق ' + money(wOpenAmt(x)), tag: money(x.daily || 0), tagTone: 'ok', sel: csel.indexOf(x.id) >= 0, go: function () { var s2 = csel.indexOf(x.id) >= 0 ? csel.filter(function (i) { return i !== x.id; }) : csel.concat([x.id]); fset('sel', s2.join(',')); } }); }),
        note: cl.length ? { text: 'اختر من حضر ذلك اليوم. الرصيد قبل وبعد متطابق: ' + (ctot ? 'ينتقل ' + money(ctot) + ' من «رصيد سابق» إلى الحضور.' : ''), tone: 'info' } : { text: 'لا عمال بلا حضور مسجَّل في هذا اليوم.', tone: 'info' },
        ft: { label: cpk.length ? 'تسجيل حضور ' + pl(cpk.length, 'عامل واحد', 'عاملين', 'عمال') : 'اختر العمال', ok: cpk.length > 0 && !!dateNear(fv('cdate')) && dateNear(fv('cdate')) <= today(), go: function () { doCarry(cpk, cdt); } } };
      break;
    }
    case 'bview': {
      var bacts = [], b = E.by(S.batches, sh.id), l0 = led(b.order[0]), freeB = E.isFree(l0), canEdit = !b.void, unc = b.done === false && !b.void, costFree = b.kind === 'external' && freeB;
      R = { title: batchName(b), sub: KN[b.kind] + ' · ' + pl(b.pots || 0, 'قدر واحد', 'قدران', 'قدور') + ' · ' + (inst(b.inst) ? inst(b.inst).name + ' · ' : '') + dlabel(b.date),
        acts: bacts, rows: spiceLast(b.lines).map(function (ln) {
          var li = item(ln.item);
          var pkb = packTxt(li, ln.qty), srcb = Object.keys(ln.src || {}).length > 1 ? srcTxt(ln) : (LSHORT[Object.keys(ln.src || {})[0]] || '');
          var base = ln.extra && rec(b.recipe) ? 'مضاف لهذا اليوم' : ln.planned != null ? 'حسب الوصفة ' + qtyU(ln.planned, li.unit) : '';
          return X({ title: li.name, sub: [ln.dev ? 'يختلف عن الوصفة' : '', srcb, base].filter(Boolean).join(' · '), end: qtyU(ln.qty, li.unit), endSub: pkb, endTone: ln.planned != null && Math.abs(ln.planned - ln.qty) > 0.0001 ? 'warn' : '' });
        }),
        note: { text: b.void ? 'طبخة ملغاة: أُعيدت موادها إلى المخزن وبقي سجلها.' : (b.done === false ? 'الكميات الفعلية لم تُؤكَّد؛ المخصوم من المخزن هو حسب الوصفة. ' : b.done ? 'الكميات الفعلية مؤكدة. ' : '') + (costFree ? 'مواد عينية بلا تكلفة عليك.' : 'التكلفة ' + money(b.cost || 0) + ' بسعر يوم الطبخة.') + (b.edits ? ' عُدّلت ' + pl(b.edits, 'مرة', 'مرتين', 'مرات') + '.' : ''), tone: b.void ? 'warn' : unc ? 'warn' : 'ok' },
        ft: unc ? { label: 'تأكيد الكميات كما هي', ok: true, go: function () { doConfirmBatch(b.id); } } : canEdit ? { label: 'تعديل الكميات', ok: true, go: function () { startEdit(b); } } : { label: 'إغلاق', ok: true, go: function () { shut(); } },
        ft2: unc ? (canEdit ? { label: 'تعديل الكميات', go: function () { startEdit(b); } } : null) : b.void ? null : { label: 'إلغاء الطبخة', go: function () { openSh({ t: 'voidB', id: b.id }); } } };
      if (!b.void) {
        bacts.push(X({ title: 'التاريخ', icon: 'i-calendar', go: function () { openSh({ t: 'bdate', id: b.id }, { day: '', dtxt: b.date }); } }));
        if (b.kind === 'private') bacts.push(X({ title: distLeft(b) > 0 ? 'التوزيع · ' + fmt(distLeft(b)) : 'التوزيع', icon: 'i-users', go: function () { openSh({ t: 'dist', id: b.id }, distForm(b)); } }));
        bacts.push(X({ title: 'الأصناف والأسعار', icon: 'i-pencil', go: function () { fixOpen(b); } }));
        bacts.push(X({ title: 'نسخة للشيف', icon: 'i-send', go: function () { shareChefBatch(b); } }));
        bacts.push(X({ title: 'تكرار', icon: 'i-copy', go: function () { startRepeat(b); } }));
      }
      var nLines = R.rows.length; /* أصناف الطبخة أولًا، ثم المحذوف والحقول المخصصة، ثم بنود التكلفة والإجمالي في الآخر */
      if (b.kind === 'external' && !b.void && (!costFree || b.pm === 'lump' || (b.xl || []).length)) {
        if (b.pm === 'lump') R.rows.push(X({ title: 'التسعير بسعر القدر', sub: b.pots + ' × ' + money(b.lump), tag: money(b.cost || 0), tagTone: 'info' }));
        else if ((b.xl || []).length) { R.rows.push(X({ subt: true, title: 'تكلفة المواد', tag: costFree ? 'عيني' : money(b.matCost != null ? b.matCost : b.cost || 0), tagTone: 'mute' })); (b.xl || []).forEach(function (x) { R.rows.push(X({ title: x.k, sub: x.note, tag: money(x.amt), tagTone: 'info' })); }); }
        if (b.pm === 'lump' || (b.xl || []).length) R.rows.push(X({ total: true, title: 'تكلفة الطبخة', tag: money(b.cost || 0), tagTone: 'ok' })); /* صف الإجمالي يتميز دائمًا (قاعدة total) */
      }
      var tail = [];
      (S.fields || []).forEach(function (f) { var v = (b.cf || {})[f.id]; if (v !== undefined && v !== '') tail.push(X({ title: f.name, sub: 'حقل مخصص', tag: String(v), tagTone: 'mute' })); });
      (b.gone || []).forEach(function (gid) { if (item(gid)) tail.push(X({ title: item(gid).name, sub: 'أُزيل من هذه الطبخة', tag: 'أُزيل', tagTone: 'mute' })); });
      R.rows.splice.apply(R.rows, [nLines, 0].concat(tail));
      if (unc) R.rows.unshift(X({ icon: 'i-alert', icTone: 'warn', title: 'تنتظر تأكيد الكميات', sub: 'بدأتها بالوصفة كما هي: أكّد أنها طُبخت بهذه الكميات أو عدّلها', tag: 'تنتظر تأكيد', tagTone: 'warn' }));
      if (unc) bacts.push(X({ title: 'إلغاء الطبخة', icon: 'i-minus', go: function () { openSh({ t: 'voidB', id: b.id }); } }));
      var dfb = canEdit && !b.void ? batchDiffs(b) : [];
      if (dfb.length && !(rec(b.recipe) || {}).arch) bacts.push(X({ title: 'تحديث الوصفة', icon: 'i-book', go: function () { openSh({ t: 'recFromBatch', id: b.id }); } }));
      break;
    }
    case 'recFromBatch': {
      var rb = E.by(S.batches, sh.id), rrb = rec(rb.recipe), dfs = batchDiffs(rb);
      R = { title: 'تحديث الوصفة بهذه الكميات', sub: rrb.name + ' · ' + pl(rb.pots || 0, 'قدر واحد', 'قدران', 'قدور'), rows: dfs.map(function (x) { return X({ title: x.name, sub: x.txt, tag: x.tag, tagTone: x.tone }); }),
        note: { text: 'تُحسب الكمية الجديدة لكل قدر من هذه الطبخة وتحلّ محل كمية الوصفة. الطبخات السابقة لا تتغير. وإن كان هذا اليوم استثناءً فلا تحدّث.', tone: 'warn' },
        ft: { label: 'تحديث الوصفة', ok: dfs.length > 0, go: function () { doRecFromBatch(rb.id); } } };
      break;
    }
    case 'aliasTo': {
      R = pickOr(itemList(fv('led') || 'kitchen').map(function (x) { return { id: x.id, name: x.name, alias: x.alias, sub: x.alias && x.alias.length ? 'يُسمّى أيضًا ' + x.alias.join('، ') : '', tag: '' }; }),
        { title: '«' + sh.name + '» هو اسم آخر لأي صنف؟', sub: 'اختر الصنف الموجود. سيُحفظ الاسم الجديد عنده، وتجده المرة القادمة بالبحث.', plural: 'الأصناف', addLabel: '', sel: '', onPick: function (id) { doAddAlias(id, sh.name, sh.then, fv('led')); }, onAdd: null });
      R.add = null; R.add2 = null;
      break;
    }
    case 'voidB': {
      var vb = E.by(S.batches, sh.id);
      R = { title: 'إلغاء «' + batchName(vb) + '»', sub: dlabel(vb.date) + ' · ' + pl(vb.pots || 0, 'قدر واحد', 'قدران', 'قدور'),
        note: { text: 'ستعود كل مواد هذه الطبخة إلى المخازن التي خُصمت منها. تبقى الطبخة في السجل معلَّمة «ملغاة» ولا تُحذف.', tone: 'warn' },
        ft: { label: 'إلغاء الطبخة وإعادة المواد', ok: true, go: function () { doVoid(vb.id); } }, ft2: { label: 'رجوع', go: function () { openSh({ t: 'bview', id: vb.id }); } } };
      break;
    }
    case 'potsSet': {
      var pn = parseInt(fv('n'), 10);
      R = { title: 'عدد القدور', sub: 'اكتب العدد مباشرة', fields: [fText('n', 'عدد القدور', '0', 'numeric')],
        note: { text: 'الكميات التي عدّلتها تتناسب مع العدد الجديد (الثابت والإضافي لا يتغيران).', tone: 'info' },
        ft: { label: 'تطبيق', ok: pn >= 1 && pn <= 500, go: function () { A.draft = Object.assign({}, A.draft, potsPatch(A.draft, pn)); shut(); } } };
      break;
    }
    case 'bline': {
      var bl0 = dLines().filter(function (x) { return x.id === sh.id; })[0];
      if (!bl0) { R = { title: 'الصنف', sub: '', rows: [] }; break; }
      var bPot = fv('by') === 'pot' && d.pots > 1, bTot = r3(num('qty') * (bPot ? d.pots : 1));
      R = { title: bl0.name, sub: (bl0.extra ? 'مضاف لهذا اليوم' : 'حسب الوصفة ' + qtyU(bl0.planned, bl0.unit)) + ' · لهذه الطبخة وحدها',
        fields: (d.pots > 1 ? [fChips('by', 'الكمية المُدخلة', [['all', 'للطبخة كلها'], ['pot', 'لكل قدر']])] : []).concat([fText('qty', (bPot ? 'الكمية الفعلية لكل قدر' : 'الكمية الفعلية للطبخة كلها') + ' (' + bl0.unit + ')', '0', 'decimal')]),
        note: { text: bPot && fv('qty') !== '' ? 'الإجمالي للطبخة: ' + qtyU(bTot, bl0.unit) + ' (' + fmt(num('qty')) + ' × ' + d.pots + ').' : 'تعديل هنا لا يغيّر الوصفة. لتغيير الوصفة نفسها استخدم صفحة الوصفة.', tone: bPot && fv('qty') !== '' ? 'ok' : 'info' },
        ft: { label: 'حفظ الكمية', ok: fv('qty') !== '' && num('qty') >= 0, go: function () { var o = Object.assign({}, A.draft.over); o[bl0.id] = bTot; A.draft = Object.assign({}, A.draft, { over: o }); shut(); } },
        ft2: { label: 'إزالة الصنف من هذه الطبخة', go: function () {
          var cur = A.draft, nd;
          if (bl0.extra) { var o2 = Object.assign({}, cur.over); delete o2[bl0.id]; nd = Object.assign({}, cur, { extra: cur.extra.filter(function (e) { return e.item !== bl0.id; }), over: o2 }); }
          else { var dl = Object.assign({}, cur.del); dl[bl0.id] = true; nd = Object.assign({}, cur, { del: dl }); }
          A.draft = nd; shut();
        } } };
      break;
    }
    case 'extra': {
      if (!sh.item) {
        var xl0 = E.planOrder(S, d.kind, d.inst)[0], xin = {}; dLines().forEach(function (l) { xin[l.id] = 1; });
        R = pickOr(itemList(xl0).map(function (x) { var it0 = item(x.id), rm = dRemain(x.id); return Object.assign({}, x, { sub: it0.unit + ' · المتبقي ' + fmt(rm), tag: xin[x.id] ? 'في الخطة' : '', tagTone: 'mute' }); }), { title: 'إضافة مكوّن للطبخة', sub: 'اختر الصنف أو أضف صنفًا جديدًا', plural: 'الأصناف', then: 'extra', addLabel: 'إضافة صنف جديد', sel: '',
          onPick: function (id) { openSh({ t: 'extra', item: id }, { qty: '', by: 'pot' }); },
          onAdd: function (name) { openSh({ t: 'addItem', then: 'extra' }, { name: name, unit: 'كيلو', price: '' }); } });
        break;
      }
      it = item(sh.item);
      var xex = d.extra.filter(function (e) { return e.item === it.id; })[0], xrm = dRemain(it.id), xp = d.pots || 1, xPot = (fv('by') || 'pot') === 'pot' && xp > 1, xTot = r3(num('qty') * (xPot ? xp : 1));
      R = { title: it.name, sub: xPot ? 'الكمية لقدر واحد، وتُضرب في ' + pl(xp, 'قدر', 'قدرين', 'قدور') : 'كمية هذا الصنف لهذه الطبخة كلها',
        fields: (xp > 1 ? [fChips('by', 'الكمية المُدخلة', [['pot', 'لكل قدر'], ['all', 'للطبخة كلها']])] : []).concat([fText('qty', (xPot ? 'الكمية لكل قدر' : 'الكمية للطبخة كلها') + ' (' + it.unit + ')', '0', 'decimal')]),
        note: { text: xTot > 0 && xTot > xrm ? 'المتبقي ' + qtyU(Math.max(xrm, 0), it.unit) + '، وينقص ' + qtyU(r3(xTot - Math.max(xrm, 0)), it.unit) + ' وسيظهر بالسالب.' : xPot && num('qty') > 0 ? 'الإجمالي للطبخة: ' + qtyU(xTot, it.unit) + ' (' + fmt(num('qty')) + ' × ' + xp + ').' : 'يُضاف لهذه الطبخة وحدها، ولا تتغير الوصفة.', tone: xTot > 0 && xTot > xrm ? 'warn' : xPot && num('qty') > 0 ? 'ok' : 'info' },
        ft: { label: 'إضافة للطبخة', ok: num('qty') > 0, go: function () { var cur = A.draft; A.draft = Object.assign({}, cur, { extra: cur.extra.filter(function (e) { return e.item !== it.id; }).concat([{ item: it.id, qty: r3((xex ? xex.qty : 0) + xTot) }]) }); shut(); } } };
      break;
    }
    case 'recLine': {
      if (!sh.item) {
        R = pickOr(itemList('kitchen'), { title: 'إضافة مكوّن للوصفة', sub: 'اختر الصنف أو أضف صنفًا جديدًا', plural: 'الأصناف', then: 'recLine', addLabel: 'إضافة صنف جديد', sel: '',
          onPick: function (id) { openSh({ t: 'recLine', item: id }, { per: '', fixed: 'no' }); },
          onAdd: function (name) { openSh({ t: 'addItem', then: 'recLine' }, { name: name, unit: 'كيلو', price: '' }); } });
        break;
      }
      it = item(sh.item);
      R = { title: it.name, sub: 'الكمية لقدر واحد من الوصفة', fields: [
          fText('per', 'الكمية لقدر واحد (' + it.unit + ')', '0', 'decimal'),
          fChips('fixed', 'عند زيادة القدور', [['no', 'تتضاعف'], ['yes', 'تبقى ثابتة']], 'مثل الكمون: ملعقة واحدة للطبخة مهما كبرت.')
        ], ft: { label: 'إضافة للوصفة', ok: num('per') > 0, go: function () {
          var r = rec(A.rid); r.lines = r.lines.filter(function (x) { return x.item !== it.id; });
          r.lines.push({ item: it.id, per: num('per'), cat: it.grp === 'spice' ? 's' : 'b', fixed: fv('fixed') === 'yes' }); recLog(r, 'إضافة ' + it.name + ' (' + fmt(num('per')) + ' ' + it.unit + ')'); shut(); mutated('أُضيف ' + it.name + ' إلى الوصفة');
        } } };
      break;
    }
    case 'recEdit': {
      it = item(sh.item);
      R = { title: it.name, sub: 'الكمية لقدر واحد من الوصفة', fields: [
          fText('per', 'الكمية لقدر واحد (' + it.unit + ')', '0', 'decimal'),
          fChips('fixed', 'عند زيادة القدور', [['no', 'تتضاعف'], ['yes', 'تبقى ثابتة']], 'مثل الكمون: ملعقة واحدة للطبخة مهما كبرت.')
        ], ft: { label: 'حفظ', ok: num('per') > 0, go: function () {
          var ln = rec(A.rid).lines.filter(function (x) { return x.item === it.id; })[0]; var was = ln.per; ln.per = num('per'); ln.fixed = fv('fixed') === 'yes'; recLog(rec(A.rid), 'تعديل ' + it.name + ': ' + fmt(was) + ' ← ' + fmt(ln.per)); shut(); mutated('حُفظ التعديل');
        } }, ft2: { label: 'إزالة من الوصفة', go: function () { var r = rec(A.rid); r.lines = r.lines.filter(function (x) { return x.item !== it.id; }); recLog(r, 'إزالة ' + it.name); shut(); mutated('أُزيل ' + it.name + ' من الوصفة'); } } };
      break;
    }
    case 'opItem': {
      it = item(sh.id);
      R = { title: it.name, sub: 'الرصيد الفعلي في المخزن (' + it.unit + ')', fields: [fText('qty', 'الكمية الفعلية', '0', 'decimal')],
        note: { text: packTxt(it, num('qty')) ? '= ' + packTxt(it, num('qty')) : '', tone: 'info' },
        ft: { label: 'حفظ', ok: fv('qty') !== '' && num('qty') >= 0, go: function () { OPV[it.id] = num('qty'); shut(); } } };
      break;
    }
    case 'planAdd': {
      if (!sh.rec) {
        R = pickOr(S.recipes.filter(function (r) { return !r.arch; }).sort(function (a, b) { return recUsed(b.id) - recUsed(a.id); }).map(function (r) {
          return { id: r.id, name: r.name, sub: (r.code ? r.code + ' · ' : '') + nIng(r.lines.length), tag: r.kinds.length === 2 ? '' : KN[r.kinds[0]] };
        }), { title: 'خطّط طبخة', sub: 'اختر الطبخة التي تنوي طبخها', plural: 'الطبخات', addLabel: '', sel: '',
          onPick: function (id) { var r = rec(id), kk0 = A.kk === 'init' ? 'external' : A.kk; openSh({ t: 'planAdd', rec: id }, { day: fv('day') || '1', pots: fv('pots') || '3', kind: fv('kind') && r.kinds.indexOf(fv('kind')) >= 0 ? fv('kind') : r.kinds.indexOf(kk0) >= 0 ? kk0 : r.kinds.indexOf('private') >= 0 ? 'private' : 'external' }); } });
        break;
      }
      var pr = rec(sh.rec), pp = Math.max(0, parseInt(fv('pots'), 10) || 0), shortN = pp ? planShort({ recipeId: pr.id, pots: pp, kind: fv('kind') || (pr.kinds.indexOf('private') >= 0 ? 'private' : 'external') }, null) : 0;
      var pdt = planDate(), pw = planWhen(), dch = pw[0];
      var pf = [dch, fText('pots', 'عدد القدور', '3', 'numeric')];
      if (pr.kinds.length === 2) pf.push(fChips('kind', 'النوع', [['private', 'طبخ'], ['external', 'طبخ خارجي']]));
      R = { title: pr.name, sub: (pdt ? dlabel(pdt) : 'اختر التاريخ') + ' · ' + (pp ? pl(pp, 'قدر واحد', 'قدران', 'قدور') : 'اكتب عدد القدور'), fields: pf,
        note: pp ? { text: shortN ? 'يوجد ' + pl(shortN, 'صنف واحد ينقص', 'صنفان ينقصان', 'أصناف تنقص') + ' عن هذه الطبخة بحسب الرصيد الآن بعد الطبخات المخططة قبلها.' : 'المواد الحالية تكفي هذه الطبخة.', tone: shortN ? 'warn' : 'ok' } : null,
        ft: { label: 'إضافة للخطة', ok: pp >= 1 && pp <= 500 && !!pdt, go: function () { doAddPlan(pr, pp); } } };
      break;
    }
    case 'bwhen': case 'bdate': {
      var isE = sh.t === 'bdate', bwb = isE ? E.by(S.batches, sh.id) : null, bwd = bwDate(), bwf = bwWhen(isE ? 'edit' : ''), bwCl = !!bwd && !!((S.days || {})[bwd] || {}).closed, canPlan = !isE || !!(bwb && rec(bwb.recipe));
      var bwFut = !!bwd && bwd > today(), bwOk = !!bwd && !bwCl && (!isE || !bwFut || canPlan);
      R = { title: isE ? 'تاريخ الطبخة' : 'متى هذه الطبخة؟', sub: isE ? batchName(bwb) + ' · الآن ' + dlabel(bwb.date) : 'اليوم أو قادمة أو سابقة نسيت تسجيلها', fields: bwf,
        note: bwd ? (bwCl ? { text: 'هذا اليوم مُغلق.', tone: 'warn' } : bwFut ? (isE ? (canPlan ? { text: 'ستتحوّل إلى طبخة مخططة في ' + dlabel(bwd) + '، وتُعاد موادها إلى المخزن الآن وتُخصم عند بدئها في يومها.', tone: 'info' } : { text: 'لا وصفة مرتبطة بهذه الطبخة فلا يمكن جدولتها.', tone: 'warn' }) : { text: 'ستُحفظ مجدولة ولا تُخصم المواد الآن.', tone: 'info' }) : { text: 'التاريخ: ' + dlabel(bwd), tone: 'info' }) : null,
        ft: { label: isE && bwFut ? 'تحويل إلى طبخة مخططة' : 'تأكيد التاريخ', ok: bwOk, go: function () { if (isE) { if (bwFut) doBatchToPlan(bwb.id, bwd); else doSetBatchDate(bwb.id, bwd); } else { A.draft.date = bwd; shut(); } } } };
      break;
    }
    case 'planDate': {
      var pd = E.by(S.plans, sh.id), pdn = planDate(), pww = planWhen();
      R = { title: 'تغيير تاريخ الطبخة', sub: planName(pd) + ' · الآن ' + dlabel(pd.date), fields: pww,
        ft: { label: 'حفظ التاريخ', ok: !!pdn, go: function () { pd.date = pdn; audit('تغيير تاريخ طبخة مخططة إلى ' + dlabel(pdn)); shut(); mutated('نُقلت الطبخة إلى ' + dlabel(pdn)); } } };
      break;
    }
    case 'planView': {
      var pv = E.by(S.plans, sh.id), prv = rec(pv.recipeId), sc = spiceLast(E.scaleRecipe(prv, pv.pots, pv));
      var aft = planAfter(pv), isPriv = (pv.kind || 'private') === 'private';
      var pacts = [X({ title: 'التاريخ', icon: 'i-calendar', go: function () { openSh({ t: 'planDate', id: pv.id }, { day: '', dtxt: pv.date }); } })];
      if (isPriv) pacts.push(X({ title: 'التوزيع', icon: 'i-users', go: function () { var f = {}, d0 = pv.dist || {}; bens().forEach(function (g) { f['d_' + g.id] = d0[g.id] ? String(d0[g.id]) : ''; }); openSh({ t: 'pdist', id: pv.id }, dlAuto(f)); } }));
      pacts.push(X({ title: 'تعديل', icon: 'i-pencil', go: function () { editPlan(pv); } }));
      pacts.push(X({ title: 'نسخة للشيف', icon: 'i-send', go: function () { shareChefPlan(pv); } }));
      var prows = sc.map(function (l) { return { l: l, rem: aft[l.item] != null ? aft[l.item] : 0 }; }).map(function (z, i) { z.i = i; return z; }).sort(function (a, b) { return (isSpiceIt(a.l.item) - isSpiceIt(b.l.item)) || (a.rem - b.rem) || (a.i - b.i); }).map(function (z) {
        var l = z.l, rem = z.rem, it2 = item(l.item), pkN = packFull(it2, l.qty), pkR = packFull(it2, Math.abs(rem));
        return X({ title: it2.name, sub: '',
          c0: pv.pots > 1 && !l.fixed ? perTxt(l.qty, pv.pots, it2.unit) : '—', c1: qtyU(l.qty, it2.unit), c1s: pkN, c2s: pkR, c2: (rem < -0.0001 ? '−' : '') + qtyU(Math.abs(rem), it2.unit), c2Tone: rem < -0.0001 ? 'bad' : '' });
      });
      R = { acts: pacts, cols: ['الصنف', 'للقدر', 'الإجمالي', 'المتبقي'], title: prv.name, sub: dlabel(pv.date) + ' · ' + (pv.inst && inst(pv.inst) ? KN[pv.kind || 'private'] + ' · ' + inst(pv.inst).name : KN[pv.kind || 'private']) + ' · ' + pl(pv.pots, 'قدر واحد', 'قدران', 'قدور'), rows: prows,
        note: { text: 'المتبقي هو ما يبقى في المخزن بعد هذه الطبخة (والمخططة قبلها)، وبالأحمر إن كان ناقصًا.', tone: 'info' },
        ft: { label: 'ابدأ هذه الطبخة', ok: true, go: function () { startFromPlan(pv); } }, ft2: { label: 'إلغاء من الخطة', go: function () { pv.off = true; shut(); mutated('أُلغيت من الخطة'); } } };
      break;
    }
    case 'pdist': {
      var pp = E.by(S.plans, sh.id), pgs = bens(), ptot = r2(pgs.reduce(function (a, g) { return a + num('d_' + g.id); }, 0));
      R = { title: 'توزيع ' + planName(pp), sub: pl(pp.pots, 'قدر واحد', 'قدران', 'قدور') + ' · خطّط عدد القدور لكل مخيم',
        fields: distEditFields(sh, function (g) { return [fText('d_' + g.id, g.name, '0', 'decimal')]; }, function (id) { A.form['d_' + id] = ''; }, pp.date, function (id) { return 'd_' + id; }),
        note: { text: ptot > pp.pots ? 'المجموع ' + fmt(ptot) + ' أكبر من قدور الطبخة (' + fmt(pp.pots) + ')' : 'المخطَّط ' + fmt(ptot) + ' من ' + fmt(pp.pots) + (ptot < pp.pots ? ' · يبقى ' + fmt(r2(pp.pots - ptot)) + ' بلا تخطيط' : ' · موزّعة كلها') + '. عند بدء الطبخة يُوضع هذا التوزيع مقترحًا وتعدّله أو تؤكده.', tone: ptot > pp.pots ? 'warn' : 'info' },
        ft: { label: 'حفظ التخطيط', ok: ptot <= pp.pots, go: function () { var v = {}; pgs.forEach(function (g) { var x = num('d_' + g.id); if (x > 0) v[g.id] = x; }); pp.dist = v; audit('تخطيط توزيع قدور طبخة مخططة'); shut(); mutated('حُفظ تخطيط التوزيع'); } } };
      break;
    }
    case 'pdistDay': {
      var dps = plans().filter(function (p) { return (p.kind || 'private') === 'private' && p.date === sh.day; }), dgs = bens(), det = dps.length > 1 && fv('dmode') === 'det', dpots = r2(dps.reduce(function (a, p) { return a + p.pots; }, 0)),
        dsum = function (p) { return r2(dgs.reduce(function (a, g) { return a + num('d_' + p.id + '_' + g.id); }, 0)); },
        dgiven = det ? r2(dps.reduce(function (a, p) { return a + dsum(p); }, 0)) : r2(dgs.reduce(function (a, g) { return a + num('t_' + g.id); }, 0)),
        dbad = det ? dps.some(function (p) { return dsum(p) > p.pots; }) : dgiven > dpots, dleft = r2(dpots - dgiven), dfl = [];
      if (dps.length > 1) dfl.push(fChips('dmode', 'طريقة التوزيع', [['tot', 'إجمالي لكل نقطة'], ['det', 'مفصّل حسب الطبخة']]));
      dfl = dfl.concat(distEditFields(sh, function (g) { return det ? dps.map(function (p) { return fText('d_' + p.id + '_' + g.id, g.name + ' · ' + planName(p), '0', 'decimal'); }) : [fText('t_' + g.id, g.name, '0', 'decimal')]; }, function (id) { A.form['t_' + id] = ''; dps.forEach(function (p) { A.form['d_' + p.id + '_' + id] = ''; }); }, sh.day, function (id) { return 't_' + id; }));
      var dtx = det ? dps.map(function (p) { return planName(p) + ' ' + fmt(dsum(p)) + ' من ' + fmt(p.pots); }).join(' · ') : 'الموزّع ' + fmt(dgiven) + ' من ' + pl(dpots, 'قدر واحد', 'قدران', 'قدور') + (dleft > 0 ? ' · المتبقي ' + fmt(dleft) : '') + (dps.length > 1 ? '. لا يُنسب نوع لنقطة إلا إن اخترت «مفصّل حسب الطبخة».' : '');
      R = { title: 'توزيع ' + dlabel(sh.day), sub: dps.map(function (p) { return planName(p) + ' ' + pl(p.pots, 'قدر واحد', 'قدران', 'قدور'); }).join(' · '), fields: dfl,
        note: { text: dbad ? (det ? 'مجموع نوع أكبر من قدوره. ' : 'المجموع ' + fmt(dgiven) + ' أكبر من ' + pl(dpots, 'قدر واحد', 'قدران', 'قدور') + '. ') + dtx : dtx, tone: dbad ? 'warn' : 'info' },
        ft: { label: 'حفظ التخطيط', ok: !dbad && dps.length > 0, go: function () {
          var al;
          if (det) al = dps.map(function (p) { var v = {}; dgs.forEach(function (g) { var x = num('d_' + p.id + '_' + g.id); if (x > 0) v[g.id] = x; }); return v; });
          else { var tot = {}; dgs.forEach(function (g) { var x = num('t_' + g.id); if (x > 0) tot[g.id] = x; }); al = planDistAlloc(dps, tot); }
          dps.forEach(function (p, i) { if (dps.length > 1) p.distTot = !det; var v = al[i]; Object.keys(p.dist || {}).forEach(function (k) { if (!dgs.some(function (g) { return g.id === k; })) v[k] = p.dist[k]; }); p.dist = v; });
          audit('تخطيط توزيع قدور ' + dlabel(sh.day)); shut(); mutated('حُفظ تخطيط التوزيع'); } } };
      break;
    }
    case 'restore': {
      R = { title: 'استعادة نسخة احتياطية', sub: 'اختر ملف النسخة الذي حفظته سابقًا',
        note: { text: 'ستُستبدل كل بيانات هذا الجهاز ببيانات الملف. إن كانت عندك بيانات جديدة لم تُحفظ في نسخة فصدّر نسخة أولًا.', tone: 'warn' },
        ft: { label: 'اختيار ملف النسخة', ok: true, go: function () { var f = $('rfile'); if (f) f.click(); } }, ft2: { label: 'تصدير نسخة من الحالي أولًا', go: function () { exportBackup(); } } };
      break;
    }
    case 'daily': {
      var on = lsj('ahd_daily', false);
      R = { title: 'تنبيه الثامنة صباحًا', sub: on ? 'مفعّل' : 'غير مفعّل', rows: [
          X({ icon: 'i-clock', icTone: 'ok', title: 'تفعيل التنبيه اليومي', sub: 'يصل كل يوم الساعة 8:00 حتى والتطبيق مغلق', chev: true, go: function () { armDaily().then(function () { lss('ahd_daily', true); shut(); say('فُعّل التنبيه اليومي 8:00'); }).catch(function (er) { say('تعذّر: ' + er.message); }); } }),
          X({ icon: 'i-send', icTone: 'info', title: 'تنبيه تجريبي بعد دقيقة', sub: 'ليظهر لك شكله على هذا الجهاز', chev: true, go: function () { if (LN()) LN().schedule({ notifications: [{ id: 2, title: 'المطبخ', body: 'تنبيه تجريبي', schedule: { at: new Date(Date.now() + 60000), allowWhileIdle: true } }] }).then(function () { shut(); say('سيصلك بعد دقيقة'); }); else say('غير متاح هنا'); } }),
          X({ icon: 'i-lock', icTone: 'mute', title: 'إلغاء التنبيهات', chev: true, go: function () { if (LN()) LN().cancel({ notifications: [{ id: 1 }, { id: 2 }] }); lss('ahd_daily', false); shut(); say('أُلغيت التنبيهات'); } })
        ] };
      break;
    }
    case 'sort': {
      var so = SORTS[sh.k], cur0 = A.sort[sh.k], srows = so.map(function (o) {
        var on2 = cur0.f === o[0];
        return X({ title: o[1], sel: on2, tag: on2 ? (cur0.d === 1 ? 'تصاعدي ↑' : 'تنازلي ↓') : '', tagTone: 'ok', sub: on2 ? 'اضغط مرة أخرى لعكس الاتجاه' : '',
          go: function () { var ns = Object.assign({}, A.sort), c = ns[sh.k]; ns[sh.k] = on2 ? { f: c.f, d: -c.d } : { f: o[0], d: o[2] }; A.sort = ns; shut(); } });
      });
      var vopts = ['خيارات العرض'];
      if (sh.k === 'stock') vopts.push({ label: 'إخفاء الأصناف الصفرية', tog: function () { return !!A.hideZero; }, set: function (v) { A.hideZero = v; A.zeroOpen = false; } });
      if (sh.k !== 'batches') vopts.push({ label: 'عرض المؤرشفين', tog: function () { return !!A.showArch; }, set: function (v) { A.showArch = v; } });
      R = { title: 'ترتيب القائمة', sub: 'ترتيب حسب · اضغط لتغيير الاتجاه', rows: srows, fields: vopts.length > 1 ? [fStateGrid(vopts, [['1', 'مفعّل'], ['0', 'مطفأ']])] : [] };
      break;
    }
    case 'search': R = searchSheet(); break;
    default: R = moneySheet(sh) || ownSheet(sh) || achSheet(sh) || wrSheet(sh) || orderSheet(sh) || daySheet(sh) || assetSheet(sh) || adminSheet(sh) || calSheet(sh) || padSheet(sh) || repSheet(sh) || safeSheet(sh) || photoSheet(sh) || gwSheet(sh) || wsmsSheet(sh) || imgSheet(sh) || initSheet(sh) || fixSheet(sh) || finSheet(sh) || kdetSheet(sh) || smartSheet(sh) || wstSheet(sh) || batchxSheet(sh) || extSheet(sh) || syncSheet(sh) || smsSheet(sh) || smsxSheet(sh) || { title: '' };
  }
  return R;
}

/* ===== 05-actions.js ===== */
/* ---------- إجراءات الحفظ ---------- */
function doAddRecipe(fromBatch) {
  var name = fv('name').trim(), kv = fv('kinds') || 'private', kinds = kv === 'both' ? ['private', 'external'] : [kv], id = newId('r', S.recipes);
  S.recipes.push({ id: id, name: name, kinds: kinds, draft: true, lines: [], log: [] });
  if (fromBatch) { A.draft = Object.assign({}, A.draft, { rec: id, dish: '', over: {}, del: {}, extra: [] }); shut(); } else open('recipe', { rid: id });
  mutated('أُضيفت الطبخة «' + name + '»');
}
function doAddInst(fromBatch) {
  var name = fv('name').trim(), inkind = fv('src') === 'inkind', id = newId('i', S.insts), lid = newId('L', S.ledgers);
  if (inkind) S.ledgers.push({ id: lid, name: 'مخزن ' + name, inkind: true });
  S.insts.push({ id: id, name: name, led: inkind ? lid : 'ext' });
  if (fromBatch) { A.draft = Object.assign({}, A.draft, { inst: id }); }
  shut(); mutated('أُضيفت المؤسسة «' + name + '»' + (inkind ? ' مع مخزن مستقل لموادها' : ''));
}
function doAddInit(fromBatch) {
  var name = fv('name').trim(), id = newId('n', S.insts);
  S.insts.push({ id: id, name: name, occ: fv('occ').trim(), led: 'ext', init: true, chg: [], pay: [] });
  if (fromBatch) A.draft = Object.assign({}, A.draft, { inst: id });
  shut(); mutated('أُضيفت الجهة «' + name + '»');
}
function doAddLedger() {
  var name = fv('name').trim(), id = newId('L', S.ledgers), inkind = fv('inkind') === 'inkind';
  S.ledgers.push({ id: id, name: name, inkind: inkind });
  A.led = id; shut(); mutated('أُضيف «' + name + '»');
}
function doAddItem(then) {
  var name = fv('name').trim(), unit = fv('unit') || 'كيلو', price = num('price'), id = newId('i', S.items), l = fv('led') || A.led;
  var pt = fv('packType'), pn = num('packN'), pack = pt && pt !== 'none' && pn > 0 ? { name: pt, n: pn } : null;
  S.items.push({ id: id, name: name, unit: unit, price: price, daily: 0, step: 1, pack: pack, packs: pack ? [pack] : [], cond: fv('cond') || 'جاف', grp: fv('grp') === 'spice' ? 'spice' : '', alias: aliasList(fv('alias')) });
  E.addMove(S, { date: today(), led: l, item: id, q: 0, kind: 'opening', note: 'إضافة الصنف' });
  save();
  if (then === 'extra') setState({ sh: { t: 'extra', item: id }, q: '', form: { qty: '', by: 'pot' } });
  else if (then === 'recLine') setState({ sh: { t: 'recLine', item: id }, q: '', form: { per: '', fixed: 'no' } });
  else if (then === 'recv') setState({ sh: { t: 'recv', item: id }, q: '', form: { led: l, unitMode: 'base', qty: '', price: '' } });
  else if (then === 'bfadd' && A.fix) { A.fix.lines.push({ item: id, qty: 0, price: price }); setState({ sh: { t: 'bfl', k: A.fix.lines.length - 1 }, q: '', form: { qty: '', price: String(price) } }); }
  else shut();
  say('أُضيف الصنف «' + name + '»');
}
function doEditItem(id) {
  var it = item(id), nn = (fv('name') || '').trim(), oldNm = '';
  if (nn && norm(nn) !== norm(it.name)) {
    var dupN = S.items.filter(function (x) { return x.id !== id && (norm(x.name) === norm(nn) || (x.alias || []).some(function (a) { return norm(a) === norm(nn); })); })[0];
    if (dupN) { say('يوجد صنف باسم «' + dupN.name + '» بالفعل'); return; }
    oldNm = it.name; it.name = nn; /* الرقم المعرّف ثابت فكل الحركات والوصفات تتبع الاسم الجديد */
  }
  var unit = it.unit, pt = (fv('packNew') || '').trim() || fv('packType'), pn = num('packN'), price = num('price');
  if (itemTotal(id) === 0) { unit = (fv('unitNew') || '').trim() || fv('unit') || it.unit; if ((S.units || []).indexOf(unit) < 0) S.units.push(unit); }
  var pack = pt && pt !== 'none' && pn > 0 ? { name: pt, n: pn } : null, arr = packsOf(it).slice();
  if (JSON.stringify(it.pack || null) !== JSON.stringify(pack) && pack) { arr = arr.filter(function (x) { return !(x.name === pack.name && x.n === pack.n); }); arr.unshift(pack); }
  it.unit = unit; it.pack = pack; it.packs = arr; it.cond = (fv('condNew') || '').trim() || fv('cond') || 'جاف'; it.grp = fv('grp') === 'spice' ? 'spice' : '';
  it.alias = aliasList(fv('alias') + (oldNm ? '،' + oldNm : '')).filter(function (a) { return norm(a) !== norm(it.name); }); it.sup = (fv('sup') || '').trim(); if (price > 0) it.price = price;
  setState({ sh: { t: 'item', id: id }, form: {} }); mutated('حُفظت بيانات «' + it.name + '»');
}
/* تاريخ حركة المخزن (استلام أو جرد): اليوم أو يوم سابق، لا مستقبل */
function rcvDate() {
  var t = fv('dtxt').trim(); if (t) return dateNear(t);
  var d = fv('day'); return dayOff(d === '' ? 0 : (+d || 0));
}
function rcvOk(d) { return !!d && d <= today() && (d === today() || !((S.days || {})[d] || {}).closed); }
function rcvWhen(future) {
  if (!fv('dtxt')) A.form.dtxt = fv('day') !== '' && fv('day') !== undefined && fv('day') !== null ? dayOff(+fv('day') || 0) : today();
  return [fDate('dtxt', 'تاريخ الحركة', '', future ? '' : today())];
}
function rcvNote(d) { return !d ? null : d > today() ? { text: 'توريد قادم: لا يدخل المخزن قبل ' + dlabel(d) + ' ويُسجَّل تلقائيًا في ذلك اليوم.', tone: 'info' } : !rcvOk(d) ? { text: 'هذا اليوم مُغلق.', tone: 'warn' } : d !== today() ? { text: 'سيُسجَّل بتاريخ ' + dlabel(d) + '.', tone: 'info' } : null; }
function doRecv(it, l) {
  var q = r3(num('qty') * unitF(it, fv('unitMode'))), price = num('price'), pi = packIdx(fv('unitMode')), dt = rcvDate();
  phTag(E.addMove(S, { date: dt, led: l, item: it.id, q: q, kind: 'receive', price: price > 0 ? price : undefined, note: '' }), phTake());
  if (pi > 0) { var arr = packsOf(it).slice(), pp = arr[pi]; if (pp) { it.packs = [pp].concat(arr.filter(function (x) { return x !== pp; })); it.pack = pp; } }
  if (price > 0 && !E.isFree(led(l))) it.price = price;
  A.led = l; shut(); mutated('سُجّل استلام ' + fmt(q) + ' ' + it.unit + ' من ' + it.name);
}
/* جرد المخزن: تالف/هدر/تبرع/فرق جرد. تُسجَّل حركة «تصحيح» بسببها، ولا تُحسب استهلاكًا في التقارير */
function adjCalc(it, l) {
  var how = fv('how') || 'amt', f = unitF(it, fv('unitMode')), bal = E.balance(S, l, it.id), w = E.by(whys(), fv('why')), q = r3(num('qty') * f), dq = 0, wn = '';
  if (how === 'cnt') { if (fv('qty') !== '') { dq = r3(q - bal); wn = dq !== 0 ? 'فرق جرد' : ''; } }
  else if (w && q > 0) { var sg = w.dir === 0 ? (fv('sign') === 'up' ? 1 : fv('sign') === 'down' ? -1 : 0) : w.dir; dq = sg * q; wn = dq ? w.name + (w.dir === 0 ? (sg > 0 ? ' (+)' : ' (−)') : '') : ''; }
  return { how: how, bal: bal, dq: dq, wn: wn, after: r3(bal + dq) };
}
function doAdjust(it, l) {
  var c = adjCalc(it, l), note = c.wn + ((fv('note') || '').trim() ? ' — ' + fv('note').trim() : ''), dt = rcvDate();
  E.addMove(S, { date: dt, led: l, item: it.id, q: c.dq, kind: 'adjust', note: note });
  audit('جرد «' + it.name + '» في ' + led(l).name + ': ' + (c.dq > 0 ? '+' : '') + fmt(c.dq) + ' ' + it.unit + ' (' + note + ')');
  shut(); mutated('سُجّل الجرد: ' + (c.dq > 0 ? 'زيادة ' : 'نقص ') + fmt(Math.abs(c.dq)) + ' ' + it.unit + ' من ' + it.name);
}
/* جرد جماعي: كل صنف كُتب له رصيد فعلي يختلف عن المسجّل يُسجَّل له فرق جرد (حركة تصحيح)، والبقية لا تُمسّ */
function doCount2(l, diffs) {
  var dt = today();
  diffs.forEach(function (d) { E.addMove(S, { date: dt, led: l, item: d.it.id, q: d.dq, kind: 'adjust', note: 'فرق جرد' }); });
  audit('جرد «' + led(l).name + '»: ' + diffs.map(function (d) { return d.it.name + ' ' + (d.dq > 0 ? '+' : '') + fmt(d.dq); }).join('، '));
  shut(); mutated('سُجّل جرد ' + pl(diffs.length, 'صنف واحد', 'صنفين', 'أصناف'));
}
function doIssue(it, l) {
  var q = num('qty'); E.addMove(S, { date: today(), led: l, item: it.id, q: -q, kind: 'issue', note: (fv('why') || '').trim() });
  shut(); mutated('سُجّل صرف ' + fmt(q) + ' ' + it.unit + ' من ' + it.name);
}
function doAddWorker(then) {
  var name = fv('name').trim(), wage = num('wage'), id = newId('w', S.workers);
  S.workers.push({ id: id, name: name, daily: wage, phone: fv('phone').trim(), stints: [{ from: today(), to: '', why: '' }] });
  save();
  if (then) setState({ sh: { t: 'entry', wid: id }, q: '', form: { type: 'دفعة نقدية', amt: '', note: '', sev: 'warn' } }); else { shut(); }
  say('أُضيف العامل «' + name + '»');
}
function doAddStat() {
  var name = fv('name').trim(), mult = parseFloat(fv('mult') || '1'), bonus = num('bonus'), id = newId('s', S.stats);
  S.stats.push({ id: id, name: name, mult: mult, bonus: bonus, tone: mult === 0 ? 'bad' : mult < 1 ? 'warn' : bonus > 0 ? 'info' : 'ok' });
  setState({ sh: A.sh && A.sh.wid ? { t: 'status', wid: A.sh.wid } : null, q: '', form: {} }); mutated('أُضيفت حالة الحضور «' + name + '»');
}
function doCarry(list, date) {
  var n = 0;
  list.forEach(function (w) {
    if (E.attOn(S, date, w.id)) return;
    var a = E.setAtt(S, date, w.id, 'p'), amt = E.attAmt(a);
    if (amt > 0) E.wEntry(S, { date: date, w: w.id, kind: 'open', amt: -amt, note: 'حضور ' + dlabel(date) + ' كان داخل الرصيد المرحّل' }); n++;
  });
  S.settings.carryDone = true;
  audit('نقل حضور ' + dlabel(date) + ' من الرصيد المرحّل إلى الحضور لـ' + pl(n, 'عامل واحد', 'عاملين', 'عمال'));
  shut(); mutated('سُجّل حضور ' + dlabel(date) + ' لـ' + pl(n, 'عامل واحد', 'عاملين', 'عمال') + ' بلا تغيير في الأرصدة');
}
function doEntry(w, type, amt, note, sev, fid, rate, date) {
  var d = date || today(), pid = phTake();
  if (type === 'مخالفة') phTag(E.wEntry(S, { date: d, w: w.id, kind: 'viol', amt: sev === 'warn' ? 0 : amt, note: note }), pid);
  else if (type === 'إضافة') { var eb = E.wEntry(S, { date: d, w: w.id, kind: 'add', amt: amt, note: note }); eb.cat = 'bonus'; phTag(eb, pid); }
  else if (type === 'تسوية') { var up = fv('adjd') === 'up', ea = E.wEntry(S, { date: d, w: w.id, kind: up ? 'add' : 'deduct', amt: amt, note: note || 'تسوية' }); ea.cat = 'adjw'; audit('تسوية رصيد ' + w.name + ': ' + (up ? '+' : '−') + money(amt) + (note ? ' (' + note + ')' : '')); }
  else if (type === 'شراء للمطبخ') { var ek = E.wEntry(S, { date: d, w: w.id, kind: 'add', amt: amt, note: note }); ek.cat = 'kbuy'; phTag(ek, pid); }
  else if (type === 'مسحوبات') { var ep = E.wEntry(S, { date: d, w: w.id, kind: 'deduct', amt: amt, note: note }); ep.cat = 'buy'; phTag(ep, pid); }
  else if (type === 'خصم') phTag(E.wEntry(S, { date: d, w: w.id, kind: 'deduct', amt: amt, note: note }), pid);
  else { var we = phTag(E.wEntry(S, { date: d, w: w.id, kind: 'pay', amt: amt, note: (type === 'سلفة' ? 'سلفة' + (note ? ' — ' + note : '') : note) }), pid); if (fid) { payFund(fid, w, amt, note, type === 'سلفة' ? 'سلفة' : 'راتب', rate, we.id, d); var lm = S.fm[S.fm.length - 1]; if (lm && lm.wl === we.id) phTag(lm, pid); } }
  shut(); mutated('سُجّل ' + (type === 'دفعة نقدية' ? 'دفع ' + money(amt) : type + (amt ? ' ' + money(amt) : '')) + ' — ' + w.name);
}
function doSettle(picked, fid, rate, date) {
  var sd = date || today();
  picked.forEach(function (w) { var b = wBal(w); if (b > 0) { var se = E.wEntry(S, { date: sd, w: w.id, kind: 'pay', amt: b, note: 'دفع الأسبوع' }); if (fid) payFund(fid, w, b, 'تسوية الأسبوع', 'راتب', rate, se.id, sd); } });
  S.settings.lastSettle = sd; shut(); mutated('سُجّل دفع ' + pl(picked.length, 'عامل واحد', 'عاملين', 'عمال'));
}
function shareStatement(w) { wstOpen(w); }

/* ---------- الطبخة: حفظ وتعديل وإلغاء ---------- */
function startEdit(b) {
  var r = rec(b.recipe) || GHOST_REC; if (!r) { say('وصفة هذه الطبخة غير متوفرة للتعديل'); return; }
  var i = inst(b.inst), d = newDraft(b.kind, !!(i && i.init));
  d.step = 2; d.rec = r.id; d.inst = b.inst || null; d.pots = b.pots || 1; d.portions = b.portions || ''; d.editId = b.id; d.date = b.date; d.dish = b.dish && b.dish !== r.name ? b.dish : '';
  draftFromBatch(d, b, r);
  open('batch', { draft: d });
}
/* تكرار طبخة: المعالج نفسه على خطوة الكميات معبّأً من الطبخة الأصلية (الوصفة، المؤسسة، القدور، الكميات الفعلية، البدائل والإضافات والتسعير) بتاريخ اليوم؛ لا توزيع ولا خصم قبل «حفظ»، والأصل لا يتغير (المالك 2026-11-23) */
function startRepeat(b) {
  if (isClosed()) { openSh({ t: 'locked', what: 'batch' }); return; }
  var r = rec(b.recipe) || GHOST_REC; if (!r) { say('وصفة هذه الطبخة غير متوفرة للتكرار'); return; }
  var i = inst(b.inst), d = newDraft(b.kind, !!(i && i.init));
  d.step = 2; d.rec = r.id; d.inst = b.inst || null; d.pots = b.pots || 1; d.portions = b.portions || ''; d.date = today(); d.dish = b.dish && b.dish !== r.name ? b.dish : '';
  draftFromBatch(d, b, r);
  open('batch', { draft: d });
}
function saveBatch() {
  var d = A.draft, r = rec(d.rec);
  if (d.planEdit) {
    var pi = (S.plans || []).findIndex(function (x) { return x.id === d.planEdit; });
    if (pi >= 0) { var np = planFromDraft(d, d.planEdit); np.kind = S.plans[pi].kind; S.plans[pi] = np; }
    audit('تعديل خطة «' + (d.dish || r.name) + '» ليوم ' + dlabel(d.date)); setState({ page: 'main', tab: 'kitchen', kk: d.kind, draft: null, sh: null }); mutated('حُفظ تعديل خطة «' + (d.dish || r.name) + '»'); return;
  }
  if (d.editId) {
    var b = E.editBatch(S, d.editId, { dish: d.dish || r.name, pots: d.pots, lines: batchLinesOut(dLines()) });
    b.portions = Number(d.portions) || 0; applyPricing(b, d);
    setState({ page: 'main', tab: 'kitchen', kk: d.kind, draft: null, sh: null }); mutated('حُفظ تعديل «' + r.name + '» وعُدّلت الأرصدة بالفرق');
    return;
  }
  if (d.date > today()) { /* طبخة قادمة: خطة بلا خصم، وتحفظ تعديلاتك لتُطبَّق عند البدء */
    S.plans = S.plans || []; S.plans.push(planFromDraft(d, newId('p', S.plans)));
    audit('جدولة «' + r.name + '» ليوم ' + dlabel(d.date)); setState({ page: 'main', tab: 'kitchen', kk: d.kind, draft: null, sh: null }); mutated('جُدولت «' + r.name + '» ' + dlabel(d.date) + '، ولم تُخصم مواد الآن'); return;
  }
  var nb = commitBatch(d, true), mk = nb.lines.filter(function (l) { return l.src && l.src.mkt; }).length;
  setState({ page: 'main', tab: 'kitchen', kk: d.kind, draft: null, sh: null });
  var ng = nb.lines.filter(function (l) { return E.balance(S, nb.order[0], l.item) < 0; }).length;
  mutated('حُفظت الطبخة وخُصمت المواد' + (mk ? ' (ما اشتُري من السوق مباشرة لم يُخصم من الخارجي)' : '') + (ng ? ' · ' + pl(ng, 'صنف', 'صنفان', 'أصناف') + ' بالسالب للمطالبة' : ''), function () { E.voidBatch(S, nb.id, today()); mutated('أُلغيت الطبخة وأُعيدت المواد'); });
}
function doSetBatchDate(id, dt) {
  var b = E.by(S.batches, id), was = b.date; E.setBatchDate(S, id, dt); audit('نقل تاريخ «' + batchName(b) + '» من ' + dlabel(was) + ' إلى ' + dlabel(dt)); shut(); mutated('نُقلت «' + batchName(b) + '» إلى ' + dlabel(dt));
}
function doVoid(id) { var b = E.by(S.batches, id); E.voidBatch(S, id, today()); shut(); mutated('أُلغيت «' + batchName(b) + '» وأُعيدت موادها'); }

/* ---------- الأرصدة الافتتاحية ---------- */
function approveOpening() {
  opInit(); var n = 0;
  Object.keys(OPV).forEach(function (id) { if (item(id) && E.setOpening(S, 'kitchen', id, OPV[id], today())) n++; });
  S.settings.openingDone = true; OPV = null; setState({ page: 'main', tab: 'stock', led: 'kitchen' }); mutated('اعتُمدت الأرصدة (' + pl(n, 'تعديل واحد', 'تعديلان', 'تعديلات') + ')');
}

/* ---------- استعادة نسخة ---------- */
function restoreFile(file) {
  var fr = new FileReader();
  fr.onload = function () { restoreState(fr.result); };
  fr.onerror = function () { say('تعذّرت قراءة الملف'); };
  fr.readAsText(file);
}

/* ---------- الخطة ---------- */
/* تاريخ الطبخة المخططة: من الأزرار السريعة أو من «يوم/شهر»؛ لا يُخصم شيء إلا عند بدء الطبخة */
function planDate() {
  var t = fv('dtxt').trim(); if (t) { var d1 = dateNear(t); return d1 && d1 >= today() ? d1 : null; }
  var d = fv('day'); return d === '' ? null : dayOff(+d || 0);
}
function planWhen() {
  if (!fv('dtxt')) A.form.dtxt = dayOff(fv('day') === '' || fv('day') == null ? 1 : (+fv('day') || 0));
  return [fDate('dtxt', 'تاريخ الطبخة', today(), '', 'لا يُخصم شيء من المخزن عند التخطيط، بل عند بدء الطبخة في يومها.')];
}
/* تاريخ الطبخة في المعالج وفي تعديل طبخة قائمة */
function bwDate() {
  var t = fv('dtxt').trim(); if (t) return dateNear(t);
  var d = fv('day'); return d === '' ? null : dayOff(+d || 0);
}
/* mode: 'past' (تسجيل طبخة سابقة) | 'edit' (تعديل تاريخ طبخة مسجّلة: أمس/اليوم/غدًا، والغد يحوّلها إلى مخططة) | غير ذلك (طبخة جديدة) */
function bwWhen(mode) {
  if (!fv('dtxt')) A.form.dtxt = fv('day') === '' || fv('day') == null ? today() : dayOff(+fv('day') || 0);
  return [fDate('dtxt', 'تاريخ الطبخة', '', mode === 'past' ? today() : '')];
}
/* تحويل طبخة مسجّلة إلى طبخة مخططة في تاريخ قادم: تُعاد موادها الآن وتُخصم عند بدئها في يومها */
function doBatchToPlan(id, dt) {
  var b = E.by(S.batches, id), r = rec(b.recipe), i0 = E.by(S.insts || [], b.inst), d = newDraft(b.kind, !!(i0 && i0.init));
  d.rec = r.id; d.pots = b.pots; d.inst = b.inst || null; d.portions = b.portions || ''; d.date = dt; d.dish = b.dish && b.dish !== r.name ? b.dish : ''; draftFromBatch(d, b, r);
  E.voidBatch(S, id, today());
  S.plans = S.plans || []; S.plans.push(planFromDraft(d, newId('p', S.plans)));
  audit('تحويل «' + batchName(b) + '» إلى طبخة مخططة ليوم ' + dlabel(dt)); shut(); mutated('صارت «' + batchName(b) + '» طبخة مخططة ' + dlabel(dt) + '، وأُعيدت موادها الآن');
}
function doAddPlan(r, pots) {
  S.plans = S.plans || []; var k = fv('kind') || (r.kinds.indexOf('private') >= 0 ? 'private' : 'external'), dt = planDate();
  S.plans.push({ id: newId('p', S.plans), date: dt, recipeId: r.id, pots: pots, kind: k });
  shut(); mutated('خُطّطت «' + r.name + '» ' + dlabel(dt));
}
function startFromPlan(p) {
  var d = draftFromPlan(p, newDraft(p.kind || 'private'));
  open('batch', { draft: d });
}

function doAddAlias(id, name, then, l) {
  var it = item(id); it.alias = (it.alias || []).concat([name]); audit('اسم بديل «' + name + '» للصنف «' + it.name + '»'); save();
  setState({ sh: then ? { t: then, item: id } : { t: 'item', id: id }, q: '', form: then === 'extra' ? { qty: '', by: 'pot' } : then === 'recLine' ? { per: '', fixed: 'no' } : then === 'issue' ? { led: l, qty: '', why: '' } : { led: l, unitMode: 'base', qty: '', price: '' } });
  say('«' + name + '» صار اسمًا بديلًا لـ«' + it.name + '»');
}

/* ===== 06-main.js ===== */
/* هوية التبويب الفرعي: الخارجي بني في اليوم والطبخ والمخزن، وWFP أخضر مزرق؛ فيتغير الرأس والزر السفلي والمحدد مع كل تبديل (المالك 2026-11-25: «مش مبين انه شاشة مختلفة») */
var HUE_EXT = { c: '#6E3A12', t: '#EBD9C6', ic: 'i-truck' }, HUE_WFP = { c: '#0B6E6E', t: '#D5ECEC', ic: 'i-shield' };
function hueSub(h, tab) {
  if (tab === 'stock') { var l = led(A.led); return l && l.ext ? HUE_EXT : l && l.id === 'wfp' ? HUE_WFP : h; }
  if (tab === 'kitchen') return A.kk === 'external' || A.kk === 'init' ? HUE_EXT : h;
  if (tab === 'today') return A.kindF === 'external' ? HUE_EXT : h;
  return h;
}
var DESTR = /^(حذف|إلغاء الحركة|إلغاء الطبخة|إلغاء التوريدة|إزالة)/; /* إجراء هدّام = أحمر */
/* ---------- القشرة: خصائص قوالب الهيكل (رأس، تبويبات، نوافذ، زر سفلي) ---------- */
function shell() {
  resetCaches();
  var s = A, pg = s.page, tab = s.tab, d = s.draft, blocks = [], title = '', sub = '', ft = null, ft2 = null, hasAction = false;
  if (pg === 'main') {
    var tt = { today: ['مطبخ عهد', dlong(today())], kitchen: ['الطبخ', 'طبخ وطبخ خارجي'], stock: ['المخزن', 'الأرصدة والاستلام'], workers: ['العمال', 'الحضور والحسابات'], more: ['المزيد', ''] }[tab];
    title = tt[0]; sub = tt[1];
    if (tab === 'stock' && led(A.led)) { title = led(A.led).name; sub = led(A.led).id === 'kitchen' ? tt[1] : 'المخزن'; } /* شاشة المخزن تسمّي مخزنها: لا «المخزن» ثابتة فوق مخزن آخر (المالك 2026-11-25) */
    blocks = tab === 'today' ? pgToday() : tab === 'kitchen' ? pgKitchen() : tab === 'stock' ? pgStock() : tab === 'workers' ? pgWorkers() : pgMore();
  } else if (pg === 'batch') {
    var ed = !!(d.editId || d.planEdit), k = d.step - (ed ? 1 : 0), n = ed ? 2 : 3;
    title = d.planEdit ? 'تعديل الخطة' : ed ? 'تعديل طبخة' : KNF[d.kind] + ' جديدة'; sub = 'الخطوة ' + k + ' من ' + n; blocks = pgBatch();
    var nl = dLines().length;
    if (d.step === 1) ft = { label: 'التالي: الكميات', ok: !!d.rec && (d.kind === 'private' || !!d.inst), hint: 'اختر الطبخة' + (d.kind === 'external' ? ' والمؤسسة' : '') + ' أولًا', go: function () { setDraft({ step: 2 }); } };
    else if (d.step === 2) ft = { label: 'التالي: مراجعة', ok: nl > 0, hint: 'أضف مكوّنًا واحدًا على الأقل', go: function () { setDraft({ step: 3 }); } };
    else ft = { label: d.planEdit ? 'حفظ تعديل الخطة' : ed ? 'حفظ التعديل' : d.date > today() ? 'جدولة الطبخة (بلا خصم الآن)' : 'حفظ وخصم من المخزن', ok: ed || !((S.days || {})[d.date] || {}).closed, hint: 'هذا اليوم مُغلق', go: saveBatch };
    if (d.step === 3 && !d.planEdit) ft2 = { label: 'نسخة للشيف', go: function () { shareChefBatch({ dish: (rec(d.rec) || {}).name, rec: d.rec, pots: d.pots, date: d.date, kind: d.kind, lines: batchLinesOut(dLines()).map(function (l) { return { item: l.item, qty: l.qty }; }) }, false); } };
  } else if (pg === 'worker') { var ww = wk(s.wid); title = ww.name; sub = money(ww.daily) + ' يوميًا'; blocks = pgWorker();
  } else if (pg === 'recipe') { var rc = rec(s.rid); title = rc.name; sub = rc.draft ? 'وصفة مبدئية' : 'وصفة معتمدة'; blocks = pgRecipe();
  } else if (pg === 'batches') { title = 'سجل الطبخات'; sub = KNF[s.bk || 'private'] + ' · مجمّعة حسب اليوم'; blocks = pgBatches();
  } else if (pg === 'recipes') { title = 'الوصفات'; sub = KNF[s.rk || 'private']; blocks = pgRecipes();
  } else if (pg === 'device') { title = 'إعدادات متقدمة'; sub = 'لهذا الجهاز'; blocks = pgDevice();
  } else if (pg === 'reports') { title = 'التقارير'; sub = 'اختر تقريرًا، ثم شارك أو انسخ'; blocks = pgReports();
  } else if (pg === 'pad') { title = 'المفكرة'; sub = ''; blocks = pgPad();
  } else if (pg === 'cal') { title = 'التقويم والتنبيهات'; sub = ''; blocks = pgCal();
  } else if (pg === 'people') { title = 'الأشخاص والصلاحيات'; sub = 'من يرى وماذا يعدّل'; blocks = pgPeople();
  } else if (pg === 'lists') { title = 'القوائم والحقول'; sub = 'أضف ما تحتاجه متى شئت'; blocks = pgLists();
  } else if (pg === 'admin') { title = 'الأرشيف والإدارة'; sub = 'للمدير التنفيذي فقط'; blocks = pgAdmin();
  } else if (pg === 'assets') { title = 'الموجودات'; sub = 'قدور وأدوات ومعدات المطبخ'; blocks = pgAssets();
  } else if (pg === 'funds') { title = 'الأرصدة'; sub = 'أين المال الآن'; blocks = pgFunds();
  } else if (pg === 'finsum') { title = 'الملخص المالي'; sub = 'أين ذهب المال'; blocks = pgFinSum();
  } else if (pg === 'ach') { title = 'الإنجاز'; sub = achLabel(achData(achRange().from, achRange().to)); blocks = pgAch();
  } else if (pg === 'wrep') { title = 'ملخص المتابعة'; sub = wrLabel(wrData(wrRange().from, wrRange().to)); blocks = pgWrep();
  } else if (pg === 'ownst') { title = 'كشف حسابنا'; sub = ownSub(); blocks = pgOwnSt();
  } else if (pg === 'fund') { var fu = fund(s.fid); title = fu.name; sub = fKind(fu); blocks = pgFund();
  } else if (pg === 'order') { var od = draftOf(s.did); title = 'مسودة توريد'; sub = od ? (od.src || 'نص') + ' · ' + dlabel(od.created || od.date) : ''; blocks = pgDraft();
    ft = { label: od && (od.date > today() || od.hold) ? (od.hold ? 'حفظ: لم يصل بعد' : 'جدولة التوريد القادم') : od ? 'اعتماد التوريد' + (od.lines.length ? ' · ' + pl(od.lines.length, 'صنف واحد', 'صنفان', 'أصناف') : '') : 'اعتماد', ok: dReady(od), hint: od && od.lines.length && dNeeds(od).length ? 'راجع الأسطر المعلّمة أولًا' : od && !rcvOk(od.date) ? 'غيّر تاريخ المسودة' : 'أضف سطرًا واحدًا على الأقل', go: approveDraft };
  } else if (pg === 'supplies') { title = 'سجل التوريدات'; sub = ''; blocks = pgSupplies();
  } else if (pg === 'supply') { var sd = draftOf(s.sid); title = sd ? supTitle(sd) : 'توريدة'; sub = sd ? dlabel(sd.date) + ' · ' + (led(sd.led) ? led(sd.led).name : '') : ''; blocks = pgSupply();
  } else if (pg === 'opening') { title = 'الأرصدة الافتتاحية'; sub = 'المخزن'; blocks = pgOpening(); ft = { label: S.settings.openingDone ? 'حفظ التعديلات' : 'اعتماد الأرصدة', ok: true, hint: '', go: approveOpening }; }
  var badge = 0;
  ledgers().forEach(function (l) { if (l.ext) return; itemsIn(l.id).forEach(function (it) { var q = E.balance(S, l.id, it.id); if (alertable(l, it, q) && stStatus(q, it.id).rank <= 2) badge++; }); });
  var unrec = E.wDay(S, today()).none;
  /* هوية كل تبويب رئيسي: لون وأيقونة كبيرة في الرأس، والتبويبات الفرعية والزر المحدد بلون القسم */
  var HUE = { today: { c: '#14563A', t: '#DCEFE3', ic: 'i-home' }, kitchen: { c: '#B5541A', t: '#F8E2D2', ic: 'i-pot' }, stock: { c: '#1F5C99', t: '#DAE8F5', ic: 'i-box' }, workers: { c: '#6A4A9C', t: '#E8E0F4', ic: 'i-users' }, more: { c: '#46504B', t: '#E4E7E3', ic: 'i-menu' } }, hu = pg === 'main' ? hueSub(HUE[tab], tab) : null, TIX = { today: 0, kitchen: 1, stock: 2, workers: 3, more: 4 };
  UI.hue = hu ? { fg: hu.c, bg: hu.t, ln: hu.c } : { fg: '#14563A', bg: '#FFFFFF', ln: '#14563A' };
  var tabs = [['today', 'اليوم', 'i-home', 0], ['kitchen', 'الطبخ', 'i-pot', 0], ['stock', 'المخزن', 'i-box', badge], ['workers', 'العمال', 'i-users', unrec], ['more', 'المزيد', 'i-menu', 0]].map(function (t) {
    var on = tab === t[0] && pg === 'main';
    return { label: t[1], icon: t[2], cur: on ? 'page' : 'false', fg: on ? '#FFFFFF' : '#4F5A54', fw: on ? 700 : 500, pill: on ? hueSub(HUE[t[0]], t[0]).c : 'transparent', ic: on ? '#FFFFFF' : '#4F5A54',
      hasBadge: t[3] > 0, badge: String(t[3]), go: function () { setState({ tab: t[0], page: 'main', sh: null, form: {}, q: '' }); } };
  });
  var pill = s.offline ? T.warn : T.ok;
  var f = s.sh ? shDesc() : {}, sft = f.ft || null, nt = f.note && f.note.text ? f.note : null, ntn = T[(nt && nt.tone) || 'info'], req = 'أكمل الحقول المطلوبة', tn = toneOf(f.tone);
  return {
    pageKey: pg + '|' + (pg === 'main' ? tab : pg === 'batch' ? d.step : pg === 'worker' ? s.wid : pg === 'fund' ? s.fid : pg === 'order' ? s.did : pg === 'supply' ? s.sid : s.rid), shKey: s.sh ? s.sh.t + '|' + (s.sh.item || s.sh.id || s.sh.wid || '') : '',
    hasHero: !!hu, heroIc: hu ? hu.ic : '', heroBg: hu ? hu.t : '', heroFg: hu ? hu.c : '', hdBand: hu ? hu.t : 'transparent', tabIx: pg === 'main' ? TIX[tab] : null,
    isMain: pg === 'main', canBack: pg !== 'main', goBack: goBack,
    title: title, sub: sub, hasSub: !!sub, hasAction: hasAction, actionLabel: '', actionGo: noop,
    offline: s.offline, pillBg: pill[0], pillFg: pill[1], pillIcon: s.offline ? 'i-wifiOff' : 'i-wifi',
    pillText: s.offline ? 'دون اتصال' : 'متصل · محفوظ',
    searchGo: function () { openSh({ t: 'search' }); },
    toggleOffline: noop,
    blocks: blocks, tabs: tabs,
    hasFooter: !!ft, ftLabel: ft ? ft.label : '', ftDisabled: ft ? !ft.ok : false, ftBg: ft && ft.ok ? (DESTR.test(ft.label) ? '#B3261E' : '#14563A') : '#D9DDD8', ftFg: ft && ft.ok ? '#FFFFFF' : '#4A544F',
    ftGo: ft ? (ft.ok ? ft.go : function () { say(ft.hint || req); }) : noop,
    hasFt2: !!ft2, ft2Label: ft2 ? ft2.label : '', ft2Fg: ft2 && DESTR.test(ft2.label) ? '#B3261E' : '#1B2421', ft2Bd: ft2 && DESTR.test(ft2.label) ? 'rgba(179,38,30,.45)' : 'rgba(27,36,33,.25)', ft2Go: ft2 ? ft2.go : noop,
    shOn: !!s.sh, shClose: shut,
    shTitle: f.title || '', shSub: f.sub || '', shHasSub: !!f.sub, shHdBg: tn ? tn.hdBg : '#FFFFFF', shHdBd: tn ? tn.line : 'transparent', shHasTag: !!tn, shTag: tn ? (f.toneTag || tn.tag) : '', shTagBg: tn ? tn.line : '', shTagFg: '#FFFFFF',
    shHasSearch: !!f.search, shQ: s.q, shPh: f.search || '', shOnQ: function (v) { setState({ q: v }); },
    shHasCols: !!f.cols, shCol0: f.cols ? f.cols[0] : '', shCol1: f.cols ? f.cols[1] : '', shCol2: f.cols ? f.cols[2] : '', shCol3: f.cols ? f.cols[3] : '', shHasActs: !!(f.acts && f.acts.length), shActs: f.acts || [], shActsCols: (function () { var n = (f.acts || []).length; return n === 6 ? 'repeat(3,1fr)' : n >= 7 ? 'repeat(4,1fr)' : 'repeat(auto-fit,minmax(58px,1fr))'; })(),
    shRows: f.rows || [], shHasRows: !!(f.rows && f.rows.length), shHasEmpty: !!f.empty && !(f.rows && f.rows.length), shEmpty: f.empty || '',
    shHasDup: !!f.dup, shDup: f.dup || '', shHasAdd: !!f.add, shAddLabel: f.add ? f.add.label : '', shAddGo: f.add ? f.add.go : noop, shHasAdd2: !!f.add2, shAdd2Label: f.add2 ? f.add2.label : '', shAdd2Go: f.add2 ? f.add2.go : noop,
    shFields: (f.fields || []).map(function (x) { if (tn && x.retone) x.retone(f.tone); if (x.money && tn) { x.ibg = tn.fieldBg; x.ibd = tn.line; x.ifc = tn.text; } return Object.assign({ sideDir: 'rtl', sideMode: 'text', sideFs: '15px', sideTa: 'start', isDD: false, ddOpen: false, ddLabel: '', ddOpts: [], ddToggle: noop, lbd: 'block', chh: '44px', chmw: '56px', chp: '0 14px', chfs: '14px', ibg: '#fff', ibd: 'rgba(27,36,33,.22)', ifs: '16px', ifw: '400', ifc: '#1B2421', hasCap: false, cap1: '', cap2: '', hasSide: false, sideV: '', sideIn: noop, sidePh: '', did: '', hasDrag: false, hasRm: false, rm: noop, fd: 'column', ai: 'stretch', gp: '6px', lf: 'none', cw: '100%', dir: 'rtl', ta: 'start', isCalc: false, opAdd: noop, opSub: noop, opMul: noop, opDiv: noop, opEq: noop, keep: noop, onKey: noop, isPhoto: false, phEmpty: false, phMenu: false, phOn: false, phSrc: '', phOpen: noop, phCam: noop, phFile: noop, phDel: noop, phCancel: noop }, x); }),
    shHasBusy: !!f.busy, shBusyText: f.busy ? f.busy.text : '', shBusyW: f.busy && f.busy.pct >= 0 ? Math.max(4, Math.round(f.busy.pct * 100)) + '%' : '40%', shBusyAnim: f.busy && f.busy.pct >= 0 ? 'none' : 'kind 1.3s ease-in-out infinite', shBusyHint: f.busy ? f.busy.hint || '' : '',
    shHasNote: !!nt, shNote: nt ? nt.text : '', shNoteBg: ntn[0], shNoteFg: ntn[1],
    shHasFooter: !!sft, shFtLabel: sft ? sft.label : '', shFtDisabled: sft ? !sft.ok : false, shFtBg: sft && sft.ok ? (tn ? tn.line : (DESTR.test(sft.label) ? '#B3261E' : '#14563A')) : '#D9DDD8', shFtFg: sft && sft.ok ? '#FFFFFF' : '#4A544F',
    shFtGo: sft ? (sft.ok ? sft.go : function () { say(req); }) : noop,
    shHasFt3: !!f.ft3, shFt3Label: f.ft3 ? f.ft3.label : '', shFt3Go: f.ft3 ? f.ft3.go : noop, shHasFt2: !!f.ft2, shFt2Label: f.ft2 ? f.ft2.label : '', shFt2Go: f.ft2 ? f.ft2.go : noop,
    toastOn: !!s.toast, toast: s.toast, hasUndo: !!s.hasUndo, doUndo: doUndo, toastBottom: pg === 'main' ? 84 : ft ? 92 : 20
  };
}

/* ---------- زر الرجوع في أندرويد ---------- */
function onBack() {
  if (A.sh) { var ps = SHS.pop(); if (ps) { setState({ sh: ps.sh, form: ps.form, q: '' }); return; } shut(); return; }
  if (A.page !== 'main') { goBack(); return; }
  if (A.tab !== 'today') { setState({ tab: 'today' }); return; }
  if (P.App && P.App.exitApp) P.App.exitApp();
}

/* ---------- البدء ---------- */
load().then(function () { runMigrations(); return mergeHistory(); }).then(mergeMoney).then(function () { return bkAdd('auto'); }).then(loadProposal).then(loadExtProposal).then(function () {
  UI.mount($('app'), shell); render(); syncStart();
  if (lsj('ahd_daily', false)) armDaily().catch(function () {}); // يُعاد جدولة التنبيه عند كل فتح
  armCal();
  if (P.App && P.App.addListener) P.App.addListener('backButton', onBack);
  phWire(); var rf = $('rfile'); if (rf) rf.addEventListener('change', function () { if (rf.files[0]) restoreFile(rf.files[0]); rf.value = ''; });
  window.addEventListener('online', render); window.addEventListener('offline', render);
  window.__BOOTED = true; try { localStorage.removeItem('kitchen_upd_try'); } catch (e) {} // اكتمل البدء: الحزمة المحدَّثة سليمة
  setTimeout(function () { checkUpdate(); }, 4000);
}).catch(function (er) { if (window.__UPD && !window.__BOOTED) { try { var u = JSON.parse(localStorage.getItem('kitchen_upd') || 'null'); if (u) localStorage.setItem('kitchen_upd_bad', u.ver); localStorage.removeItem('kitchen_upd'); localStorage.removeItem('kitchen_upd_try'); } catch (e2) {} location.reload(); return; } $('app').textContent = 'تعذّر تحميل البيانات: ' + er.message; });
window.__kitchen = { stAllCanvas: function (ym, full) { return stAllCanvas(ym, full); }, stmtCanvas: function (i, ym) { return stmtCanvas(i, ym); }, wfSpec: function (d) { return wfSpec(d); }, eaSpec: function (d) { return eaSpec(d); }, saSpec: function (d) { return saSpec(d); }, saHash: function () { return saHash(); }, pdfFromCanvas: function (c) { return pdfFromCanvas(c); }, pdfA4Pages: function (c) { return pdfA4Pages(c); }, paperCanvas: function (k) { return paperCanvas(k); }, waSpec: function (d) { return waSpec(d); }, supArrive: function (f) { return supArrive(f); }, supSched: function () { return supSched(); }, stmtDetailCanvas: function (i, y) { return stmtDetailCanvas(i, y); }, money: money, repDoc: repDoc, migrateDistTot: migrateDistTot, syncMergeData: syncMergeData, gwOps: gwOps, stockAfter: stockAfter, wstDoc: wstDoc, wstCanvas: wstCanvas, packTxt: packTxt, qtyU: qtyU, packNum: packNum, perTxt: perTxt, planAfter: planAfter, ocrPick: ocrPick, ocrQty: ocrQty, openDLine: openDLine, draftOf: draftOf, ocrLearn: ocrLearn, ocrPrep: ocrPrep, ocrWorker: ocrWorker, ocrRows: ocrRows, planShort: planShort, dLines: dLines, back: goBack, hwBack: onBack, open: open, openSh: openSh, state: function () { return S; }, ui: function () { return A; }, render: render, syncNow: syncNow, save: save, eng: E, fin: { catOf: function (m) { return catOf(m); }, data: function (y) { return finData(y); } }, chefImg: function (id) { return chefCanvas(chefSpecPlan(E.by(S.plans, id))).toDataURL('image/png'); }, chefDocP: function (ids, o) { return chefCompose(ids.map(function (id) { return chefSpecPlan(E.by(S.plans, id)); }), o); }, chefText: function (d) { return chefText(d); }, chefPng: function (d) { return chefCanvas(d).toDataURL('image/png'); }, chefImgR: function (id) { return chefCanvas(chefSpecRec(E.by(S.recipes, id))).toDataURL('image/png'); }, chefImgB: function (id) { return chefCanvas(chefSpecBatch(E.by(S.batches, id), true)).toDataURL('image/png'); } };

/* ===== 06u-update.js ===== */
/* ---------- التحديث الصامت للواجهة ----------
   يجلب التطبيق ملفات الواجهة المحدَّثة (بلا APK جديد) من مكان الاستضافة، يتحقق من بصمتها، يحفظها،
   وتعمل عند الفتح التالي. ما يحتاج APK (إضافات أندرويد وأذونات) لا يدخل هنا: يُحدَّد بـ minPkg. */
var UPD_URL = 'https://abdalrazeqsh.github.io/kitchen-app-web/', UPD_K = 'kitchen_upd';
function vcmp(a, b) { a = String(a).split('.'); b = String(b).split('.'); for (var i = 0; i < 3; i++) { var x = +a[i] || 0, y = +b[i] || 0; if (x !== y) return x > y ? 1 : -1; } return 0; }
function sha256hex(txt) { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt)).then(function (b) { return [].map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }); }
function updPending() { try { var u = JSON.parse(localStorage.getItem(UPD_K) || 'null'); return u && vcmp(u.ver, VERSION) > 0 ? u.ver : ''; } catch (e) { return ''; } }
function checkUpdate(force) {
  var base = ''; try { base = localStorage.getItem('kitchen_upd_url') || UPD_URL; } catch (e) { base = UPD_URL; }
  var native = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()), hook = false; try { hook = !!localStorage.getItem('kitchen_upd_url'); } catch (e) {}
  if (!(native || hook)) { if (force) say('التحديث الصامت يعمل داخل التطبيق على الهاتف'); return Promise.resolve(); } // في المتصفح والاختبارات لا يُجلب شيء إلا بتحديد عنوان تجريبي صراحةً
  if (!base || !navigator.onLine || !window.crypto || !crypto.subtle) { if (force) say('لا اتصال بالإنترنت الآن'); return Promise.resolve(); }
  try { if (!force && Date.now() - (+localStorage.getItem('kitchen_upd_chk') || 0) < 30 * 6e4) return Promise.resolve(); localStorage.setItem('kitchen_upd_chk', String(Date.now())); } catch (e) { return Promise.resolve(); }
  var ac = window.AbortController ? new AbortController() : null, tm = ac ? setTimeout(function () { ac.abort(); }, 15000) : 0;
  return fetch(base + 'version.json?t=' + Date.now(), { cache: 'no-store', signal: ac ? ac.signal : undefined }).then(function (r) { clearTimeout(tm); if (!r.ok) throw new Error('v'); return r.json(); }).then(function (v) {
    if (!v || !v.ver || !v.files) { if (force) say('تعذّر التأكد: الاتصال ضعيف'); return; }
    if (vcmp(window.PKG_VER || '0.0.0', v.minPkg || '0.0.0') < 0) { if (force) say('الإصدار ' + v.ver + ' يحتاج تثبيت APK جديد'); return; }
    if (updPending() === v.ver) { if (force) say('يتوفر تحديث ' + v.ver + ': أغلق التطبيق وافتحه'); return; }
    if (vcmp(v.ver, VERSION) <= 0) { if (force) say('أنت على أحدث إصدار (' + VERSION + ')'); return; }
    var names = Object.keys(v.files);
    return Promise.all(names.map(function (n) {
      return fetch(base + n + '?v=' + v.ver, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(n); return r.text(); }).then(function (t) { return sha256hex(t).then(function (h) { if (h !== v.files[n]) throw new Error('hash ' + n); return [n, t]; }); });
    })).then(function (pairs) {
      var f = {}; pairs.forEach(function (p) { f[p[0]] = p[1]; });
      localStorage.setItem(UPD_K, JSON.stringify({ ver: v.ver, f: f })); localStorage.removeItem(UPD_K + '_bad');
      say('يتوفر تحديث ' + v.ver + ': أغلق التطبيق وافتحه');
    });
  }).catch(function () { clearTimeout(tm); if (force) say('تعذّر التأكد: الاتصال ضعيف'); });
}

/* ===== 06v-sync.js ===== */
/* ---------- المزامنة بين الأجهزة (Supabase): نسخة كاملة بمراجعة رقمية وحماية من التعارض ----------
   المفتاح العلني (publishable) علني بطبيعته؛ الحماية في صلاحيات القاعدة. لا تُحفظ كلمة السر: الجلسة فقط. */
var SYNC_URL = (function () { try { return localStorage.getItem('kitchen_sync_url'); } catch (e) { return ''; } })() || 'https://cwylaspgbeqlazwordxo.supabase.co', SYNC_KEY = 'sb_publishable_VN4Zs0NHVkTC_mW6jgmQ9w_be2Fmgyl';
var SYNC_SK = 'kitchen_sync_sess', SYNCBUSY = false, SYNCMSG = '', SYNC_T = 0;
function syncNative() { return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()); }
function syncDevice() { return syncNative() ? 'الهاتف' : 'الويب'; }
function syncSess() { try { return JSON.parse(localStorage.getItem(SYNC_SK) || 'null'); } catch (e) { return null; } }
function syncSetSess(s) { try { if (s) localStorage.setItem(SYNC_SK, JSON.stringify(s)); else localStorage.removeItem(SYNC_SK); } catch (e) {} }
function syncHead(tok) { return { apikey: SYNC_KEY, Authorization: 'Bearer ' + (tok || SYNC_KEY), 'Content-Type': 'application/json' }; }
function syncStore(j) { return { access_token: j.access_token, refresh_token: j.refresh_token, exp: Date.now() + (j.expires_in || 3600) * 1000 - 60000, email: (j.user && j.user.email) || (syncSess() || {}).email || '' }; }
function syncLogin(email, pw) {
  return fetch(SYNC_URL + '/auth/v1/token?grant_type=password', { method: 'POST', headers: syncHead(), body: JSON.stringify({ email: email, password: pw }) })
    .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error_description || j.msg || 'فشل الدخول'); return j; }); })
    .then(function (j) { syncSetSess(syncStore(j)); });
}
function syncToken() {
  var s = syncSess(); if (!s) return Promise.reject(new Error('no-session'));
  if (Date.now() < s.exp) return Promise.resolve(s.access_token);
  return fetch(SYNC_URL + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: syncHead(), body: JSON.stringify({ refresh_token: s.refresh_token }) })
    .then(function (r) { return r.json().then(function (j) { if (!r.ok) { syncSetSess(null); throw new Error('انتهت الجلسة: ادخل من جديد'); } return j; }); })
    .then(function (j) { var n = syncStore(j); n.email = s.email; syncSetSess(n); return n.access_token; });
}
function syncApi(path, opt) {
  return syncToken().then(function (tok) {
    opt = opt || {}; opt.headers = syncHead(tok);
    return fetch(SYNC_URL + path, opt).then(function (r) { return r.text().then(function (t) { var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {} if (!r.ok) { var m = (j && (j.message || j.error_description)) || t || 'خطأ'; throw new Error(m); } return j; }); });
  });
}
/* بصمة محتوى البيانات (بدون حقول المزامنة نفسها) */
function syncPayload() { var c = JSON.parse(JSON.stringify(S)); Object.keys(c.settings || {}).forEach(function (k) { if (k.indexOf('sync') === 0) delete c.settings[k]; }); return c; }
function syncHash(txt) { var h = 5381; for (var i = 0; i < txt.length; i++) h = ((h << 5) + h + txt.charCodeAt(i)) | 0; return String(h) + ':' + txt.length; }
function syncDirty(txt) { return syncHash(txt) !== (S.settings.syncHash || ''); }
function syncMark(rev, txt) { S.settings.syncRev = rev; S.settings.syncHash = syncHash(txt); S.settings.syncAt = Date.now(); S.settings.syncConflict = 0; save(); }
function syncPull(rev, data) {
  var keep = {}; Object.keys(S.settings || {}).forEach(function (k) { if (k.indexOf('sync') === 0) keep[k] = S.settings[k]; });
  return bkAdd('pre').then(function () {
    var prev = S;
    try { S = data; S.settings = Object.assign(S.settings || {}, keep); runMigrations(); } catch (er) { S = prev; throw er; }
    syncMark(rev, JSON.stringify(syncPayload())); resetCaches(); OPV = null; return mergeHistory().then(mergeMoney).then(function () { render(); });
  });
}
/* دمج تلقائي عند التعارض: بيانات التطبيق سجلات بمعرّفات (append-only)، فنجمع سجلات الجهازين معًا بدل أن يختار المستخدم نسخة تُسقط الأخرى.
   لكل مصفوفة سجلات بمعرّف: ما انفرد به الخادم يُضاف، وما اتفق معرّفه يبقى كما هنا إلا إذا كان الملغي (void) على الخادم فيُؤخذ.
   الإعدادات والقيم المفردة تبقى كما هنا. تُحفظ لقطة قبل الدمج. */
function syncMergeData(loc, rem) {
  var out = JSON.parse(JSON.stringify(loc)), added = 0, clash = 0;
  Object.keys(rem || {}).forEach(function (k) {
    var a = out[k], b = rem[k];
    if (a === undefined) { out[k] = b; return; }
    if (!Array.isArray(a) || !Array.isArray(b)) return;
    var withId = function (x) { return x.length && x.every(function (o) { return o && typeof o === 'object' && o.id != null; }); };
    if (!withId(b) || (a.length && !withId(a))) return;
    var idx = {}; a.forEach(function (o, i) { idx[o.id] = i; });
    b.forEach(function (o) {
      if (idx[o.id] === undefined) { a.push(o); idx[o.id] = a.length - 1; added++; return; }
      var mine = a[idx[o.id]];
      if (JSON.stringify(mine) === JSON.stringify(o)) return;
      if (o.void && !mine.void) { a[idx[o.id]] = o; added++; } else clash++;
    });
  });
  return { data: out, added: added, clash: clash };
}
function syncMerge() {
  return syncApi('/rest/v1/app_state?id=eq.1&select=rev,data').then(function (r) {
    var rem = r && r[0]; if (!rem) throw new Error('no-remote');
    var m = syncMergeData(syncPayload(), rem.data), keep = {};
    Object.keys(S.settings || {}).forEach(function (k) { if (k.indexOf('sync') === 0) keep[k] = S.settings[k]; });
    return bkAdd('pre').then(function () {
      var prev = S;
      try { S = m.data; S.settings = Object.assign(S.settings || {}, keep); runMigrations(); } catch (er) { S = prev; throw er; }
      var txt = JSON.stringify(syncPayload());
      return syncApi('/rest/v1/rpc/push_state', { method: 'POST', body: JSON.stringify({ p_base: rem.rev, p_data: JSON.parse(txt), p_device: syncDevice() }) }).then(function (rev) {
        syncMark(rev, txt); resetCaches(); OPV = null;
        SYNCMSG = m.added ? 'دُمجت بيانات الجهازين (' + m.added + ' سجل من الجهاز الآخر)' : 'متزامن';
        return mergeHistory().then(mergeMoney).then(function () { render(); });
      });
    });
  });
}
function syncNow(manual) {
  if (SYNCBUSY || !S || !syncSess()) return Promise.resolve();
  if (!navigator.onLine) { SYNCMSG = 'لا اتصال'; return Promise.resolve(); }
  SYNCBUSY = true;
  var txt = JSON.stringify(syncPayload()), base = S.settings.syncRev || 0, dirty = syncDirty(txt);
  return syncApi('/rest/v1/app_state?id=eq.1&select=rev,device,updated_at').then(function (rows) {
    var rem = rows && rows[0] ? rows[0] : null, rr = rem ? rem.rev : 0;
    if (!rem) { // الخادم فارغ: نرفع ما عندنا إن كان فيه بيانات
      if (!hasData() && !manual) return;
      return syncApi('/rest/v1/rpc/push_state', { method: 'POST', body: JSON.stringify({ p_base: 0, p_data: JSON.parse(txt), p_device: syncDevice() }) }).then(function (rev) { syncMark(rev, txt); SYNCMSG = 'رُفعت بياناتك'; });
    }
    if (rr === base) {
      if (!dirty) { S.settings.syncAt = Date.now(); SYNCMSG = 'متزامن'; return; }
      return syncApi('/rest/v1/rpc/push_state', { method: 'POST', body: JSON.stringify({ p_base: base, p_data: JSON.parse(txt), p_device: syncDevice() }) }).then(function (rev) { syncMark(rev, txt); SYNCMSG = 'رُفع آخر تعديل'; });
    }
    // الخادم أحدث
    if (!dirty || (!hasData() && base === 0)) {
      return syncApi('/rest/v1/app_state?id=eq.1&select=rev,data').then(function (r2) { return syncPull(r2[0].rev, r2[0].data); }).then(function () { SYNCMSG = 'وصلت تحديثات من ' + (rem.device || 'جهاز آخر'); });
    }
    return syncMerge().catch(function (er) { S.settings.syncConflict = rr; save(); SYNCMSG = 'تعذّر الدمج التلقائي (' + ((er && er.message) || 'خطأ').slice(0, 60) + '): افتح التعارض واختر نسخة'; render(); });
  }).catch(function (er) { SYNCMSG = (er && er.message) || 'تعذّرت المزامنة'; if (/conflict/.test(SYNCMSG)) { return syncMerge().catch(function (er) { S.settings.syncConflict = -1; save(); SYNCMSG = 'تعذّر الدمج التلقائي (' + ((er && er.message) || 'خطأ').slice(0, 60) + '): افتح التعارض واختر نسخة'; }); } if (manual) say(SYNCMSG); })
    .then(function () { SYNCBUSY = false; if (manual && SYNCMSG) say(SYNCMSG); try { render(); } catch (e) {} });
}
function syncSoon() { if (!syncSess()) return; clearTimeout(SYNC_T); SYNC_T = setTimeout(function () { syncNow(false); }, 8000); }
function syncStart() {
  if (!syncSess()) return;
  syncNow(false);
  window.addEventListener('online', function () { syncNow(false); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) syncNow(false); });
  setInterval(function () { if (!document.hidden) syncNow(false); }, 60000);
}
function syncTag() { var s = syncSess(); return !s ? { t: 'غير مفعّل', tone: 'mute' } : S.settings.syncConflict ? { t: 'تعارض', tone: 'bad' } : { t: 'مفعّل', tone: 'ok' }; }
function syncSub() { var s = syncSess(); if (!s) return ''; return s.email + (S.settings.syncAt ? ' · آخر مزامنة ' + new Date(S.settings.syncAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) : '') + (SYNCMSG ? ' · ' + SYNCMSG : ''); }
function syncAttn(att) { if (syncSess() && S.settings.syncConflict) att.push({ rank: 0.1, row: X({ icon: 'i-clock', icTone: 'bad', title: 'تعارض في المزامنة', sub: 'عدّلتَ هنا وعلى جهاز آخر: اختر أي نسخة تُعتمد', tag: 'اختر', tagTone: 'bad', chev: true, go: function () { openSh({ t: 'syncc' }); } }) }); }
function doSyncLogin() {
  var em = fv('email').trim(), pw = fv('pw'); if (!em || !pw) { say('اكتب البريد وكلمة السر'); return; }
  say('جارٍ الدخول…'); syncLogin(em, pw).then(function () { A.form.pw = ''; shut(); syncStart(); return syncNow(true); }).catch(function (er) { say((er && er.message) || 'فشل الدخول'); });
}
function doSyncOut() { syncSetSess(null); S.settings.syncConflict = 0; save(); shut(); mutated('خرجتَ من الحساب. تبقى بياناتك على هذا الجهاز'); }
function doSyncChoose(mine) {
  var txt = JSON.stringify(syncPayload()); shut();
  if (mine) {
    syncApi('/rest/v1/app_state?id=eq.1&select=rev').then(function (r) { var rev = r && r[0] ? r[0].rev : 0; return syncApi('/rest/v1/rpc/push_state', { method: 'POST', body: JSON.stringify({ p_base: rev, p_data: JSON.parse(txt), p_device: syncDevice() }) }); })
      .then(function (rev) { syncMark(rev, txt); mutated('اعتُمدت نسخة هذا الجهاز'); }).catch(function (er) { say((er && er.message) || 'تعذّر الحفظ'); });
  } else {
    syncApi('/rest/v1/app_state?id=eq.1&select=rev,data').then(function (r) { return syncPull(r[0].rev, r[0].data); }).then(function () { say('اعتُمدت نسخة الخادم. لقطة بيانات هذا الجهاز محفوظة في «لقطات تلقائية»'); }).catch(function (er) { say((er && er.message) || 'تعذّر السحب'); });
  }
}
function syncSheet(sh) {
  if (sh.t === 'sync') {
    var s = syncSess();
    if (!s) {
      var pw = fSecret('pw', 'كلمة السر', '');
      return { title: 'الحساب والمزامنة', sub: 'ادخل مرة واحدة على كل جهاز', fields: [fText('email', 'البريد', 'name@example.com', 'email'), pw],
        note: { text: 'تُحفظ الجلسة فقط ولا تُحفظ كلمة السر. بعد الدخول يتزامن التطبيق تلقائيًا مع كل اتصال بالإنترنت.', tone: 'info' },
        ft: { label: 'دخول', ok: !!(fv('email').trim() && fv('pw')), go: doSyncLogin } };
    }
    return { title: 'الحساب والمزامنة', sub: s.email,
      rows: [X({ icon: 'i-check', icTone: S.settings.syncConflict ? 'bad' : 'ok', title: S.settings.syncConflict ? 'تعارض بانتظار قرارك' : SYNCMSG || 'متزامن', sub: (S.settings.syncAt ? 'آخر مزامنة ' + new Date(S.settings.syncAt).toLocaleString('ar') : 'لم تتم بعد') + ' · مراجعة ' + (S.settings.syncRev || 0) }),
        S.settings.syncConflict ? X({ icon: 'i-clock', icTone: 'bad', title: 'حل التعارض بنفسك', sub: 'اختر نسخة هذا الجهاز أو نسخة الخادم', tag: 'اختر', tagTone: 'bad', chev: true, go: function () { openSh({ t: 'syncc' }); } }) : null,
        X({ title: 'ما يُزامَن', sub: 'كل بيانات التطبيق. الصور تبقى على الجهاز الذي التُقطت عليه' })].filter(Boolean),
      ft: { label: 'مزامنة الآن', ok: true, go: function () { syncNow(true); } }, ft2: { label: 'تسجيل الخروج', go: doSyncOut } };
  }
  if (sh.t === 'syncc') {
    return { title: 'تعارض في المزامنة', sub: 'عدّلتَ هنا وعلى جهاز آخر',
      rows: [X({ icon: 'i-clock', icTone: 'bad', title: 'اختر النسخة التي تُعتمد', sub: 'الأخرى تُحفظ لقطة قبل أن تُستبدل، فلا يضيع شيء' })],
      ft: { label: 'اعتماد نسخة هذا الجهاز', ok: true, go: function () { doSyncChoose(true); } }, ft2: { label: 'اعتماد نسخة الخادم', go: function () { doSyncChoose(false); } } };
  }
  return null;
}

})();
