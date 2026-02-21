import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import process from 'node:process';
import { chromium } from 'playwright';

const HOST = process.env.REMOTE_BROWSER_HOST || '0.0.0.0';
const PORT = Number(process.env.REMOTE_BROWSER_PORT || 8791);
const MAX_SESSIONS = Number(process.env.REMOTE_BROWSER_MAX_SESSIONS || 4);
const SESSION_TTL_MS = Number(process.env.REMOTE_BROWSER_SESSION_TTL_MS || 1000 * 60 * 8);
const CLEANUP_EVERY_MS = Number(process.env.REMOTE_BROWSER_CLEANUP_INTERVAL_MS || 1000 * 30);
const NAVIGATION_TIMEOUT_MS = Number(process.env.REMOTE_BROWSER_NAV_TIMEOUT_MS || 15000);
const DEFAULT_VIEWPORT_WIDTH = Number(process.env.REMOTE_BROWSER_DEFAULT_WIDTH || 1366);
const DEFAULT_VIEWPORT_HEIGHT = Number(process.env.REMOTE_BROWSER_DEFAULT_HEIGHT || 860);
const DEFAULT_SNAPSHOT_WAIT_MS = Number(process.env.REMOTE_BROWSER_SNAPSHOT_WAIT_MS || 1050);
const ALLOWED_HOSTS = new Set(
  String(
    process.env.REMOTE_BROWSER_ALLOWED_HOSTS
      || 'x.com,www.youtube.com,youtube.com,steamcommunity.com,www.last.fm,last.fm,open.spotify.com',
  )
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0),
);

/** @type {Promise<import('playwright').Browser>} */
const browserPromise = chromium.launch({
  headless: true,
  args: ['--disable-dev-shm-usage'],
});

/** @typedef {{ selector: string, styles: Record<string, string> }} StylePatch */
/** @typedef {{ selector: string, text: string }} TextPatch */
/** @typedef {{ mode: 'css' | 'xpath', value: string }} TargetSpec */
/** @typedef {{ removeSelectors: string[], removeTargetSpecs: TargetSpec[], stylePatches: StylePatch[], textPatches: TextPatch[] }} DomMutations */
/** @typedef {{ key: string, selector: string, attr: string, property: 'text' | 'innerText' | 'html', all: boolean, limit: number, preserveEmpty: boolean }} ExtractField */
/** @typedef {{ id: string, context: import('playwright').BrowserContext, page: import('playwright').Page, url: string, width: number, height: number, removeSelectors: string[], createdAt: number, lastActive: number }} RemoteSession */
/** @type {Map<string, RemoteSession>} */
const sessions = new Map();

function now() {
  return Date.now();
}

function touch(session) {
  session.lastActive = now();
}

function clampViewport(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(320, Math.min(3840, Math.round(parsed)));
}

function clampWaitMs(value, fallback = DEFAULT_SNAPSHOT_WAIT_MS) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return Math.max(0, fallback);
  return Math.max(0, Math.min(12000, Math.round(parsed)));
}

function clampScrollSteps(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(32, Math.round(parsed)));
}

function clampScrollBy(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(3200, Math.round(parsed)));
}

function normalizeImageFormat(value) {
  return String(value || '').trim().toLowerCase() === 'png' ? 'png' : 'jpeg';
}

function clampImageQuality(value, fallback = 82) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(20, Math.min(95, Math.round(parsed)));
}

function isHttpUrl(raw) {
  try {
    const parsed = new URL(String(raw || '').trim());
    if (!(parsed.protocol === 'http:' || parsed.protocol === 'https:')) return false;
    const host = parsed.hostname.toLowerCase();
    if (!ALLOWED_HOSTS.has(host)) return false;
    return true;
  } catch {
    return false;
  }
}

function normalizeSelectors(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || '').trim())
    .filter((item) => item.length > 0)
    .slice(0, 24);
}

function normalizeTargetSpec(raw) {
  const value = String(raw || '').trim();
  if (!value) return null;
  if (value.length > 420) return null;

  const prefixedMatch = value.match(/^([a-zA-Z]+)\s*:\s*(.+)$/);
  if (prefixedMatch) {
    const mode = prefixedMatch[1].toLowerCase();
    const body = prefixedMatch[2].trim();
    if (!body) return null;
    if (mode === 'css' || mode === 'selector') {
      return { mode: 'css', value: body };
    }
    if (mode === 'xpath') {
      return { mode: 'xpath', value: body };
    }
  }

  if (value.startsWith('/') || (value.startsWith('(') && value.includes('//'))) {
    return { mode: 'xpath', value };
  }
  return { mode: 'css', value };
}

function normalizeTargetSpecs(value) {
  if (!Array.isArray(value)) return [];
  const normalized = [];
  const dedupe = new Set();
  for (const raw of value) {
    const target = normalizeTargetSpec(raw);
    if (!target) continue;
    const dedupeKey = `${target.mode}:${target.value}`;
    if (dedupe.has(dedupeKey)) continue;
    dedupe.add(dedupeKey);
    normalized.push(target);
    if (normalized.length >= 24) break;
  }
  return normalized;
}

function normalizeStylePatches(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const selector = String(entry.selector || '').trim();
      if (!selector) return null;
      const rawStyles = entry.styles && typeof entry.styles === 'object' ? entry.styles : {};
      const styles = {};
      for (const [rawName, rawValue] of Object.entries(rawStyles)) {
        const name = String(rawName || '').trim();
        if (!name || !/^[-_a-zA-Z0-9]+$/.test(name)) continue;
        const valueText = String(rawValue || '').trim();
        if (!valueText) continue;
        styles[name] = valueText.slice(0, 220);
      }
      if (!Object.keys(styles).length) return null;
      return { selector, styles };
    })
    .filter(Boolean)
    .slice(0, 24);
}

function normalizeTextPatches(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const selector = String(entry.selector || '').trim();
      if (!selector) return null;
      const text = String(entry.text || '').slice(0, 2000);
      return { selector, text };
    })
    .filter(Boolean)
    .slice(0, 24);
}

function normalizeExtractProperty(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'innertext') return 'innerText';
  if (normalized === 'html') return 'html';
  return 'text';
}

function normalizeExtractFields(value) {
  if (!Array.isArray(value)) return [];
  const fields = [];
  const dedupe = new Set();

  for (let index = 0; index < value.length; index += 1) {
    const entry = value[index];
    if (!entry || typeof entry !== 'object') continue;

    const keyRaw = String(entry.key || `field_${index}`).trim().toLowerCase();
    const key = keyRaw.replace(/[^a-z0-9_-]/g, '_').slice(0, 48);
    if (!key) continue;

    const selector = String(entry.selector || '').trim();
    if (!selector || selector.length > 420) continue;

    const dedupeKey = `${key}:${selector}`;
    if (dedupe.has(dedupeKey)) continue;
    dedupe.add(dedupeKey);

    const attr = String(entry.attr || '').trim().slice(0, 48);
    const property = normalizeExtractProperty(entry.property);
    const all = Boolean(entry.all);
    const preserveEmpty = Boolean(entry.preserveEmpty);
    const limitParsed = Number(entry.limit);
    const limit = Number.isFinite(limitParsed)
      ? Math.max(1, Math.min(200, Math.round(limitParsed)))
      : 8;

    fields.push({
      key,
      selector,
      attr,
      property,
      all,
      limit,
      preserveEmpty,
    });

    if (fields.length >= 40) break;
  }

  return fields;
}

function normalizeDomMutations(payload) {
  const targetSpecs = normalizeTargetSpecs(payload?.removeSelectors);
  return {
    removeSelectors: targetSpecs.map((target) => `${target.mode}:${target.value}`),
    removeTargetSpecs: targetSpecs,
    stylePatches: normalizeStylePatches(payload?.stylePatches),
    textPatches: normalizeTextPatches(payload?.textPatches),
  };
}

async function readJsonBody(request) {
  return await new Promise((resolve, reject) => {
    let data = '';
    request.on('data', (chunk) => {
      data += chunk;
      if (data.length > 256_000) {
        reject(new Error('Request body too large'));
        request.destroy();
      }
    });
    request.on('end', () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    request.on('error', reject);
  });
}

function setCorsHeaders(response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(response, statusCode, payload) {
  setCorsHeaders(response);
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

function sendImage(response, statusCode, buffer, contentType) {
  setCorsHeaders(response);
  response.statusCode = statusCode;
  response.setHeader('Content-Type', contentType);
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.end(buffer);
}

async function applyDomMutations(page, mutations) {
  const removeTargetSpecs = Array.isArray(mutations.removeTargetSpecs)
    ? mutations.removeTargetSpecs
    : normalizeTargetSpecs(mutations.removeSelectors || []);
  if (
    !removeTargetSpecs.length
    && !mutations.stylePatches.length
    && !mutations.textPatches.length
  ) {
    return;
  }
  const payload = {
    removeTargetSpecs,
    stylePatches: Array.isArray(mutations.stylePatches) ? mutations.stylePatches : [],
    textPatches: Array.isArray(mutations.textPatches) ? mutations.textPatches : [],
  };
  await page.evaluate(async (payload) => {
    const removeNode = (node) => {
      if (!node) return;
      try {
        if (node instanceof HTMLElement) {
          node.setAttribute('data-windose-hidden', '1');
          node.style.setProperty('display', 'none', 'important');
          node.style.setProperty('visibility', 'hidden', 'important');
          node.style.setProperty('opacity', '0', 'important');
        }
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      } catch {
        // ignore per-node removal failures
      }
    };

    const resolveTargets = (target) => {
      try {
        if (target.mode === 'xpath') {
          const snapshot = document.evaluate(
            target.value,
            document,
            null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null,
          );
          const nodes = [];
          for (let index = 0; index < snapshot.snapshotLength; index += 1) {
            const item = snapshot.snapshotItem(index);
            if (item) nodes.push(item);
          }
          return nodes;
        }
        return [...document.querySelectorAll(target.value)];
      } catch {
        return [];
      }
    };

    const runRemovalPass = () => {
      for (const target of payload.removeTargetSpecs) {
        const nodes = resolveTargets(target);
        for (const node of nodes) {
          removeNode(node);
        }
      }
    };

    runRemovalPass();
    await new Promise((resolve) => setTimeout(resolve, 40));
    runRemovalPass();
    await new Promise((resolve) => setTimeout(resolve, 40));
    runRemovalPass();

    for (const patch of payload.stylePatches) {
      const nodes = resolveTargets({ mode: 'css', value: patch.selector });
      for (const node of nodes) {
        if (!(node instanceof HTMLElement)) continue;
        for (const [name, value] of Object.entries(patch.styles)) {
          node.style.setProperty(name, value, 'important');
        }
      }
    }

    for (const patch of payload.textPatches) {
      const nodes = resolveTargets({ mode: 'css', value: patch.selector });
      for (const node of nodes) {
        node.textContent = patch.text;
      }
    }
  }, payload);
}

async function applySelectorMutations(page, selectors) {
  const removeTargetSpecs = normalizeTargetSpecs(selectors);
  await applyDomMutations(page, {
    removeSelectors: removeTargetSpecs.map((target) => `${target.mode}:${target.value}`),
    removeTargetSpecs,
    stylePatches: [],
    textPatches: [],
  });
}

async function closeSession(sessionId) {
  const existing = sessions.get(sessionId);
  if (!existing) return false;
  sessions.delete(sessionId);
  try {
    await existing.context.close();
  } catch {
    // ignore
  }
  return true;
}

async function enforceMaxSessions() {
  if (sessions.size < MAX_SESSIONS) return;
  const sortedByAge = [...sessions.values()].sort((a, b) => a.lastActive - b.lastActive);
  const toClose = sortedByAge.slice(0, sessions.size - MAX_SESSIONS + 1);
  for (const session of toClose) {
    await closeSession(session.id);
  }
}

async function createSession(payload) {
  const browser = await browserPromise;
  await enforceMaxSessions();

  const targetUrl = String(payload.url || '').trim();
  if (!isHttpUrl(targetUrl)) {
    throw new Error('Invalid URL: host is not allowed');
  }

  const width = clampViewport(payload.width, DEFAULT_VIEWPORT_WIDTH);
  const height = clampViewport(payload.height, DEFAULT_VIEWPORT_HEIGHT);
  const removeSelectors = normalizeSelectors(payload.removeSelectors);

  const context = await browser.newContext({
    viewport: { width, height },
  });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  await applySelectorMutations(page, removeSelectors);

  const id = randomUUID();
  const createdAt = now();
  /** @type {RemoteSession} */
  const session = {
    id,
    context,
    page,
    url: targetUrl,
    width,
    height,
    removeSelectors,
    createdAt,
    lastActive: createdAt,
  };
  sessions.set(id, session);
  return session;
}

function parseSessionId(urlPath) {
  const match = urlPath.match(/^\/session\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function handleStartSession(request, response) {
  const payload = await readJsonBody(request);
  const session = await createSession(payload);
  sendJson(response, 200, {
    sessionId: session.id,
    url: session.url,
    viewport: { width: session.width, height: session.height },
    removeSelectors: session.removeSelectors,
    createdAt: session.createdAt,
  });
}

async function handleSnapshot(request, response) {
  const payload = await readJsonBody(request);
  const targetUrl = String(payload.url || '').trim();
  if (!isHttpUrl(targetUrl)) {
    sendJson(response, 400, { error: 'Invalid URL: host is not allowed' });
    return;
  }

  const width = clampViewport(payload.width, DEFAULT_VIEWPORT_WIDTH);
  const height = clampViewport(payload.height, DEFAULT_VIEWPORT_HEIGHT);
  const waitMs = clampWaitMs(payload.waitMs, DEFAULT_SNAPSHOT_WAIT_MS);
  const format = normalizeImageFormat(payload.format);
  const quality = clampImageQuality(payload.quality, 82);
  const mutations = normalizeDomMutations(payload);

  const browser = await browserPromise;
  const context = await browser.newContext({
    viewport: { width, height },
  });

  try {
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    if (waitMs > 0) {
      await page.waitForTimeout(waitMs);
    }
    await applyDomMutations(page, mutations);
    const buffer = await page.screenshot({
      type: format,
      quality: format === 'jpeg' ? quality : undefined,
      fullPage: false,
    });
    sendImage(response, 200, buffer, format === 'png' ? 'image/png' : 'image/jpeg');
  } finally {
    try {
      await context.close();
    } catch {
      // ignore
    }
  }
}

async function handleExtract(request, response) {
  const payload = await readJsonBody(request);
  const targetUrl = String(payload.url || '').trim();
  if (!isHttpUrl(targetUrl)) {
    sendJson(response, 400, { error: 'Invalid URL: host is not allowed' });
    return;
  }

  const fields = normalizeExtractFields(payload.fields);
  if (!fields.length) {
    sendJson(response, 400, { error: 'No extract fields provided' });
    return;
  }

  const width = clampViewport(payload.width, DEFAULT_VIEWPORT_WIDTH);
  const height = clampViewport(payload.height, DEFAULT_VIEWPORT_HEIGHT);
  const waitMs = clampWaitMs(payload.waitMs, Math.max(DEFAULT_SNAPSHOT_WAIT_MS, 1600));
  const scrollSteps = clampScrollSteps(payload.scrollSteps);
  const scrollBy = clampScrollBy(payload.scrollBy, 0);
  const scrollWaitMs = clampWaitMs(payload.scrollWaitMs, 260);
  const passCount = Math.max(1, 1 + scrollSteps);

  const browser = await browserPromise;
  const context = await browser.newContext({
    viewport: { width, height },
  });

  try {
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    if (waitMs > 0) {
      await page.waitForTimeout(waitMs);
    }

    /** @type {Record<string, string | string[] | null>} */
    const data = {};
    /** @type {Map<string, Set<string>>} */
    const seenByField = new Map();
    for (const field of fields) {
      data[field.key] = field.all ? [] : '';
      if (field.all) {
        seenByField.set(field.key, new Set());
      }
    }

    const extractPass = async () => await page.evaluate((extractFields) => {
      const normalizeValue = (raw) => String(raw || '').replace(/\s+/g, ' ').trim();
      const normalizeHtmlValue = (raw) => String(raw || '').trim();

      const readNode = (node, field) => {
        if (!(node instanceof Element)) return '';
        if (field.attr) {
          return normalizeValue(node.getAttribute(field.attr));
        }
        if (field.property === 'html') {
          return normalizeHtmlValue(node.innerHTML);
        }
        if (field.property === 'innerText' && node instanceof HTMLElement) {
          return normalizeValue(node.innerText);
        }
        return normalizeValue(node.textContent);
      };

      const result = {};

      for (const field of extractFields) {
        let nodes = [];
        try {
          nodes = [...document.querySelectorAll(field.selector)];
        } catch {
          nodes = [];
        }

        if (!nodes.length) {
          result[field.key] = field.all ? [] : '';
          continue;
        }

        if (field.all) {
          result[field.key] = nodes
            .slice(0, Math.max(1, field.limit))
            .map((node) => readNode(node, field))
            .filter((value) => field.preserveEmpty ? true : Boolean(value));
          continue;
        }

        result[field.key] = readNode(nodes[0], field);
      }

      return result;
    }, fields);

    for (let passIndex = 0; passIndex < passCount; passIndex += 1) {
      const passData = await extractPass();

      for (const field of fields) {
        const key = field.key;
        const passValue = passData[key];
        if (!field.all) {
          const nextValue = String(passValue || '');
          if (nextValue) data[key] = nextValue;
          continue;
        }

        const passValues = Array.isArray(passValue) ? passValue : [];
        const target = Array.isArray(data[key]) ? data[key] : [];
        const seen = seenByField.get(key) ?? new Set();

        for (const rawEntry of passValues) {
          const entry = String(rawEntry || '');
          if (!field.preserveEmpty && !entry) continue;
          if (entry && seen.has(entry)) continue;
          if (entry) seen.add(entry);
          target.push(entry);
          if (target.length >= field.limit) break;
        }

        data[key] = target;
        seenByField.set(key, seen);
      }

      if (passIndex >= passCount - 1) continue;
      if (scrollBy > 0) {
        await page.evaluate((delta) => {
          window.scrollBy(0, delta);
        }, scrollBy);
      }
      if (scrollWaitMs > 0) {
        await page.waitForTimeout(scrollWaitMs);
      }
    }

    sendJson(response, 200, {
      ok: true,
      url: targetUrl,
      capturedAt: new Date().toISOString(),
      data,
    });
  } finally {
    try {
      await context.close();
    } catch {
      // ignore
    }
  }
}

async function handleGetFrame(response, session, url) {
  touch(session);
  const format = url.searchParams.get('format') === 'png' ? 'png' : 'jpeg';
  const qualityRaw = Number(url.searchParams.get('quality') || 72);
  const quality = Number.isFinite(qualityRaw) ? Math.max(20, Math.min(95, Math.round(qualityRaw))) : 72;
  await applySelectorMutations(session.page, session.removeSelectors);
  const buffer = await session.page.screenshot({
    type: format,
    quality: format === 'jpeg' ? quality : undefined,
    fullPage: false,
  });
  sendImage(response, 200, buffer, format === 'png' ? 'image/png' : 'image/jpeg');
}

async function handleNavigate(request, response, session) {
  const payload = await readJsonBody(request);
  const targetUrl = String(payload.url || '').trim();
  if (!isHttpUrl(targetUrl)) {
    sendJson(response, 400, { error: 'Invalid URL' });
    return;
  }
  await session.page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  session.url = targetUrl;
  touch(session);
  await applySelectorMutations(session.page, session.removeSelectors);
  sendJson(response, 200, { ok: true, url: session.url });
}

async function handleViewport(request, response, session) {
  const payload = await readJsonBody(request);
  const width = clampViewport(payload.width, session.width);
  const height = clampViewport(payload.height, session.height);
  await session.page.setViewportSize({ width, height });
  session.width = width;
  session.height = height;
  touch(session);
  sendJson(response, 200, { ok: true, viewport: { width, height } });
}

async function handleInput(request, response, session) {
  const payload = await readJsonBody(request);
  const type = String(payload.type || '').trim();
  touch(session);

  if (type === 'click') {
    const x = Number(payload.x);
    const y = Number(payload.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      sendJson(response, 400, { error: 'Invalid click coordinates' });
      return;
    }
    const button = payload.button === 'right' ? 'right' : payload.button === 'middle' ? 'middle' : 'left';
    await session.page.mouse.click(Math.round(x), Math.round(y), { button });
    sendJson(response, 200, { ok: true });
    return;
  }

  if (type === 'move') {
    const x = Number(payload.x);
    const y = Number(payload.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      sendJson(response, 400, { error: 'Invalid move coordinates' });
      return;
    }
    await session.page.mouse.move(Math.round(x), Math.round(y));
    sendJson(response, 200, { ok: true });
    return;
  }

  if (type === 'wheel') {
    const deltaX = Number(payload.deltaX || 0);
    const deltaY = Number(payload.deltaY || 0);
    await session.page.mouse.wheel(deltaX, deltaY);
    sendJson(response, 200, { ok: true });
    return;
  }

  if (type === 'key') {
    const key = String(payload.key || '').trim();
    if (!key) {
      sendJson(response, 400, { error: 'Invalid key input' });
      return;
    }
    await session.page.keyboard.press(key);
    sendJson(response, 200, { ok: true });
    return;
  }

  if (type === 'type') {
    const text = String(payload.text || '');
    if (!text) {
      sendJson(response, 400, { error: 'Invalid text input' });
      return;
    }
    await session.page.keyboard.type(text);
    sendJson(response, 200, { ok: true });
    return;
  }

  sendJson(response, 400, { error: `Unsupported input type: ${type}` });
}

async function closeAllSessions() {
  const ids = [...sessions.keys()];
  for (const id of ids) {
    await closeSession(id);
  }
}

const cleanupTimer = setInterval(async () => {
  const cutoff = now() - SESSION_TTL_MS;
  const stale = [...sessions.values()].filter((session) => session.lastActive < cutoff);
  for (const session of stale) {
    await closeSession(session.id);
  }
}, CLEANUP_EVERY_MS);

const server = createServer(async (request, response) => {
  try {
    if (!request.url) {
      sendJson(response, 400, { error: 'Missing URL' });
      return;
    }

    const url = new URL(request.url, `http://${request.headers.host || `${HOST}:${PORT}`}`);
    const path = url.pathname;
    const method = (request.method || 'GET').toUpperCase();

    if (method === 'OPTIONS') {
      setCorsHeaders(response);
      response.statusCode = 204;
      response.end();
      return;
    }

    if (path === '/health' && method === 'GET') {
      sendJson(response, 200, {
        ok: true,
        sessions: sessions.size,
        maxSessions: MAX_SESSIONS,
      });
      return;
    }

    if (path === '/snapshot' && method === 'POST') {
      await handleSnapshot(request, response);
      return;
    }

    if (path === '/extract' && method === 'POST') {
      await handleExtract(request, response);
      return;
    }

    if (path === '/session/start' && method === 'POST') {
      await handleStartSession(request, response);
      return;
    }

    const sessionId = parseSessionId(path);
    if (!sessionId) {
      sendJson(response, 404, { error: 'Not found' });
      return;
    }

    const session = sessions.get(sessionId);
    if (!session) {
      sendJson(response, 404, { error: 'Session not found' });
      return;
    }

    if (path === `/session/${encodeURIComponent(sessionId)}/frame` && method === 'GET') {
      await handleGetFrame(response, session, url);
      return;
    }

    if (path === `/session/${encodeURIComponent(sessionId)}/navigate` && method === 'POST') {
      await handleNavigate(request, response, session);
      return;
    }

    if (path === `/session/${encodeURIComponent(sessionId)}/viewport` && method === 'POST') {
      await handleViewport(request, response, session);
      return;
    }

    if (path === `/session/${encodeURIComponent(sessionId)}/input` && method === 'POST') {
      await handleInput(request, response, session);
      return;
    }

    if (path === `/session/${encodeURIComponent(sessionId)}` && method === 'DELETE') {
      await closeSession(sessionId);
      sendJson(response, 200, { ok: true });
      return;
    }

    sendJson(response, 404, { error: 'Not found' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    sendJson(response, 500, { error: message });
  }
});

async function shutdown(exitCode = 0) {
  clearInterval(cleanupTimer);
  server.close();
  await closeAllSessions();
  try {
    const browser = await browserPromise;
    await browser.close();
  } catch {
    // ignore browser close errors
  }
  process.exit(exitCode);
}

process.on('SIGINT', () => {
  void shutdown(0);
});

process.on('SIGTERM', () => {
  void shutdown(0);
});

server.listen(PORT, HOST, () => {
  console.log(`[remote-browser] listening on http://${HOST}:${PORT}`);
});
