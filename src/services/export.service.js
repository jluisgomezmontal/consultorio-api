import ExcelJS from 'exceljs';
import { Consultorio, Paciente, Cita, User, Pago, MedicationAllergy } from '../models/index.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

class ExportService {
  async exportConsultorioData(consultorioId, userId, format = 'json') {
    const consultorio = await Consultorio.findById(consultorioId).lean();
    
    if (!consultorio) {
      throw new NotFoundError('Consultorio not found');
    }

    const user = await User.findById(userId);
    if (!user || (user.role !== 'doctor' && user.role !== 'admin')) {
      throw new BadRequestError('Only doctors and admins can export data');
    }

    const hasAccess = user.consultoriosIds.some(cId => cId.toString() === consultorioId);
    if (!hasAccess && user.role !== 'admin') {
      throw new BadRequestError('You do not have access to this consultorio');
    }

    const [pacientes, citas, users, medicationAllergies, pagos] = await Promise.all([
      Paciente.find({ consultorioId }).populate('medicationAllergies').lean(),
      Cita.find({ consultorioId }).populate('pacienteId').populate('doctorId').lean(),
      User.find({ consultoriosIds: consultorioId }).lean(),
      MedicationAllergy.find({ consultorioId }).lean(),
      Pago.find({ consultorioId }).lean(),
    ]);

    const exportData = {
      consultorio: this._cleanMongoDoc(consultorio),
      pacientes: pacientes.map(p => this._cleanMongoDoc(p)),
      citas: citas.map(c => this._cleanMongoDoc(c)),
      users: users.map(u => {
        const cleaned = this._cleanMongoDoc(u);
        delete cleaned.password;
        return cleaned;
      }),
      medicationAllergies: medicationAllergies.map(m => this._cleanMongoDoc(m)),
      pagos: pagos.map(p => this._cleanMongoDoc(p)),
      exportDate: new Date().toISOString(),
      version: '1.0',
    };

    if (format === 'json') {
      return {
        data: exportData,
        filename: `consultorio-${consultorio.name.replace(/\s+/g, '-')}-${Date.now()}.json`,
        contentType: 'application/json',
      };
    } else if (format === 'excel') {
      const buffer = await this._generateExcel(exportData);
      return {
        data: buffer,
        filename: `consultorio-${consultorio.name.replace(/\s+/g, '-')}-${Date.now()}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }

    throw new BadRequestError('Invalid format. Use "json" or "excel"');
  }

  _cleanMongoDoc(doc) {
    if (!doc) return doc;
    const { _id, __v, ...rest } = doc;
    return {
      id: _id?.toString(),
      ...rest,
    };
  }

  async _generateExcel(data) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Consultorio';
    workbook.created = new Date();

    this._addConsultorioSheet(workbook, data.consultorio);
    this._addPacientesSheet(workbook, data.pacientes);
    this._addCitasSheet(workbook, data.citas);
    this._addUsersSheet(workbook, data.users);
    this._addMedicationAllergiesSheet(workbook, data.medicationAllergies);
    this._addPagosSheet(workbook, data.pagos);

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  _addConsultorioSheet(workbook, consultorio) {
    const sheet = workbook.addWorksheet('Consultorio');
    
    sheet.columns = [
      { header: 'Campo', key: 'field', width: 30 },
      { header: 'Valor', key: 'value', width: 50 },
    ];

    const fields = [
      { field: 'ID', value: consultorio.id },
      { field: 'Nombre', value: consultorio.name },
      { field: 'Dirección', value: consultorio.address || '' },
      { field: 'Teléfono', value: consultorio.phone || '' },
      { field: 'Descripción', value: consultorio.description || '' },
      { field: 'Hora Apertura', value: consultorio.openHour || '' },
      { field: 'Hora Cierre', value: consultorio.closeHour || '' },
      { field: 'Paquete', value: consultorio.paquete || '' },
      { field: 'Estado Suscripción', value: consultorio.suscripcion?.estado || '' },
    ];

    fields.forEach(f => sheet.addRow(f));
    
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
  }

  _addPacientesSheet(workbook, pacientes) {
    const sheet = workbook.addWorksheet('Pacientes');
    
    sheet.columns = [
      { header: 'ID', key: 'id', width: 25 },
      { header: 'Nombre Completo', key: 'fullName', width: 30 },
      { header: 'Fecha Nacimiento', key: 'birthDate', width: 15 },
      { header: 'Edad', key: 'age', width: 10 },
      { header: 'Género', key: 'gender', width: 12 },
      { header: 'Teléfono', key: 'phone', width: 15 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Dirección', key: 'address', width: 40 },
      { header: 'Tipo Sangre', key: 'bloodType', width: 12 },
      { header: 'Alergias', key: 'allergies', width: 40 },
      { header: 'Historia Médica', key: 'medicalHistory', width: 50 },
    ];

    pacientes.forEach(p => {
      sheet.addRow({
        id: p.id,
        fullName: p.fullName,
        birthDate: p.birthDate ? new Date(p.birthDate).toLocaleDateString() : '',
        age: p.age || '',
        gender: p.gender || '',
        phone: p.phone || '',
        email: p.email || '',
        address: p.address || '',
        bloodType: p.bloodType || '',
        allergies: p.allergies || '',
        medicalHistory: p.medicalHistory || '',
      });
    });

    this._styleHeaderRow(sheet);
  }

  _addCitasSheet(workbook, citas) {
    const sheet = workbook.addWorksheet('Citas');
    
    sheet.columns = [
      { header: 'ID', key: 'id', width: 25 },
      { header: 'Paciente', key: 'paciente', width: 30 },
      { header: 'Doctor', key: 'doctor', width: 30 },
      { header: 'Fecha', key: 'date', width: 15 },
      { header: 'Hora', key: 'time', width: 10 },
      { header: 'Motivo', key: 'motivo', width: 40 },
      { header: 'Diagnóstico', key: 'diagnostico', width: 40 },
      { header: 'Tratamiento', key: 'tratamiento', width: 40 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Costo', key: 'costo', width: 12 },
    ];

    citas.forEach(c => {
      sheet.addRow({
        id: c.id,
        paciente: c.pacienteId?.fullName || c.pacienteId || '',
        doctor: c.doctorId?.fullName || c.doctorId || '',
        date: c.date ? new Date(c.date).toLocaleDateString() : '',
        time: c.time || '',
        motivo: c.motivo || '',
        diagnostico: c.diagnostico || '',
        tratamiento: c.tratamiento || '',
        estado: c.estado || '',
        costo: c.costo || '',
      });
    });

    this._styleHeaderRow(sheet);
  }

  _addUsersSheet(workbook, users) {
    const sheet = workbook.addWorksheet('Usuarios');
    
    sheet.columns = [
      { header: 'ID', key: 'id', width: 25 },
      { header: 'Nombre Completo', key: 'fullName', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Rol', key: 'role', width: 15 },
      { header: 'Teléfono', key: 'phone', width: 15 },
      { header: 'Especialidad', key: 'specialty', width: 25 },
      { header: 'Cédula Profesional', key: 'professionalId', width: 20 },
    ];

    users.forEach(u => {
      sheet.addRow({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        phone: u.phone || '',
        specialty: u.specialty || '',
        professionalId: u.professionalId || '',
      });
    });

    this._styleHeaderRow(sheet);
  }

  _addMedicationAllergiesSheet(workbook, allergies) {
    const sheet = workbook.addWorksheet('Alergias Medicamentos');
    
    sheet.columns = [
      { header: 'ID', key: 'id', width: 25 },
      { header: 'Nombre', key: 'name', width: 30 },
      { header: 'Descripción', key: 'description', width: 50 },
    ];

    allergies.forEach(a => {
      sheet.addRow({
        id: a.id,
        name: a.name || '',
        description: a.description || '',
      });
    });

    this._styleHeaderRow(sheet);
  }

  _addPagosSheet(workbook, pagos) {
    const sheet = workbook.addWorksheet('Pagos');
    
    sheet.columns = [
      { header: 'ID', key: 'id', width: 25 },
      { header: 'Cita ID', key: 'citaId', width: 25 },
      { header: 'Consultorio ID', key: 'consultorioId', width: 25 },
      { header: 'Monto', key: 'monto', width: 12 },
      { header: 'Método Pago', key: 'metodo', width: 15 },
      { header: 'Estatus', key: 'estatus', width: 15 },
      { header: 'Fecha Pago', key: 'fechaPago', width: 15 },
      { header: 'Comentarios', key: 'comentarios', width: 40 },
    ];

    pagos.forEach(p => {
      sheet.addRow({
        id: p.id,
        citaId: p.citaId?.toString() || '',
        consultorioId: p.consultorioId?.toString() || '',
        monto: p.monto || 0,
        metodo: p.metodo || '',
        estatus: p.estatus || '',
        fechaPago: p.fechaPago ? new Date(p.fechaPago).toLocaleDateString() : '',
        comentarios: p.comentarios || '',
      });
    });

    this._styleHeaderRow(sheet);
  }

  _styleHeaderRow(sheet) {
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  }
}

export default new ExportService();
