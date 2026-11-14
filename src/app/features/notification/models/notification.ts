export interface MyNotification {
    id: string;
    type: string;
    title: string;
    description: string;
    createdAt: Date;
    details: NotificationDetails;
    readAt: Date | null;
}

export interface NotificationDetails {
    $type?: string;
    notificationImageUrl?: string;

    [key: string]: unknown;
}

export interface NotificationDto {
    id: string;
    type: string;
    title: string;
    description: string;
    createdAt: string;
    details: NotificationDetails;
    readAt: string | null;
}

export interface NotificationPageDto {
    items: NotificationDto[];
    totalCount: number;
    unreadCount: number;
    pageNumber: number;
    pageSize: number;
}

export interface NotificationReadEvent {
    notificationId: string;
    readAt: string;
}

export interface NotificationsReadAllEvent {
    notificationIds: string[];
    readAt: string;
}

export interface MarkNotificationAsReadResponse {
    notificationId: string;
    readAt: string;
}

export interface MarkAllNotificationsAsReadResponse {
    notificationIds: string[];
    readAt: string;
}
