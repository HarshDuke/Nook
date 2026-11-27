# Sky Harbour: two researched working cases

Research date: November 27, 2026. Generator: skyharbour-two-sites-1.0.

## Decision

Use Sugar Land Regional Airport (SGR), Texas, and Nashville International Airport (BNA), Tennessee. These are operating campuses with published geometry and occupancy. Use ONE host-load assumption set per campus, then test the four data-center battery configurations against each. The previous Stewart heating sensitivities remain historical examples; they are not the chosen working cases here.

Every electricity reading and every weather interval in this study is synthetic. No site meter, approved service limit, equipment schedule or flight log was obtained. The 10 MW service and 6 MW host peak are supplied by Harsh. Research supports the campus context and selected mechanisms; it does not validate that electrical scale.

## What the primary records establish

| Topic | Finding | Consequence | Source |
|---|---|---|---|
| SGR location | 132 Lee Duggan Dr, Sugar Land, TX 77498 | Define the campus, rather than the whole airport | S1 |
| BNA location | 1480 Murfreesboro Pike, Nashville, TN 37217 | Same meter-boundary discipline | S2 |
| Current buildings | Q3 2026: SGR 7 hangars, 66,080 rentable sf; BNA 10, 149,069 sf | Use current operating portfolio, not planned expansions | S3 |
| Occupancy | September 30, 2026: SGR 100%; BNA 99% | Hold these as stabilized full-year assumptions; not actual 2025 occupancy | S3 |
| BNA heat and cooling | May/June 2022 construction reports document gas heaters, HVLS fans, insulated metal panels and AC; NES installed/energized transformers; Piedmont gas service was scheduled | Gas supplies hangar heating energy; electric meters still see blowers, circulation fans and AC | S4, S5 |
| BNA older space | Earlier filing identifies an existing 27,202-sf Hangar 14 within the campus | New-hangar equipment evidence does not establish every building's equipment | S14 |
| SGR environment | Opening announcement describes temperature/humidity control and routine servicing, with offices, kitchens, showers and laundry | Include latent cooling and amenities; do not model empty, unconditioned storage | S6 |
| SGR permits | Original state accessibility registration describes a shell with future tenant submissions; a later 4,027-sf office alteration is registered at the same address | An initial shell permit does not establish the installed HVAC or all current tenant loads | S7, S8 |
| Access/operations | Resident-only home basing, 24/7 access | Keep night loads and off-hour activity; access is not continuous full-load operation | S9 |
| Ground equipment | 2025 10-K reports an electric GSE fleet and designs that are EV-equipped, electric-aircraft-ready and renewable-ready | Include assumed GSE/car charging; readiness does not prove an active propulsion charger or PV | S10 |
| Typical ground power | Manufacturer offers 400 Hz/28 V equipment, including 90 kVA units | Ground power is intermittent; kVA nameplate is not measured kW | S11 |
| Door losses | Building-design guide identifies hangar-door heat loss; a manufacturer study uses two 15-minute openings/day as a simulation assumption | Explicit door events and delayed recovery; the event count is a benchmark assumption, not Sky Harbour operating data | S12, S13 |
| Weather | NOAA 1991–2020 normals: Hobby January/July means 55.0/84.8 F; BNA 39.6/80.7 F | Different seasonal profiles; Hobby is only a regional SGR proxy | S15, S16 |
| Office layout proxy | Current prototype drawing: 6,009 sf suites within 42,880 sf total | Adopt a rounded 14% suite fraction as a proxy, not an as-built measurement for older campuses | S17 |

SGR permit area (66,150 sf) and filing rentable area (66,080 sf) have different purposes. The generator consistently uses the latter. Airport-wide movements, based-aircraft totals, runway lights and airline terminal demand are not campus demand. I found no verified campus electrical connection capacity. I did not establish current HVAC model numbers, setpoints, tenant meter boundaries, propulsion charging, solar generation or current one-line diagrams.

## All material consumption factors

| Factor | Electrical effect and treatment |
|---|---|
| Meter boundary and allocation | Shared versus separately metered tenant HVAC/GSE can completely change the load attributable to an available service. Aggregate all assumed campus loads here; no claim they share one meter. |
| Floor area, clear height, envelope, air leakage | Set envelope losses and air volume. Insulation, roof reflectance, glazing and building age affect heating/cooling. Area is sourced; height, leakage and conductance are assumed. |
| Dry-bulb temperature, humidity and solar gain | Drive sensible and latent cooling and heating; several hot/humid days persist and reduce recharge opportunity. Generate correlated weather, not independent random intervals. |
| Heating fuel and equipment efficiency | Gas thermal energy is excluded from electric demand. Heat-pump input changes with temperature. Actual equipment capacity, staging, defrost and resistance backup remain unknown. |
| Temperature/humidity targets | A storage hangar and adjoining occupied office have different needs. Maintain separate assumed targets. No tenant overrides or night setbacks are imposed. |
| Doors, wind and recovery | Opening count/duration, opening size, wind and air exchange affect short peaks and recovery. Model 15-minute events and 45-minute exponential thermal recovery; wind/door geometry are compressed into one assumed air-exchange coefficient. |
| Resident fleet and activity | Aircraft size, actual resident count, charter/corporate schedule, simultaneous arrivals, holidays and special events determine servicing. Only generic correlated morning/evening timing is assumed; no tail numbers or flight histories are inferred. |
| Aircraft ground power | Grid-fed versus diesel/battery-fed equipment, onboard APU use, kVA, real draw and session duration matter. Assume grid-fed 40 kW sessions on a subset of movements; no jet propulsion electricity. |
| Ground vehicles and cars | Charger count, daily energy, charge timing and managed charging matter. Include explicit nighttime GSE and daytime car sessions. No active load management assumed. |
| Maintenance scope | Routine tools, compressors, washing and inspections differ from overhaul, paint booths or manufacturing. Include modest routine-maintenance sessions; exclude industrial MRO/process plants. |
| Lighting, fans and controls | Security/IT remain on; LEDs and circulation fans vary with activity. Include these explicitly rather than treating the entire building as off at night. |
| Offices and amenities | Office plugs/lights, kitchens, showers, hot water and laundry add daytime and intermittent loads. Model office loads plus a small averaged amenities/hot-water allowance; no known appliance inventory. |
| Occupancy and future changes | Leased space, aircraft utilization, tenant buildouts, changed HVAC and new charging can all increase demand. Hold current occupancy constant; no future growth included. |
| On-site supply/storage and outages | PV, generators, batteries, storm closures and utility outages can alter net imports. None included without evidence. The profile is gross normal-operation demand, not an outage simulation. |
| Interval length, power factor, tariffs | 15-minute averages capture more coincidence than hourly averages; motor starts are shorter. kVA and power factor matter for actual service constraints; model only real kW. Tariffs change dispatch incentives, not this physical host-load generator. |

## One selected assumption set per site

**Nashville: gas heat plus electric AC.** This is supported for the new hangars by the construction documents. The working case assumes the equipment remains and extends gas heating to offices and legacy Hangar 14 because detailed schedules were not found. That extension has lower confidence. Nashville winter weather increases gas consumption substantially; it does not automatically create a giant electrical heating peak. Fans and blowers still consume power.

**Sugar Land: electric heat pumps plus humidity control.** Temperature/humidity control is documented, but heating fuel is not. A reversible cooling system is a plausible working choice for this cooling-dominated climate, and avoids assuming that winter heating has no electrical cost. This is a low-confidence equipment assumption, not a finding about installed units. Replace it first when the mechanical schedule arrives. No resistance backup is assumed.

Both are continuously conditioned resident campuses with intermittent servicing, rather than nine-to-five warehouses or continuously loaded aircraft factories. Commercial occupancy is not the same as all aircraft drawing full ground power. Gas, AC and GSE evidence is historic or portfolio-level where noted; equipment changes remain possible.

## Complete numerical ledger

All numbers below other than cited geometry, occupancy and NOAA temperature normals are model choices. They were not fitted to a bill. Exact machine-readable values are exported in results.json and generate.mjs.

| Input | Working value | Reason / confidence |
|---|---|---|
| Year and resolution | 35,040 quarter-hours in a full UTC 2025 calendar; Central local clock with DST for schedules | Reproducible non-leap template, not a reconstruction of 2025 operations |
| Connection / host peak | 10,000 / 6,000 kW | User-imposed, unverified |
| Floor split | 86% hangar, 14% suites | Rounded current prototype proxy; low confidence for these campuses |
| Height | 32 ft hangar; 10 ft suite | Volume assumption; not measured |
| Heating/cooling targets | Hangar 55/78 F; suite 68/74 F | Storage/occupied-space distinction; assumed |
| Humidity targets | Hangar 60% RH at 78 F; suites 50% at 74 F | Fixed humidity-ratio reference for latent calculation; not a full humidity controller |
| Envelope conductance | 0.07 W per floor-sf per F, both campuses | Whole-envelope proxy; no as-built U-values available |
| Closed-door air changes | Hangar 0.15/h; suite 0.5/h | Assumed combined leakage/ventilation; no separate code ventilation claim |
| Cooling efficiency | COP 3.2; reduce by 0.04 per F above 95 F, floor 2.4 | Simple efficiency proxy; no vendor selection |
| SGR heating efficiency | COP = clamp(3 − 0.03 × max(47−T,0), 1.8, 3) | Heat-pump proxy; no defrost/resistance model |
| Sun | Half sine from local 06–18; seasonal amplitude 0.65+0.35 cos(2π(day−172)/365) | No observed irradiance/clouds; deliberately simplified |
| Solar gain | 0.4 thermal W/sf × sun proxy | Uncalibrated envelope/solar allowance |
| Weather persistence | Daily AR(1): x[d]=clamp(0.8x[d−1]+3z[d],−18,18) F; Gaussian z | Multi-day persistence; parameters are not fitted to station weather |
| Humidity weather | Monthly assumed dewpoints: SGR 45,48,53,59,66,72,74,74,69,61,53,47 F; BNA 27,30,37,45,55,63,67,66,59,47,37,31 F | Engineering placeholders, not NOAA humidity observations; major uncertainty for SGR |
| Door frequency | Poisson mean 2/bay/day × occupancy × weekday 1.12 / weekend 0.70 | Near two openings on weekly average; counts are events, not a per-interval 2-event probability |
| Event timing | Weights 0.02 + exp(−((h−8.5)/2)^2) + 0.85exp(−((h−17)/2.5)^2), normalized over each UTC day | Morning/evening peaks with 24-hour tails; no flight-log calibration |
| Door effect | 15 minutes open; replace 0.5 bay air volumes; 45-minute recovery time constant | Benchmark duration plus assumed exchange/recovery; no measured wind |
| Door motor | 15 kW × 3/15 minutes per opening | 15-minute averaged motor draw; assumed |
| Ground power | 65% probability per opening; 40 kW AC input; uniformly 0.5,0.75,1,1.25 or 1.5 h | Partial-use engineering guess; overlapping sessions within a bay do not stack |
| GSE | ceil(bays/3) chargers; 7.2 kW each, 2 h/day; start 19–23 local | Portfolio electric fleet documented; count/energy/schedule assumed |
| Cars | Per-bay session probability 25% weekday, 12.5% weekend, × occupancy; 7.2 kW, 3 h, start 08–15 | Assumed installed ports and utilization; not a measured load |
| Maintenance | 35% probability/bay/weekday × occupancy; 12 kW for 2 h; start 09–15 | Routine servicing allowance; no industrial process inventory |
| Occupied schedule | 07–19: factor 1 weekday / 0.6 weekend; otherwise 0.1 | Continuous access, lower night utilization |
| Security/controls | 0.06 W/sf continuously | Assumed baseline |
| Lights | Hangar 0.5 W/sf × max(0.1+0.5×occupied, active-bay share); suite 0.7 W/sf × (0.1+0.9×occupied) | Generic efficient lighting with activity diversity |
| Suite plugs | 1 W/sf × (0.15+0.85×occupied) | Kitchen/office equipment aggregate proxy |
| Fans | 0.12 W/sf × (0.4+0.6×occupied) | Background circulation; BNA fan presence documented, power assumed |
| Gas-heater blowers | BNA only: 0.02 W/sf whenever heating is required | Auxiliary electricity, not heating thermal kW |
| Hot water/amenities | 1.5 kW/bay × 0.3 from 07–19, otherwise ×0.02 | Averaged electrical allowance for hot water/laundry/amenities; exact fuels unknown |
| Internal sensible heat | 80% of lights + maintenance + aircraft power in hangar; 80% of suite plugs in suites | Approximation; some equipment can be outside |
| On-site supply/new loads | Zero PV, existing host BESS, propulsion charging, DC load, future host growth | No verified inventory; these zeros are assumptions, not absence findings |

## Exactly how the synthetic data is made

1. Fix PRNG seeds SGR 2026112701, BNA 2026112702. The load/event RNG is a 32-bit LCG; weather uses its own seed +100, with Box–Muller Gaussian draws. Generate local Central clock fields from UTC timestamps, including DST. The event-day accounting is UTC; clocks shape its within-day timing.
2. Interpolate the 12 NOAA monthly mean/high/low temperatures around monthly midpoints. Set a daily sine range to half the interpolated high-minus-low, peaking at 15:00 local. Add the AR(1) weather anomaly, linearly interpolated between UTC-day midpoints and wrapped at year-end. This is a generated weather year, not downloaded hourly weather, a typical meteorological year or extreme-weather validation.
3. Interpolate the explicitly assumed dewpoints; add 0.35 times the temperature anomaly and cap dewpoint at dry-bulb temperature. Convert dewpoint to moisture ratio at 101.325 kPa using a Magnus vapor-pressure approximation. The dewpoint vectors are not measured humidity data.
4. Generate Poisson door events per bay and day. Draw their quarter-hours from the normalized timing weights. Generate the ground-power, maintenance, EV and GSE sessions with the probabilities/durations in the ledger. Record every event with its timestamp and bay/unit. Event durations wrap across the synthetic year boundary.
5. Calculate lighting, office plugs, security, fans and amenities from areas and schedules. Aggregate active bay sessions and ground-power input. Do not multiply every outlet or equipment nameplate by 24 hours.
6. Calculate approximate heating/cooling requirements for hangar and suite zones from envelope conductance, closed-door air exchange, sun and internal heat. Clip each zone's heating/cooling requirement at zero at its own setpoint. No rated HVAC capacity limit or full dynamic room/aircraft thermal mass is modeled; this is an ideal-conditioning load proxy, not an EnergyPlus building model.
7. Each opening admits assumed air mass m=1.2 kg/m3 × 0.5 × bay volume. Sensible energy is m×1.006×positive temperature difference /3600 kWh; latent energy is m×2501×positive moisture-ratio difference /3600 kWh. Store that energy and release a fraction 1−exp(−0.25/0.75) per interval. Two annual passes bring the fast-decaying recovery state to its periodic boundary. This preserves recovery duration instead of making independent isolated spikes.
8. Divide cooling and moisture-removal thermal kW by cooling COP. At SGR divide heating thermal kW by heat-pump COP. At BNA omit gas thermal energy from the electrical sum and include auxiliary blower electricity. Closed-door latent load uses air mass-flow ×2501×positive humidity-ratio difference. Sensible cooling and latent removal are separate terms, avoiding double-counting the same latent heat.
9. Sum the 14 electrical components to obtain the unscaled illustration R[t]. Do not include the separately exported heating_thermal_kw column in that electrical sum.
10. Apply the user's peak constraint using F=6000/max(R[t]) and L[t]=F×R[t]. The final peak is exactly 6,000 kW; preserve F, the unscaled profile, every component and all events. Scaling all components changes the implied equipment scale. The normalized component totals must not be read as real installed charger or HVAC capacities.
11. Export 35,040 timestamp/load_kw rows; also export 8,760 hourly averages, conserving total energy. Keep the 15-minute profile for battery sizing, since hourly averaging can hide coincidence. An audit CSV contains synthetic weather, door events, raw component kW, raw total, scaled total and separate heating thermal kW.
12. Feed the 15-minute profile into the existing chronological Nook capacity model. Preserve company/site identity and parameters in importable project JSON. The results use constant IT load with PUE 1.25, 5% reserve on instantaneous remaining headroom, no host growth and batteries at 0/10/25/50% of resulting IT kW, all four-hour nameplate duration.

For capacity, available AC headroom is 0.95×(10,000−L[t]). A trial IT load I requires 1.25I facility kW. Battery power is bI and nameplate energy 4bI kWh. Apply the existing 80% SOC window, 80% end-of-life retention and 85% round-trip efficiency. Simulate charge/discharge in order, including recharge limits and a periodic SOC boundary. Size each scenario to at least 99% fully served UTC days (at most three failed days out of 365); also report shortfall hours/energy and strict 100% service for the same battery. This target is not 99% guaranteed uptime and is not an optimal forecast-based dispatch calculation.

The original strict no-battery minimum-headroom baseline remains 0.95×(10−6)/1.25=3.04 MW IT. A no-battery case permitted to fail on three days is a different product and can exceed that baseline. Do not confuse the two labels.

## Interpretation and limits

The most consequential result is the normalization audit. The area/equipment illustration peaks well below 6 MW. The exact computed raw peaks and scaling factors are recorded in results.json. The imposed peak densities are 90.8 W/sf at SGR and 40.25 W/sf at BNA. Research has not established loads of that scale on either campus. A 6 MW figure could refer to another meter boundary, future development or simply the original hypothetical; verify it before treating these as site forecasts.

This is ONE reproducible, inspectable working shape per campus. It cannot establish a 99% real-world reliability claim. A single seed and monthly climate normals do not determine rare coincident peaks, hurricanes, cold snaps, flight disruptions or future tenant behavior. The raw case is also uncalibrated and should not be mistaken for a prediction that the actual campus peaks at its simulated value. Before investment sizing use measured 15-minute imports, several actual weather years, equipment schedules and independent realization/stress tests. Battery reserve for backup is separate from the energy available for headroom shifting.

Highest-value next records: (1) meter/account map and written usable service limit; (2) 12–24 months of native 15-minute kW data and bills; (3) as-built mechanical/electrical equipment schedules, especially SGR heat fuel and BNA Hangar 14; (4) thermostat/humidity and door logs; (5) GSE/ground-power/EV inventory and charging records; (6) tenant growth/buildout plans. Utility bills should be used to calibrate annual/monthly energy and demand separately, rather than fitting only one extreme peak. Airport permission, available parcel area and fiber are separate buildability gates; the airport's spare MW alone does not grant use rights (S18).

## Sources

S1. Sky Harbour, Houston location: https://skyharbour.group/locations/houston/

S2. Sky Harbour, Nashville location: https://skyharbour.group/locations/nashville/

S3. Sky Harbour Q3 2026 Form 10-Q, properties in operation: https://www.sec.gov/Archives/edgar/data/1823587/000143774926036142/ysac20260930_10q.htm

S4. Sky Harbour May 2022 construction report, BNA pages 4–5: https://s29.q4cdn.com/176696086/files/doc_downloads/monthly-construction-report/2022/06/07-SHY-Construction-Report-May-2022.pdf

S5. Sky Harbour June 2022 construction report, BNA: https://s29.q4cdn.com/176696086/files/doc_downloads/monthly-construction-report/2022/07/09-SHY-Construction-Report-June-2022.pdf

S6. Sky Harbour, Houston opening announcement, May 14, 2021: https://skyharbour.group/home-base-hangar-option-opens-in-houston/

S7. Texas DLR TABS2019013980, original SGR construction registration: https://www.tdlr.texas.gov/TABS/Projects/TABS2019013980

S8. Texas DLR TABS2025006495, SGR office alteration registration: https://www.tdlr.texas.gov/TABS/Projects/TABS2025006495

S9. Sky Harbour residents page: https://skyharbour.group/residents/

S10. Sky Harbour 2025 Form 10-K, Environmental section: https://www.sec.gov/Archives/edgar/data/1823587/000143774926009045/ysac20251231_10k.htm

S11. ITW GSE manufacturer ground-power product range: https://itwgse.com/ground-power-units/

S12. Whole Building Design Guide, Aviation Hangar: https://legacy.wbdg.org/building-types/aviation/aviation-hangar

S13. REHAU, Efficiency in aircraft hangar heating (manufacturer-sponsored simulation assumptions, not site measurements): https://www.rehau.com/us-en/efficiency-in-aircraft-hangar-heating

S14. Sky Harbour September 2022 registration statement, Nashville campus/legacy Hangar 14: https://www.sec.gov/Archives/edgar/data/1823587/000143774922022142/skyh-20220630.htm

S15. NOAA NCEI Houston Hobby 1991–2020 monthly normals, USW00012918: https://www.ncei.noaa.gov/access/services/data/v1?dataTypes=MLY-TMAX-NORMAL%2CMLY-TMIN-NORMAL%2CMLY-TAVG-NORMAL%2CMLY-PRCP-NORMAL%2CMLY-SNOW-NORMAL&dataset=normals-monthly-1991-2020&format=pdf&stations=USW00012918

S16. NOAA NCEI Nashville 1991–2020 monthly normals, USW00013897: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&format=pdf&stations=USW00013897

S17. Sky Harbour Summer 2026 corporate overview, prototype floor plan: https://s29.q4cdn.com/176696086/files/doc_presentation/2026/06/04/v2/Sky-Harbour-Corporate-Overview-Public_Summer-2026.pdf

S18. FAA hangar-use policy FAQ: https://www.faa.gov/airports/airport_compliance/hangar_use

## Reproduce

From the Nook repository: `npm run analyze:skyharbour-two-sites`.

The generator has no network or AI dependency. Data outputs are in outputs/skyharbour-two-sites; research, generator and numerical results are versioned in examples/skyharbour-two-sites. The two project JSON files can be imported into Capacity Lab and saved under the Sky Harbour company with their distinct site names. Existing saved Stewart runs are not rewritten.
