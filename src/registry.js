import WebRtc from './adapters/webrtc.js';
import Janus from './adapters/janus.js';
import Mediasoup from './adapters/mediasoup.js';
import JsSIP from './adapters/sip-jssip.js';

/* global ADAPTERS */
export function registerSelectedAdapters(phone){
  if (typeof ADAPTERS !== 'undefined') {
    if (ADAPTERS.WEBRTC)   phone.registerAdapter('webrtc',   WebRtc);
    if (ADAPTERS.JANUS)    phone.registerAdapter('janus',    Janus);
    if (ADAPTERS.MEDIASOUP)phone.registerAdapter('mediasoup',Mediasoup);
    if (ADAPTERS.SIP)      phone.registerAdapter('sip',      JsSIP);
  } else {
    phone.registerAdapter('webrtc', WebRtc);
  }
}
