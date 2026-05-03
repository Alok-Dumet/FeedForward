import { createPublicListingsLoader } from '../../utils/listingLoaders.js';

export default createPublicListingsLoader({
  allFilterLabel: 'All offers',
  errorMessage: 'Unable to load offers.',
});
