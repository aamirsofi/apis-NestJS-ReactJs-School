import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeStructure } from './entities/fee-structure.entity';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { UpdateFeeStructureDto } from './dto/update-fee-structure.dto';
import { RoutePrice, RoutePriceStatus } from '../route-prices/entities/route-price.entity';

@Injectable()
export class FeeStructuresService {
  constructor(
    @InjectRepository(FeeStructure)
    private feeStructuresRepository: Repository<FeeStructure>,
    @InjectRepository(RoutePrice)
    private routePriceRepository: Repository<RoutePrice>,
  ) {}

  async create(
    createFeeStructureDto: CreateFeeStructureDto,
    schoolId: number,
  ): Promise<FeeStructure> {
    // Validate that transport fees are not created in fee_structures
    // Transport fees should use route_prices instead
    const feeCategory = await this.feeStructuresRepository.manager
      .getRepository('FeeCategory')
      .findOne({
        where: { id: createFeeStructureDto.feeCategoryId },
      });
    
    if (feeCategory && feeCategory.type === 'transport') {
      throw new BadRequestException(
        'Transport fees cannot be created as fee structures. ' +
        'Please use Route Prices instead (Settings > Fee Settings > Route Prices). ' +
        'Transport fees are now managed through route_prices table based on route, class, and category head.'
      );
    }
    
    const feeStructure = this.feeStructuresRepository.create({
      ...createFeeStructureDto,
      schoolId,
      dueDate: createFeeStructureDto.dueDate ? new Date(createFeeStructureDto.dueDate) : undefined,
    });
    return await this.feeStructuresRepository.save(feeStructure);
  }

  async findAll(
    schoolId?: number,
    classId?: number,
    categoryHeadId?: number,
    status?: string,
  ): Promise<FeeStructure[]> {
    const queryBuilder = this.feeStructuresRepository.createQueryBuilder('feeStructure')
      .leftJoinAndSelect('feeStructure.school', 'school')
      .leftJoinAndSelect('feeStructure.category', 'category')
      .leftJoinAndSelect('feeStructure.class', 'class')
      .leftJoinAndSelect('feeStructure.categoryHead', 'categoryHead');

    if (schoolId) {
      queryBuilder.where('feeStructure.schoolId = :schoolId', { schoolId });
    }

    if (classId) {
      if (schoolId) {
        queryBuilder.andWhere('feeStructure.classId = :classId', { classId });
      } else {
        queryBuilder.where('feeStructure.classId = :classId', { classId });
      }
    }

    if (categoryHeadId) {
      const condition = schoolId || classId ? 'andWhere' : 'where';
      queryBuilder[condition]('feeStructure.categoryHeadId = :categoryHeadId', { categoryHeadId });
    }

    if (status) {
      const condition = schoolId || classId || categoryHeadId ? 'andWhere' : 'where';
      queryBuilder[condition]('feeStructure.status = :status', { status });
    }

    queryBuilder.orderBy('feeStructure.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  async findOne(id: number, schoolId?: number): Promise<FeeStructure> {
    const where: any = { id };
    if (schoolId) {
      where.schoolId = schoolId;
    }
    const feeStructure = await this.feeStructuresRepository.findOne({
      where,
      relations: ['school', 'category', 'class', 'categoryHead'],
    });

    if (!feeStructure) {
      throw new NotFoundException(`Fee structure with ID ${id} not found`);
    }

    return feeStructure;
  }

  async update(
    id: number,
    updateFeeStructureDto: UpdateFeeStructureDto,
    schoolId?: number,
  ): Promise<FeeStructure> {
    const feeStructure = await this.findOne(id, schoolId);
    const updateData: any = { ...updateFeeStructureDto };
    if (updateFeeStructureDto.dueDate) {
      updateData.dueDate = new Date(updateFeeStructureDto.dueDate);
    }
    Object.assign(feeStructure, updateData);
    return await this.feeStructuresRepository.save(feeStructure);
  }

  async remove(id: number, schoolId?: number): Promise<void> {
    const feeStructure = await this.findOne(id, schoolId);
    
    // Check if there are any student fee structures using this fee structure
    const studentFeeStructures = await this.feeStructuresRepository.manager
      .createQueryBuilder('StudentFeeStructure', 'sfs')
      .where('sfs.feeStructureId = :feeStructureId', { feeStructureId: id })
      .getCount();
    
    if (studentFeeStructures > 0) {
      throw new BadRequestException(
        `Cannot delete fee structure. It is being used by ${studentFeeStructures} student fee assignment(s). ` +
        `Please remove or reassign them first.`
      );
    }
    
    await this.feeStructuresRepository.remove(feeStructure);
  }

  /**
   * Find transport fee structures based on route price
   * This method finds fee structures that match a route price's categoryHeadId and classId
   * Used for transport fees that are linked to route prices
   */
  async findTransportFeeStructuresByRoutePrice(
    routeId: number,
    classId: number,
    categoryHeadId: number,
    schoolId: number,
  ): Promise<FeeStructure[]> {
    // First, verify the route price exists
    const routePrice = await this.routePriceRepository.findOne({
      where: {
        routeId,
        classId,
        categoryHeadId,
        schoolId,
        status: RoutePriceStatus.ACTIVE,
      },
    });

    if (!routePrice) {
      return []; // No route price found, return empty array
    }

    // Find fee structures that match the route price's categoryHeadId and classId
    // Also check if the fee category is of type 'transport'
    const queryBuilder = this.feeStructuresRepository
      .createQueryBuilder('feeStructure')
      .leftJoinAndSelect('feeStructure.category', 'category')
      .leftJoinAndSelect('feeStructure.categoryHead', 'categoryHead')
      .leftJoinAndSelect('feeStructure.class', 'class')
      .where('feeStructure.schoolId = :schoolId', { schoolId })
      .andWhere('feeStructure.categoryHeadId = :categoryHeadId', { categoryHeadId })
      .andWhere('feeStructure.status = :status', { status: 'active' })
      .andWhere('(feeStructure.classId = :classId OR feeStructure.classId IS NULL)', { classId })
      .andWhere("category.type = 'transport'");

    return await queryBuilder.getMany();
  }

  /**
   * Find or create transport fee structure based on route price
   * If a matching fee structure doesn't exist, this can be used to create one
   * Note: This method only finds, it doesn't create (to keep separation of concerns)
   */
  async findTransportFeeStructureByRoutePrice(
    routeId: number,
    classId: number,
    categoryHeadId: number,
    schoolId: number,
  ): Promise<FeeStructure | null> {
    const feeStructures = await this.findTransportFeeStructuresByRoutePrice(
      routeId,
      classId,
      categoryHeadId,
      schoolId,
    );

    // Return the first matching fee structure, or null if none found
    return feeStructures.length > 0 ? feeStructures[0] : null;
  }
}
