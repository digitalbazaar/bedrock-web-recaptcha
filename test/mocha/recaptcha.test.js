/*!
 * Copyright (c) 2025 Digital Bazaar, Inc. All rights reserved.
 */
import {getRecaptchaToken, loadRecaptchaScript} from '@bedrock/web-recaptcha';
import {strict as assert} from 'node:assert';

describe('getRecaptchaToken', () => {
  it('resolves with token when grecaptcha is ready', async () => {
    window.grecaptcha = {
      ready: cb => cb(),
      execute: () => Promise.resolve('TOK')
    };
    const token = await getRecaptchaToken({siteKey: 'K'});
    assert.equal(token, 'TOK');
  });

  it('rejects immediately for unacceptable siteKey', () => {
    return assert.rejects(
      getRecaptchaToken({siteKey: undefined}),
      {message: '"siteKey" must be a string.'}
    );
  });

  it('rejects immediately for unacceptable action', () => {
    return assert.rejects(
      getRecaptchaToken({siteKey: 'A', action: null}),
      {message: '"action" must be a string.'}
    );
  });

  it('rejects non-allowable retry integer', () => {
    return assert.rejects(
      getRecaptchaToken({siteKey: 'A', retries: -1}),
      {message: 'reCAPTCHA script failed to load'}
    );
  });
});

describe('loadRecaptchaScript', () => {
  beforeEach(() => {
    // Remove pre-existing grecaptcha.
    delete window.grecaptcha;
    // Remove any leftover recaptcha-script tag
    const old = document.getElementById('recaptcha-script');
    if(old) {
      old.remove();
    }
  });

  it('injects a <script> and resolves on load', async () => {
    const p = loadRecaptchaScript({url: 'fake-url'});
    const script = document.getElementById('recaptcha-script');
    assert.ok(script, 'should have appended a <script> element');
    script.onload(); // simulate load
    await p;
  });

  it('rejects when onerror fires', async () => {
    const p = loadRecaptchaScript({url: 'fake-url'});
    const script = document.getElementById('recaptcha-script');
    script.onerror(); // simulate error
    await assert.rejects(p);
  });
});
