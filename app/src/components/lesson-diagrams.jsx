// =============================================================================
// lesson-diagrams — authored lesson figures that live outside ChurchLearn.jsx
// =============================================================================
// ChurchLearn.jsx holds the first course diagrams and is at its file budget, so
// new lesson figures are authored here and spread into its DIAGRAMS map (one
// import, one spread). Same contract as the figures there: SVG, palette-matched,
// role="img" with an aria-label and a <title>, keyed by a module's media `key`.
// They are REAL authored figures (DR-0076), never pending media. No verse text
// is typed here; a figure names a reference and the lesson quotes it.
//
// Color: ink #1A1815, paper #FAF8F4, muted #5A5751, olive #5A6E3D, coral
// #B85838 for the danger path. True red is reserved (Color Theology, DR-0099)
// and is not used here.
//
// Layout: each figure is 340 units wide with its halves STACKED, not side by
// side, so its smallest text still reads on a phone (measured 2026-11-23: a
// 680-wide side-by-side figure rendered about 4px text at 390px). FIT caps the
// width on a desktop so a tall figure does not fill the screen.
//
// sov100 (DR-1611): Darrell asked that the virtual-machines-and-containers
// lesson keep or make pictures that carry the explanation and its setting.
// =============================================================================
import React from 'react';

const INK = '#1A1815';
const PAPER = '#FAF8F4';
const MUTED = '#5A5751';
const OLIVE = '#5A6E3D';
const CORAL = '#B85838';
const FONT = 'Fraunces, serif';

function Box({ x, y, w, h = 26, label, sub, stroke = INK, bold = true, size = 10 }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={PAPER} stroke={stroke} strokeWidth="1.5" />
      <text
        x={x + w / 2}
        y={sub ? y + h / 2 - 2 : y + h / 2 + 3.5}
        textAnchor="middle"
        fontSize={size}
        fontWeight={bold ? 600 : 400}
        fill={INK}
        fontFamily={FONT}
      >
        {label}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 10} textAnchor="middle" fontSize="8" fill={MUTED} fontFamily={FONT}>
          {sub}
        </text>
      )}
    </g>
  );
}

const JOBS = ['API', 'Database', 'Worker'];
const FIT = { maxWidth: 460, margin: '0 auto', display: 'block' };
const Caption = ({ y, lines, color = MUTED, weight = 400, size = 8.5 }) => (
  <text x="170" y={y} textAnchor="middle" fontSize={size} fill={color} fontWeight={weight} fontFamily={FONT}>
    {lines.map((l, i) => (
      <tspan key={l} x="170" dy={i === 0 ? 0 : 11}>
        {l}
      </tspan>
    ))}
  </text>
);
const Heading = ({ y, children, color = INK }) => (
  <text x="170" y={y} textAnchor="middle" fontSize="11" fontWeight="700" fill={color} fontFamily={FONT}>
    {children}
  </text>
);

export const LESSON_DIAGRAMS = {
  'vm-vs-container': (
    <svg
      viewBox="0 0 340 486"
      role="img"
      aria-label="Top: virtual machines, each with its own app, guest system and own kernel, on a hypervisor, on the hardware. Bottom: containers, each an app walled in by namespaces and control groups, all on one shared host kernel, on the hardware."
      className="w-full h-auto"
      style={FIT}
    >
      <title>Separate houses or rooms in one ark</title>
      <Heading y={16}>Virtual machines — separate kernels</Heading>
      {JOBS.map((j, i) => (
        <g key={`vm${j}`}>
          <rect x={20 + i * 102} y={26} width="94" height="104" fill="none" stroke={OLIVE} strokeWidth="1.5" strokeDasharray="4 3" />
          <Box x={26 + i * 102} y={34} w={82} label={j} />
          <Box x={26 + i * 102} y={66} w={82} label="Guest OS" bold={false} size={9} />
          <Box x={26 + i * 102} y={98} w={82} label="Own kernel" stroke={OLIVE} size={9} />
        </g>
      ))}
      <Box x={20} y={140} w={298} h={34} label="Hypervisor" sub="divides the real hardware into virtual hardware" stroke={OLIVE} />
      <Box x={20} y={182} w={298} h={34} label="Physical server" sub="CPU · memory · storage · network" />
      <Caption y={232} lines={['three houses, each on its own foundation']} color={OLIVE} weight={600} />
      <line x1="20" y1="246" x2="318" y2="246" stroke="#E8E4DC" strokeWidth="1" />
      <Heading y={266}>Containers — one shared kernel</Heading>
      {JOBS.map((j, i) => (
        <g key={`ct${j}`}>
          <rect x={20 + i * 102} y={276} width="94" height="72" fill="none" stroke={CORAL} strokeWidth="1.5" strokeDasharray="4 3" />
          <Box x={26 + i * 102} y={284} w={82} label={j} />
          <Box x={26 + i * 102} y={316} w={82} label="namespaces · cgroups" bold={false} size={8} />
        </g>
      ))}
      <Box x={20} y={356} w={298} h={34} label="ONE host kernel — shared by every container" stroke={CORAL} />
      <Box x={20} y={398} w={298} label="Host operating system" bold={false} />
      <Box x={20} y={432} w={298} h={34} label="Physical server" sub="CPU · memory · storage · network" />
      <Caption y={480} lines={['three rooms in one ark, on one hull (Genesis 6:14)']} color={CORAL} weight={600} />
    </svg>
  ),
  'shared-kernel-reach': (
    <svg
      viewBox="0 0 340 404"
      role="img"
      aria-label="Top: a compromised worker in a virtual machine is stopped at its own kernel and must break the hypervisor to go further. Bottom: a compromised worker in a container can use a flaw in the one shared kernel to reach the API and the database."
      className="w-full h-auto"
      style={FIT}
    >
      <title>How far a break-in can reach</title>
      <defs>
        <marker id="reachCoral" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={CORAL} />
        </marker>
      </defs>
      <Heading y={16}>Virtual machines</Heading>
      {JOBS.map((j, i) => (
        <g key={`rv${j}`}>
          <Box x={20 + i * 102} y={28} w={94} label={j} stroke={j === 'Worker' ? CORAL : INK} />
          <Box x={20 + i * 102} y={62} w={94} label="own kernel" stroke={j === 'Worker' ? CORAL : OLIVE} bold={false} size={9} />
        </g>
      ))}
      <text x="236" y="112" textAnchor="end" fontSize="8.5" fill={CORAL} fontWeight="600" fontFamily={FONT}>
        broken in here
      </text>
      <line x1="267" y1="88" x2="267" y2="124" stroke={CORAL} strokeWidth="2" />
      <line x1="253" y1="124" x2="281" y2="124" stroke={OLIVE} strokeWidth="3" />
      <Box x={20} y={132} w={298} label="Hypervisor — a second wall to break" stroke={OLIVE} />
      <Caption y={178} lines={['the trouble stops at the worker’s own kernel']} color={OLIVE} weight={600} size={9} />
      <line x1="20" y1="192" x2="318" y2="192" stroke="#E8E4DC" strokeWidth="1" />
      <Heading y={212}>Containers</Heading>
      {JOBS.map((j, i) => (
        <Box key={`rc${j}`} x={20 + i * 102} y={224} w={94} label={j} stroke={j === 'Worker' ? CORAL : INK} />
      ))}
      <Box x={20} y={292} w={298} label="ONE shared kernel — a flaw here is under every room" stroke={CORAL} size={9.5} />
      <line x1="269" y1="250" x2="269" y2="290" stroke={CORAL} strokeWidth="2" markerEnd="url(#reachCoral)" />
      <line x1="240" y1="292" x2="80" y2="254" stroke={CORAL} strokeWidth="2" markerEnd="url(#reachCoral)" />
      <line x1="250" y1="292" x2="170" y2="254" stroke={CORAL} strokeWidth="2" markerEnd="url(#reachCoral)" />
      <Caption y={338} lines={['one kernel flaw can reach every container']} color={CORAL} weight={600} size={9} />
      <Caption
        y={356}
        lines={[
          'least privilege · no-new-privileges · seccomp',
          'AppArmor or SELinux · user namespaces',
          'lower the risk; they do not remove the shared kernel',
        ]}
      />
    </svg>
  ),
  'isolation-stack': (
    <svg
      viewBox="0 0 340 330"
      role="img"
      aria-label="The common stack from the ground up: a physical server, a hypervisor, two virtual machines each with its own kernel, and containers running inside each virtual machine."
      className="w-full h-auto"
      style={FIT}
    >
      <title>Both, stacked like the stories of the ark</title>
      {[0, 1].map((v) => (
        <g key={`stack${v}`}>
          <rect x={20} y={8 + v * 104} width="298" height="96" fill="none" stroke={OLIVE} strokeWidth="1.5" />
          <text x={169} y={22 + v * 104} textAnchor="middle" fontSize="10" fontWeight="700" fill={OLIVE} fontFamily={FONT}>
            Virtual machine {v + 1}
          </text>
          {[1, 2, 3].map((n) => (
            <Box key={`c${v}${n}`} x={28 + (n - 1) * 96} y={30 + v * 104} w={90} label={`container ${n}`} stroke={CORAL} bold={false} size={9} />
          ))}
          <Box x={28} y={66 + v * 104} w={282} label={`kernel of VM ${v + 1}, shared by its containers only`} stroke={OLIVE} bold={false} size={9} />
        </g>
      ))}
      <Box x={20} y={220} w={298} h={34} label="Hypervisor" sub="the strong wall between whole environments" stroke={OLIVE} />
      <Box x={20} y={262} w={298} h={30} label="Physical server" />
      <Caption y={308} lines={['lower, second and third stories (Genesis 6:16)', 'strong walls between houses, light rooms within each']} />
    </svg>
  ),
};
