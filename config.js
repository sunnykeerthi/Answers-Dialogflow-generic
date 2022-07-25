const { provideCore } = require("@yext/answers-core");
let config;
if (process.env.ENV_VER === "staging" || process.env.ENV_VER === "STAGING") {
  config = provideCore({
    apiKey: process.env.API_KEY,
    experienceKey: process.env.EXP_KEY,
    locale: "en",
    experienceVersion: process.env.ENV_VER,
    endpoints: {
      universalSearch:
        "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/query",
      verticalSearch:
        "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/vertical/query",
      questionSubmission:
        "https://liveapi-sandbox.yext.com/v2/accounts/me/createQuestion",
      status: "https://answersstatus.pagescdn.com",
      universalAutocomplete:
        "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/autocomplete",
      verticalAutocomplete:
        "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/vertical/autocomplete",
      filterSearch:
        "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/filtersearch",
    },
  });
} else {
  config = provideCore({
    apiKey: process.env.API_KEY,
    experienceKey: process.env.EXP_KEY,
    locale: "en",
    experienceVersion: process.env.ENV_VER,
  });
}

module.exports = config;
