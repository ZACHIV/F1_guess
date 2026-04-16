#!/usr/bin/env python3

import json
import logging
import sys
from pathlib import Path

import fastf1


def main() -> int:
    if len(sys.argv) != 5:
        raise SystemExit("Usage: resolve-fastest-lap.py <year> <grand_prix> <driver_number> <cache_dir>")

    year = int(sys.argv[1])
    grand_prix = sys.argv[2]
    driver_number = sys.argv[3]
    cache_dir = Path(sys.argv[4])
    cache_dir.mkdir(parents=True, exist_ok=True)

    logging.getLogger("fastf1").setLevel(logging.CRITICAL)
    logging.getLogger("requests_cache").setLevel(logging.CRITICAL)

    fastf1.Cache.enable_cache(str(cache_dir))
    session = fastf1.get_session(year, grand_prix, "Q")
    session.load(laps=True, telemetry=False, weather=False, messages=False)

    fastest = session.laps.pick_drivers(driver_number).pick_fastest()
    if fastest is None:
      raise RuntimeError(f"No fastest lap found for driver {driver_number} in {grand_prix} {year}")

    lap_start = session.date + fastest["LapStartTime"]
    payload = {
        "lapNumber": str(int(fastest["LapNumber"])),
        "lapStartIso": f"{lap_start.isoformat()}Z",
        "lapDurationSeconds": fastest["LapTime"].total_seconds(),
    }
    print(json.dumps(payload))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
