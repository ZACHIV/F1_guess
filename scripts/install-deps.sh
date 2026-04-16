#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOOLS_DIR="$ROOT_DIR/.tools/bin"

log() {
  printf '[install] %s\n' "$1"
}

fail() {
  printf '[install] %s\n' "$1" >&2
  exit 1
}

has_command() {
  command -v "$1" >/dev/null 2>&1
}

ensure_dir() {
  mkdir -p "$1"
}

command_works() {
  local command_path="$1"
  shift || true
  "$command_path" "$@" >/dev/null 2>&1
}

ensure_node() {
  has_command node || fail "Node.js is required but was not found in PATH."
  has_command npm || fail "npm is required but was not found in PATH."
}

install_with_brew() {
  log "Installing system packages with Homebrew"
  brew install ffmpeg yt-dlp
}

install_with_apt() {
  log "Installing system packages with apt"
  sudo apt-get update
  sudo apt-get install -y ffmpeg yt-dlp
}

install_with_dnf() {
  log "Installing system packages with dnf"
  sudo dnf install -y ffmpeg yt-dlp
}

install_with_pacman() {
  log "Installing system packages with pacman"
  sudo pacman -Sy --noconfirm ffmpeg yt-dlp
}

install_ffmpeg_packages() {
  if has_command ffmpeg && has_command ffprobe; then
    log "ffmpeg and ffprobe already available"
    return
  fi

  if has_command brew; then
    log "Installing ffmpeg with Homebrew"
    brew install ffmpeg
    return
  fi

  if has_command apt-get; then
    log "Installing ffmpeg with apt"
    sudo apt-get update
    sudo apt-get install -y ffmpeg
    return
  fi

  if has_command dnf; then
    log "Installing ffmpeg with dnf"
    sudo dnf install -y ffmpeg
    return
  fi

  if has_command pacman; then
    log "Installing ffmpeg with pacman"
    sudo pacman -Sy --noconfirm ffmpeg
    return
  fi

  fail "Unsupported package manager. Install ffmpeg and ffprobe manually, then rerun this script."
}

download_yt_dlp_binary() {
  ensure_dir "$TOOLS_DIR"

  if has_command curl; then
    log "Downloading standalone yt-dlp with curl"
    curl -L "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" -o "$TOOLS_DIR/yt-dlp"
  elif has_command wget; then
    log "Downloading standalone yt-dlp with wget"
    wget -O "$TOOLS_DIR/yt-dlp" "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp"
  else
    fail "curl or wget is required to install yt-dlp automatically."
  fi

  chmod +x "$TOOLS_DIR/yt-dlp"
}

install_yt_dlp() {
  if has_command yt-dlp && command_works yt-dlp --version; then
    log "yt-dlp already available"
    return
  fi

  if [ -x "$TOOLS_DIR/yt-dlp" ] && command_works "$TOOLS_DIR/yt-dlp" --version; then
    log "Using existing local yt-dlp at .tools/bin/yt-dlp"
    return
  fi

  log "System yt-dlp is missing or broken; installing a local standalone binary"
  download_yt_dlp_binary

  command_works "$TOOLS_DIR/yt-dlp" --version || fail "Local yt-dlp install failed."
}

install_node_modules() {
  log "Installing npm dependencies"
  cd "$ROOT_DIR"
  npm install
}

main() {
  ensure_node
  install_ffmpeg_packages
  install_yt_dlp
  install_node_modules
  log "All dependencies installed. If your shell PATH does not include .tools/bin, the app will still use the local yt-dlp automatically."
  log "Next step: npm run setup:f1db && npm run dev"
}

main "$@"
