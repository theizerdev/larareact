let redis;
try {
  redis = require('../config/redis');
} catch (error) {
  redis = null;
}
const logger = require('../utils/logger');

class QueueService {
  constructor() {
    this.queueKey = 'whatsapp:message_queue';
    this.processingKey = 'whatsapp:processing';
    this.isProcessing = false;
    this.whatsappManager = null;
    this.memoryQueue = [];
  }

  setWhatsAppManager(whatsappManager) {
    this.whatsappManager = whatsappManager;
  }

  async addMessage(messageData) {
    try {
      const message = {
        id: Date.now().toString(),
        ...messageData,
        timestamp: new Date().toISOString(),
        retries: 0
      };

      if (redis) {
        await redis.lPush(this.queueKey, JSON.stringify(message));
        logger.info(`Message queued: ${message.id}`);
        
        if (!this.isProcessing) {
          this.processQueue();
        }
      } else {
        // Fallback a memoria
        this.memoryQueue.push(message);
        logger.warn('Redis not available, processing message from memory queue');
        await this.processMessage(this.memoryQueue.shift());
      }
      
      return message.id;
    } catch (error) {
      logger.error('Error adding message to queue:', error);
      throw error;
    }
  }

  async processQueue() {
    if (this.isProcessing || !redis) return;
    
    this.isProcessing = true;
    logger.info('Starting queue processing');

    try {
      while (true) {
        const messageStr = await redis.brPop(redis.commandOptions({ isolated: true }), this.queueKey, 5);
        if (!messageStr) break;

        const message = JSON.parse(messageStr.element);
        await this.processMessage(message);
        
        // Pacing y Jitter: Retraso aleatorio entre 4 y 10 segundos
        const jitterMs = Math.floor(Math.random() * (10000 - 4000 + 1)) + 4000;
        logger.info(`Aplicando jitter (retraso anti-ban) de ${jitterMs}ms antes del próximo mensaje...`);
        await new Promise(resolve => setTimeout(resolve, jitterMs));
      }
    } catch (error) {
      logger.error('Queue processing error:', error);
    } finally {
      this.isProcessing = false;
      logger.info('Queue processing stopped');
    }
  }

  async processMessage(message) {
    try {
      if (!this.whatsappManager) {
        throw new Error('WhatsAppManager instance not set in QueueService');
      }
      const companyId = message.companyId || 1;
      const service = this.whatsappManager.getService(companyId);
      if (!service) {
        throw new Error(`WhatsAppService not found for company ${companyId}`);
      }
      await service.sendMessage(message.to, message.content, {
        type: message.type || 'text',
        companyId: companyId
      });
      logger.info(`Message processed: ${message.id}`);
    } catch (error) {
      logger.error(`Failed to process message ${message.id}:`, error);
      
      if (message.retries < 3 && redis) {
        message.retries++;
        await redis.lPush(this.queueKey, JSON.stringify(message));
        logger.info(`Message requeued: ${message.id}, retry: ${message.retries}`);
      } else {
        logger.error(`Message failed permanently: ${message.id}`);
      }
    }
  }

  async getQueueSize() {
    if (redis) return await redis.lLen(this.queueKey);
    return this.memoryQueue.length;
  }
}

module.exports = new QueueService();
