import { SettingsService } from './settingsService';

// Base URL from documentation
const BASE_URL = 'https://app.bilalsadasub.com/api/v1';

export const BilalService = {
    /**
     * Map internal provider enum to Bilal's expected network strings
     */
    getNetworkId: (provider: string) => {
        const map: Record<string, string> = {
            'MTN': 'mtn',
            'GLO': 'glo',
            'AIRTEL': 'airtel',
            '9MOBILE': '9mobile' // or etisalat depending on specific api
        };
        return map[provider] || provider.toLowerCase();
    },

    /**
     * Purchase Airtime via BilalSadaSub
     */
    buyAirtime: async (network: string, phone: string, amount: number) => {
        const settings = await SettingsService.getSettings();
        
        if (!settings.useBilalService || !settings.bilalApiKey) {
            console.log("[Mock] Bilal Service skipped (disabled or no key). using Mock success.");
            return { ok: true, data: { status: 'mock_success' } };
        }

        const payload = {
            network: BilalService.getNetworkId(network),
            phone,
            amount
        };

        console.log(`[Bilal Integration] POST ${BASE_URL}/airtime`);
        console.log("Headers:", { Authorization: `Bearer ${settings.bilalApiKey}` });
        console.log("Payload:", payload);

        // NOTE: In a real browser environment, calling a 3rd party API directly 
        // often fails due to CORS. In production, this call happens on your Node backend.
        // We simulate the API latency and success response here.
        
        await new Promise(r => setTimeout(r, 1500));

        // Simulate success response from Bilal
        return { 
            ok: true, 
            data: { 
                status: 'success', 
                message: 'Airtime purchase successful', 
                ref: `BILAL-${Math.floor(Math.random() * 10000000)}` 
            } 
        };
    },

    /**
     * Purchase Data via BilalSadaSub
     */
    buyData: async (network: string, phone: string, planId: string) => {
        const settings = await SettingsService.getSettings();

        if (!settings.useBilalService || !settings.bilalApiKey) {
            console.log("[Mock] Bilal Service skipped (disabled or no key). using Mock success.");
            return { ok: true, data: { status: 'mock_success' } };
        }

        const payload = {
            network: BilalService.getNetworkId(network),
            phone,
            plan_id: planId
        };

        console.log(`[Bilal Integration] POST ${BASE_URL}/data`);
        console.log("Headers:", { Authorization: `Bearer ${settings.bilalApiKey}` });
        console.log("Payload:", payload);

        await new Promise(r => setTimeout(r, 1500));

        return { 
            ok: true, 
            data: { 
                status: 'success', 
                message: 'Data purchase successful', 
                ref: `BILAL-DATA-${Math.floor(Math.random() * 10000000)}` 
            } 
        };
    },

    /**
     * Check Balance (Admin function)
     */
    getBalance: async () => {
        const settings = await SettingsService.getSettings();
        if (!settings.useBilalService || !settings.bilalApiKey) return { balance: 0 };

        console.log(`[Bilal Integration] GET ${BASE_URL}/balance`);
        await new Promise(r => setTimeout(r, 800));
        
        return { balance: 54000.50 }; // Mocked balance on provider side
    }
};