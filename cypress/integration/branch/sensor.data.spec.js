import ExperimentSetup from "../../supports/elements/ExperimentSetup"
import SensorData from "../../supports/elements/SensorData";

context("Testing Experiment Selection View", () => {

    //const branch = "master"

    const url = "/mobile-app/?mockSensor"
    const sensorLabels = {
        testSensorLabel: "Connected: CC1350 SensorTag",
        mockSensorLabel: "Connected: Mocked Sensor"
    }

    let experimentSetup = new ExperimentSetup();
    let sensorData = new SensorData();

    let testLabel1A = "WATERS Label Testing"
    let testGroupMembers = "Ed, Edd, and Eddy"

    before(() => {
        cy.visit(url);
        cy.viewport(414, 896)
        experimentSetup.openNewExperiment('Schoolyard Investigation')
        experimentSetup.getLabelTextBox().type(testLabel1A)
        experimentSetup.getGroupMembersTextBox().type(testGroupMembers)
    });

    beforeEach(() => {
        cy.viewport(414, 896)
    })

    describe('Collect Tab Defaults', () => {

        it("verifies Collect tab is now highlighted", () => {
            sensorData.getTab('Collect').should('be.visible').click()
        })
        it("verifies experiment label is in header", () => {
            sensorData.getHeaderContent().should('contain', testLabel1A)
        })
        it("verifies no sensor is connected", () => {
            sensorData.getRecordButton().should('exist').and('be.visible')
            sensorData.getSensorConnectionStatus().contains('No Sensor Connected')
            sensorData.getDisconnectSensorStateIcon().should('exist')
            sensorData.getRecordButton().should('exist').and('be.visible')
        })
        it('verify no data being read', () => {
            sensorData.getDisconnectedSensorValue('Temperature').should('contain', '--')
            // Not able to get a second sensor value, 1 is enough for now

            // sensorData.getDisconnectedSensorValue('Relative Humidity').should('contain','--')
            // sensorData.getDisconnectedSensorValue('Light').should('contain','--')
        })
        it("verifies no data in data table", () => {
            const rows = 4;
            for (let i = 0; i < rows; i++) {
                sensorData.getDataRow(i).within(() => {
                    cy.get('input').should('be.empty', { multiple: true })
                })
            }

            sensorData.getAverageDataRow().within(() => {
                cy.get('input').should('be.empty')
            })
        })
        it("verifies data collect button disabled when not connected to sensor", () => {
            sensorData.assertRecordButtonStatus('disabled')
        })

    })

    describe("Sensor Connection", () => {

        it("connects to (mock) sensor", () => {
            sensorData.getOptionsMenu().should('be.visible').click()
            sensorData.selectMenuOption('Connect')
            cy.wait(2000)
        })
        it("returning to experiments list should disconnect from sensor", () => {
            sensorData.getBackButton().click()
            experimentSetup.getExperiment('Schoolyard Investigation', 1).click()
            sensorData.getTab('Collect').click()
            sensorData.getSensorConnectionStatus().should('contain', 'No Sensor Connected')
            sensorData.getOptionsMenu().click()
            sensorData.selectMenuOption('Connect')
            cy.wait(2000)
        })
        it("verifies enabled sensor connection UI", () => {
            sensorData.assertRecordButtonStatus('enabled')
            sensorData.getSensorConnectionStatus().contains(sensorLabels.mockSensorLabel)
            sensorData.getConnectedSensorValue('Temperature').should('not.contain', '--')
            // Not able to get a second sensor value, Temp is enough for now
            //
            // sensorData.ConnectedSensorValue('Relative Humidity').should('not.contain','--')
            // sensorData.getConnectedSensorValue('Light').should('not.contain','--')
        })
        it("disconnects from mock sensor and verify UI", () => {
            sensorData.getOptionsMenu().click()
            sensorData.selectMenuOption('Disconnect')

            sensorData.getSensorConnectionStatus().contains('No Sensor Connected')
            sensorData.getDisconnectSensorStateIcon().should('exist')
            sensorData.getDisconnectedSensorValue('Temperature').should('contain', '--')
        })
        it("collects data from (mock) sensor", () => {
            sensorData.getOptionsMenu().click()
            sensorData.selectMenuOption('Disconnect')
            
            for (let i = 1; i <= 4; i++) {
                sensorData.getDataRow(i).within(() => {
                    sensorData.getRecordButton().dblclick()
                    cy.wait(2000) // wait for new sensor values
                })
            }
        })

    })

})
