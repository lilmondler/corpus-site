# corpus — сайт moncorpus.fr

Готовая сборка публичного сайта corpus. **Исходники здесь не правят**: они живут в
`site/` основного репозитория [lilmondler/corpus](https://github.com/lilmondler/corpus),
а сюда сборка попадает скриптом `deploy/push-site.sh` оттуда.

Выкладка на хостинг OVH (moncorpus.fr): Actions → **deploy** → Run workflow. По умолчанию
пробный прогон; чтобы выложить, снимите галочку «Только показать, что изменится».
Секреты репозитория: `OVH_FTP_HOST`, `OVH_FTP_USER`, `OVH_FTP_PASSWORD` (Settings → Secrets → Actions).

Ссылки в HTML абсолютные от корня домена, поэтому на GitHub Pages
(lilmondler.github.io/corpus-site/) сайт больше не работает — Pages можно выключить.
