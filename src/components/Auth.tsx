import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Mail, User, Lock, LogIn, UserPlus } from 'lucide-react';

interface AuthProps {
  onClose: () => void;
  onSuccess: () => void;
  language?: 'ja' | 'en';
}

export function Auth({ onClose, onSuccess, language = 'ja' }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.trim()) {
      setError(language === 'ja' ? 'ユーザー名を入力してください' : 'Please enter a username');
      setLoading(false);
      return;
    }

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.trim())
      .maybeSingle();

    if (existingProfile) {
      setError(language === 'ja' ? 'このユーザー名は既に使用されています' : 'This username is already taken');
      setLoading(false);
      return;
    }

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          username: username.trim(),
        }
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('rate_limit')) {
        setError(language === 'ja' ? 'しばらく待ってから再度お試しください' : 'Please wait a moment and try again');
      } else if (signUpError.message.includes('already registered')) {
        setError(language === 'ja' ? 'このメールアドレスは既に登録されています' : 'This email is already registered');
      } else {
        setError((language === 'ja' ? '登録に失敗しました: ' : 'Registration failed: ') + signUpError.message);
      }
      setLoading(false);
      return;
    }

    if (authData.user) {
      const isConfirmed = authData.user.confirmed_at || authData.session;

      if (!isConfirmed) {
        setError(language === 'ja' ? 'メール確認が必要です。メール認証を無効にするには、Supabaseダッシュボードで Authentication > Settings > Email Auth > Enable email confirmations をオフにしてください。' : 'Email confirmation required. To disable email verification, turn off "Enable email confirmations" in Supabase Dashboard > Authentication > Settings > Email Auth.');
        setLoading(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username: username.trim(),
          email: email,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);

        if (profileError.code === '23505') {
          setError(language === 'ja' ? 'このユーザー名は既に使用されています' : 'This username is already taken');
        } else {
          setError(language === 'ja' ? 'プロフィールの作成に失敗しました。ページをリロードしてもう一度お試しください。' : 'Failed to create profile. Please reload the page and try again.');
        }
        setLoading(false);
        return;
      }

      onSuccess();
    } else {
      setError(language === 'ja' ? 'アカウントの作成に失敗しました。もう一度お試しください。' : 'Failed to create account. Please try again.');
    }

    setLoading(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError(language === 'ja' ? 'メールアドレスまたはパスワードが間違っています' : 'Invalid email or password');
      } else if (error.message.includes('Email not confirmed')) {
        setError(language === 'ja' ? 'メールアドレスの確認が必要です' : 'Email confirmation required');
      } else {
        setError((language === 'ja' ? 'ログインに失敗しました: ' : 'Login failed: ') + error.message);
      }
      setLoading(false);
      return;
    }

    onSuccess();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            {mode === 'signup' ? (language === 'ja' ? 'アカウント作成' : 'Sign Up') : (language === 'ja' ? 'ログイン' : 'Login')}
          </h2>
          <p className="text-white/70">
            {mode === 'signup'
              ? (language === 'ja' ? '素敵なアドベントカレンダーを作りましょう' : "Let's create a wonderful advent calendar")
              : (language === 'ja' ? 'おかえりなさい！' : 'Welcome back!')}
          </p>
        </div>

        <form onSubmit={mode === 'signup' ? handleSignUp : handleLogin} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-white/90 font-medium mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                {language === 'ja' ? 'ユーザー名' : 'Username'}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={language === 'ja' ? '例: santa_claus' : 'e.g., santa_claus'}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={3}
                maxLength={30}
              />
            </div>
          )}

          <div>
            <label className="block text-white/90 font-medium mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {language === 'ja' ? 'メールアドレス' : 'Email Address'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-white/90 font-medium mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              {language === 'ja' ? 'パスワード' : 'Password'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {mode === 'signup' ? (
              <>
                <UserPlus className="w-5 h-5" />
                {loading ? (language === 'ja' ? '作成中...' : 'Creating...') : (language === 'ja' ? 'アカウント作成' : 'Sign Up')}
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                {loading ? (language === 'ja' ? 'ログイン中...' : 'Logging in...') : (language === 'ja' ? 'ログイン' : 'Login')}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setMode(mode === 'signup' ? 'login' : 'signup');
              setError('');
            }}
            className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
          >
            {mode === 'signup'
              ? (language === 'ja' ? 'すでにアカウントをお持ちですか？ログイン' : 'Already have an account? Login')
              : (language === 'ja' ? 'アカウントをお持ちでない方は新規登録' : "Don't have an account? Sign Up")}
          </button>
        </div>
      </div>
    </div>
  );
}
