import { SunPositionService } from './../service/sun-position.service';
import { Component, OnInit } from '@angular/core';
import { tileLayer, latLng, Map } from 'leaflet';
import { Chart } from 'angular-highcharts';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit {

  map: Map;
  chart = new Chart({
    chart: {
      type: 'line'
    },
    title: {
      text: 'Linechart'
    },
    credits: {
      enabled: false
    }
  });

  constructor(private sun: SunPositionService,
              private http: HttpClient) {
    this.getSunPositions();
    this.getElevationProfile();
  }

  async getElevationProfile() {
    console.log(await this.http.get('api/topography/elevation-profile?latitude=45&longitude=5').toPromise());
  }

  async ngOnInit() {
    console.log('init');
    const sunPositions = await this.sun.getSunPositions(
      {latitude: 45, longitude: 5},
      {year: 2019, month: 11, day: 21}
    );
    // this.chart.addSeries({
    //     name: 'sun',
    //     data: sunPositions.map(sunP => { return { x: sunP.azimuth, y: sunP.altitude }; })
    // });
  }

  add() {
    this.chart.addPoint(Math.floor(Math.random() * 10));
  }

  options = {
    layers: [
      tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' })
    ],
    zoom: 10,
    center: latLng(45.178728, 5.749591)
  };


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
