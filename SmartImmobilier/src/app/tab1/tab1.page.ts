import {SunPositionService} from '../service/sun-position.service';
import {Component, OnInit} from '@angular/core';
import {icon, latLng, LatLngExpression, Layer, LeafletMouseEvent, Map, Marker, marker, tileLayer} from 'leaflet';
import {Location} from '../../../../shared/shared.model';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit {

  map: Map;
  centerPoint: Location = {
    latitude: null,
    longitude: null
  };
  selectionOnMap: Location;
  isSelectPointOnMap = false;
  markerSelection: Marker;
  markerCenter: Marker;
  layers: Layer[] = [];

  ngOnInit(): void {
    console.log('init');
  }

  options = {
    layers: [
      tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 })
    ],
    zoom: 10,
    center: latLng(45.178728, 5.749591)
  };

  constructor(private sun: SunPositionService) {
    this.getSunPositions();
  }

  onMapReady(map: Map) {
    window.dispatchEvent(new Event('resize'));
    this.map = map;
    map.on('click', (e: LeafletMouseEvent) => {
      if (!this.isSelectPointOnMap) return;
      this.selectionOnMap = {
        latitude: e.latlng.lat,
        longitude: e.latlng.lng
      };
      this.markerSelection = this.setMarkerLocation(this.markerSelection, this.selectionOnMap, MarkerColor.ORANGE);
    });
  }

  setMarkerLocation(marker_: Marker, location: Location, color: MarkerColor = MarkerColor.DEFAULT) {
    if (!location) return;
    if (!marker_) {
      marker_ = getMarker(location, color);
      marker_.addTo(this.map);
      return marker_;
    }
    marker_.setLatLng(toLatLng(location));
    return marker_;
  }


  toggleSelectPointOnMap() {
    this.isSelectPointOnMap = !this.isSelectPointOnMap;
    if (!this.isSelectPointOnMap) {
      this.markerSelection.remove();
      this.markerSelection = null;
    }
  }

  async getSunPositions() {
    console.log(await this.sun.getSunPositions(
      {latitude: 45, longitude: 5},
      {year: 2019, month: 11, day: 21}
    ));
  }

  validSelectionPoint() {
    if (this.selectionOnMap) {
      this.centerPoint = this.selectionOnMap;
      this.selectionOnMap = null;
      this.markerCenter = this.setMarkerLocation(this.markerCenter, this.centerPoint);
    }
    this.toggleSelectPointOnMap();
  }
}
export enum MarkerColor {
  DEFAULT = 'marker-icon.png',
  ORANGE = 'marker-icon-orange.png'
}

function getMarker(location: Location | LatLngExpression, color: MarkerColor = MarkerColor.DEFAULT): Marker {
  return marker(toLatLng(location), {
    icon: icon({
      iconSize: [25, 41],
      iconAnchor: [13, 41],
      iconUrl: 'assets/markers/' + color,
      shadowUrl: 'assets/markers/marker-shadow.png'
    })
  });
}

function toLatLng(location: Location | LatLngExpression): LatLngExpression {
  return ((location as Location).latitude !== undefined)
      ? { lat: (location as Location).latitude, lng: (location as Location).longitude }
      : location as LatLngExpression;
}