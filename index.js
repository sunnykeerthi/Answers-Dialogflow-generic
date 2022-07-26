const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const dfff = require("dialogflow-fulfillment");
const app = express();
const config = require("./config");
const PORT = process.env.PORT || 3000;
const { convert } = require("html-to-text");
app.use(express.json());
let showdown = require("showdown"),
  converter = new showdown.Converter();
app.get("/", (req, res) => {
  res.send("Server Is Working......");
});
/**  Get config lets from config  file*/
const core = config;
/** handle default fallback*/
app.post("/webhook", (req, res) => {
  let query = req.body.queryResult.queryText;
  const agent = new WebhookClient({ request: req, response: res });
  const intentMap = new Map();
  const options = { sendAsMessage: true, rawPayload: true };
  intentMap.set("Default Fallback Intent", handleFallback);

  agent.handleRequest(intentMap);

  async function handleFallback(agent) {
    const res = await retData(await query);
    agent.add(new dfff.Payload(agent.UNSPECIFIED, res, options));
  }

  async function retData(queryString) {
    try {
      const result = await core.universalSearch({
        query: queryString,
      });
      let daFaResult = [];
      let richResult = {
        richContent: [daFaResult],
      };
      if (result.directAnswer) {
        let ansr;
        if (result.directAnswer.type === "FEATURED_SNIPPET") {
          ansr = {
            type: "info",
            subtitle: convert(
              converter.makeHtml(result.directAnswer.snippet.value),
              { wordwrap: false }
            ),
          };
        } else {
          ansr = {
            type: "info",
            title: convert(converter.makeHtml(result.directAnswer.value), {
              wordwrap: false,
            }),
          };
        }
        daFaResult.push(ansr);
      } else {
        let answerJson = result.verticalResults[0].results[0].rawData;
        if (
          result.verticalResults[0].results[0].rawData.type.toLowerCase() ==
          "youtube_video"
        ) {
          answerJson = answerJson;
        } else {
          let answerJson = result.verticalResults[0].results[0].rawData;
          richResult.richContent.push(buildResponse(answerJson));
        }
      }
      return richResult;
    } catch (err) {
      return err;
    }
  }
});
const buildResponse = (answerJson) => {
  let subRes = [];
  let answerText;
  if (["atm", "location"].includes(answerJson.type)) {
    answerText = converter.makeHtml(`${answerJson.address.line1},<br>
    ${answerJson.address.city}, ${answerJson.address.region} ${answerJson.address.postalCode}<br>
    Phone# ${answerJson.mainPhone}`);
    if (answerJson.c_image || answerJson.c_image) {
      let img = {
        type: "image",
        rawUrl: answerJson.c_image
          ? answerJson.c_image.url
          : answerJson.c_photo.URL,
        accessibilityText: "Dialogflow across platforms",
      };
      subRes.push(img);
    }
    if (answerText) {
      let ansr = {
        type: "info",
        title: "Nearest Location",
        subtitle: convert(answerText, { wordwrap: false }),
      };
      subRes.push(ansr);
    }
    let chips = {
      type: "chips",
      options: [
        {
          text: "Get Directions",
          link: `https://www.google.com/maps/search/?api=1&query=${answerJson.address.line1} 
          ${answerJson.address.city}, ${answerJson.address.region} ${answerJson.address.postalCode}&output=classic`,
        },
      ],
    };
    let options2 = {
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
      let img = {
        type: "image",
        rawUrl: answerJson.c_image
          ? answerJson.c_image.url
          : answerJson.c_photo.URL,
        accessibilityText: "Dialogflow across platforms",
      };
      subRes.push(img);
    }
    if (answerText) {
      let ansr = {
        type: "info",
        subtitle: convert(answerText, { wordwrap: false }),
      };
      subRes.push(ansr);
    }
    if (answerJson.c_primaryCTA) {
      let chips = {
        type: "chips",
        options: [
          {
            text: answerJson.c_primaryCTA.label,
            link: answerJson.c_primaryCTA.link,
          },
        ],
      };
      if (answerJson.c_secondaryCTA) {
        let options2 = {
          text: answerJson.c_secondaryCTA.label,
          link: answerJson.c_secondaryCTA.link,
        };
        chips.options.push(options2);
      }
      if (answerJson.tertiaryCTA) {
        let options3 = {
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
