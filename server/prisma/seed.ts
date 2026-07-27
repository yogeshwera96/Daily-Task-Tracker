import { PrismaClient, Role, TaskStatus, TaskPriority, ProjectStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.emailLog.deleteMany();
  await prisma.aiLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.eodReport.deleteMany();
  await prisma.taskAttachment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectAssignment.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  const hashedPassword = await bcrypt.hash('Password@123', 12);

  // --- Departments ---
  const engineering = await prisma.department.create({
    data: { name: 'Engineering', description: 'Software Engineering Department' },
  });
  const design = await prisma.department.create({
    data: { name: 'Design', description: 'UI/UX Design Department' },
  });
  const qa = await prisma.department.create({
    data: { name: 'Quality Assurance', description: 'QA & Testing Department' },
  });

  // --- Admin ---
  const admin = await prisma.user.create({
    data: {
      email: 'admin@tasktracker.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
      emailVerified: true,
      designation: 'System Administrator',
    },
  });

  // --- Managers ---
  const manager1 = await prisma.user.create({
    data: {
      email: 'john.manager@tasktracker.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Smith',
      role: Role.MANAGER,
      emailVerified: true,
      designation: 'Engineering Manager',
      departmentId: engineering.id,
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      email: 'sarah.manager@tasktracker.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: Role.MANAGER,
      emailVerified: true,
      designation: 'Design Lead',
      departmentId: design.id,
    },
  });

  // Update departments with managers
  await prisma.department.update({ where: { id: engineering.id }, data: { managerId: manager1.id } });
  await prisma.department.update({ where: { id: design.id }, data: { managerId: manager2.id } });

  // --- Developers ---
  const dev1 = await prisma.user.create({
    data: {
      email: 'alice.dev@tasktracker.com',
      password: hashedPassword,
      firstName: 'Alice',
      lastName: 'Williams',
      role: Role.DEVELOPER,
      emailVerified: true,
      designation: 'Senior Frontend Developer',
      departmentId: engineering.id,
      managerId: manager1.id,
    },
  });

  const dev2 = await prisma.user.create({
    data: {
      email: 'bob.dev@tasktracker.com',
      password: hashedPassword,
      firstName: 'Bob',
      lastName: 'Brown',
      role: Role.DEVELOPER,
      emailVerified: true,
      designation: 'Backend Developer',
      departmentId: engineering.id,
      managerId: manager1.id,
    },
  });

  const dev3 = await prisma.user.create({
    data: {
      email: 'carol.dev@tasktracker.com',
      password: hashedPassword,
      firstName: 'Carol',
      lastName: 'Davis',
      role: Role.DEVELOPER,
      emailVerified: true,
      designation: 'UI/UX Designer',
      departmentId: design.id,
      managerId: manager2.id,
    },
  });

  // --- Projects ---
  const project1 = await prisma.project.create({
    data: {
      name: 'E-Commerce Platform',
      description: 'Full-stack e-commerce application with payment integration',
      status: ProjectStatus.ACTIVE,
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-09-30'),
      managerId: manager1.id,
      departmentId: engineering.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App Redesign',
      description: 'Complete redesign of the mobile application UI/UX',
      status: ProjectStatus.ACTIVE,
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-08-31'),
      managerId: manager2.id,
      departmentId: design.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'API Gateway',
      description: 'Centralized API gateway for microservices architecture',
      status: ProjectStatus.ACTIVE,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-12-31'),
      managerId: manager1.id,
      departmentId: engineering.id,
    },
  });

  // --- Project Assignments ---
  await prisma.projectAssignment.createMany({
    data: [
      { userId: dev1.id, projectId: project1.id, role: 'LEAD' },
      { userId: dev2.id, projectId: project1.id, role: 'DEVELOPER' },
      { userId: dev2.id, projectId: project3.id, role: 'LEAD' },
      { userId: dev3.id, projectId: project2.id, role: 'LEAD' },
    ],
  });

  // --- Tasks for today ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.task.createMany({
    data: [
      {
        title: 'Implement product search API',
        description: 'Build full-text search with filters for the product catalog',
        priority: TaskPriority.HIGH,
        status: TaskStatus.COMPLETED,
        category: 'Backend',
        module: 'Search',
        estimatedHours: 4,
        actualHours: 3.5,
        assignedDate: today,
        completionDate: new Date(),
        userId: dev1.id,
        projectId: project1.id,
        tags: 'api,search,elasticsearch',
      },
      {
        title: 'Fix cart total calculation bug',
        description: 'Cart total not updating when applying discount codes',
        priority: TaskPriority.CRITICAL,
        status: TaskStatus.IN_PROGRESS,
        category: 'Bug Fix',
        module: 'Cart',
        estimatedHours: 2,
        actualHours: 1.5,
        assignedDate: today,
        userId: dev1.id,
        projectId: project1.id,
        tags: 'bug,cart,urgent',
      },
      {
        title: 'Design checkout flow wireframes',
        description: 'Create wireframes for the new 3-step checkout process',
        priority: TaskPriority.HIGH,
        status: TaskStatus.COMPLETED,
        category: 'Design',
        module: 'Checkout',
        estimatedHours: 6,
        actualHours: 5,
        assignedDate: today,
        completionDate: new Date(),
        userId: dev3.id,
        projectId: project2.id,
        tags: 'design,wireframe,checkout',
      },
      {
        title: 'Set up API rate limiting',
        description: 'Implement rate limiting middleware for all public API endpoints',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        category: 'Backend',
        module: 'Security',
        estimatedHours: 3,
        assignedDate: today,
        userId: dev2.id,
        projectId: project3.id,
        tags: 'security,middleware',
      },
      {
        title: 'Write unit tests for auth service',
        description: 'Achieve 90% code coverage for the authentication service',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.BLOCKED,
        category: 'Testing',
        module: 'Auth',
        estimatedHours: 4,
        assignedDate: today,
        remarks: 'Blocked: Waiting for auth service refactoring to be merged',
        userId: dev2.id,
        projectId: project3.id,
        tags: 'testing,auth',
      },
    ],
  });

  // --- Default Settings ---
  await prisma.setting.createMany({
    data: [
      { key: 'eod_time', value: '18:00', label: 'EOD Generation Time', category: 'REMINDER' },
      { key: 'reminder_time', value: '17:00', label: 'Reminder Time', category: 'REMINDER' },
      { key: 'ai_model', value: 'gpt-4o-mini', label: 'AI Model', category: 'AI' },
      { key: 'ai_enabled', value: 'true', label: 'Enable AI Features', category: 'AI' },
      { key: 'smtp_host', value: 'smtp.gmail.com', label: 'SMTP Host', category: 'SMTP' },
      { key: 'smtp_port', value: '587', label: 'SMTP Port', category: 'SMTP' },
      { key: 'company_name', value: 'Acme Corp', label: 'Company Name', category: 'GENERAL' },
      { key: 'working_hours', value: '8', label: 'Standard Working Hours', category: 'GENERAL' },
      { key: 'auto_eod', value: 'true', label: 'Auto Generate EOD', category: 'GENERAL' },
    ],
  });

  // --- Holidays ---
  await prisma.holiday.createMany({
    data: [
      { name: 'New Year', date: new Date('2026-01-01'), isRecurring: true },
      { name: 'Independence Day', date: new Date('2026-08-15'), isRecurring: true },
      { name: 'Christmas', date: new Date('2026-12-25'), isRecurring: true },
      { name: 'Republic Day', date: new Date('2026-01-26'), isRecurring: true },
      { name: 'Diwali', date: new Date('2026-10-20'), isRecurring: false },
    ],
  });

  console.log('✅ Seed data created successfully!');
  console.log('');
  console.log('📧 Login Credentials (Password: Password@123):');
  console.log('   Admin:     admin@tasktracker.com');
  console.log('   Manager 1: john.manager@tasktracker.com');
  console.log('   Manager 2: sarah.manager@tasktracker.com');
  console.log('   Dev 1:     alice.dev@tasktracker.com');
  console.log('   Dev 2:     bob.dev@tasktracker.com');
  console.log('   Dev 3:     carol.dev@tasktracker.com');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
