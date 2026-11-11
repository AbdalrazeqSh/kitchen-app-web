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
    end: o.end || '', endSub: o.endSub || '', endSub2: o.endSub2 || '', hasEnd: !!(o.end || o.endSub), hasEndSub: !!o.endSub, hasEndSub2: !!o.endSub2, subFs: o.endEq ? '15px' : '12px', subFg: o.endEq ? (o.endTone ? T[o.endTone][1] : '#1B2421') : '#5B6660', subFw: o.endEq ? 500 : 400,
    hasCols: !!o.c1, c0: o.c0 || '', c1: o.c1 || '', c1s: o.c1s || '', c2: o.c2 || '', c2s: o.c2s || '', c2Fg: o.c2Tone ? T[o.c2Tone][1] : '#1B2421',
    endFg: o.endTone ? T[o.endTone][1] : '#1B2421',
    icon: o.icon || 'i-dot', hasIcon: !!o.icon, icBg: ic[0], icFg: ic[1],
    chev: !!o.chev, hasGo: !!o.go, cur: o.go ? 'pointer' : 'default', go: o.go || noop, lp: o.lp ? function (e) { if (e && e.preventDefault) e.preventDefault(); o.lp(); } : noop, isBtn: !o.step, isStep: !!o.step, ph: !!o.ph,
    minus: o.minus || noop, plus: o.plus || noop, edit: o.edit || noop, val: o.val == null ? '' : String(o.val), unit: o.unit || '',
    warn: o.warn || '', hasWarn: !!o.warn, hasHintGo: !!o.hintGo, hintTxt: o.hintTxt || '', hintGo: o.hintGo || noop, hasX: !!o.x, xGo: o.x ? function (e) { if (e && e.stopPropagation) e.stopPropagation(); o.x(); } : noop,
    abg: on ? (SOL[o.selTone] || SOL.ok) : (tn ? tn[0] : '#E9ECE7'), afg: on ? '#FFFFFF' : (tn ? tn[1] : '#1B2421'),
    rbg: o.rbg || (o.sel ? '#EAF5EE' : '#FFFFFF'), sel: !!o.sel,
    label: o.label || '', value: o.value == null ? '' : String(o.value),
    on: on, count: o.count == null ? '' : String(o.count), hasCount: o.count != null,
    segBg: on ? '#FFFFFF' : 'transparent', segFg: on ? '#14563A' : '#46504B', segSh: on ? '0 1px 3px rgba(0,0,0,.14)' : 'none',
    bg: on ? (SOL[o.selTone] || SOL.ok) : (tn ? tn[0] : '#FFFFFF'), fg: on ? '#FFFFFF' : (tn ? tn[1] : '#1B2421'),
    bd: on ? (SOL[o.selTone] || SOL.ok) : (tn ? tn[1] : 'rgba(27,36,33,.22)')
  };
}
function B(t, o) {
  o = o || {};
  var tn = T[o.tone] || T.info, pick = t === 'pick', unfilled = o.filled === false;
  return {
    isKpi: t === 'kpi', isSeg: t === 'seg', isChips: t === 'chips', isRows: t === 'rows', isGrid: t === 'grid', isNote: t === 'note',
    isPaper: t === 'paper', pap: o.pap || { org: '', title: '', date: '', sub: '', lead: '', hasLead: false, hasTiles: false, tiles: [], secs: [], notes: [], foot: '' },
    isMonth: t === 'month', mon: o.mon || { title: '', prev: noop, next: noop, head: [], cells: [] },
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
function render() {
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
  root.innerHTML = out;
  [].forEach.call(root.querySelectorAll('[style*="overflow-y:auto"]'), function (e, i) { if (scr[i] != null) e.scrollTop = scr[i]; });
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
    clearTimeout(typTimer); typTimer = setTimeout(render, 250);
  });
}
try { var st = document.createElement('style'); st.textContent = '.fw{position:relative}.fw .ci{display:none}.fw:focus-within .ci{display:flex}.ff.co .ci{color:#14563A}.fw:has(.ci) input{padding-left:46px!important}.ff .cs{display:none;gap:0!important;justify-content:space-around;background:#F3F4F1;border-radius:12px}.ff.co .cs{display:flex}.ff .cs button{flex:1;min-width:0!important;min-height:42px!important;padding:0!important;border:0!important;background:transparent!important;border-radius:0!important;font-size:20px!important;font-weight:400!important;color:#3E4843!important}.ff .cs button:last-child{color:#14563A!important;font-weight:600!important}'; document.head.appendChild(st); } catch (e) {}
var UI = window.UI = { T: T, X: X, B: B, mount: mount, render: render, noop: noop, onError: null };
})();
