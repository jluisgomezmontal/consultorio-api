import express from 'express';
import stripeController from '../controllers/stripe.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// Webhook de Stripe (NO requiere autenticación, Stripe lo valida con signature)
// IMPORTANTE: Este endpoint debe usar express.raw() para el body
router.post('/webhook', stripeController.handleWebhook);

// Rutas que requieren autenticación
router.use(authenticate);

// Crear sesión de checkout
router.post('/create-checkout-session', stripeController.createCheckoutSession);

// Crear portal de cliente
router.post('/create-customer-portal', stripeController.createCustomerPortal);

// Cancelar suscripción
router.post('/cancel-subscription', stripeController.cancelSubscription);

export default router;
