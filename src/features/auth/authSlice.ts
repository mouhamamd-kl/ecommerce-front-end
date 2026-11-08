import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, failure, loadSession } from '../../lib/api';
import type { ApiFailure, Profile, Role, Session } from '../../lib/types';
import { sessionCleared } from '../../app/actions';

const saved = loadSession();
interface AuthState {
  session: Session | null;
  restoring: boolean;
  busy: boolean;
  error: string | null;
}
const initialState: AuthState = { session: saved, restoring: !!saved, busy: false, error: null };
export const authenticate = createAsyncThunk<
  Session,
  { role: Role; email: string; password: string; register?: boolean },
  { rejectValue: ApiFailure }
>('auth/authenticate', async ({ role, email, password, register }, { rejectWithValue }) => {
  try {
    const { access_token } = await api<{ access_token: string }>(
      `/auth/${role}/${register ? 'register' : 'login'}`,
      { method: 'POST', body: { email, password } },
    );
    const profile = await api<Profile>(`/auth/${role}/me`, { token: access_token });
    if (profile.role !== role) throw new Error('This account cannot access this area.');
    return { token: access_token, role, profile };
  } catch (error) {
    return rejectWithValue(failure(error));
  }
});
export const restoreSession = createAsyncThunk<Session, Session, { rejectValue: ApiFailure }>(
  'auth/restore',
  async (session, { rejectWithValue, dispatch, getState }) => {
    try {
      const profile = await api<Profile>(`/auth/${session.role}/me`, { token: session.token });
      if (profile.role !== session.role) throw new Error('Please sign in again.');
      return { ...session, profile };
    } catch (error) {
      if ((getState() as { auth: AuthState }).auth.session?.token === session.token)
        dispatch(sessionCleared());
      return rejectWithValue(failure(error));
    }
  },
);
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(authenticate.pending, (state) => {
      state.busy = true;
      state.error = null;
    });
    builder.addCase(authenticate.fulfilled, (state, action) => {
      state.busy = false;
      state.session = action.payload;
      state.restoring = false;
    });
    builder.addCase(authenticate.rejected, (state, action) => {
      state.busy = false;
      state.error = action.payload?.message || 'Unable to sign in.';
    });
    builder.addCase(restoreSession.fulfilled, (state, action) => {
      if (state.session?.token !== action.meta.arg.token) return;
      state.session = action.payload;
      state.restoring = false;
    });
    builder.addCase(restoreSession.rejected, (state) => {
      state.restoring = false;
    });
    builder.addCase(sessionCleared, () => ({
      session: null,
      restoring: false,
      busy: false,
      error: null,
    }));
  },
});
export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
