import dataSource from '../database/data-source';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../user-roles/entities/user-role.entity';

async function fixUserRoles() {
  await dataSource.initialize();

  const userRepository = dataSource.getRepository(User);
  const roleRepository = dataSource.getRepository(UserRole);

  // Get all users without roleId
  const usersWithoutRole = await userRepository.find({
    where: { roleId: null as any },
    relations: ['role'],
  });

  console.log(`Found ${usersWithoutRole.length} users without roleId`);

  if (usersWithoutRole.length === 0) {
    console.log('✅ All users have roleId assigned');
    await dataSource.destroy();
    return;
  }

  // Get all roles
  const roles = await roleRepository.find();
  const roleMap = new Map(roles.map(r => [r.name, r.id]));

  // Default to student role if we can't determine the role
  const defaultRoleId = roleMap.get('student');

  if (!defaultRoleId) {
    console.error('❌ Student role not found! Please ensure user_roles table is properly initialized.');
    await dataSource.destroy();
    return;
  }

  let fixed = 0;
  let skipped = 0;

  for (const user of usersWithoutRole) {
    // Try to get role from the relation if it exists (for backward compatibility)
    let roleId: number | undefined;
    let roleName: string | undefined;

    // Check if user has a role relation (from old enum data that might still be in memory)
    if (user.role && typeof user.role === 'object' && 'name' in user.role) {
      const existingRoleName = (user.role as any).name;
      if (existingRoleName) {
        roleName = existingRoleName;
        roleId = roleMap.get(existingRoleName);
      }
    }

    // If still no roleId, try to infer from email patterns
    if (!roleId) {
      const email = user.email.toLowerCase();
      
      // Super admin patterns
      if (email.includes('su@admin') || email === 'su@admin.com' || email.includes('super_admin')) {
        roleName = 'super_admin';
        roleId = roleMap.get('super_admin');
      }
      // Administrator patterns (admin@*.school, admin@*.com)
      else if (email.includes('admin@') || email.startsWith('admin@')) {
        roleName = 'administrator';
        roleId = roleMap.get('administrator');
      }
      // Accountant patterns
      else if (email.includes('accountant') || email.includes('acc@')) {
        roleName = 'accountant';
        roleId = roleMap.get('accountant');
      }
      // Parent patterns
      else if (email.includes('parent') || email.includes('@parent')) {
        roleName = 'parent';
        roleId = roleMap.get('parent');
      }
      // Default to student
      else {
        roleName = 'student';
        roleId = defaultRoleId;
      }
    }

    if (!roleId) {
      console.log(`❌ User ${user.email} - could not determine role, skipping`);
      skipped++;
      continue;
    }

    user.roleId = roleId;
    await userRepository.save(user);
    console.log(`✅ User ${user.email} - assigned '${roleName}' role (roleId: ${roleId})`);
    fixed++;
  }

  console.log(`\n✅ Fixed ${fixed} users`);
  console.log(`⏭️  Skipped ${skipped} users`);

  await dataSource.destroy();
  process.exit(0);
}

fixUserRoles().catch(error => {
  console.error('Error fixing user roles:', error);
  process.exit(1);
});

