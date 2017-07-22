#!/sbin/sh
# $Date: 2017-04-16 18:25:00 +0300 (Sun, 16 Apr 2017) $
# $Id: patch.sh 8149 2017-04-16 15:25:00Z miheev $

ORIGPATH=`pwd`

# Путь, относительно которого берутся пути к модулям. Корень проекта.
ROOT="source/node_modules"
while [ ! -d "$ROOT" ]; do
    echo "? $ROOT"
    ROOT="../$ROOT"
done

# Путь к модифицируемому файлу
PATCHCD="enb-source-map/lib"

echo "patching in $ROOT/$PATCHCD"
cd "$ROOT/$PATCHCD"

# Модифицируемый файл
PATCHFILE="enb-source-map@1.9.0-file.js.diff"
echo "patching with $PATCHFILE"
cp "$ORIGPATH/$PATCHFILE" .
patch -lb < "$PATCHFILE"

# Модифицируемый файл
PATCHFILE="enb-source-map@1.9.0-utils.js.diff"
echo "patching with $PATCHFILE"
cp "$ORIGPATH/$PATCHFILE" .
patch -lb < "$PATCHFILE"

cd $ORIGPATH

