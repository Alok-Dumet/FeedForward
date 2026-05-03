import PublicListingsPage from '../../components/publicListingsPage.jsx';

const REQUESTS_CONFIG = {
  eyebrow: 'Active Requests',
  description: 'Browse active community food requests',
  filtersLabel: 'Filter requests:',
  routePrefix: 'requests',
  highlightLabel: 'Need',
  detailFields: [
    { label: 'Available Times', key: 'availability' },
    { label: 'Area', key: 'location' },
    { label: 'Serving', key: 'audience' },
  ],
};

export default function Requests() {
  return <PublicListingsPage config={REQUESTS_CONFIG} />;
}
