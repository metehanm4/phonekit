import AdapterBase from '../core/adapter-base.js';
import ReconnectingWebSocket from '../utils/reconnecting-websocket.js';

/** WebRTC adapter with signaling */
export default class WebRtcAdapter extends AdapterBase {
  constructor(options = {}) {
    super(options);
    this.clientId = options.clientId || 'client1'; // fallback
    this.signalingUrl = options.signalingUrl;
    this.rtcConfig = options.rtcConfig || {};
    this.mediaConstraints = options.mediaConstraints || { audio: true, video: true };
    this.ws = null; // WebSocket for signaling
    this.pc = null; // RTCPeerConnection instance
    this.localStream = null;
  }

  async connect() {
    this.log.info('WebRtcAdapter: connect() called');
    // Initialize signaling WebSocket
    if (!this.ws && this.signalingUrl) {
      this.ws = new ReconnectingWebSocket(this.signalingUrl, { logger: this.log });
      this.ws.on('open', () => {
        this.log.info('Signaling WebSocket connected');
        // Register this client
        this.ws.send(JSON.stringify({ type: 'register', id: this.clientId }));
      });
      this.ws.on('message', (event) => this.handleSignal(event));
      this.ws.on('close', () => this.log.warn('Signaling WebSocket closed'));
      this.ws.on('error', (e) => this.log.error('Signaling WebSocket error', e));
    }
    // Create RTCPeerConnection
    this.pc = new RTCPeerConnection(this.rtcConfig);
    this._setupOnTrack();
    this.pc.onicecandidate = (event) => {
      if (event.candidate && this.ws) {
        this.ws.send(JSON.stringify({
          type: 'candidate',
          candidate: event.candidate,
          target: this.lastTarget 
        }));
      }
    };
    this.pc.onconnectionstatechange = () => {
      this.log.info('Connection state:', this.pc.connectionState);
    };
    this.log.info('RTCPeerConnection created');
  }

  async call(target, options = {}) {
    this.log.info('WebRtcAdapter: call() called, target:', target);
    try {
      await this._getUserMedia();
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      this.log.info('Offer created and set as local description');
      if (this.ws) {
        this.ws.send(JSON.stringify({
          type: 'offer',
          sdp: offer.sdp,
          target,
          caller: options.caller || this.clientId
        }));
      }
      // Attach remote stream handler
      this._setupOnTrack();
    } catch (err) {
      this.log.error('Error in call():', err);
    }
  }

  async handleSignal(event) {
    let msg;
    try {
      msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    } catch (e) {
      this.log.warn('Invalid signaling message', event.data);
      return;
    }
    if (msg.type === 'offer') {
      if (this.pc.signalingState !== 'stable') {
        this.log.warn('Received offer in non-stable state, ignoring.');
        return;
      }
      // Attach remote stream handler
      this._setupOnTrack();
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
      this.localStream.getTracks().forEach(track => this.pc.addTrack(track, this.localStream));
      if (this.onLocalStream) this.onLocalStream(this.localStream);

      await this.pc.setRemoteDescription({ type: 'offer', sdp: msg.sdp });
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      if (this.ws) {
        this.ws.send(JSON.stringify({ type: 'answer', sdp: answer.sdp, target: msg.target }));
      }
    } else if (msg.type === 'answer') {
      if (this.pc.signalingState !== 'have-local-offer') {
        this.log.warn('Received answer in wrong state, ignoring.');
        return;
      }
      await this.pc.setRemoteDescription({ type: 'answer', sdp: msg.sdp });
    } else if (msg.type === 'candidate') {
      await this.pc.addIceCandidate(msg.candidate);
    }
  }

  async hangup() {
    this.log.info('WebRtcAdapter: hangup() called');
    if (this.pc) {
      this.pc.getSenders().forEach(sender => sender.track && sender.track.stop());
      this.pc.close();
      this.pc = null;
      this.log.info('Peer connection closed');
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
      this.log.info('Local media stream stopped');
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.log.info('Signaling WebSocket closed');
    }
  }

  async _getUserMedia() {
    const constraints = this.mediaConstraints || { audio: false, video: true };
    this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
    this.localStream.getTracks().forEach(track => this.pc.addTrack(track, this.localStream));
    if (this.onLocalStream) this.onLocalStream(this.localStream);
  }

  _setupOnTrack() {
    this.pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (this.onRemoteStream && remoteStream) {
        this.onRemoteStream(remoteStream);
      }
    };
  }
}