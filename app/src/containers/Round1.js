import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useAppContext } from "../libs/contextLib";
import { API, Logger } from "aws-amplify";
import Container from "../components/Container";
import ReactLoading from "react-loading";
import LoaderButton from "../components/LoaderButton";
import ReactPlayer from "react-player";
import ProgressBar from "react-customizable-progressbar";
import "../components/Round1Button.css";
import config from "../config";

const logger = new Logger("Round1Entry", "DEBUG");

function Round1(props) {
  const history = useHistory();
  const [entry, setEntry] = useState();
  const [total_entries, setTotal] = useState(0);
  const [total_completed, setTotalCompleted] = useState(0);
  const [current_position, setPosition] = useState(0);
  const [thankyou, setThankyou] = useState(false);
  const [value, setValue] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticating, isAuthenticated } = useAppContext();

  useEffect(() => {
    async function onLoad() {
      try {
        var result = await loadEntry();
        //console.log(result);
        if (result.total_sets) setTotalCompleted(result.total_sets);
        if (result.current_position) setPosition(result.current_position);
        if (result.total_entries) setTotal(result.total_entries);
        // Setup entry
        if (result.next_entry && result.current_position < result.total_entries)
          setEntry(result.next_entry);
      } catch (e) {
        logger.debug(e);
      }
      setIsLoading(false);
    }

    if (!isAuthenticating && !isAuthenticated) {
      logger.debug("User is not authenticated");
      props.history.push("/login");
    }
    // wait for authentication before loading algorithms
    if (!isAuthenticating && isAuthenticated && isLoading) {
      onLoad();
    }
  }, [isAuthenticating, isAuthenticated, isLoading, thankyou, props.history]);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await submitScore(value);
      var result = await loadEntry();
      setPosition(result.current_position);
      setTotal(result.total_entries);
      if (result.current_position === result.total_entries) {
        setTotalCompleted(total_completed + 1);
        setThankyou(true);
      }
      setValue(5); // reset score
      if (result.next_entry && result.current_position < result.total_entries)
        setEntry(result.next_entry);
      history.push("/round1");
    } catch (e) {
      logger.debug("Error in addScore: " + e);
    }
    setIsSubmitting(false);
  }

  async function handleAssignment(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setThankyou(false);
    try {
      var result = await assignSet(value);
      result = await loadEntry();
      setPosition(result.current_position);
      setTotal(result.total_entries);
      setValue(5); // reset score
      if (result.next_entry && result.current_position < result.total_entries)
        setEntry(result.next_entry);
      history.push("/round1");
    } catch (e) {
      logger.debug("Error in set assignment: " + e);
    }
    setIsSubmitting(false);
  }

  function loadEntry() {
    logger.debug("API: load round1 entry");
    return API.get("algorithms", `/round1`);
  }

  function assignSet() {
    logger.debug("API: fetch another round2 set");
    return API.get("algorithms", `/round1/assign`);
  }

  function submitScore(score) {
    let body = {
      score: score,
      algorithmId: entry.algorithmId,
      assignmentId: entry.assignmentId,
    };
    logger.debug(`API: round1/score score=${score}`);
    return API.post("algorithms", "/round1/score", { body });
  }

  function renderThankYou() {
    return thankyou ? <h3>Set completed. Thank you!</h3> : <></>;
  }

  function renderButtonGroups() {
    let buttons = [];
    for (var i = 1; i <= 10; i++) {
      buttons.push(
        <div
          key={i}
          className="btn-group mr-2"
          role="group"
          aria-label="Rate sound"
        >
          <button
            type="submit"
            className="btn btn-primary btn-round1"
            value={i}
            disabled={isSubmitting}
            onClick={(changeEvent) => setValue(changeEvent.target.value)}
          >
            {i}
          </button>
        </div>
      );
    }
    return buttons;
  }

  return (
    <Container>
      {isLoading ? (
        <>
          <ReactLoading type={"spin"} color={"#5d9cec"} />
        </>
      ) : (
        <>
          {current_position === total_entries && !isSubmitting && (
            <>
              {/* <div className="alert alert-dismissible alert-primary">
                <button type="button" className="close" data-dismiss="alert">
                  &times;
                </button>
                <h4 className="alert-heading">Heads up!</h4>
                <p className="mb-0">
                  This is a simulation of Round 1 judging for testing. Scores
                  will not persist.
                </p>
              </div> */}
              <h3>Round 1 Judging</h3>
              <div className="row justify-content-md-center">
                <div className="col-md-auto">
                  {renderThankYou()}
                  <p className="lead">
                    Number of rounds completed: {total_completed}
                  </p>
                  <form onSubmit={handleAssignment}>
                    <LoaderButton
                      block
                      type="submit"
                      bssize="large"
                      bsstyle="primary"
                      isLoading={isSubmitting}
                    >
                      Begin judging
                    </LoaderButton>
                  </form>
                </div>
              </div>
            </>
          )}

          {current_position !== total_entries && entry && (
            <>
              <div className="row">
                <div className="col-md-auto">
                  <ProgressBar
                    radius={50}
                    progress={(current_position / total_entries) * 100}
                    strokeWidth={18}
                    strokeColor="#5d9cec"
                    strokeLinecap="round"
                    trackStrokeWidth={18}
                  >
                    <div className="indicator">
                      <div>
                        {current_position}/{total_entries}
                      </div>
                    </div>
                  </ProgressBar>
                </div>
                <div className="col">
                  <>
                    <h3>
                      Round 1 Judging -{" "}
                      {entry.label
                        .slice(0, -2)
                        .replace(/_/g, " ")
                        .toUpperCase()}
                    </h3>
                    <p className="lead">
                      Listen and rate the quality and clarity of the sounds on a scale from 1 (very poor) to 10 (excellent).<br/>Try to use the full rating scale.
                    </p>
                  </>
                </div>
              </div>
              <hr />
            </>
          )}

          {current_position < total_entries && entry && (
            <div className="row">
              <div className="col">
                {/* <p>Description: {entry.label}</p> */}
                <ReactPlayer
                  controls
                  playing={true}
                  width="90%"
                  height="48px"
                  url={config.VOCODER_BUCKET_URL + entry.vocoder_output}
                />
              </div>
              <div className="col">
                <form onSubmit={handleSubmit}>
                  {/* <p className="card-text">Rate Sound Quality</p> */}
                  <div className="btn-toolbar" role="toolbar">
                    {renderButtonGroups()}
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </Container>
  );
}

export default Round1;
