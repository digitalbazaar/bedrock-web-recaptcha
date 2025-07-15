/*!
 * Copyright (C) 2025 Digital Bazaar, Inc. All rights reserved.
 */
import {getRecaptchaToken, loadRecaptchaScript} from '../../lib/recaptcha.js';
import {strict as assert} from 'node:assert';

describe('getRecaptchaToken', () => {
  it('resolves with token when grecaptcha is ready', async () => {
    window.grecaptcha = {
      ready: cb => cb(),
      execute: () => Promise.resolve('TOK')
    };
    const token = await getRecaptchaToken({siteKey: 'K', action: 'A'});
    assert.equal(token, 'TOK');
  });

  it('rejects immediately if retried too many times', () => {
    return assert.rejects(
      getRecaptchaToken({siteKey: 'K', action: 'A', i: 4}),
      {message: 'Unable to load reCAPTCHA script'}
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
    const p = loadRecaptchaScript({siteKey: 'test-site-key', emitFn: () => {}});
    const script = document.getElementById('recaptcha-script');
    assert.ok(script, 'should have appended a <script> element');
    assert.ok(
      script.src.includes('render=test-site-key'),
      'src must include your siteKey');
    script.onload(); // simulate load
    await p;
  });

  it('rejects when onerror fires', async () => {
    const p = loadRecaptchaScript({siteKey: 'test-site-key', emitFn: () => {}});
    const script = document.getElementById('recaptcha-script');
    script.onerror(); // simulate error
    await assert.rejects(p);
  });
});
