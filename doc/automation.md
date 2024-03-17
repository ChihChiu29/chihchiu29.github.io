## Start Chrome with a prfile in Windows

From a Git shell:
* `/c/Program\ Files/Google/Chrome/Application/chrome.exe --profile-directory="Profile 15" https://inline.app/booking/-MeNcbDasiIykiow2Hfb:inline-live-2/-N3JQxh1vIZe9tECk0Pg?language=zh-tw`
* `/c/Program\ Files/Google/Chrome/Application/chrome.exe --profile-directory="Profile 15" --app="data:text/html,<html><body><script>window.moveTo(580,240);window.resizeTo(800,600);window.location='https://inline.app/booking/-MeNcbDasiIykiow2Hfb:inline-live-2/-N3JQxh1vIZe9tECk0Pg?language=zh-tw';</script></body></html>"`

Can use arguments:
* `-incognito`
* `--app=https://inline.app/booking/-MeNcbDasiIykiow2Hfb:inline-live-2/-N3JQxh1vIZe9tECk0Pg?language=zh-tw` start a website in app mode.
* `--window-size=800,600 --window-position=580,240`

Also see:
* https://peter.sh/experiments/chromium-command-line-switches/
* https://stackoverflow.com/questions/13436855/launch-google-chrome-from-the-command-line-with-specific-window-coordinates