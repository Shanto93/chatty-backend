import jwt from 'jsonwebtoken';
import { JWTPayload, DecodedToken } from '../types/jwt.types';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const ACCESS_TOKEN_EXPIRY = '15m'; 
const REFRESH_TOKEN_EXPIRY = '7d';

/*** Generate access token*/
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

/*** Generate refresh token*/
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

/*** Verify access token*/
export function verifyAccessToken(token: string): DecodedToken {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as DecodedToken;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

/** * Verify refresh token*/
export function verifyRefreshToken(token: string): DecodedToken {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as DecodedToken;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

/*** Decode token without verification (for debugging)*/
export function decodeToken(token: string): DecodedToken | null {
  try {
    return jwt.decode(token) as DecodedToken;
  } catch (error) {
    return null;
  }
}
