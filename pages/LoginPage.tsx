import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ImageCarousel from '../components/ImageCarousel';
import { UserCircleIcon, GoogleIcon, GithubIcon } from '../components/Icons';

// This allows TypeScript to recognize the 'google' object from the GSI script
declare global {
  interface Window {
    google: any;
  }
}

// Fix: Updated the Google Client ID to the new value provided by the user.
// This is the primary fix for the non-functional Google Sign-In button.
const GOOGLE_CLIENT_ID = '1094738376370-5pdp9a6gpv4qllehq35hj7a4u6ali7s1.apps.googleusercontent.com';

const LoginPage: React.FC = () => {
  const { login } = useAuth();

  const handleGitHubLogin = () => {
    // Placeholder for the full GitHub OAuth flow
    alert('GitHub Sign-In is for demonstration purposes and is not fully implemented yet.');
  };

  useEffect(() => {
    const handleGoogleSignIn = (response: any) => {
      try {
        // Decode the JWT token to extract the user's profile information
        const payload = JSON.parse(atob(response.credential.split('.')[1]));
        // Log in the user with their Google name and avatar for a personalized experience
        login({ name: payload.name, avatar: payload.picture });
      } catch (e) {
        console.error('Error decoding Google JWT', e);
        alert('There was an error signing in with Google. Please try again.');
      }
    };

    const initializeGsi = () => {
      try {
        // Check if both the Google library and the target element are ready.
        if (window.google?.accounts?.id && document.getElementById('google-signin-button')) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleSignIn,
          });

          window.google.accounts.id.renderButton(
            document.getElementById('google-signin-button'),
            { theme: 'outline', size: 'large', type: 'standard', text: 'signin_with', shape: 'pill', width: '320' }
          );
          return true; // Indicate success
        }
        return false; // Indicate that it's not ready yet
      } catch (error) {
        console.error("Error initializing Google Sign-In:", error);
        return false;
      }
    };

    // This interval robustly handles the race condition where the React component
    // mounts before the external Google GSI script has finished loading. It
    // periodically checks until the script is ready and then initializes the button.
    const intervalId = setInterval(() => {
      if (initializeGsi()) {
        clearInterval(intervalId);
      }
    }, 250); // Check every 250ms

    // Cleanup the interval when the component unmounts
    return () => {
      clearInterval(intervalId);
    };
  }, [login]);

  return (
    <div className="relative flex h-screen w-screen items-center justify-center bg-[#0F1015] text-white p-4">
      <div className="absolute inset-0 z-0">
        <ImageCarousel />
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center p-6 sm:p-8 bg-black/30 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl">
        <h1 className="text-4xl sm:text-5xl font-bold mb-2 will-fade-in animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <span className="brand-gradient-text">
            FARI
          </span>
        </h1>
        <p className="text-slate-300 mb-8 will-fade-in animate-fadeInUp" style={{ animationDelay: '0.2s' }}>Welcome Back</p>
        
        <div className="flex flex-col items-center gap-4 mb-8 will-fade-in animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            <UserCircleIcon className="w-24 h-24 text-slate-400"/>
            <div>
                <p className="text-xl font-semibold">YALLANAGAPRAVEEN</p>
                <p className="text-sm text-slate-400">Pro Plan</p>
            </div>
        </div>

        <div className="w-full will-fade-in animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
            <button
                onClick={() => login()}
                className="w-full bg-pink-600 px-8 py-3 text-lg font-semibold text-white rounded-lg transition-transform hover:scale-105 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50"
                >
                Sign In
            </button>
        </div>
        
        <div className="flex items-center w-full my-6 will-fade-in animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
          <div className="flex-grow border-t border-slate-600"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-sm">OR</span>
          <div className="flex-grow border-t border-slate-600"></div>
        </div>

        <div className="w-full space-y-3 will-fade-in animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
            <div id="google-signin-button" className="flex justify-center"></div>
            <button
                onClick={handleGitHubLogin}
                className="w-full flex items-center justify-center gap-3 bg-[#24292E] px-4 py-2.5 text-base font-medium text-white rounded-lg transition-all duration-200 hover:bg-[#33383e] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
                <GithubIcon className="w-6 h-6"/>
                Sign in with GitHub
            </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;