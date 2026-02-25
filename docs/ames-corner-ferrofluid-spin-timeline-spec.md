# Ames Corner Ferrofluid Timeline Editor Spec

Document Type: Implementation
Scope: `windose-os/src/ames-corner/main.js`, `windose-os/public/ames-corner.css`

## Summary
Implement a timeline editor in the Ferrofluid Control app that lets users author spin automation for the center ferrofluid in sync with BGM. Replace hardcoded scripted spin windows with editable timeline segments and remove spin motion blur.

## Functional Requirements
1. Scrubber UX
- Replace coarse scrub behavior with fine-grain control.
- Provide current/total time readout and quick jump controls.
- Keep scrub synchronized with BGM playback.

2. Spin Timeline Editor
- User can create/edit/delete timeline segments.
- Segment fields:
  - start time
  - end time
  - direction (`cw` or `ccw`)
  - speed at segment start
  - speed at segment end
  - easing (`linear`, `ease-in`, `ease-out`, `ease-in-out`)
  - stop mode (`none`, `intermittent`)
  - intermittent stop cycle seconds
  - intermittent stop duration seconds
- Runtime spin multiplier is derived from active segment using easing interpolation.

3. Save Behavior
- All users can save personal spin timeline data.
- Owner profile saves automatically update personal data and default timeline data.
- Non-owner profiles cannot overwrite default timeline data.
- Timeline load order: personal override, default override, built-in fallback.

4. Visualizer Runtime
- Remove spin motion blur from ferrofluid renderer path.
- Maintain existing orbit/zoom toggles and pointer hover interaction.

## Data Model
```ts
interface SpinTimelineSegment {
  id: string;
  enabled: boolean;
  startSec: number;
  endSec: number;
  direction: 'cw' | 'ccw';
  speedStart: number;
  speedEnd: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  stopMode: 'none' | 'intermittent';
  stopCycleSec: number;
  stopDurationSec: number;
}
```

## Storage Keys
- `ames_corner_ferro_spin_timeline_user_v1`
- `ames_corner_ferro_spin_timeline_default_v1`

## Anti-Patterns (DO NOT)
| Do Not | Do Instead | Why |
|---|---|---|
| Keep hardcoded spin windows in constants | Use segment data model + evaluator | Keeps behavior editable in-app |
| Trust storage payload shape directly | Sanitize every segment field | Prevents invalid runtime states |
| Allow default save for every user | Gate default save to owner profile only | Prevents accidental global override |
| Keep CSS blur tied to spin multiplier | Remove blur side-effect from spin path | Requirement explicitly disables motion blur |
| Bind window-local listeners without cleanup | Register cleanup handlers on window close | Prevents leaks and duplicate listeners |

## Error Handling Matrix
| Scenario | Detection | Handling | User Surface |
|---|---|---|---|
| Invalid timeline JSON | Parse failure / non-array | Fallback to default timeline | Status message: fallback loaded |
| Invalid segment values | Sanitizer clamps/rejects | Keep valid segments only | Status message: normalized |
| No audio metadata yet | duration not finite | Disable seek bounds, keep scrub active with 0..1 fallback | Readout shows `--:--` duration |
| Save blocked for default | owner gate false | Skip default write | Save status: personal saved |
| Storage write error | localStorage throws | Catch and preserve in-memory timeline | Save status: failed |

## Test Cases
1. Open Ferrofluid Control and scrub with sub-second precision; readout updates accurately.
2. Add segment and verify runtime spin changes at matching timestamps.
3. Set direction `ccw`; spin reverses only in segment interval.
4. Set intermittent stop mode; spin pauses briefly during configured cycle.
5. Save timeline as non-owner; personal data persists after reload, default unchanged.
6. Save timeline as owner; default data updates and reload path picks it up.
7. Confirm no spin blur is applied during fast spin periods.

## Deep Links
- Runtime constants and state: `windose-os/src/ames-corner/main.js`
- Ferrofluid control markup and hydration: `windose-os/src/ames-corner/main.js`
- Spin evaluator in render loop: `windose-os/src/ames-corner/main.js`
- UI style tokens and controls: `windose-os/public/ames-corner.css`
