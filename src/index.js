import PhoneCore from './core/phone-core.js';
import WebRtcAdapter from './adapters/webrtc.js';

/** Facade */
export default class Phone extends PhoneCore {
  constructor(options = {}) {
    super(options);
    // Pass signalingUrl and rtcConfig to the adapter
    this.registerAdapter('webrtc', WebRtcAdapter, {
      signalingUrl: options.signalingUrl,
      rtcConfig: options.rtcConfig,
      clientId: options.clientId,
    });
  }
}
