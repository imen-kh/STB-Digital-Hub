// angular imports
import { Routes } from '@angular/router';

// Role
import { Role } from 'src/app/theme/shared/_helpers/role';

// project import
import { APP_TITLE } from 'src/app/app-config';

export const CustomerRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'customerList',
        loadComponent: () => import('./customer-list/customer-list.component').then((c) => c.CustomerListComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Customer List | ${APP_TITLE}`
      },
      {
        path: 'orderList',
        loadComponent: () => import('./order-list/order-list.component').then((c) => c.OrderListComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Order List | ${APP_TITLE}`
      },
      {
        path: 'createInvoice',
        loadComponent: () => import('./create-invoice/create-invoice.component').then((C) => C.CreateInvoiceComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Create Invoice | ${APP_TITLE}`
      },
      {
        path: 'orderDetails',
        loadComponent: () => import('./orders-detail/orders-detail.component').then((C) => C.OrdersDetailComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Order Details | ${APP_TITLE}`
      },
      {
        path: 'products',
        loadComponent: () => import('./products/products.component').then((c) => c.ProductsComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Customer Products | ${APP_TITLE}`
      },
      {
        path: 'productReview',
        loadComponent: () => import('./product-review/product-review.component').then((c) => c.ProductReviewComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Product Review | ${APP_TITLE}`
      }
    ]
  }
];
