document.addEventListener("DOMContentLoaded", () => {
  // Initialize variables
  let map;
  let isRunning = false;
  let finished = false;
  let zoomLevel = 4.6; // 开始ing zoom level for China
  const targetZoom = 13; // Target zoom level (approximately < 1km scale)
  const chinaCenter = [105.0, 37.0]; // Approximate center of China
  let chinaBoundary; // China boundary polygon
  let currentMode = "random"; // Default mode: random
  let cityLevel = "big"; // Default city level: big cities

  // List of Chinese cities with their coordinates [lng, lat] and level
  const chineseCities = [
    // Big cities (provincial capitals and municipalities)
    { name: "北京", location: [116.4074, 39.9042], level: "big" },
    { name: "上海", location: [121.4737, 31.2304], level: "big" },
    { name: "广州", location: [113.2644, 23.1291], level: "big" },
    { name: "深圳", location: [114.0579, 22.5431], level: "big" },
    { name: "成都", location: [104.0668, 30.5728], level: "big" },
    { name: "西安", location: [108.9402, 34.3416], level: "big" },
    { name: "杭州", location: [120.2052, 30.2507], level: "big" },
    { name: "南京", location: [118.7969, 32.0603], level: "big" },
    { name: "武汉", location: [114.3055, 30.5928], level: "big" },
    { name: "重庆", location: [106.5516, 29.5630], level: "big" },
    { name: "天津", location: [117.1907, 39.1215], level: "big" },
    { name: "哈尔滨", location: [126.6424, 45.7571], level: "big" },
    { name: "乌鲁木齐", location: [87.6168, 43.8256], level: "big" },
    { name: "拉萨", location: [91.1710, 29.6500], level: "big" },
    
    // Medium-sized cities
    { name: "苏州", location: [120.5853, 31.2989], level: "small" },
    { name: "青岛", location: [120.3826, 36.0671], level: "small" },
    { name: "大连", location: [121.6147, 38.9140], level: "small" },
    { name: "宁波", location: [121.5440, 29.8683], level: "small" },
    { name: "厦门", location: [118.0894, 24.4798], level: "small" },
    { name: "济南", location: [117.1205, 36.6510], level: "small" },
    { name: "福州", location: [119.2965, 26.0745], level: "small" },
    { name: "珠海", location: [113.5767, 22.2708], level: "small" },
    { name: "烟台", location: [121.4479, 37.4638], level: "small" },
    { name: "威海", location: [122.1200, 37.5129], level: "small" },
    { name: "海口", location: [110.1998, 20.0440], level: "small" },
    { name: "三亚", location: [109.5082, 18.2478], level: "small" },
    
    // County-level cities and towns
    { name: "丽江", location: [100.2339, 26.8768], level: "county" },
    { name: "景德镇", location: [117.1781, 29.2690], level: "county" },
    { name: "阳朔", location: [110.4966, 24.7793], level: "county" },
    { name: "敦煌", location: [94.6616, 40.1421], level: "county" },
    { name: "平遥", location: [112.1754, 37.2031], level: "county" },
    { name: "周庄", location: [120.8519, 31.1155], level: "county" },
    { name: "婺源", location: [117.8614, 29.2483], level: "county" },
    { name: "阆中", location: [105.9751, 31.5584], level: "county" },
    { name: "凤凰", location: [109.6141, 27.9534], level: "county" },
    { name: "乌镇", location: [120.4941, 30.7443], level: "county" },
    { name: "西塘", location: [120.8849, 30.9445], level: "county" },
    { name: "张家界", location: [110.4791, 29.1274], level: "county" }
  ];

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
    
    // Setup UI event handlers
    setupUIHandlers();
  }
  
  // Setup UI event handlers
  function setupUIHandlers() {
    // Mode selector change handler
    document.getElementById("modeSelector").addEventListener("change", function() {
      currentMode = this.value;
      
      // Show/hide city level selector based on mode
      const cityLevelContainer = document.getElementById("cityLevelContainer");
      if (currentMode === "cities") {
        cityLevelContainer.style.display = "inline-block";
      } else {
        cityLevelContainer.style.display = "none";
      }
    });
    
    // City level selector change handler
    document.getElementById("cityLevelSelector").addEventListener("change", function() {
      cityLevel = this.value;
    });
    
    // Start button handler
    document.getElementById("startButton").addEventListener("click", handleStartClick);
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
    if (currentMode === "cities") {
      // Filter cities based on selected level
      const filteredCities = chineseCities.filter(city => city.level === cityLevel);
      
      // If no cities match the filter (unlikely), use all cities
      const citiesToUse = filteredCities.length > 0 ? filteredCities : chineseCities;
      
      // Pick a random city from the filtered list
      const randomCity = citiesToUse[Math.floor(Math.random() * citiesToUse.length)];
      return randomCity.location;
    }

    // For random mode, use existing behavior
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

  // Handle mode change
  function handleModeChange() {
    currentMode = document.getElementById("modeSelector").value;
  }

  // Start button click handler
  function handleStartClick() {
    if (!chinaBoundary) return;
    if (finished) {
      map.setFitView(chinaBoundary);
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
});
