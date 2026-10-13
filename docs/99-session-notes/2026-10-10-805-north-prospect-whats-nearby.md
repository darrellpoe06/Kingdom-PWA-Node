# 805 N Prospect (Apt 2): what's nearby, verified distances

**Date:** 2026-10-10 · **Layer 4 working note** · **Purpose:** the public listing shows the location without the street address, so every "nearby" line on it needs a measured basis.

## Apartment coordinates

**40.123364, -88.25828.** Source: Redfin property record for the address (parcel 412011281018), https://www.redfin.com/IL/Champaign/805-N-Prospect-Ave-61820/home/126961925. I read this through search results only, because the sandbox could not open Redfin directly.

**Cross-checks.** I checked the point against two independent datasets:
- It sits about 29 m west of the North Prospect Avenue centerline in Overture Maps (release 2026-09-23.1).
- It falls between the MTD stops at Prospect & Vine (40.12214) and Prospect & Harvard (40.12378), near the southwest corner of Prospect & Harvard. That fits a house that fronts Prospect.

I treat the point as reliable at the level of the house or lot.

**Method.** Straight-line distances use the haversine formula with Earth radius 3958.76 mi. Reference coordinates come from:
- **MTD:** the Champaign-Urbana MTD GTFS feed (Mobility Database mirror).
- **OVT:** Overture Maps places and transportation, release 2026-09-23.1.
- **WP:** Wikipedia.

## Distances

| Place | Coordinates | Straight-line | Driving (if known) | Source |
|---|---|---|---|---|
| Main Quad, center | 40.10719, -88.22643 | about 2.0 mi | -- | OVT (place confidence 0.65) |
| Illini Union, 1401 W Green St | 40.109732, -88.227207 | about 1.9 mi | about 3.0 mi / 7 min to "University of Illinois" | livingnewdeal.org; MTD Illini Union stop (40.11038, -88.22741) agrees. The drive figure comes from the apartments.com listing for 807 N Prospect next door. |
| Nearest campus edge: ECE Building, 306 N Wright St, Champaign | 40.11504, -88.22819 | about 1.7 mi | -- | OVT |
| **I-74 Exit 181, nearest ramp end on Prospect** | 40.13397, -88.25808 | **about 0.7 mi** | about 0.75 mi, straight north on Prospect | OVT motorway links |
| I-74 mainline over Prospect | 40.13494, -88.25800 | about 0.8 mi | -- | OVT (route ref US:I 74) |
| **US-150, which is North Prospect Ave itself** | 40.12337, -88.25794 | **about 0.02 mi (on it)** | -- | OVT route ref US:US 150. IDOT/City of Champaign confirm that Prospect from Bloomington Rd to Springfield Ave is US-150. |
| I-57, nearest point | 40.1425, -88.28783 | about 2.0 mi | -- | OVT |
| Downtown Champaign (Neil & Main) | 40.11757, -88.24348 | about 0.9 mi | -- | OVT |
| Illinois Terminal (Amtrak, bus) | 40.115698, -88.241092 | about 1.1 mi | -- | MTD; WP gives 40.11583, -88.24111 |
| Target, 2102 N Prospect | 40.14182, -88.25498 | about 1.3 mi | -- | OVT; MTD "Town Center at Target" stop agrees |
| Meijer, 2401 N Prospect | 40.1449, -88.26006 | about 1.5 mi | -- | OVT |
| Market Place Shopping Center | 40.14244, -88.24307 | about 1.5 mi | -- | WP |
| Walmart Supercenter, 2610 N Prospect | 40.14713, -88.25511 | about 1.7 mi | -- | OVT; MTD "Champaign Walmart" stop agrees |
| Schnucks grocery, 109 N Mattis | 40.11721, -88.27874 | about 1.2 mi | -- | OVT |
| OSF Sacred Heart, Urbana (formerly Heart of Mary) | 40.11792, -88.22746 | about 1.7 mi | -- | WP |
| Carle Foundation Hospital, 611 W Park St | 40.1170944, -88.2160509 | about 2.3 mi | -- | latlong.net; OVT agrees within about 100 m |
| Parkland College, 2400 W Bradley | 40.12761, -88.28939 | about 1.7 mi | about 2.5 mi / 6 min | OVT; drive figure from the apartments.com listing for 807 N Prospect |
| Willard Airport (CMI) | 40.0392, -88.2781 | about 5.9 mi | about 12.2 mi / 22 min | WP; drive figure from the apartments.com listing for 807 N Prospect |
| MTD stop Prospect & Harvard | 40.12378, -88.25799 | about 0.03 mi (about 175 ft) | -- | MTD |

**Bus service.** The MTD feed covers 2026-05-17 to 2026-08-08. In it, Prospect & Harvard is served by **30 Lavender** on weekends, and Prospect & Vine (about 0.1 mi) by **7 Grey** on weekdays. MTD changed service on 2026-08-09, so **these routes are unverified for the current schedule** and need checking at mtd.org before publishing.

**Driving figures are unverified.** Every drive figure comes from the listing for the next-door address, not a route computed from 805. I did not compute any road route myself.

## Verdict on the two claims

1. **"Less than 5 miles from the UIUC campus": TRUE, with a wide margin.** The campus is about 1.7 mi away at its nearest edge (Wright St), about 1.9 mi to the Illini Union and about 2.0 mi to the Main Quad. The drive is roughly 3 mi, or about 7 minutes. "Less than 5" undersells it; "about 2 miles" is the accurate figure.
2. **"Highway is less than a quarter mile": TRUE for a US highway, FALSE for the interstate.**
   - The unit fronts North Prospect Ave, which **is US Route 150**, so it is on the highway itself.
   - The nearest **interstate** access, the I-74 Exit 181 ramps at Prospect, is **about 0.7 mi** straight-line and about 0.75 mi by road, not under a quarter mile.
   - I-57 is about 2 miles away.

## Safe to publish on the listing (no street address)

- About 2 miles to the University of Illinois Main Quad (about 7 minutes by car).
- About 1.7 miles to the edge of the UIUC engineering campus.
- Right on North Prospect Avenue (US-150); about 3/4 mile to I-74 (Exit 181).
- About 1 mile to downtown Champaign and Illinois Terminal (Amtrak and intercity bus).
- About 1.3 to 1.7 miles to the North Prospect shopping corridor: Target, Meijer, Walmart, Market Place.
- About 1.2 miles to Schnucks grocery.
- About 1.7 miles to OSF Sacred Heart (Urbana) and about 2.3 miles to Carle Foundation Hospital.
- About 1.7 miles to Parkland College.
- About 12 miles (about 22 minutes) by car to Willard Airport (CMI).
- MTD bus stop at the corner (route **unverified** for the current service year; check mtd.org first).

Do not publish "less than a quarter mile to the interstate". The measured distance is about 0.7 mi.
