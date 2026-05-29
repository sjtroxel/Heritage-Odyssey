import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { env } from '../config/env.js';
import { eq } from 'drizzle-orm';
import type { AuthResponse, User, ProfileUpdateRequest } from '@heritage-odyssey/shared/types';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

const generateAccessToken = (userId: string) => {
  return jwt.sign({ sub: userId }, env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

const generateRefreshToken = (userId: string) => {
  return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
};

const toUserResponse = (user: typeof users.$inferSelect): User => {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    firstName: user.firstName,
    lastName: user.lastName,
    dateOfBirth: user.dateOfBirth,
    birthLocation: user.birthLocation,
    currentLocation: user.currentLocation,
    heritageRegions: user.heritageRegions,
    researchInterests: user.researchInterests,
    profileComplete: user.profileComplete,
    googleId: user.googleId,
    authProvider: user.authProvider,
  };
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    if (!firstName || !lastName) {
      return res.status(400).json({ message: 'First name and last name are required' });
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        firstName,
        lastName,
      })
      .returning();

    if (!newUser) {
      throw new Error('Failed to create user');
    }

    const accessToken = generateAccessToken(newUser.id);
    const refreshToken = generateRefreshToken(newUser.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
    });

    const response: AuthResponse = {
      user: toUserResponse(newUser),
      accessToken,
    };

    res.status(201).json(response);
  } catch (_error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
    });

    const response: AuthResponse = {
      user: toUserResponse(user),
      accessToken,
    };

    res.json(response);
  } catch (_error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.status(200).json({ message: 'Logged out' });
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token missing' });
  }

  try {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string };
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.sub),
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
    });

    const response: AuthResponse = {
      user: toUserResponse(user),
      accessToken: newAccessToken,
    };

    res.json(response);
  } catch (_error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(toUserResponse(user));
  } catch (_error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const demoLogin = async (_req: Request, res: Response) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.authProvider, 'demo'),
    });

    if (!user) {
      res.status(503).json({ message: 'Demo account not available' });
      return;
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
    });

    const response: AuthResponse = {
      user: toUserResponse(user),
      accessToken,
    };

    res.json(response);
  } catch (_error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const googleAuthUrl = (_req: Request, res: Response) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) {
    res.status(503).json({ message: 'Google OAuth is not configured' });
    return;
  }
  const oauth = new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  );
  const url = oauth.generateAuthUrl({
    access_type: 'online',
    scope: ['openid', 'email', 'profile'],
  });
  res.json({ url });
};

export const googleCallback = async (req: Request, res: Response) => {
  const { code } = req.query;
  if (!code || typeof code !== 'string') {
    res.status(400).json({ message: 'Missing authorization code' });
    return;
  }

  const clientUrl = env.CLIENT_URL ?? 'http://localhost:5173';

  try {
    const oauth = new OAuth2Client(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI,
    );
    const { tokens } = await oauth.getToken(code);
    const ticket = await oauth.verifyIdToken({
      idToken: tokens.id_token!,
      audience: env.GOOGLE_CLIENT_ID!,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload?.sub) {
      res.status(401).json({ message: 'Invalid Google token payload' });
      return;
    }
    const { email, sub: googleId } = payload;

    // Find existing user by googleId first, then by email (account linking)
    let user = await db.query.users.findFirst({ where: eq(users.googleId, googleId) });

    if (!user) {
      const byEmail = await db.query.users.findFirst({ where: eq(users.email, email) });
      if (byEmail) {
        const [updated] = await db
          .update(users)
          .set({ googleId, authProvider: 'google' })
          .where(eq(users.id, byEmail.id))
          .returning();
        user = updated;
      } else {
        const [created] = await db
          .insert(users)
          .values({ email, googleId, authProvider: 'google' })
          .returning();
        user = created;
      }
    }

    if (!user) {
      res.status(500).json({ message: 'Failed to resolve user' });
      return;
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
    });

    res.redirect(`${clientUrl}/auth/callback?token=${encodeURIComponent(accessToken)}`);
  } catch (_error) {
    res.status(401).json({ message: 'Google authentication failed' });
  }
};

const ALLOWED_PROFILE_FIELDS = [
  'firstName',
  'lastName',
  'dateOfBirth',
  'birthLocation',
  'currentLocation',
  'heritageRegions',
  'researchInterests',
] as const satisfies (keyof ProfileUpdateRequest)[];

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const updates: Partial<typeof users.$inferInsert> = {};
    for (const field of ALLOWED_PROFILE_FIELDS) {
      if (req.body[field] !== undefined) {
        (updates as Record<string, unknown>)[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided' });
    }

    // Auto-compute profileComplete: true when name + at least one heritage region are present
    const current = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!current) {
      return res.status(404).json({ message: 'User not found' });
    }

    const mergedFirstName = updates.firstName ?? current.firstName;
    const mergedLastName = updates.lastName ?? current.lastName;
    const mergedRegions =
      (updates.heritageRegions as string[] | undefined) ?? current.heritageRegions;

    if (mergedFirstName && mergedLastName && mergedRegions && mergedRegions.length > 0) {
      updates.profileComplete = true;
    }

    const [updated] = await db.update(users).set(updates).where(eq(users.id, userId)).returning();

    if (!updated) {
      throw new Error('Failed to update profile');
    }

    res.json(toUserResponse(updated));
  } catch (_error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
