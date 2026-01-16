export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  
  // Admin routes
  ADMIN: '/admin',
  ADMIN_CLIENTS: '/admin/clients',
  ADMIN_CLIENT_DETAILS: '/admin/clients/:id',
  ADMIN_SALES_PERSONS: '/admin/sales-persons',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_FOLLOWUPS: '/admin/followups',
  ADMIN_FOLLOWUPS_TYPE: '/admin/followups/:type',
  
  // Sales routes
  SALES: '/sales',
  SALES_CLIENTS: '/sales/clients',
  SALES_CLIENT_DETAILS: '/sales/clients/:id',
  SALES_REPORTS: '/sales/reports',
  SALES_FOLLOWUPS: '/sales/followups',
  SALES_FOLLOWUPS_TYPE: '/sales/followups/:type',
} as const;

export const FOLLOWUP_TYPES = {
  NEW_ORDER: 'new-order',
  PENDING_ORDER: 'pending-order',
  PENDING_MATERIAL: 'pending-material',
  CAD_ORDER: 'cad-order',
} as const;

// Helper functions
export const getClientDetailRoute = (id: string, role: 'admin' | 'sales_executive') => {
  const base = role === 'admin' ? ROUTES.ADMIN_CLIENT_DETAILS : ROUTES.SALES_CLIENT_DETAILS;
  return base.replace(':id', id);
};

export const getFollowupRoute = (type: string, role: 'admin' | 'sales_executive') => {
  const base = role === 'admin' ? ROUTES.ADMIN_FOLLOWUPS_TYPE : ROUTES.SALES_FOLLOWUPS_TYPE;
  return base.replace(':type', type);
};
