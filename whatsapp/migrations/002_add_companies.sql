-- Companies Table
CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  apiKey VARCHAR(255) UNIQUE NOT NULL,
  webhookUrl VARCHAR(500),
  rateLimitPerMinute INT DEFAULT 60,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add company_id to existing tables
ALTER TABLE whatsapp_messages ADD COLUMN companyId INT NOT NULL DEFAULT 1;
ALTER TABLE whatsapp_sessions ADD COLUMN companyId INT NOT NULL DEFAULT 1;

-- Add foreign key constraints
ALTER TABLE whatsapp_messages ADD CONSTRAINT fk_messages_company 
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE whatsapp_sessions ADD CONSTRAINT fk_sessions_company 
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE;

-- Insert default company
INSERT INTO companies (name, apiKey, rateLimitPerMinute, isActive) 
VALUES ('Default Company', 'default_api_key_123', 60, TRUE)
ON DUPLICATE KEY UPDATE name = name;