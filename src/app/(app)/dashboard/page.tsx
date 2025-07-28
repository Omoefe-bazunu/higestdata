import WalletSummary from '@/components/dashboard/wallet-summary';
import CryptoRates from '@/components/dashboard/crypto-rates';
import RecentTransactions from '@/components/dashboard/recent-transactions';
import QuickActions from '@/components/dashboard/quick-actions';
import { MOCK_USER } from '@/lib/data';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Welcome back, {MOCK_USER.name.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">Here's a summary of your account today.</p>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-8">
          <WalletSummary />
          <RecentTransactions />
        </div>
        <div className="space-y-8">
          <QuickActions />
          <CryptoRates />
        </div>
      </div>
    </div>
  );
}
