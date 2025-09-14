import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { notificationApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: "low" | "medium" | "high";
  amount?: number;
  category?: string;
  createdAt: string;
}

const severityColors = {
  low: "text-green-500",
  medium: "text-yellow-500",
  high: "text-red-500",
};

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close notifications when clicking outside on mobile
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-notification-center]')) {
        setVisible(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [visible]);

  // Prevent body scroll when notifications are open on mobile
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [visible]);

  const fetchNotifications = async () => {
    try {
      const response = await notificationApi.getNotifications();
      if (response.data.success) {
        setNotifications(response.data.data.notifications);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.userFriendlyMessage || "Failed to load notifications",
        variant: "destructive",
      });
    }
  };

  const dismissNotification = async (id: string) => {
    try {
      await notificationApi.dismissNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to dismiss notification",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {visible && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setVisible(false)}
        />
      )}

      <div className="relative" data-notification-center>
        <button
          onClick={() => setVisible(!visible)}
          className="relative p-2 sm:p-3 rounded-full hover:bg-glass-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10 transition-colors"
          aria-label="Toggle notifications"
        >
          <Bell className="h-6 w-6 sm:h-7 sm:w-7 text-foreground" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold leading-none text-destructive-foreground bg-destructive rounded-full">
              {notifications.length > 99 ? '99+' : notifications.length}
            </span>
          )}
        </button>

        {visible && (
          <div className="fixed inset-x-4 top-20 bottom-4 md:absolute md:right-0 md:top-full md:inset-x-auto md:bottom-auto md:mt-2 md:w-80 md:max-h-96 overflow-hidden rounded-lg bg-card shadow-lg md:shadow-card z-50 border border-border">
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b border-border flex justify-between items-center bg-card">
              <h3 className="text-lg font-semibold text-card-foreground">Notifications</h3>
              <button
                onClick={() => setVisible(false)}
                className="text-muted-foreground hover:text-foreground focus:outline-none transition-colors p-1 rounded-md hover:bg-muted"
                aria-label="Close notifications"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground min-h-[200px]">
                  <Bell className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-base">No notifications</p>
                  <p className="text-sm mt-1">You're all caught up!</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className="p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={`font-semibold text-sm leading-tight ${severityColors[notification.severity]}`}>
                              {notification.title}
                            </h4>
                            <button
                              onClick={() => dismissNotification(notification.id)}
                              className="flex-shrink-0 text-muted-foreground hover:text-foreground focus:outline-none transition-colors p-1 rounded-md hover:bg-muted"
                              aria-label="Dismiss notification"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{formatDate(notification.createdAt)}</span>
                            {notification.category && (
                              <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize">
                                {notification.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer with action buttons for mobile */}
            {notifications.length > 0 && (
              <div className="flex-shrink-0 p-4 border-t border-border bg-card md:hidden">
                <button
                  onClick={() => {
                    setNotifications([]);
                    setVisible(false);
                  }}
                  className="w-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted transition-colors"
                >
                  Clear all notifications
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationCenter;