import { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '../components/Layout';
import { feeStructuresService } from '../services/feeStructures.service';
import { feeCategoriesService } from '../services/feeCategories.service';
import { FeeStructure, FeeCategory } from '../types';
import { FiPlus, FiEdit2, FiTrash2, FiDollarSign } from 'react-icons/fi';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/DataTable';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';

export default function FeeStructures() {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);
  const [formData, setFormData] = useState<Partial<FeeStructure>>({
    name: '',
    description: '',
    amount: 0,
    categoryId: 0,
    academicYear: '',
    dueDate: '',
    applicableClasses: [],
    status: 'active',
  });

  useEffect(() => {
    loadData();
  }, []);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const loadData = async () => {
    try {
      setError('');
      const [structures, cats] = await Promise.all([
        feeStructuresService.getAll(),
        feeCategoriesService.getAll(),
      ]);
      setFeeStructures(structures);
      setCategories(cats);
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data && typeof err.response.data.message === 'string'
        ? err.response.data.message
        : 'Failed to load data';
      setError(errorMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      if (editingStructure) {
        await feeStructuresService.update(editingStructure.id, formData);
        setSuccess('Fee structure updated successfully');
      } else {
        await feeStructuresService.create(formData);
        setSuccess('Fee structure created successfully');
      }
      setShowDialog(false);
      setEditingStructure(null);
      resetForm();
      loadData();
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data && typeof err.response.data.message === 'string'
        ? err.response.data.message
        : 'Failed to save fee structure';
      setError(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      amount: 0,
      categoryId: 0,
      academicYear: '',
      dueDate: '',
      applicableClasses: [],
      status: 'active',
    });
  };

  const handleEdit = (structure: FeeStructure) => {
    setEditingStructure(structure);
    setFormData({
      name: structure.name,
      description: structure.description,
      amount: structure.amount,
      categoryId: structure.categoryId,
      academicYear: structure.academicYear,
      dueDate: structure.dueDate,
      applicableClasses: structure.applicableClasses,
      status: structure.status,
    });
    setShowDialog(true);
  };

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Are you sure you want to delete this fee structure?')) return;
    try {
      await feeStructuresService.delete(id);
      setSuccess('Fee structure deleted successfully');
      loadData();
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data && typeof err.response.data.message === 'string'
        ? err.response.data.message
        : 'Failed to delete fee structure';
      setError(errorMessage);
    }
  }, []);

  const columns: ColumnDef<FeeStructure>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 lg:px-3"
            >
              Fee Structure
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const structure = row.original;
          return (
            <div>
              <div className="text-sm font-semibold text-gray-900">{structure.name}</div>
              {structure.description && (
                <div className="text-sm text-gray-500 mt-1">{structure.description}</div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 lg:px-3"
            >
              Amount
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const amount = row.getValue('amount') as number;
          return (
            <div className="flex items-center text-sm font-semibold text-gray-900">
              <FiDollarSign className="w-4 h-4 mr-1 text-indigo-500" />
              ${amount.toLocaleString()}
            </div>
          );
        },
      },
      {
        accessorKey: 'academicYear',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 lg:px-3"
            >
              Academic Year
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          return <div className="text-sm text-gray-900">{row.getValue('academicYear') || '-'}</div>;
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 lg:px-3"
            >
              Status
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const status = row.getValue('status') as string;
          return (
            <Badge
              variant={status === 'active' ? 'default' : 'secondary'}
              className={
                status === 'active'
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0'
                  : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0'
              }
            >
              {status}
            </Badge>
          );
        },
        filterConfig: {
          column: 'status',
          title: 'Status',
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
          ],
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const structure = row.original;
          return (
            <div className="flex items-center justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(structure)}
                className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
                title="Edit"
              >
                <FiEdit2 className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(structure.id)}
                className="text-red-600 hover:text-red-900 hover:bg-red-50"
                title="Delete"
              >
                <FiTrash2 className="w-5 h-5" />
              </Button>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [handleDelete]
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Fee Structures</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                  Fee Structures
                </CardTitle>
                <CardDescription className="mt-1">
                  Manage fee structures and pricing
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingStructure(null);
                  resetForm();
                  setShowDialog(true);
                }}
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
              >
                <FiPlus className="w-5 h-5 mr-2" />
                Add Fee Structure
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Success Alert */}
        {success && (
          <Card className="border-l-4 border-l-green-400 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Alert */}
        {error && (
          <Card className="border-l-4 border-l-red-400 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* DataTable */}
        <Card>
          <CardContent className="pt-6">
            <DataTable
              columns={columns}
              data={feeStructures}
              searchKey="name"
              searchPlaceholder="Search fee structures..."
              enableRowSelection={false}
              exportFileName="fee-structures"
              exportTitle="Fee Structures List"
              enableExport={true}
            />
          </CardContent>
        </Card>

        {/* Dialog */}
        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) {
            setEditingStructure(null);
            resetForm();
          }
        }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingStructure ? 'Edit Fee Structure' : 'Add Fee Structure'}</DialogTitle>
              <DialogDescription>
                {editingStructure ? 'Update fee structure information' : 'Create a new fee structure'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                <Input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Tuition Fee"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Fee description..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Amount *</label>
                <Input
                  type="number"
                  required
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                <Select
                  value={formData.categoryId?.toString() || '0'}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Select Category</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Academic Year *</label>
                <Input
                  type="text"
                  required
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  placeholder="2024-2025"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDialog(false);
                    setEditingStructure(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
                >
                  {editingStructure ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
