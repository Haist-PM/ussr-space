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
