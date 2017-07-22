>
> $Date: 2017-07-18 13:18:14 +0300 (Tue, 18 Jul 2017) $
>
> $Id: README.libs.md 8779 2017-07-18 10:18:14Z miheev $
>

Библиотеки и патчи
==================

Библиотечные модули
-------------------

Конфигурация библиотечных модулей задаётся в `project.config.libs` (см. `WEB_TINTS/source/blocks/shared/project/__config/project__config.js`).

### secure_ajax

Исходные файлы модуля лежат в папке

    WEB_TINTS/test/auth_cnt

Расположение модуля для загрузки задаётся в `project.config.libs`, загрузка производится с помощью модуля `loader`. См.

    WEB_TINTS/source/blocks/libs/secureAjax/secureAjax.js
    WEB_TINTS/source/blocks/libs/secureAjax/secureAjax.md

Адреса для локальных тестов:

    http://localhost/source/deps/secure_ajax/ajax.html
    http://localhost:8080/deps/secure_ajax/ajax.html

Изменения в стандартных модулях
-------------------------------

### jquery.nicescroll

Используется версия 3.7.5, патчинг не требуется. Не решена проблема обработки событий `mousedown` в выпадающих `select` (popup/menu).

См:

- [github inuyaksa/jquery.nicescroll: nicescroll plugin for jquery](https://github.com/inuyaksa/jquery.nicescroll)
- [How to use – Nicescroll jQuery Plugin](https://nicescroll.areaaperta.com/how-to-use/)
- [Code Examples – Nicescroll jQuery Plugin](https://nicescroll.areaaperta.com/demo/)

Файлы:

- WEB_TINTS/source/blocks/loaders/nicescroll/nicescroll.js
- WEB_TINTS/source/blocks/loaders/nicescroll/nicescroll.styl
- WEB_TINTS/source/blocks/root/menu/menu.bemhtml
- WEB_TINTS/source/blocks/root/menu/_nicescroll/menu_nicescroll.js
- WEB_TINTS/source/blocks/root/popup/popup.bemhtml
- WEB_TINTS/source/blocks/root/select/_nicescroll/select_nicescroll.bemhtml
- WEB_TINTS/source/blocks/root/select/_nicescroll/select_nicescroll.js

#### Старая версия (3.6.8):

Изменения требует библиотечный модуль `jquery.nicescroll`:

    WEB_TINTS/_docs/BEM/!Patches/jquery.nicescroll
    WEB_TINTS/_docs/BEM/!Patches/jquery.nicescroll/jquery.nicescroll.js.diff
    WEB_TINTS/source/libs/jquery.nicescroll/
    WEB_TINTS/source/libs/jquery.nicescroll/changelog_3.6.8.txt
    WEB_TINTS/source/libs/jquery.nicescroll/jquery.nicescroll.js
    WEB_TINTS/source/libs/jquery.nicescroll/jquery.nicescroll.min.js

Используется последняя (на 2017.03.10) версия 3.6.8. Для получения изменённой версии применяем патч в папке модуля. Если отсутствует неминифицированная версия, берём её из ветки master [github пакета](https://github.com/inuyaksa/jquery.nicescroll). Применение патча:

```shell
    WEB_TINTS/source/libs/jquery.nicescroll/$ patch -b < jquery.nicescroll.js.diff
    WEB_TINTS/source/libs/jquery.nicescroll/$ uglifyjs jquery.nicescroll.js -m > jquery.nicescroll.min.js
```

### datetimepicker

См.:

    WEB_TINTS/_docs/BEM/!Patches/datetimepicker/README.md
    WEB_TINTS/source/blocks/root/datetimepicker/
    WEB_TINTS/source/blocks/root/datetimepicker/jquery.datetimepicker.js
    WEB_TINTS/source/blocks/root/datetimepicker/datetimepicker.js

Библиотека [jQuery DateTimePicker plugin v2.5.4](http://xdsoft.net/jqplugins/datetimepicker/)

Приниципиально меняется одна строка (см. `jquery.datetimepicker.no-folds.js` -- изменёныый файл без vim-folds-меток):

```
    $.datetimepicker && ( $.datetimepicker.dateHelper = dateHelper ); // XXX 2016.09.14, 15:50 -- export dateHelper
```

Подключается как ym-модуль -- инкапсулируем внутрь модуля `datetimepicker.js` (`begin include:jquery.datetimepicker.js`)

    WEB_TINTS/source/blocks/root/datetimepicker/datetimepicker.js

