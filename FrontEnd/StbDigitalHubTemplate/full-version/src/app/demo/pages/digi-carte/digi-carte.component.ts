import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { first } from 'rxjs';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { CardSummary, DigiCarteService } from 'src/app/theme/shared/service/digi-carte.service';
import { BankCardWidgetComponent } from './bank-card-widget/bank-card-widget.component';

@Component({
  selector: 'app-digi-carte',
  imports: [...SHARED_IMPORTS, FormsModule, BankCardWidgetComponent],
  templateUrl: './digi-carte.component.html',
  styleUrl: './digi-carte.component.scss'
})
export class DigiCarteComponent implements OnInit {
  private readonly digiCarteService = inject(DigiCarteService);
  private readonly router = inject(Router);

  loading = signal(true);
  error = signal('');
  cards = signal<CardSummary[]>([]);
  statutFilter = signal('');

  ngOnInit(): void {
    this.loadCards();
  }

  loadCards(): void {
    this.loading.set(true);
    this.error.set('');
    this.digiCarteService
      .getCards(this.statutFilter() || undefined)
      .pipe(first())
      .subscribe({
        next: (data) => {
          this.cards.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(typeof err === 'string' ? err : 'Impossible de charger les cartes.');
          this.loading.set(false);
        }
      });
  }

  onFilterChange(): void {
    this.loadCards();
  }

  openCard(id: number): void {
    this.router.navigate(['/digi-carte', id]);
  }
}
