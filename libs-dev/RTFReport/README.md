# RTFReport

Структура папок
---------------

- **node-rtf**: Библиотека `git@github.com:lilliputten/node-rtf.git`
- **dist**: Бандл для использования в коде. Для генерации использовать `npm run make` или `webpack`.
- **demo**: Тесты
- **docs**: Документация.

Расположение связанных объектов в проекте:
------------------------------------------

#### Библиотека jsrtf.js: создание rtf на клиенте

- [Библиотека jsrtf](WEB_TINTS/source/libs-dev/jsrtf)
- [Оно же на github](https://github.com/lilliputten/jsrtf)

В ней ничего править не надо -- используется как библиотека в чистом виде. В будущем, возможно, будет включена в RTFReport как зависимость. Глюки и пожелания к доработке направлять [igor@lilliputten.ru](mailto:igor@lilliputten.ru).

- [README](WEB_TINTS/source/libs-dev/jsrtf/README.md)

Примеры:

- [Минимальный пример создания RTF](WEB_TINTS/source/libs-dev/jsrtf/demo/simple-demo.js)
- [Более сложный пример](WEB_TINTS/source/libs-dev/jsrtf/demo/complex-demo.js)

(Возможно, позже надо будет выделить в отдельный модуль генерацию PDF).

Привязка функционала экспорта находится в [Report::Export](WEB_TINTS/source/blocks/custom/Report/__Export/Report__Export.js) (см., напр., метод `saveRtfReport` или `savePdfReport`).

#### RTFReport.js: обёртка над библиотекой (логика обработки данных)

[Обёртка RTFReport.js](WEB_TINTS/source/libs-dev/RTFReport/RTFReport.js)

Прослойка между интерфейсом и `jsrtf`. Проходит по набору данных и генерит документ на его основе. 

Реализована часть алогоритма обхода, скопированная из серверного кода. Спускается вплоть до уровней `Group` или `Title`. Заголовок выводится б.-м. как дожно быть, вместо групп вывалиается дамп данных, которые должны проматриваться далее.

См. старый php код в [Library/TCMAnalytics/RTFReport](WEB_TINTS/release/core/scripts/php/app/library/Library/TCMAnalytics/RTFReport.php) (Выделено в отдельный библиотечный класс из [TCMAnalyticsController](WEB_TINTS/release/core/scripts/php/app/controllers/TCMAnalyticsController.php) )


Файлы:
------

- **RTF.js**: Переопределение базового пакета node_modules/rtf/
- **RTFReport.js**: YM-модуль генерации документов отчёта.
- **webpack.config.js**: Конфигруация сборщика кода в production.

При добавлении в svn игнорируем:
--------------------------------

- demo/.results/
- node_modules/
- node-rtf/.git/
- node-rtf/node_modules/

Примеры
-------

- [Создание Rtf файла, используя данные из базы](http://jdevelop.info/articles/html-css-js/345-sozdanie-rtf-fajla-ispolzuya-dannye-iz-bazy)

Прочее
------

- [webpack dev server](http://webpack.github.io/docs/webpack-dev-server.html#hot-mode)

Команды
-------

Установить зависимости и node-rtf (postinstall):

```shell
npm install
```
Создать бандл (в папке `dist`):

```shell
npm run make --silent
```
Локальный запуск в тестовом режиме:
```shell
npm run demo --silent
```

