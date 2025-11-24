
import { SettingsService } from './settingsService';

// Base URL from documentation
const BASE_URL = 'https://app.bilalsadasub.com/api/v1';

export interface ServiceResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    statusCode?: number;
}

export const BilalService = {
    /**
     * Map internal provider enum to Bilal's expected network strings
     */
    getNetworkId: (provider: string) => {
        const map: Record<string, string> = {
            'MTN': 'mtn',
            'GLO': 'glo',
            'AIRTEL': 'airtel',
            '9MOBILE': '9mobile'
        };
        return map[provider] || provider.toLowerCase();
    },

    /**
     * Helper to simulate fetch behavior with error handling
     */
    _simulateRequest: async (endpoint: string, payload: any): Promise<ServiceResponse> => {
        const settings = await SettingsService.getSettings();
        
        // Safety check if settings are not fully loaded
        if (!settings || !settings.apiKeys) {
             return {
                success: false,
                error: "System Configuration Error: Settings not loaded.",
                statusCode: 500
            };
        }

        const apiKey = settings.apiKeys.BILALSADA;
        const isActive = settings.activeApiVendor === 'BILALSADA';

        // 1. Check Configuration
        if (!isActive) {
            console.log(`[Mock Service] ${endpoint} - Service Disabled (Active Vendor is ${settings.activeApiVendor}). Returning mock success.`);
            return { success: true, data: { status: 'mock_success', ref: `MOCK-${Date.now()}` } };
        }

        // DEMO MODE BYPASS
        if (!apiKey) {
            console.warn(`[Bilal Service Demo Mode] No API Key found. Simulating successful transaction for demo.`);
            await new Promise(r => setTimeout(r, 1500));
             return { 
                success: true, 
                data: { 
                    status: 'success', 
                    message: 'Transaction successful (Demo)', 
                    ref: `BILAL-DEMO-${Math.floor(Math.random() * 10000000)}`,
                    api_response: { ...payload, timestamp: new Date().toISOString() }
                } 
            };
        }

        // 2. Simulate Network Request
        console.log(`[Bilal API] POST ${BASE_URL}${endpoint}`);
        console.log("Headers:", { Authorization: `Bearer ${apiKey.substring(0, 5)}...` });
        console.log("Payload:", payload);

        try {
            await new Promise(r => setTimeout(r, 1500)); // Simulate latency

            // 3. Simulate Random Network/Server Errors (5% chance)
            if (Math.random() < 0.05) {
                throw new Error("Network Error: Connection timed out");
            }

            // 4. Simulate API Specific Errors based on mock logic
            // Example: Amount > 50000 fails (Mock API limit)
            if (payload.amount && payload.amount > 50000) {
                 return {
                    success: false,
                    error: "API Error: Amount exceeds daily limit per transaction.",
                    statusCode: 422
                };
            }

            // Example: Specific phone number triggers failure
            if (payload.phone && payload.phone.endsWith('000')) {
                return {
                    success: false,
                    error: "API Error: Destination number barred.",
                    statusCode: 400
                };
            }

            // Success
            return { 
                success: true, 
                data: { 
                    status: 'success', 
                    message: 'Transaction successful', 
                    ref: `BILAL-${Math.floor(Math.random() * 10000000)}`,
                    api_response: { ...payload, timestamp: new Date().toISOString() }
                } 
            };

        } catch (error: any) {
            console.error("API Call Failed:", error);
            return {
                success: false,
                error: error.message || "An unexpected error occurred connecting to the provider.",
                statusCode: 500
            };
        }
    },

    /**
     * Purchase Airtime via BilalSadaSub
     */
    buyAirtime: async (network: string, phone: string, amount: number): Promise<ServiceResponse> => {
        const payload = {
            network: BilalService.getNetworkId(network),
            phone,
            amount
        };
        return BilalService._simulateRequest('/airtime', payload);
    },

    /**
     * Purchase Data via BilalSadaSub
     */
    buyData: async (network: string, phone: string, planId: string): Promise<ServiceResponse> => {
        const payload = {
            network: BilalService.getNetworkId(network),
            phone,
            plan_id: planId
        };
        return BilalService._simulateRequest('/data', payload);
    },

    /**
     * Check Balance (Admin function)
     */
    getBalance: async () => {
        try {
            const settings = await SettingsService.getSettings();
            if (!settings) return { balance: 0 };
            
            const apiKey = settings.apiKeys?.BILALSADA;
            // Demo balance check
            if(!apiKey) return { balance: 50000.00 };

            console.log(`[Bilal Integration] GET ${BASE_URL}/balance`);
            await new Promise(r => setTimeout(r, 800));
            
            return { balance: 54000.50 }; // Mocked balance on provider side
        } catch (e) {
            console.error("Failed to fetch balance", e);
            return { balance: 0 };
        }
    }
};
