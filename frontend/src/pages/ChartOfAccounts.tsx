import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { accountingService, Account } from '../services/accounting.service';
import { useSchool } from '../contexts/SchoolContext';
import { FiPlus, FiEdit, FiTrash2, FiDollarSign } from 'react-icons/fi';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/DataTable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { getErrorMessage } from '@/utils/errorHandling';

const accountTypeColors: Record<string, string> = {
  asset: 'bg-blue-500',
  liability: 'bg-red-500',
  equity: 'bg-purple-500',
  income: 'bg-green-500',
  expense: 'bg-orange-500',
};

export default function ChartOfAccounts() {
  const { selectedSchoolId } = useSchool();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInitDialog, setShowInitDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts', selectedSchoolId, typeFilter],
    queryFn: () =>
      accountingService.getAccounts(
        typeFilter === 'all' ? undefined : typeFilter,
        selectedSchoolId ? Number(selectedSchoolId) : undefined,
      ),
    enabled: !!selectedSchoolId,
  });

  const initMutation = useMutation({
    mutationFn: () =>
      accountingService.initializeDefaultAccounts(
        selectedSchoolId ? Number(selectedSchoolId) : undefined,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setShowInitDialog(false);
    },
  });

  const columns: ColumnDef<Account>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => <span className="font-mono">{row.original.code}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Account Name',
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.original.type;
        return (
          <Badge className={accountTypeColors[type] || 'bg-gray-500'}>
            {type.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'subtype',
      header: 'Subtype',
      cell: ({ row }) => row.original.subtype?.replace('_', ' ') || '-',
    },
    {
      accessorKey: 'openingBalance',
      header: 'Opening Balance',
      cell: ({ row }) => `₹${row.original.openingBalance.toLocaleString()}`,
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={row.original.isActive ? 'bg-green-500' : 'bg-gray-400'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedAccount(row.original);
              setShowCreateDialog(true);
            }}
          >
            <FiEdit className="h-4 w-4" />
          </Button>
          {!row.original.isSystemAccount && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Handle delete
              }}
            >
              <FiTrash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Chart of Accounts</h1>
            <p className="text-gray-600 mt-1">Manage accounting accounts</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowInitDialog(true)}>
              Initialize Default Accounts
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <FiPlus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Accounts</CardTitle>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="asset">Assets</SelectItem>
                  <SelectItem value="liability">Liabilities</SelectItem>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expenses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedSchoolId ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Please select a school to view accounts.</p>
              </div>
            ) : isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <DataTable columns={columns} data={accounts} />
            )}
          </CardContent>
        </Card>

        <Dialog open={showInitDialog} onOpenChange={setShowInitDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Initialize Default Accounts</DialogTitle>
              <DialogDescription>
                This will create the default chart of accounts for your school. This includes Cash, Bank, Fees Receivable, Advance Fees, and Income accounts.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInitDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => initMutation.mutate()}
                disabled={initMutation.isPending}
              >
                {initMutation.isPending ? 'Initializing...' : 'Initialize'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedAccount ? 'Edit Account' : 'Create Account'}
              </DialogTitle>
              <DialogDescription>
                {selectedAccount
                  ? 'Update account information'
                  : 'Add a new account to the chart of accounts'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Account Code *</Label>
                  <Input placeholder="e.g., 1001" />
                </div>
                <div>
                  <Label>Account Name *</Label>
                  <Input placeholder="e.g., Cash" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Account Type *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asset">Asset</SelectItem>
                      <SelectItem value="liability">Liability</SelectItem>
                      <SelectItem value="equity">Equity</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Opening Balance</Label>
                  <Input type="number" step="0.01" placeholder="0.00" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

