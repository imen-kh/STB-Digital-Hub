import { Component, input, output } from '@angular/core';
import { AccountSummary } from 'src/app/theme/shared/service/digi-compte.service';

@Component({
  selector: 'app-account-widget',
  templateUrl: './account-widget.component.html',
  styleUrl: './account-widget.component.scss'
})
export class AccountWidgetComponent {
  readonly account = input.required<AccountSummary>();
  readonly accountClick = output<number>();

  onClick(): void {
    this.accountClick.emit(this.account().id);
  }

  formatMoney(value: number): string {
    return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`;
  }

  themeClass(type: string, libelle: string): string {
    if (type === 'Épargne') {
      return 'theme-epargne';
    }
    return libelle.toLowerCase().includes('secondaire') ? 'theme-courant-alt' : 'theme-courant';
  }

  formatNumber(masked: string): string {
    const digits = masked.replace(/[^\d•]/g, '');
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }
}
