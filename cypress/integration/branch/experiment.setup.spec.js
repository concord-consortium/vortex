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

    before(() => {
        cy.visit(url);
    });

    describe('Experiment Setup Defaults', () => {

        it("verifies presence of all default experiment options", () => {
            experimentSetup.getNewExperimentOption('Schoolyard Investigation')
                .should('be.visible')
            experimentSetup.getNewExperimentOption('Stream Study')
                .should('be.visible')
        })

        it("makes sure no experiments are saved to begin", () => {
            experimentSetup.getSavedExperimentLabel().should('not.exist')
        })

        it('verifies reset button does not appear', () => {
            experimentSetup.getResetDataButton().should('not.exist')
        })

    })

    describe("Tests School Yard Investigation", () => {

        it("create and setup a schoolyard investigation", () => {
            experimentSetup.openNewExperiment('Schoolyard Investigation')
            experimentSetup.getBackButton().should('be.visible').click()
            experimentSetup.getSavedExperimentLabel().should('exist').and('be.visible')
            experimentSetup.getExperiment('Schoolyard Investigation', 1)

        })
        it("edit experiment and verify changes", () => {
            experimentSetup.getExperiment('Schoolyard Investigation', 1).click()
            experimentSetup.getLabelTextBox().type(testLabel1A)
            experimentSetup.getGroupMembersTextBox().type(testGroupMembers)
            experimentSetup.getHeaderExperimentLabel(testLabel1A)
            experimentSetup.getBackButton().click()
            experimentSetup.getExperimentLabel(testLabel1A).should('be.visible')
        })
        it('verifies label changes/removal from experiement', () => {
            experimentSetup.getExperiment('Schoolyard Investigation', 1).click()
            experimentSetup.getLabelTextBox().clear()
            experimentSetup.getBackButton().click()
            experimentSetup.getExperimentLabel(testLabel1A).should('not.exist')
            experimentSetup.getExperiment('Schoolyard Investigation', 1).click()
            experimentSetup.getLabelTextBox().type(testLabel1B)
            experimentSetup.getBackButton().click()
            experimentSetup.getExperimentLabel(testLabel1B).should('be.visible')
        })
        it("resets all user experiments", () => {
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
        it("edit experiment and verify changes", () => {
            experimentSetup.getExperiment('Stream Study', 1).click()
            experimentSetup.getLabelTextBox().type(testLabel2)
            experimentSetup.getGroupMembersTextBox().type(testGroupMembers)
            // Is this a feature?
            // experimentSetup.getHeaderExperimentLabel(testLabel2)
            experimentSetup.getBackButton().click()
            // Is this a feature?
            // experimentSetup.getExperimentLabel(testLabel2).should('be.visible')
        })
        it("resets all user experiments", () => {
            experimentSetup.getResetDataButton().should('be.visible').click()
        })

    })

})