import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Tv, ArrowRight, Loader2, AlertCircle, Sparkles, ArrowLeft, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthViewProps {
  onAuthSuccess: () => void;
  initialMode?: 'login' | 'signup' | 'forgot' | 'update_password';
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess, initialMode = 'login' }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'forgot' | 'update_password'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialMode);
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured) {
      setErrorMsg('Supabase bağlantı anahtarları eksik! Lütfen .env dosyanızı yapılandırın.');
      return;
    }

    setLoading(true);

    try {
      if (activeTab === 'login') {
        const cleanedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (!cleanedUsername) throw new Error('Lütfen kullanıcı adınızı girin.');
        if (!password) throw new Error('Lütfen şifrenizi girin.');

        // 1. Query public.profiles to find the email associated with this username
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', cleanedUsername)
          .maybeSingle();

        if (profileError) {
          throw new Error('Kullanıcı adı sorgulanırken bir hata oluştu: ' + profileError.message);
        }

        if (!profile || !profile.email) {
          throw new Error('Girdiğiniz kullanıcı adına ait bir hesap bulunamadı.');
        }

        // 2. Sign in with the retrieved email and the entered password
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: profile.email,
          password,
        });

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            throw new Error('Kullanıcı adı veya şifre hatalı.');
          }
          throw signInError;
        }
        
        onAuthSuccess();
      } else if (activeTab === 'signup') {
        const cleanedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (!cleanedUsername) throw new Error('Lütfen geçerli bir kullanıcı adı girin.');
        if (!email.trim()) throw new Error('Kayıt olmak için lütfen geçerli bir e-posta adresi girin.');
        if (!password) throw new Error('Lütfen bir şifre belirleyin.');

        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              username: cleanedUsername,
              full_name: fullName.trim() || cleanedUsername,
            },
          },
        });

        if (signUpError) {
          if (signUpError.message.includes('User already exists')) {
            throw new Error('Bu e-posta adresi veya kullanıcı adı daha önce kullanılmış.');
          }
          throw signUpError;
        }
        
        setSuccessMsg('Kayıt başarılı! Belirlediğiniz kullanıcı adı ve şifre ile artık giriş yapabilirsiniz.');
        setActiveTab('login');
      } else if (activeTab === 'forgot') {
        let targetEmail = email.trim();

        // If user entered a username in email field or username field
        if ((!targetEmail || !targetEmail.includes('@')) && username.trim()) {
          const cleanedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', cleanedUsername)
            .maybeSingle();
          if (profile?.email) {
            targetEmail = profile.email;
          }
        }

        if (!targetEmail || !targetEmail.includes('@')) {
          throw new Error('Lütfen hesabınıza tanımlı e-posta adresinizi girin.');
        }

        const redirectUrl = window.location.origin + '/reset-password';
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(targetEmail, {
          redirectTo: redirectUrl,
        });

        if (resetError) throw resetError;

        setSuccessMsg(`"${targetEmail}" adresine şifre sıfırlama bağlantısı gönderildi! Lütfen e-postanızı (spam dâhil) kontrol edin.`);
      } else if (activeTab === 'update_password') {
        if (!password || password.length < 6) {
          throw new Error('Yeni şifreniz en az 6 karakter olmalıdır.');
        }
        if (password !== confirmPassword) {
          throw new Error('Şifreler birbiriyle eşleşmiyor.');
        }

        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
        });

        if (updateError) throw updateError;

        setSuccessMsg('Şifreniz başarıyla güncellendi! Giriş ekranına yönlendiriliyorsunuz...');
        setTimeout(() => {
          setActiveTab('login');
          if (typeof window !== 'undefined') {
            window.location.hash = '';
          }
        }, 2000);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0B0C0E] bg-radial-gradient relative overflow-hidden select-none">
      
      {/* Background Visual Enhancements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#E63946]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md bg-[#14171D]/60 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl relative z-10 space-y-6"
      >
        {/* Logo and Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-[#E63946] items-center justify-center text-white font-bold shadow-lg shadow-[#E63946]/30 mb-2">
            {activeTab === 'forgot' || activeTab === 'update_password' ? (
              <KeyRound className="w-7 h-7 stroke-[2.5]" />
            ) : (
              <Tv className="w-7 h-7 stroke-[2.5]" />
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
            {activeTab === 'forgot' ? (
              'Şifrenizi mi Unuttunuz?'
            ) : activeTab === 'update_password' ? (
              'Yeni Şifre Belirleyin'
            ) : (
              <>TTime <span className="text-xs bg-[#E63946]/15 text-[#E63946] border border-[#E63946]/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Bulut</span></>
            )}
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {activeTab === 'forgot' ? (
              'Hesabınıza kayıtlı e-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.'
            ) : activeTab === 'update_password' ? (
              'Hesabınız için yeni ve güvenli bir şifre girin.'
            ) : (
              'Dizi ve filmleri arkadaşlarınızla birlikte eş zamanlı takip edin, yorumlayın ve istatistiklerinizi paylaşın.'
            )}
          </p>
        </div>

        {/* Custom Tab Switcher (Only visible for Login / Signup) */}
        {(activeTab === 'login' || activeTab === 'signup') && (
          <div className="flex bg-[#0B0C0E] p-1 rounded-xl border border-white/5">
            <button
              onClick={() => {
                setActiveTab('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition duration-200 ${
                activeTab === 'login'
                  ? 'bg-[#E63946] text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Giriş Yap
            </button>
            <button
              onClick={() => {
                setActiveTab('signup');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition duration-200 ${
                activeTab === 'signup'
                  ? 'bg-[#E63946] text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Kayıt Ol
            </button>
          </div>
        )}

        {/* Error / Success Alerts */}
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2.5 text-xs text-emerald-400">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400 fill-emerald-500/20" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name (Sign Up Only) */}
          {activeTab === 'signup' && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ad Soyad</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ahmet Yılmaz"
                  className="w-full bg-[#0B0C0E] border border-white/10 focus:border-[#E63946] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition"
                />
              </div>
            </div>
          )}

          {/* Username (Login & Signup) */}
          {(activeTab === 'login' || activeTab === 'signup') && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Kullanıcı Adı <span className="text-[#E63946]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-500">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="ahmet_y"
                  required
                  className="w-full bg-[#0B0C0E] border border-white/10 focus:border-[#E63946] rounded-xl pl-7 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition"
                />
              </div>
            </div>
          )}

          {/* Email (Sign Up & Forgot Password) */}
          {(activeTab === 'signup' || activeTab === 'forgot') && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                E-Posta Adresi <span className="text-[#E63946]">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  required
                  className="w-full bg-[#0B0C0E] border border-white/10 focus:border-[#E63946] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition"
                />
              </div>
            </div>
          )}

          {/* Password (Login, Signup, Update Password) */}
          {(activeTab === 'login' || activeTab === 'signup' || activeTab === 'update_password') && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {activeTab === 'update_password' ? 'Yeni Şifre' : 'Şifre'} <span className="text-[#E63946]">*</span>
                </label>
                {activeTab === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('forgot');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] font-semibold text-[#E63946] hover:underline cursor-pointer transition"
                  >
                    Şifremi unuttum?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-[#0B0C0E] border border-white/10 focus:border-[#E63946] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition"
                />
              </div>
            </div>
          )}

          {/* Confirm Password (Update Password Only) */}
          {activeTab === 'update_password' && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Yeni Şifre (Tekrar) <span className="text-[#E63946]">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-[#0B0C0E] border border-white/10 focus:border-[#E63946] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition"
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#E63946] to-purple-600 hover:from-[#d62839] hover:to-purple-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-[#E63946]/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>İşlem yapılıyor...</span>
              </>
            ) : (
              <>
                <span>
                  {activeTab === 'login'
                    ? 'Giriş Yap'
                    : activeTab === 'signup'
                    ? 'Hesap Oluştur'
                    : activeTab === 'forgot'
                    ? 'Sıfırlama Bağlantısı Gönder'
                    : 'Yeni Şifreyi Kaydet'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Back to Login Link for Forgot Password */}
          {activeTab === 'forgot' && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-extrabold text-slate-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Giriş Ekranına Dön</span>
            </button>
          )}
        </form>

        {/* Local Offline Mode Warning / Info */}
        {!isSupabaseConfigured && (
          <div className="text-[10px] text-slate-500 text-center leading-relaxed pt-2">
            ⚠️ <strong>Uygulama Yerel Modda Çalışıyor</strong><br />
            Supabase bağlantısı henüz kurulmadı. Lütfen SQL tablolarını kurup <code>.env</code> dosyasını güncelleyin.
          </div>
        )}
      </motion.div>
    </div>
  );
};

