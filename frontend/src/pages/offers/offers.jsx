import PublicListingsPage from '../../components/publicListingsPage.jsx';

const OFFERS_CONFIG = {
  eyebrow: 'Available Offers',
  description: 'Browse available surplus food offers',
  filtersLabel: 'Filter offers:',
  routePrefix: 'offers',
  highlightLabel: 'Quantity',
  detailFields: [
    { label: 'Available Times', key: 'availability' },
    { label: 'Location', key: 'location' },
    { label: 'Best For', key: 'audience' },
  ],
};

export default function Offers() {
  return <PublicListingsPage config={OFFERS_CONFIG} />;
}
