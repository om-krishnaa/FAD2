import { Request, Response } from "express";
import path from "path";
import { Database } from "../config/db";
import fs from "fs";
import createSignature from "../utils";

export const getAllAds = async (req: Request, res: Response) => {
  try {
    const ads = await Database.getAllAds(req.user!.role, req.user!.id);
    res.status(200).json(ads);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAvailableAds = async (req: Request, res: Response) => {
  try {
    const ads = await Database.getAvailableAds(req.user!.id);
    res.status(200).json(ads);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createAd = async (req: Request, res: Response) => {
  try {
    const {
      facility_name,
      description,
      title,
      budget,
      target_views,
      payment_method,
    } = req.body;

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Ad file is required" });
    }

    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let ad_type: "image" | "video";

    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif"];
    const videoExtensions = [".mp4", ".mov", ".avi", ".mkv"];

    if (imageExtensions.includes(fileExt)) {
      ad_type = "image";
    } else if (videoExtensions.includes(fileExt)) {
      ad_type = "video";
    } else {
      return res.json({
        success: false,
        message: "Unsupported file type. Only images and videos are allowed.",
      });
    }

    const content_url = path.join(req.file.destination, req.file.filename);
    const file_size = req.file.size;

    const requestProtocol = req.protocol || "http";
    const requestHost = req.get("host") || "localhost:5000";
    const backendBaseUrl =
      process.env.BE_URL && !process.env.BE_URL.includes("localhost")
        ? process.env.BE_URL
        : `${requestProtocol}://${requestHost}`;
    const frontendBaseUrl =
      process.env.FE_URL && !process.env.FE_URL.includes("localhost")
        ? process.env.FE_URL
        : backendBaseUrl;

    console.log(payment_method);

    const ad_id = await Database.createAdCampaign({
      facility_name,
      title,
      description,
      ad_type,
      content_url,
      file_size,
      budget: parseFloat(budget),
      target_views: target_views ? parseInt(target_views) : undefined,
      payment_method,
      created_by: req.user!.id,
      transaction_amount: parseFloat(budget),
    });

    if (payment_method === "admin_approved") {
      await Database.updateAdTransactionStatus(ad_id, "approved", req.user!.id);
      return res.json({ success: true, message: "Order Placed Successfully" });
    }

    if (payment_method === "esewa") {
      const signature = createSignature(
        `total_amount=${budget},transaction_uuid=${ad_id}PDA,product_code=EPAYTEST`
      );

      const formData = {
        amount: budget,
        failure_url: frontendBaseUrl,
        product_delivery_charge: "0",
        product_service_charge: "0",
        product_code: "EPAYTEST",
        signature,
        signed_field_names: "total_amount,transaction_uuid,product_code",
        success_url: `${backendBaseUrl}/api/webhook/esewa/success`,
        tax_amount: "0",
        total_amount: budget,
        transaction_uuid: `${ad_id}PDA`,
      };

      return res.json({
        success: true,
        message: "Order Placed Successfully",
        formData,
      });
    }

    if (payment_method === "khalti") {
      const formData = {
        return_url: `${backendBaseUrl}/api/webhook/khalti/callback`,
        website_url: frontendBaseUrl,
        amount: budget * 100, // paisa
        purchase_order_id: ad_id,
        purchase_order_name: "test",
      };

      const fetchResponse = await fetch(
        "https://a.khalti.com/api/v2/epayment/initiate/",
        {
          method: "POST",
          headers: {
            Authorization: `Key ${process.env.KHALTI_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const response = await fetchResponse.json();
      const redirectUrl = response.payment_url;
      return res.json({
        success: true,
        message: "Order Placed Successfully",
        payment_method: "khalti",
        redirectUrl,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Unsupported payment method",
    });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const createAdViewRecord = async (req: Request, res: Response) => {
  const {
    user_id,
    campaign_id,
    view_duration,
    full_duration,
    device_type,
    ip_address,
    completion_percentage,
    is_completed,
  } = req.body;

  if (
    !user_id ||
    !campaign_id ||
    view_duration == null ||
    full_duration == null
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const result = await Database.recordAdView({
      user_id,
      campaign_id,
      view_duration,
      full_duration,
      device_type,
      ip_address,
      completion_percentage,
      is_completed,
    });
    res.json({ success: true, message: "Ad view recorded", ...result });
  } catch (err: any) {
    console.error(err);
    res.json({ success: false, message: "Server error", error: err.message });
  }
};

export const updateAd = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, facility_name, budget, target_views } = req.body;
    const ad = await Database.getAdById(parseInt(id));
    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }

    let content_url = ad.content_url;
    let file_size = ad.file_size;
    let ad_type = ad.ad_type;

    if (req.file) {
      if (ad.content_url && fs.existsSync(ad.content_url)) {
        fs.unlinkSync(ad.content_url);
      }

      content_url = path.join(req.file.destination, req.file.filename);
      file_size = req.file.size;

      const fileExt = path.extname(req.file.originalname).toLowerCase();
      const imageExtensions = [".jpg", ".jpeg", ".png", ".gif"];
      const videoExtensions = [".mp4", ".mov", ".avi", ".mkv"];

      if (imageExtensions.includes(fileExt)) {
        ad_type = "image";
      } else if (videoExtensions.includes(fileExt)) {
        ad_type = "video";
      } else {
        return res.status(400).json({
          success: false,
          message: "Unsupported file type. Only images and videos are allowed.",
        });
      }
    }

    const updated = await Database.updateAd(parseInt(id), {
      title: title || ad.title,
      facility_name,
      ad_type,
      budget: budget ? parseFloat(budget) : ad.budget,
      target_views: target_views ? parseInt(target_views) : ad.target_views,
      content_url,
      file_size,
    });

    if (!updated) {
      return res.status(400).json({ message: "Failed to update ad" });
    }

    res.json({ message: "Ad updated successfully" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const updateAdStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "paused", "completed", "draft"].includes(status)) {
      return res.json({ message: "Invalid status value" });
    }

    const updated = await Database.updateAdStatus(parseInt(id), status);

    if (!updated) {
      return res.json({ message: "Ad not found" });
    }

    res.json({ success: true, message: "Ad status updated successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateAdTransactionStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { status, approved_by } = req.body;

    if (!["approved", "requested", "rejected"].includes(status)) {
      return res.json({ message: "Invalid status value" });
    }

    const updated = await Database.updateAdTransactionStatus(
      parseInt(id),
      status,
      approved_by
    );

    if (!updated) {
      return res.json({ message: "Ad not found" });
    }

    res.json({ success: true, message: "Ad status updated successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteAd = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ad = await Database.getAdById(parseInt(id));
    if (!ad) {
      return res.json({ message: "Ad not found" });
    }

    if (ad.content_url && fs.existsSync(ad.content_url)) {
      try {
        fs.unlinkSync(ad.content_url);
      } catch (err) {
        console.error("Failed to delete file:", err);
      }
    }

    const deleted = await Database.deleteAd(parseInt(id));
    if (!deleted) {
      return res.json({ message: "Failed to delete ad from DB" });
    }

    res.json({ success: true, message: "Ad and file deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
