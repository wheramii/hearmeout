'use client';

import { useState, type ComponentType } from 'react';
import { useApp } from '@/lib/AppContext';
import type { Device, ScreenName } from '@/lib/types';
import { userAvatarStyle } from '@/lib/format';
import { Toast } from './ui/Toast';
import { ProfileIcon, LogoMark, HomeIcon, StarIcon, PeopleIcon, BarsIcon, CompassSearchIcon } from './ui/Icons';
import { ThemeToggle } from './ThemeToggle';
import { DockedPlayerDesktop, DockedPlayerMobile } from './DockedPlayer';
import { CatalogScreen, SearchIcon } from './screens/CatalogScreen';
import { AlbumScreen } from './screens/AlbumScreen';
import { RateScreen } from './screens/RateScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { RecapScreen } from './screens/RecapScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ArtistScreen } from './screens/ArtistScreen';
import { FriendScreen } from './screens/FriendScreen';
import { StatsScreen } from './screens/StatsScreen';
import { MatchScreen } from './screens/MatchScreen';
import { GroupsScreen } from './screens/GroupsScreen';
import { DiscoverScreen } from './screens/DiscoverScreen';
import { SettingsScreen } from './screens/SettingsScreen';

const SCREENS: { name: ScreenName; Component: ComponentType<{ device: Device }> }[] = [
  { name: 'catalog', Component: CatalogScreen },
  { name: 'album', Component: AlbumScreen },
  { name: 'rate', Component: RateScreen },
  { name: 'history', Component: HistoryScreen },
  { name: 'recap', Component: RecapScreen },
  { name: 'profile', Component: ProfileScreen },
  { name: 'artist', Component: ArtistScreen },
  { name: 'friend', Component: FriendScreen },
  { name: 'stats', Component: StatsScreen },
  { name: 'match', Component: MatchScreen },
  { name: 'groups', Component: GroupsScreen },
  { name: 'discover', Component: DiscoverScreen },
  { name: 'settings', Component: SettingsScreen },
];

type TabKey = 'catalog' | 'rate' | 'match' | 'stats' | 'groups' | 'discover' | 'profile';

// Which nav item lights up for a given screen. Per the nav map: album,
// artist, friend profile, the rating form and the preview player all open
// "from content" and deliberately don't light up any top-level item.
const TAB_GROUP: Record<ScreenName, TabKey | null> = {
  catalog: 'catalog', album: null, artist: null,
  history: 'rate', rate: null,
  match: 'match', friend: null,
  stats: 'stats', recap: null,
  groups: 'groups',
  discover: 'discover',
  profile: 'profile',
  settings: null,
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
  const { state, t, me, showScreen } = useApp();
  const activeTab = TAB_GROUP[state.activeScreen];
  return (
    <div className={`mobile-shell ${active ? 'show' : ''}`}>
      <div className="device">
        <div className="m-screens">
          {SCREENS.map(({ name, Component }) => (
            <section key={name} className={`m-screen ${state.activeScreen === name ? 'active' : ''}`}>
              <div className="m-screen-inner">
                <Component device="mobile" />
              </div>
            </section>
          ))}
        </div>
        <DockedPlayerMobile />
        <div className="tabbar">
          <button className={`tab ${activeTab === 'catalog' ? 'active' : ''}`} onClick={() => showScreen('catalog')} aria-label={t('nav.home')}>
            <span className="ic"><HomeIcon /></span>
          </button>
          <button className={`tab ${activeTab === 'rate' ? 'active' : ''}`} onClick={() => showScreen('history')} aria-label={t('nav.rate')}>
            <span className="ic"><StarIcon /></span>
          </button>
          <button className={`tab ${activeTab === 'match' ? 'active' : ''}`} onClick={() => showScreen('match')} aria-label={t('nav.match')}>
            <span className="ic"><PeopleIcon /></span>
          </button>
          <button className={`tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => showScreen('stats')} aria-label={t('nav.stats')}>
            <span className="ic"><BarsIcon /></span>
          </button>
          <button className={`tab ${activeTab === 'discover' ? 'active' : ''}`} onClick={() => showScreen('discover')} aria-label={t('nav.find')}>
            <span className="ic"><CompassSearchIcon /></span>
          </button>
          <button className={`tab tab-avatar ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => showScreen('profile')} aria-label={t('nav.profile')}>
            <span className="ic avatar" style={me ? userAvatarStyle(me) : undefined}>{!me?.avatarUrl && <ProfileIcon />}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function AvatarMenu() {
  const { t, me, showScreen, logout } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <div className="avatar-menu-wrap">
      <button className="d-avatar" style={me ? userAvatarStyle(me) : undefined} onClick={() => setOpen((v) => !v)} aria-label={t('nav.profile')}>
        {!me?.avatarUrl && <ProfileIcon />}
      </button>
      {open && (
        <div className="avatar-menu" onMouseLeave={() => setOpen(false)}>
          <button onClick={() => { showScreen('profile'); setOpen(false); }}>{t('settings.menuProfile')}</button>
          <button onClick={() => { showScreen('settings'); setOpen(false); }}>{t('settings.menuSettings')}</button>
          <button onClick={() => { setOpen(false); logout(); }}>{t('settings.menuSignOut')}</button>
        </div>
      )}
    </div>
  );
}

function DesktopShell({ active }: { active: boolean }) {
  const { state, t, showScreen, setSearchQuery } = useApp();
  const activeTab = TAB_GROUP[state.activeScreen];
  return (
    <div className={`desktop-shell ${active ? 'show' : ''}`}>
      <header className="d-topnav">
        <div className="d-logo"><LogoMark />Hear<span>Me</span>Out</div>
        <nav className="d-nav">
          <button className={`d-nav-item ${activeTab === 'catalog' ? 'active' : ''}`} onClick={() => showScreen('catalog')}>
            {t('nav.home')}
          </button>
          <button className={`d-nav-item ${activeTab === 'rate' ? 'active' : ''}`} onClick={() => showScreen('history')}>
            {t('nav.rate')}
          </button>
          <button className={`d-nav-item ${activeTab === 'match' ? 'active' : ''}`} onClick={() => showScreen('match')}>
            {t('nav.match')}
          </button>
          <button className={`d-nav-item ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => showScreen('stats')}>
            {t('nav.stats')}
          </button>
          <button className={`d-nav-item ${activeTab === 'groups' ? 'active' : ''}`} onClick={() => showScreen('groups')}>
            {t('nav.groups')}
          </button>
          <button className={`d-nav-item ${activeTab === 'discover' ? 'active' : ''}`} onClick={() => showScreen('discover')}>
            {t('nav.discover')}
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
          <AvatarMenu />
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
        <DockedPlayerDesktop />
      </div>
    </div>
  );
}
