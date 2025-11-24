
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
    },

    /**
     * Send Push Notification (Mock)
     * @param userId Target user ID
     * @param title Notification Title
     * @param body Notification Body
     */
    sendPush: async (userId: string, title: string, body: string) => {
         try {
            const settings = await SettingsService.getSettings();
            
            if (settings.pushProvider === 'NONE') {
                console.log("[Notification] Push disabled. Skipped.");
                return { success: false, error: 'Push disabled' };
            }

            console.log(`[Notification] Sending Push via ${settings.pushProvider}`);
            console.log(`[Notification] To User: ${userId}`);
            console.log(`[Notification] Title: ${title}`);
            console.log(`[Notification] Body: ${body}`);

            if (settings.pushProvider === 'FIREBASE') {
                if (!settings.firebaseServerKey) console.warn("[Notification] Warning: Firebase Server Key missing");
                // Mock Firebase send logic here
            } else if (settings.pushProvider === 'ONESIGNAL') {
                if (!settings.oneSignalRestApiKey) console.warn("[Notification] Warning: OneSignal API Key missing");
                // Mock OneSignal send logic here
            }

            await new Promise(r => setTimeout(r, 500));
            console.log("[Notification] Push Sent Successfully ✅");
            return { success: true };

        } catch (error) {
             console.error("[Notification] Failed to send Push:", error);
             return { success: false, error };
        }
    }
};
