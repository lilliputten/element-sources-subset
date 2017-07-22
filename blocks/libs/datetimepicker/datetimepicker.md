>
> $Date: 2017-03-13 18:03:12 +0300 (Mon, 13 Mar 2017) $
>
> $Id: datetimepicker.md 7602 2017-03-13 15:03:12Z miheev $
>

datetimepicker
==============

Библиотека [jQuery DateTimePicker plugin v2.5.4](http://xdsoft.net/jqplugins/datetimepicker/)

Приниципиально меняется одна строка (см. `jquery.datetimepicker.no-folds.js` -- изменёныый файл без vim-folds-меток):

```
    $.datetimepicker && ( $.datetimepicker.dateHelper = dateHelper ); // XXX 2016.09.14, 15:50 -- export dateHelper
```

Подключается как ym-модуль -- инкапсулируем внутрь модуля `datetimepicker.js`

    WEB_TINTS/source/blocks/root/datetimepicker/datetimepicker.js

