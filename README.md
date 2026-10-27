# York weather & Uni Buses timetable
A website for students in York that shows the weather forecast, a live rain map, and real-time University of York bus times, all on one page.

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
- [Open-Meteo](https://open-meteo.com/) – weather forecast data
- [RainViewer](https://www.rainviewer.com/) – rain radar images
- [bustimes.org](https://bustimes.org/) – live First York bus data

# How to run it
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
4. Open **http://127.0.0.1:5050** in your browser.


# Project structure
- **app.py** – Python server: fetches weather and bus data
- **templates/index.html** – page layout
- **static/style.css** – colours, fonts and layout
- **static/app.js** – forecast, rain map and live bus board
- **requirements.txt** – Python packages needed

# Author
Artur Jakubczyk - [GitHub profile](https://github.com/ArturJakubczyk)
