import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const DashboardCardSkeleton = () => (
  <Card className="overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-6 rounded-full" />
    </CardHeader>
    <CardContent className="p-3 sm:p-6 pt-0">
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-20" />
    </CardContent>
  </Card>
);

export const DashboardGridSkeleton = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="animate-fade-in"
        style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
      >
        <DashboardCardSkeleton />
      </div>
    ))}
  </div>
);

export const WeatherPanelSkeleton = () => (
  <Card className="overflow-hidden">
    <CardHeader>
      <Skeleton className="h-6 w-48 mb-2" />
      <Skeleton className="h-4 w-64" />
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
    </CardContent>
  </Card>
);

export const ContentSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center gap-3">
      <Skeleton className="h-12 w-12 rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
    <DashboardGridSkeleton />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <WeatherPanelSkeleton />
      <WeatherPanelSkeleton />
    </div>
  </div>
);
