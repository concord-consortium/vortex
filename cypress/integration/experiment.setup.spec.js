import ExperimentSetup from "../supports/elements/ExperimentSetup"

context("Testing Experiment Selection View", () => {

    const branch = "master"
    const url = "/mobile-app/"

    let experimentSetup = new ExperimentSetup();
    let testLabel1 = "WATERS Label Testing 1"
    let testLabel2 = "WATERS Label Testing 2"
    let testGroupMembers = "Ed, Edd, and Eddy"

    before(() => {
        cy.visit(url);
    });

    describe('Experiment Setup Process', () => {

        it("verifies presence of all default experiment options", () => {
            experimentSetup.getNewExperimentOption('Schoolyard Investigation')
                .should('be.visible')
            experimentSetup.getNewExperimentOption('Stream Study')
                .should('be.visible')
        })

        it("makes sure no experiments are saved to begin", () => {
            experimentSetup.getSavedExperimentLabel().should('not.exist')
        })

    })

    describe("Tests School Yard Investigation", () => {

        it("create and setup a schoolyard investigation", () => {
            experimentSetup.openNewExperiment('Schoolyard Investigation')
            experimentSetup.getBackButton().click()
            experimentSetup.getSavedExperimentLabel().should('exist').and('be.visible')
            experimentSetup.getExperiment('Schoolyard Investigation', 1)

        })
        it("edit experiment with new label to experiment", () => {
            experimentSetup.getExperiment('Schoolyard Investigation', 1).click()
            experimentSetup.getLabelTextBox().type(testLabel1)
            experimentSetup.getGroupMembersTextBox().type(testGroupMembers)
            experimentSetup.getBackButton().click()
        })
        it("returns to selection screen and checks for label", () => {
            experimentSetup.getResetDataButton().should('be.visible').click()
        })

    })

    describe("Tests Stream Study Investigation", () => {

        it("create and setup a stream study", () => {
            experimentSetup.openNewExperiment('Stream Study')
            experimentSetup.getBackButton().click()
            experimentSetup.getSavedExperimentLabel().should('exist').and('be.visible')
            experimentSetup.getExperiment('Stream Study', 1)

        })
        it("edit experiment with new label to experiment", () => {
            experimentSetup.getExperiment('Stream Study', 1).click()
            experimentSetup.getLabelTextBox().type(testLabel2)
            experimentSetup.getGroupMembersTextBox().type(testGroupMembers)
            experimentSetup.getBackButton().click()
        })
        it("returns to selection screen and checks for label", () => {
            experimentSetup.getResetDataButton().should('be.visible').click()
        })

    })

})