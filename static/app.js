// York weather + uni bus front end

const YORK = [53.9576, -1.0827];

// WMO weather codes used by Open-Meteo: [description, day icon, night icon]
const WEATHER_CODES = {
  0: ["Clear sky", "☀️", "🌙"],
  1: ["Mostly clear", "🌤️", "🌙"],
  2: ["Partly cloudy", "⛅", "☁️"],
  3: ["Overcast", "☁️", "☁️"],
  45: ["Fog", "☁️", "☁️"],
  48: ["Freezing fog", "☁️", "☁️"],
  51: ["Light drizzle", "🌦️", "🌧️"],
  53: ["Drizzle", "🌦️", "🌧️"],
  55: ["Heavy drizzle", "🌧️", "🌧️"],
  56: ["Freezing drizzle", "🌧️", "🌧️"],
  57: ["Freezing drizzle", "🌧️", "🌧️"],
  61: ["Light rain", "🌦️", "🌧️"],
  63: ["Rain", "🌧️", "🌧️"],
  65: ["Heavy rain", "🌧️", "🌧️"],
  66: ["Freezing rain", "🌧️", "🌧️"],
  67: ["Freezing rain", "🌧️", "🌧️"],
  71: ["Light snow", "🌨️", "🌨️"],
  73: ["Snow", "🌨️", "🌨️"],
  75: ["Heavy snow", "❄️", "❄️"],
  77: ["Snow grains", "🌨️", "🌨️"],
  80: ["Light showers", "🌦️", "🌧️"],
  81: ["Showers", "🌧️", "🌧️"],
  82: ["Heavy showers", "⛈️", "⛈️"],
  85: ["Snow showers", "🌨️", "🌨️"],
  86: ["Heavy snow showers", "❄️", "❄️"],
  95: ["Thunderstorm", "⛈️", "⛈️"],
  96: ["Thunderstorm with hail", "⛈️", "⛈️"],
  99: ["Thunderstorm with hail", "⛈️", "⛈️"],
};

function describe(code, isDay = 1) {
  const entry = WEATHER_CODES[code] || ["Unknown", "❔", "❔"];
  return { text: entry[0], icon: isDay ? entry[1] : entry[2] };
}

const round = (n) => Math.round(n);

/* ---------- Weather ---------- */

let weather = null;
let selectedDay = 0;

async function loadWeather() {
  try {
    const res = await fetch("/api/weather");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Forecast unavailable");
    weather = data;
    renderNow();
    renderDays();
    renderHourly();
  } catch (err) {
    document.getElementById("now").innerHTML = `<p class="error">${err.message}</p>`;
  }
}

function renderNow() {
  const c = weather.current;
  const units = weather.current_units;
  const wx = describe(c.weather_code, c.is_day);
  const today = weather.daily;
  document.getElementById("now").innerHTML = `
    <div class="big-icon">${wx.icon}</div>
    <div>
      <div class="temp">${round(c.temperature_2m)}°C</div>
      <div>${wx.text} in York now</div>
    </div>
    <div class="details">
      <div>Feels like <b>${round(c.apparent_temperature)}°C</b></div>
      <div>Today <b>${round(today.temperature_2m_max[0])}° / ${round(today.temperature_2m_min[0])}°</b></div>
      <div>Rain chance <b>${today.precipitation_probability_max[0] ?? 0}%</b></div>
      <div>Wind <b>${round(c.wind_speed_10m)} ${units.wind_speed_10m}</b></div>
      <div>Sunset <b>${today.sunset[0].slice(11)}</b></div>
    </div>`;
}

function dayName(dateStr, index) {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  return new Date(dateStr + "T12:00").toLocaleDateString("en-GB", { weekday: "short" });
}

function shortDate(dateStr) {
  return new Date(dateStr + "T12:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function renderDays() {
  const d = weather.daily;
  const box = document.getElementById("days");
  box.innerHTML = d.time.map((date, i) => {
    const wx = describe(d.weather_code[i]);
    return `
      <button type="button" class="day ${i === selectedDay ? "selected" : ""}" data-index="${i}" title="${wx.text}">
        <div class="name">${dayName(date, i)}</div>
        <div class="date">${shortDate(date)}</div>
        <div class="icon">${wx.icon}</div>
        <div><span class="hi">${round(d.temperature_2m_max[i])}°</span> <span class="lo">${round(d.temperature_2m_min[i])}°</span></div>
        <div class="rain">💧 ${d.precipitation_probability_max[i] ?? 0}% · ${d.precipitation_sum[i].toFixed(1)} mm</div>
      </button>`;
  }).join("");

  box.querySelectorAll(".day").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedDay = Number(btn.dataset.index);
      renderDays();
      renderHourly();
    });
  });
}

function renderHourly() {
  const h = weather.hourly;
  const date = weather.daily.time[selectedDay];
  const nowHour = weather.current.time.slice(0, 13);
  const label = selectedDay === 0 ? "today" : selectedDay === 1 ? "tomorrow" : new Date(date + "T12:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  document.getElementById("hourly-title").textContent = `Hour by hour, ${label}`;

  const rows = [];
  h.time.forEach((time, i) => {
    if (!time.startsWith(date)) return;
    // For today, start from the current hour rather than midnight
    if (selectedDay === 0 && time.slice(0, 13) < nowHour) return;
    const wx = describe(h.weather_code[i], h.is_day[i]);
    const chance = h.precipitation_probability[i] ?? 0;
    const isNow = time.slice(0, 13) === nowHour;
    rows.push(`
      <tr class="${isNow ? "now-row" : ""}">
        <td><b>${time.slice(11)}</b>${isNow ? " (now)" : ""}</td>
        <td><div class="wx"><span>${wx.icon}</span><span>${wx.text}</span></div></td>
        <td><b>${round(h.temperature_2m[i])}°C</b></td>
        <td>${round(h.apparent_temperature[i])}°C</td>
        <td><span class="rainbar"><i style="width:${chance}%"></i></span>${chance}%</td>
        <td>${h.precipitation[i].toFixed(1)} mm</td>
        <td>${round(h.wind_speed_10m[i])} km/h</td>
      </tr>`);
  });
  document.getElementById("hourly-body").innerHTML = rows.join("");
}

/* ---------- Rain radar map ---------- */

let radarFrames = [];
let radarLayers = [];
let radarIndex = 0;
let radarTimer = null;
let map = null;

function initMap() {
  map = L.map("map", { zoomControl: true }).setView(YORK, 8);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 12,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
  L.marker(YORK).addTo(map).bindPopup("York");
  loadRadar();
  setInterval(loadRadar, 10 * 60 * 1000);
}

async function loadRadar() {
  try {
    const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
    const data = await res.json();
    radarLayers.forEach((layer) => map.removeLayer(layer));
    radarFrames = data.radar.past;
    radarLayers = radarFrames.map((frame) =>
      L.tileLayer(`${data.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`, {
        opacity: 0,
        maxNativeZoom: 7,
        maxZoom: 12,
        attribution: '<a href="https://www.rainviewer.com/">RainViewer</a>',
      }).addTo(map)
    );
    const slider = document.getElementById("radar-slider");
    slider.max = radarFrames.length - 1;
    showRadarFrame(radarFrames.length - 1);
    if (!radarTimer && document.getElementById("radar-play").textContent === "Pause") startRadar();
  } catch (err) {
    document.getElementById("radar-time").textContent = "Radar unavailable";
  }
}

function showRadarFrame(index) {
  radarLayers.forEach((layer, i) => layer.setOpacity(i === index ? 0.7 : 0));
  radarIndex = index;
  document.getElementById("radar-slider").value = index;
  const when = new Date(radarFrames[index].time * 1000);
  document.getElementById("radar-time").textContent = when.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
}

function startRadar() {
  radarTimer = setInterval(() => showRadarFrame((radarIndex + 1) % radarFrames.length), 700);
  document.getElementById("radar-play").textContent = "Pause";
}

function stopRadar() {
  clearInterval(radarTimer);
  radarTimer = null;
  document.getElementById("radar-play").textContent = "Play";
}

document.getElementById("radar-play").addEventListener("click", () => (radarTimer ? stopRadar() : startRadar()));
document.getElementById("radar-slider").addEventListener("input", (e) => {
  stopRadar();
  showRadarFrame(Number(e.target.value));
});

/* ---------- University buses ---------- */

const stopSelect = document.getElementById("stop-select");
const shownRoutes = new Set(["U1", "U2", "U3"]);
let busData = null;

try {
  const savedStop = localStorage.getItem("yorkStop");
  if (savedStop && [...stopSelect.options].some((o) => o.value === savedStop)) stopSelect.value = savedStop;
} catch (e) { /* storage blocked, use the default stop */ }

async function loadBuses() {
  try {
    const res = await fetch(`/api/buses?stop=${encodeURIComponent(stopSelect.value)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Bus times unavailable");
    busData = data;
    renderBuses();
  } catch (err) {
    document.getElementById("bus-body").innerHTML = `<tr><td colspan="6" class="error">${err.message}</td></tr>`;
  }
}

function minutesUntil(iso) {
  return Math.max(0, Math.round((new Date(iso) - Date.now()) / 60000));
}

function dueText(minutes) {
  if (minutes === 0) return "Due";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

function delayBadge(bus) {
  if (!bus.live) return `<span class="badge sched">Timetable only</span>`;
  const d = bus.delay_minutes;
  if (d === 0) return `<span class="badge ontime">On time</span>`;
  if (d > 0) return `<span class="badge late">${d} min late</span>`;
  return `<span class="badge early">${-d} min early</span>`;
}

function renderBuses() {
  if (!busData) return;
  const rows = busData.departures
    .filter((bus) => shownRoutes.has(bus.route))
    .filter((bus) => new Date(bus.sort_key) > Date.now() - 60000);

  const body = document.getElementById("bus-body");
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="6" class="muted">No upcoming U1, U2 or U3 buses at this stop right now.</td></tr>`;
  } else {
    body.innerHTML = rows.map((bus) => {
      const minutes = minutesUntil(bus.sort_key);
      const changed = bus.live && bus.expected !== bus.scheduled;
      return `
        <tr>
          <td><span class="route ${bus.route}">${bus.route}</span></td>
          <td>${bus.destination}</td>
          <td class="${changed ? "strike" : ""}">${bus.scheduled}</td>
          <td><b>${bus.expected || bus.scheduled}</b></td>
          <td class="due ${minutes <= 5 ? "soon" : ""}">${dueText(minutes)}</td>
          <td>${delayBadge(bus)}</td>
        </tr>`;
    }).join("");
  }
  document.getElementById("bus-updated").textContent = `Last checked ${busData.updated}.`;
}

stopSelect.addEventListener("change", () => {
  try { localStorage.setItem("yorkStop", stopSelect.value); } catch (e) { /* ignore */ }
  document.getElementById("bus-body").innerHTML = `<tr><td colspan="6" class="muted">Loading bus times…</td></tr>`;
  loadBuses();
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const route = chip.dataset.route;
    if (shownRoutes.has(route)) shownRoutes.delete(route);
    else shownRoutes.add(route);
    chip.classList.toggle("on", shownRoutes.has(route));
    renderBuses();
  });
});

/* ---------- Start ---------- */

loadWeather();
setInterval(loadWeather, 10 * 60 * 1000);
initMap();
loadBuses();
setInterval(loadBuses, 30 * 1000);
setInterval(renderBuses, 15 * 1000); // keep the "due in" countdown ticking
