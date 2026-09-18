import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { apiFetch } from "@/lib";

type FocusState = { taskId: string | null; startedAt: string | null; elapsedSeconds: number; status: "idle" | "running" | "paused" };
const initialState: FocusState = { taskId: null, startedAt: null, elapsedSeconds: 0, status: "idle" };

export const beginFocusSession = createAsyncThunk("focus/begin", async (taskId: string) => {
  await apiFetch<{ id: string }>("/api/focus", { method: "POST", body: JSON.stringify({ taskId, action: "start" }) });
  return { taskId, startedAt: new Date().toISOString() };
});
export const endFocusSession = createAsyncThunk("focus/end", async (taskId: string) => {
  await apiFetch<{ ok: boolean }>("/api/focus", { method: "POST", body: JSON.stringify({ taskId, action: "end" }) });
  return taskId;
});

const focusSlice = createSlice({ name: "focus", initialState, reducers: { tick: (state) => { if (state.status === "running") state.elapsedSeconds += 1; }, pause: (state) => { state.status = "paused"; }, resume: (state) => { state.status = "running"; }, resetFocus: () => initialState }, extraReducers: (builder) => { builder.addCase(beginFocusSession.fulfilled, (state, action) => { state.taskId = action.payload.taskId; state.startedAt = action.payload.startedAt; state.elapsedSeconds = 0; state.status = "running"; }); builder.addCase(endFocusSession.fulfilled, () => initialState); } });
export const { tick, pause, resume, resetFocus } = focusSlice.actions;
export default focusSlice.reducer;
