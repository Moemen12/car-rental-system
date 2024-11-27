export interface AuthAccessType {
  access_token: string;
}

export interface HeaderData {
  userId: string;
  username: string;
  iat: number;
  exp: number;
}

export interface EmailRegistrationData {
  email: string;
  fullName: string;
}
