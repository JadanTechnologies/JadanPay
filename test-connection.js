
import { createClient } from '@supabase/supabase-js';

// Hardcoded keys from your .env for testing
const supabaseUrl = 'https://jbhouhshhiaocvebgxvy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiaG91aHNoaGlhb2N2ZWJneHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzgwMTYsImV4cCI6MjA4MDUxNDAxNn0.2diSMRfbZ9gwXc_UenfPLiv086vD-Q1RXjQSmhlqeqI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log("Testing connection to:", supabaseUrl);
    const start = Date.now();
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

    if (error) {
        console.error("Connection Failed:", error.message);
    } else {
        console.log("Connection Successful! Ping time:", Date.now() - start, "ms");
    }
}

testConnection();
