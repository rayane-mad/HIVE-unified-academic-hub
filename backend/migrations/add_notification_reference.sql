-- Add reference_id column to notifications table
-- This column stores the ID of the item (assignment/event) that triggered the notification
-- Used to prevent duplicate notifications for the same item

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id VARCHAR(255);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_reference ON notifications(user_id, reference_id);
