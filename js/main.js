(function () {
  document.documentElement.classList.add('js');

  // ---------- header shadow on scroll ----------
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- mobile menu ----------
  var burger = document.querySelector('.burger');
  var navlinks = document.getElementById('navlinks');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
    navlinks.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
  }
  if (burger && navlinks) {
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
    navlinks.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) setMenu(false);
    });
  }

  // ---------- reveal on scroll ----------
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el, i) {
      // stagger siblings inside grids
      var idx = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.transitionDelay = Math.min(idx, 5) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  // ---------- active nav link ----------
  var sectionLinks = document.querySelectorAll('.navlinks a[href^="#"]');
  if (sectionLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    sectionLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = map[entry.target.id];
        if (link && entry.isIntersecting) {
          sectionLinks.forEach(function (a) { a.classList.remove('active'); });
          link.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) navIo.observe(s);
    });
  }

  // ---------- hero terminal typing ----------
  var lines = document.querySelectorAll('.terminal .tl');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  lines.forEach(function (line, i) {
    if (reduced) { line.classList.add('on'); return; }
    setTimeout(function () { line.classList.add('on'); }, 300 + i * 380);
  });

  // ---------- footer year ----------
  document.querySelectorAll('.year').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // ---------- forms (Formspree via fetch) ----------
  document.querySelectorAll('#contact-form, #incident-form').forEach(function (form) {
    var status = form.querySelector('.form-status');
    var button = form.querySelector('button[type="submit"]');
    var label = button.textContent;
    var success = form.dataset.success || 'Dziękuję! Wiadomość dotarła — odpowiem w ciągu 1–2 dni roboczych.';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.className = 'form-status';
      status.textContent = '';

      var firstInvalid = null;
      form.querySelectorAll('[required]').forEach(function (field) {
        var bad;
        if (field.type === 'radio') {
          bad = !form.querySelector('input[name="' + field.name + '"]:checked');
          var group = field.closest('.pick-grid');
          if (group) group.classList.toggle('invalid', bad);
        } else {
          bad = !field.value.trim() || (field.type === 'email' && !field.checkValidity());
          field.classList.toggle('invalid', bad);
        }
        if (bad && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) {
        status.className = 'form-status err';
        status.textContent = 'Uzupełnij wymagane pola oznaczone gwiazdką (i sprawdź adres e-mail).';
        firstInvalid.focus();
        return;
      }

      button.disabled = true;
      button.textContent = 'Wysyłanie…';
      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      }).then(function (res) {
        if (!res.ok) throw new Error(res.status);
        form.reset();
        status.className = 'form-status ok';
        status.textContent = success;
      }).catch(function () {
        status.className = 'form-status err';
        status.textContent = 'Nie udało się wysłać wiadomości. Spróbuj ponownie za chwilę lub napisz przez LinkedIn.';
      }).then(function () {
        button.disabled = false;
        button.textContent = label;
      });
    });
    form.addEventListener('input', function (e) {
      if (e.target.classList.contains('invalid') && e.target.value.trim()) e.target.classList.remove('invalid');
    });
    form.addEventListener('change', function (e) {
      var group = e.target.closest('.pick-grid');
      if (group) group.classList.remove('invalid');
    });
  });

  // ---------- CTA buttons preselect contact topic ----------
  var topicSelect = document.getElementById('f-topic');
  if (topicSelect) {
    document.querySelectorAll('[data-topic]').forEach(function (el) {
      el.addEventListener('click', function () {
        var t = el.dataset.topic;
        Array.prototype.forEach.call(topicSelect.options, function (o) {
          if (o.text === t) topicSelect.value = o.value;
        });
      });
    });
  }

  // ---------- KSC self-check ----------
  var check = document.querySelector('.check-form');
  if (check) {
    var result = document.querySelector('.check-result');
    check.addEventListener('submit', function (e) {
      e.preventDefault();
      var sector = check.sector.value;
      var size = (check.querySelector('input[name="size"]:checked') || {}).value;
      var supplier = (check.querySelector('input[name="supplier"]:checked') || {}).value;
      check.sector.classList.toggle('invalid', !sector);
      if (!sector || (!size && sector !== 'always') || !supplier) {
        result.hidden = false;
        result.className = 'check-result r-no';
        result.innerHTML = '<p>Odpowiedz na wszystkie trzy pytania.</p>';
        return;
      }

      var cls, title, text;
      if (sector === 'always' || ((sector === 'key' || sector === 'important') && size === 'big')) {
        cls = 'r-yes';
        title = sector === 'important' ? 'Prawdopodobnie jesteś podmiotem ważnym' : 'Prawdopodobnie jesteś podmiotem kluczowym';
        text = 'Termin wpisu do wykazu minął 3 października 2026 r., a SZBI musi działać do 3 kwietnia 2027 r. Warto zacząć od analizy luk.';
      } else if (sector !== 'other' || supplier === 'yes') {
        cls = 'r-maybe';
        title = 'Ustawa może dotyczyć Cię pośrednio';
        text = supplier === 'yes'
          ? 'Podmioty objęte KSC muszą dbać o bezpieczeństwo łańcucha dostaw — Twoi klienci mogą wymagać od Ciebie dowodów bezpieczeństwa.'
          : 'Mniejsze podmioty z tych sektorów zwykle nie podlegają ustawie, ale są wyjątki — warto to zweryfikować.';
      } else {
        cls = 'r-no';
        title = 'Raczej nie podlegasz ustawie bezpośrednio';
        text = 'Dobre praktyki z KSC i ISO 27001 wciąż chronią firmę przed realnymi zagrożeniami.';
      }
      result.hidden = false;
      result.className = 'check-result ' + cls;
      result.innerHTML = '<strong>' + title + '</strong><p>' + text + '</p>' +
        '<a href="#kontakt" class="btn btn-primary" data-topic="KSC / NIS2">Porozmawiajmy o KSC →</a>';
      var cta = result.querySelector('[data-topic]');
      cta.addEventListener('click', function () { if (topicSelect) topicSelect.value = 'KSC / NIS2'; });
    });
  }

  // ---------- certificates: search + filter ----------
  var search = document.querySelector('.cert-search');
  var filters = document.querySelectorAll('.filter');
  var sections = document.querySelectorAll('.cert-page-section');
  if (search && sections.length) {
    var current = 'all';
    var empty = document.querySelector('.no-results');
    function applyFilter() {
      var q = search.value.trim().toLowerCase();
      var anyVisible = false;
      sections.forEach(function (sec) {
        var catOk = current === 'all' || sec.dataset.cat === current;
        var visible = 0;
        sec.querySelectorAll('.cert-item').forEach(function (item) {
          var show = catOk && item.textContent.toLowerCase().indexOf(q) !== -1;
          item.hidden = !show;
          if (show) visible++;
        });
        sec.hidden = visible === 0;
        if (visible) anyVisible = true;
      });
      if (empty) empty.hidden = anyVisible;
    }
    search.addEventListener('input', applyFilter);
    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filters.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        current = btn.dataset.filter;
        applyFilter();
      });
    });

    // counts
    sections.forEach(function (sec) {
      var c = sec.querySelector('.count');
      if (c) c.textContent = sec.querySelectorAll('.cert-item').length;
    });
    var total = document.querySelector('[data-total]');
    if (total) total.textContent = document.querySelectorAll('.cert-item').length;
  }
})();
