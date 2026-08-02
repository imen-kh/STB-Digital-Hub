import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { first } from 'rxjs';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { CardSummary, DigiCarteService } from 'src/app/theme/shared/service/digi-carte.service';
import { BankCardWidgetComponent } from '../../pages/digi-carte/bank-card-widget/bank-card-widget.component';

@Component({
  selector: 'app-dashboard-cards',
  imports: [...SHARED_IMPORTS, BankCardWidgetComponent, RouterLink],
  templateUrl: './dashboard-cards.component.html',
  styleUrl: './dashboard-cards.component.scss'
})
export class DashboardCardsComponent implements OnInit {
  private readonly digiCarteService = inject(DigiCarteService);
  private readonly router = inject(Router);

  loading = signal(true);
  cards = signal<CardSummary[]>([]);

  ngOnInit(): void {
    this.digiCarteService
      .getCards()
      .pipe(first())
      .subscribe({
        next: (data) => {
          this.cards.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  openCard(id: number): void {
    this.router.navigate(['/digi-carte', id]);
  }
}
