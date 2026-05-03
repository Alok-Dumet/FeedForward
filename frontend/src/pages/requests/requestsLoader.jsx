import { createPublicListingsLoader } from '../../utils/listingLoaders.js';

export default createPublicListingsLoader({
  allFilterLabel: 'All requests',
  errorMessage: 'Unable to load requests.',
});
