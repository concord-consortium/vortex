# Vortex

## Demo URL

https://models-resources.concord.org/vortex/index.html

## Current Supported Devices

The data table component currently supports these devices:

- Sensor Tag cc2650 (small "green light" sensor)
- Sensor Tag cc1350 (small "red light" sensor)
- Multi-Sensor (bigger sensor)

## Url Params

When testing in the browser the following url params are available:

1. `?allowReset` - if present in query string the "Reset Local Data" button is shown under the experiment run list.  This param doesn't need a value.
2. `?mockSensor` - if present in query string the mock sensor is automatically used in the measurement tab. This param doesn't need a value.
3. `?showDevicePicker` - if present in query string the device picker is shown for the mock sensor. This param doesn't need a value.
4. `?enableSensor` - present in query string the "Show Sensor" button is shown in the LARA app.

## Development

### Building

### Everything

If you want to build everything run `npm run build`, it will create the files in the `dist` folder.

You *do not* need to build to deploy the code, that is automatic.  See more info in the Deployment section below.

#### Web Apps

If you want to build a local version run `npm run build:web`, it will create the files in the `dist` folder.

You *do not* need to build to deploy the code, that is automatic.  See more info in the Deployment section below.

#### Cordova Apps

Cordova maintains its own `package.json` in the `cordova-wrapper` folder and Cordova itself is a dev dependency in that folder.

The `cordova-wrapper` folder contains all the needed files to wrap the contents of the compiled output the `cordova-app` folder.

#### Initial Setup

To build for the various platforms perform the following steps once:

1. From the project root run `npm i` to install all the project dependencies
2. From the project root run `npm run build:cordova-app` to create the `dist/cordova-app` folder which is not under source control
3. `cd src/cordova-wrapper`
4. `npm i` to get the Cordova dependencies
5. `ln -s ../../dist/cordova-app/ www` to setup a link to the compiled Javascript app (the next 3 steps will fail if you don't do this)
6. `npm run cordova -- prepare browser` to download the browser platform
7. `npm run cordova -- prepare android` to download the Android platform
8. `npm run cordova -- prepare ios` to download the iOS platform
9. Setup your Android development environment and a default emulator and device as defined here:
   https://cordova.apache.org/docs/en/latest/guide/platforms/android/index.html#installing-the-requirements
10. Setup your iOS development environment as defined here:
   https://cordova.apache.org/docs/en/latest/guide/platforms/ios/index.html

#### Browser Testing

To test `cordova-wrapper` in the browser:

1. If needed, run `npm run build:cordova-app` in the project root to create the latest build.  You will need to do this whenever
   you make a change at the app in step 6 copies code when it starts and does not pickup changes to the code.
2. `cd src/cordova-wrapper`
3. `npm run run:browser` to run `cordova run browser` using the cordova dev dependency.

If you make any changes to the `cordova-app` code you run `npm run build:cordova-app` in the project root
and `npm run run:browser` in `cordova-wrapper` again in order to see the change.

#### Android Testing

To test `cordova-wrapper` in Android:

1. If needed, run `npm run build:cordova-app` in the project root to create the latest build.  You will need to do this whenever
   you make a change at the app in step 6 copies code when it starts and does not pickup changes to the code.
2. `cd src/cordova-wrapper`
3. `npm run run:android` to run `cordova run android` using the cordova dev dependency (runs in emulator)
4. `npm run run:android:device` to run `cordova run android --device` using the cordova dev dependency (runs on connected device)

If you make any changes to the `cordova-app` code you run `npm run build:cordova-app` in the project root
and `npm run run:android` in `cordova-wrapper` again in order to see the change.

#### iOS Testing

To test `cordova-wrapper` on iOS:

1. If needed, run `npm run build:cordova-app` in the project root to create the latest build.  You will need to do this whenever
   you make a change at the app in step 6 copies code when it starts and does not pickup changes to the code.
2. Open `src/cordova-wrapper/platforms/ios/Monitor Your World.xcworkspace` from XCode
5. In Xcode, the left hand side of the page gives you different views on the project. The folder icon gives a tree view.
   Select the folder icon and select the root Vortex node.
6. As long as you are logged in with a developer account that has permissions with the Apple developer account, you can go to
   the `Signing & Capabilities` section in the center of the screen (the text link near the top-center).
7. Check the box to `Automatically Manage Signing` and select the `Concord Consortium Inc.` team.
You should do this for both `Debug` and `Release` signing modes, then toggle off and on the "Automatically manage signing" to resolve any lingering error messages.
8. If this is the first time a device has been selected, you should be given the option to add the device to the list of approved devices.
   We have up to 100 devices - once we run out we need to remove old devices to add new.
9. Select your device from the top bar of the window, and you should be able to click the `Play` button to run with the Xcode debugger attached.
   Errors and exceptions should show up in the bottom panel while running.

If you make any changes to the `cordova-app` code you run `npm run build:cordova-app` in the project root,
then run `npm run cordova -- prepare ios` and run again in Xcode to see the change.

#### Cordova: Updating plugins and packages

Cordova can be quite sticky with plugins and packages, and updates to which plugins you are using may not show up. To clean up the
Cordova installation and start fresh (preserving project configuration settings for XCode etc.) run the following script:

1. `cd src/cordova-wrapper`
2. `./clean.sh`

This will backup configuration, then remove all the Cordova target platforms, re-prepare each of them, and restore configuration.

#### Troubleshooting iOS Build Issues
After a time, the build process for iOS can break. The `/cordova-wrapper/clean.sh` script will clean out old plugins and packages
and do a complete rebuild. If Xcode complains about duplicate declarations for some files, you may need to remove temporary files by deleting the `Monitor Your World-###` directory in:

`Macintosh HD/Users/[username]/Library/Developer/Xcode/DerivedData`

Then repeat the clean build process.

#### iOS plist file additions

There are additions defined in the config.xml for Cordova that modify the `Monitor Your World-Info.plist` file to add required descriptions about how we use Bluetooth and Camera.
If these settings are missing, you can add them manually as follows:
1. Edit `ios/Monitor Your World/Monitor Your World-Info.plist` in VSCode (easier than in XCode editor
2. Add the following to allow access to Bluetooth and Camera (insert both key-string pairs near the end of the file before the closing `</dict></plist>`)

```xml
  <key>NSBluetoothAlwaysUsageDescription</key>
  <string>This application uses bluetooth to find, connect and transfer data from Sensor Tag bluetooth devices</string>
  <key>NSBluetoothPeripheralUsageDescription</key>
	<string>This application uses bluetooth to find, connect and transfer data from Sensor Tag bluetooth devices</string>
  <key>NSCameraUsageDescription</key>
  <string>This application needs camera access to capture photographs and to scan barcodes to upload data</string>
</dict>
</plist>
```

### Notes

1. Make sure if you are using Visual Studio Code that you use the workspace version of TypeScript.
   To ensure that you are open a TypeScript file in VSC and then click on the version number next to
   `TypeScript React` in the status bar and select 'Use Workspace Version' in the popup menu.

## Deployment

Deployments are based on the contents of the /dist folder and are built automatically by GitHub Actions for each branch and tag pushed to GitHub.

Branches are deployed to `https://models-resources.concord.org/vortex/branch/<name>/`.

Tags are deployed to `https://models-resources.concord.org/vortex/version/<name>/`

You can view the status of all the branch and tag deploys [here](https://github.com/concord-consortium/vortex/actions).

The production release is available at `https://models-resources.concord.org/vortex/.

Production releases are done using a manual GitHub Actions workflow. You specify which tag you want to release to production and the workflow copies that tag's `index-top.html` to `https://models-resources.concord.org/vortex/index.html`.

See the CLUE [docs/deploy.md](https://github.com/concord-consortium/collaborative-learning/blob/master/docs/deploy.md) for more details (it uses the same process).

To deploy a production release:

1. Create `release-<version>` branch and commit changes, push to GitHub, create PR and merge
1. Test the master build at: https://models-resources.concord.org/vortex/index-master.html
1. Push a version tag to GitHub and/or use https://github.com/concord-consortium/vortex/releases to create a new GitHub release
1. Stage the release by running the [Release Staging Workflow](https://github.com/concord-consortium/vortex/actions/workflows/release-staging.yml) and entering the version tag you just pushed.
1. Test the staged release at https://models-resources.concord.org/vortex/index-staging.html
1. Update production by running the [Release Workflow](https://github.com/concord-consortium/vortex/actions/workflows/release.yml) and entering the release version tag.

## Updating Experiments

Each time the mobile app launches it downloads a json file which is an array of experiments and saves them to local storage.  If the version number of the experiments json file is greater than the mobile apps known max supported version an upgrade message is shown in the mobile interface.

By default the json is loaded from [https://models-resources.concord.org/vortex/data/experiments.json](https://models-resources.concord.org/vortex/data/experiments.json) which is the production version of the Vortex app.  For local testing you can override this url by setting the `updateUrl` localStorage variable.  During development you can set this to [https://localhost:8080/data/experiments.json](https://localhost:8080/data/experiments.json) to load the current version.  However, this is the same version that the app will build with so to test a true update you should update the json file outside the repo and host it there.

### Testing

Run `npm test` to run jest tests. Run `npm run test:full` to run jest and Cypress tests.

##### Cypress Run Options

Inside of your `package.json` file:
1. `--browser browser-name`: define browser for running tests
2. `--group group-name`: assign a group name for tests running
3. `--spec`: define the spec files to run
4. `--headed`: show cypress test runner GUI while running test (will exit by default when done)
5. `--no-exit`: keep cypress test runner GUI open when done running
6. `--record`: decide whether or not tests will have video recordings
7. `--key`: specify your secret record key
8. `--reporter`: specify a mocha reporter

##### Cypress Run Examples

1. `cypress run --browser chrome` will run cypress in a chrome browser
2. `cypress run --headed --no-exit` will open cypress test runner when tests begin to run, and it will remain open when tests are finished running.
3. `cypress run --spec 'cypress/integration/examples/smoke-test.js'` will point to a smoke-test file rather than running all of the test files for a project.

## License

Vortex is Copyright 2020 (c) by the Concord Consortium and is distributed under the [MIT license](http://www.opensource.org/licenses/MIT).

See license.md for the complete license text.
