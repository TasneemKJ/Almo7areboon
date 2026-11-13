#!/bin/zsh
# App Store screenshots and the two IAP review cards from the real app on a 6.9" simulator (1320x2868), both languages.
# Needs a Debug build installed on the simulator:
#   npm run build
#   xcodebuild -project ios/Almo7areboon.xcodeproj -scheme Almo7areboon -destination "id=$UDID" -derivedDataPath /tmp/almo-dd build
#   xcrun simctl install $UDID /tmp/almo-dd/Build/Products/Debug-iphonesimulator/Almo7areboon.app
# Usage: ios/store/capture.sh <simulator UDID>
# Each scene launches the app with the Debug-only -almoDebugJS argument, which sets the language and a save, reloads
# once, then plays the scene by pressing the game's own buttons (polling until each one is on screen and enabled).
# Nothing is drawn on top of the captures.
set -e
UDID=$1; [ -n "$UDID" ] || { echo "usage: $0 <simulator UDID>"; exit 1; }
HERE=${0:a:h}; BUNDLE=Tas.Almo7areboon
SEED1='{"version":2,"timeline":1,"age":0,"enemyAge":0,"coins":300,"cards":[],"unlocked":[true,true,true],"sound":false,"deployed":12,"kills":9,"wins":1,"played":true,"furthestBattle":1}'
SEED2='{"version":2,"timeline":1,"age":1,"enemyAge":1,"coins":900,"cards":[],"unlocked":[true,true,true],"sound":false,"deployed":60,"kills":48,"wins":4,"played":true,"furthestBattle":1}'
xcrun simctl status_bar $UDID override --time 9:41 --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3 2>/dev/null || true

js() { # js <lang> <scene> <seed>
  cat <<EOF
void 0;(function(){var L='$1',S='$2',K='almo7areboon.save.v1';
if(!sessionStorage.getItem('shot')){sessionStorage.setItem('shot','1');localStorage.setItem('almo7areboon.lang.v1',L);localStorage.removeItem(K+'.backup');localStorage.setItem(K,'$3');location.reload();return;}
var tap=function(s){var b=document.querySelector(s);if(b&&!b.disabled&&b.getClientRects().length>0){b.click();return true;}return false;};
var seq=function(steps,then){var i=0,h=setInterval(function(){if(i>=steps.length){clearInterval(h);if(then)then();return;}if(tap(steps[i]))i++;},1800);};
setInterval(function(){var a=document.activeElement;if(a&&a!==document.body&&a.blur)a.blur();},400);
if(S==='title')return;
if(S==='camp'){seq(['#entry-secondary']);return;}
if(S==='store'){seq(['#entry-settings','.preferences-store [data-command="full-journey"]']);return;}
if(S==='lamp'){seq(['#entry-settings','.preferences-store [data-command="lamplighter"]']);return;}
seq(['#entry-play'],function(){var i=0,started=false;setInterval(function(){if(!started&&tap('#ready [data-command="start"]'))started=true;tap('#unit-cards .unit-card[data-unit="'+([0,0,1,0,2][i++%5])+'"]');},1100);});
})()
EOF
}
shot() { # shot <lang> <scene> <seed> <dir> <seconds> <file> [<seconds2> <file2>]
  xcrun simctl terminate $UDID $BUNDLE 2>/dev/null || true
  xcrun simctl launch $UDID $BUNDLE -almoDebugJS "$(js $1 $2 $3)" >/dev/null
  mkdir -p "$HERE/$4"
  sleep $5; xcrun simctl io $UDID screenshot --type=png "$HERE/$4/$6" >/dev/null 2>&1
  if [ -n "$7" ]; then sleep $7; xcrun simctl io $UDID screenshot --type=png "$HERE/$4/$8" >/dev/null 2>&1; fi
}
for lang in en ar; do
  shot $lang title $SEED1 screenshots/$lang 16 1-dusk-village.png
  shot $lang battle $SEED1 screenshots/$lang 36 2-hold-the-gate.png 40 3-victory.png
  shot $lang camp $SEED1 screenshots/$lang 18 4-camp.png
  shot $lang battle $SEED2 screenshots/$lang 34 5-olive-terraces.png
done
shot ${REVIEW_LANG:-en} store $SEED1 review 18 store-card.png
shot ${REVIEW_LANG:-en} lamp $SEED1 review 18 lamplighter-card.png
xcrun simctl terminate $UDID $BUNDLE 2>/dev/null || true
xcrun simctl status_bar $UDID clear 2>/dev/null || true
ls -la "$HERE"/screenshots/*/ "$HERE"/review/
