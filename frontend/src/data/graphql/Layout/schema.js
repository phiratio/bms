export const schema = [
  `
  type Layout {
    logo: String!
    header: Header,
    sidebar: Sidebar,
    footer: Footer,
    aside: Aside,
  }
  
  type Header {
    position: String!,
    notifications: Int,
    profile: Profile
  }
  
  type Profile {
    avatar: String!,
    user: String!,
    menu: [ProfileMenu]
  }
  
  type ProfileMenu {
    icon: String!,
    to: String!,
    title: String!,
    intl: MenuIntl,
    badge: ProfileMenuBadge,    
  }
  
  type MenuIntl {
    id: String!
  }
  
  type ProfileMenuBadge {
    title: String!,
  }
  
  type Sidebar {
    position: String!,
    menu: [SidebarMenu]
  }
  
  type SidebarMenu {
    type: String!,
    to: String,
    icon: String,
    active: SidebarMenuActive,
    title: String!,
    intl: MenuIntl,
    items: [SidebarMenuItems],
    badge: SidebarMenuBadge    
  }
  
  type SidebarMenuActive {
    link: String!,
    strict: String!,
  }
  
  type SidebarMenuItems {
    to: String,
    icon: String,
    active: SidebarMenuItemsActive,
    title: String,
    intl: MenuIntl,
    badge: SidebarMenuBadge
  }
  
  type SidebarMenuItemsActive {
    link: String!,
    strict: String!,
  }
  
  type SidebarMenuBadge {
    type: String!,
    title: String!,
  }
  
  type Footer {
    position: String!
  }
  
  type Aside {
    position: String
  }
  
`,
];

export const queries = [
  `
  layout: [Layout]
`,
];

export const resolvers = {
  RootQuery: {
    async layout() {
      let localeData;
      try {
        localeData = [
          {
            logo: '/url/to/logo',
            header: {
              position: 'fixed',
              notifications: 5,
              profile: {
                avatar: '/url/to/avatar.png',
                user: 'Alex Kulikovskikh',
                menu: [
                  {
                    icon: 'icon-user',
                    to: '/profile',
                    title: 'Profile',
                    intl: { id: 'link.profile' },
                  },
                  {
                    icon: 'icon-envelope',
                    to: '/messages',
                    title: 'Messages',
                    intl: { id: 'link.messages' },
                    badge: { type: 'badge-info', title: 42 },
                  },
                  {
                    icon: 'icon-settings',
                    to: '/settings',
                    title: 'Settings',
                    intl: { id: 'link.settings' },
                  },
                  {
                    icon: 'icon-logout',
                    to: '/logout',
                    title: 'Logout',
                    intl: { id: 'link.logout' },
                  },
                ],
              },
            },
            sidebar: {
              position: 'fixed', // compact, hidden, fixed, minimized (Works only on desktop)
              menu: [
                {
                  type: 'nav-item',
                  to: '/',
                  icon: 'icon-speedometer',
                  title: 'Dashboard',
                  active: { link: '/', strict: true },
                  intl: { id: 'link.dashboard' },
                  badge: { title: '5', type: 'badge-info' },
                },
                {
                  type: 'nav-title',
                  title: 'Category',
                  intl: { id: 'link.category' },
                },
                {
                  type: 'nav-dropdown',
                  icon: 'icon-star',
                  title: 'Icons',
                  active: { link: '/contact', strict: false },
                  intl: { id: 'link.icons' },
                  items: [
                    {
                      to: '/contact/12',
                      icon: 'icon-star',
                      title: 'Font Awesome',
                      active: { link: '/contact/12', strict: true },
                      intl: { id: 'link.fontAwesome' },
                      // badge: { title: 'NEW', type: 'badge-info',}
                    },
                    {
                      to: '/contact/12/details',
                      icon: 'icon-star',
                      title: 'User details',
                      active: { link: '/contact/12/details', strict: true },
                      intl: { id: 'link.userDetails' },
                      // badge: { title: 'NEW', type: 'badge-info', }
                    },
                  ],
                },
              ],
            },
            footer: {
              position: 'fixed',
            },
          },
        ];
      } catch (err) {
        if (err.code === 'ENOENT') {
          throw new Error(`Layout not found`);
        }
      }

      return JSON.parse(JSON.stringify(localeData));
    },
  },
};
