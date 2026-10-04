# Источники графики и лицензии

## Земля
- earth-day.jpg: NASA Earth Observatory / Blue Marble: Next Generation (August 2004), Reto Stöckli, NASA GSFC. Исходная карта: https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73776/world.topo.bathy.200408.3x5400x2700.jpg
- Страница проекта: https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/
- Оптимизация: 5400×2700 → 4096×2048 JPEG. Это композит спутниковых наблюдений, не изображение Земли в 1957 году. Карта шероховатости океана/суши вычислена из цвета исключительно для визуализации; не научный геофизический продукт.

## Облака
- earth-clouds.jpg: NASA Goddard Space Flight Center, Reto Stöckli; enhancements by Robert Simmon. NASA Blue Marble clouds composite (2002), 2048×1024.
- Исходник: https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg
- Запись: https://visibleearth.nasa.gov/images/57747/blue-marble-clouds/77558l
- JPEG оптимизирован. Яркость использована как alpha map на отдельной сфере. Это исторический композит, не актуальная погода.

NASA imagery is generally not subject to copyright in the United States; educational/informational use is permitted subject to the NASA media guidelines. No NASA logo or endorsement is implied. https://www.nasa.gov/nasa-brand-center/images-and-media/

## Модели аппаратов
Авторские процедурные технические реконструкции. Не точные CAD-модели: упрощены крепления и детали, масштабы орбитальных объектов намеренно различаются для читаемости. Никакие сторонние GLB/GLTF не используются.
- Спутник-1: корпус 58 см, четыре стержневые антенны двух длин; NASA Dawn of the Space Age: https://www.nasa.gov/history/dawn-of-the-space-age/
- Восток: сферический спускаемый аппарат и приборный отсек; Smithsonian National Air and Space Museum: https://airandspace.si.edu/collection-objects/model-vostok-1-spacecraft/nasm_A19700319000
- Схема «Восхода-2» использует общие очертания капсулы, добавляет шлюз и космонавта, не заявляет точность всех узлов.
- Луна-9: открытая посадочная капсула с четырьмя лепестками и телевизионной системой, NASA technical report: https://ntrs.nasa.gov/api/citations/19700012121/downloads/19700012121.pdf
- Венера-9: посадочная опора, герметичный корпус, тормозной диск, камеры. NASA PDS: https://pds.nasa.gov/ds-view/pds/viewContext.jsp?identifier=urn%3Anasa%3Apds%3Acontext%3Ainstrument_host%3Aspacecraft.v9&version=1.1 and structural reference: https://ntrs.nasa.gov/citations/20170002533

## Библиотеки
Three.js 0.180.0 — MIT License; copyright three.js authors. License retained as THREE-LICENSE.txt.
Esbuild 0.25.10 — MIT License; build-time only.

## Луна, Венера и Марс (третий проход)

- `moon.jpg`, `mars.jpg`, `venus.jpg`: Solar System Scope, карты 2048×1024. Венера использует карту атмосферы, не изображение поверхности.
- Каталог и авторство: https://edu.solarsystemscope.com/textures/
- Лицензия: Creative Commons Attribution 4.0 International, https://creativecommons.org/licenses/by/4.0/
- Исходные файлы: https://www.solarsystemscope.com/textures/download/2k_moon.jpg , https://www.solarsystemscope.com/textures/download/2k_mars.jpg , https://www.solarsystemscope.com/textures/download/2k_venus_atmosphere.jpg
- Карты сохранены локально без изменения разрешения. Bump-рельеф Луны и Марса оценён по яркости цветовой карты для выразительности; это не высотная модель. Полярные области Марса входят в цветовую карту.

## Новые технические реконструкции

- «Восход-2»: общая геометрия семейства «Восток», надувной шлюз «Волга» с кольцами и газовыми баллонами, космонавт и фал. NASA mission report: https://sma.nasa.gov/SignificantIncidents/assets/spaceflight-mission-report_-voskhod-2.pdf
- «Луноход-1»: корпус, восемь колёс, открытая солнечная крышка, камеры и антенны. NASA: https://science.nasa.gov/image-article/apod-1996-january-13-lunokhod-1-moon-robot/ ; техническая справка: https://ntrs.nasa.gov/api/citations/20000025059/downloads/20000025059.pdf
- «Марс-3»: посадочная сфера, четыре опорных лепестка, антенны и условный парашют. NASA: https://science.nasa.gov/resource/could-this-be-the-mars-soviet-3-lander/ ; результаты миссии: https://www.giss.nasa.gov/tools/mars24/help/landers.html
- «Салют-1» и «Мир»: NASA Mir Hardware Heritage, https://sma.nasa.gov/SignificantIncidents/assets/mir-hardware-heritage.pdf . У «Мира» показаны базовый блок, «Квант», «Квант-2» и «Кристалл» (советский этап). Стыковочная механика и мелкие приборы упрощены; модули «Спектр» и «Природа» отсутствуют.

## Шрифт

Manrope, Mikhail Sharanda и соавторы, переменный шрифт с кириллицей. Локальный файл `Manrope.ttf` из официального каталога Google Fonts: https://github.com/google/fonts/tree/main/ofl/manrope . SIL Open Font License 1.1 сохранена в `Manrope-LICENSE.txt`.

## Условный масштаб движения

Автоматическое вращение и движение от прокрутки художественно ускорены и не являются симуляцией времени. Наклоны: Земля 23,44°, Луна 6,68° относительно эклиптики, Марс 25,19°. Для Венеры использована эквивалентная запись оси 2,64° с обратным направлением вращения вместо 177,36° с прямым. Орбита спутника, взаимные масштабы аппаратов и планет, спуск и присоединение модулей условны.
