class SensorData {

    // Header

    getBackButton() {
        return cy.get('.experiment-wrapper-module-headerBackIcon-vortex')
    }

    getTab(tabName) {
        return cy.get('.section-button-module-sectionButton-vortex').contains(tabName)
    }

    getHeaderOptionsMenu() {
        return this.getHeaderContent().within(() => {
            cy.get('.menu-module-menuIcon-vortex')
        })
    }

    // Contains Experiment Abbrev Icon, Experiment Index Title,
    // Experiment Label, Header Menu Options (Save, Upload)
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
    selectSensor(input){
         // Click to focus on the select dropdown (adjust the selector as needed)
        cy.get('div.sensor-module-connectionLabel-vortex select').focus();

        if (input === 'Force') {
            // Select the "Mocked Sensor: Force" option
            cy.get('div.sensor-module-connectionLabel-vortex select').select('Mocked Sensor: Force');
            return 'Mocked Sensor: Force';
        } else if (input === 'Temperature') {
            // Select the "Mocked Sensor: Temperature" option
            cy.get('div.sensor-module-connectionLabel-vortex select').select('Mocked Sensor: Temperature');
            return 'Mocked Sensor: Temperature';
        } else {
            throw new Error('Invalid input: please specify either "Force" or "Temperature"');
        }
    }

    getDataRow(index) {
        return cy.get('.data-table-field-module-refreshSensorReading-vortex').eq(index - 1).parent().parent()
    }

    getCompletedDataRow(index) {
        // this is only the complete data row with data recorded from sensor/mock sensor
        return cy.get('.data-table-field-module-complete-vortex')
    }

    getAverageDataRow() {
        return cy.get('.data-table-field-module-readOnly-vortex').contains('Average').parent().parent()
    }

    getExperimentOptionsMenu() {
        return cy.get('.data-table-field-module-dataTable-vortex').within(() => {
            cy.get('.menu-module-menuIcon-vortex')
          .should('exist')
          .and('be.visible')
          .click({ force: true }) // click is here to get the helper function to work
        })
    }

    selectMenuOption(option) {
        // Connect, Disconnect or Show Plots
        return cy.get('.menu-module-menu-vortex').contains(option).click()
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