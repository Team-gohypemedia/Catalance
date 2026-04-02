import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const ProjectDetailSkeleton = () => (
  <div className="min-h-screen bg-background p-6 text-foreground md:p-8 w-full">
    <div className="mx-auto w-full max-w-full space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <Card
            key={`meta-${item}`}
            className="border border-border/60 bg-card/80"
          >
            <CardContent className="space-y-3 p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <Card className="border border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[92%]" />
              <Skeleton className="h-4 w-[88%]" />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {[1, 2].map((item) => (
              <Card
                key={`narrative-${item}`}
                className="border border-border/60 bg-card/80"
              >
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-44" />
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[94%]" />
                  <Skeleton className="h-4 w-[88%]" />
                  <Skeleton className="h-4 w-[82%]" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-6 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`detail-${index}`}
                    className="space-y-2 border-l border-border/60 pl-4"
                  >
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-6 pt-0">
              <Skeleton className="h-2 w-full" />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={`phase-${item}`}
                    className="space-y-3 rounded-[18px] border border-border/60 p-4"
                  >
                    <Skeleton className="h-3 w-14" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-44" />
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={`task-${item}`}
                  className="flex items-center gap-3 rounded-lg border border-border/60 p-3"
                >
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[80%]" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>

          <Card className="min-h-[340px] border border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-52" />
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <Skeleton className="h-[150px] w-full rounded-[14px]" />
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-10" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-36" />
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {[1, 2, 3].map((item) => (
                <div
                  key={`earnings-${item}`}
                  className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0"
                >
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {[1, 2, 3].map((item) => (
                <div
                  key={`payout-${item}`}
                  className="space-y-2 rounded-[16px] border border-border/60 p-3"
                >
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-7 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
);

export default ProjectDetailSkeleton;
