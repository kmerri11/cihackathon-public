import React, { useEffect, useState } from "react";
import { Auth, Logger } from "aws-amplify";
import { useAppContext } from "../libs/contextLib";
import LoaderButton from "../components/LoaderButton";
import Container from "../components/Container";

const logger = new Logger("ChooseAdventure", "DEBUG");

export default function ChooseAdventure(props) {
  const [isLoading, setLoading] = useState(false);
  const [value, setValue] = useState(false);
  const {
    isAuthenticated,
    isAuthenticating,
    user,
    role,
    setRole,
  } = useAppContext();

  useEffect(() => {
    async function onLoad() {
      if (!isAuthenticating && !isAuthenticated) {
        logger.debug("User is not authenticated");
        props.history.push("/login");
      }
      if (!isLoading && (role === "hacker" || role === "judge")) {
        props.history.push("/");
      }
    }
    onLoad();
  }, [isAuthenticating, isAuthenticated, isLoading, role, props]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      setRole(value);
      await Auth.currentSession();
      const data = await Auth.currentUserPoolUser();
      await Auth.updateUserAttributes(data, {
        "custom:role": value,
      });
      console.log("Selected role: " + value);
      setRole(value);
    } catch (e) {
       logger.debug("Error changing role:" + e);
    }
    setLoading(false);
  }

  return (
    !isAuthenticating &&
    !isLoading && (
      <Container>
        <>
          <form onSubmit={handleSubmit}>
            <div className="jumbotron">
              <h3 className="display-4">Hello, {user.name}</h3>

              <p className="lead">
                Welcome to the CI Hackathon App. Please select a role.
              </p>
              <div className="row">
                <div className="col">
                  <div className="card mb-3">
                    <div className="card-header">Participate as a Hacker</div>
                    <div className="card-body">
                      <h4 className="card-title">Create new algorithms</h4>
                      <p className="card-text">
                        This role gives you access to download sample audio
                        files and upload new algorithms. You will also judge
                        entries. If you change your mind and want to become a
                        judge, change your role via your{" "}
                        <a href="/profile">Profile</a> prior to Round 1 judging.
                      </p>
                      <LoaderButton
                        block
                        type="submit"
                        //bsSize="large"
                        //bsStyle="primary"
                        isLoading={isLoading}
                        onClick={(changeEvent) => {
                          setValue("hacker");
                        }}
                      >
                        I want to be a hacker
                      </LoaderButton>
                    </div>
                  </div>
                </div>
                <div className="col">
                  <div className="card mb-3">
                    <div className="card-header">Participate as a Judge</div>
                    <div className="card-body">
                      <h4 className="card-title">
                        Listen to and evaluate sounds
                      </h4>
                      <p className="card-text">
                        Participate in the hackathon as a judge. You'll be able
                        to help by listening to and judging algorithms. If you
                        change your mind and prefer to participate in the
                        hackathon, change your role via your{" "}
                        <a href="/profile">Profile</a> prior to Round 1 judging.
                      </p>
                      <LoaderButton
                        block
                        type="submit"
                        //bsSize="large"
                        //bsStyle="primary"
                        isLoading={isLoading}
                        onClick={(changeEvent) => {
                          setValue("judge");
                        }}
                      >
                        I want to be a judge
                      </LoaderButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </>
      </Container>
    )
  );
}
