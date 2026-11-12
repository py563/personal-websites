# Per-site pins. Source this file; do not execute it.
# A variable already set in the environment wins, so one site can be
# rebuilt on a newer Hugo without moving the other pins:
#   HUGO_MEMOIRS=0.139.4 ./scripts/build-one.sh memoirs

: "${HUGO_PORTFOLIO:=0.108.0}"
: "${HUGO_TEACHING:=0.169.0}"
: "${HUGO_MEMOIRS:=0.114.0}"

: "${BASEURL_PORTFOLIO:=https://prajwalyashasvi.in/}"
: "${BASEURL_TEACHING:=https://teaching.prajwalyashasvi.in/}"
: "${BASEURL_MEMOIRS:=https://memoirs.prajwalyashasvi.in/}"

: "${PORT_PORTFOLIO:=1313}"
: "${PORT_TEACHING:=1314}"
: "${PORT_MEMOIRS:=1315}"

: "${NODE_TEACHING:=22}"
