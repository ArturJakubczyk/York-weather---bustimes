# York weather & Uni Buses timetable
A website for students in York that shows the weather forecast, a live rain map, and real-time University of York bus times, all on one page.

## 🌐 Live website: **[york-weather-bustimes.onrender.com](https://york-weather-bustimes.onrender.com/)**

[![Open the live website](https://img.shields.io/badge/Live%20website-Open%20it%20here-2ea44f?style=for-the-badge)](https://york-weather-bustimes.onrender.com/)

> The site is hosted on Render's free plan, so if nobody has visited it recently it can take around 30 seconds to wake up on the first load.

# Features
- **Current weather** – temperature, feels like, wind, chance of rain and sunset time
- **7-day forecast** – click any day to see its hour-by-hour forecast
- **Rain radar map** – animated map of rain over the last two hours
- **Live university buses** – U1, U2 and U3 only, showing:
  - timetabled and expected times
  - how many minutes until the bus arrives
  - whether it is on time, late or early
  - updates automatically every 30 seconds

# Built with
- **Python** and **Flask** – the web server
- **JavaScript, HTML and CSS** – the web page
- **Leaflet** – the interactive map
- **Gunicorn** and **[Render](https://render.com/)** – hosting the live website
- [Open-Meteo](https://open-meteo.com/) – weather forecast data
- [RainViewer](https://www.rainviewer.com/) – rain radar images
- [bustimes.org](https://bustimes.org/) – live First York bus data

# How to use it
Just open **[york-weather-bustimes.onrender.com](https://york-weather-bustimes.onrender.com/)** in any browser, on a computer or a phone. There is nothing to download or install, and any number of people can use it at the same time.

<details>
<summary>Running it on your own computer (optional, for developers)</summary>

1. Install Python 3 and download this project.
2. Open a terminal in the project folder and install the packages:
   ```bash
   python3 -m venv .venv
   .venv/bin/pip install -r requirements.txt
   ```
3. Start the website:
   ```bash
   .venv/bin/python app.py
   ```
4. Open **http://127.0.0.1:5050** in your browser. This address only works on the computer running the code; to share the website, use the live link above.

</details>

# Project structure
- **app.py** – Python server: fetches weather and bus data
- **templates/index.html** – page layout
- **static/style.css** – colours, fonts and layout
- **static/app.js** – forecast, rain map and live bus board
- **requirements.txt** – Python packages needed

# Author
Artur Jakubczyk - [GitHub profile](https://github.com/ArturJakubczyk)
