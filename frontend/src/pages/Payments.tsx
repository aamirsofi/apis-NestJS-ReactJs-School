import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { paymentsService } from '../services/payments.service';
import { studentsService } from '../services/students.service';
import { feeStructuresService } from '../services/feeStructures.service';
import { Payment, Student, FeeStructure } from '../types';

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [formData, setFormData] = useState<Partial<Payment>>({
    studentId: 0,
    feeStructureId: 0,
    amount: 0,
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    receiptNumber: '',
    status: 'completed',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsData, studentsData, structuresData] = await Promise.all([
        paymentsService.getAll(),
        studentsService.getAll(),
        feeStructuresService.getAll(),
      ]);
      setPayments(paymentsData);
      setStudents(studentsData);
      setFeeStructures(structuresData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPayment) {
        await paymentsService.update(editingPayment.id, formData);
      } else {
        await paymentsService.create(formData);
      }
      setShowModal(false);
      setEditingPayment(null);
      resetForm();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save payment');
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: 0,
      feeStructureId: 0,
      amount: 0,
      paymentMethod: 'cash',
      paymentDate: new Date().toISOString().split('T')[0],
      receiptNumber: '',
      status: 'completed',
      notes: '',
    });
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setFormData({
      studentId: payment.studentId,
      feeStructureId: payment.feeStructureId,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate.split('T')[0],
      receiptNumber: payment.receiptNumber,
      status: payment.status,
      notes: payment.notes,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    try {
      await paymentsService.delete(id);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete payment');
    }
  };

  const getStudentName = (studentId: number) => {
    const student = students.find((s) => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : 'Unknown';
  };

  const getFeeStructureName = (feeStructureId: number) => {
    const structure = feeStructures.find((f) => f.id === feeStructureId);
    return structure ? structure.name : 'Unknown';
  };

  return (
    <Layout>
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <button
            onClick={() => {
              setEditingPayment(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Add Payment
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <li key={payment.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {getStudentName(payment.studentId)} - {getFeeStructureName(payment.feeStructureId)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Amount: ${payment.amount} | Method: {payment.paymentMethod} | Date:{' '}
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </p>
                      {payment.receiptNumber && (
                        <p className="text-sm text-gray-500">Receipt: {payment.receiptNumber}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          payment.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : payment.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {payment.status}
                      </span>
                      <button
                        onClick={() => handleEdit(payment)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(payment.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editingPayment ? 'Edit Payment' : 'Add Payment'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Student</label>
                  <select
                    required
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: parseInt(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value={0}>Select Student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.firstName} {student.lastName} ({student.studentId})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fee Structure</label>
                  <select
                    required
                    value={formData.feeStructureId}
                    onChange={(e) =>
                      setFormData({ ...formData, feeStructureId: parseInt(e.target.value) })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value={0}>Select Fee Structure</option>
                    {feeStructures.map((structure) => (
                      <option key={structure.id} value={structure.id}>
                        {structure.name} (${structure.amount})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <select
                    required
                    value={formData.paymentMethod}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentMethod: e.target.value as any })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    {editingPayment ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

