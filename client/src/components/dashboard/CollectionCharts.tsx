import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Chart,
  Title,
  Tooltip,
  Legend,
  Colors,
  BarElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  LineChart,
  BarChart
} from "@/components/ui/chart";

const CollectionCharts = () => {
  // Get class-wise collection data
  const { data: classCollection, isLoading: isLoadingClassCollection } = useQuery({
    queryKey: ['/api/reports/class-collection'],
  });

  // Get monthly collection trend data
  const { data: monthlyCollection, isLoading: isLoadingMonthlyCollection } = useQuery({
    queryKey: ['/api/reports/monthly-collection'],
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Class-wise Collection */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-condensed font-bold text-text-primary text-lg">Class-wise Collection</h3>
        </div>
        <div className="p-4">
          {isLoadingClassCollection ? (
            <Skeleton className="h-64 w-full rounded" />
          ) : !classCollection ? (
            <div className="h-64 flex items-center justify-center bg-background-light rounded">
              <div className="text-center">
                <span className="material-icons text-4xl text-text-secondary">bar_chart</span>
                <p className="text-text-secondary mt-2">No class-wise collection data available</p>
              </div>
            </div>
          ) : (
            <div className="h-64">
              <BarChart
                data={{
                  labels: classCollection.map((item: { className: string }) => item.className),
                  datasets: [
                    {
                      label: 'Collection Amount',
                      data: classCollection.map((item: { amount: number }) => item.amount),
                      backgroundColor: 'rgba(21, 101, 192, 0.6)',
                      borderColor: 'rgb(21, 101, 192)',
                      borderWidth: 1
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return '₹' + value.toLocaleString('en-IN');
                        }
                      }
                    }
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return '₹' + context.parsed.y.toLocaleString('en-IN');
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Fee Collection Trend */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-condensed font-bold text-text-primary text-lg">Collection Trend</h3>
        </div>
        <div className="p-4">
          {isLoadingMonthlyCollection ? (
            <Skeleton className="h-64 w-full rounded" />
          ) : !monthlyCollection ? (
            <div className="h-64 flex items-center justify-center bg-background-light rounded">
              <div className="text-center">
                <span className="material-icons text-4xl text-text-secondary">trending_up</span>
                <p className="text-text-secondary mt-2">No monthly collection trend data available</p>
              </div>
            </div>
          ) : (
            <div className="h-64">
              <LineChart
                data={{
                  labels: monthlyCollection.map((item: { month: string }) => item.month),
                  datasets: [
                    {
                      label: 'Collection Amount',
                      data: monthlyCollection.map((item: { amount: number }) => item.amount),
                      fill: false,
                      borderColor: 'rgb(76, 175, 80)',
                      tension: 0.1,
                      pointBackgroundColor: 'rgb(76, 175, 80)'
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return '₹' + value.toLocaleString('en-IN');
                        }
                      }
                    }
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return '₹' + context.parsed.y.toLocaleString('en-IN');
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectionCharts;
