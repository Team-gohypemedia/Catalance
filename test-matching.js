import { expandServiceSignal, isServiceCompatible } from './backend/src/services/proposal-matching.service.js';

console.log('creative_design vs creative_design:', isServiceCompatible('creative_design', 'creative_design'));
console.log('branding vs creative_design:', isServiceCompatible('branding', 'creative_design'));
