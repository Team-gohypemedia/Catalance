import { normalizeServiceDraft } from './src/components/freelancer/Freelancer-Onboarding/service-details.js';
const payload = { pricingUnit: 'creative', pricingQuantity: 10 };
console.log('draft:', normalizeServiceDraft(payload));
