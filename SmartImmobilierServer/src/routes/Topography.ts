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
    if (params.lat === undefined) throw new Error('Missing lat');
    if (params.lng === undefined) throw new Error('Missing lng');

    const origin: Location = {
      lat: Number(params.lat),
      lng: Number(params.lng)
    };
    await setElevation(origin);

    const azimuthsOptions: AzimuthsOptions = {
      azimuthMin: params.azimuthMin | 0,
      azimuthMax: params.azimuthMax | 360,
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
    lat: 0,
    lng: 0,
    azimuth
  };
  for (let i = 1; i < (options.distanceMax / options.distanceOffset); i++) {
    const distance: number = options.distanceOffset * i;
    const computedLocation = geolib.computeDestinationPoint(options.origin, distance, azimuth);
    const currentLocation: Location = {
      lat: computedLocation.latitude,
      lng: computedLocation.longitude,
      alt: computedLocation.elevation,
      azimuth
    }

    await setElevation(currentLocation);
    currentLocation.angle = angle(currentLocation.alt! - options.origin.alt!, distance);
    if (currentLocation.angle < 0) currentLocation.angle = 0;

    if (!highestPoint.angle || currentLocation.angle > highestPoint.angle!) {
      highestPoint = currentLocation;
    }
  }
  return highestPoint;
}

function setElevation(location: Location): Promise<Location> {
  return new Promise((resolve, reject) => {
    tiles.getElevation([location.lat, location.lng],
      function(err: any, alt: number) {
        if (err) {
          reject(err);
        }
        location.alt = Math.round(alt);
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
