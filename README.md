# osphone-skeleton

See package scripts. Demo serves from /demo, imports from /src.
unzip osphone-skeleton.zip
cd osphone-skeleton
npm i
npm run dev          # demo http://localhost:3000
npm run jsdoc        # /docs içine jsdoc üretir
npm run build:webrtc # dist/phone.(umd|esm).js (sadece webrtc adapter)
npm run build:sfu    # webrtc+janus+mediasoup
npm run build:all    # webrtc+janus+mediasoup+sip
