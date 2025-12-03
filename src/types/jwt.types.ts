export interface JWTPayload {
  id: string;
  email: string;
  username: string;
  role: string;
}

export interface DecodedToken extends JWTPayload {
  iat: number;
  exp: number;
}
