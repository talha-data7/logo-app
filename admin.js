/* Logo Hive admin. Plain JavaScript, no libraries.
   It edits a COPY of config.js and custom.js in your browser, then lets you download the new files. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var NI = window.HIVE_NICHES || { groups: [], fams: [] };
  var GNAME = {}; NI.groups.forEach(function (g) { GNAME[g[0]] = g[1]; });
  var FGROUP = {}; NI.fams.forEach(function (f) { FGROUP[f[0]] = f[1]; });
  var BASE_CATS = NI.fams.map(function (f) { return [f[0], (GNAME[f[1]] || f[1]) + " \u203a " + f[2]]; });
  function groupOf(cat) { return FGROUP[cat] || cat; }
  function groupName(g) { return GNAME[g] || catName(g); }
  var DRAFT_KEY = "hive_admin_draft", CODES_KEY = "hive_admin_codes";

  var CFG0 = Object.assign({ APP_NAME: "Logo Hive", FREE_LOGOS: 2, PRICE: 50, LOGOS_PER_CODE: 3, PAYMENT_ENABLED: true, WATERMARK: true, SHOW_SUBTYPES: true, WATERMARK_OPACITY: 22, CURRENCY: "Rs.", WHATSAPP: "", PAY: [], CODES: [] }, window.CONFIG || {});
  var CUS0 = Object.assign({ designs: [], hidden: [], categories: [] }, window.CUSTOM || {});
  var LIVE = JSON.stringify({ K: CFG0, C: CUS0 });
  var K = clone(CFG0), C = clone(CUS0), plain = [], restored = false;
  try {
    var dr = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    if (dr && dr.K && dr.C && JSON.stringify(dr) !== LIVE) { K = Object.assign(clone(CFG0), dr.K); C = Object.assign(clone(CUS0), dr.C); restored = true; }
  } catch (e) { }
  try { plain = JSON.parse(localStorage.getItem(CODES_KEY) || "[]"); } catch (e) { plain = []; }
  if (!Array.isArray(plain)) plain = [];

  function isDirty() { return JSON.stringify({ K: K, C: C }) !== LIVE; }
  function touch() {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ K: K, C: C })); } catch (e) { }
    $("bar").hidden = !isDirty();
  }
  function savePlain() { try { localStorage.setItem(CODES_KEY, JSON.stringify(plain)); } catch (e) { } }

  /* ---------------- tabs ---------------- */
  function showTab(t) {
    [].forEach.call(document.querySelectorAll("#tabs .chip"), function (b) { b.classList.toggle("on", b.dataset.tab === t); });
    [].forEach.call(document.querySelectorAll(".panel"), function (p) { p.classList.toggle("on", p.id === "p-" + t); });
    if (t === "manage") renderManage(true);
    if (t === "add") renderMine();
    if (t === "types") renderTypes();
    if (t === "codes") renderCodes();
    if (t === "publish") renderPublish();
    window.scrollTo(0, 0);
  }
  $("tabs").addEventListener("click", function (e) { var b = e.target.closest(".chip"); if (b) showTab(b.dataset.tab); });
  $("barGo").addEventListener("click", function () { showTab("publish"); });

  /* ---------------- helpers for categories & designs ---------------- */
  function allCats() { return BASE_CATS.concat((C.categories || []).map(function (c) { return [c.id, c.en || c.id]; })); }
  function catName(id) { var f = allCats().filter(function (c) { return c[0] === id; })[0]; return f ? f[1] : id; }
  function allDesigns() { return (window.DESIGNS || []).concat(window.HIVE_LOGOS || [], C.designs || []); }
  function idTaken(id) { return allDesigns().some(function (d) { return d.id === id; }); }
  function newId(cat) {
    var n = 1; while (idTaken("my-" + cat + "-" + n)) n++;
    return "my-" + cat + "-" + n;
  }
  function partMarkup(p) {
    var a = '<path d="' + p.d + '" fill="' + (p.f && p.f !== "none" ? p.f : "none") + '" fill-rule="evenodd"';
    if (p.s) a += ' stroke="' + p.s + '" stroke-width="' + (p.w || 3) + '" stroke-linecap="round" stroke-linejoin="round"';
    if (p.tr) a += ' transform="' + p.tr + '"';
    return a + "/>";
  }
  function thumb(d) {
    return '<svg viewBox="' + d.vb.join(" ") + '" xmlns="http://www.w3.org/2000/svg">' + d.parts.map(partMarkup).join("") + "</svg>";
  }

  /* ============================== 1. SETTINGS ============================== */
  function waNormalize(v) {
    var s = String(v || "").replace(/[^0-9]/g, "");
    if (/^0\d{10}$/.test(s)) s = "92" + s.slice(1);
    return s;
  }
  function renderSettings() {
    $("s_name").value = K.APP_NAME; $("s_free").value = K.FREE_LOGOS; $("s_price").value = K.PRICE;
    $("s_cur").value = K.CURRENCY; $("s_per").value = K.LOGOS_PER_CODE; $("s_pay").checked = K.PAYMENT_ENABLED !== false; $("s_wm").checked = K.WATERMARK !== false; $("s_sub").checked = K.SHOW_SUBTYPES !== false; $("s_wmo").value = K.WATERMARK_OPACITY; $("s_wa").value = K.WHATSAPP;
    waHint(); renderPay();
  }
  function waHint() {
    var w = K.WHATSAPP, h = $("s_wahint");
    if (!w || /^9230\d{9}$/.test(w) === false && w.length < 10) { h.innerHTML = "Write it like 923001234567 (92 then your number without the first 0)."; return; }
    h.innerHTML = 'Test: <a href="https://wa.me/' + esc(w) + '" target="_blank" rel="noopener">open WhatsApp chat with +' + esc(w) + "</a>";
  }
  $("s_name").addEventListener("input", function () { K.APP_NAME = this.value.trim() || "Logo Hive"; touch(); });
  $("s_free").addEventListener("input", function () { var n = parseInt(this.value, 10); K.FREE_LOGOS = isNaN(n) ? 0 : Math.max(0, Math.min(50, n)); touch(); });
  $("s_price").addEventListener("input", function () { var n = parseInt(this.value, 10); K.PRICE = isNaN(n) ? 0 : Math.max(0, n); touch(); });
  $("s_per").addEventListener("input", function () { var n = parseInt(this.value, 10); K.LOGOS_PER_CODE = isNaN(n) ? 1 : Math.max(1, Math.min(50, n)); touch(); });
  $("s_pay").addEventListener("change", function () { K.PAYMENT_ENABLED = this.checked; touch(); });
  $("s_sub").addEventListener("change", function () { K.SHOW_SUBTYPES = this.checked; touch(); });
  $("s_wm").addEventListener("change", function () { K.WATERMARK = this.checked; touch(); });
  $("s_wmo").addEventListener("input", function () { var n = parseInt(this.value, 10); K.WATERMARK_OPACITY = isNaN(n) ? 30 : Math.max(5, Math.min(80, n)); touch(); });
  $("s_cur").addEventListener("input", function () { K.CURRENCY = this.value.trim(); touch(); });
  $("s_wa").addEventListener("input", function () { K.WHATSAPP = waNormalize(this.value); touch(); waHint(); });
  $("s_wa").addEventListener("blur", function () { this.value = K.WHATSAPP; });

  function renderPay() {
    var box = $("payList"); box.innerHTML = "";
    K.PAY.forEach(function (p, i) {
      var d = document.createElement("div"); d.className = "pay";
      d.innerHTML = '<input type="text" data-k="name" placeholder="Easypaisa" aria-label="Account type" value="' + esc(p.name) + '">' +
        '<input type="text" data-k="number" placeholder="03XX-XXXXXXX" aria-label="Number" value="' + esc(p.number) + '">' +
        '<input type="text" data-k="title" placeholder="Account holder name" aria-label="Account name" value="' + esc(p.title) + '">' +
        '<button class="b r" type="button" data-rm="' + i + '">Remove</button>';
      box.appendChild(d);
    });
    if (!K.PAY.length) box.innerHTML = '<p class="mini">No payment account yet. Add one so customers know where to pay.</p>';
  }
  $("payList").addEventListener("input", function (e) {
    var inp = e.target.closest("input[data-k]"); if (!inp) return;
    var idx = [].indexOf.call($("payList").children, inp.parentNode);
    if (K.PAY[idx]) { K.PAY[idx][inp.dataset.k] = inp.value; touch(); }
  });
  $("payList").addEventListener("click", function (e) {
    var b = e.target.closest("[data-rm]"); if (!b) return;
    K.PAY.splice(+b.dataset.rm, 1); touch(); renderPay();
  });
  $("payAdd").addEventListener("click", function () { K.PAY.push({ name: "", number: "", title: "" }); touch(); renderPay(); });

  /* ============================== 2. ADD LOGOS (SVG import) ============================== */
  var NS = "http://www.w3.org/2000/svg";
  function toHex(c) {
    if (!c) return null;
    c = String(c).trim();
    var m = c.match(/^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+%?))?\s*\)$/i);
    if (m) {
      var a = m[4] == null ? 1 : (/%$/.test(m[4]) ? parseFloat(m[4]) / 100 : parseFloat(m[4]));
      if (a < 0.05) return "none";
      return "#" + [m[1], m[2], m[3]].map(function (x) { return ("0" + Math.round(parseFloat(x)).toString(16)).slice(-2); }).join("");
    }
    if (/^#[0-9a-f]{6}$/i.test(c)) return c.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(c)) return "#" + c.slice(1).split("").map(function (x) { return x + x; }).join("").toLowerCase();
    if (c === "none" || c === "transparent") return "none";
    return null;
  }
  function num(v, d) { var n = parseFloat(v); return isNaN(n) ? (d || 0) : n; }
  function r2(n) { return Math.round(n * 100) / 100; }
  function shapeToPath(el) {
    var t = el.localName, g = function (a, d) { return num(el.getAttribute(a), d); };
    if (t === "path") return el.getAttribute("d") || "";
    if (t === "rect") {
      var x = g("x"), y = g("y"), w = g("width"), h = g("height"), rx = el.getAttribute("rx"), ry = el.getAttribute("ry");
      if (w <= 0 || h <= 0) return "";
      rx = rx == null ? null : num(rx); ry = ry == null ? null : num(ry);
      if (rx == null && ry == null) rx = ry = 0; else if (rx == null) rx = ry; else if (ry == null) ry = rx;
      rx = Math.min(rx, w / 2); ry = Math.min(ry, h / 2);
      if (!rx || !ry) return "M" + x + " " + y + "H" + (x + w) + "V" + (y + h) + "H" + x + "Z";
      return "M" + (x + rx) + " " + y + "H" + (x + w - rx) + "A" + rx + " " + ry + " 0 0 1 " + (x + w) + " " + (y + ry) + "V" + (y + h - ry) +
        "A" + rx + " " + ry + " 0 0 1 " + (x + w - rx) + " " + (y + h) + "H" + (x + rx) + "A" + rx + " " + ry + " 0 0 1 " + x + " " + (y + h - ry) +
        "V" + (y + ry) + "A" + rx + " " + ry + " 0 0 1 " + (x + rx) + " " + y + "Z";
    }
    if (t === "circle" || t === "ellipse") {
      var cx = g("cx"), cy = g("cy"), a = t === "circle" ? g("r") : g("rx"), b = t === "circle" ? a : g("ry");
      if (a <= 0 || b <= 0) return "";
      return "M" + (cx - a) + " " + cy + "A" + a + " " + b + " 0 1 0 " + (cx + a) + " " + cy + "A" + a + " " + b + " 0 1 0 " + (cx - a) + " " + cy + "Z";
    }
    if (t === "polygon" || t === "polyline") {
      var n = (el.getAttribute("points") || "").trim().split(/[\s,]+/).map(parseFloat).filter(function (v) { return !isNaN(v); });
      if (n.length < 4) return "";
      var s = "M" + n[0] + " " + n[1];
      for (var i = 2; i + 1 < n.length; i += 2) s += "L" + n[i] + " " + n[i + 1];
      return s + (t === "polygon" ? "Z" : "");
    }
    if (t === "line") return "M" + g("x1") + " " + g("y1") + "L" + g("x2") + " " + g("y2");
    return "";
  }
  function gradientColor(root, ref) {
    var m = String(ref).match(/#([^")\s]+)/); if (!m) return null;
    var gr = root.querySelector('[id="' + m[1] + '"]'); if (!gr) return null;
    for (var depth = 0; gr && depth < 4; depth++) {
      var st = gr.querySelector("stop");
      if (st) return toHex(getComputedStyle(st).stopColor);
      var href = gr.getAttribute("href") || gr.getAttribute("xlink:href");
      gr = href ? root.querySelector('[id="' + href.replace(/^#/, "") + '"]') : null;
    }
    return null;
  }

  /* Reads an SVG text and returns { parts, vb, warnings }. Throws Error with a plain message. */
  function parseSvg(text) {
    var doc = new DOMParser().parseFromString(text, "image/svg+xml");
    if (doc.querySelector("parsererror") || !doc.documentElement || doc.documentElement.localName !== "svg") throw new Error("This file is not a valid SVG.");
    var svg = document.importNode(doc.documentElement, true);
    [].forEach.call(svg.querySelectorAll("script,foreignObject,iframe,audio,video"), function (n) { n.remove(); });
    [].forEach.call(svg.querySelectorAll("*"), function (n) {
      [].slice.call(n.attributes).forEach(function (a) { if (/^on/i.test(a.name)) n.removeAttribute(a.name); });
    });
    var warnings = [];
    if (svg.querySelector("text")) warnings.push("This file contains live text, which is skipped. In Illustrator use Type > Create Outlines, then save again.");
    if (svg.querySelector("image")) warnings.push("This file contains a picture (JPG/PNG) inside the SVG. Pictures are skipped. Trace it to vectors first.");
    if (svg.querySelector("use")) warnings.push("This file uses linked copies (symbols). Those copies are skipped. In Illustrator, Object > Expand first.");
    if (svg.querySelector("[clip-path],[mask]")) warnings.push("Clipping masks are not supported, so some shapes may look different. In Illustrator, use Object > Clipping Mask > Release.");

    var vbAttr = (svg.getAttribute("viewBox") || "").trim().split(/[\s,]+/).map(parseFloat);
    var vw, vh;
    if (vbAttr.length === 4 && vbAttr[2] > 0 && vbAttr[3] > 0) { vw = vbAttr[2]; vh = vbAttr[3]; }
    else { vw = num(svg.getAttribute("width"), 1000); vh = num(svg.getAttribute("height"), 1000); if (vw <= 0) vw = 1000; if (vh <= 0) vh = 1000; svg.setAttribute("viewBox", "0 0 " + vw + " " + vh); }
    svg.setAttribute("width", 1000); svg.setAttribute("height", Math.max(10, Math.round(1000 * vh / vw)));
    svg.removeAttribute("style");

    var host = document.createElement("div");
    host.style.cssText = "position:fixed;left:-20000px;top:0;width:1000px;pointer-events:none";
    host.appendChild(svg); document.body.appendChild(host);
    var parts = [], opacityWarn = false, gradWarn = false, minX = 1e18, minY = 1e18, maxX = -1e18, maxY = -1e18;
    try {
      var rootInv = svg.getScreenCTM().inverse();
      var els = svg.querySelectorAll("path,rect,circle,ellipse,polygon,polyline,line");
      [].forEach.call(els, function (el) {
        if (el.closest("defs,clipPath,mask,symbol,pattern,marker,linearGradient,radialGradient,filter")) return;
        var cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") return;
        var d = shapeToPath(el); if (!d) return;
        var fill = cs.fill, stroke = cs.stroke, f, s;
        if (/^url\(/.test(fill)) { f = gradientColor(svg, fill); gradWarn = true; } else f = toHex(fill);
        if (/^url\(/.test(stroke)) { s = gradientColor(svg, stroke); gradWarn = true; } else s = toHex(stroke);
        var fo = parseFloat(cs.fillOpacity), so = parseFloat(cs.strokeOpacity), op = parseFloat(cs.opacity);
        if (!isNaN(fo) && fo < 0.05 || !isNaN(op) && op < 0.05) f = "none";
        if (!isNaN(so) && so < 0.05 || !isNaN(op) && op < 0.05) s = "none";
        if (fo < 1 || so < 1 || op < 1) opacityWarn = true;
        var sw = parseFloat(cs.strokeWidth);
        if (!f) f = "none";
        if (!s || s === "none" || !(sw > 0)) s = null;
        if (f === "none" && !s) return;
        var m = rootInv.multiply(el.getScreenCTM());
        var part = { d: d, f: f };
        if (s) { part.s = s; part.w = r2(sw); }
        if (Math.abs(m.a - 1) > 1e-6 || Math.abs(m.b) > 1e-6 || Math.abs(m.c) > 1e-6 || Math.abs(m.d - 1) > 1e-6 || Math.abs(m.e) > 1e-4 || Math.abs(m.f) > 1e-4)
          part.tr = "matrix(" + [m.a, m.b, m.c, m.d, m.e, m.f].map(function (v) { return Math.round(v * 1e6) / 1e6; }).join(" ") + ")";
        var bb; try { bb = el.getBBox(); } catch (e) { return; }
        var sc = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1, pad = s ? (sw * sc) / 2 : 0;
        var xs = [], ys = [];
        [[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x, bb.y + bb.height], [bb.x + bb.width, bb.y + bb.height]].forEach(function (q) {
          xs.push(m.a * q[0] + m.c * q[1] + m.e); ys.push(m.b * q[0] + m.d * q[1] + m.f);
        });
        part._b = [Math.min.apply(null, xs) - pad, Math.min.apply(null, ys) - pad, Math.max.apply(null, xs) + pad, Math.max.apply(null, ys) + pad];
        parts.push(part);
      });
    } finally { host.remove(); }
    if (!parts.length) throw new Error("No shapes were found in this file. (Text and pictures cannot be used.)");
    if (opacityWarn) warnings.push("Transparency is ignored; shapes are drawn fully solid.");
    if (gradWarn) warnings.push("Gradients are replaced by their first color.");

    parts.forEach(function (p) { minX = Math.min(minX, p._b[0]); minY = Math.min(minY, p._b[1]); maxX = Math.max(maxX, p._b[2]); maxY = Math.max(maxY, p._b[3]); });
    var UW = maxX - minX, UH = maxY - minY;
    /* remove a white background rectangle that covers everything */
    if (parts.length > 1) {
      var keep = parts.filter(function (p) {
        var white = p.f === "#ffffff" && !p.s, w = p._b[2] - p._b[0], h = p._b[3] - p._b[1];
        return !(white && w >= UW * 0.97 && h >= UH * 0.97);
      });
      if (keep.length && keep.length < parts.length) { warnings.push("A white background shape was removed automatically."); parts = keep; minX = minY = 1e18; maxX = maxY = -1e18; parts.forEach(function (p) { minX = Math.min(minX, p._b[0]); minY = Math.min(minY, p._b[1]); maxX = Math.max(maxX, p._b[2]); maxY = Math.max(maxY, p._b[3]); }); UW = maxX - minX; UH = maxY - minY; }
    }
    if (!(UW > 0) || !(UH > 0)) throw new Error("The drawing has no size. Please check the file.");
    var pd = Math.max(UW, UH) * 0.1;
    var vb = [r2(minX - pd), r2(minY - pd), r2(UW + 2 * pd), r2(UH + 2 * pd)];
    var size = 0; parts.forEach(function (p) { delete p._b; size += p.d.length; });
    if (size > 400000) warnings.push("This logo is very detailed and may be slow on old phones. In Illustrator try Object > Path > Simplify.");
    var cols = {}; parts.forEach(function (p) { if (p.f && p.f !== "none") cols[p.f] = 1; if (p.s) cols[p.s] = 1; });
    if (Object.keys(cols).length > 10) warnings.push("It has " + Object.keys(cols).length + " different colors. That works, but customers will find fewer colors easier to change.");
    return { parts: parts, vb: vb, warnings: warnings };
  }

  var queue = [], qid = 0;
  function queueFile(name, text) {
    var it = { id: ++qid, name: name, cat: $("addCat") ? $("addCat").value : "general", off: {}, err: null, parts: [], vb: null, warnings: [] };
    try { var r = parseSvg(text); it.parts = r.parts; it.vb = r.vb; it.warnings = r.warnings; }
    catch (e) { it.err = e.message || "Could not read this file."; }
    queue.push(it);
  }
  function renderQueue() {
    var box = $("queue"); box.innerHTML = "";
    var cats = allCats().map(function (c) { return '<option value="' + esc(c[0]) + '">' + esc(c[1]) + "</option>"; }).join("");
    queue.forEach(function (it) {
      var d = document.createElement("div"); d.className = "qcard"; d.dataset.q = it.id;
      if (it.err) {
        d.style.gridTemplateColumns = "1fr";
        d.innerHTML = '<div><b>' + esc(it.name) + '</b><div class="errl">' + esc(it.err) + '</div><button class="b g" data-act="skip" type="button">Remove from list</button></div>';
      } else {
        var kept = it.parts.filter(function (p, i) { return !it.off[i]; }).length;
        d.innerHTML = '<div class="qprev"><svg viewBox="' + it.vb.join(" ") + '">' +
          it.parts.map(function (p, i) { return partMarkup(p).replace("<path ", '<path data-i="' + i + '"' + (it.off[i] ? ' class="x" ' : " ")); }).join("") + '</svg></div>' +
          '<div><b>' + esc(it.name) + '</b> <span class="mini">' + kept + " of " + it.parts.length + ' pieces kept</span>' +
          '<p class="mini" style="margin:4px 0 8px">Tap a piece in the picture to remove it (tap again to bring it back).</p>' +
          it.warnings.map(function (w) { return '<div class="warnl">' + esc(w) + "</div>"; }).join("") +
          '<label class="f" style="margin-top:8px">Business type</label><select data-act="cat">' + cats + '</select>' +
          '<div class="row" style="margin-top:10px"><button class="b" data-act="add" type="button">Add this logo</button><button class="b g" data-act="skip" type="button">Skip</button></div></div>';
        d.querySelector("select").value = it.cat;
      }
      box.appendChild(d);
    });
    var good = queue.filter(function (q) { return !q.err; }).length;
    $("queueBtns").hidden = !queue.length;
    $("addAll").hidden = good < 2; $("addAll").textContent = "Add all " + good + " to my logos";
  }
  function commit(it) {
    var parts = it.parts.filter(function (p, i) { return !it.off[i]; });
    if (!parts.length) return false;
    C.designs.push({ id: newId(it.cat), cat: it.cat, vb: it.vb, src: "custom", parts: parts });
    return true;
  }
  $("queue").addEventListener("click", function (e) {
    var card = e.target.closest(".qcard"); if (!card) return;
    var it = queue.filter(function (q) { return q.id === +card.dataset.q; })[0]; if (!it) return;
    var path = e.target.closest("path[data-i]");
    if (path) { var i = +path.dataset.i; if (it.off[i]) delete it.off[i]; else it.off[i] = 1; renderQueue(); return; }
    var act = e.target.closest("[data-act]"); if (!act) return;
    if (act.dataset.act === "skip") { queue = queue.filter(function (q) { return q !== it; }); renderQueue(); }
    if (act.dataset.act === "add") {
      if (!commit(it)) { alert("Every piece is removed. Bring back at least one piece."); return; }
      queue = queue.filter(function (q) { return q !== it; }); touch(); renderQueue(); renderMine();
    }
  });
  $("queue").addEventListener("change", function (e) {
    var sel = e.target.closest("select[data-act=cat]"); if (!sel) return;
    var card = sel.closest(".qcard");
    queue.forEach(function (q) { if (q.id === +card.dataset.q) q.cat = sel.value; });
  });
  $("addAll").addEventListener("click", function () {
    queue = queue.filter(function (q) { if (q.err) return true; return !commit(q); });
    touch(); renderQueue(); renderMine();
  });
  $("clearQ").addEventListener("click", function () { queue = []; renderQueue(); });

  function readFiles(list) {
    var arr = [].slice.call(list || []).filter(function (f) { return /\.svg$/i.test(f.name) || f.type === "image/svg+xml"; });
    if (!arr.length) { alert("Please choose .svg files."); return; }
    var left = arr.length;
    arr.forEach(function (f) {
      var r = new FileReader();
      r.onload = function () { queueFile(f.name.replace(/\.svg$/i, ""), String(r.result)); if (--left === 0) renderQueue(); };
      r.onerror = function () { queue.push({ id: ++qid, name: f.name, err: "Could not open this file." }); if (--left === 0) renderQueue(); };
      r.readAsText(f);
    });
  }
  var drop = $("drop");
  drop.addEventListener("click", function () { $("files").click(); });
  drop.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("files").click(); } });
  $("files").addEventListener("change", function () { readFiles(this.files); this.value = ""; });
  ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
  ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
  drop.addEventListener("drop", function (e) { readFiles(e.dataTransfer.files); });
  $("pasteGo").addEventListener("click", function () {
    var t = $("paste").value.trim(); if (!t) return;
    queueFile("pasted-logo", t); $("paste").value = ""; renderQueue();
  });

  function renderMine() {
    var box = $("mine"); $("mineCount").textContent = C.designs.length ? "(" + C.designs.length + ")" : "";
    if (!C.designs.length) { box.innerHTML = '<p class="mini" style="grid-column:1/-1">You have not added any logo yet.</p>'; return; }
    box.innerHTML = C.designs.map(function (d) {
      return '<div class="mt"><div class="mth">' + thumb(d) + '</div><div class="mtf"><span class="mid">' + esc(catName(d.cat).split(" \u203a ").pop()) + " · " + esc(d.id) + '</span><button class="b r" type="button" data-del="' + esc(d.id) + '">Delete</button></div></div>';
    }).join("");
  }
  $("mine").addEventListener("click", function (e) {
    var b = e.target.closest("[data-del]"); if (!b) return;
    if (!confirm("Delete this logo from your website?")) return;
    C.designs = C.designs.filter(function (d) { return d.id !== b.dataset.del; }); touch(); renderMine();
  });
  /* the category chosen for new files */
  (function () {
    var wrap = document.createElement("div"); wrap.style.cssText = "margin:12px 0 0";
    wrap.innerHTML = '<label class="f" for="addCat">Put new logos in this business type <small>(you can change it for each logo below)</small></label><select id="addCat" style="max-width:320px"></select>';
    $("drop").parentNode.insertBefore(wrap, $("drop"));
  })();
  function fillAddCat() {
    var sel = $("addCat"), v = sel.value;
    sel.innerHTML = allCats().map(function (c) { return '<option value="' + esc(c[0]) + '">' + esc(c[1]) + "</option>"; }).join("");
    if (v) sel.value = v;
  }

  /* ============================== 3. SHOW / HIDE ============================== */
  var mgCat = "all", mgShown = 60;
  function renderManage(reset) {
    if (reset) mgShown = 60;
    var all = allDesigns(), counts = {};
    all.forEach(function (d) { var g = groupOf(d.cat); counts[g] = (counts[g] || 0) + 1; });
    var chips = '<button class="chip' + (mgCat === "all" ? " on" : "") + '" data-c="all" type="button">All (' + all.length + ")</button>";
    NI.groups.map(function (g) { return [g[0], g[1]]; }).concat((C.categories || []).map(function (c) { return [c.id, c.en || c.id]; })).forEach(function (c) { if (counts[c[0]]) chips += '<button class="chip' + (mgCat === c[0] ? " on" : "") + '" data-c="' + esc(c[0]) + '" type="button">' + esc(c[1]) + " (" + counts[c[0]] + ")</button>"; });
    $("mgCats").innerHTML = chips;
    var list = all.filter(function (d) { return mgCat === "all" || groupOf(d.cat) === mgCat; });
    var hidden = C.hidden, mine = C.designs.map(function (d) { return d.id; });
    $("mgGrid").innerHTML = list.slice(0, mgShown).map(function (d) {
      var off = hidden.indexOf(d.id) >= 0, isMine = mine.indexOf(d.id) >= 0;
      return '<div class="mt' + (off ? " off" : "") + '">' + (isMine ? '<span class="badge">YOURS</span>' : "") + '<div class="mth">' + thumb(d) + '</div><div class="mtf"><span class="mid">' + esc(catName(d.cat).split(" \u203a ").pop()) + " · " + esc(d.id) + '</span><button class="b g" type="button" data-vis="' + esc(d.id) + '">' + (off ? "Show again" : "Hide") + "</button>" + (isMine ? '<button class="b r" type="button" data-del="' + esc(d.id) + '">Delete</button>' : "") + "</div></div>";
    }).join("");
    $("mgMore").hidden = list.length <= mgShown;
  }
  $("mgCats").addEventListener("click", function (e) { var b = e.target.closest("[data-c]"); if (!b) return; mgCat = b.dataset.c; renderManage(true); });
  $("mgMore").addEventListener("click", function () { mgShown += 60; renderManage(false); });
  $("mgGrid").addEventListener("click", function (e) {
    var v = e.target.closest("[data-vis]");
    if (v) { var id = v.dataset.vis, i = C.hidden.indexOf(id); if (i >= 0) C.hidden.splice(i, 1); else C.hidden.push(id); touch(); renderManage(false); return; }
    var d = e.target.closest("[data-del]");
    if (d && confirm("Delete this logo from your website?")) { C.designs = C.designs.filter(function (x) { return x.id !== d.dataset.del; }); C.hidden = C.hidden.filter(function (x) { return x !== d.dataset.del; }); touch(); renderManage(false); }
  });

  /* ============================== 4. BUSINESS TYPES ============================== */
  function slug(s) { return String(s).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24); }
  function renderTypes() {
    var box = $("t_list");
    if (!C.categories.length) { box.innerHTML = '<p class="mini">You have not added any business type yet.</p>'; return; }
    var counts = {}; allDesigns().forEach(function (d) { counts[d.cat] = (counts[d.cat] || 0) + 1; });
    box.innerHTML = C.categories.map(function (c) {
      return '<div class="row" style="padding:8px 0;border-bottom:1px solid var(--line)"><b>' + esc(c.en) + '</b> <span class="ur">' + esc(c.ur || "") + '</span><span class="mini">' + (counts[c.id] || 0) + ' logos</span><span style="flex:1"></span><button class="b r" type="button" data-rmt="' + esc(c.id) + '">Delete</button></div>';
    }).join("");
  }
  $("t_add").addEventListener("click", function () {
    var en = $("t_en").value.trim(), ur = $("t_ur").value.trim(), m = $("t_msg");
    if (!en) { m.textContent = "Please write the English name."; return; }
    var id = slug(en) || "type";
    var taken = function (x) { return BASE_CATS.concat(C.categories.map(function (c) { return [c.id]; })).some(function (c) { return c[0] === x; }); };
    var base = id, n = 2; while (taken(id)) id = base + "-" + n++;
    C.categories.push({ id: id, en: en, ur: ur });
    $("t_en").value = ""; $("t_ur").value = ""; m.textContent = "Added. Now add logos to it from tab 2.";
    touch(); renderTypes(); fillAddCat();
  });
  $("t_list").addEventListener("click", function (e) {
    var b = e.target.closest("[data-rmt]"); if (!b) return;
    var id = b.dataset.rmt;
    if (allDesigns().some(function (d) { return d.cat === id; })) { alert("This type still has logos. Delete or move those logos first (tab 3)."); return; }
    C.categories = C.categories.filter(function (c) { return c.id !== id; }); touch(); renderTypes(); fillAddCat();
  });

  /* ============================== 5. UNLOCK CODES ============================== */
  function renderCodes() {
    var tb = $("c_tbl").querySelector("tbody");
    var unsent = plain.filter(function (p) { return !p.sent; }).length;
    $("c_stat").textContent = "Codes active on your website: " + K.CODES.length + ". Codes in this list not yet sent: " + unsent + ".";
    if (!plain.length) { tb.innerHTML = '<tr><td colspan="4" class="mini">No codes yet. Press "Make codes".</td></tr>'; return; }
    tb.innerHTML = plain.map(function (p, i) {
      return '<tr><td class="' + (p.sent ? "sold" : "") + '"><code>' + esc(p.code) + '</code></td>' +
        '<td><input type="text" data-note="' + i + '" value="' + esc(p.note || "") + '" placeholder="name / number" style="padding:6px 8px;font-size:.85rem"></td>' +
        '<td><input type="checkbox" data-sent="' + i + '"' + (p.sent ? " checked" : "") + ' style="width:18px;height:18px;accent-color:var(--green)"></td>' +
        '<td style="white-space:nowrap"><button class="b g" type="button" data-copy="' + i + '" style="padding:5px 10px;font-size:.78rem">Copy message</button> <button class="b r" type="button" data-cx="' + i + '" style="padding:5px 10px;font-size:.78rem">Cancel</button></td></tr>';
    }).join("");
  }
  $("c_gen").addEventListener("click", function () {
    var n = Math.max(1, Math.min(100, parseInt($("c_n").value, 10) || 1));
    for (var i = 0; i < n; i++) {
      var core = HiveCodes.newCode(), pretty = HiveCodes.pretty(core), h = HiveCodes.hash(pretty);
      if (K.CODES.indexOf(h) >= 0) { i--; continue; }
      K.CODES.push(h); plain.unshift({ code: pretty, hash: h, note: "", sent: false });
    }
    savePlain(); touch(); renderCodes();
  });
  $("c_tbl").addEventListener("input", function (e) {
    var t = e.target.closest("[data-note]"); if (t) { plain[+t.dataset.note].note = t.value; savePlain(); }
  });
  $("c_tbl").addEventListener("change", function (e) {
    var t = e.target.closest("[data-sent]"); if (t) { plain[+t.dataset.sent].sent = t.checked; savePlain(); renderCodes(); }
  });
  function copyText(txt, btn) {
    var done = function () { if (btn) { var o = btn.textContent; btn.textContent = "Copied!"; setTimeout(function () { btn.textContent = o; }, 1200); } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { prompt("Copy this:", txt); });
    else prompt("Copy this:", txt);
  }
  $("c_tbl").addEventListener("click", function (e) {
    var c = e.target.closest("[data-copy]");
    if (c) {
      var p = plain[+c.dataset.copy];
      copyText("Thank you for your payment! Your " + K.APP_NAME + " code is:\n" + p.code + "\nOpen " + K.APP_NAME + ", press Download Logo, and paste this code. It gives you " + (K.LOGOS_PER_CODE || 1) + " logo download" + ((K.LOGOS_PER_CODE || 1) > 1 ? "s" : "") + ".", c);
      return;
    }
    var x = e.target.closest("[data-cx]");
    if (x && confirm("Cancel this code? It stops working after you publish.")) {
      var q = plain[+x.dataset.cx]; K.CODES = K.CODES.filter(function (h) { return h !== q.hash; }); plain.splice(+x.dataset.cx, 1); savePlain(); touch(); renderCodes();
    }
  });
  $("c_dl").addEventListener("click", function () {
    if (!plain.length) { alert("There are no codes yet."); return; }
    var t = "LOGO HIVE UNLOCK CODES (keep private)\n\n" + plain.map(function (p) { return p.code + (p.sent ? "  [sent]" : "") + (p.note ? "  " + p.note : ""); }).join("\n") + "\n";
    saveFile("logo-hive-codes.txt", t, "text/plain");
  });
  $("c_chkgo").addEventListener("click", function () {
    var v = $("c_chk").value, m = $("c_chkmsg");
    if (HiveCodes.normalize(v).length !== 12) { m.textContent = "Write the full code."; return; }
    var inLive = JSON.parse(JSON.stringify(CFG0.CODES)).indexOf(HiveCodes.hash(v)) >= 0, inDraft = K.CODES.indexOf(HiveCodes.hash(v)) >= 0;
    m.textContent = inLive ? "Valid on your live website." : inDraft ? "Valid, but not published yet (go to Publish)." : "This code is not in your list.";
  });

  /* ============================== 6. PUBLISH ============================== */
  function saveFile(name, text, type) {
    var a = document.createElement("a"), url = URL.createObjectURL(new Blob([text], { type: type || "text/javascript" }));
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
  }
  function configText() {
    return "/* ===== LOGO HIVE SETTINGS =====\n   Made by admin.html. Upload this file to GitHub to replace the old config.js.\n   You can also edit it by hand in Notepad. */\nwindow.CONFIG = " + JSON.stringify(K, null, 2) + ";\n";
  }
  function customText() {
    var o = { designs: C.designs, hidden: C.hidden, categories: C.categories };
    var body = "{\n  \"designs\": [\n" + o.designs.map(function (d) { return "    " + JSON.stringify(d); }).join(",\n") + "\n  ],\n  \"hidden\": " + JSON.stringify(o.hidden) + ",\n  \"categories\": " + JSON.stringify(o.categories) + "\n}";
    return "/* ===== YOUR OWN LOGOS & CHANGES (made by admin.html) =====\n   designs    : logos you added\n   hidden     : ids of built-in logos you switched off\n   categories : extra business types you created */\nwindow.CUSTOM = " + body + ";\n";
  }
  function renderPublish() {
    var li = [], cfgChanged = JSON.stringify(K) !== JSON.stringify(CFG0), cusChanged = JSON.stringify(C) !== JSON.stringify(CUS0);
    li.push("Settings: " + (cfgChanged ? "<b>changed</b> (upload config.js)" : "no change"));
    li.push("Your own logos: " + C.designs.length + " (" + (C.designs.length - CUS0.designs.length >= 0 ? "+" : "") + (C.designs.length - CUS0.designs.length) + " compared with your website now)");
    li.push("Hidden built-in logos: " + C.hidden.length);
    li.push("Your business types: " + C.categories.length);
    li.push("Unlock codes active: " + K.CODES.length + " (" + (K.CODES.length - CFG0.CODES.length >= 0 ? "+" : "") + (K.CODES.length - CFG0.CODES.length) + " new)");
    li.push(cfgChanged || cusChanged ? "Upload: " + [cfgChanged ? "<b>config.js</b>" : "", cusChanged ? "<b>custom.js</b>" : ""].filter(Boolean).join(" and ") : "Nothing to upload. Your website already has all of this.");
    $("sum").innerHTML = li.map(function (x) { return "<li>" + x + "</li>"; }).join("");
  }
  $("dlCfg").addEventListener("click", function () { saveFile("config.js", configText()); });
  $("dlCus").addEventListener("click", function () { saveFile("custom.js", customText()); });
  $("dlBoth").addEventListener("click", function () { saveFile("config.js", configText()); setTimeout(function () { saveFile("custom.js", customText()); }, 400); });
  function copyText(t, btn) {
    var done = function (ok) { $("cpMsg").textContent = ok ? "Copied. Now paste it into the file on GitHub." : "Copy failed. Use the download button instead."; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { done(true); }, function () { done(false); });
    else { var ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); var ok = false; try { ok = document.execCommand("copy"); } catch (e) { } ta.remove(); done(ok); }
  }
  $("cpCfg").addEventListener("click", function () { copyText(configText()); });
  $("cpCus").addEventListener("click", function () { copyText(customText()); });
  $("reset").addEventListener("click", function () {
    if (!confirm("Throw away all changes that are not on your website yet?")) return;
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) { }
    K = clone(CFG0); C = clone(CUS0); touch(); renderSettings(); renderMine(); renderPublish(); $("restoreMsg").hidden = true;
  });
  $("discard").addEventListener("click", function () { $("reset").click(); });

  /* ---------------- start ---------------- */
  K.PAY = K.PAY || []; K.CODES = K.CODES || []; C.designs = C.designs || []; C.hidden = C.hidden || []; C.categories = C.categories || [];
  fillAddCat(); renderSettings(); renderMine(); touch();
  if (restored) $("restoreMsg").hidden = false;
  window.__admin = { parseSvg: parseSvg, K: function () { return K; }, C: function () { return C; }, configText: configText, customText: customText, plain: function () { return plain; } };
})();
