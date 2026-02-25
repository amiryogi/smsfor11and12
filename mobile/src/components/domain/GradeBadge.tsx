import { Badge } from "../ui/Badge";

interface GradeBadgeProps {
  status: string;
  className?: string;
}

export function GradeBadge({ status, className }: GradeBadgeProps) {
  const label = status.replace(/_/g, " ");
  return <Badge label={label} status={status} className={className} />;
}
