import { AppDispatch } from ".";
import {
  setErrorMsg,
  clearErrorMsg,
  setSuccessMsg,
  clearSuccessMsg,
} from "./response-slice";
import { createSelector } from "reselect";
import { RootState } from "./index";

export const selectResponse = (state: RootState) => state.response;

export const selectErrorMsg = createSelector(
  [selectResponse],
  (response) => response.onErrorMsg
);

export const selectSuccessMsg = createSelector(
  [selectResponse],
  (response) => response.onSuccessMsg
);

export const selectIsLoading = createSelector(
  [selectResponse],
  (response) => response.isLoading
);

export const triggerErrorMsg =
  (msg: string, timeoutInSeconds: number = 3) =>
  (dispatch: AppDispatch) => {
    dispatch(setErrorMsg({ msg }));
    setTimeout(() => {
      dispatch(clearErrorMsg());
    }, timeoutInSeconds * 1000);
  };

export const triggerSuccessMsg =
  (msg: string, timeoutInSeconds: number = 3) =>
  (dispatch: AppDispatch) => {
    dispatch(setSuccessMsg({ msg }));
    setTimeout(() => {
      dispatch(clearSuccessMsg());
    }, timeoutInSeconds * 1000);
  };
