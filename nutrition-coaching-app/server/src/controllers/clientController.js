import prisma from '../config/db.js';

export const getClients = async (req, res) => {
  try {
    const clients = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({ clients });
  } catch (error) {
    console.error('Prisma fetch clients error:', error);
    res.status(500).json({ message: error.message });
  }
};