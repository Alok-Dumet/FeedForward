import { useNavigate, Link } from 'react-router-dom';

import { useToast } from '../../components/toast.jsx';
import TextInput from '../../components/textInput.jsx';

export default function Register() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  async function handleSubmit(e) {
    e.preventDefault();

    const streetAddress = e.currentTarget.elements.street_address.value.trim();
    const city = e.currentTarget.elements.city.value.trim();
    const state = e.currentTarget.elements.state.value.trim();
    const postalCode = e.currentTarget.elements.postal_code.value.trim();
    const addressText = [streetAddress, city, [state, postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ');

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: e.currentTarget.elements.email.value,
          password: e.currentTarget.elements.password.value,
          role: e.currentTarget.elements.role.value,
          organization_name: e.currentTarget.elements.organization_name.value,
          street_address: streetAddress,
          address_text: addressText,
          city,
          state,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, 'error');
      } else {
        navigate('/login', {
          state: {
            message: 'Registration successful. You can log in now.',
          },
        });
      }
    } catch {
      showToast('Network Error', 'error');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <section className="w-full max-w-xl rounded-3xl border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center">
          <p className="brand-label">FeedForward</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Create account</h1>
          <p className="mt-2 text-sm text-slate-600">Sign up to start using FeedForward.</p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <TextInput as="select" label="Role" name="role" defaultValue="food_provider">
            <option value="food_provider">Food Provider</option>
            <option value="recipient_organization">Recipient Organization</option>
          </TextInput>

          <TextInput label="Organization Name" name="organization_name" type="text" />

          <TextInput label="Street Address" name="street_address" type="text" autoComplete="street-address" placeholder="123 Main St, Suite 4" />

          <div className="grid gap-5 sm:grid-cols-[1fr_8rem]">
            <TextInput label="City" name="city" type="text" autoComplete="address-level2" placeholder="Springfield" />
            <TextInput label="State" name="state" type="text" autoComplete="address-level1" placeholder="IL" maxLength={2} className="uppercase" />
          </div>

          <TextInput label="ZIP Code" name="postal_code" type="text" inputMode="numeric" autoComplete="postal-code" placeholder="62701" />

          <TextInput label="Email" name="email" type="email" autoComplete="email" />

          <TextInput label="Password" name="password" type="password" autoComplete="new-password" />

          <button type="submit" className="btn-primary w-full px-4 py-3">
            Register
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-amber-700 hover:text-amber-800">
            Log in
          </Link>
        </div>
      </section>
    </div>
  );
}
