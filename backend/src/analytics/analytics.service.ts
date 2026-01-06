import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../payments/entities/payment.entity';
import { Student, StudentStatus } from '../students/entities/student.entity';
import { FeeInvoice } from '../invoices/entities/fee-invoice.entity';
import { School, SchoolStatus } from '../schools/entities/school.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(FeeInvoice)
    private readonly invoiceRepository: Repository<FeeInvoice>,
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
  ) {}

  async getOverview(schoolId: number) {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const lastYearStart = new Date(currentYear - 1, 0, 1);
    const lastYearEnd = new Date(currentYear - 1, 11, 31);

    // Total revenue (this year)
    const paymentsThisYear = await this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.schoolId = :schoolId', { schoolId })
      .andWhere('payment.status = :status', { status: 'completed' })
      .andWhere('payment.paymentDate >= :startDate', { startDate: startOfYear })
      .select('SUM(payment.amount)', 'totalAmount')
      .addSelect('COUNT(payment.id)', 'totalCount')
      .getRawOne();

    // Last year's revenue for growth calculation
    const paymentsLastYear = await this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.schoolId = :schoolId', { schoolId })
      .andWhere('payment.status = :status', { status: 'completed' })
      .andWhere('payment.paymentDate >= :startDate', { startDate: lastYearStart })
      .andWhere('payment.paymentDate <= :endDate', { endDate: lastYearEnd })
      .select('SUM(payment.amount)', 'totalAmount')
      .getRawOne();

    const totalRevenue = parseFloat(paymentsThisYear?.totalAmount || '0');
    const totalPayments = parseInt(paymentsThisYear?.totalCount || '0');
    const lastYearRevenue = parseFloat(paymentsLastYear?.totalAmount || '0');
    const averagePayment = totalPayments > 0 ? totalRevenue / totalPayments : 0;
    const growthRate = lastYearRevenue > 0 ? ((totalRevenue - lastYearRevenue) / lastYearRevenue) * 100 : 0;

    // Total students
    const totalStudents = await this.studentRepository.count({
      where: { schoolId, status: StudentStatus.ACTIVE },
    });

    // Collection rate (invoiced vs collected)
    const invoiceStats = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.schoolId = :schoolId', { schoolId })
      .andWhere('invoice.status != :status', { status: 'draft' })
      .select('SUM(invoice.totalAmount)', 'totalInvoiced')
      .addSelect('SUM(invoice.paidAmount)', 'totalCollected')
      .getRawOne();

    const totalInvoiced = parseFloat(invoiceStats?.totalInvoiced || '0');
    const totalCollected = parseFloat(invoiceStats?.totalCollected || '0');
    const collectionRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;

    return {
      totalRevenue,
      totalPayments,
      averagePayment,
      growthRate,
      totalSchools: 1, // Single school context
      totalStudents,
      collectionRate,
    };
  }

  async getRevenueAnalytics(schoolId: number, fromDate?: Date, toDate?: Date) {
    // Default to last 12 months if no dates provided
    const endDate = toDate || new Date();
    const startDate = fromDate || new Date(endDate.getFullYear(), endDate.getMonth() - 11, 1);

    // Get monthly revenue data
    const monthlyData = await this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.schoolId = :schoolId', { schoolId })
      .andWhere('payment.status = :status', { status: 'completed' })
      .andWhere('payment.paymentDate >= :startDate', { startDate })
      .andWhere('payment.paymentDate <= :endDate', { endDate })
      .select('DATE_TRUNC(\'month\', payment.paymentDate)', 'month')
      .addSelect('SUM(payment.amount)', 'totalRevenue')
      .addSelect('COUNT(payment.id)', 'paymentCount')
      .groupBy('DATE_TRUNC(\'month\', payment.paymentDate)')
      .orderBy('DATE_TRUNC(\'month\', payment.paymentDate)', 'ASC')
      .getRawMany();

    // Transform to response format
    const revenueData = monthlyData.map((row, index) => {
      const totalRevenue = parseFloat(row.totalRevenue || '0');
      const paymentCount = parseInt(row.paymentCount || '0');
      const averagePayment = paymentCount > 0 ? totalRevenue / paymentCount : 0;

      // Calculate growth rate compared to previous month
      let growthRate = 0;
      if (index > 0) {
        const previousRevenue = parseFloat(monthlyData[index - 1].totalRevenue || '0');
        if (previousRevenue > 0) {
          growthRate = ((totalRevenue - previousRevenue) / previousRevenue) * 100;
        }
      }

      const date = new Date(row.month);
      const period = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

      return {
        id: index + 1,
        period,
        totalRevenue,
        totalPayments: totalRevenue, // Same as revenue in this context
        averagePayment,
        growthRate,
        paymentCount,
      };
    });

    return revenueData;
  }

  async getSchoolPerformance() {
    // Get all schools with their performance metrics
    const schools = await this.schoolRepository.find({
      where: { status: SchoolStatus.ACTIVE },
    });

    const performanceData = await Promise.all(
      schools.map(async (school, index) => {
        // Get total students
        const totalStudents = await this.studentRepository.count({
          where: { schoolId: school.id, status: StudentStatus.ACTIVE },
        });

        // Get revenue stats
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const lastYearStart = new Date(currentYear - 1, 0, 1);
        const lastYearEnd = new Date(currentYear - 1, 11, 31);

        const paymentsThisYear = await this.paymentRepository
          .createQueryBuilder('payment')
          .where('payment.schoolId = :schoolId', { schoolId: school.id })
          .andWhere('payment.status = :status', { status: 'completed' })
          .andWhere('payment.paymentDate >= :startDate', { startDate: startOfYear })
          .select('SUM(payment.amount)', 'totalAmount')
          .getRawOne();

        const paymentsLastYear = await this.paymentRepository
          .createQueryBuilder('payment')
          .where('payment.schoolId = :schoolId', { schoolId: school.id })
          .andWhere('payment.status = :status', { status: 'completed' })
          .andWhere('payment.paymentDate >= :startDate', { startDate: lastYearStart })
          .andWhere('payment.paymentDate <= :endDate', { endDate: lastYearEnd })
          .select('SUM(payment.amount)', 'totalAmount')
          .getRawOne();

        const totalRevenue = parseFloat(paymentsThisYear?.totalAmount || '0');
        const lastYearRevenue = parseFloat(paymentsLastYear?.totalAmount || '0');
        const averageFee = totalStudents > 0 ? totalRevenue / totalStudents : 0;
        const growthRate =
          lastYearRevenue > 0 ? ((totalRevenue - lastYearRevenue) / lastYearRevenue) * 100 : 0;

        // Collection rate
        const invoiceStats = await this.invoiceRepository
          .createQueryBuilder('invoice')
          .where('invoice.schoolId = :schoolId', { schoolId: school.id })
          .andWhere('invoice.status != :status', { status: 'draft' })
          .select('SUM(invoice.totalAmount)', 'totalInvoiced')
          .addSelect('SUM(invoice.paidAmount)', 'totalCollected')
          .getRawOne();

        const totalInvoiced = parseFloat(invoiceStats?.totalInvoiced || '0');
        const totalCollected = parseFloat(invoiceStats?.totalCollected || '0');
        const collectionRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;

        // Determine status
        let status: 'excellent' | 'good' | 'average' | 'needs_attention' = 'average';
        if (collectionRate >= 90 && growthRate >= 10) {
          status = 'excellent';
        } else if (collectionRate >= 75 && growthRate >= 0) {
          status = 'good';
        } else if (collectionRate < 60 || growthRate < -10) {
          status = 'needs_attention';
        }

        return {
          id: index + 1,
          schoolName: school.name,
          totalStudents,
          totalRevenue,
          averageFee,
          collectionRate,
          growthRate,
          status,
        };
      }),
    );

    return performanceData;
  }
}

