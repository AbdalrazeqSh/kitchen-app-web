/* محرك حساب «المطبخ» — دوال نقية بلا واجهة، تعمل في المتصفح وفي Node للاختبار.
   المبدأ: الرصيد = مجموع الحركات. لا يُحذف شيء: التصحيح حركة جديدة. حركات «hist» للاطلاع فقط ولا تدخل الرصيد. */
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else root.Engine = factory(); })(this, function () {
  'use strict';
  var r2 = function (n) { return Math.round(n * 100) / 100; };
  var r3 = function (n) { return Math.round(n * 1000) / 1000; };

  function uid(s, p) { s.seq = (s.seq || 0) + 1; return (p || 'x') + s.seq.toString(36) + Math.random().toString(36).slice(2, 5); }
  function isFree(l) { return !!(l && (l.inkind || l.wck)); }
  function by(arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return null; }

  function newState(seed) {
    return { v: 1, seq: 0, items: seed.items, ledgers: seed.ledgers, recipes: seed.recipes, insts: seed.insts, units: seed.units,
      moves: [], batches: [], settings: { openingDone: false } };
  }

  /* رصيد صنف في مخزن (حركات hist مستثناة) */
  function balance(s, led, item) {
    var t = 0;
    for (var i = 0; i < s.moves.length; i++) { var m = s.moves[i]; if (m.led === led && m.item === item && m.kind !== 'hist') t += m.q; }
    return r3(t);
  }
  function balances(s, led) {
    var o = {};
    s.moves.forEach(function (m) { if (m.led === led && m.kind !== 'hist') o[m.item] = (o[m.item] || 0) + m.q; });
    Object.keys(o).forEach(function (k) { o[k] = r3(o[k]); });
    return o;
  }

  function addMove(s, m) {
    var mv = { id: uid(s, 'm'), ts: m.ts || Date.now(), date: m.date, led: m.led, item: m.item, q: r3(m.q), kind: m.kind, ref: m.ref || '', note: m.note || '' };
    if (m.imported) mv.imported = true;
    if (m.meal) mv.meal = m.meal;
    if (m.price != null) mv.price = m.price;
    s.moves.push(mv);
    return mv;
  }

  /* أرصدة افتتاحية: تُضاف كحركة 'opening' (والتعديل حركة فرق) */
  function setOpening(s, led, item, q, date) {
    var cur = balance(s, led, item), d = r3(q - cur);
    if (d === 0) return null;
    return addMove(s, { date: date, led: led, item: item, q: d, kind: 'opening', note: 'رصيد افتتاحي' });
  }

  function receive(s, o) { // {date, led, item, q, note}
    if (!(o.q > 0)) throw new Error('الكمية يجب أن تكون أكبر من صفر');
    return addMove(s, { date: o.date, led: o.led, item: o.item, q: o.q, kind: 'receive', note: o.note });
  }

  /* ترتيب الخصم: الخاصة: مخزن المطبخ (WCK) أولًا ثم الخارجي. المؤسسة: مخزنها الخاص، والخارجي أولًا إن كانت ترتبط به */
  function planOrder(s, kind, instId) {
    if (kind === 'private') return ['kitchen', 'ext'];
    var i = instId ? by(s.insts, instId) : null, led = i ? i.led : 'ext';
    return led === 'ext' ? ['ext', 'kitchen'] : [led];
  }

  /* توزيع كمية على المخازن بالترتيب: كل مخزن يعطي ما عنده، والأخير يأخذ الباقي ولو سالب */
  function splitQty(s, order, item, q, extra) {
    var src = {}, rem = q;
    order.forEach(function (l, i) {
      var have = Math.max(balance(s, l, item) + ((extra && extra[l]) || 0), 0), last = i === order.length - 1;
      var t = last ? rem : Math.min(have, rem);
      if (t !== 0) src[l] = r3(t);
      rem = r3(rem - t);
    });
    return src;
  }

  /* تسجيل طبخة: o = {date, dish, recipeId, pots, kind, instId, lines:[{item, qty}], note, order?} */
  function recordBatch(s, o) {
    var order = o.order || planOrder(s, o.kind || 'private', o.instId);
    var id = uid(s, 'b'), lines = [], cost = 0, ext = 0;
    (o.lines || []).forEach(function (l) {
      if (!(l.qty > 0)) return;
      var it = by(s.items, l.item); if (!it) throw new Error('صنف غير معروف: ' + l.item);
      var src = splitQty(s, l.fill === false ? order.slice(0, 1) : order, l.item, l.qty); /* fill===false: النقص يبقى سالبًا في المخزن الأول ولا يُكمَل من غيره */
      if (l.mkt && src.ext) { src.mkt = src.ext; delete src.ext; } /* اشتُري مباشرة من السوق: لا يُخصم من المخزن الخارجي لكنه يُحتسب في التكلفة */
      var price = l.price != null ? l.price : it.price || 0, lc = 0;
      Object.keys(src).forEach(function (led) {
        if (led === 'mkt') { lc += src[led] * price; return; }
        addMove(s, { date: o.date, led: led, item: l.item, q: -src[led], kind: 'batch', ref: id, note: o.dish || '' });
        if (!isFree(by(s.ledgers, led))) lc += src[led] * price;
      });
      var ln = { item: l.item, qty: r3(l.qty), price: price, src: src, cost: r2(lc) };
      if (l.planned != null) ln.planned = l.planned; if (l.dev) ln.dev = l.dev; if (l.extra) ln.extra = true;
      lines.push(ln);
      cost += lc;
    });
    var b = { id: id, ts: Date.now(), date: o.date, dish: o.dish || '', recipe: o.recipeId || '', pots: o.pots || 0, kind: o.kind || 'private',
      inst: o.instId || '', order: order, lines: lines, cost: r2(cost), note: o.note || '' };
    s.batches.push(b);
    return b;
  }


  /* صافي ما استهلكته طبخة من كل مخزن لصنف (يشمل تعديلاتها): {led: qty} */
  function batchNet(s, id, item) {
    var o = {};
    s.moves.forEach(function (m) { if (m.ref === id && m.kind === 'batch' && (!item || m.item === item)) o[m.led + '|' + m.item] = (o[m.led + '|' + m.item] || 0) - m.q; });
    return o;
  }

  /* تعديل طبخة (في اليوم نفسه عادةً): لا يُمسّ السجل القديم؛ تُضاف حركات الفرق فقط. o = {dish, pots, lines:[{item, qty}]} */
  function editBatch(s, id, o, date) {
    var b = by(s.batches, id); if (!b) throw new Error('طبخة غير موجودة'); if (b.void) throw new Error('الطبخة ملغاة');
    var net = batchNet(s, id), items = {}, lines = [], cost = 0, changed = 0;
    b.lines.forEach(function (l) { items[l.item] = 1; });
    (o.lines || []).forEach(function (l) { items[l.item] = 1; });
    var want = {}, meta = {}; (o.lines || []).forEach(function (l) { if (l.qty > 0) { want[l.item] = (want[l.item] || 0) + l.qty; meta[l.item] = l; } });
    var dish = o.dish != null ? o.dish : b.dish;
    Object.keys(items).forEach(function (item) {
      var it = by(s.items, item); if (!it) throw new Error('صنف غير معروف: ' + item);
      var old = {}; b.order.forEach(function (l) { old[l] = net[l + '|' + item] || 0; });
      var q = want[item] || 0, mk = meta[item] || {}, src = q > 0 ? splitQty(s, mk.fill === false ? b.order.slice(0, 1) : b.order, item, q, old) : {};
      if (q > 0 && mk.keep) { var kt = Object.keys(mk.keep).reduce(function (a, k) { return a + mk.keep[k]; }, 0); if (kt > 0) { src = {}; Object.keys(mk.keep).forEach(function (k) { src[k] = r3(mk.keep[k] * q / kt); }); } }
      if (mk.mkt && src.ext) { src.mkt = src.ext; delete src.ext; }
      var price = (b.lines.filter(function (l) { return l.item === item; })[0] || {}).price;
      if (mk.price != null && mk.price >= 0) price = mk.price;
      if (price == null) price = it.price || 0;
      var lc = 0;
      b.order.forEach(function (l) {
        var d = r3((src[l] || 0) - (old[l] || 0));
        if (d !== 0) { addMove(s, { date: date || b.date, led: l, item: item, q: -d, kind: 'batch', ref: id, note: 'تعديل: ' + dish }); changed++; }
        if (src[l] && !isFree(by(s.ledgers, l))) lc += src[l] * price;
      });
      if (src.mkt) lc += src.mkt * price;
      if (q > 0) { var ln2 = { item: item, qty: r3(q), price: price, src: src, cost: r2(lc) }; if (mk.planned != null) ln2.planned = mk.planned; if (mk.dev) ln2.dev = mk.dev; if (mk.extra) ln2.extra = true; lines.push(ln2); cost += lc; }
    });
    b.lines = lines; b.cost = r2(cost); b.dish = dish; if (o.pots != null) b.pots = o.pots; b.edits = (b.edits || 0) + (changed || o.dish != null || o.pots != null ? 1 : 0);
    return b;
  }

  /* تصحيح تاريخ طبخة (نُسيت أو سُجّلت في يوم خطأ): يُحفظ التاريخ الأصلي في الطبخة وتنتقل حركاتها معها */
  function setBatchDate(s, id, date) {
    var b = by(s.batches, id); if (!b) throw new Error('طبخة غير موجودة'); if (b.void) throw new Error('الطبخة ملغاة'); if (b.date === date) return b;
    b.dateWas = (b.dateWas || []).concat([b.date]);
    s.moves.forEach(function (m) { if (m.ref === id && m.kind === 'batch') m.date = date; });
    b.date = date; return b;
  }

  /* إلغاء طبخة: إعادة صافي ما استُهلك */
  function voidBatch(s, id, date) {
    var b = by(s.batches, id); if (!b || b.void) return null;
    var net = batchNet(s, id);
    Object.keys(net).forEach(function (k) { var p = k.split('|'); if (net[k] !== 0) addMove(s, { date: date, led: p[0], item: p[1], q: net[k], kind: 'batch', ref: id, note: 'إلغاء: ' + b.dish }); });
    b.void = true; return b;
  }


  /* ---------- العمال: حضور بحالات قابلة للتعريف (كما في التصميم) وكشف حساب لكل عامل.
     كل يوم يحفظ يوميته وأثر حالته وقتها، فلا يتغير الماضي إن تغيّرت اليومية أو الحالة ---------- */
  var STATS = [
    { id: 'p', name: 'حضور', mult: 1, bonus: 0, tone: 'ok' }, { id: 'x', name: 'امتياز', mult: 1, bonus: 10, tone: 'info' },
    { id: 'l', name: 'تقصير', mult: 0.8, bonus: 0, tone: 'warn' }, { id: 'a', name: 'غياب', mult: 0, bonus: 0, tone: 'bad' },
    { id: 'h', name: 'عطلة', mult: 0, bonus: 0, tone: 'mute', sys: true }];
  function wInit(s) { s.workers = s.workers || []; s.att = s.att || []; s.wl = s.wl || []; if (!s.stats) s.stats = JSON.parse(JSON.stringify(STATS)); }
  function attOn(s, date, w) { var r = null; (s.att || []).forEach(function (a) { if (a.date === date && a.w === w) r = a; }); return r; }
  function setAtt(s, date, w, st) {
    wInit(s); var wk = by(s.workers, w), sd = by(s.stats, st); if (!wk || !sd) throw new Error('عامل أو حالة غير معروفة');
    var cur = attOn(s, date, w); if (cur && cur.st === st) return cur;
    var a = { id: uid(s, 'a'), ts: Date.now(), date: date, w: w, st: st, d: cur ? cur.d : wk.daily, m: sd.mult, b: sd.bonus }; s.att.push(a); return a;
  }
  function attAmt(a) { return a ? r2(a.d * a.m + a.b) : 0; }
  function wEntry(s, o) { // kind: open | pay | add | deduct | viol
    wInit(s); if (o.kind !== 'open' && o.kind !== 'viol' && !(o.amt > 0)) throw new Error('اكتب مبلغًا أكبر من صفر');
    var e = { id: uid(s, 'w'), ts: Date.now(), date: o.date, w: o.w, kind: o.kind, amt: r2(o.amt || 0), note: o.note || '' }; s.wl.push(e); return e;
  }
  function wDue(s, w) {
    var days = {}; (s.att || []).forEach(function (a) { if (a.w === w) days[a.date] = a; });
    var t = 0; Object.keys(days).forEach(function (d) { t += attAmt(days[d]); }); return r2(t);
  }
  function wSum(s, w, kinds) { var t = 0; (s.wl || []).forEach(function (e) { if (e.w === w && kinds.indexOf(e.kind) >= 0) t += e.amt; }); return r2(t); }
  function wBalance(s, w) { return r2(wSum(s, w, ['open']) + wDue(s, w) + wSum(s, w, ['add']) - wSum(s, w, ['deduct', 'viol']) - wSum(s, w, ['pay'])); }
  function wDay(s, date) { // ملخص يوم
    var o = { present: 0, none: 0, total: 0, cost: 0 };
    (s.workers || []).forEach(function (w) { if (w.arch) return; o.total++; var a = attOn(s, date, w.id); if (!a) { o.none++; return; } if (a.st !== 'a' && a.st !== 'h') o.present++; o.cost += attAmt(a); });
    o.cost = r2(o.cost); return o;
  }

  /* الأصناف الناقصة (سالبة) في مخزن */
  function shortages(s) {
    var out = [];
    s.ledgers.forEach(function (l) { if (l.arch) return; var b = balances(s, l.id); Object.keys(b).forEach(function (k) { if (b[k] < 0) out.push({ led: l.id, item: k, q: b[k] }); }); });
    return out;
  }

  /* سجل صنف: كل حركاته (بما فيها المستوردة) من الأحدث */
  function history(s, item, led) {
    return s.moves.filter(function (m) { return m.item === item && (!led || m.led === led); }).sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : b.ts - a.ts; });
  }

  /* آخر استعمال وكمية أيام الاستعمال فقط (لا متوسطًا مضلِّلًا) */
  function usage(s, item, led) {
    var days = {};
    s.moves.forEach(function (m) { if (m.item === item && (!led || m.led === led) && (m.kind === 'batch' || m.kind === 'hist' || m.kind === 'issue')) days[m.date] = (days[m.date] || 0) - m.q; });
    var ds = Object.keys(days).filter(function (d) { return days[d] > 0.0005; }).sort();
    if (!ds.length) return null;
    var vals = ds.map(function (d) { return days[d]; });
    return { last: ds[ds.length - 1], lastQty: r3(days[ds[ds.length - 1]]), days: ds.length, typical: r3(vals.slice().sort(function (a, b) { return a - b; })[Math.floor(vals.length / 2)]) };
  }

  /* يكفي كم طبخة قادمة مخططة؟ plan: [{date, lines:[{item,qty}]}] مرتبة */
  function coverageDays(s, led, item, plan) {
    var have = 0, n = 0; [].concat(led).forEach(function (l) { have += Math.max(balance(s, l, item), 0); });
    for (var i = 0; i < plan.length; i++) {
      var need = 0; plan[i].lines.forEach(function (l) { if (l.item === item) need += l.qty; });
      if (need === 0) continue;
      if (have >= need) { have -= need; n++; } else return { days: n, short: r3(need - have), on: plan[i].date };
    }
    return { days: n, short: 0, on: null };
  }

  /* تسوية الوصفة لعدد القدور (إرشاد فقط) */
  /* كميات الوصفة لعدد قدور، مع ما يخص الخطة/الطبخة p: اختياري مفعّل (opts) وبديل مفعّل (alt) وصنف محذوف (del) وكمية معدّلة (over) وإضافات (extra). الثابت لا يُضرب بعدد القدور */
  function scaleRecipe(rec, pots, p) {
    p = p || {}; var out = [];
    rec.lines.forEach(function (l) {
      if (l.opt && !(p.opts && p.opts[l.item])) return;
      var id = l.item, per = l.per; if (l.alt && p.alt && p.alt[l.item]) { id = l.alt.item; per = l.alt.per; }
      if (p.del && p.del[id]) return;
      out.push({ item: id, qty: p.over && p.over[id] != null ? p.over[id] : r3(l.fixed ? per : per * pots) });
    });
    (p.extra || []).forEach(function (e) { out.push({ item: e.item, qty: p.over && p.over[e.item] != null ? p.over[e.item] : e.qty }); });
    return out;
  }

  return { r2: r2, r3: r3, isFree: isFree, by: by, newState: newState, balance: balance, balances: balances, addMove: addMove, setOpening: setOpening,
    receive: receive, planOrder: planOrder, splitQty: splitQty, wInit: wInit, attOn: attOn, setAtt: setAtt, wEntry: wEntry, wDue: wDue, wBalance: wBalance, wSum: wSum, wDay: wDay, attAmt: attAmt, STATS: STATS, recordBatch: recordBatch, editBatch: editBatch, setBatchDate: setBatchDate, voidBatch: voidBatch, batchNet: batchNet, shortages: shortages, history: history, usage: usage,
    coverageDays: coverageDays, scaleRecipe: scaleRecipe };
});
