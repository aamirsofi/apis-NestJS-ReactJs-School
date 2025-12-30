import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FiLoader,
  FiUsers,
  FiDollarSign,
  FiBook,
  FiArrowLeft,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
} from "react-icons/fi";
import api from "../../services/api";

interface SchoolDetails {
  school: {
    id: number;
    name: string;
    subdomain: string;
    email?: string;
    phone?: string;
    address?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    createdBy?: {
      id: number;
      name: string;
      email: string;
    };
  };
  students: Array<{
    id: number;
    studentId: string;
    firstName: string;
    lastName: string;
    email: string;
    class: string;
    section?: string;
    status: string;
    createdAt: string;
  }>;
  users: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
  payments: Array<{
    id: number;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    status: string;
    student?: {
      id: number;
      firstName: string;
      lastName: string;
    };
    feeStructure?: {
      id: number;
      name: string;
    };
    createdAt: string;
  }>;
  feeStructures: Array<{
    id: number;
    name: string;
    amount: number;
    academicYear: string;
    class?: string;
    status: string;
    category?: {
      id: number;
      name: string;
    };
    createdAt: string;
  }>;
  stats: {
    totalStudents: number;
    activeStudents: number;
    totalUsers: number;
    totalPayments: number;
    completedPayments: number;
    totalRevenue: number;
    totalFeeStructures: number;
    activeFeeStructures: number;
  };
}

export default function SchoolDetails() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<SchoolDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSchoolDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError("");
      const response = await api.instance.get(
        `/super-admin/schools/${id}/details`
      );
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load school details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchoolDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FiLoader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="card-modern rounded-2xl p-6 bg-red-50 border-l-4 border-red-400">
          <p className="text-red-700">{error || "School not found"}</p>
          <Link
            to="/super-admin/schools"
            className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-700"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to Schools
          </Link>
        </div>
      </div>
    );
  }

  const { school, students, users, payments, feeStructures, stats } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-modern rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/super-admin/schools"
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-smooth"
          >
            <FiArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
              {school.name}
            </h1>
            <p className="text-gray-600 text-sm mt-0.5">
              School Details & Analytics
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
              school.status === "active"
                ? "bg-green-100 text-green-800"
                : school.status === "suspended"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {school.status.charAt(0).toUpperCase() + school.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-modern rounded-2xl p-6 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Students</p>
              <p className="text-3xl font-bold text-indigo-600">
                {stats.totalStudents}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.activeStudents} active
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <FiUsers className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="card-modern rounded-2xl p-6 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-purple-600">
                {stats.totalUsers}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <FiUsers className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card-modern rounded-2xl p-6 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">
                ${stats.totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.completedPayments} completed payments
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <FiDollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card-modern rounded-2xl p-6 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Fee Structures</p>
              <p className="text-3xl font-bold text-pink-600">
                {stats.totalFeeStructures}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.activeFeeStructures} active
              </p>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
              <FiBook className="w-6 h-6 text-pink-600" />
            </div>
          </div>
        </div>
      </div>

      {/* School Information */}
      <div className="card-modern rounded-2xl p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          School Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Subdomain</p>
            <p className="text-lg font-semibold text-gray-900">
              {school.subdomain}
            </p>
          </div>
          {school.email && (
            <div>
              <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                <FiMail className="w-4 h-4" />
                Email
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {school.email}
              </p>
            </div>
          )}
          {school.phone && (
            <div>
              <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                <FiPhone className="w-4 h-4" />
                Phone
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {school.phone}
              </p>
            </div>
          )}
          {school.address && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                <FiMapPin className="w-4 h-4" />
                Address
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {school.address}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
              <FiCalendar className="w-4 h-4" />
              Created At
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(school.createdAt).toLocaleDateString()}
            </p>
          </div>
          {school.createdBy && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Created By</p>
              <p className="text-lg font-semibold text-gray-900">
                {school.createdBy.name}
              </p>
              <p className="text-sm text-gray-500">{school.createdBy.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* Students Section */}
      <div className="card-modern rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Students ({students.length})
          </h2>
          <span className="text-sm text-gray-500">
            Showing {students.length} of {stats.totalStudents}
          </span>
        </div>
        {students.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No students found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-indigo-50/50 transition-all duration-150 group"
                  >
                    <td className="px-4 py-2 text-sm font-semibold text-gray-900 font-mono">
                      {student.studentId}
                    </td>
                    <td className="px-4 py-2 text-sm font-semibold text-gray-900">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {student.class}
                      {student.section && ` - ${student.section}`}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full border ${
                          student.status === "active"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : student.status === "graduated"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Users Section */}
      <div className="card-modern rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Users ({users.length})
          </h2>
        </div>
        {users.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No users found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-indigo-50/50 transition-all duration-150 group"
                  >
                    <td className="px-4 py-2 text-sm font-semibold text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 capitalize">
                        {user.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payments Section */}
      <div className="card-modern rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Recent Payments ({payments.length})
          </h2>
          <span className="text-sm text-gray-500">
            Showing {payments.length} of {stats.totalPayments}
          </span>
        </div>
        {payments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No payments found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Fee Structure
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-indigo-50/50 transition-all duration-150 group"
                  >
                    <td className="px-4 py-2 text-sm font-semibold text-gray-900">
                      {payment.student ? (
                        `${payment.student.firstName} ${payment.student.lastName}`
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {payment.feeStructure?.name || (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm font-bold text-indigo-600">
                      ${payment.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 capitalize">
                      {payment.paymentMethod.replace("_", " ")}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full border ${
                          payment.status === "completed"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : payment.status === "pending"
                            ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                            : payment.status === "failed"
                            ? "bg-red-100 text-red-700 border-red-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fee Structures Section */}
      <div className="card-modern rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Fee Structures ({feeStructures.length})
          </h2>
        </div>
        {feeStructures.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No fee structures found
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Academic Year
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {feeStructures.map((fs) => (
                  <tr
                    key={fs.id}
                    className="hover:bg-indigo-50/50 transition-all duration-150 group"
                  >
                    <td className="px-4 py-2 text-sm font-semibold text-gray-900">
                      {fs.name}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {fs.category?.name || (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm font-bold text-indigo-600">
                      ${fs.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {fs.academicYear}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {fs.class || "All"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full border ${
                          fs.status === "active"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {fs.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
