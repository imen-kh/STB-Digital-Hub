// Angular import
import { Component } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-basic-breadcrumb',
  imports: [...SHARED_IMPORTS],
  templateUrl: './basic-breadcrumb.component.html',
  styleUrl: './basic-breadcrumb.component.scss'
})
export class BasicBreadcrumbComponent {
  isDisabled = true;

  toggleDisabled() {
    this.isDisabled = !this.isDisabled;
  }
}
