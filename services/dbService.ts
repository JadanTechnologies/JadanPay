
import { supabase } from '../utils/supabase';
import { Transaction, Ticket, TicketMessage, AppNotification, User } from '../types';

export const DbService = {
    // --- TRANSACTIONS ---
    async getTransactions(userId: string) {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Map to App Type
        return data.map((t: any) => ({
            ...t,
            date: t.created_at, // Map created_at to date
        })) as Transaction[];
    },

    async addTransaction(tx: Partial<Transaction>) {
        // We only insert essential fields, letting DB handle defaults (id, created_at)
        const { data, error } = await supabase
            .from('transactions')
            .insert([{
                user_id: tx.userId,
                type: tx.type,
                amount: tx.amount,
                status: tx.status,
                reference: tx.reference,
                metadata: {
                    destination: tx.destinationNumber,
                    bundle: tx.bundleName,
                    ...tx
                }
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // --- TICKETS ---
    async getTickets(userId: string) {
        const { data, error } = await supabase
            .from('tickets')
            .select(`
            *,
            messages:ticket_messages(*)
        `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map((t: any) => ({
            ...t,
            date: t.created_at,
            messages: t.messages.map((m: any) => ({ ...m, date: m.created_at }))
        })) as Ticket[];
    },

    async createTicket(userId: string, subject: string, message: string, priority: string) {
        // 1. Create Ticket
        const { data: ticket, error: tError } = await supabase
            .from('tickets')
            .insert([{ user_id: userId, subject, priority, status: 'open' }])
            .select()
            .single();

        if (tError) throw tError;

        // 2. Create Initial Message
        const { error: mError } = await supabase
            .from('ticket_messages')
            .insert([{ ticket_id: ticket.id, sender_id: userId, message, is_admin: false }]);

        if (mError) throw mError;

        return ticket;
    },

    // --- NOTIFICATIONS ---
    async getNotifications(userId: string) {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map((n: any) => ({ ...n, date: n.created_at })) as AppNotification[];
    },

    async markRead(userId: string) {
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId);
    }
};
