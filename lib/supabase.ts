import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ubjbusblvkbvadgyrsuz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViamJ1c2JsdmtidmFkZ3lyc3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4ODMzNDYsImV4cCI6MjA2MTQ1OTM0Nn0.FmejfszFpT3JMmcRl3yMn6dWkac9XvLdjDcCU6nG8-Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
