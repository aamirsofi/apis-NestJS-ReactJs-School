import api from './api';
import { extractArrayData, extractApiData } from '@/utils/apiHelpers';

export interface Account {
  id: number;
  schoolId: number;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  subtype?: string;
  description?: string;
  isActive: boolean;
  isSystemAccount: boolean;
  parentAccountId?: number;
  openingBalance: number;
  openingBalanceDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntryLine {
  id: number;
  journalEntryId: number;
  accountId: number;
  debitAmount: number;
  creditAmount: number;
  description?: string;
  account?: Account;
}

export interface JournalEntry {
  id: number;
  schoolId: number;
  entryNumber: string;
  entryDate: string;
  type: 'invoice' | 'payment' | 'advance_payment' | 'advance_adjustment' | 'refund' | 'adjustment' | 'opening_balance' | 'transfer';
  status: 'draft' | 'posted' | 'reversed';
  description: string;
  reference?: string;
  referenceId?: number;
  totalDebit: number;
  totalCredit: number;
  postedById?: number;
  postedAt?: string;
  reversedById?: number;
  reversedAt?: string;
  reversedEntryId?: number;
  notes?: string;
  lines?: JournalEntryLine[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountData {
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  subtype?: string;
  description?: string;
  isActive?: boolean;
  parentAccountId?: number;
  openingBalance?: number;
  openingBalanceDate?: string;
}

export interface CreateJournalEntryData {
  entryDate: string;
  type: JournalEntry['type'];
  description: string;
  reference?: string;
  referenceId?: number;
  lines: {
    accountId: number;
    debitAmount: number;
    creditAmount: number;
    description?: string;
  }[];
  notes?: string;
}

export interface AccountBalance {
  debit: number;
  credit: number;
  balance: number;
}

export const accountingService = {
  // Accounts
  async getAccounts(type?: string, schoolId?: number): Promise<Account[]> {
    const params: any = {};
    if (type) params.type = type;
    if (schoolId) params.schoolId = schoolId;
    const response = await api.instance.get<Account[]>('/accounting/accounts', { params });
    return extractArrayData<Account>(response) || response.data || [];
  },

  async getAccountById(id: number): Promise<Account> {
    const response = await api.instance.get<Account>(`/accounting/accounts/${id}`);
    return extractApiData<Account>(response) || response.data;
  },

  async createAccount(data: CreateAccountData): Promise<Account> {
    const response = await api.instance.post<Account>('/accounting/accounts', data);
    return extractApiData<Account>(response) || response.data;
  },

  async updateAccount(id: number, data: Partial<CreateAccountData>): Promise<Account> {
    const response = await api.instance.put<Account>(`/accounting/accounts/${id}`, data);
    return extractApiData<Account>(response) || response.data;
  },

  async deleteAccount(id: number): Promise<void> {
    await api.instance.delete(`/accounting/accounts/${id}`);
  },

  async initializeDefaultAccounts(schoolId?: number): Promise<Account[]> {
    const params: any = {};
    if (schoolId) params.schoolId = schoolId;
    const response = await api.instance.post<Account[]>('/accounting/accounts/initialize', {}, { params });
    return extractArrayData<Account>(response) || response.data || [];
  },

  // Journal Entries
  async createJournalEntry(data: CreateJournalEntryData): Promise<JournalEntry> {
    const response = await api.instance.post<JournalEntry>('/accounting/journal-entries', data);
    return extractApiData<JournalEntry>(response) || response.data;
  },

  async postJournalEntry(id: number): Promise<JournalEntry> {
    const response = await api.instance.post<JournalEntry>(`/accounting/journal-entries/${id}/post`);
    return extractApiData<JournalEntry>(response) || response.data;
  },

  async reverseJournalEntry(id: number, reason?: string): Promise<JournalEntry> {
    const response = await api.instance.post<JournalEntry>(`/accounting/journal-entries/${id}/reverse`, { reason });
    return extractApiData<JournalEntry>(response) || response.data;
  },

  // Account Balance & Ledger
  async getAccountBalance(id: number, asOfDate?: string): Promise<AccountBalance> {
    const params: any = {};
    if (asOfDate) params.asOfDate = asOfDate;
    const response = await api.instance.get<AccountBalance>(`/accounting/accounts/${id}/balance`, { params });
    return response.data;
  },

  async getAccountLedger(id: number, fromDate?: string, toDate?: string): Promise<JournalEntryLine[]> {
    const params: any = {};
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    const response = await api.instance.get<JournalEntryLine[]>(`/accounting/accounts/${id}/ledger`, { params });
    return extractArrayData<JournalEntryLine>(response) || response.data || [];
  },
};

