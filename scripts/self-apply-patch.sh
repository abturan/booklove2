#!/usr/bin/env bash
# self-apply-patch.sh — tek dosyalık, harici .patch dosyasını uygular
set -euo pipefail

DRY_RUN=0
REVERSE=0
STRIP=""
ROOT="."
PATCH_FILE=""

usage() {
  echo "Kullanım: $0 [--patch FILE.patch|-] [--dry-run] [--reverse] [--strip N] [--root DIR]"
  echo "Notlar:"
  echo "  • --patch verilmezse aynı klasörde otomatik .patch arar:"
  echo "      <script>.patch, changes.patch, *.patch (en yeni dosya)"
  echo "  • --patch -        => patch içeriğini STDIN'den okur."
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --patch)   PATCH_FILE="${2-}"; shift 2 ;;
    -n|--dry-run) DRY_RUN=1; shift ;;
    -R|--reverse) REVERSE=1; shift ;;
    -p|--strip)   STRIP="${2-}"; shift 2 ;;
    -d|--root|--dir|--cwd) ROOT="${2-}"; shift 2 ;;
    -h|--help) usage ;;
    *) echo "Bilinmeyen argüman: $1"; usage ;;
  esac
done

require_cmd() { command -v "$1" >/dev/null 2>&1 || { echo "'$1' komutu gerekli." >&2; exit 3; }; }
require_cmd patch
require_cmd awk
require_cmd sed
require_cmd date

# Script klasörü
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

# PATCH kaynağını belirle
detect_patch_file() {
  local base script_name cand newest
  script_name="$(basename "$0")"
  base="${script_name%.*}"
  # Öncelik: aynı klasörde <script>.patch
  cand="$SCRIPT_DIR/$base.patch"
  [[ -f "$cand" ]] && { echo "$cand"; return; }
  # Sonra: changes.patch
  cand="$SCRIPT_DIR/changes.patch"
  [[ -f "$cand" ]] && { echo "$cand"; return; }
  # Sonra: *.patch (en yeni)
  newest="$(ls -1t "$SCRIPT_DIR"/*.patch 2>/dev/null | head -n1 || true)"
  [[ -n "${newest:-}" ]] && { echo "$newest"; return; }
  echo ""
}

read_patch_content() {
  if [[ "${PATCH_FILE:-}" == "-" ]]; then
    cat -
    return
  fi
  if [[ -z "${PATCH_FILE:-}" ]]; then
    PATCH_FILE="$(detect_patch_file)"
  fi
  if [[ -z "${PATCH_FILE:-}" ]]; then
    echo "Patch dosyası bulunamadı. --patch FILE.patch verin ya da <script>.patch/changes.patch ekleyin." >&2
    exit 2
  fi
  # Göreli yol verildiyse script klasörüne göre de kontrol et
  if [[ ! -f "$PATCH_FILE" && -f "$SCRIPT_DIR/$PATCH_FILE" ]]; then
    PATCH_FILE="$SCRIPT_DIR/$PATCH_FILE"
  fi
  [[ -f "$PATCH_FILE" ]] || { echo "Patch dosyası yok: $PATCH_FILE" >&2; exit 2; }
  cat "$PATCH_FILE"
}

cd "$ROOT"

PATCH_CONTENT="$(read_patch_content || true)"
if [[ -z "${PATCH_CONTENT//[$'\t\r\n ']}" ]]; then
  echo "Boş patch içeriği." >&2
  exit 2
fi

# Otomatik -p tespiti (kullanıcı belirtmemişse)
auto_detect_strip() {
  for p in 0 1 2 3 4 5; do
    if printf "%s" "$PATCH_CONTENT" | patch ${REVERSE:+-R} -p"$p" -N --follow-symlinks --dry-run >/dev/null 2>&1; then
      echo "$p"; return 0
    fi
  done
  echo "0"
}

if [[ -z "$STRIP" ]]; then
  STRIP="$(auto_detect_strip)"
fi

BACKUP_SUFFIX=".assistant.bak.$(date +%s)"
PATCH_ARGS=(-p"$STRIP" -N --follow-symlinks --backup --suffix="$BACKUP_SUFFIX")
[[ $REVERSE -eq 1 ]] && PATCH_ARGS+=(-R)

if [[ $DRY_RUN -eq 1 ]]; then
  echo "[DRY-RUN] patch ${PATCH_ARGS[*]} < ${PATCH_FILE:-STDIN}"
  if printf "%s" "$PATCH_CONTENT" | patch "${PATCH_ARGS[@]}" --dry-run -s; then
    echo "[DRY-RUN] Uygulanabilir."
    exit 0
  else
    echo "[DRY-RUN] Uygulanamadı." >&2
    exit 4
  fi
fi

if printf "%s" "$PATCH_CONTENT" | patch "${PATCH_ARGS[@]}"; then
  echo "Yama uygulandı. Yedekler *$BACKUP_SUFFIX ile bırakıldı."
  exit 0
else
  echo "Yama uygulanamadı." >&2
  exit 5
fi
