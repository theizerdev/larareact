const WhatsAppService = require('../services/WhatsAppService');
const Message = require('../models/Message');
const Session = require('../models/Session');
const logger = require('../utils/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const antiBlockProtection = require('../middleware/antiBlockProtection');
const Consent = require('../models/Consent');

class WhatsAppController {
  async getStatus(req, res) {
    try {
      // Acceder al administrador multi-empresa y obtener servicio de esta empresa
      const whatsappManager = req.app.locals.whatsappManager;
      const whatsappService = whatsappManager ? whatsappManager.getService(req.company.id) : null;
      
      if (!whatsappService) {
        return res.status(500).json({ 
          success: false, 
          error: 'WhatsApp service not initialized',
          company: req.company.name
        });
      }
      
      const status = whatsappService.getStatus();
      res.json({ success: true, ...status, company: req.company.name });
    } catch (error) {
      logger.error('Error getting status:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async connect(req, res) {
    try {
      const whatsappManager = req.app.locals.whatsappManager;
      let whatsappService = whatsappManager ? whatsappManager.getService(req.company.id) : null;
      
      if (!whatsappService && whatsappManager) {
        whatsappService = await whatsappManager.startCompany(req.company.id);
      }
      if (!whatsappService) {
        return res.status(500).json({ 
          success: false, 
          error: 'WhatsApp service not initialized' 
        });
      }

      await whatsappService.connect();
      res.json({ 
        success: true, 
        company: req.company.name,
        message: 'Connection initiated'
      });
    } catch (error) {
      logger.error('Error connecting:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async disconnect(req, res) {
    try {
      const whatsappManager = req.app.locals.whatsappManager;
      const whatsappService = whatsappManager ? whatsappManager.getService(req.company.id) : null;
      
      if (!whatsappService) {
        return res.status(500).json({ 
          success: false, 
          error: 'WhatsApp service not initialized' 
        });
      }

      await whatsappService.logout();
      res.json({ success: true, message: 'Disconnected successfully' });
    } catch (error) {
      logger.error('Error disconnecting:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async forceReconnect(req, res) {
    try {
      const whatsappManager = req.app.locals.whatsappManager;
      let whatsappService = whatsappManager ? whatsappManager.getService(req.company.id) : null;
      
      if (!whatsappService && whatsappManager) {
        whatsappService = await whatsappManager.startCompany(req.company.id);
      }
      if (!whatsappService) {
        return res.status(500).json({ 
          success: false, 
          error: 'WhatsApp service not initialized' 
        });
      }

      await whatsappService.forceReconnect();
      res.json({ 
        success: true, 
        company: req.company.name,
        message: 'Force reconnection initiated'
      });
    } catch (error) {
      logger.error('Error forcing reconnection:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getQRCode(req, res) {
    try {
      // Acceder al administrador multi-empresa
      const whatsappManager = req.app.locals.whatsappManager;
      const whatsappService = whatsappManager ? whatsappManager.getService(req.company.id) : null;
      
      if (!whatsappService) {
        return res.status(500).json({ 
          success: false, 
          error: 'WhatsApp service not initialized',
          company: req.company.name
        });
      }
      
      const status = whatsappService.getStatus();
      const qr = status.qrCode;
      
      if (qr) {
        res.json({ 
          success: true, 
          qr, 
          company: req.company.name,
          message: 'QR code available'
        });
      } else {
        res.json({ 
          success: false, 
          error: 'QR code not available. Connection status: ' + status.connectionState,
          company: req.company.name,
          connectionState: status.connectionState
        });
      }
    } catch (error) {
      logger.error('Error getting QR code:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async sendMessage(req, res) {
    try {
      const { to, message, type = 'text', mediaUrl } = req.body;
      const whatsappManager = req.app.locals.whatsappManager;
      const whatsappService = whatsappManager ? whatsappManager.getService(req.company.id) : null;
      const metrics = req.app.locals.metrics;
      const countryCode = (req.headers['x-country-code'] || '').replace(/\D/g, '') || undefined;
      
      if (!whatsappService) {
        return res.status(500).json({ 
          success: false, 
          error: 'WhatsApp service not initialized' 
        });
      }

      // Opt-in / 24-hour window validation
      const { isWelcome = false } = req.body;
      const phoneDigits = (to || '').replace(/\D/g, '');
      try {
        const consent = await Consent.findOne({
          where: { companyId: req.company.company_id, phone: phoneDigits }
        });
        
        // Bloquear si no hay consentimiento explícito, a menos que sea un mensaje de Bienvenida (isWelcome)
        if (!isWelcome && (!consent || !consent.optedIn)) {
          return res.status(403).json({
            success: false,
            error: 'Usuario sin opt-in: no se permite enviar mensajes no solicitados. El cliente debe escribir primero.',
            code: 'CONSENT_REQUIRED',
            company: req.company.name
          });
        }

        // Lógica de 24 horas
        const lastInboundMessage = await Message.findOne({
          where: { 
            companyId: req.company.company_id,
            from: { [require('sequelize').Op.like]: `%${phoneDigits}%` } 
          },
          order: [['createdAt', 'DESC']]
        });

        if (!isWelcome) {
          if (lastInboundMessage) {
            const hoursSinceLastMessage = (Date.now() - new Date(lastInboundMessage.createdAt).getTime()) / (1000 * 60 * 60);
            if (hoursSinceLastMessage > 24 && type === 'text') {
              return res.status(403).json({
                success: false,
                error: 'Ventana de 24 horas expirada. El último mensaje fue hace más de 24h. No se permite texto libre.',
                code: 'WINDOW_24H_EXPIRED',
                company: req.company.name
              });
            }
          } else {
            // Si nunca hemos recibido un mensaje y se fuerza texto libre
            if (type === 'text') {
               return res.status(403).json({
                success: false,
                error: 'Ventana de 24 horas inactiva. No hay mensajes previos del usuario.',
                code: 'WINDOW_24H_EXPIRED',
                company: req.company.name
              });
            }
          }
        }

      } catch (err) {
        logger.warn('Validation check failed', { error: err.message, companyId: req.company.company_id, phone: phoneDigits });
      }

      // 🔒 PROTECCIÓN ANTI-BLOQUEO CRÍTICA
      try {
        // Formatear a JID antes de validar anti-block (espera *@s.whatsapp.net)
        const jidForValidation = whatsappService.formatPhoneNumber(to, { countryCode });
        await antiBlockProtection.protectMessage(
          req.company.id, 
          jidForValidation, 
          message,
          req.company.dailyMessageLimit
        );
      } catch (protectionError) {
        logger.warn(`Message blocked by anti-block protection: ${protectionError.message}`, {
          companyId: req.company.id,
          companyName: req.company.name,
          to,
          reason: protectionError.message
        });
        try { metrics?.messagesFailed?.inc({ company_id: req.company.company_id, company_name: req.company.name }); } catch (_) {}
        
        return res.status(429).json({ 
          success: false, 
          error: protectionError.message,
          code: 'ANTI_BLOCK_PROTECTION',
          company: req.company.name
        });
      }

      const result = await whatsappService.sendMessage(to, message, {
        type,
        mediaUrl,
        companyId: req.company.company_id,
        countryCode,
        metrics
      });

      try { metrics?.messagesSent?.inc({ company_id: req.company.company_id, company_name: req.company.name }); } catch (_) {}
      res.json({ 
        success: true, 
        messageId: result.messageId, 
        company: req.company.name,
        antiBlock: {
          protected: true,
          message: 'Mensaje validado y protegido contra bloqueo'
        }
      });
    } catch (error) {
      logger.error('Error sending message:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getStats(req, res) {
    try {
      const companyId = req.company.company_id;
      
      const total = await Message.count({ where: { companyId } });
      const sent = await Message.count({ where: { companyId, status: 'sent' } });
      const delivered = await Message.count({ where: { companyId, status: ['delivered', 'read'] } });
      const received = await Message.count({ where: { companyId, status: 'received' } });
      const failed = await Message.count({ where: { companyId, status: 'failed' } });
      const pending = await Message.count({ where: { companyId, status: 'pending' } });
      
      // Get today's messages
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const Op = require('sequelize').Op;
      const todayCount = await Message.count({
        where: {
          companyId,
          createdAt: {
            [Op.gte]: today
          },
          status: ['sent', 'delivered', 'read', 'received']
        }
      });

      res.json({
        success: true,
        stats: {
          total,
          sent,
          delivered,
          received,
          failed,
          pending,
          today: todayCount
        },
        company: req.company.name
      });
    } catch (error) {
      logger.error('Error getting stats:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getMessages(req, res) {
    try {
      const { page = 1, limit = 50, status, from, to } = req.query;
      const where = { companyId: req.company.company_id };
      
      if (status) where.status = status;
      if (from) where.from = from;
      if (to) where.to = to;

      const messages = await Message.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        messages: messages.rows,
        total: messages.count,
        page: parseInt(page),
        totalPages: Math.ceil(messages.count / parseInt(limit)),
        company: req.company.name
      });
    } catch (error) {
      logger.error('Error getting messages:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async sendDocument(req, res) {
    try {
      const { to, message, caption = '' } = req.body;
      const whatsappManager = req.app.locals.whatsappManager;
      const whatsappService = whatsappManager ? whatsappManager.getService(req.company.id) : null;
      
      if (!whatsappService) {
        return res.status(500).json({ 
          success: false, 
          error: 'WhatsApp service not initialized' 
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: 'No file uploaded' 
        });
      }

      if (!to) {
        return res.status(400).json({ 
          success: false, 
          error: 'Recipient phone number is required' 
        });
      }

      // Leer el archivo subido
      const fileBuffer = await fs.readFile(req.file.path);
      const fileName = req.file.originalname;
      const mimeType = req.file.mimetype;

      // Preparar el contenido del documento para Baileys
      const documentContent = {
        document: fileBuffer,
        mimetype: mimeType,
        fileName: fileName,
        caption: caption || message || ''
      };

      // Enviar el documento usando el servicio WhatsApp
      const result = await whatsappService.sendMessage(to, documentContent, {
        type: 'document',
        companyId: req.company.company_id
      });

      // Limpiar el archivo temporal
      await fs.unlink(req.file.path).catch(err => {
        logger.warn('Error deleting temporary file:', err);
      });

      res.json({ 
        success: true, 
        messageId: result.messageId, 
        company: req.company.name,
        fileName: fileName
      });
    } catch (error) {
      logger.error('Error sending document:', error);
      
      // Limpiar el archivo temporal en caso de error
      if (req.file && req.file.path) {
        await fs.unlink(req.file.path).catch(err => {
          logger.warn('Error deleting temporary file after error:', err);
        });
      }
      
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async sendInteractive(req, res) {
    try {
      const { to, body, buttons } = req.body;
      const whatsappManager = req.app.locals.whatsappManager;
      const whatsappService = whatsappManager ? whatsappManager.getService(req.company.id) : null;
      
      if (!whatsappService) {
        return res.status(500).json({ success: false, error: 'WhatsApp service not initialized' });
      }

      // Transformar botones interactivos a un menú de texto plano (Anti-Ban)
      let textMessage = body + '\n\n*Opciones disponibles:*\n';
      buttons.forEach((btn, index) => {
        // En Baileys, los botones nativos causan ban, por eso usamos fallback a texto
        textMessage += `${index + 1}️⃣ ${btn.reply?.title || btn.title}\n`;
      });
      textMessage += '\nPor favor, responde con el número de la opción deseada.';

      // Utilizar la misma lógica de sendMessage para el envío seguro
      req.body.message = textMessage;
      req.body.type = 'text';
      
      return this.sendMessage(req, res);
    } catch (error) {
      logger.error('Error in sendInteractive fallback:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async sendTemplate(req, res) {
    try {
      const { to, template_name, components } = req.body;
      const whatsappManager = req.app.locals.whatsappManager;
      const whatsappService = whatsappManager ? whatsappManager.getService(req.company.id) : null;
      
      if (!whatsappService) {
        return res.status(500).json({ success: false, error: 'WhatsApp service not initialized' });
      }

      // Como usamos Baileys, simularemos las plantillas usando texto libre estructurado
      let textMessage = `[Plantilla: ${template_name}]\n`;
      if (components && components.length > 0) {
        components.forEach(comp => {
          if (comp.parameters) {
            comp.parameters.forEach(param => {
              if (param.type === 'text') textMessage += `${param.text} `;
            });
          }
        });
      }

      // Utilizar la misma lógica de sendMessage
      req.body.message = textMessage.trim();
      req.body.type = 'text';
      
      // NOTA: Para Baileys, no se requiere evadir la regla de las 24 horas como en Cloud API
      // pero usaremos sendMessage que internamente respetará la lógica anti-spam
      return this.sendMessage(req, res);
    } catch (error) {
      logger.error('Error in sendTemplate fallback:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

// Configuración de multer para manejar la subida de archivos
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../temp');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 16 * 1024 * 1024 // 16MB límite
  },
  fileFilter: (req, file, cb) => {
    // Permitir archivos de Excel y otros documentos comunes
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Use Excel, PDF, Word o archivos de texto.'), false);
    }
  }
});

// Exportar el controlador y el middleware de upload
const controller = new WhatsAppController();
controller.upload = upload;

module.exports = controller;