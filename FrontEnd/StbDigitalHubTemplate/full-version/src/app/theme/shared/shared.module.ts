// angular imports
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// project import
export { TodoCardCompleteDirective } from './directive/todo-card-complete.directive';
export { ProductCompleteDirective } from './directive/product-complete.directive';
export { ProductRemoveDirective } from './directive/product-remove.directive';
export { AlertComponent } from './components/alert/alert.component';
export { CardComponent } from './components/card/card.component';

import { TodoCardCompleteDirective } from './directive/todo-card-complete.directive';
import { ProductCompleteDirective } from './directive/product-complete.directive';
import { ProductRemoveDirective } from './directive/product-remove.directive';
import { AlertComponent } from './components/alert/alert.component';
import { CardComponent } from './components/card/card.component';

// third party
import { NgScrollbarModule } from 'ngx-scrollbar';
import 'hammerjs';
import 'mousetrap';
import { GalleryModule } from '@ks89/angular-modal-gallery';
import { TranslateModule } from '@ngx-translate/core';

// feather icons
import { FeatherModule } from 'angular-feather';

// bootstrap import
import {
  NgbDropdownModule,
  NgbNavModule,
  NgbTooltipModule,
  NgbModule,
  NgbAccordionModule,
  NgbCollapseModule,
  NgbDatepickerModule
} from '@ng-bootstrap/ng-bootstrap';

export const SHARED_IMPORTS = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
  GalleryModule,
  NgbDropdownModule,
  NgbNavModule,
  NgbTooltipModule,
  NgbModule,
  NgbAccordionModule,
  NgbCollapseModule,
  NgbDatepickerModule,
  NgScrollbarModule,
  AlertComponent,
  CardComponent,
  TranslateModule,
  FeatherModule,
  TodoCardCompleteDirective,
  ProductCompleteDirective,
  ProductRemoveDirective
];
