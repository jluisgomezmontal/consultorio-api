import Stripe from 'stripe';
import { Consultorio, Paquete } from '../models/index.js';

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

class StripeService {
  _checkStripeConfigured() {
    if (!stripe) {
      throw new Error('Stripe no está configurado. Configure STRIPE_SECRET_KEY en las variables de entorno.');
    }
  }

  /**
   * Crear o obtener customer de Stripe
   */
  async getOrCreateCustomer(consultorio) {
    this._checkStripeConfigured();
    // Si ya tiene customer ID, devolverlo
    if (consultorio.stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(consultorio.stripeCustomerId);
        return customer;
      } catch (error) {
        console.error('[Stripe] Error al obtener customer:', error);
        // Si el customer no existe, crear uno nuevo
      }
    }

    // Crear nuevo customer
    const customer = await stripe.customers.create({
      email: consultorio.email,
      name: consultorio.name,
      metadata: {
        consultorioId: consultorio._id.toString(),
      },
    });

    // Guardar customer ID
    consultorio.stripeCustomerId = customer.id;
    await consultorio.save();

    return customer;
  }

  /**
   * Crear sesión de checkout para suscripción
   */
  async createCheckoutSession(consultorioId, paqueteNombre, tipoPago = 'mensual') {
    this._checkStripeConfigured();
    const consultorio = await Consultorio.findById(consultorioId);
    if (!consultorio) {
      throw new Error('Consultorio no encontrado');
    }

    const paquete = await Paquete.findOne({ nombre: paqueteNombre });
    if (!paquete) {
      throw new Error('Paquete no encontrado');
    }

    // Validar que el paquete tenga price ID configurado
    const priceId = paquete.stripePriceIds?.[tipoPago];
    if (!priceId) {
      throw new Error(`Price ID no configurado para ${paqueteNombre} ${tipoPago}. Configure los stripePriceIds en el paquete o actualice manualmente desde el panel de administración.`);
    }

    // Obtener o crear customer
    const customer = await this.getOrCreateCustomer(consultorio);

    // Crear sesión de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/configuracion/paquetes?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/configuracion/paquetes?canceled=true`,
      metadata: {
        consultorioId: consultorio._id.toString(),
        paquete: paqueteNombre,
        tipoPago: tipoPago,
      },
      subscription_data: {
        metadata: {
          consultorioId: consultorio._id.toString(),
          paquete: paqueteNombre,
        },
      },
    });

    return session;
  }

  /**
   * Crear portal de cliente para gestionar suscripción
   */
  async createCustomerPortal(consultorioId) {
    this._checkStripeConfigured();
    const consultorio = await Consultorio.findById(consultorioId);
    if (!consultorio) {
      throw new Error('Consultorio no encontrado');
    }

    if (!consultorio.stripeCustomerId) {
      throw new Error('Consultorio no tiene customer de Stripe');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: consultorio.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/configuracion/paquetes`,
    });

    return session;
  }

  /**
   * Manejar evento de webhook: checkout.session.completed
   */
  async handleCheckoutCompleted(session) {
    const consultorioId = session.metadata.consultorioId;
    const paquete = session.metadata.paquete;
    const tipoPago = session.metadata.tipoPago;

    console.log('[Stripe Webhook] Checkout completado:', {
      consultorioId,
      paquete,
      tipoPago,
      sessionId: session.id,
    });

    const consultorio = await Consultorio.findById(consultorioId);
    if (!consultorio) {
      console.error('[Stripe Webhook] Consultorio no encontrado:', consultorioId);
      return;
    }

    // Obtener la suscripción
    const subscriptionId = session.subscription;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    console.log('[Stripe Webhook] Subscription data:', {
      subscriptionId,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      status: subscription.status,
    });

    // Actualizar consultorio
    consultorio.paquete = paquete;
    consultorio.stripeSubscriptionId = subscriptionId;
    consultorio.suscripcion.estado = 'activa';
    consultorio.suscripcion.tipoPago = tipoPago;
    
    if (subscription.current_period_start) {
      consultorio.suscripcion.fechaInicio = new Date(subscription.current_period_start * 1000);
    }
    
    if (subscription.current_period_end) {
      consultorio.suscripcion.fechaVencimiento = new Date(subscription.current_period_end * 1000);
    }

    await consultorio.save();

    console.log('[Stripe Webhook] Suscripción activada:', {
      consultorioId,
      paquete,
      subscriptionId,
      fechaInicio: consultorio.suscripcion.fechaInicio,
      fechaVencimiento: consultorio.suscripcion.fechaVencimiento,
    });
  }

  /**
   * Manejar evento de webhook: customer.subscription.updated
   */
  async handleSubscriptionUpdated(subscription) {
    const consultorioId = subscription.metadata.consultorioId;

    console.log('[Stripe Webhook] Suscripción actualizada:', {
      consultorioId,
      subscriptionId: subscription.id,
      status: subscription.status,
    });

    const consultorio = await Consultorio.findById(consultorioId);
    if (!consultorio) {
      console.error('[Stripe Webhook] Consultorio no encontrado:', consultorioId);
      return;
    }

    // Mapear estado de Stripe a nuestro estado
    let estado = 'activa';
    if (subscription.status === 'active') {
      estado = 'activa';
    } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
      estado = 'vencida';
    } else if (subscription.status === 'canceled') {
      estado = 'cancelada';
    } else if (subscription.status === 'trialing') {
      estado = 'trial';
    }

    // Actualizar consultorio
    consultorio.suscripcion.estado = estado;
    consultorio.suscripcion.fechaVencimiento = new Date(subscription.current_period_end * 1000);

    await consultorio.save();

    console.log('[Stripe Webhook] Estado actualizado:', {
      consultorioId,
      estado,
      fechaVencimiento: consultorio.suscripcion.fechaVencimiento,
    });
  }

  /**
   * Manejar evento de webhook: customer.subscription.deleted
   */
  async handleSubscriptionDeleted(subscription) {
    const consultorioId = subscription.metadata.consultorioId;

    console.log('[Stripe Webhook] Suscripción cancelada:', {
      consultorioId,
      subscriptionId: subscription.id,
    });

    const consultorio = await Consultorio.findById(consultorioId);
    if (!consultorio) {
      console.error('[Stripe Webhook] Consultorio no encontrado:', consultorioId);
      return;
    }

    // Actualizar consultorio
    consultorio.suscripcion.estado = 'cancelada';
    consultorio.stripeSubscriptionId = null;

    await consultorio.save();

    console.log('[Stripe Webhook] Suscripción marcada como cancelada:', consultorioId);
  }

  /**
   * Manejar evento de webhook: invoice.payment_succeeded
   */
  async handlePaymentSucceeded(invoice) {
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) return;

    console.log('[Stripe Webhook] Pago exitoso:', {
      invoiceId: invoice.id,
      subscriptionId,
      amount: invoice.amount_paid / 100,
    });

    // Obtener suscripción para actualizar fecha de vencimiento
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const consultorioId = subscription.metadata.consultorioId;

    const consultorio = await Consultorio.findById(consultorioId);
    if (!consultorio) {
      console.error('[Stripe Webhook] Consultorio no encontrado:', consultorioId);
      return;
    }

    // Actualizar fecha de vencimiento
    consultorio.suscripcion.estado = 'activa';
    
    if (subscription.current_period_end) {
      consultorio.suscripcion.fechaVencimiento = new Date(subscription.current_period_end * 1000);
    }

    await consultorio.save();

    console.log('[Stripe Webhook] Fecha de vencimiento actualizada:', {
      consultorioId,
      fechaVencimiento: consultorio.suscripcion.fechaVencimiento,
    });
  }

  /**
   * Manejar evento de webhook: invoice.payment_failed
   */
  async handlePaymentFailed(invoice) {
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) return;

    console.log('[Stripe Webhook] Pago fallido:', {
      invoiceId: invoice.id,
      subscriptionId,
      amount: invoice.amount_due / 100,
    });

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const consultorioId = subscription.metadata.consultorioId;

    const consultorio = await Consultorio.findById(consultorioId);
    if (!consultorio) {
      console.error('[Stripe Webhook] Consultorio no encontrado:', consultorioId);
      return;
    }

    // Marcar como vencida
    consultorio.suscripcion.estado = 'vencida';

    await consultorio.save();

    console.log('[Stripe Webhook] Suscripción marcada como vencida por pago fallido:', consultorioId);
  }

  /**
   * Procesar evento de webhook
   */
  async processWebhookEvent(event) {
    console.log('[Stripe Webhook] Evento recibido:', event.type);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        default:
          console.log('[Stripe Webhook] Evento no manejado:', event.type);
      }
    } catch (error) {
      console.error('[Stripe Webhook] Error procesando evento:', error);
      throw error;
    }
  }

  /**
   * Verificar signature de webhook
   */
  constructWebhookEvent(payload, signature) {
    this._checkStripeConfigured();
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  }

  /**
   * Cancelar suscripción
   */
  async cancelSubscription(consultorioId) {
    this._checkStripeConfigured();
    const consultorio = await Consultorio.findById(consultorioId);
    if (!consultorio) {
      throw new Error('Consultorio no encontrado');
    }

    if (!consultorio.stripeSubscriptionId) {
      throw new Error('Consultorio no tiene suscripción activa');
    }

    // Cancelar al final del periodo
    const subscription = await stripe.subscriptions.update(
      consultorio.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    return subscription;
  }
}

export default new StripeService();
