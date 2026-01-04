import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req: any) {
    try {
      // req.user comes from JWT strategy validate() method
      // It contains: { id, email, role, schoolId }
      if (!req.user || !req.user.id) {
        throw new Error('User not found in request');
      }

      // Try to fetch full user profile from database
      try {
        const fullUser = await this.authService.getUserProfile(req.user.id);
        return fullUser;
      } catch (error: any) {
        // If fetching fails, return the JWT payload as fallback
        console.warn('Could not fetch full user profile, returning JWT payload:', error?.message);
        return {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
          schoolId: req.user.schoolId,
        };
      }
    } catch (error: any) {
      console.error('Error in getProfile:', error);
      // Return a safe fallback
      return req.user || {};
    }
  }
}
