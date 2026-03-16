/**
 * System Health Check Utility
 * Run this to verify all services are configured and accessible
 */

import { supabase } from '../lib/supabase';
import { checkApiHealth } from '../services/api';

export interface SystemStatus {
  supabase: {
    connected: boolean;
    error?: string;
  };
  api: {
    connected: boolean;
    error?: string;
  };
  mqtt: {
    broker: string;
    configured: boolean;
  };
  env: {
    supabaseUrl: boolean;
    supabaseKey: boolean;
    apiUrl: boolean;
    mqttBroker: boolean;
  };
}

/**
 * Check Supabase connection
 */
async function checkSupabase(): Promise<{ connected: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.from('operators').select('count').limit(1);
    
    if (error) {
      return { connected: false, error: error.message };
    }
    
    return { connected: true };
  } catch (err) {
    return { 
      connected: false, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    };
  }
}

/**
 * Check Backend API connection
 */
async function checkApi(): Promise<{ connected: boolean; error?: string }> {
  try {
    const isHealthy = await checkApiHealth();
    return { connected: isHealthy };
  } catch (err) {
    return { 
      connected: false, 
      error: err instanceof Error ? err.message : 'API unreachable' 
    };
  }
}

/**
 * Check environment variables
 */
function checkEnvironment() {
  return {
    supabaseUrl: !!import.meta.env.VITE_SUPABASE_URL && 
                 import.meta.env.VITE_SUPABASE_URL !== 'https://your-project.supabase.co',
    supabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY && 
                 import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your-anon-key-here',
    apiUrl: !!import.meta.env.VITE_API_URL,
    mqttBroker: !!import.meta.env.VITE_MQTT_BROKER,
  };
}

/**
 * Run complete system health check
 */
export async function runSystemCheck(): Promise<SystemStatus> {
  const [supabaseStatus, apiStatus] = await Promise.all([
    checkSupabase(),
    checkApi(),
  ]);

  const envStatus = checkEnvironment();

  return {
    supabase: supabaseStatus,
    api: apiStatus,
    mqtt: {
      broker: import.meta.env.VITE_MQTT_BROKER || 'not configured',
      configured: envStatus.mqttBroker,
    },
    env: envStatus,
  };
}

/**
 * Print system status to console
 */
export async function printSystemStatus() {
  console.log('🔍 GridOS System Health Check\n');
  
  const status = await runSystemCheck();
  
  console.log('Environment Variables:');
  console.log(`  Supabase URL: ${status.env.supabaseUrl ? '✅' : '❌'}`);
  console.log(`  Supabase Key: ${status.env.supabaseKey ? '✅' : '❌'}`);
  console.log(`  API URL: ${status.env.apiUrl ? '✅' : '❌'}`);
  console.log(`  MQTT Broker: ${status.env.mqttBroker ? '✅' : '❌'}\n`);
  
  console.log('Service Connectivity:');
  console.log(`  Supabase: ${status.supabase.connected ? '✅ Connected' : '❌ Failed'}`);
  if (status.supabase.error) {
    console.log(`    Error: ${status.supabase.error}`);
  }
  
  console.log(`  Backend API: ${status.api.connected ? '✅ Connected' : '❌ Failed'}`);
  if (status.api.error) {
    console.log(`    Error: ${status.api.error}`);
  }
  
  console.log(`  MQTT Broker: ${status.mqtt.broker}`);
  console.log(`    Configured: ${status.mqtt.configured ? '✅' : '❌'}\n`);
  
  const allGood = status.supabase.connected && 
                  status.api.connected && 
                  status.env.supabaseUrl && 
                  status.env.supabaseKey;
  
  if (allGood) {
    console.log('✅ All systems operational!');
  } else {
    console.log('⚠️  Some services need attention. See SETUP.md for help.');
  }
  
  return status;
}

// Auto-run in development mode
if (import.meta.env.DEV) {
  setTimeout(() => {
    printSystemStatus();
  }, 2000);
}
