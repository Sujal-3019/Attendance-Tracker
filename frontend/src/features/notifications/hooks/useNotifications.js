
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationService";

export const notificationKeys = {
  all: ["notifications"],
};

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: getNotifications,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,

    onSuccess: (updatedNotification) => {
      queryClient.setQueryData(
        notificationKeys.all,
        (currentNotifications) =>
          currentNotifications?.map((notification) =>
            notification.id === updatedNotification.id
              ? updatedNotification
              : notification,
          ),
      );
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,

    onSuccess: () => {
      queryClient.setQueryData(
        notificationKeys.all,
        (currentNotifications) =>
          currentNotifications?.map((notification) => ({
            ...notification,
            status: "Read",
          })),
      );
    },
  });
}
