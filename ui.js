/* طبقة الواجهة: تعرض قوالب التصميم المعتمد كما هي (design/m1-m3) ببيانات التطبيق الحقيقية.
   لا أنماط هنا: كل الأنماط داخل القوالب نفسها. */
(function () {
'use strict';
var T = { ok: ['#DFF1E7', '#14563A'], warn: ['#FFF1D6', '#6B3F00'], bad: ['#FDE7E4', '#8E1B10'], info: ['#E6EBFA', '#243C8F'], mute: ['#ECEEEA', '#46504B'] };
var SOL = { ok: '#14563A', bad: '#B3261E', warn: '#8A5A00', info: '#243C8F' }; /* لون الزر الأساسي/المحدّد حسب وظيفته: أخضر الهوية افتراضيًا، أحمر للصرف، إلخ */
var noop = function () {};

/* ---- عنصر عام وكتلة (نفس مفاتيح التصميم) ---- */
function X(o) {
  var tg = T[o.tagTone] || T.mute, ic = T[o.icTone] || T.mute, tn = T[o.tone], on = !!o.on;
  return {
    title: o.title || '', sub: o.sub || '', hasSub: !!o.sub,
    tag: o.tag || '', hasTag: !!o.tag, tagBg: tg[0], tagFg: tg[1],
    end: o.end || '', endSub: o.endSub || '', endSub2: o.endSub2 || '', hasEnd: !!(o.end || o.endSub), hasEndSub: !!o.endSub, hasEndSub2: !!o.endSub2, endCap: o.endCap || '', hasEndCap: !!o.endCap, end2: o.end2 || '', end2Sub: o.end2Sub || '', hasEnd2Sub: !!o.end2Sub, end2Cap: o.end2Cap || '', hasEnd2: !!o.end2, end2Fg: o.hdr ? '#14563A' : o.end2Tone === 'bad' ? '#B3261E' : '#1B2421', minH: o.hdr || o.mini || o.ent || o.tight ? '0' : '58px', pad: o.hdr ? '7px 14px' : o.ent ? (o.entLast ? '3px 14px 12px' : '3px 14px') : o.tight ? '12px 14px 3px' : o.mini ? '6px 14px' : '10px 14px', mt: o.ent ? '-1px' : '0', tAl: o.ent ? 'left' : 'right', tFg: o.hdr ? '#14563A' : o.total ? '#14563A' : o.subt ? '#5A4A1E' : o.ent ? '#5B6660' : '#1B2421', tFs: o.hdr ? '12px' : o.ent ? '13px' : o.mini ? '13.5px' : '15px', tFw: o.hdr ? 600 : o.total ? 700 : o.subt ? 600 : o.ent ? 400 : o.mini ? 400 : 500, sFs: o.mini ? '11.5px' : '12.5px', eFs: o.hdr ? '12px' : o.mini ? '13.5px' : '15px', eFw: o.hdr ? 600 : o.mini ? 400 : 500, eW: o.colw ? o.colw + 'px' : 'auto', eW2: o.colw ? (o.colw + 13) + 'px' : 'auto', chevOp: o.hdr ? 0 : 1, subFs: o.endEq ? '15px' : '12px', subFg: o.endEq ? (o.endTone ? T[o.endTone][1] : '#1B2421') : '#5B6660', subFw: o.endEq ? 500 : 400,
    hasCols: !!o.c1, c0: o.c0 || '', c1: o.c1 || '', c1s: o.c1s || '', c2: o.c2 || '', c2s: o.c2s || '', c2Fg: o.c2Tone ? T[o.c2Tone][1] : '#1B2421',
    endFg: o.hdr ? '#14563A' : o.endTone ? T[o.endTone][1] : '#1B2421',
    icon: o.icon || 'i-dot', hasIcon: !!o.icon, icBg: ic[0], icFg: ic[1],
    chev: !!o.chev, hasGo: !!o.go, cur: o.go ? 'pointer' : 'default', go: o.go || noop, lp: o.lp ? function (e) { if (e && e.preventDefault) e.preventDefault(); o.lp(); } : noop, isBtn: !o.step, isStep: !!o.step, ph: !!o.ph,
    minus: o.minus || noop, plus: o.plus || noop, edit: o.edit || noop, val: o.val == null ? '' : String(o.val), unit: o.unit || '',
    sub2: o.sub2 || '', hasSub2: !!o.sub2, badge: o.badge || '', hasBadge: !!o.badge, warn: o.warn || '', hasWarn: !!o.warn, hasHintGo: !!o.hintGo, hintTxt: o.hintTxt || '', hintGo: o.hintGo || noop, hasUndo: !!o.undo, undoGo: o.undo ? function (e) { if (e && e.stopPropagation) e.stopPropagation(); o.undo(); } : noop, opc: o.dim ? '.5' : '1', hasX: !!o.x, xGo: o.x ? function (e) { if (e && e.stopPropagation) e.stopPropagation(); o.x(); } : noop,
    abg: on ? (SOL[o.selTone] || SOL.ok) : (tn ? tn[0] : '#E9ECE7'), afg: on ? '#FFFFFF' : (tn ? tn[1] : '#1B2421'),
    rbg: o.hdr ? '#EAF1EC' : o.total ? '#D5E8DC' : o.subt ? '#F6EFDD' : o.rbg || (o.sel ? '#EAF5EE' : '#FFFFFF'), rbt: o.total ? '2px solid #14563A' : o.subt ? '1px solid #E2D6B4' : '0 solid transparent', sel: !!o.sel,
    label: o.label || '', value: o.value == null ? '' : String(o.value),
    on: on, count: o.count == null ? '' : String(o.count), hasCount: o.count != null,
    segBg: on ? '#FFFFFF' : 'transparent', segFg: on ? '#14563A' : '#46504B', segSh: on ? '0 1px 3px rgba(0,0,0,.14)' : 'none',
    bg: on ? (SOL[o.selTone] || SOL.ok) : (tn ? tn[0] : '#FFFFFF'), fg: on ? '#FFFFFF' : (tn ? tn[1] : '#1B2421'),
    bd: on ? (SOL[o.selTone] || SOL.ok) : (tn ? tn[1] : 'rgba(27,36,33,.22)')
  };
}
/* قاعدة عامة لكل قائمة صفوف في التطبيق: لا تُعرض أكثر من ROW_CAP صفًا؛ الباقي خلف «عرض N أخرى». تُطبَّق هنا مرة واحدة فتشمل كل الشاشات الحالية والقادمة. الاستثناء الصريح: all:true. */
var ROW_CAP = 5, rowsOpen = {};
function capRows(o) {
  var it = o.items || [];
  if (o.all || it.length <= ROW_CAP + 1) return o;
  var k = (o.title || '') + '|' + it.length, open = !!rowsOpen[k], n = it.length - ROW_CAP, c = Object.assign({}, o);
  c.items = (open ? it : it.slice(0, ROW_CAP)).concat([X({ icon: open ? 'i-minus' : 'i-chevD', icTone: 'mute', title: open ? 'طيّ القائمة' : 'عرض ' + n + ' أخرى', go: function () { rowsOpen[k] = !open; UI.render(); } })]);
  return c;
}
function B(t, o) {
  o = o || {};
  if (t === 'rows') o = capRows(o);
  var tn = T[o.tone] || T.info, pick = t === 'pick', unfilled = o.filled === false;
  return {
    isKpi: t === 'kpi', isSeg: t === 'seg', isChips: t === 'chips', isRows: t === 'rows', isGrid: t === 'grid', isNote: t === 'note',
    isPaper: t === 'paper', pap: o.pap || { org: '', title: '', date: '', sub: '', lead: '', hasLead: false, hasTiles: false, tiles: [], secs: [], notes: [], foot: '' },
    isMonth: t === 'month', isWeek: t === 'week', wk: o.wk || { title: '', prev: noop, next: noop, days: [], rows: [], legend: [] }, mon: o.mon || { title: '', prev: noop, next: noop, head: [], cells: [] },
    isBig: t === 'big', isBtns: t === 'btns', isActs: t === 'acts', isPre: t === 'pre', isPick: pick, isStepper: t === 'stepper', isInput: t === 'input',
    items: o.items || [],
    hasSort: !!o.sort, sortLabel: o.sort ? o.sort.label : '', sortRot: o.sort && o.sort.asc ? 'rotate(180deg)' : 'none', sortGo: o.sort ? o.sort.go : noop,
    title: o.title || '', hasTitle: !!o.title, actLabel: o.act || '', hasAct: !!o.act, actGo: o.actGo || noop,
    emptyText: o.empty || '', hasEmpty: !!o.empty && !(o.items && o.items.length),
    text: o.text || '', label: o.label || '', value: o.value == null ? '' : String(o.value), value2: o.value2 == null ? '' : String(o.value2), hasV2: o.value2 != null && o.value2 !== '',
    bg: tn[0], fg: pick ? (unfilled ? '#5B6660' : '#1B2421') : tn[1], icon: o.icon || 'i-alert',
    go: o.go || noop, minus: o.minus || noop, plus: o.plus || noop, edit: o.edit || noop, onInput: o.onInput || noop, ph: o.ph || '', mode: o.mode || 'text',
    bd: unfilled ? 'rgba(27,36,33,.35)' : 'rgba(27,36,33,.12)'
  };
}

/* ---- محرك القوالب (sc-if / sc-for / {{مسار}}) ---- */
var tplRoot = null, handlers = [];
function parseTpl() {
  if (tplRoot) return;
  var t = document.createElement('template'); t.innerHTML = window.UI_TPL; tplRoot = t.content;
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escA(s) { return esc(s).replace(/"/g, '&quot;'); }
function look(scope, path) {
  var p = path.trim().split('.'), v = scope;
  for (var i = 0; i < p.length; i++) { if (v == null) return undefined; v = v[p[i]]; }
  return v;
}
function interp(str, scope) {
  return str.replace(/\{\{([^}]+)\}\}/g, function (_, e) { var v = look(scope, e); return v == null ? '' : String(v); });
}
var VOID = { input: 1, br: 1, hr: 1, img: 1 };
function walk(node, scope) {
  var out = '', c;
  if (node.nodeType === 3) return esc(interp(node.nodeValue, scope));
  if (node.nodeType !== 1) return '';
  var tag = node.localName;
  if (tag === 'sc-if') {
    var m = /^\{\{([^}]+)\}\}$/.exec(node.getAttribute('value') || ''), v = m ? look(scope, m[1]) : false;
    if (v) for (c = node.firstChild; c; c = c.nextSibling) out += walk(c, scope);
    return out;
  }
  if (tag === 'sc-for') {
    var lm = /^\{\{([^}]+)\}\}$/.exec(node.getAttribute('list') || ''), list = lm ? look(scope, lm[1]) : [], as = node.getAttribute('as');
    (list || []).forEach(function (it) {
      var s2 = Object.create(scope); s2[as] = it;
      for (c = node.firstChild; c; c = c.nextSibling) out += walk(c, s2);
    });
    return out;
  }
  var attrs = '';
  for (var i = 0; i < node.attributes.length; i++) {
    var a = node.attributes[i], n = a.name, val = a.value;
    if (n.indexOf('hint-placeholder') === 0) continue;
    if (n === 'oncontextmenu') { /* ضغطة مطوّلة: تُربط فقط للصفوف التي لها إجراءات */
      var mc = /^\{\{([^}]+)\}\}$/.exec(val), fc = mc ? look(scope, mc[1]) : null;
      if (typeof fc === 'function' && fc !== noop) { handlers.push(fc); attrs += ' data-hc="' + (handlers.length - 1) + '"'; }
      continue;
    }
    if (n === 'onkeydown' || n === 'onmousedown') {
      var mk = /^\{\{([^}]+)\}\}$/.exec(val), fk = mk ? look(scope, mk[1]) : null;
      if (typeof fk === 'function' && fk !== noop) { handlers.push(fk); attrs += ' data-' + (n === 'onkeydown' ? 'hk' : 'hm') + '="' + (handlers.length - 1) + '"'; }
      continue;
    }
    if (n === 'onclick' || n === 'oninput') {
      var mm = /^\{\{([^}]+)\}\}$/.exec(val), fn = mm ? look(scope, mm[1]) : null;
      if (typeof fn === 'function') { handlers.push(fn); attrs += ' data-' + (n === 'onclick' ? 'h' : 'hi') + '="' + (handlers.length - 1) + '"'; }
      continue;
    }
    attrs += ' ' + n + '="' + escA(interp(val, scope)) + '"';
  }
  if (VOID[tag]) return '<' + tag + attrs + '>';
  for (c = node.firstChild; c; c = c.nextSibling) out += walk(c, scope);
  return '<' + tag + attrs + '>' + out + '</' + tag + '>';
}

/* ---- العرض مع حفظ التركيز والتمرير ---- */
var restoring = false, root = null, getProps = null, lastPK = null, lastSK = null, typing = false, typTimer = 0, calcKey = null;
/* تحديث الشاشة في مكانها أثناء الكتابة: نُبقي عناصر الصفحة الحية (فلا يضيع التركيز ولا تنقطع كتابة لوحة المفاتيح) ونُحدّث الفروق فقط */
function morphKids(a, b) {
  var ac = a.childNodes, bc = b.childNodes, i;
  for (i = 0; i < bc.length; i++) {
    var x = ac[i], y = bc[i];
    if (!x) { a.appendChild(y.cloneNode(true)); continue; }
    if (x.nodeType !== y.nodeType || x.nodeName !== y.nodeName) { a.replaceChild(y.cloneNode(true), x); continue; }
    if (x.nodeType === 3) { if (x.nodeValue !== y.nodeValue) x.nodeValue = y.nodeValue; continue; }
    if (x.nodeType !== 1) continue;
    var j, at;
    for (j = 0; j < y.attributes.length; j++) { at = y.attributes[j]; if (x.getAttribute(at.name) !== at.value) x.setAttribute(at.name, at.value); }
    for (j = x.attributes.length - 1; j >= 0; j--) { at = x.attributes[j]; if (!y.hasAttribute(at.name)) x.removeAttribute(at.name); }
    if (x.tagName === 'INPUT' || x.tagName === 'TEXTAREA') { if (x !== document.activeElement && x.value !== y.value) x.value = y.value; if (x.type === 'checkbox' || x.type === 'radio') x.checked = y.checked; continue; }
    morphKids(x, y);
  }
  while (ac.length > bc.length) a.removeChild(a.lastChild);
}
function fitAll() { [].forEach.call(root.querySelectorAll('textarea.gr'), function (t) { t.style.height = 'auto'; t.style.height = (t.scrollHeight + 2) + 'px'; }); }
function render(mode) {
  if (!root) return;
  if (typing) return; /* أثناء الكتابة لا نعيد رسم الشاشة مع كل حرف (يُبطئ الكتابة ويُفلت الأحرف): تُرسم بعد توقف قصير */
  parseTpl(); handlers = [];
  var props = getProps(), ae = document.activeElement, keep = ae && ae.getAttribute && ae.getAttribute('data-hi'), pos = null;
  if (keep != null) { try { pos = [ae.selectionStart, ae.selectionEnd]; if (pos[0] === ae.value.length && pos[1] === pos[0]) pos = 'end'; } catch (e) {} }
  var scr = [].map.call(root.querySelectorAll('[style*="overflow-y:auto"]'), function (e) { return e.scrollTop; });
  /* تمرير الصفحة يُصفَّر عند تغيّر الصفحة، وتمرير النافذة عند تغيّر النافذة */
  var pk = props.pageKey, sk = props.shKey;
  if (pk !== lastPK) { scr[0] = 0; } if (sk !== lastSK) { for (var si = 1; si < scr.length; si++) scr[si] = 0; if (props.shOn === false) scr.length = Math.min(scr.length, 1); }
  lastPK = pk; lastSK = sk;
  var out = '';
  for (var c = tplRoot.firstChild; c; c = c.nextSibling) out += walk(c, props);
  if (mode === 'morph' && root.firstChild) { var tmp = document.createElement('div'); tmp.innerHTML = out; morphKids(root, tmp); } else root.innerHTML = out;
  [].forEach.call(root.querySelectorAll('[style*="overflow-y:auto"]'), function (e, i) { if (scr[i] != null) e.scrollTop = scr[i]; });
  fitAll();
  if (calcKey != null) { var ce = root.querySelector('[data-hi="' + calcKey + '"]'); if (ce && ce.closest('.ff')) ce.closest('.ff').classList.add('co'); else calcKey = null; }
  if (keep != null) { var el = root.querySelector('[data-hi="' + keep + '"]'); if (el) { restoring = true; el.focus(); restoring = false; try { if (pos === 'end') el.setSelectionRange(el.value.length, el.value.length); else if (pos) el.setSelectionRange(pos[0], pos[1]); } catch (e) {} } }
}
/* كل معالج نقر/إدخال داخل غلاف آمن: الخطأ يُسجَّل ويُعرض بدل أن يضيع بصمت */
function guard(f, a) { try { f(a); } catch (er) { if (UI.onError) UI.onError(er); else throw er; } }
function mount(el, props) {
  root = el; getProps = props;
  /* لمس أي خانة كتابة يحدّد كل محتواها، فالكتابة تستبدل القيمة بدل أن تُضاف إليها */
  root.addEventListener('focusin', function (e) {
    var t = e.target; if (restoring || !t || !t.tagName) return;
    if (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA') return;
    var ty = (t.type || '').toLowerCase(); if (ty === 'checkbox' || ty === 'radio' || ty === 'date' || ty === 'file' || ty === 'range') return;
    var go = function () { try { if (document.activeElement === t) t.select(); } catch (er) {} };
    go(); setTimeout(go, 0); setTimeout(go, 60);
  });

  /* سحب لإعادة الترتيب: مقبض [data-dg] داخل صف .ff[data-did]؛ الصفوف المتجاورة بالمعرّف نفسه تتحرك معًا، وعند الإفلات يُستدعى window.__reorder(ids) */
  root.addEventListener('pointerdown', function (e) {
    var h = e.target && e.target.closest && e.target.closest('[data-dg]'); if (!h) return;
    var row = h.closest('.ff'), did = row && row.getAttribute('data-did'), par = row && row.parentNode; if (!did) return;
    var all = Array.prototype.filter.call(par.children, function (c) { return c.hasAttribute && c.hasAttribute('data-did'); }), ids = [];
    all.forEach(function (c) { var d = c.getAttribute('data-did'); if (ids.indexOf(d) < 0) ids.push(d); });
    var grp = function (d) { return all.filter(function (c) { return c.getAttribute('data-did') === d; }); }, mine = grp(did), startY = e.clientY, moved = false, orig = ids.join(',');
    e.preventDefault(); try { h.setPointerCapture(e.pointerId); } catch (er) {}
    mine.forEach(function (c) { c.style.position = 'relative'; c.style.zIndex = '5'; c.style.background = '#F3F7F4'; c.style.boxShadow = '0 6px 18px rgba(0,0,0,.18)'; c.style.borderRadius = '12px'; });
    var natTop = function () { mine.forEach(function (c) { c.style.transform = ''; }); return mine[0].getBoundingClientRect().top; };
    var mv = function (ev) {
      var dy = ev.clientY - startY; mine.forEach(function (c) { c.style.transform = 'translateY(' + dy + 'px)'; });
      var r0 = mine[0].getBoundingClientRect(), r1 = mine[mine.length - 1].getBoundingClientRect(), cy = (r0.top + r1.bottom) / 2;
      for (var k = 0; k < ids.length; k++) {
        var d = ids[k]; if (d === did) continue; var g = grp(d), t = g[0].getBoundingClientRect().top, b = g[g.length - 1].getBoundingClientRect().bottom;
        if (cy > t && cy < b) {
          var mi = ids.indexOf(did), before = natTop(), ref = k < mi ? g[0] : g[g.length - 1].nextSibling;
          mine.forEach(function (c) { par.insertBefore(c, ref); }); ids.splice(mi, 1); ids.splice(ids.indexOf(d) + (k < mi ? 0 : 1), 0, did);
          startY += natTop() - before; moved = true; mine.forEach(function (c) { c.style.transform = 'translateY(' + (ev.clientY - startY) + 'px)'; }); break;
        }
      }
    };
    var up = function () {
      h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up);
      mine.forEach(function (c) { c.style.transform = ''; c.style.position = ''; c.style.zIndex = ''; c.style.background = ''; c.style.boxShadow = ''; c.style.borderRadius = ''; });
      if (ids.join(',') !== orig && window.__reorder) window.__reorder(ids);
    };
    h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
  });
  root.addEventListener('mousedown', function (e) { if (e.target && e.target.closest && e.target.closest('[data-ci]')) e.preventDefault(); });
  root.addEventListener('click', function (e) {
    var ci = e.target && e.target.closest && e.target.closest('[data-ci]');
    if (ci) { var fw = ci.closest('.ff'), inp = fw.querySelector('input'), key = inp && inp.getAttribute('data-hi'); if (key != null) { calcKey = calcKey === key ? null : key; fw.classList.toggle('co', calcKey === key); if (document.activeElement !== inp) { restoring = true; inp.focus(); restoring = false; } } return; }
  });
  root.addEventListener('focusout', function (e) { var t = e.target; if (calcKey != null && t && t.getAttribute && t.getAttribute('data-hi') === calcKey) setTimeout(function () { var ae = document.activeElement; if (!(ae && ae.getAttribute && ae.getAttribute('data-hi') === calcKey) && !(ae && ae.closest && ae.closest('.cs'))) { calcKey = null; [].forEach.call(root.querySelectorAll('.ff.co'), function (f) { f.classList.remove('co'); }); } }, 150); });
  root.addEventListener('click', function (e) {
    var t = e.target.closest('[data-h]'); if (!t) return;
    var f = handlers[+t.getAttribute('data-h')]; if (f) guard(f, e);
  });
  root.addEventListener('contextmenu', function (e) {
    var t = e.target.closest('[data-hc]'); if (!t) return;
    var f = handlers[+t.getAttribute('data-hc')]; if (f) guard(f, e);
  });
  root.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('gr')) e.preventDefault(); /* خانة نص من سطر منطقي واحد: الإدخال لا يكسر السطر */
    if (e.key !== 'Enter') return; var t = e.target.closest('[data-hk]'); if (!t) return;
    var f = handlers[+t.getAttribute('data-hk')]; if (f) { e.preventDefault(); guard(f, e); }
  });
  root.addEventListener('mousedown', function (e) {
    var t = e.target.closest('[data-hm]'); if (t) e.preventDefault(); /* يبقي التركيز في الخانة فلا تُغلق لوحة المفاتيح */
  });
  root.addEventListener('input', function (e) {
    var t = e.target.closest('[data-hi]'); if (!t) return;
    var f = handlers[+t.getAttribute('data-hi')]; if (!f) return;
    typing = true; try { guard(f, t.value); } finally { typing = false; }
    if (t.classList && t.classList.contains('gr')) { t.style.height = 'auto'; t.style.height = (t.scrollHeight + 2) + 'px'; }
    clearTimeout(typTimer); typTimer = setTimeout(function () { render('morph'); }, 250);
  });
}
try { var st = document.createElement('style'); st.textContent = '.fw{position:relative}.fw .ci{display:none}.fw:focus-within .ci{display:flex}.ff.co .ci{color:#14563A}.fw:has(.ci) input{padding-left:46px!important}.ff .cs{display:none;gap:0!important;justify-content:space-around;background:#F3F4F1;border-radius:12px}.ff.co .cs{display:flex}.ff .cs button{flex:1;min-width:0!important;min-height:42px!important;padding:0!important;border:0!important;background:transparent!important;border-radius:0!important;font-size:20px!important;font-weight:400!important;color:#3E4843!important}.ff .cs button:last-child{color:#14563A!important;font-weight:600!important}'; document.head.appendChild(st); } catch (e) {}
var UI = window.UI = { T: T, X: X, B: B, mount: mount, render: render, noop: noop, onError: null };
})();
