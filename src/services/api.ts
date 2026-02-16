import { API_CONFIG, getHeaders, getUploadHeaders } from "@/config/api";
import { filterEmptyValues } from "@/lib/utils";

// Auth APIs
export const authAPI = {
  // Login - accepts either email or userCode with password and role
  login: async (payload: {
    email?: string;
    userCode?: string;
    password: string;
    role?: string;
  }) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(filterEmptyValues(payload)),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  },

  // Set login password for sales person
  setPassword: async (userCode: string, password: string) => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.SET_PASSWORD}`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(filterEmptyValues({ userCode, password })),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`,
        );
      }

      return data;
    } catch (error: any) {
      throw error;
    }
  },
};

// Dashboard APIs
export const dashboardAPI = {
  // Get dashboard overview counts
  getOverview: async (params?: { salesExecCode?: string; startDate?: string; endDate?: string; sevenDayAgoDate?: string }) => {
    try {
      const queryParams = new URLSearchParams(
        filterEmptyValues(params || {}, true),
      );
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DASHBOARD.OVERVIEW}${
        queryParams.toString() ? `?${queryParams.toString().replace(/%3A/g, ":")}` : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        headers: getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`,
        );
      }

      return data;
    } catch (error: any) {
      throw error;
    }
  },
};

// Sales Person APIs
export const salesPersonAPI = {
  // Get all sales persons with pagination and filters
  getAll: async (params?: {
    page?: number;
    size?: number;
    search?: string;
    role?: string;
    shortBy?: string;
    shortOrder?: string;
  }) => {
    const queryParams = new URLSearchParams(
      filterEmptyValues(params || {}, true),
    );

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SALES_PERSON.LIST}?${queryParams.toString().replace(/%3A/g, ":")}`,
      {
        headers: getHeaders(),
      },
    );
    return response.json();
  },

  // Create new sales person
  create: async (data: any) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SALES_PERSON.LIST}`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(filterEmptyValues(data)),
      },
    );
    return response.json();
  },

  // Update sales person
  update: async (id: string, data: any) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SALES_PERSON.LIST}/${id}`,
      {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(filterEmptyValues(data)),
      },
    );
    return response.json();
  },

  // Get sales person details by ID
  getById: async (id: string) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SALES_PERSON.DETAIL}/${id}`,
      {
        headers: getHeaders(),
      },
    );
    return response.json();
  },

  // Import sales person data
  import: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SALES_PERSON.IMPORT}`,
      {
        method: "POST",
        headers: getUploadHeaders(),
        body: formData,
      },
    );
    return response.json();
  },

  // Delete sales person
  delete: async (id: string) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SALES_PERSON.LIST}/${id}`,
      {
        method: "DELETE",
        headers: getHeaders(),
      },
    );
    return response.json();
  },
};

// Client APIs
export const clientAPI = {
  getAll: async (params?: {
    page?: number;
    size?: number;
    search?: string;
    role?: string;
    salesExecCode?: string;
  }) => {
    const queryParams = new URLSearchParams(
      filterEmptyValues(params || {}, true),
    );

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CLIENT.LIST}?${queryParams.toString().replace(/%3A/g, ":")}`,
      {
        headers: getHeaders(),
      },
    );
    return response.json();
  },

  // Get client details by ID
  getById: async (id: string) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CLIENT.DETAIL}/${id}`,
      {
        headers: getHeaders(),
      },
    );
    return response.json();
  },

  // Create new client
  create: async (data: {
    userCode: string;
    name: string;
    email: string;
    phone: string;
    salesExecCode?: string;
  }) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CLIENT.LIST}`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(filterEmptyValues(data)),
      },
    );
    return response.json();
  },

  // Update client
  update: async (
    id: string,
    data: {
      userCode: string;
      name: string;
      email: string;
      phone: string;
      salesExecCode?: string;
    },
  ) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CLIENT.LIST}/${id}`,
      {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
      },
    );
    return response.json();
  },

  // Import client data
  import: async (file: File) => {
    try {
      if (!file) {
        throw new Error("No file provided");
      }

      if (file.size === 0) {
        throw new Error("File is empty");
      }

      await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as ArrayBuffer;
          if (result && result.byteLength > 0) {
            resolve(result);
          } else {
            reject(new Error("File is empty or unreadable"));
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsArrayBuffer(file);
      });

      // Create FormData with the validated file
      const formData = new FormData();
      formData.append("file", file, file.name);
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CLIENT.IMPORT}`;

      const response = await fetch(url, {
        method: "POST",
        headers: getUploadHeaders(),
        body: formData,
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error(
          `Server returned invalid JSON. Status: ${response.status}`,
        );
      }

      if (!response.ok) {
        let errorMessage =
          result.message ||
          result.error ||
          `HTTP error! status: ${response.status}`;

        if (typeof errorMessage === "object") {
          const msg = errorMessage.message || JSON.stringify(errorMessage);
          errorMessage = errorMessage.rowNo
            ? `Row ${errorMessage.rowNo}: ${msg}`
            : msg;
        }

        throw new Error(errorMessage);
      }

      return result;
    } catch (error: any) {
      throw error;
    }
  },

  // Delete client
  delete: async (id: string) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CLIENT.LIST}/${id}`,
      {
        method: "DELETE",
        headers: getHeaders(),
      },
    );
    return response.json();
  },
};

// Pending Order APIs
export const pendingOrderAPI = {
  // Get all pending orders with pagination
  getAll: async (params?: {
    page?: number;
    size?: number;
    clientCode?: string;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
    startDate?: string;
    endDate?: string;
    salesExecCode?: string;
    todayDueFollowUp?: boolean;
    todayCompletedFollowUp?: boolean;
    sevenDayPendingFollowUp?: boolean;
    assignSalesPersonsTask?: boolean;
  }) => {
    const queryParams = new URLSearchParams(
      filterEmptyValues(params || {}, true),
    );

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PENDING_ORDER.LIST}?${queryParams.toString().replace(/%3A/g, ":")}`,
      {
        headers: getHeaders(),
      },
    );
    return response.json();
  },

  // Create new pending order manually
  create: async (data: {
    salesExecCode: string;
    clientCode: string;
    orderNo: string;
    orderDate: string;
    grossWtTotal: string;
    totalOrderPcs: number;
    pendingPcs: number;
    remark?: string;
    nextFollowUpDate?: string;
    lastFollowUpMsg?: string;
    status?: string;
  }) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PENDING_ORDER.LIST}`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(filterEmptyValues(data)),
      },
    );
    return response.json();
  },

  // Update pending order
  update: async (
    id: string,
    data: {
      salesExecCode?: string;
      clientCode?: string;
      orderNo?: string;
      orderDate?: string;
      grossWtTotal?: string;
      totalOrderPcs?: number;
      pendingPcs?: number;
      remark?: string;
      nextFollowUpDate?: string;
      lastFollowUpMsg?: string;
      status?: string;
    },
  ) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PENDING_ORDER.LIST}/${id}`,
      {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
      },
    );
    return response.json();
  },

  // Get follow-ups by client code
  getFollowUpsByClientCode: async (params: {
    page?: number;
    size?: number;
    clientCode?: string;
    status?: string;
    sortBy?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams = new URLSearchParams(
      filterEmptyValues(params || {}, true),
    );

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PENDING_ORDER.FOLLOW_UP}?${queryParams.toString().replace(/%3A/g, ":")}`,
      {
        headers: getHeaders(),
      },
    );
    return response.json();
  },

  // Add follow-up for pending order
  addFollowUp: async (data: {
    pendingOrderId: string;
    followUpMsg: string;
    nextFollowUpDate: string;
    status?: string;
    remark?: string;
  }) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PENDING_ORDER.ADD_FOLLOW_UP}`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(filterEmptyValues(data)),
      },
    );
    return response.json();
  },

  // Import pending order data
  import: async (file: File) => {
    // Validate file
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PENDING_ORDER.IMPORT}`,
      {
        method: "POST",
        headers: getUploadHeaders(),
        body: formData,
      },
    );
    return response.json();
  },

  // Delete pending order
  delete: async (id: string) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PENDING_ORDER.LIST}/${id}`,
      {
        method: "DELETE",
        headers: getHeaders(),
      },
    );
    return response.json();
  },
};

// Pending Material APIs
export const pendingMaterialAPI = {
  // Get all pending materials with pagination
  getAll: async (params?: {
    page?: number;
    size?: number;
    clientCode?: string;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
    startDate?: string;
    endDate?: string;
    salesExecCode?: string;
    todayDueFollowUp?: boolean;
    todayCompletedFollowUp?: boolean;
    sevenDayPendingFollowUp?: boolean;
    assignSalesPersonsTask?: boolean;
  }) => {
    const queryParams = new URLSearchParams(
      filterEmptyValues(params || {}, true),
    );

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PENDING_MATERIAL.LIST}?${queryParams.toString().replace(/%3A/g, ":")}`,
      {
        headers: getHeaders(),
      },
    );
    return response.json();
  },

  // Create new pending material manually
  create: async (data: {
    salesExecCode: string;
    clientCode: string;
    styleNo: string;
    orderNo: string;
    orderDate?: string;
    lastMovementDate?: string;
    expectedDeliveryDate: string;
    departmentName: string;
    totalNetWt: string;
    nextFollowUpDate?: string;
    lastFollowUpMsg?: string;
    status?: string;
  }) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PENDING_MATERIAL.LIST}`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(filterEmptyValues(data)),
      },
    );
    return response.json();
  },

  // Update pending material
  update: async (
    id: string,
    data: {
      salesExecCode?: string;
      clientCode?: string;
      styleNo?: string;
      orderNo?: string;
      expectedDeliveryDate?: string;
      departmentName?: string;
      totalNetWt?: string;
      nextFollowUpDate?: string;
      lastFollowUpMsg?: string;
      status?: string;
      remark?: string;
    },
  ) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PENDING_MATERIAL.LIST}/${id}`,
      {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(filterEmptyValues(data)),
      },
    );
    return response.json();
  },

  // Get follow-ups by client code
  getFollowUpsByClientCode: async (params: {
    page?: number;
    size?: number;
    clientCode?: string;
    status?: string;
    sortBy?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams = new URLSearchParams(
      filterEmptyValues(params || {}, true),
    );

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PENDING_MATERIAL.FOLLOW_UP}?${queryParams.toString().replace(/%3A/g, ":")}`,
      {
        headers: getHeaders(),
      },
    );
    return response.json();
  },

  // Add follow-up for pending material
  addFollowUp: async (data: {
    pendingMaterialRecordId: string;
    followUpMsg: string;
    nextFollowUpDate: string;
    status: string;
    remark?: string;
  }) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PENDING_MATERIAL.ADD_FOLLOW_UP}`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(filterEmptyValues(data)),
      },
    );
    return response.json();
  },

  // Import pending material data
  import: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PENDING_MATERIAL.IMPORT}`,
      {
        method: "POST",
        headers: getUploadHeaders(),
        body: formData,
      },
    );
    return response.json();
  },

  // Delete pending material
  delete: async (id: string) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PENDING_MATERIAL.LIST}/${id}`,
      {
        method: "DELETE",
        headers: getHeaders(),
      },
    );
    return response.json();
  },
};

// New Order APIs
export const newOrderAPI = {
  // Get all new orders with pagination
  getAll: async (params?: {
    page?: number;
    size?: number;
    clientCode?: string;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
    searchClientCode?: string;
    searchClientName?: string;
    searchRemark?: string;
    startDate?: string;
    endDate?: string;
    salesExecCode?: string;
    todayDueFollowUp?: boolean;
    todayCompletedFollowUp?: boolean;
    sevenDayPendingFollowUp?: boolean;
    assignSalesPersonsTask?: boolean;
  }) => {
    const queryParams = new URLSearchParams(
      filterEmptyValues(params || {}, true),
    );

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NEW_ORDER.LIST}?${queryParams.toString().replace(/%3A/g, ":")}`,
      {
        headers: getHeaders(),
      },
    );
    return response.json();
  },

  // Create new order manually
  create: async (data: {
    salesExecCode: string;
    clientCode: string;
    subCategory: string;
    lastSaleDate: string;
    lastOrderDate: string;
    clientCategoryName: string;
    nextFollowUpDate: string;
    status?: string;
    remark?: string;
  }) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NEW_ORDER.LIST}`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(filterEmptyValues(data)),
      },
    );
    return response.json();
  },

  // Update new order
  update: async (
    id: string,
    data: {
      salesExecCode?: string;
      clientCode?: string;
      subCategory?: string;
      lastSaleDate?: string;
      lastOrderDate?: string;
      clientCategoryName?: string;
      nextFollowUpDate?: string;
      status?: string;
      lastFollowUpMsg?: string;
      remark?: string;
    },
  ) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NEW_ORDER.LIST}/${id}`,
      {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(filterEmptyValues(data)),
      },
    );
    return response.json();
  },

  // Get follow-ups by client code
  getFollowUpsByClientCode: async (params: {
    page?: number;
    size?: number;
    clientCode?: string;
    status?: string;
    sortBy?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams = new URLSearchParams(
      filterEmptyValues(params || {}, true),
    );

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NEW_ORDER.FOLLOW_UP}?${queryParams.toString().replace(/%3A/g, ":")}`,
      {
        headers: getHeaders(),
      },
    );
    return response.json();
  },

  // Add follow-up
  addFollowUp: async (data: {
    newOrderRecordId: string;
    followUpMsg: string;
    nextFollowUpDate: string;
    status: string;
    remark?: string;
  }) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NEW_ORDER.ADD_FOLLOW_UP}`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(filterEmptyValues(data)),
      },
    );
    return response.json();
  },

  // Import new order data
  import: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NEW_ORDER.IMPORT}`,
      {
        method: "POST",
        headers: getUploadHeaders(),
        body: formData,
      },
    );
    return response.json();
  },

  // Delete new order
  delete: async (id: string) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NEW_ORDER.LIST}/${id}`,
      {
        method: "DELETE",
        headers: getHeaders(),
      },
    );
    return response.json();
  },
};

// Cad Order APIs
export const cadOrderAPI = {
  // Get all cad orders with pagination
  getAll: async (params?: {
    page?: number;
    size?: number;
    clientCode?: string;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
    startDate?: string;
    endDate?: string;
    salesExecCode?: string;
  }) => {
    const queryParams = new URLSearchParams(
      filterEmptyValues(params || {}, true),
    );

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CAD_ORDER.LIST}?${queryParams}`,
      { headers: getHeaders() },
    );
    return response.json();
  },

  // Import cad order data
  import: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CAD_ORDER.IMPORT}`,
      {
        method: "POST",
        headers: getUploadHeaders(),
        body: formData,
      },
    );
    return response.json();
  },

  // Add follow-up for cad order
  addFollowUp: async (data: {
    cadOrderRecordId: string;
    followUpMsg: string;
    nextFollowUpDate: string;
    status: string;
  }) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CAD_ORDER.ADD_FOLLOW_UP}`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(filterEmptyValues(data)),
      },
    );
    return response.json();
  },

  // Delete cad order
  delete: async (id: string) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CAD_ORDER.LIST}/${id}`,
      {
        method: "DELETE",
        headers: getHeaders(),
      },
    );
    return response.json();
  },
};

export const remarkAPI = {
  getAll: async (params?: {
    page?: number;
    size?: number;
    followUpTypeId?: string | null;
  }) => {
    const queryParams = new URLSearchParams(filterEmptyValues(params || {}));

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REMARK.LIST}?${queryParams}`,
      {
        headers: getHeaders(),
      },
    );
    return response.json();
  },
  createBulk: async (data: {
    remarks: Array<{
      remarkMsg: string;
      salesExecCode: string;
      clientCode: string;
      entityType:
        | "pendingOrders"
        | "pendingMaterials"
        | "newOrders"
        | "cadOrders";
      entityId: string;
    }>;
  }) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REMARK.LIST}`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      },
    );
    return response.json();
  },
  getByFollowUpTypeId: async (params: {
    followUpTypeId: string;
    page?: number;
    size?: number;
  }) => {
    const queryParams = new URLSearchParams(filterEmptyValues(params || {}));

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REMARK.LIST}?${queryParams}`,
      {
        headers: getHeaders(),
      },
    );
    return response.json();
  },
};

export const sharedAPI = {
  updateStatus: async (data: {
    entityType: "pendingOrders" | "pendingMaterials" | "newOrders";
    status: "pending" | "completed";
    ids: string[];
  }) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SHARED.STATUS}`,
      {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
      },
    );
    return response.json();
  },
  deleteMultiple: async (data: {
    entityType:
      | "pendingOrders"
      | "pendingMaterials"
      | "newOrders"
      | "cadOrders";
    ids: string[];
  }) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SHARED.DELETE_MULTIPLE}`,
      {
        method: "DELETE",
        headers: getHeaders(),
        body: JSON.stringify(data),
      },
    );
    return response.json();
  },
  deleteMultipleUsers: async (data: {
    userType: "sales_executive" | "client";
    ids: string[];
  }) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SHARED.DELETE_MULTIPLE_USER}`,
      {
        method: "DELETE",
        headers: getHeaders(),
        body: JSON.stringify(data),
      },
    );
    return response.json();
  },
  assignSalesperson: async (data: {
    entityType?: string;
    salesPersonId: string;
    assignSalesPersonIds: string[];
  }) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SHARED.ASSIGN_SALESPERSON}`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      },
    );
    return response.json();
  },
  getAssignSalespersons: async (params: { entityType: string }) => {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SHARED.ASSIGN_SALESPERSON}?${queryParams.toString()}`,
      {
        method: "GET",
        headers: getHeaders(),
      },
    );
    return response.json();
  },
  removeAssignSalesperson: async (data: {
    salesPersonId: string;
    assignSalesPersonId: string;
  }) => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SHARED.ASSIGN_SALESPERSON}/remove`,
      {
        method: "DELETE",
        headers: getHeaders(),
        body: JSON.stringify(data),
      },
    );
    return response.json();
  },
};
