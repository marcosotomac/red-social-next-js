-- Fix RLS policies to avoid infinite recursion
-- Drop existing policies that might cause recursion

-- Drop all existing policies for conversation_participants
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can leave conversations" ON conversation_participants;

-- Drop all existing policies for conversations
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations they participate in" ON conversations;

-- Drop all existing policies for messages
DROP POLICY IF EXISTS "Users can view messages in conversations they participate in" ON messages;
DROP POLICY IF EXISTS "Users can send messages to conversations they participate in" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

-- Drop all existing policies for message_read_status
DROP POLICY IF EXISTS "Users can view their own read status" ON message_read_status;
DROP POLICY IF EXISTS "Users can update their own read status" ON message_read_status;
DROP POLICY IF EXISTS "Users can create their own read status" ON message_read_status;

-- Create simplified, non-recursive policies

-- Conversation participants policies
CREATE POLICY "conversation_participants_select" ON conversation_participants
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "conversation_participants_insert" ON conversation_participants
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "conversation_participants_delete" ON conversation_participants
    FOR DELETE USING (user_id = auth.uid());

-- Conversations policies (direct access, no joins)
CREATE POLICY "conversations_select" ON conversations
    FOR SELECT USING (
        id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "conversations_insert" ON conversations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "conversations_update" ON conversations
    FOR UPDATE USING (
        id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

-- Messages policies (direct access, no joins)
CREATE POLICY "messages_select" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "messages_insert" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "messages_update" ON messages
    FOR UPDATE USING (sender_id = auth.uid());

-- Message read status policies
CREATE POLICY "message_read_status_select" ON message_read_status
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "message_read_status_insert" ON message_read_status
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "message_read_status_update" ON message_read_status
    FOR UPDATE USING (user_id = auth.uid());

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON conversation_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON message_read_status TO authenticated;