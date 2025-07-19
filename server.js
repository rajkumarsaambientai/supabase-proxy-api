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
function buildSearchQuery(params) {
  const queryParams = new URLSearchParams();
  
  // Standard pagination
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.offset) queryParams.append('offset', params.offset);
  
  // Search filters - use individual field searches
  if (params.search) {
    // For text search, we'll use individual field searches
    // CustomGPT can use specific field searches instead of complex OR queries
    queryParams.append('call_title', `ilike.%${params.search}%`);
  }
  
  // Specific field filters
  if (params.status) queryParams.append('call_status', `eq.${params.status}`);
  if (params.type) queryParams.append('call_type', `eq.${params.type}`);
  if (params.account) queryParams.append('crm_account_name', `ilike.%${params.account}%`);
  if (params.contact) queryParams.append('participant_names', `ilike.%${params.contact}%`);
  if (params.deal) queryParams.append('crm_deal_name', `ilike.%${params.deal}%`);
  
  // Date filters
  if (params.date_from) queryParams.append('call_time', `gte.${params.date_from}`);
  if (params.date_to) queryParams.append('call_time', `lte.${params.date_to}`);
  
  // Ordering
  if (params.order_by) {
    queryParams.append('order', `${params.order_by}.${params.order_direction || 'desc'}`);
  } else {
    // Default ordering by call_time desc
    queryParams.append('order', 'call_time.desc');
  }
  
  return queryParams.toString();
}

// Helper function to simplify data for CustomGPT
function simplifyData(data, tableType) {
  if (!Array.isArray(data)) {
    return data;
  }

  return data.map(item => {
    switch (tableType) {
      case 'sfdc_accounts':
        return {
          account_id: item.account_id,
          account_name: item.account_name,
          industry: item.industry,
          annual_revenue: item.annual_revenue,
          website: item.website,
          employees: item.employees,
          billing_city: item.billing_city,
          billing_state: item.billing_state_province,
          billing_country: item.billing_country,
          description: item.description?.substring(0, 200) + '...' || null
        };
      
      case 'sfdc_contacts':
        return {
          contact_id: item.contact_id,
          first_name: item.first_name,
          last_name: item.last_name,
          email: item.email,
          phone: item.phone,
          title: item.title,
          account_name: item.account_name,
          department: item.department
        };
      
      case 'sfdc_leads':
        return {
          lead_id: item.lead_id,
          first_name: item.first_name,
          last_name: item.last_name,
          email: item.email,
          phone: item.phone,
          company: item.company,
          title: item.title,
          status: item.status,
          source: item.lead_source
        };
      
      case 'sfdc_opportunities':
        return {
          opportunity_id: item.opportunity_id,
          opportunity_name: item.opportunity_name,
          account_name: item.account_name,
          amount: item.amount,
          stage: item.stage_name,
          close_date: item.close_date,
          probability: item.probability,
          type: item.type
        };
      
      case 'clari_calls':
        return {
          call_id: item.call_id,
          call_title: item.call_title,
          call_status: item.call_status,
          call_type: item.call_type,
          call_time: item.call_time,
          call_duration_seconds: item.call_duration_seconds,
          participant_count: item.participant_count,
          participant_names: item.participant_names,
          full_summary: item.full_summary?.substring(0, 500) + '...' || null,
          key_takeaways: item.key_takeaways?.substring(0, 300) + '...' || null,
          crm_account_name: item.crm_account_name,
          crm_deal_name: item.crm_deal_name,
          created_at: item.created_at
        };
      
      default:
        return item;
    }
  });
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Enhanced Supabase Proxy API - CustomGPT Compatible',
    endpoints: [
      '/api/clari-calls',
      '/api/sfdc-accounts', 
      '/api/sfdc-contacts',
      '/api/sfdc-leads',
      '/api/sfdc-opportunities'
    ],
    search_examples: [
      '?search=revenue&limit=10',
      '?account=Adobe&status=completed',
      '?date_from=2024-01-01&date_to=2024-12-31',
      '?contact=John&type=discovery'
    ],
    note: 'Enhanced with search, filtering, and relationship support'
  });
});

// Enhanced Clari Calls endpoint with search
app.get('/api/clari-calls', async (req, res) => {
  try {
    const queryParams = buildSearchQuery(req.query);
    const data = await proxyToSupabase('clari_calls', queryParams);
    const simplifiedData = simplifyData(data, 'clari_calls');
    res.json(simplifiedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhanced SFDC Accounts endpoint with search
app.get('/api/sfdc-accounts', async (req, res) => {
  try {
    const queryParams = buildSearchQuery(req.query);
    const data = await proxyToSupabase('sfdc_accounts', queryParams);
    const simplifiedData = simplifyData(data, 'sfdc_accounts');
    res.json(simplifiedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhanced SFDC Contacts endpoint with search
app.get('/api/sfdc-contacts', async (req, res) => {
  try {
    const queryParams = buildSearchQuery(req.query);
    const data = await proxyToSupabase('sfdc_contacts', queryParams);
    const simplifiedData = simplifyData(data, 'sfdc_contacts');
    res.json(simplifiedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhanced SFDC Leads endpoint with search
app.get('/api/sfdc-leads', async (req, res) => {
  try {
    const queryParams = buildSearchQuery(req.query);
    const data = await proxyToSupabase('sfdc_leads', queryParams);
    const simplifiedData = simplifyData(data, 'sfdc_leads');
    res.json(simplifiedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhanced SFDC Opportunities endpoint with search
app.get('/api/sfdc-opportunities', async (req, res) => {
  try {
    const queryParams = buildSearchQuery(req.query);
    const data = await proxyToSupabase('sfdc_opportunities', queryParams);
    const simplifiedData = simplifyData(data, 'sfdc_opportunities');
    res.json(simplifiedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Relationship endpoint - get related data across tables
app.get('/api/relationships/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { account_id, contact_id, opportunity_id, call_id } = req.query;
    
    let results = {};
    
    switch (type) {
      case 'account':
        if (account_id) {
          // Get account details
          const accountData = await proxyToSupabase('sfdc_accounts', `account_id=eq.${account_id}`);
          results.account = simplifyData(accountData, 'sfdc_accounts')[0];
          
          // Get related contacts
          const contactsData = await proxyToSupabase('sfdc_contacts', `account_id=eq.${account_id}`);
          results.contacts = simplifyData(contactsData, 'sfdc_contacts');
          
          // Get related opportunities
          const opportunitiesData = await proxyToSupabase('sfdc_opportunities', `account_id=eq.${account_id}`);
          results.opportunities = simplifyData(opportunitiesData, 'sfdc_opportunities');
          
          // Get related calls
          const callsData = await proxyToSupabase('clari_calls', `crm_account_id=eq.${account_id}`);
          results.calls = simplifyData(callsData, 'clari_calls');
        }
        break;
        
      case 'contact':
        if (contact_id) {
          // Get contact details
          const contactData = await proxyToSupabase('sfdc_contacts', `contact_id=eq.${contact_id}`);
          results.contact = simplifyData(contactData, 'sfdc_contacts')[0];
          
          // Get related account
          if (results.contact?.account_id) {
            const accountData = await proxyToSupabase('sfdc_accounts', `account_id=eq.${results.contact.account_id}`);
            results.account = simplifyData(accountData, 'sfdc_accounts')[0];
          }
          
          // Get related calls
          const callsData = await proxyToSupabase('clari_calls', `participant_names=ilike.%${results.contact?.first_name}%`);
          results.calls = simplifyData(callsData, 'clari_calls');
        }
        break;
        
      case 'opportunity':
        if (opportunity_id) {
          // Get opportunity details
          const opportunityData = await proxyToSupabase('sfdc_opportunities', `opportunity_id=eq.${opportunity_id}`);
          results.opportunity = simplifyData(opportunityData, 'sfdc_opportunities')[0];
          
          // Get related account
          if (results.opportunity?.account_id) {
            const accountData = await proxyToSupabase('sfdc_accounts', `account_id=eq.${results.opportunity.account_id}`);
            results.account = simplifyData(accountData, 'sfdc_accounts')[0];
          }
          
          // Get related calls
          const callsData = await proxyToSupabase('clari_calls', `crm_deal_id=eq.${opportunity_id}`);
          results.calls = simplifyData(callsData, 'clari_calls');
        }
        break;
        
      case 'call':
        if (call_id) {
          // Get call details
          const callData = await proxyToSupabase('clari_calls', `call_id=eq.${call_id}`);
          results.call = simplifyData(callData, 'clari_calls')[0];
          
          // Get related account if available
          if (results.call?.crm_account_name) {
            const accountData = await proxyToSupabase('sfdc_accounts', `account_name=ilike.%${results.call.crm_account_name}%`);
            results.account = simplifyData(accountData, 'sfdc_accounts')[0];
          }
          
          // Get related opportunity if available
          if (results.call?.crm_deal_name) {
            const opportunityData = await proxyToSupabase('sfdc_opportunities', `opportunity_name=ilike.%${results.call.crm_deal_name}%`);
            results.opportunity = simplifyData(opportunityData, 'sfdc_opportunities')[0];
          }
        }
        break;
    }
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Enhanced Supabase Proxy API running on port ${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   • GET /api/clari-calls (with search & filters)`);
  console.log(`   • GET /api/sfdc-accounts (with search & filters)`);
  console.log(`   • GET /api/sfdc-contacts (with search & filters)`);
  console.log(`   • GET /api/sfdc-leads (with search & filters)`);
  console.log(`   • GET /api/sfdc-opportunities (with search & filters)`);
  console.log(`   • GET /api/relationships/:type (account/contact/opportunity/call)`);
  console.log(`\n🎯 Enhanced for CustomGPT - search, filter, and relationships!`);
}); 