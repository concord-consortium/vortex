import ExperimentSetup from "../../supports/elements/ExperimentSetup"
import CollectTab from "../../supports/elements/CollectTab";


context("Testing Manual Table Cell Editing", () => {

    const url = "/mobile-app/?mockSensor"
    let experimentSetup = new ExperimentSetup();
    let collectTab = new CollectTab

    // const locationLabels = ["Corner 1", "Corner 2", "Corner 3", "Corner 4", "Center"]

    before(() => {
        cy.visit(url);
        experimentSetup.getNewExperimentOption('Schoolyard Investigation').click()
        collectTab.getTab('Collect').click()
        // for (let i = 0; i <= 5; i++) {
        //     collectTab.getDataRow(i).within(() => {
        //         collectTab.getRecordButton().dblclick()
        //         cy.wait(2000) // wait for new sensor values
        //     })
        // }
    });

    describe("Edit empty table cell values", () => {

        const value1 = '50'
        const value2 = '65'

        it("sets up edit mode table", () => {
            collectTab.getExperimentOptionsMenu().click()
            collectTab.selectMenuOption('Edit Mode')
            cy.wait(3000)
        })  

        it("adds values to empty table cells", () => {
            for (let i = 1; i < 6; i++) {
                cy.get('.data-table-field-module-table-vortex').within(() => {
                    cy.get('tr').eq(i).within(() => { // i'th individal 'corner' or 'center' row
                        cy.get('.data-table-field-module-sensorField-vortex').eq(0).click().type(value1) // temp
                        cy.get('.data-table-field-module-sensorField-vortex').eq(1).click().type(value1) // light
                        cy.get('.data-table-field-module-sensorField-vortex').eq(2).click().type(value1) // humidity
                    })
                })
            }
        })

        it("verifies averages have been calculated", () => {
            cy.get('.data-table-field-module-table-vortex').within(() => {
                cy.get('tr').eq(6).within(() => { // i'th individal 'corner' or 'center' row
                    cy.get('.data-table-field-module-sensorField-vortex').eq(0).find('input').should('not.be.empty') // temp
                    cy.get('.data-table-field-module-sensorField-vortex').eq(1).find('input').should('not.be.empty') // light
                    cy.get('.data-table-field-module-sensorField-vortex').eq(2).find('input').should('not.be.empty')  // humidity
                })
            })
        })

        it("edits manually entered values in data table row 1", () => {
            let i = 1
            cy.get('.data-table-field-module-table-vortex').within(() => {
                cy.get('tr').eq(i).within(() => { // i'th individal 'corner' or 'center' row
                    cy.get('.data-table-field-module-sensorField-vortex').eq(0).find('input').clear().type(value2) // temp
                    cy.get('.data-table-field-module-sensorField-vortex').eq(1).find('input').clear().type(value2) // light
                    cy.get('.data-table-field-module-sensorField-vortex').eq(2).find('input').clear().type(value2) // humidity
                })
            })
        })

    })

    describe("Tests School Yard Investigation", () => {

        it("", () => {

        })

    })

})