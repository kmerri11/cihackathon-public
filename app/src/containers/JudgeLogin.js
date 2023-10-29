import React, { useEffect } from "react";
import { Auth, Logger, I18n } from "aws-amplify";
import { withAuthenticator } from "aws-amplify-react";
import { useAppContext } from "../libs/contextLib";
import Container from "../components/Container";
import AmplifyTheme from "../AmplifyTheme";

const logger = new Logger("Register", "DEBUG");

const authScreenLabels = {
  en: {
      'Sign Up': 'Create new account',
      'Sign Up Account': 'Create a new account'
  }
};

I18n.setLanguage('en');
I18n.putVocabularies(authScreenLabels);

function JudgeLogin(props) {
  const { setIsAuthenticating, userHasAuthenticated, setUser, setRole } = useAppContext();

  useEffect(() => {
    checkUser();
  });

  async function checkUser() {
    try {
      setIsAuthenticating(true);
      const data = await Auth.currentUserPoolUser();
      const userInfo = { username: data.username, ...data.attributes };
      setUser(userInfo);
      if (typeof data.attributes["custom:role"] !== 'undefined') {
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
    <Container>
      <h1>JudgeLogin</h1>
    </Container>
  )
}

const signUpConfig = {
  header: "Create New Judging Account",
  hideAllDefaults: true,
  signUpFields: [
    {
      label: "Name",
      key: "name",
      required: true,
      placeholder: "Name",
      type: "name",
      displayOrder: 1,
    },
    {
      label: "Email",
      key: "username",
      required: true,
      placeholder: "Email Address",
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
    }
  ],
};

let authenticatedComponent = withAuthenticator(JudgeLogin, {
  theme: AmplifyTheme,
  usernameAttributes: "email",
  signUpConfig: signUpConfig,
});
authenticatedComponent.defaultProps = { authState: 'signUp' }
export default authenticatedComponent;

// export default withAuthenticator(JudgeLogin, {
//   // theme: AmplifyTheme,
//   // usernameAttributes: "email",
//   // signUpConfig: signUpConfig,
//   initialAuthState: 'signup',
// });