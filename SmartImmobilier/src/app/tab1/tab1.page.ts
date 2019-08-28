import { SunPositionService } from './../service/sun-position.service';
import { Component, OnInit } from '@angular/core';
import { tileLayer, latLng, Map } from 'leaflet';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit {

  map: Map;

  ngOnInit(): void {
    console.log('init');
  }

  options = {
    layers: [
      tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' })
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
    map.on('click', (e) => { console.log(e); });
  }

  async getSunPositions() {
    console.log(await this.sun.getSunPositions(
      {latitude: 45, longitude: 5},
      {year: 2019, month: 11, day: 21}
    ));
  }
}
