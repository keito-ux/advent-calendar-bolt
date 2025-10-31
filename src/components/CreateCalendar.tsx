import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CalendarTheme } from '../lib/types';
import { ThemeSelector } from './ThemeSelector';
import { X, Calendar, Globe, Lock, DollarSign } from 'lucide-react';

interface CreateCalendarProps {
  onClose: () => void;
  onSuccess: (calendarId: string) => void;
  language: 'ja' | 'en';
}

export function CreateCalendar({ onClose, onSuccess, language }: CreateCalendarProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState<CalendarTheme>('default');
  const [username, setUsername] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('0');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  async function loadUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setUsername(profile.username);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert(language === 'ja' ? 'ログインが必要です' : 'Login required');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_calendars')
      .insert({
        creator_id: user.id,
        title: title || 'My Advent Calendar',
        description: description || '',
        theme: theme,
        username: username,
        is_public: isPublic,
        price: isPaid ? parseFloat(price) || 0 : 0,
        currency: currency,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating calendar:', error);
      alert(language === 'ja' ? 'カレンダーの作成に失敗しました' : 'Failed to create calendar');
    } else if (data) {
      onSuccess(data.id);
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-8 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-8 h-8 text-green-400" />
          <h2 className="text-2xl font-bold text-white">{language === 'ja' ? '新しいカレンダーを作成' : 'Create New Calendar'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white/90 font-medium mb-2">
              {language === 'ja' ? 'タイトル' : 'Title'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={language === 'ja' ? '例: クリスマスまでの25日間' : 'e.g., 25 Days Until Christmas'}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-500"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-white/90 font-medium mb-2">
              {language === 'ja' ? '説明（任意）' : 'Description (Optional)'}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === 'ja' ? 'カレンダーの説明を入力してください' : 'Enter calendar description'}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              rows={4}
              maxLength={500}
            />
          </div>

          <ThemeSelector selectedTheme={theme} onSelectTheme={setTheme} />

          <div>
            <label className="block text-white/90 font-medium mb-3">
              {language === 'ja' ? '公開設定' : 'Privacy Settings'}
            </label>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  !isPublic
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-white" />
                  <div className="text-left">
                    <div className="text-white font-semibold">
                      {language === 'ja' ? '非公開' : 'Private'}
                    </div>
                    <div className="text-white/60 text-sm">
                      {language === 'ja'
                        ? '自分だけが閲覧可能です'
                        : 'Only you can view this calendar'}
                    </div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  isPublic
                    ? 'border-green-500 bg-green-500/20'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-white" />
                  <div className="text-left">
                    <div className="text-white font-semibold">
                      {language === 'ja' ? '公開' : 'Public'}
                    </div>
                    <div className="text-white/60 text-sm">
                      {language === 'ja'
                        ? '誰でも検索して閲覧できます'
                        : 'Anyone can find and view this calendar'}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-white/90 font-medium mb-3">
              {language === 'ja' ? '料金設定' : 'Pricing'}
            </label>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setIsPaid(false)}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  !isPaid
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-white" />
                  <div className="text-left">
                    <div className="text-white font-semibold">
                      {language === 'ja' ? '無料' : 'Free'}
                    </div>
                    <div className="text-white/60 text-sm">
                      {language === 'ja'
                        ? '誰でも無料で閲覧できます'
                        : 'Anyone can view for free'}
                    </div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setIsPaid(true)}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  isPaid
                    ? 'border-yellow-500 bg-yellow-500/20'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-white" />
                  <div className="text-left">
                    <div className="text-white font-semibold">
                      {language === 'ja' ? '有料' : 'Paid'}
                    </div>
                    <div className="text-white/60 text-sm">
                      {language === 'ja'
                        ? 'カレンダー全体に料金を設定'
                        : 'Set a price for the entire calendar'}
                    </div>
                  </div>
                </div>
              </button>

              {isPaid && (
                <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white/80 text-sm mb-2">
                        {language === 'ja' ? '価格' : 'Price'}
                      </label>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm mb-2">
                        {language === 'ja' ? '通貨' : 'Currency'}
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="JPY">JPY (¥)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-white/50 text-xs mt-2">
                    {language === 'ja'
                      ? '※ 個別の日付にも別途料金を設定できます（編集画面で設定）'
                      : '* You can also set prices for individual days (in edit mode)'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              disabled={loading}
            >
              {language === 'ja' ? 'キャンセル' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (language === 'ja' ? '作成中...' : 'Creating...') : (language === 'ja' ? '作成' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
