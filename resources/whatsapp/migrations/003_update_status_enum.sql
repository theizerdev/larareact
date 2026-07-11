-- Update status enum to include 'received'
ALTER TABLE whatsapp_messages 
MODIFY COLUMN status ENUM('pending', 'sent', 'delivered', 'read', 'failed', 'received') DEFAULT 'pending';