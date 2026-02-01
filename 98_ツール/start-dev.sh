#!/usr/bin/env bash
#
# start-dev.sh - Kakeibon Development Environment Startup Script
#
# Starts both backend (FastAPI) and frontend (Vite) servers in a single terminal.
# Press Ctrl+C to stop both servers gracefully.
#

set -euo pipefail

# ============================================================================
# Constants
# ============================================================================

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly DEV_DIR="${PROJECT_ROOT}/.dev"
readonly BACKEND_DIR="${PROJECT_ROOT}/backend"
readonly FRONTEND_DIR="${PROJECT_ROOT}/frontend"

readonly BACKEND_PORT=8000
readonly FRONTEND_PORT=5173

readonly BACKEND_PID_FILE="${DEV_DIR}/backend.pid"
readonly FRONTEND_PID_FILE="${DEV_DIR}/frontend.pid"
readonly BACKEND_LOG_FILE="${DEV_DIR}/backend.log"
readonly FRONTEND_LOG_FILE="${DEV_DIR}/frontend.log"

readonly MAX_LOG_SIZE=$((10 * 1024 * 1024))  # 10MB
readonly STARTUP_TIMEOUT=30  # seconds
readonly SHUTDOWN_TIMEOUT=10  # seconds

# Color codes for output
readonly COLOR_RESET='\033[0m'
readonly COLOR_RED='\033[0;31m'
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_YELLOW='\033[0;33m'
readonly COLOR_BLUE='\033[0;34m'
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

# Check if a port is in use
# Args: $1 - port number
# Returns: 0 if in use, 1 if free
is_port_in_use() {
    local port=$1
    local port_hex
    port_hex=$(printf '%04X' "$port")

    # Check both TCP and TCP6
    if grep -q ":${port_hex} " /proc/net/tcp /proc/net/tcp6 2>/dev/null; then
        return 0
    fi
    return 1
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

# Rotate log file if it exceeds MAX_LOG_SIZE
# Args: $1 - log file path
rotate_log_if_needed() {
    local log_file=$1
    if [[ -f "${log_file}" ]]; then
        local size
        size=$(stat -c%s "${log_file}" 2>/dev/null || echo 0)
        if ((size > MAX_LOG_SIZE)); then
            log_info "Rotating ${log_file} (size: $((size / 1024 / 1024))MB)"
            mv "${log_file}" "${log_file}.old"
        fi
    fi
}

# Wait for a port to become available
# Args: $1 - port number, $2 - timeout in seconds
# Returns: 0 if port becomes available, 1 if timeout
wait_for_port() {
    local port=$1
    local timeout=$2
    local elapsed=0

    while ((elapsed < timeout)); do
        if is_port_in_use "$port"; then
            return 0
        fi
        sleep 1
        ((elapsed++))
    done
    return 1
}

# Clean up stale PID file
# Args: $1 - PID file path
clean_stale_pid() {
    local pid_file=$1
    if [[ -f "${pid_file}" ]]; then
        local pid
        pid=$(cat "${pid_file}")
        if ! is_process_running "$pid"; then
            log_warning "Cleaning stale PID file: ${pid_file} (PID: ${pid})"
            rm -f "${pid_file}"
        fi
    fi
}

# ============================================================================
# Cleanup and Signal Handling
# ============================================================================

cleanup() {
    local exit_code=$?

    log_info "Shutting down development servers..."

    # Stop frontend
    if [[ -f "${FRONTEND_PID_FILE}" ]]; then
        local frontend_pid
        frontend_pid=$(cat "${FRONTEND_PID_FILE}")
        if is_process_running "$frontend_pid"; then
            log_info "Stopping frontend (PID: ${frontend_pid})..."
            kill -TERM "$frontend_pid" 2>/dev/null || true

            # Wait for graceful shutdown
            local waited=0
            while ((waited < SHUTDOWN_TIMEOUT)) && is_process_running "$frontend_pid"; do
                sleep 1
                ((waited++))
            done

            # Force kill if still running
            if is_process_running "$frontend_pid"; then
                log_warning "Force killing frontend..."
                kill -KILL "$frontend_pid" 2>/dev/null || true
            fi
        fi
        rm -f "${FRONTEND_PID_FILE}"
    fi

    # Stop backend
    if [[ -f "${BACKEND_PID_FILE}" ]]; then
        local backend_pid
        backend_pid=$(cat "${BACKEND_PID_FILE}")
        if is_process_running "$backend_pid"; then
            log_info "Stopping backend (PID: ${backend_pid})..."
            kill -TERM "$backend_pid" 2>/dev/null || true

            # Wait for graceful shutdown
            local waited=0
            while ((waited < SHUTDOWN_TIMEOUT)) && is_process_running "$backend_pid"; do
                sleep 1
                ((waited++))
            done

            # Force kill if still running
            if is_process_running "$backend_pid"; then
                log_warning "Force killing backend..."
                kill -KILL "$backend_pid" 2>/dev/null || true
            fi
        fi
        rm -f "${BACKEND_PID_FILE}"
    fi

    if ((exit_code == 0)); then
        log_success "Development servers stopped cleanly"
    else
        log_error "Development servers stopped with errors (exit code: ${exit_code})"
    fi

    exit "$exit_code"
}

trap cleanup EXIT INT TERM

# ============================================================================
# Pre-flight Checks
# ============================================================================

log_info "Starting Kakeibon development environment..."

# Create .dev directory if it doesn't exist
mkdir -p "${DEV_DIR}"
chmod 700 "${DEV_DIR}"

# Check required directories
if [[ ! -d "${BACKEND_DIR}" ]]; then
    log_error "Backend directory not found: ${BACKEND_DIR}"
    exit 1
fi

if [[ ! -d "${FRONTEND_DIR}" ]]; then
    log_error "Frontend directory not found: ${FRONTEND_DIR}"
    exit 1
fi

# Check required tools
if ! command -v uv &>/dev/null; then
    log_error "uv is not installed. Please install uv first."
    exit 1
fi

if ! command -v npm &>/dev/null; then
    log_error "npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Clean stale PID files
clean_stale_pid "${BACKEND_PID_FILE}"
clean_stale_pid "${FRONTEND_PID_FILE}"

# Check port availability
if is_port_in_use "$BACKEND_PORT"; then
    log_error "Port ${BACKEND_PORT} is already in use. Please stop the conflicting process."
    exit 1
fi

if is_port_in_use "$FRONTEND_PORT"; then
    log_error "Port ${FRONTEND_PORT} is already in use. Please stop the conflicting process."
    exit 1
fi

log_success "Pre-flight checks passed"

# ============================================================================
# Start Backend
# ============================================================================

log_info "Starting backend server on port ${BACKEND_PORT}..."

# Rotate log if needed
rotate_log_if_needed "${BACKEND_LOG_FILE}"

# Start backend in background
(
    cd "${BACKEND_DIR}"
    nohup uv run uvicorn app.main:app --host 0.0.0.0 --port "${BACKEND_PORT}" --reload \
        > "${BACKEND_LOG_FILE}" 2>&1 &
    echo $! > "${BACKEND_PID_FILE}"
)

BACKEND_PID=$(cat "${BACKEND_PID_FILE}")
log_info "Backend process started (PID: ${BACKEND_PID})"

# Wait for backend to be ready
log_info "Waiting for backend to be ready..."
if ! wait_for_port "$BACKEND_PORT" "$STARTUP_TIMEOUT"; then
    log_error "Backend failed to start within ${STARTUP_TIMEOUT} seconds"
    log_error "Check logs: ${BACKEND_LOG_FILE}"
    exit 1
fi

log_success "Backend ready at http://localhost:${BACKEND_PORT}"
log_info "API docs available at http://localhost:${BACKEND_PORT}/docs"

# ============================================================================
# Start Frontend
# ============================================================================

log_info "Starting frontend server on port ${FRONTEND_PORT}..."

# Rotate log if needed
rotate_log_if_needed "${FRONTEND_LOG_FILE}"

# Start frontend in background
(
    cd "${FRONTEND_DIR}"
    nohup npm run dev > "${FRONTEND_LOG_FILE}" 2>&1 &
    echo $! > "${FRONTEND_PID_FILE}"
)

FRONTEND_PID=$(cat "${FRONTEND_PID_FILE}")
log_info "Frontend process started (PID: ${FRONTEND_PID})"

# Wait for frontend to be ready
log_info "Waiting for frontend to be ready..."
if ! wait_for_port "$FRONTEND_PORT" "$STARTUP_TIMEOUT"; then
    log_error "Frontend failed to start within ${STARTUP_TIMEOUT} seconds"
    log_error "Check logs: ${FRONTEND_LOG_FILE}"
    exit 1
fi

log_success "Frontend ready at http://localhost:${FRONTEND_PORT}"

# ============================================================================
# Monitoring Loop
# ============================================================================

echo ""
log_success "✨ Development environment is ready!"
echo ""
log_info "Backend:  http://localhost:${BACKEND_PORT}"
log_info "Frontend: http://localhost:${FRONTEND_PORT}"
log_info "API Docs: http://localhost:${BACKEND_PORT}/docs"
echo ""
log_info "Press Ctrl+C to stop both servers"
log_info "Or run 'doc/98_ツール/stop-dev.sh' from another terminal"
echo ""
log_info "View logs:"
log_info "  Backend:  tail -f ${BACKEND_LOG_FILE}"
log_info "  Frontend: tail -f ${FRONTEND_LOG_FILE}"
echo ""

# Monitor processes
while true; do
    # Check if backend is still running
    if ! is_process_running "$BACKEND_PID"; then
        log_error "Backend process died unexpectedly!"
        log_error "Check logs: ${BACKEND_LOG_FILE}"
        exit 1
    fi

    # Check if frontend is still running
    if ! is_process_running "$FRONTEND_PID"; then
        log_error "Frontend process died unexpectedly!"
        log_error "Check logs: ${FRONTEND_LOG_FILE}"
        exit 1
    fi

    sleep 2
done
