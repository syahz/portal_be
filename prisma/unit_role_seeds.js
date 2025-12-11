require('dotenv/config')
const { PrismaClient } = require('@prisma/client')
const { PrismaMariaDb } = require('@prisma/adapter-mariadb')
const bcrypt = require('bcrypt')

function createAdapter(urlString) {
  const url = new URL(urlString)
  const host = url.hostname
  const port = url.port ? Number(url.port) : 3306
  const user = decodeURIComponent(url.username)
  const password = decodeURIComponent(url.password)
  const database = url.pathname.replace(/^\//, '') || undefined
  return new PrismaMariaDb({ host, port, user, password, database })
}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL not set')
}

const adapter = createAdapter(databaseUrl)
const prisma = new PrismaClient({ adapter })

// === Data Role (Tidak berubah) ===
const rolesToSeed = [
  { name: 'Staff' },
  { name: 'Manajer' },
  { name: 'General Manajer' },
  { name: 'Staff' },
  { name: 'Kepala Divisi' },
  { name: 'Direktur Operasional' },
  { name: 'Direktur Keuangan' },
  { name: 'Direktur Utama' },
  { name: 'Admin' }
]

const divisionsToSeed = [
  { name: 'Human Resources' },
  { name: 'Administration' },
  { name: 'Finance' },
  { name: 'Operational' },
  { name: 'General Affair' },
  { name: 'Media Social' },
  { name: 'IT Support' }
]

// === Data Unit (Tidak berubah) ===
const unitsToSeed = [
  { code: 'HO', name: 'Head Office' },
  { code: 'UBGH', name: 'UB Guest House' },
  { code: 'GBA', name: 'Griya Brawijaya' },
  { code: 'UBC', name: 'UB Coffee' },
  { code: 'BLC', name: 'Brawijaya Language Center' },
  { code: 'UBK', name: 'UB Kantin' },
  { code: 'UBSC', name: 'UB Sport Center' },
  { code: 'UMC', name: 'UB Merchandise & Creative' },
  { code: 'BCR', name: 'Brawijaya Catering' },
  { code: 'LPH', name: 'Lembaga Pemeriksa Halal Universitas Brawijaya' },
  { code: 'BTT', name: 'Brawijaya Tour & Travel' },
  { code: 'BST', name: 'Brawijaya Science & Technology' },
  { code: 'BPA', name: 'Brawijaya Property and Advertising' },
  { code: 'BOS', name: 'Brawijaya Outsourcing' },
  { code: 'AGRO', name: 'Depo Agro' }
]

// === Data Client App (Baru) ===
const clientAppsToSeed = [
  {
    name: 'Feedback System',
    description: 'Internal feedback portal application',
    clientId: 'app_feedback',
    clientSecret: 'secret_key_feedback',
    redirectUri: 'http://localhost:3000/api/auth/callback',
    dashboardUrl: 'http://localhost:3000/dashboard'
  }
]

// === Seeder Role (Tidak berubah) ===
async function seedRoles() {
  console.log('Seeding roles...')
  for (const roleData of rolesToSeed) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: { name: roleData.name }
    })
  }
  console.log('Roles seeded successfully.')
}

async function seedDivisions() {
  console.log('Seeding divisions...')
  for (const divisionData of divisionsToSeed) {
    await prisma.division.upsert({
      where: { name: divisionData.name },
      update: {},
      create: { name: divisionData.name }
    })
  }
  console.log('Divisions seeded successfully.')
}

// === Seeder Unit (Tidak berubah) ===
async function seedUnits() {
  console.log('Seeding units...')
  for (const unitData of unitsToSeed) {
    await prisma.unit.upsert({
      where: { code: unitData.code },
      update: { name: unitData.name },
      create: {
        code: unitData.code,
        name: unitData.name
      }
    })
  }
  console.log('Units seeded successfully.')
}

// === Seeder Client Apps (Baru) ===
async function seedClientApps() {
  console.log('Seeding client apps...')
  for (const appData of clientAppsToSeed) {
    await prisma.clientApp.upsert({
      where: { clientId: appData.clientId },
      update: {
        name: appData.name,
        description: appData.description,
        clientSecret: appData.clientSecret,
        redirectUri: appData.redirectUri,
        dashboardUrl: appData.dashboardUrl
      },
      create: {
        name: appData.name,
        description: appData.description,
        clientId: appData.clientId,
        clientSecret: appData.clientSecret,
        redirectUri: appData.redirectUri,
        dashboardUrl: appData.dashboardUrl
      }
    })
  }
  console.log('Client apps seeded successfully.')
}

// NOTE: Procurement models were removed from schema. No procurement seeding here.

// === Seeder Admin User (Tidak berubah) ===
async function seedAdminUser() {
  console.log('Seeding admin user...')

  const adminRole = await prisma.role.findUnique({
    where: { name: 'Admin' }
  })
  if (!adminRole) throw new Error('Role Admin belum ada.')

  const hoUnit = await prisma.unit.findUnique({
    where: { code: 'HO' }
  })
  if (!hoUnit) throw new Error('Unit HO belum ada.')

  const divisionAdmin = await prisma.division.findUnique({
    where: {
      name: 'IT Support'
    }
  })
  if (!divisionAdmin) throw new Error('Unit IT belum ada')
  const hashedPassword = await bcrypt.hash('admin123', 10)

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Administrator',
      password: hashedPassword,
      roleId: adminRole.id,
      unitId: hoUnit.id,
      divisionId: divisionAdmin.id
    }
  })

  console.log('Admin user seeded successfully.')

  // === Grant admin access to all client apps ===
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@example.com' } })
  const apps = await prisma.clientApp.findMany()
  for (const app of apps) {
    await prisma.userAppAccess.upsert({
      where: { userId_appId: { userId: adminUser.id, appId: app.id } },
      update: {},
      create: { userId: adminUser.id, appId: app.id }
    })
  }
  console.log('Admin access to client apps seeded successfully.')
}

// === Main Runner (Tidak berubah) ===
async function main() {
  await seedRoles()
  await seedDivisions()
  await seedUnits()
  await seedClientApps()
  await seedAdminUser()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
