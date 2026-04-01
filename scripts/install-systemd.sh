#!/bin/bash
# Install systemd service for ISP Admin Panel

set -e

SERVICE_FILE="systemd/isp-admin.service"
SERVICE_NAME="isp-admin.service"
SERVICE_PATH="/etc/systemd/system/${SERVICE_NAME}"

if [ ! -f "${SERVICE_FILE}" ]; then
    echo "❌ Service file not found: ${SERVICE_FILE}"
    exit 1
fi

echo "📝 Installing systemd service..."

# Copy service file
sudo cp ${SERVICE_FILE} ${SERVICE_PATH}
sudo chmod 644 ${SERVICE_PATH}

# Reload systemd daemon
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable ${SERVICE_NAME}

# Start service
sudo systemctl start ${SERVICE_NAME}

# Check status
echo ""
echo "✅ Service installed successfully!"
echo ""
echo "🔧 Service Commands:"
echo "  Start:   sudo systemctl start ${SERVICE_NAME}"
echo "  Stop:    sudo systemctl stop ${SERVICE_NAME}"
echo "  Restart: sudo systemctl restart ${SERVICE_NAME}"
echo "  Status:  sudo systemctl status ${SERVICE_NAME}"
echo "  Logs:    sudo journalctl -u ${SERVICE_NAME} -f"
echo ""

# Show current status
sudo systemctl status ${SERVICE_NAME} --no-pager
