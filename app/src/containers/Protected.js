import React, { useEffect, useState } from 'react';
import { API, Logger } from "aws-amplify";
import { useAppContext } from "../libs/contextLib";
import LoaderButton from "../components/LoaderButton";
import Container from '../components/Container';

const logger = new Logger("Protected", "DEBUG");

function Protected(props) {
  const [isRunning, setRunAPI] = useState(false);
  const { isAuthenticated, isAuthenticating } = useAppContext();

  useEffect(() => {
    async function onLoad() {
      if (!isAuthenticated) {
        return;
      }
    }

    onLoad();
  }, [isAuthenticated, props]);
  
  async function handleSubmit(event) {
    event.preventDefault();
    setRunAPI(true);
    try {
      var response = await sayHello();
      logger.debug("hello API: Success");
      logger.debug(response);
    } catch (e) {
      logger.debug("Error in hello:" + e);
    }
    setRunAPI(false);
  }

  function sayHello() {
    return API.get("algorithms", "/hello");
  }

  return (
    !isAuthenticating && (
      <>
      <Container>
        <h1>Protected route for testing</h1>
        <form onSubmit={handleSubmit}>
          <LoaderButton
            block
            type="submit"
            //bsSize="large"
            //bsStyle="primary"
            isLoading={isRunning}
          >
            Test hello API
          </LoaderButton>
        </form>
      </Container>
    </>
    )
  );
}

export default Protected