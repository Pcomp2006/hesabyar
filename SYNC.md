# CluDari Multi-Device Sync

## Idea
One PC runs the server. Everyone else uses a browser.
All share the SAME database on the server PC.

```
[ Server PC ]  run-server.bat
      |
      +-- browser on same PC
      +-- laptop on Wi-Fi
      +-- phone on Wi-Fi
```

## Setup
1. On the main PC, run: `run-server.bat`
2. Note the LAN address printed, e.g. http://192.168.1.25:8000
3. On other devices open that URL in Chrome/Safari
4. Login with the SAME user (e.g. root / root)

## Important
- Closing the server PC stops access for everyone
- Different usernames = different databases (not shared)
- Windows Firewall must allow Python on Private network
- Outside home network needs VPN/Tailscale (Cloudflare Tunnel often blocked in Iran)

## Config
Edit `cludari_server.ini`:
```
host=0.0.0.0
port=8000
mode=server
```


See REMOTE-ACCESS.txt for outside-home + autostart.
