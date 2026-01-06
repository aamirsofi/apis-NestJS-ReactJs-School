import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../payments/entities/payment.entity';
import { StudentFeeStructure } from '../student-fee-structures/entities/student-fee-structure.entity';

/**
 * Receipt Service
 * Handles receipt generation and retrieval
 */
@Injectable()
export class ReceiptsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(StudentFeeStructure)
    private studentFeeStructureRepository: Repository<StudentFeeStructure>,
  ) {}

  /**
   * Get receipt data for a payment
   */
  async getReceiptData(paymentId: number, schoolId: number) {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId, schoolId },
      relations: [
        'student',
        'studentFeeStructure',
        'studentFeeStructure.feeStructure',
        'studentFeeStructure.academicYear',
        'invoice',
        'invoice.items',
        'school',
      ],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Handle both old and new payment types
    let studentFeeStructure = null;
    let totalAmount = 0;
    let paidAmount = 0;
    let remainingBalance = 0;

    if (payment.studentFeeStructureId) {
      // Old way: payment against student fee structure
      studentFeeStructure = await this.studentFeeStructureRepository.findOne({
        where: { id: payment.studentFeeStructureId },
        relations: ['feeStructure', 'academicYear'],
      });
      totalAmount = Number(studentFeeStructure?.amount || 0);
      paidAmount = await this.calculateTotalPaid(payment.studentFeeStructureId);
      remainingBalance = totalAmount - paidAmount;
    } else if (payment.invoiceId) {
      // New way: payment against invoice
      // Invoice data will be loaded via relations
      totalAmount = Number(payment.invoice?.totalAmount || 0);
      paidAmount = Number(payment.invoice?.paidAmount || 0);
      remainingBalance = Number(payment.invoice?.balanceAmount || 0);
    }

    return {
      receiptNumber: payment.receiptNumber,
      receiptDate: payment.paymentDate,
      payment: {
        id: payment.id,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.paymentDate,
        transactionId: payment.transactionId,
        notes: payment.notes,
      },
      student: {
        id: payment.student.id,
        studentId: payment.student.studentId,
        name: `${payment.student.firstName} ${payment.student.lastName}`,
        class: studentFeeStructure?.academicYear?.name || 'N/A',
      },
      fee: {
        name: studentFeeStructure?.feeStructure?.name || 'Fee Payment',
        totalAmount,
        paidAmount,
        remainingBalance,
        dueDate: studentFeeStructure?.dueDate,
      },
      school: {
        name: payment.school.name,
        address: payment.school.address,
        phone: payment.school.phone,
        email: payment.school.email,
        logo: payment.school.logo,
      },
    };
  }

  /**
   * Calculate total paid amount for a student fee structure
   */
  private async calculateTotalPaid(studentFeeStructureId: number): Promise<number> {
    const payments = await this.paymentRepository.find({
      where: {
        studentFeeStructureId,
        status: 'completed' as any,
      },
    });

    return payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  }
}

