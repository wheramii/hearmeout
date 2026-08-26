'use client';

import { useApp } from '@/lib/AppContext';
import { RecapTeaser } from './screens/RecapTeaser';

function FriendTile({ friend }: { friend: { id: string; name: string; avatarUrl: string | null } }) {
  const { viewFriend } = useApp();
  const hasPhoto = !!friend.avatarUrl;
  return (
    <div
      className={`friend-tile ${hasPhoto ? '' : 'cover-fallback'}`}
      style={hasPhoto ? { backgroundImage: `url('${friend.avatarUrl}')` } : undefined}
      onClick={() => viewFriend(friend.id)}
    >
      {!hasPhoto && <span className="fallback-letter">{(friend.name[0] || '?').toUpperCase()}</span>}
      <div className="ft-name">{friend.name}</div>
    </div>
  );
}

export function FriendsRow() {
  const { t, me, showScreen } = useApp();
  if (!me) return null;

  return (
    <div className="friends-row">
      <RecapTeaser />
      {me.friends.map((f) => <FriendTile key={f.id} friend={f} />)}
      <button className="add-friend-tile" onClick={() => showScreen('profile')}>
        <span className="aft-btn">+</span>
        <span className="aft-label">{t('friends.addFriendsTile')}</span>
      </button>
    </div>
  );
}
