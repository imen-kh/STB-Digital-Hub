// angular import
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';

// rxjs import
import { Observable } from 'rxjs';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { InvoiceList } from './invoice-list-type';
import { InvoiceListService } from './invoice-list.service';

@Component({
  selector: 'app-invoice-list-table',
  imports: [...SHARED_IMPORTS],
  templateUrl: './invoice-list-table.component.html',
  styleUrl: './invoice-list-table.component.scss',
  providers: [InvoiceListService, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceListTableComponent {
  service = inject(InvoiceListService);

  // public props
  invoices$: Observable<InvoiceList[]>;
  total$: Observable<number>;

  // constructor
  constructor() {
    const service = this.service;

    this.invoices$ = service.invoices$;
    this.total$ = service.total$;
  }
}
