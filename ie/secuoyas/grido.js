if (!window._emailLockInitialized) {
  window._emailLockInitialized = true;
}
('use strict');
// Fallback para requestAnimationFrame
var raf =
  window.requestAnimationFrame ||
  function (cb) {
    return setTimeout(cb, 16);
  };
var DEPENDENT_FIELD_NAME = 'ie_estimateddateofadmissiontoie'; // name del picklist X
var CONTROL_FIELD_NAME = 'mktoStakeholder';
var STUDENT_VALUE = 'Student';
var NEW_PLACEHOLDER_LABEL = 'Preferred start year *';

MktoForms2.whenReady(function (form) {
  const emailSaved = localStorage.getItem('savedEmail');
  if (emailSaved) {
    form.setValues({ Email: emailSaved });
    setTimeout(function () {
      const emailField = form.getFormElem().find("input[name='Email']");
      if (emailField.length) {
        emailField.prop('readonly', true);
      }
    }, 200);
  }

  form.onSuccess(function (values, followUpUrl) {
    if (values.Email) {
      localStorage.setItem('savedEmail', values.Email);
    }
  });
  form.vals({
    ie_utmwebpageurl: window.location.href,
  });

  //alphabetical validation
  let firstNameField = document.getElementById('FirstName');
  if (firstNameField) {
    firstNameField.addEventListener('input', function () {
      this.value = this.value.replace(/[@/\\?!#%$*+"':;0-9()\[\]{}]/g, '');
    });
  }

  //alphabetical validation
  let middleNameField = document.getElementById('MiddleName');
  if (middleNameField) {
    middleNameField.addEventListener('input', function () {
      this.value = this.value.replace(/[@/\\?!#%$*+"':;0-9()\[\]{}]/g, '');
    });
  }
  var formEl = form.getFormElem()[0];

  // --- A) Agregar "*" a los placeholders requeridos / primera opción de picklist ---
  function addAsterisks(root) {
    // Inputs + Textareas
    root
      .querySelectorAll('input[aria-required="true"], textarea[aria-required="true"]')
      .forEach(function (field) {
        var ph = field.getAttribute('placeholder') || '';
        if (ph && !/\*\s*$/.test(ph)) {
          field.setAttribute('placeholder', ph.trim() + ' *');
        }
      });
    // Selects (la primera opción actúa como placeholder)
    root.querySelectorAll('select[aria-required="true"]').forEach(function (field) {
      var first = field.options && field.options[0];
      if (first) {
        var t = (first.textContent || '').trim();
        if (t && !/\*\s*$/.test(t)) {
          first.textContent = t + ' *';
        }
      }
    });
  }

  // --- B) Normalizar los márgenes izquierdos inline inyectados por Marketo ---
  function normalizeOffsets(root) {
    root.querySelectorAll('.mktoFieldWrap').forEach(function (wrap) {
      if (wrap && wrap.style) {
        if (
          wrap.style.marginLeft &&
          wrap.style.marginLeft !== '0px' &&
          wrap.style.marginLeft !== '0'
        ) {
          wrap.style.marginLeft = '0';
        }
        if (
          wrap.style.paddingLeft &&
          wrap.style.paddingLeft !== '0px' &&
          wrap.style.paddingLeft !== '0'
        ) {
          wrap.style.paddingLeft = '0';
        }
      }
    });
  }

  // --- C) Clasificar filas por número de columnas visibles (1 o 2) ---
  function isVisible(el) {
    // visible si tiene cajas de layout y no display:none
    return !!(el && (el.offsetParent || (el.getClientRects && el.getClientRects().length)));
  }
  function classifyRows(root) {
    root.querySelectorAll('.mktoFormRow').forEach(function (row) {
      var cols = Array.prototype.slice.call(row.querySelectorAll('.mktoFormCol'));
      var visibleCols = cols.filter(isVisible).length;
      var num = Math.min(visibleCols || cols.length || 1, 2);
      row.classList.remove('mktoFormRow-1', 'mktoFormRow-2');
      row.classList.add('mktoFormRow-' + num);
    });
  }

  function getFirstVisibleRealOption(sel) {
    if (!sel || !sel.options) return null;
    for (var i = 0; i < sel.options.length; i++) {
      var opt = sel.options[i];
      var val = (opt.value != null ? String(opt.value) : '').trim();
      var txt = (opt.textContent || '').trim();
      var isPlaceholder = !val || /selecciona|select|choose|elige/i.test(txt);
      var hiddenStyle = (opt.style && opt.style.display === 'none') || opt.hidden || opt.disabled;
      var hiddenClass =
        opt.classList &&
        (opt.classList.contains('mktoHidden') || opt.classList.contains('is-hidden'));
      if (!isPlaceholder && !hiddenStyle && !hiddenClass) return opt;
    }
    return null;
  }

  function adjustPlaceholderLabelBasedOnY(root) {
    var y = root.querySelector('[name="' + CONTROL_FIELD_NAME + '"]');
    var x = root.querySelector('[name="' + DEPENDENT_FIELD_NAME + '"]');
    if (!y || !x || !x.options || !x.options.length) return;

    var placeholder = x.options[0];
    var original = placeholder.getAttribute('data-original-placeholder-label');
    if (original && String(y.value) !== String(STUDENT_VALUE)) {
      placeholder.textContent = original + '*';
      placeholder.removeAttribute('data-original-placeholder-label');
      return;
    }

    // Aplicar si Y = Student
    if (String(y.value) === String(STUDENT_VALUE)) {
      if (!placeholder.hasAttribute('data-original-placeholder-label')) {
        // guardamos el texto original del placeholder una sola vez
        placeholder.setAttribute('data-original-placeholder-label', placeholder.textContent || '');
      }
      placeholder.textContent = NEW_PLACEHOLDER_LABEL;
    }
  }

  // --- D) Aplicar todas las correcciones juntas ---
  function applyAll() {
    addAsterisks(formEl);
    normalizeOffsets(formEl);
    classifyRows(formEl);
    adjustPlaceholderLabelBasedOnY(formEl);
  }

  // ▶︎ NUEVO: re-aplicar cuando cambie Y explícitamente
  var yField = formEl.querySelector('[name="' + CONTROL_FIELD_NAME + '"]');
  if (yField) {
    yField.addEventListener('change', function () {
      applyAll();
    });
  }

  // Ejecución inicial
  applyAll();

  // Reejecuciones de seguridad para capturar mutaciones asíncronas de reglas de visibilidad
  setTimeout(applyAll, 0);
  setTimeout(applyAll, 500);

  var formEl = form.getFormElem()[0];
  // Evita inicializar dos veces (si el snippet se incluye por error más de una vez)
  if (formEl.dataset.ieLinksPatched === '1') return;
  formEl.dataset.ieLinksPatched = '1';
  // Guarda el href original en data-raw-href y aplica attrs visuales
  function primeAnchors(root) {
    (root || formEl).querySelectorAll('a[href]').forEach(function (a) {
      if (!a.dataset.rawHref) a.dataset.rawHref = (a.getAttribute('href') || '').trim();
      var raw = a.dataset.rawHref;
      if (/^mailto:/i.test(raw)) {
        a.removeAttribute('target');
        a.removeAttribute('rel');
      } else {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
      // Evita tokenización de Marketo (no afecta los parámetros de Google)
      a.classList.add('mktNoTok');
    });
  }
  // Quita trackers comunes: GA/Ads/Email/Marketo
  function cleanUrl(u) {
    try {
      var url = new URL(u, window.location.href);
      [
        '_gl',
        '_ga',
        '_gac',
        'gclid',
        'gclsrc',
        'fbclid',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'mkt_tok',
        'mc_cid',
        'mc_eid',
      ].forEach(function (p) {
        url.searchParams.delete(p);
      });
      return url.toString();
    } catch (e) {
      return u;
    }
  }
  primeAnchors(formEl);
  // Delegación en captura para tomar prioridad y evitar duplicados
  function onClickCapture(e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var raw = a.dataset.rawHref || (a.getAttribute('href') || '').trim();
    if (!raw) return;
    var isMailto = /^mailto:/i.test(raw);
    var isPrivacy = /\/privacy-policy\/?$/i.test(raw);
    if (isMailto || isPrivacy) {
      e.preventDefault();
      e.stopPropagation();
      if (isMailto) {
        // Abre cliente de correo a nivel de página (salir del iframe)
        try {
          window.top.location.href = raw;
        } catch (_) {
          window.location.href = raw;
        }
      } else {
        // Abre URL limpia en nueva pestaña (una sola vez)
        console.log('cleanUrl', cleanUrl(raw));

        window.open(cleanUrl(raw), '_blank', 'noopener');
      }
    }
  }
  formEl.addEventListener('click', onClickCapture, true); // capture = true
  // Si el form re-renderiza (Visibility Rules), vuelve a primar enlaces nuevos
  try {
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        m.addedNodes &&
          m.addedNodes.forEach(function (n) {
            if (n.nodeType === 1) primeAnchors(n);
          });
      });
    }).observe(formEl, { childList: true, subtree: true });
  } catch (_) {}
});
