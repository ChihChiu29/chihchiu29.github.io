## Compilation reference

- General instruction: https://github.com/ChihChiu29/crawl/blob/master/crawl-ref/INSTALL.md#msys2-recommended

- For Android: https://github.com/ChihChiu29/crawl/blob/master/crawl-ref/docs/develop/android.txt


## Modify

Open `crawl-ref/source/player.cc`

- No MP decrease, search for `dec_mp`

- Initial gold, search for `gold   `

- Level up every 2 level, search for `== 27`, then change the line with `manual_stat_level`


## Build

Under `crawl-ref/source`, run `make package-windows-zips`