-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  github_username TEXT,
  github_avatar_url TEXT,
  github_connected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create repositories table
CREATE TABLE public.repositories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  github_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  description TEXT,
  language TEXT,
  languages JSONB DEFAULT '{}',
  topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  default_branch TEXT DEFAULT 'main',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, github_id)
);

-- Enable RLS
ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for repositories
CREATE POLICY "Users can view their own repositories"
  ON public.repositories
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own repositories"
  ON public.repositories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own repositories"
  ON public.repositories
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own repositories"
  ON public.repositories
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger function for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_repositories_updated_at
  BEFORE UPDATE ON public.repositories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();