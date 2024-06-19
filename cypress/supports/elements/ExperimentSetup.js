class ExperimentSetup {

    // New Experiments

    getNewExperimentOption(option) {
        return cy.get('.experiment-picker-item-module-item-vortex').contains(option)
    }
    openNewExperiment(option) {
        return this.getNewExperimentOption(option).click({ force: true })
    }

    // Saved Experiments Header

    getSavedExperimentLabel() {
        return cy.contains('My Saved Experiments')
    }

    getSavedExperiments() {
        return cy.get('.run-picker-module-runContainer-vortex')
    }

    // Experiments

    getExperiment(investigationType, index) {
        return this.getSavedExperiments().contains(investigationType + " #" + index)
    }

    getExperimentLabel(text) {
        return cy.get('.run-info-module-runInfo-vortex').contains(text)
    }

    expandAllExperimentLabels() {
        return cy.get('.run-picker-module-expandToggle-vortex').click({ multiple: true })
    }

    deleteExperiment() {
        return cy.get('.run-picker-module-menuContainer-vortex').click().then(() => {
            cy.get('.menu-module-menu-vortex').contains('Delete').click()
        })
    }

    // Label Tab UI selectors needed

    getBackButton() {
        return cy.get('.experiment-wrapper-module-headerBackIcon-vortex')
    }

    getNameInput() {
      return cy.get('.experiment-wrapper-module-name-vortex input').focus()
    }

    getExperimentNameSpan() {
      return cy.get('.experiment-wrapper-module-name-vortex')
    }

    getExperimentName(name) {
      return cy.get('.experiment-wrapper-module-name-vortex').contains(name)
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

    // App Header

    getSubheader(subheader) {
        return cy.get('.experiment-wrapper-module-headerTitle-vortex').contains(subheader)
    }

}
export default ExperimentSetup;