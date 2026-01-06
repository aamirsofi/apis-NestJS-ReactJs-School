import api from './api';
import { extractArrayData } from '@/utils/apiHelpers';

export interface TrialBalanceItem {
  accountCode: string;
  accountName: string;
  accountType: string;
  openingBalance: number;
  debit: number;
  credit: number;
  balance: number;
}

export interface ProfitAndLoss {
  period: {
    from: string;
    to: string;
  };
  income: {
    items: Array<{
      accountCode: string;
      accountName: string;
      amount: number;
    }>;
    total: number;
  };
  expenses: {
    items: Array<{
      accountCode: string;
      accountName: string;
      amount: number;
    }>;
    total: number;
  };
  netProfit: number;
}

export interface BalanceSheet {
  asOfDate: string;
  assets: {
    items: Array<{
      accountCode: string;
      accountName: string;
      balance: number;
    }>;
    total: number;
  };
  liabilities: {
    items: Array<{
      accountCode: string;
      accountName: string;
      balance: number;
    }>;
    total: number;
  };
  equity: {
    items: Array<{
      accountCode: string;
      accountName: string;
      balance: number;
    }>;
    total: number;
  };
  total: number;
  balance: number;
}

export interface FeeCollectionSummary {
  period: {
    from?: string;
    to?: string;
  };
  totalAmount: number;
  totalCount: number;
  byMethod: Record<string, {
    count: number;
    amount: number;
  }>;
}

export interface OutstandingDue {
  invoiceId: number;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  academicYear: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate: string;
  status: string;
}

export const reportsService = {
  async getTrialBalance(asOfDate?: string): Promise<TrialBalanceItem[]> {
    const params: any = {};
    if (asOfDate) params.asOfDate = asOfDate;
    const response = await api.instance.get<TrialBalanceItem[]>('/reports/trial-balance', { params });
    return extractArrayData<TrialBalanceItem>(response) || response.data || [];
  },

  async getProfitAndLoss(fromDate: string, toDate: string): Promise<ProfitAndLoss> {
    const response = await api.instance.get<ProfitAndLoss>('/reports/profit-loss', {
      params: { fromDate, toDate },
    });
    return response.data;
  },

  async getBalanceSheet(asOfDate: string): Promise<BalanceSheet> {
    const response = await api.instance.get<BalanceSheet>('/reports/balance-sheet', {
      params: { asOfDate },
    });
    return response.data;
  },

  async getFeeCollectionSummary(fromDate?: string, toDate?: string): Promise<FeeCollectionSummary> {
    const params: any = {};
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    const response = await api.instance.get<FeeCollectionSummary>('/reports/fee-collection', { params });
    return response.data;
  },

  async getOutstandingDues(): Promise<OutstandingDue[]> {
    const response = await api.instance.get<OutstandingDue[]>('/reports/outstanding-dues');
    return extractArrayData<OutstandingDue>(response) || response.data || [];
  },
};

