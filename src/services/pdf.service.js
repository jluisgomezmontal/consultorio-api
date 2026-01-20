import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PDFService {
  constructor() {
    this.watermarkSVGs = this.loadWatermarkSVGs();
  }

  loadWatermarkSVGs() {
    const assetsPath = path.join(__dirname, '../assets');
    
    try {
      const svg1 = readFileSync(path.join(assetsPath, '29800.svg'), 'utf-8');
      const svg2 = readFileSync(path.join(assetsPath, '1301891.svg'), 'utf-8');
      const svg3 = readFileSync(path.join(assetsPath, '1639328.svg'), 'utf-8');
      
      return {
        svg1: `data:image/svg+xml;base64,${Buffer.from(svg1).toString('base64')}`,
        svg2: `data:image/svg+xml;base64,${Buffer.from(svg2).toString('base64')}`,
        svg3: `data:image/svg+xml;base64,${Buffer.from(svg3).toString('base64')}`
      };
    } catch (error) {
      console.error('Error loading watermark SVGs:', error);
      return {
        svg1: '',
        svg2: '',
        svg3: ''
      };
    }
  }
  /**
   * Generates a prescription PDF using Puppeteer
   */
  async generatePrescriptionPDF(prescriptionData, templateName = 'classic') {
    let browser;
    
    try {
      console.log('📄 Iniciando generación de PDF...');
      console.log('Template:', templateName);
      
      const template = this.getTemplate(templateName);
      const html = this.populateTemplate(template, prescriptionData);

      console.log('🚀 Lanzando Puppeteer...');
      
      // Use same configuration for both local and production
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions',
        ],
        timeout: 60000,
      });

      console.log('✅ Puppeteer lanzado correctamente');
      
      const page = await browser.newPage();
      console.log('📝 Configurando contenido HTML...');
      
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
      
      console.log('🖨️ Generando PDF...');
      
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
      });

      console.log('✅ PDF generado exitosamente');
      
      await browser.close();
      
      return pdfBuffer;
    } catch (error) {
      console.error('❌ Error en generatePrescriptionPDF:', error.message);
      console.error('Stack:', error.stack);
      
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error('Error cerrando browser:', closeError);
        }
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
      <div style="margin-bottom: 5px; padding: 5px; background: #f8f9fa; border-left: 3px solid #007bff;">
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
    const watermarkSrc = this.watermarkSVGs.svg1;
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
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #3a3f4d;
      background: #fff;
      letter-spacing: -0.01em;
    }

    .page {
      width: 287mm;
      height: auto;
      max-height: 200mm;
      padding: 8mm;
      margin: 0 auto;
      position: relative;
      border-left: 4px solid #3eb8c4;
    }

    /* ================= HEADER ================= */

    .header {
      margin-bottom: 8mm;
      display: flex;
      align-items: center;
      gap: 20px;
      padding-bottom: 6mm;
      border-bottom: 1px solid #e5e6e8;
    }

    .header-logo {
      width: 80px;
      height: 80px;
      flex-shrink: 0;
    }

    .header-logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .header-info {
      flex: 1;
    }

    .consultorio-name {
      font-size: 18px;
      font-weight: 600;
      color: #3a3f4d;
      margin-bottom: 4px;
      letter-spacing: -0.02em;
    }

    .doctor-name {
      font-size: 15px;
      font-weight: 500;
      color: #3eb8c4;
      margin-bottom: 6px;
    }

    .consultorio-description {
      font-size: 11px;
      color: #6b7280;
      margin-bottom: 2px;
      line-height: 1.4;
    }

    .specialty {
      font-size: 10px;
      color: #9ca3af;
    }

    /* ================= PACIENTE ================= */

    .patient-section {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 15px;
      margin-bottom: 8mm;
      padding: 4mm;
      background: #f9fafb;
      border-radius: 6px;
    }

    .field {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }

    .field-value {
      font-size: 13px;
      color: #3a3f4d;
      font-weight: 500;
    }

    /* ================= CONTENIDO ================= */

    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0.04;
      width: 350px;
      height: 350px;
      pointer-events: none;
    }

    .watermark img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .content-area {
      margin-bottom: 6mm;
    }

    .section-title {
      font-size: 12px;
      font-weight: 600;
      color: #3a3f4d;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .section-content {
      font-size: 12px;
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 5mm;
    }

    /* ================= MEDICAMENTOS ================= */

    .medicamentos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .medicamento-item {
      font-size: 12px;
      padding: 8px 12px;
      border-left: 3px solid #3eb8c4;
      background: #f9fafb;
      line-height: 1.5;
      break-inside: avoid;
    }

    .medicamento-item strong {
      color: #3a3f4d;
      font-weight: 600;
    }

    /* ================= FIRMA ================= */

    .signature {
      margin-top: 8mm;
      text-align: right;
    }

    .signature-line {
      border-top: 1px solid #d1d5db;
      width: 200px;
      margin-left: auto;
      margin-bottom: 6px;
    }

    .signature-name {
      font-size: 12px;
      font-weight: 500;
      color: #3a3f4d;
    }

    /* ================= FOOTER ================= */

    .footer {
      margin-top: 6mm;
      padding-top: 4mm;
      border-top: 1px solid #e5e6e8;
      font-size: 10px;
      color: #9ca3af;
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
        <div class="field">Paciente</div>
        <div class="field-value">{{paciente.fullName}}</div>
      </div>
      <div>
        <div class="field">Edad / Sexo</div>
        <div class="field-value">{{paciente.age}} años / {{paciente.gender}}</div>
      </div>
      <div>
        <div class="field">Fecha</div>
        <div class="field-value">{{fecha}}</div>
      </div>
    </div>

    <div class="watermark">
      <img src="${watermarkSrc}" alt="Medical Symbol" />
    </div>

    <!-- CONTENIDO -->
    <div class="content-area">

      <div>
        <div class="section-title">Motivo de Consulta</div>
        <div class="section-content">{{motivo}}</div>
      </div>

      <div>
        <div class="section-title">Diagnóstico</div>
        <div class="section-content">{{diagnostico}}</div>
      </div>

      <div>
        <div class="section-title">Prescripción</div>
        <div class="medicamentos-grid">
          {{medicamentos}}
        </div>
      </div>

      <div style="margin-top:5mm;">
        <div class="section-title">Indicaciones y Tratamiento</div>
        <div class="section-content">{{indicaciones}}</div>
      </div>

    </div>

    <!-- FIRMA -->
    <div class="signature">
      <div class="signature-line"></div>
      <div class="signature-name">{{doctor.name}}</div>
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
    const watermarkSrc = this.watermarkSVGs.svg2;
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
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #3a3f4d;
      background: #fff;
      letter-spacing: -0.01em;
    }

    .page {
      width: 287mm;
      height: auto;
      max-height: 200mm;
      padding: 6mm;
      margin: 0 auto;
      position: relative;
      border-left: 4px solid #3eb8c4;
    }

    .header {
      margin-bottom: 4mm;
      display: flex;
      align-items: center;
      gap: 15px;
      padding-bottom: 3mm;
      border-bottom: 1px solid #e5e6e8;
    }

    .header-logo {
      width: 100px;
      height: 100px;
      flex-shrink: 0;
    }

    .header-logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .header-info {
      flex: 1;
      text-align: center;
    }

    .consultorio-name {
      font-size: 18px;
      font-weight: 600;
      color: #3a3f4d;
      margin-bottom: 4px;
      letter-spacing: -0.02em;
    }

    .doctor-name {
      font-size: 15px;
      font-weight: 500;
      color: #3eb8c4;
      margin-bottom: 6px;
    }

    .consultorio-description {
      font-size: 11px;
      color: #9ca3af;
      margin-bottom: 3px;
      line-height: 1.5;
    }

    .specialty {
      font-size: 10px;
      color: #9ca3af;
    }

    .patient-section {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 12px;
      margin-bottom: 4mm;
      padding: 3mm;
      background: #f9fafb;
      border-radius: 6px;
    }

    .field {
      font-size: 10px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 5px;
    }

    .field-value {
      font-size: 13px;
      color: #3a3f4d;
      font-weight: 500;
    }

    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0.03;
      width: 380px;
      height: 380px;
      pointer-events: none;
    }

    .watermark img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .content-area {
      margin-bottom: 3mm;
    }

    .section {
      margin-bottom: 3mm;
    }

    .section-title {
      font-size: 11px;
      font-weight: 600;
      color: #3a3f4d;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .section-content {
      font-size: 12px;
      color: #4b5563;
      line-height: 1.5;
    }

    .medicamentos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .medicamento-item {
      font-size: 12px;
      padding: 8px 12px;
      border-left: 3px solid #3eb8c4;
      background: #f9fafb;
      line-height: 1.5;
      break-inside: avoid;
    }

    .medicamento-item strong {
      color: #3a3f4d;
      font-weight: 600;
      display: block;
      margin-bottom: 2px;
    }

    .signature {
      margin-top: 3mm;
      text-align: right;
    }

    .signature-line {
      border-top: 1px solid #d1d5db;
      width: 180px;
      margin-left: auto;
      margin-bottom: 4px;
    }

    .signature-name {
      font-size: 12px;
      font-weight: 500;
      color: #3a3f4d;
    }

    .footer {
      margin-top: 3mm;
      padding-top: 2mm;
      border-top: 1px solid #e5e6e8;
      font-size: 10px;
      color: #9ca3af;
      text-align: center;
      display: flex;
      justify-content: center;
      gap: 25px;
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
        <div class="field">Paciente</div>
        <div class="field-value">{{paciente.fullName}}</div>
      </div>
      <div>
        <div class="field">Edad</div>
        <div class="field-value">{{paciente.age}} años</div>
      </div>
      <div>
        <div class="field">Sexo</div>
        <div class="field-value">{{paciente.gender}}</div>
      </div>
      <div>
        <div class="field">Fecha</div>
        <div class="field-value">{{fecha}}</div>
      </div>
    </div>

    <div class="watermark">
      <img src="${watermarkSrc}" alt="Medical Symbol" />
    </div>

    <div class="content-area">
      <div class="section">
        <div class="section-title">Motivo de Consulta</div>
        <div class="section-content">{{motivo}}</div>
      </div>

      <div class="section">
        <div class="section-title">Diagnóstico</div>
        <div class="section-content">{{diagnostico}}</div>
      </div>

      <div class="section">
        <div class="section-title">Prescripción</div>
        <div class="medicamentos-grid">
          {{medicamentos}}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Indicaciones y Tratamiento</div>
        <div class="section-content">{{indicaciones}}</div>
      </div>
    </div>

    <div class="signature">
      <div class="signature-line"></div>
      <div class="signature-name">{{doctor.name}}</div>
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
   * Template 3 - Dark Mode Style (Estilo modo oscuro)
   */
  getTemplate3() {
    const watermarkSrc = this.watermarkSVGs.svg1;
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
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #3a3f4d;
      background: #fff;
      letter-spacing: -0.01em;
    }

    .page {
      width: 287mm;
      height: auto;
      max-height: 200mm;
      padding: 8mm;
      margin: 0 auto;
      position: relative;
      border-left: 4px solid #4dd4e0;
    }

    .header {
      margin-bottom: 8mm;
      display: flex;
      align-items: center;
      gap: 20px;
      padding-bottom: 6mm;
      border-bottom: 1px solid #e5e6e8;
    }

    .header-logo {
      width: 80px;
      height: 80px;
      flex-shrink: 0;
    }

    .header-logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .header-info {
      flex: 1;
    }

    .consultorio-name {
      font-size: 18px;
      font-weight: 600;
      color: #3a3f4d;
      margin-bottom: 4px;
      letter-spacing: -0.02em;
    }

    .doctor-name {
      font-size: 15px;
      font-weight: 500;
      color: #4dd4e0;
      margin-bottom: 6px;
    }

    .consultorio-description {
      font-size: 11px;
      color: #6b7280;
      margin-bottom: 2px;
      line-height: 1.4;
    }

    .specialty {
      font-size: 10px;
      color: #9ca3af;
    }

    .patient-section {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 15px;
      margin-bottom: 8mm;
      padding: 4mm;
      background: #f9fafb;
      border-radius: 6px;
    }

    .field {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }

    .field-value {
      font-size: 13px;
      color: #3a3f4d;
      font-weight: 500;
    }

    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0.04;
      width: 350px;
      height: 350px;
      pointer-events: none;
    }

    .watermark img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .content-area {
      margin-bottom: 6mm;
    }

    .section-title {
      font-size: 12px;
      font-weight: 600;
      color: #3a3f4d;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .section-content {
      font-size: 12px;
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 5mm;
    }

    .medicamentos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .medicamento-item {
      font-size: 12px;
      padding: 8px 12px;
      border-left: 3px solid #4dd4e0;
      background: #f9fafb;
      line-height: 1.5;
      break-inside: avoid;
    }

    .medicamento-item strong {
      color: #3a3f4d;
      font-weight: 600;
    }

    .signature {
      margin-top: 8mm;
      text-align: right;
    }

    .signature-line {
      border-top: 1px solid #d1d5db;
      width: 200px;
      margin-left: auto;
      margin-bottom: 6px;
    }

    .signature-name {
      font-size: 12px;
      font-weight: 500;
      color: #3a3f4d;
    }

    .footer {
      margin-top: 6mm;
      padding-top: 4mm;
      border-top: 1px solid #e5e6e8;
      font-size: 10px;
      color: #9ca3af;
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
        <div class="field">Paciente</div>
        <div class="field-value">{{paciente.fullName}}</div>
      </div>
      <div>
        <div class="field">Edad</div>
        <div class="field-value">{{paciente.age}} años</div>
      </div>
      <div>
        <div class="field">Sexo</div>
        <div class="field-value">{{paciente.gender}}</div>
      </div>
      <div>
        <div class="field">Fecha</div>
        <div class="field-value">{{fecha}}</div>
      </div>
    </div>

    <div class="watermark">
      <img src="${watermarkSrc}" alt="Medical Symbol" />
    </div>

    <div class="content-area">
      <div class="section">
        <div class="section-title">Motivo de Consulta</div>
        <div class="section-content">{{motivo}}</div>
      </div>

      <div class="section">
        <div class="section-title">Diagnóstico</div>
        <div class="section-content">{{diagnostico}}</div>
      </div>

      <div class="section">
        <div class="section-title">Prescripción</div>
        <div class="medicamentos-grid">
          {{medicamentos}}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Indicaciones y Tratamiento</div>
        <div class="section-content">{{indicaciones}}</div>
      </div>
    </div>

    <div class="signature">
      <div class="signature-line"></div>
      <div class="signature-name">{{doctor.name}}</div>
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
   * Template 4 - Subtle Borders (Bordes sutiles)
   */
  getTemplate4() {
    const watermarkSrc = this.watermarkSVGs.svg2;
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
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #3a3f4d;
      background: #fff;
      letter-spacing: -0.01em;
    }

    .page {
      width: 287mm;
      height: auto;
      max-height: 200mm;
      padding: 5mm;
      margin: 0 auto;
      position: relative;
      border: 1px solid #e5e6e8;
      border-radius: 8px;
    }

    .header {
      margin-bottom: 3mm;
      display: flex;
      align-items: center;
      gap: 15px;
      padding-bottom: 2mm;
      border-bottom: 1px solid #e5e6e8;
    }

    .header-logo {
      width: 70px;
      height: 70px;
      flex-shrink: 0;
    }

    .header-logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .header-info {
      flex: 1;
    }

    .consultorio-name {
      font-size: 17px;
      font-weight: 600;
      color: #3a3f4d;
      margin-bottom: 5px;
      letter-spacing: -0.02em;
    }

    .doctor-name {
      font-size: 14px;
      font-weight: 500;
      color: #6b7280;
      margin-bottom: 6px;
    }

    .consultorio-description {
      font-size: 11px;
      color: #9ca3af;
      margin-bottom: 2px;
      line-height: 1.4;
    }

    .specialty {
      font-size: 10px;
      color: #9ca3af;
    }

    .patient-section {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 3mm;
      padding: 2mm 0;
    }

    .field {
      font-size: 10px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 4px;
    }

    .field-value {
      font-size: 13px;
      color: #3a3f4d;
      font-weight: 500;
    }

    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0.03;
      width: 370px;
      height: 370px;
      pointer-events: none;
    }

    .watermark img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .content-area {
      margin-bottom: 2mm;
    }

    .section {
      margin-bottom: 2mm;
    }

    .section-title {
      font-size: 11px;
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .section-content {
      font-size: 12px;
      color: #4b5563;
      line-height: 1.4;
    }

    .medicamentos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }

    .medicamento-item {
      font-size: 12px;
      padding: 4px 0;
      line-height: 1.4;
      break-inside: avoid;
    }

    .medicamento-item strong {
      color: #3a3f4d;
      font-weight: 600;
      display: block;
      margin-bottom: 2px;
    }

    .signature {
      margin-top: 2mm;
      text-align: right;
    }

    .signature-line {
      border-top: 1px solid #d1d5db;
      width: 180px;
      margin-left: auto;
      margin-bottom: 4px;
    }

    .signature-name {
      font-size: 12px;
      font-weight: 500;
      color: #3a3f4d;
    }

    .footer {
      margin-top: 2mm;
      padding-top: 2mm;
      border-top: 1px solid #e5e6e8;
      font-size: 10px;
      color: #9ca3af;
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
        <div class="field">Paciente</div>
        <div class="field-value">{{paciente.fullName}}</div>
      </div>
      <div>
        <div class="field">Edad</div>
        <div class="field-value">{{paciente.age}} años</div>
      </div>
      <div>
        <div class="field">Sexo</div>
        <div class="field-value">{{paciente.gender}}</div>
      </div>
      <div>
        <div class="field">Fecha</div>
        <div class="field-value">{{fecha}}</div>
      </div>
    </div>

    <div class="watermark">
      <img src="${watermarkSrc}" alt="Medical Symbol" />
    </div>

    <div class="content-area">
      <div class="section">
        <div class="section-title">Motivo de Consulta</div>
        <div class="section-content">{{motivo}}</div>
      </div>

      <div class="section">
        <div class="section-title">Diagnóstico</div>
        <div class="section-content">{{diagnostico}}</div>
      </div>

      <div class="section">
        <div class="section-title">Prescripción</div>
        <div class="medicamentos-grid">
          {{medicamentos}}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Indicaciones y Tratamiento</div>
        <div class="section-content">{{indicaciones}}</div>
      </div>
    </div>

    <div class="signature">
      <div class="signature-line"></div>
      <div class="signature-name">{{doctor.name}}</div>
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
   * Template 5 - Ultra Minimalist (Ultra minimalista)
   */
  getTemplate5() {
    const watermarkSrc = this.watermarkSVGs.svg3;
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
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #3a3f4d;
      background: #fff;
      letter-spacing: -0.01em;
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
      margin-bottom: 3mm;
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .header-logo {
      width: 65px;
      height: 65px;
      flex-shrink: 0;
    }

    .header-logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .header-info {
      flex: 1;
    }

    .consultorio-name {
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 4px;
      letter-spacing: -0.03em;
    }

    .doctor-name {
      font-size: 14px;
      font-weight: 500;
      color: #6b7280;
      margin-bottom: 6px;
    }

    .consultorio-description {
      font-size: 11px;
      color: #9ca3af;
      line-height: 1.5;
      margin-bottom: 2px;
    }

    .specialty {
      font-size: 10px;
      color: #9ca3af;
    }

    .patient-section {
      display: flex;
      gap: 20px;
      margin-bottom: 3mm;
      padding-bottom: 2mm;
      border-bottom: 1px solid #f3f4f6;
    }

    .field {
      font-size: 9px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 4px;
      font-weight: 500;
    }

    .field-value {
      font-size: 14px;
      color: #1f2937;
      font-weight: 500;
    }

    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0.02;
      width: 400px;
      height: 400px;
      pointer-events: none;
    }

    .watermark img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .content-area {
      margin-bottom: 2mm;
    }

    .section {
      margin-bottom: 2mm;
    }

    .section-title {
      font-size: 10px;
      font-weight: 600;
      color: #9ca3af;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }

    .section-content {
      font-size: 13px;
      color: #374151;
      line-height: 1.5;
    }

    .medicamentos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }

    .medicamento-item {
      font-size: 12px;
      padding: 4px 0;
      line-height: 1.5;
      break-inside: avoid;
    }

    .medicamento-item strong {
      color: #1f2937;
      font-weight: 600;
      display: block;
      margin-bottom: 2px;
    }

    .signature {
      margin-top: 2mm;
      text-align: right;
    }

    .signature-line {
      border-top: 1px solid #e5e7eb;
      width: 160px;
      margin-left: auto;
      margin-bottom: 4px;
    }

    .signature-name {
      font-size: 13px;
      font-weight: 500;
      color: #1f2937;
    }

    .footer {
      margin-top: 2mm;
      padding-top: 2mm;
      border-top: 1px solid #f3f4f6;
      font-size: 10px;
      color: #9ca3af;
      text-align: center;
      display: flex;
      justify-content: center;
      gap: 30px;
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
        <div class="field">Paciente</div>
        <div class="field-value">{{paciente.fullName}}</div>
      </div>
      <div>
        <div class="field">Edad</div>
        <div class="field-value">{{paciente.age}} años</div>
      </div>
      <div>
        <div class="field">Sexo</div>
        <div class="field-value">{{paciente.gender}}</div>
      </div>
      <div>
        <div class="field">Fecha</div>
        <div class="field-value">{{fecha}}</div>
      </div>
    </div>

    <div class="watermark">
      <img src="${watermarkSrc}" alt="Medical Symbol" />
    </div>

    <div class="content-area">
      <div class="section">
        <div class="section-title">Motivo de Consulta</div>
        <div class="section-content">{{motivo}}</div>
      </div>

      <div class="section">
        <div class="section-title">Diagnóstico</div>
        <div class="section-content">{{diagnostico}}</div>
      </div>

      <div class="section">
        <div class="section-title">Prescripción</div>
        <div class="medicamentos-grid">
          {{medicamentos}}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Indicaciones y Tratamiento</div>
        <div class="section-content">{{indicaciones}}</div>
      </div>
    </div>

    <div class="signature">
      <div class="signature-line"></div>
      <div class="signature-name">{{doctor.name}}</div>
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
