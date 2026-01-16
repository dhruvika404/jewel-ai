export type FollowupType = 'new-order' | 'pending-order' | 'pending-material';

export type FollowupStatus = 'pending' | 'completed' | 'cancelled' | 'rescheduled';

export interface BaseFollowup {
  id: string;
  userCode: string;
  name: string;
  salesExecutive: string;
  status: string;
  nextFollowupDate?: string;
  remark?: string;
  type: FollowupType;
}

export interface NewOrderFollowup extends BaseFollowup {
  type: 'new-order';
  lastOrderDate: string;
  noOrderSince: number;
}

export interface PendingOrderFollowup extends BaseFollowup {
  type: 'pending-order';
  orderNo: string;
  totalOrderPcs: number;
  pendingPcs: number;
  orderDate: string;
  pendingSince: number;
}

export interface PendingMaterialFollowup extends BaseFollowup {
  type: 'pending-material';
  pendingFor: string;
  pendingSinceDays: number;
  styleNo: string;
  orderNo: string;
  orderDate: string;
  expectedDeliveryDate: string;
  departmentName: string;
  totalNetWt: string;
  lastFollowUpDate: string | null;
  lastFollowUpMsg: string;
}

export type FollowupRecord = NewOrderFollowup | PendingOrderFollowup | PendingMaterialFollowup;

export interface FollowupFilters {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
  salesExecCode?: string;
  clientCode?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  startDate?: string;
  endDate?: string;
  todayDueFollowUp?: boolean;
  todayCompletedFollowUp?: boolean;
  sevenDayPendingFollowUp?: boolean;
}
