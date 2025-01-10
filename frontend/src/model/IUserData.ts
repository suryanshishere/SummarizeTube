export interface IUserData {
  token: string;
  isEmailVerified: boolean;
  deactivatedAt?: string;
  tokenExpiration?: string;
  sessionExpireMsg?: string;
}
