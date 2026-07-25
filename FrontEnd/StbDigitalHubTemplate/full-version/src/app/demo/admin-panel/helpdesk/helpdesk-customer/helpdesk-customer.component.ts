// angular import
import { Component, ElementRef, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';

// rxjs import
import { Observable } from 'rxjs';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { customer } from './helpdesk-customer-type';
import { helpDeskCustomerService } from './helpdesk-customer.service';

// bootstrap import
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-helpdesk-customer',
  imports: [...SHARED_IMPORTS],
  templateUrl: './helpdesk-customer.component.html',
  styleUrl: './helpdesk-customer.component.scss',
  providers: [helpDeskCustomerService, DecimalPipe]
})
export class HelpdeskCustomerComponent {
  service = inject(helpDeskCustomerService);
  private modalService = inject(NgbModal);

  // public props
  customers$: Observable<customer[]>;
  total$: Observable<number>;

  // constructor
  constructor() {
    const service = this.service;

    this.customers$ = service.customers$;
    this.total$ = service.total$;
  }

  addCustomer(details: ElementRef) {
    this.modalService.open(details);
  }
}
