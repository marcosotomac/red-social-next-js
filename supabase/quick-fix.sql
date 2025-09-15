-- Quick fix for RLS recursion issue
-- Execute this in Supabase SQL Editor

-- Temporarily disable RLS to make changes
ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_status DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can leave conversations" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_select" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_insert" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_delete" ON conversation_participants;

-- Create simple policies for conversation_participants
CREATE POLICY "Enable all for authenticated users" ON conversation_participants
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Re-enable RLS
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;