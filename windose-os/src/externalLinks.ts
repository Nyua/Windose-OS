export function openExternalUrlWithFallback(url: string, linkType = 'external link'): boolean {
  const target = String(url ?? '').trim();
  if (!target) return false;

  const popup = window.open(target, '_blank', 'noopener,noreferrer');
  if (popup) {
    try {
      popup.opener = null;
    } catch {
      // ignore cross-origin opener assignment failures
    }
    return true;
  }

  const promptMessage = [
    `Your browser blocked this ${linkType}.`,
    'Allow popups for this site, or copy and open this URL manually:',
  ].join('\n');
  window.prompt(promptMessage, target);
  console.warn(`Popup blocked for ${linkType}: ${target}`);
  return false;
}
