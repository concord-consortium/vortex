import ExperimentSetup from "../../supports/elements/ExperimentSetup"

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
})