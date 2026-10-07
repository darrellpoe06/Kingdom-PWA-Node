// @vitest-environment node
// =============================================================================
// The wall says why, in one line, instead of making a person press Why? 27 times
// =============================================================================
// Darrell 2026-10-07, at full volume: "Non of the 805 cameras work!!!!!!!!
// Why?!!!!!!!!"
//
// Measured that evening on the NAS (cams-diag run 37694253134): 31 streams
// defined, 4 live, and the rest down for exactly TWO causes — ten cameras
// addressed on 10.0.0.x while the NAS sits on 192.168.1.26/24, which go2rtc
// reported as "connect failed: discovery timeout" for every one of them, and
// the remaining Wyze-sourced streams refused with "only DTLS cameras are
// supported". Every tile already had a Why? button and plain words behind it.
// Nothing added them up. This is the gate on the adding up.
import { describe, it, expect } from 'vitest';
import { groupCameraFaults, faultSummaryLine, humanizeCameraError, FAULT_LABELS } from '../lib/cameras.js';

// The real shape of that night, named as the diagnostic named them.
const THE_805 = ['805_apt_4', '805_back_door', '805_basement', '805_front_office_view', '805_front_outside',
  '805_hallway_-_north_east', '805_north', '805_north_east', '805_porch_cam', '805_upper_hallway_-_south_west'];
const DTLS = ['basement_living_room', 'basement_north', 'front', 'front_cam', 'front_driveway_door',
  'front_yard', 'garage_doors', 'garage_front_yard', 'great_room', 'kitchen_2', 'kitchen_cam',
  'living_room', 'north_east_cam', 'outside_7', 'outside_front_door', 'poebasement', 'east_north_cam'];
const LIVE = ['back_yard_north', 'back_yard_south', 'basketball_cam', 'front_door_view'];

const theRealWall = () => {
  const cameras = [...THE_805, ...DTLS, ...LIVE].map((id) => ({ id, name: id }));
  const frames = {};
  for (const id of THE_805) frames[id] = { error: 'wyze: connect failed: discovery timeout', errorAt: 1 };
  for (const id of DTLS) frames[id] = { error: 'wyze: only DTLS cameras are supported', errorAt: 1 };
  for (const id of LIVE) frames[id] = { url: 'blob:live', at: 1 };
  return { cameras, frames };
};

describe('the wall adds itself up', () => {
  it('the real night: 31 cameras, 4 live, two causes, named', () => {
    const { cameras, frames } = theRealWall();
    const s = groupCameraFaults(cameras, frames);
    expect(s.total).toBe(31);
    expect(s.live).toBe(4);
    expect(s.down).toBe(27);
    expect(s.groups.map((g) => [g.kind, g.count])).toEqual([
      ['firmware', 17],
      ['other-network', 10],
    ]);
    expect(s.groups.find((g) => g.kind === 'other-network').names).toContain('805_porch_cam');
  });

  it('the sentence a person reads instead of pressing Why? twenty-seven times', () => {
    const { cameras, frames } = theRealWall();
    const line = faultSummaryLine(groupCameraFaults(cameras, frames));
    expect(line).toBe('4 of 31 showing a picture. 17 firmware has no DTLS yet and 10 on a network the NAS cannot reach.');
    expect(line.length, 'it is one line, not a paragraph').toBeLessThan(140);
  });

  it('biggest cause first, and three causes read as a list', () => {
    const cameras = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
    const frames = {
      a: { error: 'wyze: only DTLS cameras are supported' },
      b: { error: 'wyze: only DTLS cameras are supported' },
      c: { error: 'wyze: connect failed: discovery timeout' },
      d: { error: 'wyze: av login failed K10001' },
    };
    const s = groupCameraFaults(cameras, frames);
    expect(s.groups.map((g) => g.count)).toEqual([2, 1, 1]);
    expect(faultSummaryLine(s)).toMatch(/2 firmware has no DTLS yet, 1 .* and 1 /);
  });

  it('a camera not yet asked is neither live nor down — the wall never over-claims', () => {
    const s = groupCameraFaults([{ id: 'a' }, { id: 'b' }], { a: { url: 'blob:x' } });
    expect(s.live).toBe(1);
    expect(s.down).toBe(0);
    expect(s.waiting).toBe(1);
    expect(faultSummaryLine(s), 'nothing down means nothing to say').toBe('');
  });

  it('PROVEN TO CATCH: the two causes of that night are told apart, not lumped as unknown', () => {
    expect(humanizeCameraError('wyze: connect failed: discovery timeout').kind).toBe('other-network');
    expect(humanizeCameraError('wyze: only DTLS cameras are supported').kind).toBe('firmware');
    // and the label a person reads names the fix, not the log line
    expect(FAULT_LABELS['other-network']).not.toMatch(/timeout|go2rtc|wyze/i);
    expect(FAULT_LABELS.firmware).not.toMatch(/go2rtc|stream/i);
  });

  it('PROVEN TO CATCH: every kind humanizeCameraError can return has a label', () => {
    const kinds = ['other-network', 'firmware', 'auth', 'missing', 'asleep', 'unknown'];
    for (const k of kinds) expect(FAULT_LABELS[k], k).toBeTruthy();
    // an error no rule matches still lands somewhere a person can read
    const s = groupCameraFaults([{ id: 'x' }], { x: { error: 'something nobody has seen before' } });
    expect(s.groups[0].label).toBeTruthy();
    expect(faultSummaryLine(s)).toMatch(/1 /);
  });

  it('nothing handed in at all does not throw and says nothing', () => {
    expect(groupCameraFaults()).toEqual({ total: 0, live: 0, waiting: 0, down: 0, groups: [] });
    expect(groupCameraFaults(null, null).total).toBe(0);
    expect(faultSummaryLine()).toBe('');
    expect(faultSummaryLine({ groups: [] })).toBe('');
  });
});
