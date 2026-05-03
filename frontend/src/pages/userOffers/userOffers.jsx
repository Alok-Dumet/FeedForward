import UserListingsPage from '../../components/userListingsPage.jsx';

const USER_OFFERS_CONFIG = {
  eyebrow: 'My Offers',
  description: 'Manage your active offers',
};

export default function UserOffers() {
  return <UserListingsPage config={USER_OFFERS_CONFIG} />;
}
