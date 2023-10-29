import React, { useEffect } from "react";
import { Auth, Logger } from "aws-amplify";
import { withAuthenticator } from "aws-amplify-react";
import { useAppContext } from "../libs/contextLib";
import Container from "../components/Container";
import AmplifyTheme from "../AmplifyTheme";

const logger = new Logger("Login", "DEBUG");

function Login(props) {
  const {
    setIsAuthenticating,
    userHasAuthenticated,
    setUser,
    setRole,
  } = useAppContext();

  useEffect(() => {
    checkUser();
  });

  async function checkUser() {
    try {
      setIsAuthenticating(true);
      const data = await Auth.currentUserPoolUser();
      const userInfo = { username: data.username, ...data.attributes };
      setUser(userInfo);
      if (typeof data.attributes["custom:role"] !== "undefined") {
        setRole(data.attributes["custom:role"]);
      } else {
        setRole("choose");
      }
      userHasAuthenticated(true);
      setIsAuthenticating(false);
      props.history.push("/");
    } catch (e) {
      logger.error(e);
    }
  }

  return (
    <>
      <Container>
        <h1>Login</h1>
      </Container>
    </>
  );
}

const signUpConfig = {
  header: "Sign up to create new algorithms",
  hideAllDefaults: true,
  signUpFields: [
    {
      label: "Team Name",
      key: "name",
      required: true,
      placeholder: "Team Name for CI Hackathon",
      type: "name",
      displayOrder: 1,
    },
    {
      label: "Email",
      key: "username",
      required: true,
      placeholder: "Email Address of Primary Account Holder",
      type: "email",
      displayOrder: 2,
    },
    {
      label: "Password",
      key: "password",
      required: true,
      placeholder: "Password",
      type: "password",
      displayOrder: 3,
    },
  ],
};

export default withAuthenticator(Login, {
  theme: AmplifyTheme,
  usernameAttributes: "email",
  signUpConfig: signUpConfig,
});
