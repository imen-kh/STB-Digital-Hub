import { Role } from 'src/app/theme/shared/_helpers/role';

export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  children?: NavigationItem[];
  role?: string[];
  isMainParent?: boolean;
}

export const NavigationItems: NavigationItem[] = [
  {
    id: 'stb-services',
    title: 'STB Digital Hub',
    type: 'group',
    icon: 'icon-navigation',
    classes: 'first-group',
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'accueil',
        title: 'Accueil',
        type: 'item',
        classes: 'nav-item',
        url: '/default',
        icon: 'ti ti-home',
        breadcrumbs: false
      },
      {
        id: 'digi-carte',
        title: 'DigiCarte',
        type: 'item',
        classes: 'nav-item',
        url: '/digi-carte',
        icon: 'ti ti-credit-card',
        breadcrumbs: false
      },
      {
        id: 'digi-credit',
        title: 'DigiCrédit',
        type: 'item',
        classes: 'nav-item',
        url: '/digi-credit',
        icon: 'ti ti-coins',
        breadcrumbs: false
      },
      {
        id: 'digi-epargne',
        title: 'DigiÉpargne',
        type: 'item',
        classes: 'nav-item',
        url: '/digi-epargne',
        icon: 'ti ti-pig-money',
        breadcrumbs: false
      },
      {
        id: 'comptes',
        title: 'Mes comptes',
        type: 'item',
        classes: 'nav-item',
        url: '/comptes',
        icon: 'ti ti-wallet',
        breadcrumbs: false
      },
      {
        id: 'profil',
        title: 'Mon profil',
        type: 'item',
        classes: 'nav-item',
        url: '/profil',
        icon: 'ti ti-user',
        breadcrumbs: false
      }
    ]
  }
];
