// angular import
import { Component, TemplateRef, effect, inject } from '@angular/core';

import { Router } from '@angular/router';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { FilterComponent } from './filter/filter.component';
import { PlaceholderCard3Component } from 'src/app/theme/shared/components/placeholder-card/placeholder-3.component';
import { BerryDefaultConfig } from 'src/app/app-config';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { ScrollbarComponent } from 'src/app/theme/shared/components/scrollbar/scrollbar.component';

// bootstrap import
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-product',
  imports: [...SHARED_IMPORTS, FilterComponent, PlaceholderCard3Component, ScrollbarComponent],
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss'
})
export class ProductComponent {
  private offcanvasService = inject(NgbOffcanvas);
  router = inject(Router);
  private configService = inject(ConfigService);
  isBox = BerryDefaultConfig.isBox_container;

  constructor() {
    effect(() => {
      this.rerenderChartOnContainerResize(this.configService.isBox_container());
    });
  }

  private rerenderChartOnContainerResize(boxValue: boolean) {
    this.isBox = boxValue;
  }

  // public props
  isCollapsed = false;

  // public method
  products = [
    {
      img: 'assets/images/application/prod-img-1.jpg',
      name: 'Earl Garrett',
      des: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt',
      price: '$12.99',
      mrp: '$15.99',
      rating: '(12.99+)',
      star: 'fas fa-star',
      star1: 'far fa-star',
      halfstar: 'fas fa-star-half-alt'
    },
    {
      img: 'assets/images/application/prod-img-2.jpg',
      name: 'Samuel Hampton',
      des: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt',
      price: '$12.99',
      mrp: '$15.99',
      rating: '(12.99+)',
      star: 'fas fa-star',
      star1: 'far fa-star',
      halfstar: 'fas fa-star-half-alt'
    },
    {
      img: 'assets/images/application/prod-img-3.jpg',
      name: 'Jimmy Morton',
      des: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt',
      price: '$29.99',
      mrp: '$36.00',
      rating: '(12.99+)',
      star: 'fas fa-star',
      star1: 'far fa-star',
      halfstar: 'fas fa-star-half-alt'
    },
    {
      img: 'assets/images/application/prod-img-4.jpg',
      name: 'Jimmy Morton',
      des: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt',
      price: '$49.99',
      mrp: '$85.00',
      rating: '(12.99+)',
      star: 'fas fa-star',
      star1: 'far fa-star',
      halfstar: 'fas fa-star-half-alt'
    },
    {
      img: 'assets/images/application/prod-img-5.jpg',
      name: 'Earl Garrett',
      des: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt',
      price: '$12.99',
      mrp: '$15.99',
      rating: '(12.99+)',
      star: 'fas fa-star',
      star1: 'far fa-star',
      halfstar: 'fas fa-star-half-alt'
    },
    {
      img: 'assets/images/application/prod-img-6.jpg',
      name: 'Samuel Hampton',
      des: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt',
      price: '$12.99',
      mrp: '$15.99',
      rating: '(12.99+)',
      star: 'fas fa-star',
      star1: 'far fa-star',
      halfstar: 'fas fa-star-half-alt'
    },
    {
      img: 'assets/images/application/prod-img-7.jpg',
      name: 'Jimmy Morton',
      des: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt',
      price: '$29.99',
      mrp: '$36.00',
      rating: '(12.99+)',
      star: 'fas fa-star',
      star1: 'far fa-star',
      halfstar: 'fas fa-star-half-alt'
    },
    {
      img: 'assets/images/application/prod-img-8.jpg',
      name: 'Jimmy Morton',
      des: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt',
      price: '$49.9',
      mrp: '$85.00',
      rating: '(12.99+)',
      star: 'fas fa-star',
      star1: 'far fa-star',
      halfstar: 'fas fa-star-half-alt'
    },
    {
      img: 'assets/images/application/prod-img-1.jpg',
      name: 'Earl Garrett',
      des: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt',
      price: '$12.99',
      mrp: '$15.99',
      rating: '(12.99+)',
      star: 'fas fa-star',
      star1: 'far fa-star',
      halfstar: 'fas fa-star-half-alt'
    },
    {
      img: 'assets/images/application/prod-img-2.jpg',
      name: 'Samuel Hampton',
      des: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt',
      price: '$12.99',
      mrp: '$15.99',
      rating: '(12.99+)',
      star: 'fas fa-star',
      star1: 'far fa-star',
      halfstar: 'fas fa-star-half-alt'
    },
    {
      img: 'assets/images/application/prod-img-3.jpg',
      name: 'Jimmy Morton',
      des: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt',
      price: '$29.99',
      mrp: '$36.00',
      rating: '(12.99+)',
      star: 'fas fa-star',
      star1: 'far fa-star',
      halfstar: 'fas fa-star-half-alt'
    },
    {
      img: 'assets/images/application/prod-img-4.jpg',
      name: 'Jimmy Morton',
      des: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt',
      price: '$49.99',
      mrp: '$85.00',
      rating: '(12.99+)',
      star: 'fas fa-star',
      star1: 'far fa-star',
      halfstar: 'fas fa-star-half-alt'
    }
  ];

  redirectPRoductDetails() {
    this.router.navigate(['/ec/ec-product-detail']);
  }

  showFilter(content: TemplateRef<string>) {
    this.offcanvasService.open(content, { position: 'end' });
  }
}
