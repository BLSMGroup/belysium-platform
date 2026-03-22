import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireLicense } from '../../middleware/auth.js';
import { generateReport } from '../../services/claude.js';
import { decrementUse } from '../../services/supabase.js';

const router = Router();

const PropertyRoiSchema = z.object({
  purchasePrice: z.number().positive(),
  // Belgian acquisition costs
  registrationTaxRate: z.number().min(0).max(20).default(3), // % — 3% primary, 12% standard
  notaryCostRate: z.number().min(0).max(5).default(1.5), // % of purchase price
  // Financing
  mortgageAmount: z.number().min(0),
  interestRate: z.number().min(0).max(15),
  loanTermYears: z.number().int().min(5).max(30),
  // Rental income
  monthlyRent: z.number().min(0),
  occupancyRate: z.number().min(0).max(100).default(95), // %
  // Annual costs
  condoFees: z.number().min(0).default(0),
  propertyTax: z.number().min(0).default(0), // onroerende voorheffing
  insurance: z.number().min(0).default(0),
  maintenanceRate: z.number().min(0).max(5).default(1), // % of purchase price
  // Projections
  annualAppreciation: z.number().min(-5).max(20).default(3), // %
  holdingYears: z.number().int().min(1).max(30).default(10),
  // Context
  propertyType: z.string().default('apartment'),
  location: z.string().default('Belgium'),
  isPrimaryResidence: z.boolean().default(false),
});

const SYSTEM_PROMPT = `You are a Belgian real estate investment analyst. Given property details and financing inputs, generate a comprehensive ROI analysis tailored to Belgian tax rules and market conditions.

Respond with a valid JSON object matching this structure:
{
  "summary": "string — 2-3 sentence executive summary",
  "acquisitionCosts": {
    "purchasePrice": number,
    "registrationTax": number,
    "notaryCosts": number,
    "totalAcquisitionCost": number,
    "totalAcquisitionCostPercent": number
  },
  "financing": {
    "monthlyMortgagePayment": number,
    "totalInterestPaid": number,
    "loanToValue": number
  },
  "annualCashflow": {
    "grossRentalIncome": number,
    "vacancyLoss": number,
    "effectiveRentalIncome": number,
    "operatingCosts": number,
    "mortgagePayments": number,
    "netCashflow": number
  },
  "returns": {
    "grossYield": number,
    "netYield": number,
    "cashOnCashReturn": number,
    "irr": number,
    "totalReturn10Year": number
  },
  "cashflowProjection": [
    { "year": number, "rent": number, "costs": number, "mortgage": number, "netCashflow": number, "propertyValue": number, "equity": number }
  ],
  "belgianTaxNotes": ["string"],
  "marketContext": "string — 100-150 word commentary on Belgian/local market",
  "risks": ["string"],
  "verdict": "Strong Buy" | "Buy" | "Hold" | "Caution" | "Avoid",
  "verdictReason": "string"
}`;

/**
 * POST /tools/property-roi/analyze
 */
router.post(
  '/analyze',
  requireLicense('property-roi'),
  async (req: Request, res: Response): Promise<void> => {
    const parsed = PropertyRoiSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const d = parsed.data;
    const totalAcqCost =
      d.purchasePrice * (1 + (d.registrationTaxRate + d.notaryCostRate) / 100);
    const annualRent = d.monthlyRent * 12 * (d.occupancyRate / 100);
    const annualCosts =
      d.condoFees + d.propertyTax + d.insurance + d.purchasePrice * (d.maintenanceRate / 100);
    const equity = d.purchasePrice - d.mortgageAmount;

    const userPrompt = `Analyze this Belgian property investment:

Property: ${d.propertyType} in ${d.location}
Primary residence: ${d.isPrimaryResidence ? 'Yes' : 'No (investment)'}
Purchase price: €${d.purchasePrice.toLocaleString()}
Registration tax rate: ${d.registrationTaxRate}%
Notary cost rate: ${d.notaryCostRate}%
Total acquisition cost (estimated): €${totalAcqCost.toLocaleString('nl-BE', { maximumFractionDigits: 0 })}

Financing:
- Mortgage: €${d.mortgageAmount.toLocaleString()} over ${d.loanTermYears} years at ${d.interestRate}%
- Buyer equity: €${equity.toLocaleString()}

Rental:
- Monthly rent: €${d.monthlyRent}
- Occupancy rate: ${d.occupancyRate}%
- Annual effective rent: €${annualRent.toLocaleString('nl-BE', { maximumFractionDigits: 0 })}

Annual costs:
- Condo fees: €${d.condoFees}
- Property tax (onroerende voorheffing): €${d.propertyTax}
- Insurance: €${d.insurance}
- Maintenance (${d.maintenanceRate}%/year): €${(d.purchasePrice * d.maintenanceRate / 100).toLocaleString('nl-BE', { maximumFractionDigits: 0 })}
- Total annual costs: €${annualCosts.toLocaleString('nl-BE', { maximumFractionDigits: 0 })}

Projections:
- Annual appreciation: ${d.annualAppreciation}%
- Holding period: ${d.holdingYears} years

Generate the full Belgian property ROI analysis including ${d.holdingYears}-year cashflow projection.`;

    try {
      const report = await generateReport(SYSTEM_PROMPT, userPrompt, 'sonnet');
      await decrementUse(req.license!.licenseKey).catch(console.error);
      res.json(report);
    } catch (err) {
      console.error('Property ROI error:', err);
      res.status(500).json({ error: 'Failed to generate analysis. Please try again.' });
    }
  }
);

export default router;
