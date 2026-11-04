# AWS Hosting Guide — A2000 AI Opportunity Discovery Platform

This Next.js 16 application is production-ready for deployment on **AWS**. Below are the recommended deployment options:

---

## Option 1: AWS Amplify Hosting (Easiest & Fastest)
AWS Amplify natively supports Next.js Server-Side Rendering (SSR) and API routes:
1. Push your Git repository to GitHub / GitLab / AWS CodeCommit.
2. In AWS Console, go to **AWS Amplify** → **Deploy an app** → Select **GitHub**.
3. Select your repository and `main` branch.
4. Amplify will automatically detect Next.js and use standard build settings:
   ```yaml
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
   ```
5. Click **Save and Deploy**. Your app will be live on an AWS URL with free SSL and automatic deployments on git push!

---

## Option 2: AWS App Runner (Containerized / Fully Managed)
AWS App Runner automatically builds and runs containers with zero infrastructure management:
1. Connect your GitHub repository to AWS App Runner.
2. Choose **Repository type**: Source code repository or Container registry (ECR).
3. If using Dockerfile: App Runner will automatically build using the included `Dockerfile` and run on port `3000`.
4. Configure environment variables (e.g., `DATABASE_URL` for PostgreSQL if used).

---

## Option 3: AWS Elastic Beanstalk or EC2
1. Launch an Amazon Linux 2023 EC2 instance (e.g. `t3.small` or `t3.medium`).
2. Install Node.js 20:
   ```bash
   sudo dnf install -y nodejs npm git
   ```
3. Clone repository and install dependencies:
   ```bash
   git clone <your-repo-url>
   cd Questionarre
   npm ci
   npm run build
   ```
4. Start with PM2 for 24/7 background uptime:
   ```bash
   sudo npm install -g pm2
   pm2 start npm --name "a2000-questionnaire" -- start
   pm2 startup
   pm2 save
   ```
5. Set up Nginx as reverse proxy to port `3000` with Let's Encrypt SSL.

---

## Security Access Code
- Default access code: `A2000`
- Shareable direct link format: `https://<your-domain>/?code=A2000`
- Any questionnaire can be directly shared: `https://<your-domain>/finance?code=A2000`

