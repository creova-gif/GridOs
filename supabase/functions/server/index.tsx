import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { seedCustomers } from "./seed-customers.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-4719aee2/health", (c) => {
  return c.json({ status: "ok" });
});

// Seed customers endpoint (for initial setup)
app.post("/make-server-4719aee2/seed-customers", async (c) => {
  try {
    await seedCustomers();
    return c.json({ success: true, message: "Customers seeded successfully" });
  } catch (error) {
    console.error("Error seeding customers:", error);
    return c.json({ error: "Failed to seed customers" }, 500);
  }
});

// ========== AGENT APP API ROUTES ==========

// Lookup customer by phone number
app.post("/make-server-4719aee2/agent/customer/lookup", async (c) => {
  try {
    const { phone } = await c.req.json();
    
    if (!phone) {
      return c.json({ error: "Phone number is required" }, 400);
    }

    // Get all customers from KV store
    const customers = await kv.getByPrefix("customer:");
    
    // Find customer by phone
    const customer = customers.find((c: any) => c.phone === phone);
    
    if (!customer) {
      return c.json({ error: "Customer not found" }, 404);
    }

    return c.json({ customer });
  } catch (error) {
    console.error("Error looking up customer:", error);
    return c.json({ error: "Failed to lookup customer" }, 500);
  }
});

// Get all customers (with optional search)
app.get("/make-server-4719aee2/agent/customers", async (c) => {
  try {
    const search = c.req.query("search") || "";
    
    // Get all customers from KV store
    let customers = await kv.getByPrefix("customer:");
    
    // Filter by search query if provided
    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter((customer: any) => 
        customer.name.toLowerCase().includes(searchLower) ||
        customer.phone.includes(search) ||
        customer.meterId.toLowerCase().includes(searchLower)
      );
    }

    return c.json({ customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return c.json({ error: "Failed to fetch customers" }, 500);
  }
});

// Process payment
app.post("/make-server-4719aee2/agent/payment", async (c) => {
  try {
    const { customerId, amount, paymentMethod } = await c.req.json();
    
    if (!customerId || !amount || !paymentMethod) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Get customer data
    const customer = await kv.get(`customer:${customerId}`);
    
    if (!customer) {
      return c.json({ error: "Customer not found" }, 404);
    }

    // Calculate kWh from payment amount (example: 400 TZS per kWh)
    const kwhPurchased = amount / 400;
    
    // Generate 20-digit STS token (mock implementation)
    const stsToken = generateSTSToken();
    
    // Update customer balance
    const newBalance = (customer.balance || 0) + amount;
    await kv.set(`customer:${customerId}`, {
      ...customer,
      balance: newBalance,
      lastPayment: new Date().toISOString(),
      lastPaymentAmount: amount
    });

    // Log transaction
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await kv.set(`transaction:${transactionId}`, {
      id: transactionId,
      customerId,
      customerName: customer.name,
      meterId: customer.meterId,
      amount,
      paymentMethod,
      kwhPurchased,
      stsToken,
      timestamp: new Date().toISOString(),
      agentId: "agent-001" // In production, this would come from auth
    });

    return c.json({
      success: true,
      transaction: {
        id: transactionId,
        stsToken,
        kwhPurchased: kwhPurchased.toFixed(2),
        newBalance
      }
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return c.json({ error: "Failed to process payment" }, 500);
  }
});

// Report issue
app.post("/make-server-4719aee2/agent/issue", async (c) => {
  try {
    const { customerId, meterId, issueType, description } = await c.req.json();
    
    if (!meterId || !issueType) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const issueId = `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await kv.set(`issue:${issueId}`, {
      id: issueId,
      customerId,
      meterId,
      issueType,
      description,
      status: "open",
      timestamp: new Date().toISOString(),
      agentId: "agent-001" // In production, this would come from auth
    });

    return c.json({
      success: true,
      issueId
    });
  } catch (error) {
    console.error("Error reporting issue:", error);
    return c.json({ error: "Failed to report issue" }, 500);
  }
});

// Submit meter inspection with photo
app.post("/make-server-4719aee2/agent/inspection", async (c) => {
  try {
    const { 
      meterId, 
      customerId, 
      customerName,
      issueType, 
      severity,
      notes, 
      photo, 
      gpsLocation,
      meterReading 
    } = await c.req.json();
    
    if (!meterId || !issueType) {
      return c.json({ error: "Missing required fields: meterId and issueType" }, 400);
    }

    const inspectionId = `inspection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const inspection = {
      id: inspectionId,
      meterId,
      customerId,
      customerName,
      issueType,
      severity: severity || 'medium',
      notes: notes || '',
      photo: photo || null, // Base64 encoded photo data
      gpsLocation: gpsLocation || null,
      meterReading: meterReading || null,
      status: "pending",
      timestamp: new Date().toISOString(),
      agentId: "agent-001", // In production, this would come from auth
      syncedAt: new Date().toISOString()
    };

    await kv.set(`inspection:${inspectionId}`, inspection);

    // Also create an alert for critical inspections
    if (severity === 'critical' || severity === 'high') {
      const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await kv.set(`alert:${alertId}`, {
        id: alertId,
        type: 'inspection',
        severity,
        meterId,
        message: `${issueType} reported by agent`,
        description: notes,
        timestamp: new Date().toISOString(),
        status: 'open'
      });
    }

    return c.json({
      success: true,
      inspectionId,
      inspection
    });
  } catch (error) {
    console.error("Error submitting inspection:", error);
    return c.json({ error: "Failed to submit inspection" }, 500);
  }
});

// Get pending inspections for sync
app.get("/make-server-4719aee2/agent/inspections/pending", async (c) => {
  try {
    const agentId = c.req.query("agentId") || "agent-001";
    
    // Get all inspections
    const allInspections = await kv.getByPrefix("inspection:");
    
    // Filter pending inspections for this agent
    const pendingInspections = allInspections.filter((insp: any) => 
      insp.agentId === agentId && insp.status === "pending"
    );

    return c.json({ 
      inspections: pendingInspections,
      count: pendingInspections.length
    });
  } catch (error) {
    console.error("Error fetching pending inspections:", error);
    return c.json({ error: "Failed to fetch pending inspections" }, 500);
  }
});

// Sync endpoint - upload pending data and download updates
app.post("/make-server-4719aee2/agent/sync", async (c) => {
  try {
    const { 
      pendingTransactions = [], 
      pendingInspections = [],
      lastSyncTime,
      agentId = "agent-001"
    } = await c.req.json();

    const syncResults = {
      uploaded: {
        transactions: 0,
        inspections: 0
      },
      downloaded: {
        customers: [],
        updates: []
      },
      conflicts: [],
      timestamp: new Date().toISOString()
    };

    // Upload pending transactions
    for (const txn of pendingTransactions) {
      try {
        const txnId = txn.id || `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await kv.set(`transaction:${txnId}`, {
          ...txn,
          syncedAt: new Date().toISOString()
        });
        syncResults.uploaded.transactions++;
        
        // Update customer balance
        if (txn.customerId && txn.amount) {
          const customer = await kv.get(`customer:${txn.customerId}`);
          if (customer) {
            await kv.set(`customer:${txn.customerId}`, {
              ...customer,
              balance: (customer.balance || 0) + txn.amount,
              lastPayment: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error(`Failed to upload transaction ${txn.id}:`, error);
        syncResults.conflicts.push({
          type: 'transaction',
          id: txn.id,
          error: 'Upload failed'
        });
      }
    }

    // Upload pending inspections
    for (const insp of pendingInspections) {
      try {
        const inspId = insp.id || `inspection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await kv.set(`inspection:${inspId}`, {
          ...insp,
          syncedAt: new Date().toISOString()
        });
        syncResults.uploaded.inspections++;
      } catch (error) {
        console.error(`Failed to upload inspection ${insp.id}:`, error);
        syncResults.conflicts.push({
          type: 'inspection',
          id: insp.id,
          error: 'Upload failed'
        });
      }
    }

    // Download updated customer data (customers modified since lastSyncTime)
    const allCustomers = await kv.getByPrefix("customer:");
    const updatedCustomers = lastSyncTime 
      ? allCustomers.filter((c: any) => 
          new Date(c.lastPayment || c.createdAt || 0) > new Date(lastSyncTime)
        )
      : allCustomers;

    syncResults.downloaded.customers = updatedCustomers;

    // Download system updates/notifications
    const updates = await kv.getByPrefix("update:");
    syncResults.downloaded.updates = updates.filter((u: any) => 
      !lastSyncTime || new Date(u.timestamp) > new Date(lastSyncTime)
    );

    // Log sync event
    const syncLogId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await kv.set(`synclog:${syncLogId}`, {
      id: syncLogId,
      agentId,
      timestamp: new Date().toISOString(),
      uploaded: syncResults.uploaded,
      downloaded: {
        customers: syncResults.downloaded.customers.length,
        updates: syncResults.downloaded.updates.length
      },
      conflicts: syncResults.conflicts.length
    });

    return c.json({
      success: true,
      results: syncResults
    });
  } catch (error) {
    console.error("Error during sync:", error);
    return c.json({ error: "Failed to sync data" }, 500);
  }
});

// Get sync status
app.get("/make-server-4719aee2/agent/sync/status", async (c) => {
  try {
    const agentId = c.req.query("agentId") || "agent-001";
    
    // Get last sync log for this agent
    const syncLogs = await kv.getByPrefix("synclog:");
    const agentLogs = syncLogs
      .filter((log: any) => log.agentId === agentId)
      .sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    const lastSync = agentLogs[0];
    
    // Get pending counts
    const allTransactions = await kv.getByPrefix("transaction:");
    const allInspections = await kv.getByPrefix("inspection:");
    
    const pendingTransactions = allTransactions.filter((t: any) => 
      t.agentId === agentId && !t.syncedAt
    );
    
    const pendingInspections = allInspections.filter((i: any) => 
      i.agentId === agentId && !i.syncedAt
    );

    return c.json({
      lastSync: lastSync ? {
        timestamp: lastSync.timestamp,
        uploaded: lastSync.uploaded,
        downloaded: lastSync.downloaded,
        conflicts: lastSync.conflicts
      } : null,
      pending: {
        transactions: pendingTransactions.length,
        inspections: pendingInspections.length
      },
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error getting sync status:", error);
    return c.json({ error: "Failed to get sync status" }, 500);
  }
});

// Helper function to generate STS token (mock)
function generateSTSToken(): string {
  // In production, this would use the actual STS token generation algorithm
  // For now, generate a 20-digit number in the format: XXXX-XXXX-XXXX-XXXX-XXXX
  let token = '';
  for (let i = 0; i < 5; i++) {
    const segment = Math.floor(1000 + Math.random() * 9000).toString();
    token += (i > 0 ? '-' : '') + segment;
  }
  return token;
}

Deno.serve(app.fetch);