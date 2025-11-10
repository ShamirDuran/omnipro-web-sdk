if (!window._emailLockInitialized) {
  window._emailLockInitialized = true;
}
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
  //validation experienceField
  const interestedInSelect = document.getElementById('ie_interestedin');
  function handleProgramChange() {
    const selectedValue = interestedInSelect.value;
    const isMasterProgram = selectedValue === 'Master programs';
    const experienceField = document.getElementById('ie_yearsofexperience');

    if (experienceField) {
      experienceField.addEventListener('input', function () {
        if (this.value == '-1') {
          this.value = '0';
        }
        this.value = this.value.replace(/[^0-9]/g, '');
      });
    }
  }

  if (interestedInSelect) {
    interestedInSelect.addEventListener('change', handleProgramChange);
  }

  var formEl = form.getFormElem()[0];
  if (formEl.getAttribute('data-inline-behaviors-loaded') === 'true') return;
  formEl.setAttribute('data-inline-behaviors-loaded', 'true');

  var TARGET_SELECTOR = 'input#Phone, input[name="Phone"], input[name="cdi_age"]';

  // ======================
  // UTILIDADES
  // ======================
  function isVisible(el) {
    return !!(el && el.offsetParent !== null);
  }

  function wireNumericOnly(input) {
    if (!input || input.getAttribute('data-wired-numeric') === 'true') return;
    input.setAttribute('data-wired-numeric', 'true');

    // Filtra al escribir/pegar: solo dígitos
    input.addEventListener('input', function () {
      this.value = this.value.replace(/\D/g, '');
    });

    // Opcional: bloquear teclas no numéricas (permite navegación y combinaciones Ctrl/Cmd)
    input.addEventListener('keydown', function (e) {
      var allowed =
        ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'].includes(e.key) ||
        e.ctrlKey ||
        e.metaKey;
      var isDigit = /^\d$/.test(e.key);
      if (!allowed && !isDigit) e.preventDefault();
    });
  }

  function scanAndWireExisting() {
    var targets = formEl.querySelectorAll(TARGET_SELECTOR);
    targets.forEach(wireNumericOnly);
  }

  // Observa el formulario para detectar inserciones de campos objetivo
  var observer = new MutationObserver(function (mutations) {
    for (var m of mutations) {
      for (var node of m.addedNodes) {
        if (node.nodeType !== 1) continue; // ELEMENT_NODE
        // Si el nodo agregado es un input objetivo
        if (node.matches && node.matches(TARGET_SELECTOR)) {
          wireNumericOnly(node);
          continue;
        }
        // O si contiene inputs objetivo
        if (node.querySelectorAll) {
          var found = node.querySelectorAll(TARGET_SELECTOR);
          if (found.length) found.forEach(wireNumericOnly);
        }
      }
    }
  });

  // Iniciar
  scanAndWireExisting();
  observer.observe(formEl, { childList: true, subtree: true });

  // Validación en submit: todo input objetivo visible debe tener solo dígitos (si está lleno)
  form.onValidate(function (stillValid) {
    if (!stillValid) return;

    var targets = formEl.querySelectorAll(TARGET_SELECTOR);
    for (var i = 0; i < targets.length; i++) {
      var el = targets[i];
      if (!isVisible(el)) continue;
      var val = (el.value || '').trim();
      if (val.length > 0 && !/^\d+$/.test(val)) {
        form.showErrorMessage('Solo ingresa números.', el);
        form.submitable(false);
        return;
      }
    }
  });

  form.vals({
    ie_utmwebpageurl: window.location.href,
  });

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
        'gclid',MktoForms2
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
// ]]></script>
