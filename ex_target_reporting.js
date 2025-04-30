element.addEventListener("click", function () {
  window
    .alloy("sendEvent", {
      xdm: {},
      decisionScopes: ["experience-clicked"],
    })
    .then(function (result) {
      var propositions = result.propositions;
      if (propositions) {
        for (var i = 0; i < propositions.length; i++) {
          var proposition = propositions[i];

          if (proposition.scope === "experience-clicked") {
            window.alloy("sendEvent", {
              xdm: {
                eventType: "decisioning.propositionDisplay",
                web: {
                  webPageDetails: {
                    viewName: new Date.now().toString(),
                  },
                },
                _experience: {
                  decisioning: {
                    propositions: [
                      {
                        id: proposition.id,
                        scope: proposition.scope,
                        scopeDetails: proposition.scopeDetails,
                      },
                    ],
                  },
                },
              },
            });
          }
        }
      }
    });
});
