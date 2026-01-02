import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import {
  FiDollarSign,
  FiUsers,
  FiMapPin,
  FiTrendingUp,
  FiLoader,
  FiBook,
  FiFileText,
  FiNavigation,
  FiSettings,
  FiCalendar,
} from 'react-icons/fi';
import api from '../../services/api';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';

interface DashboardStats {
  totalSchools: number;
  totalUsers: number;
  totalStudents: number;
  totalPayments: number;
  totalRevenue: number;
  recentSchools: any[];
}

interface SchoolDashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalUsers: number;
  totalPayments: number;
  completedPayments: number;
  totalRevenue: number;
  totalFeeStructures: number;
  activeFeeStructures: number;
  totalRoutePlans: number;
  totalClasses: number;
  totalCategoryHeads: number;
}

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const { selectedSchoolId, selectedSchool } = useSchool();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [schoolStats, setSchoolStats] = useState<SchoolDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSchoolStats, setLoadingSchoolStats] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (selectedSchoolId) {
      loadSchoolStats();
    } else {
      setSchoolStats(null);
    }
  }, [selectedSchoolId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await api.instance.get('/super-admin/dashboard');
      setStats(response.data);
    } catch (error) {
      // Silently fail - stats are not critical for page functionality
    } finally {
      setLoading(false);
    }
  };

  const loadSchoolStats = async () => {
    if (!selectedSchoolId) return;
    try {
      setLoadingSchoolStats(true);
      const response = await api.instance.get(`/super-admin/schools/${selectedSchoolId}/details`);
      const data = response.data;
      const stats = data.stats || {};
      setSchoolStats({
        totalStudents: stats.totalStudents || 0,
        activeStudents: stats.activeStudents || 0,
        totalUsers: stats.totalUsers || 0,
        totalPayments: stats.totalPayments || 0,
        completedPayments: stats.completedPayments || 0,
        totalRevenue: stats.totalRevenue || 0,
        totalFeeStructures: stats.totalFeeStructures || 0,
        activeFeeStructures: stats.activeFeeStructures || 0,
        totalRoutePlans: stats.totalRoutePlans || 0,
        totalClasses: stats.totalClasses || 0,
        totalCategoryHeads: stats.totalCategoryHeads || 0,
      });
    } catch (error) {
      // Silently fail - school stats are not critical
    } finally {
      setLoadingSchoolStats(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    link,
    isLoading = false,
  }: {
    title: string;
    value: number | string;
    icon: any;
    color: string;
    link: string;
    isLoading?: boolean;
  }) => {
    const content = (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
              <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                {isLoading ? (
                  <FiLoader className="w-6 h-6 animate-spin text-gray-400" />
                ) : value === '...' ? (
                  <span className="text-gray-400">...</span>
                ) : (
                  typeof value === 'number' ? value.toLocaleString() : value
                )}
              </p>
            </div>
            <div className={`${color} p-4 rounded-xl shadow-lg`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
          </div>
          {link !== '#' && (
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <FiTrendingUp className="w-4 h-4 mr-1" />
              <span>View all</span>
            </div>
          )}
        </CardContent>
      </Card>
    );

    return link && link !== '#' ? (
      <Link to={link} className="block">
        {content}
      </Link>
    ) : (
      content
    );
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-white">
            Welcome back, {user?.name}! 👋
          </CardTitle>
          <CardDescription className="text-indigo-100">
            {selectedSchool 
              ? `${selectedSchool.name} Dashboard` 
              : 'Super Admin Dashboard'}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Global Stats Grid - Show when no school selected */}
      {!selectedSchoolId && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Global Overview</h2>
            <Button
              onClick={loadStats}
              disabled={loading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {loading ? (
                <>
                  <FiLoader className="w-4 h-4 mr-1 animate-spin" />
                  Refreshing...
                </>
              ) : (
                'Refresh'
              )}
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Schools"
              value={stats?.totalSchools || 0}
              icon={FiMapPin}
              color="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
              link="/super-admin/schools"
              isLoading={loading}
            />
            <StatCard
              title="Users"
              value={stats?.totalUsers || 0}
              icon={FiUsers}
              color="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500"
              link="/super-admin/users"
              isLoading={loading}
            />
            <StatCard
              title="Students"
              value={stats?.totalStudents || 0}
              icon={FiUsers}
              color="bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500"
              link="/super-admin/students"
              isLoading={loading}
            />
            <StatCard
              title="Total Revenue"
              value={`$${(stats?.totalRevenue || 0).toLocaleString()}`}
              icon={FiDollarSign}
              color="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500"
              link="#"
              isLoading={loading}
            />
          </div>
        </div>
      )}

      {/* School-Specific Stats Grid - Show when school is selected */}
      {selectedSchoolId && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedSchool?.name} Overview
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Statistics for the selected school
              </p>
            </div>
            <Button
              onClick={loadSchoolStats}
              disabled={loadingSchoolStats}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {loadingSchoolStats ? (
                <>
                  <FiLoader className="w-4 h-4 mr-1 animate-spin" />
                  Refreshing...
                </>
              ) : (
                'Refresh'
              )}
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Students"
              value={schoolStats?.totalStudents || 0}
              icon={FiUsers}
              color="bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500"
              link={`/super-admin/students${selectedSchoolId ? `?schoolId=${selectedSchoolId}` : ''}`}
              isLoading={loadingSchoolStats}
            />
            <StatCard
              title="Active Students"
              value={schoolStats?.activeStudents || 0}
              icon={FiUsers}
              color="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500"
              link={`/super-admin/students${selectedSchoolId ? `?schoolId=${selectedSchoolId}` : ''}`}
              isLoading={loadingSchoolStats}
            />
            <StatCard
              title="Users"
              value={schoolStats?.totalUsers || 0}
              icon={FiUsers}
              color="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500"
              link="/super-admin/users"
              isLoading={loadingSchoolStats}
            />
            <StatCard
              title="Total Revenue"
              value={`$${(schoolStats?.totalRevenue || 0).toLocaleString()}`}
              icon={FiDollarSign}
              color="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500"
              link="#"
              isLoading={loadingSchoolStats}
            />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-6">
            <StatCard
              title="Fee Plans"
              value={schoolStats?.totalFeeStructures || 0}
              icon={FiFileText}
              color="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
              link="/super-admin/settings/fee-settings/fee-plan"
              isLoading={loadingSchoolStats}
            />
            <StatCard
              title="Route Plans"
              value={schoolStats?.totalRoutePlans || 0}
              icon={FiNavigation}
              color="bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500"
              link="/super-admin/settings/fee-settings/route-plan"
              isLoading={loadingSchoolStats}
            />
            <StatCard
              title="Classes"
              value={schoolStats?.totalClasses || 0}
              icon={FiBook}
              color="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500"
              link="/super-admin/settings/academics/class"
              isLoading={loadingSchoolStats}
            />
            <StatCard
              title="Category Heads"
              value={schoolStats?.totalCategoryHeads || 0}
              icon={FiSettings}
              color="bg-gradient-to-br from-teal-500 via-green-500 to-emerald-500"
              link="/super-admin/settings/fee-settings/category-heads"
              isLoading={loadingSchoolStats}
            />
          </div>
        </div>
      )}

      {/* Quick Actions - Show when school is selected */}
      {selectedSchoolId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common tasks for {selectedSchool?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                to="/super-admin/students/new"
                className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 transition-smooth"
              >
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FiUsers className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Add Student</p>
                  <p className="text-sm text-gray-500">Create a new student</p>
                </div>
              </Link>
              <Link
                to="/super-admin/settings/fee-settings/fee-plan"
                className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:bg-purple-50 hover:border-purple-200 transition-smooth"
              >
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FiFileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Manage Fee Plans</p>
                  <p className="text-sm text-gray-500">Create or update fee plans</p>
                </div>
              </Link>
              <Link
                to="/super-admin/settings/academics/class"
                className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-orange-200 transition-smooth"
              >
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FiBook className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Manage Classes</p>
                  <p className="text-sm text-gray-500">Add or edit classes</p>
                </div>
              </Link>
              <Link
                to="/super-admin/settings/academics/academic-year"
                className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-smooth"
              >
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiCalendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Academic Years</p>
                  <p className="text-sm text-gray-500">Manage academic periods</p>
                </div>
              </Link>
              <Link
                to="/super-admin/settings/fee-settings/route-plan"
                className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:bg-cyan-50 hover:border-cyan-200 transition-smooth"
              >
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <FiNavigation className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Route Plans</p>
                  <p className="text-sm text-gray-500">Manage transport routes</p>
                </div>
              </Link>
              <Link
                to="/super-admin/users"
                className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:bg-green-50 hover:border-green-200 transition-smooth"
              >
                <div className="p-2 bg-green-100 rounded-lg">
                  <FiUsers className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Manage Users</p>
                  <p className="text-sm text-gray-500">Add or edit users</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Schools - Only show when no school is selected */}
      {!selectedSchoolId && stats?.recentSchools && stats.recentSchools.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Recent Schools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentSchools.map((school) => (
                <Link
                  key={school.id}
                  to={`/super-admin/schools/${school.id}/details`}
                  className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-gray-200 hover:bg-indigo-50/50 hover:border-indigo-200 transition-smooth"
                >
                  <div>
                    <p className="font-semibold text-gray-800">{school.name}</p>
                    <p className="text-sm text-gray-600">{school.subdomain}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(school.createdAt).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

