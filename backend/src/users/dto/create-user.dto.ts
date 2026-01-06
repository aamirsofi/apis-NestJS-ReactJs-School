import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'su@admin.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'admin123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ 
    example: 'student', 
    enum: ['super_admin', 'administrator', 'accountant', 'student', 'parent'],
    required: false 
  })
  @IsOptional()
  @IsIn(['super_admin', 'administrator', 'accountant', 'student', 'parent'])
  role?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  schoolId?: number;
}
