import { Request, Response } from "express";
import { Database } from "../config/db";

export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const payments = await Database.getAllPayments();
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getMyPayments = async (req: Request, res: Response) => {
  try {
    const payments = await Database.getPaymentsByUserId(req.user!.id);
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
    const transactionId = await Database.requestPayment(
      req.user!.id,
      Number(current_balance),
      payment_method
    );
    if (!transactionId) {
      return res.json({ success: false, message: "Payment request failed" });
    }

    await Database.updateTransaction({
      id: transactionId.toString(),
      description: `Pending manual payout to ${payment_method}: ${payment_identifier}`,
      processed_by: req.user!.id,
    });

    return res.json({
      success: true,
      message:
        "Payout request submitted. Admin will review and send your payment manually.",
      transactionId,
      requestedAmount: Number(current_balance),
      status: "pending",
    });
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
