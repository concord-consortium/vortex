context("Test the overall app", () => {
  beforeEach(() => {
    cy.visit("/mobile-app/");
  });

  describe("Desktop functionalities", () => {
    it("renders with text", () => {
      cy.get("#app");
    });
  });
});
