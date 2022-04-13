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
