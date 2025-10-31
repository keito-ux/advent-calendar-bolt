import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserCalendar, UserCalendarDay } from '../lib/types';
import { getThemeConfig } from '../lib/themes';
import { X, Calendar, Lock, ArrowLeft, Gift, DollarSign, CreditCard } from 'lucide-react';
import ThreeViewer from './ThreeViewer';

interface ViewSharedCalendarProps {
  shareCode: string;
  onClose: () => void;
  onBack?: () => void;
  language: 'ja' | 'en';
}

export function ViewSharedCalendar({ shareCode, onClose, onBack, language }: ViewSharedCalendarProps) {
  const [calendar, setCalendar] = useState<UserCalendar | null>(null);
  const [days, setDays] = useState<UserCalendarDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPurchasedCalendar, setHasPurchasedCalendar] = useState(false);
  const [purchasedDays, setPurchasedDays] = useState<number[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<{ type: 'calendar' | 'day', dayNumber?: number, price?: number, currency?: string } | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  const themeConfig = calendar ? getThemeConfig(calendar.theme as any) : getThemeConfig('default');

  useEffect(() => {
    checkUser();
    loadCalendar();
  }, [shareCode]);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  }

  async function loadCalendar() {
    const { data: calendarData, error: calendarError } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('share_code', shareCode)
      .maybeSingle();

    if (calendarError || !calendarData) {
      console.error('Error loading calendar:', calendarError);
      setLoading(false);
      return;
    }

    setCalendar(calendarData);

    const { data: daysData, error: daysError } = await supabase
      .from('user_calendar_days')
      .select('*')
      .eq('calendar_id', calendarData.id)
      .order('day_number');

    if (daysError) {
      console.error('Error loading days:', daysError);
    } else {
      setDays(daysData || []);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id !== calendarData.creator_id) {
      const { data: purchases } = await supabase
        .from('calendar_purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('calendar_id', calendarData.id)
        .eq('status', 'completed');

      if (purchases) {
        const calendarPurchase = purchases.find(p => p.day_number === null);
        if (calendarPurchase) {
          setHasPurchasedCalendar(true);
        }

        const dayPurchases = purchases
          .filter(p => p.day_number !== null)
          .map(p => p.day_number);
        setPurchasedDays(dayPurchases);
      }
    } else if (user && user.id === calendarData.creator_id) {
      setHasPurchasedCalendar(true);
    }

    setLoading(false);
  }

  async function handlePurchase(type: 'calendar' | 'day', dayNumber?: number) {
    if (!currentUserId) {
      alert(language === 'ja' ? '購入にはログインが必要です' : 'Please login to purchase');
      return;
    }

    if (!calendar) return;

    setProcessingPayment(true);

    let amount = 0;
    let currency = 'USD';

    if (type === 'calendar') {
      amount = calendar.price || 0;
      currency = calendar.currency || 'USD';
    } else if (type === 'day' && dayNumber) {
      const day = days.find(d => d.day_number === dayNumber);
      if (day) {
        amount = day.price || 0;
        currency = day.currency || 'USD';
      }
    }

    if (amount === 0) {
      alert(language === 'ja' ? '無料のコンテンツです' : 'This content is free');
      setProcessingPayment(false);
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const { error } = await supabase
        .from('calendar_purchases')
        .insert({
          user_id: currentUserId,
          calendar_id: calendar.id,
          day_number: type === 'day' ? dayNumber : null,
          amount: amount,
          currency: currency,
          status: 'completed',
          payment_method: 'stripe',
        });

      if (error) {
        console.error('Purchase error:', error);
        alert(language === 'ja' ? '購入に失敗しました' : 'Purchase failed');
      } else {
        alert(language === 'ja' ? '✨ 応援ありがとうございます！コンテンツがアンロックされました' : '✨ Thank you for your support! Content unlocked');
        if (type === 'calendar') {
          setHasPurchasedCalendar(true);
        } else if (dayNumber) {
          setPurchasedDays([...purchasedDays, dayNumber]);
          setSelectedDay(dayNumber);
        }
        setShowPaymentModal(false);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      alert(language === 'ja' ? '決済処理中にエラーが発生しました' : 'Error during payment processing');
    } finally {
      setProcessingPayment(false);
    }
  }

  function canAccessDay(dayNumber: number): boolean {
    if (!calendar) return false;
    if (currentUserId === calendar.creator_id) return true;
    if (hasPurchasedCalendar) return true;

    const day = days.find(d => d.day_number === dayNumber);
    if (!day) return true;

    const dayPrice = day.price || 0;
    if (dayPrice === 0) return true;

    return purchasedDays.includes(dayNumber);
  }

  function needsPayment(): boolean {
    if (!calendar) return false;
    if (currentUserId === calendar.creator_id) return false;
    if (hasPurchasedCalendar) return false;
    return (calendar.price || 0) > 0;
  }

  function isDayUnlocked(dayNumber: number): boolean {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    if (currentMonth === 12 && currentDay >= dayNumber) {
      return true;
    }

    if (currentMonth > 12 || (currentMonth === 12 && currentDay > 25)) {
      return true;
    }

    return false;
  }

  const currentDay = selectedDay ? days.find(d => d.day_number === selectedDay) : null;
  const isCurrentDayUnlocked = selectedDay ? isDayUnlocked(selectedDay) : false;
  const canViewCurrentDay = selectedDay ? canAccessDay(selectedDay) : false;
  const currentDayPrice = currentDay?.price || 0;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-white text-xl">{language === 'ja' ? '読み込み中...' : 'Loading...'}</div>
      </div>
    );
  }

  if (!calendar) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-white/50" />
          <h2 className="text-2xl font-bold text-white mb-2">{language === 'ja' ? 'カレンダーが見つかりません' : 'Calendar Not Found'}</h2>
          <p className="text-white/70 mb-6">
            {language === 'ja' ? '共有リンクが正しくないか、カレンダーが削除された可能性があります。' : 'The share link is invalid or the calendar has been deleted.'}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {language === 'ja' ? '戻る' : 'Back'}
          </button>
        </div>
      </div>
    );
  }

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
                {language === 'ja' ? 'アドベントカレンダー' : 'Advent Calendar'}
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

        <div className="mb-6 mt-4">
          <div className="flex items-start justify-between mb-2">
            <h2 className={`text-3xl font-bold ${themeConfig.textColor}`}>{calendar.title}</h2>
            {needsPayment() && (
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2 text-yellow-300">
                  <DollarSign className="w-5 h-5" />
                  <span className="font-bold">{calendar.price} {calendar.currency}</span>
                </div>
              </div>
            )}
          </div>
          {calendar.description && (
            <p className="text-white/70">{calendar.description}</p>
          )}
          {calendar.username && (
            <p className="text-white/50 text-sm mt-1">{language === 'ja' ? '作成者' : 'Created by'}: {calendar.username}</p>
          )}
          {needsPayment() && (
            <button
              onClick={() => {
                setPaymentTarget({
                  type: 'calendar',
                  price: calendar.price || 0,
                  currency: calendar.currency || 'USD'
                });
                setShowPaymentModal(true);
              }}
              className="mt-3 flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg transition-all font-bold"
            >
              <CreditCard className="w-5 h-5" />
              {language === 'ja' ? 'カレンダー全体を購入' : 'Purchase Full Calendar'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className={`text-xl font-bold ${themeConfig.textColor} mb-4`}>🎄 {language === 'ja' ? 'アドベントカレンダー' : 'Advent Calendar'}</h3>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 25 }, (_, i) => i + 1).map(dayNum => {
                const dayData = days.find(d => d.day_number === dayNum);
                const hasContent = dayData && (dayData.title || dayData.message || dayData.image_url);
                const unlocked = isDayUnlocked(dayNum);
                const dayPrice = dayData?.price || 0;
                const needsPurchase = !canAccessDay(dayNum) && dayPrice > 0;

                const handleDayClick = () => {
                  if (unlocked) {
                    if (needsPurchase) {
                      setPaymentTarget({
                        type: 'day',
                        dayNumber: dayNum,
                        price: dayPrice,
                        currency: dayData?.currency || 'USD'
                      });
                      setShowPaymentModal(true);
                    } else {
                      setSelectedDay(dayNum);
                    }
                  }
                };

                return (
                  <button
                    key={dayNum}
                    onClick={handleDayClick}
                    disabled={!unlocked}
                    className={`aspect-square rounded-lg flex items-center justify-center font-bold text-lg transition-all relative overflow-hidden ${
                      selectedDay === dayNum
                        ? `scale-110 ring-4 ring-white`
                        : unlocked && hasContent
                        ? 'hover:scale-105'
                        : unlocked
                        ? 'hover:scale-105'
                        : 'cursor-not-allowed opacity-50'
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
                          unlocked && hasContent
                            ? `${themeConfig.accentColor}/70`
                            : unlocked
                            ? 'bg-white/10'
                            : 'bg-white/5'
                        }`} />
                        <span className={`relative z-10 ${unlocked ? 'text-white' : 'text-white/30'}`}>{dayNum}</span>
                      </>
                    )}
                    {!unlocked && (
                      <Lock className="absolute w-4 h-4 top-1 right-1 z-20 text-white/70" />
                    )}
                    {unlocked && needsPurchase && (
                      <DollarSign className="absolute w-4 h-4 top-1 right-1 z-20 text-yellow-400 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-black/20 rounded-xl p-6 border border-white/10">
            {selectedDay ? (
              isCurrentDayUnlocked ? (
                canViewCurrentDay ? (
                  currentDay ? (
                    <div className="space-y-4">
                      <h3 className={`text-2xl font-bold ${themeConfig.textColor}`}>{language === 'ja' ? `12月 ${selectedDay} 日` : `December ${selectedDay}`}</h3>
                      {currentDay.title && (
                        <div>
                          <h4 className="text-lg font-semibold text-white/90">{currentDay.title}</h4>
                        </div>
                      )}
                      {currentDay.image_url && (
                        <img
                          src={currentDay.image_url}
                          alt={`Day ${selectedDay}`}
                          className="w-full rounded-lg shadow-xl"
                        />
                      )}
                      {currentDay.message && (
                        <div className="text-white/80 whitespace-pre-wrap">{currentDay.message}</div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/60">
                      <div className="text-center">
                        <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>{language === 'ja' ? 'この日はまだ何もありません' : 'No content for this day yet'}</p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center h-full text-white/60">
                    <div className="text-center max-w-sm">
                      <Lock className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
                      <h3 className="text-xl font-bold text-white mb-2">
                        {language === 'ja' ? '有料コンテンツ' : 'Premium Content'}
                      </h3>
                      <p className="text-white/70 mb-4">
                        {language === 'ja'
                          ? 'この日のコンテンツを見るには購入が必要です'
                          : 'Purchase required to view this day\'s content'}
                      </p>
                      {currentDayPrice > 0 && (
                        <>
                          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-4 py-2 mb-4 inline-block">
                            <div className="flex items-center gap-2 text-yellow-300">
                              <DollarSign className="w-5 h-5" />
                              <span className="font-bold">{currentDayPrice} {currentDay?.currency || 'USD'}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setPaymentTarget({
                                type: 'day',
                                dayNumber: selectedDay,
                                price: currentDayPrice,
                                currency: currentDay?.currency || 'USD'
                              });
                              setShowPaymentModal(true);
                            }}
                            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg transition-all font-bold mx-auto"
                          >
                            <CreditCard className="w-5 h-5" />
                            {language === 'ja' ? 'この日を購入' : 'Purchase This Day'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center h-full text-white/60">
                  <div className="text-center">
                    <Lock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-xl font-bold mb-2">{language === 'ja' ? 'まだ開けません' : 'Not Yet Available'}</p>
                    <p>{language === 'ja' ? `12月${selectedDay}日になるまでお待ちください` : `Please wait until December ${selectedDay}`}</p>
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full text-white/60">
                <div className="text-center">
                  <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>{language === 'ja' ? '左側から日付を選択してください' : 'Select a date from the left'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPaymentModal && paymentTarget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-8 relative border-2 border-yellow-500/50">
            <button
              onClick={() => setShowPaymentModal(false)}
              disabled={processingPayment}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-10 h-10 text-yellow-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {language === 'ja' ? '応援チップで開く' : 'Support with a Tip'}
                </h2>
                <p className="text-white/70 mb-4">
                  {language === 'ja'
                    ? 'クリエイターを応援して、このコンテンツにアクセスしましょう！'
                    : 'Support the creator and unlock this content!'}
                </p>
              </div>

              <div className="bg-black/30 rounded-lg p-4 mb-6">
                {paymentTarget.type === 'day' && paymentTarget.dayNumber ? (
                  <>
                    <div className="text-white/60 text-sm mb-2">
                      {language === 'ja' ? '日付' : 'Day'}
                    </div>
                    <div className="text-2xl font-bold text-white mb-4">
                      {language === 'ja' ? `12月 ${paymentTarget.dayNumber} 日` : `December ${paymentTarget.dayNumber}`}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-white/60 text-sm mb-2">
                      {language === 'ja' ? '商品' : 'Item'}
                    </div>
                    <div className="text-2xl font-bold text-white mb-4">
                      {language === 'ja' ? 'カレンダー全体' : 'Full Calendar Access'}
                    </div>
                  </>
                )}
                <div className="text-white/60 text-sm mb-2">
                  {language === 'ja' ? '応援金額' : 'Tip Amount'}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <DollarSign className="w-6 h-6 text-yellow-400" />
                  <span className="text-3xl font-bold text-yellow-400">
                    {paymentTarget.price} {paymentTarget.currency}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (paymentTarget.type === 'day' && paymentTarget.dayNumber) {
                      handlePurchase('day', paymentTarget.dayNumber);
                    } else if (paymentTarget.type === 'calendar') {
                      handlePurchase('calendar');
                    }
                  }}
                  disabled={processingPayment}
                  className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-4 rounded-lg transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingPayment ? (
                    <>
                      <div className="w-6 h-6 border-3 border-black/30 border-t-black rounded-full animate-spin" />
                      {language === 'ja' ? '処理中...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-6 h-6" />
                      {language === 'ja' ? '応援して購入' : 'Support & Purchase'}
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  disabled={processingPayment}
                  className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {language === 'ja' ? 'キャンセル' : 'Cancel'}
                </button>
              </div>

              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-300 text-xs mb-1 font-semibold">
                  {language === 'ja' ? '💳 決済について' : '💳 About Payment'}
                </p>
                <p className="text-white/50 text-xs">
                  {language === 'ja'
                    ? '実際の決済はStripeを通じて安全に処理されます。現在はデモモードです。'
                    : 'Actual payments will be processed securely through Stripe. Currently in demo mode.'}
                </p>
              </div>

              <p className="text-white/50 text-xs mt-3">
                {language === 'ja'
                  ? '※ お支払いいただいた金額は、クリエイターへの応援金として使用されます'
                  : '* Your payment will support the creator'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
