import { SunPosition, LatLng, Day } from './../model';
import * as SunCalc from 'suncalc'
import { Injectable } from '@angular/core';

function radToDegree(rad: number): number { return rad * 180 / Math.PI; }

const MINUTES_IN_DAY = 24*60;


@Injectable({
  providedIn: 'root'
})
export class SunPositionService {

  constructor() { }


  private getHours(day: Day, offsetMinutes: number = 1): Date[] {
    const timepoints: Date[] = [];
    const date = Date.UTC(day.year, day.month, day.day);
    let minutes = 0;
    while (minutes < MINUTES_IN_DAY) {
      timepoints.push(new Date(date + (minutes*60*1000)));
      minutes += offsetMinutes;
    }
    return timepoints;
  }

  // month 0 is JAN
  getSunPositions(origin: LatLng, day: Day): Promise<SunPosition[]> {
    return new Promise<SunPosition[]>(resolve => {
      resolve(this.getHours(day).map(timepoint => {
        const position = SunCalc.getPosition(timepoint, origin.latitude, origin.longitude)
        return {
          altitude: Math.max(0, radToDegree(position.altitude)),
          azimuth: radToDegree(position.azimuth + Math.PI),
          minutes: timepoint.getHours()*60 + timepoint.getMinutes()
        }
      }));
    })
  }
}
