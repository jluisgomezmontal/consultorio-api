import pdfService from '../services/pdf.service.js';
import Cita from '../models/Cita.model.js';
import Consultorio from '../models/Consultorio.model.js';
import User from '../models/User.model.js';
import Paciente from '../models/Paciente.model.js';
import { NotFoundError } from '../utils/errors.js';

class RecetaController {
  /**
   * Generate prescription PDF
   */
  async generateReceta(req, res, next) {
    try {
      const { citaId, diagnostico, medicamentos, indicaciones } = req.body;
      const userId = req.user.id;

      const cita = await Cita.findById(citaId).lean();
      if (!cita) {
        throw new NotFoundError('Cita not found');
      }

      const consultorio = await Consultorio.findById(cita.consultorioId).lean();
      const doctor = await User.findById(cita.doctorId).lean();
      const paciente = await Paciente.findById(cita.pacienteId).lean();

      if (!consultorio || !doctor || !paciente) {
        throw new NotFoundError('Missing required data');
      }

      if (doctor._id.toString() !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You can only generate prescriptions for your own appointments',
        });
      }

      const prescriptionData = {
        consultorio: {
          name: consultorio.name,
          address: consultorio.address,
          phone: consultorio.phone,
          imageUrl: consultorio.imageUrl || null,
        },
        doctor: {
          name: doctor.name,
          email: doctor.email,
        },
        paciente: {
          fullName: paciente.fullName,
          age: paciente.age,
          gender: paciente.gender,
        },
        cita: {
          date: cita.date,
          time: cita.time,
          motivo: cita.motivo,
          diagnostico: cita.diagnostico,
          tratamiento: cita.tratamiento,
          notas: cita.notas,
        },
        diagnostico,
        medicamentos,
        indicaciones,
        fecha: new Date().toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      };

      const templateName = consultorio.recetaTemplate || 'classic';
      const pdfBuffer = await pdfService.generatePrescriptionPDF(prescriptionData, templateName);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=receta-${paciente.fullName.replace(/\s/g, '_')}-${Date.now()}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Preview template (returns HTML for preview)
   */
  async previewTemplate(req, res, next) {
    try {
      const { templateName = 'classic' } = req.query;

      const sampleData = {
        consultorio: {
          name: 'Consultorio Médico Ejemplo',
          address: 'Av. Principal 123, Col. Centro',
          phone: '+52 555 1234567',
          imageUrl: '',
        },
        doctor: {
          name: 'Dr. Juan Pérez García',
          email: 'doctor@example.com',
        },
        paciente: {
          fullName: 'María González López',
          age: '35',
          gender: 'Femenino',
        },
        diagnostico: 'Infección de vías respiratorias superiores',
        medicamentos: [
          {
            nombre: 'Amoxicilina 500mg',
            dosis: '1 tableta',
            frecuencia: 'Cada 8 horas',
            duracion: '7 días',
            indicaciones: 'Tomar con alimentos',
          },
          {
            nombre: 'Paracetamol 500mg',
            dosis: '1 tableta',
            frecuencia: 'Cada 6 horas',
            duracion: '5 días',
            indicaciones: 'En caso de fiebre o dolor',
          },
        ],
        indicaciones: 'Reposo relativo, abundantes líquidos, evitar cambios bruscos de temperatura. Regresar a consulta si persisten los síntomas después de 5 días.',
        fecha: new Date().toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      };

      const template = pdfService.getTemplate(templateName);
      const html = pdfService.populateTemplate(template, sampleData);

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      next(error);
    }
  }
}

export default new RecetaController();
