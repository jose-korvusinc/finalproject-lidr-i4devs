#!/usr/bin/env bash
# =============================================================================
# render-plantuml.sh — Export PlantUML (.puml) diagrams to an image format.
#
# Renders the indicated .puml files (and/or every .puml under the indicated
# directories) next to their source, auto-detecting the best available engine.
#
# Usage:
#   render-plantuml.sh [--format png|svg|pdf] [--engine auto|plantuml|jar|docker]
#                      [--check-only] <file-or-dir> [<file-or-dir> ...]
#
# Engine auto-detection order (each needs Graphviz/dot for class/state/activity
# diagrams; the Docker image already bundles it):
#   1) plantuml   — the `plantuml` CLI on PATH (only if `dot` is also present)
#   2) docker     — `docker run --rm plantuml/plantuml` (self-contained, bundles dot)
#   3) jar        — `java -jar <plantuml.jar>` (only if `dot` is present)
#                   jar is taken from $PLANTUML_JAR or a VS Code/Cursor extension.
# Override with --engine or the $PLANTUML_ENGINE env var.
#
# Exit codes: 0 = all rendered OK · 1 = usage/engine error · 2 = render/syntax error
# =============================================================================
set -uo pipefail

FORMAT="png"
ENGINE="${PLANTUML_ENGINE:-auto}"
CHECK_ONLY=0
TARGETS=()

# ---------------------------- parse arguments --------------------------------
while [ $# -gt 0 ]; do
  case "$1" in
    --format) FORMAT="${2:?--format needs a value}"; shift 2 ;;
    --engine) ENGINE="${2:?--engine needs a value}"; shift 2 ;;
    --check-only) CHECK_ONLY=1; shift ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*) echo "Unknown option: $1" >&2; exit 1 ;;
    *) TARGETS+=("$1"); shift ;;
  esac
done

if [ "${#TARGETS[@]}" -eq 0 ]; then
  echo "Error: no .puml files or directories indicated." >&2
  echo "Usage: render-plantuml.sh [--format png|svg] [--engine auto|plantuml|docker|jar] <file-or-dir>..." >&2
  exit 1
fi

# ------------------------- expand dirs to .puml files ------------------------
FILES=()
for t in "${TARGETS[@]}"; do
  if [ -d "$t" ]; then
    while IFS= read -r f; do FILES+=("$f"); done < <(find "$t" -type f -name '*.puml' | sort)
  elif [ -f "$t" ]; then
    FILES+=("$t")
  else
    echo "Error: not found: $t" >&2; exit 1
  fi
done
if [ "${#FILES[@]}" -eq 0 ]; then
  echo "Error: no .puml files matched the indicated targets." >&2; exit 1
fi

# --------------------------- locate a plantuml jar ---------------------------
find_jar() {
  if [ -n "${PLANTUML_JAR:-}" ] && [ -f "${PLANTUML_JAR}" ]; then echo "$PLANTUML_JAR"; return 0; fi
  local j
  j=$(find "$HOME/.cursor-server" "$HOME/.vscode-server" "$HOME/.vscode" \
        -iname 'plantuml*.jar' 2>/dev/null | head -n1)
  [ -n "$j" ] && { echo "$j"; return 0; }
  return 1
}

# ----------------------------- choose the engine -----------------------------
has() { command -v "$1" >/dev/null 2>&1; }
JAR=""
if [ "$ENGINE" = "auto" ]; then
  if has plantuml && has dot; then ENGINE="plantuml"
  elif has docker; then ENGINE="docker"
  elif has java && has dot && JAR=$(find_jar); then ENGINE="jar"
  else
    echo "Error: no rendering engine available." >&2
    echo "Install PlantUML+Graphviz, or Docker, or set \$PLANTUML_JAR (needs java+dot)." >&2
    exit 1
  fi
fi
[ "$ENGINE" = "jar" ] && [ -z "$JAR" ] && JAR=$(find_jar || true)

FLAG="-t${FORMAT}"
[ "$CHECK_ONLY" -eq 1 ] && FLAG="-checkonly"

echo ">> Engine: $ENGINE | Format: $FORMAT | Files: ${#FILES[@]}"

# ------------------------------- render pass ---------------------------------
STATUS=0
case "$ENGINE" in
  plantuml)
    plantuml "$FLAG" "${FILES[@]}" || STATUS=2
    ;;
  jar)
    [ -z "$JAR" ] && { echo "Error: no plantuml.jar found (set \$PLANTUML_JAR)." >&2; exit 1; }
    echo ">> Using jar: $JAR"
    java -jar "$JAR" "$FLAG" "${FILES[@]}" || STATUS=2
    ;;
  docker)
    has docker || { echo "Error: docker not available." >&2; exit 1; }
    # Mount the git top-level (or filesystem root as last resort) and translate
    # every target to a /data-relative path so PlantUML writes next to the source.
    MOUNT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
    if [ -z "$MOUNT" ]; then MOUNT=$(cd "$(dirname "${FILES[0]}")" && pwd); fi
    MAPPED=()
    for f in "${FILES[@]}"; do
      abs=$(cd "$(dirname "$f")" && pwd)/$(basename "$f")
      case "$abs" in
        "$MOUNT"/*) MAPPED+=("/data/${abs#"$MOUNT"/}") ;;
        *) echo "Error: '$f' is outside the mount root ($MOUNT). Run from inside the repo." >&2; exit 1 ;;
      esac
    done
    docker run --rm -v "$MOUNT":/data plantuml/plantuml "$FLAG" "${MAPPED[@]}" || STATUS=2
    ;;
  *)
    echo "Error: unknown engine '$ENGINE' (use auto|plantuml|docker|jar)." >&2; exit 1 ;;
esac

# ------------------------- report + basic validation -------------------------
if [ "$CHECK_ONLY" -eq 1 ]; then
  [ "$STATUS" -eq 0 ] && echo ">> Syntax OK (${#FILES[@]} files)." || echo ">> Syntax errors detected." >&2
  exit "$STATUS"
fi

echo ">> Generated:"
MISSING=0
for f in "${FILES[@]}"; do
  out="${f%.puml}.${FORMAT}"
  if [ -f "$out" ]; then
    size=$(wc -c < "$out" | tr -d ' ')
    echo "   OK  $out (${size} bytes)"
    # A near-empty PNG usually means a rendering/syntax error image.
    [ "$FORMAT" = "png" ] && [ "$size" -lt 1500 ] && { echo "   !!  suspiciously small — check for a PlantUML error image." >&2; STATUS=2; }
  else
    echo "   MISS $out (not produced)" >&2; MISSING=1; STATUS=2
  fi
done
[ "$MISSING" -eq 1 ] && echo ">> Some diagrams were not produced (likely syntax errors)." >&2

exit "$STATUS"
