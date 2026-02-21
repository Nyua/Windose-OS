import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = String(argv[i] || '').trim();
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || String(next).startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = String(next);
    i += 1;
  }
  return args;
}

function normalizeNumber(value, fallback, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function normalizeSelectorList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => String(entry || '').trim())
    .filter((entry) => entry.length > 0);
}

function toPublicUrl(publicRoot, absolutePath) {
  const rel = path.relative(publicRoot, absolutePath).replace(/\\/g, '/');
  return `/${rel}`;
}

function normalizeBaseImage(baseImage) {
  const value = String(baseImage || '').trim();
  if (!value) return '';
  return value.startsWith('/') ? value : `/${value.replace(/^\/+/, '')}`;
}

async function safeUnlink(filePath) {
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore remove failures
  }
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readConfig(configPath) {
  const absoluteConfigPath = path.resolve(configPath);
  const raw = await fs.readFile(absoluteConfigPath, 'utf8');
  const parsed = JSON.parse(raw);
  const sites = Array.isArray(parsed.sites) ? parsed.sites : [];
  return {
    configPath: absoluteConfigPath,
    outputManifestPath: String(parsed.outputManifestPath || 'public/internet/snapshots/manifest.generated.json'),
    defaultWaitMs: normalizeNumber(parsed.defaultWaitMs, 1800, 0, 30000),
    navigationTimeoutMs: normalizeNumber(parsed.navigationTimeoutMs, 18000, 1000, 60000),
    defaultViewport: {
      width: normalizeNumber(parsed.defaultViewport?.width, 1366, 320, 3840),
      height: normalizeNumber(parsed.defaultViewport?.height, 860, 240, 3840),
    },
    sites,
  };
}

async function hideSelectors(page, selectors) {
  if (!selectors.length) return;
  await page.evaluate((targetSelectors) => {
    for (const selector of targetSelectors) {
      const nodes = document.querySelectorAll(selector);
      for (const node of nodes) {
        if (!(node instanceof HTMLElement)) continue;
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('visibility', 'hidden', 'important');
        node.style.setProperty('opacity', '0', 'important');
      }
    }
  }, selectors);
}

async function captureSite(page, site, options) {
  const siteId = String(site.id || '').trim();
  const siteUrl = String(site.url || '').trim();
  if (!siteId || !siteUrl) {
    throw new Error(`Site entry is missing required fields: id/url`);
  }

  const viewport = {
    width: normalizeNumber(site.viewport?.width, options.defaultViewport.width, 320, 3840),
    height: normalizeNumber(site.viewport?.height, options.defaultViewport.height, 240, 3840),
  };
  await page.setViewportSize(viewport);
  page.setDefaultNavigationTimeout(options.navigationTimeoutMs);
  await page.goto(siteUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(normalizeNumber(site.waitMs, options.defaultWaitMs, 0, 30000));

  const hideList = normalizeSelectorList(site.hideSelectors);
  await hideSelectors(page, hideList);

  const siteOutputDir = path.join(options.snapshotRoot, siteId);
  await ensureDir(siteOutputDir);
  const fullSnapshotAbs = path.join(siteOutputDir, 'full.png');
  await page.screenshot({ path: fullSnapshotAbs, fullPage: false });

  const captures = Array.isArray(site.captures) ? site.captures : [];
  const layers = [];
  for (const capture of captures) {
    const captureId = String(capture.id || '').trim();
    const selector = String(capture.selector || '').trim();
    const optional = capture.optional !== false;
    if (!captureId || !selector) continue;

    const locator = page.locator(selector).first();
    const count = await locator.count();
    if (count < 1) {
      if (!optional) {
        throw new Error(`Missing required selector "${selector}" for site "${siteId}" capture "${captureId}"`);
      }
      continue;
    }

    const box = await locator.boundingBox();
    if (!box || box.width <= 1 || box.height <= 1) {
      if (!optional) {
        throw new Error(`Invalid bounding box for selector "${selector}"`);
      }
      continue;
    }

    const clipped = {
      x: Math.max(0, Math.floor(box.x)),
      y: Math.max(0, Math.floor(box.y)),
      width: Math.max(1, Math.ceil(Math.min(box.width, viewport.width - box.x))),
      height: Math.max(1, Math.ceil(Math.min(box.height, viewport.height - box.y))),
    };
    if (clipped.width <= 1 || clipped.height <= 1) {
      continue;
    }

    const layerAbs = path.join(siteOutputDir, `${captureId}.png`);
    await page.screenshot({ path: layerAbs, clip: clipped });
    layers.push({
      id: captureId,
      src: toPublicUrl(options.publicRoot, layerAbs),
      x: clipped.x,
      y: clipped.y,
      width: clipped.width,
      height: clipped.height,
      mode: capture.mode === 'overlay' ? 'overlay' : 'replace',
    });
  }

  return {
    id: siteId,
    data: {
      fullSnapshot: toPublicUrl(options.publicRoot, fullSnapshotAbs),
      baseImage: normalizeBaseImage(site.baseImage),
      canvasWidth: viewport.width,
      canvasHeight: viewport.height,
      layers,
      updatedAt: new Date().toISOString(),
    },
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const configPath = String(args.config || 'snapshot-config/sites.config.json');
  const siteFilter = args.site ? String(args.site) : '';
  const dryRun = Boolean(args['dry-run']);

  const config = await readConfig(configPath);
  const workspaceRoot = path.dirname(config.configPath).includes('snapshot-config')
    ? path.resolve(path.dirname(config.configPath), '..')
    : process.cwd();
  const publicRoot = path.resolve(workspaceRoot, 'public');
  const snapshotRoot = path.resolve(publicRoot, 'internet/snapshots');
  const outputManifestAbs = path.resolve(workspaceRoot, config.outputManifestPath);

  await ensureDir(snapshotRoot);
  await ensureDir(path.dirname(outputManifestAbs));

  const sites = siteFilter
    ? config.sites.filter((site) => String(site?.id || '') === siteFilter)
    : config.sites;

  if (!sites.length) {
    throw new Error(siteFilter
      ? `No site found with id "${siteFilter}" in config`
      : 'No sites configured');
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    sourceConfig: path.relative(workspaceRoot, config.configPath).replace(/\\/g, '/'),
    sites: {},
  };

  try {
    for (const site of sites) {
      const siteId = String(site?.id || '').trim();
      if (!siteId) continue;
      process.stdout.write(`\n[update-site-snapshots] Capturing ${siteId}...\n`);
      try {
        const result = await captureSite(page, site, {
          defaultViewport: config.defaultViewport,
          defaultWaitMs: config.defaultWaitMs,
          navigationTimeoutMs: config.navigationTimeoutMs,
          snapshotRoot,
          publicRoot,
        });
        manifest.sites[result.id] = result.data;
        process.stdout.write(`[update-site-snapshots] done: ${siteId}\n`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        process.stdout.write(`[update-site-snapshots] failed: ${siteId} -> ${message}\n`);
        if (!dryRun) {
          const siteOutputDir = path.join(snapshotRoot, siteId);
          await safeUnlink(path.join(siteOutputDir, 'full.png'));
        }
      }
    }
  } finally {
    await context.close();
    await browser.close();
  }

  if (!dryRun) {
    await fs.writeFile(outputManifestAbs, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    process.stdout.write(`[update-site-snapshots] manifest written: ${outputManifestAbs}\n`);
  } else {
    process.stdout.write('[update-site-snapshots] dry-run mode; manifest not written.\n');
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  process.stderr.write(`[update-site-snapshots] ERROR: ${message}\n`);
  process.exit(1);
});
