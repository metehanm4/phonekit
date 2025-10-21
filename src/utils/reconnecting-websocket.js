/**
 * ReconnectingWebSocket utility for automatic reconnection.
 * Modern ES6 class, event-based, and project logger compatible.
 */

export default class ReconnectingWebSocket {
  /**
   * @param {string} url - WebSocket server URL
   * @param {object} [options]
   * @param {object} [options.logger] - Logger instance (must have info, warn, error)
   * @param {boolean} [options.debug=false]
   * @param {boolean} [options.automaticOpen=true]
   * @param {number} [options.reconnectInterval=1000]
   * @param {number} [options.reconnectDecay=1.5]
   * @param {number} [options.maxReconnectInterval=30000]
   * @param {string} [options.binaryType='blob']
   * @param {string[]} [options.protocols=[]]
   * @param {number|null} [options.maxReconnectAttempts=null]
   */
  constructor(url, options = {}) {
    this.url = url;
    this.protocols = options.protocols || [];
    this.logger = options.logger || console;
    this.debug = !!options.debug;
    this.automaticOpen = options.automaticOpen !== false;
    this.reconnectInterval = options.reconnectInterval || 1000;
    this.reconnectDecay = options.reconnectDecay || 1.5;
    this.maxReconnectInterval = options.maxReconnectInterval || 30000;
    this.binaryType = options.binaryType || 'blob';
    this.maxReconnectAttempts = options.maxReconnectAttempts || null;

    this.reconnectAttempts = 0;
    this.forcedClose = false;
    this.timedOut = false;
    this.ws = null;

    // Event listeners
    this.listeners = {
      open: [],
      close: [],
      message: [],
      error: [],
      reconnect: [],
    };

    if (this.automaticOpen) {
      this.open(false);
    }
  }

  open(reconnectAttempt) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.ws = this.protocols.length
      ? new WebSocket(this.url, this.protocols)
      : new WebSocket(this.url);

    this.ws.binaryType = this.binaryType;

    this.ws.onopen = (event) => {
      this.logger.info('WebSocket connected:', this.url);
      this.reconnectAttempts = 0;
      this.emit('open', event);
    };

    this.ws.onclose = (event) => {
      this.logger.warn('WebSocket closed:', event);
      this.ws = null;
      this.emit('close', event);

      if (this.forcedClose) {
        return;
      }

      let timeout = this.reconnectInterval * Math.pow(this.reconnectDecay, this.reconnectAttempts);
      if (timeout > this.maxReconnectInterval) {
        timeout = this.maxReconnectInterval;
      }
      if (this.maxReconnectAttempts && this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.logger.error('Max reconnect attempts reached');
        return;
      }
      this.reconnectAttempts++;
      this.logger.info(`Reconnecting in ${timeout} ms...`);
      this.emit('reconnect', { attempt: this.reconnectAttempts, timeout });
      setTimeout(() => this.open(true), timeout);
    };

    this.ws.onmessage = (event) => {
      this.emit('message', event);
    };

    this.ws.onerror = (event) => {
      this.logger.error('WebSocket error:', event);
      this.emit('error', event);
    };
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
      if (this.debug) this.logger.info('WebSocket sent:', data);
      return true;
    }
    this.logger.warn('WebSocket not connected, message not sent');
    return false;
  }

  close(code = 1000, reason = 'Normal closure') {
    this.forcedClose = true;
    if (this.ws) {
      this.ws.close(code, reason);
    }
  }

  refresh() {
    if (this.ws) {
      this.ws.close();
    }
  }

  // Event system
  on(event, fn) {
    if (this.listeners[event]) {
      this.listeners[event].push(fn);
    }
  }

  off(event, fn) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(listener => listener !== fn);
    }
  }

  emit(event, ...args) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(fn => fn(...args));
    }
  }

  get readyState() {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED;
  }
}
