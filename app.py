# York weather website with live University of York bus times (U1, U2, U3)
# Run with:  .venv/bin/python app.py   then open http://127.0.0.1:5050

import time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

LONDON = ZoneInfo("Europe/London")

WEATHER_URL = "https://api.open-meteo.com/v1/forecast"
WEATHER_PARAMS = {
    "latitude": 53.9576,
    "longitude": -1.0827,
    "timezone": "Europe/London",
    "forecast_days": 7,
    "current": "temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day",
    "hourly": "temperature_2m,apparent_temperature,precipitation,precipitation_probability,weather_code,wind_speed_10m,is_day",
    "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset",
}

# Live bus data comes from bustimes.org, which publishes First York's real-time feed
BUSTIMES = "https://bustimes.org"
UNI_ROUTES = ("U1", "U2", "U3")

# Main stops served by the university buses (ATCO stop codes)
STOPS = [
    {"id": "3290YYA00107", "name": "Merchantgate (city centre)", "direction": "To campus"},
    {"id": "3290YYA00137", "name": "York Rail Station (Stop RJ)", "direction": "To Merchantgate"},
    {"id": "3290YYA01080", "name": "Piccadilly (Stop PD)", "direction": "To city centre"},
    {"id": "3290YYA00839", "name": "University Library (o/s)", "direction": "To Campus East"},
    {"id": "3290YYA00281", "name": "University Library (opp)", "direction": "To city centre"},
    {"id": "3290YYA00280", "name": "Heslington Hall (opp)", "direction": "To Campus East"},
    {"id": "3290YYA00279", "name": "Heslington Hall (o/s)", "direction": "To city centre"},
    {"id": "3290YYA03608", "name": "Campus East Interchange", "direction": "To city centre"},
]
STOP_IDS = {stop["id"] for stop in STOPS}

_cache = {}


def cached(key, seconds, fetch):
    """Return a cached value if it is fresh enough, otherwise fetch it again."""
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < seconds:
        return hit[1]
    value = fetch()
    _cache[key] = (time.time(), value)
    return value


def get_weather():
    response = requests.get(WEATHER_URL, params=WEATHER_PARAMS, timeout=15)
    response.raise_for_status()
    return response.json()


def to_datetime(hhmm, now):
    """Turn an "HH:MM" time into a full datetime, rolling over midnight if needed."""
    hour, minute = map(int, hhmm.split(":"))
    when = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
    if when < now - timedelta(hours=3):
        when += timedelta(days=1)
    return when


def parse_departures(html, now):
    soup = BeautifulSoup(html, "html.parser")
    rows = []
    for tr in soup.select("#departures tbody tr"):
        cells = tr.find_all("td")
        if len(cells) < 3:
            continue
        route = cells[0].get_text(strip=True)
        if route not in UNI_ROUTES:
            continue

        vehicle = cells[1].find("div", class_="vehicle")
        if vehicle:
            vehicle.extract()
        destination = cells[1].get_text(" ", strip=True)

        scheduled_text = cells[2].get_text(strip=True)
        expected_text = cells[3].get_text(strip=True) if len(cells) > 3 else ""
        if not scheduled_text:
            continue

        scheduled = to_datetime(scheduled_text, now)
        expected = to_datetime(expected_text, now) if expected_text else None
        best = expected or scheduled

        rows.append({
            "route": route,
            "destination": destination,
            "scheduled": scheduled.strftime("%H:%M"),
            "expected": expected.strftime("%H:%M") if expected else None,
            "live": expected is not None,
            "delay_minutes": round((expected - scheduled).total_seconds() / 60) if expected else None,
            "minutes_away": max(0, round((best - now).total_seconds() / 60)),
            "sort_key": best.isoformat(),
        })
    return rows


def get_departures(stop_id):
    now = datetime.now(LONDON).replace(second=0, microsecond=0)
    departures = []
    seen = set()
    query_time = None

    # bustimes.org lists every route at a stop, so look ahead a couple of pages
    # to collect enough U1/U2/U3 departures for a useful board.
    # Only the first page (no date/time given) includes live expected times.
    for _ in range(3):
        params = {}
        if query_time:
            params = {"date": query_time.strftime("%Y-%m-%d"), "time": query_time.strftime("%H:%M")}
        response = requests.get(f"{BUSTIMES}/stops/{stop_id}/departures", params=params, timeout=15)
        response.raise_for_status()
        for row in parse_departures(response.text, now):
            key = (row["route"], row["scheduled"])
            if key not in seen:
                seen.add(key)
                departures.append(row)
        if len(departures) >= 12 or not departures:
            break
        last = max(datetime.fromisoformat(row["sort_key"]) for row in departures)
        if query_time and last <= query_time:
            break
        query_time = last

    departures.sort(key=lambda row: row["sort_key"])
    return {"stop_id": stop_id, "updated": now.strftime("%H:%M"), "departures": departures[:15]}


@app.route("/")
def index():
    return render_template("index.html", stops=STOPS)


@app.route("/api/weather")
def api_weather():
    try:
        return jsonify(cached("weather", 600, get_weather))
    except requests.RequestException as error:
        return jsonify({"error": f"Could not load the forecast: {error}"}), 502


@app.route("/api/buses")
def api_buses():
    stop_id = request.args.get("stop", STOPS[0]["id"])
    if stop_id not in STOP_IDS:
        return jsonify({"error": "Unknown stop"}), 400
    try:
        return jsonify(cached(f"buses:{stop_id}", 30, lambda: get_departures(stop_id)))
    except requests.RequestException as error:
        return jsonify({"error": f"Could not load live bus times: {error}"}), 502


if __name__ == "__main__":
    # Port 5000 is used by AirPlay on macOS, so use 5050
    app.run(debug=True, port=5050)
