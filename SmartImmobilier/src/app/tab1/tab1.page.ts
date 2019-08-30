import {SunPositionService} from '../service/sun-position.service';
import {Component, OnInit} from '@angular/core';
import {icon, latLng, LeafletMouseEvent, Map, Marker, marker, Polyline, polyline, tileLayer} from 'leaflet';
import {Location} from '../../../../shared/shared.model';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {Chart} from "angular-highcharts";
import {SeriesAreaOptions, SeriesLineOptions, SeriesOptions} from "highcharts";
import {SunPosition} from "../model";

const SERIES_INDEX = {
  ELEVATION_PROFILE: 0,
  SUN: 1
};

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit {

  map: Map;
  centerPoint: Location  = {
    lat: null,
    lng: null
  };
  selectionOnMap: Location;
  isSelectPointOnMap = false;
  markerSelection: Marker;
  markerCenter: Marker;

  polylineElevationProfile: Polyline;

  options = {
    layers: [tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 })],
    zoom: 10,
    center: latLng(45.178728, 5.749591)
  };

  chart = new Chart({
    chart: {type: 'line'},
    title: {text: 'Elevation profile'},
    credits: {enabled: false}
  });

  constructor(private sun: SunPositionService,
              private http: HttpClient) {
  }

  ngOnInit(): void {
  }

  async updateElevationProfile() {
    if (this.polylineElevationProfile) this.polylineElevationProfile.remove();
    try {
      const locations: Location[] = await this.http.get(environment.API_URL +
          `/topography/elevation-profile?lat=${this.centerPoint.lat}&lng=${this.centerPoint.lng}`)
          .toPromise() as Location[];
      this.drawElevationOnMap(locations);
      this.drawElevationonChart(locations);
    } catch (e) {
      console.error(e);
    }
  }

  async drawElevationonChart(locations: Location[]) {
    this.chart.ref.series.forEach(s => {
      console.log(s.name);
      s.remove(false, false)
    });
    this.chart.addSeries(elevationSerie(locations), true, true);
    this.chart.addSeries(sunSerie(await this.sun.getSunPositions(this.centerPoint, {year: 2019, month: 6, day: 21})), true, true);
    this.chart.addSeries(sunSerie(await this.sun.getSunPositions(this.centerPoint, {year: 2019, month: 11, day: 21})), true, true);
  }

  drawElevationOnMap(locations: Location[]) {
    this.polylineElevationProfile = polyline(locations).addTo(this.map);
  }

  onMapReady(map: Map) {
    window.dispatchEvent(new Event('resize'));
    this.map = map;
    map.on('click', (e: LeafletMouseEvent) => {
      if (!this.isSelectPointOnMap) return;
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      this.selectionOnMap = { lat, lng };
      this.markerSelection = this.setMarkerLocation(this.markerSelection, {
        lat,
        lng,
        color: MarkerColor.ORANGE,
      });
    });
  }

  setMarkerLocation(marker_: Marker, builder: MarkerBuilder) {
    if (!location) return;
    if (!marker_) {
      marker_ = getMarker(builder);
      marker_.addTo(this.map);
      return marker_;
    }
    marker_.setLatLng({lat: builder.lat, lng: builder.lng});
    return marker_;
  }


  toggleSelectPointOnMap() {
    this.isSelectPointOnMap = !this.isSelectPointOnMap;
    if (!this.isSelectPointOnMap) {
      this.markerSelection.remove();
      this.markerSelection = null;
    }
  }

  validSelectionPoint() {
    if (this.selectionOnMap) {
      this.centerPoint = this.selectionOnMap;
      this.selectionOnMap = null;
      this.markerCenter = this.setMarkerLocation(this.markerCenter, this.centerPoint);
      this.updateElevationProfile();
    }
    this.toggleSelectPointOnMap();
  }
}

function sunSerie(sunPositions: SunPosition[]): SeriesLineOptions {
  return {
    type: 'line',
    name: 'Sun trajectory',
    data: sunPositions.map(s => [s.azimuth, s.angle])
  };
}

function elevationSerie(locations: Location[]): SeriesAreaOptions {
  return {
    type: 'area',
    name: 'Elevation',
    data: locations.map(l => [l.azimuth, l.angle])
  };
}

export enum MarkerColor {
  DEFAULT = 'marker-icon.png',
  ORANGE = 'marker-icon-orange.png'
}

export interface MarkerBuilder {
  lat: number;
  lng: number;
  color?: MarkerColor;
}

function getMarker(builder: MarkerBuilder): Marker {
  return marker({lat: builder.lat, lng: builder.lng}, {
    icon: icon({
      iconSize: [25, 41],
      iconAnchor: [13, 41],
      iconUrl: 'assets/markers/' + (builder.color || MarkerColor.DEFAULT),
      shadowUrl: 'assets/markers/marker-shadow.png'
    })
  });
}