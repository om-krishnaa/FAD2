import { NextFunction, Request, Response } from "express";
import createSignature from "../utils";
import { Database } from "../config/db";
const { default: axios } = require("axios");

export const handleEsewaSuccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { data } = req.query as { data: any };
  const decodedData = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));

  if (decodedData.status !== "COMPLETE") {
    return res.json({ success: false, message: "Payment Not Completed" });
  }

  const message = decodedData.signed_field_names
    .split(",")
    .map((field: any) => {
      return `${field}=${decodedData[field] || ""}`;
    })
    .join(",");

  const signature = createSignature(message);

  if (signature !== decodedData.signature) {
    return res.json({ message: "Integrity error" });
  }

  await Database.updateAdTransaction(
    decodedData.transaction_uuid.split("PDA")[0],
    "requested",
    decodedData.transaction_code
  );

  res.redirect(process.env.FE_URL!);
};

export const handleKhaltiCallback = async (req: Request, res: Response) => {
  const { pidx, purchase_order_id, message } = req.query;
  if (message) {
    return res
      .status(400)
      .json({ error: message || "Error Processing Khalti" });
  }

  const response = await axios.post(
    "https://a.khalti.com/api/v2/epayment/lookup/",
    { pidx },
    {
      headers: {
        Authorization: `Key ${process.env.KHALTI_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (response.data.status !== "Completed") {
    return res.status(400).json({ error: "Payment Not Completed" });
  }

  const result = await Database.updateAdTransaction(
    Number(purchase_order_id),
    "requested",
    pidx?.toString()
  );

  res.redirect(process.env.FE_URL!);
};
