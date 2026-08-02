import { Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { cardTheme, formatMoney, statutBadgeClass } from 'src/app/demo/pages/digi-carte/digi-carte.utils';
import { CardSummary } from 'src/app/theme/shared/service/digi-carte.service';

@Component({
  selector: 'app-bank-card-widget',
  imports: [NgClass],
  templateUrl: './bank-card-widget.component.html',
  styleUrl: './bank-card-widget.component.scss'
})
export class BankCardWidgetComponent {
  card = input.required<CardSummary>();
  selectable = input(true);
  showActions = input(false);
  actionLoading = input(false);

  cardClick = output<number>();
  demoClick = output<{ event: Event; card: CardSummary }>();

  readonly cardTheme = cardTheme;
  readonly statutBadgeClass = statutBadgeClass;
  readonly formatMoney = formatMoney;

  onCardClick(): void {
    if (this.selectable()) {
      this.cardClick.emit(this.card().id);
    }
  }

  onDemoClick(event: Event): void {
    event.stopPropagation();
    this.demoClick.emit({ event, card: this.card() });
  }
}
