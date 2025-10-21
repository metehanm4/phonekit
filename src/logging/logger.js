/* global __DEV__, __LOG_MODE__ */

/**
 * Console-like logger with levels + two modes:
 *  - dev: human-readable + callsite (trace)
 *  - prod: JSON (parsable), no callsite
 */
class Logger {
  constructor(level = 'info', mode) {
    this.level = level;
    this._levels = ['trace', 'debug', 'info', 'warn', 'error'];
    // Default from build-time flags, runtime override allowed
    this.mode = mode || (typeof __LOG_MODE__ !== 'undefined' ? __LOG_MODE__ : 'human');
    this.isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;
  }

  _canLog(l) {
    return this._levels.indexOf(l) >= this._levels.indexOf(this.level);
  }

  _emit(level, parts) {
    const ts = new Date().toISOString();

    if (this.mode === 'json') {
      // Production-friendly JSON logging
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({
        ts,
        level,
        message: parts.map(String).join(' ')
      }));
      return;
    }

    // Human-readable mode
    const header = `[${ts}] [${level.toUpperCase()}]`;

    if (this.isDev) {
      // Group logs and show clickable callsite
      // eslint-disable-next-line no-console
      console.groupCollapsed(header, ...parts);
      // eslint-disable-next-line no-console
      console.trace();
      // eslint-disable-next-line no-console
      console.groupEnd();
    } else {
      const fn = level === 'warn'
        ? 'warn'
        : level === 'error'
          ? 'error'
          : level === 'debug'
            ? 'debug'
            : 'log';
      // eslint-disable-next-line no-console
      console[fn](header, ...parts);
    }
  }

  trace(...a) { if (this._canLog('trace')) this._emit('trace', a); }
  debug(...a) { if (this._canLog('debug')) this._emit('debug', a); }
  info(...a) { if (this._canLog('info')) this._emit('info', a); }
  warn(...a) { if (this._canLog('warn')) this._emit('warn', a); }
  error(...a) { if (this._canLog('error')) this._emit('error', a); }
}

export default Logger;
