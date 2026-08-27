/**
 * Deployment configuration.
 *
 * A plain script rather than a build-time variable: this app has no build step,
 * so an environment is changed by editing this one file next to the HTML —
 * which is also what makes it deployable by copying a folder onto any static
 * host.
 */
window.ACHEVA = {
  /** The Acheva API. The verify endpoint is public — no key belongs here. */
  apiUrl: 'http://localhost:3000',
};
