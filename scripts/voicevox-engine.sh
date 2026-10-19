#!/usr/bin/env bash
set -euo pipefail

ENGINE="/Applications/VOICEVOX.app/Contents/Resources/vv-engine/run"
PORT="${VOICEVOX_PORT:-50021}"
HOST="127.0.0.1"
PIDFILE=".cache/voicevox-engine.pid"
LOGFILE=".cache/voicevox-engine.log"

wait_ready() {
  for _ in $(seq 1 120); do
    if curl -fsS -m 2 "http://${HOST}:${PORT}/version" >/dev/null 2>&1; then
      echo "engine ready: $(curl -fsS "http://${HOST}:${PORT}/version")"
      return 0
    fi
    sleep 1
  done
  echo "engine did not become ready; see ${LOGFILE}" >&2
  return 1
}

case "${1:-start}" in
  start)
    mkdir -p .cache
    if curl -fsS -m 2 "http://${HOST}:${PORT}/version" >/dev/null 2>&1; then
      echo "engine already running on ${PORT}"; exit 0
    fi
    [ -x "$ENGINE" ] || { echo "bundled engine not found at $ENGINE" >&2; exit 1; }
    # --load_all_models is deliberately OMITTED: with 44 characters that load is large and
    # slow. scripts/synthesize.ts calls POST /initialize_speaker once per distinct styleId
    # before its batch instead.
    # --disable_mutable_api is deliberately OMITTED: the pipeline may register product-name
    # readings in the user dictionary. Flip it on for any shared/CI engine.
    "$ENGINE" --host "$HOST" --port "$PORT" --output_log_utf8 \
      >"$LOGFILE" 2>&1 &
    echo $! > "$PIDFILE"
    wait_ready
    ;;
  stop)
    [ -f "$PIDFILE" ] && kill "$(cat "$PIDFILE")" 2>/dev/null || true
    rm -f "$PIDFILE"
    ;;
  wait) wait_ready ;;
  *) echo "usage: $0 {start|stop|wait}" >&2; exit 2 ;;
esac
