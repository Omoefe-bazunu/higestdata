import { AuthForm } from '@/components/auth-form';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <AuthForm type="signin" />
    </div>
  );
}
