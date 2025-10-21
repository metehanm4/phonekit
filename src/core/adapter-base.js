export default class AdapterBase {
  constructor(options = {}) {
    this.log = options.log || { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} };
  }
  async connect() { throw new Error('connect() not implemented'); }
  async call(target) { throw new Error('call() not implemented'); }
  async hangup() { throw new Error('hangup() not implemented'); }
}