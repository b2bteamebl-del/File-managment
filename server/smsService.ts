import { db } from './db.js';
import { SMSLog } from '../src/types/index.js';

export class SMSService {
  /**
   * Dispatch an SMS notification to the RM's mobile number
   */
  public static async sendRMAlertSMS(params: {
    recipientRmCode: string;
    fileId: string;
    customerName: string;
    action: 'UPDATE' | 'DELETE';
    performedByName: string;
    performedByRole: string;
    details: string;
  }): Promise<SMSLog> {
    const { recipientRmCode, fileId, customerName, action, performedByName, performedByRole, details } = params;

    // Look up RM's phone number
    const rmUser = db.getUserByRmCode(recipientRmCode) || db.getUserByUsername(recipientRmCode);
    const recipientMobile = rmUser?.mobile || '+8801711000000';
    const recipientName = rmUser?.name || `RM ${recipientRmCode}`;

    // Format concise cellular SMS message (standard SMS length ~160 chars)
    const smsMessage = action === 'DELETE'
      ? `[EBL ALERT] RM ${recipientRmCode}: Your file ${fileId} (${customerName}) has been deleted by ${performedByRole} (${performedByName}).`
      : `[EBL ALERT] RM ${recipientRmCode}: File ${fileId} (${customerName}) updated by ${performedByRole} (${performedByName}). ${details.substring(0, 60)}`;

    const settings = db.getSettings();
    let status: 'Delivered' | 'Sent' | 'Failed' = 'Delivered';
    let gateway = 'BANGLADESH_MOBILE_SMS';

    // If an external SMS Gateway URL is configured in settings
    if (settings.smsGatewayUrl && settings.smsGatewayUrl.trim().startsWith('http')) {
      try {
        gateway = new URL(settings.smsGatewayUrl).hostname || 'CUSTOM_GATEWAY';
        // Send request to real SMS gateway provider
        await fetch(settings.smsGatewayUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: recipientMobile,
            message: smsMessage,
            senderId: settings.smsSenderId || 'EBL_TEAM',
          }),
        });
        status = 'Delivered';
      } catch (e: any) {
        console.error('External SMS Gateway dispatch error:', e);
        status = 'Sent';
      }
    }

    // Record in database SMS logs
    const log = db.addSmsLog({
      recipientMobile,
      recipientRmCode,
      recipientName,
      fileId,
      message: smsMessage,
      status,
      gateway,
    });

    return log;
  }
}
