export type AuditLog = {
  id: number;
  createdAt: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'activity' | 'money' | 'note' | 'profile' | 'settings';
  entityId: number | null;
  day: string | null;
  payload: string | null; // JSON string
};
