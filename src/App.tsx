import { useState, useEffect } from 'react'
import { CalendarGrid } from './components/CalendarGrid'
import { SceneDetail } from './components/SceneDetail'
import { ArtistProfile } from './components/ArtistProfile'
import { TipModal } from './components/TipModal'
import UploadScene from './components/UploadScene'
import { MyCalendars } from './components/MyCalendars'
import { CreateCalendar } from './components/CreateCalendar'
import { EditCalendar } from './components/EditCalendar'
import { ViewSharedCalendar } from './components/ViewSharedCalendar'
import { AdminDashboard } from './components/AdminDashboard'
import { UserSearch } from './components/UserSearch'
import type { Scene, UserCalendar } from './lib/types'
import { User, Globe, Shield, Search } from 'lucide-react'
import { supabase } from './lib/supabase'

type View =
  | { type: 'calendar' }
  | { type: 'scene'; dayNumber: number; scene: Scene | null }
  | { type: 'artist'; artistId: string }
  | { type: 'tip'; artistId: string; artistName: string; sceneId?: string }
  | { type: 'my-calendars' }
  | { type: 'create-calendar' }
  | { type: 'edit-calendar'; calendar: UserCalendar }
  | { type: 'view-shared'; shareCode: string }
  | { type: 'admin-dashboard' }
  | { type: 'user-search' }

export default function App() {
  const [view, setView] = useState<View>({ type: 'calendar' })
  const [language, setLanguage] = useState<'ja' | 'en'>('ja')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareCode = params.get('calendar');
    if (shareCode) {
      setView({ type: 'view-shared', shareCode });
    }
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.is_admin) {
      setIsAdmin(true);
    }
  }

  function handleSceneClick(dayNumber: number, scene: Scene | null) {
    setView({ type: 'scene', dayNumber, scene })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950">
      <div className="flex items-center justify-between px-8 pt-4 pb-2">
        <h1 className="text-2xl font-bold text-white">🎄 {language === 'ja' ? '絵本アドベントカレンダー' : 'Picture Book Advent Calendar'}</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setLanguage(language === 'ja' ? 'en' : 'ja')}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Globe className="w-5 h-5" />
            {language === 'ja' ? 'English' : '日本語'}
          </button>
          <button
            onClick={() => setView({ type: 'user-search' })}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Search className="w-5 h-5" />
            {language === 'ja' ? 'カレンダーを探す' : 'Discover'}
          </button>
          {isAdmin && (
            <button
              onClick={() => setView({ type: 'admin-dashboard' })}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Shield className="w-5 h-5" />
              {language === 'ja' ? '管理者' : 'Admin'}
            </button>
          )}
          <button
            onClick={() => setView({ type: 'my-calendars' })}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <User className="w-5 h-5" />
            {language === 'ja' ? 'マイカレンダー' : 'My Calendars'}
          </button>
        </div>
      </div>

      {view.type === 'calendar' && (
        <>
          <UploadScene />
          <CalendarGrid
            onSceneClick={handleSceneClick}
            modelUrl1="https://cxhpdgmlnfumkxwsyopq.supabase.co/storage/v1/object/public/advent.pics/uploads/Pixar_style_snowy_fai_1030150859_texture.glb"
            modelUrl2="https://cxhpdgmlnfumkxwsyopq.supabase.co/storage/v1/object/public/advent.pics/uploads/Pixar_style_snowy_fai_1030150921_texture.glb"
          />
        </>
      )}

      {view.type === 'my-calendars' && (
        <MyCalendars
          onCreateNew={() => setView({ type: 'create-calendar' })}
          onEdit={(calendar) => setView({ type: 'edit-calendar', calendar })}
          onView={(shareCode) => setView({ type: 'view-shared', shareCode })}
          onBackToMain={() => setView({ type: 'calendar' })}
          language={language}
          onLanguageChange={setLanguage}
        />
      )}

      {view.type === 'scene' && view.scene && (
        <SceneDetail
          dayNumber={view.dayNumber}
          scene={view.scene}
          onClose={() => setView({ type: 'calendar' })}
        />
      )}

      {view.type === 'artist' && (
        <ArtistProfile
          artistId={view.artistId}
          onClose={() => setView({ type: 'calendar' })}
        />
      )}

      {view.type === 'tip' && (
        <TipModal
          artistId={view.artistId}
          artistName={view.artistName}
          sceneId={view.sceneId}
          onClose={() => setView({ type: 'calendar' })}
          onSuccess={() => setView({ type: 'calendar' })}
        />
      )}

      {view.type === 'create-calendar' && (
        <CreateCalendar
          onClose={() => setView({ type: 'my-calendars' })}
          onSuccess={(calendarId) => {
            setView({ type: 'my-calendars' });
          }}
          language={language}
        />
      )}

      {view.type === 'edit-calendar' && (
        <EditCalendar
          calendar={view.calendar}
          onClose={() => setView({ type: 'my-calendars' })}
          onSave={() => setView({ type: 'my-calendars' })}
          onBack={() => setView({ type: 'my-calendars' })}
          language={language}
        />
      )}

      {view.type === 'view-shared' && (
        <ViewSharedCalendar
          shareCode={view.shareCode}
          onClose={() => setView({ type: 'my-calendars' })}
          onBack={() => setView({ type: 'my-calendars' })}
          language={language}
        />
      )}

      {view.type === 'admin-dashboard' && (
        <AdminDashboard
          onClose={() => setView({ type: 'calendar' })}
          language={language}
          onViewCalendar={(shareCode) => setView({ type: 'view-shared', shareCode })}
        />
      )}

      {view.type === 'user-search' && (
        <UserSearch
          onClose={() => setView({ type: 'calendar' })}
          onViewCalendar={(shareCode) => setView({ type: 'view-shared', shareCode })}
          language={language}
        />
      )}
    </div>
  )
}
