/**
 * Mobile Accessibility Test Script
 * Tests the Windose-OS app on mobile device emulation
 */

import { chromium, devices } from 'playwright';

const MOBILE_DEVICE = devices['iPhone 14'];
const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = './mobile-test-screenshots';

const issues = [];

function logIssue(category, description, severity = 'medium') {
  const issue = { category, description, severity };
  issues.push(issue);
  console.log(`[${severity.toUpperCase()}] ${category}: ${description}`);
}

async function ensureScreenshotDir() {
  const fs = await import('fs');
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
}

async function testBootSequence(page) {
  console.log('\n=== Testing Boot Sequence ===');

  // Check if boot sequence is visible
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/01-boot-sequence.png` });

  // Try to skip boot by clicking
  const bootVisible = await page.locator('.boot-sequence').isVisible().catch(() => false);
  if (bootVisible) {
    console.log('Boot sequence detected - attempting to skip...');

    // Wait for bootscreen phase
    await page.waitForTimeout(8000);

    // Click to advance to setup
    for (let i = 0; i < 5; i++) {
      await page.click('body', { force: true });
      await page.waitForTimeout(300);
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-after-boot-click.png` });
  }

  // Check for setup screen asking for fullscreen
  const setupScreen = page.locator('.setup');
  if (await setupScreen.isVisible().catch(() => false)) {
    logIssue('Boot', 'Setup screen requires fullscreen - problematic on mobile browsers', 'high');

    // Mobile browsers may not support fullscreen well, so we need to simulate it
    // or the app should detect mobile and skip this requirement
    console.log('Setup screen detected - simulating fullscreen for mobile...');

    // Try to emulate fullscreen by setting viewport to fill screen
    await page.evaluate(() => {
      // Dispatch a fake fullscreen event
      window.dispatchEvent(new Event('resize'));
    });

    await page.waitForTimeout(2000);

    // Check if we're past setup
    if (await setupScreen.isVisible().catch(() => false)) {
      // Force past it by modifying localStorage
      await page.evaluate(() => {
        localStorage.setItem('windose_boot_seen_v2', '1');
      });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
    }
  }

  // Wait for boot to complete or timeout
  const maxWait = 20000;
  const startTime = Date.now();
  while (Date.now() - startTime < maxWait) {
    const stillBooting = await page.locator('.boot-sequence').isVisible().catch(() => false);
    if (!stillBooting) {
      console.log('Boot sequence completed');
      break;
    }
    await page.click('body', { force: true }).catch(() => {});
    await page.waitForTimeout(500);
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/03-boot-complete.png` });
}

async function testTaskbar(page) {
  console.log('\n=== Testing Taskbar ===');

  const taskbar = page.locator('.taskbar');
  if (!await taskbar.isVisible().catch(() => false)) {
    logIssue('Taskbar', 'Taskbar not visible', 'high');
    return;
  }

  // Check Start button touch target
  const startBtn = page.locator('.start');
  const startBox = await startBtn.boundingBox().catch(() => null);
  if (startBox) {
    if (startBox.height < 44 || startBox.width < 44) {
      logIssue('Taskbar', `Start button too small for touch (${startBox.width}x${startBox.height}px, min 44x44)`, 'high');
    }
    console.log(`Start button size: ${startBox.width}x${startBox.height}px`);
  }

  // Check quick menu buttons
  const quickBtns = page.locator('.quick-btn');
  const quickCount = await quickBtns.count();
  for (let i = 0; i < quickCount; i++) {
    const btn = quickBtns.nth(i);
    const box = await btn.boundingBox().catch(() => null);
    if (box && (box.height < 44 || box.width < 44)) {
      logIssue('Taskbar', `Quick button ${i} too small for touch (${box.width}x${box.height}px)`, 'medium');
    }
  }

  // Check volume slider
  const volumeInput = page.locator('.volume input');
  const volumeBox = await volumeInput.boundingBox().catch(() => null);
  if (volumeBox && volumeBox.height < 44) {
    logIssue('Taskbar', `Volume slider too thin for touch (height: ${volumeBox.height}px)`, 'medium');
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/03-taskbar.png` });
}

async function testStartMenu(page) {
  console.log('\n=== Testing Start Menu ===');

  // Click Start button
  const startBtn = page.locator('.start');
  await startBtn.click().catch(() => {});
  await page.waitForTimeout(500);

  const startMenu = page.locator('.start-menu');
  if (!await startMenu.isVisible().catch(() => false)) {
    logIssue('StartMenu', 'Start menu did not open on tap', 'high');
    return;
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/04-start-menu.png` });

  // Check menu item touch targets
  const menuItems = page.locator('.start-menu button, .start-menu .menu-item');
  const menuCount = await menuItems.count();
  for (let i = 0; i < menuCount; i++) {
    const item = menuItems.nth(i);
    const box = await item.boundingBox().catch(() => null);
    if (box && box.height < 44) {
      const text = await item.textContent().catch(() => `item ${i}`);
      logIssue('StartMenu', `Menu item "${text.trim()}" too small for touch (height: ${box.height}px)`, 'medium');
    }
  }

  // Close start menu
  await page.click('body', { position: { x: 300, y: 300 } });
  await page.waitForTimeout(300);
}

async function testDesktopIcons(page) {
  console.log('\n=== Testing Desktop Icons ===');

  const icons = page.locator('.desktop-icon');
  const iconCount = await icons.count();
  console.log(`Found ${iconCount} desktop icons`);

  for (let i = 0; i < iconCount; i++) {
    const icon = icons.nth(i);
    const box = await icon.boundingBox().catch(() => null);
    const label = await icon.locator('.label').textContent().catch(() => `icon ${i}`);

    if (box) {
      console.log(`Icon "${label.trim()}": ${box.width}x${box.height}px at (${box.x}, ${box.y})`);

      // Check if icon is accessible (not cut off screen)
      const viewport = page.viewportSize();
      if (box.x + box.width > viewport.width) {
        logIssue('DesktopIcons', `Icon "${label.trim()}" extends beyond screen width`, 'medium');
      }
      if (box.y + box.height > viewport.height) {
        logIssue('DesktopIcons', `Icon "${label.trim()}" extends beyond screen height`, 'medium');
      }

      // Check touch target size
      if (box.width < 44 || box.height < 44) {
        logIssue('DesktopIcons', `Icon "${label.trim()}" too small for touch`, 'low');
      }
    }
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/05-desktop-icons.png` });
}

async function closeAllWindows(page) {
  const windows = page.locator('.window-frame, .window');
  const count = await windows.count();
  for (let i = count - 1; i >= 0; i--) {
    const win = windows.nth(i);
    const closeBtn = win.locator('.title-bar-close, .close-btn, button:has-text("×")').first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(200);
    }
  }
  await page.waitForTimeout(300);
}

async function testOpeningApps(page) {
  console.log('\n=== Testing Opening Apps ===');

  // Close any existing windows first
  await closeAllWindows(page);

  const appsToTest = ['Sleep', 'Medication', 'Internet', 'Trash'];

  for (const appName of appsToTest) {
    console.log(`\nTesting app: ${appName}`);

    // Close windows before testing next app
    await closeAllWindows(page);

    const icon = page.locator(`.desktop-icon:has(.label:text("${appName}"))`);
    if (!await icon.isVisible().catch(() => false)) {
      logIssue('Apps', `Could not find ${appName} icon`, 'medium');
      continue;
    }

    // Double-tap to open
    try {
      await icon.dblclick({ timeout: 5000 });
    } catch {
      // Fallback: try two taps with force
      await icon.click({ force: true }).catch(() => {});
      await page.waitForTimeout(150);
      await icon.click({ force: true }).catch(() => {});
    }

    await page.waitForTimeout(1000);

    // Check if window opened
    const windows = page.locator('.window-frame, .window');
    const windowCount = await windows.count();

    if (windowCount === 0) {
      logIssue('Apps', `${appName} window did not open on double-tap`, 'high');
    } else {
      console.log(`  ${appName} opened successfully`);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/06-app-${appName.toLowerCase()}.png` });

      // Check window controls touch targets
      const lastWindow = windows.last();
      const closeBtn = lastWindow.locator('.title-bar-close, .close-btn, button:has-text("×")').first();
      const closeBox = await closeBtn.boundingBox().catch(() => null);
      if (closeBox && (closeBox.width < 44 || closeBox.height < 44)) {
        logIssue('Windows', `${appName} close button too small for touch (${closeBox.width}x${closeBox.height}px)`, 'high');
      }
      if (closeBox) {
        console.log(`  Close button size: ${closeBox.width}x${closeBox.height}px`);
      }
    }
  }

  // Clean up
  await closeAllWindows(page);
}

async function testWindowDragging(page) {
  console.log('\n=== Testing Window Dragging ===');

  // Open an app first
  const icon = page.locator('.desktop-icon:has(.label:text("Sleep"))');
  await icon.dblclick().catch(() => {});
  await page.waitForTimeout(500);

  const window = page.locator('.window-frame').last();
  if (!await window.isVisible().catch(() => false)) {
    logIssue('Windows', 'Could not open window for drag test', 'medium');
    return;
  }

  const titleBar = window.locator('.title-bar');
  const titleBox = await titleBar.boundingBox().catch(() => null);

  if (titleBox) {
    // Try to drag
    const startX = titleBox.x + titleBox.width / 2;
    const startY = titleBox.y + titleBox.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 50, startY + 50, { steps: 5 });
    await page.mouse.up();

    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/07-window-drag.png` });

    // Check new position
    const newBox = await window.boundingBox().catch(() => null);
    if (newBox && Math.abs(newBox.x - titleBox.x) < 10) {
      logIssue('Windows', 'Window dragging may not work well on touch', 'medium');
    }
  }

  // Close window
  const closeBtn = window.locator('.title-bar-close, .close-btn');
  await closeBtn.click().catch(() => {});
  await page.waitForTimeout(300);
}

async function testControlPanel(page) {
  console.log('\n=== Testing Control Panel ===');

  // Open Start menu and click Control Panel
  const startBtn = page.locator('.start');
  await startBtn.click().catch(() => {});
  await page.waitForTimeout(500);

  const cpBtn = page.locator('.start-menu').locator('text=Control Panel');
  if (await cpBtn.isVisible().catch(() => false)) {
    await cpBtn.click().catch(() => {});
    await page.waitForTimeout(500);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/08-control-panel.png` });

    // Check scrollability
    const cpWindow = page.locator('.window-frame:has-text("Control Panel")');
    const cpContent = cpWindow.locator('.window-content, .control-panel');
    const contentBox = await cpContent.boundingBox().catch(() => null);

    if (contentBox) {
      // Try scrolling
      await cpContent.evaluate(el => el.scrollTop = 100);
      await page.waitForTimeout(200);

      const scrolled = await cpContent.evaluate(el => el.scrollTop);
      if (scrolled === 0) {
        logIssue('ControlPanel', 'Content may not be scrollable on mobile', 'medium');
      }
    }

    // Check for Ame's Corner button
    const ameBtn = cpWindow.locator('text=Ame');
    if (await ameBtn.isVisible().catch(() => false)) {
      const ameBox = await ameBtn.boundingBox().catch(() => null);
      if (ameBox && ameBox.height < 44) {
        logIssue('ControlPanel', 'Ame\'s Corner button too small for touch', 'medium');
      }
    }

    // Close
    const closeBtn = cpWindow.locator('.title-bar-close, .close-btn');
    await closeBtn.click().catch(() => {});
    await page.waitForTimeout(300);
  } else {
    logIssue('ControlPanel', 'Could not find Control Panel in Start menu', 'medium');
  }
}

async function testAmesCornerNavigation(page) {
  console.log('\n=== Testing Ame\'s Corner Navigation ===');

  // Open Start menu
  const startBtn = page.locator('.start');
  await startBtn.click().catch(() => {});
  await page.waitForTimeout(500);

  // Open Control Panel
  const cpBtn = page.locator('.start-menu').locator('text=Control Panel');
  if (await cpBtn.isVisible().catch(() => false)) {
    await cpBtn.click().catch(() => {});
    await page.waitForTimeout(500);

    // Find and click Ame's Corner button
    const cpWindow = page.locator('.window-frame:has-text("Control Panel")');
    const ameBtn = cpWindow.locator('button:has-text("Ame"), .ame-corner-btn, text=/ame.*corner/i');

    if (await ameBtn.first().isVisible().catch(() => false)) {
      await ameBtn.first().click().catch(() => {});
      await page.waitForTimeout(3000);

      // Check if navigation happened
      const url = page.url();
      if (url.includes('ames-corner')) {
        console.log('Successfully navigated to Ame\'s Corner');
        await page.screenshot({ path: `${SCREENSHOT_DIR}/09-ames-corner.png` });

        // Test Ame's Corner on mobile
        await testAmesCornerMobile(page);
      } else {
        // Check for transition overlay
        const overlay = page.locator('.ame-intro-overlay, .ame-transition');
        if (await overlay.isVisible().catch(() => false)) {
          console.log('Ame\'s Corner transition in progress...');
          await page.waitForTimeout(8000);
          await page.screenshot({ path: `${SCREENSHOT_DIR}/09-ames-corner-transition.png` });
        } else {
          logIssue('AmesCorner', 'Could not navigate to Ame\'s Corner', 'high');
        }
      }
    } else {
      logIssue('AmesCorner', 'Could not find Ame\'s Corner button in Control Panel', 'high');
    }
  }
}

async function testAmesCornerMobile(page) {
  console.log('\n=== Testing Ame\'s Corner Mobile ===');

  // Wait for page to load
  await page.waitForTimeout(2000);

  // Check BIOS screen
  const biosStage = page.locator('.bios-stage, #bios-stage');
  if (await biosStage.isVisible().catch(() => false)) {
    console.log('BIOS screen visible - testing skip functionality');

    // Try to skip
    for (let i = 0; i < 5; i++) {
      await page.click('body');
      await page.waitForTimeout(200);
    }

    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/10-ames-corner-main.png` });

  // Check desktop icons
  const osIcons = page.locator('.os-icon, .desktop-icon');
  const iconCount = await osIcons.count();
  console.log(`Found ${iconCount} icons in Ame's Corner`);

  // Check taskbar
  const osTaskbar = page.locator('.os-taskbar, .taskbar');
  if (await osTaskbar.isVisible().catch(() => false)) {
    const taskbarBox = await osTaskbar.boundingBox().catch(() => null);
    console.log(`Taskbar size: ${taskbarBox?.width}x${taskbarBox?.height}px`);
  }
}

async function testScrolling(page) {
  console.log('\n=== Testing Scrolling ===');

  // Open Internet app which likely has scrollable content
  const icon = page.locator('.desktop-icon:has(.label:text("Internet"))');
  await icon.dblclick().catch(() => {});
  await page.waitForTimeout(1000);

  const window = page.locator('.window-frame').last();
  if (await window.isVisible().catch(() => false)) {
    await page.screenshot({ path: `${SCREENSHOT_DIR}/11-internet-app.png` });

    // Try touch scrolling
    const contentArea = window.locator('.window-content, .internet-content, iframe');
    const box = await contentArea.boundingBox().catch(() => null);

    if (box) {
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height * 0.7;

      await page.touchscreen.tap(startX, startY);
      await page.waitForTimeout(100);

      // Simulate swipe up
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX, startY - 100, { steps: 10 });
      await page.mouse.up();

      await page.waitForTimeout(300);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/12-after-scroll.png` });
    }

    // Close window
    const closeBtn = window.locator('.title-bar-close, .close-btn');
    await closeBtn.click().catch(() => {});
  }
}

async function testViewportOverflow(page) {
  console.log('\n=== Testing Viewport Overflow ===');

  const viewport = page.viewportSize();
  console.log(`Viewport: ${viewport.width}x${viewport.height}`);

  // Check if content extends beyond viewport
  const overflowX = await page.evaluate(() => {
    return document.body.scrollWidth > window.innerWidth;
  });

  const overflowY = await page.evaluate(() => {
    return document.body.scrollHeight > window.innerHeight;
  });

  if (overflowX) {
    logIssue('Viewport', 'Horizontal scroll present - content wider than viewport', 'high');
  }

  if (overflowY) {
    logIssue('Viewport', 'Vertical scroll present on main body', 'low');
  }

  // Check for elements extending off-screen
  const offscreenElements = await page.evaluate(() => {
    const elements = document.querySelectorAll('.desktop-icon, .window-frame, .taskbar, .start-menu');
    const issues = [];
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.right > window.innerWidth || rect.bottom > window.innerHeight) {
        issues.push({
          class: el.className,
          rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }
        });
      }
    });
    return issues;
  });

  offscreenElements.forEach(el => {
    logIssue('Viewport', `Element with class "${el.class}" extends off-screen`, 'medium');
  });
}

async function generateReport() {
  console.log('\n\n========================================');
  console.log('MOBILE ACCESSIBILITY TEST REPORT');
  console.log('========================================\n');

  const highIssues = issues.filter(i => i.severity === 'high');
  const mediumIssues = issues.filter(i => i.severity === 'medium');
  const lowIssues = issues.filter(i => i.severity === 'low');

  console.log(`Total Issues Found: ${issues.length}`);
  console.log(`  - High: ${highIssues.length}`);
  console.log(`  - Medium: ${mediumIssues.length}`);
  console.log(`  - Low: ${lowIssues.length}`);

  if (highIssues.length > 0) {
    console.log('\n--- HIGH SEVERITY ISSUES ---');
    highIssues.forEach((issue, i) => {
      console.log(`${i + 1}. [${issue.category}] ${issue.description}`);
    });
  }

  if (mediumIssues.length > 0) {
    console.log('\n--- MEDIUM SEVERITY ISSUES ---');
    mediumIssues.forEach((issue, i) => {
      console.log(`${i + 1}. [${issue.category}] ${issue.description}`);
    });
  }

  if (lowIssues.length > 0) {
    console.log('\n--- LOW SEVERITY ISSUES ---');
    lowIssues.forEach((issue, i) => {
      console.log(`${i + 1}. [${issue.category}] ${issue.description}`);
    });
  }

  console.log('\n========================================');
  console.log('RECOMMENDED FIXES');
  console.log('========================================\n');

  const recommendations = [
    {
      category: 'Touch Targets',
      description: 'Increase minimum touch target size to 44x44px for all interactive elements',
      css: `.app-root--mobile .quick-btn { min-width: 44px; min-height: 44px; }
.app-root--mobile .tab { min-height: 44px; }
.app-root--mobile .title-bar button { min-width: 44px; min-height: 44px; }
.app-root--mobile .volume input { height: 44px; }`
    },
    {
      category: 'Start Button',
      description: 'Make start button more touch-friendly on mobile',
      css: `.app-root--mobile .start { min-height: 44px; }`
    },
    {
      category: 'Window Controls',
      description: 'Enlarge window control buttons for mobile',
      css: `.app-root--mobile .title-bar-controls button { min-width: 36px; min-height: 36px; }`
    },
    {
      category: 'Desktop Icons',
      description: 'Consider increasing icon touch area on mobile',
      css: `.app-root--mobile .desktop-icon { padding: 12px; min-width: 80px; }`
    },
    {
      category: 'Viewport',
      description: 'Prevent horizontal overflow on mobile',
      css: `.app-root--mobile { overflow-x: hidden; }
.app-root--mobile .viewport { max-width: 100vw; }`
    },
    {
      category: 'Boot Sequence',
      description: 'Consider auto-skipping fullscreen requirement on mobile or providing alternative',
      note: 'Mobile browsers have limited fullscreen support - consider detecting mobile and skipping this requirement'
    }
  ];

  recommendations.forEach((rec, i) => {
    console.log(`${i + 1}. ${rec.category}`);
    console.log(`   ${rec.description}`);
    if (rec.css) {
      console.log(`   Suggested CSS:\n   ${rec.css.split('\n').join('\n   ')}`);
    }
    if (rec.note) {
      console.log(`   Note: ${rec.note}`);
    }
    console.log('');
  });

  return { issues, recommendations };
}

async function main() {
  console.log('Starting Mobile Accessibility Test...\n');
  console.log(`Device: ${MOBILE_DEVICE.name || 'iPhone 14'}`);
  console.log(`Viewport: ${MOBILE_DEVICE.viewport.width}x${MOBILE_DEVICE.viewport.height}`);
  console.log(`User Agent: ${MOBILE_DEVICE.userAgent.substring(0, 50)}...`);

  await ensureScreenshotDir();

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    ...MOBILE_DEVICE,
    hasTouch: true,
  });

  const page = await context.newPage();

  try {
    // Navigate to the app
    console.log(`\nNavigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000); // Give Vue time to mount

    await page.screenshot({ path: `${SCREENSHOT_DIR}/00-initial-load.png` });

    // Run tests
    await testBootSequence(page);
    await testViewportOverflow(page);
    await testTaskbar(page);
    await testStartMenu(page);
    await testDesktopIcons(page);
    await testOpeningApps(page);
    await testWindowDragging(page);
    await testScrolling(page);
    await testControlPanel(page);
    await testAmesCornerNavigation(page);

    // Generate report
    await generateReport();

  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/error-state.png` });
  } finally {
    await browser.close();
  }

  console.log(`\nScreenshots saved to: ${SCREENSHOT_DIR}/`);
}

main().catch(console.error);
