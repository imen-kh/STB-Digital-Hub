import { importProvidersFrom } from '@angular/core';
import { Routes } from '@angular/router';
import { routes as googleMapRoutes } from './google-map-routing.module';

// third party
import { NgMapsCoreModule } from '@ng-maps/core';
import { NgMapsGoogleModule, GOOGLE_MAPS_API_CONFIG } from '@ng-maps/google';

export const routes: Routes = [
  {
    path: '',
    providers: [
      importProvidersFrom(NgMapsCoreModule, NgMapsGoogleModule),
      {
        provide: GOOGLE_MAPS_API_CONFIG,
        useValue: {
          apiKey: 'AIzaSyAChufWiMfwsmyX3Se1dRaN4t31z0xmIMo&v'
        }
      }
    ],
    children: googleMapRoutes
  }
];
