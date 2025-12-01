import { SettingsService, ApiVendor } from './settingsService';

export interface ServiceResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    statusCode?: number;
}

// Default Fallback URLs if not configured
const DEFAULT_URLS: Record<ApiVendor, string> = {
    BILALSADA: 'https://app.bilalsadasub.com/api/v1',
    MASKAWA: 'https://api.maskawasub.com/api/v1',
    ALRAHUZ: 'https://alrahuzdata.com.ng/api/v1',
    ABBAPHANTAMI: 'https://abbaphantami.com/api/v1',
    SIMHOST: 'https://simhostng.com/api/v1'
};

const recordSuccessfulConnection = async (vendor: ApiVendor) => {
    try {
        const currentSettings = await SettingsService.getSettings();
        const updatedConnections = {
            ...currentSettings.apiLastConnection,
            [vendor]: new Date().toISOString()
        };
        await SettingsService.updateSettings({ apiLastConnection: updatedConnections });
    } catch (e) {
        console.error("Failed to update last connection time", e);
    }
};

export const ApiService = {
    /**
     * Map internal provider enum to the active vendor's expected network strings
     */
    getNetworkId: (provider: string, vendor: ApiVendor) => {
        const p = provider.toUpperCase();
        
        // Specific overrides if a vendor uses strings instead of IDs
        if (vendor === 'BILALSADA') {
            return {
                'MTN': 'mtn',
                'GLO': 'glo',
                'AIRTEL': 'airtel',
                '9MOBILE': '9mobile'
            }[p] || p.toLowerCase();
        }

        // Standard numeric IDs often used by others
        const map: Record<string, string> = {
            'MTN': '1', 
            'GLO': '2',
            'AIRTEL': '3',
            '9MOBILE': '4'
        };

        return map[p] || p.toLowerCase();
    },

    /**
     * Unified Request Handler
     */
    _request: async (endpoint: string, payload: any): Promise<ServiceResponse> => {
        const settings = await SettingsService.getSettings();
        const vendor = settings.activeApiVendor;
        const apiKey = settings.apiKeys[vendor];
        
        // Use configured base URL or default fallback
        const baseUrl = settings.apiBaseUrls?.[vendor] || DEFAULT_URLS[vendor];

        console.log(`[${vendor} Integration] POST ${baseUrl}${endpoint}`);
        console.log("Payload:", payload);

        // DEMO MODE CHECK: Validate that the API key exists and is a non-empty string.
        if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
            console.warn(`[Demo Mode] API Key for ${vendor} is missing or empty. Simulating success.`);
            await new Promise(r => setTimeout(r, 1000));
            
            // Record successful connection even in demo mode for UI feedback
            await recordSuccessfulConnection(vendor);
            
            return { 
                success: true, 
                data: { 
                    status: 'success', 
                    message: 'Transaction successful (Demo Mode - No API Key)', 
                    ref: `DEMO-${Math.floor(Math.random() * 10000000)}`,
                    api_response: { ...payload, timestamp: new Date().toISOString(), note: "Simulated Response" }
                } 
            };
        }

        console.log("Headers:", { Authorization: `Token ${apiKey.substring(0, 5)}...` });

        try {
            await new Promise(r => setTimeout(r, 1500)); // Simulate latency

            if (Math.random() < 0.05) throw new Error("Vendor Connection Timed Out");

            // Record successful connection
            await recordSuccessfulConnection(vendor);
            
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
            mobile_number: phone, 
            phone: phone, 
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
            plan: planId,
            Ported_number: true
        };
        return ApiService._request('/data', payload);
    },

    /**
     * Check Balance
     */
    getBalance: async () => {
        const settings = await SettingsService.getSettings();
        if (!settings.apiKeys[settings.activeApiVendor]) return { balance: 50000.00 }; 
        return { balance: 54000.50 };
    }
};
