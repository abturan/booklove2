# scripts/make-ai-snapshot.sh
set -euo pipefail
DEBUG="${AI_SNAPSHOT_DEBUG:-0}"
log(){ [[ "$DEBUG" == "1" ]] && echo ">> $*" >&2 || true; }
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_ZIP="ai-snapshot-${STAMP}.zip"
TMPDIR="$(mktemp -d 2>/dev/null || echo ".ai-snapshot-${STAMP}.tmp")"
trap 'rm -rf "$TMPDIR"' EXIT
MANIFEST="$TMPDIR/FILES_MANIFEST.txt"
MANIFEST_FILTERED="$TMPDIR/FILES_MANIFEST.filtered"
ROUTES="$TMPDIR/ROUTES.md"
ENV_DIR="$TMPDIR/ENV"
ENV_SAMPLE="$ENV_DIR/.env.example"
EXCLUDE_REGEX='(^|/)(node_modules|\.next|dist|build|\.git|coverage|out|\.turbo|\.vercel|public|\.DS_Store)(/|$)'

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then ROOT="$(git rev-parse --show-toplevel)"; cd "$ROOT"; fi

mkdir -p "$ENV_DIR"
if [[ ! -f ".env.example" ]]; then
  printf "%s\n" "# Example environment (DO NOT PUT REAL SECRETS)" > "$ENV_SAMPLE"
else
  cp ".env.example" "$ENV_SAMPLE"
fi

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git ls-files > "$TMPDIR/tracked.tmp" || true
  git ls-files --others --exclude-standard > "$TMPDIR/untracked.tmp" || true
  cat "$TMPDIR/tracked.tmp" "$TMPDIR/untracked.tmp" 2>/dev/null | sed 's|^\./||' | sort -u | grep -Ev "$EXCLUDE_REGEX" > "$MANIFEST" || true
  rm -f "$TMPDIR/tracked.tmp" "$TMPDIR/untracked.tmp"
else
  find . -type f | sed 's|^\./||' | grep -Ev "$EXCLUDE_REGEX" > "$MANIFEST" || true
fi

add(){ [[ -e "$1" ]] && ! grep -Fxq "$1" "$MANIFEST" && echo "$1" >> "$MANIFEST" || true; }
add "package.json"; add "pnpm-lock.yaml"; add "package-lock.json"; add "yarn.lock"; add "tsconfig.json"
add "next.config.js"; add "next.config.mjs"; add "next.config.ts"
add "prisma/schema.prisma"; add "prisma/migrations"; add "src"; add "app"

{
  echo "# Next.js App Router Tree"
  echo
  if command -v tree >/dev/null 2>&1; then
    if [[ -d "src/app" ]]; then
      echo '```'
      tree -a -I "node_modules|.next|dist|build|.git|public" src/app
      echo '```'
    elif [[ -d "app" ]]; then
      echo '```'
      tree -a -I "node_modules|.next|dist|build|.git|public" app
      echo '```'
    else
      echo "_app router dizini bulunamadı (src/app veya app)_"
    fi
  else
    echo "_tree bulunamadı; find ile listeleniyor_"
    echo
    echo '```'
    if [[ -d "src/app" ]]; then
      find src/app -type d | sort
    elif [[ -d "app" ]]; then
      find app -type d | sort
    else
      echo "app router dizini yok"
    fi
    echo '```'
  fi

  echo
  echo "## Repo Durumu"
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    SHA="$(git rev-parse --short HEAD 2>/dev/null || echo 'no-git')"
    if git diff --quiet && git diff --cached --quiet; then DIRTY=""; else DIRTY="+dirty"; fi
    echo "- Commit: ${SHA}${DIRTY}"
  else
    echo "- Git: yok"
  fi
} > "$ROUTES"

> "$MANIFEST_FILTERED"
while IFS= read -r p; do [[ -f "$p" ]] && echo "$p" >> "$MANIFEST_FILTERED"; done < "$MANIFEST"
TOTAL_FILES="$(wc -l < "$MANIFEST_FILTERED" | tr -d ' ')"
[[ "$TOTAL_FILES" -gt 0 ]] || { echo "!! HATA: Paketlenecek dosya yok." >&2; exit 2; }

rm -f "$OUT_ZIP"
if command -v zip >/dev/null 2>&1; then
  zip -q -X "$OUT_ZIP" -@ < "$MANIFEST_FILTERED"
  ( cd "$TMPDIR" && zip -q -X "$OLDPWD/$OUT_ZIP" -j "FILES_MANIFEST.txt" "ROUTES.md" && zip -q -X "$OLDPWD/$OUT_ZIP" -r "ENV" )
else
  OUT_ZIP="${OUT_ZIP%.zip}.tar.gz"
  tar -czf "$OUT_ZIP" -T "$MANIFEST_FILTERED"
  ( cd "$TMPDIR" && tar -rzf "$OLDPWD/$OUT_ZIP" FILES_MANIFEST.txt ROUTES.md ENV )
fi

if [[ -f "$OUT_ZIP" ]]; then
  SZ=$(stat -f%z "$OUT_ZIP" 2>/dev/null || stat -c%s "$OUT_ZIP" 2>/dev/null || echo "unknown")
  echo ">> Tamam: $OUT_ZIP ($SZ bytes)"
else
  echo "!! HATA: Çıktı arşivi oluşturulamadı." >&2
  exit 3
fi
