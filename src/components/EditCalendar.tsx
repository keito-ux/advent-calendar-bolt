import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserCalendar, UserCalendarDay, CalendarTheme } from '../lib/types';
import { getThemeConfig } from '../lib/themes';
import { X, Upload, Save, Image as ImageIcon, Palette, ArrowLeft, Gift, Globe, Lock, DollarSign } from 'lucide-react';
import ThreeViewer from './ThreeViewer';

interface EditCalendarProps {
  calendar: UserCalendar;
  onClose: () => void;
  onSave: () => void;
  onBack?: () => void;
  language: 'ja' | 'en';
}

export function EditCalendar({ calendar, onClose, onSave, onBack, language }: EditCalendarProps) {
  const [days, setDays] = useState<UserCalendarDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<CalendarTheme>(calendar.theme as CalendarTheme || 'default');
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [isPublic, setIsPublic] = useState(calendar.is_public);

  const themeConfig = getThemeConfig(currentTheme);

  useEffect(() => {
    loadDays();
  }, [calendar.id]);

  async function loadDays() {
    const { data, error } = await supabase
      .from('user_calendar_days')
      .select('*')
      .eq('calendar_id', calendar.id)
      .order('day_number');

    if (error) {
      console.error('Error loading days:', error);
    } else {
      setDays(data || []);
    }
    setLoading(false);
  }

  async function handleDayUpdate(dayNumber: number, field: 'title' | 'message' | 'price' | 'currency', value: string | number) {
    const existingDay = days.find(d => d.day_number === dayNumber);

    if (existingDay) {
      const { error } = await supabase
        .from('user_calendar_days')
        .update({ [field]: value })
        .eq('id', existingDay.id);

      if (error) {
        console.error('Error updating day:', error);
        return;
      }

      setDays(days.map(d => d.id === existingDay.id ? { ...d, [field]: value } : d));
    } else {
      const { data, error } = await supabase
        .from('user_calendar_days')
        .insert({
          calendar_id: calendar.id,
          day_number: dayNumber,
          [field]: value,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating day:', error);
        return;
      }

      if (data) {
        setDays([...days, data].sort((a, b) => a.day_number - b.day_number));
      }
    }
  }

  async function handleThemeChange(newTheme: CalendarTheme) {
    const { error } = await supabase
      .from('user_calendars')
      .update({ theme: newTheme })
      .eq('id', calendar.id);

    if (error) {
      console.error('Error updating theme:', error);
      alert('テーマの変更に失敗しました');
      return;
    }

    setCurrentTheme(newTheme);
    setShowThemeSelector(false);
  }

  async function handlePrivacyChange(newIsPublic: boolean) {
    const { error } = await supabase
      .from('user_calendars')
      .update({ is_public: newIsPublic })
      .eq('id', calendar.id);

    if (error) {
      console.error('Error updating privacy:', error);
      alert(language === 'ja' ? '公開設定の変更に失敗しました' : 'Failed to update privacy settings');
      return;
    }

    setIsPublic(newIsPublic);
  }

  async function handleImageUpload(dayNumber: number, file: File) {
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${calendar.id}/${dayNumber}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('advent.pics')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      alert('画像のアップロードに失敗しました');
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('advent.pics')
      .getPublicUrl(fileName);

    const existingDay = days.find(d => d.day_number === dayNumber);

    if (existingDay) {
      const { error } = await supabase
        .from('user_calendar_days')
        .update({ image_url: publicUrl })
        .eq('id', existingDay.id);

      if (error) {
        console.error('Error updating day image:', error);
      } else {
        setDays(days.map(d => d.id === existingDay.id ? { ...d, image_url: publicUrl } : d));
        setSelectedDay(null);
      }
    } else {
      const { data, error } = await supabase
        .from('user_calendar_days')
        .insert({
          calendar_id: calendar.id,
          day_number: dayNumber,
          image_url: publicUrl,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating day:', error);
      } else if (data) {
        setDays([...days, data].sort((a, b) => a.day_number - b.day_number));
        setSelectedDay(null);
      }
    }

    setUploading(false);
  }

  const currentDay = selectedDay ? days.find(d => d.day_number === selectedDay) : null;

  return (
    <div className={`fixed inset-0 bg-gradient-to-br ${themeConfig.gradient} z-50 p-4 overflow-y-auto`}>
      <div className={`${themeConfig.cardBackground} rounded-2xl shadow-2xl max-w-6xl w-full mx-auto p-8 relative my-8 border border-white/10`}>
        <div className="flex items-center justify-center gap-4 mb-6 pt-4">
          <ThreeViewer
            modelUrl="https://cxhpdgmlnfumkxwsyopq.supabase.co/storage/v1/object/public/advent.pics/uploads/Pixar_style_snowy_fai_1030150859_texture.glb"
            className="w-20 h-20"
          />
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white drop-shadow-2xl mb-1" style={{ fontFamily: 'Georgia, serif', textShadow: '0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(255,100,100,0.3)' }}>
              Merry Christmas
            </h1>
            <div className="flex items-center justify-center gap-2">
              <Gift className="w-5 h-5 text-red-400 animate-bounce" />
              <p className="text-lg text-white/90 drop-shadow-lg" style={{ fontFamily: 'Georgia, serif' }}>
                {language === 'ja' ? '編集モード' : 'Edit Mode'}
              </p>
              <Gift className="w-5 h-5 text-green-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
          <ThreeViewer
            modelUrl="https://cxhpdgmlnfumkxwsyopq.supabase.co/storage/v1/object/public/advent.pics/uploads/Pixar_style_snowy_fai_1030150921_texture.glb"
            className="w-20 h-20"
          />
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-4 left-4 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors z-10"
          >
            <ArrowLeft className="w-5 h-5" />
            {language === 'ja' ? 'マイカレンダーに戻る' : 'Back to My Calendars'}
          </button>
        )}

        <div className="flex items-center justify-between mb-6 mt-4">
          <h2 className={`text-3xl font-bold ${themeConfig.textColor}`}>{calendar.title}</h2>
          <div className="flex gap-3">
            <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2 border border-white/10">
              {isPublic ? (
                <>
                  <Globe className="w-4 h-4 text-green-400" />
                  <span className="text-white/80 text-sm">{language === 'ja' ? '公開' : 'Public'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-blue-400" />
                  <span className="text-white/80 text-sm">{language === 'ja' ? '非公開' : 'Private'}</span>
                </>
              )}
              <button
                onClick={() => handlePrivacyChange(!isPublic)}
                className="ml-2 text-xs text-white/60 hover:text-white underline"
              >
                {language === 'ja' ? '変更' : 'Change'}
              </button>
            </div>
            <button
              onClick={() => setShowThemeSelector(!showThemeSelector)}
              className={`flex items-center gap-2 ${themeConfig.accentColor} hover:opacity-90 text-white px-4 py-2 rounded-lg transition-all`}
            >
              <Palette className="w-5 h-5" />
              {language === 'ja' ? 'テーマ変更' : 'Change Theme'}
            </button>
          </div>
        </div>

        {showThemeSelector && (
          <div className="mb-6 bg-black/20 rounded-xl p-4 border border-white/10">
            <h3 className="text-white font-bold mb-3">{language === 'ja' ? 'テーマを選択' : 'Select Theme'}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(['default', 'winter', 'festive', 'cozy', 'elegant', 'galaxy'] as CalendarTheme[]).map((theme) => {
                const config = getThemeConfig(theme);
                return (
                  <button
                    key={theme}
                    onClick={() => handleThemeChange(theme)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      currentTheme === theme
                        ? 'border-white scale-105'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                    style={{ background: config.preview }}
                  >
                    <div className="text-white font-bold text-sm">{config.name}</div>
                    <div className="text-white/70 text-xs">{config.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-white text-xl">{language === 'ja' ? '読み込み中...' : 'Loading...'}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className={`text-xl font-bold ${themeConfig.textColor} mb-4`}>{language === 'ja' ? '日付を選択' : 'Select Date'}</h3>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 25 }, (_, i) => i + 1).map(dayNum => {
                  const dayData = days.find(d => d.day_number === dayNum);
                  const hasContent = dayData && (dayData.title || dayData.message || dayData.image_url);
                  return (
                    <button
                      key={dayNum}
                      onClick={() => setSelectedDay(dayNum)}
                      className={`aspect-square rounded-lg flex items-center justify-center font-bold text-lg transition-all relative overflow-hidden ${
                        selectedDay === dayNum
                          ? 'scale-110 ring-4 ring-white'
                          : hasContent
                          ? 'hover:scale-105'
                          : 'hover:scale-105'
                      }`}
                    >
                      {dayData?.image_url ? (
                        <>
                          <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${dayData.image_url})` }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          <span className="relative z-10 text-white drop-shadow-lg">{dayNum}</span>
                        </>
                      ) : (
                        <>
                          <div className={`absolute inset-0 ${
                            hasContent
                              ? `${themeConfig.accentColor}/70`
                              : 'bg-white/10'
                          }`} />
                          <span className="relative z-10 text-white">{dayNum}</span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              {selectedDay ? (
                <div className="space-y-4">
                  <h3 className={`text-xl font-bold ${themeConfig.textColor}`}>{language === 'ja' ? `12月 ${selectedDay} 日` : `December ${selectedDay}`}</h3>

                  <div>
                    <label className={`block ${themeConfig.textColor} font-medium mb-2`}>{language === 'ja' ? 'タイトル' : 'Title'}</label>
                    <input
                      type="text"
                      value={currentDay?.title || ''}
                      onChange={(e) => handleDayUpdate(selectedDay, 'title', e.target.value)}
                      placeholder={language === 'ja' ? 'タイトルを入力' : 'Enter title'}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className={`block ${themeConfig.textColor} font-medium mb-2`}>{language === 'ja' ? 'メッセージ' : 'Message'}</label>
                    <textarea
                      value={currentDay?.message || ''}
                      onChange={(e) => handleDayUpdate(selectedDay, 'message', e.target.value)}
                      placeholder={language === 'ja' ? 'メッセージを入力' : 'Enter message'}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={6}
                    />
                  </div>

                  <div>
                    <label className={`block ${themeConfig.textColor} font-medium mb-2`}>{language === 'ja' ? '個別料金設定' : 'Individual Day Pricing'}</label>
                    <div className="bg-black/20 rounded-lg p-3 border border-white/10 mb-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-white/70 text-xs mb-1">{language === 'ja' ? '価格' : 'Price'}</label>
                          <input
                            type="number"
                            value={currentDay?.price || 0}
                            onChange={(e) => handleDayUpdate(selectedDay, 'price', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="w-full px-2 py-1 text-sm bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        </div>
                        <div>
                          <label className="block text-white/70 text-xs mb-1">{language === 'ja' ? '通貨' : 'Currency'}</label>
                          <select
                            value={currentDay?.currency || calendar.currency || 'USD'}
                            onChange={(e) => handleDayUpdate(selectedDay, 'currency', e.target.value)}
                            className="w-full px-2 py-1 text-sm bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          >
                            <option value="USD">USD</option>
                            <option value="JPY">JPY</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                          </select>
                        </div>
                      </div>
                      <p className="text-white/50 text-xs mt-2">
                        {language === 'ja'
                          ? '※ 0に設定すると無料です'
                          : '* Set to 0 for free access'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className={`block ${themeConfig.textColor} font-medium mb-2`}>{language === 'ja' ? '画像' : 'Image'}</label>
                    {currentDay?.image_url ? (
                      <div className="relative">
                        <img
                          src={currentDay.image_url}
                          alt={`Day ${selectedDay}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <label className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg cursor-pointer transition-colors">
                          <Upload className="w-4 h-4 inline mr-1" />
                          {language === 'ja' ? '変更' : 'Change'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(selectedDay, file);
                            }}
                            className="hidden"
                            disabled={uploading}
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="block w-full h-48 border-2 border-dashed border-white/20 rounded-lg hover:border-white/40 transition-colors cursor-pointer">
                        <div className="flex flex-col items-center justify-center h-full">
                          <ImageIcon className="w-12 h-12 text-white/40 mb-2" />
                          <span className="text-white/60">{language === 'ja' ? 'クリックして画像をアップロード' : 'Click to upload image'}</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(selectedDay, file);
                          }}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`flex items-center justify-center h-full ${themeConfig.textColor} opacity-60`}>
                  <div className="text-center">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>{language === 'ja' ? '左側から日付を選択してください' : 'Select a date from the left'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            {language === 'ja' ? '閉じる' : 'Close'}
          </button>
          <button
            onClick={() => {
              onSave();
              setSelectedDay(null);
            }}
            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {language === 'ja' ? '保存して閉じる' : 'Save & Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
