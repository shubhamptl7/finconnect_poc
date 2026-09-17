import loanApplicationService from './loanApplicationService.js';
import loanEligibilityService from './loanEligibilityService.js';
import loanUnderwritingService from './loanUnderwritingService.js';
import loanOfferService from './loanOfferService.js';
import loanOriginationService from './loanOriginationService.js';
import columnWebhookService from './columnWebhookService.js';
import loanService from './loanService.js';

export {
  loanApplicationService,
  loanEligibilityService,
  loanUnderwritingService,
  loanOfferService,
  loanOriginationService,
  columnWebhookService,
  loanService
};

export default {
  application: loanApplicationService,
  eligibility: loanEligibilityService,
  underwriting: loanUnderwritingService,
  offer: loanOfferService,
  origination: loanOriginationService,
  webhook: columnWebhookService,
  loan: loanService,
};
