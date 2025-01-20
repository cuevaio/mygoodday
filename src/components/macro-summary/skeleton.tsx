import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function MacroSummaryLoading() {
  return (
    <Card className="mx-auto w-full max-w-md overflow-hidden rounded-lg bg-white shadow-md">
      <CardContent className="p-4">
        <div className="mb-2 text-lg font-semibold">
          <Skeleton className="h-6 w-32" />
        </div>

        {/* Simulate 3 food items */}
        {[1, 2, 3].map((index) => (
          <div key={index} className="mb-4">
            <div className="flex items-center space-x-2 py-2">
              <Skeleton className="size-12 rounded-lg" />
              <div className="flex-grow">
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}

        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {/* Total Calories */}
            <Skeleton className="h-4 w-24" />
            <div className="text-right">
              <Skeleton className="ml-auto h-4 w-20" />
            </div>

            {/* Total Fat */}
            <Skeleton className="h-4 w-16" />
            <div className="text-right">
              <Skeleton className="ml-auto h-4 w-16" />
            </div>

            {/* Total Carbs */}
            <Skeleton className="h-4 w-20" />
            <div className="text-right">
              <Skeleton className="ml-auto h-4 w-16" />
            </div>

            {/* Total Protein */}
            <Skeleton className="h-4 w-20" />
            <div className="text-right">
              <Skeleton className="ml-auto h-4 w-16" />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}
