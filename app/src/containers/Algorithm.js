import React, { useRef, useState, useEffect } from "react";
import { API, Storage, Logger } from "aws-amplify";
import { s3ProtectedUpload } from "../libs/awsLib";
import { FormGroup, FormControl, FormLabel } from "react-bootstrap";
import { useAppContext } from "../libs/contextLib";
import Container from "../components/Container";
import LoaderButton from "../components/LoaderButton";
import config from "../config";
import "./Entry.css";

const logger = new Logger("Algorithm", "DEBUG");

export default function Algorithm(props) {
  const file = useRef(null);
  const [algorithm, setAlgorithm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isAuthenticating, isAuthenticated } = useAppContext();

  useEffect(() => {
    async function onLoad() {
      try {
        const algorithm = await loadAlgorithm();
        if (algorithm !== null) {
          const { attachment } = algorithm;
          algorithm.attachmentURL = await Storage.vault.get(attachment);
        }
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
  }, [isAuthenticating, isAuthenticated, isLoading, props.history]);

  function loadAlgorithm() {
    return API.get("algorithms", `/algorithm`);
  }

  function formatFilename(str) {
    return str.replace(/^\w+-/, "");
  }

  function handleFileChange(event) {
    file.current = event.target.files[0];
  }

  async function handleSubmit(event) {
    let allowedExtensions = /(\.zip|\.tar.gz)$/i;

    event.preventDefault();

    if (!file.current) {
      alert(`Please upload a file`);
      return;
    }

    if (!allowedExtensions.exec(file.current.name)) {
      alert(`Unsuppported file type, please upload .zip .tar.gz`);
      return;
    }

    if (file.current && file.current.size > config.MAX_ATTACHMENT_SIZE) {
      alert(
        `Please pick a file smaller than ${
          config.MAX_ATTACHMENT_SIZE / 1500000
        } MB.`
      );
      return;
    }

    setIsCreating(true);
    try {
      const attachment = file.current ? await s3ProtectedUpload(file.current) : null;
      await API.post("algorithms", "/algorithm", {
        body: { attachment },
      });
      logger.debug("Successfully uploaded algorithm");
      const algorithm = await loadAlgorithm();
      if (algorithm !== null) {
        const { attachment } = algorithm;
        algorithm.attachmentURL = await Storage.vault.get(attachment);
      }
      setAlgorithm(algorithm);
    } catch (e) {
      logger.debug("Error in algorithm upload:" + e);
    }
    setIsCreating(false);
  }

  async function handleDelete(event) {
    event.preventDefault();

    const confirmed = window.confirm(
      "Are you sure you want to delete this algorithm?"
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      await API.del("algorithms", `/algorithm`);
      logger.debug("Algorithm deleted");
      setAlgorithm(null);
    } catch (e) {
      logger.debug("Error in algorithm deletion:" + e);
    }
    setIsDeleting(false);
  }

  if (algorithm) {
    return (
      !isAuthenticating && !isLoading && (
        <>
          <Container>
            <div className="Algorithms">
              {algorithm && (
                <form onSubmit={handleDelete}>
                  <h3>CI Hackathon Algorithm</h3>
                  <hr />
                  {algorithm.attachment && (
                    <FormGroup>
                      <b>Source</b>
                      <br />
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={algorithm.attachmentURL}
                      >
                        {formatFilename(algorithm.attachment)}
                      </a>
                    </FormGroup>
                  )}
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
  else {
    return (
      !isAuthenticating && !isLoading && (
        <>
          <Container>
            <form onSubmit={handleSubmit}>
              <h3>CI Hackathon Algorithm</h3>
              <hr />
              <FormGroup controlId="file">
                <FormLabel>Supported file types .zip .tar.gz</FormLabel>
                <FormControl onChange={handleFileChange} type="file" />
              </FormGroup>
              <LoaderButton
                block
                type="submit"
                //bsSize="large"
                //bsStyle="primary"
                isLoading={isCreating}
              >
                Submit algorithm
              </LoaderButton>
            </form>
          </Container>
        </>
      )
    );
  }
}
