import AdapterBase from './adapter-base.js';
import Logger from '../logging/logger.js';

/** Core shell to be extended by Phone. */
export default class PhoneCore {
  constructor(options = {}) {
    // Central logger instance
    this.log = options.log || new Logger(options.logLevel || 'info', options.logMode || 'human');
    this.adapters = new Map();
  }

  /**
   * Registers an adapter by name and ensures logger is passed to it.
   * @param {string} name
   * @param {class} AdapterCtor
   * @param {object} [options]
   */
  registerAdapter(name, AdapterCtor, options = {}) {
    // Merge logger into adapter options
    const adapterOptions = { ...options, log: this.log };
    const adapter = new AdapterCtor(adapterOptions);
    if (!(adapter instanceof AdapterBase)) {
      throw new Error('Adapter must extend AdapterBase');
    }
    this.adapters.set(name, adapter);
    this.log.info(`Adapter registered: ${name}`);
  }
}
