-- Create helper function to check if user is in conversation
-- This avoids recursion in RLS policies

CREATE OR REPLACE FUNCTION is_conversation_participant(conversation_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM conversation_participants 
        WHERE conversation_id = conversation_uuid 
        AND user_id = user_uuid
    );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_conversation_participant(UUID, UUID) TO authenticated;

-- Now update the policies to use this function instead of direct joins

-- Drop existing policies
DROP POLICY IF EXISTS "conversations_select" ON conversations;
DROP POLICY IF EXISTS "conversations_update" ON conversations;
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;

-- Create new policies using the helper function
CREATE POLICY "conversations_select" ON conversations
    FOR SELECT USING (is_conversation_participant(id, auth.uid()));

CREATE POLICY "conversations_update" ON conversations
    FOR UPDATE USING (is_conversation_participant(id, auth.uid()));

CREATE POLICY "messages_select" ON messages
    FOR SELECT USING (is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "messages_insert" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        is_conversation_participant(conversation_id, auth.uid())
    );