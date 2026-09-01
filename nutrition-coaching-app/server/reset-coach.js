import bcrypt from "bcryptjs";
import prisma from "./src/config/db.js";

async function main() {
  const hashedPassword = await bcrypt.hash("Pass123456", 10);

  // Update existing coach or create one if none exists
  const coach = await prisma.user.upsert({
    where: { email: "coach@test.com" },
    update: {
      password: hashedPassword,
      role: "COACH",
    },
    create: {
      name: "Abbas Coach",
      email: "coach@test.com",
      password: hashedPassword,
      role: "COACH",
    },
  });

  console.log("\n=================================");
  console.log(" Coach Account Ready:");
  console.log(` Email:    ${coach.email}`);
  console.log(" Password: Pass123456");
  console.log(` Role:     ${coach.role}`);
  console.log("=================================\n");
}

main()
  .catch((e) => {
    console.error("Error setting up coach account:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });