//import React, { useEffect } from "react";
import React from "react";
import { useAppContext } from "../libs/contextLib";
// import { Logger } from "aws-amplify";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { ReactComponent as Logo } from "../assets/vectors/logo.svg";
import config from "../config";

// const logger = new Logger("NavMenu", "DEBUG");

function RestrictedMenu() {
  if (config.env === "dev") {
    return (
      <>
        <Nav.Link href="/samples">Audio Samples</Nav.Link>
        <Nav.Link href="/algorithm">Upload Algorithm</Nav.Link>
        <Nav.Link href="/entries">Upload Entries</Nav.Link>
        <Nav.Link href="/round1">Round 1 Judging</Nav.Link>
        <Nav.Link href="/round2">Round 2 Judging</Nav.Link>
        <Nav.Link href="/playground">Playground</Nav.Link>
        <Nav.Link href="/leaderboard">Leaderboard</Nav.Link>
      </>
    );
  }
  if (config.env === "prod") {
    return (
      <>
        <Nav.Link href="/playground">Playground</Nav.Link>
        {/*<Nav.Link href="/round2">Round 2 Judging</Nav.Link>
        <Nav.Link href="/samples">Audio Samples</Nav.Link>
        <Nav.Link href="/algorithm">Upload Algorithm</Nav.Link>
        <Nav.Link href="/entries">Upload Entries</Nav.Link> */}
      </>
    );
  }
}

function NavMenu(props) {
  const { isAuthenticated, isAuthenticating } = useAppContext();

  return (
    !isAuthenticating && (
      <>
        <Navbar bg="light" expand="lg">
          <Navbar.Brand href="https://cihackathon.com">
            <Logo /> Cochlear Implant Hackathon
          </Navbar.Brand>
          {isAuthenticated ? (
            <>
              <Nav className="mr-auto">
                <Nav.Link href="/">App Home</Nav.Link>
                <RestrictedMenu />
              </Nav>
              <Nav>
                <Nav.Link href="/profile">Profile</Nav.Link>
                <Nav.Link href="/logout">Logout</Nav.Link>
              </Nav>
            </>
          ) : (
            <>
              <Nav>
                <Nav.Link href="/playground">Playground</Nav.Link>
                <Nav.Link href="/login">Login</Nav.Link>
              </Nav>
            </>
          )}
        </Navbar>
      </>
    )
  );
}

export default NavMenu;
