// Angular import
import { Component } from '@angular/core';

// Project imports
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

// Third party
import { NgMapsGoogleModule } from '@ng-maps/google';
import { NgMapsCoreModule } from '@ng-maps/core';

@Component({
  selector: 'app-google-map',
  imports: [CardComponent, NgMapsGoogleModule, NgMapsCoreModule],
  templateUrl: './google-map.component.html',
  styleUrl: './google-map.component.scss'
})
export class GoogleMapComponent {}
