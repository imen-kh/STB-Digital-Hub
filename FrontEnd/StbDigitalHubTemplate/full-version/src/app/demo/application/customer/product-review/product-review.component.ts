// Angular import
import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

// rxjs import
import { Observable } from 'rxjs';

// project import
import { productReview } from './product-review.config/product-review';
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ProductReviewService } from './product-review.config/product-review.service';

// bootstrap import
import { NgbPaginationModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-product-review',
  imports: [CommonModule, ...SHARED_IMPORTS, NgbPaginationModule, NgbTypeaheadModule],
  templateUrl: './product-review.component.html',
  styleUrl: './product-review.component.scss',
  providers: [ProductReviewService, DecimalPipe]
})
export class ProductReviewComponent {
  service = inject(ProductReviewService);

  productReview$: Observable<productReview[]>;
  total$: Observable<number>;

  closeResult!: string;

  // constructor
  constructor() {
    const service = this.service;

    this.productReview$ = service.productReview$;
    this.total$ = service.total$;
  }
}
