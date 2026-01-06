import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { invoicesService } from '../services/invoices.service';
import { useSchool } from '../contexts/SchoolContext';
import { FiArrowLeft, FiPrinter, FiEdit } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const invoiceStatusColors: Record<string, string> = {
  draft: 'bg-gray-500',
  issued: 'bg-blue-500',
  partially_paid: 'bg-yellow-500',
  paid: 'bg-green-500',
  overdue: 'bg-red-500',
  cancelled: 'bg-gray-400',
};

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedSchoolId } = useSchool();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id, selectedSchoolId],
    queryFn: () => invoicesService.getById(parseInt(id!), selectedSchoolId as number),
    enabled: !!id && !!selectedSchoolId,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-8">Loading...</div>
      </Layout>
    );
  }

  if (!invoice) {
    return (
      <Layout>
        <div className="text-center py-8">Invoice not found</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/invoices')}>
              <FiArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Invoice {invoice.invoiceNumber}</h1>
              <p className="text-gray-600 mt-1">Invoice Details</p>
            </div>
          </div>
          <div className="flex gap-2">
            {invoice.status === 'draft' && (
              <Button variant="outline" onClick={() => navigate(`/invoices/${id}/edit`)}>
                <FiEdit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            <Button variant="outline">
              <FiPrinter className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Invoice Number:</span>
                <p className="font-medium">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Status:</span>
                <div className="mt-1">
                  <Badge className={invoiceStatusColors[invoice.status] || 'bg-gray-500'}>
                    {invoice.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Type:</span>
                <p className="font-medium capitalize">{invoice.type}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Issue Date:</span>
                <p className="font-medium">{format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Due Date:</span>
                <p className="font-medium">{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {invoice.student && (
                <>
                  <div>
                    <span className="text-sm text-gray-600">Name:</span>
                    <p className="font-medium">
                      {invoice.student.firstName} {invoice.student.lastName}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Student ID:</span>
                    <p className="font-medium">{invoice.student.studentId}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Academic Year:</span>
                    <p className="font-medium">{invoice.academicYear?.name || 'N/A'}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Total Amount:</span>
                <p className="font-medium text-lg">₹{invoice.totalAmount.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Discount:</span>
                <p className="font-medium">₹{invoice.discountAmount.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Paid Amount:</span>
                <p className="font-medium text-green-600">₹{invoice.paidAmount.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Balance:</span>
                <p className="font-medium text-lg text-red-600">
                  ₹{invoice.balanceAmount.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Description</th>
                    <th className="text-right p-2">Amount</th>
                    <th className="text-right p-2">Discount</th>
                    <th className="text-right p-2">Net Amount</th>
                    <th className="text-left p-2">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{item.description}</td>
                      <td className="text-right p-2">₹{item.amount.toLocaleString()}</td>
                      <td className="text-right p-2">₹{item.discountAmount.toLocaleString()}</td>
                      <td className="text-right p-2 font-medium">
                        ₹{(item.amount - item.discountAmount).toLocaleString()}
                      </td>
                      <td className="p-2">
                        {item.dueDate ? format(new Date(item.dueDate), 'MMM dd, yyyy') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold">
                    <td className="p-2">Total</td>
                    <td className="text-right p-2">₹{invoice.totalAmount.toLocaleString()}</td>
                    <td className="text-right p-2">₹{invoice.discountAmount.toLocaleString()}</td>
                    <td className="text-right p-2">₹{invoice.balanceAmount.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {invoice.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

