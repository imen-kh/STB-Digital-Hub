// project import
import { AsyncPipe, DecimalPipe, CommonModule } from '@angular/common';
import { Component, TemplateRef, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// bootstrap import
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

// rxjs import
import { Observable } from 'rxjs';

// project import
import { product } from './product.config/product';
import { ProductDataService } from './product.config/product-data.service';
import { ProductsDataComponent } from './products-data/products-data.component';
import { ScrollbarComponent } from 'src/app/theme/shared/components/scrollbar/scrollbar.component';

@Component({
  selector: 'app-products',
  imports: [FormsModule, ...SHARED_IMPORTS, AsyncPipe, CommonModule, RouterModule, ProductsDataComponent, ScrollbarComponent],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
  providers: [ProductDataService, DecimalPipe]
})
export class ProductsComponent {
  service = inject(ProductDataService);
  private offcanvasService = inject(NgbOffcanvas);

  product$: Observable<product[]>;
  total$: Observable<number>;

  closeResult!: string;

  // constructor
  constructor() {
    const service = this.service;

    this.product$ = service.product$;
    this.total$ = service.total$;
  }

  // public method
  productData(content: TemplateRef<string>) {
    this.offcanvasService.open(content, { position: 'end' });
  }
}
