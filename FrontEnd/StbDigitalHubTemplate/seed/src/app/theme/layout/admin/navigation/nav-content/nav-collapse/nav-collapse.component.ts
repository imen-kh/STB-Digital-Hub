// Angular import
import { Component, input, output, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// project import
import { NavigationItem } from '../../navigation';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { NavItemComponent } from '../nav-item/nav-item.component';
import { AuthenticationService } from 'src/app/theme/shared/service/authentication.service';
import { NavigationStateService } from 'src/app/theme/shared/service/navigation-state.service';

@Component({
  selector: 'app-nav-collapse',
  imports: [CommonModule, ...SHARED_IMPORTS, RouterModule, NavItemComponent],
  templateUrl: './nav-collapse.component.html',
  styleUrl: './nav-collapse.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavCollapseComponent {
  private authenticationService = inject(AuthenticationService);
  private navigationStateService = inject(NavigationStateService);
  private configService = inject(ConfigService);

  // public props
  readonly showCollapseItem = output<NavigationItem | void>();
  readonly item = input.required<NavigationItem>();
  readonly parentRole = input<string[] | null>(null);
  readonly parentPath = input<string[]>([]);

  currentLayout = this.configService.layout;

  isExpanded = computed(() => {
    return this.navigationStateService.isExpanded(this.item().id);
  });

  isEnabled = computed(() => {
    const currentUserRole = this.authenticationService.currentUserValue?.user.role || 'Admin';
    const parentRoleValue = this.parentRole();
    const item = this.item();

    if (item.role && item.role.length > 0) {
      if (currentUserRole) {
        const parentRole = parentRoleValue || [];
        const allowedFromParent = item.isMainParent || (parentRole.length > 0 && parentRole.includes(currentUserRole));
        if (allowedFromParent) {
          return item.role.includes(currentUserRole);
        }
      }
    } else if (parentRoleValue && parentRoleValue.length > 0) {
      if (currentUserRole) {
        return parentRoleValue.includes(currentUserRole);
      }
    }
    return false;
  });

  navCollapse(): void {
    this.navigationStateService.toggleMenuItem(this.item().id, this.parentPath());
  }

  getChildPath(): string[] {
    return [...this.parentPath(), this.item().id];
  }

  subMenuCollapse(item: NavigationItem) {
    this.showCollapseItem.emit(item);
  }
}
