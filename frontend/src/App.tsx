import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Note: Use Routes instead of Switch in React Router v6
import Auth from "auth/Auth";
import { useDispatch, useSelector } from "react-redux";
import Response from "shared/Response";
import { RootState } from "store";
import UserSummaryHistory from "UserSummaryHistory";
import YoutubeSummarizer from "YoutubeSummarizer";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { logout } from "store/auth-slice";
import EmailVerification from "./auth/EmailVerification";  

function App() {
  const { token, isEmailVerified } = useSelector((state: RootState) => state.auth.userData);
  const dispatch = useDispatch();

  return (
    <Router>
      <div className="w-screen h-screen flex">
        <Response />
        <h2 className="bg-custom-pale-yellow fixed top-0 py-3 w-full text-center text-3xl flex items-center justify-between px-4">
          <div className="flex items-center justify-center flex-grow space-x-2">
            <YouTubeIcon fontSize="large" className="mt-1" />
            <YouTubeIcon fontSize="large" className="mt-1" />
            <YouTubeIcon fontSize="large" className="mt-1" />
            <YouTubeIcon fontSize="large" className="mt-1" />
            <YouTubeIcon fontSize="large" className="mt-1" />
            <span className="px-3">
              <span className="text-custom-red italic animate-pulse">
                Summarize
              </span>
              Tube
            </span>
            <YouTubeIcon fontSize="large" className="mt-1" />
            <YouTubeIcon fontSize="large" className="mt-1" />
            <YouTubeIcon fontSize="large" className="mt-1" />
            <YouTubeIcon fontSize="large" className="mt-1" />
            <YouTubeIcon fontSize="large" className="mt-1" />
          </div>

          {token ? (
            <button
              onClick={() => dispatch(logout())}
              className="self-end text-base ml-auto"
            >
              LOGOUT
            </button>
          ) : (
            <h3>.</h3>
          )}
        </h2>

        <div className="mt-[4rem] flex flex-col flex-1 justify-center items-center">
          {/* Use Routes here instead of Switch in React Router v6 */}
          <Routes>
            <Route path="/" element={!token ? <Auth /> : isEmailVerified ? (
              <div className="h-full w-full flex gap-2">
                <UserSummaryHistory />
                <YoutubeSummarizer />
              </div>
            ) : (
              <EmailVerification />
            )} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
