>
> $Date: 2017-07-13 19:13:07 +0300 (Thu, 13 Jul 2017) $
>
> $Id: README.md 8745 2017-07-13 16:13:07Z miheev $
>

Проект Вектор-Элемент
=====================

[R&D](README.RnD.md)
[Библиотеки и патчи](README.libs.md)
[Работа с серверами](README.server.md)
[Страницы в работе](README.pages.md)

Документация
------------

Основной документ (краткая информация):

    WEB_TINTS/source/README.md

Мануалы/описания:

    WEB_TINTS/_docs/BEM/!README/

Изменения в стандартных модулях и библиотеках:

    WEB_TINTS/_docs/BEM/!Patches/

TODO:

    WEB_TINTS/_docs/BEM/!TODO/
    WEB_TINTS/_docs/BEM/!TODO/!Common.md

Найденные ошибки:

    WEB_TINTS/_docs/BEM/!Bugs/

Конфигурация
------------

Проект:

    WEB_TINTS/source/package.json

Генератор bem:

    WEB_TINTS/source/gulpfile.config.yaml

Сервер:

    WEB_TINTS/release/core/scripts/php/app/config/config_constants.php
    WEB_TINTS/release/core/scripts/php/app/config/config.php

Конфигурация приложений phalcon

    WEB_TINTS/release/application/scripts/php/app/config/config.php

    WEB_TINTS/release/element-dc/scripts/php/app/config/config.php
    WEB_TINTS/release/element-tcm/scripts/php/app/config/config.php
    WEB_TINTS/release/element-umto/scripts/php/app/config/config.php

Служебные модули phalcon

    WEB_TINTS/release/core/scripts/php/app/library/Library/Cacher.php
    WEB_TINTS/release/core/scripts/php/app/library/Library/Helper.php

Сборка

    WEB_TINTS/source/.enb/make.js
    .enb/make.js

Проект

    WEB_TINTS/source/blocks/shared/project/__root/project__root.js
    WEB_TINTS/source/blocks/shared/project/__config/project__config.js
    WEB_TINTS/source/blocks/shared/project/__helpers/project__helpers.js
    WEB_TINTS/source/blocks/shared/project/project.deps.js

Расширение конфигурации проектав рантайм (пример):

    http://localhost:5590/WEB_TINTS/core/App.html?useSockets=true&catchSocketsError=true#tcm_Reports_efficiency

Системное

    C:/nginx-1.11.10/conf/nginx.conf
    C:/nginx-1.11.10/logs/error.log
    C:/_logs/nginx-error.log
    C:/Windows/php.ini
    C:/_logs/php.log
    C:/Windows/System32/drivers/etc/hosts
    C:/Apache24/conf
    C:/Apache24/conf/httpd.conf
    C:/Apache24/conf/extra/httpd-vhosts.conf

Контроллеры в работе
--------------------

    WEB_TINTS/release/core/scripts/php/app/controllers/
    WEB_TINTS/release/core/scripts/php/app/controllers/LayoutController.php
    WEB_TINTS/release/core/scripts/php/app/controllers/TCMAdministrationController.php
    WEB_TINTS/release/core/scripts/php/app/controllers/TCMAnalyticsController.php

Приложение
----------

Клиентский модуль:

    WEB_TINTS/source/blocks/shared/app/app.js

Мод с кодом для меню, навигации:

    WEB_TINTS/source/blocks/shared/app/_NavMenu/app_NavMenu.js

Основные зависимости приложения (в том числе, всё, что попадает в пакет App, должно быть перечислено тут):

    WEB_TINTS/source/blocks/shared/app/app.deps.js

Меню приложения:

    WEB_TINTS/release/core/scripts/php/app-config/appmenu.php

Описание страниц:

    WEB_TINTS/release/core/scripts/php/app-config/appdata.php

Разметка страницы
-----------------

    WEB_TINTS/source/blocks/shared/page/page.bemhtml

Ключевые модули
---------------

    WEB_TINTS/source/blocks/libs/requestor/requestor.js
    WEB_TINTS/source/blocks/libs/socket/socket.js

Страницы на сервере
-------------------

    WEB_TINTS/release/core/scripts/php/app-config/pages/
    WEB_TINTS/release/core/scripts/php/app-config/pages/Report.php
    WEB_TINTS/release/core/scripts/php/app-config/pages/AdminKO.php

    WEB_TINTS/source/pages/
    WEB_TINTS/source/pages/Report/Report.bemjson
    WEB_TINTS/source/pages/AdminKO/AdminKO.bemjson
    WEB_TINTS/source/pages/AdminOld/AdminOld.bemjson

Страницы в работе
-----------------

tcm_Reports_detailmove

    http://localhost:8080/pages/App/App.html#tcm_Reports_detailmove
    http://localhost:5590/WEB_TINTS/core/App.html#tcm_Reports_detailmove
    http://vektor.local/WEB_TINTS/core/App.html#tcm_Reports_detailmove

tcm_Reports_milage

    http://localhost:8080/pages/App/App.html#tcm_Reports_milage
    http://localhost:5590/WEB_TINTS/core/App.html#tcm_Reports_milage
    http://vektor.local/WEB_TINTS/core/App.html#tcm_Reports_milage

app:tcm

    http://localhost:8080/pages/App/App.html#app:tcm
    http://localhost:5590/WEB_TINTS/core/App.html#app:tcm
    http://vektor.local/WEB_TINTS/core/App.html#app:tcm

Локальные страницы

    WEB_TINTS/source/pages/Report/Report.bemjson
    http://localhost:8080/pages/Report/Report.html

    WEB_TINTS/source/pages/Test/Test.bemjson
    http://localhost:8080/pages/Test/Test.html

Блоки страниц:

    WEB_TINTS/source/blocks/custom/Report/Report.bemhtml
    WEB_TINTS/source/blocks/custom/Report/Report.js

Тестовые данные
---------------

См. папку с сохраняемыми серверными данными:

    WEB_TINTS/source/fake-data

Для отчётов по движению можно использовать:

    КО: x101xx180
    Начало периода: 28.11.2016 00:00
    Конец периода: 29.11.2016 00:00

Утилиты
-------

    http://www.csvjson.com/json_beautifier
    http://codebeautify.org/jsonviewer
    http://www.jsoneditoronline.org/

