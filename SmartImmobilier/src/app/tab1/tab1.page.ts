import {SunPositionService} from '../service/sun-position.service';
import {Component, OnInit} from '@angular/core';
import {icon, latLng, LeafletMouseEvent, Map, Marker, marker, Polyline, polyline, tileLayer} from 'leaflet';
import {Location} from '../../../../shared/shared.model';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {Chart} from "angular-highcharts";
import {SeriesAreaOptions, SeriesLineOptions, SeriesOptions} from "highcharts";
import {SunPosition} from "../model";

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

  private series: SeriesOptions[] = [];

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
  isChartInit = false;

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
    this.cleanChart();
    this.addSerie(elevationSerie(locations));
    this.addSerie(sunSerie(await this.sun.getSunPositions(this.centerPoint, {year: 2019, month: 5, day: 21}), '21/6', '#ffe800'));
    this.addSerie(sunSerie(await this.sun.getSunPositions(this.centerPoint, {year: 2019, month: 11, day: 21}), '21/12', '#d7b727'));
    if (!this.isChartInit) {
      window.dispatchEvent(new Event('resize'));
      this.isChartInit = true;
    }
  }

  private cleanChart() {
    while(this.chart.ref.series.length > 0) {
      this.chart.ref.series[0].remove(true);
    }
  }

  addSerie(serie: any): void {
    this.chart.addSeries(serie, true, true);
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

function sunSerie(sunPositions: SunPosition[], name: string = 'Sun trajectory', color: string = ''): SeriesLineOptions {
  return {
    type: 'line',
    name,
    color,
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