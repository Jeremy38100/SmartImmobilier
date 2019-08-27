const {performance} = require('perf_hooks');
const geolib = require('geolib');
const elevation = require('./elevation');
const fs = require('fs');

const origin = {
  latitude: 45.217784,
  longitude: 5.807527
};

const DISTANCE_TOTAL_M = 50000;
const OFFSET_M = 10
const MIN_BEARING = 0;
const MAX_BEARING = 360;
const BEARING_OFFSET = 1;

async function start() {

  origin.altitude = await elevation(origin.latitude, origin.longitude);
  const t0 = performance.now();
  const bearings = getBearings();
  remaining = bearings.length;
  Promise.all(bearings.map(highestPointInBearing))
    .then(projections => {
      const t1 = performance.now();
      console.log((t1 - t0) + " ms.")
      fs.writeFileSync('data.json', JSON.stringify(projections));
    })
    .catch(err => {
      console.log(err);
    })
}

function getBearings() {
  const bearings = [];
  let bearing = MIN_BEARING;
  while (bearing <= MAX_BEARING) {
    bearings.push(bearing)
    bearing += BEARING_OFFSET;
  }
  return bearings;
}

function highestPointInBearing(bearing) {
  return new Promise(async resolve => {
    let highestPoint = null;
    for (let i = 1; i < (DISTANCE_TOTAL_M / OFFSET_M); i++) {
      const distance = OFFSET_M * i;
      const newPoint = geolib.computeDestinationPoint(origin, distance, bearing);

      let altitude = Math.round(await elevation(newPoint.latitude, newPoint.longitude));
      let angle = getAngle(altitude - origin.altitude, distance) * 180/Math.PI;
      if (angle < 0) angle = 0;

      if (!highestPoint || angle > highestPoint.angle) {
        highestPoint = {
          latitude: newPoint.latitude,
          longitude: newPoint.longitude,
          altitude,
          angle,
          distance,
          azimuth: bearing
        }
      }
    }
    resolve(highestPoint);
  });
}

function getAngle(height, distance) { return Math.atan(height / distance); }

start();
