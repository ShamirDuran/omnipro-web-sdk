document.addEventListener("DOMContentLoaded", function () {
  // Se agrega dentro del loaded para que espera a la carga de los elementos

  window.alloy("sendEvent", {
    renderDecisions: true,
    type: "web.webinteraction.pageViews",
    decisionScopes: ["__view__"],
    xdm: {},
    data: {
      __adobe: {
        target: {
          "user.categoryId": "electronics",
        },
      },
    },
  });
});
