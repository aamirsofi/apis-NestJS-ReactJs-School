import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../user-roles/entities/user-role.entity';
import dataSource from '../database/data-source';

async function createAdmin() {
  await dataSource.initialize();

  const userRepository = dataSource.getRepository(User);
  const roleRepository = dataSource.getRepository(UserRole);

  // Check if admin already exists
  const existingAdmin = await userRepository.findOne({
    where: { email: 'su@admin.com' },
  });

  if (existingAdmin) {
    console.log('Admin user already exists!');
    await dataSource.destroy();
    return;
  }

  // Find super_admin role
  const superAdminRole = await roleRepository.findOne({
    where: { name: 'super_admin' },
  });

  if (!superAdminRole) {
    console.error('Super admin role not found! Please run migrations first.');
    await dataSource.destroy();
    return;
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = userRepository.create({
    name: 'Super Admin',
    email: 'su@admin.com',
    password: hashedPassword,
    roleId: superAdminRole.id,
  });

  await userRepository.save(admin);
  console.log('✅ Admin user created successfully!');
  console.log('📧 Email: su@admin.com');
  console.log('🔑 Password: admin123');
  console.log('⚠️  Please change the password after first login!');

  await dataSource.destroy();
  process.exit(0);
}

createAdmin().catch(error => {
  console.error('Error creating admin:', error);
  process.exit(1);
});
