-- Create custom types
-- Check if types exist before creating to avoid errors on re-runs
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'admin', 'reseller', 'staff');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
        CREATE TYPE transaction_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'DECLINED');
    END IF;
END $$;

-- Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role user_role DEFAULT 'user',
  balance NUMERIC(12, 2) DEFAULT 0.00,
  savings NUMERIC(12, 2) DEFAULT 0.00,
  bonus_balance NUMERIC(12, 2) DEFAULT 0.00,
  wallet_number TEXT,
  account_number TEXT,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.profiles(id),
  is_verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Access Policies (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  generated_wallet TEXT;
  generated_referral TEXT;
BEGIN
  -- Simple generation logic (can be improved)
  generated_wallet := '2' || floor(random() * 900000000 + 100000000)::text;
  generated_referral := upper(substring(new.email from 1 for 3)) || floor(random() * 9000 + 1000)::text;

  INSERT INTO public.profiles (id, email, full_name, role, wallet_number, referral_code)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'user',
    generated_wallet,
    generated_referral
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  status transaction_status DEFAULT 'PENDING',
  reference TEXT UNIQUE NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Tickets Table
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
CREATE POLICY "Users can view own tickets" ON public.tickets FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
CREATE POLICY "Users can create tickets" ON public.tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ticket Messages
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.tickets(id) NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages for own tickets" ON public.ticket_messages;
CREATE POLICY "Users can view messages for own tickets" ON public.ticket_messages 
FOR SELECT USING ( EXISTS (SELECT 1 FROM public.tickets WHERE id = ticket_messages.ticket_id AND user_id = auth.uid()) );

DROP POLICY IF EXISTS "Users can add messages to own tickets" ON public.ticket_messages;
CREATE POLICY "Users can add messages to own tickets" ON public.ticket_messages 
FOR INSERT WITH CHECK ( EXISTS (SELECT 1 FROM public.tickets WHERE id = ticket_messages.ticket_id AND user_id = auth.uid()) );


-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
