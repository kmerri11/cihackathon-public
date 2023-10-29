import React, { useEffect, useState } from "react";
import { Logger } from "aws-amplify";
import { useAppContext } from "../libs/contextLib";
import Container from "../components/Container";
import ReactPlayer from "react-player";
import config from "../config";

const logger = new Logger("EntryList", "DEBUG");

function Playground(props) {
  const { isAuthenticated } = useAppContext();
  const [soundsamples, setSoundsamples] = useState(null);

  useEffect(() => {
    async function onLoad() {
      setSoundsamples(config.entries);
    }
    onLoad();
  }, [isAuthenticated, soundsamples, props]);

  function renderRow(tag) {
    let sample_sounds = [];
    for (let key in config.entries) {
      logger.info(key);
      let sample = config.entries[key];
      if (sample.tag !== tag) continue;
      sample_sounds.push(
        <div>
          <p className="lead">"{sample.description}"</p>
          <div class="row">
            <div class="col-sm">
              <p>Original</p>
              <ReactPlayer
                controls
                playing={false}
                width="100%"
                height="48px"
                url={config.VOCODER_BUCKET_URL + sample.original}
              />
            </div>
            <div class="col-sm">
              <p>Advanced Bionics Standard</p>
              <ReactPlayer
                controls
                playing={false}
                width="100%"
                height="48px"
                url={config.VOCODER_BUCKET_URL + sample.gold_standard}
              />
            </div>
            <div class="col-sm">
              <p>Winning Entry</p>
              <ReactPlayer
                controls
                playing={false}
                width="100%"
                height="48px"
                url={config.VOCODER_BUCKET_URL + sample.winner}
              />
            </div>
          </div>
        </div>
      );
    }
    return (
      <>
        {sample_sounds[0]}
        <br />
        <br />
        {sample_sounds[1]}
      </>
    );
  }

  return (
    <Container>
      <>
        <div>
          <h3>Winning Sound Samples from the CI Hackathon</h3>
          <p className="lead">
            Below are sound samples from winning algorithims from the CI
            Hackathon. The Advanced Bionics and winning entry files have been
            processed using a special vocoder which uses plug-and-play
            alogorithims to translate sound input into an audio simulation of
            what a person with a cochlear implant would hear.
          </p>
          <br />
        </div>
        <ul class="nav nav-tabs" id="myTab" role="tablist">
          <li class="nav-item">
            <a
              class="nav-link active"
              id="cnc-tab"
              data-toggle="tab"
              href="#cnc"
              role="tab"
              aria-controls="cnc"
              aria-selected="true"
            >
              CNC Words
            </a>
          </li>
          <li class="nav-item">
            <a
              class="nav-link"
              id="speech-tab"
              data-toggle="tab"
              href="#speech"
              role="tab"
              aria-controls="speech"
              aria-selected="false"
            >
              Speech
            </a>
          </li>
          <li class="nav-item">
            <a
              class="nav-link"
              id="speech_in_noise-tab"
              data-toggle="tab"
              href="#speech_in_noise"
              role="tab"
              aria-controls="speech_in_noise"
              aria-selected="false"
            >
              Speech in Noise
            </a>
          </li>
          <li class="nav-item">
            <a
              class="nav-link"
              id="music-tab"
              data-toggle="tab"
              href="#music"
              role="tab"
              aria-controls="music"
              aria-selected="false"
            >
              Music
            </a>
          </li>
        </ul>
        <div class="tab-content" id="myTabContent">
          <br />
          <div
            class="tab-pane fade show active"
            id="cnc"
            role="tabpanel"
            aria-labelledby="cnc-tab"
          >
            {" "}
            <h2>CNC Words</h2>
            <p>
              CNC (consonant-nucleus-consonant open set) words are commonly
              used to judge cochlear implant performance. These are simple,
              single-syllable words with a vowel 'nucleus' that should be fairly
              easy to understand in a noiseless environment. Our audio samples
              contain male and female speakers saying consonant-vowel-consonant
              words for you to test your algorithms with.
            </p>
            {renderRow("cnc")}
          </div>
          <div
            class="tab-pane fade"
            id="speech"
            role="tabpanel"
            aria-labelledby="speech-tab"
          >
            {" "}
            <h2>Natural Speech</h2>
            <p>
              Natural speech is the stimulus that most cochlear implants target
              with their algorithms. This is for good reason, as natural speech
              is so important to us in day-to-day life. Our audio samples
              contain male and female speakers saying sentences in English.
            </p>
            {renderRow("natural_speech")}
          </div>
          <div
            class="tab-pane fade"
            id="speech_in_noise"
            role="tabpanel"
            aria-labelledby="speech_in_noise-tab"
          >
            {" "}
            <h2>Speech in Noise</h2>
            <p>
              Many CI users struggle in a noisy environment. Interpreting speech
              in noise is an important milestone for improvement. Our audio
              samples contain speech in three different types of noisy
              environments.
            </p>
            {renderRow("speech_in_noise")}
          </div>
          <div
            class="tab-pane fade"
            id="music"
            role="tabpanel"
            aria-labelledby="music-tab"
          >
            {" "}
            <h2>Music</h2>
            <p>
              Cochlear implant users usually do not enjoy music to the same
              extent as they did prior to implant. An improvement in music
              processing would greatly improve CI users’ experience. Our audio
              samples contain a wide variety of music types to experiment with.
            </p>
            {renderRow("music")}
          </div>
        </div>
      </>
    </Container>
  );
}

export default Playground;
