export interface Client {
  uuid: string;
  userCode: string;
  salesExecCode?: string;
  name: string;
  city?: string;
  role: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  pendingMaterial?: FollowUpSummary;
  pendingOrder?: FollowUpSummary;
  newOrder?: FollowUpSummary;
  status?: string;
}

export interface FollowUpSummary {
  uuid: string;
  clientCode: string;
  status: string;
  nextFollowUpDate: string;
  lastFollowUpDate: string;
  lastFollowUpMsg: string;
}

export interface ClientFilters {
  search?: string;
  salesExecCode?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export interface ClientListResponse {
  data: Client[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}
