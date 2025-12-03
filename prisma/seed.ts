import { PrismaClient, Role, RoomRole } from "@prisma/client";
import { hashPassword } from "./../src/utils/password.utils";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ---- Admin user ----
  const adminPassword = await hashPassword("admin123");

  const admin = await prisma.user.upsert({
    where: { email: "admin@chat.com" },
    update: {},
    create: {
      email: "admin@chat.com",
      username: "admin",
      password: adminPassword,
      displayName: "Admin User",
      role: Role.ADMIN,
      avatarUrl:
        "https://ui-avatars.com/api/?name=Admin+User&background=random",
    },
  });

  // ---- Test users ----
  const userPassword = await hashPassword("password123");

  const user1 = await prisma.user.upsert({
    where: { email: "john@example.com" },
    update: {},
    create: {
      email: "john@example.com",
      username: "john_doe",
      password: userPassword,
      displayName: "John Doe",
      avatarUrl: "https://ui-avatars.com/api/?name=John+Doe&background=random",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "jane@example.com" },
    update: {},
    create: {
      email: "jane@example.com",
      username: "jane_smith",
      password: userPassword, // 👈
      displayName: "Jane Smith",
      avatarUrl:
        "https://ui-avatars.com/api/?name=Jane+Smith&background=random",
    },
  });

  // ---- Rooms ----
  const generalRoom = await prisma.room.upsert({
    where: { slug: "general" },
    update: {},
    create: {
      name: "General",
      slug: "general",
      description: "General discussion room",
      isPrivate: false,
      createdById: admin.id,
    },
  });

  const teamRoom = await prisma.room.upsert({
    where: { slug: "team-alpha" },
    update: {},
    create: {
      name: "Team Alpha",
      slug: "team-alpha",
      description: "Private team workspace",
      isPrivate: true,
      createdById: admin.id,
    },
  });

  // ---- Memberships ----
  await prisma.membership.createMany({
    data: [
      {
        userId: admin.id,
        roomId: generalRoom.id,
        role: RoomRole.CREATOR,
      },
      {
        userId: user1.id,
        roomId: generalRoom.id,
        role: RoomRole.MEMBER,
      },
      {
        userId: user2.id,
        roomId: generalRoom.id,
        role: RoomRole.MEMBER,
      },
      {
        userId: admin.id,
        roomId: teamRoom.id,
        role: RoomRole.CREATOR,
      },
      {
        userId: user1.id,
        roomId: teamRoom.id,
        role: RoomRole.MEMBER,
      },
    ],
  });

  // ---- Sample messages ----
  await prisma.message.createMany({
    data: [
      {
        content: "Welcome to the General room!",
        roomId: generalRoom.id,
        senderId: admin.id,
      },
      {
        content: "Hey everyone! Happy to be here.",
        roomId: generalRoom.id,
        senderId: user1.id,
      },
      {
        content: "Hello team!",
        roomId: generalRoom.id,
        senderId: user2.id,
      },
    ],
  });

  console.log("Database seeded successfully!");
  console.log({ admin, user1, user2, generalRoom, teamRoom });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
