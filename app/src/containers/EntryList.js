import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { API, Logger } from "aws-amplify";
import { useAppContext } from "../libs/contextLib";
import Container from "../components/Container";
import EntryCard from "../components/EntryCard";
import config from "../config";
import "./EntryList.css";

const VOCODER_BUCKET_URL = config.VOCODER_BUCKET_URL;
const logger = new Logger("EntryList", "DEBUG");

export default function EntryList({ round, ...props }) {
  const history = useHistory();
  // eslint-disable-next-line
  const [entries, setEntries] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticating, isAuthenticated, user } = useAppContext();

  useEffect(() => {
    function loadEntries() {
      return API.get("algorithms", "/algorithms");
    }

    async function onLoad() {
      try {
        const results = await loadEntries();
        // Merge entries with valid results
        for (let i = 0; i < results.length; i++) {
          let key = results[i].label;
          if (key in config.entries) {
            let merged = { ...config.entries[key], ...results[i] };
            config.entries[key] = merged;
          }
        }
        setEntries(config.entries);
      } catch (e) {
        logger.debug(e);
      }
      setIsLoading(false);
    }

    if (!isAuthenticating && !isAuthenticated) {
      logger.debug("User is not authenticated");
      props.history.push("/login");
    }
    // wait for authentication before loading entries
    if (!isAuthenticating && isAuthenticated && isLoading) {
      if (user["custom:role"] === "hacker") {
        onLoad(); // Load and render once
      } else {
        history.push("/chooseadventure");
      }
    }
  }, [
    isAuthenticating,
    isAuthenticated,
    isLoading,
    user,
    entries,
    history,
    props,
  ]);

  function renderRow(tag) {
    let cards = [];
    for (let key in config.entries) {
      let algorithm = config.entries[key];
      let vocoderOutputURL = "";
      if (algorithm.tag !== tag) continue;
      if (algorithm.algorithmId) {
        if (algorithm.vocoder_output) {
          //logger.debug(algorithm)
          vocoderOutputURL = VOCODER_BUCKET_URL + algorithm.vocoder_output;
        }
        cards.push(
          <div key={algorithm.label} className="col">
            <EntryCard
              id={algorithm.algorithmId}
              label={algorithm.label}
              description={algorithm.description}
              createdAt={algorithm.createdAt}
              vocoderOutputURL={vocoderOutputURL}
              vocoderStatus={algorithm.vocoderStatus}
            />
          </div>
        );
      } else {
        // New entry
        cards.push(
          <div key={algorithm.label} className="col">
            <EntryCard
              label={algorithm.label}
              description={algorithm.description}
            />
          </div>
        );
      }
    }
    return (
      <>
        <h4>{tag.toUpperCase().replace("_"," ")}</h4>
        <div className="row">{cards[0]}{cards[1]}{cards[2]}</div>
        <div className="row">{cards[3]}{cards[4]}{cards[5]}</div>
        <br/>
      </>
    );
  }

  return (
    <>
      <Container>
        <h2>Entries</h2>
        {!isLoading && renderRow("natural_speech")}
        {!isLoading && renderRow("cnc")}
        {!isLoading && renderRow("speech_in_noise")}
        {!isLoading && renderRow("music")}
      </Container>
    </>
  );
}
