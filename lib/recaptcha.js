/*!
 * Copyright (c) 2025 Digital Bazaar, Inc. All rights reserved.
 */

// Helper to wait for the grecaptcha script to land on window
async function _waitForRecaptcha({retries, delay}) {
  for(let retry = 0; retry < retries; ++retry) {
    if(window.grecaptcha) {
      return;
    }
    await new Promise(r => setTimeout(r, delay));
  }
  const error = new Error('reCAPTCHA script failed to load');
  error.name = 'TimeoutError';
  throw error;
}
/**
 * Obtains a reCAPTCHA token by loading the grecaptcha script.
 * If the max number of `retries` attempts is hit, abort and throw an error.
 *
 * @param {object} [options] - The options to use.
 * @param {string} options.siteKey - ReCAPTCHA site key.
 * @param {string} [options.action='login'] - Action name to pass to execute().
 * @param {number} [options.retries=3] - Number of times to retry checking
 * `grecaptcha` readiness.
 * @param {number} [options.delay=500] - Delay to retry (in ms).
 *
 * @returns {Promise<string>} Resolves with the reCAPTCHA token.
 * @throws {Error} If the script fails to load after retries or execute()
 * is rejected.
 */
export async function getRecaptchaToken({
  siteKey, action = 'login', retries = 3, delay = 500
} = {}) {
  if(typeof siteKey !== 'string') {
    throw new TypeError('"siteKey" must be a string.');
  }
  if(typeof action !== 'string') {
    throw new TypeError('"action" must be a string.');
  }

  await _waitForRecaptcha({retries, delay});

  try {
    await new Promise(resolve => window.grecaptcha.ready(resolve));
    const token = await window.grecaptcha.execute(siteKey, {action});
    return token;
  } catch(err) {
    throw new Error(`Unable to receive token: ${err.message}`);
  }
}

/**
 * Dynamically injects the reCAPTCHA script tag into the document head.
 *
 * @param {object} options - The options to use.
 * @param {string} options.url - ReCAPTCHA API endpoint.
 *
 * @throws {Error} Wrapped error if the script fails to load.
 */
export async function loadRecaptchaScript({url}) {
  // If already loaded or in progress, return
  if(window.grecaptcha || document.getElementById('recaptcha-script')) {
    return;
  }

  const script = document.createElement('script');
  script.id = 'recaptcha-script';
  script.src = url;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);

  await new Promise((resolve, reject) => {
    script.onload = () => resolve();
    script.onerror = event => {
      // capture original error if any
      let original;
      if(event && event.error instanceof Error) {
        original = event.error;
      } else {
        original = new Error('Unknown error loading reCAPTCHA');
      }
      const wrapped = new Error('Failed to load reCAPTCHA script');
      wrapped.cause = original;
      reject(wrapped);
    };
  });
}
