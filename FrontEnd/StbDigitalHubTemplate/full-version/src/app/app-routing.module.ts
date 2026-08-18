// angular imports
import { Routes } from '@angular/router';

// project import
import { AdminComponent } from './theme/layout/admin/admin.component';
import { GuestComponent } from './theme/layout/guest/guest.component';
import { authGuardChild } from './theme/shared/_helpers/auth.guard';
import { Role } from './theme/shared/_helpers/role';

import { APP_TITLE } from 'src/app/app-config';

// Eager-loaded entry pages (landing, auth, error) for faster initial load
import { LandingComponent } from './demo/pages/landing/landing.component';
import { V1LoginComponent } from './demo/pages/authentication/authentication-v1/v1-login/v1-login.component';
import { V1RegisterComponent } from './demo/pages/authentication/authentication-v1/v1-register/v1-register.component';
import { V1VerifyOtpComponent } from './demo/pages/authentication/authentication-v1/v1-verify-otp/v1-verify-otp.component';
import { V1FrPasswordComponent } from './demo/pages/authentication/authentication-v1/v1-fr-password/v1-fr-password.component';
import { V1ResetPasswordComponent } from './demo/pages/authentication/authentication-v1/v1-reset-password/v1-reset-password.component';

export const appRoutes: Routes = [
  {
    path: '',
    component: GuestComponent,
    children: [
      {
        path: '',
        redirectTo: '',
        pathMatch: 'full'
      },
      {
        path: '',
        component: LandingComponent,
        title: `Landing | ${APP_TITLE}`
      },
      {
        path: 'login',
        component: V1LoginComponent,
        title: `Connexion | ${APP_TITLE}`
      },
      {
        path: 'register',
        component: V1RegisterComponent,
        title: `Inscription | ${APP_TITLE}`
      },
      {
        path: 'verify-otp',
        component: V1VerifyOtpComponent,
        title: `Vérification OTP | ${APP_TITLE}`
      },
      {
        path: 'forgetPassword',
        component: V1FrPasswordComponent,
        title: `Mot de passe oublié | ${APP_TITLE}`
      },
      {
        path: 'reset-password',
        component: V1ResetPasswordComponent,
        title: `Réinitialisation | ${APP_TITLE}`
      },
      {
        path: 'landing',
        component: LandingComponent,
        title: `Landing | ${APP_TITLE}`
      },
      {
        path: 'maintenance',
        loadChildren: () => import('./demo/pages/maintenance/maintenance-routing').then((m) => m.MaintenanceRoutes)
      },
      {
        path: 'auth',
        canActivateChild: [authGuardChild],
        loadChildren: () => import('./demo/pages/authentication/authentication-routing').then((m) => m.AuthsRoutes),
        data: { roles: [Role.Admin, Role.User] }
      },
      {
        path: 'contact-us',
        loadComponent: () => import('./demo/pages/contact-us/contact-us.component').then((c) => c.ContactUsComponent),
        title: `Contact Us | ${APP_TITLE}`
      },
      {
        path: 'faq',
        loadComponent: () => import('./demo/pages/faq/faq.component').then((c) => c.FaqComponent),
        title: `FAQ | ${APP_TITLE}`
      },
      {
        path: 'privacy-policy',
        loadComponent: () => import('./demo/pages/prv-policy/prv-policy.component').then((c) => c.PrvPolicyComponent),
        title: `Privacy Policy | ${APP_TITLE}`
      },
      {
        path: 'unauthorized',
        loadComponent: () =>
          import('./demo/pages/maintenance/unauthorize-error/unauthorize-error.component').then((c) => c.UnauthorizeErrorComponent),
        title: `Unauthorized | ${APP_TITLE}`
      }
    ]
  },
  {
    path: '',
    component: AdminComponent,
    canActivateChild: [authGuardChild],
    children: [
      {
        path: '',
        loadComponent: () => import('./demo/dashboard/default/default.component').then((c) => c.DefaultComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `${APP_TITLE}`
      },
      {
        path: 'default',
        loadComponent: () => import('./demo/dashboard/default/default.component').then((c) => c.DefaultComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Default | ${APP_TITLE}`
      },
      {
        path: 'profil',
        loadComponent: () => import('./demo/pages/client-profile/client-profile.component').then((c) => c.ClientProfileComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Mon profil | ${APP_TITLE}`
      },
      {
        path: 'digi-carte',
        loadComponent: () => import('./demo/pages/digi-carte/digi-carte.component').then((c) => c.DigiCarteComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `DigiCarte | ${APP_TITLE}`
      },
      {
        path: 'digi-carte/:id',
        loadComponent: () => import('./demo/pages/digi-carte/digi-carte-detail.component').then((c) => c.DigiCarteDetailComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Détail carte | ${APP_TITLE}`
      },
      {
        path: 'digi-credit',
        loadComponent: () => import('./demo/pages/digi-credit/digi-credit.component').then((c) => c.DigiCreditComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `DigiCrédit | ${APP_TITLE}`
      },
      {
        path: 'digi-credit/:id',
        loadComponent: () => import('./demo/pages/digi-credit/digi-credit-detail.component').then((c) => c.DigiCreditDetailComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Détail crédit | ${APP_TITLE}`
      },
      {
        path: 'comptes',
        loadComponent: () => import('./demo/pages/digi-compte/digi-compte.component').then((c) => c.DigiCompteComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Mes comptes | ${APP_TITLE}`
      },
      {
        path: 'comptes/:id',
        loadComponent: () => import('./demo/pages/digi-compte/digi-compte-detail.component').then((c) => c.DigiCompteDetailComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Détail compte | ${APP_TITLE}`
      },
      {
        path: 'analytics',
        loadComponent: () => import('./demo/dashboard/analytics/analytics.component').then((c) => c.AnalyticsComponent),
        data: { roles: [Role.Admin] },
        title: `Analytics | ${APP_TITLE}`
      },
      {
        path: 'finance',
        loadComponent: () => import('./demo/dashboard/finance/finance.component').then((c) => c.FinanceComponent),
        data: { roles: [Role.Admin] },
        title: `Finance | ${APP_TITLE}`
      },
      {
        path: 'widget/statistics',
        loadComponent: () => import('./demo/widget/statistics/statistics.component').then((c) => c.StatisticsComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Statistics | ${APP_TITLE}`
      },
      {
        path: 'widget/data',
        loadComponent: () => import('./demo/widget/data/data.component').then((c) => c.DataComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Data | ${APP_TITLE}`
      },
      {
        path: 'widget/chart',
        loadComponent: () => import('./demo/widget/widget-chart/widget-chart.component').then((c) => c.WidgetChartComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Chart | ${APP_TITLE}`
      },
      {
        path: 'layout',
        loadChildren: () => import('./demo/layout/layout-routing').then((m) => m.LayoutsRoutes)
      },
      {
        path: 'online-course',
        loadChildren: () => import('./demo/admin-panel/online-courses/online-courses-routing').then((m) => m.OnlineCoursesRoutes),
        data: { roles: [Role.Admin, Role.User] },
        title: `Online Course | ${APP_TITLE}`
      },
      {
        path: 'membership',
        loadChildren: () => import('./demo/admin-panel/membership/membership-routing').then((m) => m.MembershipRoutes),
        data: { roles: [Role.Admin, Role.User] },
        title: `Membership | ${APP_TITLE}`
      },
      {
        path: 'helpdesk',
        loadChildren: () => import('./demo/admin-panel/helpdesk/helpdesk-routing').then((m) => m.HelpdeskRoutes),
        data: { roles: [Role.Admin, Role.User] },
        title: `Helpdesk | ${APP_TITLE}`
      },
      {
        path: 'invoice',
        loadChildren: () => import('./demo/admin-panel/invoice/invoice-routing').then((m) => m.InvoiceRoutes),
        data: { role: [Role.Admin, Role.User] },
        title: `Invoice | ${APP_TITLE}`
      },
      {
        path: 'user',
        loadChildren: () => import('./demo/application/user/user-routing').then((m) => m.UserRoutes),
        data: { roles: [Role.Admin, Role.User] },
        title: `User | ${APP_TITLE}`
      },
      {
        path: 'customer',
        loadChildren: () => import('./demo/application/customer/customer-routing').then((m) => m.CustomerRoutes),
        data: { roles: [Role.Admin, Role.User] },
        title: `Customer | ${APP_TITLE}`
      },
      {
        path: 'chat',
        loadComponent: () => import('./demo/application/chat/chat.component').then((c) => c.ChatComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Chat | ${APP_TITLE}`
      },
      {
        path: 'kanban',
        loadComponent: () => import('./demo/application/kanban/kanban.component').then((c) => c.KanbanComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Kanban | ${APP_TITLE}`
      },
      {
        path: 'mail',
        loadComponent: () => import('./demo/application/email/email.component').then((c) => c.EmailComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Mail | ${APP_TITLE}`
      },
      {
        path: 'calender',
        loadComponent: () => import('./demo/application/calender/calender.component').then((c) => c.CalenderComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Calender | ${APP_TITLE}`
      },
      {
        path: 'contact',
        loadChildren: () => import('./demo/application/contact/contact-routing').then((m) => m.ContactRoutes),
        data: { roles: [Role.Admin, Role.User] },
        title: `Contact | ${APP_TITLE}`
      },
      {
        path: 'ec',
        loadChildren: () => import('./demo/application/ecommerce/ecommerce-routing').then((m) => m.ECommerceRoutes),
        data: { roles: [Role.Admin, Role.User] },
        title: `Ecommerce | ${APP_TITLE}`
      },

      {
        path: 'typography',
        loadComponent: () => import('./demo/elements/typography/typography.component').then((c) => c.TypographyComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Typography | ${APP_TITLE}`
      },
      {
        path: 'basic',
        loadChildren: () => import('./demo/elements/basic/basic-routing').then((m) => m.BasicComponentRoutes),
        data: { roles: [Role.Admin, Role.User] },
        title: `Basic | ${APP_TITLE}`
      },
      {
        path: 'advance',
        loadChildren: () => import('./demo/elements/advance/advance-routing').then((m) => m.AdvanceComponentRoutes),
        data: { roles: [Role.Admin, Role.User] },
        title: `Advance | ${APP_TITLE}`
      },
      {
        path: 'forms',
        loadChildren: () => import('./demo/forms/form-elements/form-elements-routing').then((m) => m.FormsElementsRoutes),
        data: { roles: [Role.Admin, Role.User] },
        title: `Forms | ${APP_TITLE}`
      },
      {
        path: 'fPlugin',
        loadChildren: () => import('./demo/forms/form-plugin/form-plugin-routing').then((m) => m.FormsPluginsRoutes),
        data: { roles: [Role.Admin, Role.User] },
        title: `Form Plugin | ${APP_TITLE}`
      },
      {
        path: 'form-validation',
        loadComponent: () => import('./demo/forms/form-validation/form-validation.component').then((c) => c.FormValidationComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Form Validation | ${APP_TITLE}`
      },
      {
        path: 'textEditor',
        loadChildren: () => import('./demo/forms/text-editors/text-editors-routing').then((m) => m.TextEditorRoutes),
        data: { roles: [Role.Admin, Role.User] },
        title: `Text Editor | ${APP_TITLE}`
      },
      {
        path: 'form-layout',
        loadChildren: () => import('./demo/forms/form-layout/form-layout-routing').then((m) => m.FormsLayoutsComponentRoutes),
        data: { roles: [Role.Admin, Role.User] },
        title: `Form Layout | ${APP_TITLE}`
      },
      {
        path: 'fileUpload',
        loadChildren: () => import('./demo/forms/file-upload/file-upload-routing').then((m) => m.FileUploadRoutes),
        data: { roles: [Role.Admin, Role.User] },
        title: `File Upload | ${APP_TITLE}`
      },
      {
        path: 'imagesCropper',
        loadComponent: () => import('./demo/forms/image-cropper/image-cropper.component').then((c) => c.ImageCropperComponent),
        data: { roles: [Role.Admin, Role.User] },
        title: `Image Cropper | ${APP_TITLE}`
      },
      // {
      //   path: 'dataTables',
      //   loadComponent: () => import('./demo/tables/tbl-data-table/tbl-data-table.component').then((c) => c.TblDataTableComponent),
      //   data: { roles: [Role.Admin, Role.User] }
      // },
      {
        path: 'ng-table',
        loadChildren: () => import('./demo/tables/ng-bootstrap-table/ng-bootstrap-table-routing').then((m) => m.NgTableRoutes),
        data: { roles: [Role.Admin, Role.User] },
        title: `Ng Table | ${APP_TITLE}`
      },
      {
        path: 'chart',
        loadChildren: () => import('./demo/chart-maps/core-chart/core-chart-routing').then((m) => m.CoreChartRoutes),
        data: { roles: [Role.Admin, Role.User] },
        title: `Chart | ${APP_TITLE}`
      },
      {
        path: 'map',
        loadChildren: () => import('./demo/chart-maps/core-map/core-map-routing').then((m) => m.CoreMapRoutes),
        data: { roles: [Role.Admin, Role.User] },
        title: `Map | ${APP_TITLE}`
      },
      {
        path: 'samplePage',
        loadComponent: () => import('./demo/other/sample-page/sample-page.component').then((c) => c.SamplePageComponent),
        title: `Sample Page | ${APP_TITLE}`
      },
      {
        path: 'price',
        loadChildren: () => import('./demo/pages/price/price-routing').then((m) => m.PriceRoutes),
        data: { roles: [Role.Admin, Role.User] },
        title: `Price | ${APP_TITLE}`
      }
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./demo/pages/maintenance/maintain-error/maintain-error.component').then((c) => c.MaintainErrorComponent)
  }
];
