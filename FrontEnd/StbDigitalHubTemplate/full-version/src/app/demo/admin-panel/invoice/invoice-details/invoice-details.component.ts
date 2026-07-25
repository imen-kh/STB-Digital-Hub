// angular import
import { Component, effect, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

// third party
import { NgxPrintModule } from 'ngx-print';
import { LogoComponent } from 'src/app/theme/shared/components/logo/logo.component';
import { ConfigService } from 'src/app/theme/shared/service/config.service';

@Component({
  selector: 'app-invoice-details',
  imports: [...SHARED_IMPORTS, RouterModule, NgxPrintModule, LogoComponent],
  templateUrl: './invoice-details.component.html',
  styleUrl: './invoice-details.component.scss'
})
export class InvoiceDetailsComponent {
  private configService = inject(ConfigService);

  // public props
  darkTheme: boolean = false;

  // constructor
  constructor() {
    effect(() => {
      this.isDarkTheme(this.configService.isDarkMode());
    });
  }

  // private method
  private isDarkTheme(isDark: boolean) {
    this.darkTheme = isDark;
  }

  // public methods
  detailsIcons = [
    {
      icon: 'ph-pencil-simple-line',
      link: '/invoice/edit'
    },
    {
      icon: 'ph-printer'
    },
    {
      icon: 'ph-share-network'
    }
  ];

  address = [
    {
      type: 'Form',
      name: 'Garcia-Cameron and Sons',
      street: '8534 Saunders Hill Apt. 583',
      phone: '(970) 982-3353',
      email: 'brandon07@pierce.com'
    },
    {
      type: 'To',
      name: 'Dickinson-Cummerata',
      street: '55D Leatha Way Ernaburgh, NT 2146',
      phone: '75-9079921',
      email: 'kasandra.conn@borer.com'
    }
  ];

  products = [
    {
      id: 1,
      name: 'Mauris',
      description: 'Malesuada adipiscing',
      qty: 2,
      price: 80.0
    },
    {
      id: 2,
      name: 'Vitae',
      description: 'Hac egestas',
      qty: 3,
      price: 40.0
    },
    {
      id: 3,
      name: 'Mauris',
      description: 'Malesuada adipiscing',
      qty: 4,
      price: 80.0
    }
  ];
}
