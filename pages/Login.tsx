
import React, { useState, useEffect } from 'react';

interface LoginProps {
  onLogin: (email: string, pass: string) => boolean;
  onResetPassword: (identifier: string) => void;
}

const LoginPage: React.FC<LoginProps> = ({ onLogin, onResetPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  // Sayfa yüklendiğinde hatırlanan kullanıcıyı getir
  useEffect(() => {
    const savedIdentifier = localStorage.getItem('rememberedIdentifier');
    if (savedIdentifier) {
      setEmail(savedIdentifier);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetMessage('');

    if (isResetMode) {
        onResetPassword(email);
        setResetMessage('Şifre sıfırlama talebiniz yöneticiye iletildi. En kısa sürede tarafınıza SMS ile bilgi verilecektir.');
        setTimeout(() => {
             setIsResetMode(false);
             setResetMessage('');
        }, 6000);
        return;
    }

    const success = onLogin(email, password);
    if (success) {
      // Beni hatırla mantığı
      if (rememberMe) {
        localStorage.setItem('rememberedIdentifier', email);
      } else {
        localStorage.removeItem('rememberedIdentifier');
      }
    } else {
      setError('E-posta/Telefon veya şifre hatalı.');
    }
  };

  const toggleMode = () => {
      setIsResetMode(!isResetMode);
      setError('');
      setResetMessage('');
      setPassword('');
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md border-t-4 border-indigo-600">
        <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-indigo-500 rounded-full text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-8h1m-1 4h1m-1 4h1M9 3v1m6-1v1" /></svg>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Site Yönetim Sistemi</h1>
            <p className="text-sm text-gray-600">{isResetMode ? 'Şifre Sıfırlama' : 'Giriş yapmak için e-posta/telefon ve şifrenizi kullanın'}</p>
        </div>
        
        {resetMessage && (
            <div className="p-3 text-sm text-green-700 bg-green-100 rounded-lg border border-green-200">
                {resetMessage}
            </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              E-posta veya Telefon No
            </label>
            <input
              id="email"
              name="email"
              type="text"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-gray-700 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="örnek@site.com veya 5XXXXXXXXX"
            />
          </div>
          
          {!isResetMode && (
          <div className="space-y-4">
            <div>
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Şifre
                </label>
                <div className="relative mt-1">
                <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-gray-700 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 pr-10"
                    placeholder="******"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-indigo-600 focus:outline-none"
                >
                    {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                    ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    )}
                </button>
                </div>
            </div>

            <div className="flex items-center">
                <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer select-none">
                    Beni Hatırla
                </label>
            </div>

            {email !== 'admin@site.com' && (
              <p className="mt-1 text-[10px] text-gray-500 italic">
                Varsayılan şifreniz sistemde kayıtlı olan birinci cep telefonu numaranızdır.
              </p>
            )}
          </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">{error}</p>}
          
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-md"
            >
              {isResetMode ? 'Yöneticiye Bildir' : 'Giriş Yap'}
            </button>
          </div>
        </form>

        <div className="text-center">
            <button type="button" onClick={toggleMode} className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline font-medium">
                {isResetMode ? 'Giriş Ekranına Dön' : 'Şifremi Unuttum'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
