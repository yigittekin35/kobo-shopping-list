CREATE TABLE public.shopping_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL CHECK (char_length(trim(name)) > 0),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 99),
    is_purchased BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

-- No public policies needed as all access is via service role key through Vercel API

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.shopping_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Index for ordering
CREATE INDEX shopping_items_is_purchased_created_at_idx ON public.shopping_items (is_purchased, created_at DESC);

-- Table for Quick Add (Recent Items)
CREATE TABLE public.recent_items (
    name VARCHAR(100) PRIMARY KEY,
    last_added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    add_count INTEGER DEFAULT 1
);

-- Enable RLS for recent items
ALTER TABLE public.recent_items ENABLE ROW LEVEL SECURITY;

