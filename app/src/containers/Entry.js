import React, { useState, useEffect } from "react";
import ReactAudioPlayer from "react-audio-player";
import { API, Storage, Logger } from "aws-amplify";
import { useParams, useHistory } from "react-router-dom";
import { FormGroup, FormControl } from "react-bootstrap";
import { useAppContext } from "../libs/contextLib";
import Container from "../components/Container";
import LoaderButton from "../components/LoaderButton";
import config from "../config";
import "./Entry.css";

const VOCODER_BUCKET_URL = config.VOCODER_BUCKET_URL;
const logger = new Logger("Algorithms", "DEBUG");

export default function Entry(props) {
  const { id } = useParams();
  const history = useHistory();
  const [algorithm, setAlgorithm] = useState(null);
  const [label, setLabel] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isAuthenticating, isAuthenticated } = useAppContext();

  useEffect(() => {
    function loadAlgorithm() {
      return API.get("algorithms", `/algorithms/${id}`);
    }

    async function onLoad() {
      try {
        const algorithm = await loadAlgorithm();
        const { label, attachment, vocoder_output } = algorithm;

        if (attachment) {
          algorithm.attachmentURL = await Storage.vault.get(attachment);
        }
        if (vocoder_output) {
          algorithm.vocoderOutputURL = VOCODER_BUCKET_URL + vocoder_output;
        }

        setLabel(label);
        setAlgorithm(algorithm);
      } catch (e) {
        logger.debug(e);
      }
      setIsLoading(false);
    }

    if (!isAuthenticating && !isAuthenticated) {
      logger.debug("user is not authenticated");
      props.history.push("/login");
    }
    // wait for authentication before loading algorithms
    if (!isAuthenticating && isAuthenticated) {
      onLoad();
    }
  }, [isAuthenticating, isAuthenticated, isLoading, props.history, id]);

  function formatFilename(str) {
    return str.replace(/^\w+-/, "");
  }

  function deleteAlgorithm() {
    return API.del("algorithms", `/algorithms/${id}`);
  }

  async function handleDelete(event) {
    event.preventDefault();

    const confirmed = window.confirm(
      "Are you sure you want to delete this entry?"
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAlgorithm();
      history.push("/entries");
    } catch (e) {
      logger.debug(e);
      setIsDeleting(false);
    }
  }

  return (
    !isAuthenticating && (
      <>
        <Container>
          <div className="Algorithms">
            {algorithm && (
              <form onSubmit={handleDelete}>
                <FormGroup controlId="label">
                  <FormControl value={label} readOnly />
                </FormGroup>
                {algorithm.attachment && (
                  <FormGroup>
                    <b>Description</b>
                    <p>{config.entries[label].description}</p>
                    <b>Source</b>
                    <p>
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={algorithm.attachmentURL}
                      >
                        {formatFilename(algorithm.attachment)}
                      </a>
                    </p>
                  </FormGroup>
                )}
                {algorithm.vocoder_output && (
                  <FormGroup>
                    <b>Vocoder Status</b>
                    <p>
                      <i>{algorithm.vocoderStatus}</i>
                    </p>
                    <ReactAudioPlayer
                      src={algorithm.vocoderOutputURL}
                      controls
                    />
                  </FormGroup>
                )}
                {/* <LoaderButton
                  block
                  type="submit"
                  //bsSize="large"
                  //bsStyle="primary"
                  isLoading={isLoading}
                  disabled={!validateForm()}
                >
                  Save
                </LoaderButton> */}
                <LoaderButton
                  block
                  //bsSize="large"
                  //bsStyle="danger"
                  onClick={handleDelete}
                  isLoading={isDeleting}
                >
                  Delete
                </LoaderButton>
              </form>
            )}
          </div>
        </Container>
      </>
    )
  );
}
