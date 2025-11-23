
import { SettingsService, ApiVendor } from './settingsService';

export interface ServiceResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    statusCode?: number;
}

// Vendor Configuration: Base URLs
const VENDOR_URLS: Record<ApiVendor, string> = {
    BILALSADA: 'https://app.bilalsadasub.com/api/v1',
    MASKAWA: 'https://api.maskawasub.com/api/v1',
    ALRAHUZ: 'https://alrahuzdata.com.ng/api/v1',
    ABBAPHANTAMI: 'https://abbaphantami.com/api/v1',
    SIMHOST: 'https://simhostng.com/api/v1'
};

export const ApiService = {
    /**
     * Map internal provider enum to the active vendor's expected network strings
     */
    getNetworkId: (provider: string, vendor: ApiVendor) => {
        const p = provider.toUpperCase();
        
        // Most Nigerian VTU scripts use similar mappings
        const map: Record<string, string> = {
            'MTN': '1', // Common ID for MTN
            'GLO': '2',
            'AIRTEL': '3',
            '9MOBILE': '4'
        };
        
        // Specific overrides if a vendor uses strings instead of IDs
        if (vendor === 'BILALSADA') {
            return {
                'MTN': 'mtn',
                'GLO': 'glo',
                'AIRTEL': 'airtel',
                '9MOBILE': '9mobile'
            }[p] || p.toLowerCase();
        }

        return map[p] || p.toLowerCase();
    },

    /**
     * Unified Request Handler
     */
    _request: async (endpoint: string, payload: any): Promise<ServiceResponse> => {
        const settings = await SettingsService.getSettings();
        const vendor = settings.activeApiVendor;
        const apiKey = settings.apiKeys[vendor];
        const baseUrl = VENDOR_URLS[vendor];

        if (!apiKey) {
            return { 
                success: false, 
                error: `Configuration Error: API Key missing for ${vendor}. Please check Admin Settings.`,
                statusCode: 401 
            };
        }

        console.log(`[${vendor} Integration] POST ${baseUrl}${endpoint}`);
        console.log("Headers:", { Authorization: `Token ${apiKey.substring(0, 5)}...` });
        console.log("Payload:", payload);

        try {
            await new Promise(r => setTimeout(r, 1500)); // Simulate latency

            // Simulate specific errors
            if (Math.random() < 0.05) throw new Error("Vendor Connection Timed Out");
            
            // Mock response structure based on typical Nigerian VTU APIs
            return { 
                success: true, 
                data: { 
                    status: 'success', 
                    message: 'Transaction successful', 
                    ref: `${vendor}-${Math.floor(Math.random() * 10000000)}`,
                    api_response: { ...payload, timestamp: new Date().toISOString() }
                } 
            };

        } catch (error: any) {
            console.error("API Call Failed:", error);
            return {
                success: false,
                error: error.message || "Provider service temporarily unavailable.",
                statusCode: 500
            };
        }
    },

    /**
     * Purchase Airtime
     */
    buyAirtime: async (network: string, phone: string, amount: number): Promise<ServiceResponse> => {
        const settings = await SettingsService.getSettings();
        const networkId = ApiService.getNetworkId(network, settings.activeApiVendor);
        
        const payload = {
            network: networkId,
            mobile_number: phone, // Standard param name
            phone: phone, // Fallback param name
            amount,
            Ported_number: true,
            airtime_type: 'VTU'
        };
        return ApiService._request('/topup', payload);
    },

    /**
     * Purchase Data
     */
    buyData: async (network: string, phone: string, planId: string): Promise<ServiceResponse> => {
        const settings = await SettingsService.getSettings();
        const networkId = ApiService.getNetworkId(network, settings.activeApiVendor);

        const payload = {
            network: networkId,
            mobile_number: phone,
            phone: phone,
            plan: planId, // Usually the API Plan ID
            Ported_number: true
        };
        return ApiService._request('/data', payload);
    },

    /**
     * Check Balance
     */
    getBalance: async () => {
        const settings = await SettingsService.getSettings();
        if (!settings.apiKeys[settings.activeApiVendor]) return { balance: 0 };
        return { balance: 54000.50 }; // Mocked balance
    }
};
