#!/bin/bash

# سكريبت تثبيت Chromium على AlmaLinux 9 لـ WhatsApp Integration

echo "🔄 Installing Chromium dependencies for WhatsApp on AlmaLinux 9..."

# تحديث النظام
sudo dnf update -y

# تثبيت EPEL repository
sudo dnf install -y epel-release

# تثبيت Chromium
sudo dnf install -y chromium

# إذا فشل تثبيت Chromium، جرب Google Chrome
if ! command -v chromium-browser &> /dev/null; then
    echo "⚠️ Chromium not found, installing Google Chrome..."
    
    # إضافة مستودع Google Chrome
    sudo dnf install -y wget
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo rpm --import -
    
    cat << EOF | sudo tee /etc/yum.repos.d/google-chrome.repo
[google-chrome]
name=google-chrome
baseurl=http://dl.google.com/linux/chrome/rpm/stable/\$basearch
enabled=1
gpgcheck=1
gpgkey=https://dl.google.com/linux/linux_signing_key.pub
EOF

    sudo dnf install -y google-chrome-stable
fi

# تثبيت مكتبات إضافية مطلوبة
sudo dnf install -y \
    mesa-libgbm \
    alsa-lib \
    atk \
    at-spi2-atk \
    cairo \
    cups-libs \
    gtk3 \
    libdrm \
    libxkbcommon \
    libXcomposite \
    libXdamage \
    libXrandr \
    libXss \
    nss \
    mesa-libgbm

# التحقق من التثبيت
echo "🔍 Checking installed browsers..."

if command -v chromium-browser &> /dev/null; then
    echo "✅ Chromium installed at: $(which chromium-browser)"
    chromium-browser --version
elif command -v google-chrome &> /dev/null; then
    echo "✅ Google Chrome installed at: $(which google-chrome)"
    google-chrome --version
else
    echo "❌ No suitable browser found!"
    exit 1
fi

echo "✅ Browser installation completed successfully!"
echo "📝 Note: You may need to restart your application to use the new browser path."