import { createSlice, PayloadAction } from "@reduxjs/toolkit"; 
import { IUserData } from "model/IUserData";

interface IAuthSlice {
  isNavAuthClicked: boolean;
  isOtpSent: boolean;
  userData: IUserData;
}

const AUTH_TOKEN_EXPIRY = process.env.REACT_APP_AUTH_TOKEN_EXPIRY || 15;
// const NAV_ACCOUNT_DEFAULT_DP =
//   process.env.REACT_APP_NAV_ACCOUNT_DEFAULT_DP ||
//   "https://img.freepik.com/free-photo/background_53876-32170.jpg?t=st=1732070280~exp=1732073880~hmac=f3b7e7a5ee6cef8bc932b0f3595f7d90864f64a12871da125d205ef3559a0208&w=996";

const initialState: IAuthSlice = {
  isNavAuthClicked: false,
  isOtpSent: false,
  userData: {
    token: "",
    isEmailVerified: false,
  },
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    handleAuthClick(state, action: PayloadAction<boolean>) {
      state.isNavAuthClicked = action.payload;
    },

    login(
      state,
      action: PayloadAction<{
        token: string;
        isEmailVerified: boolean;
        tokenExpiration?: string; 
      }>
    ) {
      const { token, tokenExpiration, isEmailVerified   } = action.payload;

      if (!token && isEmailVerified === undefined) return;

      const localTokenExpiration = tokenExpiration
        ? new Date(tokenExpiration)
        : new Date(
            new Date().getTime() + 1000 * 60 * Number(AUTH_TOKEN_EXPIRY)
          );

      state.isOtpSent = true;
      state.userData = {
        token,
        isEmailVerified,
        tokenExpiration: localTokenExpiration.toISOString(), 
      };

      if (isEmailVerified) {
        state.isNavAuthClicked = false;
        window.location.reload();
      }
    },

    logout(state) {
      state.isNavAuthClicked = false;
      state.userData = {
        token: "",
        isEmailVerified: false,
        tokenExpiration: undefined,
        sessionExpireMsg: undefined,
      };
      // window.location.reload();
    },

    updateUserData(state, action: PayloadAction<Partial<IUserData>>) {
      const updatedData = action.payload;
      state.userData = { ...state.userData, ...updatedData };
    },

    handleAccountDeactivatedAt(
      state,
      action: PayloadAction<string | undefined>
    ) {
      state.userData.deactivatedAt = action.payload;
    },
  },
});

export const {
  handleAuthClick,
  login,
  logout,
  updateUserData,
  handleAccountDeactivatedAt,
} = authSlice.actions;

export default authSlice.reducer;
