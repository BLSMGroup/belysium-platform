import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { issueLicenseToken } from '../middleware/auth.js';

const router = Router();

const LoginSchema = z.object({
  email: z.string().email(),
  licenseKey: z.string().min(8),
});

/**
 * POST /auth/tool-login
 * Validates email + license key, returns a short-lived JWT.
 * Called by tool iframes on load.
 */
router.post('/tool-login', async (req: Request, res: Response): Promise<void> => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid email or license key format' });
    return;
  }

  const { email, licenseKey } = parsed.data;
  const token = await issueLicenseToken(email, licenseKey);

  if (!token) {
    res.status(401).json({ error: 'Invalid or expired license' });
    return;
  }

  res.json({ token, expiresIn: 3600 });
});

export default router;
