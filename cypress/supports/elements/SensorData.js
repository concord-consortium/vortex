class SensorData {

    getBackButton() {
        return cy.get('.experiment-wrapper-module-headerBackIcon-vortex')
    }

    getTab(tabName) {
        return cy.get('.section-button-module-sectionButton-vortex').contains(tabName)
    }

    getHeaderContent() {
        return cy.get('.experiment-wrapper-module-header-vortex')
    }

    getSensorConnectionStatus() {
        return cy.get('.sensor-module-connectionLabel-vortex')
    }

    getDisconnectSensorStateIcon() {
        return cy.get('.sensor-module-disconnectedIcon-vortex')
    }

    getSensorData(sensorType) {
        // Supports Temperature, Relative Humidity, Light
        return cy.get('.sensor-value-module-label-vortex').contains(sensorType).parent()
    }

    getDisconnectedSensorValue(sensorType) {
        return cy.get('.sensor-value-module-label-vortex').contains(sensorType).parent().within(() => {
            cy.get('.sensor-value-module-disconnectedValue-vortex')
        })
    }

    getConnectedSensorValue(sensorType) {
        return cy.get('.sensor-value-module-label-vortex').contains(sensorType).parent().within(() => {
            cy.get('.sensor-value-module-connectedValue-vortex')
        })
    }

    getDataRow(index) {
        return cy.get('.data-table-field-module-refreshSensorReading-vortex').eq(index - 1).parent().parent()
    }

    getCompletedDataRow(index) {
        // this is only the complete data row with data recorded from sensor/mock sensor
        return cy.get('.data-table-field-module-complete-vortex')
    }

    getAverageDataRow() {
        return cy.get('.data-table-field-module-readOnly-vortex').contains('Average').parent()
    }

    getOptionsMenu() {
        return cy.get('.menu-module-menuIcon-vortex')
    }

    selectMenuOption(option) {
        // Disconnect or Show Plots
        return this.getOptionsMenu().contains(option).click()
    }

    getRecordButton() {
        return cy.get('[data-test="record-sensor"]')
    }

    assertRecordButtonStatus(status) {
        if (status == 'enabled') {
            return this.getRecordButton().should('have.class', 'data-table-field-module-active-vortex')
        } else if (status == 'disabled') {
            return this.getRecordButton().should('not.have.class', 'data-table-field-module-active-vortex')
        }
    }

} export default SensorData;