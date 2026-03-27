(function () {
  var injected = false;
  console.log('--- Iniciando Debugger de Munchkin & OneTrust ---');

  function hasConsent() {
    var consent = (
      window.OptanonActiveGroups &&
      /C0002/.test(OptanonActiveGroups) &&
      /C0003/.test(OptanonActiveGroups) &&
      /C0004/.test(OptanonActiveGroups)
    );
    console.log('Verificando grupos de OneTrust:', window.OptanonActiveGroups, '| ¿Consentimiento total?:', consent);
    return consent;
  }

  function oneTrustReady() {
    var ready = typeof window.OptanonActiveGroups === 'string';
    console.log('¿OneTrust está listo en el objeto window?:', ready);
    return ready;
  }

  function loadMunchkin() {
    if (injected) {
      console.warn('Munchkin ya fue inyectado anteriormente. Abortando duplicado.');
      return;
    }
    injected = true;
    console.log('Intentando cargar script de Marketo (munchkin.js)...');

    var didInit = false;
    function initMunchkin() {
      if (didInit === false) {
        didInit = true;
        console.log('Ejecutando Munchkin.init con ID: 928-JRO-529');
        Munchkin.init('928-JRO-529', {
          domainLevel: 2
        });
      }
    }

    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.async = true;
    s.src = '//munchkin.marketo.net/munchkin.js';
    
    s.onreadystatechange = function () {
      console.log('Estado del script Munchkin (onreadystatechange):', this.readyState);
      if (this.readyState == 'complete' || this.readyState == 'loaded') {
        initMunchkin();
      }
    };
    
    s.onload = function() {
      console.log('Evento onload de Munchkin disparado exitosamente.');
      initMunchkin();
    };

    s.onerror = function() {
      console.error('Error crítico: No se pudo cargar el archivo JS de Marketo.');
    };

    document.getElementsByTagName('head')[0].appendChild(s);
  }

  function deleteMktoCookie() {
    if (document.cookie.indexOf('_mkto_trk') === -1) {
      console.log('No hay cookie _mkto_trk para borrar.');
      return;
    }
    var domain = location.hostname.split('.').slice(-2).join('.');
    document.cookie =
      '_mkto_trk=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.' + domain;
    document.cookie =
      '_mkto_trk=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';

    console.log('Munchkin cookie detectada y ELIMINADA por falta de consentimiento en el dominio: .' + domain);
  }

  function handleConsent() {
    console.log('Ejecutando lógica de decisión de consentimiento (handleConsent)');
    if (hasConsent()) {
      console.info('Acción: Cargando Munchkin.');
      loadMunchkin();
    } else if (oneTrustReady()) {
      console.info('Acción: Borrando cookies (OneTrust presente pero sin permisos suficientes).');
      deleteMktoCookie();
    } else {
      console.log('OneTrust aún no está disponible para tomar una decisión.');
    }
  }

  // Interceptar la función global de OneTrust
  var original = window.OptanonWrapper;
  window.OptanonWrapper = function () {
    console.log('OptanonWrapper ejecutado por OneTrust.');
    if (typeof original === 'function') {
      console.log('Llamando a la función OptanonWrapper original...');
      original();
    }
    handleConsent();
  };

  // Verificación inmediata por si OneTrust ya cargó antes que este script
  if (oneTrustReady()) {
    console.log('OneTrust detectado en la carga inicial.');
    handleConsent();
  } else {
    console.log('Esperando a que OneTrust dispare OptanonWrapper...');
  }
})();