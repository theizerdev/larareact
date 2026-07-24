-- WhatsApp Sessions Table
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id VARCHAR(255) PRIMARY KEY,
  status ENUM('disconnected', 'connecting', 'connected', 'qr_ready') DEFAULT 'disconnected',
  qrCode TEXT,
  lastSeen DATETIME,
  phoneNumber VARCHAR(20),
  deviceName VARCHAR(255),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- WhatsApp Messages Table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  messageId VARCHAR(255) UNIQUE NOT NULL,
  `from` VARCHAR(20) NOT NULL,
  `to` VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('text', 'image', 'document', 'audio', 'video') DEFAULT 'text',
  status ENUM('pending', 'sent', 'delivered', 'read', 'failed', 'received') DEFAULT 'pending',
  mediaUrl VARCHAR(500),
  retryCount INT DEFAULT 0,
  errorMessage TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_from (`from`),
  INDEX idx_to (`to`),
  INDEX idx_status (status),
  INDEX idx_created (createdAt)
);