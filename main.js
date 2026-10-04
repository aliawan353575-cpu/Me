(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Navigation: sticky state, mobile menu, scroll lock, active link, progress bar */
  var nav = $('.nav'), links = $('.links'), burger = $('.burger'), bar = $('.progress');
  var hasHero = !!$('.hero3');
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle('solid', y > 40);
    if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    var hero = $('.hero3 .bg');
    if (hero && !reduce && y < innerHeight) {
      hero.style.setProperty('--py', y * 0.06 + 'px');
      $('.bm').style.setProperty('--my', y * -0.04 + 'px');
    }
  }
  if (!hasHero) nav.classList.add('light');
  function setMenu(open) {
    links.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('locked', open);
  }
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  addEventListener('resize', function () { if (innerWidth > 960) setMenu(false); });
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var secs = $$('main section[id]'), navLinks = $$('.links a[href^="#"]');
  if ('IntersectionObserver' in window && secs.length) {
    var navIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) navLinks.forEach(function (a) {
          a.toggleAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(function (s) { navIO.observe(s); });
  }

  /* Scroll reveal with stagger */
  var revs = $$('.rev');
  revs.forEach(function (el, i) { el.style.setProperty('--d', (i % 4) * 0.08 + 's'); });
  if ('IntersectionObserver' in window && !reduce) {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } });
    }, { threshold: 0.12 });
    revs.forEach(function (el) { rio.observe(el); });
  } else revs.forEach(function (el) { el.classList.add('in'); });

  /* Portfolio: filter + project modal (event delegation) */
  var grid = $('.works'), dlg = $('#project-dialog');
  if (grid) {
    $('.filters').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      $$('.filters button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      $$('.work', grid).forEach(function (w) {
        w.classList.toggle('hide', b.dataset.filter !== 'all' && w.dataset.cat !== b.dataset.filter);
      });
    });
    grid.addEventListener('click', function (e) {
      var w = e.target.closest('.work'); if (!w) return;
      $('#pd-cat').textContent = w.dataset.label;
      $('#pd-title').textContent = w.dataset.title;
      $('#pd-desc').textContent = w.dataset.desc; $('#pd-img').src = w.dataset.img; $('#pd-img').alt = w.dataset.title + ' concept';
      $('#pd-approach').textContent = w.dataset.approach;
      dlg.showModal();
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.closest('.x')) dlg.close(); });
  }

  /* Before / after slider (pointer drag + keyboard via range input) */
  var ba = $('.ba');
  if (ba) {
    var range = $('input', ba);
    var setPos = function (v) { ba.style.setProperty('--pos', v + '%'); };
    range.addEventListener('input', function () { setPos(range.value); });
    setPos(range.value);
  }

  /* FAQ accordion: one open at a time, animated height via grid rows */
  var faq = $('.faq');
  if (faq) faq.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var open = b.getAttribute('aria-expanded') === 'true';
    $$('button', faq).forEach(function (x) {
      x.setAttribute('aria-expanded', 'false');
      document.getElementById(x.getAttribute('aria-controls')).classList.remove('open');
    });
    if (!open) { b.setAttribute('aria-expanded', 'true'); document.getElementById(b.getAttribute('aria-controls')).classList.add('open'); }
  });

  /* Form: validation, loading, success and error states.
     Set ENDPOINT to a real form service URL (Formspree, Netlify, etc.) to enable sending. */
  var ENDPOINT = '';
  var form = $('#inquiry');
  if (form) {
    var rules = { name: 'Enter your name.', company: 'Enter your company name.', email: 'Enter a valid email address.', location: 'Enter your business location.', details: 'Tell us a little about the project.' };
    var status = $('#form-status'), submit = $('button[type=submit]', form);
    var show = function (msg, bad) { status.hidden = false; status.className = 'status' + (bad ? ' bad' : ''); status.textContent = msg; status.focus(); };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var first = null;
      Object.keys(rules).forEach(function (k) {
        var f = form.elements[k], v = f.value.trim();
        var bad = !v || (k === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v));
        f.setAttribute('aria-invalid', bad);
        $('#' + k + '-err').textContent = bad ? rules[k] : '';
        if (bad && !first) first = f;
      });
      if (first) { first.focus(); return; }
      if (!ENDPOINT) { show('This form is not connected to an inbox yet, so nothing was sent. Add a form endpoint in js/main.js to enable it.', true); return; }
      submit.disabled = true; submit.textContent = 'Sending…';
      fetch(ENDPOINT, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(); form.reset(); show('Thank you. We received your request and will reply with next steps.', false); })
        .catch(function () { show('Something went wrong and your request was not sent. Please try again.', true); })
        .then(function () { submit.disabled = false; submit.textContent = 'Request a Project Review'; });
    });
  }
})();
