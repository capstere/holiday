#!/usr/bin/env bash
set -euo pipefail

PROJECT_PARENT="$HOME/Plan5F"
PROJECT_DIR="$PROJECT_PARENT/holiday"
REPO_URL="https://github.com/capstere/holiday.git"

say() {
  printf "\n\033[1;36m%s\033[0m\n" "$1"
}

warn() {
  printf "\n\033[1;33m%s\033[0m\n" "$1"
}

fail() {
  printf "\n\033[1;31m%s\033[0m\n" "$1" >&2
  exit 1
}

ensure_brew_on_path() {
  if command -v brew >/dev/null 2>&1; then
    return 0
  fi

  if [ -x /opt/homebrew/bin/brew ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [ -x /usr/local/bin/brew ]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi
}

install_homebrew_if_allowed() {
  ensure_brew_on_path
  if command -v brew >/dev/null 2>&1; then
    return 0
  fi

  warn "Homebrew saknas. Homebrew behövs här för att installera Node automatiskt."
  printf "Vill du installera Homebrew nu? Det kan ta några minuter och kan fråga efter Mac-lösenord. [y/N] "
  read -r answer
  case "$answer" in
    y|Y|yes|YES|ja|JA)
      say "Installerar Homebrew..."
      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
      ensure_brew_on_path
      ;;
    *)
      fail "Avbrutet. Installera Node.js LTS manuellt eller installera Homebrew och kör kommandot igen."
      ;;
  esac
}

ensure_git() {
  if command -v git >/dev/null 2>&1; then
    return 0
  fi

  warn "Git saknas. macOS behöver Command Line Tools för Git."
  warn "Ett installationsfönster kan öppnas nu. När installationen är klar: kör samma kommando igen."
  xcode-select --install || true
  exit 1
}

ensure_node() {
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    say "Node finns redan: $(node --version), npm $(npm --version)"
    return 0
  fi

  warn "Node.js/npm saknas. Försöker installera via Homebrew."
  install_homebrew_if_allowed

  if ! command -v brew >/dev/null 2>&1; then
    fail "Homebrew hittades fortfarande inte. Installera Node.js LTS manuellt och kör igen."
  fi

  say "Installerar Node.js..."
  brew install node

  if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    fail "Node/npm kunde inte hittas efter installation. Starta om Terminal/VS Code och kör igen."
  fi

  say "Node installerat: $(node --version), npm $(npm --version)"
}

clone_or_update_repo() {
  mkdir -p "$PROJECT_PARENT"

  if [ -d "$PROJECT_DIR/.git" ]; then
    say "Projektet finns redan. Uppdaterar från GitHub..."
    cd "$PROJECT_DIR"
    git pull --ff-only
    return 0
  fi

  if [ -e "$PROJECT_DIR" ]; then
    fail "$PROJECT_DIR finns redan men verkar inte vara ett Git-repo. Byt namn på mappen eller ta bort den och kör igen."
  fi

  say "Laddar ner projektet till $PROJECT_DIR ..."
  git clone "$REPO_URL" "$PROJECT_DIR"
  cd "$PROJECT_DIR"
}

start_game() {
  say "Installerar projektpaket..."
  npm install

  say "Startar Plan 5F Z4-prototypen..."
  say "Om webbläsaren inte öppnas automatiskt: http://localhost:5173/z4.html"
  npm run play
}

say "Plan 5F Mac bootstrap"
ensure_git
ensure_node
clone_or_update_repo
start_game
