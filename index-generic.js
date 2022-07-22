const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const dfff = require("dialogflow-fulfillment");
const app = express();
var axios = require("axios");
const { provideCore } = require("@yext/answers-core");
const PORT = process.env.PORT || 3000;
const { convert } = require("html-to-text");
app.use(express.json());
var showdown = require("showdown"),
  converter = new showdown.Converter();
app.get("/", (req, res) => {
  res.send("Server Is Working......");
});
const core = provideCore({
  apiKey: process.env.API_KEY,
  experienceKey: process.env.EXP_KEY,
  locale: "en",
  experienceVersion: "PRODUCTION",
  /* Enable the below endpoints for Sandbox*/
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
/**
 * on this route dialogflow send the webhook request
 * For the dialogflow we need POST Route.
 * */
app.post("/webhook", (req, res) => {
  var query = req.body.queryResult.queryText;
  // get agent from request
  const agent = new WebhookClient({ request: req, response: res });
  // create intentMap for handle intent
  const intentMap = new Map();
  const options = { sendAsMessage: true, rawPayload: true };
  // add intent map 2nd parameter pass function
  intentMap.set("Default Fallback Intent", handleFallback);

  agent.handleRequest(intentMap);

  async function handleFallback(agent) {
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
    console.log(answerText);

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
  //   console.log(JSON.stringify(subres));
  return subRes;
};
/**
  now listing the server on port number 3000 :)
 * */
app.listen(PORT, () => {
  console.log("Server is Running on port 3000");
});
