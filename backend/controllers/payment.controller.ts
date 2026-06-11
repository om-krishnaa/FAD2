import { Request, Response } from "express";
import { Database } from "../config/db";
import { EsewaPayoutService, KhaltiPayoutService } from "../services/payout.service";

export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const payments = await Database.getAllPayments();
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const requestPayment = async (req: Request, res: Response) => {
  const { payment_method, payment_identifier } = req.body;

  if (!payment_identifier) {
    return res.json({
      success: false,
      message: `${payment_method === 'esewa' ? 'eSewa phone number' : 'Khalti phone/email'} is required`,
    });
  }

  const user = await Database.getUserById(req.user!.id);

  if (!user) return res.json({ success: false, message: "User not found" });
  const { current_balance } = user;

  const { minimum_withdrawal } = await Database.getSettings();
  console.log(current_balance, minimum_withdrawal);
  if (Number(current_balance) < Number(minimum_withdrawal))
    return res.json({
      success: false,
      message: "Minimum amount is " + minimum_withdrawal,
    });
  try {
    // Create transaction record
    const transactionId = await Database.requestPayment(
      req.user!.id,
      Number(current_balance),
      payment_method
    );
    if (!transactionId) {
      return res.json({ success: false, message: "Payment request failed" });
    }

    // Initiate actual payout based on payment method
    let payoutResult: any;
    if (payment_method === "esewa") {
      const esewaService = new EsewaPayoutService();
      payoutResult = await esewaService.initiatePayout(
        payment_identifier,
        Number(current_balance),
        `TXN-${transactionId}-${Date.now()}`
      );
    } else if (payment_method === "khalti") {
      const khaltiService = new KhaltiPayoutService();
      payoutResult = await khaltiService.initiatePayout(
        payment_identifier,
        Number(current_balance),
        `TXN-${transactionId}-${Date.now()}`
      );
    }

    // Update transaction with payout details
    if (payoutResult?.success) {
      await Database.updateTransaction(transactionId.toString(), {
        status: "completed",
        payment_reference: payoutResult.transactionCode,
        description: `Payout completed via ${payment_method}`,
        processed_by: req.user!.id,
      });

      return res.json({
        success: true,
        message: `Payout of Rs ${current_balance} sent to your ${payment_method} account successfully`,
        transactionId,
        requestedAmount: Number(current_balance),
        paymentReference: payoutResult.transactionCode,
        status: "completed",
      });
    } else {
      // Update transaction as failed
      await Database.updateTransaction(transactionId.toString(), {
        status: "failed",
        failure_reason: payoutResult?.message || "Payout initiation failed",
        processed_by: req.user!.id,
      });

      return res.json({
        success: false,
        message: `Payout failed: ${payoutResult?.message || 'Unknown error'}`,
        transactionId,
        requestedAmount: Number(current_balance),
        status: "failed",
      });
    }
  } catch (error: any) {
    console.error("Payment Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updatePayment = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const {
      transaction_id,
      type,
      amount,
      currency,
      payment_method,
      status,
      description,
      failure_reason,
    } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "ID is required" });
    }

    const result = await Database.updateTransaction({
      id,
      transaction_id,
      type,
      amount,
      currency,
      payment_method,
      status,
      description,
      failure_reason,
      processed_by: req.user!.id,
    });

    return res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      result,
    });
  } catch (error: any) {
    console.error("Error updating transaction:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
