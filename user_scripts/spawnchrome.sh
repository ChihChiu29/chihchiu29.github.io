#!/usr/bin/bash

for x in {0..1200..300}
  do 
  for y in {0..600..300}
    do
      # echo $x,$y
      /c/Program\ Files/Google/Chrome/Application/chrome.exe --profile-directory="Profile 15" --app="data:text/html,<html><body><script>window.resizeTo(300,400);window.moveTo($x,$y);window.location='https://inline.app/booking/-MeNcbDasiIykiow2Hfb:inline-live-2/-N3JQxh1vIZe9tECk0Pg?language=zh-tw';</script></body></html>"
    done
  done