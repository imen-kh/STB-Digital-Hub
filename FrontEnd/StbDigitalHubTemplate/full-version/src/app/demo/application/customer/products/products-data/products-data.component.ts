// angular import
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

// third party
import { TagInputModule } from 'ngx-chips';

@Component({
  selector: 'app-products-data',
  imports: [CommonModule, TagInputModule, ...SHARED_IMPORTS],
  templateUrl: './products-data.component.html',
  styleUrl: './products-data.component.scss'
})
export class ProductsDataComponent {
  // public props
  autocompleteItems = ['Alabama', 'Wyoming', 'Henry Die', 'John Doe'];

  dataProduct = [
    {
      type: 'text',
      title: 'Price*'
    },
    {
      type: 'text',
      title: 'Discount*'
    },
    {
      type: 'text',
      title: 'Quantity*'
    },
    {
      type: 'text',
      title: 'Brand*'
    },
    {
      type: 'text',
      title: 'Weight*'
    },
    {
      type: 'text',
      title: 'Extra Shipping Free*'
    }
  ];
}
