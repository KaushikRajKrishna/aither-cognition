import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationBell() {
  const { state, loading, subscribe, unsubscribe } = useNotifications();

  if (state === "unsupported") return null;

  if (state === "granted") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={unsubscribe}
            disabled={loading}
            className="text-primary"
          >
            <BellRing className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Notifications on — click to disable</TooltipContent>
      </Tooltip>
    );
  }

  if (state === "denied") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" disabled className="text-muted-foreground">
            <BellOff className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Notifications blocked in browser settings</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={subscribe}
          disabled={loading}
          className="text-muted-foreground hover:text-primary"
        >
          <Bell className="h-5 w-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Enable notifications for appointments & mood alerts</TooltipContent>
    </Tooltip>
  );
}
