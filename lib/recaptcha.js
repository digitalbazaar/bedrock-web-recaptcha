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
 * @param {number} [options.i] - Retry attempt counter (internal use).
 * @returns {Promise<string>} Resolves with the reCAPTCHA token.
 * @throws {Error} If the script fails to load after 3 retries,
 * or if execute() rejects.
 */
export async function getRecaptchaToken({siteKey, action, i} = {
  action: 'login'}) {
  let token;

  if(i) {
    if(i > 3) {
      throw new Error('Unable to load reCAPTCHA script');
    }
    // If not 1st try wait 0.5 seconds before retrying, to let script load.
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  if(!window.grecaptcha) {
    return getRecaptchaToken({
      siteKey, action, i: !i ? 1 : i + 1
    });
  }

  try {
    // Wait for reCAPTCHA to be ready
    await new Promise(resolve => window.grecaptcha.ready(resolve));
    token = await window.grecaptcha.execute(siteKey, {action});
  } catch(error) {
    throw new Error(`Unable to receive token: ${error.message}`);
  }
  return token;
}

/**
 * Dynamically injects the reCAPTCHA script tag into the document head.
 *
 * @param {object} options - The options to use.
 * @param {string} options.siteKey - ReCAPTCHA site key.
 * @param {Function} options.emitFn - Callback to emit events:
 * emitFn(eventName, error).
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
      //If the browser yields ErrorEvent, attempt to pull `error`; else fallback
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
