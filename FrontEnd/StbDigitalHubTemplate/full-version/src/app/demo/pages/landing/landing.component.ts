import { Component, OnDestroy, OnInit, ViewEncapsulation, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { PlaceholderCard1Component } from 'src/app/theme/shared/components/placeholder-card/placeholder-1.component';
import { PlaceholderCard2Component } from 'src/app/theme/shared/components/placeholder-card/placeholder-2.component';
import { LogoComponent } from 'src/app/theme/shared/components/logo/logo.component';

@Component({
  selector: 'app-landing',
  imports: [CommonModule, ...SHARED_IMPORTS, RouterModule, PlaceholderCard1Component, PlaceholderCard2Component, LogoComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class LandingComponent implements OnInit, OnDestroy {
  private configService = inject(ConfigService);

  isCollapsed = true;
  themeMode = false;
  currentYear = new Date().getFullYear();

  cardList = [
    {
      background: 'bg-primary-subtle',
      icon: 'ti ti-credit-card',
      icon_style: 'grid-icon text-primary',
      rotate: '',
      title: 'DigiCarte',
      subText: 'Cartes bancaires',
      text_style: 'text-end'
    },
    {
      background: 'bg-info-subtle',
      icon: 'ti ti-pig-money',
      icon_style: 'grid-icon text-info',
      rotate: '',
      title: 'DigiEpargne',
      subText: 'Épargne & intérêts',
      text_style: 'text-end'
    },
    {
      background: 'bg-success-subtle',
      icon: 'ti ti-arrows-exchange',
      icon_style: 'grid-icon text-success',
      rotate: '',
      title: 'DigiTransfert',
      subText: 'Virements sécurisés',
      text_style: 'text-end'
    }
  ];

  experience = [
    { text: 'Connexion sécurisée à votre espace personnel' },
    { text: 'Tableau de bord clair de vos opérations' },
    { text: 'Notifications et documents accessibles' },
    { text: 'Interface adaptée mobile et desktop' }
  ];

  digiPoints = [
    { text: 'DigiCarte — gérer et sécuriser vos cartes' },
    { text: 'DigiEpargne — suivre solde et versements' },
    { text: 'DigiCrédit — simuler et consulter vos crédits' },
    { text: 'DigiTransfert — virements et bénéficiaires' },
    { text: 'Confirmation OTP pour les opérations sensibles' }
  ];

  offers = [
    {
      icon: 'ti ti-credit-card',
      name: 'DigiCarte',
      text: 'Visualisez vos cartes, bloquez-les, gérez les plafonds et consultez l’historique des transactions.'
    },
    {
      icon: 'ti ti-pig-money',
      name: 'DigiEpargne',
      text: 'Consultez votre solde, le taux d’intérêt, les projections et configurez une épargne intelligente.'
    },
    {
      icon: 'ti ti-building-bank',
      name: 'DigiCrédit',
      text: 'Simulez un crédit, calculez les mensualités et suivez le tableau d’amortissement.'
    },
    {
      icon: 'ti ti-arrows-exchange',
      name: 'DigiTransfert',
      text: 'Effectuez des virements nationaux et internationaux, gérez vos bénéficiaires et téléchargez vos reçus.'
    },
    {
      icon: 'ti ti-shield-lock',
      name: 'Espace sécurisé',
      text: 'Authentification client STB et confirmation des opérations sensibles par OTP simulé.'
    },
    {
      icon: 'ti ti-bell-ringing',
      name: 'Notifications & suivi',
      text: 'Notifications, historiques et documents générés disponibles en temps réel dans votre espace.'
    }
  ];

  agenceCities = [
    'Tunis — Siège Rue Hedi Nouira',
    'Sfax',
    'Sousse',
    'Nabeul',
    'Bizerte',
    'Gabès',
    'Kairouan',
    'Gafsa'
  ];

  testamentsCards = [
    {
      support_type: 'Sécurité',
      name: 'Espace client',
      review: 'Accédez à vos services bancaires dans un environnement protégé, conçu pour les clients STB.'
    },
    {
      support_type: 'Simplicité',
      name: 'Parcours clair',
      review: 'Une navigation intuitive pour cartes, épargne, crédits et virements sans complexité inutile.'
    },
    {
      support_type: 'Proximité',
      name: 'Banque digitale',
      review: 'La STB vous accompagne partout : consultez et réalisez vos opérations à distance.'
    }
  ];

  startupList = [
    { title: 'Cartes' },
    { title: 'Épargne' },
    { title: 'Crédits' },
    { title: 'Virements' },
    { title: 'Notifications' },
    { title: 'Documents' }
  ];

  constructor() {
    effect(() => {
      this.isDarkTheme(this.configService.isDarkMode());
      this.themeDirection(this.configService.isRtl_layout());
    });
  }

  ngOnInit(): void {
    document.querySelector('body')?.classList.add('landing-page');
  }

  ngOnDestroy(): void {
    document.querySelector('body')?.classList.remove('landing-page');
    document.querySelector('html')?.removeAttribute('data-pc-theme_reverse');
  }

  private isDarkTheme(isDark: boolean) {
    this.themeMode = isDark;
  }

  private themeDirection(isRtl: boolean) {
    if (isRtl) {
      document.querySelector('html')?.setAttribute('data-pc-theme_reverse', 'true');
    } else {
      document.querySelector('html')?.removeAttribute('data-pc-theme_reverse');
    }
  }
}
