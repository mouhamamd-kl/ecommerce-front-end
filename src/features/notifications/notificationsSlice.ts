import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { api, failure, sessionToken } from '../../lib/api';
import type { ApiFailure, LoadStatus, NotificationPage, Role } from '../../lib/types';
import { sessionCleared } from '../../app/actions';
const initialState: {
  data: NotificationPage | null;
  status: LoadStatus;
  error: string | null;
  busy: boolean;
  page: number;
  filter: string;
} = { data: null, status: 'idle', error: null, busy: false, page: 1, filter: 'all' };
export const loadNotifications = createAsyncThunk<
  NotificationPage,
  { role: Role; page: number; filter: string },
  { rejectValue: ApiFailure }
>('notifications/load', async ({ role, page, filter }, { getState, rejectWithValue }) => {
  try {
    return await api<NotificationPage>(
      `${role === 'admin' ? '/admin' : ''}/notifications?page=${page}&limit=12${filter === 'all' ? '' : `&isRead=${filter === 'read'}`}`,
      { token: sessionToken(getState()) },
    );
  } catch (error) {
    return rejectWithValue(failure(error));
  }
});
export const mutateNotification = createAsyncThunk<
  unknown,
  { action: 'read' | 'read-all' | 'delete'; id?: number },
  { rejectValue: ApiFailure }
>('notifications/mutate', async ({ action, id }, { getState, rejectWithValue }) => {
  try {
    return await api(
      action === 'read-all'
        ? '/notifications/read-all'
        : `/notifications/${id}${action === 'read' ? '/read' : ''}`,
      { method: action === 'delete' ? 'DELETE' : 'PATCH', token: sessionToken(getState()) },
    );
  } catch (error) {
    return rejectWithValue(failure(error));
  }
});
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotificationPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setNotificationFilter(state, action: PayloadAction<string>) {
      state.filter = action.payload;
      state.page = 1;
    },
  },
  extraReducers(builder) {
    builder.addCase(loadNotifications.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(loadNotifications.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.data = action.payload;
    });
    builder.addCase(loadNotifications.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.payload?.message || 'Unable to load notifications.';
    });
    builder.addCase(mutateNotification.pending, (state) => {
      state.busy = true;
      state.error = null;
    });
    builder.addCase(mutateNotification.fulfilled, (state) => {
      state.busy = false;
    });
    builder.addCase(mutateNotification.rejected, (state, action) => {
      state.busy = false;
      state.error = action.payload?.message || 'Unable to update notification.';
    });
    builder.addCase(sessionCleared, () => initialState);
  },
});
export const { setNotificationPage, setNotificationFilter } = notificationsSlice.actions;
export default notificationsSlice.reducer;
