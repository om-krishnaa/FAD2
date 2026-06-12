import mysql, { Pool, RowDataPacket } from "mysql2/promise";
import { SystemSetting, User } from "../types";

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Create a connection pool
export const pool: Pool = mysql.createPool(dbConfig);

// Test database connection
export const testConnection = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Connected to MySQL database successfully");
    connection.release();
  } catch (error: any) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
};

export class Database {
  static async getUserByCredentials(email: string, password: string) {
    const [rows] = await pool.execute(
      "SELECT id, email, verified, created_at FROM users WHERE email = ? AND password = ?",
      [email, password]
    );
    return (rows as any[])[0] || null;
  }

  static async getUserById(id: number) {
    const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [id]);
    return (rows as any[])[0] || null;
  }

  static async getUserByEmail(email: string) {
    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return (rows as any[])[0] || null;
  }

  static async createUser(name: string, email: string, password_hash: string) {
    const [result] = await pool.execute(
      "INSERT INTO users (name,email, password_hash, is_verified) VALUES (?,?, ?, FALSE)",
      [name, email, password_hash]
    );
    return (result as any).insertId;
  }

  static async verifyUser(email: string) {
    const [result] = await pool.execute(
      "UPDATE users SET  is_verified = TRUE WHERE email = ?",
      [email]
    );
    return (result as any).affectedRows > 0;
  }

  static async createVerificationCode(userId: number, code: string) {
    await pool.execute(
      `UPDATE users 
     SET verification_code = ?, 
         verification_expires_at = DATE_ADD(NOW(), INTERVAL 1 HOUR)
     WHERE id = ?`,
      [code, userId]
    );
  }
  static async verifyCode(userId: number, code: string) {
    const [rows] = await pool.execute(
      `SELECT * FROM users 
     WHERE id = ? 
       AND verification_code = ?`,
      [userId, code]
    );

    if ((rows as any[]).length > 0) {
      await pool.execute(
        `UPDATE users 
       SET is_verified = 1, 
           verification_code = NULL, 
           verification_expires_at = NULL 
       WHERE id = ?`,
        [userId]
      );
      return true;
    }

    return false;
  }

  static async saveVerificationCode(userId: number, code: string) {
    await pool.execute(
      `UPDATE users 
     SET verification_code = ?, verification_expires_at = DATE_ADD(NOW(), INTERVAL 1 HOUR) 
     WHERE id = ?`,
      [code, userId]
    );
  }

  static async getAllUsers({
    status,
    role,
    page,
    limit,
  }: {
    status?: string;
    role?: string;
    page: number;
    limit: number;
  }) {
    let baseQuery = `FROM users WHERE 1=1`;
    const params: any[] = [];

    if (status) {
      baseQuery += ` AND status = ?`;
      params.push(status);
    }

    if (role) {
      baseQuery += ` AND role = ?`;
      params.push(role);
    }

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total ${baseQuery}`,
      params
    );
    const total = (countResult as any)[0].total;

    let dataQuery = `SELECT * ${baseQuery} ORDER BY created_at DESC`;

    const offset = (page - 1) * limit;
    dataQuery += ` LIMIT ${limit} OFFSET ${offset}`;

    const [rows] = await pool.execute(dataQuery, params);

    return { rows: rows as any[], total };
  }

  static async getAllUsersNoFilter() {
    const [rows] = await pool.execute(
      `SELECT * FROM users ORDER BY created_at DESC`
    );
    const total = (rows as any[]).length;

    return { rows: rows as any[], total };
  }

  static async getBlockedUsers({
    page,
    limit,
  }: {
    page: number;
    limit: number;
  }) {
    const baseQuery = `
    FROM blocked_users bu
    JOIN users u ON bu.user_id = u.id
    WHERE 1=1
  `;
    const params: any[] = [];

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total ${baseQuery}`,
      params
    );
    const total = (countResult as any)[0].total;

    const offset = (page - 1) * limit;
    const dataQuery = `
    SELECT 
      bu.*,
      u.*
    ${baseQuery}
    ORDER BY bu.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

    const [rows] = await pool.execute(dataQuery, params);

    const result = (rows as any[]).map((row) => {
      const { id, name, email, role, ...userRest } = row;
      const userFields = Object.keys(row)
        .filter((key) => key.startsWith("u."))
        .reduce((acc: any, key) => {
          acc[key.replace("u.", "")] = (row as any)[key];
          return acc;
        }, {});

      return {
        ...row,
        user: {
          id: row.id,
          ...userRest,
        },
      };
    });

    return { rows: result, total };
  }

  static async updateUser(id: number, data: any) {
    const { name, email, bio, profile_picture } = data;

    const [result] = await pool.execute(
      `UPDATE users 
       SET name = ?, email = ?, bio = ?, profile_picture = ? 
       WHERE id = ?`,
      [name, email, bio, profile_picture, id]
    );

    return (result as any).affectedRows > 0;
  }

  static async deleteUser(email: string) {
    const [result] = await pool.execute(`DELETE FROM users WHERE email = ?`, [
      email,
    ]);
    return (result as any).affectedRows > 0;
  }

  static async saveResetCode(userId: number, code: string) {
    await pool.execute(
      `UPDATE users 
     SET reset_token = ?, reset_token_expires_at = DATE_ADD(NOW(), INTERVAL 1 HOUR) 
     WHERE id = ?`,
      [code, userId]
    );
  }

  static async verifyResetCode(userId: number, code: string) {
    const [rows] = await pool.execute(
      `SELECT id FROM users 
     WHERE id = ? AND reset_token = ? AND reset_token_expires_at > NOW()`,
      [userId, code]
    );
    return (rows as any[]).length > 0;
  }

  static async updateUserPassword(id: string, passwordHash: string) {
    await pool.execute(
      `UPDATE users 
     SET password_hash = ?, reset_token = NULL, reset_token_expires_at = NULL 
     WHERE id = ?`,
      [passwordHash, id]
    );
  }

  static async updateUserStatus(
    id: number,
    status: string,
    blockedData?: {
      reason: string;
      blocked_by: number;
      is_permanent?: boolean;
      unblock_date?: string | null;
      notes?: string | null;
    }
  ) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        `UPDATE users SET status = ? WHERE id = ?`,
        [status, id]
      );

      if (status === "blocked" && blockedData) {
        await connection.execute(
          `INSERT INTO blocked_users 
         (user_id, reason, blocked_by, is_permanent, unblock_date, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
          [
            id,
            blockedData.reason,
            blockedData.blocked_by,
            blockedData.is_permanent ? 1 : 0,
            blockedData.unblock_date || null,
            blockedData.notes || null,
          ]
        );
      } else if (status !== "blocked") {
        await connection.execute(
          `DELETE FROM blocked_users WHERE user_id = ?`,
          [id]
        );
      }

      await connection.commit();
      return (result as any).affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  static async updateUserRole(id: number, role: string) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        `UPDATE users SET role = ? WHERE id = ?`,
        [role, id]
      );

      await connection.commit();
      return (result as any).affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  static async getAllAds(role: string, userId: number) {
    let sql = `SELECT a.* FROM ad_campaigns a`;
    const params: any[] = [];

    if (role === "admin") {
      sql += ` WHERE a.created_by = ? AND a.transaction_status <> ?`;
      params.push(userId, "pending");
    } else if (role === "super_admin") {
      sql += ` WHERE a.transaction_status <> ?`;
      params.push("pending");
    }

    sql += ` ORDER BY a.created_at DESC`;

    const [rows] = await pool.execute(sql, params);
    return rows as any[];
  }

  static async getAvailableAds(userId: number) {
    const [settingsRows] = await pool.execute(
      "SELECT daily_ad_limit FROM system_settings LIMIT 1"
    );

    const systemSettings = (settingsRows as any[])[0] || { daily_ad_limit: 10 };
    const maxAdsPerDay = parseInt(systemSettings.daily_ad_limit, 10) || 10;

    const [rows] = await pool.execute(
      `SELECT a.*
     FROM ad_campaigns a
     LEFT JOIN user_ad_views v
       ON a.id = v.campaign_id AND v.user_id = ?
     WHERE v.id IS NULL
       AND a.status = 'active'
       AND a.transaction_status <> 'pending'
     ORDER BY a.created_at DESC
     LIMIT ${maxAdsPerDay};`,
      [userId]
    );

    return rows as any[];
  }

  static async getAdById(id: number) {
    const [rows] = await pool.execute(
      `SELECT * FROM ad_campaigns WHERE id = ?`,
      [id]
    );
    return (rows as any[])[0] || null;
  }

  static async createAdCampaign(data: {
    facility_name: number;
    title: string;
    description?: string;
    ad_type: "image" | "video";
    content_url?: string;
    file_size?: number;
    budget: number;
    target_views?: number;
    start_date?: string;
    end_date?: string;
    created_by?: number;
    payment_method?: string;
    transaction_amount?: number;
  }) {
    const {
      facility_name,
      title,
      description,
      ad_type,
      content_url,
      file_size,
      budget,
      target_views,
      start_date,
      end_date,
      created_by,
      payment_method,
      transaction_amount,
    } = data;

    const [result] = await pool.execute(
      `INSERT INTO ad_campaigns
      (facility_name, title, description, ad_type, content_url, file_size, budget, target_views, status, start_date, end_date, created_by,payment_method,transaction_amount) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?,?,?)`,
      [
        facility_name,
        title,
        description || null,
        ad_type,
        content_url || null,
        file_size || null,
        budget,
        target_views || null,
        start_date || null,
        end_date || null,
        created_by || null,
        payment_method || null,
        transaction_amount,
      ]
    );

    return (result as any).insertId;
  }

  static async updateAd(id: number, data: any) {
    const {
      title,
      facility_name,
      ad_type,
      budget,
      target_views,
      content_url,
      file_size,
    } = data;

    const [result] = await pool.execute(
      `UPDATE ad_campaigns 
       SET title = ?, facility_name=?, ad_type = ?, budget = ?, target_views = ?, content_url = ?, file_size = ? 
       WHERE id = ?`,
      [
        title,
        facility_name,
        ad_type,
        budget,
        target_views,
        content_url,
        file_size,
        id,
      ]
    );

    return (result as any).affectedRows > 0;
  }

  static async updateAdStatus(id: number, status: string) {
    const [result] = await pool.execute(
      `UPDATE ad_campaigns SET status = ? WHERE id = ?`,
      [status, id]
    );
    return (result as any).affectedRows > 0;
  }

  static async updateAdTransactionStatus(
    id: number,
    status: string,
    approvedBy: number
  ) {
    const [result] = await pool.execute(
      `UPDATE ad_campaigns 
     SET transaction_status = ?, approved_by = ? 
     WHERE id = ?`,
      [status, approvedBy, id]
    );

    return (result as any).affectedRows > 0;
  }

  static async deleteAd(id: number) {
    const [result] = await pool.execute(
      `DELETE FROM ad_campaigns WHERE id = ?`,
      [id]
    );
    return (result as any).affectedRows > 0;
  }

  static async recordAdView(data: {
    user_id: number;
    campaign_id: number;
    view_duration: number;
    full_duration: number;
    device_type?: string;
    ip_address?: string;
    completion_percentage: number;
    is_completed: boolean;
  }) {
    const {
      user_id,
      campaign_id,
      view_duration,
      full_duration,
      device_type,
      ip_address,
      completion_percentage,
      is_completed,
    } = data;

    const [campaignRows] = await pool.execute(
      "SELECT cost_per_view, ad_type FROM ad_campaigns WHERE id = ?",
      [campaign_id]
    );

    if ((campaignRows as any[]).length === 0)
      throw new Error("Campaign not found");

    const [settingsRows] = await pool.execute(
      "SELECT cost_per_view FROM system_settings LIMIT 1"
    );

    if ((settingsRows as any[]).length === 0)
      throw new Error("System settings not found");

    const systemSettings = (settingsRows as any[])[0];
    const earnings = parseFloat(systemSettings.cost_per_view);

    // 1. Use INSERT IGNORE to safely handle daily duplicate views without crashing
    const [insertResult] = await pool.execute(
      `INSERT IGNORE INTO user_ad_views 
       (user_id, campaign_id, view_duration, full_duration, completion_percentage, device_type, ip_address, is_completed, earnings, view_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
      [
        user_id,
        campaign_id,
        view_duration,
        full_duration,
        completion_percentage,
        device_type || null,
        ip_address || null,
        is_completed,
        earnings,
      ]
    );

    // 2. Check if the row was actually inserted. If affectedRows is 0, it's a duplicate!
    const isDuplicate = (insertResult as any).affectedRows === 0;

    if (isDuplicate) {
      // Return early with 0 earnings so the frontend knows it was a duplicate, but doesn't loop or freeze
      return { earnings: 0, completion_percentage, is_completed, message: "Ad already viewed today" };
    }

    // 3. Only update user balances if this is a fresh, non-duplicate view
    await pool.execute(
      `UPDATE users 
       SET total_earned = total_earned + ?, 
           current_balance = current_balance + ?, 
           ads_watched_count = ads_watched_count + 1
       WHERE id = ?`,
      [earnings, earnings, user_id]
    );

    await pool.execute(
      `UPDATE ad_campaigns
       SET spent_amount = spent_amount + ?, 
           actual_views = actual_views + 1
       WHERE id = ?`,
      [earnings, campaign_id]
    );

    return { earnings, completion_percentage, is_completed };
  }

  static async getTotalUsers() {
    const [result] = await pool.execute(
      "SELECT COUNT(*) as totalUsers FROM users"
    );
    return (result as any)[0].totalUsers;
  }

  static async getActiveAds() {
    const [result] = await pool.execute(
      "SELECT COUNT(*) as activeAds FROM ad_campaigns WHERE status = ?",
      ["active"]
    );
    return (result as any)[0].activeAds;
  }

  static async getTotalRevenue() {
    const [result] = await pool.execute(
      "SELECT SUM(budget) as totalRevenue FROM ad_campaigns"
    );
    return (result as any)[0].totalRevenue || 0;
  }

  static async getAdViewsToday() {
    const [result] = await pool.execute(
      "SELECT COUNT(*) as adViewsToday FROM user_ad_views WHERE view_date = CURDATE()"
    );
    return (result as any)[0].adViewsToday || 0;
  }

  static async getRecentAds() {
    const [result] = await pool.execute(
      `SELECT * 
       FROM ad_campaigns
       ORDER BY created_at DESC
       LIMIT 2`
    );
    return result as any[];
  }

  static async getUserStats() {
    const [rows] = await pool.execute(
      `SELECT 
       COUNT(*) AS totalUsers,
       SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS activeUsers,
       SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) AS suspendedUsers,
       (
         SELECT COALESCE(SUM(earnings), 0) 
         FROM user_ad_views 
         WHERE is_paid = 1
       ) AS totalPayouts
     FROM users`
    );

    const result = (rows as any)[0];

    return {
      totalUsers: Number(result.totalUsers),
      activeUsers: Number(result.activeUsers),
      suspendedUsers: Number(result.suspendedUsers),
      totalPayouts: Number(result.totalPayouts),
    };
  }

  static async getStats(
    timeframe: "7d" | "30d" | "90d" | "1yr",
    role: string,
    userId: number
  ) {
    const daysMap: Record<string, number> = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "1yr": 365,
    };
    const days = daysMap[timeframe] || 7;

    const adFilter = role === "admin" ? " AND a.created_by = ?" : "";
    const adParams = role === "admin" ? [userId] : [];

    const [views] = await pool.execute(
      `
      SELECT COUNT(*) AS total_views
      FROM user_ad_views uv
      JOIN ad_campaigns a ON uv.campaign_id = a.id
      WHERE uv.view_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ${adFilter}
    `,
      [days, ...adParams]
    );

    const [users] = await pool.execute(
      `
      SELECT COUNT(*) AS active_users
      FROM users
      WHERE status='active' 
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `,
      [days]
    );

    const [revenue] = await pool.execute(
      `
      SELECT SUM(spent_amount) AS revenue
      FROM ad_campaigns a
      WHERE a.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ${adFilter}
    `,
      [days, ...adParams]
    );

    const [ctr] = await pool.execute(
      `
      SELECT AVG(click_through_rate) AS avg_ctr
      FROM ad_campaigns a
      WHERE a.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ${adFilter}
    `,
      [days, ...adParams]
    );

    return {
      totalViews: (views as any)[0].total_views || 0,
      activeUsers: (users as any)[0].active_users || 0,
      revenueGenerated: (revenue as any)[0].revenue || 0,
      avgCTR: (ctr as any)[0].avg_ctr || 0,
    };
  }

  static async getWeeklyEngagement(role: string, userId: number) {
    const adFilter = role === "admin" ? " AND a.created_by = ?" : "";
    const params = role === "admin" ? [userId] : [];

    const [rows] = await pool.execute(
      `
      SELECT 
        DATE(uv.view_date) AS date, 
        COUNT(*) AS total_views, 
        COUNT(DISTINCT uv.user_id) AS active_users
      FROM user_ad_views uv
      JOIN ad_campaigns a ON uv.campaign_id = a.id
      WHERE uv.view_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        ${adFilter}
      GROUP BY DATE(uv.view_date)
      ORDER BY date;
    `,
      params
    );

    const dataMap = new Map(
      (rows as any[]).map((r) => [
        new Date(r.date).toISOString().split("T")[0],
        {
          total_views: r.total_views,
          active_users: r.active_users,
        },
      ])
    );

    const result: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("en-US", { weekday: "long" });

      result.push({
        date: dateStr,
        day: dayName,
        total_views: dataMap.get(dateStr)?.total_views || 0,
        active_users: dataMap.get(dateStr)?.active_users || 0,
      });
    }

    return result;
  }

  static async getTopAds(
    timeframe: "7d" | "30d" | "90d" | "1yr",
    role: string,
    userId: number
  ) {
    const daysMap: Record<string, number> = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "1yr": 365,
    };
    const days = daysMap[timeframe] || 7;

    let sql = `
    SELECT 
      title,
      actual_views AS views,
      click_through_rate AS ctr,
      spent_amount AS revenue
    FROM ad_campaigns
    WHERE start_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      AND transaction_status <> 'pending'
  `;
    const params: any[] = [days];

    if (role === "admin") {
      sql += " AND created_by = ?";
      params.push(userId);
    }

    sql += " ORDER BY spent_amount DESC LIMIT 5";

    const [rows] = await pool.execute(sql, params);
    return rows as any[];
  }

  static async getRevenueBreakdown(timeframe: "7d" | "30d" | "90d" | "1yr") {
    const daysMap: Record<string, number> = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "1yr": 365,
    };
    const days = daysMap[timeframe] || 7;

    const [facilities] = await pool.execute(
      `SELECT SUM(spent_amount) AS revenue_facilities 
     FROM ad_campaigns
     WHERE start_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [days]
    );

    const [paidUsers] = await pool.execute(
      `SELECT SUM(earnings) AS paid_users 
     FROM user_ad_views 
     WHERE is_paid=1 
       AND view_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [days]
    );

    const netProfit =
      ((facilities as any)[0].revenue_facilities || 0) -
      ((paidUsers as any)[0].paid_users || 0);

    return {
      revenueFromFacilities: (facilities as any)[0].revenue_facilities || 0,
      paidToUsers: (paidUsers as any)[0].paid_users || 0,
      netProfit,
    };
  }

  static async getTransactionStats() {
    try {
      const [rows] = await pool.execute(`
      SELECT
        SUM(CASE WHEN type = 'revenue' AND status = 'completed' THEN amount ELSE 0 END) AS total_revenue,
        SUM(CASE WHEN type = 'payout' AND status = 'completed' THEN amount ELSE 0 END) AS total_payouts,
        SUM(CASE WHEN type = 'payout' AND status = 'pending' THEN amount ELSE 0 END) AS pending_payouts,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed_transactions
      FROM transactions;
    `);

      const [methods] = await pool.execute(`
      SELECT 
        pm.method AS payment_method,
        COUNT(t.id) AS total_transactions,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS success_count,
        COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.amount ELSE 0 END), 0) AS volume
      FROM (
        SELECT 'esewa' AS method
        UNION ALL SELECT 'khalti'
        UNION ALL SELECT 'bank_transfer'
        UNION ALL SELECT 'digital_wallet'
      ) pm
      LEFT JOIN transactions t ON t.payment_method = pm.method
      GROUP BY pm.method;
    `);

      const methodStats = (methods as any[]).reduce((acc, m) => {
        acc[m.payment_method] = {
          total_transactions: Number(m.total_transactions) || 0,
          success_rate:
            Number(m.total_transactions) > 0
              ? (
                  (Number(m.success_count) / Number(m.total_transactions)) *
                  100
                ).toFixed(1) + "%"
              : "0%",
          volume: Number(m.volume || 0).toFixed(2),
        };
        return acc;
      }, {} as Record<string, { total_transactions: number; success_rate: string; volume: string }>);

      return {
        total_revenue: Number((rows as any)[0].total_revenue || 0).toFixed(2),
        total_payouts: Number((rows as any)[0].total_payouts || 0).toFixed(2),
        pending_payouts: Number((rows as any)[0].pending_payouts || 0).toFixed(
          2
        ),
        failed_transactions: Number((rows as any)[0].failed_transactions) || 0,
        payment_methods: methodStats,
      };
    } catch (err) {
      console.error("TransactionStats error:", err);
      throw new Error("Failed to fetch transaction stats");
    }
  }
  static async getAllPayments() {
    const [rows] = await pool.execute(`
    SELECT 
      t.*,
      u.id AS user_id,
      u.name AS user_name,
      u.email AS user_email,
      u.role AS user_role
    FROM transactions t
    LEFT JOIN users u ON t.user_id = u.id
    ORDER BY t.created_at DESC
  `);

    const result = (rows as any[]).map((row) => ({
      ...row,
      user: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email,
        role: row.user_role,
      },
    }));

    return result;
  }

  static async getPaymentsByUserId(userId: number) {
    const [rows] = await pool.execute(
      `
      SELECT *
      FROM transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return rows;
  }

  static async requestPayment(
    user_id: number,
    amount: number,
    payment_method: "esewa" | "khalti"
  ) {
    const [result] = await pool.execute(
      `INSERT INTO transactions 
    (user_id, type, amount, currency, payment_method, status, description)
   VALUES (?, 'payout', ?, 'NPR', ?, 'pending', ?)`,
      [
        user_id,
        amount,
        payment_method,
        `Payout requested for Rs ${amount.toFixed(2)} via ${payment_method}`,
      ]
    );

    const insertId = (result as any).insertId;

    await pool.execute(
      `UPDATE users
     SET current_balance = IFNULL(current_balance, 0) - ?
     WHERE id = ?`,
      [amount, user_id]
    );

    return insertId;
  }

  static async refundUserBalance(user_id: number, amount: number) {
    const [result] = await pool.execute(
      `UPDATE users
       SET current_balance = IFNULL(current_balance, 0) + ?
       WHERE id = ?`,
      [amount, user_id]
    );

    return result;
  }

  static async updateSettings(
    settings: Record<string, any>,
    updatedBy: number
  ) {
    if (!settings || Object.keys(settings).length === 0) return;

    const keys = Object.keys(settings);
    const values = Object.values(settings);

    const setClause = keys.map((key) => `${key} = ?`).join(", ");

    const sql = `
    UPDATE system_settings
    SET ${setClause},
        updated_by = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `;

    values.push(updatedBy);

    await pool.execute(sql, values);
  }

  static async getSettings() {
    const [rows] = await pool.execute("SELECT * FROM system_settings LIMIT 1");

    const settings = (rows as any[])[0];

    return settings;
  }

  static async getNotificationPreferences() {
    const [rows] = await pool.execute(
      "SELECT * FROM notification_preferences WHERE id = 1"
    );
    return (rows as any)[0];
  }

  static async updateNotificationPreferences(
    email_notifications: number,
    security_alerts: number,
    payment_notifications: number,
    system_updates: number
  ) {
    const sql = `
    UPDATE notification_preferences
    SET 
      email_notifications = ?,
      security_alerts = ?,
      payment_notifications = ?,
      system_updates = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `;

    const [result] = await pool.execute(sql, [
      email_notifications,
      security_alerts,
      payment_notifications,
      system_updates,
    ]);

    return result;
  }

  static async getKeyMetrics(
    role: string,
    userId: number,
    timeframe: string = "7d"
  ) {
    let dateCondition = "WHERE 1=1";

    switch (timeframe) {
      case "7d":
        dateCondition = `WHERE view_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
        break;
      case "30d":
        dateCondition = `WHERE view_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
        break;
      case "90d":
        dateCondition = `WHERE view_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)`;
        break;
      case "1yr":
        dateCondition = `WHERE view_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)`;
        break;
      default:
        dateCondition = `WHERE view_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
    }

    // Admin filter for ads
    const adFilter = role === "admin" ? `AND created_by = ${userId}` : "";
    const adViewFilter = role === "admin" ? `AND a.created_by = ${userId}` : "";

    // Overview metrics
    const [totalUsersRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM users`
    );
    const totalUsers = totalUsersRows[0]?.total || 0;

    const [activeAdsRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM ad_campaigns WHERE status='active' ${adFilter}`
    );
    const activeAds = activeAdsRows[0]?.total || 0;

    const [totalRevenueRows] = await pool.execute<RowDataPacket[]>(
      `SELECT SUM(transaction_amount) as total 
     FROM ad_campaigns 
     WHERE transaction_status <> 'pending' ${adFilter}`
    );
    const totalRevenue = totalRevenueRows[0]?.total || 0;

    const [adViewsRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total 
     FROM user_ad_views uav
     JOIN ad_campaigns a ON uav.campaign_id = a.id
     ${dateCondition} AND a.transaction_status <> 'pending' ${adViewFilter}`
    );
    const adViews = adViewsRows[0]?.total || 0;

    // Revenue metrics
    const [userPayoutsRows] = await pool.execute<RowDataPacket[]>(
      `SELECT SUM(amount) as total FROM transactions WHERE status='completed' AND type='payout'`
    );
    const userPayouts = userPayoutsRows[0]?.total || 0;

    const netProfit = totalRevenue - userPayouts;

    const [avgRevenuePerAdRows] = await pool.execute<RowDataPacket[]>(
      `SELECT AVG(earnings) as avg_per_ad 
     FROM user_ad_views uav
     JOIN ad_campaigns a ON uav.campaign_id = a.id
     ${dateCondition} AND a.transaction_status <> 'pending' ${adViewFilter}`
    );
    const avgRevenuePerAd = avgRevenuePerAdRows[0]?.avg_per_ad || 0;

    // User activity metrics
    const [dailyActiveUsersRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT uav.user_id) as total 
     FROM user_ad_views uav
     JOIN ad_campaigns a ON uav.campaign_id = a.id
     ${dateCondition} AND a.transaction_status <> 'pending' ${adViewFilter}`
    );
    const dailyActiveUsers = dailyActiveUsersRows[0]?.total || 0;

    const [adsPerUserRows] = await pool.execute<RowDataPacket[]>(
      `SELECT AVG(ads_watched_count) as avg_ads FROM user_dashboard_summary`
    );
    const adsPerUser = adsPerUserRows[0]?.avg_ads || 0;

    const [retentionRateRows] = await pool.execute<RowDataPacket[]>(
      `SELECT ROUND(SUM(CASE WHEN last_active_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END)/COUNT(*)*100,2) as rate FROM users`
    );
    const retentionRate = retentionRateRows[0]?.rate || 0;

    const [avgSessionDurationRows] = await pool.execute<RowDataPacket[]>(
      `SELECT SEC_TO_TIME(AVG(view_duration)) as avg_time 
     FROM user_ad_views uav
     JOIN ad_campaigns a ON uav.campaign_id = a.id
     ${dateCondition} AND a.transaction_status <> 'pending' ${adViewFilter}`
    );
    const avgSessionDuration = avgSessionDurationRows[0]?.avg_time || "0:00";

    // Ad performance metrics
    const [totalImpressionsRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total 
     FROM user_ad_views uav
     JOIN ad_campaigns a ON uav.campaign_id = a.id
     ${dateCondition} AND a.transaction_status <> 'pending' ${adViewFilter}`
    );
    const totalImpressions = totalImpressionsRows[0]?.total || 0;

    const [clickThroughRateRows] = await pool.execute<RowDataPacket[]>(
      `SELECT ROUND(SUM(CASE WHEN completion_percentage>=50 THEN 1 ELSE 0 END)/COUNT(*)*100,2) as ctr 
     FROM user_ad_views uav
     JOIN ad_campaigns a ON uav.campaign_id = a.id
     ${dateCondition} AND a.transaction_status <> 'pending' ${adViewFilter}`
    );
    const clickThroughRate = clickThroughRateRows[0]?.ctr || 0;

    const [completionRateRows] = await pool.execute<RowDataPacket[]>(
      `SELECT ROUND(SUM(is_completed)/COUNT(*)*100,2) as rate 
     FROM user_ad_views uav
     JOIN ad_campaigns a ON uav.campaign_id = a.id
     ${dateCondition} AND a.transaction_status <> 'pending' ${adViewFilter}`
    );
    const completionRate = completionRateRows[0]?.rate || 0;

    const [avgViewDurationRows] = await pool.execute<RowDataPacket[]>(
      `SELECT SEC_TO_TIME(AVG(view_duration)) as avg_time 
     FROM user_ad_views uav
     JOIN ad_campaigns a ON uav.campaign_id = a.id
     ${dateCondition} AND a.transaction_status <> 'pending' ${adViewFilter}`
    );
    const avgViewDuration = avgViewDurationRows[0]?.avg_time || "0:00";

    // Financial metrics
    const [operatingRevenueRows] = await pool.execute<RowDataPacket[]>(
      `SELECT SUM(transaction_amount) as total 
     FROM ad_campaigns 
     WHERE transaction_status <> 'pending' ${adFilter}`
    );
    const operatingRevenue = operatingRevenueRows[0]?.total || 0;

    const [operatingExpensesRows] = await pool.execute<RowDataPacket[]>(
      `SELECT SUM(amount) as total FROM transactions WHERE status='completed' AND type='payout'`
    );
    const operatingExpenses = operatingExpensesRows[0]?.total || 0;

    const ebitda = operatingRevenue - operatingExpenses;
    const profitMargin = operatingRevenue
      ? ((ebitda / operatingRevenue) * 100).toFixed(2)
      : "0";

    return {
      overview: [
        { label: "Total Users", value: totalUsers },
        { label: "Active Ads", value: activeAds },
        { label: "Total Revenue", value: `Rs ${totalRevenue}` },
        { label: "Ad Views", value: adViews },
      ],
      revenue: [
        { label: "Gross Revenue", value: `Rs ${totalRevenue}` },
        { label: "User Payouts", value: `Rs ${userPayouts}` },
        { label: "Net Profit", value: `Rs ${netProfit}` },
        { label: "Avg. Revenue/Ad", value: `Rs ${avgRevenuePerAd}` },
      ],
      "user-activity": [
        { label: "Daily Active Users", value: dailyActiveUsers },
        { label: "Avg. Session Time", value: avgSessionDuration },
        { label: "Ads per User", value: adsPerUser },
        { label: "Retention Rate", value: `${retentionRate}%` },
      ],
      "ad-performance": [
        { label: "Total Impressions", value: totalImpressions },
        { label: "Click-through Rate", value: `${clickThroughRate}%` },
        { label: "Completion Rate", value: `${completionRate}%` },
        { label: "Avg. View Duration", value: avgViewDuration },
      ],
      financial: [
        { label: "Operating Revenue", value: `Rs ${operatingRevenue}` },
        { label: "Operating Expenses", value: `Rs ${operatingExpenses}` },
        { label: "EBITDA", value: `Rs ${ebitda}` },
        { label: "Profit Margin", value: `${profitMargin}%` },
      ],
    };
  }

  static async getFinancialOverview(
    role: string,
    userId: number,
    timeframe: string = "7d"
  ) {
    let dateCondition = "WHERE 1=1";

    switch (timeframe) {
      case "7d":
        dateCondition = `WHERE view_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
        break;
      case "30d":
        dateCondition = `WHERE view_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
        break;
      case "90d":
        dateCondition = `WHERE view_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)`;
        break;
      case "1yr":
        dateCondition = `WHERE view_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)`;
        break;
      default:
        dateCondition = `WHERE view_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
    }

    const adFilter = role === "admin" ? `AND created_by = ${userId}` : "";

    const [totalRevenueRows] = await pool.execute<RowDataPacket[]>(
      `SELECT SUM(transaction_amount) as total 
     FROM ad_campaigns 
     WHERE transaction_status <> 'pending' ${adFilter}`
    );
    const totalRevenue = totalRevenueRows[0]?.total || 0;

    const [userPayoutsRows] = await pool.execute<RowDataPacket[]>(
      `SELECT SUM(amount) as total 
     FROM transactions 
     WHERE status='completed' AND type='payout'`
    );
    const userPayouts = userPayoutsRows[0]?.total || 0;

    const netProfit = totalRevenue - userPayouts;

    const [avgRevenuePerAdRows] = await pool.execute<RowDataPacket[]>(
      `SELECT AVG(earnings) as avg_per_ad 
     FROM user_ad_views uav
     JOIN ad_campaigns a ON uav.campaign_id = a.id
     ${dateCondition} AND a.transaction_status <> 'pending' ${
        role === "admin" ? `AND a.created_by = ${userId}` : ""
      }`
    );
    const avgRevenuePerAd = avgRevenuePerAdRows[0]?.avg_per_ad || 0;

    const [operatingRevenueRows] = await pool.execute<RowDataPacket[]>(
      `SELECT SUM(transaction_amount) as total 
     FROM ad_campaigns 
     WHERE transaction_status <> 'pending' ${adFilter}`
    );
    const operatingRevenue = operatingRevenueRows[0]?.total || 0;

    const [operatingExpensesRows] = await pool.execute<RowDataPacket[]>(
      `SELECT SUM(amount) as total 
     FROM transactions 
     WHERE status='completed' AND type='payout'`
    );
    const operatingExpenses = operatingExpensesRows[0]?.total || 0;

    const ebitda = operatingRevenue - operatingExpenses;
    const profitMargin = operatingRevenue
      ? ((ebitda / operatingRevenue) * 100).toFixed(2)
      : "0";

    return [
      { label: "Gross Revenue", value: `Rs ${totalRevenue}` },
      { label: "User Payouts", value: `Rs ${userPayouts}` },
      { label: "Net Profit", value: `Rs ${netProfit}` },
      { label: "Avg. Revenue/Ad", value: `Rs ${avgRevenuePerAd}` },
      { label: "Operating Revenue", value: `Rs ${operatingRevenue}` },
      { label: "Operating Expenses", value: `Rs ${operatingExpenses}` },
      { label: "EBITDA", value: `Rs ${ebitda}` },
      { label: "Profit Margin", value: `${profitMargin}%` },
    ];
  }

  static async getAdPerformance(
    role: string,
    userId: number,
    timeframe: string = "7d"
  ) {
    let dateCondition = "WHERE 1=1";

    switch (timeframe) {
      case "7d":
        dateCondition = `WHERE view_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
        break;
      case "30d":
        dateCondition = `WHERE view_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
        break;
      case "90d":
        dateCondition = `WHERE view_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)`;
        break;
      case "1yr":
        dateCondition = `WHERE view_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)`;
        break;
      default:
        dateCondition = `WHERE view_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
    }

    const adViewFilter = role === "admin" ? `AND a.created_by = ${userId}` : "";

    const [totalImpressionsRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total 
     FROM user_ad_views uav
     JOIN ad_campaigns a ON uav.campaign_id = a.id
     ${dateCondition} AND a.transaction_status <> 'pending' ${adViewFilter}`
    );
    const totalImpressions = totalImpressionsRows[0]?.total || 0;

    const [clickThroughRateRows] = await pool.execute<RowDataPacket[]>(
      `SELECT ROUND(SUM(CASE WHEN completion_percentage>=50 THEN 1 ELSE 0 END)/COUNT(*)*100,2) as ctr 
     FROM user_ad_views uav
     JOIN ad_campaigns a ON uav.campaign_id = a.id
     ${dateCondition} AND a.transaction_status <> 'pending' ${adViewFilter}`
    );
    const clickThroughRate = clickThroughRateRows[0]?.ctr || 0;

    const [completionRateRows] = await pool.execute<RowDataPacket[]>(
      `SELECT ROUND(SUM(is_completed)/COUNT(*)*100,2) as rate 
     FROM user_ad_views uav
     JOIN ad_campaigns a ON uav.campaign_id = a.id
     ${dateCondition} AND a.transaction_status <> 'pending' ${adViewFilter}`
    );
    const completionRate = completionRateRows[0]?.rate || 0;

    const [avgViewDurationRows] = await pool.execute<RowDataPacket[]>(
      `SELECT SEC_TO_TIME(AVG(view_duration)) as avg_time 
     FROM user_ad_views uav
     JOIN ad_campaigns a ON uav.campaign_id = a.id
     ${dateCondition} AND a.transaction_status <> 'pending' ${adViewFilter}`
    );
    const avgViewDuration = avgViewDurationRows[0]?.avg_time || "0:00";

    return [
      { label: "Total Impressions", value: totalImpressions },
      { label: "Click-through Rate", value: `${clickThroughRate}%` },
      { label: "Completion Rate", value: `${completionRate}%` },
      { label: "Avg. View Duration", value: avgViewDuration },
    ];
  }

  static async getReports() {
    const [rows] = await pool.execute<RowDataPacket[]>(`SELECT * FROM reports`);
    return rows;
  }

  static async saveReportToDB(
    reportName: string,
    reportType: string,
    filePath: string,
    fileSize: number,
    generatedBy: number,
    dateRange?: { start: string; end: string }
  ) {
    const [result] = await pool.execute(
      `INSERT INTO reports 
        (report_name, report_type, file_path, file_size, status, date_range_start, date_range_end, generated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reportName,
        reportType,
        filePath,
        fileSize,
        "completed",
        dateRange?.start || null,
        dateRange?.end || null,
        generatedBy,
      ]
    );

    const insertedId = (result as any).insertId;

    const [rows] = await pool.execute(`SELECT * FROM reports WHERE id = ?`, [
      insertedId,
    ]);
    return (rows as any)[0];
  }

  static async updateTransaction(params: {
    id: string;
    transaction_id?: string;
    type?: "payout" | "revenue" | "refund" | "bonus";
    amount?: number;
    currency?: string;
    payment_method?: "esewa" | "khalti" | "bank_transfer" | "digital_wallet";
    payment_reference?: string;
    status?: "pending" | "completed" | "failed" | "cancelled";
    description?: string;
    failure_reason?: string;
    processed_by: number;
  }) {
    const {
      id,
      transaction_id,
      type,
      amount,
      currency,
      payment_method,
      payment_reference,
      status,
      description,
      failure_reason,
      processed_by,
    } = params;

    if (!id) throw new Error("Transaction ID (primary key) is required");

    const fields: string[] = [];
    const values: any[] = [];

    if (transaction_id !== undefined) {
      fields.push("transaction_id = ?");
      values.push(transaction_id);
    }

    if (type !== undefined) {
      fields.push("type = ?");
      values.push(type);
    }
    if (amount !== undefined) {
      fields.push("amount = ?");
      values.push(amount);
    }
    if (currency !== undefined) {
      fields.push("currency = ?");
      values.push(currency);
    }
    if (payment_method !== undefined) {
      fields.push("payment_method = ?");
      values.push(payment_method);
    }
    if (payment_reference !== undefined) {
      fields.push("payment_reference = ?");
      values.push(payment_reference);
    }
    if (status !== undefined) {
      fields.push("status = ?");
      values.push(status);
    }
    if (description !== undefined) {
      fields.push("description = ?");
      values.push(description);
    }
    if (failure_reason !== undefined) {
      fields.push("failure_reason = ?");
      values.push(failure_reason);
    }

    if (processed_by !== undefined) {
      fields.push("processed_by = ?");
      values.push(params.processed_by);
    }

    if (fields.length === 0) {
      throw new Error("No fields provided for update");
    }

    values.push(id);

    const sql = `UPDATE transactions SET ${fields.join(", ")} WHERE id = ?`;

    const [result] = await pool.execute(sql, values);

    return result;
  }

  static async getMyReferrals(userId: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `
    SELECT 
      r.id,
      r.earned_amount,
      r.created_at,
      u.*
    FROM referrals r
    JOIN users u ON r.new_user_id = u.id
    WHERE r.referred_by = ?
    ORDER BY r.created_at DESC
    `,
      [userId]
    );

    return rows.map((r) => {
      const { id, earned_amount, created_at, ...new_user } = r;
      return {
        id,
        earned_amount,
        created_at,
        new_user,
      };
    });
  }

  static async addReferral(referredBy: number, newUserId: number) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [settings] = await conn.execute<RowDataPacket[]>(
        `SELECT referral_bonus FROM system_settings LIMIT 1`
      );

      const referralBonus = settings[0]?.referral_bonus || 10;

      const [insertResult] = await conn.execute(
        `INSERT INTO referrals (referred_by, new_user_id, earned_amount)
         VALUES (?, ?, ?)`,
        [referredBy, newUserId, referralBonus]
      );

      await conn.execute(
        `UPDATE users 
         SET referals_earned = referals_earned + ?,
             total_earned = total_earned + ?,
             current_balance = current_balance + ?
         WHERE id = ?`,
        [referralBonus, referralBonus, referralBonus, referredBy]
      );

      await conn.commit();

      return {
        success: true,
        referralId: (insertResult as any).insertId,
        bonus: referralBonus,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async updateAdTransaction(
    id: number,
    status: "pending" | "requested" | "approved" | "rejected",
    transaction_code?: string
  ) {
    let query = `UPDATE ad_campaigns SET transaction_status = ?`;
    const values: (string | number | null)[] = [status];

    if (transaction_code !== undefined) {
      query += `, transaction_code = ?`;
      values.push(transaction_code);
    }

    query += ` WHERE id = ?`;
    values.push(id);

    try {
      const [result] = await pool.query(query, values);
      return result;
    } catch (error) {
      console.error("Error updating ad transaction:", error);
      throw error;
    }
  }
}
