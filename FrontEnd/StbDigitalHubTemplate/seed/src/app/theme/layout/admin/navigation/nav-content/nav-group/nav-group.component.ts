// Angular import
import { Component, OnInit, input, output, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// project import
import { NavigationItem } from '../../navigation';
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { NavCollapseComponent } from '../nav-collapse/nav-collapse.component';
import { NavItemComponent } from '../nav-item/nav-item.component';
import { NavigationStateService } from 'src/app/theme/shared/service/navigation-state.service';

@Component({
  selector: 'app-nav-group',
  imports: [CommonModule, ...SHARED_IMPORTS, NavCollapseComponent, NavItemComponent],
  templateUrl: './nav-group.component.html',
  styleUrl: './nav-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavGroupComponent implements OnInit {
  private router = inject(Router);
  private navigationStateService = inject(NavigationStateService);

  readonly item = input.required<NavigationItem>();
  readonly showCollapseItem = output();

  ngOnInit() {
    this.navigationStateService.setActivePathFromRoute(this.router.url, [this.item()]);
  }

  getChildPath(): string[] {
    return [];
  }

  subMenuCollapse(item: void) {
    this.showCollapseItem.emit(item);
  }
}
