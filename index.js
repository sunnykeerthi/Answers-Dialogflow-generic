const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const dfff = require("dialogflow-fulfillment");
const app = express();
const { provideCore } = require("@yext/answers-core");
const PORT = process.env.PORT || 3000;
const { convert } = require("html-to-text");
app.use(express.json());
var showdown = require("showdown"),
  converter = new showdown.Converter();
app.get("/", (req, res) => {
  res.send("Server Is Working......");
});

const buildConfig = () => {
  let config = {
    apiKey: process.env.API_KEY,
    experienceKey: process.env.EXP_KEY,
    locale: "en",
    experienceVersion: process.env.EXP_VER,
  };
  if (process.env.EXP_VER === "sandbox") {
    config.endPoints = {
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
    };
  }
  return config;
};

const core = provideCore(
  // apiKey: process.env.API_KEY,
  // experienceKey: process.env.EXP_KEY,
  // locale: "en",
  // experienceVersion: "PRODUCTION" /* change to Stanging for Sandbox*/,
  // /* Enable the below endpoints for Sandbox*/
  // /*
  // endpoints: {
  //   universalSearch:
  //     "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/query",
  //   verticalSearch:
  //     "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/vertical/query",
  //   questionSubmission:
  //     "https://liveapi-sandbox.yext.com/v2/accounts/me/createQuestion",
  //   status: "https://answersstatus.pagescdn.com",
  //   universalAutocomplete:
  //     "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/autocomplete",
  //   verticalAutocomplete:
  //     "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/vertical/autocomplete",
  //   filterSearch:
  //     "https://liveapi-sandbox.yext.com/v2/accounts/me/answers/filtersearch",
  // },
  // */
  buildConfig
);
/**
 * on this route dialogflow send the webhook request
 * For the dialogflow we need POST Route.
 * */
app.post("/webhook", (req, res) => {
  var query = req.body.queryResult.queryText;
  const agent = new WebhookClient({ request: req, response: res });
  const intentMap = new Map();
  const options = { sendAsMessage: true, rawPayload: true };
  intentMap.set("Default Fallback Intent", handleFallback);

  agent.handleRequest(intentMap);

  async function handleFallback(agent) {
    // if (
    //   query === "I was fired due to a violation" ||
    //   query === "I quit my job voluntarily"
    // ) {
    //   agent.add(
    //     new dfff.Payload(
    //       agent.UNSPECIFIED,
    //       {
    //         richContent: [
    //           [
    //             {
    //               type: "info",
    //               subtitle:
    //                 "Based on the information provided, you are likely not eligible to file for unemployment assistance. More information on eligibility criteria and other NYS programs can be found below.",
    //             },
    //           ],
    //         ],
    //       },
    //       options
    //     )
    //   );
    // } else if (query === "Neither of the above") {
    //   agent.add(
    //     new dfff.Payload(
    //       agent.UNSPECIFIED,
    //       {
    //         richContent: [
    //           [
    //             {
    //               type: "info",
    //               subtitle:
    //                 "You have the right to file a claim for benefits. We encourage you to file a claim even if you are uncertain. File a claim even if a former employer told you that you would not be eligible or that you were not covered. The department will make an independent assessment of your eligibility.",
    //             },
    //           ],
    //         ],
    //       },
    //       options
    //     )
    //   );
    // } else if (query === "How much unemployment benefits do I qualify for?") {
    //   const res = await retData(await query);
    //   agent.add(
    //     new dfff.Payload(
    //       agent.UNSPECIFIED,
    //       {
    //         richContent: [
    //           [
    //             {
    //               type: "info",
    //               subtitle: "You are?",
    //             },
    //             {
    //               options: [
    //                 {
    //                   text: "Over 18 years old",
    //                 },
    //                 {
    //                   text: "Under 18 years old",
    //                 },
    //               ],
    //               type: "chips",
    //             },
    //           ],
    //         ],
    //       },
    //       options
    //     )
    //   );
    // } else if (query.includes("18 years")) {
    //   const res = await retData(
    //     await `How much unemployment benefits do I qualify for ${query}`
    //   );
    //   agent.add(new dfff.Payload(agent.UNSPECIFIED, res, options));
    // } else if (query !== "Who can file for unemployment assistance?") {
    //   const res = await retData(await query);
    //   agent.add(new dfff.Payload(agent.UNSPECIFIED, res, options));
    // }
    const res = await retData(await query);
    console.log(JSON.stringify(res));
    agent.add(new dfff.Payload(agent.UNSPECIFIED, res, options));
  }

  async function retData(queryString) {
    try {
      const result = await core.universalSearch({
        query: queryString,
      });
      var richResult = {
        richContent: [[]],
      };
      var answerJson = result.verticalResults[0].results[0].rawData;
      if (
        result.verticalResults[0].results[0].rawData.type.toLowerCase() ==
        "youtube_video"
      ) {
        answerJson = answerJson;
      } else {
        var answerJson = result.verticalResults[0].results[0].rawData;
        richResult.richContent.push(buildResponse(answerJson));
      }
      return richResult;
    } catch (err) {
      return err;
    }
  }
});
const buildResponse = (answerJson) => {
  var subRes = [];
  let answerText;
  if (["atm", "location"].includes(answerJson.type)) {
    answerText = converter.makeHtml(`${answerJson.address.line1},<br>
    ${answerJson.address.city}, ${answerJson.address.region} ${answerJson.address.postalCode}<br>
    Phone# ${answerJson.mainPhone}`);
    if (answerJson.c_image || answerJson.c_image) {
      var img = {
        type: "image",
        rawUrl: answerJson.c_image
          ? answerJson.c_image.url
          : answerJson.c_photo.URL,
        accessibilityText: "Dialogflow across platforms",
      };
      subRes.push(img);
    }
    if (answerText) {
      var ansr = {
        type: "info",
        title: "Nearest Location",
        subtitle: convert(answerText, { wordwrap: false }),
      };
      subRes.push(ansr);
    }
    var chips = {
      type: "chips",
      options: [
        {
          text: "Get Directions",
          link: `https://www.google.com/maps/search/?api=1&query=${answerJson.address.line1} 
          ${answerJson.address.city}, ${answerJson.address.region} ${answerJson.address.postalCode}&output=classic`,
        },
      ],
    };
    var options2 = {
      text: "Call",
      link: `tel:${answerJson.mainPhone}`,
    };
    chips.options.push(options2);

    subRes.push(chips);
  } else {
    answerText =
      answerJson.description ||
      answerJson.answer ||
      answerJson.body ||
      answerJson.richTextDescription;

    answerText = converter.makeHtml(answerText);
    answerText = answerText.replace(/<a[^>]*>|<\/a>/g, "");

    if (answerJson.c_image || answerJson.c_image) {
      var img = {
        type: "image",
        rawUrl: answerJson.c_image
          ? answerJson.c_image.url
          : answerJson.c_photo.URL,
        accessibilityText: "Dialogflow across platforms",
      };
      subRes.push(img);
    }
    if (answerText) {
      var ansr = {
        type: "info",
        subtitle: convert(answerText, { wordwrap: false }),
      };
      subRes.push(ansr);
    }
    if (answerJson.c_primaryCTA) {
      var chips = {
        type: "chips",
        options: [
          {
            text: answerJson.c_primaryCTA.label,
            link: answerJson.c_primaryCTA.link,
          },
        ],
      };
      if (answerJson.c_secondaryCTA) {
        var options2 = {
          text: answerJson.c_secondaryCTA.label,
          link: answerJson.c_secondaryCTA.link,
        };
        chips.options.push(options2);
      }
      if (answerJson.tertiaryCTA) {
        var options3 = {
          text: answerJson.tertiaryCTA.label,
          link: answerJson.tertiaryCTA.link,
        };
        chips.options.push(options3);
      }
      subRes.push(chips);
    }
  }
  return subRes;
};
/**
  now listing the server on port number 3000 :)
 * */
app.listen(PORT, () => {
  console.log("Server is Running on port 3000");
});
