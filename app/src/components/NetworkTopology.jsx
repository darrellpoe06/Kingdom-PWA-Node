// =============================================================================
// NetworkTopology — how the Church of the Living God (Love Corner) is connected
// =============================================================================
// The Topology section of <DeviceInventory />. The Registry answers "what do we
// own"; this answers "how is it connected." Every segment, every placement, and
// every finding on this surface is DERIVED by church-network-topology.js from the
// addresses already on the register — nothing here is hand-drawn, so the picture
// cannot drift from the data. Correct a device's address and the map redraws.
//
// REALITY-TRACE (P15): real data = the merged register (SEED_DEVICES + live
// church_devices rows) passed in by DeviceInventory; real screen = Church >
// Devices, staff-gated. Addresses render only for canEdit, matching the Registry's
// existing gate on sensitive fields (serial / IP).
//
// It states its own limit rather than implying a completeness it does not have:
// this is a LAYER-3 ADDRESS MAP. The register holds no switch-port or cable data,
// so the surface says "cabling not mapped" plainly and carries the eyes-on queue
// that would close it (Verification Doctrine, DR-0076 — no claim without evidence).
// =============================================================================
import React, { useMemo } from 'react';
import { KpiDot } from './KpiDot.jsx';
import UiIcon from './UiIcon.jsx';
import { typeIcon, typeLabel, statusTone, statusLabel } from '../lib/church-devices.js';
import { buildTopology, eyesOnQueue } from '../lib/church-network-topology.js';

const card = 'bg-white border border-[#1A1815] p-4 sm:p-5';
const labelCls = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751]';
const serif = { fontFamily: '"Fraunces", serif' };
const chip = 'inline-flex items-center gap-1 px-2 py-0.5 text-[0.6875rem] border border-[#C9C2B6] bg-[#FAF8F4] text-[#1A1815]';

function SeverityDot({ severity }) {
  const tone = severity === 'problem' ? 'problem' : (severity === 'attention' ? 'attention' : 'idle');
  return <KpiDot status={tone} />;
}

// One placed host inside a segment card.
function SegmentMember({ member, canEdit }) {
  const { node, ips } = member;
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#E8E4DC] pb-2 last:border-0 last:pb-0">
      <div className="flex items-start gap-2 min-w-0">
        <span className="text-[#B85838] mt-0.5 shrink-0" aria-hidden="true"><UiIcon name={typeIcon(node.deviceType)} /></span>
        <div className="min-w-0">
          <div className="text-sm text-[#1A1815] truncate" style={serif}>{node.name}</div>
          <div className="text-[0.6875rem] text-[#5A5751]">
            {typeLabel(node.deviceType)}
            {!node.confirmed && <span className="text-[#B85838]"> · unconfirmed</span>}
          </div>
        </div>
      </div>
      <div className="text-right shrink-0">
        <span className="inline-flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">
          <KpiDot status={statusTone(node.status)} /> {statusLabel(node.status)}
        </span>
        {canEdit && (
          <div className="mt-0.5 text-[0.6875rem] text-[#1A1815] tabular-nums">
            {ips.map((e) => e.ip).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}

export default function NetworkTopology({ devices, canEdit = false }) {
  const topology = useMemo(() => buildTopology(devices), [devices]);
  const queue = useMemo(() => eyesOnQueue(topology), [topology]);
  const s = topology.summary;

  return (
    <div className="space-y-4">

      {/* WHAT THIS MAP IS — and, honestly, what it is not. */}
      <div className={card}>
        <div className={labelCls}>Network topology · derived from the register</div>
        <p className="mt-2 text-[0.75rem] text-[#5A5751]">
          Every segment and placement below is derived from the addresses on the device register — read off the real church LAN scan, not drawn by hand. Correct an address on a device and this map redraws with it.
        </p>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['Segments', s.segments],
            ['Devices placed', s.placedDevices],
            ['Bridges (dual-homed)', s.dualHomed],
            ['Address conflicts', s.conflicts],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-2xl text-[#1A1815] tabular-nums" style={serif}>{v}</div>
              <div className="text-[0.6875rem] text-[#5A5751]">{k}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 border border-[#C9C2B6] bg-[#FAF8F4] p-3">
          <div className="flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-wider text-[#B85838]">
            <KpiDot status="attention" /> Layer-3 address map — cabling not yet mapped
          </div>
          <p className="mt-1.5 text-[0.75rem] text-[#5A5751]">
            This map knows which <em>network</em> each device sits on, read from a real netmask rather than assumed. It does <strong>not</strong> know which switch port anything is patched into — the register holds no port, VLAN or cable data, and the gear in the closet is still unidentified. One walk of the network closet closes that; the queue below is what to read while standing there.
          </p>
        </div>
      </div>

      {/* THE ROUTING SPINE — the single most load-bearing fact on the map. */}
      <div className={card}>
        <div className={labelCls}>The routing spine</div>
        {topology.routing.router ? (
          <>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#1A1815]" style={serif}>
              <span className={chip}><UiIcon name="globe" /> Internet edge</span>
              <span className="text-[#B85838]" aria-hidden="true">→</span>
              <span className={chip}>
                <UiIcon name="lock" /> {topology.routing.router.name}
                {canEdit && <span className="text-[#5A5751] tabular-nums"> {topology.routing.routerIp}</span>}
              </span>
              <span className="text-[#B85838]" aria-hidden="true">→</span>
              {topology.subnets.map((sub) => (
                <span key={sub.cidr} className={chip}><UiIcon name="sliders" /> {sub.cidr}</span>
              ))}
            </div>
            <p className="mt-3 text-[0.75rem] text-[#5A5751]">
              This device is the <strong>edge</strong>, not an internal boundary. The church runs as a single flat network, so traffic between any two devices on it is <strong>switched, never routed</strong> — it does not pass the firewall at all. Stage cameras, the switcher, the storage and the office all share one broadcast domain, and nothing inside it is filtered from anything else.
            </p>
          </>
        ) : (
          <p className="mt-2 text-[0.75rem] text-[#B85838]">No gateway device is recorded on the register — the routing spine cannot be derived.</p>
        )}
      </div>

      {/* THE SEGMENTS */}
      {topology.subnets.map((sub) => (
        <div key={sub.cidr} className={card}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className={labelCls}>{sub.label}</div>
              <div className="mt-0.5 text-lg text-[#1A1815] tabular-nums" style={serif}>{sub.cidr}</div>
            </div>
            <span className="text-[0.6875rem] text-[#5A5751] text-right">{sub.deviceCount} device(s)</span>
          </div>
          {sub.note && <p className="mt-1.5 text-[0.75rem] text-[#5A5751]">{sub.note}</p>}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className={chip}>
              {sub.gateway
                ? <>Gateway: {sub.gateway.name}</>
                : <span className="text-[#B85838]">Router interface not recorded</span>}
            </span>
            <span className={chip}>{sub.maskAssumed ? 'Mask assumed /24' : 'Mask scan-recorded'}</span>
          </div>
          <div className="mt-3 space-y-2">
            {sub.members.map((m) => (
              <SegmentMember key={m.node.id} member={m} canEdit={canEdit} />
            ))}
          </div>
        </div>
      ))}

      {/* THE OVERLAY PLANE */}
      <div className={card}>
        <div className={labelCls}>{topology.overlay.label}</div>
        <div className="mt-0.5 text-lg text-[#1A1815] tabular-nums" style={serif}>{topology.overlay.cidr}</div>
        <p className="mt-1.5 text-[0.75rem] text-[#5A5751]">{topology.overlay.note}</p>
        <div className="mt-3 space-y-2">
          {topology.overlay.nodes.length > 0
            ? topology.overlay.nodes.map((o) => (
              <SegmentMember key={o.node.id} member={{ node: o.node, ips: o.ips }} canEdit={canEdit} />
            ))
            : <p className="text-[0.75rem] text-[#5A5751]">No device on the register carries a tailnet address.</p>}
        </div>
      </div>

      {/* DEVICES THE MAP CANNOT PLACE */}
      {topology.unaddressed.length > 0 && (
        <div className={card}>
          <div className={labelCls}>Not on a segment</div>
          <p className="mt-1 text-[0.75rem] text-[#5A5751]">
            Rows the map cannot place. Some are off-network by design; the rest are gaps where a management address was never read.
          </p>
          <div className="mt-2 space-y-2">
            {topology.unaddressed.map((n) => (
              <div key={n.id} className="flex items-start justify-between gap-3 border-b border-[#E8E4DC] pb-2 last:border-0 last:pb-0">
                <div className="flex items-start gap-2 min-w-0">
                  <span className="text-[#B85838] mt-0.5 shrink-0" aria-hidden="true"><UiIcon name={typeIcon(n.deviceType)} /></span>
                  <div className="min-w-0">
                    <div className="text-sm text-[#1A1815] truncate" style={serif}>{n.name}</div>
                    <div className="text-[0.6875rem] text-[#5A5751]">{typeLabel(n.deviceType)}</div>
                  </div>
                </div>
                <span className={`text-[0.6875rem] shrink-0 ${n.expectsAddress ? 'text-[#B85838]' : 'text-[#5A5751]'}`}>
                  {n.expectsAddress ? 'address not read' : 'off-network by design'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* THE EYES-ON QUEUE + the structural notes */}
      <div className={card}>
        <div className={labelCls}>What one walk of the closet would close</div>
        <p className="mt-1 text-[0.75rem] text-[#5A5751]">
          Derived from the findings, so it shrinks by itself as the register is corrected — never a hand-kept checklist that drifts from the data.
        </p>
        <ol className="mt-2 space-y-2">
          {queue.length > 0
            ? queue.map((q, i) => (
              <li key={q.id} className="flex gap-2 text-[0.75rem]">
                <span className="text-[#5A5751] tabular-nums shrink-0">{i + 1}.</span>
                <span>
                  <span className="text-[#1A1815]">{q.ask}</span>
                  <span className="block text-[#5A5751]">{q.why}</span>
                </span>
              </li>
            ))
            : <li className="text-[0.75rem] text-[#5A5751]">Nothing outstanding — every device is placed and every segment routed.</li>}
        </ol>
      </div>

      {/* STRUCTURAL NOTES — the informational findings, kept out of the queue. */}
      {topology.findings.some((f) => f.severity === 'idle') && (
        <div className={card}>
          <div className={labelCls}>Structural notes</div>
          <ul className="mt-2 space-y-2">
            {topology.findings.filter((f) => f.severity === 'idle').map((f) => (
              <li key={f.id} className="flex gap-2 text-[0.75rem]">
                <span className="mt-0.5 shrink-0"><SeverityDot severity={f.severity} /></span>
                <span>
                  <span className="text-[#1A1815]">{f.title}</span>
                  <span className="block text-[#5A5751]">{f.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
