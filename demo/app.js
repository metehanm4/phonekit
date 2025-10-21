import Phone from '../src/index.js';

const logEl = document.getElementById('log');
function log(...args) {
  logEl.textContent += args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ') + '\n';
  logEl.scrollTop = logEl.scrollHeight;
}

const SIGNALING_URL = 'ws://localhost:8080';

let phone = null;
let registered = false;
let localStream = null;
let remoteStream = null;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

document.getElementById('registerBtn').onclick = async () => {
  const clientId = document.getElementById('clientId').value.trim();
  if (!clientId) {
    log('Please enter a Client ID.');
    return;
  }
  phone = new Phone({
    logLevel: 'debug',
    logMode: 'human',
    signalingUrl: SIGNALING_URL,
    rtcConfig: {},
    clientId
  });
  window.phone = phone;
  if (phone.adapters.has('webrtc')) {
    await phone.adapters.get('webrtc').connect();
    // Attach local/remote stream handlers
    phone.adapters.get('webrtc').onLocalStream = (stream) => {
      localStream = stream;
      localVideo.srcObject = stream;
      log('Local stream attached.');
    };
    phone.adapters.get('webrtc').onRemoteStream = (stream) => {
      remoteStream = stream;
      remoteVideo.srcObject = stream;
      log('Remote stream attached.');
    };
    log('Registered as', clientId);
    registered = true;
  } else {
    log('WebRTC adapter not found.');
  }
};

document.getElementById('callBtn').onclick = async () => {
  if (!registered || !phone) {
    log('Please register with a Client ID first.');
    return;
  }
  const target = document.getElementById('target').value.trim();
  const caller = document.getElementById('clientId').value.trim();
  if (!target) {
    log('Please enter a target.');
    return;
  }
  if (!phone.adapters.has('webrtc')) {
    log('WebRTC adapter not found.');
    return;
  }
  await phone.adapters.get('webrtc').call(target, { caller });
  log('Call started to', target);
};

document.getElementById('hangupBtn').onclick = async () => {
  if (!registered || !phone) {
    log('Please register first.');
    return;
  }
  if (phone.adapters.has('webrtc')) {
    await phone.adapters.get('webrtc').hangup();
    log('Call ended.');
    if (localVideo) localVideo.srcObject = null;
    if (remoteVideo) remoteVideo.srcObject = null;
  }
};

document.getElementById('muteBtn').onclick = () => {
  if (localStream) {
    localStream.getAudioTracks().forEach(track => track.enabled = false);
    log('Microphone muted.');
  }
};

document.getElementById('unmuteBtn').onclick = () => {
  if (localStream) {
    localStream.getAudioTracks().forEach(track => track.enabled = true);
    log('Microphone unmuted.');
  }
};


