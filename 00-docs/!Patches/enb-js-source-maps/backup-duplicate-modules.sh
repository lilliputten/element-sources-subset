#!/sbin/sh
# Проверяем дублирование модулей в зависимостях
# $Date: 2017-04-16 18:25:00 +0300 (Sun, 16 Apr 2017) $
# $Id: backup-duplicate-modules.sh 8149 2017-04-16 15:25:00Z miheev $

ORIGPATH=`pwd`

# Корень проекта.
ROOT="source/node_modules"
while [ ! -d "$ROOT" ]; do
    echo "? $ROOT"
    ROOT="../$ROOT"
done

# Добавяемая строка
BACKUP_POSTFIX="_BACKUP_"

cd $ROOT

for DIR in \
"enb-js/node_modules/enb-source-map" \
"enb-js/node_modules/source-map" \
"enb-source-map/node_modules/source-map" \
; do
    if [ -d "${DIR}" ]; then
        echo "Backup ${DIR}"
        mv -vf "${DIR}" "${DIR}${BACKUP_POSTFIX}"
    fi
done

