import stripeService from '../services/stripe.service.js';

class StripeController {
  /**
   * Crear sesión de checkout
   */
  async createCheckoutSession(req, res) {
    try {
      const { paquete, tipoPago } = req.body;
      const consultorioId = req.user.consultoriosIds?.[0] || req.user.consultorioId;

      if (!consultorioId) {
        return res.status(400).json({
          success: false,
          message: 'Usuario no tiene consultorio asignado',
        });
      }

      if (!paquete) {
        return res.status(400).json({
          success: false,
          message: 'Paquete es requerido',
        });
      }

      const session = await stripeService.createCheckoutSession(
        consultorioId,
        paquete,
        tipoPago || 'mensual'
      );

      res.json({
        success: true,
        data: {
          sessionId: session.id,
          url: session.url,
        },
      });
    } catch (error) {
      console.error('Error al crear sesión de checkout:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear sesión de checkout',
      });
    }
  }

  /**
   * Crear portal de cliente
   */
  async createCustomerPortal(req, res) {
    try {
      const consultorioId = req.user.consultoriosIds?.[0] || req.user.consultorioId;

      if (!consultorioId) {
        return res.status(400).json({
          success: false,
          message: 'Usuario no tiene consultorio asignado',
        });
      }

      const session = await stripeService.createCustomerPortal(consultorioId);

      res.json({
        success: true,
        data: {
          url: session.url,
        },
      });
    } catch (error) {
      console.error('Error al crear portal de cliente:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear portal de cliente',
      });
    }
  }

  /**
   * Webhook de Stripe
   */
  async handleWebhook(req, res) {
    const signature = req.headers['stripe-signature'];

    console.log('=== WEBHOOK RECIBIDO ===');
    console.log('Signature:', signature ? 'Presente' : 'Faltante');

    try {
      // Construir evento verificando la signature
      const event = stripeService.constructWebhookEvent(req.body, signature);
      
      console.log('Evento verificado:', event.type);
      console.log('Metadata:', event.data.object.metadata);

      // Procesar evento
      await stripeService.processWebhookEvent(event);

      console.log('=== WEBHOOK PROCESADO EXITOSAMENTE ===');
      res.json({ received: true });
    } catch (error) {
      console.error('=== ERROR EN WEBHOOK ===');
      console.error('Error completo:', error);
      console.error('Stack:', error.stack);
      res.status(400).json({
        success: false,
        message: error.message || 'Error procesando webhook',
      });
    }
  }

  /**
   * Cancelar suscripción
   */
  async cancelSubscription(req, res) {
    try {
      const consultorioId = req.user.consultoriosIds?.[0] || req.user.consultorioId;

      if (!consultorioId) {
        return res.status(400).json({
          success: false,
          message: 'Usuario no tiene consultorio asignado',
        });
      }

      const subscription = await stripeService.cancelSubscription(consultorioId);

      res.json({
        success: true,
        data: {
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
        message: 'Suscripción cancelada. Tendrás acceso hasta el final del periodo pagado.',
      });
    } catch (error) {
      console.error('Error al cancelar suscripción:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al cancelar suscripción',
      });
    }
  }
}

export default new StripeController();
