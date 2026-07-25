// Angular import
import { AsyncPipe, DecimalPipe, CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

// rxjs library
import { Observable } from 'rxjs';

// bootstrap import
import { NgbPaginationModule, NgbTooltipModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';

// project import
import { orderList } from './order-list.config/order-list';
import { OrderListService } from './order-list.config/order-list.service';

@Component({
  selector: 'app-order-list',
  imports: [FormsModule, AsyncPipe, NgbTypeaheadModule, NgbPaginationModule, CommonModule, NgbTooltipModule, ...SHARED_IMPORTS],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.scss',
  providers: [OrderListService, DecimalPipe]
})
export class OrderListComponent {
  service = inject(OrderListService);

  orderList$!: Observable<orderList[]>;
  total$!: Observable<number>;

  closeResult!: string;

  constructor() {
    const service = this.service;

    this.orderList$ = service.orderList$;
    this.total$ = service.total$;
  }
}
