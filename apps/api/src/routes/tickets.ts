import { Router } from 'express';
import { getTicketsForStore, acceptTicket, declineTicket } from '../services/ticketService';

export const ticketsRouter = Router();

ticketsRouter.get('/store/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const tickets = await getTicketsForStore(storeId);
    res.json({ data: tickets });
  } catch (error: any) {
    console.error('Get tickets error:', error);
    res.status(400).json({ error: error.message });
  }
});

ticketsRouter.post('/:ticketId/accept', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { storeId } = req.body;

    if (!storeId) {
      return res.status(400).json({ error: 'storeId is required.' });
    }

    const order = await acceptTicket(storeId, ticketId);
    res.json({ data: order, message: 'Order accepted successfully!' });
  } catch (error: any) {
    console.error('Accept ticket error:', error);
    res.status(400).json({ error: error.message });
  }
});

ticketsRouter.post('/:ticketId/decline', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { storeId } = req.body;

    if (!storeId) {
      return res.status(400).json({ error: 'storeId is required.' });
    }

    const result = await declineTicket(storeId, ticketId);
    res.json({ data: result, message: 'Ticket declined.' });
  } catch (error: any) {
    console.error('Decline ticket error:', error);
    res.status(400).json({ error: error.message });
  }
});

import { markTicketPacked } from '../services/ticketService';

ticketsRouter.post('/:ticketId/pack', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { storeId } = req.body;

    if (!storeId) {
      return res.status(400).json({ error: 'storeId is required.' });
    }

    const order = await markTicketPacked(storeId, ticketId);
    res.json({ data: order, message: 'Order marked as packed successfully!' });
  } catch (error: any) {
    console.error('Pack ticket error:', error);
    res.status(400).json({ error: error.message });
  }
});

import { markTicketReady, markTicketDelivered } from '../services/ticketService';

ticketsRouter.post('/:ticketId/ready', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { storeId } = req.body;

    if (!storeId) {
      return res.status(400).json({ error: 'storeId is required.' });
    }

    const order = await markTicketReady(storeId, ticketId);
    res.json({ data: order, message: 'Order marked as ready successfully!' });
  } catch (error: any) {
    console.error('Ready ticket error:', error);
    res.status(400).json({ error: error.message });
  }
});

ticketsRouter.post('/:ticketId/deliver', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { storeId } = req.body;

    if (!storeId) {
      return res.status(400).json({ error: 'storeId is required.' });
    }

    const order = await markTicketDelivered(storeId, ticketId);
    res.json({ data: order, message: 'Order marked as delivered successfully!' });
  } catch (error: any) {
    console.error('Deliver ticket error:', error);
    res.status(400).json({ error: error.message });
  }
});

