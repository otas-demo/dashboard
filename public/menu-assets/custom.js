(function () {
  "use strict";
  var D = window.CUSTOM_DATA;
  var DIG = "၀၁၂၃၄၅၆၇၈၉";
  function $(id) { return document.getElementById(id); }
  function mm(v) { return String(v).replace(/[0-9]/g, function (d) { return DIG[+d]; }); }
  function priceOf(days) { return Math.round(days * D.rate / D.round) * D.round; }
  function itemPrice(it, withOpt) { if (withOpt && it.option) return it.option.price; return it.price != null ? it.price : priceOf(it.days); }
  function itemDays(it, withOpt) { return withOpt && it.option ? it.option.days : it.days; }
  function lakh(k) { return mm(Math.round(k / 10000) / 10); }
  function kyat(k) { return mm(Math.round(k).toLocaleString("en-US")); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var BASE = priceOf(D.base.days);
  var items = [], byId = {};
  D.cats.forEach(function (c) { c.items.forEach(function (it) { items.push(it); byId[it.id] = it; }); });
  var sel = {};   /* id -> qty */
  var opt = {};   /* id -> option chosen */

  /* ---------- menu ---------- */
  function itemHTML(it) {
    var priceHTML = it.quote
      ? '<span class="price quote">သီးသန့်တွက်</span>'
      : '<span class="price">' + lakh(itemPrice(it)) + '<small> သိန်း</small></span>';
    var h = '<div class="item" data-id="' + it.id + '">' +
      '<label class="item-main" for="it-' + it.id + '">' +
        '<input type="checkbox" id="it-' + it.id + '" data-id="' + it.id + '">' +
        '<span class="tick" aria-hidden="true"></span>' +
        '<span class="item-text">' +
          '<span class="item-name">' + esc(it.name) + (it.qty ? ' <span class="per">' + esc(it.qty.per) + '</span>' : '') + '</span>' +
          '<span class="item-desc">' + esc(it.desc) + '</span>' +
        '</span>' +
        '<span class="item-price">' + priceHTML + '</span>' +
      '</label>';
    if (it.qty) {
      h += '<div class="qty" data-qty="' + it.id + '" hidden>' +
        '<span>အရေအတွက်</span>' +
        '<button type="button" data-step="-1" aria-label="လျှော့">−</button>' +
        '<output id="q-' + it.id + '">' + mm(1) + '</output>' +
        '<button type="button" data-step="1" aria-label="တိုး">+</button></div>';
    }
    if (it.option) {
      h += '<div class="opt" data-opt="' + it.id + '" hidden><label for="op-' + it.id + '">' +
        '<input type="checkbox" id="op-' + it.id + '" data-opt-id="' + it.id + '">' +
        '<span class="opt-box" aria-hidden="true"></span>' +
        '<span>' + esc(it.option.label) + ' — စုစုပေါင်း <b>' + lakh(it.option.price) + ' သိန်း</b></span>' +
        '</label></div>';
    }
    var pts = (it.points || []).map(function (p) { return '<li>' + esc(p) + '</li>'; }).join("");
    h += '<details class="more"><summary>အသေးစိတ်</summary><div class="more-body">' +
      (pts ? '<ul>' + pts + '</ul>' : '') +
      (it.eg ? '<p class="eg"><b>ဥပမာ</b>' + esc(it.eg) + '</p>' : '') +
      (it.monthly ? '<p class="mnote">' + esc(it.monthly) + '</p>' : '') +
      (it.option && it.option.monthly ? '<p class="mnote">' + esc(it.option.short) + ' ရွေးရင် — ' + esc(it.option.monthly) + '</p>' : '') +
      '</div></details>';
    return h + '</div>';
  }

  function renderMenu() {
    $("menu").innerHTML = D.cats.map(function (c) {
      return '<section class="cat" aria-labelledby="c-' + c.id + '">' +
        '<div class="cat-head"><h3 id="c-' + c.id + '">' + esc(c.name) + '</h3><p>' + esc(c.blurb) + '</p></div>' +
        '<div class="items">' + c.items.map(itemHTML).join("") + '</div></section>';
    }).join("");
  }

  /* ---------- totals ---------- */
  function calc() {
    var total = BASE, days = 0, lines = [], quotes = [], monthly = [];
    items.forEach(function (it) {
      var q = sel[it.id]; if (!q) return;
      if (it.quote) { quotes.push(it); return; }
      var withOpt = !!opt[it.id];
      var p = itemPrice(it, withOpt) * q;
      total += p; days += itemDays(it, withOpt) * q;
      var name = it.name + (withOpt ? " (" + it.option.short + ")" : "") + (q > 1 ? " × " + mm(q) : "");
      lines.push({ name: name, amt: p });
      if (it.monthly) monthly.push(it.monthly);
      if (withOpt && it.option.monthly) monthly.push(it.option.monthly);
    });
    var weeks = D.weeksBase + Math.ceil(days / D.daysPerWeek);
    monthly = monthly.filter(function (m, i) { return monthly.indexOf(m) === i; });
    return { total: total, weeks: weeks, lines: lines, quotes: quotes, monthly: monthly, count: lines.length + quotes.length };
  }

  function today() {
    var d = new Date();
    return mm(("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear());
  }

  function renderReceipt() {
    var r = calc();
    var h = '<div class="rc-head"><span class="rc-brand">AUTO SHOP</span>' +
      '<span class="rc-sub">Custom POS ခန့်မှန်းဈေး</span><span class="rc-sub">' + today() + '</span></div>' +
      '<div class="rc-rule"></div>' +
      '<div class="rc-line b"><span>' + esc(D.base.name) + '</span><span class="rc-amt">' + kyat(BASE) + '</span></div>';
    if (!r.count) h += '<p class="rc-empty">Feature မရွေးရသေးပါ</p>';
    r.lines.forEach(function (l) {
      h += '<div class="rc-line"><span>' + esc(l.name) + '</span><span class="rc-amt">' + kyat(l.amt) + '</span></div>';
    });
    r.quotes.forEach(function (it) {
      h += '<div class="rc-line rc-q"><span>' + esc(it.name) + '</span><span class="rc-amt">သီးသန့်တွက်</span></div>';
    });
    h += '<div class="rc-rule double"></div>' +
      '<div class="rc-total"><span>စုစုပေါင်း</span><span><span class="big">' + lakh(r.total) + '</span> <small>သိန်း' + (r.quotes.length ? ' +' : '') + '</small></span></div>' +
      '<div class="rc-kyat">' + kyat(r.total) + ' ကျပ်</div>' +
      '<div class="rc-meta"><span>ခန့်မှန်း ကြာချိန်</span><span>~' + mm(r.weeks) + ' ပတ်</span></div>' +
      '<div class="rc-rule"></div><p class="rc-sec">ငွေပေးချေပုံ</p>';
    D.payment.forEach(function (p) {
      h += '<div class="rc-line"><span>' + esc(p[0]) + ' (' + mm(p[1]) + '%)</span><span class="rc-amt">' + kyat(Math.round(r.total * p[1] / 100)) + '</span></div>';
    });
    h += '<div class="rc-rule"></div><p class="rc-sec">လစဉ် သီးသန့်</p>' +
      '<p class="rc-note">Server ခ လစဉ် USD ၆ မှ စတင်</p>';
    r.monthly.forEach(function (m) { h += '<p class="rc-note">' + esc(m) + '</p>'; });
    if (r.quotes.length) h += '<p class="rc-note">“သီးသန့်တွက်” feature များကို quotation မှာ ထည့်တွက်ပါမယ်</p>';
    h += '<p class="rc-thanks">ခန့်မှန်းဈေးသာ ဖြစ်ပါတယ်။ ဆိုင်နဲ့ ညှိပြီးမှ quotation အတည်ပြုပါမယ်။</p>';
    $("receipt").innerHTML = h;
    $("tb-count").textContent = r.count ? "Feature " + mm(r.count) + " ခု ရွေးထား" : "အခြေခံစနစ်";
    $("tb-total").textContent = lakh(r.total) + " သိန်း" + (r.quotes.length ? " +" : "");
  }

  function sync(id) {
    var it = byId[id], on = !!sel[id];
    var box = document.querySelector('.item[data-id="' + id + '"]');
    box.classList.toggle("on", on);
    $("it-" + id).checked = on;
    var qrow = box.querySelector("[data-qty]");
    if (qrow) {
      qrow.hidden = !on;
      $("q-" + id).textContent = mm(sel[id] || 1);
      qrow.querySelector('[data-step="-1"]').disabled = (sel[id] || 1) <= 1;
      qrow.querySelector('[data-step="1"]').disabled = (sel[id] || 1) >= it.qty.max;
    }
    var orow = box.querySelector("[data-opt]");
    if (orow) { orow.hidden = !on; $("op-" + id).checked = !!opt[id]; }
  }

  function bind() {
    $("menu").addEventListener("change", function (e) {
      var t = e.target;
      if (t.dataset.id) { if (t.checked) sel[t.dataset.id] = 1; else { delete sel[t.dataset.id]; delete opt[t.dataset.id]; } sync(t.dataset.id); }
      else if (t.dataset.optId) { opt[t.dataset.optId] = t.checked; }
      renderReceipt();
    });
    $("menu").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-step]"); if (!b) return;
      var id = b.closest("[data-qty]").getAttribute("data-qty"), it = byId[id];
      var q = (sel[id] || 1) + Number(b.dataset.step);
      sel[id] = Math.max(1, Math.min(it.qty.max, q));
      sync(id); renderReceipt();
    });
    $("clear").addEventListener("click", function () {
      Object.keys(sel).forEach(function (id) { delete sel[id]; delete opt[id]; sync(id); });
      renderReceipt();
    });
    $("copy").addEventListener("click", copySummary);
    $("tb-go").addEventListener("click", function () {
      $("receipt").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (x) { $("totalbar").classList.toggle("away", x.isIntersecting); });
      });
      io.observe($("receipt"));
    }
  }

  function summaryText() {
    var r = calc();
    var out = ["Auto Shop — Custom POS ခန့်မှန်းဈေး (" + today() + ")", "", "• " + D.base.name + " — " + kyat(BASE) + " ကျပ်"];
    r.lines.forEach(function (l) { out.push("• " + l.name + " — " + kyat(l.amt) + " ကျပ်"); });
    r.quotes.forEach(function (it) { out.push("• " + it.name + " — သီးသန့်တွက်"); });
    out.push("", "စုစုပေါင်း — " + kyat(r.total) + " ကျပ် (" + lakh(r.total) + " သိန်း)" + (r.quotes.length ? " + သီးသန့်တွက်" : ""));
    out.push("ခန့်မှန်း ကြာချိန် — ~" + mm(r.weeks) + " ပတ်");
    D.payment.forEach(function (p) { out.push(p[0] + " (" + mm(p[1]) + "%) — " + kyat(Math.round(r.total * p[1] / 100)) + " ကျပ်"); });
    out.push("", "လစဉ် သီးသန့် — Server ခ USD ၆ မှ" + (r.monthly.length ? "၊ " + r.monthly.join("၊ ") : ""));
    return out.join("\n");
  }

  function copySummary() {
    var text = summaryText(), hint = $("copy-hint"), fb = $("copy-fallback"), btn = $("copy");
    function fallback() { hint.hidden = false; fb.hidden = false; fb.value = text; fb.focus(); fb.select(); }
    try {
      navigator.clipboard.writeText(text).then(function () {
        hint.hidden = true; fb.hidden = true;
        var old = btn.textContent; btn.textContent = "Copy ကူးပြီးပါပြီ";
        setTimeout(function () { btn.textContent = old; }, 1600);
      }, fallback);
    } catch (e) { fallback(); }
  }

  renderMenu();
  bind();
  renderReceipt();
})();
