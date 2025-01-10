import React  from "react";
import AuthComponent from "./AuthComponent"; 
import EmailVerification from "./EmailVerification";
import {  RootState } from "store/index";
import {   useSelector } from "react-redux";  
import LockIcon from "@mui/icons-material/Lock";

 
export interface AuthProps {
  onBack?: () => void;
  onBackLogin?: () => void;
  forgotPasswordClicked?: () => void;
  signupDataForwardHandler?: (email: string, message: string) => void;
  classProp?: string;
}

const Auth: React.FC<AuthProps> = () => { 
  const { token, isEmailVerified } = useSelector(
    (state: RootState) => state.auth.userData
  ); 

  return (
    <div className="flex flex-col gap-4">
      <h2 className=""> 
        {`AUTHORIZATION (Login / SignUp)`} <LockIcon fontSize="small" /> 
      </h2>
      {token && !isEmailVerified ? <EmailVerification /> : <AuthComponent />}
    </div>
  );
};

export default Auth;
