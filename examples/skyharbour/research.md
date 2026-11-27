# Sky Harbour / Stewart: research basis for a synthetic Nook screen

Research date: November 27, 2026. **Every interval is synthetic. No utility bills, meter data, equipment schedules or capacity approval have been obtained from Sky Harbour.** This is a reproducible screening example and a request-for-data guide, not an engineering design or a valuation of the company's property.

## Site choice and what is actually known

The intended company is **Sky Harbour Group**, the private-business-aircraft hangar developer, not Phoenix Sky Harbor airport. The example uses its planned campus at **New York Stewart International Airport (SWF/KSWF), New Windsor, New York**. The company's location page describes a north-side campus and still marks it Coming Soon [S1]. Its September 30, 2026 Form 10-Q lists SWF Phase I **in development**, with start/completion TBD, **eight hangars and 256,240 rentable square feet** [S2]. Treat this as a future stabilized operating-campus example, not an already energized brownfield site.

Sky Harbour announced that the development leasehold was being expanded from 16 to 26 acres in December 2025 [S3]. This is context about the development site, not proof of available land for Nook. Public marketing, earlier environmental submissions and later SEC project tables use different hangar counts/areas; the 10-Q is used as current project context, without inventing a final electrical layout.

The **10 MW connection** and **6 MW maximum 15-minute electrical demand** are supplied by Harsh as scenario assumptions. Neither is verified by the public material reviewed. They apply to the modeled campus as a whole, not to each individual hangar. No portfolio MW is inferred by multiplying campuses. Utility provider, tariff, voltage, capacity rights, transformer limits, fiber, usable pad area, and permission for a non-aeronautical compute use remain unknown.

## Why a home-base hangar load is different

Sky Harbour's offering is based-aircraft hangars with suites and dedicated line service, rather than a transient-aircraft terminal [S4]. It describes 24/7 access and climate-controlled space [S5]. Consequently, this generator includes an overnight background load, weather conditioning, and intermittent activity rather than switching the campus off at night or imposing an airline departure schedule.

The company's 2025 Form 10-K describes climate control, maintenance capability, electric ground support equipment, and EV-equipped / electric-aircraft-ready campuses [S4]. Readiness does not establish current electric-aircraft propulsion charging, so no such load is included. Solar-ready design is also not treated as operating generation. Aircraft ground-power units are intermittent electrical support loads; they are not graphics processors or continuous full-nameplate demand. ITW GSE lists solid-state equipment in 30–180 kVA sizes, including 90 kVA units [S6]. Actual real-power draw and simultaneity require equipment/aircraft records; a 40 kW active unit in the generator is an analyst assumption, not a measurement or a conversion of every 90 kVA rating to 90 kW.

WBDG identifies hangar doors as an important thermal-loss pathway and notes specialized electrical supplies for aircraft and support equipment [S7]. A REHAU manufacturer-commissioned hangar study uses two 15-minute door openings a day as a modeling assumption and compares gas-fired, forced-air and hydronic heating [S8]. This supports modeling door-induced thermal recovery and testing heating technologies; it does not establish Sky Harbour's opening frequency, fuel or energy savings. A company's older construction report mentions split AC equipment at a different campus [S9]; that is evidence of design variation, not Stewart's HVAC specification.

## Climate basis

The temperature seasonal pattern uses National Weather Service **1991–2020 Poughkeepsie monthly normals**, a nearby Hudson Valley climate proxy [S10]. The table reports mean temperatures of 27.1°F in January and 73.6°F in July, and annual heating/cooling degree-days of 5,995/745. Those are climatological normals, not observed Stewart weather for 2025.

The generator interpolates monthly temperatures, adds a diurnal cycle and correlated pseudo-random daily variation, and explicitly inserts invented cold/heat spells. The reference calendar is 2025, at 15-minute intervals. These dates label a synthetic year; none of the inserted events is asserted to have occurred in 2025. Activity is scheduled in America/New_York local time, including daylight saving, while all timestamps and coverage days use UTC for compatibility with the screening engine.

## Component model and explicit assumptions

| Component | Treatment before peak normalization | Evidence versus assumption |
|---|---|---|
| Security, controls, basic fans/pumps | 125 kW continuous | 24/7 campus concept sourced; magnitude assumed |
| Hangar lighting | 256 kW at full modeled level, reduced with activity | Approx. 1 W/sqft scenario assumption; no lighting schedule obtained |
| Office/suite use | 45 kW modeled full-use contribution | Suites sourced; magnitude/schedule assumed |
| Maintenance/shop activity | Up to 100 kW with diversified activity | Capability sourced; power and coincidence assumed |
| Doors | 18 kW motors, 3 active minutes within a 15-minute opening | Entire equipment specification assumed |
| Door thermal recovery | Decays over 1.25 h, scaled by outdoor temperature difference | Mechanism sourced; coefficient and recovery constant assumed |
| Aircraft ground power | 40 kW per active modeled unit; capped at eight units | Equipment class sourced; quantity/utilization assumed |
| GSE / vehicle charging | 30 kW GSE events and 22 kW vehicle connections | Electrification capability sourced; actual equipment assumed |
| Heating | 55°F balance point, electric heating/staging in one shape; low electric heating auxiliaries in another | Fuel and installed design unknown; test as alternatives |
| Cooling / humidity | 72°F cooling balance point and summer latent-load proxy | Climate-control need sourced; all coefficients assumed |
| Stress overlay | Winter daytime floor around 5 MW and six consecutive days around 5.7 MW | Deliberate sensitivity, not operating evidence |

Pseudo-random seed is 20261127. Approximate door schedules total two openings per modeled hangar per day on average before weekend adjustments, with morning/evening concentration and nonzero overnight probability. The eight modeled bays are an aggregation scaffold, not individual tenants' flight logs. There are no aircraft engine/APU electricity conversions, heavy industrial production lines, airport runway-lighting allocations, or full-airport terminal loads added to the campus.

**Peak normalization:** component sums are multiplied by a single factor so the maximum interval equals exactly **6,000 kW**. The factor and unscaled peak are saved with every profile. This honors the requested peak while retaining a physically motivated shape. It does not establish actual annual consumption, equipment ratings, or a calibrated engineering load model. No market-wide hangar load-factor distribution was found or assumed. This normalization is why multiple plausible shapes must be compared.

## Three profiles, not three probability forecasts

1. **Electrified climate-control shape:** substantial weather-driven electric heat, cold staging, door recovery and cooling. Used as the illustrative base for discussion, not a claim that Stewart is all-electric.
2. **Non-electric heating / summer-peak shape:** winter thermal energy is largely outside the electric meter; electric fans, cooling, lighting and operational events remain. No natural-gas quantity is estimated.
3. **Persistent winter demand stress:** prolonged winter load and a six-day high-demand spell with the same 6 MW annual peak. This tests recharge starvation. A battery cannot sustainably turn a six-day deficit into firm generation.

Compare all three independently. They are not P10/P50/P90 cases and have no assigned probabilities. The implied annual energy and load factors are outputs of the assumptions, not estimates of Sky Harbour's reported electricity use.

## Independent planning-data discrepancy

Indexed text from an earlier Orange County IDA environmental assessment lists an annual operating-electricity estimate of **520,000 kWh**, and mentions solar plus grid supply [S11]. That is a planning estimate, not measured usage. The source's original PDF returned an error during direct/screenshot verification in this research session, so the figure is an **unconfirmed diligence lead**, not a calibration input. If both 520 MWh/year and a 6 MW peak described the same scope and period, the implied load factor would be about 0.99%; that discrepancy needs reconciliation. Project phases and estimates have changed. Request actual meter records before treating either public estimates or the imposed peak as site truth.

## Screening and financial assumptions

The primary calculation assumes an already usable 10,000 kW connection, a 5% margin on each residual headroom interval, no additional host growth, and a peak facility/IT ratio of 1.25. The strict no-battery baseline is therefore **(10−6) × 0.95 / 1.25 = 3.04 MW IT**. Larger values at 99% daily coverage partly reflect allowing three unsuccessful days; battery-only benefit is measured against the no-battery case at the same daily target.

All storage scenarios are four-hour nameplate systems, at 10%, 25% and 50% of resulting IT kW. Round-trip efficiency is 85%; the usable SOC window and end-of-life energy retention are each 80%. Storage is for headroom balancing, not a separately certified UPS. The reactive controller carries energy through days and closes the annual SOC balance. It is a feasible-policy screen, not a globally optimized choice of sacrificed days. Peak electrical capacity, battery power derating, controls and cooling auxiliaries need design review.

Financial placeholders: $0.12/kWh energy, $10/kW-month incremental calendar-month demand, $250/IT-kW-month rent, 90% leased occupancy, $6,500/IT-kW DC capex, $180/IT-kW-year DC opex, $50,000/year host rent, $250,000 enabling cost, battery energy/power costs $250/kWh plus $250/kW plus $50,000 fixed, battery O&M 3%/year and 50% refresh in year 8, 10-year horizon at 10%. No value is claimed for these as actual New York tariffs, customer quotes or vendor prices. Nook bears electricity cost in this particular model; if customers reimburse electricity, model that commercial structure separately. Rent sensitivities and zero-rights-budget break-even rent are reported to expose this uncertainty.

## Two site-specific gating questions

First, Stewart is still in development in the latest filing: obtain written confirmation of the actual energized import limit and project scope. A planned 10 MW service is not a ready 10 MW service.

Second, an airport ground lease is not automatic permission for a data center. FAA's current airport-compliance chapter addresses approval/consent for non-aeronautical and mixed uses [S12], and its hangar FAQ restricts non-aeronautical commercial use of dedicated hangar space [S13]. This is a siting issue for the airport sponsor, landlord and appropriate advisers; it is not a legal determination about a particular Nook design. A separate pod on approved non-aeronautical land would still need site-specific permission, utility arrangements, fire separation, noise, access and fiber checks.

## What to request from Sky Harbour

- Service account, utility, voltage, permitted import, executed service documents, energization status and one-line diagram for the actual parcel.
- A year of 15-minute native load/import data, all relevant meters, actual monthly peaks and separate electricity/gas bills.
- HVAC fuel/technology, heating and humidity setpoints, controls and door recovery strategy.
- Active 400 Hz/28 V equipment, real-power demand, charger schedules, tenant metering and planned electrification.
- Resident occupancy, movements and large concurrent loads; distinguish emergency fire-pump tests and generator events.
- Available non-aeronautical space, lessor/sponsor approval pathway, fiber, noise and fire requirements.

## Primary sources

- **S1** Sky Harbour Stewart campus: https://skyharbour.group/locations/new-york-stewart/
- **S2** Sky Harbour September 30, 2026 10-Q, properties in development: https://www.sec.gov/Archives/edgar/data/1823587/000143774926036142/ysac20260930_10q.htm
- **S3** Sky Harbour Stewart expansion, Dec. 22, 2025: https://skyharbour.group/sky-harbour-announces-longbeach-campus-2-2-3/
- **S4** Sky Harbour 2025 10-K, business / environmental matters: https://www.sec.gov/Archives/edgar/data/1823587/000143774926009045/ysac20251231_10k.htm
- **S5** Sky Harbour resident proposition: https://skyharbour.group/residents/
- **S6** ITW GSE equipment portfolio: https://itwgse.com/ground-power-units/
- **S7** WBDG aviation hangar design: https://legacy.wbdg.org/building-types/aviation/aviation-hangar
- **S8** REHAU manufacturer hangar-heating simulation: https://www.rehau.com/us-en/efficiency-in-aircraft-hangar-heating
- **S9** Sky Harbour January 2023 construction report: https://s29.q4cdn.com/176696086/files/doc_downloads/2023/01/16-SHY-Construction-Report-January-2023.pdf
- **S10** NWS Poughkeepsie 1991–2020 normals: https://www.weather.gov/media/aly/Climate/POU/POU_Normals_1991-2020.pdf
- **S11** Earlier IDA assessment, indexed text only / original fetch unavailable: https://www.ocnyida.com/wp-content/uploads/Stewart-Assessment-Form-with-site-plan.pdf
- **S12** FAA Order 5190.6C chapter 22 (Feb. 20, 2026): https://www.faa.gov/airports/resources/publications/orders/compliance_5190_6/order-5190-6c-compliance-chapter-22
- **S13** FAA hangar-use FAQ: https://www.faa.gov/airports/airport_compliance/hangar_use
