import dataSource from '../database/data-source';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../user-roles/entities/user-role.entity';

async function updateUserRoles() {
  await dataSource.initialize();

  const userRepository = dataSource.getRepository(User);
  const roleRepository = dataSource.getRepository(UserRole);

  // Get all users
  const users = await userRepository.find({
    relations: ['role'],
  });

  console.log(`Found ${users.length} users to check`);

  // Get all roles
  const roles = await roleRepository.find();
  const roleMap = new Map(roles.map(r => [r.name, r.id]));

  console.log('\nAvailable roles:');
  roles.forEach(role => {
    console.log(`  - ${role.name} (id: ${role.id})`);
  });

  let updated = 0;
  let skipped = 0;

  for (const user of users) {
    const email = user.email.toLowerCase();
    const currentRoleName = user.role?.name || 'unknown';
    let targetRoleName: string | undefined;
    let targetRoleId: number | undefined;

    // Determine target role based on email patterns
    // Super admin patterns - check first
    if (email === 'su@admin.com' || email.includes('su@admin') || email.includes('super_admin')) {
      targetRoleName = 'super_admin';
      targetRoleId = roleMap.get('super_admin');
    }
    // Administrator patterns (admin@*.school, admin@*.com)
    else if (email.startsWith('admin@') || email.includes('@admin')) {
      targetRoleName = 'administrator';
      targetRoleId = roleMap.get('administrator');
    }
    // Accountant patterns
    else if (email.includes('accountant') || email.includes('acc@')) {
      targetRoleName = 'accountant';
      targetRoleId = roleMap.get('accountant');
    }
    // Parent patterns
    else if (email.includes('parent') || email.includes('@parent')) {
      targetRoleName = 'parent';
      targetRoleId = roleMap.get('parent');
    }
    // Default to student for other emails
    else {
      targetRoleName = 'student';
      targetRoleId = roleMap.get('student');
    }

    // Check if role needs to be updated
    if (!targetRoleId) {
      console.log(`❌ User ${user.email} - target role '${targetRoleName}' not found, skipping`);
      skipped++;
      continue;
    }

    // Update if role is different
    if (currentRoleName !== targetRoleName) {
      user.roleId = targetRoleId;
      await userRepository.save(user);
      console.log(`✅ User ${user.email} - updated from '${currentRoleName}' to '${targetRoleName}' (roleId: ${targetRoleId})`);
      updated++;
    } else {
      console.log(`⏭️  User ${user.email} - already has correct role '${currentRoleName}'`);
    }
  }

  console.log(`\n✅ Updated ${updated} users`);
  console.log(`⏭️  Skipped ${skipped} users (no changes needed or errors)`);

  await dataSource.destroy();
  process.exit(0);
}

updateUserRoles().catch(error => {
  console.error('Error updating user roles:', error);
  process.exit(1);
});

