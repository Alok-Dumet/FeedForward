import UserListingsPage from '../../components/userListingsPage.jsx';

const USER_REQUESTS_CONFIG = {
  eyebrow: 'My Requests',
  description: 'Manage your active requests',
  cardConfig: {
    highlightLabel: 'Need',
    detailFields: [
      { label: 'Available Times', key: 'availability' },
      { label: 'Area', key: 'location' },
      { label: 'Serving', key: 'audience' },
    ],
  },
};

export default function UserRequests() {
  return <UserListingsPage config={USER_REQUESTS_CONFIG} />;
}
