// angular imports
import { Routes } from '@angular/router';

// Role
import { Role } from 'src/app/theme/shared/_helpers/role';

// project import
import { APP_TITLE } from 'src/app/app-config';

export const ECommerceRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'ec-product',
        loadComponent: () => import('./product/product.component').then((c) => c.ProductComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Product | ${APP_TITLE}`
      },
      {
        path: 'ec-product-detail',
        loadComponent: () => import('./product-details/product-details.component').then((c) => c.ProductDetailsComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Product Details | ${APP_TITLE}`
      },
      {
        path: 'ec-product-list',
        loadComponent: () => import('./product-list/product-list.component').then((c) => c.ProductListComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Product List | ${APP_TITLE}`
      },
      {
        path: 'ec-checkout',
        loadComponent: () => import('./checkout/checkout.component').then((c) => c.CheckoutComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Checkout | ${APP_TITLE}`
      }
    ]
  }
];
