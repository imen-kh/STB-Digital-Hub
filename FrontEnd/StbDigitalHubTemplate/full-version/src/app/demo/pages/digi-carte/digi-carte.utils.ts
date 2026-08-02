export function cardTheme(type: string): string {
  switch (type) {
    case 'C-Cash':
      return 'theme-ccash';
    case 'Travel':
      return 'theme-travel';
    default:
      return 'theme-classique';
  }
}

export function isRechargeableCard(card: { estCCash?: boolean; estTravel?: boolean }): boolean {
  return !!card.estCCash || !!card.estTravel;
}

export function statutBadgeClass(statut: string): string {
  switch (statut) {
    case 'Active':
      return 'bg-success';
    case 'Bloquée':
      return 'bg-danger';
    case 'Inactive':
      return 'bg-secondary';
    case 'Expirée':
      return 'bg-warning text-dark';
    default:
      return 'bg-light text-dark';
  }
}

export function transactionStatutBadgeClass(statut: string): string {
  const normalized = statut.toLowerCase();
  if (normalized.includes('non valide') || normalized.includes('refus') || normalized.includes('erron')) {
    return 'bg-danger-subtle text-danger';
  }
  if (normalized.includes('attente')) {
    return 'bg-warning-subtle text-warning';
  }
  return 'bg-success-subtle text-success';
}

export function formatMoney(value: number): string {
  return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`;
}

export function formatForeignAmount(montant: number, devise?: string | null): string {
  if (!devise || devise === 'TND') {
    return formatMoney(montant);
  }
  return `${montant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${devise}`;
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleString('fr-FR');
}

export function toInputDate(value: string): string {
  if (!value) {
    return '';
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const parts = value.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return value;
}

export function allocationProgressPercent(consommee: number, annuelle: number): number {
  if (!annuelle || annuelle <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((consommee / annuelle) * 100));
}
