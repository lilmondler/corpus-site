#!/usr/bin/env bash
# Зеркально залить этот репозиторий (готовую сборку сайта) в каталог www/ хостинга OVH по FTPS.
# Лишние файлы на хостинге удаляются: там лежит ровно эта версия. Пароль — только из переменной
# окружения (секрет GitHub), никогда в аргументах и в git.
#
#   OVH_FTP_HOST=ftp.clusterXXX.hosting.ovh.net OVH_FTP_USER=… OVH_FTP_PASSWORD=… ./deploy.sh [--dry-run]
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
REMOTE_DIR="${OVH_FTP_DIR:-www}"
DRY=""
[[ "${1:-}" == "--dry-run" ]] && DRY="--dry-run"

for var in OVH_FTP_HOST OVH_FTP_USER OVH_FTP_PASSWORD; do
  [[ -n "${!var:-}" ]] || { echo "Нет переменной $var" >&2; exit 2; }
done
[[ "$OVH_FTP_HOST" =~ ^[A-Za-z0-9.-]+$ ]] || { echo "Странный адрес FTP: $OVH_FTP_HOST" >&2; exit 2; }
# Каталог на хостинге — только простое имя: зеркало с --delete в корне снесло бы всё остальное.
[[ "$REMOTE_DIR" =~ ^[A-Za-z0-9_-]+(/[A-Za-z0-9_-]+)*$ ]] || { echo "Недопустимый OVH_FTP_DIR: $REMOTE_DIR" >&2; exit 2; }
command -v lftp >/dev/null || { echo "Нужен lftp" >&2; exit 2; }

export LFTP_PASSWORD="$OVH_FTP_PASSWORD"
lftp --env-password -u "$OVH_FTP_USER" "ftp://$OVH_FTP_HOST" <<EOF
set cmd:fail-exit yes
set ftp:ssl-allow yes
set ftp:ssl-force yes
set ftp:ssl-protect-data yes
set ssl:verify-certificate yes
set net:max-retries 3
set net:timeout 30
mirror --reverse --delete --verbose --parallel=4 \
  --exclude-glob .git/ --exclude-glob .github/ --exclude-glob .well-known/ --exclude-glob .ovhconfig \
  --exclude README.md --exclude deploy.sh --exclude .nojekyll \
  $DRY "$HERE/" "$REMOTE_DIR/"
bye
EOF
echo "Готово: https://moncorpus.fr/"
