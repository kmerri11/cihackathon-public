import React, { useRef, useState, useEffect } from "react";
import { API, Logger } from "aws-amplify";
import { s3Upload } from "../libs/awsLib";
import { useAppContext } from "../libs/contextLib";
import { FormGroup, FormControl, FormLabel } from "react-bootstrap";
import LoaderButton from "../components/LoaderButton";
import Container from "../components/Container";
import config from "../config";

const logger = new Logger("NewAlgorithm", "DEBUG");

export default function NewAlgorithm(props) {
  const file = useRef(null);
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
  }, [isAuthenticating, isAuthenticated, props.history]);

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
      const attachment = file.current ? await s3Upload(file.current) : null;
      await API.post("algorithms", "/algorithm", {
        body: { attachment },
      });
      logger.debug("Success");
      props.history.push("/algorithm");
    } catch (e) {
      logger.debug("Error in algorithm upload:" + e);
      setIsCreating(false);
    }
  }

  return (
    !isAuthenticating && (
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
