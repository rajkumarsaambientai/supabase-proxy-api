const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase configuration
const SUPABASE_URL = 'https://jwpgtjibqvealvbdehdn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3cGd0amlicXZlYWx2YmRlaGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MzU4NzQsImV4cCI6MjA2ODAxMTg3NH0.RH0PxIe1wic1wXhaivoCTU4J3W2-7jb14jMYouWXYAQ';

// CustomGPT Payload Limits
const CUSTOMGPT_LIMITS = {
  MAX_RESPONSE_SIZE: 2 * 1024 * 1024, // 2MB
  MAX_TOKENS: 16000,
  MAX_RECORDS_PER_RESPONSE: 10, // Conservative limit
  MAX_TEXT_LENGTH: 150 // Characters per text field
};

// Helper function to proxy requests to Supabase
async function proxyToSupabase(tableName, queryParams = '') {
  try {
    const url = `${SUPABASE_URL}/rest/v1/${tableName}?${queryParams}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error proxying to ${tableName}:`, error);
    throw error;
  }
}

// Helper function to build search queries
function buildSearchQuery(params, tableName) {
  const queryParams = new URLSearchParams();
  
  // Enforce CustomGPT limits
  const limit = Math.min(params.limit || CUSTOMGPT_LIMITS.MAX_RECORDS_PER_RESPONSE, CUSTOMGPT_LIMITS.MAX_RECORDS_PER_RESPONSE);
  queryParams.append('limit', limit);
  
  if (params.offset) queryParams.append('offset', params.offset);
  
  // Table-specific search and filters
  switch (tableName) {
    case 'clari_calls':
      if (params.search) queryParams.append('call_title', `ilike.%${params.search}%`);
      if (params.status) queryParams.append('call_status', `eq.${params.status}`);
      if (params.type) queryParams.append('call_type', `eq.${params.type}`);
      if (params.account) queryParams.append('crm_account_name', `ilike.%${params.account}%`);
      if (params.contact) queryParams.append('participant_names', `ilike.%${params.contact}%`);
      if (params.deal) queryParams.append('crm_deal_name', `ilike.%${params.deal}%`);
      if (params.date_from) queryParams.append('call_time', `gte.${params.date_from}`);
      if (params.date_to) queryParams.append('call_time', `lte.${params.date_to}`);
      if (params.order_by) {
        queryParams.append('order', `${params.order_by}.${params.order_direction || 'desc'}`);
      }
      break;
      
    case 'sfdc_accounts':
      if (params.search) queryParams.append('account_name', `ilike.%${params.search}%`);
      if (params.industry) queryParams.append('industry', `eq.${params.industry}`);
      if (params.revenue_min) queryParams.append('annual_revenue', `gte.${params.revenue_min}`);
      if (params.order_by) {
        queryParams.append('order', `${params.order_by}.${params.order_direction || 'desc'}`);
      }
      break;
      
    case 'sfdc_contacts':
      if (params.search) queryParams.append('first_name', `ilike.%${params.search}%`);
      if (params.account) queryParams.append('account_name', `ilike.%${params.account}%`);
      if (params.title) queryParams.append('title', `ilike.%${params.title}%`);
      if (params.order_by) {
        queryParams.append('order', `${params.order_by}.${params.order_direction || 'asc'}`);
      }
      break;
      
    case 'sfdc_opportunities':
      if (params.search) queryParams.append('opportunity_name', `ilike.%${params.search}%`);
      if (params.stage) queryParams.append('stage_name', `eq.${params.stage}`);
      if (params.account) queryParams.append('account_name', `ilike.%${params.account}%`);
      if (params.amount_min) queryParams.append('amount', `gte.${params.amount_min}`);
      if (params.order_by) {
        queryParams.append('order', `${params.order_by}.${params.order_direction || 'desc'}`);
      }
      break;
      
    case 'sfdc_leads':
      if (params.search) queryParams.append('first_name', `ilike.%${params.search}%`);
      if (params.status) queryParams.append('status', `eq.${params.status}`);
      if (params.source) queryParams.append('lead_source', `eq.${params.source}`);
      if (params.order_by) {
        queryParams.append('order', `${params.order_by}.${params.order_direction || 'desc'}`);
      }
      break;
  }
  
  return queryParams.toString();
}

// Helper function to truncate text for CustomGPT
function truncateText(text, maxLength = CUSTOMGPT_LIMITS.MAX_TEXT_LENGTH) {
  if (!text || typeof text !== 'string') return null;
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Helper function to optimize data for CustomGPT
function optimizeForCustomGPT(data, tableType) {
  if (!Array.isArray(data)) {
    return data;
  }

  return data.map(item => {
    switch (tableType) {
      case 'sfdc_accounts':
        return {
          id: item.account_id,
          name: truncateText(item.account_name, 50),
          industry: truncateText(item.industry, 30),
          revenue: item.annual_revenue,
          website: truncateText(item.website, 30),
          employees: item.employees,
          city: truncateText(item.billing_city, 30),
          state: truncateText(item.billing_state_province, 20),
          country: truncateText(item.billing_country, 20)
        };
      
      case 'sfdc_contacts':
        return {
          id: item.contact_id,
          first_name: truncateText(item.first_name, 30),
          last_name: truncateText(item.last_name, 30),
          email: truncateText(item.email, 50),
          phone: truncateText(item.phone, 20),
          title: truncateText(item.title, 40),
          account: truncateText(item.account_name, 40),
          dept: truncateText(item.department, 30)
        };
      
      case 'sfdc_leads':
        return {
          id: item.lead_id,
          first_name: truncateText(item.first_name, 30),
          last_name: truncateText(item.last_name, 30),
          email: truncateText(item.email, 50),
          phone: truncateText(item.phone, 20),
          company: truncateText(item.company, 40),
          title: truncateText(item.title, 40),
          status: truncateText(item.status, 20),
          source: truncateText(item.lead_source, 20)
        };
      
      case 'sfdc_opportunities':
        return {
          id: item.opportunity_id,
          name: truncateText(item.opportunity_name, 60),
          account: truncateText(item.account_name, 40),
          amount: item.amount,
          stage: truncateText(item.stage_name, 30),
          close_date: item.close_date,
          probability: item.probability,
          type: truncateText(item.type, 20)
        };
      
      case 'clari_calls':
        return {
          id: item.call_id,
          title: truncateText(item.call_title, 80),
          status: truncateText(item.call_status, 20),
          type: truncateText(item.call_type, 20),
          time: item.call_time,
          duration: item.call_duration_seconds,
          participants: item.participant_count,
          names: truncateText(item.participant_names, 100),
          summary: truncateText(item.full_summary, 120),
          takeaways: truncateText(item.key_takeaways, 100),
          account: truncateText(item.crm_account_name, 40),
          deal: truncateText(item.crm_deal_name, 40)
        };
      
      default:
        return item;
    }
  });
}

// Helper function to estimate response size
function estimateResponseSize(data) {
  const jsonString = JSON.stringify(data);
  return {
    size: jsonString.length,
    tokens: Math.ceil(jsonString.length / 4), // Rough estimate: 1 token ≈ 4 characters
    isWithinLimits: jsonString.length < CUSTOMGPT_LIMITS.MAX_RESPONSE_SIZE
  };
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CustomGPT-Optimized Supabase Proxy API',
    limits: {
      max_response_size: '2MB',
      max_tokens: '16,000',
      max_records_per_response: CUSTOMGPT_LIMITS.MAX_RECORDS_PER_RESPONSE,
      max_text_length: CUSTOMGPT_LIMITS.MAX_TEXT_LENGTH
    },
    endpoints: [
      '/api/clari-calls',
      '/api/sfdc-accounts', 
      '/api/sfdc-contacts',
      '/api/sfdc-leads',
      '/api/sfdc-opportunities'
    ],
    search_examples: [
      '?search=revenue&limit=5',
      '?account=Adobe&status=completed',
      '?date_from=2024-01-01&limit=3'
    ],
    note: 'Optimized for CustomGPT payload limits'
  });
});

// Enhanced Clari Calls endpoint with CustomGPT optimization
app.get('/api/clari-calls', async (req, res) => {
  try {
    const queryParams = buildSearchQuery(req.query, 'clari_calls');
    const data = await proxyToSupabase('clari_calls', queryParams);
    const optimizedData = optimizeForCustomGPT(data, 'clari_calls');
    
    const sizeInfo = estimateResponseSize(optimizedData);
    
    res.json({
      data: optimizedData,
      meta: {
        count: optimizedData.length,
        estimated_size: `${(sizeInfo.size / 1024).toFixed(1)}KB`,
        estimated_tokens: sizeInfo.tokens,
        within_limits: sizeInfo.isWithinLimits
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhanced SFDC Accounts endpoint with CustomGPT optimization
app.get('/api/sfdc-accounts', async (req, res) => {
  try {
    const queryParams = buildSearchQuery(req.query, 'sfdc_accounts');
    const data = await proxyToSupabase('sfdc_accounts', queryParams);
    const optimizedData = optimizeForCustomGPT(data, 'sfdc_accounts');
    
    const sizeInfo = estimateResponseSize(optimizedData);
    
    res.json({
      data: optimizedData,
      meta: {
        count: optimizedData.length,
        estimated_size: `${(sizeInfo.size / 1024).toFixed(1)}KB`,
        estimated_tokens: sizeInfo.tokens,
        within_limits: sizeInfo.isWithinLimits
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhanced SFDC Contacts endpoint with CustomGPT optimization
app.get('/api/sfdc-contacts', async (req, res) => {
  try {
    const queryParams = buildSearchQuery(req.query, 'sfdc_contacts');
    const data = await proxyToSupabase('sfdc_contacts', queryParams);
    const optimizedData = optimizeForCustomGPT(data, 'sfdc_contacts');
    
    const sizeInfo = estimateResponseSize(optimizedData);
    
    res.json({
      data: optimizedData,
      meta: {
        count: optimizedData.length,
        estimated_size: `${(sizeInfo.size / 1024).toFixed(1)}KB`,
        estimated_tokens: sizeInfo.tokens,
        within_limits: sizeInfo.isWithinLimits
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhanced SFDC Leads endpoint with CustomGPT optimization
app.get('/api/sfdc-leads', async (req, res) => {
  try {
    const queryParams = buildSearchQuery(req.query, 'sfdc_leads');
    const data = await proxyToSupabase('sfdc_leads', queryParams);
    const optimizedData = optimizeForCustomGPT(data, 'sfdc_leads');
    
    const sizeInfo = estimateResponseSize(optimizedData);
    
    res.json({
      data: optimizedData,
      meta: {
        count: optimizedData.length,
        estimated_size: `${(sizeInfo.size / 1024).toFixed(1)}KB`,
        estimated_tokens: sizeInfo.tokens,
        within_limits: sizeInfo.isWithinLimits
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhanced SFDC Opportunities endpoint with CustomGPT optimization
app.get('/api/sfdc-opportunities', async (req, res) => {
  try {
    const queryParams = buildSearchQuery(req.query, 'sfdc_opportunities');
    const data = await proxyToSupabase('sfdc_opportunities', queryParams);
    const optimizedData = optimizeForCustomGPT(data, 'sfdc_opportunities');
    
    const sizeInfo = estimateResponseSize(optimizedData);
    
    res.json({
      data: optimizedData,
      meta: {
        count: optimizedData.length,
        estimated_size: `${(sizeInfo.size / 1024).toFixed(1)}KB`,
        estimated_tokens: sizeInfo.tokens,
        within_limits: sizeInfo.isWithinLimits
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CustomGPT-Optimized API running on port ${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   • GET /api/clari-calls (max ${CUSTOMGPT_LIMITS.MAX_RECORDS_PER_RESPONSE} records)`);
  console.log(`   • GET /api/sfdc-accounts (max ${CUSTOMGPT_LIMITS.MAX_RECORDS_PER_RESPONSE} records)`);
  console.log(`   • GET /api/sfdc-contacts (max ${CUSTOMGPT_LIMITS.MAX_RECORDS_PER_RESPONSE} records)`);
  console.log(`   • GET /api/sfdc-leads (max ${CUSTOMGPT_LIMITS.MAX_RECORDS_PER_RESPONSE} records)`);
  console.log(`   • GET /api/sfdc-opportunities (max ${CUSTOMGPT_LIMITS.MAX_RECORDS_PER_RESPONSE} records)`);
  console.log(`\n🎯 Optimized for CustomGPT: 2MB limit, 16k tokens, ${CUSTOMGPT_LIMITS.MAX_TEXT_LENGTH} char text fields`);
}); 