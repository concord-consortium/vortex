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

    it.only("collect time series data from (mock) sensor", () => {
      experimentSetup.openNewExperiment('Data Trial')
      
      sensorData.getExperimentOptionsMenu() // gets the click in the helper function
      sensorData.selectMenuOption('Connect')

      // Select and verify the "Mocked Sensor: Temperature" option
      sensorData.selectSensor('Temperature')
      cy.get('div.sensor-module-connectionLabel-vortex select')
          .should('have.value', '1')
      // Assert the connection status
      sensorData.getSensorConnectionStatus()
      .should('contain.text', 'Connected: Mocked Sensor')
      
      // select the sample rate
      sensorData.selectSample('100/sec')
      // TODO: add checks that time series data displays
      // and UI is disabled during time series checks
      // Blocker: PT #187949831
      // also fix expected to find element 5 error (probably just need x-1)
      for (let i = 0; i <= 5; i++) {
        sensorData.getDataTrialRow(i).within(() => {
            sensorData.getRecordButton().click()
            cy.wait(20000) // wait for new sensor values
        })
      }
    })
    // this is pasted code from above
    // it("edit experiment and verify changes", () => {
    //   experimentSetup.getExperiment('Stream Study', 1).click()
    //   experimentSetup.getExperimentNameSpan().click()
    //   experimentSetup.getNameInput().type(testLabel2)
    //   experimentSetup.getGroupMembersTextBox().type(testGroupMembers)
    //   experimentSetup.getSubheader(testLabel2)
    //   experimentSetup.getBackButton().click()
    //   experimentSetup.expandAllExperimentLabels()
    //   experimentSetup.getExperimentLabel(testLabel2).should('be.visible')
    // })

    // it("deletes Stream Study experiment", () => {
    //   experimentSetup.deleteExperiment()
    // })
  })
})