import React, { useEffect } from "react";
import { Logger } from "aws-amplify";
import { useAppContext } from "../libs/contextLib";
import Container from "../components/Container";

const logger = new Logger("Home", "DEBUG");

export default function Home(props) {
  const { isAuthenticated, isAuthenticating, role } = useAppContext();

  useEffect(() => {
    async function onLoad() {
      if (!isAuthenticating && !isAuthenticated) {
        logger.debug("User is not authenticated");
        props.history.push("/login");
      } else {
        if (role === "choose") {
          logger.debug(role);
          props.history.push("/chooseadventure");
        }
      }
    }
    onLoad();
  }, [isAuthenticating, isAuthenticated, role, props]);

  return (
    !isAuthenticating && (
      <>
        <Container>
          <div className="jumbotron">
            <h2 className="display-4">Welcome to the CI Hackathon App</h2>
            <p className="lead">Step 1 - Download and Process Audio Samples</p>
            <p>
              <a href="/samples">Download the official audio samples</a>.
              Process all audio samples with your new algorithm.
            </p>
            <p className="lead">Step 2 - Upload Algorithm</p>
            <p>
              <a href="/algorithm">Submit your algorithm</a>. Supported
              filetypes include .zip and .tar.gz.
            </p>
            <p className="lead">Step 3 - Upload Entries</p>
            <p>
              Visit <a href="/entries">Entries</a> to upload the corresponding
              matrix for each audio file. Supported filetypes include .npz, .h5
              and .mat.
            </p>
          </div>
        </Container>
      </>
    )
  );
}
