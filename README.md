# aortic edu

a minimalist educational website for aortic edu (haider's science labs).

- haider's photo sits in the top-right of the navbar (click it to jump to contact), a hero with the newest video, five playlist cards, an automatic "latest videos" section, and social links in the footer
- every video and playlist is a thumbnail card that opens **directly on youtube** in a new tab. there are no embedded players.
- **no youtube api key.** a tiny node server reads youtube's public rss feeds, caches them for 15 minutes and refreshes on a timer. new uploads show up by themselves.
- react + vite + typescript. plain css, no animation libraries. respects "reduce motion".

---

## install on your vps (the easy way)

you need a fresh **ubuntu or debian** server and its ip address. you log in with `ssh` (your hosting provider shows the login details).

### option a: upload the zip (no github needed)

1. on your own computer, upload the zip to the server (replace `YOUR_SERVER_IP`):

   ```
   scp aortic-edu.zip root@YOUR_SERVER_IP:/root/
   ```

2. log in to the server:

   ```
   ssh root@YOUR_SERVER_IP
   ```

3. paste this **one command** and wait a few minutes:

   ```
   apt-get update -y && apt-get install -y unzip && unzip -o aortic-edu.zip && cd aortic-edu && bash install.sh
   ```

### option b: from github

push this folder to a github repository, then on the server paste (replace `USER/REPO`):

```
curl -fsSL https://raw.githubusercontent.com/USER/REPO/main/install.sh | sudo REPO_URL=https://github.com/USER/REPO.git bash
```

(for a private repository, clone it first with a token and run `bash install.sh` inside it.)

### open the website

when the installer finishes it prints an address like `http://123.45.67.89`. open it in your browser. that's it.

---

## update the website

- **from github:** `sudo bash /opt/aortic-edu/update.sh`
- **from a zip:** upload the new zip, unzip it, and run `bash install.sh` again. it's safe to repeat.

new youtube videos do **not** need an update. they appear automatically.

## change text, links or playlists

everything editable is in `shared/site.json`: the intro text, playlist ids, and every social link. edit it, then run the update step above.

## connect a domain (optional)

1. at your domain provider, create two **a records** pointing to your server's ip: one for `yourdomain.com`, one for `www`. wait a few minutes.
2. on the server:

   ```
   sudo bash /opt/aortic-edu/setup-domain.sh yourdomain.com you@email.com
   ```

   add `--no-www` at the end if you only use the bare domain.

this also turns on **https** with a free let's encrypt certificate that renews itself.

---

## how it works

| part | what it does |
| --- | --- |
| `src/` | the website (react) |
| `server/` | node server: `/api/videos`, `/api/playlists`, serves the site in development |
| `shared/site.json` | all links, playlist ids and copy |
| `deploy/nginx.conf` | nginx serves the built site and forwards `/api` to node |
| `deploy/aortic-edu.service` | keeps the node server running and restarts it on reboot |
| `install.sh`, `update.sh`, `setup-domain.sh` | the helper scripts |

the channel id is found automatically from the channel handle. if youtube ever blocks that lookup, set `CHANNEL_ID` in `/etc/systemd/system/aortic-edu.service` (uncomment the line), then run `sudo systemctl daemon-reload && sudo systemctl restart aortic-edu`.

## useful commands on the server

```
sudo systemctl status aortic-edu      # is the feed service running?
sudo journalctl -u aortic-edu -n 50   # recent logs
sudo systemctl restart aortic-edu
sudo nginx -t && sudo systemctl reload nginx
```

## developing on your own computer

needs node 18+.

```
npm install
npm run dev:server   # terminal 1: api on :3000
npm run dev          # terminal 2: site on :5173
npm run build        # production build into dist/
```

## troubleshooting

- **page loads but no videos:** `sudo journalctl -u aortic-edu -n 50`. usually the server can't reach youtube; check the server has internet access.
- **502 bad gateway:** the node service is down: `sudo systemctl restart aortic-edu`.
- **https step fails:** the domain's a records haven't reached the server yet. wait and run `setup-domain.sh` again.
