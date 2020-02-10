# Vortex

## Development

### Building

#### Web Apps

If you want to build a local version run `npm run build`, it will create the files in the `dist` folder.
You *do not* need to build to deploy the code, that is automatic.  See more info in the Deployment section below.

#### Cordova Apps

Cordova maintains its own `package.json` in the `cordova-wrapper` folder and Cordova itself is a dev dependency in that folder.

The `cordova-wrapper` folder contains all the needed files to wrap the contents of the compiled output the `cordova-app` folder.

#### Browser Testing

To test `cordova-wrapper` in the browser:

1. Run `npm run build` in the project root to create the dist/cordova-app/ content which is not under source control.  You will need to do this whenever
   you make a change at the app in step 5 copies code when it starts and does not pickup changes to the code.
2. `cd cordova-wrapper`
3. `npm i` ONCE to get dependencies
4. `ln -s ../../dist/cordova-app/ www` ONCE to setup a link to the compiled Javascript app 
5. `npm run cordova -- prepare browser` ONCE to download the browser platform
5. `npm run run:browser` to run `cordova run browser` using the cordova dev dependency.

If you make any changes to the `cordova-app` code you run `npm run build` in the project root
and `npm run run:browser` in `cordova-wrapper` again in order to see the change.

#### Android Testing

To test `cordova-wrapper` in Android:

1. Setup your Android development environment and a default emulator and device as defined here:
   https://cordova.apache.org/docs/en/latest/guide/platforms/android/index.html#installing-the-requirements
2. Run steps 1 to 4 in the browser testing section (building to adding symlink)
3. `npm run cordova -- prepare android` ONCE to download the android platform
4. `npm run run:android` to run `cordova run android` using the cordova dev dependency (runs in emulator)
5. `npm run run:android:device` to run `cordova run android --device` using the cordova dev dependency (runs on connected device)

If you make any changes to the `cordova-app` code you run `npm run build` in the project root
and `npm run run:android` in `cordova-wrapper` again in order to see the change.

### Notes

1. Make sure if you are using Visual Studio Code that you use the workspace version of TypeScript.
   To ensure that you are open a TypeScript file in VSC and then click on the version number next to
   `TypeScript React` in the status bar and select 'Use Workspace Version' in the popup menu.

## Deployment

*TODO* Set up Travis Deployment

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
