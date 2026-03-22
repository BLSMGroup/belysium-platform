import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getLicenseByKey } from '../services/supabase.js';

export interface LicensePayload {
  email: string;
  tier: string;
  toolsAllowed: string[];
  licenseKey: string;
}

declare global {
  namespace Express {
    interface Request {
      license?: LicensePayload;
    }
  }
}

/** Issues a short-lived JWT after validating a license key. */
export async function issueLicenseToken(
  email: string,
  licenseKey: string
): Promise<string | null> {
  const license = await getLicenseByKey(licenseKey);
  if (!license) return null;
  if (license.email.toLowerCase() !== email.toLowerCase()) return null;
  if (license.expires_at && new Date(license.expires_at) < new Date()) return null;
  if (license.uses_remaining !== null && license.uses_remaining <= 0) return null;

  const payload: LicensePayload = {
    email: license.email,
    tier: license.tier,
    toolsAllowed: license.tools_allowed,
    licenseKey: license.license_key,
  };
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });
}

/** Middleware: verifies JWT from Authorization header and attaches license to req. */
export function requireLicense(toolId?: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing authorization token' });
      return;
    }
    try {
      const token = authHeader.slice(7);
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as LicensePayload;
      if (toolId && !payload.toolsAllowed.includes(toolId) && !payload.toolsAllowed.includes('*')) {
        res.status(403).json({ error: 'Tool not included in your license' });
        return;
      }
      req.license = payload;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}
