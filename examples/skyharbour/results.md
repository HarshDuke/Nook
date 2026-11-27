# Sky Harbour / Stewart — synthetic screening results

As of November 27, 2026. All load data is synthetic. The 10 MW connection and 6 MW peak are user-imposed assumptions; Stewart is publicly listed as in development.

## Results at 99% fully served UTC days

| Synthetic shape | No battery MW IT | Low MW IT | Moderate MW IT | High MW IT | Annual host MWh |
|---|---:|---:|---:|---:|---:|
| Electrified climate-control shape | 4.016 | 4.365 | 5.020 | 5.368 | 10,041 |
| Non-electric heating / summer-peak shape | 3.419 | 3.716 | 4.274 | 4.995 | 8,289 |
| Persistent winter demand stress | 3.116 | 3.216 | 3.269 | 3.296 | 15,151 |

Strict no-battery 100% headroom baseline: **3.040 MW IT**, independently of synthetic shape. All batteries: four-hour nameplate duration, at 10/25/50% of resulting IT kW. Daily target allows at most three unsuccessful days. A larger battery/capacity may have more shortfall hours within those allowed days.

## Illustrative base shape: storage and economics

| Scenario | MW IT | Battery MW / MWh | Failed days / shortfall hours | Battery capex | Residual rights budget | Zero-rights-budget rent $/IT kW-month |
|---|---:|---:|---:|---:|---:|---:|
| No battery | 4.016 | 0.000 / 0.000 | 3 / 3.75 | $0 | $-489,095 | 251.84 |
| Low battery | 4.365 | 0.437 / 1.746 | 3 / 5.00 | $595,676 | $-1,283,782 | 254.43 |
| Moderate battery | 5.020 | 1.255 / 5.020 | 3 / 14.50 | $1,618,817 | $-2,551,352 | 257.66 |
| High battery | 5.368 | 2.684 / 10.736 | 3 / 41.25 | $3,405,127 | $-4,916,786 | 263.80 |

The economic assumptions are placeholders, not local tariff or lease quotes. Under this particular rent/power-cost structure the larger batteries unlock MW but do not earn their incremental cost. Change rent, who bears power, actual tariff and vendor pricing before making a commercial decision.

## What this analysis establishes

- Conditional on an actually usable 10 MW service and a 6 MW host peak, 3.04 MW IT is the strict baseline with the stated reserve and overhead factor.
- Storage value depends on peak duration, fuel choice, recharge windows and the compute availability product.
- This screen does not establish an existing connection, an airport/landlord approval, or a guaranteed uptime.
- Request measured load and service records; run those through the same company workspace.

See research.md for source-by-source reasoning, assumptions, the unconfirmed earlier planning-energy discrepancy, and site diligence.