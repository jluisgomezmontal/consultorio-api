import prisma from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';

class PacienteService {
  /**
   * Get all pacientes with pagination and search
   */
  async getAllPacientes(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [pacientes, total] = await Promise.all([
      prisma.paciente.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.paciente.count({ where }),
    ]);

    return { pacientes, total, page, limit };
  }

  /**
   * Get paciente by ID
   */
  async getPacienteById(id) {
    const paciente = await prisma.paciente.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            citas: true,
          },
        },
      },
    });

    if (!paciente) {
      throw new NotFoundError('Paciente not found');
    }

    return paciente;
  }

  /**
   * Create new paciente
   */
  async createPaciente(data) {
    const paciente = await prisma.paciente.create({
      data,
    });

    return paciente;
  }

  /**
   * Update paciente
   */
  async updatePaciente(id, data) {
    const paciente = await prisma.paciente.findUnique({
      where: { id },
    });

    if (!paciente) {
      throw new NotFoundError('Paciente not found');
    }

    const updatedPaciente = await prisma.paciente.update({
      where: { id },
      data,
    });

    return updatedPaciente;
  }

  /**
   * Delete paciente
   */
  async deletePaciente(id) {
    const paciente = await prisma.paciente.findUnique({
      where: { id },
    });

    if (!paciente) {
      throw new NotFoundError('Paciente not found');
    }

    await prisma.paciente.delete({
      where: { id },
    });

    return { message: 'Paciente deleted successfully' };
  }

  /**
   * Get paciente medical history with all citas
   */
  async getPacienteHistory(id) {
    const paciente = await prisma.paciente.findUnique({
      where: { id },
      include: {
        citas: {
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            consultorio: {
              select: {
                id: true,
                name: true,
              },
            },
            pagos: true,
          },
          orderBy: {
            date: 'desc',
          },
        },
      },
    });

    if (!paciente) {
      throw new NotFoundError('Paciente not found');
    }

    return paciente;
  }

  /**
   * Search pacientes by name, phone, or email
   */
  async searchPacientes(query) {
    const pacientes = await prisma.paciente.findMany({
      where: {
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });

    return pacientes;
  }
}

export default new PacienteService();
