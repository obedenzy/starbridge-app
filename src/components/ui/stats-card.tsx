import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  className?: string;
}

export const StatsCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon,
  className 
}: StatsCardProps) => {
  return (
    <Card className={cn(
      "relative overflow-hidden bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover hover:shadow-elegant transition-all duration-300",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {change && (
              <p className={cn(
                "text-xs mt-1",
                changeType === 'positive' && "text-success",
                changeType === 'negative' && "text-destructive",
                changeType === 'neutral' && "text-muted-foreground"
              )}>
                {change}
              </p>
            )}
          </div>
          {icon && (
            <div className="text-accent opacity-80">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};