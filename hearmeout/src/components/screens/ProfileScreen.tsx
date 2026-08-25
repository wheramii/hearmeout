'use client';

import { useRef } from 'react';
import { useApp } from '@/lib/AppContext';
import type { Device } from '@/lib/types';
import { userAvatarStyle } from '@/lib/format';
import { ConnectBlock, RecapOpenButton, GenresBlock, Top4Grid, FriendsBlock, AwardsBlock } from '../ProfileBlocks';

function AvatarPicker({ size }: { size?: number }) {
  const { me, updateAvatar } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  if (!me) return null;
  return (
    <div
      className={`avatar-lg ${me.avatarUrl ? 'has-img' : ''}`}
      style={{ ...(size ? { width: size, height: size } : {}), ...userAvatarStyle(me) }}
      onClick={() => inputRef.current?.click()}
    >
      <span className="hint" style={size ? { fontSize: 11 } : undefined}>Изменить<br />фото</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => updateAvatar(reader.result as string);
          reader.readAsDataURL(file);
        }}
      />
    </div>
  );
}

export function ProfileScreen({ device }: { device: Device }) {
  const { me, syncSpotify, updateProfileName, updateProfileHandle } = useApp();
  if (!me) return null;

  const statGrid = (
    <div className="stat-grid">
      <div className="box"><div className="v">{me.stats.ratings}</div><div className="l">ОЦЕНОК</div></div>
      <div className="box"><div className="v">{me.stats.avg || '—'}</div><div className="l">СР. БАЛЛ</div></div>
      <div className="box"><div className="v">{me.stats.reviews}</div><div className="l">РЕЦЕНЗИЙ</div></div>
    </div>
  );

  const connectionSection = (
    <>
      <div className="section-head"><h2>Подключение</h2><span>Spotify / Apple Music</span></div>
      <div style={{ marginBottom: 12 }}><ConnectBlock /></div>
      {me.connections.spotify && (
        <button className="btn-ghost" style={{ width: '100%', marginBottom: 22 }} onClick={() => syncSpotify()}>
          ⟳ Синхронизировать сейчас
        </button>
      )}
    </>
  );

  if (device === 'mobile') {
    return (
      <>
        <div className="eyebrow">Профиль</div>
        <div className="profile-head">
          <AvatarPicker />
          <div style={{ flex: 1 }}>
            <input className="name-input" defaultValue={me.name} onBlur={(e) => updateProfileName(e.target.value)} />
            <input className="handle-input" defaultValue={me.handle} onBlur={(e) => updateProfileHandle(e.target.value)} />
          </div>
        </div>
        {statGrid}

        {connectionSection}

        <div className="section-head"><h2>Рекап</h2><span>день / месяц / сезон</span></div>
        <div style={{ marginBottom: 24 }}><RecapOpenButton userId="me" label="Открыть рекап дня" /></div>

        <div className="section-head"><h2>Любимые жанры</h2><span>за всё время</span></div>
        <div style={{ marginBottom: 24 }}><GenresBlock genres={me.genres} /></div>

        <div className="section-head"><h2>Топ-4 альбома</h2><span>по вашим оценкам</span></div>
        <Top4Grid ids={me.top4Albums} />

        <div className="section-head"><h2>Друзья</h2><span>{me.friends.length}</span></div>
        <div style={{ marginBottom: 14 }}><FriendsBlock /></div>

        <div className="section-head"><h2>Награды месяца</h2><span>в кругу друзей</span></div>
        <div style={{ marginBottom: 10 }}><AwardsBlock /></div>
      </>
    );
  }

  return (
    <div className="d-profile-layout">
      <div className="side">
        <AvatarPicker size={120} />
        <input className="name-input" defaultValue={me.name} style={{ fontSize: 22, marginTop: 14 }} onBlur={(e) => updateProfileName(e.target.value)} />
        <input className="handle-input" defaultValue={me.handle} style={{ fontSize: 13 }} onBlur={(e) => updateProfileHandle(e.target.value)} />
        <div className="stat-grid" style={{ gridTemplateColumns: '1fr', marginTop: 22 }}>
          <div className="box"><div className="v">{me.stats.ratings}</div><div className="l">ОЦЕНОК</div></div>
          <div className="box"><div className="v">{me.stats.avg || '—'}</div><div className="l">СР. БАЛЛ</div></div>
          <div className="box"><div className="v">{me.stats.reviews}</div><div className="l">РЕЦЕНЗИЙ</div></div>
        </div>
        <div className="section-head" style={{ marginTop: 22 }}><h2>Друзья</h2><span>{me.friends.length}</span></div>
        <FriendsBlock />
      </div>
      <div className="main">
        {connectionSection}
        <div className="section-head"><h2>Рекап</h2><span>день / месяц / сезон</span></div>
        <div style={{ marginBottom: 28, maxWidth: 480 }}><RecapOpenButton userId="me" label="Открыть рекап дня" /></div>
        <div className="section-head"><h2>Любимые жанры</h2><span>за всё время</span></div>
        <div style={{ marginBottom: 30, maxWidth: 420 }}><GenresBlock genres={me.genres} /></div>
        <div className="section-head"><h2>Топ-4 альбома</h2><span>по вашим оценкам</span></div>
        <div style={{ maxWidth: 520, marginBottom: 30 }}><Top4Grid ids={me.top4Albums} /></div>
        <div className="section-head"><h2>Награды месяца</h2><span>в кругу друзей</span></div>
        <div style={{ maxWidth: 480 }}><AwardsBlock /></div>
      </div>
    </div>
  );
}
