/*
  # Online Voting System Database Schema

  1. New Tables
    - `voter_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `date_of_birth` (date)
      - `address` (text)
      - `voter_id` (text, unique)
      - `id_document_url` (text)
      - `verification_status` (enum: pending, verified, rejected)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `elections`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `status` (enum: upcoming, active, completed)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `candidates`
      - `id` (uuid, primary key)
      - `election_id` (uuid, foreign key)
      - `name` (text)
      - `party` (text)
      - `bio` (text)
      - `photo_url` (text)
      - `position` (integer)
      - `created_at` (timestamp)
    
    - `votes`
      - `id` (uuid, primary key)
      - `election_id` (uuid, foreign key)
      - `voter_id` (uuid, foreign key)
      - `candidate_id` (uuid, foreign key)
      - `cast_at` (timestamptz)
      - `ip_address` (text)
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Prevent duplicate voting with unique constraints
    - Audit trail for vote casting
*/

-- Create custom types
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE election_status AS ENUM ('upcoming', 'active', 'completed');

-- Voter profiles table
CREATE TABLE IF NOT EXISTS voter_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  date_of_birth date NOT NULL,
  address text NOT NULL,
  voter_id text UNIQUE NOT NULL,
  id_document_url text,
  verification_status verification_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Elections table
CREATE TABLE IF NOT EXISTS elections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status election_status DEFAULT 'upcoming',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id uuid NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  name text NOT NULL,
  party text NOT NULL,
  bio text DEFAULT '',
  photo_url text DEFAULT '',
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id uuid NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  cast_at timestamptz DEFAULT now(),
  ip_address text,
  UNIQUE(election_id, voter_id) -- Prevent duplicate voting
);

-- Enable RLS
ALTER TABLE voter_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Policies for voter_profiles
CREATE POLICY "Users can read own profile"
  ON voter_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON voter_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON voter_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policies for elections
CREATE POLICY "Anyone can read elections"
  ON elections
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for candidates
CREATE POLICY "Anyone can read candidates"
  ON candidates
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for votes
CREATE POLICY "Users can insert own votes"
  ON votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = voter_id);

CREATE POLICY "Users can read own votes"
  ON votes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = voter_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
CREATE TRIGGER update_voter_profiles_updated_at
  BEFORE UPDATE ON voter_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_elections_updated_at
  BEFORE UPDATE ON elections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO elections (title, description, start_date, end_date, status) VALUES
('2024 Presidential Election', 'National presidential election to choose the next president', '2024-11-01 08:00:00+00', '2024-11-01 20:00:00+00', 'active'),
('Local Mayor Election', 'City mayor election for downtown district', '2024-12-15 08:00:00+00', '2024-12-15 18:00:00+00', 'upcoming');

-- Get the election IDs for inserting candidates
DO $$
DECLARE
  presidential_id uuid;
  mayor_id uuid;
BEGIN
  SELECT id INTO presidential_id FROM elections WHERE title = '2024 Presidential Election';
  SELECT id INTO mayor_id FROM elections WHERE title = 'Local Mayor Election';

  -- Presidential candidates
  INSERT INTO candidates (election_id, name, party, bio, photo_url, position) VALUES
  (presidential_id, 'John Anderson', 'Democratic Party', 'Experienced senator with focus on healthcare reform and economic growth.', 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop', 1),
  (presidential_id, 'Sarah Williams', 'Republican Party', 'Former governor advocating for stronger national defense and tax reforms.', 'https://images.pexels.com/photos/3727464/pexels-photo-3727464.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop', 2),
  (presidential_id, 'Michael Chen', 'Independent', 'Business leader promoting innovation in technology and environmental policies.', 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop', 3);

  -- Mayor candidates
  INSERT INTO candidates (election_id, name, party, bio, photo_url, position) VALUES
  (mayor_id, 'Lisa Rodriguez', 'Progressive Alliance', 'City council member focused on urban development and public transportation.', 'https://images.pexels.com/photos/3727463/pexels-photo-3727463.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop', 1),
  (mayor_id, 'David Thompson', 'Citizens First', 'Local business owner committed to reducing taxes and improving city services.', 'https://images.pexels.com/photos/2422290/pexels-photo-2422290.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop', 2);
END $$;