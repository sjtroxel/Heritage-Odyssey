/**
 * Custom promptfoo provider for Heritage Odyssey's SSE narrative endpoint.
 * Must be a default-exported class — promptfoo 0.120.x instantiates file://
 * providers with `new Provider({})`, so a named callApi export won't work.
 *
 * Flow: demo login → cache JWT → POST query with eval-bypass header →
 *   read full SSE body → return complete.text or { type: 'handoff' }.
 */

async function fetchDemoToken(apiUrl) {
  const resp = await fetch(`${apiUrl}/api/auth/demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!resp.ok) {
    throw new Error(`Demo auth failed: ${resp.status} ${await resp.text()}`);
  }
  const data = await resp.json();
  return data.accessToken;
}

function parseSSEBody(body) {
  for (const line of body.split('\n')) {
    if (!line.startsWith('data: ')) continue;
    try {
      const event = JSON.parse(line.slice(6));
      if (event.type === 'complete') return { output: event.text };
      if (event.type === 'handoff') return { output: { type: 'handoff' } };
    } catch {
      // Non-JSON data line — skip
    }
  }
  return null;
}

export default class HeritageOdysseyProvider {
  constructor() {
    this._cachedToken = null;
  }

  id() {
    return 'heritage-odyssey-narrative';
  }

  async _getToken(apiUrl) {
    if (!this._cachedToken) {
      this._cachedToken = await fetchDemoToken(apiUrl);
    }
    return this._cachedToken;
  }

  _buildHeaders(token) {
    const bypassToken = process.env.EVAL_BYPASS_TOKEN;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    if (bypassToken) headers['x-eval-bypass'] = bypassToken;
    return headers;
  }

  async _post(apiUrl, token, query) {
    return fetch(`${apiUrl}/api/narrative/generate`, {
      method: 'POST',
      headers: this._buildHeaders(token),
      body: JSON.stringify({ query }),
    });
  }

  async callApi(prompt, _context, _options) {
    const apiUrl = (
      process.env.E2E_API_URL || 'https://heritage-odyssey.up.railway.app'
    ).replace(/\/$/, '');

    let token = await this._getToken(apiUrl);
    let resp = await this._post(apiUrl, token, prompt);

    // Re-authenticate once on 401 (access token expired mid-run)
    if (resp.status === 401) {
      this._cachedToken = null;
      token = await this._getToken(apiUrl);
      resp = await this._post(apiUrl, token, prompt);
    }

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Narrative API error: ${resp.status} ${body}`);
    }

    const body = await resp.text();
    const result = parseSSEBody(body);
    if (result) return result;

    throw new Error(
      'No complete or handoff event in SSE stream. Body (first 200 chars): ' +
        body.slice(0, 200),
    );
  }
}
