import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Country } from './table-config/country';
import { CountryService } from './/table-config/country.service';
import { FormsModule } from '@angular/forms';
import { NgbHighlight, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-ng-table',
  imports: [DecimalPipe, FormsModule, AsyncPipe, NgbHighlight, NgbPaginationModule, ...SHARED_IMPORTS],
  templateUrl: './ng-table.component.html',
  styleUrl: './ng-table.component.scss',
  providers: [CountryService, DecimalPipe]
})
export class NgTableComponent {
  service = inject(CountryService);

  countries$: Observable<Country[]>;
  total$: Observable<number>;

  constructor() {
    const service = this.service;

    this.countries$ = service.countries$;
    this.total$ = service.total$;
  }
}
