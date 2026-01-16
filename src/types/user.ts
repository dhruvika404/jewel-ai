export interface User {
  uuid: string;
  userCode: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'sales_executive';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
  };
}

export interface SalesPerson {
  uuid: string;
  userCode: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
