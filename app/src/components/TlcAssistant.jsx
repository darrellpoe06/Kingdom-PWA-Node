// =============================================================================
// TlcAssistant — the TLC Therapy Solutions referral database + assistant system
// =============================================================================
// Darrell 2026-07-12: the Executive Administrative & Marketing Assistant's daily
// system, built so a 17-year-old works independently in 30–60 days — and so it
// becomes the substrate for Ari to learn the outbound and eventually run it. The
// crown jewel is the REFERRAL DATABASE (a 2,500–3,000-org network built in
// geographic circles), plus the daily flow, the content calendar, and the weekly
// goals — every number DERIVED from real records (DR-0061).
//
// NO PHI: referral SOURCES only (organizations + office contacts), never clients
// or protected health information — the existing Practice boundary, held.
import React, { useMemo, useState } from 'react';
import { SectionTitle, MetricCell } from './shared.jsx';
import UiIcon from './UiIcon.jsx';
import SectionTabs from './SectionTabs.jsx';
import {
  useReferralOps, addOrg, setOrgOutcome, markFlyerSent, recordEmail,
  recordCall, setFollowUp, addPost, updatePost, addIdea,
} from '../lib/use-referral-ops.js';
import {
  REFERRAL_CATEGORIES, GEO_CIRCLES, OUTCOMES, CONTENT_THEMES, SOCIAL_PLATFORMS,
  POST_STATUSES, DAY_BLOCKS, WEEKLY_PLAN, EMAIL_TEMPLATE, CALL_SCRIPT,
  DAILY_TARGET_CONTACTS, ARI_AUTOMATION_PATH, ARI_AUTOMATION_NOTE, OUTBOUND_CONSTRAINTS,
  NO_PHI_NOTE, referralCategory, outcome, categoryForDay,
  orgStats, followUpsDue, dailyReport, weeklyProgress, networkGoal, topConvertingSources,
  validateOrg, isSeedId,
} from '../lib/referral-ops.js';

const num = (n) => (Number(n) || 0).toLocaleString();
const pct = (n) => `${Math.round(Number(n) || 0)}%`;
const shortDate = (iso) => { if (!iso) return ''; try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch { return ''; } };

const OUTCOME_BADGE = {
  interested: 'bg-[#F0F4EA] text-[#3F5226] border-[#5A6E3D]',
  'requested-info': 'bg-[#F0F4EA] text-[#3F5226] border-[#5A6E3D]',
  'referral-coordinator': 'bg-[#F0F4EA] text-[#3F5226] border-[#5A6E3D]',
  'call-back': 'bg-[#FBF7EC] text-[#B45309] border-[#B85838]',
  none: 'bg-[#FAF8F4] text-[#8A857C] border-[#C9C2B4]',
  'not-interested': 'bg-[#FAF8F4] text-[#8A857C] border-[#C9C2B4]',
  'has-therapist': 'bg-[#FAF8F4] text-[#8A857C] border-[#C9C2B4]',
};

function Badge({ children, cls }) {
  return <span className={`inline-block px-1.5 py-0.5 border text-[0.625rem] font-semibold uppercase tracking-wide ${cls}`}>{children}</span>;
}
function Bar({ pct: p, good }) {
  return (
    <div className="h-2 w-full bg-[#FAF8F4] border border-[#C9C2B4] overflow-hidden">
      <div className={`h-full ${good ? 'bg-[#5A6E3D]' : 'bg-[#B85838]'}`} style={{ width: `${Math.min(100, p)}%` }} />
    </div>
  );
}

export default function TlcAssistant({ isGovernor = false } = {}) {
  const store = useReferralOps();
  const orgs = useMemo(() => store.orgs || [], [store.orgs]);
  const posts = useMemo(() => store.posts || [], [store.posts]);
  const now = new Date().toISOString();

  const stats = useMemo(() => orgStats(orgs), [orgs]);
  const report = useMemo(() => dailyReport(orgs, posts, now), [orgs, posts, now]);
  const week = useMemo(() => weeklyProgress(orgs, posts, now), [orgs, posts, now]);
  const goal = useMemo(() => networkGoal(orgs), [orgs]);
  const dueList = useMemo(() => followUpsDue(orgs, now), [orgs, now]);
  const converting = useMemo(() => topConvertingSources(orgs), [orgs]);
  const todayCat = categoryForDay(now);

  const sections = [
    { id: 'today', label: 'Today', icon: 'home', render: () => (
      <TodaySection report={report} todayCat={todayCat} dueList={dueList} goal={goal} />
    ) },
    { id: 'referrals', label: `Referral DB (${stats.total})`, icon: 'users', render: () => (
      <ReferralSection orgs={orgs} stats={stats} goal={goal} converting={converting} isGovernor={isGovernor} />
    ) },
    { id: 'outreach', label: 'Outreach', icon: 'mail', render: () => (
      <OutreachSection dueList={dueList} isGovernor={isGovernor} />
    ) },
    { id: 'content', label: 'Content', icon: 'palette', render: () => (
      <ContentSection posts={posts} ideas={store.ideas || []} isGovernor={isGovernor} />
    ) },
    { id: 'goals', label: 'Weekly goals', icon: 'chart', render: () => (
      <GoalsSection week={week} />
    ) },
    { id: 'ari', label: 'Ari 24/7', icon: 'sparkle', render: () => <AriSection converting={converting} /> },
  ];

  return (
    <div className="max-w-5xl">
      <SectionTitle eyebrow="TLC Therapy Solutions · assistant + referral network">Assistant</SectionTitle>
      <div className="mb-3 text-[0.6875rem] text-[#8A857C] leading-relaxed">{NO_PHI_NOTE}</div>
      <SectionTabs sections={sections} ariaLabel="TLC assistant sections" idBase="tlc" defaultId="today" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Today — CEO meeting, the day's blocks, today's focus, the daily report
// ---------------------------------------------------------------------------
function TodaySection({ report, todayCat, dueList, goal }) {
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mb-3">
        <MetricCell label="Contacts today" value={num(report.contactsAdded)} sub={`target ${DAILY_TARGET_CONTACTS}`} accent={report.metTarget} />
        <MetricCell label="Emails today" value={num(report.emailsSent)} />
        <MetricCell label="Calls today" value={num(report.callsMade)} />
        <MetricCell label="Follow-ups due" value={num(report.followUpsNeeded)} />
      </div>

      {todayCat && (
        <div className="border border-[#5A6E3D] bg-[#F0F4EA] p-3 mb-3">
          <div className="text-sm font-semibold text-[#3F5226] mb-1">Today’s focus: {todayCat.label}</div>
          <div className="text-xs text-[#5A5751] leading-relaxed">Research {todayCat.label.toLowerCase()} referral sources. Try: {todayCat.searches.slice(0, 2).map((s) => `“${s}”`).join(', ')}. Goal: {DAILY_TARGET_CONTACTS} new contacts.</div>
        </div>
      )}

      <div className="border border-[#E8E4DC] bg-white p-3 mb-3">
        <div className="text-sm font-semibold text-[#1A1815] mb-1.5">The daily CEO meeting (12:00–12:20)</div>
        <ul className="text-xs text-[#5A5751] leading-relaxed list-disc pl-4 space-y-0.5">
          <li>What are your Top 3 priorities today?</li>
          <li>Any appointments I need to know about?</li>
          <li>Any flyers or graphics needed?</li>
          <li>Any clients or organizations to follow up with?</li>
          <li>Any groceries or errands? Any Poe Tech work today?</li>
        </ul>
      </div>

      <div className="border border-[#E8E4DC] bg-white p-3 mb-3">
        <div className="text-sm font-semibold text-[#1A1815] mb-1.5">The afternoon (12:00–5:00)</div>
        <div className="grid grid-cols-1 gap-1">
          {DAY_BLOCKS.map((b) => (
            <div key={b.time} className="flex gap-2 text-xs">
              <span className="text-[#8A857C] font-mono shrink-0 w-24">{b.time}</span>
              <span><span className="font-semibold text-[#1A1815]">{b.name}.</span> <span className="text-[#5A5751]">{b.detail}</span></span>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3">
        <div className="text-sm font-semibold text-[#1A1815] mb-1">Daily report</div>
        <div className="text-xs text-[#5A5751] leading-relaxed">
          Contacts added <b>{num(report.contactsAdded)}</b> · Emails <b>{num(report.emailsSent)}</b> · Calls <b>{num(report.callsMade)}</b> · Follow-ups needed <b>{num(report.followUpsNeeded)}</b> · Social posts <b>{num(report.postsCreated)}</b>. Network so far: <b>{num(goal.total)}</b> of {num(goal.low)}–{num(NETWORK_HIGH)} ({pct(goal.pct)}). {dueList.length > 0 ? `${dueList.length} follow-up(s) waiting.` : 'No follow-ups overdue.'}
        </div>
      </div>
    </div>
  );
}
const NETWORK_HIGH = 3000;

// ---------------------------------------------------------------------------
// Referral database — the centerpiece
// ---------------------------------------------------------------------------
function ReferralSection({ orgs, stats, goal, converting, isGovernor }) {
  const [catFilter, setCatFilter] = useState('all');
  const [circleFilter, setCircleFilter] = useState('all');

  const filtered = useMemo(() => orgs.filter((o) =>
    (catFilter === 'all' || o.categoryId === catFilter) &&
    (circleFilter === 'all' || o.circle === circleFilter)), [orgs, catFilter, circleFilter]);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mb-3">
        <MetricCell label="Organizations" value={num(stats.total)} sub={`${pct(goal.pct)} to ${num(goal.low)}`} accent />
        <MetricCell label="Flyers sent" value={num(stats.flyersSent)} />
        <MetricCell label="Warm / interested" value={num(stats.interested)} />
        <MetricCell label="Clients referred in" value={num(converting.totalReferred)} sub="inbound attribution" />
      </div>

      <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3 mb-3">
        <div className="text-[0.625rem] uppercase tracking-wide text-[#5A5751] mb-1">Build in circles — finish Champaign-Urbana first</div>
        <div className="flex flex-wrap gap-1">
          {GEO_CIRCLES.map((c) => (
            <Badge key={c.id} cls={(stats.byCircle[c.name] || 0) > 0 ? 'bg-[#F0F4EA] text-[#3F5226] border-[#5A6E3D]' : 'bg-[#FAF8F4] text-[#8A857C] border-[#C9C2B4]'}>{c.name} {stats.byCircle[c.name] ? `· ${stats.byCircle[c.name]}` : ''}</Badge>
          ))}
        </div>
      </div>

      {isGovernor && <AddOrgForm />}

      <div className="mt-3 flex flex-wrap items-center gap-2 mb-2">
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Filter by category">
          <option value="all">All categories</option>
          {REFERRAL_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label} ({stats.byCategory[c.id] || 0})</option>)}
        </select>
        <select value={circleFilter} onChange={(e) => setCircleFilter(e.target.value)} className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Filter by area">
          <option value="all">All areas</option>
          {GEO_CIRCLES.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <span className="text-[0.6875rem] text-[#8A857C]">{filtered.length} shown</span>
      </div>

      <div className="space-y-1">
        {filtered.length === 0 && <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-sm text-[#5A5751]">No organizations yet. Add the first referral source above.</div>}
        {filtered.map((o) => <OrgRow key={o.id} org={o} isGovernor={isGovernor} />)}
      </div>
    </div>
  );
}

function OrgRow({ org, isGovernor }) {
  const cat = referralCategory(org.categoryId);
  const out = outcome(org.outcomeId);
  return (
    <div className="border border-[#E8E4DC] bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-[#1A1815]">{org.organization}</div>
          <div className="text-[0.6875rem] text-[#8A857C]">{cat ? cat.label : ''}{org.type ? ` · ${org.type}` : ''} · {org.circle}{org.contactPerson ? ` · ${org.contactPerson}${org.jobTitle ? ` (${org.jobTitle})` : ''}` : ''}</div>
        </div>
        <Badge cls={OUTCOME_BADGE[org.outcomeId] || OUTCOME_BADGE.none}>{out.label}</Badge>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] text-[#5A5751]">
        {org.email && <span className="inline-flex items-center gap-1"><UiIcon name="mail" /> {org.email}</span>}
        {org.phone && <span className="inline-flex items-center gap-1"><UiIcon name="phone" /> {org.phone}</span>}
        {org.flyerSent && <Badge cls="bg-[#F0F4EA] text-[#3F5226] border-[#5A6E3D]">Flyer sent</Badge>}
        {org.emailedOn && <span>emailed {shortDate(org.emailedOn)}</span>}
        {org.calledOn && <span>called {shortDate(org.calledOn)}</span>}
        {org.followUpOn && <span>follow-up {shortDate(org.followUpOn)}</span>}
        {org.clientsReferred > 0 && <Badge cls="bg-[#F0F4EA] text-[#3F5226] border-[#5A6E3D]">{org.clientsReferred} referred in</Badge>}
      </div>
      {isGovernor && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => recordEmail(org.id)} className="border border-[#C9C2B4] bg-white text-[#5A5751] px-2 py-0.5 text-[0.6875rem]">Log email</button>
          <button type="button" onClick={() => recordCall(org.id)} className="border border-[#C9C2B4] bg-white text-[#5A5751] px-2 py-0.5 text-[0.6875rem]">Log call</button>
          {!org.flyerSent && <button type="button" onClick={() => markFlyerSent(org.id)} className="border border-[#C9C2B4] bg-white text-[#5A5751] px-2 py-0.5 text-[0.6875rem]">Flyer sent</button>}
          <select value={org.outcomeId} onChange={(e) => setOrgOutcome(org.id, e.target.value)} className="border border-[#C9C2B4] bg-white px-1.5 py-0.5 text-[0.6875rem]" aria-label={`Outcome for ${org.organization}`}>
            {OUTCOMES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <input type="date" onChange={(e) => setFollowUp(org.id, e.target.value ? new Date(e.target.value).toISOString() : null)} className="border border-[#C9C2B4] bg-white px-1.5 py-0.5 text-[0.6875rem]" aria-label={`Follow-up date for ${org.organization}`} />
        </div>
      )}
    </div>
  );
}

function AddOrgForm() {
  const [f, setF] = useState({ organization: '', categoryId: 'medical', type: '', circle: GEO_CIRCLES[0].name, contactPerson: '', jobTitle: '', email: '', phone: '', website: '' });
  const [error, setError] = useState('');
  const cat = referralCategory(f.categoryId);
  const set = (k) => (e) => setF((cur) => ({ ...cur, [k]: e.target.value }));

  const onAdd = () => {
    const check = validateOrg(f);
    if (!check.ok) { setError(check.error); return; }
    addOrg(f);
    setF((cur) => ({ ...cur, organization: '', type: '', contactPerson: '', jobTitle: '', email: '', phone: '', website: '' }));
    setError('');
  };

  return (
    <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3">
      <div className="text-sm font-semibold text-[#1A1815] mb-2">Add a referral source</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input value={f.organization} onChange={set('organization')} placeholder="Organization" className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm sm:col-span-2" aria-label="Organization" />
        <select value={f.categoryId} onChange={set('categoryId')} className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Category">
          {REFERRAL_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select value={f.type} onChange={set('type')} className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Type">
          <option value="">Type…</option>
          {(cat ? cat.types : []).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={f.circle} onChange={set('circle')} className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Area">
          {GEO_CIRCLES.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <input value={f.contactPerson} onChange={set('contactPerson')} placeholder="Contact person" className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Contact person" />
        <input value={f.jobTitle} onChange={set('jobTitle')} placeholder="Job title" className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Job title" />
        <input value={f.email} onChange={set('email')} placeholder="Email" className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Email" />
        <input value={f.phone} onChange={set('phone')} placeholder="Phone" className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Phone" />
        <input value={f.website} onChange={set('website')} placeholder="Website" className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm sm:col-span-2" aria-label="Website" />
      </div>
      {cat && <div className="mt-1.5 text-[0.625rem] text-[#8A857C]">Search ideas: {cat.searches.map((s) => `“${s}”`).join(' · ')}</div>}
      {error && <div className="mt-1.5 text-xs text-[#7A1F1F]">{error}</div>}
      <button type="button" onClick={onAdd} className="mt-2 border border-[#5A6E3D] bg-[#F0F4EA] text-[#3F5226] px-3 py-1.5 text-sm font-semibold">Add organization</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Outreach — the scripts + follow-ups due
// ---------------------------------------------------------------------------
function OutreachSection({ dueList }) {
  return (
    <div>
      <div className="border border-[#E8E4DC] bg-white p-3 mb-3">
        <div className="text-sm font-semibold text-[#1A1815] mb-1">Follow-ups due ({dueList.length})</div>
        {dueList.length === 0 && <div className="text-xs text-[#5A5751]">Nothing overdue — nice.</div>}
        <div className="space-y-1">
          {dueList.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-[#1A1815]">{o.organization}</span>
              <span className="flex items-center gap-1.5">
                <span className="text-[#8A857C]">{shortDate(o.followUpOn)}</span>
                <button type="button" onClick={() => recordCall(o.id)} className="border border-[#C9C2B4] bg-white text-[#5A5751] px-2 py-0.5 text-[0.6875rem]">Log call</button>
              </span>
            </div>
          ))}
        </div>
      </div>

      <ScriptCard title="Email template" text={EMAIL_TEMPLATE} />
      <ScriptCard title="Phone script" text={CALL_SCRIPT} />
    </div>
  );
}

function ScriptCard({ title, text }) {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    try { if (navigator.clipboard) { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } } catch { /* clipboard unavailable */ }
  };
  return (
    <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3 mb-2">
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm font-semibold text-[#1A1815]">{title}</div>
        <button type="button" onClick={onCopy} className="border border-[#C9C2B4] bg-white text-[#5A5751] px-2 py-0.5 text-[0.6875rem]">{copied ? 'Copied' : 'Copy'}</button>
      </div>
      <pre className="text-[0.6875rem] text-[#5A5751] whitespace-pre-wrap leading-relaxed font-sans">{text}</pre>
      <div className="mt-1 text-[0.625rem] text-[#8A857C]">Change [Name] and [Your name], attach the flyer, then record it on the organization.</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Content calendar
// ---------------------------------------------------------------------------
function ContentSection({ posts, ideas, isGovernor }) {
  return (
    <div>
      <div className="border border-[#E8E4DC] bg-white p-3 mb-3">
        <div className="text-sm font-semibold text-[#1A1815] mb-1.5">Weekly themes</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {CONTENT_THEMES.map((t) => (
            <div key={t.day} className="text-xs"><span className="font-semibold text-[#1A1815]">{t.day}:</span> <span className="text-[#5A5751]">{t.theme}</span></div>
          ))}
        </div>
      </div>

      {isGovernor && <AddPostForm />}

      <div className="mt-3 space-y-1">
        {posts.length === 0 && <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-sm text-[#5A5751]">No posts yet.</div>}
        {posts.map((p) => (
          <div key={p.id} className="border border-[#E8E4DC] bg-white p-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-[#1A1815]">{p.theme || 'Post'}{p.isReel ? ' · Reel' : ''}</span>
              <span className="flex items-center gap-1.5">
                <Badge cls={p.status === 'posted' ? 'bg-[#F0F4EA] text-[#3F5226] border-[#5A6E3D]' : 'bg-[#FAF8F4] text-[#8A857C] border-[#C9C2B4]'}>{p.status}</Badge>
                {isGovernor && !isSeedId(p.id) && p.status !== 'posted' && (
                  <select value={p.status} onChange={(e) => updatePost(p.id, { status: e.target.value })} className="border border-[#C9C2B4] bg-white px-1.5 py-0.5 text-[0.6875rem]" aria-label="Post status">
                    {POST_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
              </span>
            </div>
            {p.caption && <div className="text-xs text-[#5A5751] mt-1 leading-relaxed">{p.caption}</div>}
            <div className="text-[0.625rem] text-[#8A857C] mt-1">{p.platforms.join(' · ')}{p.hashtags ? ` · ${p.hashtags}` : ''}</div>
          </div>
        ))}
      </div>

      <IdeasFolder ideas={ideas} isGovernor={isGovernor} />
    </div>
  );
}

function AddPostForm() {
  const [theme, setTheme] = useState(CONTENT_THEMES[0].theme);
  const [caption, setCaption] = useState('');
  const [platforms, setPlatforms] = useState([]);
  const [hashtags, setHashtags] = useState('');
  const [isReel, setIsReel] = useState(false);
  const toggle = (p) => setPlatforms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  const onAdd = () => {
    if (!caption.trim() && !theme) return;
    addPost({ theme, caption: caption.trim(), platforms, hashtags: hashtags.trim(), isReel, status: 'drafted' });
    setCaption(''); setHashtags(''); setPlatforms([]); setIsReel(false);
  };
  return (
    <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3">
      <div className="text-sm font-semibold text-[#1A1815] mb-2">New post</div>
      <div className="grid grid-cols-1 gap-2">
        <select value={theme} onChange={(e) => setTheme(e.target.value)} className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Theme">
          {CONTENT_THEMES.map((t) => <option key={t.day} value={t.theme}>{t.day} — {t.theme}</option>)}
        </select>
        <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption" rows={2} className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Caption" />
        <input value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#hashtags" className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Hashtags" />
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {SOCIAL_PLATFORMS.map((p) => (
            <button type="button" key={p} onClick={() => toggle(p)} className={`border px-2 py-0.5 ${platforms.includes(p) ? 'border-[#5A6E3D] bg-[#F0F4EA] text-[#3F5226]' : 'border-[#C9C2B4] bg-white text-[#5A5751]'}`}>{p}</button>
          ))}
          <label className="flex items-center gap-1 text-[#5A5751]"><input type="checkbox" checked={isReel} onChange={(e) => setIsReel(e.target.checked)} /> Reel</label>
        </div>
      </div>
      <button type="button" onClick={onAdd} className="mt-2 border border-[#5A6E3D] bg-[#F0F4EA] text-[#3F5226] px-3 py-1.5 text-sm font-semibold">Add post</button>
    </div>
  );
}

function IdeasFolder({ ideas, isGovernor }) {
  const [text, setText] = useState('');
  return (
    <div className="mt-3 border border-[#E8E4DC] bg-white p-3">
      <div className="text-sm font-semibold text-[#1A1815] mb-1.5">Social media ideas</div>
      {isGovernor && (
        <div className="flex items-center gap-2 mb-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Save an idea…" className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm flex-1" aria-label="Idea" />
          <button type="button" onClick={() => { if (text.trim()) { addIdea(text.trim()); setText(''); } }} className="border border-[#5A6E3D] bg-[#F0F4EA] text-[#3F5226] px-2.5 py-1 text-xs font-semibold">Save</button>
        </div>
      )}
      {ideas.length === 0 ? <div className="text-xs text-[#8A857C]">No saved ideas yet.</div> : (
        <ul className="text-xs text-[#5A5751] list-disc pl-4 space-y-0.5">{ideas.map((i) => <li key={i.id}>{i.text}</li>)}</ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Weekly goals — targets vs actuals + the weekly plan
// ---------------------------------------------------------------------------
function GoalsSection({ week }) {
  const rows = [
    ['New contacts', week.contacts], ['Outreach emails', week.emails], ['Follow-up calls', week.calls],
    ['Social posts', week.posts], ['Reels', week.reels],
  ];
  return (
    <div>
      <div className="border border-[#E8E4DC] bg-white p-3 mb-3">
        <div className="text-sm font-semibold text-[#1A1815] mb-2">This week vs goal</div>
        <div className="space-y-2">
          {rows.map(([label, r]) => (
            <div key={label}>
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="text-[#1A1815]">{label}</span>
                <span className="text-[#5A5751]">{num(r.n)} / {num(r.min)}{r.max !== r.min ? `–${num(r.max)}` : ''}</span>
              </div>
              <Bar pct={r.pct} good={r.n >= r.min} />
            </div>
          ))}
        </div>
      </div>

      <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3">
        <div className="text-sm font-semibold text-[#1A1815] mb-1.5">The week’s shape</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {WEEKLY_PLAN.map((d) => (
            <div key={d.day} className="text-xs">
              <span className="font-semibold text-[#1A1815]">{d.day}:</span> <span className="text-[#5A5751]">{d.focus.join(' · ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ari 24/7 — the vision + what actually converts + the real constraints
// ---------------------------------------------------------------------------
function AriSection({ converting }) {
  return (
    <div>
      <div className="border border-[#3F6098] bg-[#FAF8F4] p-3 mb-3">
        <div className="flex items-center gap-1.5 text-[#1A1815] mb-1"><UiIcon name="sparkle" /><span className="text-sm font-semibold">Toward Ari doing this 24/7</span></div>
        <div className="text-xs text-[#5A5751] leading-relaxed">{ARI_AUTOMATION_NOTE}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mb-3">
        {ARI_AUTOMATION_PATH.map((s) => (
          <div key={s.stage} className={`border p-2.5 ${s.built ? 'border-[#5A6E3D] bg-[#F0F4EA]' : 'border-[#E8E4DC] bg-white'}`}>
            <div className="flex items-center gap-1.5">
              <Badge cls={s.built ? 'bg-[#F0F4EA] text-[#3F5226] border-[#5A6E3D]' : 'bg-[#FAF8F4] text-[#8A857C] border-[#C9C2B4]'}>Stage {s.stage}{s.built ? ' · built' : ''}</Badge>
              <span className="text-xs font-semibold text-[#1A1815]">{s.name}</span>
            </div>
            <div className="text-[0.6875rem] text-[#5A5751] mt-1 leading-relaxed">{s.detail}</div>
          </div>
        ))}
      </div>

      <div className="border border-[#E8E4DC] bg-white p-3 mb-3">
        <div className="text-sm font-semibold text-[#1A1815] mb-1.5">What actually converts (inbound → outbound)</div>
        {converting.totalReferred === 0 ? (
          <div className="text-xs text-[#5A5751]">No inbound attributions yet. As inquiries record how they found TLC, the sources that produce clients rise here.</div>
        ) : (
          <div className="space-y-1">
            {converting.sources.map((o) => (
              <div key={o.id} className="flex items-center justify-between text-xs">
                <span className="text-[#1A1815]">{o.organization} <span className="text-[#8A857C]">· {(referralCategory(o.categoryId) || {}).label}</span></span>
                <Badge cls="bg-[#F0F4EA] text-[#3F5226] border-[#5A6E3D]">{o.clientsReferred} referred</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3">
        <div className="text-sm font-semibold text-[#1A1815] mb-1.5">The real constraints</div>
        <div className="space-y-1">
          {OUTBOUND_CONSTRAINTS.map((c) => (
            <div key={c.id} className="text-[0.6875rem] leading-relaxed"><span className="font-semibold text-[#1A1815]">{c.label}:</span> <span className="text-[#5A5751]">{c.detail}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}
