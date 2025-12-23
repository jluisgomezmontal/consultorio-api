import puppeteer from 'puppeteer';
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
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

      // Detect if we're in production (Render, AWS, etc.) or local development
      const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;
      
      if (isProduction) {
        // Production: Use puppeteer-core with chromium
        browser = await puppeteerCore.launch({
          args: [
            ...chromium.args,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
          ],
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
        });
      } else {
        // Local development: Use regular puppeteer
        browser = await puppeteer.launch({
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
      }

      const page = await browser.newPage();
      
      // Emulate screen media instead of print to avoid font embedding issues
      await page.emulateMediaType('screen');
      
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: {
          top: '5mm',
          right: '5mm',
          bottom: '5mm',
          left: '5mm',
        },
        // Disable tagged PDF to reduce file size and prevent corruption
        tagged: false,
        // Use outline mode for fonts to reduce size
        outline: false,
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

    // Format doctor's cedulas for display
    const cedulasDisplay = doctor.cedulas && doctor.cedulas.length > 0
      ? doctor.cedulas.map(c => `Cédula Profesional: ${c}`).join(' | ')
      : 'Cédula Profesional';

    let html = template
      .replace(/\{\{consultorio\.name\}\}/g, consultorio.name || 'Consultorio Médico')
      .replace(/\{\{consultorio\.address\}\}/g, consultorio.address || '')
      .replace(/\{\{consultorio\.phone\}\}/g, consultorio.phone || '')
      .replace(/\{\{consultorio\.description\}\}/g, consultorio.description || '')
      .replace(/\{\{consultorio\.imageUrl\}\}/g, logoUrl)
      .replace(/\{\{doctor\.name\}\}/g, doctor.name || 'Dr. [Nombre]')
      .replace(/\{\{doctor\.email\}\}/g, doctor.email || '')
      .replace(/\{\{doctor\.cedulas\}\}/g, cedulasDisplay)
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
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Receta Médica</title>

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      color: #333;
      background: #fff;
    }

    .page {
      width: 287mm;
      height: auto;
      max-height: 200mm;
      padding: 5mm;
      margin: 0 auto;
      position: relative;
    }

    /* ================= HEADER ================= */

    .header {
      border: 3px solid #2d7a3e;
      border-radius: 8px;
      margin-bottom: 5px;
      display: flex;
      min-height: 90px;
    }

    /* LOGO 25% */
    .header-logo {
      width: 25%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px;
    }

    .header-logo img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    /* DATOS 75% */
    .header-info {
      width: 75%;
      padding: 10px 15px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .consultorio-name {
      padding-left: 30px;
      text-align: left;
      font-size: 20px;
      font-weight: bold;
      color: #2d7a3e;
      text-transform: uppercase;
      line-height: 1.2;
      margin-bottom: 4px;
    }

    .doctor-name {
      padding-left: 30px;
      text-align: left;
      font-size: 18px;
      font-style: italic;
      color: #1e5a8e;
      margin-bottom: 4px;
    }

    .consultorio-description {
      padding-left: 30px;
      text-align: left;
      font-size: 11px;
      color: #666;
      margin-bottom: 3px;
    }

    .specialty {
      padding-left: 30px;
      text-align: left;
      font-size: 12px;
      color: #666;
    }

    /* ================= PACIENTE ================= */

    .patient-section {
      padding: 5px 0;
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }

    .field {
      font-size: 13px;
      color: #1e5a8e;
    }

    .field-value {
      border-bottom: 1px solid #000;
      display: inline-block;
      min-width: 200px;
    }

    /* ================= CONTENIDO ================= */

    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0.05;
      font-size: 120px;
      pointer-events: none;
    }

    .content-area {
      min-height: 40mm;
      border: 2px solid #2d7a3e;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 10px;
    }

    /* ================= MEDICAMENTOS ================= */

    .medicamentos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 15px;
    }

    .medicamento-item {
      font-size: 13px;
      background: #f5f5f5;
      padding: 8px;
      border-radius: 5px;
      line-height: 1.4;
      break-inside: avoid;
    }

    .medicamento-item strong {
      color: #1e5a8e;
    }

    /* ================= FIRMA ================= */

    .signature {
      margin-top: 8px;
      text-align: right;
    }

    .signature-line {
      border-top: 2px solid #000;
      width: 250px;
      margin-left: auto;
      margin-bottom: 5px;
    }

    /* ================= FOOTER ================= */

    .footer {
      border-top: 2px solid #2d7a3e;
      padding-top: 10px;
      font-size: 11px;
      color: #666;
      text-align: center;
      display: flex;
      justify-content: center;
      gap: 20px;
    }

  </style>
</head>

<body>
  <div class="page">

    <!-- HEADER -->
    <div class="header">

      <!-- LOGO -->
      <div class="header-logo">
        <img
          src="{{consultorio.imageUrl}}"
          alt="Logo"
        />
      </div>

      <!-- INFO CONSULTORIO -->
      <div class="header-info">
        <div class="consultorio-name">{{consultorio.name}}</div>
        <div class="doctor-name">{{doctor.name}}</div>
        <div class="consultorio-description">{{consultorio.description}}</div>
        <div class="specialty">{{doctor.cedulas}}</div>
      </div>

    </div>

    <!-- PACIENTE -->
    <div class="patient-section">
      <div>
        <span class="field">Paciente: </span>
        <span class="field-value">{{paciente.fullName}}</span>
      </div>
      <div>
        <span class="field">Fecha: </span>
        <span class="field-value">{{fecha}}</span>
      </div>
    </div>

    <div style="display:flex; justify-content:flex-end; margin-bottom:10px; font-size:12px; color:#666;">
      <div style="margin-right:20px;">Edad: {{paciente.age}}</div>
      <div>Sexo: {{paciente.gender}}</div>
    </div>

    <div class="watermark">℞</div>

    <!-- CONTENIDO -->
    <div class="content-area">

      <div style="margin-bottom:5px;">
        <div style="font-weight:bold; color:#2d7a3e; margin-bottom:3px;">Motivo de Consulta:</div>
        <div style="padding:8px; background:#f5f5f5; border-radius:5px; font-size:13px;">
          {{motivo}}
        </div>
      </div>

      <div style="margin-bottom:5px;">
        <div style="font-weight:bold; color:#2d7a3e; margin-bottom:3px;">Diagnóstico:</div>
        <div style="padding:8px; background:#f5f5f5; border-radius:5px; font-size:13px;">
          {{diagnostico}}
        </div>
      </div>

      <div style="margin-bottom:5px;">
        <div style="font-weight:bold; color:#2d7a3e; margin-bottom:3px;">Prescripción:</div>
        <div class="medicamentos-grid">
          {{medicamentos}}
        </div>
      </div>

      <div>
        <div style="font-weight:bold; color:#2d7a3e; margin-bottom:3px;">Indicaciones y Tratamiento:</div>
        <div style="padding:10px; background:#f5f5f5; border-radius:5px; font-size:13px;">
          {{indicaciones}}
        </div>
      </div>

    </div>

    <!-- FIRMA -->
    <div class="signature">
      <div class="signature-line"></div>
      <div style="font-weight:bold;">{{doctor.name}}</div>
    </div>

    <!-- FOOTER -->
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
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Receta Médica</title>

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      color: #333;
      background: #fff;
    }

    .page {
      width: 287mm;
      height: auto;
      max-height: 200mm;
      padding: 5mm;
      margin: 0 auto;
      position: relative;
    }

    .header {
      border: 3px solid #1e40af;
      border-radius: 8px;
      margin-bottom: 5px;
      display: flex;
      min-height: 85px;
    }

    .header-logo {
      width: 25%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px;
    }

    .header-logo img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .header-info {
      width: 75%;
      padding: 10px 15px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .consultorio-name {
      padding-left: 30px;
      text-align: left;
      font-size: 20px;
      font-weight: bold;
      color: #1e40af;
      text-transform: uppercase;
      line-height: 1.2;
      margin-bottom: 4px;
    }

    .doctor-name {
      padding-left: 30px;
      text-align: left;
      font-size: 18px;
      font-style: italic;
      color: #3b82f6;
      margin-bottom: 4px;
    }

    .consultorio-description {
      padding-left: 30px;
      text-align: left;
      font-size: 11px;
      color: #666;
      margin-bottom: 3px;
    }

    .specialty {
      padding-left: 30px;
      text-align: left;
      font-size: 12px;
      color: #666;
    }

    .patient-section {
      padding: 5px 0;
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }

    .field {
      font-size: 13px;
      color: #1e40af;
    }

    .field-value {
      border-bottom: 1px solid #000;
      display: inline-block;
      min-width: 200px;
    }

    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0.05;
      font-size: 120px;
      pointer-events: none;
    }

    .content-area {
      min-height: 35mm;
      border: 2px solid #1e40af;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 8px;
    }

    .medicamentos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 15px;
    }

    .medicamento-item {
      font-size: 13px;
      background: #eff6ff;
      padding: 8px;
      border-radius: 5px;
      line-height: 1.4;
      break-inside: avoid;
    }

    .medicamento-item strong {
      color: #1e40af;
    }

    .signature {
      margin-top: 8px;
      text-align: right;
    }

    .signature-line {
      border-top: 2px solid #000;
      width: 250px;
      margin-left: auto;
      margin-bottom: 5px;
    }

    .footer {
      border-top: 2px solid #1e40af;
      padding-top: 10px;
      font-size: 11px;
      color: #666;
      text-align: center;
      display: flex;
      justify-content: center;
      gap: 20px;
    }

  </style>
</head>

<body>
  <div class="page">

    <div class="header">
      <div class="header-logo">
        <img src="{{consultorio.imageUrl}}" alt="Logo" />
      </div>
      <div class="header-info">
        <div class="consultorio-name">{{consultorio.name}}</div>
        <div class="doctor-name">{{doctor.name}}</div>
        <div class="consultorio-description">{{consultorio.description}}</div>
        <div class="specialty">{{doctor.cedulas}}</div>
      </div>
    </div>

    <div class="patient-section">
      <div>
        <span class="field">Paciente: </span>
        <span class="field-value">{{paciente.fullName}}</span>
      </div>
      <div>
        <span class="field">Fecha: </span>
        <span class="field-value">{{fecha}}</span>
      </div>
    </div>

    <div style="display:flex; justify-content:flex-end; margin-bottom:10px; font-size:12px; color:#666;">
      <div style="margin-right:20px;">Edad: {{paciente.age}}</div>
      <div>Sexo: {{paciente.gender}}</div>
    </div>

    <div class="watermark">℞</div>

    <div class="content-area">
      <div style="margin-bottom:5px;">
        <div style="font-weight:bold; color:#1e40af; margin-bottom:3px;">Motivo de Consulta:</div>
        <div style="padding:8px; background:#eff6ff; border-radius:5px; font-size:13px;">
          {{motivo}}
        </div>
      </div>

      <div style="margin-bottom:5px;">
        <div style="font-weight:bold; color:#1e40af; margin-bottom:3px;">Diagnóstico:</div>
        <div style="padding:8px; background:#eff6ff; border-radius:5px; font-size:13px;">
          {{diagnostico}}
        </div>
      </div>

      <div style="margin-bottom:5px;">
        <div style="font-weight:bold; color:#1e40af; margin-bottom:3px;">Prescripción:</div>
        <div class="medicamentos-grid">
          {{medicamentos}}
        </div>
      </div>

      <div>
        <div style="font-weight:bold; color:#1e40af; margin-bottom:3px;">Indicaciones y Tratamiento:</div>
        <div style="padding:10px; background:#eff6ff; border-radius:5px; font-size:13px;">
          {{indicaciones}}
        </div>
      </div>
    </div>

    <div class="signature">
      <div class="signature-line"></div>
      <div style="font-weight:bold;">{{doctor.name}}</div>
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
   * Template 3 - Black & Gray Professional (Negro y gris profesional)
   */
  getTemplate3() {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Receta Médica</title>

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      color: #333;
      background: #fff;
    }

    .page {
      width: 287mm;
      height: auto;
      max-height: 200mm;
      padding: 5mm;
      margin: 0 auto;
      position: relative;
    }

    .header {
      border: 3px solid #1f2937;
      border-radius: 8px;
      margin-bottom: 5px;
      display: flex;
      min-height: 85px;
    }

    .header-logo {
      width: 25%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px;
    }

    .header-logo img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .header-info {
      width: 75%;
      padding: 10px 15px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .consultorio-name {
      padding-left: 30px;
      text-align: left;
      font-size: 20px;
      font-weight: bold;
      color: #1f2937;
      text-transform: uppercase;
      line-height: 1.2;
      margin-bottom: 4px;
    }

    .doctor-name {
      padding-left: 30px;
      text-align: left;
      font-size: 18px;
      font-style: italic;
      color: #4b5563;
      margin-bottom: 4px;
    }

    .consultorio-description {
      padding-left: 30px;
      text-align: left;
      font-size: 11px;
      color: #666;
      margin-bottom: 3px;
    }

    .specialty {
      padding-left: 30px;
      text-align: left;
      font-size: 12px;
      color: #666;
    }

    .patient-section {
      padding: 5px 0;
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }

    .field {
      font-size: 13px;
      color: #1f2937;
    }

    .field-value {
      border-bottom: 1px solid #000;
      display: inline-block;
      min-width: 200px;
    }

    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0.05;
      font-size: 120px;
      pointer-events: none;
    }

    .content-area {
      min-height: 35mm;
      border: 2px solid #1f2937;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 8px;
    }

    .medicamentos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 15px;
    }

    .medicamento-item {
      font-size: 13px;
      background: #f3f4f6;
      padding: 8px;
      border-radius: 5px;
      line-height: 1.4;
      break-inside: avoid;
    }

    .medicamento-item strong {
      color: #1f2937;
    }

    .signature {
      margin-top: 8px;
      text-align: right;
    }

    .signature-line {
      border-top: 2px solid #000;
      width: 250px;
      margin-left: auto;
      margin-bottom: 5px;
    }

    .footer {
      border-top: 2px solid #1f2937;
      padding-top: 10px;
      font-size: 11px;
      color: #666;
      text-align: center;
      display: flex;
      justify-content: center;
      gap: 20px;
    }

  </style>
</head>

<body>
  <div class="page">

    <div class="header">
      <div class="header-logo">
        <img src="{{consultorio.imageUrl}}" alt="Logo" />
      </div>
      <div class="header-info">
        <div class="consultorio-name">{{consultorio.name}}</div>
        <div class="doctor-name">{{doctor.name}}</div>
        <div class="consultorio-description">{{consultorio.description}}</div>
        <div class="specialty">{{doctor.cedulas}}</div>
      </div>
    </div>

    <div class="patient-section">
      <div>
        <span class="field">Paciente: </span>
        <span class="field-value">{{paciente.fullName}}</span>
      </div>
      <div>
        <span class="field">Fecha: </span>
        <span class="field-value">{{fecha}}</span>
      </div>
    </div>

    <div style="display:flex; justify-content:flex-end; margin-bottom:10px; font-size:12px; color:#666;">
      <div style="margin-right:20px;">Edad: {{paciente.age}}</div>
      <div>Sexo: {{paciente.gender}}</div>
    </div>

    <div class="watermark">℞</div>

    <div class="content-area">
      <div style="margin-bottom:5px;">
        <div style="font-weight:bold; color:#1f2937; margin-bottom:3px;">Motivo de Consulta:</div>
        <div style="padding:8px; background:#f3f4f6; border-radius:5px; font-size:13px;">
          {{motivo}}
        </div>
      </div>

      <div style="margin-bottom:5px;">
        <div style="font-weight:bold; color:#1f2937; margin-bottom:3px;">Diagnóstico:</div>
        <div style="padding:8px; background:#f3f4f6; border-radius:5px; font-size:13px;">
          {{diagnostico}}
        </div>
      </div>

      <div style="margin-bottom:5px;">
        <div style="font-weight:bold; color:#1f2937; margin-bottom:3px;">Prescripción:</div>
        <div class="medicamentos-grid">
          {{medicamentos}}
        </div>
      </div>

      <div>
        <div style="font-weight:bold; color:#1f2937; margin-bottom:3px;">Indicaciones y Tratamiento:</div>
        <div style="padding:10px; background:#f3f4f6; border-radius:5px; font-size:13px;">
          {{indicaciones}}
        </div>
      </div>
    </div>

    <div class="signature">
      <div class="signature-line"></div>
      <div style="font-weight:bold;">{{doctor.name}}</div>
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
   * Template 4 - Red Professional (Rojo profesional)
   */
  getTemplate4() {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Receta Médica</title>

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      color: #333;
      background: #fff;
    }

    .page {
      width: 287mm;
      height: auto;
      max-height: 200mm;
      padding: 5mm;
      margin: 0 auto;
      position: relative;
    }

    .header {
      border: 3px solid #dc2626;
      border-radius: 8px;
      margin-bottom: 5px;
      display: flex;
      min-height: 85px;
    }

    .header-logo {
      width: 25%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px;
    }

    .header-logo img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .header-info {
      width: 75%;
      padding: 10px 15px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .consultorio-name {
      padding-left: 30px;
      text-align: left;
      font-size: 20px;
      font-weight: bold;
      color: #dc2626;
      text-transform: uppercase;
      line-height: 1.2;
      margin-bottom: 4px;
    }

    .doctor-name {
      padding-left: 30px;
      text-align: left;
      font-size: 18px;
      font-style: italic;
      color: #ef4444;
      margin-bottom: 4px;
    }

    .consultorio-description {
      padding-left: 30px;
      text-align: left;
      font-size: 11px;
      color: #666;
      margin-bottom: 3px;
    }

    .specialty {
      padding-left: 30px;
      text-align: left;
      font-size: 12px;
      color: #666;
    }

    .patient-section {
      padding: 5px 0;
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }

    .field {
      font-size: 13px;
      color: #dc2626;
    }

    .field-value {
      border-bottom: 1px solid #000;
      display: inline-block;
      min-width: 200px;
    }

    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0.05;
      font-size: 120px;
      pointer-events: none;
    }

    .content-area {
      min-height: 35mm;
      border: 2px solid #dc2626;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 8px;
    }

    .medicamentos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 15px;
    }

    .medicamento-item {
      font-size: 13px;
      background: #fee2e2;
      padding: 8px;
      border-radius: 5px;
      line-height: 1.4;
      break-inside: avoid;
    }

    .medicamento-item strong {
      color: #dc2626;
    }

    .signature {
      margin-top: 8px;
      text-align: right;
    }

    .signature-line {
      border-top: 2px solid #000;
      width: 250px;
      margin-left: auto;
      margin-bottom: 5px;
    }

    .footer {
      border-top: 2px solid #dc2626;
      padding-top: 10px;
      font-size: 11px;
      color: #666;
      text-align: center;
      display: flex;
      justify-content: center;
      gap: 20px;
    }

  </style>
</head>

<body>
  <div class="page">

    <div class="header">
      <div class="header-logo">
        <img src="{{consultorio.imageUrl}}" alt="Logo" />
      </div>
      <div class="header-info">
        <div class="consultorio-name">{{consultorio.name}}</div>
        <div class="doctor-name">{{doctor.name}}</div>
        <div class="consultorio-description">{{consultorio.description}}</div>
        <div class="specialty">{{doctor.cedulas}}</div>
      </div>
    </div>

    <div class="patient-section">
      <div>
        <span class="field">Paciente: </span>
        <span class="field-value">{{paciente.fullName}}</span>
      </div>
      <div>
        <span class="field">Fecha: </span>
        <span class="field-value">{{fecha}}</span>
      </div>
    </div>

    <div style="display:flex; justify-content:flex-end; margin-bottom:10px; font-size:12px; color:#666;">
      <div style="margin-right:20px;">Edad: {{paciente.age}}</div>
      <div>Sexo: {{paciente.gender}}</div>
    </div>

    <div class="watermark">℞</div>

    <div class="content-area">
      <div style="margin-bottom:5px;">
        <div style="font-weight:bold; color:#dc2626; margin-bottom:3px;">Motivo de Consulta:</div>
        <div style="padding:8px; background:#fee2e2; border-radius:5px; font-size:13px;">
          {{motivo}}
        </div>
      </div>

      <div style="margin-bottom:5px;">
        <div style="font-weight:bold; color:#dc2626; margin-bottom:3px;">Diagnóstico:</div>
        <div style="padding:8px; background:#fee2e2; border-radius:5px; font-size:13px;">
          {{diagnostico}}
        </div>
      </div>

      <div style="margin-bottom:5px;">
        <div style="font-weight:bold; color:#dc2626; margin-bottom:3px;">Prescripción:</div>
        <div class="medicamentos-grid">
          {{medicamentos}}
        </div>
      </div>

      <div>
        <div style="font-weight:bold; color:#dc2626; margin-bottom:3px;">Indicaciones y Tratamiento:</div>
        <div style="padding:10px; background:#fee2e2; border-radius:5px; font-size:13px;">
          {{indicaciones}}
        </div>
      </div>
    </div>

    <div class="signature">
      <div class="signature-line"></div>
      <div style="font-weight:bold;">{{doctor.name}}</div>
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
   * Template 5 - Modern Gradient (Gradiente moderno)
   */
  getTemplate5() {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Receta Médica</title>

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      color: #333;
      background: #fff;
    }

    .page {
      width: 287mm;
      height: auto;
      max-height: 200mm;
      padding: 5mm;
      margin: 0 auto;
      position: relative;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      margin-bottom: 5px;
      display: flex;
      min-height: 85px;
      color: white;
    }

    .header-logo {
      width: 25%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px;
    }

    .header-logo img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 50%;
      background: white;
      padding: 8px;
    }

    .header-info {
      width: 75%;
      padding: 10px 15px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .consultorio-name {
      padding-left: 30px;
      text-align: left;
      font-size: 20px;
      font-weight: bold;
      color: white;
      text-transform: uppercase;
      line-height: 1.2;
      margin-bottom: 4px;
    }

    .doctor-name {
      padding-left: 30px;
      text-align: left;
      font-size: 18px;
      font-style: italic;
      color: rgba(255,255,255,0.95);
      margin-bottom: 4px;
    }

    .consultorio-description {
      padding-left: 30px;
      text-align: left;
      font-size: 11px;
      color: rgba(255,255,255,0.9);
      margin-bottom: 3px;
    }

    .specialty {
      padding-left: 30px;
      text-align: left;
      font-size: 12px;
      color: rgba(255,255,255,0.85);
    }

    .patient-section {
      padding: 5px 0;
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }

    .field {
      font-size: 13px;
      color: #667eea;
      font-weight: 600;
    }

    .field-value {
      border-bottom: 1px solid #667eea;
      display: inline-block;
      min-width: 200px;
    }

    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0.05;
      font-size: 120px;
      pointer-events: none;
    }

    .content-area {
      min-height: 35mm;
      border: 2px solid #667eea;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 8px;
      background: linear-gradient(to bottom, #ffffff 0%, #f8f9ff 100%);
    }

    .medicamentos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 15px;
    }

    .medicamento-item {
      font-size: 13px;
      background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%);
      padding: 8px;
      border-radius: 5px;
      line-height: 1.4;
      break-inside: avoid;
      border: 1px solid #c7d2fe;
    }

    .medicamento-item strong {
      color: #5b21b6;
    }

    .signature {
      margin-top: 8px;
      text-align: right;
    }

    .signature-line {
      border-top: 2px solid #667eea;
      width: 250px;
      margin-left: auto;
      margin-bottom: 5px;
    }

    .footer {
      border-top: 2px solid #667eea;
      padding-top: 10px;
      font-size: 11px;
      color: #666;
      text-align: center;
      display: flex;
      justify-content: center;
      gap: 20px;
    }

  </style>
</head>

<body>
  <div class="page">

    <div class="header">
      <div class="header-logo">
        <img src="{{consultorio.imageUrl}}" alt="Logo" />
      </div>
      <div class="header-info">
        <div class="consultorio-name">{{consultorio.name}}</div>
        <div class="doctor-name">{{doctor.name}}</div>
        <div class="consultorio-description">{{consultorio.description}}</div>
        <div class="specialty">{{doctor.cedulas}}</div>
      </div>
    </div>

    <div class="patient-section">
      <div>
        <span class="field">Paciente: </span>
        <span class="field-value">{{paciente.fullName}}</span>
      </div>
      <div>
        <span class="field">Fecha: </span>
        <span class="field-value">{{fecha}}</span>
      </div>
    </div>

    <div style="display:flex; justify-content:flex-end; margin-bottom:10px; font-size:12px; color:#666;">
      <div style="margin-right:20px;">Edad: {{paciente.age}}</div>
      <div>Sexo: {{paciente.gender}}</div>
    </div>

    <div class="watermark">℞</div>

    <div class="content-area">
      <div style="margin-bottom:5px;">
        <div style="font-weight:bold; color:#667eea; margin-bottom:3px;">Motivo de Consulta:</div>
        <div style="padding:8px; background:white; border-radius:5px; font-size:13px; border:1px solid #e0e7ff;">
          {{motivo}}
        </div>
      </div>

      <div style="margin-bottom:5px;">
        <div style="font-weight:bold; color:#667eea; margin-bottom:3px;">Diagnóstico:</div>
        <div style="padding:8px; background:white; border-radius:5px; font-size:13px; border:1px solid #e0e7ff;">
          {{diagnostico}}
        </div>
      </div>

      <div style="margin-bottom:5px;">
        <div style="font-weight:bold; color:#667eea; margin-bottom:3px;">Prescripción:</div>
        <div class="medicamentos-grid">
          {{medicamentos}}
        </div>
      </div>

      <div>
        <div style="font-weight:bold; color:#667eea; margin-bottom:3px;">Indicaciones y Tratamiento:</div>
        <div style="padding:10px; background:white; border-radius:5px; font-size:13px; border:1px solid #e0e7ff;">
          {{indicaciones}}
        </div>
      </div>
    </div>

    <div class="signature">
      <div class="signature-line"></div>
      <div style="font-weight:bold; color:#667eea;">{{doctor.name}}</div>
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
}

export default new PDFService();
