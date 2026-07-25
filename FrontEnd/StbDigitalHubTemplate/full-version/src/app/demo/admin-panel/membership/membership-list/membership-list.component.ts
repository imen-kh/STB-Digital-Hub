// angular import
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DecimalPipe } from '@angular/common';

// rxjs import
import { Observable } from 'rxjs';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { membership } from './membership-list-type';
import { MembershipListService } from './membership-list.service';

@Component({
  selector: 'app-membership-list',
  imports: [...SHARED_IMPORTS, RouterModule],
  templateUrl: './membership-list.component.html',
  styleUrl: './membership-list.component.scss',
  providers: [MembershipListService, DecimalPipe]
})
export class MembershipListComponent {
  service = inject(MembershipListService);

  // public props
  memberships$: Observable<membership[]>;
  total$: Observable<number>;

  // constructor
  constructor() {
    const service = this.service;

    this.memberships$ = service.memberships$;
    this.total$ = service.total$;
  }
}
