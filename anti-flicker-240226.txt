(function (d, w) {
  if (d.location.href.indexOf('mboxEdit') !== -1) return;

  var SELECTORS = [
    '#idComponente1',
    '#idComponente2',
    // ... add more selectors as needed
  ];

  var TTL = 3000;
  var STYLE_ID = 'anti-flicker-ie';
  var CLASS = 'at-hide';

  if (!d.getElementById(STYLE_ID)) {
    var st = d.createElement('style');
    st.id = STYLE_ID;
    st.textContent = `
      .${CLASS} { position: relative !important; }

      /* Overlay (sin borders) */
      .${CLASS}::before{
        content:"";
        position:absolute;
        inset:0;
        background:#f2f2f2;
        box-sizing:border-box;
        z-index:2147483647;
        pointer-events:none;
      }

      /* Spinner */
      .${CLASS}::after{
        content:"";
        position:absolute;
        top:50%;
        left:50%;
        width:42px;
        height:42px;
        margin:-21px 0 0 -21px;
        border:4px solid rgba(0,0,0,0.15);
        border-top-color: rgba(0,0,0,0.6);
        border-radius:50%;
        animation: af-spin 0.9s linear infinite;
        z-index:2147483648;
        pointer-events:none;
      }

      @keyframes af-spin{ to{ transform: rotate(360deg); } }
    `;
    d.head && d.head.appendChild(st);
  }

  function apply(selectors) {
    var list = Array.isArray(selectors) ? selectors : SELECTORS;
    for (var i = 0; i < list.length; i++) {
      try {
        var nodes = d.querySelectorAll(list[i]);
        for (var j = 0; j < nodes.length; j++) {
          nodes[j].classList.add(CLASS);
        }
      } catch (e) {}
    }
  }

  function release() {
    var els = d.querySelectorAll('.' + CLASS);
    for (var i = 0; i < els.length; i++) els[i].classList.remove(CLASS);

    var st = d.getElementById(STYLE_ID);
    if (st && st.parentNode) st.parentNode.removeChild(st);
  }

  w.__antiFlicker = w.__antiFlicker || {};
  w.__antiFlicker.apply = function (selectors) {
    apply(selectors);
  };
  w.__antiFlicker.release = release;

  apply();

  var scheduled = false;
  var mo = new MutationObserver(function () {
    if (scheduled) return;
    scheduled = true;
    w.requestAnimationFrame(function () {
      scheduled = false;
      apply();
    });
  });

  mo.observe(d.documentElement, { childList: true, subtree: true });

  w.setTimeout(function () {
    mo.disconnect();
    release();
  }, TTL);
})(document, window);
