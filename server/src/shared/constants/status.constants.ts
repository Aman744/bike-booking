export const PERMISSIONS = {
  BOOKING_READ: 'booking.read',
  BOOKING_CREATE: 'booking.create',
  BOOKING_UPDATE: 'booking.update',
  BOOKING_DELETE: 'booking.delete',
  BIKE_READ: 'bike.read',
  BIKE_CREATE: 'bike.create',
  BIKE_UPDATE: 'bike.update',
  BIKE_DELETE: 'bike.delete',
  SETTINGS_READ: 'settings.read',
  SETTINGS_UPDATE: 'settings.update',
  AUDIT_READ: 'audit.read',
} as const;

export const ROLES = {
  SUPER_ADMIN: 'SuperAdmin',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  VIEWER: 'Viewer',
} as const;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: [
    PERMISSIONS.BOOKING_READ,
    PERMISSIONS.BOOKING_CREATE,
    PERMISSIONS.BOOKING_UPDATE,
    PERMISSIONS.BIKE_READ,
    PERMISSIONS.BIKE_CREATE,
    PERMISSIONS.BIKE_UPDATE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.AUDIT_READ,
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.BOOKING_READ,
    PERMISSIONS.BOOKING_UPDATE,
    PERMISSIONS.BIKE_READ,
    PERMISSIONS.BIKE_UPDATE,
    PERMISSIONS.SETTINGS_READ,
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.BOOKING_READ,
    PERMISSIONS.BIKE_READ,
    PERMISSIONS.SETTINGS_READ,
  ],
};

export const SOCKET_EVENTS = {
  BOOKING_CREATED: 'booking.created',
  BOOKING_UPDATED: 'booking.updated',
  BIKE_UPDATED: 'bike.updated',
  DASHBOARD_UPDATED: 'dashboard.updated',
  NOTIFICATION_CREATED: 'notification.created',
} as const;
