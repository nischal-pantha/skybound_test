-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create aircraft_profiles table
CREATE TABLE public.aircraft_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  registration TEXT,
  empty_weight NUMERIC,
  max_weight NUMERIC,
  forward_cg_limit NUMERIC,
  aft_cg_limit NUMERIC,
  fuel_arm NUMERIC,
  front_seat_arm NUMERIC,
  rear_seat_arm NUMERIC,
  baggage_arm NUMERIC,
  max_fuel NUMERIC,
  fuel_burn_rate NUMERIC,
  cruise_speed NUMERIC,
  max_range NUMERIC,
  service_ceiling NUMERIC,
  performance_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create flight_logs table
CREATE TABLE public.flight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  aircraft TEXT NOT NULL,
  departure TEXT NOT NULL,
  destination TEXT NOT NULL,
  route TEXT,
  flight_time NUMERIC NOT NULL DEFAULT 0,
  landings INTEGER DEFAULT 0,
  approaches INTEGER DEFAULT 0,
  holds INTEGER DEFAULT 0,
  cross_country NUMERIC DEFAULT 0,
  night NUMERIC DEFAULT 0,
  instrument NUMERIC DEFAULT 0,
  solo BOOLEAN DEFAULT false,
  dual BOOLEAN DEFAULT false,
  pic BOOLEAN DEFAULT false,
  instructor TEXT,
  remarks TEXT,
  waypoints JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create flight_plans table
CREATE TABLE public.flight_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  aircraft TEXT,
  departure TEXT,
  destination TEXT,
  alternate TEXT,
  altitude INTEGER,
  airspeed INTEGER,
  fuel NUMERIC,
  passengers INTEGER,
  flight_rules TEXT DEFAULT 'VFR',
  route_type TEXT DEFAULT 'direct',
  route_options JSONB DEFAULT '{}',
  waypoints JSONB DEFAULT '[]',
  remarks TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create flight_schedules table
CREATE TABLE public.flight_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  aircraft TEXT NOT NULL,
  instructor TEXT,
  type TEXT NOT NULL,
  duration NUMERIC NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aircraft_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_schedules ENABLE ROW LEVEL SECURITY;

-- Helper function to check record ownership
CREATE OR REPLACE FUNCTION public.is_own_record(record_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = record_user_id
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (public.is_own_record(user_id));

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (public.is_own_record(user_id));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (public.is_own_record(user_id));

-- Aircraft profiles policies
CREATE POLICY "Users can view own aircraft" ON public.aircraft_profiles
  FOR SELECT USING (public.is_own_record(user_id));

CREATE POLICY "Users can insert own aircraft" ON public.aircraft_profiles
  FOR INSERT WITH CHECK (public.is_own_record(user_id));

CREATE POLICY "Users can update own aircraft" ON public.aircraft_profiles
  FOR UPDATE USING (public.is_own_record(user_id));

CREATE POLICY "Users can delete own aircraft" ON public.aircraft_profiles
  FOR DELETE USING (public.is_own_record(user_id));

-- Flight logs policies
CREATE POLICY "Users can view own flight logs" ON public.flight_logs
  FOR SELECT USING (public.is_own_record(user_id));

CREATE POLICY "Users can insert own flight logs" ON public.flight_logs
  FOR INSERT WITH CHECK (public.is_own_record(user_id));

CREATE POLICY "Users can update own flight logs" ON public.flight_logs
  FOR UPDATE USING (public.is_own_record(user_id));

CREATE POLICY "Users can delete own flight logs" ON public.flight_logs
  FOR DELETE USING (public.is_own_record(user_id));

-- Flight plans policies
CREATE POLICY "Users can view own flight plans" ON public.flight_plans
  FOR SELECT USING (public.is_own_record(user_id));

CREATE POLICY "Users can insert own flight plans" ON public.flight_plans
  FOR INSERT WITH CHECK (public.is_own_record(user_id));

CREATE POLICY "Users can update own flight plans" ON public.flight_plans
  FOR UPDATE USING (public.is_own_record(user_id));

CREATE POLICY "Users can delete own flight plans" ON public.flight_plans
  FOR DELETE USING (public.is_own_record(user_id));

-- Flight schedules policies
CREATE POLICY "Users can view own schedules" ON public.flight_schedules
  FOR SELECT USING (public.is_own_record(user_id));

CREATE POLICY "Users can insert own schedules" ON public.flight_schedules
  FOR INSERT WITH CHECK (public.is_own_record(user_id));

CREATE POLICY "Users can update own schedules" ON public.flight_schedules
  FOR UPDATE USING (public.is_own_record(user_id));

CREATE POLICY "Users can delete own schedules" ON public.flight_schedules
  FOR DELETE USING (public.is_own_record(user_id));

-- Trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_aircraft_profiles_updated_at
  BEFORE UPDATE ON public.aircraft_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flight_plans_updated_at
  BEFORE UPDATE ON public.flight_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();