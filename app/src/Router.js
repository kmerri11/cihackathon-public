import React, { useState, useEffect } from "react";
import { BrowserRouter, Switch, Route, useHistory } from "react-router-dom";
import { AppContext } from "./libs/contextLib";
import { Auth, Logger } from "aws-amplify";
import ErrorBoundary from "./components/ErrorBoundary";
import NavMenu from "./components/NavMenu";
import Layout from "./components/Layout";
import JudgeLogin from "./containers/JudgeLogin";
import Login from "./containers/Login";
import Logout from "./containers/Logout";
import Profile from "./containers/Profile";
import ChooseAdventure from "./containers/ChooseAdventure";
import Algorithm from "./containers/Algorithm";
import NewAlgorithm from "./containers/NewAlgorithm";
import Entry from "./containers/Entry";
import EntryList from "./containers/EntryList";
import NewEntry from "./containers/NewEntry";
import AudioSamples from "./containers/AudioSamples";
import Playground from "./containers/Playground";
import LeaderBoard from "./containers/LeaderBoard";
import Protected from "./containers/Protected";
import Round1 from "./containers/Round1";
import Round2 from "./containers/Round2";
import Home from "./containers/Home";
import config from "./config";

const logger = new Logger("Router", "DEBUG");

const Round1EntryList = () => { return <EntryList round={1} /> };
const Round3EntryList = () => { return <EntryList round={3} /> };

const Router = () => {
  // eslint-disable-next-line
  const history = useHistory();
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isAuthenticated, userHasAuthenticated] = useState(false);
  const [user, setUser] = useState({});
  const [role, setRole] = useState();
  const [current, setCurrent] = useState("home");

  useEffect(() => {
    onLoad();
    setRoute();
    window.addEventListener("hashchange", setRoute);
    return () => window.removeEventListener("hashchange", setRoute);
  }, [isAuthenticating]);

  function setRoute() {
    const location = window.location.href.split("/");
    const pathname = location[location.length - 1];
    setCurrent(pathname ? pathname : "home");
  }

  async function onLoad() {
    try {
      await Auth.currentSession();
      userHasAuthenticated(true);
      const data = await Auth.currentUserPoolUser();
      setUser({ username: data.username, ...data.attributes });
      if (typeof data.attributes["custom:role"] !== "undefined") {
        setRole(data.attributes["custom:role"]);
      } else {
        setRole("choose");
      }
    } catch (e) {
      if (e !== "No current user") {
        logger.debug(e);
      }
    }
    setIsAuthenticating(false);
  }

  if (config.env === "prod") {
    return (
      <>
        <Layout>
          <ErrorBoundary>
            <AppContext.Provider
              value={{
                isAuthenticated: isAuthenticated,
                isAuthenticating: isAuthenticating,
                setIsAuthenticating: setIsAuthenticating,
                userHasAuthenticated: userHasAuthenticated,
                user: user,
                setUser: setUser,
                role: role,
                setRole: setRole,
              }}
            >
              <NavMenu current={current} />
              <BrowserRouter>
                <Switch>
                  <Route exact path="/" component={Round2} />
                  <Route exact path="/login" component={Login} />
                  {/* <Route exact path="/samples" component={AudioSamples} />
                  <Route exact path="/algorithm" component={Algorithm} />
                  <Route exact path="/algorithm/upload" component={NewAlgorithm} />
                  <Route exact path="/entries" component={Round1EntryList} />
                  <Route exact path="/entries/:id" component={Entry} />
                  <Route exact path="/create/:label" component={NewEntry} />
                  <Route exact path="/round1" component={Round1} />
                  <Route exact path="/round2" component={Round2} /> */}
                  <Route exact path="/playground" component={Playground} />
                  <Route exact path="/protected" component={Protected} />
                  <Route exact path="/profile" component={Profile} />
                  <Route exact path="/register" component={JudgeLogin} />
                  <Route exact path="/logout" component={Logout} />
                  <Route
                    exact
                    path="/chooseadventure"
                    component={ChooseAdventure}
                  />
                  <Route component={Login} />
                </Switch>
              </BrowserRouter>
            </AppContext.Provider>
          </ErrorBoundary>
        </Layout>
      </>
    );
  } else {
    return (
      <>
        <Layout>
          <ErrorBoundary>
            <AppContext.Provider
              value={{
                isAuthenticated: isAuthenticated,
                isAuthenticating: isAuthenticating,
                setIsAuthenticating: setIsAuthenticating,
                userHasAuthenticated: userHasAuthenticated,
                user: user,
                setUser: setUser,
                role: role,
                setRole: setRole,
              }}
            >
              <NavMenu current={current} />
              <BrowserRouter>
                <Switch>
                  <Route exact path="/" component={Home} />
                  <Route exact path="/login" component={Login} />
                  <Route exact path="/samples" component={AudioSamples} />
                  <Route exact path="/protected" component={Protected} />
                  <Route exact path="/algorithm" component={Algorithm} />
                  <Route exact path="/algorithm/upload" component={NewAlgorithm} />
                  <Route exact path="/entries" component={Round1EntryList} />
                  <Route exact path="/round3entries" component={Round3EntryList} />
                  <Route exact path="/entries/:id" component={Entry} />
                  <Route exact path="/create/:label" component={NewEntry} />
                  <Route exact path="/round1" component={Round1} />
                  <Route exact path="/round2" component={Round2} />
                  <Route exact path="/playground" component={Playground} />
                  <Route exact path="/leaderboard" component={LeaderBoard} />
                  <Route exact path="/profile" component={Profile} />
                  <Route exact path="/register" component={JudgeLogin} />
                  <Route exact path="/logout" component={Logout} />
                  <Route
                    exact
                    path="/chooseadventure"
                    component={ChooseAdventure}
                  />
                  <Route component={Login} />
                </Switch>
              </BrowserRouter>
            </AppContext.Provider>
          </ErrorBoundary>
        </Layout>
      </>
    );
  }
};

export default Router;
