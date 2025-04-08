# Random Map Explorer

This application randomly explores a map, starting from China, and zooms in gradually until it reaches a detailed view (less than 1 kilometer scale).

## Features

- Initializes with a map centered on China
- Clicking "Start" begins the random exploration
- The application randomly selects a point in the visible area and zooms in
- This process repeats until reaching approximately 1 kilometer scale
- The exploration can be stopped at any time

## Setup

1. Clone this repository
2. Get an API key from [Gaode Maps (AMap)](https://lbs.amap.com/)
3. Replace `YOUR_AMAP_KEY` in the `index.html` file with your actual API key
4. Open `index.html` in a web browser

## Usage

1. Open the application in a web browser
2. Click the "Start" button to begin exploration
3. The map will automatically zoom into random locations
4. Click "Stop" at any time to pause the exploration
5. Click "Start" again to resume

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Gaode Maps (AMap) API 