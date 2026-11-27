# Computed synthetic working cases

All readings are synthetic. The 10 MW connection and 6 MW peak are imposed assumptions, not verified capacities. Weather is generated from climate normals. The raw area/equipment illustrations are uncalibrated.

| Site | Raw peak MW | Multiplier to 6 MW | Raw MWh/year | Normalized MWh/year | Mean normalized MW |
|---|---:|---:|---:|---:|---:|
| SGR | 0.346 | 17.35 | 592 | 10266 | 1.172 |
| BNA | 0.523 | 11.46 | 985 | 11294 | 1.289 |

The large normalization multipliers change implied equipment scale; these are conditional load shapes, not predictions of actual campus demand.

| Site | Scenario | IT MW at 99% fully served UTC days | Strict IT MW, same battery | Battery MW / nameplate MWh | Failed days / shortfall hours |
|---|---|---:|---:|---:|---:|
| SGR | No battery | 3.107 | 3.040 | 0.000 / 0.000 | 3 / 0.75 |
| SGR | Low battery | 3.377 | 3.310 | 0.338 / 1.351 | 3 / 0.75 |
| SGR | Moderate battery | 3.884 | 3.817 | 0.971 / 3.884 | 3 / 0.75 |
| SGR | High battery | 5.178 | 5.111 | 2.589 / 10.356 | 3 / 0.75 |
| BNA | No battery | 3.482 | 3.040 | 0.000 / 0.000 | 3 / 1.00 |
| BNA | Low battery | 3.785 | 3.343 | 0.378 / 1.514 | 3 / 1.00 |
| BNA | Moderate battery | 4.353 | 3.911 | 1.088 / 4.353 | 3 / 1.00 |
| BNA | High battery | 5.425 | 5.210 | 2.713 / 10.851 | 3 / 2.00 |

99% of fully served UTC days permits three failed days. It is not guaranteed uptime. No-battery 100% service is 3.04 MW IT at both sites. All storage is four-hour nameplate, 10/25/50% of resulting IT power; usable energy is reduced for SOC/degradation and efficiency. PUE=1.25, residual-headroom reserve=5%.

Exact settings, components and method are in research-and-method.md and results.json. Use 15-minute data for sizing; hourly files are energy-conserving averages.
