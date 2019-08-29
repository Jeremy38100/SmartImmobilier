export interface SunPosition {
  altitude: number; // degree
  azimuth: number; // degree 0=N 90=E
  minutes: number; // time in the day
}

export interface Day {
  year: number;
  month: number; // 0=JAN
  day: number;
}