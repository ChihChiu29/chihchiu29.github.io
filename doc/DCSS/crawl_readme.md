## Compilation reference

- General instruction: https://github.com/ChihChiu29/crawl/blob/master/crawl-ref/INSTALL.md#msys2-recommended

- For Android: https://github.com/ChihChiu29/crawl/blob/master/crawl-ref/docs/develop/android.txt


## Preparation

- Clone the repository: `git clone git@github.com:crawl/crawl.git`
- Run `cd crawl/crawl-ref/source`
- Run `git submodule update --init`


## Modify

Open `crawl-ref/source/player.cc`

- No MP decrease, search for `dec_mp`

- Initial gold, search for `gold   `

- Level up every 2 level, search for `== 27`, then change the line with `manual_stat_level`

OR, you can copy the `mp_gold_level.patch` file to the git directory then `git apply mp_gold_level.patch`.


## Build

Under `crawl-ref/source`:

- For Windows: run `make package-windows-zips`

- For Android (only works on Linux): run ` make ANDROID=1 android`, then load into Android Studio to build
    - Note: Need to install a few deps before starting the build


## Install dependencies on MSYS2

- Search for libpng: `pacman -Ss libpng`, then install with `pacman -S mingw-w64-x86_64-libpng`

