#!/sbin/sh
# $Date: 2017-06-27 14:18:56 +0300 (Tue, 27 Jun 2017) $
# $Id: patch.sh 8646 2017-06-27 11:18:56Z miheev $

ORIGPATH=`pwd`

# Путь, относительно которого берутся пути к модулям. Корень проекта.
ROOT="source/node_modules"
while [ ! -d "$ROOT" ]; do
    echo "? $ROOT"
    ROOT="../$ROOT"
done

# Путь к модифицируемому файлу
PATCHCD="enb/lib/server/middleware"

echo "patching in $ROOT/$PATCHCD"
cd "$ROOT/$PATCHCD"

# Модифицируемый файл
PATCHFILE="enb.js@1.5.1-lib-server-middleware-enb.diff"
echo "patching with $PATCHFILE"
cp "$ORIGPATH/$PATCHFILE" .
patch -lb < "$PATCHFILE"

# Модифицируемый файл
PATCHFILE="enb.js@1.5.1-lib-server-middleware-index-page.js.diff"
echo "patching with $PATCHFILE"
cp "$ORIGPATH/$PATCHFILE" .
patch -lb < "$PATCHFILE"

cd $ORIGPATH

