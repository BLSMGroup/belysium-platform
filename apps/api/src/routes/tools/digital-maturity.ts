import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireLicense } from '../../middleware/auth.js';
import { generateReport } from '../../services/claude.js';
import { decrementUse } from '../../services/supabase.js';

const router = Router();

// 8 dimensions × 5 questions each = 40 questions
const DIMENSIONS = [
  'Strategy & Leadership',
  'Customer Experience',
  'Operations & Automation',
  'Data & Analytics',
  'Technology & Infrastructure',
  'Culture & Talent',
  'Cybersecurity & Risk',
  'Ecosystem & Partnerships',
] as const;

const AssessmentSchema = z.object({
  companyName: z.string().optional(),
  industry: z.string(),
  revenue: z.string().optional(), // range like "10-50M"
  scores: z.record(z.string(), z.number().min(1).max(5)), // dimensionName -> avg score 1-5
});

const SYSTEM_PROMPT = `You are a digital transformation expert. Given a company's digital maturity scores across 8 dimensions (rated 1-5), generate a comprehensive assessment.

Respond with a valid JSON object matching this structure exactly:
{
  "overallScore": number,
  "maturityLevel": "Initial" | "Developing" | "Defined" | "Advanced" | "Leading",
  "summary": "string — 2-3 sentence executive summary",
  "dimensionScores": [
    {
      "dimension": "string",
      "score": number,
      "benchmark": number,
      "gap": number,
      "maturityLevel": "string",
      "strengths": ["string"],
      "gaps": ["string"]
    }
  ],
  "priorityInitiatives": [
    {
      "rank": number,
      "initiative": "string",
      "dimension": "string",
      "impact": "High" | "Medium" | "Low",
      "effort": "High" | "Medium" | "Low",
      "timeframe": "string",
      "description": "string",
      "estimatedROI": "string"
    }
  ],
  "roadmap": {
    "quickWins": [{ "initiative": "string", "timeframe": "0-3 months", "kpi": "string" }],
    "mediumTerm": [{ "initiative": "string", "timeframe": "3-12 months", "kpi": "string" }],
    "strategic": [{ "initiative": "string", "timeframe": "12-24 months", "kpi": "string" }]
  },
  "narrative": "string — 200-250 word qualitative assessment"
}`;

/**
 * POST /tools/digital-maturity/assess
 */
router.post(
  '/assess',
  requireLicense('digital-maturity'),
  async (req: Request, res: Response): Promise<void> => {
    const parsed = AssessmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const { companyName, industry, revenue, scores } = parsed.data;
    const scoreLines = DIMENSIONS.map((d) => `- ${d}: ${scores[d] ?? 'N/A'}/5`).join('\n');
    const overall = (
      Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length
    ).toFixed(2);

    const userPrompt = `Assess the digital maturity of this company:

Company: ${companyName ?? 'Confidential'}
Industry: ${industry}
${revenue ? `Revenue range: ${revenue}` : ''}

Dimension scores (1=Initial, 5=Leading):
${scoreLines}
Overall average: ${overall}/5

Generate the full digital maturity assessment with roadmap.`;

    try {
      const report = await generateReport(SYSTEM_PROMPT, userPrompt, 'sonnet');
      await decrementUse(req.license!.licenseKey).catch(console.error);
      res.json(report);
    } catch (err) {
      console.error('Digital maturity error:', err);
      res.status(500).json({ error: 'Failed to generate assessment. Please try again.' });
    }
  }
);

/**
 * GET /tools/digital-maturity/questions
 * Returns the 40-question survey structure.
 */
router.get('/questions', (_req, res: Response) => {
  const questions = DIMENSIONS.map((dimension) => ({
    dimension,
    questions: DIMENSION_QUESTIONS[dimension],
  }));
  res.json({ dimensions: questions });
});

const DIMENSION_QUESTIONS: Record<string, string[]> = {
  'Strategy & Leadership': [
    'Our leadership has a clear, communicated digital strategy.',
    'Digital transformation is a board-level priority with dedicated budget.',
    'We have a defined digital roadmap with measurable milestones.',
    'We regularly benchmark our digital maturity against competitors.',
    'Digital initiatives are tied to measurable business outcomes.',
  ],
  'Customer Experience': [
    'We offer seamless omnichannel customer interactions.',
    'We use data to personalize customer journeys.',
    'Customer feedback is systematically collected and acted upon.',
    'Our digital touchpoints (website, app, portal) meet modern UX standards.',
    'We proactively anticipate customer needs using predictive tools.',
  ],
  'Operations & Automation': [
    'Core business processes are documented and digitized.',
    'We use automation (RPA, workflow tools) to reduce manual tasks.',
    'Our supply chain has real-time visibility and digital integration.',
    'We have eliminated significant paper-based or manual approval processes.',
    'We use digital tools to manage projects and cross-functional collaboration.',
  ],
  'Data & Analytics': [
    'We have a single source of truth for business-critical data.',
    'Decisions are regularly informed by data dashboards and reports.',
    'We use advanced analytics (predictive, prescriptive) in our operations.',
    'Data governance policies and data quality standards are in place.',
    'We treat data as a strategic asset with clear ownership.',
  ],
  'Technology & Infrastructure': [
    'Our core systems (ERP, CRM) are modern and well-integrated.',
    'We have adopted cloud infrastructure for key workloads.',
    'Our technology stack supports rapid experimentation and deployment.',
    'Technical debt is actively managed and being reduced.',
    'We have APIs and integration layers enabling system interoperability.',
  ],
  'Culture & Talent': [
    'Employees embrace change and see digital tools as enablers.',
    'We invest in continuous digital upskilling and reskilling.',
    'We attract and retain digital talent effectively.',
    'Innovation is encouraged and rewarded at all levels.',
    'Cross-functional digital teams are empowered to deliver outcomes.',
  ],
  'Cybersecurity & Risk': [
    'We have a documented cybersecurity policy that is actively enforced.',
    'Regular security audits and penetration tests are conducted.',
    'Employees receive regular cybersecurity awareness training.',
    'We have incident response and business continuity plans for digital failures.',
    'Regulatory and data privacy compliance (GDPR, etc.) is fully managed.',
  ],
  'Ecosystem & Partnerships': [
    'We actively collaborate with technology partners and startups.',
    'Our systems are integrated with key suppliers and customers.',
    'We participate in or lead industry digital standards or consortia.',
    'We leverage external platforms (marketplaces, APIs) to extend our reach.',
    'We have a clear strategy for build vs. buy vs. partner decisions.',
  ],
};

export default router;
