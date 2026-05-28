# Demo mode shipped — public-facing sample

## What this is

A `?demo=family` URL parameter on kingdom-pwa-node.vercel.app loads a self-explanatory working sample of the app — modest household income, modest debts, a buffer fund growing, the kitchen-table rhythm — so a potential user can see, in their own hands, how the app provides for the people in their care. No setup, no signup, no Darrell explaining.

**Shareable URLs:**
- https://kingdom-pwa-node.vercel.app/?demo=family — the family showcase
- https://kingdom-pwa-node.vercel.app/?demo=landlord — currently aliases to family; queued for landlord-specific data
- https://kingdom-pwa-node.vercel.app/?demo=therapist — currently aliases to family; queued for therapist-specific data

## What demo mode does

- Loads `DEMO_DATA_FAMILY` instead of SEED_DATA — a clean household with one entity ("The Reeves Family"), four accounts (Checking, Savings, Visa, Auto Loan), 22 transactions across 4 weeks (15 actual + 7 projected), 6 recurring obligations, 2 debts on snowball, $1,450/$2,000 buffer fund.
- Skips the profile picker (auto-selects "family" profile so the viewer goes straight to data).
- Skips n8n calls so no error messages about "Could not reach workflow 18."
- Skips localStorage saves — nothing the viewer does persists. They can tap Add Transaction, edit accounts, change pressure slider, etc., and it all goes away on refresh.
- Shows a full-screen welcome modal on entry that frames the stewardship posture: this isn't a budget app, it's a tool for providing for people in your care.
- Shows a persistent header banner after the modal is dismissed: "Sample · You're viewing a working sample. Nothing saves. [What is this?] [Start your own →]"
- The "Start your own →" link goes to the bare URL (no demo param) — which triggers the normal app flow including profile picker.

## Welcome modal copy (stewardship posture)

> Here's what providing for the people in your care looks like with the books open.
>
> You're looking at a sample household — modest income, modest debts, a buffer fund growing, kids and tithe in the rhythm. The numbers aren't yours; the structure is what you'd use for yours.
>
> **For families:** see every dollar in one place. Know what's covered before the 1st. Watch debt come down month over month without guessing.
>
> **For business owners:** a consistent stream of stress-relieving AI tools built into the family rhythm — supporting your businesses and your leadership without pulling you away from either.
>
> **For communities:** the same system scales to a church's books, a small school's budget, a co-op's flow. The discipline that works at the kitchen table also works at the board table.
>
> [Show me around]
>
> _Built by a family for families — and the businesses and communities they steward._

## Vacation use

When a conversation turns to money or stewardship and someone says "tell me more":

1. Text them: `https://kingdom-pwa-node.vercel.app/?demo=family`
2. They tap it on their phone. Modal explains what they're looking at.
3. They dismiss the modal. Banner stays at top. They tap around — Big Picture, Books → Tx, Debts, all populated.
4. When they hit "Start your own →" they land on the real app entry.

The app speaks for itself; you don't have to explain.

## What's queued for follow-up (post-vacation)

- **`?demo=landlord`** — landlord persona with: 3 rental units, mortgage figures, tenant rent status (one paying, one late), property insurance schedule, capex queue with roof + HVAC items.
- **`?demo=therapist`** — solo practitioner persona with: TLC-style books, contractor 1099 management, recurring CEU and license renewal obligations, inquiry funnel.
- **`?demo=business`** — small business owner with: payroll, recurring revenue, AR aging, quarterly tax schedule.
- **`?demo=church`** — community persona with: tithe inflow, ministry outflows, capex priorities, prayer-request tracking.

Each shares the demo-mode framework (banner, modal, no-save, no-n8n); only the data + copy varies.

## Commit batch

```
cd C:\Users\dpoe\Kingdom-PWA-Node
git add app/src/poe-financial-mvp-v28.jsx docs/99-session-notes/2026-05-28-demo-mode-shipped.md
git commit -m "Demo mode: ?demo=family loads sample family data with welcome modal + sample banner. Stewardship copy for individuals/families/businesses/communities. Auto-skips storage save, n8n fetch, and profile picker. Shareable URL for vacation conversations."
git push
```

## Verifying once deployed

1. https://kingdom-pwa-node.vercel.app/ — normal app, profile picker, your real data.
2. https://kingdom-pwa-node.vercel.app/?demo=family — welcome modal, sample data, banner persists, your data is NOT visible.
3. Tap "Show me around" → modal dismisses → Big Picture loads with sample numbers.
4. Tap the orange "Start your own →" in the banner → reloads at the bare URL → real app.
