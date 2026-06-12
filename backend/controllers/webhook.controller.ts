import { NextFunction, Request, Response } from "express";
import createSignature from "../utils";
import { Database } from "../config/db";
const { default: axios } = require("axios");

const getEsewaDataParam = (req: Request) => {
  const queryData = req.query.data;

  if (typeof queryData === "string") return queryData;
  if (Array.isArray(queryData) && typeof queryData[0] === "string") {
    return queryData[0];
  }

  const bodyData = (req.body as any)?.data;
  if (typeof bodyData === "string") return bodyData;

  const rawMatch = req.originalUrl.match(/[?&]data=([^&]+)/);
  if (rawMatch?.[1]) return decodeURIComponent(rawMatch[1]);

  const nestedQueryValue = Object.values(req.query).find(
    (value) => typeof value === "string" && value.includes("data=")
  ) as string | undefined;

  if (nestedQueryValue) {
    const nestedMatch = nestedQueryValue.match(/[?&]data=([^&]+)/);
    if (nestedMatch?.[1]) return decodeURIComponent(nestedMatch[1]);
  }

  return null;
};

export const handleEsewaSuccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { source } = req.query as { source?: string };
  const data = getEsewaDataParam(req);

  if (!data) {
    return res.status(400).send("Missing eSewa payment data.");
  }

  let decodedData: any;

  try {
    decodedData = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
  } catch (error) {
    return res.status(400).send("Invalid eSewa payment data.");
  }

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

  if (
    source === "mobile" ||
    req.originalUrl.includes("source=mobile") ||
    req.path.includes("/mobile")
  ) {
    return res.send(`
      <!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              min-height: 100vh;
              align-items: center;
              justify-content: center;
              margin: 0;
              background: #f8fafc;
              color: #111827;
              text-align: center;
            }
            .box { padding: 24px; }
          </style>
        </head>
        <body>
          <div class="box">
            <h2>Payment Complete</h2>
            <p>Your ad payment was processed.</p>
          </div>
          <script>
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ESEWA_PAYMENT_COMPLETE'
              }));
            }
          </script>
        </body>
      </html>
    `);
  }

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
