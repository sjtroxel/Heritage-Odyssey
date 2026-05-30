/**
 * Custom promptfoo provider for Heritage Odyssey's SSE narrative endpoint.
 *
 * /api/narrative/generate returns text/event-stream, not JSON, so promptfoo's
 * stock http provider cannot be used. This module:
 *   1. Authenticates via the demo login endpoint (token cached for the session).
 *   2. POSTs the query with an eval-bypass header (skips both rate limiters).
 *   3. Reads the full SSE body and extracts the `complete` event's `.text` field.
 *   4. Returns { output: { type: 'handoff' } } when the retrieval confidence is too
 *      low (so the handoff assertion can match it as an object, not a string).
 */

let _cachedToken = null;

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

async function getToken(apiUrl) {
  if (!_cachedToken) {
    _cachedToken = await fetchDemoToken(apiUrl);
  }
  return _cachedToken;
}

function buildHeaders(token) {
  const bypassToken = process.env.EVAL_BYPASS_TOKEN;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  if (bypassToken) headers['x-eval-bypass'] = bypassToken;
  return headers;
}

async function postNarrative(apiUrl, token, query) {
  return fetch(`${apiUrl}/api/narrative/generate`, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify({ query }),
  });
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

export async function callApi(prompt, _context, _options) {
  const apiUrl = (
    process.env.E2E_API_URL || 'https://heritage-odyssey.up.railway.app'
  ).replace(/\/$/, '');

  let token = await getToken(apiUrl);
  let resp = await postNarrative(apiUrl, token, prompt);

  // Re-authenticate once on 401 (access token expired mid-run)
  if (resp.status === 401) {
    _cachedToken = null;
    token = await getToken(apiUrl);
    resp = await postNarrative(apiUrl, token, prompt);
  }

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Narrative API error: ${resp.status} ${body}`);
  }

  const body = await resp.text();
  const result = parseSSEBody(body);
  if (result) return result;

  throw new Error(
    'No complete or handoff event in SSE stream. Raw body (first 200 chars): ' +
      body.slice(0, 200),
  );
}
