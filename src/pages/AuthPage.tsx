import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, ArrowUpRight, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { authenticate, clearAuthError } from '../features/auth/authSlice';
import { sessionCleared } from '../app/actions';
import { ErrorBanner, Spinner } from '../components/ui';

export default function AuthPage({
  admin = false,
  register = false,
}: {
  admin?: boolean;
  register?: boolean;
}) {
  const dispatch = useAppDispatch();
  const { busy, error } = useAppSelector((s) => s.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    dispatch(clearAuthError());
    setPassword('');
  }, [admin, register, dispatch]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    dispatch(sessionCleared());
    const result = await dispatch(
      authenticate({ role: admin ? 'admin' : 'customer', email: email.trim(), password, register }),
    );
    if (authenticate.fulfilled.match(result)) {
      const from = (location.state as { from?: string } | null)?.from;
      navigate(
        admin
          ? '/admin'
          : from && from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/admin')
            ? from
            : '/',
        { replace: true },
      );
    }
  };
  return (
    <div className="auth-layout">
      <section className="auth-editorial">
        <span className="eyebrow">
          {admin ? 'THE OTHER SIDE OF THE STORE' : 'A LITTLE SOMETHING FOR YOU'}
        </span>
        <h1>
          {admin ? (
            <>
              Good things.
              <br />
              Great management.
            </>
          ) : (
            <>
              Your everyday.
              <br />A little better.
            </>
          )}
        </h1>
        <p>
          {admin
            ? 'A thoughtful space to keep your store moving.'
            : 'A place for your next favourite thing. Find it, make it yours, and keep everything together.'}
        </p>
        <div className="editorial-art" aria-hidden="true">
          <span className="art-orbit" />
          <span className="art-square">
            <ShoppingArt />
          </span>
          <ArrowUpRight className="art-arrow" size={64} strokeWidth={1} />
        </div>
        <span className="editorial-footnote">BARAKAH / EVERYDAY, CONSIDERED.</span>
      </section>
      <section className="auth-form-area">
        <span className="auth-icon">
          <LockKeyhole size={23} strokeWidth={1.5} />
        </span>
        <span className="eyebrow">
          {admin ? 'ADMIN WORKSPACE' : register ? 'MAKE YOURSELF AT HOME' : 'GOOD TO SEE YOU'}
        </span>
        <h2>
          {register ? 'Join the everyday.' : admin ? 'Welcome to your workspace.' : 'Welcome back.'}
        </h2>
        <p>
          {register
            ? 'Create your account and find something good.'
            : 'Sign in to pick up where you left off.'}
        </p>
        <form onSubmit={(event) => void submit(event)}>
          <ErrorBanner message={error} />
          <label className="field">
            Email address
            <input
              autoComplete="email"
              type="email"
              required
              maxLength={254}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="field">
            Password
            <div className="password-field">
              <input
                autoComplete={register ? 'new-password' : 'current-password'}
                type={visible ? 'text' : 'password'}
                required
                minLength={register ? 8 : 1}
                maxLength={72}
                placeholder={register ? 'At least 8 characters' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="icon-button"
                onClick={() => setVisible(!visible)}
                aria-label={visible ? 'Hide password' : 'Show password'}
              >
                {visible ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>
          <button className="button full" disabled={busy}>
            {busy ? (
              <Spinner label="One moment…" />
            ) : (
              <>
                {register ? 'Create account' : 'Sign in'}
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>
        {!admin && (
          <p className="auth-switch">
            {register ? 'Already part of the everyday?' : 'New around here?'}{' '}
            <Link to={register ? '/login' : '/register'} state={location.state}>
              {register ? 'Sign in' : 'Create an account'} <ArrowUpRight size={12} />
            </Link>
          </p>
        )}
        <Link className="auth-back" to={admin ? '/login' : '/'}>
          ← {admin ? 'Customer sign in' : 'Back to the collection'}
        </Link>
      </section>
    </div>
  );
}
function ShoppingArt() {
  return (
    <svg viewBox="0 0 120 140" fill="none">
      <path d="M25 45h70l8 78H17l8-78Z" stroke="currentColor" strokeWidth="2" />
      <path d="M41 45V30a19 19 0 0 1 38 0v15" stroke="currentColor" strokeWidth="2" />
      <path d="m45 79 10 10 22-24" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
