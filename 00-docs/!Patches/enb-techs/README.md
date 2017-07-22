>
> $Date: 2017-03-12 19:18:00 +0300 (Sun, 12 Mar 2017) $
>
> $Id: README.md 7584 2017-03-12 16:18:00Z miheev $
>

enb-techs
=========

Кастомные технологии для получения специфических (для **Vektor/Element**) результатов обработки исходных материалов.

Файлы
-----

Получение JSON-слепка контента страницы для последующей динамической загрузки и рендеринга:

    WEB_TINTS/source/.enb/techs/bemjson-to-json.js

Переупаковка клиентских технологий (bemhtml.js, browser.js, styles.css) с учётом фильтрации для SHARED/CUSTOM пакетов, с удалением sourcemap, заменой/добавлением обёрток (напр., `BEMHTML.compile` для bemhtml.js):

    WEB_TINTS/source/.enb/techs/enb-repack-bemhtml.js
    WEB_TINTS/source/.enb/techs/enb-repack-browser.js
    WEB_TINTS/source/.enb/techs/enb-repack-styles.js

