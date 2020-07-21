IOS='./platforms/ios'
IOS_backupfile='./ios_backup.tgz'

IOS_project='Monitor Your World.xcodeproj'
IOS_workspace='Monitor Your World.xcworkspace'
IOS_plist='Monitor Your World-Info.plist'

spacer='\n---------------------\n'

if [ -d "$IOS" ]; then
  echo "$IOS is a current build target. Backing up xcode configuration..."
  tar czf $IOS_backupfile "$IOS/$IOS_project" "$IOS/$IOS_workspace" "$IOS/Monitor Your World/$IOS_plist"
else
  echo "$IOS does not exist - likely has not been setup for deployment"
fi
echo $spacer
echo "Removing previous build targets..."
rm -rf node_modules
rm -rf plugins
rm -rf platforms
echo $spacer
echo "Preparing Corova platforms..."
cordova prepare ios
cordova prepare android
cordova prepare browser
echo $spacer
# if [ -f "$IOS_backupfile" ]; then
#   echo "Restoring xcode configuration..."
#   tar xzf $IOS_backupfile
#   rm $IOS_backupfile
# fi
echo "Done!"