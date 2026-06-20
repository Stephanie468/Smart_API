import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Vérifie si l'admin existe déjà
  const existant = await prisma.utilisateur.findUnique({
    where: { email: 'SmartSanteCameroun237@gmail.com' }
  })

  if (existant) {
    console.log('✅ SuperAdmin existe déjà')
    return
  }

  const hash = await bcrypt.hash('SmartSante2026', 12)

  const admin = await prisma.utilisateur.create({
    data: {
      nom: 'Admin',
      prenom: 'Stephanie',
      email: 'SmartSanteCameroun237@gmail.com',
      telephone: '+237683641781',
      motDePasseHash: hash,
      role: 'ADMIN',
      statut: 'ACTIF',
      administrateur: {
        create: {
          niveauAcces: 1
        }
      }
    }
  })

  console.log('✅ SuperAdmin créé :', admin.email)
  console.log('📧 Email    :', 'SmartSanteCameroun237@gmail.com')
  console.log('🔑 Password : SmartSante2026')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())