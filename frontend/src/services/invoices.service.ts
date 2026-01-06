import api from './api';

export interface CreateFeeInvoiceData {
  studentId: number;
  academicYearId: number;
  issueDate: string;
  dueDate: string;
  type: 'monthly' | 'quarterly' | 'yearly' | 'one_time';
  items: CreateFeeInvoiceItemData[];
  notes?: string;
}

export interface CreateFeeInvoiceItemData {
  sourceType?: 'FEE' | 'TRANSPORT' | 'HOSTEL' | 'FINE' | 'MISC';
  sourceId?: number;
  sourceMetadata?: string;
  description: string;
  amount: number;
  discountAmount?: number;
  dueDate?: string;
  notes?: string;
}

export interface FeeInvoice {
  id: number;
  studentId: number;
  schoolId: number;
  academicYearId: number;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  type: string;
  status: 'draft' | 'unpaid' | 'partially_paid' | 'paid' | 'cancelled';
  totalAmount: number;
  paidAmount: number;
  discountAmount: number;
  balanceAmount: number;
  items?: any[];
  payments?: any[];
}

class InvoicesService {
  /**
   * Create a new invoice
   * @param data - Invoice data
   * @param schoolId - Optional school ID (will be obtained from context if not provided)
   */
  async create(data: CreateFeeInvoiceData, schoolId?: number): Promise<FeeInvoice> {
    const response = await api.instance.post('/invoices', data, {
      params: schoolId ? { schoolId } : undefined,
    });
    return response.data;
  }

  /**
   * Finalize an invoice (creates accounting entries)
   * @param invoiceId - Invoice ID
   * @param schoolId - Optional school ID (will be obtained from context if not provided)
   */
  async finalize(invoiceId: number, schoolId?: number): Promise<FeeInvoice> {
    const response = await api.instance.post(`/invoices/${invoiceId}/finalize`, {}, {
      params: schoolId ? { schoolId } : undefined,
    });
    return response.data;
  }

  /**
   * Get all invoices
   * @param params - Query parameters including optional schoolId
   */
  async getAll(params: { studentId?: number; academicYearId?: number; schoolId?: number } = {}) {
    const response = await api.instance.get('/invoices', { params });
    return response.data;
  }

  /**
   * Get invoice by ID
   * @param id - Invoice ID
   * @param schoolId - Optional school ID (will be obtained from context if not provided)
   */
  async getById(id: number, schoolId?: number): Promise<FeeInvoice> {
    const response = await api.instance.get(`/invoices/${id}`, {
      params: schoolId ? { schoolId } : undefined,
    });
    return response.data;
  }

  /**
   * Add fee item to invoice
   * Note: schoolId is automatically obtained from the authenticated user's context
   */
  async addFeeItem(
    invoiceId: number,
    data: {
      feeStructureId: number;
      description: string;
      amount: number;
      discountAmount?: number;
      dueDate?: string;
      notes?: string;
      sourceMetadata?: string;
    }
  ) {
    const response = await api.instance.post(`/invoices/${invoiceId}/items/fee`, data);
    return response.data;
  }

  /**
   * Add transport item to invoice
   * Note: schoolId is automatically obtained from the authenticated user's context
   */
  async addTransportItem(
    invoiceId: number,
    data: {
      routePriceId: number;
      description: string;
      amount: number;
      discountAmount?: number;
      dueDate?: string;
      notes?: string;
      sourceMetadata?: string;
    }
  ) {
    const response = await api.instance.post(`/invoices/${invoiceId}/items/transport`, data);
    return response.data;
  }

  /**
   * Add hostel item to invoice
   * Note: schoolId is automatically obtained from the authenticated user's context
   */
  async addHostelItem(
    invoiceId: number,
    data: {
      hostelPlanId: number;
      description: string;
      amount: number;
      discountAmount?: number;
      dueDate?: string;
      notes?: string;
      sourceMetadata?: string;
    }
  ) {
    const response = await api.instance.post(`/invoices/${invoiceId}/items/hostel`, data);
    return response.data;
  }

  /**
   * Add fine to invoice
   * Note: schoolId is automatically obtained from the authenticated user's context
   */
  async addFineItem(
    invoiceId: number,
    data: {
      fineId: number;
      description: string;
      amount: number;
      discountAmount?: number;
      dueDate?: string;
      notes?: string;
      sourceMetadata?: string;
    }
  ) {
    const response = await api.instance.post(`/invoices/${invoiceId}/items/fine`, data);
    return response.data;
  }

  /**
   * Add miscellaneous item to invoice
   * Note: schoolId is automatically obtained from the authenticated user's context
   */
  async addMiscItem(
    invoiceId: number,
    data: {
      description: string;
      amount: number;
      discountAmount?: number;
      dueDate?: string;
      notes?: string;
      sourceMetadata?: string;
    }
  ) {
    const response = await api.instance.post(`/invoices/${invoiceId}/items/misc`, data);
    return response.data;
  }

  /**
   * Recalculate invoice totals
   * Note: schoolId is automatically obtained from the authenticated user's context
   */
  async recalculateTotals(invoiceId: number) {
    const response = await api.instance.post(`/invoices/${invoiceId}/recalculate`);
    return response.data;
  }
}

export const invoicesService = new InvoicesService();
export default invoicesService;
