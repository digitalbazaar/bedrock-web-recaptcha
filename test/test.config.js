/*
 * Copyright (C) 2025 Digital Bazaar, Inc. All rights reserved.
 */
import {config} from '@bedrock/core';
import path from 'node:path';

config.mocha.tests.push(path.join(import.meta.dirname, 'mocha'));

// allow self-signed certs in test framework
config['https-agent'].rejectUnauthorized = false;
