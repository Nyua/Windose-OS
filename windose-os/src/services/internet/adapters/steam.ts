import type { InternetSiteAdapter, InternetSiteItem } from '../types';
import { carryForwardPayload, fetchRemoteExtract } from './utils';

const STEAM_PROFILE_URL = 'https://steamcommunity.com/id/foundlifeless/';

function asText(value: string | string[] | null | undefined): string {
  if (Array.isArray(value)) return String(value[0] ?? '').trim();
  return String(value ?? '').trim();
}

function asTextList(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry || '').trim()).filter((entry) => entry.length > 0);
  }
  const single = String(value || '').trim();
  return single ? [single] : [];
}

function normalizeSummary(summary: string, fallback: string): string {
  if (!summary) return fallback;
  return summary.replace(/\s+/g, ' ').trim();
}

function mapRecentGames(names: string[], details: string[]): InternetSiteItem[] {
  return names.slice(0, 10).map((name, index) => ({
    id: `steam-live-${index}`,
    title: name,
    meta: details[index] ? details[index] : 'Recently played',
  }));
}

export function createSteamAdapter(): InternetSiteAdapter {
  return async ({ now, previous, signal }) => {
    try {
      const data = await fetchRemoteExtract(
        STEAM_PROFILE_URL,
        [
          { key: 'persona_name', selector: '.actual_persona_name', property: 'innerText' },
          { key: 'avatar_url', selector: '.playerAvatarAutoSizeInner img', attr: 'src' },
          { key: 'profile_summary', selector: '.profile_summary', property: 'innerText' },
          { key: 'level', selector: '.friendPlayerLevelNum', property: 'innerText' },
          { key: 'recent_game_names', selector: '.game_info .game_name a', all: true, limit: 10, property: 'innerText' },
          { key: 'recent_game_details', selector: '.game_info .game_info_details', all: true, limit: 10, property: 'innerText' },
        ],
        {
          waitMs: 1900,
          timeoutMs: 16_000,
          signal,
        },
      );

      if (!data || !previous) {
        return carryForwardPayload(previous, now, previous ? 'PARTIAL' : 'FAILED');
      }

      const personaName = asText(data.persona_name);
      const avatarUrl = asText(data.avatar_url);
      const summary = normalizeSummary(asText(data.profile_summary), previous.profile.bio);
      const level = asText(data.level);
      const recentGameNames = asTextList(data.recent_game_names);
      const recentGameDetails = asTextList(data.recent_game_details);

      const nextStats = previous.stats.map((stat) => ({ ...stat }));
      if (level) {
        const levelStat = nextStats.find((entry) => entry.label.toLowerCase() === 'level');
        if (levelStat) levelStat.value = level;
      }

      const nextItems = recentGameNames.length
        ? mapRecentGames(recentGameNames, recentGameDetails)
        : previous.items;

      const hasLiveSignal = Boolean(personaName || avatarUrl || summary || level || recentGameNames.length);
      if (!hasLiveSignal) {
        return carryForwardPayload(previous, now, 'PARTIAL');
      }

      return {
        ...previous,
        profile: {
          ...previous.profile,
          name: personaName || previous.profile.name,
          avatarUrl: avatarUrl || previous.profile.avatarUrl,
          bio: summary,
        },
        stats: nextStats,
        items: nextItems,
        updatedAt: now,
        freshnessStatus: 'UPDATED',
        sourceStatus: 'OK',
      };
    } catch {
      return carryForwardPayload(previous, now, previous ? 'PARTIAL' : 'FAILED');
    }
  };
}
