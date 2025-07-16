/*!
 * Copyright (C) 2025 Digital Bazaar, Inc. All rights reserved.
 */

/**
 * Recursively obtains a reCAPTCHA token by loading the grecaptcha script,
 * if necessary.
 *
 * @param {object} [options] - The options to use.
 * @param {string} options.siteKey - ReCAPTCHA site key.
 * @param {string} [options.action='login'] - Action name to pass to execute().
 * @param {number} [options.retries=3] - Number of times to retry checking `grecaptcha` readiness.
 * @param {number} [options.delay] - Delay to retry (in ms).
 *
 * @returns {Promise<string>} Resolves with the reCAPTCHA token.
 * @throws {Error} If the script fails to load after 3 retries,
 * or if execute() rejects.
 */
export async function getRecaptchaToken({
  siteKey, action = 'login', retries = 3, delay = 500} = {}) {
  if(!siteKey || !action) {
    throw new Error('Missing required params');
  }

  for(let retry = 0; retry <= retries; ++retry) {
    if(!window.grecaptcha) {
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    try {
    // Wait for reCAPTCHA to be ready
      await new Promise(resolve => window.grecaptcha.ready(resolve));
      const token = await window.grecaptcha.execute(siteKey, {action});
      return token;
    } catch(error) {
      throw new Error(`Unable to receive token: ${error.message}`);
    }
  }
  throw new Error('reCAPTCHA not ready');
}

/**
 * Dynamically injects the reCAPTCHA script tag into the document head.
 *
 * @param {object} options - The options to use.
 * @param {string} options.siteKey - ReCAPTCHA site key.
 * @param {Function} options.emitFn - Callback to emit events:
 * emitFn(eventName, error).
 *
 * @returns {Promise<void>} Resolves when the script loads, rejects on error.
 * @throws {Error} Wrapped error if the script fails to load.
 */
export function loadRecaptchaScript({siteKey, emitFn}) {
  return new Promise((resolve, reject) => {
    if(window.grecaptcha || document.getElementById('recaptcha-script')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = 'recaptcha-script';
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();

    script.onerror = event => {
      // If browser yields ErrorEvent, pull `error`, otherwise fallback
      let original;
      if(event?.error instanceof Error) {
        original = event.error;
      } else {
        original = new Error('Unknown error loading reCAPTCHA');
      }

      const wrapped = new Error('Failed to load reCAPTCHA script');
      wrapped.cause = original;

      emitFn('error', original);
      reject(wrapped);
    };

    document.head.appendChild(script);
  });
}
