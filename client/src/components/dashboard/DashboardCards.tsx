import { Skeleton } from "@/components/ui/skeleton";

interface DashboardCardsProps {
  todayCollection: { amount: number; percentageChange: number } | undefined;
  todayReceipts: { count: number; date: string } | undefined;
  feeDefaulters: { count: number } | undefined;
  isLoading: {
    collection: boolean;
    receipts: boolean;
    defaulters: boolean;
  };
}

const DashboardCards = ({ todayCollection, todayReceipts, feeDefaulters, isLoading }: DashboardCardsProps) => {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format current date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Today's Collection Card */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <span className="material-icons text-primary">payments</span>
          </div>
          <div>
            <p className="text-text-secondary text-sm">Today's Collection</p>
            {isLoading.collection ? (
              <Skeleton className="h-7 w-24 mt-1" />
            ) : (
              <h3 className="text-text-primary text-xl font-medium">
                {todayCollection ? formatCurrency(todayCollection.amount) : '₹0'}
              </h3>
            )}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          {isLoading.collection ? (
            <Skeleton className="h-5 w-40" />
          ) : (
            todayCollection && todayCollection.percentageChange !== 0 ? (
              <p className={`text-sm flex items-center ${todayCollection.percentageChange > 0 ? 'text-success' : 'text-error'}`}>
                <span className="material-icons text-sm mr-1">
                  {todayCollection.percentageChange > 0 ? 'arrow_upward' : 'arrow_downward'}
                </span>
                {Math.abs(todayCollection.percentageChange)}% {todayCollection.percentageChange > 0 ? 'more' : 'less'} than yesterday
              </p>
            ) : (
              <p className="text-text-secondary text-sm">No comparison data available</p>
            )
          )}
        </div>
      </div>
      
      {/* Receipts Generated Card */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <span className="material-icons text-secondary">receipt_long</span>
          </div>
          <div>
            <p className="text-text-secondary text-sm">Receipts Generated</p>
            {isLoading.receipts ? (
              <Skeleton className="h-7 w-12 mt-1" />
            ) : (
              <h3 className="text-text-primary text-xl font-medium">
                {todayReceipts ? todayReceipts.count : '0'}
              </h3>
            )}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          {isLoading.receipts ? (
            <Skeleton className="h-5 w-40" />
          ) : (
            <p className="text-text-secondary text-sm flex items-center">
              <span className="material-icons text-sm mr-1">today</span>
              Today, {todayReceipts ? formatDate(todayReceipts.date) : new Date().toLocaleDateString('en-IN')}
            </p>
          )}
        </div>
      </div>
      
      {/* Fee Defaulters Card */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center">
          <div className="rounded-full bg-orange-100 p-3 mr-4">
            <span className="material-icons text-accent">warning</span>
          </div>
          <div>
            <p className="text-text-secondary text-sm">Fee Defaulters</p>
            {isLoading.defaulters ? (
              <Skeleton className="h-7 w-12 mt-1" />
            ) : (
              <h3 className="text-text-primary text-xl font-medium">
                {feeDefaulters ? feeDefaulters.count : '0'}
              </h3>
            )}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <a href="/reports?type=defaulters" className="text-primary text-sm flex items-center">
            <span>View defaulter list</span>
            <span className="material-icons text-sm ml-1">arrow_forward</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default DashboardCards;
