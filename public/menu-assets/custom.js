(function () {
  "use strict";
  var D = window.CUSTOM_DATA;
  var DIG = "၀၁၂၃၄၅၆၇၈၉";
  var TAB = { sales: "အရောင်း", online: "Online", stock: "Stock", branch: "ဆိုင်ခွဲ · ဝန်ထမ်း", report: "Report", print: "Voucher", advanced: "အဆင့်မြင့်" };
  function $(id) { return document.getElementById(id); }
  function mm(v) { return String(v).replace(/[0-9]/g, function (d) { return DIG[+d]; }); }
  function priceOf(days) { return Math.round(days * D.rate / D.round) * D.round; }
  function itemPrice(it, withOpt) { if (withOpt && it.option) return it.option.price; return it.price != null ? it.price : priceOf(it.days); }
  function itemDays(it, withOpt) { return withOpt && it.option ? it.option.days : it.days; }
  function lakh(k) { return mm(Math.round(k / 10000) / 10); }
  function kyat(k) { return mm(Math.round(k).toLocaleString("en-US")); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var BASE = priceOf(D.base.days);
  var items = [], byId = {}, catOf = {};
  D.cats.forEach(function (c) { c.items.forEach(function (it) { items.push(it); byId[it.id] = it; catOf[it.id] = c.id; }); });
  var sel = {};   /* id -> qty */
  var opt = {};   /* id -> option chosen */
  var active = D.cats[0].id;

  /* ---------- tabs + items ---------- */
  function itemHTML(it) {
    var price = it.quote
      ? '<span class="item-price quote">သီးသန့်တွက်</span>'
      : '<span class="item-price">' + lakh(itemPrice(it)) + '<small>သိန်း</small></span>';
    var h = '<div class="item" data-id="' + it.id + '">' +
      '<label class="item-main" for="it-' + it.id + '">' +
        '<input type="checkbox" id="it-' + it.id + '" data-id="' + it.id + '">' +
        '<span class="tick" aria-hidden="true"></span>' +
        '<span class="item-text">' +
          '<span class="item-name">' + esc(it.name) + (it.qty ? ' <span class="per">' + esc(it.qty.per) + '</span>' : '') + '</span>' +
          '<span class="item-desc">' + esc(it.desc) + '</span>' +
        '</span>' + price +
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
        '<span>' + esc(it.option.label) + ' — <b>' + lakh(it.option.price) + ' သိန်း</b></span>' +
        '</label></div>';
    }
    return h + moreHTML(it) + '</div>';
  }

  function li(arr) { return (arr || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join(""); }
  function moreHTML(it) {
    var notes = [];
    if (it.note) notes.push(it.note);
    if (it.monthly) notes.push("လစဉ် — " + it.monthly);
    if (it.option && it.option.monthly) notes.push(it.option.short + " ရွေးရင် — " + it.option.monthly);
    return '<div class="more-wrap">' +
      '<button type="button" class="more-btn" aria-expanded="false" aria-controls="more-' + it.id + '" data-more="' + it.id + '">' +
        '<span>ဘာလုပ်ပေးလဲ · ဘယ်သူ့အတွက်လဲ</span>' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>' +
      '</button>' +
      '<div class="more" id="more-' + it.id + '" hidden>' +
        '<div class="more-grid">' +
          '<div class="more-sec"><h4 class="more-h">ဘာတွေ လုပ်ပေးလဲ</h4><ul class="does">' + li(it.points) + '</ul></div>' +
          '<div class="more-sec"><h4 class="more-h">ဘယ်လိုဆိုင်တွေအတွက်</h4><div class="fit-chips">' +
            (it.fit || []).map(function (x) { return '<span>' + esc(x) + '</span>'; }).join("") + '</div>' +
            (it.when && it.when.length ? '<h4 class="more-h">ဒီလို ဖြစ်နေရင် လိုပါတယ်</h4><ul class="when">' + li(it.when) + '</ul>' : '') +
          '</div>' +
        '</div>' +
        (it.eg ? '<p class="eg"><b>ဥပမာ</b><span>' + esc(it.eg) + '</span></p>' : '') +
        notes.map(function (n) { return '<p class="mnote">' + esc(n) + '</p>'; }).join("") +
      '</div></div>';
  }

  function render() {
    $("tabs").innerHTML = D.cats.map(function (c) {
      var on = c.id === active;
      return '<button type="button" class="cat-tab" role="tab" id="tab-' + c.id + '" aria-controls="panel-' + c.id + '" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '" data-cat="' + c.id + '">' +
        esc(TAB[c.id] || c.name) + '<span class="cnt" data-cnt="' + c.id + '" hidden></span></button>';
    }).join("");
    $("menu").removeAttribute("role");
    $("menu").innerHTML = D.cats.map(function (c) {
      return '<div class="items" role="tabpanel" id="panel-' + c.id + '" aria-labelledby="tab-' + c.id + '"' + (c.id === active ? '' : ' hidden') + '>' +
        c.items.map(itemHTML).join("") + '</div>';
    }).join("");
  }

  function show(id, focus) {
    active = id;
    D.cats.forEach(function (c) {
      var on = c.id === id, t = $("tab-" + c.id);
      t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1;
      $("panel-" + c.id).hidden = !on;
      if (on && focus) t.focus();
      if (on) t.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }

  function counts() {
    D.cats.forEach(function (c) {
      var n = c.items.filter(function (it) { return sel[it.id]; }).length, b = document.querySelector('[data-cnt="' + c.id + '"]');
      b.hidden = !n; b.textContent = mm(n);
    });
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
      '<span class="rc-sub">Custom POS ခန့်မှန်းဈေး · ' + today() + '</span></div>' +
      '<div class="rc-rule"></div>' +
      '<div class="rc-line b"><span>အခြေခံ Custom POS</span><span class="rc-amt">' + kyat(BASE) + '</span></div>';
    if (!r.count) h += '<p class="rc-empty">ဘယ်ဘက်က feature ကို ရွေးပါ</p>';
    r.lines.forEach(function (l) {
      h += '<div class="rc-line"><span>' + esc(l.name) + '</span><span class="rc-amt">' + kyat(l.amt) + '</span></div>';
    });
    r.quotes.forEach(function (it) {
      h += '<div class="rc-line rc-q"><span>' + esc(it.name) + '</span><span class="rc-amt">သီးသန့်တွက်</span></div>';
    });
    h += '<div class="rc-rule double"></div>' +
      '<div class="rc-total"><span>စုစုပေါင်း</span><span><span class="big">' + lakh(r.total) + '</span> <small>သိန်း' + (r.quotes.length ? ' +' : '') + '</small></span></div>' +
      '<div class="rc-kyat">' + kyat(r.total) + ' ကျပ်</div>' +
      '<div class="rc-rule"></div>' +
      '<div class="rc-meta"><span>ကြာချိန်</span><span>~' + mm(r.weeks) + ' ပတ်</span></div>';
    D.payment.forEach(function (p, i) {
      h += '<div class="rc-meta"><span>' + (i ? 'အပ်နှံချိန်' : 'စတင်ချိန်') + ' ' + mm(p[1]) + '%</span><span>' + kyat(Math.round(r.total * p[1] / 100)) + '</span></div>';
    });
    if (r.monthly.length) {
      h += '<div class="rc-rule"></div><p class="rc-sec">လစဉ် ထပ်ကုန်မယ့်ခ</p>';
      r.monthly.forEach(function (m) { h += '<p class="rc-note">' + esc(m) + '</p>'; });
    }
    if (r.quotes.length) h += '<p class="rc-note">“သီးသန့်တွက်” ကို quotation မှာ ထည့်တွက်ပါမယ်</p>';
    $("receipt").innerHTML = h;
    $("tb-count").textContent = r.count ? "Feature " + mm(r.count) + " ခု" : "အခြေခံစနစ်";
    $("tb-total").textContent = lakh(r.total) + " သိန်း" + (r.quotes.length ? " +" : "");
    counts();
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
    $("tabs").addEventListener("click", function (e) {
      var t = e.target.closest("[data-cat]"); if (t) show(t.dataset.cat, false);
    });
    $("tabs").addEventListener("keydown", function (e) {
      var i = D.cats.findIndex(function (c) { return c.id === active; }), n = D.cats.length, j = -1;
      if (e.key === "ArrowRight") j = (i + 1) % n; else if (e.key === "ArrowLeft") j = (i - 1 + n) % n;
      else if (e.key === "Home") j = 0; else if (e.key === "End") j = n - 1;
      if (j < 0) return; e.preventDefault(); show(D.cats[j].id, true);
    });
    $("menu").addEventListener("change", function (e) {
      var t = e.target;
      if (t.dataset.id) { if (t.checked) sel[t.dataset.id] = 1; else { delete sel[t.dataset.id]; delete opt[t.dataset.id]; } sync(t.dataset.id); }
      else if (t.dataset.optId) { opt[t.dataset.optId] = t.checked; }
      renderReceipt();
    });
    $("menu").addEventListener("click", function (e) {
      var m = e.target.closest("button[data-more]");
      if (m) {
        var open = m.getAttribute("aria-expanded") !== "true";
        m.setAttribute("aria-expanded", open);
        $("more-" + m.dataset.more).hidden = !open;
        return;
      }
      var b = e.target.closest("button[data-step]"); if (!b) return;
      var id = b.closest("[data-qty]").getAttribute("data-qty"), it = byId[id];
      sel[id] = Math.max(1, Math.min(it.qty.max, (sel[id] || 1) + Number(b.dataset.step)));
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
    var out = ["Auto Shop — Custom POS ခန့်မှန်းဈေး (" + today() + ")", "", "• အခြေခံ Custom POS — " + kyat(BASE) + " ကျပ်"];
    r.lines.forEach(function (l) { out.push("• " + l.name + " — " + kyat(l.amt) + " ကျပ်"); });
    r.quotes.forEach(function (it) { out.push("• " + it.name + " — သီးသန့်တွက်"); });
    out.push("", "စုစုပေါင်း — " + kyat(r.total) + " ကျပ် (" + lakh(r.total) + " သိန်း)" + (r.quotes.length ? " + သီးသန့်တွက်" : ""));
    out.push("ကြာချိန် — ~" + mm(r.weeks) + " ပတ်");
    D.payment.forEach(function (p) { out.push(p[0] + " (" + mm(p[1]) + "%) — " + kyat(Math.round(r.total * p[1] / 100)) + " ကျပ်"); });
    out.push("", "ဈေးထဲ မပါ — Server ခ (လစဉ် USD ၆ မှ)" + (r.monthly.length ? "၊ " + r.monthly.join("၊ ") : ""));
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

  render();
  bind();
  renderReceipt();
})();
