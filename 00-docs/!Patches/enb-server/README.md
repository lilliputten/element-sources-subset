>
> $Date: 2017-06-27 14:18:56 +0300 (Tue, 27 Jun 2017) $
>
> $Id: README.md 8646 2017-06-27 11:18:56Z miheev $
>

Патчинг сервера разработки (enb server)
=======================================

Модифицируемые модули
---------------------

enb@1.5.1

    node_modules/enb/lib/server/middleware
    node_modules/enb/lib/server/middleware/enb.js
    node_modules/enb/lib/server/middleware/index-page.js

Патчится локальный пакет, для глобальных изменений см. 

    ~/AppData/Roaming/npm/node_modules/enb/lib/server/middleware

См. пример экспотируемых в глобальный (`GLOBAL.enbServerRequest`) скоуп из `enb.js` данных в `middleware.req.SAMPLE.js`.

