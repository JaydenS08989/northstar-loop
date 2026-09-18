import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import focusReducer from "./focusSlice";
import uiReducer from "./uiSlice";

export const store = configureStore({ reducer: { focus: focusReducer, ui: uiReducer } });
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export { beginFocusSession, endFocusSession, pause, resetFocus, resume, tick } from "./focusSlice";
export { setMobileNavigationOpen } from "./uiSlice";
