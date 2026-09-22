(function () {
  'use strict';

  var root = document.documentElement;
  var EMAIL = 'info@carwaypro.es';

  /* ------------------------------------------------------------------
     Language (ES / EN) — remembered between pages
     ------------------------------------------------------------------ */
  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  var lang = store('cwp-lang');
  if (lang !== 'es' && lang !== 'en') lang = 'es';

  function t(es, en) { return lang === 'en' ? en : es; }

  function applyLang(l) {
    lang = l;
    root.setAttribute('data-lang', l);
    root.setAttribute('lang', l);
    document.querySelectorAll('[data-set-lang]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-set-lang') === l ? 'true' : 'false');
    });
    document.querySelectorAll('[data-ph-es]').forEach(function (el) {
      el.setAttribute('placeholder', el.getAttribute('data-ph-' + l));
    });
    document.querySelectorAll('[data-aria-es]').forEach(function (el) {
      el.setAttribute('aria-label', el.getAttribute('data-aria-' + l));
    });
    var title = root.getAttribute('data-title-' + l);
    if (title) document.title = title;
    if (typeof refreshQuote === 'function') refreshQuote(false);
  }

  document.querySelectorAll('[data-set-lang]').forEach(function (b) {
    b.addEventListener('click', function () {
      var l = b.getAttribute('data-set-lang');
      store('cwp-lang', l);
      applyLang(l);
    });
  });

  /* ------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------ */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ------------------------------------------------------------------
     Quote calculator (only on the home page)
     Distance = great-circle distance x 1.22 (typical road factor).
     To use a real routing service later, replace roadKm() only.
     ------------------------------------------------------------------ */
  var refreshQuote = null;
  var form = document.getElementById('quote-form');

  if (form) {
    // [name (ES), alias / name (EN), lat, lon]
    var CITIES = [
      ['Madrid', 'Madrid', 40.4168, -3.7038], ['Barcelona', 'Barcelona', 41.3874, 2.1686],
      ['Valencia', 'Valencia', 39.4699, -0.3763], ['Sevilla', 'Seville', 37.3891, -5.9845],
      ['Zaragoza', 'Zaragoza', 41.6488, -0.8891], ['Málaga', 'Malaga', 36.7213, -4.4214],
      ['Murcia', 'Murcia', 37.9922, -1.1307], ['Bilbao', 'Bilbao', 43.263, -2.935],
      ['Alicante', 'Alicante', 38.3452, -0.481], ['Córdoba', 'Cordoba', 37.8882, -4.7794],
      ['Valladolid', 'Valladolid', 41.6523, -4.7245], ['Vigo', 'Vigo', 42.2406, -8.7207],
      ['Gijón', 'Gijon', 43.5322, -5.6611], ['Granada', 'Granada', 37.1773, -3.5986],
      ['A Coruña', 'La Coruna', 43.3623, -8.4115], ['Vitoria-Gasteiz', 'Vitoria', 42.8467, -2.6716],
      ['Pamplona', 'Pamplona', 42.8125, -1.6458], ['San Sebastián', 'San Sebastian', 43.3183, -1.9812],
      ['Santander', 'Santander', 43.4623, -3.81], ['Tarragona', 'Tarragona', 41.1189, 1.2445],
      ['Girona', 'Girona', 41.9794, 2.8214], ['Badalona', 'Badalona', 41.45, 2.2474],
      ['L\'Hospitalet de Llobregat', 'L\'Hospitalet', 41.3596, 2.1002], ['Lleida', 'Lleida', 41.6176, 0.62],
      ['Castellón de la Plana', 'Castellon', 39.9864, -0.0513], ['Toledo', 'Toledo', 39.8628, -4.0273],
      ['Salamanca', 'Salamanca', 40.9701, -5.6635], ['Burgos', 'Burgos', 42.3439, -3.6969],
      ['León', 'Leon', 42.5987, -5.5671], ['Oviedo', 'Oviedo', 43.3614, -5.8494],
      ['Logroño', 'Logrono', 42.4627, -2.445], ['Albacete', 'Albacete', 38.9943, -1.8585],
      ['Almería', 'Almeria', 36.834, -2.4637], ['Cádiz', 'Cadiz', 36.5271, -6.2886],
      ['Huelva', 'Huelva', 37.2614, -6.9447], ['Badajoz', 'Badajoz', 38.8794, -6.9707],
      ['Lisboa', 'Lisbon', 38.7223, -9.1393], ['Oporto', 'Porto', 41.1579, -8.6291],
      ['París', 'Paris', 48.8566, 2.3522], ['Lyon', 'Lyon', 45.764, 4.8357],
      ['Marsella', 'Marseille', 43.2965, 5.3698], ['Toulouse', 'Toulouse', 43.6047, 1.4442],
      ['Burdeos', 'Bordeaux', 44.8378, -0.5792], ['Niza', 'Nice', 43.7102, 7.262],
      ['Montpellier', 'Montpellier', 43.6108, 3.8767], ['Perpiñán', 'Perpignan', 42.6887, 2.8948],
      ['Berlín', 'Berlin', 52.52, 13.405], ['Múnich', 'Munich', 48.1351, 11.582],
      ['Fráncfort', 'Frankfurt', 50.1109, 8.6821], ['Hamburgo', 'Hamburg', 53.5511, 9.9937],
      ['Stuttgart', 'Stuttgart', 48.7758, 9.1829], ['Colonia', 'Cologne', 50.9375, 6.9603],
      ['Düsseldorf', 'Dusseldorf', 51.2277, 6.7735], ['Roma', 'Rome', 41.9028, 12.4964],
      ['Milán', 'Milan', 45.4642, 9.19], ['Nápoles', 'Naples', 40.8518, 14.2681],
      ['Turín', 'Turin', 45.0703, 7.6869], ['Florencia', 'Florence', 43.7696, 11.2558],
      ['Génova', 'Genoa', 44.4056, 8.9463], ['Ámsterdam', 'Amsterdam', 52.3676, 4.9041],
      ['Bruselas', 'Brussels', 50.8503, 4.3517], ['Róterdam', 'Rotterdam', 51.9244, 4.4777],
      ['Zúrich', 'Zurich', 47.3769, 8.5417], ['Viena', 'Vienna', 48.2082, 16.3738]
    ];

    var oIn = document.getElementById('city-origin');
    var dIn = document.getElementById('city-destination');
    var kmIn = document.getElementById('route-distance');
    var msgEl = document.getElementById('quote-msg');
    var swapBtn = document.getElementById('swap-cities');
    var calcBtn = document.getElementById('calc-btn');
    var plans = { standard: document.getElementById('plan-standard'), premium: document.getElementById('plan-premium') };
    var state = null; // { origin, dest, km, std, prem }

    // Fill the <datalist>
    var dl = document.getElementById('city-list');
    CITIES.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c[0];
      if (c[1] !== c[0]) o.label = c[1];
      dl.appendChild(o);
    });

    function norm(s) {
      return String(s).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    function find(q) {
      q = norm(q);
      if (!q) return null;
      for (var i = 0; i < CITIES.length; i++) {
        if (norm(CITIES[i][0]) === q || norm(CITIES[i][1]) === q) return CITIES[i];
      }
      return null;
    }
    function roadKm(a, b) {
      var R = 6371, rad = Math.PI / 180;
      var dLat = (b[2] - a[2]) * rad, dLon = (b[3] - a[3]) * rad;
      var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(a[2] * rad) * Math.cos(b[2] * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      return Math.max(1, Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 1.22));
    }
    function price(km) {
      var std = Math.round(80 + km * 0.65);
      return { std: std, prem: Math.round(std * 1.113) };
    }
    function money(n) { return new Intl.NumberFormat('es-ES').format(n) + ' €'; }

    function message(text, kind) {
      msgEl.textContent = text || '';
      msgEl.className = 'quote-msg' + (kind ? ' ' + kind : '');
    }

    function setPlan(key, amount) {
      var card = plans[key];
      var btn = card.querySelector('[data-plan-btn]');
      card.querySelector('.amount').textContent = amount ? money(amount) : '— €';
      card.classList.toggle('is-empty', !amount);
      if (amount && state) {
        btn.setAttribute('aria-disabled', 'false');
        btn.setAttribute('href', mailto(key, amount));
      } else {
        btn.setAttribute('aria-disabled', 'true');
        btn.removeAttribute('href');
      }
    }

    function reset() {
      state = null;
      kmIn.value = '';
      setPlan('standard', 0);
      setPlan('premium', 0);
    }

    function mailto(key, amount) {
      var name = key === 'premium' ? 'Premium' : 'Standard';
      var subject = t('Solicitud de traslado: ', 'Transport request: ') + state.origin + ' → ' + state.dest + ' (' + name + ')';
      var body = [
        t('Hola CARWAYPRO,', 'Hello CARWAYPRO,'),
        '',
        t('Quiero solicitar este traslado:', 'I would like to request this transport:'),
        t('Origen: ', 'Origin: ') + state.origin,
        t('Destino: ', 'Destination: ') + state.dest,
        t('Distancia estimada: ', 'Estimated distance: ') + state.km + ' km',
        t('Servicio: ', 'Service: ') + name,
        t('Precio estimado: ', 'Estimated price: ') + money(amount) + ' + IVA',
        '',
        t('Marca, modelo y matrícula: ', 'Make, model and plate: '),
        t('Fecha de recogida deseada: ', 'Preferred pick-up date: '),
        t('Teléfono de contacto: ', 'Contact phone: ')
      ].join('\n');
      return 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    }

    // show = display validation errors; returns true when a valid quote is shown
    refreshQuote = function (show) {
      var oVal = oIn.value.trim(), dVal = dIn.value.trim();
      if (!oVal || !dVal) {
        reset();
        message(show ? t('Indica la ciudad de origen y la de destino.', 'Enter an origin and a destination city.') : '', show ? 'error' : '');
        return false;
      }
      var o = find(oVal), d = find(dVal);
      if (!o || !d) {
        reset();
        if (show) {
          var bad = !o ? oVal : dVal;
          message(t('No encontramos «' + bad + '» en la lista. Elige una ciudad sugerida o escríbenos a ' + EMAIL + ' para una ruta a medida.',
                    'We couldn\'t find "' + bad + '" in the list. Pick a suggested city or email ' + EMAIL + ' for a custom route.'), 'error');
        }
        return false;
      }
      if (o === d) {
        reset();
        message(t('El origen y el destino no pueden ser la misma ciudad.', 'Origin and destination can\'t be the same city.'), 'error');
        return false;
      }
      var km = roadKm(o, d);
      var p = price(km);
      state = { origin: o[0], dest: d[0], km: km, std: p.std, prem: p.prem };
      kmIn.value = new Intl.NumberFormat('es-ES').format(km) + ' km';
      setPlan('standard', p.std);
      setPlan('premium', p.prem);
      message(t('Ruta estimada: ' + km + ' km por carretera.', 'Estimated route: ' + km + ' km by road.'), 'ok');
      return true;
    };

    [oIn, dIn].forEach(function (el) {
      el.addEventListener('input', function () { refreshQuote(false); });
      el.addEventListener('change', function () { refreshQuote(!!(oIn.value.trim() && dIn.value.trim())); });
    });

    swapBtn.addEventListener('click', function () {
      var tmp = oIn.value; oIn.value = dIn.value; dIn.value = tmp;
      refreshQuote(!!(oIn.value.trim() && dIn.value.trim()));
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (refreshQuote(true)) {
        var target = document.getElementById('planes');
        if (target) target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      }
    });

    reset();
  }

  applyLang(lang);
})();
