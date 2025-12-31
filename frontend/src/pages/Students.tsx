import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { studentsService } from '../services/students.service';
import { academicYearsService } from '../services/academicYears.service';
import { studentAcademicRecordsService } from '../services/studentAcademicRecords.service';
import { Student, AcademicYear, StudentAcademicRecord } from '../types';
import { FiPlus, FiEdit2, FiTrash2, FiUser, FiMail, FiBook, FiLoader, FiCalendar } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '../services/api';

interface Class {
  id: number;
  name: string;
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAcademicRecordModal, setShowAcademicRecordModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<AcademicYear | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicRecords, setAcademicRecords] = useState<Record<number, StudentAcademicRecord>>({});
  
  const [formData, setFormData] = useState<Partial<Student>>({
    studentId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    admissionDate: '',
    admissionNumber: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    parentRelation: '',
    status: 'active',
  });

  const [academicRecordData, setAcademicRecordData] = useState({
    classId: '',
    section: '',
    rollNumber: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load current academic year
      const year = await academicYearsService.getCurrent();
      setCurrentAcademicYear(year);
      
      // Load students
      const studentsData = await studentsService.getAll();
      setStudents(studentsData);
      
      // Load classes
      const classesResponse = await api.instance.get<Class[]>('/classes');
      setClasses(classesResponse.data);
      
      // Load current academic records for all students
      const recordsMap: Record<number, StudentAcademicRecord> = {};
      for (const student of studentsData) {
        try {
          const record = await studentAcademicRecordsService.getCurrent(student.id);
          if (record) {
            recordsMap[student.id] = record;
          }
        } catch (err) {
          // No record found, skip
        }
      }
      setAcademicRecords(recordsMap);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user?.schoolId && !localStorage.getItem('school_subdomain')) {
        setError('School context required. Please ensure you have a school assigned or access via school subdomain.');
        return;
      }
      
      if (editingStudent) {
        await studentsService.update(editingStudent.id, formData);
      } else {
        await studentsService.create(formData);
      }
      
      setError('');
      setShowModal(false);
      setEditingStudent(null);
      resetForm();
      loadData();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to save student';
      setError(errorMessage);
    }
  };

  const handleAcademicRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !currentAcademicYear) return;
    
    try {
      setError('');
      await studentAcademicRecordsService.create({
        studentId: selectedStudent.id,
        academicYearId: currentAcademicYear.id,
        classId: parseInt(academicRecordData.classId),
        section: academicRecordData.section || undefined,
        rollNumber: academicRecordData.rollNumber || undefined,
        status: 'active',
      });
      
      setShowAcademicRecordModal(false);
      setSelectedStudent(null);
      setAcademicRecordData({ classId: '', section: '', rollNumber: '' });
      loadData();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create academic record';
      setError(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      dateOfBirth: '',
      gender: '',
      bloodGroup: '',
      admissionDate: '',
      admissionNumber: '',
      parentName: '',
      parentEmail: '',
      parentPhone: '',
      parentRelation: '',
      status: 'active',
    });
  };

  const handleEdit = (student: Student) => {
    setError('');
    setEditingStudent(student);
    setFormData({
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      address: student.address,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      bloodGroup: student.bloodGroup,
      admissionDate: student.admissionDate,
      admissionNumber: student.admissionNumber,
      parentName: student.parentName,
      parentEmail: student.parentEmail,
      parentPhone: student.parentPhone,
      parentRelation: student.parentRelation,
      status: student.status,
    });
    setShowModal(true);
  };

  const handleAddAcademicRecord = (student: Student) => {
    setSelectedStudent(student);
    setAcademicRecordData({ classId: '', section: '', rollNumber: '' });
    setError('');
    setShowAcademicRecordModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      await studentsService.delete(id);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete student');
    }
  };

  const getCurrentClass = (student: Student): string => {
    const record = academicRecords[student.id];
    if (record?.class) {
      return `${record.class.name}${record.section ? ` - ${record.section}` : ''}`;
    }
    return 'Not assigned';
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                  Students
                </CardTitle>
                <CardDescription className="mt-1">
                  Manage student information and academic records
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingStudent(null);
                  resetForm();
                  setError('');
                  setShowModal(true);
                }}
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
              >
                <FiPlus className="w-5 h-5 mr-2" />
                Add Student
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Error Alert */}
        {error && !showModal && !showAcademicRecordModal && (
          <Card className="border-destructive border-l-4 animate-pulse-slow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-destructive mb-1">Error</p>
                  <p className="text-sm text-destructive/90">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading ? (
          <Card className="p-12">
            <CardContent className="flex items-center justify-center">
              <FiLoader className="w-8 h-8 text-primary animate-spin" />
              <span className="ml-3 text-muted-foreground">Loading students...</span>
            </CardContent>
          </Card>
        ) : students.length === 0 ? (
          <Card className="text-center py-12 animate-fade-in">
            <CardContent>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-full mb-4 shadow-lg">
                <FiUser className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="mb-2">No students found</CardTitle>
              <CardDescription className="mb-4">Get started by creating a new student.</CardDescription>
              <Button
                onClick={() => {
                  resetForm();
                  setError('');
                  setShowModal(true);
                }}
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
              >
                <FiPlus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Class ({currentAcademicYear?.name || 'N/A'})
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-white/80 transition-smooth">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                              <FiUser className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-sm text-gray-500">ID: {student.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <FiMail className="w-4 h-4 mr-2 text-indigo-500" />
                          {student.email}
                        </div>
                        {student.phone && (
                          <div className="text-sm text-gray-500 mt-1">{student.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <FiBook className="w-4 h-4 mr-2 text-indigo-500" />
                          {getCurrentClass(student)}
                        </div>
                        {!academicRecords[student.id] && (
                          <Button
                            variant="link"
                            size="sm"
                            className="text-xs mt-1 p-0 h-auto"
                            onClick={() => handleAddAcademicRecord(student)}
                          >
                            Assign class
                          </Button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            student.status === 'active'
                              ? 'default'
                              : student.status === 'graduated'
                              ? 'secondary'
                              : 'outline'
                          }
                          className={
                            student.status === 'active'
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0'
                              : student.status === 'graduated'
                              ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white border-0'
                              : ''
                          }
                        >
                          {student.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            onClick={() => handleEdit(student)}
                            variant="ghost"
                            size="icon"
                            className="text-primary hover:text-primary hover:bg-primary/10"
                            title="Edit"
                          >
                            <FiEdit2 className="w-5 h-5" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(student.id)}
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Delete"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Student Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingStudent(null);
            resetForm();
            setError('');
          }}
          title={editingStudent ? 'Edit Student' : 'Add New Student'}
        >
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-700 mb-1">Error</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Student ID *
                </label>
                <Input
                  type="text"
                  required
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  placeholder="STU001"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-smooth bg-white/50 backdrop-blur-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="graduated">Graduated</option>
                  <option value="transferred">Transferred</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name *
                </label>
                <Input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name *
                </label>
                <Input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john.doe@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date of Birth
                </label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                <select
                  value={formData.gender || ''}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-smooth bg-white/50 backdrop-blur-sm"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Blood Group
                </label>
                <Input
                  type="text"
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  placeholder="O+"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Admission Date *
                </label>
                <Input
                  type="date"
                  required
                  value={formData.admissionDate}
                  onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Admission Number
              </label>
              <Input
                type="text"
                value={formData.admissionNumber}
                onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                placeholder="ADM001"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
              <Input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, City"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Parent/Guardian Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Parent Name
                  </label>
                  <Input
                    type="text"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    placeholder="John Doe Sr."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Relation
                  </label>
                  <select
                    value={formData.parentRelation || ''}
                    onChange={(e) => setFormData({ ...formData, parentRelation: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-smooth bg-white/50 backdrop-blur-sm"
                  >
                    <option value="">Select</option>
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="guardian">Guardian</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Parent Email
                  </label>
                  <Input
                    type="email"
                    value={formData.parentEmail}
                    onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                    placeholder="parent@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Parent Phone
                  </label>
                  <Input
                    type="tel"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  setEditingStudent(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
              >
                {editingStudent ? 'Update Student' : 'Create Student'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Academic Record Modal */}
        <Modal
          isOpen={showAcademicRecordModal}
          onClose={() => {
            setShowAcademicRecordModal(false);
            setSelectedStudent(null);
            setAcademicRecordData({ classId: '', section: '', rollNumber: '' });
            setError('');
          }}
          title={`Assign Class - ${selectedStudent?.firstName} ${selectedStudent?.lastName}`}
        >
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <form onSubmit={handleAcademicRecordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Academic Year
              </label>
              <Input
                type="text"
                value={currentAcademicYear?.name || 'N/A'}
                disabled
                className="bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Class *
              </label>
              <Select
                value={academicRecordData.classId}
                onValueChange={(value) => setAcademicRecordData({ ...academicRecordData, classId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Section
                </label>
                <Input
                  type="text"
                  value={academicRecordData.section}
                  onChange={(e) => setAcademicRecordData({ ...academicRecordData, section: e.target.value })}
                  placeholder="A"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Roll Number
                </label>
                <Input
                  type="text"
                  value={academicRecordData.rollNumber}
                  onChange={(e) => setAcademicRecordData({ ...academicRecordData, rollNumber: e.target.value })}
                  placeholder="001"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAcademicRecordModal(false);
                  setSelectedStudent(null);
                  setAcademicRecordData({ classId: '', section: '', rollNumber: '' });
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
              >
                Assign Class
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
