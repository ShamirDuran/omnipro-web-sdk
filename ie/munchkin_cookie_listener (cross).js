(function () {
  var injected = false;

  function hasConsent() {
    return (
      window.OptanonActiveGroups &&
      /C0002/.test(OptanonActiveGroups) &&
      /C0003/.test(OptanonActiveGroups) &&
      /C0004/.test(OptanonActiveGroups)
    );
  }

  function oneTrustReady() {
    return typeof window.OptanonActiveGroups === 'string';
  }

  function loadMunchkin() {
    if (injected) return;
    injected = true;

    var didInit = false;
    function initMunchkin() {
      if (didInit === false) {
        didInit = true;
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
      if (this.readyState == 'complete' || this.readyState == 'loaded') {
        initMunchkin();
      }
    };
    s.onload = initMunchkin;
    document.getElementsByTagName('head')[0].appendChild(s);
    
    console.log('Munchkin loaded (domainLevel: 2 -> cookie on .ie.edu)');
  }

  function deleteMktoCookie() {
    if (document.cookie.indexOf('_mkto_trk') === -1) return;
    var domain = location.hostname.split('.').slice(-2).join('.');
    document.cookie =
      '_mkto_trk=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.' + domain;
    document.cookie =
      '_mkto_trk=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';

    console.log('Munchkin cookie deleted');
  }

  function handleConsent() {
    if (hasConsent()) {
      loadMunchkin();
    } else if (oneTrustReady()) {
      deleteMktoCookie();
    }
  }

  var original = window.OptanonWrapper;
  window.OptanonWrapper = function () {
    if (typeof original === 'function') original();
    handleConsent();
  };

  if (oneTrustReady()) {
    handleConsent();
  }
})();