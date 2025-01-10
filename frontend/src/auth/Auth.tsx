import React, { useState } from "react";
import AuthComponent from "./AuthComponent";
import Button from "shared/Button";
import EmailVerification from "./EmailVerification";
import { AppDispatch, RootState } from "store/index";
import { useDispatch, useSelector } from "react-redux";
import { handleAuthClick, logout } from "store/auth-slice";
import { Link } from "react-router-dom";
import LockIcon from "@mui/icons-material/Lock";

enum AuthState {
  LOGIN,
  FORGOT_PASSWORD,
  VERIFY_EMAIL,
}

export interface AuthProps {
  onBack?: () => void;
  onBackLogin?: () => void;
  forgotPasswordClicked?: () => void;
  signupDataForwardHandler?: (email: string, message: string) => void;
  classProp?: string;
}

const Auth: React.FC<AuthProps> = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [authState, setAuthState] = useState<AuthState>(AuthState.LOGIN);
  const { token, isEmailVerified } = useSelector(
    (state: RootState) => state.auth.userData
  );
  const handleStateChange = (newState: AuthState) => setAuthState(newState);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="italic"> 
        AUTHORIZATION <LockIcon fontSize="small" />{" "}
      </h2>
      {token && !isEmailVerified ? <EmailVerification /> : <AuthComponent />}
    </div>
  );
};

export default Auth;
