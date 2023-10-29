import React, { useRef, useState, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";
import { API, Logger } from "aws-amplify";
import { s3Upload } from "../libs/awsLib";
import { useAppContext } from "../libs/contextLib";
import { FormGroup, FormControl } from "react-bootstrap";
import LoaderButton from "../components/LoaderButton";
import Container from "../components/Container";
import config from "../config";
import round1entries from "../round1entries";

const logger = new Logger("NewEntry", "DEBUG");

export default function NewEntry(props) {
  const file = useRef(null);
  const history = useHistory();
  const { label } = useParams();
  const [isCreating, setIsCreating] = useState(false);
  const { isAuthenticated, isAuthenticating } = useAppContext();

  useEffect(() => {
    function onLoad() {
      if (!isAuthenticating && !isAuthenticated) {
        logger.debug("user is not authenticated");
        props.history.push("/login");
      }
    }
    onLoad();
  }, [isAuthenticating, isAuthenticated, props, label]);

  // todo make sure label is valid
  function validateForm() {
    for (let key in round1entries) {
      if (label === key) return true;
    }
    logger.debug("Error in createAlgorithm: invalid label " + label);
    return false;
  }

  function handleFileChange(event) {
    file.current = event.target.files[0];
  }

  async function handleSubmit(event) {
    let allowedExtensions = /(\.npz|\.h5|\.mat)$/i;

    event.preventDefault();

    if (!file.current) {
      alert(`Please upload a file`);
      return;
    }

    if (!allowedExtensions.exec(file.current.name)) {
      alert(`Unsuppported file type, please upload .npz .h5 .mat`);
      return;
    }

    if (file.current && file.current.size > config.MAX_ATTACHMENT_SIZE) {
      alert(
        `Please pick a file smaller than ${
          config.MAX_ATTACHMENT_SIZE / 1000000
        } MB.`
      );
      return;
    }

    setIsCreating(true);

    try {
      const attachment = file.current ? await s3Upload(file.current) : null;
      await createAlgorithm({ label, attachment });
      logger.debug("Success:" + label);
      history.push("/entries");
    } catch (e) {
      logger.debug("Error in createAlgorithm:" + e);
      setIsCreating(false);
    }
  }

  function createAlgorithm(algorithm) {
    return API.post("algorithms", "/algorithms", {
      body: algorithm,
    });
  }

  return (
    !isAuthenticating && (
      <>
        <Container>
          <form onSubmit={handleSubmit}>
            <FormGroup controlId="label">
              <FormControl value={label} readOnly />
            </FormGroup>
            <b>Description</b>
            <p>{config.entries[label].description}</p>
            <FormGroup controlId="file">
              <b>Supported file types</b>
              <p>.npz .h5 .mat</p>
              <FormControl onChange={handleFileChange} type="file" />
            </FormGroup>
            <LoaderButton
              block
              type="submit"
              //bsSize="large"
              //bsStyle="primary"
              isLoading={isCreating}
              disabled={!validateForm()}
            >
              Upload file and submit to vocoder for processing
            </LoaderButton>
          </form>
        </Container>
      </>
    )
  );
}
