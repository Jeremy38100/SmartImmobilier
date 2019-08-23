const geolib = require('geolib');const r2 = require("r2");
const elevation = require('./elevation');

const origin = {
  latitude: 45.217784,
  longitude: 5.807527
};
const projections = [];

const DISTANCE_TOTAL_M = 50000;
const OFFSET_M = 20
const MAX_BEARING = 270;
const BEARING_OFFSET = 1;
let bearing = 90;

const req = async url => {
  try {
    return await r2(url).json;
  } catch (error) {
    console.log(error);
  }
};

async function start() {
  while (bearing <= MAX_BEARING ) {
    let highestPoint = null;
    for (let i = 0; i < (DISTANCE_TOTAL_M / OFFSET_M); i++) {
      const newPoint = geolib.computeDestinationPoint(origin, OFFSET_M * (i+1), bearing);
      const altitude = await elevation(newPoint.latitude, newPoint.longitude);
      if (!highestPoint || altitude > highestPoint.altitude) {
        highestPoint = {
          latitude: newPoint.latitude,
          longitude: newPoint.longitude,
          altitude: altitude,
        }
      }
    }
    projections.push(highestPoint);
    bearing += BEARING_OFFSET;
  }
  console.log(projections.map(e => Math.round(e.altitude)).join('\n'));
}

start();
