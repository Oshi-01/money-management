import prisma from "./lib/prisma";

async function main() {
  const users = await prisma.user.findMany();
  if (users.length === 0) {
    console.log("No users found in database.");
    return;
  }
  
  const user = users[0]; // just get the first user
  console.log(`Found user: ${user.email} (ID: ${user.id})`);
  
  const defaultCategories = [
    { name: "Salary", type: "INCOME" as const },
    { name: "Investments", type: "INCOME" as const },
    { name: "Housing", type: "EXPENSE" as const },
    { name: "Groceries", type: "EXPENSE" as const },
    { name: "Utilities", type: "EXPENSE" as const },
    { name: "Transportation", type: "EXPENSE" as const },
    { name: "Dining Out", type: "EXPENSE" as const },
    { name: "Entertainment", type: "EXPENSE" as const },
    { name: "Shopping", type: "EXPENSE" as const },
  ];
  
  let added = 0;
  for (const cat of defaultCategories) {
    // check if it exists
    const exists = await prisma.category.findFirst({
      where: { userId: user.id, name: cat.name, type: cat.type }
    });
    
    if (!exists) {
      await prisma.category.create({
        data: {
          name: cat.name,
          type: cat.type,
          userId: user.id
        }
      });
      added++;
    }
  }
  
  console.log(`Successfully added ${added} categories for ${user.email}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
