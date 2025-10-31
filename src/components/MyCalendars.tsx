import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserCalendar } from '../lib/types';
import { getThemeConfig } from '../lib/themes';
import { Plus, Calendar, Share2, Edit, Trash2, LogOut, Gift, Snowflake, ArrowLeft, BookOpen, Globe, Lock, DollarSign, TrendingUp } from 'lucide-react';
import { Auth } from './Auth';
import ThreeViewer from './ThreeViewer';

interface MyCalendarsProps {
  onCreateNew: () => void;
  onEdit: (calendar: UserCalendar) => void;
  onView: (shareCode: string) => void;
  onBackToMain?: () => void;
  language: 'ja' | 'en';
  onLanguageChange: (lang: 'ja' | 'en') => void;
}

export function MyCalendars({ onCreateNew, onEdit, onView, onBackToMain, language, onLanguageChange }: MyCalendarsProps) {
  const [calendars, setCalendars] = useState<UserCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [earnings, setEarnings] = useState<Record<string, { total: number, count: number }>>({});

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      loadCalendars(user.id);
    } else {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserId(null);
    setCalendars([]);
  }

  async function loadCalendars(uid: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('creator_id', uid)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading calendars:', error);
    } else {
      setCalendars(data || []);

      if (data) {
        const calendarIds = data.map(c => c.id);
        const { data: purchases } = await supabase
          .from('calendar_purchases')
          .select('calendar_id, amount')
          .in('calendar_id', calendarIds)
          .eq('status', 'completed');

        if (purchases) {
          const earningsMap: Record<string, { total: number, count: number }> = {};
          purchases.forEach(p => {
            if (!earningsMap[p.calendar_id]) {
              earningsMap[p.calendar_id] = { total: 0, count: 0 };
            }
            earningsMap[p.calendar_id].total += p.amount;
            earningsMap[p.calendar_id].count += 1;
          });
          setEarnings(earningsMap);
        }
      }
    }
    setLoading(false);
  }

  async function handleDelete(calendarId: string) {
    if (!confirm('このカレンダーを削除しますか？')) return;

    const { error } = await supabase
      .from('user_calendars')
      .delete()
      .eq('id', calendarId);

    if (error) {
      alert('削除に失敗しました');
      console.error(error);
    } else {
      setCalendars(calendars.filter(c => c.id !== calendarId));
    }
  }

  function copyShareLink(shareCode: string) {
    const url = `${window.location.origin}?calendar=${shareCode}`;
    navigator.clipboard.writeText(url);
    alert('共有リンクをコピーしました！');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    );
  }

  if (!userId) {
    return (
      <>
        <div className="max-w-2xl mx-auto p-8 text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-white/70" />
            <h2 className="text-2xl font-bold text-white mb-4">ログインが必要です</h2>
            <p className="text-white/80 mb-6">
              カレンダーを作成・管理するにはログインしてください
            </p>
            <button
              onClick={() => setShowAuth(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              {language === 'ja' ? 'ログイン / 新規登録' : 'Login / Sign Up'}
            </button>
          </div>
        </div>
        {showAuth && (
          <Auth
            onClose={() => setShowAuth(false)}
            onSuccess={() => {
              setShowAuth(false);
              checkUser();
            }}
            language={language}
          />
        )}
      </>
    );
  }

  return (
    <div className="relative overflow-hidden min-h-screen">
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(80)].map((_, i) => {
          const left = Math.random() * 100;
          const delay = Math.random() * 8;
          const duration = 15 + Math.random() * 15;
          const size = 1.5 + Math.random() * 3;
          return (
            <div
              key={i}
              className="absolute animate-snowfall"
              style={{
                left: `${left}%`,
                top: '-20px',
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                width: `${size}px`,
                height: `${size}px`,
              }}
            >
              <div className="w-full h-full bg-white rounded-full opacity-90 shadow-lg" />
            </div>
          );
        })}
      </div>

      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <Snowflake className="absolute top-10 left-10 w-8 h-8 text-white animate-pulse" />
        <Snowflake className="absolute top-20 right-20 w-6 h-6 text-white animate-pulse" style={{ animationDelay: '0.5s' }} />
        <Snowflake className="absolute top-40 left-1/4 w-10 h-10 text-white animate-pulse" style={{ animationDelay: '1s' }} />
        <Snowflake className="absolute bottom-20 right-1/3 w-8 h-8 text-white animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="max-w-6xl mx-auto p-8 relative z-10">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <ThreeViewer
              modelUrl="https://cxhpdgmlnfumkxwsyopq.supabase.co/storage/v1/object/public/advent.pics/uploads/Pixar_style_snowy_fai_1030150859_texture.glb"
              className="w-32 h-32"
            />
            <div>
              <h1 className="text-6xl font-bold text-white drop-shadow-2xl mb-2" style={{ fontFamily: 'Georgia, serif', textShadow: '0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(255,100,100,0.3)' }}>
                Merry Christmas
              </h1>
              <div className="flex items-center justify-center gap-2">
                <Gift className="w-6 h-6 text-red-400 animate-bounce" />
                <p className="text-xl text-white/90 drop-shadow-lg" style={{ fontFamily: 'Georgia, serif' }}>
                  {language === 'ja' ? 'アドベントカレンダー コレクション' : 'Advent Calendar Collection'}
                </p>
                <Gift className="w-6 h-6 text-green-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
            <ThreeViewer
              modelUrl="https://cxhpdgmlnfumkxwsyopq.supabase.co/storage/v1/object/public/advent.pics/uploads/Pixar_style_snowy_fai_1030150921_texture.glb"
              className="w-32 h-32"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white drop-shadow-lg" style={{ fontFamily: 'Georgia, serif' }}>{language === 'ja' ? 'マイカレンダー' : 'My Calendars'}</h2>
        <div className="flex gap-3">
          <button
            onClick={() => onLanguageChange(language === 'ja' ? 'en' : 'ja')}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <Globe className="w-5 h-5" />
            {language === 'ja' ? 'English' : '日本語'}
          </button>
          {onBackToMain && (
            <button
              onClick={onBackToMain}
              className="flex items-center gap-2 bg-gradient-to-r from-slate-100 to-blue-100 hover:from-slate-200 hover:to-blue-200 text-slate-800 px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 border-2 border-white/50"
              style={{ textShadow: '0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(200,220,255,0.6)' }}
            >
              <BookOpen className="w-5 h-5" />
              {language === 'ja' ? '絵本カレンダーに戻る' : 'Back to Picture Book'}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <LogOut className="w-5 h-5" />
            {language === 'ja' ? 'ログアウト' : 'Logout'}
          </button>
          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            {language === 'ja' ? '新規作成' : 'Create New'}
          </button>
        </div>
      </div>

      {calendars.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center">
          <Calendar className="w-20 h-20 mx-auto mb-4 text-white/50" />
          <h2 className="text-2xl font-bold text-white mb-2">{language === 'ja' ? 'カレンダーがありません' : 'No Calendars Yet'}</h2>
          <p className="text-white/70 mb-6">
            {language === 'ja' ? '最初のアドベントカレンダーを作成しましょう' : 'Create your first advent calendar'}
          </p>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            {language === 'ja' ? 'カレンダーを作成' : 'Create Calendar'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {calendars.map((calendar) => {
            const themeConfig = getThemeConfig(calendar.theme as any);
            return (
              <div
                key={calendar.id}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 hover:bg-white/15 transition-all border border-white/10"
                style={{ background: `linear-gradient(135deg, ${themeConfig.preview.split('(')[1].split(')')[0]})` }}
              >
                <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4">
                  <h3 className="text-xl font-bold text-white mb-2">{calendar.title}</h3>
                  <p className="text-white/70 text-sm mb-3 line-clamp-2">
                    {calendar.description || (language === 'ja' ? '説明なし' : 'No description')}
                  </p>
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="text-white/50 text-xs">
                        {language === 'ja' ? 'テーマ' : 'Theme'}: {themeConfig.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        {calendar.is_public ? (
                          <>
                            <Globe className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-green-400 font-semibold">{language === 'ja' ? '公開' : 'Public'}</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-blue-400 font-semibold">{language === 'ja' ? '非公開' : 'Private'}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {(calendar.price && calendar.price > 0) && (
                      <div className="flex items-center gap-1.5 text-xs text-yellow-300">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span className="font-semibold">{calendar.price} {calendar.currency}</span>
                      </div>
                    )}
                    {earnings[calendar.id] && (
                      <div className="flex items-center gap-1.5 text-xs bg-green-500/20 rounded px-2 py-1">
                        <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-300 font-semibold">
                          {language === 'ja' ? '売上' : 'Earnings'}: {earnings[calendar.id].total.toFixed(2)} ({earnings[calendar.id].count} {language === 'ja' ? '購入' : 'purchases'})
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onEdit(calendar)}
                  className="flex items-center gap-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <Edit className="w-4 h-4" />
                  {language === 'ja' ? '編集' : 'Edit'}
                </button>
                <button
                  onClick={() => onView(calendar.share_code)}
                  className="flex items-center gap-1 bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white px-3 py-2 rounded-lg text-sm transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <Calendar className="w-4 h-4" />
                  {language === 'ja' ? '表示' : 'View'}
                </button>
                <button
                  onClick={() => copyShareLink(calendar.share_code)}
                  className="flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-3 py-2 rounded-lg text-sm transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <Share2 className="w-4 h-4" />
                  {language === 'ja' ? '共有' : 'Share'}
                </button>
                <button
                  onClick={() => handleDelete(calendar.id)}
                  className="flex items-center gap-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-3 py-2 rounded-lg text-sm transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                >
                    <Trash2 className="w-4 h-4" />
                    {language === 'ja' ? '削除' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
