import React, { useEffect, useState } from "react";
import { Auth, Logger } from "aws-amplify";
import { useAppContext } from "../libs/contextLib";
import LoaderButton from "../components/LoaderButton";
import Container from "../components/Container";

const logger = new Logger("Profile", "DEBUG");

export default function Profile(props) {
  const [isLoading, setLoading] = useState(false);
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
    }
    onLoad();
  }, [isAuthenticating, isAuthenticated, isLoading, role, props]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await Auth.currentSession();
      const data = await Auth.currentUserPoolUser();
      Auth.updateUserAttributes(data, {
        "custom:role": role,
      });
      logger.debug("changeRole: Success");
      props.history.push("/profile");
    } catch (e) {
      logger.debug("Error in changeRole:" + e);
    }
    setLoading(false);
  }

  return (
    !isAuthenticating &&
    !isLoading && (
      <>
        <Container>
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label className="col-form-label" htmlFor="inputDefault">
                    Name
                  </label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder={user.name}
                    id="inputDefault"
                  />
                </div>
                <div className="form-group">
                  <label className="col-form-label" htmlFor="inputDefault">
                    Email
                  </label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder={user.email}
                    id="inputDefault"
                  />
                </div>
                <div className="form-group">
                  <label className="col-form-label" htmlFor="inputDefault">
                    Current Role
                  </label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder={role || user["custom:role"]}
                    id="inputDefault"
                  />
                </div>
                <LoaderButton
                  block
                  type="submit"
                  //bsSize="large"
                  //bsStyle="primary"
                  isLoading={isLoading}
                  onClick={(changeEvent) => {
                    if (role === "judge") setRole("hacker");
                    if (role === "hacker") setRole("judge");
                  }}
                >
                  Change role to {role === "judge" && "Hacker"}
                  {role === "hacker" && "Judge"}
                </LoaderButton>
                {/* <LoaderButton
                  block
                  type="submit"
                  //bsSize="large"
                  //bsStyle="primary"
                  isLoading={isLoading}
                  onClick={(changeEvent) => {
                    setRole("");
                  }}
                >
                  Clear Role
                </LoaderButton> */}
              </div>

              <div className="col">
                <div className="card border-secondary mb-3">
                  <div className="card-body">
                    <h4 className="card-title">
                      Hacker - Create new algorithms
                    </h4>
                    <p className="card-text">
                      The hacker role gives you access to download sample audio
                      files and upload new algorithms. You will also judge
                      entries. If you change your mind and want to become a
                      judge, change your role via your{" "}
                      <a href="/profile">Profile</a> prior to Round 1 judging.
                    </p>
                  </div>
                </div>
                <div className="card border-secondary mb-3">
                  <div className="card-body">
                    <h4 className="card-title">
                      Judge - Listen and evaluate sounds
                    </h4>
                    <p className="card-text">
                      Participate in the hackathon as a judge. You'll be able to
                      help by listening to and judging algorithms. If you change
                      your mind and prefer to participate in the hackathon,
                      change your role via your <a href="/profile">Profile</a>{" "}
                      prior to Round 1 judging.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </Container>
      </>
    )
  );
}
