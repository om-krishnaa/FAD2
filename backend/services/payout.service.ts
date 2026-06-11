import axios from 'axios';
import crypto from 'crypto';

/**
 * eSewa Payout Service
 * Test Mode: https://rc-epay.esewa.com.np
 * Merchant Code: EPAYTEST (test), your-code (prod)
 */
export class EsewaPayoutService {
  private merchantCode = process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST';
  private merchantSecret = process.env.ESEWA_MERCHANT_SECRET || '8gBm/:&EnhH.1/q';
  private baseUrl = process.env.ESEWA_BASE_URL || 'https://rc-epay.esewa.com.np';

  /**
   * Initiate payout to eSewa account
   * @param phoneNumber User's eSewa registered phone number
   * @param amount Amount to transfer
   * @param transactionId Unique transaction ID
   */
  async initiatePayout(
    phoneNumber: string,
    amount: number,
    transactionId: string
  ) {
    try {
      // Create signature for eSewa
      const message = `total_amount=${amount},transaction_uuid=${transactionId},product_code=${this.merchantCode}`;
      const signature = this.createSignature(message);

      const response = await axios.post(
        `${this.baseUrl}/api/epay/main/v2/payout`,
        {
          total_amount: amount,
          transaction_uuid: transactionId,
          product_code: this.merchantCode,
          signed_field_names: 'total_amount,transaction_uuid,product_code',
          signature,
          receiver_phone: phoneNumber,
          description: `Payout to eSewa account`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: response.data.status === 'COMPLETE',
        transactionCode: response.data.transaction_code,
        message: response.data.message,
        data: response.data,
      };
    } catch (error: any) {
      console.error('eSewa Payout Error:', error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      };
    }
  }

  private createSignature(message: string): string {
    const hmac = crypto.createHmac('sha256', this.merchantSecret);
    hmac.update(message);
    return hmac.digest('base64');
  }
}

/**
 * Khalti Payout Service
 * Test Mode: https://a.khalti.com/api/v2/
 */
export class KhaltiPayoutService {
  private khaltiKey = process.env.KHALTI_KEY || 'test-key';
  private baseUrl = 'https://a.khalti.com/api/v2';

  /**
   * Initiate payout to Khalti wallet
   * @param khaltiIdentifier Khalti phone or email
   * @param amount Amount to transfer
   * @param transactionId Unique transaction ID
   */
  async initiatePayout(
    khaltiIdentifier: string,
    amount: number,
    transactionId: string
  ) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/payout/initiate/`,
        {
          identifier: khaltiIdentifier,
          amount: amount * 100, // Khalti expects amount in paisa (100 paisa = 1 rupee)
          narration: `Payout for transaction ${transactionId}`,
          reference_id: transactionId,
        },
        {
          headers: {
            Authorization: `Key ${this.khaltiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: response.data.status === 'Initiated',
        transactionCode: response.data.transaction_id,
        message: 'Payout initiated successfully',
        data: response.data,
      };
    } catch (error: any) {
      console.error('Khalti Payout Error:', error.message);
      return {
        success: false,
        message: error.response?.data?.detail || error.message,
        data: error.response?.data,
      };
    }
  }

  /**
   * Verify payout status
   */
  async verifyPayoutStatus(transactionId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/payout/status/${transactionId}/`,
        {
          headers: {
            Authorization: `Key ${this.khaltiKey}`,
          },
        }
      );

      return {
        success: true,
        status: response.data.status,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Khalti Status Check Error:', error.message);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
