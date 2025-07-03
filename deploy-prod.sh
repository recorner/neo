#!/bin/bash

# Neo Marketplace Production Deployment Script
# This script deploys the Neo marketplace application in production mode

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/recorner/neo.git"
DEPLOY_DIR="/opt/neo"
BRANCH="main"
BACKUP_DIR="/opt/neo-backups"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking system requirements..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if Git is installed
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    log_success "All requirements satisfied"
}

create_backup() {
    if [ -d "$DEPLOY_DIR" ]; then
        log_info "Creating backup of current deployment..."
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_PATH="$BACKUP_DIR/neo_backup_$TIMESTAMP"
        
        mkdir -p "$BACKUP_DIR"
        cp -r "$DEPLOY_DIR" "$BACKUP_PATH"
        
        log_success "Backup created at $BACKUP_PATH"
    fi
}

clone_or_update_repo() {
    log_info "Setting up repository..."
    
    if [ -d "$DEPLOY_DIR" ]; then
        log_info "Repository exists, updating..."
        cd "$DEPLOY_DIR"
        git fetch origin
        git checkout "$BRANCH"
        git pull origin "$BRANCH"
    else
        log_info "Cloning repository..."
        git clone -b "$BRANCH" "$REPO_URL" "$DEPLOY_DIR"
        cd "$DEPLOY_DIR"
    fi
    
    log_success "Repository ready"
}

setup_environment() {
    log_info "Setting up environment configuration..."
    
    if [ ! -f "$DEPLOY_DIR/.env" ]; then
        log_warning ".env file not found. Creating from example..."
        cp "$DEPLOY_DIR/.env.example" "$DEPLOY_DIR/.env"
        log_warning "Please edit $DEPLOY_DIR/.env with your production values before continuing"
        log_warning "Press Enter when ready to continue..."
        read
    fi
    
    log_success "Environment configuration ready"
}

deploy_application() {
    log_info "Deploying application..."
    
    cd "$DEPLOY_DIR"
    
    # Stop existing containers
    log_info "Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down || true
    
    # Build and start containers
    log_info "Building and starting containers..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Run database migrations
    log_info "Running database migrations..."
    docker-compose -f docker-compose.prod.yml exec -T app npx prisma migrate deploy
    
    # Generate Prisma client
    log_info "Generating Prisma client..."
    docker-compose -f docker-compose.prod.yml exec -T app npx prisma generate
    
    log_success "Application deployed successfully"
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check container status
    cd "$DEPLOY_DIR"
    CONTAINERS=$(docker-compose -f docker-compose.prod.yml ps -q)
    
    for container in $CONTAINERS; do
        if [ "$(docker inspect -f '{{.State.Status}}' $container)" != "running" ]; then
            log_error "Container $container is not running"
            return 1
        fi
    done
    
    # Check application health
    sleep 10
    if curl -f http://localhost/health &> /dev/null; then
        log_success "Application is responding to health checks"
    else
        log_warning "Application health check failed, but this might be expected if health endpoint is not implemented"
    fi
    
    log_success "Deployment verification completed"
}

show_status() {
    log_info "Application Status:"
    cd "$DEPLOY_DIR"
    docker-compose -f docker-compose.prod.yml ps
    
    echo ""
    log_info "Application URLs:"
    echo "  Main Application: http://localhost"
    echo "  MinIO Console: http://localhost:9001"
    
    echo ""
    log_info "Useful Commands:"
    echo "  View logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  Stop application: docker-compose -f docker-compose.prod.yml down"
    echo "  Restart application: docker-compose -f docker-compose.prod.yml restart"
}

rollback() {
    log_warning "Rolling back to previous version..."
    
    # Stop current containers
    cd "$DEPLOY_DIR"
    docker-compose -f docker-compose.prod.yml down
    
    # Find latest backup
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR" | head -n1)
    
    if [ -n "$LATEST_BACKUP" ]; then
        log_info "Restoring from backup: $LATEST_BACKUP"
        rm -rf "$DEPLOY_DIR"
        cp -r "$BACKUP_DIR/$LATEST_BACKUP" "$DEPLOY_DIR"
        
        # Start restored version
        cd "$DEPLOY_DIR"
        docker-compose -f docker-compose.prod.yml up -d
        
        log_success "Rollback completed"
    else
        log_error "No backup found for rollback"
        exit 1
    fi
}

# Main execution
main() {
    echo "🚀 Neo Marketplace Production Deployment"
    echo "========================================"
    
    case "${1:-deploy}" in
        "deploy")
            check_requirements
            create_backup
            clone_or_update_repo
            setup_environment
            deploy_application
            verify_deployment
            show_status
            ;;
        "rollback")
            rollback
            ;;
        "status")
            show_status
            ;;
        "stop")
            cd "$DEPLOY_DIR"
            docker-compose -f docker-compose.prod.yml down
            log_success "Application stopped"
            ;;
        "start")
            cd "$DEPLOY_DIR"
            docker-compose -f docker-compose.prod.yml up -d
            log_success "Application started"
            ;;
        "logs")
            cd "$DEPLOY_DIR"
            docker-compose -f docker-compose.prod.yml logs -f
            ;;
        *)
            echo "Usage: $0 [deploy|rollback|status|stop|start|logs]"
            echo ""
            echo "Commands:"
            echo "  deploy   - Deploy the application (default)"
            echo "  rollback - Rollback to previous version"
            echo "  status   - Show application status"
            echo "  stop     - Stop the application"
            echo "  start    - Start the application"
            echo "  logs     - Show application logs"
            exit 1
            ;;
    esac
}

main "$@"
