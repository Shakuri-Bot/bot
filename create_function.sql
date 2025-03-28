-- Bu SQL kodunu Supabase SQL Editor'da çalıştırın
CREATE OR REPLACE FUNCTION create_table_if_not_exists(
  table_name text,
  columns text
)
RETURNS void AS $$
BEGIN
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I (
      %s
    );
  ', table_name, columns);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tabloları oluştur
DO $$
BEGIN
  -- partner_system tablosu
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_system') THEN
    CREATE TABLE public.partner_system (
      id serial primary key, 
      key text unique not null, 
      value jsonb, 
      created_at timestamp with time zone default now(), 
      updated_at timestamp with time zone default now()
    );
  END IF;
  
  -- partner_text tablosu
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_text') THEN
    CREATE TABLE public.partner_text (
      id serial primary key, 
      key text unique not null, 
      value jsonb, 
      created_at timestamp with time zone default now(), 
      updated_at timestamp with time zone default now()
    );
  END IF;
  
  -- partner_count tablosu
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_count') THEN
    CREATE TABLE public.partner_count (
      id serial primary key, 
      key text unique not null, 
      value jsonb, 
      created_at timestamp with time zone default now(), 
      updated_at timestamp with time zone default now()
    );
  END IF;
  
  -- partner_logs tablosu
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_logs') THEN
    CREATE TABLE public.partner_logs (
      id serial primary key, 
      key text unique not null, 
      value jsonb, 
      created_at timestamp with time zone default now(), 
      updated_at timestamp with time zone default now()
    );
  END IF;
  
  -- partner_timestamps tablosu
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_timestamps') THEN
    CREATE TABLE public.partner_timestamps (
      id serial primary key, 
      key text unique not null, 
      value jsonb, 
      created_at timestamp with time zone default now(), 
      updated_at timestamp with time zone default now()
    );
  END IF;
  
  -- banned_guilds tablosu
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'banned_guilds') THEN
    CREATE TABLE public.banned_guilds (
      id serial primary key, 
      key text unique not null, 
      value jsonb, 
      created_at timestamp with time zone default now(), 
      updated_at timestamp with time zone default now()
    );
  END IF;
  
  -- partner_toggle tablosu
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_toggle') THEN
    CREATE TABLE public.partner_toggle (
      id serial primary key, 
      key text unique not null, 
      value jsonb, 
      created_at timestamp with time zone default now(), 
      updated_at timestamp with time zone default now()
    );
  END IF;
  
  -- guild_data tablosu
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'guild_data') THEN
    CREATE TABLE public.guild_data (
      id serial primary key, 
      key text unique not null, 
      value jsonb, 
      created_at timestamp with time zone default now(), 
      updated_at timestamp with time zone default now()
    );
  END IF;
END $$; 