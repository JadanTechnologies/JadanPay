
import { SettingsService } from './settingsService';

export const NotificationService = {
    /**
     * Send SMS using the configured provider (Mocked Twilio)
     * @param to Phone number (080...)
     * @param message Message body
     */
    sendSms: async (to: string, message: string) => {
        try {
            const settings = await SettingsService.getSettings();
            
            if (!settings.enableTwilio) {
                console.log("[Notification] SMS disabled in settings. Skipped.");
                return;
            }

            if (!to || !message) return;

            // Format Number: Ensure +234
            let formattedPhone = to;
            if (to.startsWith('0')) {
                formattedPhone = '+234' + to.substring(1);
            }

            console.log(`[Twilio SMS] Sending to ${formattedPhone} via ${settings.twilioSenderId || 'JadanPay'}`);
            console.log(`[Twilio SMS] Body: "${message}"`);
            
            // Mock API Delay
            await new Promise(r => setTimeout(r, 500));
            
            console.log("[Twilio SMS] Sent Successfully ✅");
            return { success: true };

        } catch (error) {
            console.error("[Notification] Failed to send SMS:", error);
            return { success: false };
        }
    }
};
