const {performance} = require('perf_hooks');
const geolib = require('geolib');
const elevation = require('./elevation');
const SunCalc = require('suncalc');
const fs = require('fs');

const origin = {
  latitude: 45.217784,
  longitude: 5.807527
};

const DISTANCE_TOTAL_M = 50000;
const OFFSET_M = 50
const MIN_BEARING = 45;
const MAX_BEARING = 360-45;
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


// Sun
function getHours(year, month, day) {
  const hours = [];
  const date = Date.UTC(year, month, day);
  const DAY = 24*60;
  const OFFSET_MIN = 30;
  let minutes = 0;
  while (minutes < DAY) {
    hours.push(new Date(date + (minutes*60*1000)));
    minutes += OFFSET_MIN;
  }
  return hours;
}

let sunPositions = getHours(2019,5,21).map(date => {
  const position = SunCalc.getPosition(date, origin.latitude, origin.longitude)
  return {
    altitude: Math.max(0, position.altitude * 180/Math.PI),
    azimuth: (position.azimuth + Math.PI) * 180/Math.PI,
    minutes: date.getHours()*60 + date.getMinutes()
  }
})

fs.writeFileSync('sun.json', JSON.stringify(sunPositions));

start();
