#!/usr/bin/bash

for x in {0..1500..150}
  do 
  for y in {0..500..1000}
    do
      # echo $x,$y
      /c/Program\ Files/Google/Chrome/Application/chrome.exe --profile-directory="Profile 15" --app="data:text/html,<html><body><script>window.resizeTo(300,1200);window.moveTo($x,$y);window.location='https://inline.app/booking/-MeNcbDasiIykiow2Hfb:inline-live-2/-N3JQxh1vIZe9tECk0Pg?language=zh-tw';</script></body></html>"

      # Test
      # /c/Program\ Files/Google/Chrome/Application/chrome.exe --profile-directory="Profile 6" --app="data:text/html,<html><body><script>window.resizeTo(300,800);window.moveTo($x,$y);window.location='https://inline.app/booking/-MeNcbDasiIykiow2Hfb:inline-live-2/-N04NZLqRzkSAM-EjB-5?language=zh-tw';</script></body></html>"
    done
  done