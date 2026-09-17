import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { DigiTransfertService, VirementDetail } from 'src/app/theme/shared/service/digi-transfert.service';

@Component({
  selector: 'app-digi-transfert-detail',
  imports: [...SHARED_IMPORTS],
  templateUrl: './digi-transfert-detail.component.html',
  styleUrl: './digi-transfert-detail.component.scss'
})
export class DigiTransfertDetailComponent implements OnInit {
  private readonly api = inject(DigiTransfertService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  loading = signal(true);
  error = signal('');
  virement = signal<VirementDetail | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe((p) => {
      const id = Number(p.get('id'));
      if (!id) {
        void this.router.navigate(['/digi-transfert']);
        return;
      }
      this.load(id);
    });
  }

  load(id: number): void {
    this.loading.set(true);
    this.api
      .getVirement(id)
      .pipe(first())
      .subscribe({
        next: (v) => {
          this.virement.set(v);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Virement introuvable.');
          this.loading.set(false);
        }
      });
  }

  goBack(): void {
    void this.router.navigate(['/digi-transfert'], { queryParams: { tab: 'historique' } });
  }

  downloadRecu(): void {
    const v = this.virement();
    if (!v) {
      return;
    }
    this.api
      .downloadRecu(v.id)
      .pipe(first())
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `recu-virement-${v.id}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
        },
        error: () => this.error.set('Téléchargement du reçu impossible.')
      });
  }

  formatMoney(v: number): string {
    return `${v.toLocaleString('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`;
  }

  formatForeign(v: number, devise: string): string {
    return `${v.toLocaleString('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${devise}`;
  }

  statutClass(statut: string): string {
    const s = (statut || '').toLowerCase();
    if (s.includes('confirm')) {
      return 'badge-soft badge-soft-success';
    }
    if (s.includes('refus') || s.includes('échou') || s.includes('echou') || s.includes('annul')) {
      return 'badge-soft badge-soft-danger';
    }
    if (s.includes('attente')) {
      return 'badge-soft badge-soft-warning';
    }
    return 'badge-soft badge-soft-info';
  }
}
