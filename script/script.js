window.onload = function() {
  start();
}

async function displayChart(points, sunPositions) {
  c3.generate({
    bindto: '#chart',
    data: {
      json: points,
      keys: {
          value: ['altitude', 'angle'],
      },
      axes: {
        altitude: 'y',
        angle: 'y2',
      },
      onmouseover: overPointChart,
    },
    axis: {
      y2: { show: true }
    }
  });
  c3.generate({
    bindto: '#chart2',
    data: {
      json: points,
      keys: {
          value: ['distance', 'angle'],
      },
      axes: {
        distance: 'y',
        angle: 'y2',
      },
      onmouseover: overPointChart,
    },
    axis: {
      y2: { show: true }
    }
  });
  c3.generate({
    bindto: '#chartSun',
    data: {
      columns: [
        ['altitude'].concat(sunPositions.map(s => s.altitude)),
        ['azimuthAltitude'].concat(sunPositions.map(s => s.azimuth)),
        ['angles'].concat(points.map(p => p.angle)),
        ['azimuthAngles'].concat(points.map(p => p.azimuth))
      ],
      xs:{
        altitude:'azimuthAltitude',
        angles:'azimuthAngles',
      },
    },
  });
}

let map;
async function displayMap(points) {
  map = L.map('map').setView([45.217784, 5.807527], 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const latlngs = points.map(p => [p.latitude, p.longitude]);
  const polyline = L.polyline(latlngs, {color: 'red'}).addTo(map);
}

let points = [];
let sunPositions = [];
async function start() {
  points = await load('data.json');
  sunPositions = await load('sun.json');
  displayChart(points, sunPositions);
  displayMap(points);
}

let lastMarker = null;
function overPointChart(pointData) {
  if (lastMarker) map.removeLayer(lastMarker);
  const point = points[pointData.index];
  lastMarker = L.marker([point.latitude, point.longitude]).addTo(map);
}


function load(url) {
  return new Promise(resolve => {
    d3.json(url, resolve);
  })
}