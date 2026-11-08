import { LogOut, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { sessionCleared } from '../app/actions';
import { PageTitle, PanelLink } from '../components/ui';
export default function AccountPage() {
  const session = useAppSelector((s) => s.auth.session)!;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  return (
    <div className="account-page">
      <PageTitle
        eyebrow="YOUR LITTLE CORNER"
        title="Make yourself at home."
        description="Your account. Your orders. Your everyday."
      />
      <section className="account-card">
        <span className="account-avatar">
          <UserRound size={26} strokeWidth={1.5} />
        </span>
        <span>
          <strong>{session.profile?.email}</strong>
          <small>{session.role === 'admin' ? 'Administrator' : 'Customer account'}</small>
        </span>
        <button
          className="button secondary small-button"
          onClick={() => {
            dispatch(sessionCleared());
            navigate('/');
          }}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </section>
      <div className="account-links">
        {session.role === 'admin' ? (
          <PanelLink to="/admin" title="Your workspace">
            Manage products, stock, and orders.
          </PanelLink>
        ) : (
          <>
            <PanelLink to="/orders" title="Your orders">
              Keep track of what’s on its way.
            </PanelLink>
            <PanelLink to="/cart" title="Your bag">
              Pick up where you left off.
            </PanelLink>
            <PanelLink to="/notifications" title="Your updates">
              The latest, all in one place.
            </PanelLink>
          </>
        )}
      </div>
    </div>
  );
}
