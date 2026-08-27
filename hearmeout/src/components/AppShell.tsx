'use client';

import type { ComponentType } from 'react';
import { useApp } from '@/lib/AppContext';
import type { Device, ScreenName } from '@/lib/types';
import { userAvatarStyle } from '@/lib/format';
import { Toast } from './ui/Toast';
import { ProfileIcon, LogoMark } from './ui/Icons';
import { ThemeToggle } from './ThemeToggle';
import { CatalogScreen, SearchIcon } from './screens/CatalogScreen';
import { AlbumScreen } from './screens/AlbumScreen';
import { RateScreen } from './screens/RateScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { RecapScreen } from './screens/RecapScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ArtistScreen } from './screens/ArtistScreen';
import { FriendScreen } from './screens/FriendScreen';

const SCREENS: { name: ScreenName; Component: ComponentType<{ device: Device }> }[] = [
  { name: 'catalog', Component: CatalogScreen },
  { name: 'album', Component: AlbumScreen },
  { name: 'rate', Component: RateScreen },
  { name: 'history', Component: HistoryScreen },
  { name: 'recap', Component: RecapScreen },
  { name: 'profile', Component: ProfileScreen },
  { name: 'artist', Component: ArtistScreen },
  { name: 'friend', Component: FriendScreen },
];

// Which bottom-tab/sidebar-nav item lights up for a given screen — matches
// the prototype's TAB_GROUP (e.g. the album detail screen keeps "Главное" active).
const TAB_GROUP: Record<ScreenName, 'catalog' | 'history' | 'profile' | null> = {
  catalog: 'catalog', album: 'catalog', artist: 'catalog',
  history: 'history', rate: 'history',
  profile: 'profile', friend: 'profile',
  recap: null,
};

export function AppShell() {
  const { state } = useApp();
  return (
    <>
      <Toast />
      <MobileShell active={state.view === 'mobile'} />
      <DesktopShell active={state.view === 'desktop'} />
    </>
  );
}

function MobileShell({ active }: { active: boolean }) {
  const { state, t, showScreen } = useApp();
  const activeTab = TAB_GROUP[state.activeScreen];
  return (
    <div className={`mobile-shell ${active ? 'show' : ''}`}>
      <div className="device">
        <div className="m-screens">
          {SCREENS.map(({ name, Component }) => (
            <section key={name} className={`m-screen ${state.activeScreen === name ? 'active' : ''}`}>
              <Component device="mobile" />
            </section>
          ))}
        </div>
        <div className="tabbar">
          <button className={`tab ${activeTab === 'catalog' ? 'active' : ''}`} onClick={() => showScreen('catalog')}>
            <span className="ic num">⌂</span><span className="lbl">{t('nav.home')}</span>
          </button>
          <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => showScreen('history')}>
            <span className="ic num">★</span><span className="lbl">{t('nav.rate')}</span>
          </button>
          <button className={`tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => showScreen('profile')}>
            <span className="ic"><ProfileIcon /></span><span className="lbl">{t('nav.profile')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function DesktopShell({ active }: { active: boolean }) {
  const { state, t, me, showScreen, setSearchQuery } = useApp();
  const activeTab = TAB_GROUP[state.activeScreen];
  return (
    <div className={`desktop-shell ${active ? 'show' : ''}`}>
      <header className="d-topnav">
        <div className="d-logo"><LogoMark />Hear<span>Me</span>Out</div>
        <nav className="d-nav">
          <button className={`d-nav-item ${activeTab === 'catalog' ? 'active' : ''}`} onClick={() => showScreen('catalog')}>
            {t('nav.home')}
          </button>
          <button className={`d-nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => showScreen('history')}>
            {t('nav.rate')}
          </button>
          <button className={`d-nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => showScreen('profile')}>
            {t('nav.profile')}
          </button>
        </nav>
        <div className="d-topnav-right">
          <div className="search-bar">
            <SearchIcon />
            <input
              type="text"
              placeholder={t('search.placeholder')}
              value={state.searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); showScreen('catalog'); }}
            />
          </div>
          <ThemeToggle />
          <button className="d-avatar" style={me ? userAvatarStyle(me) : undefined} onClick={() => showScreen('profile')} aria-label={t('nav.profile')}>
            {!me?.avatarUrl && <ProfileIcon />}
          </button>
        </div>
      </header>
      <div className="d-main">
        <div className="d-content">
          <div className="d-content-inner">
            {SCREENS.map(({ name, Component }) => (
              <section key={name} className={`d-screen ${state.activeScreen === name ? 'active' : ''}`}>
                <Component device="desktop" />
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
