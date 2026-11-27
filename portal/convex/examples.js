export const examples = [
  {
    site: "Sugar Land Regional Airport",
    company: "Sky Harbour",
    version: "November 2026 \u00b7 synthetic working case",
    summary:
      "Assumed 10 MW service, 6 MW site peak, PUE 1.25 and a 5% headroom reserve. Battery cases use four-hour storage sized at 10%, 25% and 50% of IT load. Capacity targets 99% of fully served days in a simulated year.",
    rows: [
      {
        scenario: "No battery",
        it: 3.1068484203645577,
        strict: 3.039999992,
        battery: 0,
        mwh: 0,
      },
      {
        scenario: "Low battery",
        it: 3.37700916632913,
        strict: 3.3101607252434286,
        battery: 0.3377009166329131,
        mwh: 1.3508036665316523,
      },
      {
        scenario: "Moderate battery",
        it: 3.8835605651603684,
        strict: 3.8167121048512316,
        battery: 0.9708901412900921,
        mwh: 3.8835605651603684,
      },
      {
        scenario: "High battery",
        it: 5.178080807011749,
        strict: 5.111232314322454,
        battery: 2.5890404035058747,
        mwh: 10.356161614023499,
      },
    ],
  },
  {
    site: "Nashville International Airport",
    company: "Sky Harbour",
    version: "November 2026 \u00b7 synthetic working case",
    summary:
      "Assumed 10 MW service, 6 MW site peak, PUE 1.25 and a 5% headroom reserve. Battery cases use four-hour storage sized at 10%, 25% and 50% of IT load. Capacity targets 99% of fully served days in a simulated year.",
    rows: [
      {
        scenario: "No battery",
        it: 3.4821543454097785,
        strict: 3.039999992,
        battery: 0,
        mwh: 0,
      },
      {
        scenario: "Low battery",
        it: 3.7849503893753487,
        strict: 3.342796023079528,
        battery: 0.3784950389375349,
        mwh: 1.5139801557501396,
      },
      {
        scenario: "Moderate battery",
        it: 4.352692971956492,
        strict: 3.9105385861886113,
        battery: 1.088173242989123,
        mwh: 4.352692971956492,
      },
      {
        scenario: "High battery",
        it: 5.425257266384494,
        strict: 5.2101028980485316,
        battery: 2.712628633192247,
        mwh: 10.850514532768988,
      },
    ],
  },
];
