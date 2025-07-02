# CLAUDE.md - Project Memory

## Project Overview
Three.js collaborative 3D shape editor with real-time WebSocket synchronization.

## Code Style Preferences
- **No comments in code** unless explicitly requested
- **Concise responses** - avoid unnecessary explanations or preamble
- **Modern JavaScript** - Use ES6+ features, async/await
- **Consistent naming** - camelCase for variables/functions, PascalCase for classes
- **Error handling** - Always include try/catch for async operations
- **Security first** - Never expose secrets, validate inputs

## Development Commands
- `npm start` - Production server
- `npm run dev` - Development with nodemon auto-reload
- `npm install` - Install dependencies

## Project Structure
```
threejs-socket/
├── client/                 # Frontend files
│   ├── js/
│   │   ├── app.js         # Main application logic
│   │   ├── scene.js       # Three.js scene management
│   │   ├── shapes.js      # Shape creation/manipulation
│   │   ├── socket.js      # WebSocket client
│   │   ├── cursor.js      # User cursor tracking
│   │   └── onboarding.js  # Interactive user onboarding
│   ├── css/
│   │   ├── style.css      # Main styling with glassmorphism
│   │   └── onboarding.css # Onboarding modal and tooltip styles
│   └── index.html         # Main HTML
├── server/
│   ├── app.js            # Express + Socket.io server
│   └── projects/         # JSON project storage
└── package.json
```

## Completed Features ✅
1. ✅ Basic Node.js Express server setup
2. ✅ Three.js client scene with camera controls
3. ✅ Shape creation/movement/deletion (cube, sphere, cylinder)
4. ✅ Project save/load (JSON files)
5. ✅ WebSocket real-time collaboration
6. ✅ Room-based collaboration system
7. ✅ Real-time shape operation sync
8. ✅ Modern UI with glassmorphism design
9. ✅ User identification and cursor tracking
10. ✅ Interactive onboarding system with guided tour

## Key Technical Decisions
- **File-based storage** instead of database for simplicity
- **Room-based collaboration** with in-memory state management
- **3D cursor tracking** with world-space position conversion
- **Action notifications** for user activity awareness
- **Responsive design** with mobile-friendly controls
- **localStorage onboarding** with cookie-based persistence
- **Progressive disclosure** in guided tour with contextual tooltips

## Architecture Notes
- **Client-Server**: Express serves static files, Socket.io handles real-time events
- **State Management**: Server maintains room state (users + shapes), clients sync
- **Security**: Input validation, no sensitive data exposure
- **Performance**: Efficient raycasting for selection, throttled cursor updates

## Future Enhancement Ideas

### Immediate Features
- Undo/redo system
- Shape properties panel (color, size, rotation)
- Voice/video chat integration
- Export to 3D formats (OBJ, STL)
- Advanced shapes and materials

### Security & Access Control
- **Password-protected rooms**: Room creator sets password, others need it to join
- **User authentication**: OAuth (Google/GitHub) + JWT tokens
- **Room ownership**: Creator becomes admin, can kick users
- **Rate limiting**: Prevent room flooding/spam
- **Input validation**: Sanitize all user inputs

### Database Migration
- Move to **PostgreSQL** (considering Supabase)
- Replace file-based project storage
- Add user accounts and room ownership
- Implement proper data relationships

### Scalability Plan (100k+ Users)

#### Current Bottlenecks
- Single server (~10k max WebSocket connections)
- In-memory room state (lost on restart)
- File-based storage (concurrent access issues)
- No horizontal scaling capability

#### Tier 1: Horizontal Scaling (10k → 50k users)
- **Multiple app instances** behind ALB
- **Redis Cluster** for room state + Socket.io adapter
- **RDS PostgreSQL** for projects/users
- **Auto Scaling Groups** based on CPU/connections

#### Tier 2: Advanced Scaling (50k → 100k+ users)
- **Regional deployment** (multiple AWS regions)
- **DynamoDB** with auto-scaling for global reach
- **ElastiCache Redis** in cluster mode
- **CloudWatch monitoring** + alerts
- **SQS** for background tasks

#### Architecture Evolution
```
Current: Browser → Node.js Server → Local Files
Target:  Browser → CloudFront → ALB → [ECS Instances] → Redis/RDS
```

#### Required Code Changes
- Replace file storage with S3/RDS calls
- Add Redis for room state persistence
- Implement user authentication system
- Add room password protection
- Connection pooling and rate limiting

#### Estimated Costs (monthly)
- ECS + ALB: ~$200
- RDS: ~$100  
- Redis: ~$150
- S3 + CloudFront: ~$50
- **Total: ~$500/month for 100k users**

## Current State AWS Deployment Plan

### Simple Demo Deployment (Current Codebase)
**Goal**: Deploy current app to AWS with minimal changes for company demo

#### Option 1: EC2 + Elastic IP (Simplest)
```bash
# 1. Launch EC2 t3.micro instance (Ubuntu)
# 2. Install Node.js and git
# 3. Clone repo and npm install
# 4. Run with PM2 for process management
# 5. Configure security group (port 3000)
# 6. Assign Elastic IP for stable access
```

**Steps**:
1. **EC2 Instance**: t3.micro (free tier eligible)
2. **Security Group**: Allow port 3000 (HTTP) and 22 (SSH)
3. **Process Manager**: PM2 to keep app running
4. **Domain**: Use Elastic IP or Route 53 for custom domain
5. **SSL**: Let's Encrypt certificate (optional for demo)

**Estimated Cost**: ~$10-15/month

#### Option 2: ECS Fargate + ALB (Production-like)
```yaml
# docker-compose.yml for local testing
# Dockerfile for containerization  
# ECS task definition
# ALB for load balancing
# S3 for project storage
```

**Steps**:
1. **Containerize**: Create Dockerfile
2. **ECR**: Push image to Elastic Container Registry
3. **ECS Fargate**: Serverless container deployment
4. **ALB**: Application Load Balancer with health checks
5. **S3**: Replace local file storage for projects
6. **CloudFront**: CDN for static assets (optional)

**Estimated Cost**: ~$30-50/month

#### Recommended for Demo: Option 1 (EC2)
- **Pros**: Simple, fast setup, low cost, no code changes
- **Cons**: Single point of failure, manual scaling
- **Perfect for**: Company demo, proof of concept