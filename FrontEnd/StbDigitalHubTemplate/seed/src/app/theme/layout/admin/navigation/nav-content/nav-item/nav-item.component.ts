// Angular import
import { Component, input, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink } from '@angular/router';

// Project import
import { NavigationItem } from '../../navigation';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { Role } from 'src/app/theme/shared/_helpers/role';
import { AuthenticationService } from 'src/app/theme/shared/service/authentication.service';

@Component({
  selector: 'app-nav-item',
  imports: [CommonModule, ...SHARED_IMPORTS, RouterModule, RouterLink],
  templateUrl: './nav-item.component.html',
  styleUrl: './nav-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavItemComponent {
  private authenticationService = inject(AuthenticationService);
  configService = inject(ConfigService);

  // public props
  readonly item = input.required<NavigationItem>();
  readonly parentRole = input.required<string[] | null>();

  currentLayout = this.configService.layout;

  safeUrl = computed(() => {
    const url = this.item()?.url;
    if (!url) {
      return '#';
    }
    const normalized = url.trim().toLowerCase();
    return normalized.startsWith('javascript:') ? '#' : url;
  });

  isEnabled = computed(() => {
    const currentUserRole = this.authenticationService.currentUserValue?.user.role || Role.Admin;
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

  closeOtherMenu(): void {
    this.configService.closeNavCollapsedMob();
  }

  onExternalClick(event: MouseEvent): void {
    if (this.safeUrl() === '#') {
      event.preventDefault();
    }
    this.closeOtherMenu();
  }

  subMenuCollapse(): void {
    this.configService.closeNavCollapsedMob();
  }
}
