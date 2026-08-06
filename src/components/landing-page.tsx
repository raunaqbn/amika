'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, Eye, EyeOff, Globe2, Heart, LoaderCircle, LockKeyhole, MessageCircle, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function LandingPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const result = await signIn(email, password);
    if (result.success) {
      router.push('/');
      router.refresh();
      return;
    }
    setError(result.error || 'We could not sign you in. Check your details and try again.');
    setLoading(false);
  };

  return (
    <div className="landing-memory-page">
      <main className="landing-memory-story">
        <header>
          <Link href="/" className="app-wordmark">amika</Link>
          <div>
            <span>Memory-first social</span>
            <a href="#landing-sign-in">Sign in</a>
          </div>
        </header>

        <div className="landing-memory-copy">
          <span><Heart fill="currentColor" aria-hidden="true" /> Made for your actual friends</span>
          <h1>Keep the days you almost forgot.</h1>
          <p>Add one small memory, choose who sees it, and build a friendship history that feels more like you than a highlight reel.</p>
        </div>

        <div className="landing-memory-demo" aria-label="Illustration of the Amika daily memory feed">
          <section className="landing-daily-drop">
            <div>
              <small>Today&apos;s memory</small>
              <strong>Late coffee turned into a two-hour catch-up.</strong>
              <span><span>Jules</span><span>Sam</span></span>
            </div>
            <div className="landing-daily-drop__actions">
              <span><Users aria-hidden="true" /> Friends only</span>
              <button type="button" tabIndex={-1}><Camera aria-hidden="true" /> Add memory</button>
            </div>
          </section>
          <section className="landing-memory-strip">
            <article><small>8:42 PM</small><strong>Rain, noodles, no umbrellas.</strong><span><Heart fill="currentColor" aria-hidden="true" /> 8</span></article>
            <article><small>On this day</small><strong>The museum photo we still quote.</strong><span><MessageCircle aria-hidden="true" /> 4 replies</span></article>
            <article><small>Private</small><strong>A note for future me.</strong><span><LockKeyhole aria-hidden="true" /> Only me</span></article>
          </section>
        </div>

        <footer>
          <span><LockKeyhole aria-hidden="true" /> Private when you want it</span>
          <span><Users aria-hidden="true" /> Close-friends by default</span>
          <span><Globe2 aria-hidden="true" /> Public only by choice</span>
        </footer>
      </main>

      <aside className="landing-auth-panel" id="landing-sign-in">
        <div>
          <span>Welcome back</span>
          <h2>What will you remember today?</h2>
          <p>Sign in to your friends, messages, journal, and memory feed.</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <p className="landing-auth-error" role="alert">{error}</p>}
          <label>
            <span>Email address</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" required />
          </label>
          <label>
            <span>Password</span>
            <span className="landing-password-input">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Your password" required />
              <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            </span>
          </label>
          <button className="landing-sign-in" type="submit" disabled={loading || !email || !password}>
            {loading ? <LoaderCircle className="spin" aria-hidden="true" /> : 'Sign in'}
          </button>
        </form>

        <div className="landing-auth-divider"><span>or</span></div>

        <button
          className="landing-google"
          type="button"
          disabled={googleLoading}
          onClick={() => {
            setGoogleLoading(true);
            window.location.href = '/api/auth/google';
          }}
        >
          {googleLoading ? <LoaderCircle className="spin" aria-hidden="true" /> : <span aria-hidden="true">G</span>}
          Continue with Google
        </button>

        <p className="landing-sign-up">New to Amika? <Link href="/signup">Create an account</Link></p>
      </aside>
    </div>
  );
}
