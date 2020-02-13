class ExperimentSetup {
    getNewExperimentOption(option) {
        return cy.get('.experiment-picker-item-module-item-vortex').contains(option)
    }
    openNewExperiment(option) {
        return this.getNewExperimentOption(option).click({force:true})
    }
    getSavedExperimentLabel() {
        return cy.contains('My Saved Experiments')
    }

    getSavedExperiments() {
        return cy.get('.run-picker-module-run-vortex')
    }

    getExperiment(investigationType, index) {
        return this.getSavedExperiments().contains(investigationType + " #" + index)
    }

    getExperimentLabel(text) {
        return cy.get('.run-info-module-runInfo-vortex').contains(text)
    }

    getHeaderExperimentLabel(label) {
        return cy.get('.experiment-wrapper-module-headerTitle-vortex').contains(label)
    }

    getResetDataButton() {
        return cy.get('button')
    }

    // Label Tab UI selectors needed

    getBackButton() {
        return cy.get('.experiment-wrapper-module-headerBackIcon-vortex')
    }

    getStudySiteDropDown() {
        return cy.get('.form-control#root_studySite')
    }

    getLabelTextBox() {
        return cy.get('.form-control#root_label').focus()
    }

    getGroupMembersTextBox() {
        return cy.get('.form-control#root_groupMembers').focus()
    }

}
export default ExperimentSetup;