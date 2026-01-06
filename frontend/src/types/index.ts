export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  schoolId?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  schoolId?: number;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface School {
  id: number;
  name: string;
  subdomain: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  settings?: Record<string, any>;
  status: 'active' | 'inactive' | 'suspended';
  createdById?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  admissionDate: string;
  admissionNumber?: string;
  photoUrl?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  parentRelation?: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  schoolId: number;
  userId?: number;
  academicRecords?: StudentAcademicRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface AcademicYear {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description?: string;
  schoolId: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentAcademicRecord {
  id: number;
  studentId: number;
  academicYearId: number;
  classId: number;
  section?: string;
  rollNumber?: string;
  admissionNumber?: string;
  status: 'active' | 'promoted' | 'repeating' | 'transferred' | 'dropped';
  remarks?: string;
  student?: Student;
  academicYear?: AcademicYear;
  class?: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type FeeCategoryType = 'school' | 'transport';

export interface FeeCategory {
  id: number;
  name: string;
  description?: string;
  type: FeeCategoryType;
  status: 'active' | 'inactive';
  applicableMonths?: number[]; // Array of month numbers (1-12)
  schoolId: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeeStructure {
  id: number;
  schoolId: number;
  feeCategoryId: number;
  categoryHeadId?: number;
  name: string;
  description?: string;
  amount: number;
  classId?: number;
  academicYear: string;
  dueDate?: string;
  status: 'active' | 'inactive';
  category?: FeeCategory;
  categoryHead?: CategoryHead;
  school?: School;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryHead {
  id: number;
  schoolId: number;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Route {
  id: number;
  schoolId: number;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  school?: School;
  createdAt: string;
  updatedAt: string;
}

export interface RoutePlan {
  id: number;
  schoolId: number;
  routeId: number;
  categoryHeadId?: number;
  feeCategoryId: number; // Transport fee category (Fee Heading of type transport) - DEPRECATED
  classId?: number;
  name: string;
  description?: string;
  amount: number;
  status: 'active' | 'inactive';
  route?: Route;
  categoryHead?: CategoryHead;
  feeCategory?: FeeCategory;
  class?: {
    id: number;
    name: string;
  };
  school?: School;
  createdAt: string;
  updatedAt: string;
}

export interface RoutePrice {
  id: number;
  schoolId: number;
  routeId: number;
  classId: number; // Required in route_prices
  categoryHeadId: number; // Required in route_prices
  amount: number;
  status: 'active' | 'inactive';
  route?: Route;
  categoryHead?: CategoryHead;
  class?: {
    id: number;
    name: string;
  };
  school?: School;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: number;
  studentId: number;
  studentFeeStructureId: number; // Changed from feeStructureId
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'card' | 'online' | 'cheque';
  transactionId?: string;
  receiptNumber?: string; // Added
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  notes?: string;
  schoolId: number;
  student?: Student;
  studentFeeStructure?: {
    id: number;
    feeStructure?: {
      name: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

// Legacy interface for backward compatibility (deprecated)
export interface PaymentOld {
  id: number;
  studentId: number;
  feeStructureId: number;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'cheque' | 'online';
  paymentDate: string;
  receiptNumber?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  notes?: string;
  schoolId: number;
  createdAt: string;
  updatedAt: string;
}

