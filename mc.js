/* MINAKAWA CLASSICS — site behaviour */
(function () {
  'use strict';

  /* ---- sticky header ---- */
  var hd = document.querySelector('.hd');
  function onScroll() {
    if (!hd) return;
    hd.classList.toggle('is-stuck', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- mobile nav ---- */
  var burger = document.querySelector('.burger');
  var mnav = document.querySelector('.mnav');
  if (burger && mnav) {
    burger.addEventListener('click', function () {
      var on = mnav.classList.toggle('on');
      burger.classList.toggle('on', on);
      hd.classList.toggle('nav-open', on);
      document.body.style.overflow = on ? 'hidden' : '';
      burger.setAttribute('aria-expanded', on ? 'true' : 'false');
    });
    mnav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        mnav.classList.remove('on');
        burger.classList.remove('on');
        hd.classList.remove('nav-open');
        document.body.style.overflow = '';
      }
    });
  }

  /* ---- reveal on scroll (with fail-safes: content must never stay invisible) ---- */
  var rv = document.querySelectorAll('.rv');
  var revealAll = function () { rv.forEach(function (el) { el.classList.add('in'); }); };
  if ('IntersectionObserver' in window && rv.length) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    rv.forEach(function (el) { io.observe(el); });
    // anything already at/near the top is shown at once
    rv.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight * 1.15) el.classList.add('in');
    });
    // last resort: if the observer never fires (throttled tab, odd browser), show everything
    setTimeout(function () {
      var shown = document.querySelectorAll('.rv.in').length;
      if (shown === 0) revealAll();
    }, 2500);
    window.addEventListener('pageshow', function (e) { if (e.persisted) revealAll(); });
  } else {
    revealAll();
  }

  /* ---- year select ---- */
  var ys = document.querySelector('select[name="year"]');
  if (ys && ys.options.length <= 1) {
    var now = new Date().getFullYear();
    for (var y = now; y >= 1960; y--) {
      ys.add(new Option(y + '年', y + '年'));
    }
    ys.add(new Option('1959年以前', '1959年以前'));
    ys.add(new Option('わからない', 'わからない'));
  }

  /* ---- referrer / entry model into hidden src ---- */
  var src = document.getElementById('srcField');
  if (src) {
    var q = new URLSearchParams(location.search);
    src.value = [
      document.body.getAttribute('data-page') || 'top',
      q.get('utm_source') || q.get('src') || '',
      document.referrer ? document.referrer.slice(0, 120) : ''
    ].filter(Boolean).join(' / ');
  }

  /* ---- pre-fill maker/model from page context ---- */
  var mk = document.querySelector('input[name="maker"]');
  var md = document.querySelector('input[name="model"]');
  var pm = document.body.getAttribute('data-prefill-model');
  if (mk && !mk.value) mk.value = 'メルセデス・ベンツ';
  if (md && pm && !md.value) md.value = pm;

  /* ---------------------------------------------------------
     Extra spec fields are folded into the existing `message`
     field on submit, so the current satei_send.php keeps
     working without any server-side change.
     --------------------------------------------------------- */
  var form = document.getElementById('sateiForm');
  if (form) {
    form.addEventListener('submit', function () {
      var ta = form.querySelector('textarea[name="message"]');
      if (!ta) return;
      var lines = [];
      form.querySelectorAll('[data-spec]').forEach(function (el) {
        var label = el.getAttribute('data-spec');
        if (el.type === 'checkbox') return;
        var v = (el.value || '').trim();
        if (v) lines.push(label + '：' + v);
      });
      var eq = [];
      form.querySelectorAll('input[type="checkbox"][data-spec]:checked').forEach(function (el) {
        eq.push(el.getAttribute('data-spec-value') || el.value);
      });
      if (eq.length) lines.push('装備・付属品：' + eq.join('／'));
      if (!lines.length) return;
      var block = '───── 車両情報 ─────\n' + lines.join('\n');
      var cur = ta.value.trim();
      ta.value = cur ? cur + '\n\n' + block : block;
    });
  }

  /* ---- file count feedback ---- */
  var fi = document.querySelector('.filebox input[type="file"]');
  if (fi) {
    var fp = fi.parentNode.querySelector('p');
    var base = fp ? fp.textContent : '';
    fi.addEventListener('change', function () {
      if (!fp) return;
      fp.textContent = fi.files && fi.files.length
        ? fi.files.length + '枚を選択中。外装（前後左右）・内装・メーター・記録簿があると精度が上がります。'
        : base;
    });
  }


  /* ---- hero video: pick source by width, respect data saver / reduced motion ---- */
  var hv = document.getElementById('heroVideo');
  if (hv) {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var conn = navigator.connection || {};
    var slow = conn.saveData === true || /(^|\W)(slow-2g|2g)($|\W)/.test(conn.effectiveType || '');
    if (!reduce && !slow) {
      var src = (window.innerWidth <= 820 && hv.dataset.srcSm) ? hv.dataset.srcSm : hv.dataset.src;
      hv.setAttribute('preload', 'auto');
      hv.src = src;
      var p = hv.play();
      if (p && p.catch) p.catch(function () { /* autoplay blocked: poster stays */ });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (e.isIntersecting) { var q = hv.play(); if (q && q.catch) q.catch(function(){}); }
            else { hv.pause(); }
          });
        }, { threshold: 0.05 }).observe(hv);
      }
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) hv.pause();
        else { var q = hv.play(); if (q && q.catch) q.catch(function(){}); }
      });
    }
  }

  /* ---- count up ---- */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    var run = function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      var unit = el.querySelector('small');
      var dur = 1100, t0 = null;
      var step = function (ts) {
        if (t0 === null) t0 = ts;
        var k = Math.min(1, (ts - t0) / dur);
        var eased = 1 - Math.pow(1 - k, 3);
        var v = Math.round(target * eased);
        el.firstChild && el.firstChild.nodeType === 3
          ? (el.firstChild.nodeValue = v)
          : el.insertBefore(document.createTextNode(v), unit || null);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window) {
      var co = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { run(e.target); co.unobserve(e.target); } });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { co.observe(el); });
    } else {
      counters.forEach(run);
    }
  }

  /* ---- current year in footer ---- */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();
})();
