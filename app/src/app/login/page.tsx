'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkUser();

    // Listen for auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="page-container" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="page-content" style={{ maxWidth: 400, margin: '0 auto', width: '100%', padding: '40px 20px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '24px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: 32, marginBottom: 16 }}>
            🚌
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>Welcome to Catchr</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Sign in to save your commutes and receive push alerts across devices.</p>
        </div>

        <div className="glass-card" style={{ padding: 24, borderRadius: 'var(--radius-xl)' }}>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'var(--cyan)',
                    brandAccent: 'var(--cyan-glow)',
                    brandButtonText: '#0f172a',
                    defaultButtonBackground: 'var(--bg-elevated)',
                    defaultButtonBackgroundHover: 'var(--bg-secondary)',
                    defaultButtonBorder: 'var(--border)',
                    defaultButtonText: 'var(--text-primary)',
                    inputBackground: 'var(--bg-elevated)',
                    inputBorder: 'var(--border)',
                    inputBorderHover: 'var(--border-active)',
                    inputBorderFocus: 'var(--cyan)',
                    inputText: 'var(--text-primary)',
                    inputLabelText: 'var(--text-secondary)',
                    inputPlaceholder: 'var(--text-muted)',
                    messageText: 'var(--text-primary)',
                    messageTextDanger: 'var(--red)',
                    anchorTextColor: 'var(--cyan)',
                    anchorTextHoverColor: 'var(--cyan-glow)',
                    dividerBackground: 'var(--border)',
                  },
                  space: {
                    buttonPadding: '12px 16px',
                    inputPadding: '12px 16px',
                  },
                  borderWidths: {
                    buttonBorderWidth: '1px',
                    inputBorderWidth: '1px',
                  },
                  radii: {
                    borderRadiusButton: '12px',
                    buttonBorderRadius: '12px',
                    inputBorderRadius: '12px',
                  },
                  fonts: {
                    bodyFontFamily: 'var(--font-sans)',
                    buttonFontFamily: 'var(--font-sans)',
                    inputFontFamily: 'var(--font-sans)',
                    labelFontFamily: 'var(--font-sans)',
                  }
                },
              },
              style: {
                button: { fontWeight: 600, transition: 'all 0.2s ease' },
                input: { transition: 'all 0.2s ease' },
                container: { gap: '16px' }
              },
              className: {
                button: 'btn',
                input: 'input',
                label: 'text-sm font-semibold',
              }
            }}
            theme="dark"
            providers={['google']}
            redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard`}
          />
        </div>
        
      </div>
    </div>
  );
}
