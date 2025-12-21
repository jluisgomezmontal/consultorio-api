import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PDFService {
  /**
   * Generates a prescription PDF using Puppeteer
   */
  async generatePrescriptionPDF(prescriptionData, templateName = 'classic') {
    let browser;
    
    try {
      const template = this.getTemplate(templateName);
      const html = this.populateTemplate(template, prescriptionData);

      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
      });

      await browser.close();
      
      return pdfBuffer;
    } catch (error) {
      if (browser) {
        await browser.close();
      }
      throw error;
    }
  }

  /**
   * Get template HTML by name
   */
  getTemplate(templateName) {
    const templates = {
      template1: this.getTemplate1(),
      template2: this.getTemplate2(),
      template3: this.getTemplate3(),
      template4: this.getTemplate4(),
      template5: this.getTemplate5(),
    };

    return templates[templateName] || templates.template1;
  }

  /**
   * Populate template with prescription data
   */
  populateTemplate(template, data) {
    const {
      consultorio = {},
      doctor = {},
      paciente = {},
      cita = {},
      medicamentos = [],
      diagnostico = '',
      indicaciones = '',
      fecha = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    } = data;

    // Use data from cita if not provided in parameters
    const finalDiagnostico = diagnostico || cita?.diagnostico || 'No especificado';
    const finalIndicaciones = indicaciones || cita?.tratamiento || cita?.notas || 'Ninguna';
    const motivoConsulta = cita?.motivo || 'No especificado';
    
    // Use consultorio logo if available, otherwise use placeholder
    const logoUrl = consultorio.imageUrl || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2240%22 text-anchor=%22middle%22 dy=%22.3em%22%3E🏥%3C/text%3E%3C/svg%3E';

    let html = template
      .replace(/\{\{consultorio\.name\}\}/g, consultorio.name || 'Consultorio Médico')
      .replace(/\{\{consultorio\.address\}\}/g, consultorio.address || '')
      .replace(/\{\{consultorio\.phone\}\}/g, consultorio.phone || '')
      .replace(/\{\{consultorio\.imageUrl\}\}/g, logoUrl)
      .replace(/\{\{doctor\.name\}\}/g, doctor.name || 'Dr. [Nombre]')
      .replace(/\{\{doctor\.email\}\}/g, doctor.email || '')
      .replace(/\{\{paciente\.fullName\}\}/g, paciente.fullName || '[Paciente]')
      .replace(/\{\{paciente\.age\}\}/g, paciente.age || '')
      .replace(/\{\{paciente\.gender\}\}/g, paciente.gender || '')
      .replace(/\{\{fecha\}\}/g, fecha)
      .replace(/\{\{motivo\}\}/g, motivoConsulta)
      .replace(/\{\{diagnostico\}\}/g, finalDiagnostico)
      .replace(/\{\{indicaciones\}\}/g, finalIndicaciones);

    const medicamentosHTML = medicamentos.map((med, index) => `
      <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-left: 3px solid #007bff;">
        <div style="font-weight: 600; color: #333; margin-bottom: 5px;">
          ${index + 1}. ${med.nombre || 'Medicamento'}
        </div>
        <div style="color: #666; font-size: 14px;">
          <strong>Dosis:</strong> ${med.dosis || 'N/A'} | 
          <strong>Frecuencia:</strong> ${med.frecuencia || 'N/A'} | 
          <strong>Duración:</strong> ${med.duracion || 'N/A'}
        </div>
        ${med.indicaciones ? `<div style="color: #555; font-size: 13px; margin-top: 5px; font-style: italic;">${med.indicaciones}</div>` : ''}
      </div>
    `).join('');

    html = html.replace(/\{\{medicamentos\}\}/g, medicamentosHTML || '<p style="color: #999;">No se han prescrito medicamentos</p>');

    return html;
  }

  /**
   * Template 1 - Green Professional (Verde profesional)
   */
  getTemplate1() {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Receta Médica</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #333; background: #fff; }
    .page { width: 297mm; height: 210mm; padding: 15mm; margin: 0 auto; position: relative; }
    .header { border: 3px solid #2d7a3e; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
    .header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .logo { width: 60px; height: 60px; object-fit: contain; }
    .consultorio-name { text-align: center; flex: 1; font-size: 20px; font-weight: bold; color: #2d7a3e; text-transform: uppercase; }
    .doctor-name { text-align: center; font-size: 18px; font-style: italic; color: #1e5a8e; margin-bottom: 5px; }
    .specialty { text-align: center; font-size: 12px; color: #666; }
    .patient-section { border-bottom: 1px solid #ccc; padding: 10px 0; display: flex; justify-content: space-between; margin-bottom: 15px; }
    .field { font-size: 13px; color: #1e5a8e; }
    .field-value { border-bottom: 1px solid #000; display: inline-block; min-width: 200px; }
    .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.05; font-size: 120px; }
    .content-area { min-height: 400px; border: 2px solid #2d7a3e; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .footer { border-top: 2px solid #2d7a3e; padding-top: 10px; font-size: 11px; color: #666; text-align: center; }
    .signature { margin-top: 80px; text-align: right; }
    .signature-line { border-top: 2px solid #000; width: 250px; margin-left: auto; margin-bottom: 5px; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-top">
        <img src="{{consultorio.imageUrl}}" alt="Logo" class="logo" />
        <div class="consultorio-name">{{consultorio.name}}</div>
        <div style="width: 60px;"></div>
      </div>
      <div class="doctor-name">{{doctor.name}}</div>
      <div class="specialty">Cédula Profesional</div>
    </div>
    
    <div class="patient-section">
      <div>
        <span class="field">Paciente: </span><span class="field-value">{{paciente.fullName}}</span>
      </div>
      <div>
        <span class="field">Fecha: </span><span class="field-value">{{fecha}}</span>
      </div>
    </div>

    <div style="display: flex; justify-content: flex-end; margin-bottom: 10px; font-size: 12px; color: #666;">
      <div style="margin-right: 20px;">Edad: {{paciente.age}}</div>
      <div>Sexo: {{paciente.gender}}</div>
    </div>

    <div class="watermark">℞</div>

    <div class="content-area">
      <div style="margin-bottom: 15px;">
        <div style="font-weight: bold; color: #2d7a3e; margin-bottom: 8px;">Motivo de Consulta:</div>
        <div style="padding: 8px; background: #f5f5f5; border-radius: 5px; font-size: 13px;">{{motivo}}</div>
      </div>

      <div style="margin-bottom: 15px;">
        <div style="font-weight: bold; color: #2d7a3e; margin-bottom: 8px;">Diagnóstico:</div>
        <div style="padding: 8px; background: #f5f5f5; border-radius: 5px; font-size: 13px;">{{diagnostico}}</div>
      </div>

      <div style="margin-bottom: 15px;">
        <div style="font-weight: bold; color: #2d7a3e; margin-bottom: 8px;">Prescripción:</div>
        {{medicamentos}}
      </div>

      <div>
        <div style="font-weight: bold; color: #2d7a3e; margin-bottom: 8px;">Indicaciones y Tratamiento:</div>
        <div style="padding: 10px; background: #f5f5f5; border-radius: 5px;">{{indicaciones}}</div>
      </div>
    </div>

    <div class="signature">
      <div class="signature-line"></div>
      <div style="font-weight: bold;">{{doctor.name}}</div>
    </div>

    <div class="footer">
      <div>{{consultorio.address}}</div>
      <div>Tel: {{consultorio.phone}}</div>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Template 2 - Blue Professional (Azul profesional)
   */
  getTemplate2() {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receta Médica</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      color: #2d3748;
      line-height: 1.6;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header-left h1 {
      font-size: 26px;
      margin-bottom: 5px;
    }
    .header-left p {
      font-size: 13px;
      opacity: 0.9;
    }
    .logo {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid white;
    }
    .content {
      padding: 30px;
    }
    .badge {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
    }
    .section-title::before {
      content: '';
      width: 4px;
      height: 20px;
      background: #667eea;
      margin-right: 10px;
      border-radius: 2px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      background: #f7fafc;
      padding: 20px;
      border-radius: 10px;
    }
    .info-item {
      font-size: 14px;
    }
    .info-label {
      font-weight: 600;
      color: #4a5568;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-value {
      color: #2d3748;
      margin-top: 3px;
    }
    .diagnosis-box {
      background: #edf2f7;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .footer {
      background: #f7fafc;
      padding: 20px 30px;
      margin-top: 30px;
      text-align: center;
    }
    .signature {
      margin-top: 40px;
      padding-top: 10px;
      border-top: 2px solid #2d3748;
      display: inline-block;
      min-width: 250px;
    }
    .signature-name {
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 5px;
    }
    .signature-cedula {
      font-size: 12px;
      color: #718096;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-left">
        <h1>{{consultorio.name}}</h1>
        <p>{{consultorio.address}}</p>
        <p>📞 {{consultorio.phone}}</p>
      </div>
      {{#if consultorio.imageUrl}}
      <img src="{{consultorio.imageUrl}}" alt="Logo" class="logo" />
      {{/if}}
    </div>

    <div class="content">
      <div class="badge">RECETA MÉDICA</div>

      <div class="section">
        <div class="section-title">Datos del Paciente</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Paciente</div>
            <div class="info-value">{{paciente.fullName}}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Edad</div>
            <div class="info-value">{{paciente.age}} años</div>
          </div>
          <div class="info-item">
            <div class="info-label">Sexo</div>
            <div class="info-value">{{paciente.gender}}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Fecha</div>
            <div class="info-value">{{fecha}}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Motivo de Consulta</div>
        <div class="diagnosis-box" style="font-size: 13px;">{{motivo}}</div>
      </div>

      <div class="section">
        <div class="section-title">Diagnóstico</div>
        <div class="diagnosis-box" style="font-size: 13px;">{{diagnostico}}</div>
      </div>

      <div class="section">
        <div class="section-title">Medicamentos Prescritos</div>
        {{medicamentos}}
      </div>

      <div class="section">
        <div class="section-title">Indicaciones y Tratamiento</div>
        <div class="diagnosis-box" style="font-size: 13px;">{{indicaciones}}</div>
      </div>
    </div>

    <div class="footer">
      <div class="signature">
        <div class="signature-name">{{doctor.name}}</div>
        <div class="signature-cedula">Cédula Profesional</div>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Template 3 - Elegant Minimal (Minimalista elegante)
   */
  getTemplate3() {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receta Médica</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Helvetica Neue', 'Arial', sans-serif;
      color: #1a202c;
      line-height: 1.7;
      background: #fff;
    }
    .container {
      max-width: 750px;
      margin: 40px auto;
      padding: 40px;
      border: 1px solid #e2e8f0;
    }
    .header {
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid #000;
    }
    .consultorio-name {
      font-size: 20px;
      font-weight: 600;
      color: #000;
      margin-bottom: 8px;
    }
    .consultorio-info {
      font-size: 12px;
      color: #4a5568;
      line-height: 1.4;
    }
    .rx-symbol {
      font-size: 48px;
      font-weight: 300;
      color: #000;
      margin: 30px 0 20px 0;
      font-family: 'Times New Roman', serif;
    }
    .section {
      margin-bottom: 30px;
    }
    .label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #718096;
      margin-bottom: 8px;
    }
    .value {
      font-size: 14px;
      color: #1a202c;
      margin-bottom: 15px;
    }
    .divider {
      height: 1px;
      background: #e2e8f0;
      margin: 25px 0;
    }
    .medications-list {
      margin-top: 15px;
    }
    .footer {
      margin-top: 60px;
      text-align: right;
    }
    .signature-line {
      border-top: 1px solid #000;
      width: 250px;
      margin-left: auto;
      margin-bottom: 8px;
    }
    .doctor-name {
      font-size: 14px;
      font-weight: 600;
      color: #1a202c;
    }
    .cedula {
      font-size: 11px;
      color: #718096;
      margin-top: 3px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="consultorio-name">{{consultorio.name}}</div>
      <div class="consultorio-info">
        {{consultorio.address}}<br>
        Tel: {{consultorio.phone}}
      </div>
    </div>

    <div class="rx-symbol">℞</div>

    <div class="section">
      <div class="label">Paciente</div>
      <div class="value">{{paciente.fullName}} • {{paciente.age}} años • {{paciente.gender}}</div>
      
      <div class="label">Fecha</div>
      <div class="value">{{fecha}}</div>
    </div>

    <div class="divider"></div>

    <div class="section">
      <div class="label">Motivo de Consulta</div>
      <div class="value">{{motivo}}</div>
    </div>

    <div class="section">
      <div class="label">Diagnóstico</div>
      <div class="value">{{diagnostico}}</div>
    </div>

    <div class="section">
      <div class="label">Medicamentos</div>
      <div class="medications-list">
        {{medicamentos}}
      </div>
    </div>

    <div class="section">
      <div class="label">Indicaciones y Tratamiento</div>
      <div class="value">{{indicaciones}}</div>
    </div>

    <div class="footer">
      <div class="signature-line"></div>
      <div class="doctor-name">{{doctor.name}}</div>
      <div class="cedula">Cédula Profesional</div>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Template 4 - Purple Modern (Morado moderno)
   */
  getTemplate4() {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Receta Médica</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; background: #fff; }
    .page { width: 297mm; height: 210mm; padding: 15mm; margin: 0 auto; position: relative; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 20px; margin-bottom: 20px; color: white; }
    .header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .logo { width: 60px; height: 60px; object-fit: contain; border: 3px solid white; border-radius: 50%; background: white; padding: 5px; }
    .consultorio-name { text-align: center; flex: 1; font-size: 22px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
    .doctor-name { text-align: center; font-size: 18px; margin-bottom: 3px; }
    .specialty { text-align: center; font-size: 11px; opacity: 0.9; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 8px 20px; border-radius: 20px; font-size: 12px; margin-top: 10px; }
    .patient-section { background: #f7fafc; border-radius: 8px; padding: 15px; margin-bottom: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .field { font-size: 13px; color: #667eea; font-weight: 600; }
    .field-value { display: block; margin-top: 3px; color: #333; font-size: 14px; }
    .content-area { min-height: 380px; padding: 20px; margin-bottom: 20px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 16px; font-weight: 700; color: #667eea; margin-bottom: 10px; display: flex; align-items: center; }
    .section-title::before { content: ''; width: 4px; height: 20px; background: #667eea; margin-right: 10px; border-radius: 2px; }
    .footer { border-top: 3px solid #667eea; padding-top: 15px; text-align: center; font-size: 11px; color: #666; }
    .signature { margin-top: 60px; text-align: right; }
    .signature-line { border-top: 2px solid #667eea; width: 250px; margin-left: auto; margin-bottom: 5px; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-top">
        <img src="{{consultorio.imageUrl}}" alt="Logo" class="logo" />
        <div class="consultorio-name">{{consultorio.name}}</div>
        <div style="width: 60px;"></div>
      </div>
      <div class="doctor-name">{{doctor.name}}</div>
      <div class="specialty">Cédula Profesional</div>
      <div style="text-align: center;"><span class="badge">RECETA MÉDICA</span></div>
    </div>
    
    <div class="patient-section">
      <div>
        <span class="field">Paciente</span>
        <span class="field-value">{{paciente.fullName}}</span>
      </div>
      <div>
        <span class="field">Fecha</span>
        <span class="field-value">{{fecha}}</span>
      </div>
      <div>
        <span class="field">Edad</span>
        <span class="field-value">{{paciente.age}} años</span>
      </div>
      <div>
        <span class="field">Sexo</span>
        <span class="field-value">{{paciente.gender}}</span>
      </div>
    </div>

    <div class="content-area">
      <div class="section">
        <div class="section-title">Motivo de Consulta</div>
        <div style="background: #f7fafc; padding: 12px; border-radius: 8px; border-left: 4px solid #667eea; font-size: 13px;">
          {{motivo}}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Diagnóstico</div>
        <div style="background: #f7fafc; padding: 12px; border-radius: 8px; border-left: 4px solid #667eea; font-size: 13px;">
          {{diagnostico}}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Prescripción</div>
        {{medicamentos}}
      </div>

      <div class="section">
        <div class="section-title">Indicaciones y Tratamiento</div>
        <div style="padding: 12px; background: #edf2f7; border-radius: 8px; border-left: 4px solid #667eea; font-size: 13px;">{{indicaciones}}</div>
      </div>
    </div>

    <div class="signature">
      <div class="signature-line"></div>
      <div style="font-weight: bold; color: #667eea;">{{doctor.name}}</div>
    </div>

    <div class="footer">
      <div style="font-weight: 600; margin-bottom: 5px;">{{consultorio.name}}</div>
      <div>{{consultorio.address}} | Tel: {{consultorio.phone}}</div>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Template 5 - Coral Professional (Coral profesional)
   */
  getTemplate5() {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Receta Médica</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; background: #fff; }
    .page { width: 297mm; height: 210mm; padding: 15mm; margin: 0 auto; position: relative; }
    .header { border: 4px solid #ff6b6b; border-radius: 12px; padding: 20px; margin-bottom: 20px; background: linear-gradient(to bottom, #fff 0%, #fff5f5 100%); }
    .header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .logo { width: 65px; height: 65px; object-fit: contain; border: 3px solid #ff6b6b; border-radius: 10px; }
    .consultorio-name { text-align: center; flex: 1; font-size: 22px; font-weight: 800; color: #ff6b6b; text-transform: uppercase; letter-spacing: 2px; }
    .doctor-name { text-align: center; font-size: 18px; font-weight: 600; color: #c92a2a; margin-bottom: 5px; }
    .specialty { text-align: center; font-size: 12px; color: #868e96; }
    .patient-section { border: 2px solid #ffdecc; background: #fff5f0; border-radius: 10px; padding: 15px; margin-bottom: 20px; }
    .patient-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
    .field { color: #c92a2a; font-weight: 700; }
    .field-value { color: #333; }
    .rx-symbol { text-align: center; font-size: 80px; color: #ffe0d0; margin: 20px 0; font-family: serif; }
    .content-area { min-height: 380px; padding: 20px; margin-bottom: 20px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 15px; font-weight: 700; color: #ff6b6b; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #ffdecc; }
    .content-box { padding: 12px; background: #fff5f0; border-radius: 8px; border-left: 5px solid #ff6b6b; }
    .footer { border-top: 4px solid #ff6b6b; padding-top: 12px; text-align: center; font-size: 11px; color: #666; background: #fff5f0; padding: 15px; border-radius: 8px; }
    .signature { margin-top: 60px; text-align: center; }
    .signature-line { border-top: 3px solid #ff6b6b; width: 300px; margin: 0 auto 8px auto; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-top">
        <img src="{{consultorio.imageUrl}}" alt="Logo" class="logo" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2265%22 height=%2265%22%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2245%22 text-anchor=%22middle%22 dy=%22.3em%22%3E🏥%3C/text%3E%3C/svg%3E'" />
        <div class="consultorio-name">{{consultorio.name}}</div>
        <div style="width: 65px;"></div>
      </div>
      <div class="doctor-name">{{doctor.name}}</div>
      <div class="specialty">Cédula Profesional</div>
    </div>
    
    <div class="patient-section">
      <div class="patient-row">
        <div><span class="field">Paciente:</span> <span class="field-value">{{paciente.fullName}}</span></div>
        <div><span class="field">Fecha:</span> <span class="field-value">{{fecha}}</span></div>
      </div>
      <div class="patient-row">
        <div><span class="field">Edad:</span> <span class="field-value">{{paciente.age}} años</span></div>
        <div><span class="field">Sexo:</span> <span class="field-value">{{paciente.gender}}</span></div>
      </div>
    </div>

    <div class="rx-symbol">℞</div>

    <div class="content-area">
      <div class="section">
        <div class="section-title">Motivo de Consulta</div>
        <div class="content-box">{{motivo}}</div>
      </div>

      <div class="section">
        <div class="section-title">Diagnóstico</div>
        <div class="content-box">{{diagnostico}}</div>
      </div>

      <div class="section">
        <div class="section-title">Prescripción</div>
        {{medicamentos}}
      </div>

      <div class="section">
        <div class="section-title">Indicaciones y Tratamiento</div>
        <div class="content-box">{{indicaciones}}</div>
      </div>
    </div>

    <div class="signature">
      <div class="signature-line"></div>
      <div style="font-weight: bold; font-size: 14px; color: #c92a2a;">{{doctor.name}}</div>
      <div style="font-size: 11px; color: #868e96; margin-top: 3px;">Cédula Profesional</div>
    </div>

    <div class="footer">
      <div style="font-weight: 700; margin-bottom: 5px; color: #c92a2a;">{{consultorio.name}}</div>
      <div>{{consultorio.address}}</div>
      <div style="margin-top: 3px;">Teléfono: {{consultorio.phone}}</div>
    </div>
  </div>
</body>
</html>
    `;
  }
}

export default new PDFService();
