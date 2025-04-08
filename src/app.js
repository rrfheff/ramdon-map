document.addEventListener("DOMContentLoaded", () => {
  // Initialize variables
  let map;
  let isRunning = false;
  let finished = false;
  let zoomLevel = 4.6; // 开始ing zoom level for China
  const targetZoom = 13; // Target zoom level (approximately < 1km scale)
  const chinaCenter = [105.0, 37.0]; // Approximate center of China
  let chinaBoundary; // China boundary polygon

  // Initialize map
  function initMap() {
    map = new AMap.Map("mapContainer", {
      zoom: zoomLevel,
      center: chinaCenter,
      viewMode: "3D",
    });

    // Add zoom control
    map.plugin(["AMap.Scale"], function () {
      const scale = new AMap.Scale();
      map.addControl(scale);
    });

    // Load China boundary
    loadChinaBoundary();
  }

  // Load China boundary data
  function loadChinaBoundary() {
    AMap.plugin("AMap.DistrictSearch", function () {
      const districtSearch = new AMap.DistrictSearch({
        level: "country",
        subdistrict: 0,
        extensions: "all",
      });

      districtSearch.search("中国", function (status, result) {
        if (status === "complete") {
          const boundaries = result.districtList[0].boundaries;
          if (boundaries) {
            for (var i = 0; i < boundaries.length; i += 1) {//构造MultiPolygon的path
                boundaries[i] = [boundaries[i]]
            }
            chinaBoundary = new AMap.Polygon({
              path: boundaries,
              fillOpacity: 0,
              strokeOpacity: 0,
              bubble: true,
            });

            map.add(chinaBoundary);
            map.setFitView(chinaBoundary);
          }
        }
      });
    });
  }

  // Check if a point is within China's boundaries
  function isPointInChina(point) {
    // Get all paths from the polygon
    const paths = chinaBoundary.getPath();

    // If there's a single path, check directly
    if (!Array.isArray(paths[0])) {
      return AMap.GeometryUtil.isPointInRing(point, paths);
    }

    // For multiple polygons, check if the point is in any of them
    for (let i = 0; i < paths.length; i++) {
      if (AMap.GeometryUtil.isPointInRing(point, paths[i])) {
        return true;
      }
    }

    return false;
  }

  // Get a random point within the current map view
  function getRandomPointInView() {
    const bounds = map.getBounds();
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();

    const lngSpan = northEast.lng - southWest.lng;
    const latSpan = northEast.lat - southWest.lat;

    let randomPoint;
    let attempts = 0;
    const maxAttempts = 10;

    // Try to find a point within China
    do {
      const randomLng = southWest.lng + lngSpan * Math.random();
      const randomLat = southWest.lat + latSpan * Math.random();
      randomPoint = [randomLng, randomLat];
      attempts++;
    } while (!isPointInChina(randomPoint) && attempts < maxAttempts);

    // If we couldn't find a point in China after max attempts, return China's center
    if (attempts >= maxAttempts && !isPointInChina(randomPoint)) {
      return chinaCenter;
    }

    return randomPoint;
  }

  // Perform a single random zoom step
  function performRandomZoom() {
    if (!isRunning) return;

    // Get current zoom level
    zoomLevel = map.getZoom();

    // Check if we've reached the target zoom level
    if (zoomLevel >= targetZoom) {
      isRunning = false;
      finished = true;
      document.getElementById("startButton").textContent = "重新开始";
      return;
    }

    // Get a random point and zoom to it
    const randomPoint = getRandomPointInView();

    // Pan and zoom to the random point
    map.setZoomAndCenter(zoomLevel + 2, randomPoint, false, 1000);

    // Schedule the next zoom after animation completes
    setTimeout(performRandomZoom, 1500);
  }

  // Function to reset the map to initial view
  function resetMapView() {
    // Reset to initial zoom and center
    map.setZoomAndCenter(4.6, chinaCenter, false);
  }

  // Start button click handler
  function handleStartClick() {
    if (!chinaBoundary) return;
    if (finished) {
      resetMapView();
      finished = false;
      document.getElementById("startButton").textContent = "开始";
      return;
    }
    if (isRunning) {
      // Stop the exploration
      isRunning = false;
      document.getElementById("startButton").textContent = "开始";
    } else {
      isRunning = true;
      document.getElementById("startButton").textContent = "停止";
      performRandomZoom();
    }
  }

  // Initialize the application
  initMap();
  document
    .getElementById("startButton")
    .addEventListener("click", handleStartClick);
});
