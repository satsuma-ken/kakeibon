#!/usr/bin/env bash
#
# stop-dev.sh - Kakeibon Development Environment Shutdown Script
#
# Gracefully stops both backend and frontend servers.
# Can be run from a separate terminal while start-dev.sh is running.
#

set -euo pipefail

# ============================================================================
# Constants
# ============================================================================

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly DEV_DIR="${PROJECT_ROOT}/.dev"

readonly BACKEND_PID_FILE="${DEV_DIR}/backend.pid"
readonly FRONTEND_PID_FILE="${DEV_DIR}/frontend.pid"

readonly SHUTDOWN_TIMEOUT=10  # seconds

# Color codes for output
readonly COLOR_RESET='\033[0m'
readonly COLOR_RED='\033[0;31m'
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_YELLOW='\033[0;33m'
readonly COLOR_CYAN='\033[0;36m'

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
    echo -e "${COLOR_CYAN}[INFO]${COLOR_RESET} $*"
}

log_success() {
    echo -e "${COLOR_GREEN}[SUCCESS]${COLOR_RESET} $*"
}

log_warning() {
    echo -e "${COLOR_YELLOW}[WARNING]${COLOR_RESET} $*"
}

log_error() {
    echo -e "${COLOR_RED}[ERROR]${COLOR_RESET} $*" >&2
}

# Check if a process is running
# Args: $1 - PID
# Returns: 0 if running, 1 if not
is_process_running() {
    local pid=$1
    if [[ -d "/proc/${pid}" ]]; then
        return 0
    fi
    return 1
}

# Stop a process gracefully
# Args: $1 - PID, $2 - process name
stop_process() {
    local pid=$1
    local name=$2

    if ! is_process_running "$pid"; then
        log_warning "${name} process (PID: ${pid}) is not running"
        return 0
    fi

    log_info "Stopping ${name} (PID: ${pid})..."

    # Send SIGTERM to process group for graceful shutdown
    # The negative PID sends the signal to the entire process group
    if kill -TERM -"$pid" 2>/dev/null; then
        # Wait for process to stop
        local waited=0
        while ((waited < SHUTDOWN_TIMEOUT)) && is_process_running "$pid"; do
            sleep 1
            ((waited++))
        done

        # Check if process stopped
        if is_process_running "$pid"; then
            log_warning "${name} did not stop gracefully, force killing..."
            kill -KILL -"$pid" 2>/dev/null || true
            sleep 1
        fi

        if ! is_process_running "$pid"; then
            log_success "${name} stopped"
            return 0
        else
            log_error "Failed to stop ${name}"
            return 1
        fi
    else
        log_warning "Could not send signal to ${name} (PID: ${pid})"
        return 1
    fi
}

# ============================================================================
# Main
# ============================================================================

log_info "Stopping Kakeibon development environment..."

# Check if .dev directory exists
if [[ ! -d "${DEV_DIR}" ]]; then
    log_warning "No .dev directory found. Development environment may not be running."
    exit 0
fi

# Track if any process was stopped
STOPPED_ANY=false

# Stop frontend
if [[ -f "${FRONTEND_PID_FILE}" ]]; then
    FRONTEND_PID=$(cat "${FRONTEND_PID_FILE}")
    if stop_process "$FRONTEND_PID" "Frontend"; then
        STOPPED_ANY=true
    fi
    rm -f "${FRONTEND_PID_FILE}"
else
    log_info "No frontend PID file found"
fi

# Stop backend
if [[ -f "${BACKEND_PID_FILE}" ]]; then
    BACKEND_PID=$(cat "${BACKEND_PID_FILE}")
    if stop_process "$BACKEND_PID" "Backend"; then
        STOPPED_ANY=true
    fi
    rm -f "${BACKEND_PID_FILE}"
else
    log_info "No backend PID file found"
fi

# Final message
if [[ "${STOPPED_ANY}" == "true" ]]; then
    echo ""
    log_success "✨ Development environment stopped"
else
    echo ""
    log_info "No running processes found"
fi
