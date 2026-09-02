import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Что мы храним — HearMeOut' };

// Plain server component, deliberately outside AppProvider/AppGate — same
// reasoning as /u/[handle]: a page a user might link to or read without
// being logged in, so it shouldn't depend on client-side auth state.
export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '48px 20px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ fontFamily: 'var(--font-space-grotesk),sans-serif', fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
          Что мы храним
        </div>
        <div style={{ fontSize: 14.5, lineHeight: 1.8, color: 'var(--text)' }}>
          <p style={{ marginBottom: 14 }}>Мы храним только то, что нужно для самого приложения: имя, e-mail, пароль (в зашифрованном виде — мы его не видим), ваши оценки и рецензии, и историю прослушиваний, если вы подключили Spotify или загрузили её сами.</p>
          <p style={{ marginBottom: 14 }}>Мы не запрашиваем и не храним возраст, город или номер телефона — они не нужны для сравнения музыкального вкуса.</p>
          <p style={{ marginBottom: 14 }}>Ваш полный профиль (статистика, история оценок) виден только вам и вашим друзьям. Найти вас по имени может любой пользователь, но зайти в профиль — только тот, кого вы добавили в друзья.</p>
          <p style={{ marginBottom: 14 }}>Обложки альбомов и данные о треках берутся напрямую у Spotify и Deezer — мы не храним и не раздаём музыкальные файлы.</p>
          <p style={{ marginBottom: 14 }}>Вы можете удалить аккаунт в любой момент в настройках — это стирает все перечисленные данные без возможности восстановления.</p>
        </div>
        <div style={{ marginTop: 30, textAlign: 'center' }}>
          <a href="/" style={{ color: 'var(--lime)', fontSize: 13, fontFamily: 'var(--font-ibm-plex-mono),monospace' }}>HearMeOut →</a>
        </div>
      </div>
    </div>
  );
}
