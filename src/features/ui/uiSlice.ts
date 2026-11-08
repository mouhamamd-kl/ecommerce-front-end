import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
const uiSlice = createSlice({
  name: 'ui',
  initialState: { notice: null as { message: string; tone: 'success' | 'error' } | null },
  reducers: {
    showNotice(state, action: PayloadAction<{ message: string; tone: 'success' | 'error' }>) {
      state.notice = action.payload;
    },
    clearNotice(state) {
      state.notice = null;
    },
  },
});
export const { showNotice, clearNotice } = uiSlice.actions;
export default uiSlice.reducer;
