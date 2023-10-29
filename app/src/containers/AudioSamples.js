import React, { useEffect, useState } from "react";
import { Storage } from "aws-amplify";
import { useAppContext } from "../libs/contextLib";
import Container from "../components/Container";

function AudioSamples(props) {
  const { isAuthenticated } = useAppContext();
  const [soundsamples, setSoundsamples] = useState(null);
  const [officialsamples, setOfficalsamples] = useState(null);

  useEffect(() => {
    async function onLoad() {
      if (!isAuthenticated) {
        return;
      }
      const soundsamples = await Storage.get(
        "CI-Hackathon-Samples-master.zip",
        { level: "public", expires: 60 }
      );
      setSoundsamples(soundsamples);
      const officialsamples = await Storage.get(
        "CI-Hackathon-Official-Audio-Samples-master.zip",
        { level: "public", expires: 60 }
      );
      setOfficalsamples(officialsamples);
    }

    onLoad();
  }, [isAuthenticated, soundsamples, setSoundsamples, officialsamples, setOfficalsamples, props]);

  return (
    <Container>
      <>
        <div>
          <h3>Download Training Audio Samples</h3>
          <p>
            Performance will be judged on three stimuli from each of the
            following categories. Leading up to submission, you will be able to
            test your algorithms using the provided audio samples that are
            similar to those used for judging. The exact audio samples that will
            be judged will be released near the day of submission. This judging
            set is a held-out set that you will not have been given before.
          </p>
          <p className="lead">
            <a
              className="btn btn-primary btn-lg"
              href={soundsamples}
              role="button"
            >
              Download
            </a>
            &nbsp; File size: 356 MB
          </p>
        </div>
        <br />
        <div>
          <h3>Download Official hackathon Audio Samples</h3>
          <p>
            This zip archive contains audio samples that will be used for
            judging.
          </p>
          <p className="lead">
            <a
              className="btn btn-primary btn-lg"
              href={officialsamples}
              role="button"
            >
              Download
            </a>
            &nbsp; File size: 8.6 MB
          </p>
        </div>
      </>
    </Container>
  );
}

export default AudioSamples;
