import { describe, expect, it } from 'vitest';
import {
  basicAuth,
  buildHeaders,
  getRequestCredentials,
  headerAuth,
} from '../src/request';

describe('request helpers', () => {
  it('keeps backward-compatible bearer token auth', () => {
    const headers = buildHeaders(
      { authToken: 'legacy-token' },
      { 'Content-Type': 'application/json' }
    );

    expect(headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer legacy-token',
    });
  });

  it('supports basic authentication', () => {
    const headers = buildHeaders({
      auth: basicAuth('aladdin', 'open sesame'),
    });

    expect(headers.Authorization).toBe('Basic YWxhZGRpbjpvcGVuIHNlc2FtZQ==');
  });

  it('supports custom header-based authentication', () => {
    const headers = buildHeaders(
      {
        auth: headerAuth('X-API-Key', 'secret-key'),
        headers: { 'X-Trace-Id': 'trace-1' },
      },
      { 'Content-Type': 'application/json' }
    );

    expect(headers).toEqual({
      'Content-Type': 'application/json',
      'X-Trace-Id': 'trace-1',
      'X-API-Key': 'secret-key',
    });
  });

  it('does not overwrite an explicit authorization header with authToken fallback', () => {
    const headers = buildHeaders({
      authToken: 'legacy-token',
      headers: { Authorization: 'Token custom-value' },
    });

    expect(headers.Authorization).toBe('Token custom-value');
  });

  it('returns fetch credentials when configured', () => {
    expect(getRequestCredentials({ credentials: 'include' })).toEqual({
      credentials: 'include',
    });
  });
});
