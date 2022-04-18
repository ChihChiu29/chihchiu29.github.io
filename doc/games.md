# Heroes of Three Kingdom 7

* Starting DPI issue: compatibility > change high DPI > override DPI (application)


# San11 PK resolution issue

* Game configs are in registry: HKEY_CURRENT_USER\Software\KOEI\San11PK Tc

* Game save files are in: Documents\KOEI\San11PK Tc

* Use windowed mode, compatibility chose override DPI with system, or check program DPI fix checkbox.


# San9 PK issues

* Run `Regme_San9PK.exe` first. It adds `HKEY_CURRENT_USER\SOFTWARE\KOEI\San9PK Tc\Install\InstallInfo` to current path, like `E:\Games\AA\San9PK\`.

* Use a `.reg` file with following to force San9 (and PK) to fullscreen:
```
REGEDIT4
[HKEY_CURRENT_USER\Software\Koei\San9 Tc\Configs]
"FullScreen"=dword:00000000
```

* Use compatibility > change high DPI > override DPI (application)


# Yuzu apply mod

From: https://www.reddit.com/r/yuzu/comments/gml5gw/where_to_place_the_mods/

Right click "open mod location", then put it under `<location itself> - <mod folder> - <exefs>`, examples:

```
...\AppData\Roaming\yuzu\load\0100ABF008968000\Pokemon-Sword-Wifi-Fix\exeFS\wifi-fix.pchtxt
...\AppData\Roaming\yuzu\load\0100ABF008968000\No Outlines\romfs\system_resource\shader\outline.bnsh
...\AppData\Roaming\yuzu\load\0100ABF008968000\force-max-resolution\exefs\1.0.0.pchtxt
```
