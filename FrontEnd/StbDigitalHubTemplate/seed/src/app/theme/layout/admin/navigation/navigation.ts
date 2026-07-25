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
    id: 'other',
    title: 'Other',
    type: 'group',
    icon: 'icon-navigation',
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'samplePage',
        title: 'Sample Page',
        type: 'item',
        classes: 'nav-item',
        url: '/samplePage',
        icon: 'ti ti-brand-chrome'
      },
      {
        id: 'menu-level',
        title: 'Menu levels',
        type: 'collapse',
        icon: 'ti ti-menu',
        role: [Role.Admin, Role.User],
        children: [
          {
            id: 'menu-level-2.1',
            title: 'Level 2.1',
            type: 'item',
            url: 'javascript:',
            external: true
          },
          {
            id: 'menu-level-2.2',
            title: 'Level 2.2',
            type: 'collapse',
            classes: 'edge',
            role: [Role.Admin, Role.User],
            children: [
              {
                id: 'menu-level-3.1',
                title: 'Level 3.1',
                type: 'item',
                url: 'javascript:',
                external: true
              },
              {
                id: 'menu-level-3.2',
                title: 'Level 3.2',
                type: 'item',
                url: 'javascript:',
                external: true
              },
              {
                id: 'menu-level-3.3',
                title: 'Level 3.3',
                type: 'collapse',
                classes: 'edge',
                role: [Role.Admin, Role.User],
                children: [
                  {
                    id: 'menu-level-4.1',
                    title: 'Level 4.1',
                    type: 'item',
                    url: 'javascript:',
                    external: true
                  },
                  {
                    id: 'menu-level-4.2',
                    title: 'Level 4.2',
                    type: 'item',
                    url: 'javascript:',
                    external: true
                  }
                ]
              }
            ]
          },
          {
            id: 'menu-level-2.3',
            title: 'Level 2.3',
            type: 'collapse',
            classes: 'edge',
            role: [Role.Admin, Role.User],
            children: [
              {
                id: 'menu-level-3.1',
                title: 'Level 3.1',
                type: 'item',
                url: 'javascript:',
                external: true
              },
              {
                id: 'menu-level-3.2',
                title: 'Level 3.2',
                type: 'item',
                url: 'javascript:',
                external: true
              },
              {
                id: 'menu-level-3.3',
                title: 'Level 3.3',
                type: 'collapse',
                classes: 'edge',
                role: [Role.Admin, Role.User],
                children: [
                  {
                    id: 'menu-level-4.1',
                    title: 'Level 4.1',
                    type: 'item',
                    url: 'javascript:',
                    external: true
                  },
                  {
                    id: 'menu-level-4.2',
                    title: 'Level 4.2',
                    type: 'item',
                    url: 'javascript:',
                    external: true
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'document',
        title: 'Documentation',
        type: 'item',
        classes: 'nav-item',
        url: 'https://codedthemes.gitbook.io/berry-angular/',
        icon: 'ti ti-vocabulary',
        target: true,
        external: true
      }
    ]
  }
];
