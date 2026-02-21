import * as THREE from 'three';

const root = document.querySelector('.corner-shell');
const biosLog = document.querySelector('.bios-log');
const biosScreen = document.querySelector('.bios-screen');
const biosStage = document.querySelector('.bios-stage');

const osLoaderStage = document.querySelector('#os-loader-stage');
const osLoaderCanvas = document.querySelector('#os-loader-canvas');
const osLoaderProgressFill = document.querySelector('#os-loader-progress-fill');
const osLoaderReadout = document.querySelector('#os-loader-readout');

const osStage = document.querySelector('#os-stage');
const osDesktop = document.querySelector('#os-desktop');
const osWindowLayer = document.querySelector('#os-window-layer');
const osTaskbar = document.querySelector('.os-taskbar');
const osTaskbarApps = document.querySelector('#os-taskbar-apps');
const osStartButton = document.querySelector('#os-start-button');
const osStartMenu = document.querySelector('#os-start-menu');
const osRestartButton = document.querySelector('#os-restart-button');
const osShutdownButton = document.querySelector('#os-shutdown-button');
const osShutdownScreen = document.querySelector('#os-shutdown-screen');
const osRebootButton = document.querySelector('#os-reboot-button');
const osDateTime = document.querySelector('#os-datetime');
const osBgVisualizer = document.querySelector('#os-bg-visualizer');

const STATE_CLASSES = ['state-bios', 'state-bios-off', 'state-os-loader', 'state-os-ready', 'state-teardown'];

const BIOS_SPEED_MULTIPLIER = 0.92;
const BIOS_TARGET_MS = 26000;
const CRT_POWER_CYCLE_OFF_MS = 320;
const BIOS_LINE_DELAY_MIN_MS = 220;
const BIOS_LINE_DELAY_MAX_MS = 460;
const BIOS_CHAR_DELAY_MIN_MS = 12;
const BIOS_CHAR_DELAY_MAX_MS = 22;
const BIOS_READOUT_SPEED_MULTIPLIER = 0.08;
const BIOS_PHRASE_SPEED_MULTIPLIER = 0.4;
const BIOS_BURST_CHUNK_LINES = 24;
const BIOS_BURST_LINE_DELAY_MS = 24;
const BIOS_HYPERFLOW_BLUR_THRESHOLD_LPS = 140;
const BIOS_VIEWPORT_TAIL_PADDING_PX = 420;
const BIOS_SKIP_CLICK_THRESHOLD = 10;
const BIOS_BOOTING_PROMPT_MS = 1900;
const BIOS_BOOTING_DOT_INTERVAL_MS = 180;
const LOADER_TOTAL_MS = 8000;

const TYPING_SOUND_SRC = '/sounds/click.mp3';
const TYPING_SOUND_POOL_SIZE = 8;
const TYPING_SOUND_BASE_VOLUME = 0.13;

const STORAGE_ICON_LAYOUT = 'ames_corner_os_icon_layout_v1';
const STORAGE_ICON_LAYOUT_SHIFT_UP = 'ames_corner_os_icon_layout_shift_up_v1';
const STORAGE_NOTES = 'ames_corner_os_notes_v1';
const STORAGE_SETTINGS = 'ames_corner_os_settings_v1';
const STORAGE_TASKBAR_PINS = 'ames_corner_os_taskbar_pins_v1';

const UNKNOWN_TELEMETRY = 'UNKNOWN';
const AUTH_PROFILE_STORAGE_KEY = 'windose_auth_profile_v2';

const ICON_DOUBLE_CLICK_MS = 320;
const ICON_GRID_X = 96;
const ICON_GRID_Y = 96;
const ICON_TASKBAR_RESERVE = 118;
const ICON_BASE_WIDTH = 92;
const ICON_BASE_HEIGHT = 96;
const DOCK_HOVER_RADIUS_PX = 180;
const DOCK_MAX_SCALE = 1.72;
const DOCK_MAX_LIFT_PX = 18;
const TASKBAR_DRAG_THRESHOLD_PX = 6;
const LOADER_READOUT_MAX_LINES = 13;
const MINIMIZE_SUCTION_DURATION_MS = 360;
const MINIMIZE_AFTERIMAGE_FRAME_INTERVAL = 3;
const MOBILE_BREAKPOINT_PX = 900;

const LOADER_READOUT_STEPS = [
  { at: 0.0, text: 'bios handoff accepted. preparing shell.', action: 'loader-scene' },
  { at: 0.05, text: 'allocating viewport layers.' },
  { at: 0.1, text: 'checking device profile + renderer path.', action: 'quality-probe' },
  { at: 0.16, text: 'reading local operator settings.', action: 'load-settings' },
  { at: 0.22, text: 'restoring notes cache and session draft.', action: 'load-notes' },
  { at: 0.28, text: 'scanning persisted desktop icon layout.', action: 'scan-layout' },
  { at: 0.35, text: 'warming background ferrofluid context.', action: 'warm-visualizer' },
  { at: 0.44, text: 'prebinding ambient audio path.', action: 'warm-audio' },
  { at: 0.53, text: 'registering launch table + system apps.' },
  { at: 0.62, text: 'verifying interaction guards and focus routes.' },
  { at: 0.71, text: 'staging desktop surface for first paint.', action: 'prime-shell' },
  { at: 0.81, text: 'syncing clock and locale fields.' },
  { at: 0.89, text: 'final integrity pass for window manager.' },
  { at: 0.96, text: 'handoff ready. opening operator workspace.' },
];

const OS_APPS = [
  {
    id: 'recycle-bin',
    title: 'Recycle Bin',
    icon: '/ame-corner/icons/recycle-bin.svg',
    defaultX: 34,
    defaultY: 80 - ICON_GRID_Y,
    window: { width: 480, height: 320 },
  },
  {
    id: 'file-explorer',
    title: 'File Explorer',
    icon: '/ame-corner/icons/file-explorer.svg',
    defaultX: 34,
    defaultY: 184 - ICON_GRID_Y,
    window: { width: 640, height: 390 },
  },
  {
    id: 'notes',
    title: 'Notes',
    icon: '/ame-corner/icons/notes.svg',
    defaultX: 34,
    defaultY: 288 - ICON_GRID_Y,
    window: { width: 580, height: 360 },
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: '/ame-corner/icons/settings.svg',
    defaultX: 34,
    defaultY: 392 - ICON_GRID_Y,
    window: { width: 520, height: 340 },
  },
  {
    id: 'ferro-control',
    title: 'Ferrofluid Control',
    icon: '/ame-corner/icons/ferro-control.svg',
    defaultX: 34,
    defaultY: 496 - ICON_GRID_Y,
    window: { width: 520, height: 320 },
  },
  {
    id: 'about-system',
    title: 'About System',
    icon: '/ame-corner/icons/about-system.svg',
    defaultX: 34,
    defaultY: 600 - ICON_GRID_Y,
    window: { width: 480, height: 320 },
  },
];

const DEFAULT_SETTINGS = {
  motionEnabled: true,
  motionIntensity: 0.34,
  ferroOrbitEnabled: false,
  ferroZoomEnabled: false,
  taskbarStyle: 'diffuse',
};

const BG_QUALITY_CONFIG = {
  high: { subdivisions: 6, pixelRatio: 1.5 },
  medium: { subdivisions: 5, pixelRatio: 1.15 },
  low: { subdivisions: 4, pixelRatio: 1.0 },
};

const BG_MUSIC_SRC = '/music/CalmSitePlaylist.mp3';
const BG_MUSIC_VOLUME = 0.14;
const BG_AUDIO_FFT_SIZE = 1024;
const BG_ORIGINAL_CAMERA_DISTANCE = 5.3;
const BG_DEFAULT_CAMERA_DISTANCE = 14.4;
const BG_MIN_CAMERA_DISTANCE = BG_ORIGINAL_CAMERA_DISTANCE;
const BG_MAX_CAMERA_DISTANCE = 18.2;
const BG_ORBIT_DRAG_SENSITIVITY_X = 0.0041;
const BG_ORBIT_DRAG_SENSITIVITY_Y = 0.0032;
const BG_FERRO_ALPHA_MULTIPLIER = 0.81;
const TASKBAR_STYLE_DIFFUSE = 'diffuse';
const TASKBAR_STYLE_OUTLINE = 'outline';

const BG_FERRO_VERTEX_SHADER = `
uniform float uTime;
uniform float uMotion;
uniform float uIntensity;
uniform float uAudioEnergy;
uniform vec2 uPointer;
uniform float uPointerStrength;

varying vec3 vWorldPos;
varying vec3 vViewDir;
varying float vDisplace;

float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.yzx + 19.19);
  return fract((p3.x + p3.y) * p3.z);
}

float noise3(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);

  float n000 = hash13(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash13(i + vec3(1.0, 1.0, 1.0));

  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  float nxy0 = mix(nx00, nx10, f.y);
  float nxy1 = mix(nx01, nx11, f.y);
  return mix(nxy0, nxy1, f.z);
}

float fbm(vec3 p) {
  float value = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amp * noise3(p);
    p = p * 2.07 + vec3(11.7, 4.3, 9.2);
    amp *= 0.52;
  }
  return value;
}

void main() {
  vec3 p = position;
  float freq = mix(2.2, 4.8, uIntensity);
  float n1 = fbm(p * freq + vec3(0.0, uTime * 0.34, uTime * 0.18));
  float n2 = fbm(p * (freq * 2.1) - vec3(uTime * 0.21, 0.0, uTime * 0.24));
  float spikes = pow(max(n2, 0.0), 3.6);
  float pulse = 0.74 + (0.26 * sin(uTime * 0.85));
  float pointerDist = distance(p.xy, uPointer * 1.18);
  float pointerField = exp(-pointerDist * 3.8) * uPointerStrength;
  float audioBoost = 0.72 + (uAudioEnergy * 1.35);
  float deform = (n1 * 0.28 + spikes * 0.86) * (0.34 + uIntensity * 0.92) * uMotion * pulse * audioBoost;
  deform += pointerField * (0.14 + uAudioEnergy * 0.24);
  vec3 displaced = p + (normal * deform);

  vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
  vWorldPos = worldPos.xyz;
  vViewDir = cameraPosition - worldPos.xyz;
  vDisplace = deform;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const BG_FERRO_FRAGMENT_SHADER = `
uniform vec3 uBaseColor;
uniform float uAlpha;
uniform float uIntensity;

varying vec3 vWorldPos;
varying vec3 vViewDir;
varying float vDisplace;

void main() {
  vec3 normal = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
  if (!gl_FrontFacing) {
    normal = -normal;
  }
  vec3 viewDir = normalize(vViewDir);

  vec3 lightA = normalize(vec3(-0.42, 0.26, 0.87));
  vec3 lightB = normalize(vec3(0.36, -0.24, 0.9));
  float diffA = max(dot(normal, lightA), 0.0);
  float diffB = max(dot(normal, lightB), 0.0);
  float fres = pow(1.0 - max(dot(viewDir, normal), 0.0), 2.5);
  float frontFacing = pow(max(dot(normal, viewDir), 0.0), 2.1);
  float sheen = smoothstep(0.05, 0.62, vDisplace);

  vec3 base = uBaseColor * (0.34 + diffA * 0.72 + diffB * 0.26);
  vec3 highlight = vec3(1.0) * (
    frontFacing * (0.52 + uIntensity * 0.14)
    + (fres * 0.12)
    + sheen * (0.06 + uIntensity * 0.12)
  );
  vec3 color = base + highlight;
  float alpha = clamp(uAlpha + fres * 0.08 + sheen * 0.05, 0.32, 0.78);
  gl_FragColor = vec4(color, alpha);
}
`;

const managedTimerIds = new Set();

let teardownStarted = false;
let biosPreludeActive = false;
let biosSkipRequested = false;
let biosSkipClickCount = 0;
let biosDecisionCleanup = null;
let biosStartMs = 0;
let biosHyperflowActive = false;

let typingSoundPool = [];
let typingSoundPoolIndex = 0;
let typingSoundPoolInitialized = false;

let loaderRafId = 0;
let loaderRenderer = null;
let loaderScene = null;
let loaderCamera = null;
let loaderWingRoot = null;
let loaderWingLeft = null;
let loaderWingRight = null;
let loaderWingBridge = null;
let loaderHalo = null;
let loaderReadoutLines = [];
let loaderReadoutCursor = 0;
let loaderShellPrimed = false;
let loaderSpinStartY = 0;
let loaderSpinTargetY = Math.PI * 2;
let osInitialized = false;
let osRestartInFlight = false;
let dockInteractionsBound = false;
let dockPointerMoveHandler = null;
let dockPointerLeaveHandler = null;

let dateTimeIntervalId = 0;
let windowZCounter = 30;

const iconPositions = new Map();
const iconElements = new Map();
const iconLastClickMs = new Map();
const iconSuppressClickUntilMs = new Map();
const windowsByAppId = new Map();
const taskbarClickSuppressUntilByApp = new Map();

let selectedIconId = '';
let activeIconDrag = null;
let activeWindowDrag = null;
let activeTaskbarDrag = null;
let osNotesValue = '';
let osSettings = { ...DEFAULT_SETTINGS };
let startMenuOpen = false;
let pinnedTaskbarAppIds = [];

let bgRenderer = null;
let bgScene = null;
let bgCamera = null;
let bgFerroMesh = null;
let bgFerroMaterial = null;
let bgFerroGeometry = null;
let bgRafId = 0;
let bgLastTs = 0;
let bgTimeline = 0;
let bgFrameSamples = [];
let bgQualityTier = 'high';
let bgMeshSubdivisions = -1;
let bgOrbitYaw = 0;
let bgOrbitPitch = 0;
let bgOrbitTargetYaw = 0;
let bgOrbitTargetPitch = 0;
let bgCameraDistance = BG_DEFAULT_CAMERA_DISTANCE;
let bgCameraTargetDistance = BG_DEFAULT_CAMERA_DISTANCE;
let bgPointerTarget = new THREE.Vector2(0, 0);
let bgPointerCurrent = new THREE.Vector2(0, 0);
let bgPointerStrength = 0;
let bgPointerTargetStrength = 0;
const bgPointerRayNdc = new THREE.Vector2();
const bgPointerRaycaster = new THREE.Raycaster();
const bgPointerHitPoint = new THREE.Vector3();
const bgPointerProjectionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const bgPointerIntersections = [];
let bgActiveOrbit = null;
let bgMusicEl = null;
let bgMusicCtx = null;
let bgMusicSource = null;
let bgMusicAnalyser = null;
let bgMusicFrequencyData = null;
let bgAudioEnergy = 0;
let bgAudioLow = 0;
let bgAudioMid = 0;
let bgAudioHigh = 0;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomBetween(min, max) {
  return (Math.random() * (max - min)) + min;
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

function clearManagedTimers() {
  for (const timerId of managedTimerIds) {
    window.clearTimeout(timerId);
  }
  managedTimerIds.clear();
}

function setState(stateName) {
  if (!root) return;
  for (const className of STATE_CLASSES) {
    root.classList.remove(className);
  }
  root.classList.add(`state-${stateName}`);

  const biosVisible = stateName === 'bios' || stateName === 'bios-off';
  const loaderVisible = stateName === 'os-loader';
  const osVisible = stateName === 'os-ready';

  biosStage?.setAttribute('aria-hidden', biosVisible ? 'false' : 'true');
  osLoaderStage?.setAttribute('aria-hidden', loaderVisible ? 'false' : 'true');
  osStage?.setAttribute('aria-hidden', osVisible ? 'false' : 'true');

  if (!osVisible) {
    stopBackgroundVisualizer({ keepStaticFrame: false });
    stopBackgroundAudio();
  }

  if (!osVisible && startMenuOpen) {
    setStartMenuOpen(false);
  }
}

function initTypingSoundPool() {
  if (typingSoundPoolInitialized) return;
  typingSoundPoolInitialized = true;
  typingSoundPool = [];
  for (let i = 0; i < TYPING_SOUND_POOL_SIZE; i += 1) {
    const audio = new Audio(TYPING_SOUND_SRC);
    audio.preload = 'auto';
    audio.volume = TYPING_SOUND_BASE_VOLUME;
    typingSoundPool.push(audio);
  }
}

function playTypingSound() {
  if (!typingSoundPool.length) return;
  const clip = typingSoundPool[typingSoundPoolIndex % typingSoundPool.length];
  typingSoundPoolIndex = (typingSoundPoolIndex + 1) % typingSoundPool.length;
  if (!clip) return;
  try {
    clip.currentTime = 0;
    void clip.play().catch(() => {});
  } catch {
    // autoplay restrictions can block by design
  }
}

function stopTypingSoundPool() {
  for (const clip of typingSoundPool) {
    try {
      clip.pause();
      clip.currentTime = 0;
    } catch {
      // ignore teardown races
    }
  }
}

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

function detectGraphicsSignature() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return 'UNAVAILABLE';

    let renderer = gl.getParameter(gl.RENDERER) || 'UNAVAILABLE';
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    if (dbg) {
      const unmasked = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
      if (unmasked) renderer = unmasked;
    }

    return sanitizeBiosToken(renderer, 'UNAVAILABLE', 72);
  } catch {
    return 'UNAVAILABLE';
  }
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
    // ignore storage parsing errors
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

  const languages = Array.isArray(navigator.languages) && navigator.languages.length
    ? navigator.languages.slice(0, 4).map((lang) => sanitizeBiosToken(lang, '', 14)).filter(Boolean).join(', ')
    : locale;
  const secureContext = window.isSecureContext ? 'TRUE' : 'FALSE';
  const cookiesEnabled = navigator.cookieEnabled ? 'ENABLED' : 'BLOCKED';
  const touchPoints = Number.isFinite(navigator.maxTouchPoints) ? `${navigator.maxTouchPoints}` : '0';
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ? 'REDUCE' : 'NO-PREFERENCE';
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
  const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)')?.matches;
  const colorScheme = prefersDark ? 'DARK' : (prefersLight ? 'LIGHT' : 'NO-PREFERENCE');
  const pointerModel = window.matchMedia?.('(pointer: fine)')?.matches
    ? 'FINE'
    : (window.matchMedia?.('(pointer: coarse)')?.matches ? 'COARSE' : 'UNKNOWN');
  const historyDepth = Number.isFinite(window.history?.length) ? `${window.history.length}` : 'UNREPORTED';
  const referrerHost = (() => {
    try {
      if (!document.referrer) return 'DIRECT';
      return sanitizeBiosToken(new URL(document.referrer).hostname || 'DIRECT', 'DIRECT', 40);
    } catch {
      return 'DIRECT';
    }
  })();
  const storageVector = (() => {
    const checks = [];
    try {
      localStorage.setItem('__ac_probe_ls', '1');
      localStorage.removeItem('__ac_probe_ls');
      checks.push('local:ok');
    } catch {
      checks.push('local:blocked');
    }
    try {
      sessionStorage.setItem('__ac_probe_ss', '1');
      sessionStorage.removeItem('__ac_probe_ss');
      checks.push('session:ok');
    } catch {
      checks.push('session:blocked');
    }
    return checks.join(' | ');
  })();
  const graphicsAdapter = detectGraphicsSignature();

  return {
    locale,
    languages: sanitizeBiosToken(languages, UNKNOWN_TELEMETRY, 64),
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
    secureContext,
    cookiesEnabled,
    touchPoints,
    prefersReducedMotion,
    colorScheme,
    pointerModel,
    historyDepth,
    referrerHost,
    storageVector: sanitizeBiosToken(storageVector, UNKNOWN_TELEMETRY, 48),
    graphicsAdapter,
    operatorHandle: readStoredOperatorHandle(),
  };
}

function buildBiosScript() {
  const telemetry = collectBiosTelemetry();
  const appRegistryCount = OS_APPS.length;
  const notesCacheRaw = localStorage.getItem(STORAGE_NOTES);
  const notesBytes = notesCacheRaw ? notesCacheRaw.length : 0;
  const rawLayout = safeParseJson(localStorage.getItem(STORAGE_ICON_LAYOUT), {});
  const layoutCount = rawLayout && typeof rawLayout === 'object' ? Object.keys(rawLayout).length : 0;
  const rawPins = safeParseJson(localStorage.getItem(STORAGE_TASKBAR_PINS), []);
  const pinCount = Array.isArray(rawPins) ? rawPins.length : appRegistryCount;

  const operatorLine = telemetry.operatorHandle === UNKNOWN_TELEMETRY
    ? 'OPERATOR HANDLE: UNRESOLVED'
    : `OPERATOR HANDLE: @${telemetry.operatorHandle}`;

  const script = [
    { text: 'ARCHANGEL BIOS v3.14r / AmesCorner Fabric' },
    { text: 'BOOT PROFILE: ArcheAngelOS preflight' },
    { text: `RTC SYNC LOCAL: ${telemetry.localTimestamp}` },
    { text: `RTC SYNC UTC: ${telemetry.utcTimestamp}` },
    { text: `LOCALE MAP: ${telemetry.locale}` },
    { text: `LANGUAGE STACK: ${telemetry.languages}` },
    { text: `TIMEZONE VECTOR: ${telemetry.timezone}` },
    { text: `SECURE CONTEXT: ${telemetry.secureContext}` },
    { text: `REFERRER HOST: ${telemetry.referrerHost}` },
    { text: `HISTORY DEPTH: ${telemetry.historyDepth}` },
    { text: `LOCALE+TZ COMPOSITE: ${telemetry.locale} | ${telemetry.timezone}` },
    { text: `HOST PLATFORM: ${telemetry.platform}` },
    { text: `CLIENT SIGNATURE: ${telemetry.browser}` },
    { text: `POINTER MODEL: ${telemetry.pointerModel}` },
    { text: `TOUCH POINTS: ${telemetry.touchPoints}` },
    { text: `COOKIE STATE: ${telemetry.cookiesEnabled}` },
    { text: `MOTION PREF: ${telemetry.prefersReducedMotion}` },
    { text: `COLOR SCHEME PREF: ${telemetry.colorScheme}` },
    { text: `CPU THREAD ENUM: ${telemetry.cpuThreads}` },
    { text: `MEMORY PROBE: ${telemetry.memory}` },
    { text: `GRAPHICS ADAPTER: ${telemetry.graphicsAdapter}` },
    { text: `DISPLAY SURFACE: ${telemetry.displaySurface}` },
    { text: `VIEWPORT WINDOW: ${telemetry.viewportWindow}` },
    { text: `COLOR DEPTH: ${telemetry.colorDepth}` },
    { text: `NETWORK VECTOR: ${telemetry.networkVector}` },
    { text: `STORAGE VECTOR: ${telemetry.storageVector}` },
    { text: `APP REGISTRY COUNT: ${appRegistryCount}` },
    { text: `TASKBAR PIN CACHE: ${pinCount}` },
    { text: `ICON LAYOUT CACHE: ${layoutCount}` },
    { text: `NOTES CACHE BYTES: ${notesBytes}` },
    { text: operatorLine },
  ];

  const initTargets = [
    'graphics-pipeline',
    'window-manager',
    'taskbar-pinning',
    'icon-grid',
    'start-menu',
    'datetime-ticker',
    'ferrofluid-core',
    'ambient-audio',
    'loader-mark',
    'session-cache',
    'pointer-routing',
    'mobile-bridge',
  ];
  for (const target of initTargets) {
    script.push({ text: `A:\\> verify --target=${target} --strict` });
  }

  script.push(
    { text: 'A:\\> stage --input=host-profile --target=/backend/intake' },
    { text: 'A:\\> hash --source=session-fingerprint --salt=REMNANT' },
    { text: 'A:\\> stage --input=notes-cache --target=/runtime/memory' },
    { text: 'A:\\> stage --input=taskbar-pins --target=/runtime/dock' },
    { text: 'A:\\> stage --input=icon-layout --target=/runtime/desktop' },
    { text: 'A:\\> correlate --identity=operator --mode=silent' },
    { text: 'A:\\> verify --session-lock=TRUE' },
    { text: 'A:\\> mount --service=ferrofluid-core --mode=background' },
    { text: 'A:\\> mount --service=ambient-audio --mode=reactive' },
  );

  const moduleMap = [
    'kernel.shell',
    'kernel.windowing',
    'kernel.pointer',
    'kernel.audio',
    'ui.desktop',
    'ui.taskbar',
    'ui.startmenu',
    'ui.icons',
    'app.recycle-bin',
    'app.file-explorer',
    'app.notes',
    'app.settings',
    'app.ferro-control',
    'app.about-system',
    'service.clock',
    'service.persistence',
    'service.visualizer',
    'service.loader',
  ];

  const biosLineFloor = Math.max(560, Math.round((window.innerHeight / 14) * 7.4));
  const boringScanLines = [];
  const vagueChannels = ['hush', 'echo', 'veil', 'drift', 'lattice', 'residue'];
  let pass = 1;
  while (boringScanLines.length < biosLineFloor) {
    for (let moduleIndex = 0; moduleIndex < moduleMap.length; moduleIndex += 1) {
      const moduleName = moduleMap[moduleIndex];
      const channel = vagueChannels[(pass + moduleIndex) % vagueChannels.length];
      const cadenceMs = 12 + ((pass * 7 + moduleIndex * 3) % 43);
      const entropy = (0.12 + (((pass + moduleIndex) % 13) * 0.03)).toFixed(2);
      const variant = (pass + moduleIndex) % 4;
      if (variant === 0) {
        boringScanLines.push(`A:\\> scan --module=${moduleName} --pass=${pass} --status=ok`);
      } else if (variant === 1) {
        boringScanLines.push(`A:\\> trace --module=${moduleName} --cadence=${cadenceMs}ms --ghost=${channel}`);
      } else if (variant === 2) {
        boringScanLines.push(`A:\\> settle --module=${moduleName} --entropy=${entropy} --result=stable`);
      } else {
        boringScanLines.push(`A:\\> mirror --module=${moduleName} --phase=${pass % 9} --latency=${cadenceMs + 3}ms`);
      }
      if (boringScanLines.length >= biosLineFloor) break;
    }
    pass += 1;
  }
  for (let idx = 0; idx < boringScanLines.length; idx += BIOS_BURST_CHUNK_LINES) {
    script.push({
      burstLines: boringScanLines.slice(idx, idx + BIOS_BURST_CHUNK_LINES),
      burstLineDelayMs: BIOS_BURST_LINE_DELAY_MS,
      holdMs: 0,
    });
  }

  const readinessMatrix = [
    ['scheduler', 'stable'],
    ['pointer-stack', 'stable'],
    ['window-focus', 'stable'],
    ['dock-metrics', 'stable'],
    ['desktop-grid', 'stable'],
    ['clock-service', 'stable'],
    ['persistence-layer', 'stable'],
    ['ferrofluid-reactor', 'stable'],
    ['ambient-reactive-bus', 'stable'],
    ['operator-handshake', 'stable'],
    ['gesture-routes', 'stable'],
    ['mobile-input-bridge', 'stable'],
  ];
  for (const [domain, status] of readinessMatrix) {
    script.push({ text: `A:\\> readiness --domain=${domain} --state=${status}` });
  }

  const traceVector = [
    telemetry.timezone,
    telemetry.locale,
    telemetry.networkVector,
    telemetry.graphicsAdapter,
    telemetry.displaySurface,
    telemetry.viewportWindow,
    telemetry.storageVector,
  ];
  for (let idx = 0; idx < traceVector.length; idx += 1) {
    script.push({ text: `A:\\> trace --channel=${idx + 1} --vector=${traceVector[idx]}` });
  }

  const cacheTargets = [
    { name: 'notes-cache', bytes: notesBytes || 0 },
    { name: 'icon-layout-cache', bytes: layoutCount * 28 },
    { name: 'taskbar-pin-cache', bytes: pinCount * 14 },
    { name: 'session-hash', bytes: 64 },
    { name: 'runtime-settings', bytes: 92 },
  ];
  for (const cache of cacheTargets) {
    script.push({ text: `A:\\> cache --name=${cache.name} --bytes=${cache.bytes} --state=ready` });
  }

  for (let phase = 1; phase <= 4; phase += 1) {
    script.push({ text: `A:\\> integrity --phase=${phase} --result=pass` });
  }

  script.push(
    { text: 'WARNING: REFLECTIVE FEEDBACK CHANNEL OPEN', holdMs: 640 },
    { text: 'White Egrets Orchard', emphasis: true, holdMs: 900, phraseHighlight: true },
    { text: 'A:\\> index --target=retina-cache --mode=latent' },
    { text: 'A:\\> parse --input=recent-dreams.log --strict' },
    { text: 'A:\\> pin-session --scope=dream-layer --ttl=forever' },
    { text: 'A:\\> normalize --input=cursor-state --mode=foreground' },
    { text: 'A:\\> normalize --input=clock-state --mode=foreground' },
    { text: 'My thoughts will follow you into dreams', emphasis: true, holdMs: 1100, phraseHighlight: true },
    { text: 'A:\\> sync --phase=night --mode=invasive' },
    { text: 'A:\\> set-operator-state --return-path=none' },
    { text: 'A:\\> commit --scope=os-shell --status=ready' },
    { text: 'BOOT TARGET: /ames-corner [armed]' },
    { text: 'HANDOFF: observer lock maintained', holdMs: 460 },
  );

  return script;
}

function scaleBiosDuration(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.max(1, Math.round(ms * BIOS_SPEED_MULTIPLIER));
}

function scaleBiosReadoutDuration(ms, step = null) {
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  const multiplier = step?.phraseHighlight
    ? BIOS_PHRASE_SPEED_MULTIPLIER
    : BIOS_READOUT_SPEED_MULTIPLIER;
  return Math.max(1, Math.round(scaleBiosDuration(ms) * multiplier));
}

function setBiosHyperflowState(active) {
  const next = Boolean(active);
  if (next === biosHyperflowActive) return;
  biosHyperflowActive = next;
  biosScreen?.classList.toggle('is-hyperflow', next);
}

function resetBiosViewportMotion() {
  if (!biosScreen || !biosLog) return;
  biosScreen.scrollTop = 0;
  setBiosHyperflowState(false);
  biosLog.style.filter = '';
  biosLog.style.paddingBottom = '0px';
  biosLog.style.transform = 'translate3d(0, 0, 0) scale(1)';
}

function updateBiosViewportMotion() {
  if (!biosScreen || !biosLog) return;
  const maxScroll = Math.max(0, biosScreen.scrollHeight - biosScreen.clientHeight);
  const ratio = clamp(maxScroll / Math.max(1, biosScreen.clientHeight * 7.2), 0, 1);
  const dragY = Math.min(360, ratio * 410);
  const tailPad = Math.max(BIOS_VIEWPORT_TAIL_PADDING_PX, Math.round(dragY + 88));
  biosLog.style.paddingBottom = `${tailPad}px`;
  biosLog.style.transform = `translate3d(0, ${dragY.toFixed(2)}px, 0) scale(1)`;

  const postTransformMax = Math.max(0, biosScreen.scrollHeight - biosScreen.clientHeight);
  if (postTransformMax > 0) {
    biosScreen.scrollTop = postTransformMax;
  }
}

async function waitBiosOrSkip(ms) {
  let remaining = Math.max(0, ms);
  while (remaining > 0 && !teardownStarted && !biosSkipRequested) {
    const chunk = Math.min(remaining, 40);
    await wait(chunk);
    remaining -= chunk;
  }
}

function appendBiosText(text, className = '') {
  if (!biosLog) return null;
  if (!className) {
    const node = document.createTextNode(text);
    biosLog.appendChild(node);
    return node;
  }
  const span = document.createElement('span');
  span.className = className;
  span.textContent = text;
  biosLog.appendChild(span);
  return span;
}

async function typeBiosStep(step) {
  if (!biosLog || teardownStarted || biosSkipRequested) return;

  if (Array.isArray(step.burstLines) && step.burstLines.length > 0) {
    const burstDelay = Math.max(0, scaleBiosReadoutDuration(step.burstLineDelayMs ?? BIOS_BURST_LINE_DELAY_MS, step));
    const linesPerSecond = burstDelay > 0 ? (1000 / burstDelay) : 999;
    const applyMotionBlur = linesPerSecond >= BIOS_HYPERFLOW_BLUR_THRESHOLD_LPS;
    setBiosHyperflowState(applyMotionBlur);
    if (biosLog) {
      biosLog.style.filter = applyMotionBlur ? 'blur(0.76px)' : '';
    }
    for (let idx = 0; idx < step.burstLines.length; idx += 1) {
      if (teardownStarted || biosSkipRequested) return;
      appendBiosText(step.burstLines[idx]);
      appendBiosText('\n');
      if ((idx & 1) === 0) {
        updateBiosViewportMotion();
      }
      if ((idx % 6) === 0) {
        playTypingSound();
      }
      if (burstDelay > 0) {
        await waitBiosOrSkip(burstDelay);
      }
    }
    updateBiosViewportMotion();
    return;
  }

  setBiosHyperflowState(false);
  biosLog.style.filter = '';
  if (step.emphasis && biosScreen) biosScreen.classList.add('emphasis');

  const textTarget = step.phraseHighlight
    ? appendBiosText('', 'bios-phrase')
    : appendBiosText('', '');

  const charMinBase = step.charMinMs ?? (step.emphasis ? BIOS_CHAR_DELAY_MIN_MS + 16 : BIOS_CHAR_DELAY_MIN_MS);
  const charMaxBase = step.charMaxMs ?? (step.emphasis ? BIOS_CHAR_DELAY_MAX_MS + 20 : BIOS_CHAR_DELAY_MAX_MS);
  const spaceMin = Math.max(1, scaleBiosReadoutDuration(charMinBase * 0.72, step));
  const spaceMax = Math.max(spaceMin, scaleBiosReadoutDuration(charMaxBase * 0.74, step));
  const charMin = Math.max(1, scaleBiosReadoutDuration(charMinBase, step));
  const charMax = Math.max(charMin, scaleBiosReadoutDuration(charMaxBase, step));

  const chars = Array.from(step.text);
  const chunkSize = step.phraseHighlight ? 1 : 4;
  for (let idx = 0; idx < chars.length; idx += chunkSize) {
    const segmentChars = chars.slice(idx, idx + chunkSize);
    const segment = segmentChars.join('');
    if (teardownStarted || biosSkipRequested) return;
    if (textTarget) {
      textTarget.textContent += segment;
    }
    if ((idx & 7) === 0) {
      updateBiosViewportMotion();
    }
    playTypingSound();
    const hasSpace = segmentChars.includes(' ');
    const baseDelay = hasSpace ? randomBetween(spaceMin, spaceMax) : randomBetween(charMin, charMax);
    const charDelay = step.phraseHighlight
      ? baseDelay
      : Math.max(1, baseDelay * 0.34);
    await waitBiosOrSkip(charDelay);
  }
  appendBiosText('\n');
  updateBiosViewportMotion();

  if (step.emphasis && !biosSkipRequested) {
    appendBiosText('\n');
    updateBiosViewportMotion();
    await waitBiosOrSkip(scaleBiosReadoutDuration(540, step));
    biosScreen?.classList.remove('emphasis');
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
  resetBiosViewportMotion();

  const biosScript = buildBiosScript();
  try {
    for (const step of biosScript) {
      if (teardownStarted || biosSkipRequested) break;
      await typeBiosStep(step);
      if (teardownStarted || biosSkipRequested) break;
      const holdMs = Number.isFinite(step.holdMs) ? step.holdMs : randomBetween(BIOS_LINE_DELAY_MIN_MS, BIOS_LINE_DELAY_MAX_MS);
      await waitBiosOrSkip(scaleBiosReadoutDuration(holdMs, step));
    }

    if (!biosSkipRequested) {
      const targetMs = scaleBiosReadoutDuration(BIOS_TARGET_MS);
      const elapsed = performance.now() - biosStartMs;
      if (elapsed < targetMs) {
        await waitBiosOrSkip(targetMs - elapsed);
      }
    }
  } finally {
    biosPreludeActive = false;
    biosSkipRequested = false;
    biosSkipClickCount = 0;
    setBiosHyperflowState(false);
    biosLog.style.filter = '';
    biosScreen?.classList.remove('emphasis');
  }
}

async function runQuickCrtPowerCycle() {
  if (teardownStarted) return;
  setState('bios-off');
  await wait(scaleBiosDuration(CRT_POWER_CYCLE_OFF_MS));
}
function promptBiosDecision() {
  if (!biosLog) return Promise.resolve('accept');

  appendBiosText('\n');
  const bootingLineEl = document.createElement('span');
  bootingLineEl.className = 'bios-decision-input';
  biosLog.appendChild(bootingLineEl);
  updateBiosViewportMotion();

  return new Promise((resolve) => {
    let settled = false;
    let dotCount = 0;
    let dotIntervalId = 0;
    let finishTimeoutId = 0;

    const renderDots = () => {
      if (!bootingLineEl) return;
      dotCount = (dotCount % 3) + 1;
      const suffix = '.'.repeat(dotCount);
      bootingLineEl.innerHTML = `Booting <span class="bios-brand-white">ArcheAngelOS</span>${suffix}`;
      updateBiosViewportMotion();
    };

    const cleanup = () => {
      if (dotIntervalId) {
        window.clearInterval(dotIntervalId);
      }
      if (finishTimeoutId) {
        window.clearTimeout(finishTimeoutId);
      }
      biosDecisionCleanup = null;
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      appendBiosText('\n');
      updateBiosViewportMotion();
      resolve('accept');
    };

    biosDecisionCleanup = cleanup;
    renderDots();

    dotIntervalId = window.setInterval(() => {
      if (teardownStarted) {
        finish();
        return;
      }
      renderDots();
    }, BIOS_BOOTING_DOT_INTERVAL_MS);

    finishTimeoutId = window.setTimeout(() => {
      finish();
    }, BIOS_BOOTING_PROMPT_MS);
  });
}

function appendLoaderReadoutLine(line) {
  if (!osLoaderReadout) return;
  loaderReadoutLines.push(line);
  if (loaderReadoutLines.length > LOADER_READOUT_MAX_LINES) {
    loaderReadoutLines = loaderReadoutLines.slice(-LOADER_READOUT_MAX_LINES);
  }
  osLoaderReadout.textContent = loaderReadoutLines.join('\n');
}

function runLoaderReadoutAction(step) {
  const action = step?.action || '';
  if (!action) return;

  if (action === 'loader-scene') {
    ensureLoaderScene();
    applyLoaderSceneSize();
    return;
  }

  if (action === 'quality-probe') {
    const quality = BG_QUALITY_CONFIG[bgQualityTier] ?? BG_QUALITY_CONFIG.medium;
    appendLoaderReadoutLine(`  renderer profile: ${bgQualityTier} (${quality.subdivisions}x mesh)`);
    return;
  }

  if (action === 'load-settings') {
    loadSettings();
    appendLoaderReadoutLine(`  motion profile: ${osSettings.motionEnabled ? 'enabled' : 'disabled'} @ ${osSettings.motionIntensity.toFixed(2)}`);
    return;
  }

  if (action === 'load-notes') {
    loadNotes();
    appendLoaderReadoutLine(`  notes cache restored (${osNotesValue.length} chars)`);
    return;
  }

  if (action === 'scan-layout') {
    const layout = loadIconLayoutMap();
    appendLoaderReadoutLine(`  icon layout entries: ${layout.size}`);
    return;
  }

  if (action === 'warm-visualizer') {
    const ready = ensureBackgroundVisualizerScene();
    appendLoaderReadoutLine(`  ferrofluid context: ${ready ? 'warm' : 'fallback path'}`);
    return;
  }

  if (action === 'warm-audio') {
    ensureBackgroundAudioChain();
    appendLoaderReadoutLine(`  ambient bus: ${bgMusicEl ? 'standby' : 'unavailable'}`);
    return;
  }

  if (action === 'prime-shell') {
    if (!loaderShellPrimed) {
      initializeOsShellIfNeeded();
      loaderShellPrimed = true;
      appendLoaderReadoutLine('  shell preflight complete.');
    }
  }
}

function resetLoaderReadout() {
  loaderReadoutLines = [];
  loaderReadoutCursor = 0;
  loaderShellPrimed = false;
  loaderSpinStartY = 0;
  loaderSpinTargetY = Math.PI * 2;
  if (osLoaderReadout) {
    osLoaderReadout.textContent = '';
  }
}

function updateLoaderReadout(progress) {
  if (!osLoaderReadout) return;
  while (loaderReadoutCursor < LOADER_READOUT_STEPS.length && progress >= LOADER_READOUT_STEPS[loaderReadoutCursor].at) {
    const step = LOADER_READOUT_STEPS[loaderReadoutCursor];
    appendLoaderReadoutLine(step.text);
    runLoaderReadoutAction(step);
    loaderReadoutCursor += 1;
  }
}

function normalizePositiveAngle(value) {
  const tau = Math.PI * 2;
  const normalized = value % tau;
  return normalized < 0 ? normalized + tau : normalized;
}

function configureLoaderSpinPlan() {
  if (!ensureLoaderScene() || !loaderWingRoot) return;
  const tau = Math.PI * 2;
  const current = normalizePositiveAngle(loaderWingRoot.rotation.y || 0);
  const afterFullTurn = current + tau;
  const alignToFront = (tau - normalizePositiveAngle(afterFullTurn)) % tau;
  loaderSpinStartY = current;
  loaderSpinTargetY = afterFullTurn + alignToFront;
}

function createLoaderWingGeometry(side) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.12 * side, 0.24, 0.72 * side, 0.4, 1.02 * side, 0.07);
  shape.bezierCurveTo(1.08 * side, -0.16, 0.84 * side, -0.62, 0.48 * side, -0.98);
  shape.bezierCurveTo(0.24 * side, -1.08, 0.06 * side, -0.88, 0, -0.52);
  shape.quadraticCurveTo(0.03 * side, -0.24, 0, 0);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.09,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    curveSegments: 30,
  });
  geometry.center();
  return geometry;
}

function ensureLoaderScene() {
  if (!(osLoaderCanvas instanceof HTMLCanvasElement)) return false;
  if (loaderRenderer && loaderScene && loaderCamera && loaderWingRoot && loaderWingLeft && loaderWingRight && loaderWingBridge) return true;

  try {
    loaderRenderer = new THREE.WebGLRenderer({
      canvas: osLoaderCanvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
  } catch {
    return false;
  }

  loaderRenderer.setClearColor(0x000000, 0);
  loaderScene = new THREE.Scene();
  loaderCamera = new THREE.PerspectiveCamera(34, 1, 0.1, 20);
  loaderCamera.position.set(0, 0.1, 5.4);

  const ambient = new THREE.AmbientLight(0xe8ecf4, 1.2);
  const key = new THREE.DirectionalLight(0xfafcff, 1.45);
  key.position.set(2.2, 2.8, 3.6);
  const fill = new THREE.DirectionalLight(0xd5dbe8, 0.88);
  fill.position.set(-2.4, -1.5, 2.2);
  loaderScene.add(ambient, key, fill);

  const wingMaterial = new THREE.MeshStandardMaterial({
    color: 0xc5cbd8,
    metalness: 0.24,
    roughness: 0.34,
    emissive: 0xced3dd,
    emissiveIntensity: 0.16,
  });

  const leftWingGeo = createLoaderWingGeometry(-1);
  const rightWingGeo = createLoaderWingGeometry(1);
  loaderWingLeft = new THREE.Mesh(leftWingGeo, wingMaterial);
  loaderWingRight = new THREE.Mesh(rightWingGeo, wingMaterial);
  loaderWingLeft.position.set(-0.86, -0.02, 0);
  loaderWingRight.position.set(0.86, -0.02, 0);
  loaderWingLeft.rotation.y = -0.14;
  loaderWingRight.rotation.y = 0.14;

  const bridgeGeo = new THREE.CapsuleGeometry(0.14, 0.34, 8, 12);
  const bridgeMat = new THREE.MeshStandardMaterial({
    color: 0xd0d5df,
    metalness: 0.18,
    roughness: 0.4,
  });
  loaderWingBridge = new THREE.Mesh(bridgeGeo, bridgeMat);
  loaderWingBridge.rotation.z = Math.PI * 0.5;
  loaderWingBridge.scale.set(0.9, 0.72, 0.7);

  const haloGeo = new THREE.TorusGeometry(0.58, 0.06, 18, 52);
  const haloMat = new THREE.MeshStandardMaterial({
    color: 0xe4e8f0,
    metalness: 0.3,
    roughness: 0.32,
    emissive: 0xffffff,
    emissiveIntensity: 0.08,
  });
  loaderHalo = new THREE.Mesh(haloGeo, haloMat);
  loaderHalo.position.set(0, 0.78, 0.06);
  loaderHalo.rotation.x = Math.PI * 0.22;

  loaderWingRoot = new THREE.Group();
  loaderWingRoot.add(loaderWingLeft, loaderWingRight, loaderWingBridge, loaderHalo);
  loaderWingRoot.scale.set(1.28, 1.28, 1.28);
  loaderScene.add(loaderWingRoot);
  return true;
}

function applyLoaderSceneSize() {
  if (!loaderRenderer || !loaderCamera) return;
  const width = Math.max(1, Math.floor(window.innerWidth));
  const height = Math.max(1, Math.floor(window.innerHeight));
  const size = Math.max(132, Math.round(Math.min(width, height) * 0.22));
  if (osLoaderCanvas instanceof HTMLCanvasElement) {
    osLoaderCanvas.style.width = `${size}px`;
    osLoaderCanvas.style.height = `${size}px`;
  }
  loaderRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  loaderRenderer.setSize(size, size, false);
  loaderCamera.aspect = 1;
  loaderCamera.updateProjectionMatrix();
}

function renderLoaderScene(timestampMs, progress) {
  if (!ensureLoaderScene()) return;
  applyLoaderSceneSize();

  const t = timestampMs * 0.001;
  const sway = Math.sin(t * 1.55) * 0.14;
  const flap = Math.sin(t * 3.1) * 0.2;
  const pulse = 0.94 + (Math.sin(t * 2.1) * 0.04);
  const ramp = 0.86 + (progress * 0.18);
  const spinProgress = clamp(progress, 0, 1);
  const spinY = loaderSpinStartY + ((loaderSpinTargetY - loaderSpinStartY) * spinProgress);

  loaderWingRoot.rotation.y = spinY;
  loaderWingRoot.rotation.x = Math.sin(t * 0.95) * 0.08;
  loaderWingRoot.scale.set(1.28 * pulse * ramp, 1.28 * pulse * ramp, 1.28 * pulse * ramp);

  loaderWingLeft.rotation.z = -0.28 + flap;
  loaderWingLeft.rotation.x = -0.08 + sway * 0.35;
  loaderWingRight.rotation.z = 0.28 - flap;
  loaderWingRight.rotation.x = -0.08 - sway * 0.35;

  if (loaderHalo) {
    loaderHalo.rotation.z = -t * 0.7;
    loaderHalo.rotation.y = Math.sin(t * 1.24) * 0.24;
  }

  loaderRenderer.render(loaderScene, loaderCamera);
}

function cancelLoaderRaf() {
  if (!loaderRafId) return;
  window.cancelAnimationFrame(loaderRafId);
  loaderRafId = 0;
}

async function runLoaderSequence(durationMs = LOADER_TOTAL_MS) {
  cancelLoaderRaf();
  setState('os-loader');
  if (osLoaderProgressFill) {
    osLoaderProgressFill.style.width = '0%';
  }
  resetLoaderReadout();
  configureLoaderSpinPlan();
  updateLoaderReadout(0);

  await new Promise((resolve) => {
    const startMs = performance.now();

    const frame = (timestampMs) => {
      if (teardownStarted) {
        loaderRafId = 0;
        resolve();
        return;
      }

      const progress = clamp((timestampMs - startMs) / durationMs, 0, 1);
      if (osLoaderProgressFill) {
        osLoaderProgressFill.style.width = `${(progress * 100).toFixed(2)}%`;
      }
      updateLoaderReadout(progress);
      renderLoaderScene(timestampMs, progress);

      if (progress >= 1) {
        loaderRafId = 0;
        resolve();
        return;
      }
      loaderRafId = window.requestAnimationFrame(frame);
    };

    loaderRafId = window.requestAnimationFrame(frame);
  });
}

function destroyLoaderScene() {
  if (loaderWingLeft?.geometry) loaderWingLeft.geometry.dispose();
  if (loaderWingRight?.geometry) loaderWingRight.geometry.dispose();
  if (loaderWingBridge?.geometry) loaderWingBridge.geometry.dispose();
  if (loaderHalo?.geometry) loaderHalo.geometry.dispose();
  const materials = [];
  if (loaderWingLeft?.material) materials.push(loaderWingLeft.material);
  if (loaderWingRight?.material) materials.push(loaderWingRight.material);
  if (loaderWingBridge?.material) materials.push(loaderWingBridge.material);
  if (loaderHalo?.material) materials.push(loaderHalo.material);
  for (const material of materials) {
    if (Array.isArray(material)) {
      for (const m of material) m.dispose?.();
    } else {
      material.dispose?.();
    }
  }
  loaderWingLeft = null;
  loaderWingRight = null;
  loaderWingBridge = null;
  loaderHalo = null;
  loaderWingRoot = null;
  loaderScene = null;
  loaderCamera = null;
  if (loaderRenderer) {
    loaderRenderer.dispose();
    loaderRenderer = null;
  }
}

function safeParseJson(raw, fallback) {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function loadSettings() {
  const parsed = safeParseJson(localStorage.getItem(STORAGE_SETTINGS), {});
  const motionEnabled = parsed && typeof parsed.motionEnabled === 'boolean'
    ? parsed.motionEnabled
    : DEFAULT_SETTINGS.motionEnabled;
  const motionIntensity = Number.isFinite(Number(parsed?.motionIntensity))
    ? clamp(Number(parsed.motionIntensity), 0, 1)
    : DEFAULT_SETTINGS.motionIntensity;
  const ferroOrbitEnabled = parsed && typeof parsed.ferroOrbitEnabled === 'boolean'
    ? parsed.ferroOrbitEnabled
    : DEFAULT_SETTINGS.ferroOrbitEnabled;
  const ferroZoomEnabled = parsed && typeof parsed.ferroZoomEnabled === 'boolean'
    ? parsed.ferroZoomEnabled
    : DEFAULT_SETTINGS.ferroZoomEnabled;
  const taskbarStyle = parsed?.taskbarStyle === TASKBAR_STYLE_OUTLINE
    ? TASKBAR_STYLE_OUTLINE
    : TASKBAR_STYLE_DIFFUSE;
  osSettings = { motionEnabled, motionIntensity, ferroOrbitEnabled, ferroZoomEnabled, taskbarStyle };
}

function persistSettings() {
  localStorage.setItem(STORAGE_SETTINGS, JSON.stringify({
    motionEnabled: Boolean(osSettings.motionEnabled),
    motionIntensity: clamp(Number(osSettings.motionIntensity), 0, 1),
    ferroOrbitEnabled: Boolean(osSettings.ferroOrbitEnabled),
    ferroZoomEnabled: Boolean(osSettings.ferroZoomEnabled),
    taskbarStyle: osSettings.taskbarStyle === TASKBAR_STYLE_OUTLINE ? TASKBAR_STYLE_OUTLINE : TASKBAR_STYLE_DIFFUSE,
  }));
}

function applyTaskbarStyle() {
  if (!root) return;
  const useOutline = osSettings.taskbarStyle === TASKBAR_STYLE_OUTLINE;
  root.classList.toggle('taskbar-style-outline', useOutline);
  root.classList.toggle('taskbar-style-diffuse', !useOutline);
}

function defaultTaskbarPins() {
  return OS_APPS.map((app) => app.id);
}

function loadTaskbarPins() {
  const raw = localStorage.getItem(STORAGE_TASKBAR_PINS);
  if (!raw) {
    pinnedTaskbarAppIds = defaultTaskbarPins();
    return;
  }

  const parsed = safeParseJson(raw, null);
  if (!Array.isArray(parsed)) {
    pinnedTaskbarAppIds = defaultTaskbarPins();
    return;
  }

  const validIds = new Set(OS_APPS.map((app) => app.id));
  const filtered = [];
  for (const raw of parsed) {
    const appId = String(raw ?? '');
    if (!validIds.has(appId)) continue;
    if (filtered.includes(appId)) continue;
    filtered.push(appId);
  }

  pinnedTaskbarAppIds = filtered;
}

function persistTaskbarPins() {
  localStorage.setItem(STORAGE_TASKBAR_PINS, JSON.stringify(pinnedTaskbarAppIds));
}

function isTaskbarPinned(appId) {
  return pinnedTaskbarAppIds.includes(appId);
}

function getTaskbarRenderAppIds() {
  const result = [];
  const seen = new Set();

  for (const appId of pinnedTaskbarAppIds) {
    if (!getAppMeta(appId)) continue;
    if (seen.has(appId)) continue;
    seen.add(appId);
    result.push(appId);
  }

  for (const appId of windowsByAppId.keys()) {
    if (!getAppMeta(appId)) continue;
    if (seen.has(appId)) continue;
    seen.add(appId);
    result.push(appId);
  }

  return result;
}

function getTaskbarButtonForApp(appId) {
  if (!osTaskbarApps) return null;
  for (const button of osTaskbarApps.querySelectorAll('.os-taskbar-app')) {
    if (!(button instanceof HTMLButtonElement)) continue;
    if ((button.getAttribute('data-app') || '') === appId) {
      return button;
    }
  }
  return null;
}

function pinTaskbarApp(appId) {
  if (!getAppMeta(appId)) return;
  if (isTaskbarPinned(appId)) return;
  pinnedTaskbarAppIds.push(appId);
  persistTaskbarPins();
  buildTaskbarApps();
}

function unpinTaskbarApp(appId) {
  const idx = pinnedTaskbarAppIds.indexOf(appId);
  if (idx < 0) return;
  pinnedTaskbarAppIds.splice(idx, 1);
  persistTaskbarPins();
  buildTaskbarApps();
}

function isPointInsideTaskbar(clientX, clientY) {
  if (!osTaskbar) return false;
  const rect = osTaskbar.getBoundingClientRect();
  return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
}

function loadNotes() {
  const raw = localStorage.getItem(STORAGE_NOTES);
  if (typeof raw === 'string') {
    osNotesValue = raw;
    return;
  }
  osNotesValue = [
    'Everything sounds clean in here.',
    '',
    'If the shell asks nicely enough,',
    'it can still be lying.',
  ].join('\n');
}

function persistNotes(value) {
  osNotesValue = String(value ?? '');
  localStorage.setItem(STORAGE_NOTES, osNotesValue);
}

function loadIconLayoutMap() {
  const parsed = safeParseJson(localStorage.getItem(STORAGE_ICON_LAYOUT), {});
  const nextMap = new Map();
  if (!parsed || typeof parsed !== 'object') return nextMap;
  for (const app of OS_APPS) {
    const value = parsed[app.id];
    if (!value || typeof value !== 'object') continue;
    const x = Number(value.x);
    const y = Number(value.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    nextMap.set(app.id, { x, y });
  }
  return nextMap;
}

function persistIconLayoutMap() {
  const payload = {};
  for (const [appId, pos] of iconPositions.entries()) {
    payload[appId] = { x: Math.round(pos.x), y: Math.round(pos.y) };
  }
  localStorage.setItem(STORAGE_ICON_LAYOUT, JSON.stringify(payload));
}

function isMobileLayout() {
  const query = window.matchMedia?.(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`);
  if (query && typeof query.matches === 'boolean') {
    return query.matches;
  }
  return window.innerWidth <= MOBILE_BREAKPOINT_PX;
}

function getTaskbarReservePx() {
  const baseReserve = ICON_TASKBAR_RESERVE;
  if (!osTaskbar) return baseReserve;
  const rect = osTaskbar.getBoundingClientRect();
  if (!rect || rect.height <= 0) return baseReserve;
  const overlapFromBottom = Math.max(0, window.innerHeight - rect.top);
  return Math.max(baseReserve, Math.round(overlapFromBottom + 8));
}

function getWindowViewportMargins() {
  if (isMobileLayout()) {
    return {
      left: 6,
      right: 6,
      top: 52,
      bottom: getTaskbarReservePx() + 8,
    };
  }

  return {
    left: 8,
    right: 8,
    top: 60,
    bottom: ICON_TASKBAR_RESERVE,
  };
}

function clampIconPosition(x, y) {
  if (!osDesktop) return { x, y };
  const desktopRect = osDesktop.getBoundingClientRect();
  const minX = 10;
  const minY = 8;
  const maxX = Math.max(minX, desktopRect.width - ICON_BASE_WIDTH - 10);
  const maxY = Math.max(minY, desktopRect.height - getTaskbarReservePx() - ICON_BASE_HEIGHT);
  return {
    x: clamp(x, minX, maxX),
    y: clamp(y, minY, maxY),
  };
}

function snapIconPosition(x, y) {
  const snappedX = Math.round(x / ICON_GRID_X) * ICON_GRID_X;
  const snappedY = Math.round(y / ICON_GRID_Y) * ICON_GRID_Y;
  return clampIconPosition(snappedX, snappedY);
}

function applyIconPosition(appId, x, y, { snap = false, persist = true } = {}) {
  const iconEl = iconElements.get(appId);
  if (!iconEl) return;
  const next = snap ? snapIconPosition(x, y) : clampIconPosition(x, y);
  iconPositions.set(appId, next);
  iconEl.style.transform = `translate(${next.x}px, ${next.y}px)`;
  if (persist) {
    persistIconLayoutMap();
  }
}

function setSelectedIcon(appId) {
  selectedIconId = appId || '';
  for (const [id, iconEl] of iconElements.entries()) {
    iconEl.classList.toggle('is-selected', id === selectedIconId);
  }
}

function setTaskbarActiveState() {
  if (!osTaskbarApps) return;
  for (const button of osTaskbarApps.querySelectorAll('.os-taskbar-app')) {
    const appId = button.getAttribute('data-app') || '';
    button.classList.toggle('is-active', windowsByAppId.has(appId));
  }
}

function getDockButtons() {
  const buttons = [];
  if (osStartButton instanceof HTMLButtonElement) {
    buttons.push(osStartButton);
  }
  if (osTaskbarApps) {
    for (const button of osTaskbarApps.querySelectorAll('.os-taskbar-app')) {
      if (button instanceof HTMLButtonElement) {
        buttons.push(button);
      }
    }
  }
  return buttons;
}

function setDockButtonPose(button, scale, liftPx) {
  button.style.setProperty('--dock-scale', scale.toFixed(3));
  button.style.setProperty('--dock-lift', `${liftPx.toFixed(2)}px`);
}

function resetDockMagnification() {
  for (const button of getDockButtons()) {
    setDockButtonPose(button, 1, 0);
  }
}

function updateDockMagnification(clientX, hoveredButton = null) {
  const buttons = getDockButtons();
  for (const button of buttons) {
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + (rect.width * 0.5);
    const distance = Math.abs(clientX - centerX);
    const normalized = clamp(1 - (distance / DOCK_HOVER_RADIUS_PX), 0, 1);
    const eased = button === hoveredButton ? 1 : (normalized * normalized);
    const isStartButton = button === osStartButton;
    const maxScale = isStartButton ? 1.34 : DOCK_MAX_SCALE;
    const maxLift = isStartButton ? DOCK_MAX_LIFT_PX * 0.78 : DOCK_MAX_LIFT_PX;
    const scale = 1 + (eased * (maxScale - 1));
    const lift = eased * maxLift;
    setDockButtonPose(button, scale, lift);
  }
}

function setupDockInteractions() {
  if (!osTaskbar) return;
  if (isMobileLayout()) {
    teardownDockInteractions();
    return;
  }
  if (dockInteractionsBound) return;
  dockPointerMoveHandler = (event) => {
    const hoveredButton = event.target instanceof HTMLElement
      ? event.target.closest('.os-taskbar-app, #os-start-button')
      : null;
    updateDockMagnification(event.clientX, hoveredButton instanceof HTMLButtonElement ? hoveredButton : null);
  };
  dockPointerLeaveHandler = () => {
    resetDockMagnification();
  };

  osTaskbar.addEventListener('pointermove', dockPointerMoveHandler);
  osTaskbar.addEventListener('pointerleave', dockPointerLeaveHandler);
  osTaskbar.addEventListener('pointercancel', dockPointerLeaveHandler);
  dockInteractionsBound = true;
}

function teardownDockInteractions() {
  if (!dockInteractionsBound || !osTaskbar) return;
  if (dockPointerMoveHandler) {
    osTaskbar.removeEventListener('pointermove', dockPointerMoveHandler);
  }
  if (dockPointerLeaveHandler) {
    osTaskbar.removeEventListener('pointerleave', dockPointerLeaveHandler);
    osTaskbar.removeEventListener('pointercancel', dockPointerLeaveHandler);
  }
  dockPointerMoveHandler = null;
  dockPointerLeaveHandler = null;
  dockInteractionsBound = false;
  resetDockMagnification();
}

function triggerDockBounce(button) {
  if (!(button instanceof HTMLButtonElement)) return;
  button.classList.remove('is-bouncing');
  void button.offsetWidth;
  button.classList.add('is-bouncing');
  setManagedTimeout(() => {
    button.classList.remove('is-bouncing');
  }, 520);
}

function closeStartMenuIfNeeded() {
  if (!startMenuOpen) return;
  setStartMenuOpen(false);
}

function onDesktopIconClick(event) {
  const iconEl = event.currentTarget;
  if (!(iconEl instanceof HTMLElement)) return;
  const appId = iconEl.dataset.app || '';
  if (!appId) return;

  const suppressUntil = iconSuppressClickUntilMs.get(appId) ?? 0;
  if (performance.now() < suppressUntil) return;

  setSelectedIcon(appId);

  const now = performance.now();
  const last = iconLastClickMs.get(appId) ?? 0;
  if (now - last <= ICON_DOUBLE_CLICK_MS) {
    iconLastClickMs.set(appId, 0);
    openAppWindow(appId, {
      originRect: iconEl.getBoundingClientRect(),
    });
    return;
  }
  iconLastClickMs.set(appId, now);
}

function onDesktopIconPointerDown(event) {
  const iconEl = event.currentTarget;
  if (!(iconEl instanceof HTMLElement)) return;
  const appId = iconEl.dataset.app || '';
  if (!appId) return;

  if (event.button !== 0) return;
  closeStartMenuIfNeeded();
  setSelectedIcon(appId);

  const current = iconPositions.get(appId);
  if (!current) return;

  activeIconDrag = {
    appId,
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startPosX: current.x,
    startPosY: current.y,
    moved: false,
  };

  try {
    iconEl.setPointerCapture(event.pointerId);
  } catch {
    // pointer capture not guaranteed on every browser
  }

  event.preventDefault();
}

function handleIconPointerMove(event) {
  if (!activeIconDrag) return;
  if (event.pointerId !== activeIconDrag.pointerId) return;

  const dx = event.clientX - activeIconDrag.startClientX;
  const dy = event.clientY - activeIconDrag.startClientY;
  if (!activeIconDrag.moved && Math.hypot(dx, dy) > 4) {
    activeIconDrag.moved = true;
  }

  const nextX = activeIconDrag.startPosX + dx;
  const nextY = activeIconDrag.startPosY + dy;
  applyIconPosition(activeIconDrag.appId, nextX, nextY, { snap: false, persist: false });
  event.preventDefault();
}

function getIconDropTargetAppId(clientX, clientY, draggedAppId) {
  const draggedEl = iconElements.get(draggedAppId);
  if (draggedEl instanceof HTMLElement) {
    const previousPointerEvents = draggedEl.style.pointerEvents;
    draggedEl.style.pointerEvents = 'none';
    const hitEl = document.elementFromPoint(clientX, clientY);
    draggedEl.style.pointerEvents = previousPointerEvents;

    if (hitEl instanceof HTMLElement) {
      const hitIcon = hitEl.closest('.os-desktop-icon');
      if (hitIcon instanceof HTMLElement) {
        const hitAppId = hitIcon.dataset.app || '';
        if (hitAppId && hitAppId !== draggedAppId) {
          return hitAppId;
        }
      }
    }
  }

  const draggedPos = iconPositions.get(draggedAppId);
  if (!draggedPos) return '';
  const snappedDragged = snapIconPosition(draggedPos.x, draggedPos.y);
  for (const [otherAppId, otherPos] of iconPositions.entries()) {
    if (otherAppId === draggedAppId) continue;
    const snappedOther = snapIconPosition(otherPos.x, otherPos.y);
    if (snappedOther.x === snappedDragged.x && snappedOther.y === snappedDragged.y) {
      return otherAppId;
    }
  }

  return '';
}

function handleIconPointerUp(event) {
  if (!activeIconDrag) return;
  if (event.pointerId !== activeIconDrag.pointerId) return;

  const appId = activeIconDrag.appId;
  const position = iconPositions.get(appId);
  if (position && activeIconDrag.moved) {
    const dragStartSlot = snapIconPosition(activeIconDrag.startPosX, activeIconDrag.startPosY);
    const dropTargetAppId = getIconDropTargetAppId(event.clientX, event.clientY, appId);
    if (dropTargetAppId) {
      const targetPos = iconPositions.get(dropTargetAppId);
      const targetSlot = targetPos
        ? snapIconPosition(targetPos.x, targetPos.y)
        : snapIconPosition(position.x, position.y);

      applyIconPosition(appId, targetSlot.x, targetSlot.y, { snap: true, persist: false });
      applyIconPosition(dropTargetAppId, dragStartSlot.x, dragStartSlot.y, { snap: true, persist: false });
      persistIconLayoutMap();
      iconSuppressClickUntilMs.set(dropTargetAppId, performance.now() + 140);
    } else {
      applyIconPosition(appId, position.x, position.y, { snap: true, persist: true });
    }

    iconSuppressClickUntilMs.set(appId, performance.now() + 140);
    if (isPointInsideTaskbar(event.clientX, event.clientY)) {
      pinTaskbarApp(appId);
    }
  }
  activeIconDrag = null;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getAppMeta(appId) {
  return OS_APPS.find((app) => app.id === appId) ?? null;
}

function getPanelCodeForApp(appId) {
  const index = OS_APPS.findIndex((app) => app.id === appId);
  const panelNumber = index >= 0 ? 21 + index : 21;
  return `PANEL ${String(panelNumber).padStart(3, '0')}`;
}

function getPanelCoordinateForApp(appId) {
  const token = String(appId || 'panel');
  let hash = 0;
  for (let i = 0; i < token.length; i += 1) {
    hash = ((hash * 33) + token.charCodeAt(i)) % 65536;
  }
  const major = 145 + (hash % 11);
  const fractional = ((Math.floor(hash / 7) % 1000) / 1000);
  return `${(major + fractional).toFixed(3)}%`;
}

function getPanelNavigatorForApp(appId) {
  const token = String(appId || 'panel');
  let hash = 0;
  for (let i = 0; i < token.length; i += 1) {
    hash = ((hash * 37) + token.charCodeAt(i)) % 65536;
  }
  const navigatorId = 220 + (hash % 120);
  const suffix = String.fromCharCode(65 + (hash % 3));
  return `NAVIGATOR ${navigatorId} ${suffix}`;
}

function buildAboutSystemMarkup() {
  const tz = sanitizeBiosToken(Intl.DateTimeFormat().resolvedOptions().timeZone, 'Unknown', 40);
  const browser = sanitizeBiosToken(detectBrowserSignature(navigator.userAgent || ''), 'Unknown', 40);
  const platform = sanitizeBiosToken(navigator.platform || 'Unknown', 'Unknown', 40);
  const viewport = `${window.innerWidth}x${window.innerHeight}`;

  return `
    <h3>System Snapshot</h3>
    <p>Platform: ${escapeHtml(platform)}</p>
    <p>Browser: ${escapeHtml(browser)}</p>
    <p>Timezone: ${escapeHtml(tz)}</p>
    <p>Viewport: ${escapeHtml(viewport)}</p>
    <p>Shell Build: AC-OSR 1.0</p>
  `;
}

function buildWindowBodyMarkup(appId) {
  if (appId === 'recycle-bin') {
    return `
      <h3>Recycle Bin</h3>
      <div class="os-app-table">
        <table>
          <thead>
            <tr><th>Name</th><th>Date Deleted</th><th>Type</th><th>Size</th></tr>
          </thead>
          <tbody>
            <tr><td>Empty</td><td>--</td><td>--</td><td>0 KB</td></tr>
          </tbody>
        </table>
      </div>
      <p>Nothing is currently discarded.</p>
    `;
  }

  if (appId === 'file-explorer') {
    return `
      <h3>File Explorer</h3>
      <div class="os-app-grid">
        <aside class="os-app-tree">
          <ul><li>Desktop</li><li>Documents</li><li>Media</li><li>System</li></ul>
        </aside>
        <section class="os-app-list">
          <ul><li>readme.txt</li><li>daily-note.md</li><li>archive.bin</li><li>handoff.log</li></ul>
        </section>
      </div>
    `;
  }

  if (appId === 'notes') {
    return `
      <h3>Notes</h3>
      <textarea class="os-notes-editor" spellcheck="false">${escapeHtml(osNotesValue)}</textarea>
    `;
  }

  if (appId === 'settings') {
    return `
      <h3>Settings</h3>
      <div class="os-setting-row">
        <label for="os-setting-motion">Background motion</label>
        <input id="os-setting-motion" class="os-setting-motion" type="checkbox" ${osSettings.motionEnabled ? 'checked' : ''} />
      </div>
      <div class="os-setting-row">
        <span>Motion intensity</span>
        <input class="os-setting-intensity" type="range" min="0" max="1" step="0.01" value="${osSettings.motionIntensity.toFixed(2)}" />
      </div>
      <div class="os-setting-row">
        <span>Taskbar style</span>
        <div class="os-setting-choice-group">
          <label class="os-setting-choice">
            <input type="radio" name="os-taskbar-style" class="os-taskbar-style-choice" value="${TASKBAR_STYLE_DIFFUSE}" ${osSettings.taskbarStyle === TASKBAR_STYLE_DIFFUSE ? 'checked' : ''} />
            Diffuse
          </label>
          <label class="os-setting-choice">
            <input type="radio" name="os-taskbar-style" class="os-taskbar-style-choice" value="${TASKBAR_STYLE_OUTLINE}" ${osSettings.taskbarStyle === TASKBAR_STYLE_OUTLINE ? 'checked' : ''} />
            Outline
          </label>
        </div>
      </div>
      <div class="os-setting-row">
        <span>Desktop layout</span>
        <button class="os-reset-icons" type="button">Reset icon positions</button>
      </div>
    `;
  }

  if (appId === 'ferro-control') {
    return `
      <h3>Ferrofluid Control</h3>
      <p>Hover influence is always enabled.</p>
      <div class="os-setting-row">
        <label for="os-ferro-orbit">Enable drag spin/orbit</label>
        <input id="os-ferro-orbit" class="os-ferro-orbit-toggle" type="checkbox" ${osSettings.ferroOrbitEnabled ? 'checked' : ''} />
      </div>
      <div class="os-setting-row">
        <label for="os-ferro-zoom">Enable wheel zoom</label>
        <input id="os-ferro-zoom" class="os-ferro-zoom-toggle" type="checkbox" ${osSettings.ferroZoomEnabled ? 'checked' : ''} />
      </div>
    `;
  }

  if (appId === 'about-system') {
    return buildAboutSystemMarkup();
  }

  return '<p>Module unavailable.</p>';
}

function hydrateWindowBody(appId, bodyEl) {
  if (!(bodyEl instanceof HTMLElement)) return;

  if (appId === 'notes') {
    const notesEditor = bodyEl.querySelector('.os-notes-editor');
    if (notesEditor instanceof HTMLTextAreaElement) {
      notesEditor.value = osNotesValue;
      notesEditor.addEventListener('input', () => {
        persistNotes(notesEditor.value);
      });
      notesEditor.focus();
      notesEditor.setSelectionRange(notesEditor.value.length, notesEditor.value.length);
    }
    return;
  }

  if (appId === 'settings') {
    const motionCheckbox = bodyEl.querySelector('.os-setting-motion');
    if (motionCheckbox instanceof HTMLInputElement) {
      motionCheckbox.checked = Boolean(osSettings.motionEnabled);
      motionCheckbox.addEventListener('change', () => {
        osSettings.motionEnabled = motionCheckbox.checked;
        persistSettings();
        syncBackgroundVisualizerMode();
      });
    }

    const intensityRange = bodyEl.querySelector('.os-setting-intensity');
    if (intensityRange instanceof HTMLInputElement) {
      intensityRange.value = osSettings.motionIntensity.toFixed(2);
      intensityRange.addEventListener('input', () => {
        osSettings.motionIntensity = clamp(Number(intensityRange.value), 0, 1);
        persistSettings();
      });
    }

    for (const styleChoice of bodyEl.querySelectorAll('.os-taskbar-style-choice')) {
      if (!(styleChoice instanceof HTMLInputElement)) continue;
      styleChoice.checked = styleChoice.value === osSettings.taskbarStyle;
      styleChoice.addEventListener('change', () => {
        if (!styleChoice.checked) return;
        osSettings.taskbarStyle = styleChoice.value === TASKBAR_STYLE_OUTLINE
          ? TASKBAR_STYLE_OUTLINE
          : TASKBAR_STYLE_DIFFUSE;
        persistSettings();
        applyTaskbarStyle();
      });
    }

    const resetButton = bodyEl.querySelector('.os-reset-icons');
    if (resetButton instanceof HTMLButtonElement) {
      resetButton.addEventListener('click', () => {
        resetIconLayout();
      });
    }
  }

  if (appId === 'ferro-control') {
    const orbitToggle = bodyEl.querySelector('.os-ferro-orbit-toggle');
    if (orbitToggle instanceof HTMLInputElement) {
      orbitToggle.checked = Boolean(osSettings.ferroOrbitEnabled);
      orbitToggle.addEventListener('change', () => {
        osSettings.ferroOrbitEnabled = orbitToggle.checked;
        persistSettings();
      });
    }

    const zoomToggle = bodyEl.querySelector('.os-ferro-zoom-toggle');
    if (zoomToggle instanceof HTMLInputElement) {
      zoomToggle.checked = Boolean(osSettings.ferroZoomEnabled);
      zoomToggle.addEventListener('change', () => {
        osSettings.ferroZoomEnabled = zoomToggle.checked;
        persistSettings();
      });
    }
  }
}
function focusWindow(appId) {
  const win = windowsByAppId.get(appId);
  if (!win) return;
  windowZCounter += 1;
  win.element.style.zIndex = `${windowZCounter}`;

  for (const entry of windowsByAppId.values()) {
    entry.element.classList.toggle('is-focused', entry.appId === appId);
  }
}

function clampWindowPosition(win) {
  const margins = getWindowViewportMargins();
  const maxX = Math.max(margins.left, window.innerWidth - win.width - margins.right);
  const maxY = Math.max(margins.top, window.innerHeight - win.height - margins.bottom);
  win.x = clamp(win.x, margins.left, maxX);
  win.y = clamp(win.y, margins.top, maxY);
  win.element.style.transform = `translate(${win.x}px, ${win.y}px)`;
}

function closeWindow(appId, { animate = true } = {}) {
  const win = windowsByAppId.get(appId);
  if (!win) return;
  const shouldAnimate = animate && !win.minimized;
  windowsByAppId.delete(appId);
  if (!shouldAnimate) {
    win.element.remove();
    buildTaskbarApps();
    return;
  }
  const taskbarButton = getTaskbarButtonForApp(appId);
  const targetRect = taskbarButton?.getBoundingClientRect() || null;
  if (taskbarButton) {
    triggerDockBounce(taskbarButton);
  }
  animateWindowClose(win.element, win, targetRect).finally(() => {
    win.element.remove();
  });
  buildTaskbarApps();
}

function minimizeWindow(appId, { targetRect = null } = {}) {
  const win = windowsByAppId.get(appId);
  if (!win || win.minimized) return;

  win.minimized = true;
  win.minimizeRevision = (win.minimizeRevision || 0) + 1;
  const revision = win.minimizeRevision;
  win.element.classList.add('is-minimizing');
  const resolvedTargetRect = getMinimizeTargetRect(appId, targetRect);

  animateWindowMinimize(win.element, win, resolvedTargetRect).finally(() => {
    const current = windowsByAppId.get(appId);
    if (!current) return;
    if (current.minimizeRevision !== revision || !current.minimized) return;

    current.element.classList.remove('is-minimizing', 'is-closing', 'is-focused');
    current.element.classList.add('is-minimized');
    current.element.style.display = 'none';
    current.element.style.opacity = '';
    current.element.style.filter = '';
    current.element.style.transform = `translate(${Math.round(current.x)}px, ${Math.round(current.y)}px)`;
  });

  const visibleWindows = Array.from(windowsByAppId.values()).filter((entry) => entry.appId !== appId && !entry.minimized);
  if (visibleWindows.length > 0) {
    visibleWindows.sort((a, b) => Number(a.element.style.zIndex || 0) - Number(b.element.style.zIndex || 0));
    const top = visibleWindows[visibleWindows.length - 1];
    if (top) {
      focusWindow(top.appId);
    }
  } else {
    for (const entry of windowsByAppId.values()) {
      entry.element.classList.remove('is-focused');
    }
  }

  setTaskbarActiveState();
}

function restoreWindow(appId, { originRect = null } = {}) {
  const win = windowsByAppId.get(appId);
  if (!win || !win.minimized) return;

  win.minimizeRevision = (win.minimizeRevision || 0) + 1;
  for (const animation of win.element.getAnimations()) {
    animation.cancel();
  }
  win.minimized = false;
  win.element.classList.remove('is-minimized', 'is-minimizing', 'is-closing');
  win.element.style.display = 'flex';
  win.element.style.opacity = '1';
  win.element.style.filter = 'none';
  clampWindowPosition(win);
  focusWindow(appId);
  setTaskbarActiveState();
  animateWindowOpen(win.element, win, originRect);
}

function onWindowHeaderPointerDown(event) {
  const header = event.currentTarget;
  if (!(header instanceof HTMLElement)) return;
  const windowEl = header.closest('.os-window');
  if (!(windowEl instanceof HTMLElement)) return;
  if (event.target instanceof HTMLElement && event.target.closest('.os-window-close')) return;

  const appId = windowEl.dataset.app || '';
  const win = windowsByAppId.get(appId);
  if (!win) return;

  focusWindow(appId);
  activeWindowDrag = {
    appId,
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startX: win.x,
    startY: win.y,
  };

  try {
    header.setPointerCapture(event.pointerId);
  } catch {
    // optional pointer capture support
  }

  event.preventDefault();
}

function handleWindowPointerMove(event) {
  if (!activeWindowDrag) return;
  if (event.pointerId !== activeWindowDrag.pointerId) return;

  const win = windowsByAppId.get(activeWindowDrag.appId);
  if (!win) {
    activeWindowDrag = null;
    return;
  }

  const dx = event.clientX - activeWindowDrag.startClientX;
  const dy = event.clientY - activeWindowDrag.startClientY;
  win.x = activeWindowDrag.startX + dx;
  win.y = activeWindowDrag.startY + dy;
  clampWindowPosition(win);

  event.preventDefault();
}

function handleWindowPointerUp(event) {
  if (!activeWindowDrag) return;
  if (event.pointerId !== activeWindowDrag.pointerId) return;
  activeWindowDrag = null;
}

function animateWindowOpen(windowEl, win, originRect = null) {
  if (!(windowEl instanceof HTMLElement)) return;
  const finalTransform = `translate(${Math.round(win.x)}px, ${Math.round(win.y)}px) scale(1)`;
  const startTransform = (() => {
    if (!originRect) {
      return `translate(${Math.round(win.x)}px, ${Math.round(win.y + 26)}px) scale(0.92)`;
    }
    const startX = originRect.left + (originRect.width * 0.5) - (win.width * 0.5);
    const startY = originRect.top + (originRect.height * 0.6) - (win.height * 0.46);
    return `translate(${Math.round(startX)}px, ${Math.round(startY)}px) scale(0.22)`;
  })();

  windowEl.animate(
    [
      { transform: startTransform, opacity: 0.12, filter: 'blur(5px)' },
      { transform: finalTransform, opacity: 1, filter: 'blur(0px)' },
    ],
    {
      duration: originRect ? 380 : 300,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'none',
    },
  );
}

function animateWindowClose(windowEl, win, targetRect = null) {
  if (!(windowEl instanceof HTMLElement)) return Promise.resolve();
  const startTransform = `translate(${Math.round(win.x)}px, ${Math.round(win.y)}px) scale(1)`;
  const endTransform = (() => {
    if (!targetRect) {
      return `translate(${Math.round(win.x)}px, ${Math.round(win.y + 26)}px) scale(0.86)`;
    }
    const endX = targetRect.left + (targetRect.width * 0.5) - (win.width * 0.5);
    const endY = targetRect.top + (targetRect.height * 0.66) - (win.height * 0.42);
    return `translate(${Math.round(endX)}px, ${Math.round(endY)}px) scale(0.24)`;
  })();

  windowEl.classList.add('is-closing');
  const animation = windowEl.animate(
    [
      { transform: startTransform, opacity: 1, filter: 'blur(0px)' },
      { transform: endTransform, opacity: 0.06, filter: 'blur(4px)' },
    ],
    {
      duration: targetRect ? 320 : 210,
      easing: 'cubic-bezier(0.55, 0.06, 0.68, 0.19)',
      fill: 'forwards',
    },
  );
  return animation.finished.catch(() => {});
}

function createWindowAfterimage(windowEl) {
  if (!(windowEl instanceof HTMLElement)) return;
  const rect = windowEl.getBoundingClientRect();
  if (rect.width < 4 || rect.height < 4) return;

  const ghost = document.createElement('div');
  ghost.className = 'os-window-afterimage';
  ghost.style.left = `${Math.round(rect.left)}px`;
  ghost.style.top = `${Math.round(rect.top)}px`;
  ghost.style.width = `${Math.round(rect.width)}px`;
  ghost.style.height = `${Math.round(rect.height)}px`;
  document.body.appendChild(ghost);

  const animation = ghost.animate(
    [
      { opacity: 0.24, filter: 'blur(1px)', transform: 'translateZ(0) scale(1)' },
      { opacity: 0, filter: 'blur(5px)', transform: 'translateZ(0) scale(0.965)' },
    ],
    {
      duration: 190,
      easing: 'ease-out',
      fill: 'forwards',
    },
  );

  animation.finished
    .catch(() => {})
    .finally(() => {
      ghost.remove();
    });
}

function startWindowAfterimageTrail(windowEl, frameInterval = MINIMIZE_AFTERIMAGE_FRAME_INTERVAL) {
  if (!(windowEl instanceof HTMLElement)) return () => {};
  let rafId = 0;
  let frameCount = 0;
  let stopped = false;

  const tick = () => {
    if (stopped) return;
    frameCount += 1;
    if (frameCount % frameInterval === 0) {
      createWindowAfterimage(windowEl);
    }
    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
  return () => {
    stopped = true;
    if (rafId) cancelAnimationFrame(rafId);
  };
}

function getMinimizeTargetRect(appId, requestedRect = null) {
  if (requestedRect) return requestedRect;
  const taskbarButton = getTaskbarButtonForApp(appId);
  if (taskbarButton) {
    return taskbarButton.getBoundingClientRect();
  }
  if (!osTaskbar) return null;

  const taskbarRect = osTaskbar.getBoundingClientRect();
  const fallbackSize = 56;
  const left = taskbarRect.left + (taskbarRect.width * 0.5) - (fallbackSize * 0.5);
  const top = taskbarRect.top + (taskbarRect.height * 0.5) - (fallbackSize * 0.5);
  return {
    left,
    top,
    width: fallbackSize,
    height: fallbackSize,
    right: left + fallbackSize,
    bottom: top + fallbackSize,
    x: left,
    y: top,
    toJSON() {
      return { left, top, width: fallbackSize, height: fallbackSize };
    },
  };
}

function animateWindowMinimize(windowEl, win, targetRect = null) {
  if (!(windowEl instanceof HTMLElement)) return Promise.resolve();

  const startX = Math.round(win.x);
  const startY = Math.round(win.y);
  const startTransform = `translate(${startX}px, ${startY}px) scale(1)`;

  const endTransform = (() => {
    if (!targetRect) {
      return `translate(${startX}px, ${Math.round(win.y + 48)}px) scale(0.16)`;
    }
    const targetCenterX = targetRect.left + (targetRect.width * 0.5);
    const targetCenterY = targetRect.top + (targetRect.height * 0.58);
    const endX = targetCenterX - (win.width * 0.5);
    const endY = targetCenterY - (win.height * 0.5);
    return `translate(${Math.round(endX)}px, ${Math.round(endY)}px) scale(0.08)`;
  })();

  const midTransform = (() => {
    if (!targetRect) {
      return `translate(${startX}px, ${Math.round(win.y + 28)}px) scale(0.62)`;
    }
    const targetCenterX = targetRect.left + (targetRect.width * 0.5);
    const targetCenterY = targetRect.top + (targetRect.height * 0.58);
    const endX = targetCenterX - (win.width * 0.5);
    const endY = targetCenterY - (win.height * 0.5);
    const midX = startX + ((endX - startX) * 0.66);
    const midY = startY + ((endY - startY) * 0.66);
    return `translate(${Math.round(midX)}px, ${Math.round(midY)}px) scale(0.45)`;
  })();

  windowEl.classList.add('is-closing');
  const stopTrail = startWindowAfterimageTrail(windowEl);
  const animation = windowEl.animate(
    [
      { transform: startTransform, opacity: 1, filter: 'blur(0px)' },
      { transform: midTransform, opacity: 0.72, filter: 'blur(2px)' },
      { transform: endTransform, opacity: 0.02, filter: 'blur(7px)' },
    ],
    {
      duration: MINIMIZE_SUCTION_DURATION_MS,
      easing: 'cubic-bezier(0.16, 0.86, 0.08, 1)',
      fill: 'forwards',
    },
  );

  return animation.finished
    .catch(() => {})
    .finally(() => {
      stopTrail();
    });
}

function pulseExistingWindow(windowEl) {
  if (!(windowEl instanceof HTMLElement)) return;
  windowEl.animate(
    [
      { opacity: 0.88 },
      { opacity: 1 },
    ],
    {
      duration: 180,
      easing: 'ease-out',
      fill: 'none',
    },
  );
}

function openAppWindow(appId, options = {}) {
  const meta = getAppMeta(appId);
  if (!meta || !osWindowLayer) return;

  const existing = windowsByAppId.get(appId);
  if (existing) {
    if (existing.minimized) {
      restoreWindow(appId, { originRect: options.originRect || null });
      return;
    }
    focusWindow(appId);
    pulseExistingWindow(existing.element);
    return;
  }

  const windowEl = document.createElement('section');
  windowEl.className = 'os-window';
  windowEl.dataset.app = appId;
  windowEl.dataset.panel = getPanelCodeForApp(appId);
  windowEl.dataset.coord = getPanelCoordinateForApp(appId);
  windowEl.dataset.navigator = getPanelNavigatorForApp(appId);

  const headerEl = document.createElement('header');
  headerEl.className = 'os-window-header';
  headerEl.dataset.panel = windowEl.dataset.panel;
  headerEl.dataset.coord = windowEl.dataset.coord;
  headerEl.dataset.navigator = windowEl.dataset.navigator;

  const titleGroupEl = document.createElement('div');
  titleGroupEl.className = 'os-window-title-group';

  const metaEl = document.createElement('span');
  metaEl.className = 'os-window-meta';
  metaEl.textContent = windowEl.dataset.navigator;

  const titleEl = document.createElement('span');
  titleEl.className = 'os-window-title';
  titleEl.textContent = meta.title;

  const closeEl = document.createElement('button');
  closeEl.className = 'os-window-close';
  closeEl.type = 'button';
  closeEl.setAttribute('aria-label', `Close ${meta.title}`);
  closeEl.textContent = 'x';

  titleGroupEl.appendChild(metaEl);
  titleGroupEl.appendChild(titleEl);
  headerEl.appendChild(titleGroupEl);
  headerEl.appendChild(closeEl);

  const bodyEl = document.createElement('div');
  bodyEl.className = 'os-window-body';
  bodyEl.innerHTML = buildWindowBodyMarkup(appId);

  windowEl.appendChild(headerEl);
  windowEl.appendChild(bodyEl);
  osWindowLayer.appendChild(windowEl);

  const margins = getWindowViewportMargins();
  const maxWindowWidth = Math.max(260, window.innerWidth - margins.left - margins.right);
  const maxWindowHeight = Math.max(220, window.innerHeight - margins.top - margins.bottom);
  const mobileLayout = isMobileLayout();
  const baseWidth = mobileLayout
    ? maxWindowWidth
    : clamp(meta.window.width, 320, maxWindowWidth);
  const baseHeight = mobileLayout
    ? clamp(Math.round(maxWindowHeight * 0.72), 240, maxWindowHeight)
    : clamp(meta.window.height, 220, maxWindowHeight);

  const offset = mobileLayout ? 0 : (windowsByAppId.size * 24);
  const win = {
    appId,
    element: windowEl,
    header: headerEl,
    body: bodyEl,
    minimized: false,
    minimizeRevision: 0,
    x: mobileLayout
      ? margins.left
      : Math.round((window.innerWidth - baseWidth) * 0.5) + offset,
    y: mobileLayout
      ? margins.top + 6
      : Math.round((window.innerHeight - baseHeight) * 0.38) + offset,
    width: baseWidth,
    height: baseHeight,
  };

  windowEl.style.width = `${win.width}px`;
  windowEl.style.height = `${win.height}px`;

  clampWindowPosition(win);

  closeEl.addEventListener('click', () => {
    closeWindow(appId);
  });

  headerEl.addEventListener('pointerdown', onWindowHeaderPointerDown);
  windowEl.addEventListener('pointerdown', () => {
    focusWindow(appId);
  });

  windowsByAppId.set(appId, win);
  buildTaskbarApps();
  focusWindow(appId);
  hydrateWindowBody(appId, bodyEl);
  animateWindowOpen(windowEl, win, options.originRect || null);
}

function clearAllWindows() {
  for (const appId of Array.from(windowsByAppId.keys())) {
    closeWindow(appId, { animate: false });
  }
}

function setStartMenuOpen(nextOpen) {
  startMenuOpen = Boolean(nextOpen);
  if (!osStartMenu || !osStartButton) return;
  osStartMenu.hidden = !startMenuOpen;
  osStartButton.setAttribute('aria-expanded', startMenuOpen ? 'true' : 'false');
}

function handleTaskbarAppPointerDown(event) {
  const button = event.currentTarget;
  if (!(button instanceof HTMLButtonElement)) return;
  const appId = button.getAttribute('data-app') || '';
  if (!appId || event.button !== 0) return;

  activeTaskbarDrag = {
    appId,
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    moved: false,
    button,
  };

  try {
    button.setPointerCapture(event.pointerId);
  } catch {
    // optional pointer capture support
  }
}

function handleTaskbarPointerMove(event) {
  if (!activeTaskbarDrag) return;
  if (event.pointerId !== activeTaskbarDrag.pointerId) return;
  if (activeTaskbarDrag.appId === '') return;

  if (!activeTaskbarDrag.moved) {
    const dx = event.clientX - activeTaskbarDrag.startClientX;
    const dy = event.clientY - activeTaskbarDrag.startClientY;
    if (Math.hypot(dx, dy) >= TASKBAR_DRAG_THRESHOLD_PX) {
      activeTaskbarDrag.moved = true;
      activeTaskbarDrag.button.classList.add('is-dragging');
    }
  }
}

function handleTaskbarPointerUp(event) {
  if (!activeTaskbarDrag) return;
  if (event.pointerId !== activeTaskbarDrag.pointerId) return;

  const appId = activeTaskbarDrag.appId;
  const dragged = activeTaskbarDrag.moved;
  const button = activeTaskbarDrag.button;
  button.classList.remove('is-dragging');
  activeTaskbarDrag = null;

  if (!dragged) return;
  taskbarClickSuppressUntilByApp.set(appId, performance.now() + 260);

  if (!isPointInsideTaskbar(event.clientX, event.clientY)) {
    unpinTaskbarApp(appId);
  }
}

function buildTaskbarApps() {
  if (!osTaskbarApps) return;
  osTaskbarApps.textContent = '';
  const renderAppIds = getTaskbarRenderAppIds();
  for (const appId of renderAppIds) {
    const app = getAppMeta(appId);
    if (!app) continue;
    const button = document.createElement('button');
    button.className = 'os-taskbar-app';
    button.type = 'button';
    button.dataset.app = app.id;
    button.setAttribute('aria-label', app.title);

    const img = document.createElement('img');
    img.src = app.icon;
    img.alt = '';
    img.decoding = 'async';

    button.appendChild(img);
    button.addEventListener('pointerdown', handleTaskbarAppPointerDown);
    button.addEventListener('click', () => {
      const suppressUntil = taskbarClickSuppressUntilByApp.get(app.id) ?? 0;
      if (performance.now() < suppressUntil) return;
      closeStartMenuIfNeeded();
      triggerDockBounce(button);
      const existingWindow = windowsByAppId.get(app.id);
      if (existingWindow) {
        if (existingWindow.minimized) {
          restoreWindow(app.id, {
            originRect: button.getBoundingClientRect(),
          });
          return;
        }
        minimizeWindow(app.id, {
          targetRect: button.getBoundingClientRect(),
        });
        return;
      }
      openAppWindow(app.id, {
        originRect: button.getBoundingClientRect(),
      });
    });
    osTaskbarApps.appendChild(button);
  }

  setTaskbarActiveState();
}

function resetIconLayout() {
  for (const app of OS_APPS) {
    applyIconPosition(app.id, app.defaultX, app.defaultY, { snap: true, persist: false });
  }
  persistIconLayoutMap();
}

function buildDesktopIcons() {
  if (!osDesktop) return;
  osDesktop.textContent = '';
  iconElements.clear();
  iconPositions.clear();

  const storedLayout = loadIconLayoutMap();
  const shouldShiftStoredIconsUp = localStorage.getItem(STORAGE_ICON_LAYOUT_SHIFT_UP) !== '1';

  for (const app of OS_APPS) {
    const iconButton = document.createElement('button');
    iconButton.className = 'os-desktop-icon';
    iconButton.type = 'button';
    iconButton.dataset.app = app.id;
    iconButton.setAttribute('aria-label', app.title);

    const img = document.createElement('img');
    img.src = app.icon;
    img.alt = '';
    img.decoding = 'async';

    const label = document.createElement('span');
    label.textContent = app.title;

    iconButton.appendChild(img);
    iconButton.appendChild(label);

    iconButton.addEventListener('click', onDesktopIconClick);
    iconButton.addEventListener('pointerdown', onDesktopIconPointerDown);

    iconElements.set(app.id, iconButton);
    osDesktop.appendChild(iconButton);

    const stored = storedLayout.get(app.id);
    const origin = stored
      ? {
        x: stored.x,
        y: shouldShiftStoredIconsUp ? stored.y - ICON_GRID_Y : stored.y,
      }
      : { x: app.defaultX, y: app.defaultY };
    applyIconPosition(app.id, origin.x, origin.y, { snap: true, persist: false });
  }

  if (shouldShiftStoredIconsUp) {
    localStorage.setItem(STORAGE_ICON_LAYOUT_SHIFT_UP, '1');
  }
  persistIconLayoutMap();
  setSelectedIcon('');
}

function applyWindowBoundsOnResize() {
  const margins = getWindowViewportMargins();
  const maxWindowWidth = Math.max(260, window.innerWidth - margins.left - margins.right);
  const maxWindowHeight = Math.max(220, window.innerHeight - margins.top - margins.bottom);

  for (const win of windowsByAppId.values()) {
    const minWidth = isMobileLayout() ? 260 : 320;
    win.width = clamp(win.width, minWidth, maxWindowWidth);
    win.height = clamp(win.height, 220, maxWindowHeight);
    win.element.style.width = `${win.width}px`;
    win.element.style.height = `${win.height}px`;
    clampWindowPosition(win);
  }

  for (const [appId, pos] of iconPositions.entries()) {
    applyIconPosition(appId, pos.x, pos.y, { snap: true, persist: false });
  }
  persistIconLayoutMap();
}
function pad2(value) {
  return String(value).padStart(2, '0');
}

function formatDateTime(date) {
  const yyyy = date.getFullYear();
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const min = pad2(date.getMinutes());
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function updateDateTime() {
  if (!osDateTime) return;
  osDateTime.textContent = formatDateTime(new Date());
}

function startDateTimeTicker() {
  if (dateTimeIntervalId) return;
  updateDateTime();
  dateTimeIntervalId = window.setInterval(updateDateTime, 1000);
}

function stopDateTimeTicker() {
  if (!dateTimeIntervalId) return;
  window.clearInterval(dateTimeIntervalId);
  dateTimeIntervalId = 0;
}

function isBackgroundBlockedTarget(target) {
  if (!(target instanceof HTMLElement)) return true;
  return Boolean(target.closest('.os-desktop-icon, .os-window, .os-taskbar, #os-start-menu, .os-topbar, .os-shutdown-screen'));
}

function setBackgroundPointerFromClient(clientX, clientY, strength = 0) {
  const rect = osBgVisualizer instanceof HTMLCanvasElement
    ? osBgVisualizer.getBoundingClientRect()
    : null;
  const width = Math.max(1, rect?.width || window.innerWidth);
  const height = Math.max(1, rect?.height || window.innerHeight);
  const left = rect?.left || 0;
  const top = rect?.top || 0;
  const nx = ((clientX - left) / width) * 2 - 1;
  const ny = 1 - (((clientY - top) / height) * 2);
  bgPointerRayNdc.set(clamp(nx, -1, 1), clamp(ny, -1, 1));

  let mappedToFerro = false;
  if (bgCamera && bgFerroMesh) {
    bgPointerRaycaster.setFromCamera(bgPointerRayNdc, bgCamera);
    bgPointerIntersections.length = 0;
    bgPointerRaycaster.intersectObject(bgFerroMesh, false, bgPointerIntersections);

    if (bgPointerIntersections.length > 0) {
      bgPointerHitPoint.copy(bgPointerIntersections[0].point);
      bgFerroMesh.worldToLocal(bgPointerHitPoint);
      mappedToFerro = true;
    } else if (bgPointerRaycaster.ray.intersectPlane(bgPointerProjectionPlane, bgPointerHitPoint)) {
      bgFerroMesh.worldToLocal(bgPointerHitPoint);
      mappedToFerro = true;
    }
  }

  if (mappedToFerro) {
    const baseRadius = Number(bgFerroGeometry?.parameters?.radius) || 1.55;
    const scaleX = Number(bgFerroMesh?.scale?.x) || 1;
    const radius = Math.max(0.001, baseRadius * scaleX);
    bgPointerTarget.set(
      clamp(bgPointerHitPoint.x / radius, -1.35, 1.35),
      clamp(bgPointerHitPoint.y / radius, -1.35, 1.35),
    );
  } else {
    bgPointerTarget.set(bgPointerRayNdc.x, bgPointerRayNdc.y);
  }

  bgPointerTargetStrength = clamp(strength, 0, 1);
}

function applyBackgroundCameraPose(deltaMs) {
  if (!bgCamera) return;
  const damping = 1 - Math.exp(-(deltaMs * 0.013));
  bgOrbitYaw += (bgOrbitTargetYaw - bgOrbitYaw) * damping;
  bgOrbitPitch += (bgOrbitTargetPitch - bgOrbitPitch) * damping;
  bgCameraDistance += (bgCameraTargetDistance - bgCameraDistance) * damping;

  const cosPitch = Math.cos(bgOrbitPitch);
  const x = Math.sin(bgOrbitYaw) * cosPitch * bgCameraDistance;
  const y = Math.sin(bgOrbitPitch) * bgCameraDistance * 0.92;
  const z = Math.cos(bgOrbitYaw) * cosPitch * bgCameraDistance;
  bgCamera.position.set(x, y, z);
  bgCamera.lookAt(0, 0, 0);
}

function ensureBackgroundAudioChain() {
  if (bgMusicEl) return;

  const music = new Audio(BG_MUSIC_SRC);
  music.loop = true;
  music.preload = 'auto';
  music.volume = BG_MUSIC_VOLUME;
  bgMusicEl = music;

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return;

  try {
    bgMusicCtx = new AudioContextCtor();
    bgMusicSource = bgMusicCtx.createMediaElementSource(music);
    bgMusicAnalyser = bgMusicCtx.createAnalyser();
    bgMusicAnalyser.fftSize = BG_AUDIO_FFT_SIZE;
    bgMusicAnalyser.smoothingTimeConstant = 0.84;

    bgMusicSource.connect(bgMusicAnalyser);
    bgMusicAnalyser.connect(bgMusicCtx.destination);
    bgMusicFrequencyData = new Uint8Array(bgMusicAnalyser.frequencyBinCount);
  } catch {
    bgMusicCtx = null;
    bgMusicSource = null;
    bgMusicAnalyser = null;
    bgMusicFrequencyData = null;
  }
}

function averageBand(data, start, end) {
  if (!data || !data.length) return 0;
  const from = clamp(Math.floor(start), 0, data.length - 1);
  const to = clamp(Math.floor(end), from + 1, data.length);
  let total = 0;
  for (let i = from; i < to; i += 1) {
    total += data[i];
  }
  return total / (to - from);
}

function analyzeBackgroundAudio() {
  if (!bgMusicAnalyser || !bgMusicFrequencyData) {
    bgAudioLow *= 0.93;
    bgAudioMid *= 0.93;
    bgAudioHigh *= 0.93;
    bgAudioEnergy *= 0.92;
    return;
  }

  bgMusicAnalyser.getByteFrequencyData(bgMusicFrequencyData);
  const bins = bgMusicFrequencyData.length;
  const lowCut = Math.floor(bins * 0.14);
  const midCut = Math.floor(bins * 0.48);

  const low = averageBand(bgMusicFrequencyData, 0, lowCut) / 255;
  const mid = averageBand(bgMusicFrequencyData, lowCut, midCut) / 255;
  const high = averageBand(bgMusicFrequencyData, midCut, bins) / 255;

  bgAudioLow = (bgAudioLow * 0.84) + (low * 0.16);
  bgAudioMid = (bgAudioMid * 0.86) + (mid * 0.14);
  bgAudioHigh = (bgAudioHigh * 0.9) + (high * 0.1);

  const weighted = (bgAudioLow * 0.54) + (bgAudioMid * 0.33) + (bgAudioHigh * 0.13);
  const compressed = Math.pow(clamp(weighted, 0, 1), 1.28);
  bgAudioEnergy = (bgAudioEnergy * 0.88) + (compressed * 0.12);
}

async function startBackgroundAudio() {
  ensureBackgroundAudioChain();
  if (!bgMusicEl) return;

  if (bgMusicCtx && bgMusicCtx.state === 'suspended') {
    try {
      await bgMusicCtx.resume();
    } catch {
      // browser gesture policy can defer resume
    }
  }

  if (bgMusicEl.paused) {
    try {
      await bgMusicEl.play();
    } catch {
      // browser gesture policy can defer playback
    }
  }
}

function stopBackgroundAudio() {
  if (bgMusicEl) {
    bgMusicEl.pause();
  }
  if (bgMusicCtx && bgMusicCtx.state === 'running') {
    bgMusicCtx.suspend().catch(() => {});
  }
}

function applyBackgroundVisualizerSize() {
  if (!(osBgVisualizer instanceof HTMLCanvasElement) || !bgRenderer || !bgCamera) return;
  const width = Math.max(1, Math.floor(window.innerWidth));
  const height = Math.max(1, Math.floor(window.innerHeight));
  const quality = BG_QUALITY_CONFIG[bgQualityTier] ?? BG_QUALITY_CONFIG.medium;
  const targetPixelRatio = Math.min(window.devicePixelRatio || 1, quality.pixelRatio);
  bgRenderer.setPixelRatio(targetPixelRatio);
  bgRenderer.setSize(width, height, false);
  bgCamera.aspect = width / height;
  bgCamera.updateProjectionMatrix();
}

function setBackgroundQuality(nextTier) {
  if (nextTier !== 'high' && nextTier !== 'medium' && nextTier !== 'low') return;
  if (bgQualityTier === nextTier) return;
  bgQualityTier = nextTier;
  applyBackgroundQualityProfile();
}

function evaluateBackgroundPerformance(deltaMs) {
  bgFrameSamples.push(deltaMs);
  if (bgFrameSamples.length > 64) {
    bgFrameSamples.shift();
  }
  if (bgFrameSamples.length < 32) return;

  const avg = bgFrameSamples.reduce((total, value) => total + value, 0) / bgFrameSamples.length;
  if (avg > 34) {
    if (bgQualityTier === 'high') setBackgroundQuality('medium');
    else if (bgQualityTier === 'medium') setBackgroundQuality('low');
    return;
  }

  if (avg < 21) {
    if (bgQualityTier === 'low') setBackgroundQuality('medium');
    else if (bgQualityTier === 'medium') setBackgroundQuality('high');
  }
}

function drawStaticBackgroundFrame() {
  if (!bgRenderer || !bgScene || !bgCamera) return;
  applyBackgroundCameraPose(16.67);
  if (bgFerroMaterial) {
    bgFerroMaterial.uniforms.uMotion.value = 0;
    bgFerroMaterial.uniforms.uIntensity.value = clamp(osSettings.motionIntensity, 0, 1) * 0.72;
    bgFerroMaterial.uniforms.uAudioEnergy.value = clamp(bgAudioEnergy, 0, 1);
    bgFerroMaterial.uniforms.uPointer.value.copy(bgPointerCurrent);
    bgFerroMaterial.uniforms.uPointerStrength.value = clamp(bgPointerStrength, 0, 1) * 0.72;
    bgFerroMaterial.uniforms.uAlpha.value = 0.52 * BG_FERRO_ALPHA_MULTIPLIER;
  }
  bgRenderer.render(bgScene, bgCamera);
}

function drawAnimatedBackgroundFrame(deltaMs) {
  if (!bgRenderer || !bgScene || !bgCamera || !bgFerroMaterial || !bgFerroMesh) return;
  analyzeBackgroundAudio();
  const intensityBase = clamp(osSettings.motionIntensity, 0, 1);
  const audioDrive = clamp(bgAudioEnergy * 1.28, 0, 1);
  const combinedIntensity = clamp((intensityBase * 0.72) + (audioDrive * 0.42), 0, 1);
  const pointerDamping = 1 - Math.exp(-(deltaMs * 0.02));
  bgPointerCurrent.lerp(bgPointerTarget, pointerDamping);
  bgPointerStrength += (bgPointerTargetStrength - bgPointerStrength) * pointerDamping;

  applyBackgroundCameraPose(deltaMs);
  bgFerroMaterial.uniforms.uTime.value = bgTimeline * 0.001;
  bgFerroMaterial.uniforms.uIntensity.value = combinedIntensity;
  bgFerroMaterial.uniforms.uMotion.value = osSettings.motionEnabled ? 1 : 0;
  bgFerroMaterial.uniforms.uAudioEnergy.value = audioDrive;
  bgFerroMaterial.uniforms.uPointer.value.copy(bgPointerCurrent);
  bgFerroMaterial.uniforms.uPointerStrength.value = clamp(bgPointerStrength, 0, 1);
  bgFerroMaterial.uniforms.uAlpha.value = (0.5 + (audioDrive * 0.08)) * BG_FERRO_ALPHA_MULTIPLIER;
  bgFerroMesh.rotation.y += deltaMs * (0.00006 + combinedIntensity * 0.00016);
  bgFerroMesh.rotation.x = Math.sin(bgTimeline * 0.000095 + bgOrbitYaw * 0.2) * 0.1;
  bgFerroMesh.rotation.z = Math.cos(bgTimeline * 0.00007 + bgOrbitPitch * 0.6) * 0.045;
  bgRenderer.render(bgScene, bgCamera);
  evaluateBackgroundPerformance(deltaMs);
}

function buildFerroMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: BG_FERRO_VERTEX_SHADER,
    fragmentShader: BG_FERRO_FRAGMENT_SHADER,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    side: THREE.FrontSide,
    uniforms: {
      uTime: { value: 0 },
      uMotion: { value: 1 },
      uIntensity: { value: clamp(osSettings.motionIntensity, 0, 1) },
      uAudioEnergy: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPointerStrength: { value: 0 },
      uBaseColor: { value: new THREE.Color(0xe5ebf4) },
      uAlpha: { value: 0.52 * BG_FERRO_ALPHA_MULTIPLIER },
    },
  });
}

function rebuildFerroGeometry(subdivisions) {
  if (!bgScene || !bgFerroMaterial) return;
  if (bgFerroMesh) {
    bgScene.remove(bgFerroMesh);
    bgFerroMesh.geometry.dispose();
    bgFerroMesh = null;
  }
  bgFerroGeometry = new THREE.IcosahedronGeometry(1.55, subdivisions);
  bgFerroMesh = new THREE.Mesh(bgFerroGeometry, bgFerroMaterial);
  bgFerroMesh.position.set(0, 0, 0);
  bgScene.add(bgFerroMesh);
  bgMeshSubdivisions = subdivisions;
}

function ensureBackgroundVisualizerScene() {
  if (!(osBgVisualizer instanceof HTMLCanvasElement)) return false;
  if (bgRenderer && bgScene && bgCamera && bgFerroMaterial) return true;

  try {
    bgRenderer = new THREE.WebGLRenderer({
      canvas: osBgVisualizer,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
  } catch {
    return false;
  }

  bgRenderer.setClearColor(0x000000, 0);
  bgScene = new THREE.Scene();
  bgCamera = new THREE.PerspectiveCamera(34, Math.max(1, window.innerWidth / Math.max(1, window.innerHeight)), 0.1, 20);
  bgCamera.position.set(0, 0, bgCameraDistance);
  bgFerroMaterial = buildFerroMaterial();
  applyBackgroundQualityProfile();
  applyBackgroundVisualizerSize();
  drawStaticBackgroundFrame();
  return true;
}

function applyBackgroundQualityProfile() {
  if (!bgRenderer) return;
  const quality = BG_QUALITY_CONFIG[bgQualityTier] ?? BG_QUALITY_CONFIG.medium;
  if (!bgScene || !bgFerroMaterial) return;
  if (bgMeshSubdivisions !== quality.subdivisions) {
    rebuildFerroGeometry(quality.subdivisions);
  }
  applyBackgroundVisualizerSize();
}

function stopBackgroundVisualizer({ keepStaticFrame = false } = {}) {
  if (bgRafId) {
    window.cancelAnimationFrame(bgRafId);
    bgRafId = 0;
  }
  if (keepStaticFrame && ensureBackgroundVisualizerScene()) {
    drawStaticBackgroundFrame();
  }
}

function startBackgroundVisualizer() {
  if (!ensureBackgroundVisualizerScene()) return;

  if (!osSettings.motionEnabled || document.hidden || osShutdownScreen?.hidden === false) {
    stopBackgroundVisualizer({ keepStaticFrame: true });
    return;
  }

  if (bgRafId) return;

  const frame = (timestampMs) => {
    if (teardownStarted) {
      bgRafId = 0;
      return;
    }
    const deltaMs = bgLastTs > 0 ? (timestampMs - bgLastTs) : 16.67;
    bgLastTs = timestampMs;
    bgTimeline += deltaMs;

    drawAnimatedBackgroundFrame(deltaMs);
    bgRafId = window.requestAnimationFrame(frame);
  };

  bgLastTs = 0;
  bgRafId = window.requestAnimationFrame(frame);
}

function syncBackgroundVisualizerMode() {
  if (teardownStarted) return;
  const inReadyState = root?.classList.contains('state-os-ready');
  const shellVisible = inReadyState && osShutdownScreen?.hidden !== false && !document.hidden;

  if (!shellVisible) {
    stopBackgroundVisualizer({ keepStaticFrame: false });
    stopBackgroundAudio();
    return;
  }

  void startBackgroundAudio();
  if (!osSettings.motionEnabled) {
    stopBackgroundVisualizer({ keepStaticFrame: true });
  } else {
    startBackgroundVisualizer();
  }
}

function destroyBackgroundVisualizer() {
  stopBackgroundVisualizer({ keepStaticFrame: false });
  stopBackgroundAudio();
  if (bgMusicSource) {
    try {
      bgMusicSource.disconnect();
    } catch {
      // ignore disconnect races
    }
    bgMusicSource = null;
  }
  if (bgMusicAnalyser) {
    try {
      bgMusicAnalyser.disconnect();
    } catch {
      // ignore disconnect races
    }
    bgMusicAnalyser = null;
  }
  if (bgMusicCtx) {
    bgMusicCtx.close().catch(() => {});
    bgMusicCtx = null;
  }
  if (bgMusicEl) {
    bgMusicEl.pause();
    bgMusicEl.src = '';
    bgMusicEl.load();
    bgMusicEl = null;
  }
  bgMusicFrequencyData = null;
  bgAudioLow = 0;
  bgAudioMid = 0;
  bgAudioHigh = 0;
  bgAudioEnergy = 0;
  if (bgFerroGeometry) {
    bgFerroGeometry.dispose();
    bgFerroGeometry = null;
  }
  if (bgFerroMaterial) {
    bgFerroMaterial.dispose();
    bgFerroMaterial = null;
  }
  bgFerroMesh = null;
  bgMeshSubdivisions = -1;
  bgScene = null;
  bgCamera = null;
  if (bgRenderer) {
    bgRenderer.dispose();
    bgRenderer = null;
  }
}
function onDocumentVisibilityChange() {
  syncBackgroundVisualizerMode();
}

function beginBackgroundOrbitInteraction(event) {
  if (!root?.classList.contains('state-os-ready')) return;
  if (!osSettings.ferroOrbitEnabled) return;
  if (event.button !== 0) return;
  const target = event.target;
  if (isBackgroundBlockedTarget(target)) return;
  if (activeIconDrag || activeWindowDrag) return;

  bgActiveOrbit = {
    pointerId: event.pointerId,
    lastX: event.clientX,
    lastY: event.clientY,
  };

  setBackgroundPointerFromClient(event.clientX, event.clientY, 1);
  void startBackgroundAudio();
  event.preventDefault();
}

function handleBackgroundPointerMove(event) {
  if (!root?.classList.contains('state-os-ready')) return;
  const blocked = isBackgroundBlockedTarget(event.target);
  setBackgroundPointerFromClient(event.clientX, event.clientY, blocked ? 0 : (bgActiveOrbit ? 1 : 0.7));

  if (!bgActiveOrbit || event.pointerId !== bgActiveOrbit.pointerId) return;
  const dx = event.clientX - bgActiveOrbit.lastX;
  const dy = event.clientY - bgActiveOrbit.lastY;
  bgActiveOrbit.lastX = event.clientX;
  bgActiveOrbit.lastY = event.clientY;

  bgOrbitTargetYaw += dx * BG_ORBIT_DRAG_SENSITIVITY_X;
  bgOrbitTargetPitch = clamp(
    bgOrbitTargetPitch - (dy * BG_ORBIT_DRAG_SENSITIVITY_Y),
    -0.78,
    0.78,
  );
  event.preventDefault();
}

function handleBackgroundPointerUp(event) {
  if (!bgActiveOrbit || event.pointerId !== bgActiveOrbit.pointerId) return;
  setBackgroundPointerFromClient(event.clientX, event.clientY, 0.72);
  bgActiveOrbit = null;
}

function onBackgroundWheel(event) {
  if (!root?.classList.contains('state-os-ready')) return;
  if (!osSettings.ferroZoomEnabled) return;
  if (isBackgroundBlockedTarget(event.target)) return;

  bgCameraTargetDistance = clamp(
    bgCameraTargetDistance + (event.deltaY * 0.0045),
    BG_MIN_CAMERA_DISTANCE,
    BG_MAX_CAMERA_DISTANCE,
  );
  event.preventDefault();
}

function onGlobalPointerDown(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (root?.classList.contains('state-os-ready')) {
    void startBackgroundAudio();
  }

  if (startMenuOpen && osStartMenu && !osStartMenu.contains(target) && target !== osStartButton) {
    setStartMenuOpen(false);
    return;
  }

  if (target.closest('.os-desktop-icon') || target.closest('.os-window')) return;
  if (!target.closest('#os-start-menu') && target !== osStartButton) {
    setSelectedIcon('');
  }

  beginBackgroundOrbitInteraction(event);
}

function wireStartMenuHandlers() {
  osStartButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    triggerDockBounce(osStartButton);
    setStartMenuOpen(!startMenuOpen);
  });

  if (osStartMenu) {
    for (const entry of osStartMenu.querySelectorAll('.os-start-entry[data-app]')) {
      entry.addEventListener('click', () => {
        const appId = entry.getAttribute('data-app') || '';
        if (!appId) return;
        setStartMenuOpen(false);
        openAppWindow(appId);
      });
    }
  }

  osRestartButton?.addEventListener('click', () => {
    restartOsShell().catch(() => {
      // ignore restart rejection in UI
    });
  });

  osShutdownButton?.addEventListener('click', () => {
    setStartMenuOpen(false);
    if (osShutdownScreen) {
      osShutdownScreen.hidden = false;
    }
    stopBackgroundVisualizer({ keepStaticFrame: true });
    stopBackgroundAudio();
  });

  osRebootButton?.addEventListener('click', () => {
    if (osShutdownScreen) {
      osShutdownScreen.hidden = true;
    }
    restartOsShell().catch(() => {
      // ignore restart rejection in UI
    });
  });
}

function setupOsGlobalListeners() {
  window.addEventListener('pointermove', handleTaskbarPointerMove);
  window.addEventListener('pointerup', handleTaskbarPointerUp);
  window.addEventListener('pointercancel', handleTaskbarPointerUp);
  window.addEventListener('pointermove', handleBackgroundPointerMove, { capture: true });
  window.addEventListener('pointerup', handleBackgroundPointerUp, { capture: true });
  window.addEventListener('pointercancel', handleBackgroundPointerUp, { capture: true });
  window.addEventListener('pointermove', handleIconPointerMove);
  window.addEventListener('pointerup', handleIconPointerUp);
  window.addEventListener('pointercancel', handleIconPointerUp);

  window.addEventListener('pointermove', handleWindowPointerMove);
  window.addEventListener('pointerup', handleWindowPointerUp);
  window.addEventListener('pointercancel', handleWindowPointerUp);

  window.addEventListener('pointerdown', onGlobalPointerDown, { capture: true });
  window.addEventListener('wheel', onBackgroundWheel, { passive: false, capture: true });
  window.addEventListener('resize', onWindowResize);
  document.addEventListener('visibilitychange', onDocumentVisibilityChange);
}

function teardownOsGlobalListeners() {
  window.removeEventListener('pointermove', handleTaskbarPointerMove);
  window.removeEventListener('pointerup', handleTaskbarPointerUp);
  window.removeEventListener('pointercancel', handleTaskbarPointerUp);
  window.removeEventListener('pointermove', handleBackgroundPointerMove, { capture: true });
  window.removeEventListener('pointerup', handleBackgroundPointerUp, { capture: true });
  window.removeEventListener('pointercancel', handleBackgroundPointerUp, { capture: true });
  window.removeEventListener('pointermove', handleIconPointerMove);
  window.removeEventListener('pointerup', handleIconPointerUp);
  window.removeEventListener('pointercancel', handleIconPointerUp);

  window.removeEventListener('pointermove', handleWindowPointerMove);
  window.removeEventListener('pointerup', handleWindowPointerUp);
  window.removeEventListener('pointercancel', handleWindowPointerUp);

  window.removeEventListener('pointerdown', onGlobalPointerDown, { capture: true });
  window.removeEventListener('wheel', onBackgroundWheel, { capture: true });
  window.removeEventListener('resize', onWindowResize);
  document.removeEventListener('visibilitychange', onDocumentVisibilityChange);
  teardownDockInteractions();
}

function onWindowResize() {
  setupDockInteractions();
  applyWindowBoundsOnResize();
  applyLoaderSceneSize();
  applyBackgroundVisualizerSize();
  if (!osSettings.motionEnabled) {
    drawStaticBackgroundFrame();
  }
}

function resetBackgroundViewState() {
  bgOrbitYaw = 0;
  bgOrbitPitch = 0;
  bgOrbitTargetYaw = 0;
  bgOrbitTargetPitch = 0;
  bgCameraDistance = BG_DEFAULT_CAMERA_DISTANCE;
  bgCameraTargetDistance = BG_DEFAULT_CAMERA_DISTANCE;
  bgPointerTarget.set(0, 0);
  bgPointerCurrent.set(0, 0);
  bgPointerStrength = 0;
  bgPointerTargetStrength = 0;
}

function initializeOsShellIfNeeded() {
  if (osInitialized) return;
  loadSettings();
  loadTaskbarPins();
  applyTaskbarStyle();
  loadNotes();
  buildDesktopIcons();
  buildTaskbarApps();
  setupDockInteractions();
  wireStartMenuHandlers();
  setupOsGlobalListeners();
  startDateTimeTicker();
  applyBackgroundVisualizerSize();
  drawStaticBackgroundFrame();
  osInitialized = true;
}

function enterOsReadyState() {
  if (osShutdownScreen) {
    osShutdownScreen.hidden = true;
  }
  resetBackgroundViewState();
  setState('os-ready');
  initializeOsShellIfNeeded();
  startDateTimeTicker();
  syncBackgroundVisualizerMode();
}

async function restartOsShell() {
  if (osRestartInFlight || teardownStarted) return;
  osRestartInFlight = true;
  setStartMenuOpen(false);
  clearAllWindows();
  setSelectedIcon('');
  try {
    await runLoaderSequence(LOADER_TOTAL_MS);
    if (!teardownStarted) {
      enterOsReadyState();
    }
  } finally {
    osRestartInFlight = false;
  }
}

function onBiosStagePointerDown() {
  if (!biosPreludeActive || teardownStarted) return;
  biosSkipClickCount += 1;
  if (biosSkipClickCount >= BIOS_SKIP_CLICK_THRESHOLD) {
    biosSkipRequested = true;
    biosSkipClickCount = 0;
  }
}

async function runFlow() {
  if (!root || !biosLog) return;
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

  await runLoaderSequence(LOADER_TOTAL_MS);
  if (teardownStarted) return;

  enterOsReadyState();
}

if (biosStage) {
  biosStage.addEventListener('pointerdown', onBiosStagePointerDown);
}

if (root && biosLog) {
  runFlow().catch(() => {
    if (teardownStarted) return;
    enterOsReadyState();
  });
}

window.addEventListener('pagehide', () => {
  teardownStarted = true;
  setState('teardown');

  if (biosDecisionCleanup) {
    biosDecisionCleanup();
  }

  clearManagedTimers();
  cancelLoaderRaf();
  destroyLoaderScene();
  destroyBackgroundVisualizer();
  stopDateTimeTicker();
  stopTypingSoundPool();

  teardownOsGlobalListeners();

  if (biosStage) {
    biosStage.removeEventListener('pointerdown', onBiosStagePointerDown);
  }
});
