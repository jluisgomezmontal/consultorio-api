import { BadRequestError } from '../utils/errors.js';

class AIService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.apiUrl = 'https://api.deepseek.com/v1/chat/completions';
  }

  async suggestTreatment(diagnostico, pacienteInfo = {}) {
    if (!this.apiKey) {
      throw new BadRequestError('DeepSeek API key not configured');
    }

    if (!diagnostico || diagnostico.trim() === '') {
      throw new BadRequestError('Diagnóstico is required for AI suggestions');
    }

    const prompt = this.buildPrompt(diagnostico, pacienteInfo);
    // console.log(prompt)
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'Eres un asistente médico experto que ayuda a doctores a sugerir tratamientos y medicamentos basados en diagnósticos. Responde ÚNICAMENTE en formato JSON válido sin texto adicional. Usa terminología médica precisa en español.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000,
          response_format: { type: 'json_object' }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`DeepSeek API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from DeepSeek API');
      }

      const parsedContent = JSON.parse(content);

      return {
        tratamiento: parsedContent.tratamiento || '',
        medicamentos: parsedContent.medicamentos || [],
        notas: parsedContent.notas || '',
        advertencias: parsedContent.advertencias || []
      };
    } catch (error) {
      if (error.message.includes('JSON')) {
        throw new BadRequestError('Error parsing AI response. Please try again.');
      }
      throw new BadRequestError(`AI service error: ${error.message}`);
    }
  }

  buildPrompt(diagnostico, pacienteInfo) {
    // console.log({pacienteInfo})
    const { edad, peso, alergias, genero } = pacienteInfo;

    let prompt = `Basándote en el siguiente diagnóstico médico, proporciona un plan de tratamiento y lista de medicamentos apropiados.\n\n`;
    prompt += `**Diagnóstico:** ${diagnostico}\n\n`;

    if (genero) {
      prompt += `**Genero del paciente:** ${genero}\n`;
    }
    if (edad) {
      prompt += `**Edad del paciente:** ${edad} años\n`;
    }

    if (peso) {
      prompt += `**Peso del paciente:** ${peso} kg\n`;
    }

    if (alergias && alergias.length > 0) {
      prompt += `**Alergias medicamentosas:** ${alergias.join(', ')}\n`;
      prompt += `⚠️ IMPORTANTE: NO sugieras medicamentos que contengan estos componentes o sus derivados.\n`;
    }

    prompt += `\nResponde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura exacta:\n`;
    prompt += `{\n`;
    prompt += `  "tratamiento": "Descripción del tratamiento no farmacológico (reposo, dieta, ejercicios, etc.)",\n`;
    prompt += `  "medicamentos": [\n`;
    prompt += `    {\n`;
    prompt += `      "nombre": "Nombre del medicamento con concentración",\n`;
    prompt += `      "dosis": "Cantidad por toma",\n`;
    prompt += `      "frecuencia": "Cada cuántas horas",\n`;
    prompt += `      "duracion": "Duración del tratamiento",\n`;
    prompt += `      "indicaciones": "Indicaciones especiales (con/sin alimentos, etc.)"\n`;
    prompt += `    }\n`;
    prompt += `  ],\n`;
    prompt += `  "notas": "Notas adicionales importantes para el médico",\n`;
    prompt += `  "advertencias": ["Lista de advertencias o contraindicaciones importantes"]\n`;
    prompt += `}\n\n`;
    prompt += `Considera:\n`;
    prompt += `- Dosis apropiadas para la edad y peso del paciente\n`;
    prompt += `- Interacciones medicamentosas comunes\n`;
    prompt += `- Efectos secundarios relevantes\n`;
    prompt += `- Contraindicaciones importantes\n`;
    prompt += `- Medicamentos genéricos cuando sea posible\n`;
    prompt += `- Sugiere entre 1 y 5 medicamentos según la complejidad del diagnóstico\n\n`;
    prompt += `IMPORTANTE: Esta es una sugerencia para asistir al médico. El doctor debe revisar y aprobar todas las recomendaciones.`;

    return prompt;
  }
}

export default new AIService();
