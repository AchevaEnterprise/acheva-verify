/**
 * Deployment configuration.
 *
 * A plain script rather than a build-time variable: this app has no build step,
 * so an environment is changed by editing this one file next to the HTML —
 * which is also what makes it deployable by copying a folder onto any static
 * host.
 *
 * The API is chosen by hostname rather than by editing this file per deploy.
 * A file that must be hand-edited between environments eventually ships to
 * production still pointing at localhost, and the failure is quiet: the page
 * cannot reach the API, reports "could not check this serial", and every
 * genuine document appears unverifiable.
 *
 * `.app` is on the HSTS preload list, so verify.acheva.app is always served
 * over HTTPS — which means the API it calls MUST be HTTPS too, or the browser
 * blocks the request as mixed content before it leaves the page.
 */
(function () {
  var host = window.location.hostname;
  var isLocal =
    host === 'localhost' || host === '127.0.0.1' || host === '[::1]';

  window.ACHEVA = {
    /** The Acheva API. The verify endpoint is public — no key belongs here. */
    apiUrl: isLocal
      ? 'http://localhost:3000'
      : 'https://acheva-nestjs-staging.up.railway.app',
  };
})();
