import ExperimentSetup from "../../supports/elements/ExperimentSetup"
import SensorData from "../../supports/elements/SensorData"

context("Testing Experiment Selection View", () => {

  //const branch = "master"
  const url = "/mobile-app/?mockSensor"

  let experimentSetup = new ExperimentSetup();
  let testLabel1A = "WATERS Label Testing 1"
  let testLabel1B = "WATERS Label Testing 2"
  let testLabel2 = "WATERS Label Testing 3"
  let testGroupMembers = "Ed, Edd, and Eddy"
  let testDay = "Tue"
  let studySite1 = "Study Site #1"
  let studySite2 = "Study Site #2"
  let defaultSchoolyardInvestigation = "Schoolyard Investigation #1"

  let sensorData = new SensorData();

  before(() => {
    cy.visit(url);
  });

  describe('Experiment Setup Defaults', () => {

    it("verifies presence of all default experiment options", () => {
      experimentSetup.getNewExperimentOption('Schoolyard Investigation').should('be.visible')
      experimentSetup.getNewExperimentOption('Stream Study').should('be.visible')
    })

    it("makes sure no experiments are saved to begin", () => {
      experimentSetup.getSavedExperimentLabel().should('not.exist')
    })

  })

  describe("Tests School Yard Investigation", () => {

    it("create and setup a schoolyard investigation", () => {
      experimentSetup.openNewExperiment('Schoolyard Investigation')
      experimentSetup.getBackButton().should('be.visible').click()
      experimentSetup.getSavedExperimentLabel().should('exist').and('be.visible')
      experimentSetup.getExperiment('Schoolyard Investigation', 1).should('be.visible')

    })
    it('verifies name changes', () => {
      experimentSetup.getExperiment('Schoolyard Investigation', 1).click()
      experimentSetup.getExperimentName(defaultSchoolyardInvestigation).should('be.visible')
      experimentSetup.getExperimentNameSpan().click()
      experimentSetup.getNameInput().type(testLabel1A)
      experimentSetup.getStudySiteDropDown().select(studySite1)
      experimentSetup.getBackButton().click()
      experimentSetup.getExperimentLabel(testLabel1A).should('exist')
    })
    it("edit experiment and verify changes", () => {
      experimentSetup.getExperiment('Schoolyard Investigation', 1).click()
      experimentSetup.getStudySiteDropDown().select(studySite1)
      experimentSetup.getGroupMembersTextBox().type(testGroupMembers)
      experimentSetup.getSubheader(studySite1)
      experimentSetup.getBackButton().click()
      experimentSetup.expandAllExperimentLabels()
      experimentSetup.getExperimentLabel(studySite1).should('exist')
    })

    it('verifies study site changes from experiement', () => {
      experimentSetup.getExperiment('Schoolyard Investigation', 1).click()
      experimentSetup.getStudySiteDropDown().select(studySite1)
      experimentSetup.getBackButton().click()
      experimentSetup.getExperiment('Schoolyard Investigation', 1).click()
      experimentSetup.getStudySiteDropDown().select(studySite2)
      experimentSetup.getBackButton().click()
      experimentSetup.expandAllExperimentLabels()
      experimentSetup.getExperimentLabel(studySite2).should('be.visible')
    })
    it("delete Schooylard Investigation", () => {
      experimentSetup.deleteExperiment()
    })

  })

  describe("Tests Stream Study Investigation", () => {

    it("create and setup a stream study", () => {
      experimentSetup.openNewExperiment('Stream Study')
      experimentSetup.getBackButton().click()
      experimentSetup.getSavedExperimentLabel().should('exist').and('be.visible')
      experimentSetup.getExperiment('Stream Study', 1)

    })
    it("edit experiment and verify changes", () => {
      experimentSetup.getExperiment('Stream Study', 1).click()
      experimentSetup.getExperimentNameSpan().click()
      experimentSetup.getNameInput().type(testLabel2)
      experimentSetup.getGroupMembersTextBox().type(testGroupMembers)
      experimentSetup.getSubheader(testLabel2)
      experimentSetup.getBackButton().click()
      experimentSetup.expandAllExperimentLabels()
      experimentSetup.getExperimentLabel(testLabel2).should('be.visible')
    })

    it("deletes Stream Study experiment", () => {
      experimentSetup.deleteExperiment()
    })
  })

  describe("Tests Data Trial", () => {

    it("collect time series data from (mock) sensor", () => {

      // Constants will check that the input fields are disabled
      const labelSelectors = [
        'input[placeholder="Label #1"]',
        'input[placeholder="Label #2"]',
        'input[placeholder="Label #3"]',
        'input[placeholder="Label #4"]',
        'input[placeholder="Label #5"]'
      ]
      // Open a new Data Trial
      experimentSetup.openNewExperiment('Data Trial')
      
      sensorData.getExperimentOptionsMenu() // gets the click in the helper function

      // Select and verify the "Mocked Sensor: Temperature" option
      cy.log('Select and verify mocked sensor')
      sensorData.selectMenuOption('Connect')
      sensorData.selectSensor('Temperature')
      cy.get('div.sensor-module-connectionLabel-vortex select')
        .should('have.value', '1')
      // Assert the connection status
      sensorData.getSensorConnectionStatus()
        .should('contain.text', 'Connected: Mocked Sensor')

      // Select the sample rate
      sensorData.selectSample('100/sec')

      // Start recording data trial
      sensorData.getRecordButton().first().click()
      // Check the data collection every 1 second for a total of 5 seconds
      // Note: after 5 sec Cypress starts failing the test because the timing
      // isn't perfectly synchronized. A duration of 5 seconds will ensure that  
      // the trial is at least starting.
      const checkTimes = [1, 2, 3, 4, 5]
      checkTimes.forEach((time) => {
        cy.wait(time * 100)
        cy.get('.data-table-field-module-sparkgraphContainer-vortex')
        .contains(`${time} sec`)
        .should('be.visible')
      })

      // Check that the selectors are disabled during collection run.
      labelSelectors.forEach((selector) => {
        cy.get(selector).should('be.disabled')
        // Check that the connected icon button is disabled
        cy.get('div.sensor-module-connectionLabel-vortex select').should('be.disabled')
        // Check that the sample rate dropdown is disabled
        cy.get('.sensor-module-tsvInfoRow-vortex select').should('be.disabled')
      })
      // Checks to make sure that the run automatically stops after the max time 
      // and final display is 10 sec
      cy.wait(10000)
      cy.get('.data-table-field-module-sparkgraphContainer-vortex')
        .contains(`10 sec`)
      
      // Checks that it's possible to stop recording in the middle of a time trial
      cy.log('checks that it is possible to stop recording in the middle of a time trial')
      sensorData.getRecordButton().last().click()
      labelSelectors.forEach((selector) => {
        cy.get(selector).should('be.disabled')
        // Check that the connected icon button is disabled
        cy.get('div.sensor-module-connectionLabel-vortex select').should('be.disabled')

        // Check that the sample rate dropdown is disabled
        cy.get('.sensor-module-tsvInfoRow-vortex select').should('be.disabled')
      })
      cy.wait(5000)
      sensorData.getRecordButton().last().click()

      // TODO: add checks that time series data displays
      // for all elements in the table elements
      // Blocker: PT #187949831
      // also fix expected to find element 5 error (probably just need x-1)
      //   for (let i = 0; i <= 5; i++) {
      //     sensorData.getDataTrialRow(i).within(() => {
      //         sensorData.getRecordButton().click()
      //         cy.wait(20000) // wait for new sensor values
      //     })
      //   }

      //   cy.log('Delete the trial run')
      //   The delete tests are not working now because Cypress won't 
      //   recognize the delete button. Putting this code here for now
      //   in case it's fixable
      //   sensorData.getRecordButton().first().click({force:true})
      //   cy.wait(1000)
      //       // Wait for the confirmation dialog to appear and verify the text
      //   // Check if the confirmation dialog is present and interact with it
      // // Intercept the window confirm dialog and automatically click "OK"
      //   cy.on('window:confirm', (txt) => {
      //     // Assertion to check the text of the confirmation dialog
      //     expect(txt).to.contains('delete trial? this will delete the trial')
      //     return true; // This will simulate clicking the "OK" button
      //   })

      //   // Checks to make sure that the top line was deleted and defaulted.
      //   cy.get('.data-table-field-module-sparkgraphContainer-vortex').first()
      //       .contains(`^0 sec`)
      //       .should('be.visible')
      //   cy.get(labelSelectors[0]).should('have.attr', 'placeholder', 'Label #1')

    })
    it("checks that labels can be renamed and retain new names after a data trial run", () => {
      cy.visit(url);
      // Define the label selectors and new labels
      const labelSelectors = [
        'input[placeholder="Label #1"]',
        'input[placeholder="Label #2"]',
        'input[placeholder="Label #3"]',
        'input[placeholder="Label #4"]',
        'input[placeholder="Label #5"]'
      ]
      const newLabels = [
        'New Label #1',
        'New Label #2',
        'New Label #3',
        'New Label #4',
        'New Label #5'
      ]
    
      // Open a new Data Trial
      experimentSetup.openNewExperiment('Data Trial')

      sensorData.getExperimentOptionsMenu() // gets the click in the helper function

      // Select and verify the "Mocked Sensor: Force" option
      // Used force sensor to vary it up for QA
      cy.log('Select and verify mocked sensor')
      sensorData.selectMenuOption('Connect')
      sensorData.selectSensor('Force')
      cy.get('div.sensor-module-connectionLabel-vortex select')
          .should('have.value', '0')
      // Assert the connection status
      sensorData.getSensorConnectionStatus()
      .should('contain.text', 'Connected: Mocked Sensor')

      // Select the sample rate
      sensorData.selectSample('20/sec')
    
      // Ensure the input fields are not disabled before the collection run and rename labels
      labelSelectors.forEach((selector, index) => {
        cy.get(selector)
          .should('not.be.disabled')
          .clear()
          .type(newLabels[index])
          .should('have.value', newLabels[index])
      })
    
      // Start the data collection
      sensorData.getRecordButton().first().click()
    
      // Check that the selectors are disabled during collection run
      // (this checks that the run is going)
      labelSelectors.forEach((selector) => {
        cy.get(selector).should('be.disabled')
      })
    
      // Wait for the data collection to go a bit (adjust time as necessary)
      cy.wait(5000)
      // stop the data collection
      sensorData.getRecordButton().first().click()
    
      // After the data collection, check that the labels retain their new names
      labelSelectors.forEach((selector, index) => {
        cy.get(selector)
          .should('not.be.disabled')
          .should('have.value', newLabels[index])
      })
    })
  })
})