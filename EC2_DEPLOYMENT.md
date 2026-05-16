# DuoTalk EC2 Deployment

## 1. Launch the EC2 instance

- Create an Ubuntu EC2 instance.
- Use a security group that allows:
  - `22` from your IP for SSH
  - `80` from `0.0.0.0/0`
  - `443` from `0.0.0.0/0` if you later add HTTPS
- Attach an Elastic IP if you want a stable public IP.

## 2. Install Docker and Compose

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

## 3. Copy the project to the server

```bash
scp -i your-key.pem -r projectfinal ubuntu@YOUR_EC2_PUBLIC_IP:/home/ubuntu/
```

Or clone it on the server:

```bash
git clone <your-repo-url>
cd projectfinal
```

## 4. Create the production env file

```bash
cp .env.ec2.example .env
nano .env
```

Set at least these values:

- `JWT_SECRET`
- `CORS_ORIGIN`
- `SOCKET_IO_CORS_ORIGIN`
- all required `VITE_FIREBASE_*` values

If you are using the local MongoDB container, keep:

```env
MONGODB_URI=mongodb://mongodb:27017/duotalk
```

If you are using MongoDB Atlas instead, replace it with your Atlas URI.

## 5. Build and start the app

```bash
docker compose up --build -d
```

Check status:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```

## 6. Open the app

Visit:

```text
http://YOUR_EC2_PUBLIC_IP
```

Optional Mongo Express admin UI:

```text
http://YOUR_EC2_PUBLIC_IP:8081
```

Start it only when needed:

```bash
docker compose --profile admin up -d mongo-express
```

## 7. Updating after code changes

```bash
git pull
docker compose up --build -d
```

## 8. Recommended next step: HTTPS

For production, put Nginx Proxy Manager, Caddy, or an AWS load balancer in front so you can serve the app over HTTPS and point a real domain at it.
