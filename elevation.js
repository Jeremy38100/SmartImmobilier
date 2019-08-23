const TileSet = require('node-hgt').TileSet
const ImagicoElevationDownloader = require('node-hgt').ImagicoElevationDownloader
const tileDirectory = process.env.TILE_DIRECTORY || './data'
const tileDownloader = process.env.TILE_DOWNLOADER === 'none'
  ? tileDownloader = undefined
  : new ImagicoElevationDownloader(tileDirectory)
const tiles = new TileSet(tileDirectory, {downloader:tileDownloader});


module.exports = (lat, lng) => {
  return new Promise((resolve, reject) => {
    tiles.getElevation([lat, lng], function(err, elevation) {
        if (err) reject(err);
        resolve(elevation);
    });
  });
}



