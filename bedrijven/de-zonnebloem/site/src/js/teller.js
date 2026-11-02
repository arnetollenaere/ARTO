// Anonieme bezoekersteller: geen cookies, niets op je toestel bewaard. Zie lib/statistiek.js.
(function () {
  "use strict";
  try {
    if (navigator.doNotTrack === "1" || navigator.webdriver) return;
    var p = new URLSearchParams(location.search);
    var d = JSON.stringify({ pad: location.pathname, verwijzer: document.referrer, utm: p.get("utm_source") || "" });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/bezoek", new Blob([d], { type: "text/plain" }));
    else fetch("/api/bezoek", { method: "POST", body: d, keepalive: true });
  } catch (e) { /* tellen is nooit belangrijker dan de site */ }
})();
