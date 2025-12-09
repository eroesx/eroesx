
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (email: string, pass: string) => boolean;
}

const LoginPage: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetMessage('');

    if (isResetMode) {
        // Simulate sending SMS
        // In a real app, this would call a backend API (e.g. Twilio, Netgsm)
        setResetMessage('Şifre sıfırlama kodu kayıtlı cep telefonunuza SMS olarak gönderildi.');
        setTimeout(() => {
             setIsResetMode(false);
             setResetMessage('');
        }, 4000);
        return;
    }

    const success = onLogin(email, password);
    if (!success) {
      setError('E-posta veya şifre hatalı.');
    }
  };

  const toggleMode = () => {
      setIsResetMode(!isResetMode);
      setError('');
      setResetMessage('');
      setPassword('');
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-indigo-500 rounded-full text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-8h1m-1 4h1m-1 4h1M9 3v1m6-1v1" /></svg>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Site Yönetim Sistemi</h1>
            <p className="text-sm text-gray-600">{isResetMode ? 'Şifre Sıfırlama' : 'Lütfen hesabınıza giriş yapın'}</p>
        </div>
        
        {resetMessage && (
            <div className="p-3 text-sm text-green-700 bg-green-100 rounded-lg">
                {resetMessage}
            </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              E-posta Adresi
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-gray-700 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="admin@example.com"
            />
          </div>
          
          {!isResetMode && (
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Şifre
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-gray-700 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="••••••••"
            />
          </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isResetMode ? 'SMS Gönder' : 'Giriş Yap'}
            </button>
          </div>
        </form>

        <div className="text-center">
            <button type="button" onClick={toggleMode} className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline">
                {isResetMode ? 'Giriş Ekranına Dön' : 'Şifremi Unuttum'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
