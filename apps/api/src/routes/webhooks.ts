import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { createLicense } from '../services/supabase.js';
import { sendLicenseEmail } from '../services/email.js';

const router = Router();

// Tool sets per tier
const TIER_TOOLS: Record<string, string[]> = {
  starter: [], // populated per-product below
  professional: ['*'], // wildcard = all tools
  enterprise: ['*'],
  realestate: ['property-roi', 'mortgage-planner', 'lieau-configurator'],
};

const PRODUCT_TOOL_MAP: Record<string, { toolId: string; tier: string }> = {
  'ebitda-analyzer': { toolId: 'ebitda-analyzer', tier: 'starter' },
  'digital-maturity': { toolId: 'digital-maturity', tier: 'starter' },
  'property-roi': { toolId: 'property-roi', tier: 'starter' },
  'okr-builder': { toolId: 'okr-builder', tier: 'starter' },
  'working-capital': { toolId: 'working-capital', tier: 'starter' },
  'lieau-configurator': { toolId: 'lieau-configurator', tier: 'starter' },
  'professional-bundle': { toolId: '*', tier: 'professional' },
  'realestate-bundle': { toolId: 'realestate-bundle', tier: 'realestate' },
};

function verifySquarespaceSignature(body: string, signature: string): boolean {
  const secret = process.env.SQUARESPACE_WEBHOOK_KEY;
  if (!secret) return true; // dev mode: skip verification
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

/**
 * POST /webhooks/squarespace-order
 * Fired by Squarespace Commerce on each completed order.
 * Creates a license record and emails the buyer.
 */
router.post(
  '/squarespace-order',
  async (req: Request, res: Response): Promise<void> => {
    const rawBody = JSON.stringify(req.body);
    const sig = req.headers['x-squarespace-signature'] as string ?? '';

    if (!verifySquarespaceSignature(rawBody, sig)) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    try {
      const order = req.body;
      const buyerEmail: string = order?.customerEmail ?? order?.billingAddress?.email;
      if (!buyerEmail) {
        res.status(400).json({ error: 'No buyer email in order payload' });
        return;
      }

      const lineItems: any[] = order?.lineItems ?? [];
      const createdLicenses: string[] = [];

      for (const item of lineItems) {
        const sku: string = item?.sku ?? item?.productId ?? '';
        const mapping = PRODUCT_TOOL_MAP[sku];
        if (!mapping) continue; // non-tool product, skip

        const tier = mapping.tier as 'starter' | 'professional' | 'enterprise' | 'realestate';
        const toolsAllowed =
          tier === 'starter' ? [mapping.toolId] : TIER_TOOLS[tier];

        const licenseKey = `BEL-${uuidv4().toUpperCase().replace(/-/g, '').slice(0, 16)}`;

        await createLicense({
          email: buyerEmail,
          tier,
          tools_allowed: toolsAllowed,
          uses_remaining: tier === 'starter' ? 3 : null,
          expires_at:
            tier === 'professional'
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              : null,
          license_key: licenseKey,
          order_id: order?.id,
        });

        createdLicenses.push(licenseKey);

        await sendLicenseEmail({
          toEmail: buyerEmail,
          tier,
          licenseKey,
          toolsAllowed,
        });
      }

      res.json({ ok: true, licensesCreated: createdLicenses.length });
    } catch (err) {
      console.error('Webhook error:', err);
      res.status(500).json({ error: 'Internal error processing order' });
    }
  }
);

export default router;
