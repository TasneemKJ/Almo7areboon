#!/usr/bin/env bash
# Failure-only CI evidence: copies small JSON/text files, keeps the last 200 lines of each log, and shrinks at most
# four screenshots to 800px-wide JPEGs. Usage: trim-evidence.sh <out-dir> <source-dir-or-file>...
# Everything is best effort; a missing tool or path never hides the original failure.
set -u
out="$1"; shift
mkdir -p "$out"
shots=0
for src in "$@"; do
  [ -e "$src" ] || continue
  while IFS= read -r file; do
    name="$(echo "$file" | tr '/ ' '__')"
    case "$file" in
      *.log|*.txt) tail -n 200 "$file" > "$out/$name" 2>/dev/null || true ;;
      *.json) [ "$(stat -c %s "$file")" -le 100000 ] && cp "$file" "$out/$name" ;;
      *.png)
        if [ "$shots" -lt 4 ] && command -v convert >/dev/null 2>&1; then
          convert "$file" -resize '800x>' -quality 60 "$out/${name%.png}.jpg" 2>/dev/null && shots=$((shots + 1))
        fi ;;
    esac
  done < <(find "$src" -type f -size -4000k 2>/dev/null | sort)
done
exit 0
