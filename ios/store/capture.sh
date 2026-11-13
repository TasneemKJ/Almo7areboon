#!/bin/zsh
# App Store screenshots from the real app on a 6.9" simulator (1320x2868), both languages.
# Needs a Debug build installed on the simulator (the test run builds it):
#   xcodebuild -project ios/Almo7areboon.xcodeproj -scheme Almo7areboon -destination "id=$UDID" -derivedDataPath /tmp/almo-dd build
#   xcrun simctl install $UDID /tmp/almo-dd/Build/Products/Debug-iphonesimulator/Almo7areboon.app
# Usage: ios/store/capture.sh <simulator UDID>
# Each scene launches the app with the Debug-only -almoDebugJS argument, which sets the language and a save, reloads
# once, then plays the scene by pressing the game's own buttons. Nothing is drawn on top of the captures.
set -e
UDID=$1; [ -n "$UDID" ] || { echo "usage: $0 <simulator UDID>"; exit 1; }
HERE=${0:a:h}; BUNDLE=Tas.Almo7areboon
SEED='{"version":2,"timeline":1,"age":0,"enemyAge":0,"coins":300,"cards":[],"unlocked":[true,true,true],"sound":false,"deployed":12,"kills":9,"wins":1,"played":true,"furthestBattle":1}'
xcrun simctl status_bar $UDID override --time 9:41 --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3 2>/dev/null || true

js() { # js <lang> <scene>
  cat <<EOF
(function(){var L='$1',S='$2',K='almo7areboon.save.v1';
if(!sessionStorage.getItem('shot')){sessionStorage.setItem('shot','1');localStorage.setItem('almo7areboon.lang.v1',L);localStorage.removeItem(K+'.backup');localStorage.setItem(K,'$SEED');location.reload();return;}
var tap=function(s){var b=document.querySelector(s);if(b&&!b.disabled)b.click();};
if(S==='camp'){setTimeout(function(){tap('#entry-secondary');},2500);return;}
if(S==='title')return;
setTimeout(function(){tap('#entry-play');},2500);
var i=0;setInterval(function(){tap('#unit-cards .unit-card[data-unit="'+([0,0,1,0,2][i++%5])+'"]');},1100);
})()
EOF
}
shot() { # shot <lang> <scene> <seconds> <file> [<seconds2> <file2>]
  xcrun simctl terminate $UDID $BUNDLE 2>/dev/null || true
  xcrun simctl launch $UDID $BUNDLE -almoDebugJS "$(js $1 $2)" >/dev/null
  sleep $3; mkdir -p "$HERE/screenshots/$1"; xcrun simctl io $UDID screenshot --type=png "$HERE/screenshots/$1/$4" >/dev/null
  if [ -n "$5" ]; then sleep $5; xcrun simctl io $UDID screenshot --type=png "$HERE/screenshots/$1/$6" >/dev/null; fi
}
for lang in en ar; do
  shot $lang battle 34 01-hold-the-gate.png 40 02-victory.png
  shot $lang camp 14 03-camp.png
  shot $lang title 12 04-title.png
done
xcrun simctl terminate $UDID $BUNDLE 2>/dev/null || true
xcrun simctl status_bar $UDID clear 2>/dev/null || true
ls -la "$HERE"/screenshots/*/
