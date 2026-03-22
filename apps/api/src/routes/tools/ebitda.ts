import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireLicense } from '../../middleware/auth.js';
import { generateReport } from '../../services/claude.js';
import { decrementUse } from '../../services/supabase.js';

const router = Router();

const EbitdaInputSchema = z.object({
  companyName: z.string().optional(),
  revenue: z.number().positive(),
  grossProfit: z.number(),
  operatingCosts: z.number().positive(),
  ebitda: z.number(),
  industry: z.string(),
  headcount: z.number().int().positive().optional(),
  topCostDrivers: z.array(z.string()).max(5).optional(),
  revenueGrowthYoY: z.number().optional(), // percentage
  currency: z.string().default('EUR'),
});

const SYSTEM_PROMPT = `You are an expert EBITDA improvement analyst. Given a company's financial inputs, you will:
1. Calculate key metrics and ratios
2. Identify the top 5 improvement levers with estimated impact
3. Benchmark against industry averages
4. Provide a prioritized action plan

Always respond with a valid JSON object matching this exact structure:
{
  "summary": "string — 2-3 sentence executive summary",
  "metrics": {
    "ebitdaMargin": number,
    "revenuePerEmployee": number | null,
    "grossMargin": number,
    "industryBenchmarkEbitdaMargin": number,
    "gapToIndustryBenchmark": number
  },
  "levers": [
    {
      "rank": number,
      "category": "Revenue" | "Cost" | "Working Capital" | "Pricing" | "Headcount",
      "lever": "string",
      "estimatedImpactEur": number,
      "estimatedImpactPercent": number,
      "effort": "Low" | "Medium" | "High",
      "timeToImpact": "0-3 months" | "3-6 months" | "6-12 months",
      "description": "string"
    }
  ],
  "waterfallData": [
    { "label": "string", "value": number, "type": "base" | "positive" | "negative" | "total" }
  ],
  "actionPlan": [
    { "priority": number, "action": "string", "owner": "string", "deadline": "string", "kpi": "string" }
  ],
  "narrative": "string — 150-200 word qualitative assessment"
}`;

/**
 * POST /tools/ebitda/analyze
 * Generates an EBITDA improvement report. Requires valid license JWT.
 */
router.post(
  '/analyze',
  requireLicense('ebitda-analyzer'),
  async (req: Request, res: Response): Promise<void> => {
    const parsed = EbitdaInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const input = parsed.data;
    const userPrompt = `Analyze this company's EBITDA and generate improvement levers:

Company: ${input.companyName ?? 'Confidential'}
Industry: ${input.industry}
Currency: ${input.currency}

Financials:
- Revenue: ${input.revenue.toLocaleString()} ${input.currency}
- Gross Profit: ${input.grossProfit.toLocaleString()} ${input.currency}
- Operating Costs: ${input.operatingCosts.toLocaleString()} ${input.currency}
- EBITDA: ${input.ebitda.toLocaleString()} ${input.currency}
${input.headcount ? `- Headcount: ${input.headcount}` : ''}
${input.revenueGrowthYoY !== undefined ? `- Revenue Growth YoY: ${input.revenueGrowthYoY}%` : ''}
${input.topCostDrivers?.length ? `- Top cost drivers: ${input.topCostDrivers.join(', ')}` : ''}

Generate the full EBITDA improvement analysis.`;

    try {
      const report = await generateReport(SYSTEM_PROMPT, userPrompt, 'sonnet');
      await decrementUse(req.license!.licenseKey).catch(console.error);
      res.json(report);
    } catch (err) {
      console.error('EBITDA analysis error:', err);
      res.status(500).json({ error: 'Failed to generate analysis. Please try again.' });
    }
  }
);

export default router;
