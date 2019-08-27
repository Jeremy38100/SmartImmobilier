import { SunPositionService } from './../service/sun-position.service';
import { Component } from '@angular/core';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  constructor(private sun: SunPositionService) {
    this.getSunPositions();
  }

  async getSunPositions() {
    console.log(await this.sun.getSunPositions(
      {latitude: 45, longitude: 5},
      {year: 2019, month: 11, day: 21}
    ));
  }

}
