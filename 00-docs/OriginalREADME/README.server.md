>
> $Date: 2017-06-27 12:10:51 +0300 (Tue, 27 Jun 2017) $
>
> $Id: README.server.md 8640 2017-06-27 09:10:51Z miheev $
>

Работа с серверами
==================

Адреса для просмотра:

[Локальный сервер enb](http://localhost:8080/pages/App/App.html)
[Локальная копия plain](http://localhost/WEB_TINTS/core/App.html)
[Локальная копия nginx](http://localhost:5590/WEB_TINTS/release/core/App.html)

[Apache plain](http://youcomp.geyser.ru:8082/WEB_TINTS/core/App.html)
[Apache nginx](http://youcomp.geyser.ru:5590/WEB_TINTS/core/App.html)
[IIS plain](http://youcomp.geyser.ru:80/WEB_TINTS/core/App.html)
[IIS nginx](http://youcomp.geyser.ru:5591/WEB_TINTS/core/App.html)

[Remote Apache plain](http://195.133.216.10:8082/WEB_TINTS/core/App.html)
[Remote Apache nginx](http://195.133.216.10:5590/WEB_TINTS/core/App.html)
[Remote IIS plain](http://195.133.216.10:56010/WEB_TINTS/core/App.html)
[Remote IIS nginx](http://195.133.216.10:5591/WEB_TINTS/core/App.html)

Три приложения:

[ТЦМ](http://195.133.216.10:8082/WEB_TINTS/element-tcm)
[УМТО](http://195.133.216.10:8082/WEB_TINTS/element-umto)
[ЦОД](http://195.133.216.10:8082/WEB_TINTS/element-dc)

Релиз:

    http://youcomp.geyser.ru:8082/WEB_TINTS_R/core/App.html

Сервер с картами "Автоспутник":

    http://youcomp.geyser.ru:5588/api/json/navsys.api.map.drawTile/j7AX5tuobawjbB8/google/day/8/153/78

Удалённый просмотр логов:

[application](http://195.133.216.10:8082/WEB_TINTS/logs.php?logfile=application/scripts/php/app/logs/log.txt&clear=yes)
[element-tcm](http://195.133.216.10:8082/WEB_TINTS/logs.php?logfile=element-tcm/scripts/php/app/logs/log.txt&clear=yes)
[element-dc](http://195.133.216.10:8082/WEB_TINTS/logs.php?logfile=element-dc/scripts/php/app/logs/log.txt&clear=yes)
[element-umto](http://195.133.216.10:8082/WEB_TINTS/logs.php?logfile=element-umto/scripts/php/app/logs/log.txt&clear=yes)

Доступ к удалённому управлению:

[Apache](http://youcomp.geyser.ru:8082/WEB_TINTS/remote.php?log)
[Remote Apache](http://195.133.216.10:8082/WEB_TINTS/remote.php?log)

Обновить с командной строки:

    wget -qO- http://195.133.216.10:8082/WEB_TINTS/remote.php?update
    wget -SO- http://195.133.216.10:8082/WEB_TINTS/remote.php?update

Перегенерировать всё (включая перевыкладку библиотек и статики):

    wget -qO- http://195.133.216.10:8082/WEB_TINTS/remote.php?all

Перегенерировать только динамический контент:

    wget -qO- http://195.133.216.10:8082/WEB_TINTS/remote.php?remake

Файлы в проекте:

    WEB_TINTS/release/logs.php
    WEB_TINTS/release/remote.php

Команды удалённого управления:

- `?log` -- Последние записи в логе svn. Выводит 10 записей.
- `?phpinfo` -- Информация из phpinfo().
- `?update` -- Обновить репозиторий.
- `?commit` -- Зафиксить удалённые изменения (например, после генерации) в репозиторий.
- `?cleanup` -- Очистить состояние удалённого репозитория.
- `?clean` -- Очистить файлы сборщика, временные файлы, тестовые данные (команда `gulp cleanAll`).
- `?redis_flush` -- Очистить кеш redis.
- `?data` -- Создать и скачать архив с содержимым папки `sources/fake-data/`.
- `?lint` -- Обновить и запустить статический анализ кода (hint/lint).
- `?tests` -- Обновить и запустить статические тесты (specs).
- `?all` -- Обновить и перегенерировать проект.
- `?remake` -- Обновить и перегенерировать проект (без перезаписи библиотек).

