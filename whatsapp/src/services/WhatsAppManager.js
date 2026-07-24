const Company = require('../models/Company');
const logger = require('../utils/logger');
const WhatsAppService = require('./WhatsAppService');

class WhatsAppManager {
  constructor(io) {
    this.io = io;
    this.services = new Map(); // Mapa de companyId -> WhatsAppService
  }

  /**
   * Inicializa las conexiones para todas las empresas activas
   */
  async initializeAllActiveCompanies() {
    try {
      logger.info('Inicializando conexiones para todas las empresas activas...');
      const activeCompanies = await Company.findAll({ where: { isActive: true } });
      
      for (const company of activeCompanies) {
        await this.startCompany(company.id);
      }
      
      logger.info(`✅ ${this.services.size} empresas conectadas/inicializadas.`);
    } catch (error) {
      logger.error('Error inicializando WhatsAppManager:', error);

      throw error;
    }
  }

  /**
   * Obtiene el servicio de WhatsApp para una empresa específica
   */
  getService(companyId) {
    if (!companyId) {
return null;
}

    return this.services.get(companyId.toString());
  }

  /**
   * Inicializa o reinicia el servicio de una empresa
   */
  async startCompany(companyId) {
    try {
      companyId = companyId.toString();
      logger.whatsapp(`Iniciando servicio para empresa ID: ${companyId}`);
      
      // Si ya existe y está conectado, no hacer nada o forzar reconexión dependiendo de la necesidad
      if (this.services.has(companyId)) {
        logger.whatsapp(`Empresa ID ${companyId} ya tiene un servicio instanciado.`);
        const service = this.services.get(companyId);

        if (!service.isConnected) {
            await service.connect();
        }

        return service;
      }
      
      // Crear nueva instancia de WhatsAppService
      const service = new WhatsAppService(this.io, companyId);
      this.services.set(companyId, service);
      
      // Inicializar (creará carpetas y conectará)
      await service.initialize();
      
      return service;
    } catch (error) {
      logger.error(`Error al iniciar servicio para empresa ${companyId}:`, error);

      throw error;
    }
  }

  /**
   * Detiene el servicio de una empresa
   */
  async stopCompany(companyId) {
    try {
      companyId = companyId.toString();

      if (this.services.has(companyId)) {
        const service = this.services.get(companyId);
        await service.shutdown();
        this.services.delete(companyId);
        logger.whatsapp(`Servicio para empresa ID ${companyId} detenido y removido del manager.`);
      }
    } catch (error) {
      logger.error(`Error al detener servicio para empresa ${companyId}:`, error);
    }
  }

  /**
   * Cierra todos los servicios (útil para un graceful shutdown)
   */
  async shutdownAll() {
    logger.whatsapp('Deteniendo todos los servicios de WhatsApp...');

    for (const [companyId, service] of this.services.entries()) {
      await service.shutdown();
    }

    this.services.clear();
    logger.whatsapp('Todos los servicios han sido detenidos.');
  }
}

module.exports = WhatsAppManager;
