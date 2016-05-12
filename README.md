# tcpdump-visualizer


## Openwrt (Optional)

Install `socat`, `stdbuf`, `tcpdump`, `grep (with regex)` with `opkg install` / `make menuconfig`.

Copy `dump.sh` to whereever you wish, `chown` it with exec (or put it to `/etc/init.d` if you dare.

*Ensure ip of the box is `192.168.1.1`*

Start `sh dump.sh`.

Connect to openwrt's LAN network on your node / chrome machine.

--------------------------------

## Without Openwrt? Simulator Mode?

__Click the 'Emit Fake Packet' on your webpage later on.__

--------------------------------

## Viewer

run `npm install` to fetch missing packages, 

do `node index.js`, open chrome (with GPU / WebGL enabled) `http://localhost:3000`

& enjoy :p


__Bugz' guaranteed (TM)__ 
