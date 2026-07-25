// Angular import
import { Component } from '@angular/core';

import { RouterLink, RouterModule } from '@angular/router';
import { LogoComponent } from 'src/app/theme/shared/components/logo/logo.component';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-prv-policy',
  imports: [RouterModule, ...SHARED_IMPORTS, RouterLink, LogoComponent],
  templateUrl: './prv-policy.component.html',
  styleUrl: './prv-policy.component.scss'
})
export class PrvPolicyComponent {
  // public props
  isCollapsed = true;
}
