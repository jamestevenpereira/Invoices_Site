import { jwtVerify, SignJWT } from 'jose';
import type { IncomingMessage } from 'http';

const secret = new TextEncoder().encode(process.env['JWT_SECRET']!);

export async function signToken(): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret);
}

export async function verifyJwt(req: IncomingMessage): Promise<boolean> {
  const auth = req.headers['authorization'];
  if (!auth?.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}
