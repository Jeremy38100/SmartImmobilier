import { AzimuthsOptions } from './Topography';
import { Location } from './../../../shared/shared.model';
import { logger } from '@shared';
import { Request, Response, Router } from 'express';
import { BAD_REQUEST, OK } from 'http-status-codes';

const geolib = require('geolib');
const TileSet = require('node-hgt').TileSet
const ImagicoElevationDownloader = require('node-hgt').ImagicoElevationDownloader
const tileDirectory = process.env.TILE_DIRECTORY || './data'
const tileDownloader = process.env.TILE_DOWNLOADER === 'none'
  ? undefined
  : new ImagicoElevationDownloader(tileDirectory)
const tiles = new TileSet(tileDirectory, {downloader:tileDownloader});

// Init shared
const router = Router();

router.get('/elevation-profile', async (req: Request, res: Response) => {
  try {

    const params = req.query;
    if (params.latitude === undefined) throw new Error('Missing latitude');
    if (params.longitude === undefined) throw new Error('Missing longitude');

    const origin: Location = {
      latitude: Number(params.latitude),
      longitude: Number(params.longitude)
    };
    await setElevation(origin);

    const azimuthsOptions: AzimuthsOptions = {
      azimuthMin: params.azimuthMin | 90,
      azimuthMax: params.azimuthMax | 270,
      azimuthOffset: params.azimuthOffset | 2
    };

    const highestPointInAzimuthOptions: HighestPointInAzimuthOptions = {
      distanceMax: params.distanceMax | 25000,
      distanceOffset: params.distanceOffset | 100,
      origin
    };

    const data = await Promise.all(getAzimuths(azimuthsOptions).map(azimuth => {
      return highestPointInAzimuth(azimuth, highestPointInAzimuthOptions);
    }));
    return res.status(OK).json(data);

  } catch (err) {
    logger.error(err.message, err);
    return res.status(BAD_REQUEST).json({
      error: err.message,
    });
  }
});

export interface AzimuthsOptions {
  azimuthMin: number;
  azimuthMax: number;
  azimuthOffset: number;
}

export interface HighestPointInAzimuthOptions {
  distanceMax: number;
  distanceOffset: number;
  origin: Location;
}

function getAzimuths(options: AzimuthsOptions): number[] {
  const azimuths: number[] = [];
  let azimuth = options.azimuthMin;
  while (azimuth <= options.azimuthMax) {
    azimuths.push(azimuth)
    azimuth += options.azimuthOffset;
  }
  return azimuths;
}

async function highestPointInAzimuth(azimuth: number, options: HighestPointInAzimuthOptions): Promise<Location> {
  let highestPoint: Location = {
    latitude: 0,
    longitude: 0
  };
  for (let i = 1; i < (options.distanceMax / options.distanceOffset); i++) {
    const distance: number = options.distanceOffset * i;
    const currentLocation: Location = geolib.computeDestinationPoint(options.origin, distance, azimuth) as Location;

    await setElevation(currentLocation);
    currentLocation.angle = angle(currentLocation.elevation! - options.origin.elevation!, distance);
    if (currentLocation.angle < 0) currentLocation.angle = 0;

    if (!highestPoint.angle || currentLocation.angle > highestPoint.angle!) {
      highestPoint = currentLocation;
    }
  }
  return highestPoint;
}

function setElevation(location: Location): Promise<Location> {
  return new Promise((resolve, reject) => {
    tiles.getElevation([location.latitude, location.longitude],
      function(err: any, elevation: number) {
        if (err) {
          reject(err);
        }
        location.elevation = Math.round(elevation);
        resolve(location);
    });
  });
}

function angle(height: number, distance: number): number {
  return radToDeg(Math.atan(height / distance));
}

function radToDeg(rad: number): number {
  return rad * 180 / Math.PI;
}

export default router;
