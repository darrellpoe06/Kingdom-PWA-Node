# Google sign-in on the sovereign stack

**Why this page exists:** 2026-09-11, 11:58am, in a Love Corner meeting, a tap on
"Continue with Google" answered with GoTrue's raw 400 JSON --
`Unsupported provider: provider is not enabled`. On hosted Supabase, Google was
enabled in the **dashboard**, and a dashboard setting is not a file, so it never
travelled with the cutover. Full account: **DR-0361**.

## The DR-0108 channel challenge (run BEFORE anything here was called a hand-step)

| Channel | Drives this? |
| --- | --- |
| **services-sync** (`infra/nas-loops/services.json`) | **YES, for the code half** -- the provider block in `docker-compose.yml` and the `GOOGLE_*` seeding + allow-list convergence in `install.sh` land on the NAS on its own clock. No human touches those. |
| **Remote-hands** (`nas-health.yml`) | **YES for observation** -- it can read `https://poetech.us/sb/auth/v1/settings` from outside and prove what the provider state actually is. |
| **Remote-hands, for the write** | **NO, and this is the whole reason this page exists.** The write needs Google's client *secret*, and a GitHub Actions run puts its inputs where a log can hold them. A secret value goes onto the device directly, never through a channel that logs. |
| **Deploy lane** | No -- nothing in the built app changes. |

So the human tail is exactly two lawful items, and neither blocks anything else
in DR-0361: a **secret value onto a device** (the client secret, a value only
Darrell holds), and one **console** click in Google Cloud that no channel of
ours reaches. Everything else is already delivered.

## Step 1 -- Google Cloud console (the click no channel reaches)

Open <https://console.cloud.google.com/apis/credentials>, open the OAuth 2.0
Client ID already used for poetech.us, and under **Authorized redirect URIs**
add this line exactly:

```
https://poetech.us/sb/auth/v1/callback
```

Keep any existing Supabase-hosted callback that is already listed -- leaving it
costs nothing and removing it is a separate decision. Save, then copy the
**Client ID** (it ends `.apps.googleusercontent.com`). Leave the **Client
secret** on screen; the next step asks for it and hides your typing.

> Google can take a few minutes to propagate a new redirect URI. If step 2
> proves out but the browser says `redirect_uri_mismatch`, wait five minutes
> and try the sign-in again -- nothing is wrong with the stack.

## Step 2 -- wire it on the NAS

Paste-ready, from anywhere. It SSHes to the NAS and runs the script, which
prompts for the client ID (in the clear -- it is not a secret) and then the
client secret (hidden, never in shell history, never in any log):

```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 -t "sudo sh /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-supabase/enable_google_oauth.sh"
```

From ConnectBot on your phone, the same thing once you are on the NAS:

```
sudo sh /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-supabase/enable_google_oauth.sh
```

The script rewrites the four `GOOGLE_*` lines in `/volume1/docker/supabase/.env`,
adds `https://poetech.us/**` to the redirect allow-list if it is missing,
restarts `supabase-auth`, and then reads GoTrue's own settings and requires
`"google":true` before it reports success. It refuses a client ID of the wrong
shape and an empty secret, and changes nothing in either case.

> If the repo on the NAS has not pulled this commit yet, services-sync runs on
> a 15-minute cycle. To not wait:
>
> ```powershell
> cd C:\Users\dpoe\Kingdom-PWA-Node
> ssh dpoe@192.168.1.26 -t "cd /volume1/PoeTech/repos/Kingdom-PWA-Node; sudo -n git pull --ff-only"
> ```

## Step 3 -- prove it from the outside

The NAS proving itself is not the same as the family's browser getting in. This
reads the same endpoint the app's own pre-flight guard reads, through the same
same-origin `/sb` door:

```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node
curl.exe -s https://poetech.us/sb/auth/v1/settings
```

Look for `"google":true` in the `external` map. Then sign in for real at
<https://poetech.us/love-corner> -- signed out, "Continue with Google" -- and
confirm the popup closes and leaves you signed in **on the Love Corner page**,
not bounced to the site root. The bounce is what a missing allow-list entry
looks like.

## While Google is off

Nothing is blocked and nobody is locked out. The app now **asks** GoTrue before
it offers the button, so instead of raw JSON a member reads: *"Google sign-in
isn't switched on yet. Use your email and password just below -- or the
'trouble signing in?' link to get a sign-in link emailed to you."* Email sending
is already wired (`enable_email_smtp.sh`), so that path works today.

## Turning it back off

```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 -t "sudo sed -i 's/^GOOGLE_ENABLED=true/GOOGLE_ENABLED=false/' /volume1/docker/supabase/.env; sudo docker restart supabase-auth"
```

The credentials stay in the file, the provider goes quiet, and the app's guard
starts telling members so again within five minutes (the probe's cache window).
