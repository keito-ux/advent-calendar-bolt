import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserCalendar } from '../lib/types';
import { X, Users, Calendar, Mail, Clock, Search, Eye } from 'lucide-react';

interface AdminDashboardProps {
  onClose: () => void;
  language: 'ja' | 'en';
  onViewCalendar: (shareCode: string) => void;
}

interface Profile {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

interface CalendarStats {
  total_calendars: number;
  total_users: number;
}

export function AdminDashboard({ onClose, language, onViewCalendar }: AdminDashboardProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [calendars, setCalendars] = useState<UserCalendar[]>([]);
  const [filteredCalendars, setFilteredCalendars] = useState<UserCalendar[]>([]);
  const [stats, setStats] = useState<CalendarStats>({ total_calendars: 0, total_users: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: calendarsData } = await supabase
      .from('user_calendars')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesData) setProfiles(profilesData);
    if (calendarsData) {
      setCalendars(calendarsData);
      setFilteredCalendars(calendarsData);
    }

    setStats({
      total_users: profilesData?.length || 0,
      total_calendars: calendarsData?.length || 0,
    });

    setLoading(false);
  }

  function handleSearch() {
    if (!searchQuery.trim()) {
      setFilteredCalendars(calendars);
      setSelectedUserId(null);
      return;
    }

    const profile = profiles.find(
      p => p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
           p.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (profile) {
      const userCalendars = calendars.filter(c => c.user_id === profile.id);
      setFilteredCalendars(userCalendars);
      setSelectedUserId(profile.id);
    } else {
      setFilteredCalendars([]);
      setSelectedUserId(null);
    }
  }

  function clearSearch() {
    setSearchQuery('');
    setFilteredCalendars(calendars);
    setSelectedUserId(null);
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
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-6xl w-full p-8 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h1 className="text-3xl font-bold text-white mb-6">
          {language === 'ja' ? '管理者ダッシュボード' : 'Admin Dashboard'}
        </h1>

        <div className="mb-8">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={language === 'ja' ? 'ユーザー名またはメールアドレスで検索' : 'Search by username or email'}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
            >
              {language === 'ja' ? '検索' : 'Search'}
            </button>
            {selectedUserId && (
              <button
                onClick={clearSearch}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-semibold"
              >
                {language === 'ja' ? 'クリア' : 'Clear'}
              </button>
            )}
          </div>
          {selectedUserId && (
            <p className="mt-3 text-white/70">
              {language === 'ja' ? `検索結果: ${filteredCalendars.length}件のカレンダー` : `Results: ${filteredCalendars.length} calendar(s)`}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-blue-400" />
              <h2 className="text-xl font-bold text-white">
                {language === 'ja' ? '総ユーザー数' : 'Total Users'}
              </h2>
            </div>
            <p className="text-4xl font-bold text-white">{stats.total_users}</p>
          </div>

          <div className="bg-green-600/20 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-8 h-8 text-green-400" />
              <h2 className="text-xl font-bold text-white">
                {language === 'ja' ? '総カレンダー数' : 'Total Calendars'}
              </h2>
            </div>
            <p className="text-4xl font-bold text-white">{stats.total_calendars}</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-6 h-6" />
              {language === 'ja' ? 'ユーザー一覧' : 'User List'}
            </h2>
            <div className="bg-black/20 rounded-xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-white/90 font-semibold">
                        {language === 'ja' ? 'ユーザー名' : 'Username'}
                      </th>
                      <th className="px-4 py-3 text-left text-white/90 font-semibold">
                        {language === 'ja' ? 'メールアドレス' : 'Email'}
                      </th>
                      <th className="px-4 py-3 text-left text-white/90 font-semibold">
                        {language === 'ja' ? '登録日時' : 'Created At'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((profile) => (
                      <tr key={profile.id} className="border-t border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 text-white">{profile.username}</td>
                        <td className="px-4 py-3 text-white/80 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {profile.email}
                        </td>
                        <td className="px-4 py-3 text-white/60 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {new Date(profile.created_at).toLocaleString(language === 'ja' ? 'ja-JP' : 'en-US')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              {language === 'ja' ? 'カレンダー一覧' : 'Calendar List'}
            </h2>
            <div className="bg-black/20 rounded-xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-white/90 font-semibold">
                        {language === 'ja' ? 'タイトル' : 'Title'}
                      </th>
                      <th className="px-4 py-3 text-left text-white/90 font-semibold">
                        {language === 'ja' ? '作成者' : 'Creator'}
                      </th>
                      <th className="px-4 py-3 text-left text-white/90 font-semibold">
                        {language === 'ja' ? 'テーマ' : 'Theme'}
                      </th>
                      <th className="px-4 py-3 text-left text-white/90 font-semibold">
                        {language === 'ja' ? '作成日時' : 'Created At'}
                      </th>
                      <th className="px-4 py-3 text-left text-white/90 font-semibold">
                        {language === 'ja' ? '操作' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCalendars.map((calendar) => (
                      <tr key={calendar.id} className="border-t border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 text-white">{calendar.title}</td>
                        <td className="px-4 py-3 text-white/80">{calendar.username || '-'}</td>
                        <td className="px-4 py-3 text-white/60">{calendar.theme}</td>
                        <td className="px-4 py-3 text-white/60">
                          {new Date(calendar.created_at).toLocaleString(language === 'ja' ? 'ja-JP' : 'en-US')}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => onViewCalendar(calendar.share_code)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            {language === 'ja' ? '表示' : 'View'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
