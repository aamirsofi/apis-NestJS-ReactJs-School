import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FeeGenerationService } from './fee-generation.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School, SchoolStatus } from '../schools/entities/school.entity';
import { AcademicYear } from '../academic-years/entities/academic-year.entity';

@Injectable()
export class FeeGenerationScheduler {
  private readonly logger = new Logger(FeeGenerationScheduler.name);

  constructor(
    private readonly feeGenerationService: FeeGenerationService,
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
    @InjectRepository(AcademicYear)
    private readonly academicYearRepository: Repository<AcademicYear>,
  ) {}

  /**
   * Run monthly fee generation on the 1st of each month at 2 AM
   */
  @Cron('0 2 1 * *', {
    name: 'monthly-fee-generation',
    timeZone: 'Asia/Kolkata',
  })
  async handleMonthlyFeeGeneration() {
    this.logger.log('Starting monthly fee generation...');

    try {
      // Get all active schools
      const schools = await this.schoolRepository.find({
        where: { status: SchoolStatus.ACTIVE },
      });

      for (const school of schools) {
        try {
          // Get current academic year for the school
          const currentAcademicYear = await this.academicYearRepository.findOne({
            where: {
              schoolId: school.id,
              isCurrent: true,
            },
          });

          if (!currentAcademicYear) {
            this.logger.warn(`No current academic year found for school ${school.id}`);
            continue;
          }

          this.logger.log(
            `Generating fees for school ${school.id}, academic year ${currentAcademicYear.id}`,
          );

          await this.feeGenerationService.generateMonthlyFees(
            school.id,
            currentAcademicYear.id,
          );

          this.logger.log(`Successfully generated fees for school ${school.id}`);
        } catch (error: any) {
          this.logger.error(
            `Error generating fees for school ${school.id}: ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.log('Monthly fee generation completed');
    } catch (error: any) {
      this.logger.error(`Error in monthly fee generation: ${error.message}`, error.stack);
    }
  }
}

