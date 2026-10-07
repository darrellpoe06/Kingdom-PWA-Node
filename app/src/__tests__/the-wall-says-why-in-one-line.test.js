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
import { groupCameraFaults, faultSummaryLine, humanizeCameraError, FAULT_LABELS, wyzeSaysFor, wyzeSaysLine, parseDevices } from '../lib/cameras.js';

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

// DR-0807. Darrell 2026-10-07, the Wyze app open beside ours, 805 North
// "Device Offline" since 09-28 while 805 Porch, Hallway and Basement were
// live there: "Some are actually down and others have been on continuously."
// Our wall said one thing about all ten. Wyze's own word tells them apart.
describe('Wyze\'s own word tells OFF from out-of-reach (DR-0807)', () => {
  const devices = parseDevices({ devices: [
    { mac: 'N1', nickname: '805 North', online: false, stream: '805_north' },
    { mac: 'B1', nickname: '805 Basement', online: true, stream: '805_basement' },
    { mac: 'P1', nickname: '805 Porch Cam', online: true, stream: '805_porch_cam' },
    { mac: 'K1', nickname: 'Kitchen 2', online: true, stream: 'kitchen_2' },
  ] });

  it('a camera Wyze reports offline is counted as off at the camera, not as out of reach', () => {
    const { cameras, frames } = theRealWall();
    const s = groupCameraFaults(cameras, frames, devices);
    const off = s.groups.find((g) => g.kind === 'wyze-offline');
    expect(off.count).toBe(1);
    expect(off.names).toEqual(['805_north']);
    const on = s.groups.find((g) => g.kind === 'other-network-on');
    expect(on.count).toBe(2);
    expect(on.names.sort()).toEqual(['805_basement', '805_porch_cam']);
    const unknown = s.groups.find((g) => g.kind === 'other-network');
    expect(unknown.count).toBe(7); // the seven 805 cameras Wyze has no word on stay where they were
    expect(s.groups.find((g) => g.kind === 'firmware').count).toBe(17); // a DTLS refusal is not a reach problem; Wyze online changes nothing
    expect(s.down).toBe(27);
  });

  it('the sentence names the three states apart', () => {
    const { cameras, frames } = theRealWall();
    const line = faultSummaryLine(groupCameraFaults(cameras, frames, devices));
    expect(line).toContain('17 firmware has no DTLS yet');
    expect(line).toContain('7 on a network the NAS cannot reach');
    expect(line).toContain('2 on (Wyze sees them), but on a network the NAS cannot reach');
    expect(line).toContain('1 off at the camera itself (Wyze reports them offline too)');
  });

  it('without the devices list nothing changes (the DR-0803 fixture holds)', () => {
    const { cameras, frames } = theRealWall();
    expect(groupCameraFaults(cameras, frames)).toEqual(groupCameraFaults(cameras, frames, null));
    expect(groupCameraFaults(cameras, frames).groups.map((g) => g.kind)).toEqual(['firmware', 'other-network']);
  });

  it('wyzeSaysFor: true, false, or null when Wyze has no device on that stream', () => {
    expect(wyzeSaysFor(devices, '805_north')).toBe(false);
    expect(wyzeSaysFor(devices, 'kitchen_2')).toBe(true);
    expect(wyzeSaysFor(devices, 'front')).toBe(null);
    expect(wyzeSaysFor(null, '805_north')).toBe(null);
    expect(wyzeSaysFor(devices, '')).toBe(null);
  });

  it('the tile line: off says check power and Wi-Fi; on says only the NAS lacks a road; none says nothing', () => {
    expect(wyzeSaysLine(false)).toMatch(/offline.*power and Wi-Fi/);
    expect(wyzeSaysLine(true)).toMatch(/online.*Only the NAS has no road/);
    expect(wyzeSaysLine(null)).toBe('');
  });

  it('every label is plain words, no log word leaks', () => {
    for (const k of ['wyze-offline', 'other-network-on']) {
      expect(FAULT_LABELS[k]).toBeTruthy();
      expect(FAULT_LABELS[k]).not.toMatch(/timeout|dtls|discovery|conn_state/i);
    }
  });
});
