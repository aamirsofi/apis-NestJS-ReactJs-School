import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { invoicesService, CreateFeeInvoiceData } from '../services/invoices.service';
import { studentsService } from '../services/students.service';
import { academicYearsService } from '../services/academicYears.service';
import { feeStructuresService } from '../services/feeStructures.service';
import { useSchool } from '../contexts/SchoolContext';
import { FiPlus, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getErrorMessage } from '@/utils/errorHandling';

interface InvoiceItem {
  feeStructureId?: number;
  description: string;
  amount: string;
  discountAmount: string;
  dueDate: string;
  notes: string;
}

export default function CreateInvoice() {
  const { selectedSchoolId } = useSchool();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    studentId: '',
    academicYearId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    type: 'monthly' as 'monthly' | 'quarterly' | 'yearly' | 'one_time',
    notes: '',
  });
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', amount: '', discountAmount: '0', dueDate: '', notes: '' },
  ]);
  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const { data: academicYears = [] } = useQuery({
    queryKey: ['academicYears', selectedSchoolId],
    queryFn: () => academicYearsService.getAll(selectedSchoolId as number),
    enabled: !!selectedSchoolId,
  });

  const { data: currentAcademicYear } = useQuery({
    queryKey: ['currentAcademicYear', selectedSchoolId],
    queryFn: () => academicYearsService.getCurrent(selectedSchoolId as number),
    enabled: !!selectedSchoolId,
  });

  // Auto-select current academic year when it's loaded
  useEffect(() => {
    if (currentAcademicYear && !formData.academicYearId) {
      setFormData((prev) => ({
        ...prev,
        academicYearId: currentAcademicYear.id.toString(),
      }));
    }
  }, [currentAcademicYear]);

  const { data: feeStructures = [] } = useQuery({
    queryKey: ['feeStructures', selectedSchoolId],
    queryFn: () => feeStructuresService.getAll(selectedSchoolId as number),
    enabled: !!selectedSchoolId,
  });

  useEffect(() => {
    if (studentSearch.length >= 2) {
      studentsService
        .search(selectedSchoolId as number, studentSearch)
        .then((results) => setStudents(results))
        .catch(() => setStudents([]));
    } else {
      setStudents([]);
    }
  }, [studentSearch, selectedSchoolId]);

  const createMutation = useMutation({
    mutationFn: (data: CreateFeeInvoiceData) => invoicesService.create(data, selectedSchoolId as number),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      navigate(`/invoices/${invoice.id}`);
    },
  });

  const addItem = () => {
    setItems([...items, { description: '', amount: '', discountAmount: '0', dueDate: '', notes: '' }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.studentId || !formData.academicYearId || !formData.dueDate) {
      alert('Please fill in all required fields');
      return;
    }

    if (items.length === 0 || items.some((item) => !item.description || !item.amount)) {
      alert('Please add at least one invoice item with description and amount');
      return;
    }

    const invoiceData: CreateFeeInvoiceData = {
      studentId: parseInt(formData.studentId),
      academicYearId: parseInt(formData.academicYearId),
      issueDate: formData.issueDate,
      dueDate: formData.dueDate,
      type: formData.type,
      items: items.map((item) => ({
        feeStructureId: item.feeStructureId,
        description: item.description,
        amount: parseFloat(item.amount),
        discountAmount: parseFloat(item.discountAmount || '0'),
        dueDate: item.dueDate || undefined,
        notes: item.notes || undefined,
      })),
      notes: formData.notes || undefined,
    };

    createMutation.mutate(invoiceData);
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + (parseFloat(item.amount || '0') - parseFloat(item.discountAmount || '0')),
    0,
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/invoices')}>
            <FiArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Invoice</h1>
            <p className="text-gray-600 mt-1">Create a new fee invoice for a student</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Search Student</Label>
                  <Input
                    placeholder="Search by student ID or name..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                  {students.length > 0 && (
                    <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                      {students.map((student) => (
                        <div
                          key={student.id}
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setSelectedStudent(student);
                            setFormData({ ...formData, studentId: student.id.toString() });
                            setStudentSearch(`${student.firstName} ${student.lastName} (${student.studentId})`);
                            setStudents([]);
                          }}
                        >
                          {student.firstName} {student.lastName} ({student.studentId})
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedStudent && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: {selectedStudent.firstName} {selectedStudent.lastName}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Academic Year *</Label>
                    <Select
                      value={formData.academicYearId}
                      onValueChange={(value) => setFormData({ ...formData, academicYearId: value })}
                      disabled={true}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select academic year" />
                      </SelectTrigger>
                      <SelectContent>
                        {academicYears.map((year: any) => (
                          <SelectItem key={year.id} value={year.id.toString()}>
                            {year.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {currentAcademicYear && (
                      <p className="mt-1 text-xs text-gray-500">
                        Current academic year: {currentAcademicYear.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Invoice Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="one_time">One Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Issue Date *</Label>
                    <Input
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Due Date *</Label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invoice Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="border p-4 rounded-md space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <FiTrash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Fee Structure (Optional)</Label>
                        <Select
                          value={item.feeStructureId?.toString() || ''}
                          onValueChange={(value) =>
                            updateItem(index, 'feeStructureId', value ? parseInt(value).toString() : '')
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select fee structure" />
                          </SelectTrigger>
                          <SelectContent>
                            {feeStructures.map((fs: any) => (
                              <SelectItem key={fs.id} value={fs.id.toString()}>
                                {fs.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Description *</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder="e.g., Tuition Fee"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Amount *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.amount}
                          onChange={(e) => updateItem(index, 'amount', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <Label>Discount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.discountAmount}
                          onChange={(e) => updateItem(index, 'discountAmount', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <Label>Due Date (Optional)</Label>
                        <Input
                          type="date"
                          value={item.dueDate}
                          onChange={(e) => updateItem(index, 'dueDate', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Notes (Optional)</Label>
                      <Textarea
                        value={item.notes}
                        onChange={(e) => updateItem(index, 'notes', e.target.value)}
                        placeholder="Additional notes..."
                      />
                    </div>
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={addItem}>
                  <FiPlus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span>₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes for this invoice..."
                  rows={4}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/invoices')}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Invoice'}
              </Button>
            </div>
          </div>
        </form>

        {createMutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {getErrorMessage(createMutation.error)}
          </div>
        )}
      </div>
    </Layout>
  );
}

