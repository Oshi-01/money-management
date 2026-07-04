import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany()
  if (users.length === 0) {
    console.log('No users found in database.')
    return
  }
  
  const user = users[0] // just get the first user
  console.log(`Found user: ${user.email} (ID: ${user.id})`)
  
  const defaultCategories = [
    { name: "Salary", type: "INCOME" },
    { name: "Investments", type: "INCOME" },
    { name: "Housing", type: "EXPENSE" },
    { name: "Groceries", type: "EXPENSE" },
    { name: "Utilities", type: "EXPENSE" },
    { name: "Transportation", type: "EXPENSE" },
    { name: "Dining Out", type: "EXPENSE" },
    { name: "Entertainment", type: "EXPENSE" },
    { name: "Shopping", type: "EXPENSE" },
  ]
  
  let added = 0
  for (const cat of defaultCategories) {
    // check if it exists
    const exists = await prisma.category.findFirst({
      where: { userId: user.id, name: cat.name, type: cat.type }
    })
    
    if (!exists) {
      await prisma.category.create({
        data: {
          name: cat.name,
          type: cat.type,
          userId: user.id
        }
      })
      added++
    }
  }
  
  console.log(`Successfully added ${added} categories for ${user.email}`)
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
