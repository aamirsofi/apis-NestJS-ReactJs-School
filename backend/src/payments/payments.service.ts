import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { StudentFeeStructure, PaymentStatus as FeePaymentStatus } from '../student-fee-structures/entities/student-fee-structure.entity';
import { isAfter } from 'date-fns';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(StudentFeeStructure)
    private studentFeeStructureRepository: Repository<StudentFeeStructure>,
  ) {}

  /**
   * Generate unique receipt number
   * Format: REC-{YYYYMMDD}-{XXXX} (e.g., REC-20260103-0001)
   */
  private async generateReceiptNumber(schoolId: number): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const prefix = `REC-${dateStr}-`;

    // Find the last receipt number for today using query builder
    const lastReceipt = await this.paymentsRepository
      .createQueryBuilder('payment')
      .where('payment.receiptNumber LIKE :prefix', { prefix: `${prefix}%` })
      .andWhere('payment.schoolId = :schoolId', { schoolId })
      .orderBy('payment.receiptNumber', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastReceipt?.receiptNumber) {
      const parts = lastReceipt.receiptNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1] || '0', 10);
      sequence = lastSeq + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Calculate total paid amount for a StudentFeeStructure
   */
  private async calculatePaidAmount(studentFeeStructureId: number): Promise<number> {
    const payments = await this.paymentsRepository.find({
      where: {
        studentFeeStructureId,
        status: PaymentStatus.COMPLETED,
      },
    });

    return payments.reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0);
  }

  /**
   * Update StudentFeeStructure status based on payments
   */
  private async updateFeeStatus(studentFeeStructure: StudentFeeStructure): Promise<void> {
    const paidAmount = await this.calculatePaidAmount(studentFeeStructure.id);
    const totalAmount = parseFloat(studentFeeStructure.amount.toString());
    const dueDate = new Date(studentFeeStructure.dueDate);

    if (paidAmount >= totalAmount) {
      // Fully paid
      studentFeeStructure.status = FeePaymentStatus.PAID;
    } else if (isAfter(new Date(), dueDate)) {
      // Past due date and not fully paid
      studentFeeStructure.status = FeePaymentStatus.OVERDUE;
    } else {
      // Still pending
      studentFeeStructure.status = FeePaymentStatus.PENDING;
    }

    await this.studentFeeStructureRepository.save(studentFeeStructure);
  }

  async create(createPaymentDto: CreatePaymentDto, schoolId: number): Promise<Payment> {
    // Validate StudentFeeStructure exists and belongs to the correct school
    // Use query builder to join with student and check schoolId
    const studentFeeStructure = await this.studentFeeStructureRepository
      .createQueryBuilder('sfs')
      .leftJoinAndSelect('sfs.student', 'student')
      .leftJoinAndSelect('sfs.feeStructure', 'feeStructure')
      .where('sfs.id = :id', { id: createPaymentDto.studentFeeStructureId })
      .andWhere('sfs.studentId = :studentId', { studentId: createPaymentDto.studentId })
      .andWhere('student.schoolId = :schoolId', { schoolId })
      .getOne();

    if (!studentFeeStructure) {
      // Check if it exists but wrong school
      const exists = await this.studentFeeStructureRepository.findOne({
        where: {
          id: createPaymentDto.studentFeeStructureId,
          studentId: createPaymentDto.studentId,
        },
        relations: ['student'],
      });

      if (exists && exists.student?.schoolId !== schoolId) {
        throw new BadRequestException(
          `Student fee structure belongs to a different school. Student's school ID: ${exists.student?.schoolId}, Current school ID: ${schoolId}`,
        );
      }

      throw new NotFoundException(
        `Student fee structure with ID ${createPaymentDto.studentFeeStructureId} not found for student ${createPaymentDto.studentId} in school ${schoolId}`,
      );
    }

    // Calculate remaining balance
    const totalAmount = parseFloat(studentFeeStructure.amount.toString());
    const paidAmount = await this.calculatePaidAmount(studentFeeStructure.id);
    const remainingBalance = totalAmount - paidAmount;

    // Validate payment amount
    if (createPaymentDto.amount > remainingBalance) {
      throw new BadRequestException(
        `Payment amount (₹${createPaymentDto.amount}) exceeds remaining balance (₹${remainingBalance.toFixed(2)})`,
      );
    }

    if (createPaymentDto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    // Generate receipt number if not provided
    let receiptNumber = createPaymentDto.receiptNumber;
    if (!receiptNumber) {
      receiptNumber = await this.generateReceiptNumber(schoolId);
    } else {
      // Check if receipt number already exists
      const existingReceipt = await this.paymentsRepository.findOne({
        where: { receiptNumber, schoolId },
      });
      if (existingReceipt) {
        throw new BadRequestException(`Receipt number ${receiptNumber} already exists`);
      }
    }

    // Create payment
    const payment = this.paymentsRepository.create({
      ...createPaymentDto,
      schoolId,
      receiptNumber,
      paymentDate: new Date(createPaymentDto.paymentDate),
      status: createPaymentDto.status || PaymentStatus.COMPLETED, // Default to completed
    });

    const savedPayment = await this.paymentsRepository.save(payment);

    // Update StudentFeeStructure status
    await this.updateFeeStatus(studentFeeStructure);

    // Reload payment with relations
    return await this.findOne(savedPayment.id, schoolId);
  }

  async findAll(schoolId?: number): Promise<Payment[]> {
    const where: any = {};
    if (schoolId) {
      where.schoolId = schoolId;
    }
    return await this.paymentsRepository.find({
      where,
      relations: ['school', 'student', 'studentFeeStructure', 'studentFeeStructure.feeStructure'],
      order: { paymentDate: 'desc' },
    });
  }

  async findOne(id: number, schoolId?: number): Promise<Payment> {
    const where: any = { id };
    if (schoolId) {
      where.schoolId = schoolId;
    }
    const payment = await this.paymentsRepository.findOne({
      where,
      relations: ['school', 'student', 'studentFeeStructure', 'studentFeeStructure.feeStructure', 'studentFeeStructure.academicYear'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async findByStudent(studentId: number, schoolId?: number): Promise<Payment[]> {
    const where: any = { studentId };
    if (schoolId) {
      where.schoolId = schoolId;
    }
    return await this.paymentsRepository.find({
      where,
      relations: ['studentFeeStructure', 'studentFeeStructure.feeStructure', 'studentFeeStructure.academicYear'],
      order: { paymentDate: 'desc' },
    });
  }

  /**
   * Get payments for a specific StudentFeeStructure
   */
  async findByStudentFeeStructure(studentFeeStructureId: number, schoolId?: number): Promise<Payment[]> {
    const where: any = { studentFeeStructureId };
    if (schoolId) {
      where.schoolId = schoolId;
    }
    return await this.paymentsRepository.find({
      where,
      relations: ['student', 'studentFeeStructure'],
      order: { paymentDate: 'desc' },
    });
  }

  async update(
    id: number,
    updatePaymentDto: UpdatePaymentDto,
    schoolId?: number,
  ): Promise<Payment> {
    const payment = await this.findOne(id, schoolId);
    const updateData: any = { ...updatePaymentDto };
    
    if (updatePaymentDto.paymentDate) {
      updateData.paymentDate = new Date(updatePaymentDto.paymentDate);
    }

    // If amount is being updated, validate it
    if (updatePaymentDto.amount !== undefined) {
      const studentFeeStructure = await this.studentFeeStructureRepository.findOne({
        where: { id: payment.studentFeeStructureId },
      });

      if (studentFeeStructure) {
        const paidAmount = await this.calculatePaidAmount(studentFeeStructure.id);
        const currentPaymentAmount = parseFloat(payment.amount.toString());
        const totalPaidExcludingCurrent = paidAmount - currentPaymentAmount;
        const remainingBalance = parseFloat(studentFeeStructure.amount.toString()) - totalPaidExcludingCurrent;

        if (updatePaymentDto.amount > remainingBalance) {
          throw new BadRequestException(
            `Updated payment amount (₹${updatePaymentDto.amount}) exceeds remaining balance (₹${remainingBalance.toFixed(2)})`,
          );
        }
      }
    }

    Object.assign(payment, updateData);
    const updatedPayment = await this.paymentsRepository.save(payment);

    // Update StudentFeeStructure status if amount or status changed
    if (updatePaymentDto.amount !== undefined || updatePaymentDto.status !== undefined) {
      const studentFeeStructure = await this.studentFeeStructureRepository.findOne({
        where: { id: payment.studentFeeStructureId },
      });
      if (studentFeeStructure) {
        await this.updateFeeStatus(studentFeeStructure);
      }
    }

    return await this.findOne(updatedPayment.id, schoolId);
  }

  async remove(id: number, schoolId?: number): Promise<void> {
    const payment = await this.findOne(id, schoolId);
    const studentFeeStructureId = payment.studentFeeStructureId;
    
    await this.paymentsRepository.remove(payment);

    // Update StudentFeeStructure status after deletion
    const studentFeeStructure = await this.studentFeeStructureRepository.findOne({
      where: { id: studentFeeStructureId },
    });
    if (studentFeeStructure) {
      await this.updateFeeStatus(studentFeeStructure);
    }
  }
}
