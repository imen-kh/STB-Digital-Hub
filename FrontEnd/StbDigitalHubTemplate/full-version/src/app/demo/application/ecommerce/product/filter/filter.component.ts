// angular import
import { Component } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-filter',
  imports: [...SHARED_IMPORTS],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss'
})
export class FilterComponent {
  // public props
  generaliIsCollapsed = false;
  categoriesIsCollapsed = false;
  colorICollapsed = false;
  priceIsCollapsed = false;
  ratingIsCollapsed = false;

  // public method
  genders = [
    {
      type: 'Male'
    },
    {
      type: 'Female'
    },
    {
      type: 'Kids'
    }
  ];

  categories = [
    {
      type: 'All'
    },
    {
      type: 'Electronics'
    },
    {
      type: 'Fashion'
    }
  ];

  categories2 = [
    {
      type: 'Kitchen'
    },
    {
      type: 'Books'
    },
    {
      type: 'Toys'
    }
  ];

  Colors = [
    {
      type: 'text-primary'
    },
    {
      type: 'text-secondary'
    },
    {
      type: 'text-danger'
    },
    {
      type: 'text-success'
    },
    {
      type: 'text-warning'
    },
    {
      type: 'text-info'
    },
    {
      type: 'text-dark'
    }
  ];

  prices = [
    {
      type: 'Below $10'
    },
    {
      type: '$50 - $100'
    },
    {
      type: '$150 - $200'
    }
  ];

  prices2 = [
    {
      type: '$10 - $50'
    },
    {
      type: '$100 - $150'
    },
    {
      type: 'Over $200'
    }
  ];

  ratings = [
    {
      type: '4'
    },
    {
      type: '3'
    },
    {
      type: '2'
    },
    {
      type: '1'
    }
  ];
}
