const root = document.querySelector('.corner-shell');
const cssRoot = document.documentElement;
const biosLog = document.querySelector('.bios-log');
const biosScreen = document.querySelector('.bios-screen');
const biosStage = document.querySelector('.bios-stage');
const terminalOutput = document.querySelector('#terminal-output');
const terminalForm = document.querySelector('#terminal-form');
const terminalInput = document.querySelector('#terminal-input');
const terminalHeart = document.querySelector('#terminal-heart');
const terminalShell = document.querySelector('.terminal-shell');
const buildRenderStage = document.querySelector('#build-render-stage');
const buildStatusText = document.querySelector('#build-status-text');
const buildTaskbar = document.querySelector('#build-taskbar');
const buildSidebarLeft = document.querySelector('#build-sidebar-left');
const buildSidebarRight = document.querySelector('#build-sidebar-right');
const buildMainViewport = document.querySelector('#build-main-viewport');
const buildRemainingOs = document.querySelector('#build-remaining-os');
const buildRecycleIcon = document.querySelector('#build-recycle-icon');
const buildRecycleWindow = document.querySelector('#build-recycle-window');
const buildRecycleClose = document.querySelector('#build-recycle-close');
const buildAppIcons = document.querySelector('#build-app-icons');
const buildAppIconButtons = Array.from(document.querySelectorAll('.build-app-icon'));
const buildAppWindow = document.querySelector('#build-app-window');
const buildAppWindowTitle = document.querySelector('#build-app-window-title');
const buildAppWindowBody = document.querySelector('#build-app-window-body');
const buildAppClose = document.querySelector('#build-app-close');
const buildVisualizerWindow = document.querySelector('#build-visualizer-window');
const buildVisualizerClose = document.querySelector('#build-visualizer-close');
const buildVisualizerCanvas = document.querySelector('#build-visualizer-canvas');
const buildVisualizerStatus = document.querySelector('#build-visualizer-status');
const buildDiaryWireframe = document.querySelector('#build-diary-wireframe');
const buildDiaryWindow = document.querySelector('#build-diary-window');
const buildDiaryClose = document.querySelector('#build-diary-close');
const buildDiaryContent = document.querySelector('#build-diary-content');
const buildDiaryAuthForm = document.querySelector('#build-diary-auth-form');
const buildDiaryPassword = document.querySelector('#build-diary-password');
const buildDiaryUnlock = document.querySelector('#build-diary-unlock');
const buildDiarySave = document.querySelector('#build-diary-save');
const buildDiaryAuthStatus = document.querySelector('#build-diary-auth-status');
const buildTypingIndicator = document.querySelector('#build-typing-indicator');
const buildTypingText = document.querySelector('#build-typing-text');

const STATE_CLASSES = [
  'crt-state-bios',
  'crt-state-bios-off',
  'crt-state-bios-exit',
  'crt-state-reset-cycle',
  'crt-state-booting',
  'crt-state-on',
];

const BIOS_SPEED_MULTIPLIER = 1.25;
const BIOS_TARGET_MS = 45000;
const CRT_POWER_CYCLE_OFF_MS = 320;
const RESET_CYCLE_MS = 3000;
const CRT_SWEEP_MS = 8800;
const CRT_ROLL_MS = 12400;
const CRT_PULSE_CENTER = 0.53;
const CRT_PULSE_SIGMA = 0.16;
const CRT_BOOT_BLACKOUT_MS = 180;
const CRT_BOOT_WARMUP_MS = 320;
const CRT_BOOT_EXPAND_MS = 780;
const CRT_BOOT_SETTLE_MS = 920;
const CRT_BOOT_TOTAL_MS = CRT_BOOT_BLACKOUT_MS + CRT_BOOT_WARMUP_MS + CRT_BOOT_EXPAND_MS + CRT_BOOT_SETTLE_MS;
const BIOS_LINE_DELAY_MIN_MS = 700;
const BIOS_LINE_DELAY_MAX_MS = 1450;
const BIOS_CHAR_DELAY_MIN_MS = 24;
const BIOS_CHAR_DELAY_MAX_MS = 50;
const TYPING_SOUND_SRC = '/sounds/click.mp3';
const TYPING_SOUND_POOL_SIZE = 8;
const TYPING_SOUND_BASE_VOLUME = 0.13;
const ASCII_HEART_FPS = 24;
const ASCII_HEART_FRAME_MS = 1000 / ASCII_HEART_FPS;
const ASCII_HEART_BEAT_CYCLE_S = 1.16;
const ASCII_HEART_BEAT_PRIMARY_CENTER = 0.09;
const ASCII_HEART_BEAT_SECONDARY_CENTER = 0.29;
const ASCII_HEART_BEAT_PRIMARY_SIGMA = 0.052;
const ASCII_HEART_BEAT_SECONDARY_SIGMA = 0.05;
const ASCII_HEART_BEAT_SCALE_STRENGTH = 0.115;
const ASCII_HEART_MIN_OPACITY = 0.5;
const ASCII_HEART_MAX_OPACITY = 0.82;
const ASCII_HEART_MIN_GLOW_PX = 7;
const ASCII_HEART_MAX_GLOW_PX = 16;
const ASCII_HEART_TEMPLATE_COMPACT = [
  '                           ',
  '         xxx   xxx         ',
  '      xxxxxxx xxxxxxx      ',
  '    xxxxxxxxxxxxxxxxxxx    ',
  '   xxxxxxxxxxxxxxxxxxxxx   ',
  '    xxxxxxxxxxxxxxxxxxx    ',
  '      xxxxxxxxxxxxxxx      ',
  '        xxxxxxxxxxx        ',
  '          xxxxxxx          ',
  '            xxx            ',
  '                           ',
];
const ASCII_HEART_TEMPLATE_BASE = [
  '                           ',
  '        xxxx   xxxx        ',
  '      xxxxxxx xxxxxxx      ',
  '    xxxxxxxxxxxxxxxxxxx    ',
  '   xxxxxxxxxxxxxxxxxxxxx   ',
  '  xxxxxxxxxxxxxxxxxxxxxxx  ',
  '  xxxxxxxxxxxxxxxxxxxxxxx  ',
  '   xxxxxxxxxxxxxxxxxxxxx   ',
  '    xxxxxxxxxxxxxxxxxxx    ',
  '      xxxxxxxxxxxxxxx      ',
  '        xxxxxxxxxxx        ',
  '          xxxxxxx          ',
  '            xxx            ',
  '                           ',
];
const ASCII_HEART_TEMPLATE_EXPANDED = [
  '                           ',
  '       xxxxx   xxxxx       ',
  '    xxxxxxxxx xxxxxxxxx    ',
  '   xxxxxxxxxxxxxxxxxxxxx   ',
  '  xxxxxxxxxxxxxxxxxxxxxxx  ',
  ' xxxxxxxxxxxxxxxxxxxxxxxxx ',
  ' xxxxxxxxxxxxxxxxxxxxxxxxx ',
  '  xxxxxxxxxxxxxxxxxxxxxxx  ',
  '   xxxxxxxxxxxxxxxxxxxxx   ',
  '    xxxxxxxxxxxxxxxxxxx    ',
  '      xxxxxxxxxxxxxxx      ',
  '        xxxxxxxxxxx        ',
  '          xxxxxxx          ',
  '            xxx            ',
  '                           ',
];
const HEART_THUMP_PRIMARY_FREQ_HZ = 56;
const HEART_THUMP_SECONDARY_FREQ_HZ = 49;
const HEART_THUMP_SWEEP_RATIO = 0.82;
const HEART_THUMP_PRIMARY_PEAK = 0.0045;
const HEART_THUMP_SECONDARY_PEAK = 0.00285;
const HEART_THUMP_ATTACK_S = 0.012;
const HEART_THUMP_RELEASE_S = 0.19;
const HEART_THUMP_DURATION_S = 0.2;
const AMBIENT_BUZZ_LEVEL_SCALE = 0;
const BIOS_SKIP_CLICK_THRESHOLD = 10;
const BUILD_STEP_DELAY_MS = 560;
const BUILD_FINAL_DELAY_MS = 460;
const BUILD_SIDEBAR_GOTHIC_SRC = '/sidebars/sidebar_gothic.png';
const AME_PERSONALIZE_STEP_MS = 420;
const AME_PERSONALIZE_BOOT_MS = 320;
const BUILD_APP_WINDOW_ASSEMBLE_MS = 190;
const BUILD_APP_LINE_REVEAL_MS = 96;
const DIARY_WIREFRAME_BUILD_MS = 520;
const DIARY_WIREFRAME_OPEN_MS = 340;
// TODO: Support a runtime switch from balanced -> reference-heavy visualizer styling.
const VISUALIZER_STYLE_MODE = 'balanced';
const DIARY_EDITOR_PASSWORD = 'Meow123';
const DIARY_STORAGE_KEY = 'ames_corner_diary_content_v1';
const DIARY_DEFAULT_CONTENT = [
  'Dear diary,',
  '',
  'The glass remembers more than I do.',
  'Every line it draws feels familiar.',
  '',
  '[Write your own entries here.]',
].join('\n');
const AUTH_PROFILE_STORAGE_KEY = 'windose_auth_profile_v2';
const UNKNOWN_TELEMETRY = 'UNKNOWN';
const TERMINAL_PROMPT = 'C:\\AmesCorner>';
const TERMINAL_SECTIONS = {
  about: [
    "Ame's Corner terminal interface.",
    'Use commands to reveal page sections and logs.',
  ],
  feed: [
    'Live Mirror Feed:',
    'The room behind you is sampled in static slices, then replayed as memory.',
  ],
  notes: [
    'Surface Notes:',
    'Edges persist longer than faces. Bright pixels burn first.',
    'Shadows collect in corners and answer late.',
  ],
  drift: [
    'Signal Drift:',
    'Input channels are open. Output channels are open.',
    'Distance from the glass has been recorded.',
  ],
  state: [
    'Observed State:',
    '- Scanline persistence: unstable',
    '- Reflection lock: acquired',
    '- Ambient channel: armed',
    '- Operator return path: intentionally undefined',
  ],
  logs: [
    '[00:00] handoff accepted from CRT transition pipeline.',
    '[00:01] camera depth estimate: user stepped back.',
    '[00:02] replacing foreground with reflected scene layers.',
    '[00:03] maintaining one-way progression channel.',
  ],
};

const BUILD_APP_ORDER = ['feed', 'notes', 'state'];
const BUILD_APP_TITLES = {
  feed: 'Mirror Feed',
  notes: 'Surface Notes',
  state: 'System State',
  diary: 'Diary',
};
const VISUALIZER_FPS = 30;
const VISUALIZER_FRAME_MS = 1000 / VISUALIZER_FPS;
const VISUALIZER_BAR_COUNT = 48;
const VISUALIZER_FFT_SIZE = 1024;
const VISUALIZER_FULL_BOOT_MS = 260;
const VISUALIZER_FULL_STEP_MS = 240;
const VISUALIZER_QUICK_STEP_MS = 150;
const VISUALIZER_MIN_BAR_GAIN = 0.06;
const VISUALIZER_TYPING_IMPULSE_GAIN = 0.18;

function sanitizeBiosToken(value, fallback = UNKNOWN_TELEMETRY, maxLength = 84) {
  const normalized = String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return fallback;
  return normalized.slice(0, maxLength);
}

function formatLocalTimestamp(date, locale) {
  try {
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return date.toLocaleString();
  }
}

function formatUtcTimestamp(date) {
  const iso = date.toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 19)} UTC`;
}

function detectBrowserSignature(userAgent) {
  if (/\bEdg\//.test(userAgent)) return 'Microsoft Edge';
  if (/\bOPR\//.test(userAgent)) return 'Opera';
  if (/\bChrome\//.test(userAgent)) return 'Google Chrome';
  if (/\bFirefox\//.test(userAgent)) return 'Mozilla Firefox';
  if (/\bSafari\//.test(userAgent) && !/\bChrome\//.test(userAgent)) return 'Safari';
  return 'Unknown Browser';
}

function readStoredOperatorHandle() {
  try {
    const raw = localStorage.getItem(AUTH_PROFILE_STORAGE_KEY);
    if (!raw) return UNKNOWN_TELEMETRY;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return UNKNOWN_TELEMETRY;

    const usernameRaw = sanitizeBiosToken(parsed.username, '', 32);
    const username = usernameRaw.replace(/^@+/, '');
    if (username) return username;

    const email = sanitizeBiosToken(parsed.email, '', 64);
    if (email && email.includes('@')) {
      return sanitizeBiosToken(email.split('@')[0], UNKNOWN_TELEMETRY, 32);
    }
  } catch {
    // ignore storage parsing errors and fall back to unknown
  }
  return UNKNOWN_TELEMETRY;
}

function collectBiosTelemetry() {
  const now = new Date();
  const locale = sanitizeBiosToken(navigator.language || 'en-US', 'en-US', 24);
  const timezone = sanitizeBiosToken(Intl.DateTimeFormat().resolvedOptions().timeZone, UNKNOWN_TELEMETRY, 40);
  const localTimestamp = sanitizeBiosToken(formatLocalTimestamp(now, locale), UNKNOWN_TELEMETRY, 40);
  const utcTimestamp = sanitizeBiosToken(formatUtcTimestamp(now), UNKNOWN_TELEMETRY, 40);

  const userAgent = navigator.userAgent || '';
  const platform = sanitizeBiosToken(navigator.userAgentData?.platform || navigator.platform, UNKNOWN_TELEMETRY, 40);
  const brands = Array.isArray(navigator.userAgentData?.brands)
    ? navigator.userAgentData.brands
      .map((entry) => sanitizeBiosToken(entry?.brand, '', 20))
      .filter(Boolean)
      .slice(0, 2)
    : [];
  const browser = sanitizeBiosToken(brands.length ? brands.join(', ') : detectBrowserSignature(userAgent), UNKNOWN_TELEMETRY, 48);

  const cpuThreads = Number.isFinite(navigator.hardwareConcurrency)
    ? `${navigator.hardwareConcurrency}`
    : 'UNREPORTED';
  const memory = Number.isFinite(navigator.deviceMemory)
    ? `${navigator.deviceMemory}GB`
    : 'UNREPORTED';

  const dpr = Number.isFinite(window.devicePixelRatio) ? window.devicePixelRatio : 1;
  const screenWidth = Number.isFinite(window.screen?.width) ? window.screen.width : 0;
  const screenHeight = Number.isFinite(window.screen?.height) ? window.screen.height : 0;
  const colorDepth = Number.isFinite(window.screen?.colorDepth) ? `${window.screen.colorDepth}-bit` : 'UNREPORTED';
  const viewportWidth = Number.isFinite(window.innerWidth) ? window.innerWidth : 0;
  const viewportHeight = Number.isFinite(window.innerHeight) ? window.innerHeight : 0;
  const displaySurface = screenWidth && screenHeight
    ? `${screenWidth}x${screenHeight} @${dpr.toFixed(2)}x`
    : `UNREPORTED @${dpr.toFixed(2)}x`;
  const viewportWindow = viewportWidth && viewportHeight
    ? `${viewportWidth}x${viewportHeight}`
    : 'UNREPORTED';

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  let networkVector = navigator.onLine ? 'online' : 'offline';
  if (connection && typeof connection === 'object') {
    const effectiveType = sanitizeBiosToken(connection.effectiveType, '', 16);
    const downlink = Number.isFinite(connection.downlink) ? `${connection.downlink.toFixed(1)}Mbps` : '';
    const rtt = Number.isFinite(connection.rtt) ? `${Math.round(connection.rtt)}ms` : '';
    const parts = [navigator.onLine ? 'online' : 'offline'];
    if (effectiveType) parts.push(effectiveType);
    if (downlink) parts.push(downlink);
    if (rtt) parts.push(`rtt ${rtt}`);
    networkVector = parts.join(' | ');
  }

  return {
    locale,
    timezone,
    localTimestamp,
    utcTimestamp,
    platform,
    browser,
    cpuThreads,
    memory,
    displaySurface: sanitizeBiosToken(displaySurface, UNKNOWN_TELEMETRY, 40),
    viewportWindow: sanitizeBiosToken(viewportWindow, UNKNOWN_TELEMETRY, 24),
    colorDepth,
    networkVector: sanitizeBiosToken(networkVector, UNKNOWN_TELEMETRY, 56),
    operatorHandle: readStoredOperatorHandle(),
  };
}

function buildBiosScript() {
  const telemetry = collectBiosTelemetry();
  const operatorLine = telemetry.operatorHandle === UNKNOWN_TELEMETRY
    ? 'OPERATOR HANDLE: UNRESOLVED'
    : `OPERATOR HANDLE: @${telemetry.operatorHandle}`;

  return [
    { text: 'AMIX-86 BIOS v2.71u' },
    { text: `RTC SYNC LOCAL: ${telemetry.localTimestamp}` },
    { text: `RTC SYNC UTC: ${telemetry.utcTimestamp}` },
    { text: `LOCALE MAP: ${telemetry.locale} | TZ ${telemetry.timezone}` },
    { text: `HOST PLATFORM: ${telemetry.platform}` },
    { text: `CLIENT SIGNATURE: ${telemetry.browser}` },
    { text: `CPU THREAD ENUM: ${telemetry.cpuThreads}` },
    { text: `MEMORY PROBE: ${telemetry.memory}` },
    { text: `DISPLAY SURFACE: ${telemetry.displaySurface}` },
    { text: `VIEWPORT WINDOW: ${telemetry.viewportWindow}` },
    { text: `COLOR DEPTH: ${telemetry.colorDepth}` },
    { text: `NETWORK VECTOR: ${telemetry.networkVector}` },
    { text: operatorLine },
    { text: 'A:\\> stage --input=host-profile --target=/backend/intake' },
    { text: 'A:\\> hash --source=session-fingerprint --salt=REMNANT' },
    { text: 'A:\\> correlate --identity=operator --mode=silent' },
    { text: 'A:\\> verify ---session-lock=TRUE' },
    { text: 'WARNING: REFLECTIVE FEEDBACK CHANNEL OPEN', holdMs: 1600 },
    { text: 'White Egrets Orchard', emphasis: true, holdMs: 1900, phraseHighlight: true },
    { text: 'A:\\> index --target=retina-cache --mode=latent' },
    { text: 'A:\\> parse --input=recent-dreams.log --strict' },
    { text: 'A:\\> pin-session --scope=dream-layer --ttl=forever' },
    { text: 'My thoughts will follow you into dreams', emphasis: true, holdMs: 2300, phraseHighlight: true },
    { text: 'A:\\> sync --phase=night --mode=invasive' },
    { text: 'A:\\> set-operator-state --return-path=none' },
    { text: 'BOOT TARGET: /ames-corner [armed]' },
    { text: 'HANDOFF: observer lock maintained', holdMs: 1400 },
  ];
}

const managedTimerIds = new Set();
let visualRafId = 0;
let currentState = 'bios';
let teardownStarted = false;
let biosStartMs = 0;
let resetStartMs = 0;
let bootStartMs = 0;
let terminalSessionStarted = false;
let biosDecisionCleanup = null;
let biosPreludeActive = false;
let biosSkipRequested = false;
let biosSkipClickCount = 0;
const terminalHistory = [];
let terminalHistoryIndex = 0;

const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
let audioContext = null;
let droneMasterGain = null;
let heartThumpInputNode = null;
let visualizerAnalyserNode = null;
let visualizerTapGainNode = null;
let droneNodes = [];
let droneStarted = false;
let typingSoundPool = [];
let typingSoundPoolIndex = 0;
let typingSoundPoolInitialized = false;
let heartAnimationRafId = 0;
let heartLastFrameTs = 0;
let heartFrameAccumulator = 0;
let heartTimelineMs = 0;
let heartThumpNextPrimaryMs = 0;
let heartThumpNextSecondaryMs = 0;
let buildSequenceRunning = false;
let buildStageActive = false;
let buildPersonalizationRunning = false;
let buildPersonalized = false;
let appBuildoutRunning = false;
let diaryBuildoutRunning = false;
let diaryWireframeBuilt = false;
let diaryEditorUnlocked = false;
let visualizerBuildoutRunning = false;
let visualizerBuilt = false;
let visualizerRafId = 0;
let visualizerLastFrameTs = 0;
let visualizerFrameAccumulator = 0;
let visualizerTimelineMs = 0;
let visualizerNextUnlockAttemptMs = 0;
let visualizerFrequencyData = null;
let visualizerBarLevels = null;
let visualizerTypingImpulse = 0;
let visualizerCanvasCtx = null;
let visualizerLastStatusText = '';

function clamp(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeOutCubic(t) {
  const p = clamp(t, 0, 1);
  return 1 - Math.pow(1 - p, 3);
}

function easeInOutCubic(t) {
  const p = clamp(t, 0, 1);
  if (p < 0.5) return 4 * p * p * p;
  return 1 - Math.pow(-2 * p + 2, 3) / 2;
}

function gaussianPulse(progress, center, sigma) {
  const normalized = (progress - center) / sigma;
  return Math.exp(-(normalized * normalized));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function scaleBiosDuration(ms) {
  return Math.max(1, Math.round(ms * BIOS_SPEED_MULTIPLIER));
}

function initTypingSoundPool() {
  if (typingSoundPoolInitialized) return;
  typingSoundPoolInitialized = true;
  typingSoundPool = [];
  for (let i = 0; i < TYPING_SOUND_POOL_SIZE; i += 1) {
    const clip = new Audio(TYPING_SOUND_SRC);
    clip.preload = 'auto';
    clip.volume = TYPING_SOUND_BASE_VOLUME;
    typingSoundPool.push(clip);
  }
}

function playTypingSound() {
  if (!typingSoundPoolInitialized) {
    initTypingSoundPool();
  }
  if (!typingSoundPool.length) return;
  bumpVisualizerTypingImpulse();
  tryResumeAudioContext();
  const clip = typingSoundPool[typingSoundPoolIndex];
  typingSoundPoolIndex = (typingSoundPoolIndex + 1) % typingSoundPool.length;
  if (!clip) return;

  try {
    clip.pause();
    clip.currentTime = 0;
    clip.playbackRate = randomBetween(0.94, 1.08);
    clip.volume = clamp(TYPING_SOUND_BASE_VOLUME + (Math.random() - 0.5) * 0.06, 0.08, 0.22);
    const playback = clip.play();
    if (playback && typeof playback.catch === 'function') {
      playback.catch(() => {
        // ignore autoplay and transient playback failures
      });
    }
  } catch {
    // ignore audio errors, typing flow must continue
  }
}

function stopTypingSoundPool() {
  for (const clip of typingSoundPool) {
    try {
      clip.pause();
      clip.currentTime = 0;
    } catch {
      // ignore pause/reset failures
    }
  }
}

function setManagedTimeout(callback, ms) {
  const timerId = window.setTimeout(() => {
    managedTimerIds.delete(timerId);
    callback();
  }, ms);
  managedTimerIds.add(timerId);
  return timerId;
}

function wait(ms) {
  return new Promise((resolve) => {
    setManagedTimeout(resolve, ms);
  });
}

async function waitBiosOrSkip(ms) {
  let remaining = Math.max(0, ms);
  while (remaining > 0 && !teardownStarted && !biosSkipRequested) {
    const chunk = Math.min(remaining, 40);
    await wait(chunk);
    remaining -= chunk;
  }
}

function clearManagedTimers() {
  for (const timerId of managedTimerIds) {
    window.clearTimeout(timerId);
  }
  managedTimerIds.clear();
}

function setVar(name, value) {
  cssRoot.style.setProperty(name, value);
}

function setState(stateName) {
  currentState = stateName;
  for (const className of STATE_CLASSES) {
    root.classList.remove(className);
  }
  root.classList.add(`crt-state-${stateName}`);
}

function appendBiosText(text, className = '') {
  if (!biosLog) return null;
  if (!className) {
    biosLog.appendChild(document.createTextNode(text));
    return null;
  }
  const span = document.createElement('span');
  span.className = className;
  span.textContent = text;
  biosLog.appendChild(span);
  return span;
}

function terminalPrint(text, tone = '') {
  if (!terminalOutput) return;
  const line = document.createElement('p');
  line.className = tone ? `terminal-line terminal-line--${tone}` : 'terminal-line';
  line.textContent = text;
  if (terminalForm && terminalForm.parentElement === terminalOutput) {
    terminalOutput.insertBefore(line, terminalForm);
  } else {
    terminalOutput.appendChild(line);
  }
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function terminalClear() {
  if (!terminalOutput) return;
  if (terminalForm && terminalForm.parentElement === terminalOutput) {
    for (const node of Array.from(terminalOutput.children)) {
      if (node === terminalForm) continue;
      node.remove();
    }
  } else {
    terminalOutput.textContent = '';
  }
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function normalizeSectionName(raw) {
  const token = raw.trim().toLowerCase();
  if (token === 'log') return 'logs';
  return token;
}

function terminalShowSection(sectionName) {
  const key = normalizeSectionName(sectionName);
  const lines = TERMINAL_SECTIONS[key];
  if (!lines) return false;
  terminalPrint(`[${key}]`, 'section');
  for (const line of lines) {
    terminalPrint(line);
  }
  return true;
}

function terminalShowHelp(tone = '') {
  const headerTone = tone || 'section';
  terminalPrint('commands:', headerTone);
  terminalPrint('  -help                 show command list', tone);
  terminalPrint('  build                 render skeleton OS live', tone);
  if (buildStageActive) {
    terminalPrint('  visualizer            build audio visualizer', tone);
    terminalPrint('  sections              list available sections', tone);
    terminalPrint('  open <section>        open section content', tone);
    terminalPrint('  about|feed|notes|drift|state|logs', tone);
    terminalPrint('  all                   show every section', tone);
  }
  terminalPrint('  time                  print local time', tone);
  terminalPrint('  clear                 clear terminal output', tone);
}

function setBuildStatus(text) {
  if (!buildStatusText) return;
  buildStatusText.textContent = text;
}

function updateBuildTypingIndicator() {
  if (!buildTypingIndicator || !buildTypingText) return;
  if (!buildStageActive) {
    buildTypingIndicator.classList.remove('is-active');
    buildTypingIndicator.setAttribute('aria-hidden', 'true');
    buildTypingText.textContent = '...';
    return;
  }
  buildTypingIndicator.setAttribute('aria-hidden', 'false');
  const hasFocus = document.activeElement === terminalInput;
  const typed = terminalInput?.value ?? '';
  buildTypingText.textContent = typed || (hasFocus ? '...' : 'click terminal prompt');
  buildTypingIndicator.classList.toggle('is-active', hasFocus);
}

function setBuildVisualizerStatus(text) {
  const nextText = String(text ?? '');
  if (nextText === visualizerLastStatusText) return;
  if (buildVisualizerStatus) {
    buildVisualizerStatus.textContent = nextText;
  }
  visualizerLastStatusText = nextText;
}

function bumpVisualizerTypingImpulse(amount = VISUALIZER_TYPING_IMPULSE_GAIN) {
  visualizerTypingImpulse = clamp(visualizerTypingImpulse + amount, 0, 1.8);
}

function isVisualizerSignalReady() {
  return Boolean(
    audioContext
    && audioContext.state === 'running'
    && visualizerAnalyserNode
    && visualizerFrequencyData,
  );
}

function ensureVisualizerCanvasSize() {
  if (!buildVisualizerCanvas) return;
  const rect = buildVisualizerCanvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
  const targetWidth = Math.max(1, Math.floor(width * dpr));
  const targetHeight = Math.max(1, Math.floor(height * dpr));
  if (buildVisualizerCanvas.width === targetWidth && buildVisualizerCanvas.height === targetHeight) return;
  buildVisualizerCanvas.width = targetWidth;
  buildVisualizerCanvas.height = targetHeight;
  const context = visualizerCanvasCtx
    ?? buildVisualizerCanvas.getContext('2d', { alpha: false, desynchronized: true });
  if (!context) return;
  visualizerCanvasCtx = context;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function renderVisualizerFrame() {
  if (!buildVisualizerCanvas) return;
  ensureVisualizerCanvasSize();

  const context = visualizerCanvasCtx
    ?? buildVisualizerCanvas.getContext('2d', { alpha: false, desynchronized: true });
  if (!context) return;
  visualizerCanvasCtx = context;

  const width = Math.max(1, Math.floor(buildVisualizerCanvas.width / clamp(window.devicePixelRatio || 1, 1, 2)));
  const height = Math.max(1, Math.floor(buildVisualizerCanvas.height / clamp(window.devicePixelRatio || 1, 1, 2)));
  const isBalancedStyle = VISUALIZER_STYLE_MODE === 'balanced';

  const hasSignal = isVisualizerSignalReady();
  if (hasSignal) {
    visualizerAnalyserNode.getByteFrequencyData(visualizerFrequencyData);
  } else if (performance.now() >= visualizerNextUnlockAttemptMs) {
    visualizerNextUnlockAttemptMs = performance.now() + 1100;
    tryResumeAudioContext();
    tryStartDrone();
  }

  if (!visualizerBarLevels || visualizerBarLevels.length !== VISUALIZER_BAR_COUNT) {
    visualizerBarLevels = new Float32Array(VISUALIZER_BAR_COUNT);
  }

  const bgGradient = context.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, 'rgb(6, 0, 7)');
  bgGradient.addColorStop(0.54, 'rgb(11, 2, 9)');
  bgGradient.addColorStop(1, 'rgb(4, 0, 4)');
  context.fillStyle = bgGradient;
  context.fillRect(0, 0, width, height);

  const haloGradient = context.createRadialGradient(
    width * 0.6,
    height * 0.44,
    8,
    width * 0.6,
    height * 0.44,
    Math.max(width, height) * 0.78,
  );
  haloGradient.addColorStop(0, isBalancedStyle ? 'rgba(214, 231, 248, 0.12)' : 'rgba(248, 250, 255, 0.2)');
  haloGradient.addColorStop(0.46, isBalancedStyle ? 'rgba(176, 216, 248, 0.05)' : 'rgba(220, 236, 255, 0.12)');
  haloGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = haloGradient;
  context.fillRect(0, 0, width, height);

  const barStep = width / VISUALIZER_BAR_COUNT;
  const barWidth = Math.max(2, barStep * 0.62);
  const spectrumLength = hasSignal ? visualizerFrequencyData.length : 0;
  const startBin = 2;
  const usableBins = Math.max(1, spectrumLength - startBin);
  const timelineSeconds = visualizerTimelineMs / 1000;

  for (let i = 0; i < VISUALIZER_BAR_COUNT; i += 1) {
    let magnitude = 0;
    if (hasSignal) {
      const binStart = startBin + Math.floor((i * usableBins) / VISUALIZER_BAR_COUNT);
      const binEnd = startBin + Math.max(
        1,
        Math.floor(((i + 1) * usableBins) / VISUALIZER_BAR_COUNT),
      );
      let peak = 0;
      for (let bin = binStart; bin < binEnd; bin += 1) {
        const value = visualizerFrequencyData[bin] ?? 0;
        if (value > peak) peak = value;
      }
      magnitude = Math.pow(peak / 255, 1.14);
    } else {
      const waveA = Math.sin((timelineSeconds * 4.5) + (i * 0.45)) * 0.5 + 0.5;
      const waveB = Math.sin((timelineSeconds * 2.2) + (i * 0.2)) * 0.5 + 0.5;
      magnitude = VISUALIZER_MIN_BAR_GAIN + (waveA * 0.05) + (waveB * 0.04);
    }

    if (visualizerTypingImpulse > 0) {
      const pulse = 0.09 + (Math.sin((i * 0.33) + (timelineSeconds * 12)) * 0.05 + 0.05);
      magnitude += visualizerTypingImpulse * pulse;
    }

    magnitude = clamp(magnitude, 0, 1);
    const previous = visualizerBarLevels[i] ?? 0;
    const attack = hasSignal ? 0.48 : 0.32;
    const release = hasSignal ? 0.86 : 0.9;
    const next = magnitude >= previous
      ? previous + ((magnitude - previous) * attack)
      : previous * release;
    const clampedNext = clamp(next, 0, 1);
    visualizerBarLevels[i] = clampedNext;

    const barHeight = Math.max(2, clampedNext * height * 0.9);
    const x = (i * barStep) + ((barStep - barWidth) / 2);
    const y = height - barHeight;

    const color = context.createLinearGradient(0, y, 0, height);
    color.addColorStop(0, 'rgba(242, 248, 255, 0.96)');
    color.addColorStop(0.4, 'rgba(176, 216, 248, 0.84)');
    color.addColorStop(1, 'rgba(202, 40, 105, 0.74)');
    context.fillStyle = color;
    context.fillRect(x, y, barWidth, barHeight);

    context.fillStyle = `rgba(239, 246, 255, ${clamp(0.14 + clampedNext * 0.25, 0.14, 0.34).toFixed(3)})`;
    context.fillRect(x, y - 1, barWidth, 2);
  }

  context.strokeStyle = 'rgba(176, 216, 248, 0.18)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0, Math.floor(height * 0.66) + 0.5);
  context.lineTo(width, Math.floor(height * 0.66) + 0.5);
  context.stroke();

  visualizerTypingImpulse *= hasSignal ? 0.84 : 0.9;
}

function startVisualizerLoop() {
  if (visualizerRafId || !buildVisualizerWindow?.classList.contains('is-open')) return;
  visualizerFrameAccumulator = 0;
  visualizerLastFrameTs = performance.now();
  visualizerTimelineMs = 0;
  visualizerNextUnlockAttemptMs = 0;
  renderVisualizerFrame();

  const tick = (timestamp) => {
    if (teardownStarted || !buildStageActive || !buildVisualizerWindow?.classList.contains('is-open')) {
      stopVisualizerLoop();
      return;
    }

    const delta = Math.min(200, timestamp - visualizerLastFrameTs);
    visualizerLastFrameTs = timestamp;
    visualizerFrameAccumulator += delta;

    let didRender = false;
    while (visualizerFrameAccumulator >= VISUALIZER_FRAME_MS) {
      visualizerFrameAccumulator -= VISUALIZER_FRAME_MS;
      visualizerTimelineMs += VISUALIZER_FRAME_MS;
      didRender = true;
    }
    if (didRender) {
      renderVisualizerFrame();
    }

    visualizerRafId = window.requestAnimationFrame(tick);
  };

  visualizerRafId = window.requestAnimationFrame(tick);
}

function stopVisualizerLoop() {
  if (visualizerRafId) {
    window.cancelAnimationFrame(visualizerRafId);
    visualizerRafId = 0;
  }
}

function closeBuildVisualizerWindow(options = {}) {
  const { silent = false } = options;
  stopVisualizerLoop();
  buildVisualizerWindow?.classList.remove(
    'is-open',
    'is-assembling',
    'is-piece-1',
    'is-piece-2',
    'is-piece-3',
    'is-live',
  );
  setBuildVisualizerStatus('Signal idle.');
  if (!silent) {
    setBuildStatus('Audio visualizer closed. Type "visualizer" to reopen.');
  }
}

function openBuildVisualizerWindow(options = {}) {
  const { focusStatus = true } = options;
  if (!buildStageActive) {
    setBuildStatus('Run build first to enter skeleton mode.');
    return;
  }
  closeBuildAppWindow({ silent: true });
  closeDiaryWindow({ silent: true });
  buildRecycleWindow?.classList.remove('is-open');
  if (visualizerBuilt) {
    if (buildAppIcons) {
      buildAppIcons.classList.add('is-live');
      buildAppIcons.setAttribute('aria-hidden', 'false');
    }
    getBuildAppButton('visualizer')?.classList.add('is-live');
  }
  buildVisualizerWindow?.classList.add('is-open', 'is-live');
  startVisualizerLoop();
  if (focusStatus) {
    if (isVisualizerSignalReady()) {
      setBuildVisualizerStatus('Signal linked. Rendering live internal mix.');
    } else {
      setBuildVisualizerStatus('Signal awaiting input. Type or click to unlock audio context.');
    }
    setBuildStatus('Audio visualizer online.');
  }
}

function readDiaryContent() {
  try {
    const stored = localStorage.getItem(DIARY_STORAGE_KEY);
    if (!stored) return DIARY_DEFAULT_CONTENT;
    const normalized = String(stored).replace(/\r\n?/g, '\n');
    return normalized.slice(0, 5000) || DIARY_DEFAULT_CONTENT;
  } catch {
    return DIARY_DEFAULT_CONTENT;
  }
}

function writeDiaryContent(content) {
  try {
    localStorage.setItem(DIARY_STORAGE_KEY, content);
  } catch {
    // ignore storage failures and keep in-memory content
  }
}

function setDiaryAuthStatus(text, isError = false) {
  if (!buildDiaryAuthStatus) return;
  buildDiaryAuthStatus.textContent = text;
  buildDiaryAuthStatus.classList.toggle('is-error', isError);
}

function resetDiaryEditor() {
  diaryEditorUnlocked = false;
  if (buildDiaryContent) {
    buildDiaryContent.value = readDiaryContent();
    buildDiaryContent.readOnly = true;
  }
  if (buildDiaryPassword) {
    buildDiaryPassword.value = '';
  }
  if (buildDiaryUnlock) {
    buildDiaryUnlock.disabled = false;
  }
  if (buildDiarySave) {
    buildDiarySave.disabled = true;
  }
  setDiaryAuthStatus('Read-only mode.');
}

function closeDiaryWindow(options = {}) {
  const { silent = false } = options;
  buildDiaryWindow?.classList.remove('is-open');
  if (!silent) {
    setBuildStatus('Diary window closed. Type "diary" to reopen.');
  }
}

function openDiaryWindow() {
  if (!buildStageActive || !buildPersonalized) {
    setBuildStatus('Ame shell is not ready. Run build, then ame.');
    return;
  }
  closeBuildAppWindow({ silent: true });
  closeBuildVisualizerWindow({ silent: true });
  if (!diaryWireframeBuilt) {
    setBuildStatus('Run "diary" to assemble diary shell first.');
    return;
  }
  resetDiaryEditor();
  buildDiaryWindow?.classList.add('is-open');
  setBuildStatus('Diary opened. Unlock to edit entries.');
}

async function runDiaryBuildout() {
  if (!buildStageActive) {
    terminalPrint('run build first to enter skeleton mode.', 'muted');
    return;
  }
  if (!buildPersonalized) {
    terminalPrint('run ame first to personalize the shell.', 'muted');
    return;
  }
  if (buildSequenceRunning || buildPersonalizationRunning || appBuildoutRunning || visualizerBuildoutRunning) {
    terminalPrint('wait for current build process to complete.', 'muted');
    return;
  }
  if (diaryBuildoutRunning) {
    terminalPrint('diary buildout already running.', 'muted');
    return;
  }

  diaryBuildoutRunning = true;
  setTerminalEnabled(false);
  closeDiaryWindow({ silent: true });
  closeBuildAppWindow({ silent: true });
  closeBuildVisualizerWindow({ silent: true });
  setBuildStatus('Assembling diary wireframe...');
  terminalPrint('[build] assembling diary wireframe...', 'section');

  try {
    buildDiaryWireframe?.setAttribute('aria-hidden', 'false');
    buildDiaryWireframe?.classList.remove('is-assembling', 'is-open');
    if (buildDiaryWireframe) void buildDiaryWireframe.offsetWidth;
    buildDiaryWireframe?.classList.add('is-assembling');
    await wait(DIARY_WIREFRAME_BUILD_MS);
    if (teardownStarted || !buildStageActive) return;

    setBuildStatus('Opening diary...');
    buildDiaryWireframe?.classList.add('is-open');
    await wait(DIARY_WIREFRAME_OPEN_MS);
    if (teardownStarted || !buildStageActive) return;

    buildDiaryWireframe?.classList.remove('is-assembling', 'is-open');
    buildDiaryWireframe?.setAttribute('aria-hidden', 'true');
    diaryWireframeBuilt = true;
    getBuildAppButton('diary')?.classList.add('is-live');
    openDiaryWindow();
    terminalPrint('[build] diary buildout complete.', 'section');
  } finally {
    diaryBuildoutRunning = false;
    if (!teardownStarted && buildStageActive) {
      setTerminalEnabled(true);
    }
    updateBuildTypingIndicator();
  }
}

function onDiaryUnlockSubmit(event) {
  event.preventDefault();
  if (!buildStageActive || !buildPersonalized || !diaryWireframeBuilt) return;
  const entered = buildDiaryPassword?.value ?? '';
  if (entered !== DIARY_EDITOR_PASSWORD) {
    setDiaryAuthStatus('Password incorrect.', true);
    return;
  }

  diaryEditorUnlocked = true;
  if (buildDiaryContent) {
    buildDiaryContent.readOnly = false;
    buildDiaryContent.focus();
    buildDiaryContent.setSelectionRange(buildDiaryContent.value.length, buildDiaryContent.value.length);
  }
  if (buildDiaryUnlock) {
    buildDiaryUnlock.disabled = true;
  }
  if (buildDiarySave) {
    buildDiarySave.disabled = false;
  }
  setDiaryAuthStatus('Editor unlocked.');
}

function onDiarySaveClick() {
  if (!diaryEditorUnlocked || !buildDiaryContent) {
    setDiaryAuthStatus('Unlock first to save.', true);
    return;
  }
  writeDiaryContent(buildDiaryContent.value);
  setDiaryAuthStatus('Diary saved.');
}

function setBuildTaskbarTime() {
  const clockNode = buildRenderStage?.querySelector('.build-taskbar-time');
  if (!clockNode) return;
  const now = new Date();
  clockNode.textContent = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getBuildAppButton(appKey) {
  return buildAppIconButtons.find((button) => button.dataset.app === appKey) ?? null;
}

async function runBuildAppBuildout(appKey, options = {}) {
  const {
    manageTerminal = true,
    emitTerminalLog = true,
    allowDuringPersonalization = false,
  } = options;

  if (!buildStageActive || !buildPersonalized) {
    setBuildStatus('Ame profile is still loading. Type "ame" in build mode.');
    return;
  }
  if (buildSequenceRunning || diaryBuildoutRunning || visualizerBuildoutRunning || (buildPersonalizationRunning && !allowDuringPersonalization)) {
    terminalPrint('wait for current build process to complete.', 'muted');
    return;
  }
  if (appBuildoutRunning) {
    terminalPrint('module buildout already running.', 'muted');
    return;
  }

  const key = normalizeSectionName(appKey);
  const lines = TERMINAL_SECTIONS[key];
  if (!lines || !buildAppWindow || !buildAppWindowBody || !buildAppWindowTitle) {
    return;
  }

  const title = BUILD_APP_TITLES[key] ?? key.toUpperCase();
  appBuildoutRunning = true;
  if (manageTerminal) {
    setTerminalEnabled(false);
  }
  closeDiaryWindow({ silent: true });
  closeBuildVisualizerWindow({ silent: true });
  closeBuildAppWindow({ silent: true });
  setBuildStatus(`Assembling ${title} module...`);
  if (emitTerminalLog) {
    terminalPrint(`[build] assembling ${title.toLowerCase()} module...`, 'muted');
  }

  try {
    buildAppWindowTitle.textContent = title;
    buildAppWindowBody.textContent = '';
    buildAppWindow.classList.remove('is-open');
    void buildAppWindow.offsetWidth;
    buildAppWindow.classList.add('is-open');
    await wait(BUILD_APP_WINDOW_ASSEMBLE_MS);
    if (teardownStarted || !buildStageActive) return;

    for (const line of lines) {
      if (teardownStarted || !buildStageActive) return;
      const paragraph = document.createElement('p');
      paragraph.textContent = line;
      paragraph.style.opacity = '0';
      paragraph.style.transform = 'translateY(6px)';
      buildAppWindowBody.appendChild(paragraph);
      void paragraph.offsetWidth;
      paragraph.style.transition = 'opacity 160ms ease, transform 180ms ease';
      paragraph.style.opacity = '1';
      paragraph.style.transform = 'translateY(0)';
      await wait(BUILD_APP_LINE_REVEAL_MS);
    }

    setBuildStatus(`${title} module opened.`);
  } finally {
    appBuildoutRunning = false;
    if (!teardownStarted && buildStageActive && manageTerminal) {
      setTerminalEnabled(true);
    }
    updateBuildTypingIndicator();
  }
}

async function runVisualizerBuildout(options = {}) {
  const { quick = false } = options;

  if (!buildVisualizerWindow || !buildVisualizerCanvas) {
    terminalPrint('visualizer window is unavailable in this session.', 'error');
    return;
  }
  if (!buildStageActive) {
    terminalPrint('run build first to enter skeleton mode.', 'muted');
    return;
  }
  if (buildSequenceRunning || buildPersonalizationRunning || appBuildoutRunning || diaryBuildoutRunning) {
    terminalPrint('wait for current build process to complete.', 'muted');
    return;
  }
  if (visualizerBuildoutRunning) {
    terminalPrint('visualizer buildout already running.', 'muted');
    return;
  }

  visualizerBuildoutRunning = true;
  setTerminalEnabled(false);
  closeBuildAppWindow({ silent: true });
  closeDiaryWindow({ silent: true });
  buildRecycleWindow?.classList.remove('is-open');
  closeBuildVisualizerWindow({ silent: true });
  tryResumeAudioContext();
  tryStartDrone();

  if (buildAppIcons) {
    buildAppIcons.classList.add('is-live');
    buildAppIcons.setAttribute('aria-hidden', 'false');
  }
  const visualizerButton = getBuildAppButton('visualizer');
  const runQuick = quick || visualizerBuilt;

  try {
    buildVisualizerWindow?.classList.add('is-open', 'is-assembling');
    if (!runQuick) {
      terminalPrint('[build] assembling audio visualizer shell...', 'section');
      setBuildStatus('Assembling audio visualizer shell...');
      setBuildVisualizerStatus('Initializing visualizer frame.');
      await wait(VISUALIZER_FULL_BOOT_MS);
      if (teardownStarted || !buildStageActive) return;

      buildVisualizerWindow?.classList.add('is-piece-1');
      setBuildStatus('Linking spectral grid...');
      setBuildVisualizerStatus('Spectral grid linked.');
      await wait(VISUALIZER_FULL_STEP_MS);
      if (teardownStarted || !buildStageActive) return;

      buildVisualizerWindow?.classList.add('is-piece-2');
      setBuildStatus('Injecting etch and burst overlays...');
      setBuildVisualizerStatus('Etch and burst overlays online.');
      await wait(VISUALIZER_FULL_STEP_MS);
      if (teardownStarted || !buildStageActive) return;

      buildVisualizerWindow?.classList.add('is-piece-3');
      setBuildStatus('Calibrating signal bars...');
      setBuildVisualizerStatus('Calibrating signal bars.');
      await wait(VISUALIZER_FULL_STEP_MS);
      if (teardownStarted || !buildStageActive) return;
    } else {
      terminalPrint('[build] quick relink: audio visualizer.', 'muted');
      setBuildStatus('Quick relink for audio visualizer...');
      setBuildVisualizerStatus('Relinking analyzer stream...');
      buildVisualizerWindow?.classList.add('is-piece-1');
      await wait(VISUALIZER_QUICK_STEP_MS);
      if (teardownStarted || !buildStageActive) return;

      buildVisualizerWindow?.classList.add('is-piece-2', 'is-piece-3');
      setBuildVisualizerStatus('Repainting overlays and signal bars.');
      await wait(VISUALIZER_QUICK_STEP_MS);
      if (teardownStarted || !buildStageActive) return;
    }

    visualizerBuilt = true;
    visualizerButton?.classList.add('is-live');
    buildVisualizerWindow?.classList.add('is-live');
    buildVisualizerWindow?.classList.remove('is-assembling');
    openBuildVisualizerWindow({ focusStatus: true });
    terminalPrint('[build] audio visualizer online.', 'section');
  } finally {
    visualizerBuildoutRunning = false;
    if (!teardownStarted && buildStageActive) {
      setTerminalEnabled(true);
    }
    updateBuildTypingIndicator();
  }
}

function closeBuildAppWindow(options = {}) {
  const { silent = false } = options;
  buildAppWindow?.classList.remove('is-open');
  if (!silent) {
    setBuildStatus('Ame shell ready. Click an app icon or type open <section>.');
  }
}

function clearBuildRenderedState() {
  const parts = [buildTaskbar, buildSidebarLeft, buildSidebarRight, buildMainViewport, buildRemainingOs];
  for (const part of parts) {
    part?.classList.remove('is-rendered');
  }
  buildPersonalized = false;
  buildPersonalizationRunning = false;
  appBuildoutRunning = false;
  diaryBuildoutRunning = false;
  visualizerBuildoutRunning = false;
  visualizerBuilt = false;
  visualizerTypingImpulse = 0;
  if (visualizerBarLevels) {
    visualizerBarLevels.fill(0);
  }
  diaryWireframeBuilt = false;
  diaryEditorUnlocked = false;
  terminalShell?.classList.remove('build-personalized');
  buildAppIcons?.classList.remove('is-live');
  buildAppIcons?.setAttribute('aria-hidden', 'true');
  for (const button of buildAppIconButtons) {
    button.classList.remove('is-live');
  }
  buildSidebarLeft?.classList.remove('has-gothic');
  buildSidebarRight?.classList.remove('has-gothic');
  if (buildSidebarLeft) {
    buildSidebarLeft.style.removeProperty('--build-sidebar-image');
  }
  if (buildSidebarRight) {
    buildSidebarRight.style.removeProperty('--build-sidebar-image');
  }
  buildRecycleIcon?.classList.remove('is-rendered');
  buildRecycleWindow?.classList.remove('is-open');
  buildDiaryWireframe?.classList.remove('is-assembling', 'is-open');
  buildDiaryWireframe?.setAttribute('aria-hidden', 'true');
  buildDiaryWindow?.classList.remove('is-open');
  resetDiaryEditor();
  closeBuildVisualizerWindow({ silent: true });
  setBuildVisualizerStatus('Signal idle.');
  closeBuildAppWindow({ silent: true });
  updateBuildTypingIndicator();
}

function setBuildStageActive(active) {
  if (!terminalShell || !buildRenderStage) return;
  terminalShell.classList.toggle('build-stage-active', active);
  buildRenderStage.setAttribute('aria-hidden', active ? 'false' : 'true');
  buildStageActive = active;
  if (!active) {
    closeBuildVisualizerWindow({ silent: true });
  }
  updateBuildTypingIndicator();
}

function renderBuildPart(partOrParts) {
  if (Array.isArray(partOrParts)) {
    for (const part of partOrParts) {
      part?.classList.add('is-rendered');
    }
    return;
  }
  partOrParts?.classList.add('is-rendered');
}

function onBuildRecycleIconClick() {
  if (!buildStageActive || buildSequenceRunning || buildPersonalizationRunning || appBuildoutRunning || diaryBuildoutRunning || visualizerBuildoutRunning) return;
  buildRecycleWindow?.classList.add('is-open');
  setBuildStatus('Recycle Bin opened. No items detected.');
}

function onBuildRecycleCloseClick() {
  if (!buildStageActive || buildSequenceRunning || buildPersonalizationRunning || appBuildoutRunning || diaryBuildoutRunning || visualizerBuildoutRunning) return;
  buildRecycleWindow?.classList.remove('is-open');
  setBuildStatus('Skeleton OS ready. Press Esc to return.');
}

function onBuildAppIconClick(event) {
  if (!buildStageActive || buildSequenceRunning || buildPersonalizationRunning || appBuildoutRunning || diaryBuildoutRunning || visualizerBuildoutRunning) return;
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement)) return;
  const appKey = target.dataset.app;
  if (!appKey) return;
  if (appKey === 'visualizer') {
    runVisualizerBuildout({ quick: visualizerBuilt }).catch(() => {
      terminalPrint('visualizer buildout failed unexpectedly.', 'error');
    });
    return;
  }
  if (appKey === 'diary') {
    runDiaryBuildout().catch(() => {
      terminalPrint('diary buildout failed unexpectedly.', 'error');
    });
    return;
  }
  runBuildAppBuildout(appKey).catch(() => {
    terminalPrint('module buildout failed unexpectedly.', 'error');
  });
}

function onBuildAppCloseClick() {
  if (!buildStageActive || buildSequenceRunning || buildPersonalizationRunning || appBuildoutRunning || diaryBuildoutRunning || visualizerBuildoutRunning) return;
  closeBuildAppWindow();
}

function onBuildDiaryCloseClick() {
  if (!buildStageActive || buildSequenceRunning || buildPersonalizationRunning || appBuildoutRunning || diaryBuildoutRunning || visualizerBuildoutRunning) return;
  closeDiaryWindow();
}

function onBuildVisualizerCloseClick() {
  if (!buildStageActive || buildSequenceRunning || buildPersonalizationRunning || appBuildoutRunning || diaryBuildoutRunning || visualizerBuildoutRunning) return;
  closeBuildVisualizerWindow();
}

function closeBuildStageToTerminal() {
  if (!buildStageActive || buildSequenceRunning || buildPersonalizationRunning || appBuildoutRunning || diaryBuildoutRunning || visualizerBuildoutRunning) return;
  closeBuildAppWindow({ silent: true });
  closeDiaryWindow({ silent: true });
  closeBuildVisualizerWindow({ silent: true });
  setBuildStageActive(false);
  setTerminalEnabled(true);
  updateBuildTypingIndicator();
  terminalPrint('[build] viewport released. terminal control restored.', 'muted');
}

function onBuildStageKeyDown(event) {
  if (!buildStageActive || buildSequenceRunning || buildPersonalizationRunning || appBuildoutRunning || diaryBuildoutRunning || visualizerBuildoutRunning) return;
  if (proxyBuildTerminalKey(event)) return;
  if (event.key !== 'Escape') return;
  event.preventDefault();
  closeBuildStageToTerminal();
}

function applyBuildSidebarGothic(options = {}) {
  const { silent = false } = options;
  if (!buildStageActive || buildSequenceRunning) {
    terminalPrint('build mode is not ready yet.', 'muted');
    return;
  }
  const imageValue = `url('${BUILD_SIDEBAR_GOTHIC_SRC}')`;
  if (buildSidebarLeft) {
    buildSidebarLeft.classList.add('has-gothic');
    buildSidebarLeft.style.setProperty('--build-sidebar-image', imageValue);
  }
  if (buildSidebarRight) {
    buildSidebarRight.classList.add('has-gothic');
    buildSidebarRight.style.setProperty('--build-sidebar-image', imageValue);
  }
  if (!silent) {
    setBuildStatus('sidebar_gothic injected into skeleton sidebars.');
    terminalPrint('[build] applied sidebar_gothic to skeleton sidebars.', 'section');
  }
}

async function runAmePersonalization() {
  if (!buildStageActive) {
    terminalPrint('run build first to enter skeleton mode.', 'muted');
    return;
  }
  if (buildSequenceRunning) {
    terminalPrint('wait for build sequence to finish first.', 'muted');
    return;
  }
  if (visualizerBuildoutRunning) {
    terminalPrint('wait for visualizer buildout to finish first.', 'muted');
    return;
  }
  if (buildPersonalizationRunning) {
    terminalPrint('ame personalization already running.', 'muted');
    return;
  }
  if (buildPersonalized) {
    setBuildStatus('Ame shell already personalized.');
    terminalPrint('[build] ame personalization already applied.', 'muted');
    return;
  }

  buildPersonalizationRunning = true;
  setTerminalEnabled(false);
  setBuildStatus('Ame profile handshake accepted...');
  terminalPrint('[build] applying ame profile personalization...', 'section');

  try {
    await wait(AME_PERSONALIZE_BOOT_MS);
    if (teardownStarted || !buildStageActive) return;

    applyBuildSidebarGothic({ silent: true });
    setBuildStatus('Injecting gothic sidebars...');
    terminalPrint('[build] sidebars flipped and themed.', 'muted');
    await wait(AME_PERSONALIZE_STEP_MS);

    if (buildAppIcons) {
      buildAppIcons.classList.add('is-live');
      buildAppIcons.setAttribute('aria-hidden', 'false');
    }

    for (const appKey of BUILD_APP_ORDER) {
      if (teardownStarted || !buildStageActive) return;
      const button = getBuildAppButton(appKey);
      button?.classList.add('is-live');
      const title = BUILD_APP_TITLES[appKey] ?? appKey.toUpperCase();
      setBuildStatus(`Loading ${title} module...`);
      terminalPrint(`[build] module online: ${title}`, 'muted');
      await wait(AME_PERSONALIZE_STEP_MS);
    }

    if (teardownStarted || !buildStageActive) return;
    buildPersonalized = true;
    terminalShell?.classList.add('build-personalized');
    await runBuildAppBuildout('feed', {
      manageTerminal: false,
      emitTerminalLog: false,
      allowDuringPersonalization: true,
    });
    setBuildStatus('Ame shell personalized. Click app icons, type open <section>, or type diary.');
    terminalPrint('[build] personalization complete. shell is now OS-like and interactive.', 'section');
  } finally {
    buildPersonalizationRunning = false;
    if (!teardownStarted && buildStageActive) {
      setTerminalEnabled(true);
    }
    updateBuildTypingIndicator();
  }
}

async function runBuildSequence() {
  if (!buildRenderStage || !terminalShell) {
    terminalPrint('build pipeline unavailable in this session.', 'error');
    return;
  }
  if (buildSequenceRunning) {
    terminalPrint('build pipeline already running.', 'muted');
    return;
  }

  buildSequenceRunning = true;
  setTerminalEnabled(false);
  setBuildTaskbarTime();
  setBuildStageActive(true);
  clearBuildRenderedState();

  const steps = [
    {
      status: 'render: taskbar',
      parts: buildTaskbar,
      delayMs: BUILD_STEP_DELAY_MS,
    },
    {
      status: 'render: side-bars',
      parts: [buildSidebarLeft, buildSidebarRight],
      delayMs: BUILD_STEP_DELAY_MS,
    },
    {
      status: 'render: main viewport',
      parts: buildMainViewport,
      delayMs: BUILD_STEP_DELAY_MS + 40,
    },
    {
      status: 'render: remaining os + recycle bin app',
      parts: [buildRemainingOs, buildRecycleIcon],
      delayMs: BUILD_FINAL_DELAY_MS,
    },
  ];

  try {
    terminalPrint('[build] assembly pipeline started.', 'section');
    setBuildStatus('Assembly bus online...');
    await wait(230);

    for (const step of steps) {
      if (teardownStarted) return;
      terminalPrint(`[build] ${step.status}`, 'muted');
      setBuildStatus(`${step.status}...`);
      renderBuildPart(step.parts);
      await wait(step.delayMs);
    }

    if (teardownStarted) return;
    setBuildTaskbarTime();
    setBuildStatus('Skeleton OS online. Type "visualizer" to build audio visualizer or "ame" to personalize shell. Press Esc to return.');
    terminalPrint('[build] complete: skeleton OS online.', 'section');
    terminalPrint('[build] tip: type "visualizer" to assemble audio visualizer, or type "ame" for full personalization.', 'muted');
    setTerminalEnabled(true);
  } finally {
    buildSequenceRunning = false;
    if (!teardownStarted && buildStageActive) {
      setTerminalEnabled(true);
    }
    updateBuildTypingIndicator();
  }
}

function runTerminalCommand(rawCommand, options = {}) {
  const command = rawCommand.trim();
  if (!command) return;
  if (options.echo !== false) {
    terminalPrint(`${TERMINAL_PROMPT} ${command}`, 'input');
  }

  const normalized = command.toLowerCase();
  if (normalized === '-help' || normalized === 'help') {
    terminalShowHelp();
    return;
  }
  if (normalized === 'clear') {
    terminalClear();
    return;
  }
  if (normalized === 'sections' || normalized === 'ls') {
    if (!buildStageActive) {
      terminalPrint('sections is only available inside build terminal.', 'muted');
      return;
    }
    terminalPrint('sections: about, feed, notes, drift, state, logs', 'muted');
    return;
  }
  if (normalized === 'time') {
    terminalPrint(new Date().toLocaleString(), 'muted');
    return;
  }
  if (normalized === 'diary') {
    runDiaryBuildout().catch(() => {
      terminalPrint('diary buildout failed unexpectedly.', 'error');
    });
    return;
  }
  if (normalized === 'visualizer') {
    runVisualizerBuildout({ quick: visualizerBuilt }).catch(() => {
      terminalPrint('visualizer buildout failed unexpectedly.', 'error');
    });
    return;
  }
  if (normalized === 'ame') {
    runAmePersonalization().catch(() => {
      terminalPrint('ame personalization failed unexpectedly.', 'error');
    });
    return;
  }
  if (normalized === 'build') {
    runBuildSequence().catch(() => {
      terminalPrint('build failed unexpectedly.', 'error');
    });
    return;
  }
  if (normalized === 'all') {
    if (!buildStageActive) {
      terminalPrint('all is only available inside build terminal.', 'muted');
      return;
    }
    for (const key of Object.keys(TERMINAL_SECTIONS)) {
      terminalShowSection(key);
    }
    return;
  }

  const routed = normalized.match(/^(open|show|cat)\s+([a-z-]+)$/);
  const targetSection = normalizeSectionName(routed ? routed[2] : normalized);
  if (targetSection === 'visualizer') {
    runVisualizerBuildout({ quick: visualizerBuilt }).catch(() => {
      terminalPrint('visualizer buildout failed unexpectedly.', 'error');
    });
    return;
  }
  if (buildStageActive && buildPersonalized && BUILD_APP_TITLES[targetSection]) {
    if (targetSection === 'diary') {
      runDiaryBuildout().catch(() => {
        terminalPrint('diary buildout failed unexpectedly.', 'error');
      });
      return;
    }
    runBuildAppBuildout(targetSection).catch(() => {
      terminalPrint('module buildout failed unexpectedly.', 'error');
    });
    return;
  }
  if (buildStageActive && terminalShowSection(targetSection)) {
    return;
  }

  terminalPrint(`unknown command: ${command}`, 'error');
  terminalPrint('type -help for command list.', 'muted');
}

function setTerminalEnabled(enabled) {
  if (!terminalInput) return;
  terminalInput.disabled = !enabled;
  if (enabled) {
    terminalInput.focus();
    terminalOutput?.scrollTo(0, terminalOutput.scrollHeight);
  }
  updateBuildTypingIndicator();
}

function startTerminalSession() {
  if (terminalSessionStarted) return;
  terminalSessionStarted = true;
  terminalHistoryIndex = terminalHistory.length;
  terminalClear();
  terminalPrint('terminal online.', 'muted');
  setTerminalEnabled(true);
}

function onTerminalSubmit(event) {
  event.preventDefault();
  submitTerminalBuffer();
}

function isPrintableTerminalKey(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  return event.key.length === 1;
}

function onTerminalInputChange() {
  updateBuildTypingIndicator();
}

function onTerminalInputFocus() {
  tryResumeAudioContext();
  tryStartDrone();
  updateBuildTypingIndicator();
}

function onTerminalInputBlur() {
  updateBuildTypingIndicator();
}

function focusTerminalInputCaret() {
  if (!terminalInput || terminalInput.disabled) return;
  terminalInput.focus();
  terminalInput.setSelectionRange(terminalInput.value.length, terminalInput.value.length);
  updateBuildTypingIndicator();
}

function setTerminalInputText(value) {
  if (!terminalInput) return;
  terminalInput.value = value;
  terminalInput.setSelectionRange(terminalInput.value.length, terminalInput.value.length);
  updateBuildTypingIndicator();
}

function navigateTerminalHistory(direction) {
  if (!terminalInput || !terminalHistory.length) return;
  terminalHistoryIndex = clamp(terminalHistoryIndex + direction, 0, terminalHistory.length);
  const nextValue = terminalHistoryIndex >= terminalHistory.length ? '' : (terminalHistory[terminalHistoryIndex] ?? '');
  setTerminalInputText(nextValue);
}

function submitTerminalBuffer() {
  if (!terminalInput) return;
  const value = terminalInput.value;
  terminalInput.value = '';
  updateBuildTypingIndicator();
  const trimmed = value.trim();
  if (!trimmed) return;
  terminalHistory.push(trimmed);
  terminalHistoryIndex = terminalHistory.length;
  runTerminalCommand(trimmed);
}

function isEditableBuildTarget(element) {
  if (!(element instanceof HTMLElement)) return false;
  if (element === terminalInput) return true;
  if (element.isContentEditable) return true;
  const tag = element.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return false;
}

function onBuildRenderStagePointerDown(event) {
  if (!buildStageActive || !terminalInput || terminalInput.disabled) return;
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  // Don't steal focus from editable fields (e.g. diary password/editor).
  if (isEditableBuildTarget(target) || isEditableBuildTarget(target.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]'))) {
    return;
  }
  if (target.closest('#build-diary-window')) return;
  if (target.closest('#build-visualizer-window')) return;
  if (teardownStarted || !buildStageActive) return;
  tryResumeAudioContext();
  tryStartDrone();
  const active = document.activeElement;
  if (active instanceof HTMLElement) {
    if (active === terminalInput) return;
    if (isEditableBuildTarget(active)) return;
  }
  focusTerminalInputCaret();
}

function proxyBuildTerminalKey(event) {
  if (!buildStageActive || !terminalInput || terminalInput.disabled) return false;
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  if (document.activeElement === terminalInput) return false;
  const active = document.activeElement;
  if (active instanceof HTMLElement && isEditableBuildTarget(active)) return false;

  if (event.key.length === 1) {
    event.preventDefault();
    focusTerminalInputCaret();
    setTerminalInputText((terminalInput.value ?? '') + event.key);
    playTypingSound();
    return true;
  }
  if (event.key === 'Backspace') {
    event.preventDefault();
    focusTerminalInputCaret();
    const current = terminalInput.value ?? '';
    setTerminalInputText(current.slice(0, -1));
    return true;
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    focusTerminalInputCaret();
    navigateTerminalHistory(-1);
    return true;
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    focusTerminalInputCaret();
    navigateTerminalHistory(1);
    return true;
  }
  if (event.key === 'Enter') {
    event.preventDefault();
    focusTerminalInputCaret();
    submitTerminalBuffer();
    return true;
  }
  return false;
}

function onTerminalKeyDown(event) {
  if (!terminalInput) return;
  if (isPrintableTerminalKey(event)) {
    playTypingSound();
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'l') {
    event.preventDefault();
    terminalClear();
    return;
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    navigateTerminalHistory(-1);
    return;
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    navigateTerminalHistory(1);
  }
}

function setupTerminalInput() {
  if (!terminalForm || !terminalInput) return;
  terminalForm.addEventListener('submit', onTerminalSubmit);
  terminalInput.addEventListener('keydown', onTerminalKeyDown);
  terminalInput.addEventListener('input', onTerminalInputChange);
  terminalInput.addEventListener('focus', onTerminalInputFocus);
  terminalInput.addEventListener('blur', onTerminalInputBlur);
  setTerminalEnabled(false);
}

function setupBuildStage() {
  if (buildRecycleIcon) {
    buildRecycleIcon.addEventListener('click', onBuildRecycleIconClick);
  }
  if (buildRecycleClose) {
    buildRecycleClose.addEventListener('click', onBuildRecycleCloseClick);
  }
  for (const button of buildAppIconButtons) {
    button.addEventListener('click', onBuildAppIconClick);
  }
  if (buildAppClose) {
    buildAppClose.addEventListener('click', onBuildAppCloseClick);
  }
  if (buildVisualizerClose) {
    buildVisualizerClose.addEventListener('click', onBuildVisualizerCloseClick);
  }
  if (buildDiaryClose) {
    buildDiaryClose.addEventListener('click', onBuildDiaryCloseClick);
  }
  if (buildDiaryAuthForm) {
    buildDiaryAuthForm.addEventListener('submit', onDiaryUnlockSubmit);
  }
  if (buildDiarySave) {
    buildDiarySave.addEventListener('click', onDiarySaveClick);
  }
  if (buildRenderStage) {
    buildRenderStage.addEventListener('pointerdown', onBuildRenderStagePointerDown);
  }
  window.addEventListener('keydown', onBuildStageKeyDown);
  setBuildTaskbarTime();
  setBuildStatus('Awaiting build command...');
  setBuildVisualizerStatus('Signal idle.');
  resetDiaryEditor();
  updateBuildTypingIndicator();
}

function onBiosStagePointerDown(event) {
  // TODO(temporary): remove BIOS click-to-skip shortcut after pacing is finalized.
  if (!biosPreludeActive || teardownStarted) return;
  if (event.button !== 0) return;
  biosSkipClickCount += 1;
  if (biosSkipClickCount >= BIOS_SKIP_CLICK_THRESHOLD) {
    biosSkipRequested = true;
    biosSkipClickCount = 0;
  }
}

function heartbeatEnvelope(phase, center, sigma) {
  const delta = phase - center;
  return Math.exp(-(delta * delta) / (2 * sigma * sigma));
}

function getHeartBeatScale(timeSeconds) {
  const cycle = ASCII_HEART_BEAT_CYCLE_S;
  const phase = ((timeSeconds % cycle) + cycle) % cycle / cycle;
  const primary = heartbeatEnvelope(phase, ASCII_HEART_BEAT_PRIMARY_CENTER, ASCII_HEART_BEAT_PRIMARY_SIGMA);
  const secondary = heartbeatEnvelope(phase, ASCII_HEART_BEAT_SECONDARY_CENTER, ASCII_HEART_BEAT_SECONDARY_SIGMA);
  const intensity = clamp((primary * 1.06) + (secondary * 0.84), 0, 1.92);
  return 1 + (intensity * ASCII_HEART_BEAT_SCALE_STRENGTH);
}

function selectHeartTemplate(normalizedBeat) {
  if (normalizedBeat > 0.72) return ASCII_HEART_TEMPLATE_EXPANDED;
  if (normalizedBeat > 0.3) return ASCII_HEART_TEMPLATE_BASE;
  return ASCII_HEART_TEMPLATE_COMPACT;
}

function buildAsciiHeartFrame(normalizedBeat) {
  const template = selectHeartTemplate(normalizedBeat);
  const glyph = normalizedBeat > 0.72 ? '@' : (normalizedBeat > 0.34 ? '#' : '+');
  return template
    .map((line) => line.replaceAll('x', glyph))
    .join('\n');
}

function renderTerminalHeartFrame() {
  if (!terminalHeart) return;
  const beatScale = getHeartBeatScale(heartTimelineMs / 1000);
  const beatAmount = clamp((beatScale - 1) / ASCII_HEART_BEAT_SCALE_STRENGTH, 0, 1.92);
  const normalizedBeat = clamp(beatAmount / 1.92, 0, 1);
  const opacity = lerp(ASCII_HEART_MIN_OPACITY, ASCII_HEART_MAX_OPACITY, normalizedBeat);
  const glowPx = lerp(ASCII_HEART_MIN_GLOW_PX, ASCII_HEART_MAX_GLOW_PX, normalizedBeat);

  terminalHeart.textContent = buildAsciiHeartFrame(normalizedBeat);
  terminalHeart.style.transform = 'translateZ(0)';
  terminalHeart.style.opacity = opacity.toFixed(3);
  terminalHeart.style.textShadow = `0 0 ${glowPx.toFixed(2)}px rgba(202, 40, 105, 0.22)`;
}

function playHeartThump(kind = 'primary') {
  if (!audioContext || !heartThumpInputNode || !droneMasterGain) return;

  const now = audioContext.currentTime;
  const isPrimary = kind === 'primary';
  const baseFreq = isPrimary ? HEART_THUMP_PRIMARY_FREQ_HZ : HEART_THUMP_SECONDARY_FREQ_HZ;
  const peak = isPrimary ? HEART_THUMP_PRIMARY_PEAK : HEART_THUMP_SECONDARY_PEAK;
  const endFreq = baseFreq * HEART_THUMP_SWEEP_RATIO;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + HEART_THUMP_DURATION_S);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + HEART_THUMP_ATTACK_S);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + HEART_THUMP_RELEASE_S);

  osc.connect(gain);
  gain.connect(heartThumpInputNode);
  osc.start(now);
  osc.stop(now + HEART_THUMP_DURATION_S);
  osc.onended = () => {
    try {
      osc.disconnect();
      gain.disconnect();
    } catch {
      // ignore disconnect cleanup failures
    }
  };
}

function startTerminalHeartAnimation() {
  if (!terminalHeart || heartAnimationRafId) return;

  tryStartDrone();
  heartFrameAccumulator = 0;
  heartLastFrameTs = performance.now();
  heartTimelineMs = 0;
  const heartBeatCycleMs = ASCII_HEART_BEAT_CYCLE_S * 1000;
  heartThumpNextPrimaryMs = ASCII_HEART_BEAT_PRIMARY_CENTER * heartBeatCycleMs;
  heartThumpNextSecondaryMs = ASCII_HEART_BEAT_SECONDARY_CENTER * heartBeatCycleMs;
  renderTerminalHeartFrame();

  const tick = (timestamp) => {
    if (teardownStarted) {
      stopTerminalHeartAnimation();
      return;
    }
    const delta = Math.min(250, timestamp - heartLastFrameTs);
    heartLastFrameTs = timestamp;
    heartFrameAccumulator += delta;

    let didRender = false;
    while (heartFrameAccumulator >= ASCII_HEART_FRAME_MS) {
      heartFrameAccumulator -= ASCII_HEART_FRAME_MS;
      heartTimelineMs += ASCII_HEART_FRAME_MS;
      while (heartTimelineMs >= heartThumpNextPrimaryMs) {
        playHeartThump('primary');
        heartThumpNextPrimaryMs += heartBeatCycleMs;
      }
      while (heartTimelineMs >= heartThumpNextSecondaryMs) {
        playHeartThump('secondary');
        heartThumpNextSecondaryMs += heartBeatCycleMs;
      }
      didRender = true;
    }

    if (didRender) {
      renderTerminalHeartFrame();
    }

    heartAnimationRafId = window.requestAnimationFrame(tick);
  };

  heartAnimationRafId = window.requestAnimationFrame(tick);
}

function stopTerminalHeartAnimation() {
  if (heartAnimationRafId) {
    window.cancelAnimationFrame(heartAnimationRafId);
    heartAnimationRafId = 0;
  }
  if (terminalHeart) {
    terminalHeart.textContent = buildAsciiHeartFrame(0);
    terminalHeart.style.transform = 'translateZ(0)';
    terminalHeart.style.opacity = `${ASCII_HEART_MIN_OPACITY}`;
    terminalHeart.style.textShadow = `0 0 ${ASCII_HEART_MIN_GLOW_PX}px rgba(202, 40, 105, 0.15)`;
  }
  heartThumpNextPrimaryMs = 0;
  heartThumpNextSecondaryMs = 0;
}

async function typeBiosStep(step) {
  if (!biosLog || teardownStarted || biosSkipRequested) return;
  if (step.emphasis && biosScreen) biosScreen.classList.add('emphasis');
  if (step.emphasis) appendBiosText('\n');

  const charMinBase = step.charMinMs ?? (step.emphasis ? BIOS_CHAR_DELAY_MIN_MS + 16 : BIOS_CHAR_DELAY_MIN_MS);
  const charMaxBase = step.charMaxMs ?? (step.emphasis ? BIOS_CHAR_DELAY_MAX_MS + 20 : BIOS_CHAR_DELAY_MAX_MS);
  const charMin = scaleBiosDuration(charMinBase);
  const charMax = Math.max(charMin, scaleBiosDuration(charMaxBase));
  const spaceMin = scaleBiosDuration(10);
  const spaceMax = Math.max(spaceMin, scaleBiosDuration(20));
  const textTarget = step.phraseHighlight
    ? appendBiosText('', 'bios-phrase')
    : document.createTextNode('');

  if (!step.phraseHighlight) {
    biosLog.appendChild(textTarget);
  }

  for (const char of step.text) {
    if (teardownStarted || biosSkipRequested) return;
    if (textTarget) {
      textTarget.textContent += char;
    }
    playTypingSound();
    const charDelay = char === ' ' ? randomBetween(spaceMin, spaceMax) : randomBetween(charMin, charMax);
    await waitBiosOrSkip(charDelay);
  }
  appendBiosText('\n');

  if (step.emphasis && !biosSkipRequested) {
    appendBiosText('\n');
    await waitBiosOrSkip(scaleBiosDuration(540));
    if (biosScreen) biosScreen.classList.remove('emphasis');
  }
}

async function runBiosPrelude() {
  if (!biosLog) return;
  biosPreludeActive = true;
  biosSkipRequested = false;
  biosSkipClickCount = 0;
  initTypingSoundPool();
  biosStartMs = performance.now();
  setState('bios');
  biosLog.textContent = '';
  const biosScript = buildBiosScript();
  try {
    for (const step of biosScript) {
      if (teardownStarted || biosSkipRequested) break;
      await typeBiosStep(step);
      if (teardownStarted || biosSkipRequested) break;
      const holdMs = Number.isFinite(step.holdMs) ? step.holdMs : randomBetween(BIOS_LINE_DELAY_MIN_MS, BIOS_LINE_DELAY_MAX_MS);
      await waitBiosOrSkip(scaleBiosDuration(holdMs));
    }

    if (!biosSkipRequested) {
      const targetMs = scaleBiosDuration(BIOS_TARGET_MS);
      const elapsed = performance.now() - biosStartMs;
      if (elapsed < targetMs) {
        await waitBiosOrSkip(targetMs - elapsed);
      }
    }
  } finally {
    biosPreludeActive = false;
    biosSkipRequested = false;
    biosSkipClickCount = 0;
    if (biosScreen) biosScreen.classList.remove('emphasis');
  }
}

async function runQuickCrtPowerCycle() {
  if (!root || teardownStarted) return;
  setState('bios-off');
  await wait(scaleBiosDuration(CRT_POWER_CYCLE_OFF_MS));
}

function promptBiosDecision() {
  if (!biosLog) return Promise.resolve('accept');

  appendBiosText('\n');
  appendBiosText('PS C:\\AmesCorner> Type Accept or Deny, then press Enter.\n');

  return new Promise((resolve) => {
    let input = '';
    let activePrompt = appendBiosText('PS C:\\AmesCorner> ', 'bios-decision-input');

    const renderPrompt = () => {
      if (!activePrompt) return;
      activePrompt.textContent = `PS C:\\AmesCorner> ${input}`;
    };

    const spawnFreshPrompt = () => {
      appendBiosText('\n');
      input = '';
      activePrompt = appendBiosText('PS C:\\AmesCorner> ', 'bios-decision-input');
    };

    const finish = (result) => {
      window.removeEventListener('keydown', onKeyDown);
      biosDecisionCleanup = null;
      appendBiosText('\n');
      resolve(result);
    };

    const onKeyDown = (event) => {
      if (teardownStarted) {
        finish('deny');
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.key === 'Enter') {
        event.preventDefault();
        const normalized = input.trim().toLowerCase();
        if (normalized === 'accept') {
          finish('accept');
          return;
        }
        if (normalized === 'deny') {
          finish('deny');
          return;
        }
        appendBiosText('\n');
        appendBiosText('Invalid entry. Type Accept or Deny.\n', 'bios-decision-error');
        spawnFreshPrompt();
        return;
      }

      if (event.key === 'Backspace') {
        event.preventDefault();
        if (!input.length) return;
        input = input.slice(0, -1);
        renderPrompt();
        return;
      }

      if (event.key.length === 1) {
        event.preventDefault();
        input += event.key;
        renderPrompt();
      }
    };

    biosDecisionCleanup = () => {
      window.removeEventListener('keydown', onKeyDown);
      biosDecisionCleanup = null;
    };
    window.addEventListener('keydown', onKeyDown);
  });
}

function setCrtVars(vars) {
  for (const [name, value] of Object.entries(vars)) {
    setVar(name, value);
  }
}

function applyNeutralCrtState() {
  setCrtVars({
    '--crt-lens-jitter-x': '0px',
    '--crt-lens-jitter-y': '0px',
    '--crt-lens-rot-x': '0deg',
    '--crt-lens-rot-y': '0deg',
    '--crt-lens-scale-x': '1',
    '--crt-lens-scale-y': '1',
    '--crt-lens-brightness': '1',
    '--crt-lens-contrast': '1',
    '--crt-lens-saturation': '1',
    '--crt-mask-alpha': '0.05',
    '--crt-scanline-alpha': '0.09',
    '--crt-noise-alpha': '0.02',
    '--crt-beam-y': '-120%',
    '--crt-beam-alpha': '0.08',
    '--crt-roll-y': '-60%',
    '--crt-roll-alpha': '0.02',
    '--crt-vignette-alpha': '0.28',
    '--crt-reflection-alpha': '0.06',
    '--crt-aberration-alpha': '0.015',
    '--crt-chroma-offset-x': '0px',
    '--crt-chroma-offset-y': '0px',
    '--crt-stack-opacity': '0.32',
  });
}

function getResetCycleGain(elapsedMs) {
  const progress = clamp(elapsedMs / RESET_CYCLE_MS, 0, 1);
  const seg1 = 0.16;
  const seg2 = 0.33;
  const seg3 = 0.5;
  const seg4 = 0.66;
  const seg5 = 0.83;

  if (progress < seg1) {
    return lerp(0.12, 0.34, easeOutCubic(progress / seg1));
  }
  if (progress < seg2) {
    return lerp(0.34, 0.06, easeOutCubic((progress - seg1) / (seg2 - seg1)));
  }
  if (progress < seg3) {
    return 0.04;
  }
  if (progress < seg4) {
    return lerp(0.08, 0.42, easeOutCubic((progress - seg3) / (seg4 - seg3)));
  }
  if (progress < seg5) {
    return lerp(0.42, 0.08, easeOutCubic((progress - seg4) / (seg5 - seg4)));
  }
  return 0.12;
}

function getBootGain(elapsedMs) {
  if (elapsedMs <= CRT_BOOT_BLACKOUT_MS) {
    return 0;
  }

  if (elapsedMs <= CRT_BOOT_BLACKOUT_MS + CRT_BOOT_WARMUP_MS) {
    const t = (elapsedMs - CRT_BOOT_BLACKOUT_MS) / CRT_BOOT_WARMUP_MS;
    return lerp(0.02, 0.09, easeOutCubic(t));
  }

  if (elapsedMs <= CRT_BOOT_BLACKOUT_MS + CRT_BOOT_WARMUP_MS + CRT_BOOT_EXPAND_MS) {
    const t = (elapsedMs - CRT_BOOT_BLACKOUT_MS - CRT_BOOT_WARMUP_MS) / CRT_BOOT_EXPAND_MS;
    return lerp(0.09, 0.82, easeOutCubic(t));
  }

  if (elapsedMs <= CRT_BOOT_TOTAL_MS) {
    const t = (elapsedMs - CRT_BOOT_BLACKOUT_MS - CRT_BOOT_WARMUP_MS - CRT_BOOT_EXPAND_MS) / CRT_BOOT_SETTLE_MS;
    return lerp(0.82, 1, easeInOutCubic(t));
  }

  return 1;
}

function stopVisualController() {
  if (!visualRafId) return;
  window.cancelAnimationFrame(visualRafId);
  visualRafId = 0;
  applyNeutralCrtState();
}

function startVisualController() {
  if (visualRafId) return;
  applyNeutralCrtState();

  function tick(timestampMs) {
    const sweepProgress = (timestampMs % CRT_SWEEP_MS) / CRT_SWEEP_MS;
    const sweepPulse = gaussianPulse(sweepProgress, CRT_PULSE_CENTER, CRT_PULSE_SIGMA);
    const rollProgress = (timestampMs % CRT_ROLL_MS) / CRT_ROLL_MS;
    const mobileGain = window.matchMedia('(max-width: 900px)').matches ? 0.55 : 0.85;
    const analogFlutter = (Math.random() - 0.5) * 0.01;

    let stateGain = 1;
    if (currentState === 'reset-cycle') {
      stateGain = getResetCycleGain(timestampMs - resetStartMs);
    } else if (currentState === 'booting') {
      stateGain = getBootGain(timestampMs - bootStartMs);
      if (timestampMs - bootStartMs >= CRT_BOOT_TOTAL_MS) {
        setState('on');
        startTerminalSession();
      }
    } else if (currentState === 'on') {
      startTerminalSession();
    }

    const motionGain = mobileGain * (0.25 + stateGain * 0.75);
    const jitterScale = (0.08 + sweepPulse * 0.12) * motionGain;
    const jitterX = (Math.sin(timestampMs * 0.0072) * 0.08 + (Math.random() - 0.5) * 0.14) * jitterScale;
    const jitterY = (Math.sin(timestampMs * 0.0059) * 0.08 + (Math.random() - 0.5) * 0.12) * jitterScale;
    const rotX = (Math.sin(timestampMs * 0.0017) * 0.18 + Math.sin(timestampMs * 0.0063) * 0.08) * motionGain;
    const rotY = (Math.sin(timestampMs * 0.0014) * 0.16 + Math.sin(timestampMs * 0.0058) * 0.07) * motionGain;
    const scaleX = 1 + (sweepPulse * 0.0012) + (Math.sin(timestampMs * 0.0038) * 0.0004 * motionGain);
    const scaleY = 1 - (sweepPulse * 0.0013) - (Math.sin(timestampMs * 0.0038) * 0.0004 * motionGain);

    const brightness = clamp((0.96 + sweepPulse * 0.04 + analogFlutter) * (0.25 + stateGain * 0.75), 0.16, 1.03);
    const contrast = clamp(0.98 + sweepPulse * 0.08 + Math.sin(timestampMs * 0.009) * 0.01, 0.9, 1.08);
    const saturation = clamp((0.94 + sweepPulse * 0.05 + Math.sin(timestampMs * 0.004) * 0.008) * (0.8 + stateGain * 0.2), 0.78, 1.02);

    const scanlineAlpha = clamp((0.08 + sweepPulse * 0.06 + Math.sin(timestampMs * 0.013) * 0.01) * (0.42 + stateGain * 0.58), 0.03, 0.18);
    const maskAlpha = clamp((0.05 + sweepPulse * 0.03) * (0.45 + stateGain * 0.55), 0.02, 0.12);
    const noiseAlpha = clamp((0.015 + Math.random() * 0.03 + sweepPulse * 0.02) * (0.4 + stateGain * 0.6), 0.005, 0.08);
    const beamAlpha = clamp((0.05 + sweepPulse * 0.12 + Math.random() * 0.02) * (0.2 + stateGain * 0.8), 0.02, 0.24);
    const rollAlpha = clamp((0.01 + Math.sin(timestampMs * 0.0019) * 0.01 + sweepPulse * 0.015) * (0.3 + stateGain * 0.7), 0.005, 0.07);
    const vignetteAlpha = clamp(0.24 + sweepPulse * 0.04 + (1 - stateGain) * 0.06, 0.2, 0.38);
    const reflectionAlpha = clamp((0.04 + sweepPulse * 0.04 + Math.sin(timestampMs * 0.0014) * 0.01) * (0.3 + stateGain * 0.7), 0.015, 0.16);
    const aberrationAlpha = clamp((0.01 + sweepPulse * 0.02) * (0.5 + stateGain * 0.5), 0.004, 0.05);
    const beamY = (sweepProgress * 250) - 125;
    const rollY = (rollProgress * 180) - 60;
    const chromaOffsetX = (Math.sin(timestampMs * 0.0043) * 0.12 + (Math.random() - 0.5) * 0.02) * (0.4 + sweepPulse * 0.6) * motionGain;
    const chromaOffsetY = (Math.sin(timestampMs * 0.0032) * 0.05) * (0.4 + sweepPulse * 0.5) * motionGain;
    const stackOpacity = clamp(0.16 + stateGain * 0.22, 0.14, 0.4);

    setCrtVars({
      '--crt-lens-jitter-x': `${jitterX.toFixed(3)}px`,
      '--crt-lens-jitter-y': `${jitterY.toFixed(3)}px`,
      '--crt-lens-rot-x': `${rotX.toFixed(4)}deg`,
      '--crt-lens-rot-y': `${rotY.toFixed(4)}deg`,
      '--crt-lens-scale-x': scaleX.toFixed(5),
      '--crt-lens-scale-y': scaleY.toFixed(5),
      '--crt-lens-brightness': brightness.toFixed(4),
      '--crt-lens-contrast': contrast.toFixed(4),
      '--crt-lens-saturation': saturation.toFixed(4),
      '--crt-mask-alpha': maskAlpha.toFixed(4),
      '--crt-scanline-alpha': scanlineAlpha.toFixed(4),
      '--crt-noise-alpha': noiseAlpha.toFixed(4),
      '--crt-beam-y': `${beamY.toFixed(3)}%`,
      '--crt-beam-alpha': beamAlpha.toFixed(4),
      '--crt-roll-y': `${rollY.toFixed(3)}%`,
      '--crt-roll-alpha': rollAlpha.toFixed(4),
      '--crt-vignette-alpha': vignetteAlpha.toFixed(4),
      '--crt-reflection-alpha': reflectionAlpha.toFixed(4),
      '--crt-aberration-alpha': aberrationAlpha.toFixed(4),
      '--crt-chroma-offset-x': `${chromaOffsetX.toFixed(3)}px`,
      '--crt-chroma-offset-y': `${chromaOffsetY.toFixed(3)}px`,
      '--crt-stack-opacity': stackOpacity.toFixed(4),
    });

    if (!teardownStarted) {
      visualRafId = window.requestAnimationFrame(tick);
    }
  }

  visualRafId = window.requestAnimationFrame(tick);
}

function createNoiseBuffer(context, durationSeconds) {
  const length = Math.floor(context.sampleRate * durationSeconds);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * 0.4;
  }
  return buffer;
}

async function startDarkDrone() {
  if (droneStarted || !AudioContextCtor) return;
  droneStarted = true;
  audioContext = new AudioContextCtor();

  try {
    await audioContext.resume();
  } catch {
    audioContext.close().catch(() => {
      // ignore close failures after blocked resume
    });
    droneStarted = false;
    audioContext = null;
    return;
  }

  const compressor = audioContext.createDynamicsCompressor();
  compressor.threshold.value = -22;
  compressor.knee.value = 14;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.004;
  compressor.release.value = 0.2;

  droneMasterGain = audioContext.createGain();
  droneMasterGain.gain.value = 0.0001;
  compressor.connect(droneMasterGain);
  droneMasterGain.connect(audioContext.destination);

  visualizerAnalyserNode = audioContext.createAnalyser();
  visualizerAnalyserNode.fftSize = VISUALIZER_FFT_SIZE;
  visualizerAnalyserNode.minDecibels = -100;
  visualizerAnalyserNode.maxDecibels = -12;
  visualizerAnalyserNode.smoothingTimeConstant = 0.82;
  visualizerFrequencyData = new Uint8Array(visualizerAnalyserNode.frequencyBinCount);
  visualizerBarLevels = new Float32Array(VISUALIZER_BAR_COUNT);
  visualizerTapGainNode = audioContext.createGain();
  visualizerTapGainNode.gain.value = 0;
  droneMasterGain.connect(visualizerAnalyserNode);
  visualizerAnalyserNode.connect(visualizerTapGainNode);
  visualizerTapGainNode.connect(audioContext.destination);

  const thumpFilter = audioContext.createBiquadFilter();
  thumpFilter.type = 'lowpass';
  thumpFilter.frequency.value = 148;
  thumpFilter.Q.value = 0.7;
  const thumpGain = audioContext.createGain();
  thumpGain.gain.value = 1;
  thumpFilter.connect(thumpGain);
  thumpGain.connect(droneMasterGain);
  heartThumpInputNode = thumpFilter;

  const startAt = audioContext.currentTime + 0.02;

  function addOsc(type, frequency, gainValue) {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = gainValue * AMBIENT_BUZZ_LEVEL_SCALE;
    osc.connect(gain);
    gain.connect(compressor);
    osc.start(startAt);
    droneNodes.push(osc);
  }

  addOsc('sine', 53, 0.045);
  addOsc('triangle', 96, 0.022);
  addOsc('sawtooth', 122, 0.011);

  const hissSource = audioContext.createBufferSource();
  hissSource.buffer = createNoiseBuffer(audioContext, 2.5);
  hissSource.loop = true;
  const hissFilter = audioContext.createBiquadFilter();
  hissFilter.type = 'bandpass';
  hissFilter.frequency.value = 6300;
  hissFilter.Q.value = 0.9;
  const hissGain = audioContext.createGain();
  hissGain.gain.value = 0.03 * AMBIENT_BUZZ_LEVEL_SCALE;
  hissSource.connect(hissFilter);
  hissFilter.connect(hissGain);
  hissGain.connect(compressor);
  hissSource.start(startAt);
  droneNodes.push(hissSource);

  const rumbleSource = audioContext.createBufferSource();
  rumbleSource.buffer = createNoiseBuffer(audioContext, 3);
  rumbleSource.loop = true;
  const rumbleFilter = audioContext.createBiquadFilter();
  rumbleFilter.type = 'lowpass';
  rumbleFilter.frequency.value = 110;
  rumbleFilter.Q.value = 0.7;
  const rumbleGain = audioContext.createGain();
  rumbleGain.gain.value = 0.02 * AMBIENT_BUZZ_LEVEL_SCALE;
  rumbleSource.connect(rumbleFilter);
  rumbleFilter.connect(rumbleGain);
  rumbleGain.connect(compressor);
  rumbleSource.start(startAt);
  droneNodes.push(rumbleSource);

  droneMasterGain.gain.setValueAtTime(0.0001, startAt);
  droneMasterGain.gain.exponentialRampToValueAtTime(0.24, startAt + 1.4);
}

function duckDroneForReset() {
  if (!droneMasterGain || !audioContext) return;
  const now = audioContext.currentTime;
  droneMasterGain.gain.cancelScheduledValues(now);
  droneMasterGain.gain.setValueAtTime(Math.max(droneMasterGain.gain.value, 0.001), now);
  droneMasterGain.gain.exponentialRampToValueAtTime(0.065, now + 0.18);
}

function recoverDroneAfterReset() {
  if (!droneMasterGain || !audioContext) return;
  const now = audioContext.currentTime;
  droneMasterGain.gain.cancelScheduledValues(now);
  droneMasterGain.gain.setValueAtTime(Math.max(droneMasterGain.gain.value, 0.001), now);
  droneMasterGain.gain.exponentialRampToValueAtTime(0.24, now + 0.9);
}

function stopDarkDrone() {
  for (const node of droneNodes) {
    try {
      node.stop();
    } catch {
      // ignore node stop failures
    }
  }
  droneNodes = [];

  if (audioContext) {
    audioContext.close().catch(() => {
      // ignore context close failures
    });
  }
  audioContext = null;
  droneMasterGain = null;
  heartThumpInputNode = null;
  visualizerAnalyserNode = null;
  visualizerTapGainNode = null;
  visualizerFrequencyData = null;
  droneStarted = false;
}

function tryResumeAudioContext() {
  if (!audioContext || audioContext.state === 'running') return;
  audioContext.resume().catch(() => {
    // ignore resume failures when autoplay policy blocks
  });
}

function pulseGlitch() {
  if (!root || currentState !== 'on') return;
  root.classList.add('crt-glitch');
  setManagedTimeout(() => {
    root.classList.remove('crt-glitch');
  }, 120);
}

async function runFlow() {
  if (!root || !biosLog) return;
  terminalSessionStarted = false;
  setTerminalEnabled(false);
  setState('bios');

  await runBiosPrelude();
  if (teardownStarted) return;

  const decision = await promptBiosDecision();
  if (teardownStarted) return;
  if (decision === 'deny') {
    window.location.reload();
    return;
  }
  await runQuickCrtPowerCycle();
  if (teardownStarted) return;

  startTerminalHeartAnimation();
  setState('reset-cycle');
  resetStartMs = performance.now();
  startVisualController();
  duckDroneForReset();
  await wait(RESET_CYCLE_MS);
  if (teardownStarted) return;

  setState('booting');
  bootStartMs = performance.now();
  recoverDroneAfterReset();
}

const glitchIntervalId = window.setInterval(() => {
  if (Math.random() > 0.78) pulseGlitch();
}, 2100);

setupTerminalInput();
setupBuildStage();
if (biosStage) {
  biosStage.addEventListener('pointerdown', onBiosStagePointerDown);
}

function tryStartDrone() {
  startDarkDrone().catch(() => {
    // If blocked, stay silent by design.
  });
}

tryStartDrone();

if (root && biosLog) {
  runFlow().catch(() => {
    if (teardownStarted) return;
    setState('booting');
    bootStartMs = performance.now();
    startTerminalHeartAnimation();
    startVisualController();
  });
}

window.addEventListener('pagehide', () => {
  teardownStarted = true;
  if (biosDecisionCleanup) {
    biosDecisionCleanup();
  }
  clearManagedTimers();
  stopVisualController();
  stopTerminalHeartAnimation();
  window.clearInterval(glitchIntervalId);
  if (terminalForm) {
    terminalForm.removeEventListener('submit', onTerminalSubmit);
  }
  if (terminalInput) {
    terminalInput.removeEventListener('keydown', onTerminalKeyDown);
    terminalInput.removeEventListener('input', onTerminalInputChange);
    terminalInput.removeEventListener('focus', onTerminalInputFocus);
    terminalInput.removeEventListener('blur', onTerminalInputBlur);
  }
  if (buildRecycleIcon) {
    buildRecycleIcon.removeEventListener('click', onBuildRecycleIconClick);
  }
  if (buildRecycleClose) {
    buildRecycleClose.removeEventListener('click', onBuildRecycleCloseClick);
  }
  for (const button of buildAppIconButtons) {
    button.removeEventListener('click', onBuildAppIconClick);
  }
  if (buildAppClose) {
    buildAppClose.removeEventListener('click', onBuildAppCloseClick);
  }
  if (buildVisualizerClose) {
    buildVisualizerClose.removeEventListener('click', onBuildVisualizerCloseClick);
  }
  if (buildDiaryClose) {
    buildDiaryClose.removeEventListener('click', onBuildDiaryCloseClick);
  }
  if (buildDiaryAuthForm) {
    buildDiaryAuthForm.removeEventListener('submit', onDiaryUnlockSubmit);
  }
  if (buildDiarySave) {
    buildDiarySave.removeEventListener('click', onDiarySaveClick);
  }
  if (buildRenderStage) {
    buildRenderStage.removeEventListener('pointerdown', onBuildRenderStagePointerDown);
  }
  window.removeEventListener('keydown', onBuildStageKeyDown);
  if (biosStage) {
    biosStage.removeEventListener('pointerdown', onBiosStagePointerDown);
  }
  stopTypingSoundPool();
  stopVisualizerLoop();
  stopDarkDrone();
}, { once: true });
