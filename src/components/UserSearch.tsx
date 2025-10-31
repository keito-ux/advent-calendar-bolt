import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Calendar, User as UserIcon, X, Eye, DollarSign, Sparkles } from 'lucide-react';
import { UserCalendar } from '../lib/types';

interface UserSearchProps {
  onClose: () => void;
  onViewCalendar: (shareCode: string) => void;
  language: 'ja' | 'en';
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

interface UserWithCalendars extends UserProfile {
  calendars: UserCalendar[];
}

export function UserSearch({ onClose, onViewCalendar, language }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserWithCalendars[]>([]);
  const [allUsers, setAllUsers] = useState<UserWithCalendars[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: calendars } = await supabase
        .from('user_calendars')
        .select('*')
        .order('created_at', { ascending: false });

      if (profiles && calendars) {
        const usersWithCalendars = profiles.map(profile => ({
          ...profile,
          calendars: calendars.filter(cal => cal.creator_id === profile.id && cal.is_public)
        })).filter(user => user.calendars.length > 0);

        setAllUsers(usersWithCalendars);
        setUsers(usersWithCalendars);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    if (!searchQuery.trim()) {
      setUsers(allUsers);
      return;
    }

    const filtered = allUsers.filter(user =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setUsers(filtered);
  }

  function clearSearch() {
    setSearchQuery('');
    setUsers(allUsers);
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-white text-xl">
          {language === 'ja' ? '読み込み中...' : 'Loading...'}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full p-8 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h1 className="text-3xl font-bold text-white mb-2">
          {language === 'ja' ? 'カレンダーを探す' : 'Discover Calendars'}
        </h1>
        <p className="text-white/60 mb-6">
          {language === 'ja'
            ? '他のユーザーが作成したアドベントカレンダーを探してみましょう'
            : 'Explore advent calendars created by other users'}
        </p>

        <div className="mb-8">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={language === 'ja' ? 'ユーザー名、ID、またはメールアドレスで検索' : 'Search by username, ID, or email'}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
            >
              {language === 'ja' ? '検索' : 'Search'}
            </button>
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-semibold"
              >
                {language === 'ja' ? 'クリア' : 'Clear'}
              </button>
            )}
          </div>
          <p className="mt-3 text-white/70">
            {language === 'ja'
              ? `${users.length}人のクリエイター`
              : `${users.length} creator(s)`}
          </p>
        </div>

        <div className="space-y-6">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <UserIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">
                {language === 'ja' ? 'ユーザーが見つかりませんでした' : 'No users found'}
              </p>
            </div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="bg-black/20 rounded-xl border border-white/10 p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{user.username}</h3>
                    <p className="text-white/40 text-xs mb-1 font-mono">ID: {user.id}</p>
                    <p className="text-white/60 text-sm">
                      {language === 'ja'
                        ? `${user.calendars.length}個のカレンダー`
                        : `${user.calendars.length} calendar(s)`}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {language === 'ja' ? 'カレンダー' : 'Calendars'}
                  </h4>
                  {user.calendars.map((calendar) => {
                    const isPaid = (calendar.price || 0) > 0;
                    return (
                      <div
                        key={calendar.id}
                        className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="text-white font-medium">{calendar.title}</h5>
                              {isPaid && (
                                <div className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full px-2 py-0.5">
                                  <Sparkles className="w-3 h-3 text-yellow-400" />
                                  <span className="text-yellow-300 text-xs font-bold">
                                    {language === 'ja' ? '有料' : 'Paid'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <p className="text-white/50 text-sm">
                              {language === 'ja' ? 'テーマ: ' : 'Theme: '}
                              {calendar.theme}
                            </p>
                            {isPaid && (
                              <div className="flex items-center gap-1.5 mt-2 text-yellow-300 text-sm">
                                <DollarSign className="w-4 h-4" />
                                <span className="font-semibold">{calendar.price} {calendar.currency}</span>
                                <span className="text-white/50 text-xs ml-1">
                                  {language === 'ja' ? '〜応援チップでアクセス' : '~ Support to access'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => onViewCalendar(calendar.share_code)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          {language === 'ja' ? '表示' : 'View'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
